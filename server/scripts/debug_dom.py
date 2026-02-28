import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        await page.goto("https://etfdb.com/etfs/", wait_until="domcontentloaded")
        
        try:
            fund_flow_tab = page.locator("text='Fund Flow'").first
            await fund_flow_tab.click()
            await page.wait_for_timeout(2000)
            
            # Click SHOW MORE
            show_mores = await page.locator("text=/SHOW.*MORE/i").all()
            for btn in show_mores:
                try:
                    await btn.click(timeout=1000)
                    await page.wait_for_timeout(500)
                except: pass
        except: pass
            
        html = await page.evaluate("() => document.body.innerHTML")
        with open('debug_dom.html', 'w') as f:
            f.write(html)
            
        await browser.close()

asyncio.run(run())
