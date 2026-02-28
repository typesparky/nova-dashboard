import asyncio
import sys
import json
import argparse
from playwright.async_api import async_playwright
from playwright_stealth import Stealth

async def scrape_nasdaq(ticker, scrape_type):
    url_map = {
        "options": f"https://www.nasdaq.com/market-activity/stocks/{ticker.lower()}/option-chain",
        "earnings": f"https://www.nasdaq.com/market-activity/stocks/{ticker.lower()}/earnings",
        "financials": f"https://www.nasdaq.com/market-activity/stocks/{ticker.lower()}/financials",
        "dividends": f"https://www.nasdaq.com/market-activity/stocks/{ticker.lower()}/dividend-history",
        "insider": f"https://www.nasdaq.com/market-activity/stocks/{ticker.lower()}/insider-activity",
        "institutional": f"https://www.nasdaq.com/market-activity/stocks/{ticker.lower()}/institutional-holdings"
    }

    if scrape_type not in url_map:
        print(json.dumps({"success": False, "error": f"Invalid scrape type: {scrape_type}"}))
        return

    url = url_map[scrape_type]
    
    async with async_playwright() as p:
        # Use firefox for better evasion along with stealth
        browser = await p.firefox.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
            viewport={"width": 1920, "height": 1080},
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = await context.new_page()
        await Stealth().apply_stealth_async(page)
        
        try:
            if scrape_type == "options":
                await page.goto(url, timeout=30000)
                await page.wait_for_selector(".jupiter22-options-chain__row", timeout=15000)
                
                # Extract options data via JS
                data = await page.evaluate('''() => {
                    const results = [];
                    const rows = document.querySelectorAll('.jupiter22-options-chain__table-body .jupiter22-options-chain__row');
                    
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('.jupiter22-options-chain__cell');
                        if (cells.length >= 16 && cells[9].querySelector('a')) {
                            results.push({
                                expiry: cells[1].innerText.trim(),
                                calls: {
                                    last: cells[2].innerText.trim(),
                                    change: cells[3].innerText.trim().replace('\\n', ' '),
                                    bid: cells[4].innerText.trim(),
                                    ask: cells[5].innerText.trim(),
                                    volume: cells[6].innerText.trim(),
                                    openInterest: cells[7].innerText.trim()
                                },
                                strike: cells[9].querySelector('a').innerText.trim(),
                                puts: {
                                    last: cells[10].innerText.trim(),
                                    change: cells[11].innerText.trim().replace('\\n', ' '),
                                    bid: cells[12].innerText.trim(),
                                    ask: cells[13].innerText.trim(),
                                    volume: cells[14].innerText.trim(),
                                    openInterest: cells[15].innerText.trim()
                                }
                            });
                        }
                    });
                    return results;
                }''')
                
                print(json.dumps({"success": True, "data": data}))
                
            else:
                # For all other types, we intercept the API requests
                collected_data = {}
                
                async def handle_response(response):
                    if "api.nasdaq.com" in response.url and response.status == 200:
                        try:
                            json_data = await response.json()
                            
                            # Earnings specific
                            if "/eps" in response.url:
                                collected_data["eps"] = json_data.get("data", {})
                            elif "/earnings-surprise" in response.url:
                                collected_data["surprise"] = json_data.get("data", {})
                            elif "/earnings-forecast" in response.url:
                                collected_data["forecast"] = json_data.get("data", {})
                            # Financials specific
                            elif "/financials" in response.url:
                                collected_data["financials"] = json_data.get("data", {})
                            # Dividends specific
                            elif "/dividends" in response.url:
                                collected_data["dividends"] = json_data.get("data", {})
                            # Insider specific
                            elif "/insider-trades" in response.url:
                                collected_data["insider"] = json_data.get("data", {})
                            # Institutional specific
                            elif "/institutional-holdings" in response.url:
                                collected_data["institutional"] = json_data.get("data", {})
                                
                        except Exception as e:
                            pass
                
                page.on("response", handle_response)
                
                await page.goto(url, timeout=30000)
                # Wait sufficient time for all XHR requests to complete
                await page.wait_for_timeout(8000)
                
                # If we collected what we need, return it
                if collected_data:
                    print(json.dumps({"success": True, "data": collected_data}))
                else:
                    print(json.dumps({"success": False, "error": "No API data intercepted. Bot protection activated?"}))
                
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
            
        finally:
            await browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Scrape Nasdaq Equities Data')
    parser.add_argument('ticker', type=str, help='Stock ticker symbol')
    parser.add_argument('--type', type=str, default='options', choices=['options', 'earnings', 'financials', 'dividends', 'insider', 'institutional'], help='Type of data to scrape')
    
    args = parser.parse_args()
    asyncio.run(scrape_nasdaq(args.ticker, args.type))
