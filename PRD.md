# Nova Capital Terminal — Product Requirements Document

> **Purpose**: Feed this PRD to an AI to generate a comprehensive system prompt, task breakdowns, or feature specs for the Nova Capital Terminal project.

---

## 1. Product Overview

**Nova Capital Terminal** is a dark-themed, Bloomberg-style financial intelligence dashboard for individual traders and analysts. It aggregates macro-economic data, ETF flows, options data, short interest intelligence, COT positioning, and market news into a single unified terminal interface — accessible via keyboard shortcuts.

**Audience**: Retail traders, quant-curious investors, macro practitioners who want Bloomberg-tier data without the Bloomberg price tag.

**Tagline**: *UrbanKaoberg Terminal V1.0 — Professional-grade market intelligence at zero cost.*

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS (custom dark theme), Recharts, Lucide icons |
| Backend | Node.js + Express (`server.js`) |
| Database | Supabase (PostgreSQL via `pg`) |
| Scrapers | Python 3 (`requests`, `BeautifulSoup`, `yfinance`) |
| Scheduling | `node-cron` for background jobs |
| Deployment | GitHub repo: `typesparky/nova-dashboard` |

### Key Environment Variables
- `VITE_FRED_API_KEY` — FRED economic data (St. Louis Fed)
- `VITE_COINGLASS_API_KEY` — Crypto ETF flow data
- `DATABASE_URL` — Supabase Postgres connection string
- `PORT` — Backend server port (default 3001)

---

## 3. Application Layout

### Sidebar Navigation (keyboard-driven)
| Key | Tab | Status |
|---|---|---|
| F1 | MACRO | ✅ Working (FRED chart, RSS news, indicator cards) |
| F2 | NEWS | ⚠️ Fixed — now uses RSS feeds (was broken, called missing `/api/news`) |
| F3 | COT | ❌ Backend 500 error on CFTC Socrata API |
| F4 | ETF FLOWS | ⚠️ Crypto auto-loads; TradFi gated behind REQUEST DATA button |
| F5 | OPTIONS | ⚠️ Gated behind REQUEST DATA + ticker search; Python scraper may hit bot protection |
| F6 | VAULT | ✅ Working — client-side CSV/JSON file viewer |
| F7 | MOST SHORTED | ✅ Working — live short interest data with market cap + short $ value sorting |

### Global Header
- Terminal name + session ID
- SPX / DXY / VIX indicators (currently *NO FEED* — no live market data feed connected)
- Market status (MARKET OPEN / CLOSED)
- Clock

### Global Footer
- System status, RAM, session metrics, latency
- Keyboard shortcut hints

---

## 4. Feature Specifications

### F1 — MACRO Dashboard
**Purpose**: Macro economic overview with charting, news, and indicator cards.

**Components**:
- **Chart area** (left): Line chart of FRED time-series data (CPI YoY, Fed Funds Rate, Core PCE, 10Y Treasury, Unemployment). Series selectable via tab buttons. Time range filters: 1M / 3M / 6M / 1Y / 5Y. Falls back to `src/data/macroDatabase.json` when FRED API key is absent.
- **News sidebar** (right, 340px): RSS feeds from CNBC (5 feeds). Sentiment scoring (bullish/bearish/neutral via keyword matching). Category classification (Geopolitics, US Economy, Global, Business, Finance, Investing). Refreshes every 5 minutes.
- **Indicator cards** (bottom bar): Three columns — Rates, Inflation, Labor. Values from `fetchMacroData()` which reads `macroDatabase.json`. Fields: Fed Funds, 10Y Treasury, 10Y-2Y Spread, 30Y Mortgage / CPI YoY, PPI YoY, Core CPI, PCE YoY / Unemployment, Nonfarm Payrolls, Avg Hourly Earnings, Initial Claims.

**Planned addition**: Economic calendar panel showing upcoming data releases (CPI date, NFP date, FOMC, etc.) — to be scraped from BLS/Fed/investing.com.

---

### F2 — NEWS Terminal
**Purpose**: Dedicated full-screen news reader.

**Data source**: Same RSS layer as Macro (`fetchAllNews()` from `src/data/api.jsx`). Feeds: CNBC Business, Economy, Finance, Investing, Top News.

**Features**: Category filter chips, sentiment badges, live/offline indicator, 5-minute auto-refresh.

---

### F3 — COT (Commitment of Traders)
**Purpose**: CFTC positioning data for futures markets.

**Status**: Backend returns 500 from CFTC Socrata API. Needs fix.

**Data source**: `/api/cot/socrata` → CFTC public API.

**Supported assets**: S&P 500, Nasdaq 100, Dow, Russell, Gold, Silver, WTI Crude, Natural Gas, EUR/USD, GBP/USD, JPY/USD, DXY, 10Y Treasury, 2Y Treasury, Fed Funds, Bitcoin.

---

### F4 — ETF FLOWS
**Purpose**: Track ETF fund flow data (how much money flowing in/out daily).

**Data sources**:
- Crypto ETFs (IBIT, FBTC, GBTC, etc.): scraped from Farside Investors (auto-loads on selection)
- TradFi ETFs (SPY, QQQ, DIA, IWM, TLT, GLD, ARKK, VTI): gated behind REQUEST DATA button → `POST /api/etf/trigger-single-scrape`
- Database Explorer: searches etfdb.com for broader ETF info

**Summary cards**: Cumulative BTC Flow, Weekly Net Inflow, Top Accumulator, ETH Holdings, Largest Sell-off.

---

### F5 — OPTIONS (Nasdaq Equities)
**Purpose**: Options chain, institutional flow, earnings, and financial data for any US-listed stock.

**UX Flow**: User types ticker → presses REQUEST DATA → Python scraper runs → data loads.

**Sub-tabs**: Options Chain / Institutional Flows / Earnings & EPS / Financials.

**Data source**: `scrape_nasdaq.py` — scrapes Nasdaq.com. Vulnerable to Cloudflare/PerimeterX bot protection.

**Backend endpoint**: `GET /api/nasdaq/:type/:ticker`

---

### F6 — VAULT
**Purpose**: Private data viewer. Upload CSV or JSON files; view/parse in-terminal.

**Status**: Fully working, 100% client-side.

---

### F7 — MOST SHORTED
**Purpose**: High short interest stock database with market vulnerability metrics.

**Data source**: `scrape_short_interest.py` scrapes [highshortinterest.com](https://highshortinterest.com). Market caps fetched via `yfinance`. Falls back to `src/data/shortInterestData.json` (cached, updated on demand).

**Columns**: Rank, Ticker, Company, Short %, Market Cap, **Short $ Value** (= market cap × short %), Float.

**Sorting**: Clickable column headers — sort by Short %, Short $ Value (dollar exposure), or Market Cap.

**Sidebar**: Highest Short % stock, Largest Short $ Exposure, Total Tracked, Top 10 by dollar value.

**Backend trigger**: `POST /api/short-interest/trigger-scrape` → runs Python scraper → upserts to Supabase.

---

## 5. Data Architecture

### Frontend Data Flow
```
Component → fetch('/api/...') → Express backend → Python scraper / Supabase DB
         ↘ fallback: local JSON cache (shortInterestData.json, macroDatabase.json)
         ↘ fallback: RSS direct fetch (news — proxy via Vite /api/rss/*)
         ↘ fallback: FRED API (via Vite /api/fred/* proxy)
```

### Backend Services (`server.js`)
- `GET /api/short-interest` → Supabase short interest table
- `POST /api/short-interest/trigger-scrape` → spawn `scrape_short_interest.py`
- `GET /api/etf/:ticker` → Supabase ETF flows table
- `POST /api/etf/trigger-single-scrape` → spawn Farside scraper
- `GET /api/nasdaq/:type/:ticker` → spawn `scrape_nasdaq.py`
- `GET /api/cot/socrata` → proxy CFTC Socrata API
- `GET /api/fred/*` → proxy FRED API (avoids CORS)
- `GET /api/rss/*` → proxy CNBC RSS feeds (avoids CORS)
- `GET /api/news` → (deprecated — was unused news backend endpoint)

### Python Scrapers (`server/scripts/`)
| Script | Source | Output |
|---|---|---|
| `scrape_short_interest.py` | highshortinterest.com + yfinance | ticker, shortInterest%, marketCap, shortDollarValue |
| `scrape_nasdaq.py` | nasdaq.com | options chain, institutional data, earnings |
| ETF scraper | farside.co.uk | daily ETF flow history |

---

## 6. Design System

- **Theme**: Dark terminal aesthetic — near-black backgrounds (`#080d12`), monospace font, neon accent colors
- **Color palette**:
  - `neon-cyan` (#00d4ff) — primary interactive / live data
  - `neon-yellow` (#f0c040) — warnings, section headers, short interest
  - `neon-green` (#00ff88) — bullish / live / success
  - `neon-red` (#ff3366) — bearish / errors / short %
  - `text-muted` (#4a5568) — secondary labels
- **Typography**: Monospace throughout (system/terminal font)
- **Interaction patterns**: All tabs accessible via F1–F7 keyboard shortcuts; no mouse required for navigation

---

## 7. Known Issues & Gaps (as of March 2026)

| Issue | Severity | Notes |
|---|---|---|
| COT tab backend 500 error | High | CFTC Socrata API returning errors |
| SPX / DXY / VIX header feeds | Medium | No real-time price feed connected; shows NO FEED |
| Options scraper bot protection | Medium | Cloudflare may block `scrape_nasdaq.py` |
| Economic calendar missing | Medium | Planned feature — upcoming release dates on Macro tab |
| TradFi ETF scraper reliability | Low | Farside.co.uk may change structure |
| macroDatabase.json manually maintained | Low | Should be auto-updated by scheduled scraper |

---

## 8. Roadmap

### Near-term
- [ ] Economic calendar panel on Macro tab (upcoming CPI, NFP, FOMC, PPI dates + times)
- [ ] Fix COT backend 500
- [ ] Auto-update `macroDatabase.json` on a scheduled cron
- [ ] SPX/DXY/VIX live feed (Yahoo Finance websocket or Polygon.io)

### Medium-term
- [ ] Portfolio tracker tab — user inputs holdings, terminal shows P&L and exposure
- [ ] Alerts system — notify when short interest crosses threshold, ETF flow spikes, etc.
- [ ] Authentication — protect the terminal with login
- [ ] Full deployment (Vercel frontend + Railway/Fly.io backend)

### Long-term
- [ ] Mobile-responsive view
- [ ] Export data to CSV from any tab
- [ ] AI commentary layer — GPT-4 summary of current macro regime

---

## 9. Repository & Running Locally

```bash
# Clone
git clone https://github.com/typesparky/nova-dashboard.git
cd nova-dashboard

# Install
npm install
pip3 install requests beautifulsoup4 yfinance

# Environment
cp .env.example .env
# Set VITE_FRED_API_KEY, DATABASE_URL, PORT

# Run (frontend + backend separately)
npm run dev          # Vite frontend on :5173
node server.js       # Express backend on :3001
```

---

*Last updated: March 2026 — Nova Capital Terminal V1.0*
