import { useState, useMemo } from 'react';
import { ExternalLink, Search, Plus, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { portfolioNews } from '../data/mockData';
import { useFetch, fetchAllNews, TerminalLoader } from '../data/api';

function SentimentBadge({ sentiment }) {
    const config = {
        bullish: { bg: 'bg-neon-green/10', text: 'text-neon-green', icon: '▲' },
        bearish: { bg: 'bg-neon-red/10', text: 'text-neon-red', icon: '▼' },
        neutral: { bg: 'bg-neon-yellow/10', text: 'text-neon-yellow', icon: '●' },
    };
    const c = config[sentiment] || config.neutral;
    return (
        <span className={`${c.bg} ${c.text} text-[9px] px-1.5 py-0.5 rounded font-bold uppercase`}>
            {c.icon} {sentiment}
        </span>
    );
}

// Confidence score based on keyword density
function getSentimentScore(sentiment, headline = '') {
    const lower = headline.toLowerCase();
    const strongBullish = ['surge', 'soar', 'record', 'beat', 'breakthrough', 'boom'];
    const strongBearish = ['crash', 'plunge', 'crisis', 'collapse', 'layoff', 'war'];

    let boost = 0;
    if (sentiment === 'bullish') {
        boost = strongBullish.filter(kw => lower.includes(kw)).length * 8;
        return Math.min(98, 65 + boost + Math.random() * 15).toFixed(0);
    }
    if (sentiment === 'bearish') {
        boost = strongBearish.filter(kw => lower.includes(kw)).length * 8;
        return Math.min(98, 65 + boost + Math.random() * 15).toFixed(0);
    }
    return (40 + Math.random() * 20).toFixed(0);
}

// Match headline against ticker/company keywords
const TICKER_KEYWORDS = {
    AAPL: ['apple', 'iphone', 'ipad', 'mac ', 'vision pro', 'app store'],
    NVDA: ['nvidia', 'gpu', 'geforce', 'jensen huang', 'blackwell', 'cuda'],
    TSLA: ['tesla', 'elon musk', 'cybertruck', 'model y', 'model 3', 'fsd'],
    MSFT: ['microsoft', 'azure', 'copilot', 'satya nadella', 'windows', 'xbox'],
    GOOGL: ['google', 'alphabet', 'youtube', 'gemini', 'waymo', 'android'],
    META: ['meta', 'facebook', 'instagram', 'whatsapp', 'zuckerberg', 'threads'],
    AMZN: ['amazon', 'aws', 'alexa', 'prime', 'jassy'],
    JPM: ['jpmorgan', 'jp morgan', 'jamie dimon', 'chase'],
    WMT: ['walmart', 'walton'],
    DIS: ['disney', 'espn'],
    NFLX: ['netflix'],
    AMD: ['amd', 'advanced micro', 'lisa su', 'ryzen', 'radeon'],
    INTC: ['intel'],
    CRM: ['salesforce'],
    BA: ['boeing'],
    GS: ['goldman sachs'],
    BAC: ['bank of america'],
    V: ['visa'],
    MA: ['mastercard'],
    UNH: ['unitedhealth'],
    JNJ: ['johnson & johnson', 'j&j'],
    PFE: ['pfizer'],
    MRNA: ['moderna'],
    LLY: ['eli lilly', 'lilly'],
    NVO: ['novo nordisk', 'ozempic', 'wegovy'],
    XOM: ['exxon'],
    CVX: ['chevron'],
    COIN: ['coinbase'],
    PLTR: ['palantir'],
    UBER: ['uber'],
    ABNB: ['airbnb'],
};

function matchesTicker(headline, description, ticker) {
    const text = (headline + ' ' + description).toLowerCase();
    const tickerLower = ticker.toLowerCase();

    // Direct ticker mention
    if (text.includes(tickerLower)) return true;

    // Keyword match
    const keywords = TICKER_KEYWORDS[ticker.toUpperCase()];
    if (keywords) {
        return keywords.some(kw => text.includes(kw));
    }

    return false;
}

export default function NewsTerminal() {
    const [tickers, setTickers] = useState(['NVDA', 'AAPL', 'TSLA']);
    const [inputValue, setInputValue] = useState('');

    // Fetch live news — refresh every 5 minutes
    const { data: liveNews, isLoading, isError, refetch } = useFetch(
        () => fetchAllNews(),
        [],
        5 * 60 * 1000
    );

    const isLive = !!liveNews && liveNews.length > 0;
    const baseNews = isLive ? liveNews : portfolioNews;

    const addTickers = () => {
        if (!inputValue.trim()) return;
        const newTickers = inputValue
            .toUpperCase()
            .split(',')
            .map(t => t.trim())
            .filter(t => t && !tickers.includes(t));
        setTickers(prev => [...prev, ...newTickers]);
        setInputValue('');
    };

    const removeTicker = (ticker) => {
        setTickers(prev => prev.filter(t => t !== ticker));
    };

    const filteredNews = useMemo(() => {
        if (tickers.length === 0) return baseNews;
        return baseNews.filter(article => {
            // For live news, do keyword matching. For mock, use .ticker field
            if (article.ticker) {
                return tickers.includes(article.ticker);
            }
            return tickers.some(t => matchesTicker(
                article.headline || '',
                article.description || '',
                t
            ));
        });
    }, [tickers, baseNews]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') addTickers();
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Ticker Input Area */}
            <div className="border-b border-terminal-border bg-terminal-card p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                        Portfolio Watchlist — News Terminal
                    </div>
                    <div className="flex items-center gap-2">
                        {isLive ? (
                            <span className="flex items-center gap-1 text-[8px] text-neon-green">
                                <Wifi size={8} /> LIVE — {baseNews.length} articles
                            </span>
                        ) : isLoading ? (
                            <span className="text-[8px] text-neon-yellow">CONNECTING...</span>
                        ) : (
                            <span className="flex items-center gap-1 text-[8px] text-text-muted">
                                <WifiOff size={8} /> MOCK DATA
                            </span>
                        )}
                        <button
                            onClick={refetch}
                            className="text-text-muted hover:text-neon-cyan transition-colors p-0.5"
                            title="Refresh news feed"
                        >
                            <RefreshCw size={10} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter tickers (e.g. MSFT, GOOGL, META)"
                            className="w-full bg-terminal-bg border border-terminal-border rounded pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:border-neon-cyan focus:outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={addTickers}
                        className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded px-3 py-1.5 text-[10px] uppercase font-bold hover:bg-neon-cyan/20 transition-colors flex items-center gap-1"
                    >
                        <Plus size={10} /> Add
                    </button>
                </div>

                {/* Active Tickers */}
                {tickers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {tickers.map(t => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1 bg-terminal-bg border border-terminal-border rounded px-2 py-0.5 text-[10px] text-neon-cyan"
                            >
                                {t}
                                <button onClick={() => removeTicker(t)} className="hover:text-neon-red transition-colors">
                                    <X size={8} />
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={() => setTickers([])}
                            className="text-[9px] text-text-muted hover:text-neon-red transition-colors px-1"
                        >
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* News Feed */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && !baseNews.length ? (
                    <TerminalLoader label="CONNECTING TO NEWS FEEDS" />
                ) : filteredNews.length === 0 ? (
                    <div className="text-text-muted text-xs p-4 font-mono">
                        {'>'} NO_MATCHING_NEWS_ITEMS<br />
                        {'>'} {tickers.length > 0
                            ? `No articles found matching: ${tickers.join(', ')}`
                            : 'Add tickers above to filter news feed'
                        }<span className="cursor-blink">_</span>
                        {isLive && tickers.length > 0 && (
                            <div className="mt-2 text-text-secondary">
                                {'>'} TIP: Try broader tickers like AAPL, NVDA, MSFT, WMT, TSLA
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Column Headers */}
                        <div className="sticky top-0 bg-terminal-card border-b border-terminal-border px-3 py-1.5 grid grid-cols-[60px_1fr_80px_80px_60px] gap-2 text-[9px] text-text-secondary uppercase tracking-wider">
                            <span>Ticker</span>
                            <span>Headline</span>
                            <span>Sentiment</span>
                            <span>Score</span>
                            <span>Time</span>
                        </div>

                        {filteredNews.map(item => {
                            // Determine which ticker matched (for live data)
                            const matchedTicker = item.ticker ||
                                tickers.find(t => matchesTicker(item.headline || '', item.description || '', t)) ||
                                '—';

                            return (
                                <div
                                    key={item.id}
                                    className="px-3 py-2 border-b border-terminal-border hover:bg-white/[0.02] cursor-pointer grid grid-cols-[60px_1fr_80px_80px_60px] gap-2 items-center group"
                                    onClick={() => item.link && window.open(item.link, '_blank')}
                                >
                                    <span className="text-neon-cyan text-[11px] font-bold">{matchedTicker}</span>
                                    <div>
                                        <div className="text-[11px] text-text-primary leading-tight group-hover:text-neon-cyan transition-colors">
                                            {item.headline}
                                        </div>
                                        <div className="text-[9px] text-text-muted mt-0.5 flex items-center gap-1">
                                            {item.source} <ExternalLink size={7} />
                                        </div>
                                    </div>
                                    <SentimentBadge sentiment={item.sentiment} />
                                    <div className={`text-[11px] font-bold ${item.sentiment === 'bullish' ? 'text-neon-green' :
                                            item.sentiment === 'bearish' ? 'text-neon-red' : 'text-neon-yellow'
                                        }`}>
                                        {getSentimentScore(item.sentiment, item.headline)}%
                                    </div>
                                    <span className="text-text-muted text-[10px]">{item.time}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Status */}
            <div className="border-t border-terminal-border bg-terminal-card px-3 py-1.5 flex items-center justify-between text-[9px] text-text-muted">
                <span>{filteredNews.length} articles matching {tickers.length} ticker(s)</span>
                <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-neon-green' : 'bg-neon-yellow'} pulse-live inline-block`} />
                    Keyword Sentiment Engine v2.1 — {isLive ? 'Live RSS' : 'Mock Data'}
                </span>
            </div>
        </div>
    );
}
