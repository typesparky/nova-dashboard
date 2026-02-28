const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('debug_dom.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const data = {};
const headings = document.querySelectorAll('h3');
headings.forEach(h3 => {
    const categoryName = h3.textContent.trim();
    data[categoryName] = [];
    
    let nextEl = h3.nextElementSibling;
    while (nextEl && nextEl.tagName !== 'H3') {
        if (nextEl.tagName === 'TABLE' || nextEl.querySelector('table')) {
            const table = nextEl.tagName === 'TABLE' ? nextEl : nextEl.querySelector('table');
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(tr => {
                let targetLink = null;
                const links = tr.querySelectorAll('td a');
                
                links.forEach(l => {
                    if (l.href.includes('/etfs/') && !l.href.includes('/issuers/')) {
                        targetLink = l;
                    }
                });
                
                if (!targetLink && links.length > 0) targetLink = links[0];
                
                if (targetLink && targetLink.textContent.trim().length > 1) {
                    data[categoryName].push({
                        theme: targetLink.textContent.trim(),
                        href: targetLink.href
                    });
                }
            });
            break;
        }
        nextEl = nextEl.nextElementSibling;
    }
});

console.log(JSON.stringify(data, null, 2).substring(0, 1000));
