# Nova Capital Dashboard - Setup Instructions

## Overview

This dashboard integrates real-time data from multiple sources including:
- **ETF Flows**: CoinGlass API for Bitcoin ETF flows
- **FRED Data**: Federal Reserve Economic Data for US economic indicators
- **COT Data**: Nasdaq Data Link for Commitments of Traders data
- **Eurostat Data**: European statistics
- **News Feeds**: CNBC, MarketWatch RSS feeds

## Prerequisites

- Node.js (v20+ or v22+)
- npm or yarn
- FRED API Key (optional, for live economic data)
- CoinGlass API Key (optional, for ETF flows)
- Nasdaq API Key (optional, for COT data)

## Setup Steps

### 1. Backend Server

The backend server handles API requests to external data sources and provides ETF indexing.

```bash
# Install backend dependencies
npm install express cors axios jsdom

# Create .env file for backend
cat > .env << 'EOF'
PORT=3000
FRED_API_KEY=your_fred_api_key_here
NASDAQ_API_KEY=your_nasdaq_api_key_here
EOF

# Start the backend server
node server.js
```

**Available Endpoints:**
- `/api/etf/flows` - ETF flow data (pixel extraction from Highcharts)
- `/api/etf/index` - ETF index database
- `/api/etf/info` - ETF details
- `/api/fred/*` - FRED economic data
- `/api/cot/*` - COT analysis
- `/api/eurostat/*` - Eurostat data

### 2. ETF Index Server (Optional)

For enhanced ETF functionality, you can run the dedicated ETF index server:

```bash
node server_etf_index.js
```

**ETF Index Features:**
- Live ETF database from Farside ETF Investors
- Searchable ETF index with metadata
- Source-agnostic ETF information
- Real-time updates available

**Available ETF Index Endpoints:**
- `GET /api/etf/index?source=farside` - Get Farside ETF index
- `GET /api/etf/index?source=etfdb` - Get ETFDB ETF index
- `GET /api/etf/info?ticker=IBIT&source=farside` - Get ETF details

The backend will run on `http://localhost:3000` and provide the following endpoints:

### ETF Operations
- `/api/etf/flows?days=30` - Get ETF flows data (ETFDB pixel extraction)
- `/api/etf/flows?source=farside&ticker=IBIT&days=30` - Get Farside ETF flows
- `/api/etf/summary` - Get ETF summary statistics
- `/api/etf/index?source=farside` - Get ETF index database
- `/api/etf/info?ticker=IBIT&source=farside` - Get ETF details

### Economic Data
- `/api/fred/fed-funds-rate` - Get Federal Funds Rate
- `/api/fred/cpi-yoy` - Get CPI YoY change
- `/api/fred/10y-yield` - Get 10-Year Treasury Yield
- `/api/fred/economic` - Get general economic data

### COT Analysis
- `/api/cot/data?category=All` - Get COT data
- `/api/cot/summary` - Get COT summary
- `/api/cot/filtered` - Get filtered COT data
- `/api/cot/analysis` - Get advanced COT analysis

### Eurostat Data
- `/api/eurostat/data?datacodes=prc_hicp_manr` - Get Eurostat data
- `/api/eurostat/flags-process` - Process Eurostat data flags
- `/api/eurostat/long-format` - Get Eurostat long format data

### 2. Frontend Setup

```bash
# Install frontend dependencies
npm install

# Create .env file for frontend (if needed)
cat > .env << 'EOF'
VITE_FRED_API_KEY=your_fred_api_key_here
EOF

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173` (or similar port) and connect to the backend server.

### 3. Run Both Together

For the complete setup with real-time data, run both servers:

**Terminal 1 - Backend:**
```bash
node server.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 4. Using Mock Data

If you don't have API keys, the dashboard will fall back to mock data. To use mock data only:

```bash
# Frontend only (no backend needed)
npm run dev
```

## API Keys

### FRED API Key
Get one from: https://fred.stlouisfed.org/docs/api/api_key.html

### CoinGlass API Key
Get one from: https://www.coinglass.com/api

### Nasdaq Data Link API Key
Get one from: https://data.nasdaq.com/

## Available Data Sources

### ETF Flows
- **ETFDB.com Pixel Extraction**: Advanced Highcharts SVG parsing for detailed flow data
- **Farside ETF Investors**: Comprehensive crypto ETF database and real-time flow tracking
- **Multi-Source Support**: Configurable data sources for different ETF categories
- **Historical Coverage**: 10-year historical data available
- **ETF Index System**: Real-time ETF database with searchable capabilities

### ETF Index System 🆕
- **Live ETF Database**: Real-time ETF listings from Farside ETF Investors
- **Searchable Index**: Easy lookup by ticker or name
- **Metadata Details**: Includes source, category, and full name
- **Source Agnostic**: Supports both Farside and ETFDB sources
- **API Access**: RESTful endpoints for programmatic access

### FRED Data
- Federal Funds Rate
- CPI YoY Change
- 10-Year Treasury Yield
- Unemployment Rate

### COT Data
- Commitments of Traders positions
- Multiple categories: Equities, Metals, Energy, Currencies, Rates, Agriculture
- Historical data from Nasdaq Data Link

### Eurostat Data
- European economic indicators
- Inflation, unemployment, GDP data
- Multiple data codes available

### News Feeds
- CNBC RSS feeds
- MarketWatch RSS feeds
- Classified by category and sentiment

## Customization

### Adding New ETFs
Edit `server.js` in the ETF flows section to add or remove ETF tickers.

### Adding New FRED Series
Add new series to the `SERIES_CONFIG` object in `src/services/dataServices.js`.

### Adding New Eurostat Data Codes
Add data codes to the `EUROSTAT_DATACODES` array in `server.js`.

## Troubleshooting

### Backend Won't Start
- Check if port 3000 is already in use: `lsof -i :3000`
- Verify all dependencies are installed: `npm install`
- Check .env file is properly formatted

### Frontend Can't Connect to Backend
- Ensure backend server is running
- Check CORS settings in backend
- Verify proxy configuration in `vite.config.js`

### API Keys Not Working
- Verify API keys are correct in .env files
- Check API key expiration status
- Review API usage limits

### Data Not Loading
- Check browser console for errors
- Verify network connectivity to API endpoints
- Confirm API keys are not expired

## Project Structure

```
nova-dashboard/
├── server.js              # Backend API server
├── src/
│   ├── components/        # React components
│   │   ├── EtfFlows.jsx           # ETF flows component
│   │   ├── CotPositioning.jsx     # COT data component
│   │   ├── MacroDashboard.jsx      # Macro data dashboard
│   │   └── NewsTerminal.jsx        # News terminal
│   ├── data/
│   │   └── mockData.js             # Data fetching services
│   └── services/
│       └── dataServices.js        # API service functions
├── package.json           # Project dependencies
└── vite.config.js         # Vite configuration
```

## Development Tips

- Use `npm run dev` for development with hot reload
- Use `npm run build` to create production builds
- Use `npm run lint` to check code quality
- Use `npm run preview` to preview production builds

## License

Private project for Nova Capital
