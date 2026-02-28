from bs4 import BeautifulSoup
import json

with open('debug_dom.html', 'r') as f:
    html = f.read()
    
soup = BeautifulSoup(html, 'html.parser')
data = {}

for h3 in soup.find_all('h3'):
    cat = h3.get_text(strip=True)
    data[cat] = []
    
    nxt = h3.find_next_sibling()
    while nxt and nxt.name != 'h3':
        if nxt.name == 'table' or nxt.find('table'):
            table = nxt if nxt.name == 'table' else nxt.find('table')
            if cat == "Asset Class": print("Found table for Asset Class. Rows:", len(table.find_all('tr')))
            for tr in table.find_all('tr'):
                links = tr.find_all('a')
                if cat == "Asset Class" and len(links) > 0: print("Row has links. First:", links[0].get('href'))
                target = None
                for l in links:
                    href = l.get('href', '')
                    if '/etfs/' in href and '/issuers/' not in href:
                        target = l
                if not target and links: target = links[0]
                if target and len(target.get_text(strip=True)) > 1:
                    data[cat].append({
                        "theme": target.get_text(strip=True),
                        "url": target.get('href')
                    })
            break
        nxt = nxt.find_next_sibling()
        
    if cat == "Asset Class":
        print("Found Asset Class H3. Next sibling Name:", h3.find_next_sibling().name)
        if h3.find_next_sibling().name == 'div':
            print("Next sibling has class:", h3.find_next_sibling().get('class'))
            
print("Categories extracted:", list(data.keys()))
print("Asset Class data:", data.get("Asset Class", []))
