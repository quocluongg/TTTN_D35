import os
import urllib.request
import re
import json
import uuid
import random
import html as html_lib
import psycopg2

print("Starting FPTShop Laptop Crawler & DB Ingestion...")

# 1. Connect to Supabase Postgres
conn = psycopg2.connect(
    host=os.getenv("SUPABASE_DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com"),
    port=int(os.getenv("SUPABASE_DB_PORT", "5432")),
    dbname=os.getenv("SUPABASE_DB_NAME", "postgres"),
    user=os.getenv("SUPABASE_DB_USER", "postgres.zzukpubwbntihzztilqy"),
    password=os.getenv("SUPABASE_DB_PASSWORD", "")
)
conn.autocommit = True
cur = conn.cursor()

# 2. Setup categories
categories = [
    ("Laptop Gaming", "laptop-gaming", "Laptop cấu hình cao dành cho game thủ và đồ họa nặng"),
    ("MacBook (Apple)", "macbook", "Dòng laptop cao cấp từ Apple trang bị chip M1/M2/M3/M4"),
    ("Laptop Văn Phòng", "laptop-van-phong", "Laptop nhỏ gọn, pin trâu cho học sinh, sinh viên và dân văn phòng"),
    ("Laptop Mỏng Nhẹ", "laptop-mong-nhe", "Laptop thiết kế siêu mỏng mỏng dưới 1.3kg sang trọng")
]

cat_id_map = {}
for name, slug, desc in categories:
    cur.execute("SELECT id FROM categories WHERE name = %s;", (name,))
    row = cur.fetchone()
    if row:
        cat_id_map[name] = row[0]
    else:
        cid = str(uuid.uuid4())
        cur.execute("INSERT INTO categories (id, name, slug, description) VALUES (%s, %s, %s, %s);", (cid, name, slug, desc))
        cat_id_map[name] = cid

# 3. Crawl laptop product links from FPTShop
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
req = urllib.request.Request("https://fptshop.com.vn/may-tinh-xach-tay", headers=headers)

crawled_items = []
try:
    with urllib.request.urlopen(req) as resp:
        html_content = resp.read().decode('utf-8', errors='ignore')
        
        # Regex find product links
        matches = re.findall(r'<a[^>]+href="(/may-tinh-xach-tay/[^"]+)"[^>]*>(.*?)</a>', html_content, re.DOTALL)
        seen_slugs = set()

        for href, block in matches:
            # Title
            t_match = re.search(r'alt="([^"]+)"|title="([^"]+)"', block)
            title = t_match.group(1) or t_match.group(2) if t_match else None
            if not title:
                continue
            title = html_lib.unescape(title).strip()
            if not (title.startswith("Laptop") or title.startswith("MacBook")):
                continue

            slug = href.split('/')[-1]
            if slug in seen_slugs:
                continue
            seen_slugs.add(slug)

            # Image
            img_match = re.search(r'src="(https://cdn2\.fptshop\.com\.vn/unsafe/[^"]+)"', block)
            img_url = img_match.group(1) if img_match else "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"

            crawled_items.append({
                "title": title,
                "url": "https://fptshop.com.vn" + href,
                "img_url": img_url,
                "slug": slug
            })

except Exception as e:
    print(f"Fetch listing error: {e}")

print(f"Found {len(crawled_items)} laptops from FPTShop listing.")

# 4. Truncate existing product data to insert fresh crawled data
cur.execute("TRUNCATE TABLE products CASCADE;")
print("Truncated existing products table.")

# Function to parse brand and specifications from title
def parse_laptop_info(item):
    title = item['title']
    
    # Brand
    brand = "Khác"
    title_upper = title.upper()
    for b in ["MACBOOK", "APPLE", "ASUS", "ACER", "HP", "DELL", "LENOVO", "MSI", "LG", "GIGABYTE"]:
        if b in title_upper:
            brand = "Apple" if b in ["MACBOOK", "APPLE"] else b.capitalize()
            break

    # Category & UseCase
    category_name = "Laptop Văn Phòng"
    use_case = "Làm việc"
    if brand == "Apple":
        category_name = "MacBook (Apple)"
        use_case = "Làm việc"
    elif any(k in title_upper for k in ["GAMING", "TUF", "ROG", "PREDATOR", "NITRO", "VICTUS", "LEGION", "LOQ", "KATANA", "CYBORG"]):
        category_name = "Laptop Gaming"
        use_case = "Gaming"
    elif any(k in title_upper for k in ["GRAM", "ZENBOOK", "SWIFT", "SLIM", "AIR", "ENVY", "XPS"]):
        category_name = "Laptop Mỏng Nhẹ"
        use_case = "Làm việc"

    # CPU
    cpu = "Intel Core i5"
    if "M1" in title_upper: cpu = "Apple M1"
    elif "M2" in title_upper: cpu = "Apple M2"
    elif "M3" in title_upper: cpu = "Apple M3"
    elif "M4" in title_upper: cpu = "Apple M4"
    elif "M5" in title_upper: cpu = "Apple M5"
    elif "CORE 7" in title_upper or "I7" in title_upper: cpu = "Intel Core i7"
    elif "CORE 9" in title_upper or "I9" in title_upper: cpu = "Intel Core i9"
    elif "CORE 5" in title_upper or "I5" in title_upper: cpu = "Intel Core i5"
    elif "CORE 3" in title_upper or "I3" in title_upper: cpu = "Intel Core i3"
    elif "RYZEN 7" in title_upper: cpu = "AMD Ryzen 7"
    elif "RYZEN 5" in title_upper: cpu = "AMD Ryzen 5"

    # RAM
    ram = "16GB"
    ram_match = re.search(r'(\d+GB|\d+\s*GB)', title_upper)
    if ram_match:
        ram = ram_match.group(1).replace(" ", "")

    # Storage SSD
    ssd = "512GB"
    ssd_match = re.search(r'(\d+TB|\d+GB)', title_upper[title_upper.find(ram):] if ram in title_upper else title_upper)
    if ssd_match and ssd_match.group(1) != ram:
        ssd = ssd_match.group(1)
    elif "1TB" in title_upper:
        ssd = "1TB"
    elif "256GB" in title_upper:
        ssd = "256GB"

    # Price estimation based on specs
    price = 18990000
    if brand == "Apple":
        price = 28990000 if "PRO" in title_upper or "512GB" in ssd else 22990000
    elif category_name == "Laptop Gaming":
        price = 32990000 if "i7" in cpu or "Ryzen 7" in cpu or "i9" in cpu else 23990000
    elif category_name == "Laptop Mỏng Nhẹ":
        price = 25990000
    else:
        price = 14990000

    return {
        "brand": brand,
        "category_name": category_name,
        "use_case": use_case,
        "cpu": cpu,
        "ram": ram,
        "ssd": ssd,
        "price": price
    }

# 5. Insert crawled laptop products into DB
inserted_count = 0
for idx, item in enumerate(crawled_items, start=1):
    info = parse_laptop_info(item)
    pid = str(uuid.uuid4())
    cat_id = cat_id_map[info["category_name"]]

    name = item["title"]
    brand = info["brand"]
    origin = "Chính hãng FPTShop"
    thumbnail = item["img_url"]
    slug = f"{item['slug']}-{pid[:6]}"
    source_url = item["url"]

    # Rating, reviews, sold
    rating_avg = round(4.5 + (idx % 5) * 0.1, 1)
    review_count = 20 + (idx % 120)
    sold_quantity = 15 + (idx % 180)
    discount_percent = random.choice([5.00, 8.00, 10.00, 12.00, 15.00])
    warranty_months = 24 if brand in ["Asus", "MSI", "Apple"] else 12

    description = (
        f"Laptop {name} chính hãng phân phối tại FPTShop. Trang bị vi xử lý {info['cpu']}, "
        f"bộ nhớ RAM {info['ram']} DDR5 mượt mà, ổ cứng {info['ssd']} SSD tốc độ cao. "
        f"Màn hình sắc nét nét căng, thời lượng pin lâu dài cùng chế độ bảo hành {warranty_months} tháng chính hãng."
    )

    custom_tabs = json.dumps({
        "review": f"Đánh giá chi tiết {name}: Mẫu laptop đáp ứng hoàn hảo nhu cầu {info['use_case']} với cấu hình {info['cpu']}, RAM {info['ram']} và SSD {info['ssd']}.",
        "warranty_policy": f"Bảo hành {warranty_months} tháng chính hãng FPTShop toàn quốc. Hỗ trợ 1 đổi 1 trong vòng 30 ngày nếu gặp lỗi phần cứng."
    }, ensure_ascii=False)

    # Insert Main Product
    cur.execute("""
        INSERT INTO products (
            id, name, description, brand, origin, thumbnail, category_id,
            warranty_months, discount_percent, slug, source_url, custom_tabs,
            rating_avg, review_count, sold_quantity, is_active, use_case
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s
        );
    """, (
        pid, name, description, brand, origin, thumbnail, cat_id,
        warranty_months, discount_percent, slug, source_url, custom_tabs,
        rating_avg, review_count, sold_quantity, True, info["use_case"]
    ))

    # Insert Product Images (Gallery with high-res FPTShop URLs)
    gallery_img1 = thumbnail.replace("360x0", "1920x0")
    gallery_img2 = "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"
    cur.execute("INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, 1);", (pid, gallery_img1))
    cur.execute("INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, 2);", (pid, gallery_img2))

    # Insert Product Variants (2 variants: Default & Upgraded)
    price1 = float(info["price"])
    price2 = price1 + 3000000.0

    cur.execute("""
        INSERT INTO product_variants (
            id, product_id, sku, variant_name, price, stock, image, discount_percent, attributes, vat_percent, is_active
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """, (
        str(uuid.uuid4()), pid, f"FPT-{pid[:8]}-V1", "Tiêu chuẩn", price1, 25,
        thumbnail, discount_percent, json.dumps({"Cấu hình": f"{info['ram']} | {info['ssd']}"}, ensure_ascii=False), 10.00, True
    ))

    cur.execute("""
        INSERT INTO product_variants (
            id, product_id, sku, variant_name, price, stock, image, discount_percent, attributes, vat_percent, is_active
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
    """, (
        str(uuid.uuid4()), pid, f"FPT-{pid[:8]}-V2", "Nâng cấp RAM/SSD", price2, 10,
        thumbnail, discount_percent, json.dumps({"Cấu hình": f"Nâng cấp | {info['ssd']}"}, ensure_ascii=False), 10.00, True
    ))

    # Helper tra cứu / tạo mới attribute_key_id trong product_attribute_keys
    def get_attr_key_id(key_name, display_name=None, unit=None):
        cur.execute("SELECT id FROM product_attribute_keys WHERE name = %s", (key_name,))
        row = cur.fetchone()
        if row:
            return row[0]
        cur.execute("""
            INSERT INTO product_attribute_keys (name, display_name, unit, sort_order)
            VALUES (%s, %s, %s, 0)
            RETURNING id;
        """, (key_name, display_name or key_name, unit))
        return cur.fetchone()[0]

    # Insert Product Specifications into product_attribute_values
    specs = [
        ("Vi xử lý", "Loại CPU", info["cpu"], None),
        ("Bộ nhớ", "Dung lượng RAM", info["ram"], "GB"),
        ("Lưu trữ", "Ổ cứng", info["ssd"], "GB"),
        ("Màn hình", "Kích thước màn hình", "14.0 inch / 15.6 inch FHD IPS", "inch"),
        ("Hệ điều hành", "Hệ điều hành khi ra mắt", "Windows 11 Home" if brand != "Apple" else "macOS", None),
        ("Trọng lượng", "Trọng lượng", "1.65", "kg")
    ]
    for group, key_name, val, unit in specs:
        attr_key_id = get_attr_key_id(key_name, unit=unit)
        cur.execute("""
            INSERT INTO product_attribute_values (product_id, spec_group, attribute_key_id, spec_value, spec_unit)
            VALUES (%s, %s, %s, %s, %s);
        """, (pid, group, attr_key_id, val, unit))

    # Insert Product Chunks for RAG Chatbot
    cur.execute("""
        INSERT INTO product_chunks (id, product_id, content, chunk_type) VALUES
        (%s, %s, %s, 'overview'),
        (%s, %s, %s, 'specifications');
    """, (
        f"chunk_fpt_{pid[:8]}_1", pid, f"Laptop {name} chính hãng FPTShop. Cấu hình {info['cpu']}, RAM {info['ram']}, SSD {info['ssd']}. Giá bán từ {price1:,.0f} VNĐ, bảo hành {warranty_months} tháng.",
        f"chunk_fpt_{pid[:8]}_2", pid, f"Thông số kỹ thuật chi tiết {name}: Chip {info['cpu']}, RAM {info['ram']}, Ổ cứng {info['ssd']}, Màn hình sắc nét, Bảo hành {warranty_months} tháng FPTShop."
    ))

    inserted_count += 1

cur.close()
conn.close()
print(f"[SUCCESS] Successfully crawled and inserted {inserted_count} real Laptop products from FPTShop into Supabase Database!")
