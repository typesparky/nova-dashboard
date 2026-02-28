import asyncio
import json
import os
import random
from playwright.async_api import async_playwright

BASE_URL = "https://etfdb.com/etfs/"

async def scrape_etf_data():
    print("Initiating Strict ETFDB Scrape for Fund Flows...")
    
    structured_data = {}
    output_path = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), 'src/data/etfDatabase.json')

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        print(f"Navigating to {BASE_URL}")
        try:
            await page.goto(BASE_URL, timeout=60000, wait_until="domcontentloaded")
            
            # Close cookie Banner if exists
            try:
                await page.locator("text='Accept All'").first.click(timeout=5000)
                await page.wait_for_timeout(1000)
            except:
                pass
                
            # Click Fund Flow tab
            await page.wait_for_selector("text='Fund Flow'", timeout=15000)
            fund_flow_tabs = await page.locator("text='Fund Flow'").all()
            for t in fund_flow_tabs:
                try:
                    await t.click(timeout=2000)
                    break
                except:
                    pass
                    
            await page.wait_for_timeout(3000)
            print("Switched to Fund Flow tab.")
            
            # Click "SHOW MORE" buttons to expand tables
            show_mores = await page.locator("text=/SHOW.*MORE/i").all()
            for btn in show_mores:
                try:
                    await btn.click(timeout=1000)
                    await page.wait_for_timeout(500)
                except:
                    pass
                    
        except Exception as e:
            print(f"Failed to load main page or click Fund Flow: {e}")
            await browser.close()
            return

        print("Extracting categories and themes from Fund Flow tables...")
        
        categories_extracted = await page.evaluate('''() => {
            const data = {};
            const headings = document.querySelectorAll('h3');
            headings.forEach(h3 => {
                const categoryName = h3.innerText.trim();
                data[categoryName] = [];
                
                let nextEl = h3.nextElementSibling;
                while (nextEl && nextEl.tagName !== 'H3') {
                    if (nextEl.tagName === 'TABLE' || nextEl.querySelector('table')) {
                        let table = nextEl.tagName === 'TABLE' ? nextEl : null;
                        
                        if (!table) {
                            const tables = nextEl.querySelectorAll('table');
                            for (let i = 0; i < tables.length; i++) {
                                if (tables[i].querySelectorAll('tbody tr').length > 0) {
                                    table = tables[i];
                                    break;
                                }
                            }
                        }
                        
                        if (table) {
                            const rows = table.querySelectorAll('tbody tr');
                            rows.forEach(tr => {
                                const links = Array.from(tr.querySelectorAll('td a'));
                                const targetLink = links.find(l => l.href.includes('/etfs/') && !l.href.includes('/issuers/'));
                                
                                if (targetLink && targetLink.innerText.trim().length > 1) {
                                    data[categoryName].push({
                                        theme: targetLink.innerText.trim(),
                                        url: targetLink.href.split('#')[0]
                                    });
                                }
                            });
                            break;
                        }
                    }
                    nextEl = nextEl.nextElementSibling;
                }
            });
            return data;
        }''')
        
        # We want to extract tickers for a handful of important themes mapped by the user
        target_categories = [
            "Asset Class", "Sector", "Industry", "Region", "Country", 
            "Bond", "Bond Duration", "Commodity", "Investment Style", "Alternatives"
        ]
        
        themes_to_scrape = []
        for cat in target_categories:
            if cat in categories_extracted:
                # Deduplicate themes due to possible table duplicates
                seen = set()
                count = 0
                for theme_data in categories_extracted[cat]:
                    if theme_data['theme'] not in seen:
                        seen.add(theme_data['theme'])
                        
                        themes_to_scrape.append({
                            "category": cat,
                            "theme": theme_data['theme'],
                            "url": theme_data['url']
                        })
                        count += 1
                        if count >= 3: # limit to top 3 themes per category
                            break

        if not themes_to_scrape:
            print("Failed to map themes from Fund Flow tab. Data structure mismatch.")
        else:
            print(f"Mapped {len(themes_to_scrape)} specific sub-themes successfully from the DOM.")
        
        # Cap scraping to a small testing subset if needed, here we'll scrape all found targeting 3 per category (~30 pages)
        print(f"Proceeding to scrape {len(themes_to_scrape)} theme pages for constituent tickers (up to 25 per theme)...")
        
        for item in themes_to_scrape:
            cat = item["category"]
            theme = item["theme"]
            url = item["url"]
            print(f"Scraping ETF Theme: '{theme}' at {url}...")
            
            if cat not in structured_data:
                structured_data[cat] = []
                
            try:
                await page.goto(url, timeout=30000, wait_until="domcontentloaded")
                
                # Revisit consent button just in case
                try:
                    await page.locator("text='Accept All'").first.click(timeout=3000)
                    await page.wait_for_timeout(500)
                except: pass
                
                await page.wait_for_timeout(2000) 
                
                tickers_data = await page.evaluate('''() => {
                    const found = [];
                    // Find the main data table. Typically it contains 'Symbol' in headers
                    let table = null;
                    document.querySelectorAll('table').forEach(t => {
                        if (t.innerText.includes('Symbol') && t.innerText.includes('ETF Name')) {
                            table = t;
                        }
                    });
                    
                    if (!table) return [];
                    
                    const rows = table.querySelectorAll('tbody tr');
                    rows.forEach(tr => {
                        const cells = Array.from(tr.querySelectorAll('td'));
                        if (cells.length > 0) {
                            // First cell is usually symbol, second is name
                            const symbol = cells[0].innerText.trim();
                            const name = cells.length > 1 ? cells[1].innerText.trim() : "";
                            
                            // Get rest as metadata
                            const metadata = {};
                            const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());
                            
                            cells.forEach((cell, idx) => {
                                if (idx > 1 && idx < headers.length) {
                                    metadata[headers[idx]] = cell.innerText.trim();
                                }
                            });
                            
                            if(symbol === symbol.toUpperCase() && symbol.length > 0 && symbol.length <= 5 && !symbol.includes(' ') && /^[A-Z]+$/.test(symbol)) {
                                found.push({
                                    ticker: symbol,
                                    name: name,
                                    metadata: metadata
                                });
                            }
                        }
                    });
                    return found;
                }''')
                
                print(f" -> Successfully extracted {len(tickers_data)} REAL tickers + metadata for {theme}.")
                
                if tickers_data:
                    structured_data[cat].append({
                        "theme": theme,
                        "tickers": tickers_data[:25] 
                    })
                
            except Exception as e:
                print(f" -> Failed to scrape {theme}: {e}")
                
            await page.wait_for_timeout(random.randint(1500, 3000))
            
        await browser.close()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(structured_data, f, indent=2)
        
    print(f"Successfully generated Strict ETF database at {output_path}")

if __name__ == "__main__":
    asyncio.run(scrape_etf_data())
