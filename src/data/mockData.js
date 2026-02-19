// ═══════════════════════════════════════════════════════════════════════════════
//  UrbanKaoberg — Data Layer
//  NO FAKE DATA. Only real API calls or empty states.
//  Empty = "not yet wired" → components show clear missing-data indicators.
// ═══════════════════════════════════════════════════════════════════════════════

import { etfService, fredService, cotService, eurostatService } from '../services/dataServices';

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

export const fetchMacroData = async () => {
  try {
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
    console.warn('[NO DATA] Backend offline — showing empty state');
    return macroIndicators;
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

export const fetchEtfFlows = async (days = 30, source = 'auto') => {
  try {
    const data = await etfService.getEtfFlows('IBIT', days, source);
    if (!data || !data.chartData || data.chartData.length === 0) throw new Error('No ETF data');

    const issuers = ['IBIT', 'FBTC', 'GBTC', 'ARKB', 'BITB', 'HODL', 'ETHA', 'EFCT', 'SOLH'];
    const chartData = data.chartData;
    return { chartData, issuers, sourceUsed: data.sourceUsed };
  } catch (error) {
    console.warn('[NO DATA] ETF Flows — needs backend with pixel extraction');
    return { chartData: [], issuers: etfIssuers, sourceUsed: 'auto' };
  }
};

export const fetchEtfSummary = async () => {
  try {
    const summary = await etfService.getEtfSummary();
    const flows = await etfService.getSpotEtfFlows();
    return { ...summary, spotFlows: flows };
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
  { id: 'insider', label: 'INSIDER', shortcut: 'F5' },
  { id: 'vault', label: 'VAULT', shortcut: 'F6' },
];
