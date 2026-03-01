# Nova Capital Terminal 🚀

A real-time financial intelligence dashboard built with **React**, **Vite**, and **Express**. Designed for institutional-grade market analysis with a Bloomberg-inspired terminal UI.

## Features

### 📊 Macro Dashboard
Live economic indicators via **FRED API** — CPI, Fed Funds Rate, Treasury Yields, Unemployment, Core PCE, and more. Auto-refreshing data with visual time-series charts.

### 📰 News Terminal
Multi-source RSS aggregation from CNBC, MarketWatch, and Investing.com. Includes keyword-based **sentiment analysis** (bullish/bearish) and geopolitical event classification.

### 📈 COT Positioning
Commitment of Traders data from **CFTC** covering Equities, Commodities, Currencies, Metals, Energy, and Financials. Tracks commercial vs non-commercial net positioning.

### 🔄 ETF Flows
Live ETF flow tracking with support for both **Farside ETF Investors** (crypto) and **ETFDB** (stocks). Includes scraping, Supabase storage, and historical charting.

### ⚡ Nasdaq Equities & Options _(Updated)_
Live-scraped data from **nasdaq.com** using Playwright headless browser:
- **Options Chain** — Full chain with Calls/Puts, Volume, and Open Interest displayed inline
- **Institutional Flows** — Top institutional holders, share changes, and 13F filing data
- **Earnings & EPS** — Historical earnings per share with consensus vs reported vs surprise
- **Financials** — _(Coming soon)_

### 📁 Local Vault
Persistent local data storage for custom research notes and saved analysis.

### 🎯 Most Shorted Stocks
Live-scraped high short interest data (50+ stocks) with market cap, short dollar value, and sortable columns.

---

## Quick Start

### Prerequisites
- **Node.js** (v18+) — `brew install node`
- **Python 3** with `playwright` and `playwright-stealth`:
  ```bash
  pip3 install playwright playwright-stealth
  python3 -m playwright install firefox
  ```

### Installation
```bash
git clone https://github.com/typesparky/nova-dashboard.git
cd nova-dashboard
npm install
```

### Environment Variables
Copy the example and add your API keys (optional — dashboard works with defaults):
```bash
cp .env.example .env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `FRED_API_KEY` | FRED economic data | Optional |
| `NASDAQ_API_KEY` | Nasdaq/Quandl COT data | Optional |
| `COINGLASS_API_KEY` | CoinGlass ETF flows | Optional |
| `DATABASE_URL` | Supabase/PostgreSQL connection | Optional |

### Running the Dashboard

You need **two terminals**:

```bash
# Terminal 1 — Frontend (Vite dev server)
npm run dev
```

```bash
# Terminal 2 — Backend (Express API server)
node server.js
```

Then open **http://localhost:5173** in your browser.

---

## Architecture

```
nova-dashboard/
├── src/                    # React frontend (Vite)
│   ├── components/         # Dashboard tabs (Macro, News, COT, ETF, Options, etc.)
│   ├── data/               # API hooks, mock data, configs
│   └── services/           # Service layer
├── server/                 # Express backend
│   ├── scripts/            # Python scrapers (Nasdaq, ETFDB, Short Interest)
│   ├── scraper/            # Node.js ETF scrapers
│   ├── db/                 # Supabase/PostgreSQL connection
│   ├── jobs/               # Cron job scheduler
│   └── config/             # ETF list configuration
├── server.js               # Express entry point (port 3000)
├── vite.config.js          # Vite config with API proxy rules
└── .env.example            # Environment variable template
```

### Data Flow
- **Frontend** → Vite dev server (port 5173)
- **API calls** → Vite proxies `/api/*` to Express backend (port 3000)
- **Nasdaq scraping** → Express spawns Python Playwright scripts
- **ETF/COT data** → Express fetches from CFTC, FRED, Farside, ETFDB APIs
- **Persistence** → Supabase/PostgreSQL (optional)

---

## Recent Updates (dev branch)

### Nasdaq Options — Improved Table Layout
- **Volume (VOL)** and **Open Interest (OI)** columns are now displayed inline with their respective Calls and Puts sections (standard options chain layout)
- Previously these were awkwardly grouped at the far right, making the data hard to read

### Nasdaq Scraper — Error Handling Fix
- Frontend now gracefully handles cases where the backend server isn't running
- Shows a clear error message instead of crashing with `"Failed to execute 'json' on 'Response'"`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, Recharts, Lucide Icons |
| Backend | Express 5, Node.js |
| Scraping | Python Playwright + Stealth, Cheerio, JSDOM |
| Database | PostgreSQL via Supabase (optional) |
| Build | Vite 7 |

---

## License

Private repository. All rights reserved.
