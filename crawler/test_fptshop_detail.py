import urllib.request
import re
import json

detail_url = "https://fptshop.com.vn/may-tinh-xach-tay/macbook-air-13-m5-2026-10cpu-8gpu-16gb-512gb"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
req = urllib.request.Request(detail_url, headers=headers)

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"Detail HTML length: {len(html)}")

        # Find price
        price_match = re.search(r'(\d{1,3}(?:\.\d{3})+)\s*₫', html)
        if price_match:
            print("Price found:", price_match.group(1))

        # Find all cdn2 images
        imgs = re.findall(r'src="(https://cdn2\.fptshop\.com\.vn/unsafe/[^"]+)"', html)
        unique_imgs = list(dict.fromkeys(imgs))
        print("Unique image URLs count:", len(unique_imgs))
        print("Sample images:", unique_imgs[:5])

        # Find JSON-LD or spec block
        json_ld = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
        for j in json_ld:
            try:
                data = json.loads(j)
                print("JSON-LD type:", data.get('@type'))
                if data.get('@type') in ['Product', 'IndividualProduct']:
                    print("JSON-LD Product Name:", data.get('name'))
                    print("JSON-LD Product Image:", data.get('image'))
                    print("JSON-LD Offers Price:", data.get('offers', {}).get('price'))
                    print("JSON-LD Description:", data.get('description'))
            except Exception:
                pass
except Exception as e:
    print("Error:", e)
