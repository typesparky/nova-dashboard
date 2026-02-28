import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        await page.goto("https://etfdb.com/etfs/", wait_until="domcontentloaded")
        
        # Click the "Fund Flow" tab
        try:
            fund_flow_tab = page.locator("text='Fund Flow'").first
            await fund_flow_tab.click()
            await page.wait_for_timeout(2000)
            print("Clicked Fund Flow tab")
        except Exception as e:
            print("Could not click Fund Flow tab:", e)
            
        # Extract the tables
        html = await page.evaluate('''() => {
            const container = document.querySelector(".tab-content .active") || document.body;
            const tables = document.querySelectorAll('h3, table');
            let res = "";
            tables.forEach(t => {
                if (t.tagName === 'H3') res += "\\n## " + t.innerText + "\\n";
                if (t.tagName === 'TABLE') {
                    const rows = t.querySelectorAll('tr');
                    rows.forEach(r => {
                        const a = r.querySelector('a');
                        if(a) {
                            res += "- " + a.innerText.trim() + " (" + a.href + ")\\n";
                        }
                    });
                }
            });
            return res;
        }''')
        
        print(html)
        await browser.close()

asyncio.run(run())
