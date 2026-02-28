from bs4 import BeautifulSoup

with open('debug_dom.html', 'r') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

data = {}
for h3 in soup.find_all('h3'):
    cat = h3.get_text(strip=True)
    if cat != 'Asset Class': continue
    
    nxt = h3.find_next_sibling()
    print("H3:", cat, "Next sibling:", nxt.name if nxt else None)
    
    if nxt and nxt.find('table'):
        table = nxt.find('table')
        print("Found table! trs:", len(table.find_all('tr')))
        for tr in table.find_all('tr'):
            links = tr.find_all('a')
            if links:
                print("TR links:", [l.get('href') for l in links])
