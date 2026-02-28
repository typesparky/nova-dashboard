import urllib.request
import sys

def fetch(url):
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://farside.co.uk/' if 'farside' in url else 'https://etfdb.com/'
        }
    )
    try:
        response = urllib.request.urlopen(req, timeout=30)
        html = response.read().decode('utf-8')
        print(html)
    except Exception as e:
        print("ERROR:", str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("ERROR: URL required", file=sys.stderr)
        sys.exit(1)
    fetch(sys.argv[1])
