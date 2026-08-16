import http.server
import socketserver
import json
import re
import uuid
import urllib.request
import urllib.parse
import urllib.error
import hashlib
import html as html_lib
import psycopg2
import sys
import os
from pathlib import Path

# Cần: pip install beautifulsoup4 lxml --break-system-packages
try:
    from bs4 import BeautifulSoup
    HAVE_BS4 = True
except ImportError:
    BeautifulSoup = None
    HAVE_BS4 = False
    print("[WARN] Chưa cài beautifulsoup4 -> chạy: pip install beautifulsoup4 lxml --break-system-packages")
    print("[WARN] Thiếu bs4, crawler sẽ chỉ dùng regex HTML fallback (kém chính xác hơn nhiều).")

PORT = 5000
BASE_DIR = Path(__file__).parent.parent
STORAGE_DIR = BASE_DIR / 'frontend' / 'public' / 'images' / 'products'

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://zzukpubwbntihzztilqy.supabase.co")

# Supabase Service Role Key — lấy từ Supabase Dashboard > Project Settings > API > service_role
_SUPABASE_KEY_HARDCODED = ""
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "<YOUR_KEY>")
SUPABASE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "product-images")

if not SUPABASE_KEY:
    print("[WARN] SUPABASE_SERVICE_ROLE_KEY chưa được set → Nút 'Supabase' sẽ fallback về Local Storage!")
    print("[WARN] Set biến môi trường SUPABASE_SERVICE_ROLE_KEY thay vì hardcode vào code.")
else:
    print(f"[OK] SUPABASE_KEY đã được nạp ({len(SUPABASE_KEY)} ký tự), upload Supabase Storage sẵn sàng.")


def get_db_conn():
    conn = psycopg2.connect(
        host=os.getenv("SUPABASE_DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com"),
        port=int(os.getenv("SUPABASE_DB_PORT", "5432")),
        dbname=os.getenv("SUPABASE_DB_NAME", "postgres"),
        user=os.getenv("SUPABASE_DB_USER", "postgres.zzukpubwbntihzztilqy"),
        password=os.getenv("SUPABASE_DB_PASSWORD", "agW24oOesftDhJkA"),
    )
    conn.autocommit = True
    return conn


# =========================================================================
# CRAWLER ENGINE — nhiều tầng trích xuất, tầng sau chỉ bù vào chỗ tầng
# trước không tìm thấy, không ghi đè dữ liệu đã tìm được ở tầng tin cậy hơn.
#
#   1) JSON-LD (schema.org Product / BreadcrumbList)  -> đáng tin cậy nhất,
#      hầu hết site TMĐT nhúng để phục vụ SEO / Google Shopping.
#   2) __NEXT_DATA__ (site build bằng Next.js hay nhúng state dạng JSON)
#      -> quét đệ quy tìm node "giống sản phẩm" (có cả field tên & giá).
#   3) Bảng/khối "Thông số kỹ thuật" trong HTML (qua BeautifulSoup).
#   4) Regex HTML thô + đoán theo từ khoá trong tiêu đề (fallback cuối
#      cùng, giữ lại logic gốc để không bao giờ trả về rỗng).
# =========================================================================

def _safe(fn, *args, default=None, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        print(f"[WARN] extractor '{fn.__name__}' failed: {e}")
        return default


def _make_soup(html_content):
    if not HAVE_BS4:
        return None
    try:
        return BeautifulSoup(html_content, "lxml")
    except Exception:
        return BeautifulSoup(html_content, "html.parser")


# ---- JSON-LD ------------------------------------------------------------

def _iter_jsonld_blocks(soup):
    for tag in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = tag.string or tag.get_text()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if isinstance(data, list):
            for item in data:
                yield item
        elif isinstance(data, dict):
            if isinstance(data.get("@graph"), list):
                for item in data["@graph"]:
                    yield item
            else:
                yield data


def extract_jsonld_product(soup):
    for item in _iter_jsonld_blocks(soup):
        if not isinstance(item, dict):
            continue
        t = item.get("@type")
        types = t if isinstance(t, list) else [t]
        if any(str(x).lower() == "product" for x in types if x):
            return item
    return None


def extract_jsonld_breadcrumb(soup):
    for item in _iter_jsonld_blocks(soup):
        if not isinstance(item, dict):
            continue
        t = item.get("@type")
        types = t if isinstance(t, list) else [t]
        if any(str(x).lower() == "breadcrumblist" for x in types if x):
            elements = item.get("itemListElement", [])
            elements = sorted(elements, key=lambda x: x.get("position", 0))
            names = []
            for el_ in elements:
                name = el_.get("name") or (el_.get("item") or {}).get("name")
                if name:
                    names.append(name)
            return names or None
    return None


def _parse_offers_price(product_ld):
    offers = product_ld.get("offers")
    if isinstance(offers, list):
        offers = offers[0] if offers else None
    if isinstance(offers, dict):
        price = offers.get("price") or offers.get("lowPrice")
        try:
            return float(str(price).replace(",", ""))
        except (TypeError, ValueError):
            return None
    return None


def _parse_jsonld_images(product_ld):
    img = product_ld.get("image")
    if isinstance(img, str):
        return [img]
    if isinstance(img, list):
        out = []
        for i in img:
            if isinstance(i, str):
                out.append(i)
            elif isinstance(i, dict) and i.get("url"):
                out.append(i["url"])
        return out
    if isinstance(img, dict) and img.get("url"):
        return [img["url"]]
    return []


# ---- __NEXT_DATA__ / embedded state JSON --------------------------------

def extract_nextdata_json(soup):
    tag = soup.find("script", id="__NEXT_DATA__")
    if not tag or not (tag.string or tag.get_text()):
        return None
    return json.loads(tag.string or tag.get_text())


def _walk_json(node, depth=0, max_depth=14):
    if depth > max_depth:
        return
    if isinstance(node, dict):
        yield node
        for v in node.values():
            yield from _walk_json(v, depth + 1, max_depth)
    elif isinstance(node, list):
        for v in node[:60]:  # giới hạn để tránh quét quá sâu/lâu trên mảng khổng lồ
            yield from _walk_json(v, depth + 1, max_depth)


def find_product_like_node(next_data):
    """Quét đệ quy tìm dict vừa có field kiểu tên sản phẩm, vừa có field giá."""
    if not next_data:
        return None
    price_keys = {"price", "saleprice", "sellingprice", "listedprice", "finalprice"}
    name_keys = {"name", "title", "productname"}
    for node in _walk_json(next_data):
        keys_lower = {str(k).lower() for k in node.keys()}
        if keys_lower & price_keys and keys_lower & name_keys:
            return node
    return None


def find_spec_list_candidates(next_data):
    """Tìm các list dạng [{label/key/name: ..., value: ...}, ...] — hay dùng cho bảng specs."""
    candidates = []
    for node in _walk_json(next_data):
        for v in node.values():
            if isinstance(v, list) and len(v) >= 2 and isinstance(v[0], dict):
                keys_lower = {str(k).lower() for k in v[0].keys()}
                if (keys_lower & {"name", "label", "key", "attributename"}) and \
                   (keys_lower & {"value", "attributevalue"}):
                    candidates.append(v)
    return candidates


def specs_from_nextdata(next_data):
    specs = []
    for lst in find_spec_list_candidates(next_data) or []:
        for row in lst:
            key = row.get("name") or row.get("label") or row.get("key") or row.get("attributeName")
            value = row.get("value") or row.get("attributeValue")
            if key and value:
                specs.append({"spec_group": "Thông số kỹ thuật", "spec_key": str(key), "spec_value": str(value)})
    return specs


# ---- HTML fallback (bảng specs, ảnh, giá, rating) ------------------------

def extract_specs_table(soup):
    specs = []
    for table in soup.find_all("table"):
        heading = table.find_previous(["h2", "h3", "h4"])
        group_label = heading.get_text(strip=True) if heading else "Thông số kỹ thuật"
        for row in table.find_all("tr"):
            cells = row.find_all(["th", "td"])
            if len(cells) >= 2:
                key = cells[0].get_text(strip=True)
                value = cells[1].get_text(strip=True)
                if key and value:
                    specs.append({"spec_group": group_label, "spec_key": key, "spec_value": value})
    return specs


IMAGE_URL_PATTERNS = [
    r'src="(https://cdn2\.fptshop\.com\.vn/unsafe/[^"]+)"',
    r'data-src="(https://cdn2\.fptshop\.com\.vn/unsafe/[^"]+)"',
    r'srcset="(https://cdn2\.fptshop\.com\.vn/unsafe/[^"\s]+)',
    r'src="(https://cdn2\.cellphones\.com\.vn/[^"]+)"',
    r'data-src="(https://cdn2\.cellphones\.com\.vn/[^"]+)"',
    r'"(https://cdn2\.cellphones\.com\.vn/insecure/[^"]+)"',
]

BAD_IMAGE_KEYWORDS = [
    "placeholder", "placehoder", "icon", "logo", "chibi", "voucher",
    "badge", "flashsale", "flash_sale", "ant-", "ant_", "sorry", "hello",
    "avatar", "banner", "button", "btn", ".gif", "wysiwyg"
]


def is_valid_product_image(url):
    if not url or not isinstance(url, str):
        return False
    u_lower = url.lower().strip()
    if any(bad in u_lower for bad in BAD_IMAGE_KEYWORDS):
        return False
    if "cellphones.com.vn" in u_lower and "media/catalog/product" not in u_lower:
        return False
    return True


def extract_gallery_images_regex(html_content):
    found = []
    for pattern in IMAGE_URL_PATTERNS:
        found += re.findall(pattern, html_content)
    uniq = list(dict.fromkeys(found))
    return [u for u in uniq if is_valid_product_image(u)]


def extract_price_info_html(html_content):
    prices = re.findall(r'(\d{1,3}(?:\.\d{3})+)\s*₫', html_content)
    prices_int = [int(p.replace('.', '')) for p in prices]
    if not prices_int:
        return None, None
    sale_price = prices_int[0]
    list_price = max(prices_int) if len(prices_int) > 1 else sale_price
    return sale_price, list_price


def extract_full_description_html(soup):
    """Lấy bài mô tả dài (khối nội dung chi tiết sản phẩm), không phải meta description ngắn."""
    if not soup:
        return None
    candidates = soup.find_all(["div", "section", "article"], class_=re.compile(r'(desc|content|detail|article)', re.I))
    best, best_len = None, 0
    for c in candidates:
        text = c.get_text(" ", strip=True)
        if len(text) > best_len and len(text) > 200:
            best, best_len = c, len(text)
    if not best:
        return None
    paragraphs = [p.get_text(strip=True) for p in best.find_all(["p", "li"])]
    paragraphs = [p for p in paragraphs if p and len(p) > 15]
    text = "\n\n".join(paragraphs) if paragraphs else best.get_text("\n", strip=True)
    return text[:6000].strip() if text else None


def extract_rating_html(html_content):
    m = re.search(r'([0-5][.,]\d)\s*(?:/\s*5)?\D{0,15}?(\d+)\s*(?:đánh giá|reviews?)', html_content, re.IGNORECASE)
    if not m:
        return None, None
    try:
        return float(m.group(1).replace(',', '.')), int(m.group(2))
    except ValueError:
        return None, None


# ---- Orchestrator ---------------------------------------------------------

def crawl_url_data(url):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as resp:
        content = resp.read().decode('utf-8', errors='ignore')

    soup = _make_soup(content)

    product_ld = _safe(extract_jsonld_product, soup) if soup else None
    breadcrumb = _safe(extract_jsonld_breadcrumb, soup) if soup else None
    next_data = _safe(extract_nextdata_json, soup) if soup else None
    next_product_node = _safe(find_product_like_node, next_data) if next_data else None

    if product_ld:
        print("[CRAWL] ✓ Tìm thấy JSON-LD Product — dùng làm nguồn chính.")
    elif next_product_node:
        print("[CRAWL] ✓ Tìm thấy node sản phẩm trong __NEXT_DATA__.")
    else:
        print("[CRAWL] ⚠ Không thấy JSON-LD/__NEXT_DATA__ — dùng regex HTML + đoán theo tiêu đề.")

    # ---- Title ----
    title = None
    if product_ld and product_ld.get("name"):
        title = product_ld["name"]
    elif next_product_node:
        title = next_product_node.get("name") or next_product_node.get("title")
    if not title:
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL) or re.search(r'<title>(.*?)</title>', content, re.DOTALL)
        title = html_lib.unescape(re.sub(r'<[^>]+>', '', title_match.group(1)).strip()) if title_match else "Sản phẩm công nghệ mới"
    title = re.split(r'\s+[-|–]\s+', title)[0].strip()
    title_upper = title.upper()

    # ---- Description (ưu tiên bài mô tả dài trên trang > mô tả ngắn JSON-LD > meta) ----
    full_description = _safe(extract_full_description_html, soup, default=None) if soup else None
    description = full_description
    if not description and product_ld and product_ld.get("description"):
        description = html_lib.unescape(str(product_ld["description"])).strip()
    if not description and soup:
        meta_desc = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        if meta_desc and meta_desc.get("content"):
            description = meta_desc["content"].strip()

    # ---- Price ----
    sale_price = _safe(_parse_offers_price, product_ld) if product_ld else None
    list_price = None
    if next_product_node:
        for k in ("salePrice", "sellingPrice", "finalPrice", "price"):
            if sale_price is None and next_product_node.get(k):
                try:
                    sale_price = float(next_product_node[k])
                except (TypeError, ValueError):
                    pass
        for k in ("listedPrice", "listPrice", "originalPrice"):
            if next_product_node.get(k):
                try:
                    list_price = float(next_product_node[k])
                except (TypeError, ValueError):
                    pass
    if sale_price is None:
        html_sale, html_list = _safe(extract_price_info_html, content, default=(None, None))
        sale_price = html_sale
        list_price = list_price or html_list
    sale_price = sale_price or 18990000
    list_price = list_price or sale_price
    discount_percent = round((1 - sale_price / list_price) * 100, 1) if list_price > sale_price else 0.0

    # ---- Images ----
    images = []
    if product_ld:
        images += _safe(_parse_jsonld_images, product_ld, default=[])
    images += _safe(extract_gallery_images_regex, content, default=[])
    if next_product_node:
        raw_imgs = next_product_node.get("images") or next_product_node.get("gallery")
        if isinstance(raw_imgs, list):
            images += [i for i in raw_imgs if isinstance(i, str)]

    images = [i for i in dict.fromkeys(images) if is_valid_product_image(i)]
    unique_imgs = images[:8]
    thumbnail = unique_imgs[0] if unique_imgs else "https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/Laptop_d170e53d32.png"

    # ---- Category (breadcrumb thật > @type category > đoán từ tiêu đề) ----
    category_name = None
    if breadcrumb and len(breadcrumb) >= 2:
        category_name = breadcrumb[-2] if breadcrumb[-1].strip().lower() == title.strip().lower() else breadcrumb[-1]
    if not category_name and product_ld and product_ld.get("category"):
        category_name = str(product_ld["category"])
    if not category_name:
        category_name = "Laptop Văn Phòng"
        if "MACBOOK" in title_upper:
            category_name = "MacBook (Apple)"
        elif any(k in title_upper for k in ["GAMING", "TUF", "ROG", "NITRO", "VICTUS", "LEGION", "KATANA"]):
            category_name = "Laptop Gaming"
        elif any(k in title_upper for k in ["GRAM", "ZENBOOK", "SWIFT", "SLIM", "AIR", "ENVY"]):
            category_name = "Laptop Mỏng Nhẹ"
    use_case = "Gaming" if "gaming" in category_name.lower() else "Làm việc"

    # ---- Brand ----
    brand = None
    if product_ld and product_ld.get("brand"):
        b = product_ld["brand"]
        brand = b.get("name") if isinstance(b, dict) else str(b)
    if not brand:
        for b in ["MACBOOK", "IPHONE", "APPLE", "ASUS", "ACER", "HP", "DELL", "LENOVO", "MSI", "LG", "SAMSUNG", "XIAOMI"]:
            if b in title_upper:
                brand = "Apple" if b in ["MACBOOK", "IPHONE", "APPLE"] else b.capitalize()
                break
    brand = brand or "Khác"

    # ---- Specs: bảng HTML thật > list trong __NEXT_DATA__ > đoán CPU/RAM/SSD ----
    specs = _safe(extract_specs_table, soup, default=[]) if soup else []
    if not specs and next_data:
        specs = _safe(specs_from_nextdata, next_data, default=[])

    cpu = ram = ssd = None
    for s in specs:
        key_lower = s["spec_key"].lower()
        if not cpu and any(k in key_lower for k in ["cpu", "chip", "vi xử lý", "vi xu ly"]):
            cpu = s["spec_value"]
        if not ram and "ram" in key_lower:
            ram = s["spec_value"]
        if not ssd and any(k in key_lower for k in ["ssd", "ổ cứng", "o cung", "lưu trữ"]):
            ssd = s["spec_value"]

    if not cpu:
        cpu = "Intel Core i5"
        if "M1" in title_upper: cpu = "Apple M1"
        elif "M2" in title_upper: cpu = "Apple M2"
        elif "M3" in title_upper: cpu = "Apple M3"
        elif "CORE 7" in title_upper or "I7" in title_upper: cpu = "Intel Core i7"
        elif "CORE 5" in title_upper or "I5" in title_upper: cpu = "Intel Core i5"
    if not ram:
        ram = "16GB"
        ram_match = re.search(r'(\d+\s*GB)', title_upper)
        if ram_match:
            ram = ram_match.group(1).replace(" ", "")
    if not ssd:
        ssd = "512GB"
        if "1TB" in title_upper: ssd = "1TB"
        elif "256GB" in title_upper: ssd = "256GB"

    if not specs:
        specs = [
            {"spec_group": "Thông số kỹ thuật", "spec_key": "CPU", "spec_value": cpu},
            {"spec_group": "Thông số kỹ thuật", "spec_key": "RAM", "spec_value": ram},
            {"spec_group": "Thông số kỹ thuật", "spec_key": "SSD", "spec_value": ssd},
            {"spec_group": "Thông số kỹ thuật", "spec_key": "Thương hiệu", "spec_value": brand},
        ]

    # ---- Rating ----
    rating_avg = review_count = None
    if product_ld and product_ld.get("aggregateRating"):
        ar = product_ld["aggregateRating"]
        try:
            rating_avg = float(ar.get("ratingValue"))
            review_count = int(ar.get("reviewCount") or ar.get("ratingCount") or 0)
        except (TypeError, ValueError):
            pass
    if rating_avg is None:
        rating_avg, review_count = _safe(extract_rating_html, content, default=(None, None))
    rating_avg = rating_avg if rating_avg is not None else 4.8
    review_count = review_count if review_count is not None else 45

    # ---- Warranty ----
    warranty_months = 24 if brand in ["Apple", "Asus", "Msi", "Dell"] else 12
    wmatch = re.search(r'bảo hành\s*(\d{1,3})\s*tháng', content, re.IGNORECASE)
    if wmatch:
        try:
            warranty_months = int(wmatch.group(1))
        except ValueError:
            pass

    if not description:
        description = f"Sản phẩm {title} chính hãng. Trang bị vi xử lý {cpu}, RAM {ram}, SSD {ssd}. Bảo hành {warranty_months} tháng."

    pid = str(uuid.uuid4())
    slug_base = re.sub(r"[^\w\s-]", "", title.lower())
    slug_base = re.sub(r"[\s_]+", "-", slug_base).strip("-")[:60]
    slug = f"{slug_base}-{pid[:6]}"

    table_mapping = {
        "products": {
            "id": pid,
            "name": title,
            "description": description,
            "brand": brand,
            "origin": "Chính hãng",
            "thumbnail": thumbnail,
            "category_name": category_name,
            "warranty_months": warranty_months,
            "discount_percent": discount_percent,
            "slug": slug,
            "source_url": url,
            "rating_avg": rating_avg,
            "review_count": review_count,
            "sold_quantity": 88,
            "use_case": use_case,
            "is_active": True,
        },
        "product_images": [
            {"product_id": pid, "url": img, "sort_order": idx + 1}
            for idx, img in enumerate(unique_imgs if unique_imgs else [thumbnail])
        ],
        "product_variants": [
            {
                "id": str(uuid.uuid4()),
                "product_id": pid,
                "sku": f"SKU-{pid[:8]}-V1",
                "variant_name": "Tiêu chuẩn",
                "price": float(sale_price),
                "stock": 30,
                "image": thumbnail,
                "discount_percent": discount_percent,
                "attributes": {"Cấu hình": f"{ram} | {ssd}"},
                "vat_percent": 10.0,
                "is_active": True,
            },
            {
                "id": str(uuid.uuid4()),
                "product_id": pid,
                "sku": f"SKU-{pid[:8]}-V2",
                "variant_name": "Bản nâng cấp",
                "price": float(sale_price * 1.12),
                "stock": 15,
                "image": thumbnail,
                "discount_percent": discount_percent,
                "attributes": {"Cấu hình": "Bản nâng cấp RAM/SSD"},
                "vat_percent": 10.0,
                "is_active": True,
            },
        ],
        "product_specifications": [{"product_id": pid, **s} for s in specs],
        # product_chunks đã bỏ — xử lý ở pipeline khác
    }
    return table_mapping


# Convert single image URL to Storage (Supabase Cloud or Local Storage)
def convert_single_image_to_storage(pid, ext_url, target_storage="supabase"):
    if not ext_url or ext_url.startswith("/images/products/") or "supabase.co/storage" in ext_url:
        return ext_url

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    ext = ".png" if ".png" in ext_url.lower() else (".jpg" if ".jpg" in ext_url.lower() else ".webp")
    h = hashlib.md5(ext_url.encode('utf-8')).hexdigest()[:6]
    filename = f"{pid[:8]}_{h}{ext}"

    req = urllib.request.Request(ext_url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        img_bytes = resp.read()

    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    local_path = STORAGE_DIR / filename
    with open(local_path, 'wb') as out_f:
        out_f.write(img_bytes)

    local_rel_url = f"/images/products/{filename}"

    if target_storage == "supabase":
        if not SUPABASE_KEY:
            raise Exception(
                "SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình!\n"
                "Set biến môi trường SUPABASE_SERVICE_ROLE_KEY trước khi chạy server."
            )
        try:
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{filename}"
            up_req = urllib.request.Request(
                upload_url,
                data=img_bytes,
                headers={
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "image/webp" if ext == ".webp" else ("image/png" if ext == ".png" else "image/jpeg"),
                    "x-upsert": "true",
                },
                method="POST",
            )
            with urllib.request.urlopen(up_req) as up_resp:
                resp_body = up_resp.read().decode('utf-8', errors='ignore')
                print(f"[SUPABASE] Upload OK: {filename} → status {up_resp.status}")
                if up_resp.status in [200, 201]:
                    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
                raise Exception(f"Supabase trả status {up_resp.status}: {resp_body}")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='ignore')
            print(f"[ERROR] Supabase upload HTTP {e.code}: {err_body}")
            raise Exception(f"Supabase HTTP {e.code}: {err_body}")
        except Exception as e:
            print(f"[ERROR] Supabase upload thất bại: {e}")
            raise

    return local_rel_url


def convert_payload_images_to_storage(data, target_storage="supabase"):
    pid = data["products"]["id"]
    converted_count = 0
    url_map = {}

    def download_and_map(ext_url):
        if not ext_url or ext_url.startswith("/images/products/") or "supabase.co/storage" in ext_url:
            return ext_url
        if ext_url in url_map:
            return url_map[ext_url]
        try:
            res_url = convert_single_image_to_storage(pid, ext_url, target_storage)
            url_map[ext_url] = res_url
            nonlocal converted_count
            converted_count += 1
            return res_url
        except Exception as e:
            print(f"[WARN] Failed to convert image {ext_url}: {e}")
            return ext_url

    data["products"]["thumbnail"] = download_and_map(data["products"]["thumbnail"])
    for img_item in data["product_images"]:
        img_item["url"] = download_and_map(img_item["url"])
    for v_item in data["product_variants"]:
        v_item["image"] = download_and_map(v_item["image"])

    return data, converted_count


def get_db_categories():
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, name, slug, description FROM categories WHERE is_active = true ORDER BY name ASC;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [{"id": str(r[0]), "name": r[1], "slug": r[2], "description": r[3]} for r in rows]
    except Exception as e:
        print(f"[WARN] Failed to fetch categories from DB: {e}")
        return []


def check_existing_urls(urls):
    if not urls or not isinstance(urls, list):
        return []
    clean_urls = [u.strip() for u in urls if u and isinstance(u, str) and u.strip()]
    if not clean_urls:
        return []
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        normalized = [u.rstrip('/') for u in clean_urls]
        cur.execute("""
            SELECT DISTINCT source_url FROM products
            WHERE source_url IS NOT NULL AND (
                source_url = ANY(%s) OR RTRIM(source_url, '/') = ANY(%s)
            );
        """, (clean_urls, normalized))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        found_db_urls = set()
        for r in rows:
            if r[0]:
                found_db_urls.add(r[0].strip())
                found_db_urls.add(r[0].strip().rstrip('/'))
        
        existing = []
        for u in clean_urls:
            if u in found_db_urls or u.rstrip('/') in found_db_urls:
                existing.append(u)
        return existing
    except Exception as e:
        print(f"[WARN] Failed to check existing URLs in DB: {e}")
        return []


def save_approved_product(data):
    conn = get_db_conn()
    cur = conn.cursor()

    p = data["products"]
    pid = p["id"]

    cat_id = p.get("category_id")
    if cat_id:
        cur.execute("SELECT id FROM categories WHERE id = %s;", (cat_id,))
        row = cur.fetchone()
        if not row:
            cat_id = None

    if not cat_id and p.get("category_name"):
        cur.execute("SELECT id FROM categories WHERE name = %s;", (p["category_name"],))
        row = cur.fetchone()
        cat_id = row[0] if row else None

    if not cat_id:
        cur.execute("SELECT id FROM categories LIMIT 1;")
        row = cur.fetchone()
        cat_id = row[0] if row else None

    custom_tabs = json.dumps({
        "review": f"Đánh giá chi tiết {p['name']}: Đáp ứng nhu cầu {p['use_case']}.",
        "warranty_policy": f"Bảo hành {p['warranty_months']} tháng chính hãng.",
    }, ensure_ascii=False)

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
        pid, p["name"], p["description"], p["brand"], p["origin"], p["thumbnail"], cat_id,
        p["warranty_months"], p["discount_percent"], p["slug"], p["source_url"], custom_tabs,
        p["rating_avg"], p["review_count"], p["sold_quantity"], p["is_active"], p["use_case"],
    ))

    for img in data["product_images"]:
        cur.execute(
            "INSERT INTO product_images (product_id, url, sort_order) VALUES (%s, %s, %s);",
            (pid, img["url"], img["sort_order"]),
        )

    for v in data["product_variants"]:
        cur.execute("""
            INSERT INTO product_variants (
                id, product_id, sku, variant_name, price, stock, image, discount_percent, attributes, vat_percent, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            v["id"], pid, v["sku"], v["variant_name"], v["price"], v["stock"], v["image"],
            v["discount_percent"], json.dumps(v["attributes"], ensure_ascii=False), v["vat_percent"], v["is_active"],
        ))

    for s in data["product_specifications"]:
        cur.execute("""
            INSERT INTO product_specifications (product_id, spec_group, spec_key, spec_value)
            VALUES (%s, %s, %s, %s);
        """, (pid, s["spec_group"], s["spec_key"], s["spec_value"]))

    # product_chunks đã bỏ — xử lý ở pipeline khác

    cur.close()
    conn.close()
    return True


class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/crawler_dashboard.html':
            dashboard_file = Path(__file__).parent / 'crawler_dashboard.html'
            if not dashboard_file.exists():
                dashboard_file = BASE_DIR / 'crawler_dashboard.html'
            if dashboard_file.exists():
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(dashboard_file.read_bytes())
                return
        elif self.path == '/api/categories':
            cats = get_db_categories()
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "categories": cats}, ensure_ascii=False).encode('utf-8'))
            return
        elif self.path.startswith('/images/products/'):
            img_file = BASE_DIR / 'frontend' / 'public' / self.path.lstrip('/')
            if img_file.exists():
                self.send_response(200)
                mime = 'image/png' if self.path.endswith('.png') else ('image/jpeg' if self.path.endswith('.jpg') else 'image/webp')
                self.send_header('Content-type', mime)
                self.end_headers()
                self.wfile.write(img_file.read_bytes())
                return
        super().do_GET()

    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_len).decode('utf-8')
        data = json.loads(body) if body else {}

        if self.path == '/api/crawl':
            url = data.get('url')
            if not url:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing URL"}).encode('utf-8'))
                return
            try:
                result = crawl_url_data(url)
                cats = get_db_categories()
                existing_urls = check_existing_urls([url])
                exists_in_db = len(existing_urls) > 0
                self.send_response(200)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "data": result,
                    "exists_in_db": exists_in_db,
                    "available_categories": cats
                }, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        elif self.path == '/api/check-existing-urls':
            urls = data.get('urls', [])
            try:
                existing = check_existing_urls(urls)
                self.send_response(200)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "existing_urls": existing}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        elif self.path == '/api/convert-single-image':
            pid = data.get('product_id')
            ext_url = data.get('image_url')
            target_storage = data.get('target_storage', 'supabase')
            try:
                storage_url = convert_single_image_to_storage(pid, ext_url, target_storage)
                self.send_response(200)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "storage_url": storage_url}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        elif self.path == '/api/convert-images-batch':
            items = data.get('items', [])
            target_storage = data.get('target_storage', 'supabase')
            if not items or not isinstance(items, list):
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing or invalid 'items' list"}).encode('utf-8'))
                return

            updated_items = []
            total_converted = 0
            for item in items:
                try:
                    up_payload, count = convert_payload_images_to_storage(item, target_storage)
                    total_converted += count
                    updated_items.append(up_payload)
                except Exception as ex:
                    print(f"[WARN] Batch image convert failed for product {item.get('products',{}).get('id')}: {ex}")
                    updated_items.append(item)

            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "data": updated_items,
                "count": total_converted
            }, ensure_ascii=False).encode('utf-8'))

        elif self.path == '/api/convert-images':

            payload = data.get('product_data')
            target_storage = data.get('target_storage', 'supabase')
            try:
                updated_payload, count = convert_payload_images_to_storage(payload, target_storage)
                self.send_response(200)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "data": updated_payload, "count": count}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        elif self.path == '/api/crawl-batch':
            urls = data.get('urls', [])
            if not urls or not isinstance(urls, list):
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing or invalid 'urls' list"}).encode('utf-8'))
                return
            
            clean_urls = [u.strip() for u in urls if u and u.strip()]
            existing_set = set(check_existing_urls(clean_urls))
            
            results = []
            cats = get_db_categories()
            for u in clean_urls:
                in_db = u in existing_set or u.rstrip('/') in existing_set
                try:
                    res_data = crawl_url_data(u)
                    results.append({
                        "url": u,
                        "success": True,
                        "exists_in_db": in_db,
                        "data": res_data
                    })
                except Exception as ex:
                    print(f"[ERROR] Failed to crawl URL {u}: {ex}")
                    results.append({
                        "url": u,
                        "success": False,
                        "exists_in_db": in_db,
                        "error": str(ex)
                    })
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "count": len(results),
                "items": results,
                "available_categories": cats
            }, ensure_ascii=False).encode('utf-8'))


        elif self.path == '/api/approve-batch':
            items = data.get('items', [])
            if not items or not isinstance(items, list):
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing or invalid 'items' list"}).encode('utf-8'))
                return

            inserted = 0
            errors = []
            for item in items:
                try:
                    save_approved_product(item)
                    inserted += 1
                except Exception as ex:
                    pname = item.get("products", {}).get("name", "Unknown")
                    errors.append({"product": pname, "error": str(ex)})

            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "inserted_count": inserted,
                "error_count": len(errors),
                "errors": errors
            }, ensure_ascii=False).encode('utf-8'))

        elif self.path == '/api/approve-ingest':
            payload = data.get('product_data')
            try:
                save_approved_product(payload)
                self.send_response(200)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Product approved and inserted into database!"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))



if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    print(f"[SERVER] Crawler Dashboard running at: http://localhost:{PORT}")
    print(f"[SERVER] Open browser at http://localhost:{PORT} to test Crawl & DB Approval Dashboard!")
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        httpd.serve_forever()