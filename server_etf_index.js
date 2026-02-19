import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/api/etf/index', async (req, res) => {
  try {
    const source = req.query.source || 'farside';

    if (source === 'farside') {
      const response = await axios.get('https://farside.xyz/etfs/', {
        timeout: 30000
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      const etfLinks = document.querySelectorAll('.asset-links a');
      const etfIndex = [];

      etfLinks.forEach(link => {
        const etfName = link.textContent.trim();
        const etfUrl = link.getAttribute('href');
        const [ticker, ...rest] = etfName.split(' ');
        const fullTicker = ticker.replace(/[()]/g, '').toUpperCase();

        etfIndex.push({
          ticker: fullTicker,
          name: etfName,
          url: etfUrl,
          source: 'Farside ETF Investors'
        });
      });

      return res.json({
        source: 'farside',
        count: etfIndex.length,
        etfs: etfIndex
      });
    }

    if (source === 'etfdb') {
      const response = await axios.get('https://etfdb.com/screener/', {
        timeout: 30000
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      const etfRows = document.querySelectorAll('.table-body .table-row');
      const etfIndex = [];

      etfRows.forEach(row => {
        const ticker = row.querySelector('.table-ticker a')?.textContent?.trim()?.toUpperCase() || '';
        const name = row.querySelector('.table-name a')?.textContent?.trim() || '';
        const category = row.querySelector('.table-category a')?.textContent?.trim() || '';

        if (ticker && name) {
          etfIndex.push({
            ticker,
            name,
            category,
            url: `https://etfdb.com/etf/${ticker}/#fund-flows`,
            source: 'ETFDB'
          });
        }
      });

      return res.json({
        source: 'etfdb',
        count: etfIndex.length,
        etfs: etfIndex
      });
    }

    return res.status(400).json({ error: 'Invalid source. Use "farside" or "etfdb"' });

  } catch (error) {
    console.error('ETF Index Error:', error);
    res.status(500).json({ error: 'Failed to fetch ETF index', message: error.message });
  }
});

app.get('/api/etf/info', async (req, res) => {
  try {
    const ticker = req.query.ticker;
    const source = req.query.source || 'farside';

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker parameter is required' });
    }

    if (source === 'farside') {
      const response = await axios.get(`https://farside.xyz/etfs/`, {
        timeout: 30000
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      const etfLink = document.querySelector(`a[href*="/etfs/${ticker}"]`);

      if (etfLink) {
        const etfName = etfLink.textContent.trim();
        const [tickerMatch, ...rest] = etfName.split(' ');
        const tickerClean = tickerMatch.replace(/[()]/g, '').toUpperCase();

        return res.json({
          ticker: tickerClean,
          name: etfName,
          url: etfLink.getAttribute('href'),
          source: 'Farside ETF Investors'
        });
      }

      return res.status(404).json({ error: 'ETF not found on Farside' });
    }

    if (source === 'etfdb') {
      const response = await axios.get(`https://etfdb.com/etf/${ticker}/#fund-flows`, {
        timeout: 30000
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      const etfName = document.querySelector('h1')?.textContent?.trim() || ticker;
      const [tickerMatch, ...rest] = etfName.split(' ');
      const tickerClean = tickerMatch.replace(/[()]/g, '').toUpperCase();

      return res.json({
        ticker: tickerClean,
        name: etfName,
        url: `https://etfdb.com/etf/${tickerClean}/#fund-flows`,
        source: 'ETFDB'
      });
    }

    return res.status(400).json({ error: 'Invalid source. Use "farside" or "etfdb"' });

  } catch (error) {
    console.error('ETF Info Error:', error);
    res.status(500).json({ error: 'Failed to fetch ETF info', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`ETF Index server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- /api/etf/index?source=farside');
  console.log('- /api/etf/index?source=etfdb');
  console.log('- /api/etf/info?ticker=IBIT&source=farside');
  console.log('- /api/etf/info?ticker=IBIT&source=etfdb');
});
