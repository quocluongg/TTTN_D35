import urllib.request
import re
import json

url = "https://fptshop.com.vn/may-tinh-xach-tay"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print(f"HTML length: {len(html)}")

        # Search for Next.js __NEXT_DATA__ or JSON data
        match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
        if match:
            data = json.loads(match.group(1))
            print("Found __NEXT_DATA__ keys:", list(data.keys()))
            page_props = data.get('props', {}).get('pageProps', {})
            print("pageProps keys:", list(page_props.keys()))
            # Look for products in pageProps
            print("Sample pageProps content snippet:", str(page_props)[:500])
        else:
            print("No __NEXT_DATA__ found, searching for images and product titles...")
            titles = re.findall(r'title="([^"]*Laptop[^"]*)"', html, re.IGNORECASE)
            print("Sample titles found:", titles[:5])
            imgs = re.findall(r'src="(https://cdn[^\s"]+)"', html)
            print("Sample image URLs found:", imgs[:5])
except Exception as e:
    print("Fetch error:", e)
