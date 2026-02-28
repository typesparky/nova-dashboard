// ═══════════════════════════════════════════════════════════════════════════════
//  UrbanKaoberg — Data Layer
//  NO FAKE DATA. Only real API calls or empty states.
//  Empty = "not yet wired" → components show clear missing-data indicators.
// ═══════════════════════════════════════════════════════════════════════════════

import { etfService, fredService, cotService, eurostatService } from '../services/dataServices';
import etfDatabase from './etfDatabase.json';

// ─── Constants ───────────────────────────────────────────────────────────────
export const etfIssuers = ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB', 'HODL', 'ETHA', 'EFCT', 'SOLH'];

export const etfColors = {
  IBIT: '#00d4ff',
  FBTC: '#00ff88',
  GBTC: '#ff3366',
  ARKB: '#ffcc00',
  BITB: '#a78bfa',
  HODL: '#f97316',
  ETHA: '#06b6d4',
  EFCT: '#ec4899',
  SOLH: '#f59e0b'
};

export const timeRanges = ['1M', '3M', '6M', '1Y', '5Y'];

// ─── Empty chart data (structure only, no fake values) ───────────────────────
export const macroChartData = {
  'CPI YoY': [],
  'Fed Funds Rate': [],
  'Core PCE': [],
  '10Y Treasury': [],
  'Unemployment': [],
};

// ─── Empty indicator cards → show "——" / "NEEDS DATA" ────────────────────────
export const macroIndicators = {
  rates: [
    { label: 'Fed Funds', value: '——', change: null, unit: 'bps', isMock: true },
    { label: '10Y Treasury', value: '——', change: null, unit: 'bps', isMock: true },
    { label: '10Y-2Y Spread', value: '——', change: null, unit: 'bps', isMock: true },
    { label: '30Y Mortgage', value: '——', change: null, unit: 'bps', isMock: true },
  ],
  inflation: [
    { label: 'CPI YoY', value: '——', change: null, unit: '%', isMock: true },
    { label: 'PPI YoY', value: '——', change: null, unit: '%', isMock: true },
    { label: 'PCE YoY', value: '——', change: null, unit: '%', isMock: true },
    { label: 'Core CPI', value: '——', change: null, unit: '%', isMock: true },
  ],
  labor: [
    { label: 'Unemployment', value: '——', change: null, unit: '%', isMock: true },
    { label: 'Nonfarm Payrolls', value: '——', change: null, unit: 'K', isMock: true },
    { label: 'Avg Hourly Earnings', value: '——', change: null, unit: '%', isMock: true },
    { label: 'Initial Claims', value: '——', change: null, unit: 'K', isMock: true },
  ],
};

// ─── Empty PCE table (weights are real, data is empty) ───────────────────────
export const corePCEComponents = [
  { component: 'Housing', weight: '42.1%', current: '——', prior: '——', change: null, isMock: true },
  { component: 'Medical Care', weight: '8.5%', current: '——', prior: '——', change: null, isMock: true },
  { component: 'Transportation', weight: '5.9%', current: '——', prior: '——', change: null, isMock: true },
  { component: 'Education', weight: '3.2%', current: '——', prior: '——', change: null, isMock: true },
  { component: 'Recreation', weight: '5.6%', current: '——', prior: '——', change: null, isMock: true },
  { component: 'Apparel', weight: '2.7%', current: '——', prior: '——', change: null, isMock: true },
];

// ─── Empty arrays — no fake news, COT, ETF, insider data ────────────────────
export const marketNews = [];
export const portfolioNews = [];
export const cotDataMock = [];
export const etfFlowDataMock = [];
export const insiderDataMock = [];
export const insiderTrades = [];

// ═══════════════════════════════════════════════════════════════════════════════
//  ASYNC FETCH FUNCTIONS — try backend, return empty on failure (no fake data)
// ═══════════════════════════════════════════════════════════════════════════════

import realMacroData from './macroDatabase.json';

export const fetchMacroData = async () => {
  try {
    // Check if backend FRED is available 
    const [fedRate, cpi, tenYield, unemployment] = await Promise.all([
      fredService.getFederalFundsRate(),
      fredService.getCpiYoY(),
      fredService.getTenYearTreasuryYield(),
      fredService.getEconomicData()
    ]);

    if (!fedRate && !cpi && !tenYield && !unemployment) throw new Error('Backend offline');

    return {
      rates: [
        { label: 'Fed Funds', value: fedRate?.formatted || '——', change: null, unit: 'bps', isMock: !fedRate },
        { label: '10Y Treasury', value: tenYield?.formatted || '——', change: null, unit: 'bps', isMock: !tenYield },
        { label: '10Y-2Y Spread', value: '——', change: null, unit: 'bps', isMock: true },
        { label: '30Y Mortgage', value: '——', change: null, unit: 'bps', isMock: true },
      ],
      inflation: [
        { label: 'CPI YoY', value: cpi?.formatted || '——', change: null, unit: '%', isMock: !cpi },
        { label: 'PPI YoY', value: '——', change: null, unit: '%', isMock: true },
        { label: 'PCE YoY', value: '——', change: null, unit: '%', isMock: true },
        { label: 'Core CPI', value: '——', change: null, unit: '%', isMock: true },
      ],
      labor: [
        { label: 'Unemployment', value: unemployment?.unemployment?.formatted || '——', change: null, unit: '%', isMock: !unemployment },
        { label: 'Nonfarm Payrolls', value: '——', change: null, unit: 'K', isMock: true },
        { label: 'Avg Hourly Earnings', value: '——', change: null, unit: '%', isMock: true },
        { label: 'Initial Claims', value: '——', change: null, unit: 'K', isMock: true },
      ],
    };
  } catch (error) {
    console.warn('[USING SCRAPED DATA] Backend offline — using offline macro scraper results.');

    const getVal = (cat, name, isPerc = true) => {
      const item = realMacroData[cat]?.[name];
      if (!item) return { value: '——', change: null, unit: isPerc ? '%' : '', isMock: true };
      return {
        value: item.value,
        change: item.change,
        unit: isPerc ? '%' : (name.includes('Payrolls') || name.includes('Claims') ? 'K' : 'bps'),
        isMock: false
      };
    };

    return {
      rates: [
        { label: 'Fed Funds', ...getVal('rates', 'Fed Funds') },
        { label: '10Y Treasury', ...getVal('rates', '10Y Treasury') },
        { label: '10Y-2Y Spread', ...getVal('rates', '10Y-2Y Spread') },
        { label: '30Y Mortgage', ...getVal('rates', '30Y Mortgage') },
      ],
      inflation: [
        { label: 'CPI YoY', ...getVal('inflation', 'CPI YoY') },
        { label: 'PPI YoY', ...getVal('inflation', 'PPI YoY') },
        { label: 'PCE YoY', ...getVal('inflation', 'PCE YoY') },
        { label: 'Core CPI', ...getVal('inflation', 'Core CPI') },
      ],
      labor: [
        { label: 'Unemployment', ...getVal('labor', 'Unemployment') },
        { label: 'Nonfarm Payrolls', ...getVal('labor', 'Nonfarm Payrolls', false) },
        { label: 'Avg Hourly Earnings', ...getVal('labor', 'Avg Hourly Earnings') },
        { label: 'Initial Claims', ...getVal('labor', 'Initial Claims', false) },
      ],
    };
  }
};

export const fetchMarketNews = async () => [];

export const fetchCotData = async (category = 'All') => {
  try {
    const data = await cotService.getCommitmentData(category);
    if (!data || data.length === 0) throw new Error('No COT data');
    return data;
  } catch (error) {
    console.warn('[NO DATA] COT — needs backend (node server.js) + API key');
    return [];
  }
};

export const fetchEtfFlows = async (ticker = 'IBIT', days = 30, source = 'auto') => {
  try {
    const data = await etfService.getEtfFlows(ticker, days, source);
    if (!data || !data.chartData || data.chartData.length === 0) throw new Error('No ETF data');

    const issuers = ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB', 'HODL', 'ETHA', 'EFCT', 'SOLH'];
    return { chartData: data.chartData, issuers, sourceUsed: data.sourceUsed, summary: data.summary };
  } catch (error) {
    console.warn(`[NO DATA] ETF Flows for ${ticker} — needs backend with pixel extraction`);
    return { chartData: [], issuers: ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB', 'HODL', 'ETHA', 'EFCT', 'SOLH'], sourceUsed: 'auto' };
  }
};

export const fetchEtfIndex = async (source = 'crypto') => {
  try {
    return await etfService.getEtfIndex(source);
  } catch (error) {
    console.warn('[NO DATA] ETF Index — needs backend');
    return [];
  }
};

export const fetchEtfDatabase = () => {
  return etfDatabase;
};

export const fetchEtfSummary = async (source = 'auto') => {
  try {
    const summary = await etfService.getEtfSummary('IBIT', source);
    return summary;
  } catch (error) {
    console.warn('[NO DATA] ETF Summary — needs backend');
    return null;
  }
};

export const fetchInsiderData = async () => {
  try {
    const response = await fetch('/api/insider/data');
    if (!response.ok) throw new Error('Failed');
    return await response.json();
  } catch (error) {
    console.warn('[NO DATA] Insider — needs data source integration');
    return [];
  }
};

export const fetchInsiderTracking = async () => fetchInsiderData();

export const fetchEurostatData = async (datacodes = []) => {
  try {
    return await eurostatService.getEurostatData(datacodes);
  } catch (error) {
    console.warn('[NO DATA] Eurostat — needs backend');
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB LABELS
// ═══════════════════════════════════════════════════════════════════════════════

export const TAB_LABELS = [
  { id: 'macro', label: 'MACRO', shortcut: 'F1' },
  { id: 'news', label: 'NEWS', shortcut: 'F2' },
  { id: 'cot', label: 'COT', shortcut: 'F3' },
  { id: 'etf', label: 'ETF FLOWS', shortcut: 'F4' },
  { id: 'options', label: 'OPTIONS', shortcut: 'F5' },
  { id: 'vault', label: 'VAULT', shortcut: 'F6' },
  { id: 'sector', label: 'SECTOR', shortcut: 'F7' },
];
