import urllib.request
import json
import sys

def fetch():
    req = urllib.request.Request(
        'https://farside.co.uk/bitcoin-etf-flow-all-data/',
        headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://farside.co.uk/'
        }
    )
    try:
        response = urllib.request.urlopen(req)
        html = response.read().decode('utf-8')
        print(json.dumps({"success": True, "length": len(html)}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

fetch()
