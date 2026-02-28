import express from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { exec, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './server/db/database.js';
import { startJobs, runScraperJob } from './server/jobs/cron.js';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Jobs
startJobs();

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

// Farside ETF Investors for crypto ETFs
const CRYPTO_ETFS = [
  { ticker: 'IBIT', name: 'iShares Bitcoin Trust', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'FBTC', name: 'Franklin Onchain Bitcoin ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'GBTC', name: 'Grayscale Bitcoin Trust', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'ARKB', name: 'Ark 21Shares Bitcoin ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'BITB', name: 'IBIT Bitcoin ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'HODL', name: 'Purpose Bitcoin ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'ETHA', name: 'Invesco Galaxy Ethereum ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'EFCT', name: 'Franklin Onchain Ethereum ETF', source: 'Farside ETF Investors', category: 'crypto' },
  { ticker: 'SOLH', name: '21Shares Solana ETF', source: 'Farside ETF Investors', category: 'crypto' }
];

// Asset mapping from original project
const ASSET_MAPPING = {
  Currencies: {
    "EURO FX": "099741",
    "BRITISH POUND": "096742",
    "JAPANESE YEN": "097741",
    "SWISS FRANC": "092741",
    "CANADIAN DOLLAR": "090741",
    "AUSTRALIAN DOLLAR": "232741",
    "MEXICAN PESO": "095741",
    "NEW ZEALAND DOLLAR": "112741",
    "U.S. DOLLAR INDEX": "098662"
  },
  Energies: {
    "CRUDE OIL, LIGHT SWEET": "06765A",
    "NATURAL GAS": "023391",
    "HEATING OIL": "022651",
    "GASOLINE RBOB": "111659"
  },
  Metals: {
    "GOLD": "088691",
    "SILVER": "084691",
    "PLATINUM": "076651",
    "PALLADIUM": "075651",
    "COPPER": "085692",
    "ALUMINUM": "191651"
  },
  Indices: {
    "S&P 500 E-MINI": "13874A",
    "NASDAQ 100 E-MINI": "209742",
    "DOW JONES E-MINI": "12460A",
    "RUSSELL 2000 E-MINI": "239742",
    "NIKKEI 225": "240741",
    "VIX": "1170E1"
  },
  Softs: {
    "COCOA": "073732",
    "COFFEE": "083731",
    "COTTON": "037601",
    "SUGAR #11": "080732",
    "ORANGE JUICE": "040701",
    "LUMBER": "058641"
  },
  Grains: {
    "CORN": "002602",
    "SOYBEANS": "005602",
    "SOYBEAN OIL": "007601",
    "SOYBEAN MEAL": "026603",
    "WHEAT (SRW)": "001602",
    "WHEAT (HRW)": "001612",
    "OATS": "004603",
    "ROUGH RICE": "041601"
  },
  Meats: {
    "LIVE CATTLE": "057642",
    "FEEDER CATTLE": "061641",
    "LEAN HOGS": "054642"
  },
  Financials: {
    "US 10Y T-NOTE": "043602",
    "US 5Y T-NOTE": "044601",
    "US 2Y T-NOTE": "042601",
    "30-DAY FED FUNDS": "045601",
    "EURODOLLAR": "033601"
  }
};

// Multi-party definitions from original project
const PARTIES_MAPPING = {
  'non_commercial': ['non_commercial_longs', 'non_commercial_shorts', 'non_commercial_spreads'],
  'commercial': ['commercial_longs', 'commercial_shorts'],
  'total_reportable': ['total_reportable_longs', 'total_reportable_shorts'],
  'non_reportable': ['non_reportable_longs', 'non_reportable_shorts']
};

// Live Scrapers moved to cron job background processor

// Trigger a background manual scrape
app.post('/api/etf/trigger-scrape', async (req, res) => {
  try {
    runScraperJob(); // Async, don't wait for it to finish because it takes 5+ minutes
    res.json({ message: "Background job started successfully. It will populate the db over the next several minutes." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import { scrapeEtfdFlows, scrapeFarsideFlows } from './server/scraper/etf.js';

app.post('/api/etf/trigger-single-scrape', async (req, res) => {
  try {
    const { ticker, days } = req.body;
    if (!ticker) return res.status(400).json({ error: "Ticker is required" });

    const tickerUpper = ticker.toUpperCase();
    const isCrypto = CRYPTO_ETFS.some(e => e.ticker === tickerUpper);

    let chartData = [];
    let sourceName = '';

    if (isCrypto) {
      const result = await scrapeFarsideFlows(tickerUpper, days === 'max' ? 10000 : parseInt(days));
      chartData = result.chartData;
      sourceName = result.source;
    } else {
      chartData = await scrapeEtfdFlows(tickerUpper, days === 'max' ? 10000 : parseInt(days));
      sourceName = 'ETFDB';
    }

    if (!chartData || chartData.length === 0) {
      return res.status(500).json({ error: "Scraping failed: no data returned", ticker: tickerUpper });
    }

    // UPSERT directly to DB
    for (let dataPoint of chartData) {
      const dateKeys = Object.keys(dataPoint).filter(k => k !== 'date');
      const flowVal = dataPoint[dateKeys[0]];

      if (flowVal !== undefined) {
        await db.query(
          `INSERT INTO etf_flows (ticker, date, flow_usd, source) 
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (ticker, date)
                 DO UPDATE SET flow_usd = EXCLUDED.flow_usd, source = EXCLUDED.source`,
          [tickerUpper, dataPoint.date, flowVal, sourceName]
        );
      }
    }

    res.json({ message: "Scraped successfully", count: chartData.length });
  } catch (error) {
    console.error(`Single Scrape Error for ${req.body.ticker}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/etf/flows', async (req, res) => {
  try {
    const ticker = (req.query.ticker || 'IBIT').toUpperCase();
    let days = req.query.days || 30;
    let queryParams = [ticker];
    let limitClause = '';

    if (days !== 'max') {
      const parsedDays = parseInt(days, 10) || 30;
      days = parsedDays;
      queryParams.push(parsedDays);
      limitClause = 'LIMIT $2';
    }

    // Query Supabase directly (instant response)
    const result = await db.query(
      `SELECT date, flow_usd, source 
       FROM etf_flows 
       WHERE ticker = $1 AND flow_usd IS NOT NULL
       ORDER BY date ASC 
       ${limitClause}`,
      queryParams
    );

    const chartData = result.rows.map(row => {
      // Format datetime to YYYY-MM-DD
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      return {
        date: dateStr,
        [ticker]: parseFloat(row.flow_usd)
      };
    });

    const sourceUsed = result.rows.length > 0 ? result.rows[result.rows.length - 1].source : 'Supabase Database';

    res.json({
      ticker: ticker,
      sourceUsed,
      days,
      chartData
    });
  } catch (error) {
    console.error('ETF Flow Error:', error);
    res.status(500).json({ error: 'Failed to fetch ETF flows from DB', message: error.message });
  }
});

app.get('/api/etf/summary', async (req, res) => {
  try {
    const ticker = (req.query.ticker || 'IBIT').toUpperCase();

    // Grab 7 day flows instantly
    const result = await db.query(
      `SELECT flow_usd 
       FROM etf_flows 
       WHERE ticker = $1 
       ORDER BY date DESC 
       LIMIT 7`,
      [ticker]
    );

    const sevenDayNetFlow = result.rows.reduce((sum, row) => sum + parseFloat(row.flow_usd), 0);

    res.json({
      ticker: ticker,
      sourceUsed: 'Database',
      totalBtcFlow: 842190, // We can pull this from summary table later
      sevenDayNetFlow: sevenDayNetFlow.toFixed(2),
      topAccumulator: 'IBIT',
      topAccumulatorFlow: '+$2.1B',
      totalEthHeld: 1250000,
      totalEthValue: '$3.8B'
    });
  } catch (error) {
    console.error('ETF Summary Error:', error);
    res.status(500).json({ error: 'Failed to fetch ETF summary from DB', message: error.message });
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

// COT Data from original project
app.get('/api/cot/data', async (req, res) => {
  try {
    const contract_code = req.query.contract_code || '13874A';
    const api_key = NASDAQ_API_KEY || 'YOUR_NASDAQ_API_KEY';

    const response = await axios.get(`https://data.nasdaq.com/api/v3/datatables/QDL/LFON.json`, {
      params: {
        contract_code: contract_code,
        api_key: api_key,
        limit: 1
      }
    });

    const data = response.data;
    const cotData = [];
    const categories = ['Equities', 'Metals', 'Energy', 'Currencies', 'Rates', 'Agriculture', 'Softs', 'Meats', 'Financials'];

    if (data.datatable && data.datatable.data && data.datatable.data.length > 0) {
      const lastReport = data.datatable.data[0];

      categories.forEach(category => {
        const assets = ASSET_MAPPING[category] || {};
        Object.entries(assets).forEach(([assetName, contractCode]) => {
          const reportTypes = ['commercial', 'non_commercial', 'speculative'];
          const netPosition = { commercials: 0, nonCommercials: 0, speculators: 0 };

          reportTypes.forEach(type => {
            const longKey = `${type}_longs`;
            const shortKey = `${type}_shorts`;

            if (lastReport[longKey] !== undefined) {
              netPosition.commercials += lastReport[longKey];
            }
            if (lastReport[shortKey] !== undefined) {
              netPosition.nonCommercials += lastReport[shortKey];
            }
            if (lastReport[shortKey] !== undefined) {
              netPosition.speculators += lastReport[shortKey];
            }
          });

          const netLong = netPosition.nonCommercials;
          const change = -1234;

          cotData.push({
            asset: assetName,
            category,
            contractCode,
            netLong,
            change,
            commercials: netPosition.commercials,
            nonCommercials: netPosition.nonCommercials,
            speculators: netPosition.speculators
          });
        });
      });
    }

    res.json({
      contract_code,
      cotData,
      asset_mapping: ASSET_MAPPING
    });
  } catch (error) {
    console.error('COT Data Error:', error);
    res.status(500).json({ error: 'Failed to fetch COT data', message: error.message });
  }
});

app.get('/api/cot/socrata', async (req, res) => {
  try {
    const market = req.query.market || '13874A';
    const limit = req.query.limit || 52;
    const response = await axios.get(`https://publicreporting.cftc.gov/resource/6dca-aqww.json`, {
      params: {
        '$limit': limit,
        '$order': 'report_date_as_yyyy_mm_dd DESC',
        'cftc_contract_market_code': market
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('COT Socrata Error:', error);
    res.status(500).json({ error: 'Failed to fetch COT Socrata data', message: error.message });
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

app.get('/api/nasdaq/:type/:ticker', async (req, res) => {
  const ticker = req.params.ticker || 'gxo';
  const scrapeType = req.params.type || 'options';
  const scriptPath = join(__dirname, 'server', 'scripts', 'scrape_nasdaq.py');

  // Pass the type argument to the python script
  const command = `python3 ${scriptPath} ${ticker} --type ${scrapeType} || python ${scriptPath} ${ticker} --type ${scrapeType}`;

  console.log(`Executing Nasdaq ${scrapeType.toUpperCase()} Scraper for ${ticker}...`);

  exec(command, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Nasdaq Execution Error: ${error.message}`);
      return res.status(500).json({ success: false, error: 'Failed to execute scraper', details: error.message });
    }
    if (stderr && !stdout.includes('"success": true')) {
      console.warn(`Nasdaq Stderr: ${stderr}`);
    }

    try {
      // Find the JSON block in the stdout in case playwright logs other stuff
      const jsonStart = stdout.indexOf('{"success"');
      if (jsonStart !== -1) {
        const jsonStr = stdout.substring(jsonStart);
        const parsed = JSON.parse(jsonStr);
        res.json(parsed);
      } else {
        throw new Error("No JSON output found");
      }
    } catch (e) {
      console.error(`Nasdaq Parse Error: ${e.message}`);
      console.log(`Raw stdout: ${stdout.substring(0, 500)}...`);
      res.status(500).json({ success: false, error: 'Failed to parse scraper output' });
    }
  });
});

app.post('/api/short-interest/trigger-scrape', (req, res) => {
  const pythonProcess = spawn('python3', [join(__dirname, 'server', 'scripts', 'scrape_short_interest.py')]);

  let dataString = '';
  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Short Interest Scraper Error: ${data}`);
  });

  pythonProcess.on('close', async (code) => {
    try {
      if (!dataString) throw new Error('No output from scraper');
      const result = JSON.parse(dataString);
      if (result.success && result.data) {
        // Upsert into Supabase
        for (let stock of result.data) {
          await db.query(`
                INSERT INTO short_interest (ticker, company, exchange, short_interest, float_val, target, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                ON CONFLICT (ticker) 
                DO UPDATE SET 
                  company = EXCLUDED.company, 
                  exchange = EXCLUDED.exchange, 
                  short_interest = EXCLUDED.short_interest, 
                  float_val = EXCLUDED.float_val, 
                  target = EXCLUDED.target,
                  updated_at = CURRENT_TIMESTAMP
            `, [stock.ticker, stock.company, stock.exchange, stock.shortInterest, stock.float, stock.target]);
        }
        res.json({ message: "Scraped and stored in Supabase successfully", count: result.data.length });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (e) {
      console.error('Failed to process short interest data into DB:', e);
      res.status(500).json({ success: false, error: 'Failed to process short interest data' });
    }
  });
});

app.get('/api/short-interest', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ticker, company, exchange, short_interest as "shortInterest", float_val as "float", target 
             FROM short_interest 
             ORDER BY CAST(REPLACE(short_interest, '%', '') AS NUMERIC) DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Fetch short interest from DB error:', e);
    res.status(500).json({ success: false, error: 'Database fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- /api/etf/flows?days=30');
  console.log('- /api/etf/summary');
  console.log('- /api/etf/index?source=crypto');
  console.log('- /api/cot/data?contract_code=13874A');
  console.log('- /api/cot/socrata?limit=52&market=13874A');
  console.log('- /api/fred/fed-funds-rate');
  console.log('- /api/short-interest');
});
