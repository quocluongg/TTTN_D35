import urllib.request
import re
import json
import html as html_lib

url = "https://fptshop.com.vn/may-tinh-xach-tay"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8', errors='ignore')

        # Find product links and images
        # FPTShop links usually look like href="/may-tinh-xach-tay/laptop-..."
        product_blocks = re.findall(r'<a[^>]+href="(/may-tinh-xach-tay/[^"]+)"[^>]*>(.*?)</a>', content, re.DOTALL)
        print(f"Total product links found: {len(product_blocks)}")

        products = []
        for href, block in product_blocks:
            # Title
            title_match = re.search(r'alt="([^"]+)"|title="([^"]+)"', block)
            title = None
            if title_match:
                title = title_match.group(1) or title_match.group(2)
            if not title:
                continue
            title = html_lib.unescape(title).strip()
            if not title.startswith("Laptop") and not title.startswith("MacBook"):
                continue

            # Image src
            img_match = re.search(r'src="(https://cdn2\.fptshop\.com\.vn/unsafe/[^"]+)"', block)
            img_url = img_match.group(1) if img_match else None

            # Price
            price_match = re.search(r'([\d\.]+)\s*₫', block)
            price_text = price_match.group(1) if price_match else None
            price = int(price_text.replace('.', '')) if price_text else None

            full_url = "https://fptshop.com.vn" + href
            products.append({
                "title": title,
                "url": full_url,
                "img_url": img_url,
                "price": price
            })

        print(f"Extracted {len(products)} laptop items:")
        for p in products[:10]:
            print(p)

except Exception as e:
    print("Error:", e)
