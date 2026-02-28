import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // CNBC RSS feeds
      '/api/rss/cnbc': {
        target: 'https://search.cnbc.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/cnbc/, ''),
      },
      // MarketWatch RSS feeds
      '/api/rss/marketwatch': {
        target: 'https://feeds.marketwatch.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/marketwatch/, ''),
      },
      // Investing.com RSS feeds
      '/api/rss/investing': {
        target: 'https://www.investing.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rss\/investing/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NovaCapital/1.0)',
        },
      },
      // FRED API
      '/api/fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fred/, ''),
      },
      // CoinGlass API
      '/api/coinglass': {
        target: 'https://open-api-v3.coinglass.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coinglass/, ''),
      },
      // Backend API
      '/api/cot': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/etf': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Nasdaq API
      '/api/nasdaq': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Short Interest API
      '/api/short-interest': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // CFTC Public Reporting API (Socrata) - Alternative direct proxy
      '/api/cftc': {
        target: 'https://publicreporting.cftc.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cftc/, ''),
      },
    },
  },
})
