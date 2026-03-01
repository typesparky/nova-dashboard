# Quick Start Guide

## Get Started in 3 Minutes

### Option 1: With Real Data (Recommended)

**1. Install Dependencies**
```bash
cd /Users/robertalexandrou/.gemini/antigravity/scratch/nova-dashboard
npm install express cors axios
```

**2. Set Up API Keys**
```bash
cp .env.example .env
# Edit .env and add your API keys:
# - FRED_API_KEY (https://fred.stlouisfed.org/docs/api/api_key.html)
# - COINGLASS_API_KEY (https://www.coinglass.com/api)
# - NASDAQ_API_KEY (https://data.nasdaq.com/)
```

**3. Start Backend**
```bash
node server.js
# Backend will start on http://localhost:3000
```

**4. Start Frontend (New Terminal)**
```bash
npm run dev
# Frontend will start on http://localhost:5173
```

### Option 2: With Mock Data

```bash
npm run dev
# Frontend will use mock data (no backend required)
```

## Dashboard Navigation

**F1** - MACRO Dashboard - Economic indicators and news
**F2** - NEWS Terminal - Live market news
**F3** - COT Positioning - Commitments of Traders data
**F4** - ETF FLOWS - Real-time Bitcoin ETF flows
**F5** - INSIDER Tracking - Insider trading data
**F6** - VAULT - Local storage

## Quick Commands

**Check Setup:**
```bash
./setup-check.sh
```

**Lint Check:**
```bash
npm run lint
```

**Build for Production:**
```bash
npm run build
```

**Preview Production Build:**
```bash
npm run preview
```

## Common Issues

**Backend won't start:**
- Check if port 3000 is in use: `lsof -i :3000`
- Install missing dependencies: `npm install express cors axios`
- Check .env file format

**Frontend can't connect:**
- Ensure backend is running
- Check terminal output for errors
- Try refreshing the page

**No data showing:**
- Check browser console for errors
- Verify API keys are valid
- Check network connectivity
- Try with mock data to rule out API issues

## What's Working

✅ ETF Flows (Real-time from CoinGlass)
✅ COT Data (Historical from Nasdaq)
✅ FRED Data (Live economic indicators)
✅ Eurostat Data (European statistics)
✅ News Feeds (Live market news)
✅ Loading States
✅ Error Handling
✅ Mock Data Fallback

## Need Help?

1. Run the setup check: `./setup-check.sh`
2. Check SETUP.md for detailed instructions
3. Check README_DATA.md for technical details
4. Check INTEGRATION_SUMMARY.md for overview

---

**Ready to start!** 🚀
