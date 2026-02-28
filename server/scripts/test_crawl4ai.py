import asyncio
from crawl4ai import AsyncWebCrawler

async def test_crawl():
    print("Testing Crawl4AI on Broad Asia ETFs page...")
    async with AsyncWebCrawler(verbose=True) as crawler:
        result = await crawler.arun(
            url="https://etfdb.com/etfs/region/broad-asia/",
        )
        print("--- Crawl4AI Markdown Output ---")
        lines = result.markdown.split('\n')
        for i, line in enumerate(lines):
            if 'IEMG' in line or 'Vanguard Total' in line or 'Symbol' in line:
                # Print context around findings
                start = max(0, i-5)
                end = min(len(lines), i+5)
                print(f"--- Context around line {i} ---")
                for j in range(start, end):
                    print(f"[{j}] {repr(lines[j])}")
                
        with open('debug_crawl4ai.md', 'w') as f:
            f.write(result.markdown)
        print("Saved full output to debug_crawl4ai.md")

if __name__ == "__main__":
    asyncio.run(test_crawl())
