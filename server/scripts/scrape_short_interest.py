import requests
from bs4 import BeautifulSoup
import json
import sys

def scrape_short_interest():
    url = "https://www.highshortinterest.com/"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Sec-Fetch-Dest": "document"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # High short interest uses a standard table format
        tables = soup.find_all('table', {'class': 'stocks'})
        
        stocks = []
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 6:
                    ticker = cols[0].text.strip()
                    company = cols[1].text.strip()
                    exchange = cols[2].text.strip()
                    short_int = cols[3].text.strip()
                    float_val = cols[4].text.strip()
                    target = cols[5].text.strip()
                    
                    if ticker and ticker != "Ticker" and len(ticker) <= 10 and ticker.isupper():
                        stocks.append({
                            "ticker": ticker,
                            "company": company,
                            "exchange": exchange,
                            "shortInterest": short_int,
                            "float": float_val,
                            "target": target
                        })
                        
        if stocks:
            print(json.dumps({"success": True, "data": stocks}))
        else:
            print(json.dumps({"success": False, "error": "No stocks found in the table"}))
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    scrape_short_interest()
