// ============================================================================
// API / Data Fetching — Nova Capital
// Live data integration: RSS feeds, FRED API, with mock fallbacks
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

// ---- GENERIC FETCH HOOK ----------------------------------------------------

/**
 * Generic data-fetching hook with terminal-style error states and auto-refresh.
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} deps - Dependency array for re-fetching
 * @param {number} refreshInterval - Auto-refresh interval in ms (0 = disabled)
 */
export function useFetch(fetchFn, deps = [], refreshInterval = 0) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const intervalRef = useRef(null);

    const execute = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        setErrorMsg('');
        try {
            const result = await fetchFn();
            setData(result);
        } catch (err) {
            setIsError(true);
            setErrorMsg(`[SYS ERR] ${err.message || 'Connection timeout'}`);
            console.error('[Nova Capital] Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        execute();
        if (refreshInterval > 0) {
            intervalRef.current = setInterval(execute, refreshInterval);
            return () => clearInterval(intervalRef.current);
        }
    }, [execute, refreshInterval]);

    return { data, isLoading, isError, errorMsg, refetch: execute };
}

/**
 * Terminal-style loading indicator component
 */
export function TerminalLoader({ label = 'LOADING' }) {
    const [dots, setDots] = useState('');
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 400);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="text-text-secondary text-xs font-mono p-4">
            {'>'} {label}{dots}<span className="cursor-blink">_</span>
        </div>
    );
}

/**
 * Terminal-style error display
 */
export function TerminalError({ message }) {
    return (
        <div className="text-neon-red text-xs font-mono p-4">
            <div>{'>'} DATA_FEED_OFFLINE</div>
            <div className="text-text-muted mt-1">{message}</div>
            <div className="text-text-muted mt-1">{'>'} Falling back to cached data<span className="cursor-blink">_</span></div>
        </div>
    );
}

// ---- RSS FEED CONFIGURATION ------------------------------------------------

export const RSS_FEEDS = {
    // CNBC feed IDs: https://www.cnbc.com/rss-feeds/
    cnbc_business: '/api/rss/cnbc/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147',
    cnbc_economy: '/api/rss/cnbc/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258',
    cnbc_finance: '/api/rss/cnbc/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
    cnbc_investing: '/api/rss/cnbc/rs/search/combinedcms/view.xml?partnerId=wrss01&id=15839069',
    cnbc_top: '/api/rss/cnbc/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
};

// Category mapping for news classification
const FEED_CATEGORIES = {
    cnbc_business: 'Business',
    cnbc_economy: 'US Economy',
    cnbc_finance: 'Finance',
    cnbc_investing: 'Investing',
    cnbc_top: 'Top News',
};

// ---- RSS XML PARSER --------------------------------------------------------

/**
 * Parse RSS XML string into structured news items
 */
function parseRSSXml(xmlText, source = 'Unknown', category = 'General') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error('Failed to parse RSS XML');
    }

    const items = doc.querySelectorAll('item');
    const articles = [];

    items.forEach((item, idx) => {
        const title = item.querySelector('title')?.textContent?.trim() || '';
        const link = item.querySelector('link')?.textContent?.trim() || '';
        const description = item.querySelector('description')?.textContent?.trim() || '';
        const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';

        // Clean up CDATA wrappers
        const cleanTitle = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');
        const cleanDesc = description.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

        // Parse time
        const date = new Date(pubDate);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        // Run sentiment analysis
        const sentiment = analyzeSentiment(cleanTitle + ' ' + cleanDesc);

        articles.push({
            id: `${source}-${idx}-${Date.now()}`,
            category,
            time: timeStr,
            headline: cleanTitle,
            description: cleanDesc,
            link,
            source,
            sentiment,
            pubDate: date,
        });
    });

    return articles;
}

// ---- KEYWORD-BASED SENTIMENT ANALYSIS --------------------------------------

const BULLISH_KEYWORDS = [
    'surge', 'surges', 'surging', 'jump', 'jumps', 'soar', 'soars', 'rally', 'rallies',
    'gain', 'gains', 'rise', 'rises', 'rising', 'beat', 'beats', 'strong', 'growth',
    'record high', 'all-time high', 'outperform', 'upgrade', 'buy', 'bullish',
    'boom', 'accelerat', 'recover', 'optimism', 'positive', 'upbeat', 'robust',
    'expansion', 'profit', 'earnings beat', 'tops estimate', 'above estimate',
    'better than expected', 'revenue jump', 'sales surge', 'breakthrough',
];

const BEARISH_KEYWORDS = [
    'fall', 'falls', 'falling', 'drop', 'drops', 'plunge', 'plunges', 'crash',
    'decline', 'declines', 'sink', 'sinks', 'tumble', 'tumbles', 'slump',
    'cut', 'cuts', 'miss', 'misses', 'weak', 'warning', 'warns', 'risk',
    'recession', 'layoff', 'layoffs', 'downturn', 'bearish', 'downgrade',
    'sell-off', 'selloff', 'loss', 'losses', 'below estimate', 'miss estimate',
    'worse than expected', 'disappointing', 'threat', 'crisis', 'fears',
    'tariff', 'sanctions', 'war', 'conflict', 'shutdown', 'inflation spike',
];

function analyzeSentiment(text) {
    const lower = text.toLowerCase();
    let bullishScore = 0;
    let bearishScore = 0;

    BULLISH_KEYWORDS.forEach(kw => {
        if (lower.includes(kw)) bullishScore++;
    });
    BEARISH_KEYWORDS.forEach(kw => {
        if (lower.includes(kw)) bearishScore++;
    });

    if (bullishScore > bearishScore) return 'bullish';
    if (bearishScore > bullishScore) return 'bearish';
    return 'neutral';
}

// ---- FETCH FUNCTIONS -------------------------------------------------------

/**
 * Fetch and parse multiple RSS feeds in parallel
 * Returns an array of news articles sorted by date (newest first)
 */
export async function fetchAllNews() {
    const feedEntries = Object.entries(RSS_FEEDS);

    const results = await Promise.allSettled(
        feedEntries.map(async ([key, url]) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status} for ${key}`);
            const xmlText = await res.text();
            const source = key.startsWith('cnbc') ? 'CNBC' : 'MarketWatch';
            const category = FEED_CATEGORIES[key] || 'General';
            return parseRSSXml(xmlText, source, category);
        })
    );

    const allArticles = [];
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            allArticles.push(...result.value);
        }
    });

    // Deduplicate by headline similarity and sort by date
    const seen = new Set();
    const unique = allArticles.filter(a => {
        const key = a.headline.slice(0, 60).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    unique.sort((a, b) => b.pubDate - a.pubDate);
    return unique;
}

/**
 * Fetch FRED economic time-series data
 * @param {string} seriesId - FRED series ID (e.g., 'CPIAUCSL', 'FEDFUNDS')
 * @param {string} startDate - Start date in YYYY-MM-DD format
 */
export async function fetchFREDSeries(seriesId, startDate = '2019-01-01', units = 'lin') {
    const apiKey = import.meta.env.VITE_FRED_API_KEY;
    if (!apiKey) {
        throw new Error('FRED API key not configured. Set VITE_FRED_API_KEY in .env');
    }

    const url = `/api/fred/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&observation_start=${startDate}&sort_order=asc&units=${units}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED API returned ${res.status}`);
    const json = await res.json();

    if (!json.observations) throw new Error('No observations in FRED response');

    return json.observations
        .filter(obs => obs.value !== '.')
        .map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value),
        }));
}

// FRED series ID mapping for the macro dashboard
// units: 'pc1' = YoY percent change, 'lin' = raw value (already %)
export const FRED_SERIES = {
    'CPI YoY': { id: 'CPIAUCSL', units: 'pc1' },          // CPI → YoY % change
    'Fed Funds Rate': { id: 'FEDFUNDS', units: 'lin' },     // Already in %
    'Core PCE': { id: 'PCEPILFE', units: 'pc1' },           // PCE → YoY % change
    '10Y Treasury': { id: 'DGS10', units: 'lin' },          // Already in %
    'Unemployment': { id: 'UNRATE', units: 'lin' },          // Already in %
};

/**
 * Fetch COT (Commitment of Traders) data from CFTC Socrata API
 * @param {string} contractCode - CFTC contract code
 * @param {number} limit - Number of reports to fetch (default 52 for 1 year)
 */
export async function fetchCOTSeries(contractCode, limit = 52) {
    // Using the clean backend endpoint I just implemented in server.js
    const url = `/api/cot/socrata?limit=${limit}&market=${contractCode}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`COT API returned ${res.status}`);
    const data = await res.json();

    return data.filter(d => d.report_date_as_yyyy_mm_dd).map(d => {
        const parse = (val) => {
            const num = parseInt(val);
            return isNaN(num) ? 0 : num;
        };
        const parseF = (val) => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        const ncLong = parse(d.noncomm_positions_long_all);
        const ncShort = parse(d.noncomm_positions_short_all);
        const cLong = parse(d.comm_positions_long_all);
        const cShort = parse(d.comm_positions_short_all);

        return {
            date: d.report_date_as_yyyy_mm_dd.split('T')[0],
            asset: d.contract_market_name || d.commodity_name || 'Unknown',
            openInterest: parse(d.open_interest_all),
            nonCommLong: ncLong,
            nonCommShort: ncShort,
            nonCommSpread: parse(d.noncomm_postions_spread_all || d.noncomm_positions_spread || d.noncomm_positions_spread_all || 0),
            commLong: cLong,
            commShort: cShort,
            netNonComm: ncLong - ncShort,
            netComm: cLong - cShort,
            changeNonCommLong: parse(d.change_in_noncomm_long_all || 0),
            changeNonCommShort: parse(d.change_in_noncomm_short_all || 0),
            pctOINonCommLong: parseF(d.pct_of_oi_noncomm_long_all || 0),
            pctOINonCommShort: parseF(d.pct_of_oi_noncomm_short_all || 0),
        };
    });
}

// Comprehensive COT Assets mapping
export const COT_ASSETS = [
    { id: '13874A', label: 'S&P 500 (E-Mini)', category: 'Indices' },
    { id: '209742', label: 'Nasdaq 100 (Mini)', category: 'Indices' },
    { id: '12460A', label: 'Dow Jones (Mini)', category: 'Indices' },
    { id: '239742', label: 'Russell 2000 (Mini)', category: 'Indices' },
    { id: '088691', label: 'Gold', category: 'Metals' },
    { id: '084691', label: 'Silver', category: 'Metals' },
    { id: '06765A', label: 'Crude Oil (WTI)', category: 'Energies' },
    { id: '023391', label: 'Natural Gas', category: 'Energies' },
    { id: '099741', label: 'Euro FX', category: 'Currencies' },
    { id: '096742', label: 'British Pound', category: 'Currencies' },
    { id: '097741', label: 'Japanese Yen', category: 'Currencies' },
    { id: '098662', label: 'U.S. Dollar Index', category: 'Currencies' },
    { id: '043602', label: '10Y Treasury Note', category: 'Financials' },
    { id: '042601', label: '2Y Treasury Note', category: 'Financials' },
    { id: '045601', label: 'Fed Funds', category: 'Financials' },
    { id: '133741', label: 'Bitcoin', category: 'Crypto' },
];

/**
 * Fetch CoinGlass ETF flow data (requires API key)
 * TODO: Register at https://www.coinglass.com/pricing for free API key
 */
export async function fetchETFFlows() {
    const apiKey = import.meta.env.VITE_COINGLASS_API_KEY;
    if (!apiKey) {
        throw new Error('CoinGlass API key not configured. Set VITE_COINGLASS_API_KEY in .env');
    }

    const res = await fetch('/api/coinglass/api/etf/v3/etf-flow-history?symbol=BTC', {
        headers: { 'CG-API-KEY': apiKey },
    });
    if (!res.ok) throw new Error(`CoinGlass API returned ${res.status}`);
    return res.json();
}

/**
 * Classify a news article by geopolitical/economic category based on content
 */
export function classifyNewsCategory(headline, description = '') {
    const text = (headline + ' ' + description).toLowerCase();

    const geopoliticsKw = ['china', 'russia', 'ukraine', 'taiwan', 'iran', 'nato', 'military',
        'sanctions', 'geopolit', 'war', 'missile', 'nuclear', 'diplomat', 'territory',
        'red sea', 'shipping', 'opec', 'middle east', 'israel', 'gaza', 'hamas'];
    const usEconKw = ['fed', 'federal reserve', 'cpi', 'inflation', 'gdp', 'jobs', 'payroll',
        'unemployment', 'interest rate', 'treasury', 'housing', 'consumer', 'retail sales',
        'pce', 'pmi', 'ism', 'fomc', 'monetary policy', 'fiscal', 'deficit', 'debt ceiling',
        'congress', 'white house', 'tariff'];
    const globalKw = ['ecb', 'boj', 'boe', 'central bank', 'global', 'emerging market',
        'eurozone', 'europe', 'asia', 'india', 'brazil', 'imf', 'world bank',
        'currency', 'forex', 'yuan', 'yen', 'euro'];

    const geoScore = geopoliticsKw.filter(kw => text.includes(kw)).length;
    const usScore = usEconKw.filter(kw => text.includes(kw)).length;
    const globalScore = globalKw.filter(kw => text.includes(kw)).length;

    if (geoScore >= usScore && geoScore >= globalScore && geoScore > 0) return 'Geopolitics';
    if (usScore >= globalScore && usScore > 0) return 'US Economy';
    if (globalScore > 0) return 'Global';
    return 'Business';
}
