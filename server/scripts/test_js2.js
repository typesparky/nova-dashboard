const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('debug_dom.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const data = {};
const headings = document.querySelectorAll('h3');
headings.forEach(h3 => {
    const categoryName = h3.textContent.trim();
    if (categoryName !== 'Asset Class' && categoryName !== 'Alternatives') return;

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
                    const links = tr.querySelectorAll('td a');
                    const targetLink = Array.from(links).find(l => l.href.includes('/etfs/') && !l.href.includes('/issuers/'));
                    
                    if (targetLink && targetLink.textContent.trim().length > 1) {
                        // clean up URL by removing hash
                        let cleanUrl = targetLink.href.split('#')[0];
                        data[categoryName].push({
                            theme: targetLink.textContent.trim(),
                            url: cleanUrl
                        });
                    }
                });
                break;
            }
        }
        nextEl = nextEl.nextElementSibling;
    }
});

console.log(JSON.stringify(data, null, 2));
