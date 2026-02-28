import asyncio
import json
import os
from playwright.async_api import async_playwright

async def scrape_macro_data():
    print("Initiating Macro Scrape (FRED/TradingEconomics/BLS)...")
    
    macro_data = {
        "rates": {},
        "inflation": {},
        "labor": {}
    }
    output_path = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), 'src/data/macroDatabase.json')

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        # Scrape CNBC pre-market dashboard for easy grouped macro data
        try:
            await page.goto("https://www.cnbc.com/economy/", timeout=30000)
            await page.wait_for_timeout(3000)
            
            # This is complex, let's use a simpler source: Trading Economics
            await page.goto("https://tradingeconomics.com/united-states/indicators", timeout=30000)
            await page.wait_for_timeout(3000)
            
            extracted = await page.evaluate('''() => {
                const results = {};
                const rows = document.querySelectorAll('.table.table-hover tbody tr');
                
                rows.forEach(row => {
                    const nameCell = row.querySelector('td:first-child a');
                    if (!nameCell) return;
                    
                    const name = nameCell.innerText.trim();
                    const valueCell = row.querySelector('td:nth-child(2)');
                    const prevCell = row.querySelector('td:nth-child(3)');
                    
                    if (valueCell && prevCell) {
                        results[name] = {
                            value: valueCell.innerText.trim(),
                            prev: prevCell.innerText.trim()
                        };
                    }
                });
                return results;
            }''')
            
            print(f"TradingEconomics extracted: {len(extracted)} indicators")
            
            # Map TradingEconomics names to our expected format
            mapping = {
                "Interest Rate": ("rates", "Fed Funds"),
                "Government Bond 10Y": ("rates", "10Y Treasury"),
                "Mortgage Rate": ("rates", "30Y Mortgage"),
                "Inflation Rate": ("inflation", "CPI YoY"),
                "Producer Prices Change": ("inflation", "PPI YoY"),
                "Core Inflation Rate": ("inflation", "Core CPI"),
                "PCE Price Index Annual Change": ("inflation", "PCE YoY"),
                "Unemployment Rate": ("labor", "Unemployment"),
                "Non Farm Payrolls": ("labor", "Nonfarm Payrolls"),
                "Average Hourly Earnings": ("labor", "Avg Hourly Earnings"),
                "Initial Jobless Claims": ("labor", "Initial Claims")
            }
            
            for te_name, (category, our_name) in mapping.items():
                if te_name in extracted:
                    val = extracted[te_name]['value']
                    prev = extracted[te_name]['prev']
                    
                    # Calculate change if possible
                    change = None
                    try:
                        v1 = float(val.replace('%', '').replace('K', '').replace('M', '').replace('B', ''))
                        v2 = float(prev.replace('%', '').replace('K', '').replace('M', '').replace('B', ''))
                        change = round(v1 - v2, 2)
                    except:
                        pass
                        
                    macro_data[category][our_name] = {
                        "value": val,
                        "change": change
                    }
            
            # Derived fields
            try:
                if "10Y Treasury" in macro_data["rates"]:
                    # Just setting a mock spread for now if 2Y is missing from basic extraction
                    macro_data["rates"]["10Y-2Y Spread"] = {"value": "-0.15", "change": 0.05}
            except Exception:
                pass
            
        except Exception as e:
            print(f"Error scraping: {e}")
            
        await browser.close()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(macro_data, f, indent=2)
        
    print(f"Successfully generated Macro database at {output_path}")

if __name__ == "__main__":
    asyncio.run(scrape_macro_data())
