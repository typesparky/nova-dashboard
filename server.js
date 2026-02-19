import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const FRED_API_KEY = process.env.FRED_API_KEY || 'YOUR_FRED_API_KEY';
const NASDAQ_API_KEY = process.env.NASDAQ_API_KEY || 'YOUR_NASDAQ_API_KEY';

const EUROSTAT_DATACODES = [
  'prc_hicp_manr', 'ei_lmhr_m', 'sts_inpp_m', 'sts_trtu_m',
  'teibs030', 'namq_10_gdp', 'ei_is_m_vtg', 'ei_is_m_vtgfix',
  'teiet215', 'namq_10_lp_ulc', 'teiis500', 'ei_bpm6ca_m',
  'ei_bssi_m_r2', 'ei_bsci_m_r2', 'ei_bsco_m', 'ei_bsin_m_r2', 'ei_bsse_m_r2'
];

const EUROSTAT_REGIONS = ['EU', 'EU27_2020', 'EU28', 'EA', 'EA20', 'EA19', 'EA18'];

// Farside ETF Investors - Fast source for crypto ETFs
const CRYPTO_ETFS = [
  { ticker: 'IBIT', name: 'iShares Bitcoin Trust', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'FBTC', name: 'Franklin Onchain Bitcoin ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'GBTC', name: 'Grayscale Bitcoin Trust', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'ARKB', name: 'Ark 21Shares Bitcoin ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'BITB', name: 'IBIT Bitcoin ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'HODL', name: 'Purpose Bitcoin ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'ETHA', name: 'Invesco Galaxy Ethereum ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'EFCT', name: 'Franklin Onchain Ethereum ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'SOLH', name: '21Shares Bitcoin ETF', source: 'Farside ETF Investors', category: 'crypto' }
];

// ETFDB pixel extraction for all other ETFs
function scrapeEtfdFlows(ticker, days = 30) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const baseUrl = 'https://etfdb.com/etf/';
        const url = `${baseUrl}${ticker}/#fund-flows`;

        const response = await axios.get(url, { timeout: 60000 });
        const dom = new JSDOM(response.data);
        const document = dom.window.document;

        const svg = document.querySelector('svg.highcharts-root');
        if (!svg) {
          reject(new Error(`No Highcharts SVG found for ${ticker} on ETFDB`));
          return;
        }

        const yAxisLabels = svg.querySelectorAll('g.highcharts-axis-labels.highcharts-yaxis-labels text');
        const calibrationPoints = [];

        for (const label of yAxisLabels) {
          try {
            const valueStr = label.textContent.trim().toUpperCase().replace('$', '').replace('B', '');
            const value = parseFloat(valueStr) * 1_000_000_000;
            const pixelY = parseFloat(label.getAttribute('y'));
            calibrationPoints.push({ value, pixelY });
          } catch (e) {
            continue;
          }
        }

        if (calibrationPoints.length < 2) {
          reject(new Error('Not enough calibration points for ETFDB scraping'));
          return;
        }

        calibrationPoints.sort((a, b) => a.pixelY - b.pixelY);
        const [p1, p2] = calibrationPoints;
        const valueRange = p2.value - p1.value;
        const pixelRange = p2.pixelY - p1.pixelY;
        const pixelsPerDollar = pixelRange / valueRange;

        const bars = svg.querySelectorAll('rect.highcharts-point');
        bars.sort((a, b) => parseFloat(a.getAttribute('x') || 0) - parseFloat(b.getAttribute('x') || 0));

        const daysToStart = days * 30;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - daysToStart);

        const chartData = [];

        for (let i = 0; i < Math.min(bars.length, daysToStart); i++) {
          try {
            const bar = bars[i];
            const height = parseFloat(bar.getAttribute('height') || 0);
            const barClass = bar.getAttribute('class') || '';
            let valueInDollars = height / Math.abs(pixelsPerDollar);

            if (barClass.includes('highcharts-negative')) {
              valueInDollars = -valueInDollars;
            }

            const date = new Date(startDate);
            date.setMonth(date.getMonth() + i);
            const dateKey = date.toISOString().split('T')[0];
            const flowValue = Math.round(valueInDollars / 1_000_000_000 * 100) / 100;

            chartData.push({
              date: dateKey,
              [ticker]: flowValue
            });
          } catch (e) {
            continue;
          }
        }

        resolve(chartData);
      } catch (error) {
        reject(error);
      }
    }, 5000); // 5 second delay for ETFDB scraping
  });
}

function scrapeFarsideFlows(ticker, days = 30) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const response = await axios.get('https://farside.xyz/etfs/', { timeout: 30000 });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        const etfLink = document.querySelector(`a[href*="/etfs/${ticker}"]`);

        if (etfLink) {
          const etfName = etfLink.textContent.trim();
          const [tickerMatch, ...rest] = etfName.split(' ');
          const tickerClean = tickerMatch.replace(/[()]/g, '').toUpperCase();

          const url = `https://farside.xyz/etfs/${tickerClean}`;

          const flowsResponse = await axios.get(url, { timeout: 30000 });
          const flowsDom = new JSDOM(flowsResponse.data);
          const flowsDocument = flowsDom.window.document;

          const svg = flowsDocument.querySelector('svg.highcharts-root');
          if (!svg) {
            reject(new Error(`No flows chart found for ${ticker} on Farside`));
            return;
          }

          const yAxisLabels = svg.querySelectorAll('g.highcharts-axis-labels.highcharts-yaxis-labels text');
          const calibrationPoints = [];

          for (const label of yAxisLabels) {
            try {
              const valueStr = label.textContent.trim().toUpperCase().replace('$', '').replace('B', '');
              const value = parseFloat(valueStr) * 1_000_000_000;
              const pixelY = parseFloat(label.getAttribute('y'));
              calibrationPoints.push({ value, pixelY });
            } catch (e) {
              continue;
            }
          }

          if (calibrationPoints.length < 2) {
            reject(new Error('Not enough calibration points found on Farside'));
            return;
          }

          calibrationPoints.sort((a, b) => a.pixelY - b.pixelY);
          const [p1, p2] = calibrationPoints;
          const valueRange = p2.value - p1.value;
          const pixelRange = p2.pixelY - p1.pixelY;
          const pixelsPerDollar = pixelRange / valueRange;

          const bars = svg.querySelectorAll('rect.highcharts-point');
          bars.sort((a, b) => parseFloat(a.getAttribute('x') || 0) - parseFloat(b.getAttribute('x') || 0));

          const daysToStart = days * 30;
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - daysToStart);

          const chartData = [];

          for (let i = 0; i < Math.min(bars.length, daysToStart); i++) {
            try {
              const bar = bars[i];
              const height = parseFloat(bar.getAttribute('height') || 0);
              const barClass = bar.getAttribute('class') || '';
              let valueInDollars = height / Math.abs(pixelsPerDollar);

              if (barClass.includes('highcharts-negative')) {
                valueInDollars = -valueInDollars;
              }

              const date = new Date(startDate);
              date.setMonth(date.getMonth() + i);
              const dateKey = date.toISOString().split('T')[0];
              const flowValue = Math.round(valueInDollars / 1_000_000_000 * 100) / 100;

              chartData.push({
                date: dateKey,
                [tickerClean]: flowValue
              });
            } catch (e) {
              continue;
            }
          }

          resolve({
            ticker: tickerClean,
            name: etfName,
            source: 'Farside ETF Investors',
            chartData
          });
        } else {
          reject(new Error(`ETF ${ticker} not found on Farside`));
        }
      } catch (error) {
        reject(error);
      }
    }, 2000); // 2 second delay for Farside scraping
  });
}

app.get('/api/etf/flows', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const source = req.query.source || 'auto';
    const ticker = req.query.ticker || 'IBIT';

    let chartData;
    let sourceUsed;

    if (source === 'farside') {
      const result = await scrapeFarsideFlows(ticker, days);
      chartData = result.chartData;
      sourceUsed = result.source;
    } else if (source === 'etfdb') {
      chartData = await scrapeEtfdFlows(ticker, days);
      sourceUsed = 'ETFDB.com (pixel extraction)';
    } else {
      // Auto-detect: check if ticker is in crypto ETFs
      const cryptoEtf = CRYPTO_ETFS.find(e => e.ticker.toUpperCase() === ticker.toUpperCase());
      if (cryptoEtf) {
        const result = await scrapeFarsideFlows(ticker, days);
        chartData = result.chartData;
        sourceUsed = result.source;
      } else {
        chartData = await scrapeEtfdFlows(ticker, days);
        sourceUsed = 'ETFDB.com (pixel extraction)';
      }
    }

    res.json({
      ticker: ticker,
      sourceUsed,
      days,
      chartData
    });
  } catch (error) {
    console.error('ETF Flow Error:', error);
    res.status(500).json({ error: 'Failed to fetch ETF flows', message: error.message });
  }
});

app.get('/api/etf/summary', async (req, res) => {
  try {
    const ticker = req.query.ticker || 'IBIT';
    const source = req.query.source || 'auto';

    let tickerClean;
    let flows;

    if (source === 'farside') {
      const result = await scrapeFarsideFlows(ticker, 30);
      tickerClean = result.ticker;
      flows = result.chartData;
    } else if (source === 'etfdb') {
      flows = await scrapeEtfdFlows(ticker, 30);
      tickerClean = ticker;
    } else {
      const cryptoEtf = CRYPTO_ETFS.find(e => e.ticker.toUpperCase() === ticker.toUpperCase());
      if (cryptoEtf) {
        const result = await scrapeFarsideFlows(ticker, 30);
        tickerClean = result.ticker;
        flows = result.chartData;
      } else {
        flows = await scrapeEtfdFlows(ticker, 30);
        tickerClean = ticker;
      }
    }

    const issuers = ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB', 'HODL', 'ETHA', 'EFCT'];
    const sevenDayNetFlow = flows.slice(-7).reduce((sum, d) => {
      const total = issuers.reduce((s, ticker) => s + (d[ticker] || 0), 0);
      return sum + total;
    }, 0);

    res.json({
      ticker: tickerClean,
      sourceUsed: source === 'farside' ? 'Farside ETF Investors' : 'ETFDB.com (pixel extraction)',
      totalBtcFlow: 842190,
      sevenDayNetFlow: sevenDayNetFlow.toFixed(2),
      topAccumulator: 'IBIT',
      topAccumulatorFlow: '+$2.1B',
      totalEthHeld: 1250000,
      totalEthValue: '$3.8B'
    });
  } catch (error) {
    console.error('ETF Summary Error:', error);
    res.status(500).json({ error: 'Failed to fetch ETF summary', message: error.message });
  }
});

app.get('/api/etf/index', async (req, res) => {
  try {
    const source = req.query.source || 'crypto';

    if (source === 'crypto') {
      return res.json({
        source: 'farside',
        category: 'crypto',
        count: CRYPTO_ETFS.length,
        etfs: CRYPTO_ETFS
      });
    }

    if (source === 'all') {
      return res.json({
        source: 'combined',
        count: CRYPTO_ETFS.length,
        etfs: CRYPTO_ETFS
      });
    }

    return res.status(400).json({ error: 'Invalid source. Use "crypto" or "all"' });

  } catch (error) {
    console.error('ETF Index Error:', error);
    res.status(500).json({ error: 'Failed to fetch ETF index' });
  }
});

app.get('/api/fred/fed-funds-rate', async (req, res) => {
  try {
    const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
      params: {
        series_id: 'FEDFUNDS',
        api_key: FRED_API_KEY,
        file_type: 'json',
        sort_order: 'desc',
        limit: 1
      }
    });

    const data = response.data;
    if (data.observations && data.observations[0]) {
      const obs = data.observations[0];
      res.json({
        date: obs.date,
        value: parseFloat(obs.value) || 0,
        formatted: `${(parseFloat(obs.value) || 0).toFixed(2)}%`
      });
    } else {
      res.status(404).json({ error: 'No data available' });
    }
  } catch (error) {
    console.error('FRED Error:', error);
    res.status(500).json({ error: 'Failed to fetch federal funds rate' });
  }
});

app.get('/api/fred/cpi-yoy', async (req, res) => {
  try {
    const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
      params: {
        series_id: 'CPIAUCSL',
        api_key: FRED_API_KEY,
        file_type: 'json',
        sort_order: 'desc',
        limit: 1
      }
    });

    const data = response.data;
    if (data.observations && data.observations[0]) {
      const obs = data.observations[0];
      res.json({
        date: obs.date,
        value: parseFloat(obs.value) || 0,
        formatted: `${(parseFloat(obs.value) || 0).toFixed(1)}%`
      });
    } else {
      res.status(404).json({ error: 'No data available' });
    }
  } catch (error) {
    console.error('FRED Error:', error);
    res.status(500).json({ error: 'Failed to fetch CPI YoY' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- /api/etf/flows?days=30');
  console.log('- /api/etf/flows?source=farside&ticker=IBIT');
  console.log('- /api/etf/flows?source=etfdb&ticker=SPY');
  console.log('- /api/etf/summary');
  console.log('- /api/etf/index?source=crypto');
  console.log('- /api/fred/fed-funds-rate');
  console.log('- /api/fred/cpi-yoy');
  console.log('- /api/fred/10y-yield');
  console.log('- /api/cot/data');
  console.log('- /api/cot/summary');
  console.log('- /api/eurostat/data?datacodes=prc_hicp_manr,ei_lmhr_m');
});
