import asyncio
import sys
from playwright.async_api import async_playwright

async def dump(ticker="gxo"):
    url = f"https://www.nasdaq.com/market-activity/stocks/{ticker.lower()}/earnings"
    print(f"Dumping Network for {url}")
    
    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
            viewport={"width": 1920, "height": 1080},
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = await context.new_page()
        
        # Intercept network responses
        responses = []
        async def handle_response(response):
            if "api.nasdaq.com" in response.url:
                try:
                    json_data = await response.json()
                    responses.append({
                        "url": response.url, 
                        "status": response.status,
                        "data": json_data
                    })
                    print(f"Intercepted: {response.url}")
                except Exception as e:
                    responses.append({
                        "url": response.url,
                        "status": response.status,
                        "error": str(e)
                    })
        
        page.on("response", handle_response)
        
        try:
            await page.goto(url, timeout=30000)
            await page.wait_for_timeout(15000)
        except Exception as e:
            print(f"Error: {e}")
            
        import json
        with open(f"nasdaq_network_all_{ticker}.json", "w") as f:
            json.dump(responses, f, indent=2)
            
        await browser.close()
    print("Done")

if __name__ == "__main__":
    asyncio.run(dump())
