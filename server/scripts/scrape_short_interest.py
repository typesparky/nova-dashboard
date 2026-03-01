import requests
from bs4 import BeautifulSoup
import json
import sys
import yfinance as yf

def format_market_cap(value):
    """Return a compact human-readable market cap string and raw numeric."""
    if value is None:
        return None, None
    if value >= 1_000_000_000_000:
        return f"${value / 1_000_000_000_000:.2f}T", value
    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.2f}B", value
    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M", value
    return f"${value:,.0f}", value

def parse_short_pct(s):
    """Convert '34.98%' → 0.3498, or None if invalid."""
    try:
        return float(s.replace('%', '').strip()) / 100
    except Exception:
        return None

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
                            "target": target,
                        })

        if not stocks:
            print(json.dumps({"success": False, "error": "No stocks found in the table"}))
            return

        # --- Enrich with market cap via yfinance (batch download) ---
        tickers_list = [s["ticker"] for s in stocks]
        try:
            # download() gives us a multi-level DataFrame; we use .info per-ticker sparingly
            # batch fast_info is the quickest approach
            bulk = yf.Tickers(" ".join(tickers_list))
            market_caps = {}
            for ticker in tickers_list:
                try:
                    mc = bulk.tickers[ticker].fast_info.market_cap
                    market_caps[ticker] = mc if mc else None
                except Exception:
                    market_caps[ticker] = None
        except Exception:
            market_caps = {t: None for t in tickers_list}

        # Attach market cap and compute short dollar value
        for stock in stocks:
            t = stock["ticker"]
            mc_raw = market_caps.get(t)
            mc_str, mc_num = format_market_cap(mc_raw)
            stock["marketCap"] = mc_str       # e.g. "$1.23B"
            stock["marketCapRaw"] = mc_num    # raw number for sorting

            pct = parse_short_pct(stock["shortInterest"])
            if mc_num and pct:
                short_usd = mc_num * pct
                stock["shortDollarValue"], _ = format_market_cap(short_usd)
                stock["shortDollarRaw"] = short_usd
            else:
                stock["shortDollarValue"] = None
                stock["shortDollarRaw"] = None

        print(json.dumps({"success": True, "data": stocks}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    scrape_short_interest()
