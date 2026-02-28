import urllib.request
import sys

def fetch():
    req = urllib.request.Request(
        'https://etfdb.com/etf/SPY/#fund-flows',
        headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    )
    try:
        response = urllib.request.urlopen(req, timeout=30)
        html = response.read().decode('utf-8')
        print(html[:200])
        print("SUCCESS")
    except Exception as e:
        print("ERROR:", str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    fetch()
