import { useState, useEffect, useMemo } from 'react';
import { Activity, AlertTriangle, RefreshCw, BarChart2, ShieldAlert, Database, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import cachedData from '../data/shortInterestData.json';

const SORT_OPTIONS = [
    { key: 'shortInterestPct', label: 'Short %' },
    { key: 'shortDollarRaw', label: 'Short $ Value' },
    { key: 'marketCapRaw', label: 'Market Cap' },
];

function parseShortPct(s) {
    try { return parseFloat(s.replace('%', '').trim()); } catch { return 0; }
}

export default function SectorOverview() {
    const [shortData, setShortData] = useState([]);
    const [loadState, setLoadState] = useState('idle'); // 'idle'|'loading'|'crawling'|'done'|'error'
    const [error, setError] = useState(null);
    const [sortKey, setSortKey] = useState('shortInterestPct');
    const [sortDir, setSortDir] = useState('desc');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoadState('loading');
        setError(null);
        try {
            const res = await fetch('/api/short-interest');
            const text = await res.text();
            if (!text || text.trim() === '') { loadCache(); return; }
            let json;
            try { json = JSON.parse(text); } catch { loadCache(); return; }
            if (json.success && json.data?.length > 0) {
                setShortData(json.data);
                setLoadState('done');
            } else if (json.error) {
                throw new Error(json.error);
            } else {
                loadCache();
            }
        } catch (err) {
            loadCache(err.message);
        }
    };

    const loadCache = (errMsg) => {
        if (cachedData?.length > 0) {
            setShortData(cachedData);
            setLoadState('done');
        } else {
            setError(errMsg || 'No data');
            setLoadState(errMsg ? 'error' : 'idle');
        }
    };

    const triggerScrape = async () => {
        setLoadState('crawling');
        setError(null);
        try {
            const res = await fetch('/api/short-interest/trigger-scrape', { method: 'POST' });
            const text = await res.text();
            let json = {};
            try { json = JSON.parse(text); } catch { /* ignore */ }
            if (!json.error) { await fetchData(); }
            else { throw new Error(json.error); }
        } catch (err) {
            setError(`CRAWL_FAILED: ${err.message}`);
            setLoadState(cachedData?.length > 0 ? 'done' : 'error');
        }
    };

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const sortedData = useMemo(() => {
        const copy = [...shortData];
        return copy.sort((a, b) => {
            let av, bv;
            if (sortKey === 'shortInterestPct') {
                av = parseShortPct(a.shortInterest);
                bv = parseShortPct(b.shortInterest);
            } else {
                av = a[sortKey] ?? -1;
                bv = b[sortKey] ?? -1;
            }
            return sortDir === 'desc' ? bv - av : av - bv;
        });
    }, [shortData, sortKey, sortDir]);

    const topByShortPct = useMemo(() =>
        [...shortData].sort((a, b) => parseShortPct(b.shortInterest) - parseShortPct(a.shortInterest)),
        [shortData]);

    const topByDollar = useMemo(() =>
        [...shortData].filter(s => s.shortDollarRaw).sort((a, b) => b.shortDollarRaw - a.shortDollarRaw),
        [shortData]);

    const SortIcon = ({ k }) => {
        if (sortKey !== k) return <ArrowUpDown size={9} className="ml-1 opacity-30" />;
        return sortDir === 'desc'
            ? <ArrowDown size={9} className="ml-1 text-neon-yellow" />
            : <ArrowUp size={9} className="ml-1 text-neon-yellow" />;
    };

    const renderContent = () => {
        if (loadState === 'loading') return (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
                <Activity className="animate-spin text-neon-yellow mb-4" size={32} />
                <div className="text-[10px] uppercase tracking-widest animate-pulse">Querying Database...</div>
            </div>
        );

        if (loadState === 'crawling') return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <RefreshCw className="animate-spin text-neon-yellow" size={36} />
                <div className="text-xs font-bold text-neon-yellow uppercase tracking-widest animate-pulse">Crawler Running...</div>
                <div className="text-[10px] text-text-muted font-mono max-w-xs text-center leading-relaxed">
                    Scraping highshortinterest.com and pulling market caps from Yahoo Finance. Takes ~30–60 seconds.
                </div>
            </div>
        );

        if (loadState === 'idle') return (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-10">
                <Database size={48} className="text-neon-yellow opacity-30" />
                <div>
                    <div className="text-xs font-bold text-text-primary uppercase tracking-widest mb-2">No Short Interest Data in Database</div>
                    <div className="text-[10px] text-text-muted font-mono leading-relaxed max-w-xs">
                        Click <span className="text-neon-yellow font-bold">TRIGGER CRAWLER</span> to scrape live data.
                    </div>
                </div>
                <button onClick={triggerScrape} className="text-[10px] flex items-center gap-2 px-5 py-2.5 bg-neon-yellow/10 border border-neon-yellow/40 text-neon-yellow rounded hover:bg-neon-yellow/20 transition-colors font-bold uppercase tracking-widest">
                    <RefreshCw size={12} /> TRIGGER CRAWLER
                </button>
            </div>
        );

        if (loadState === 'error') return (
            <div className="flex flex-col items-center justify-center h-full text-neon-red px-10 text-center gap-4">
                <AlertTriangle size={36} />
                <div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-2">Scrape Error Detected</div>
                    <div className="text-[10px] font-mono">{error}</div>
                </div>
                <button onClick={triggerScrape} className="text-[10px] flex items-center gap-2 px-4 py-2 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded hover:bg-neon-red/20 transition-colors mt-2">
                    <RefreshCw size={10} /> RETRY CRAWLER
                </button>
            </div>
        );

        // done
        const hasDollarData = sortedData.some(s => s.shortDollarRaw);
        const hasMktCap = sortedData.some(s => s.marketCap);

        return (
            <div className="border border-terminal-border rounded-md overflow-hidden bg-terminal-card flex flex-col shadow-2xl shadow-neon-yellow/5">
                {/* Sort Controls */}
                <div className="flex items-center gap-2 px-4 py-2 bg-black/30 border-b border-terminal-border">
                    <span className="text-[9px] text-text-muted uppercase tracking-widest mr-1">Sort by:</span>
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => handleSort(opt.key)}
                            className={`flex items-center text-[9px] px-2.5 py-1 rounded border transition-all font-bold uppercase tracking-wider ${sortKey === opt.key
                                    ? 'bg-neon-yellow/15 border-neon-yellow/40 text-neon-yellow'
                                    : 'border-terminal-border text-text-muted hover:text-text-primary hover:border-text-muted'
                                }`}
                        >
                            {opt.label}<SortIcon k={opt.key} />
                        </button>
                    ))}
                    {sortKey === 'shortDollarRaw' && !hasDollarData && (
                        <span className="text-[9px] text-orange-400/70 ml-2 italic">Market cap unavailable for some tickers</span>
                    )}
                </div>

                <div className="overflow-auto">
                    <table className="w-full text-left font-mono">
                        <thead className="bg-black/40 border-b border-terminal-border sticky top-0">
                            <tr>
                                <th className="px-3 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black w-10">#</th>
                                <th className="px-3 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black">Ticker</th>
                                <th className="px-3 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black">Company</th>
                                <th className="px-3 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black text-right cursor-pointer hover:text-neon-yellow select-none" onClick={() => handleSort('shortInterestPct')}>
                                    <span className="flex items-center justify-end gap-0.5">Short %<SortIcon k="shortInterestPct" /></span>
                                </th>
                                {hasMktCap && (
                                    <th className="px-3 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black text-right cursor-pointer hover:text-neon-yellow select-none" onClick={() => handleSort('marketCapRaw')}>
                                        <span className="flex items-center justify-end gap-0.5">Mkt Cap<SortIcon k="marketCapRaw" /></span>
                                    </th>
                                )}
                                {hasDollarData && (
                                    <th className="px-3 py-3 text-[9px] text-neon-cyan uppercase tracking-widest font-black text-right cursor-pointer hover:text-neon-yellow select-none" onClick={() => handleSort('shortDollarRaw')}>
                                        <span className="flex items-center justify-end gap-0.5">Short $ Value<SortIcon k="shortDollarRaw" /></span>
                                    </th>
                                )}
                                <th className="px-3 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black text-right">Float</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedData.map((stock, idx) => (
                                <tr key={stock.ticker} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-3 py-2.5 text-[9px] text-text-muted">#{idx + 1}</td>
                                    <td className="px-3 py-2.5 text-xs font-bold text-neon-yellow">{stock.ticker}</td>
                                    <td className="px-3 py-2.5 text-[10px] text-text-primary group-hover:text-white truncate max-w-[180px]">{stock.company}</td>
                                    <td className="px-3 py-2.5 text-xs text-right font-black text-neon-red">{stock.shortInterest}</td>
                                    {hasMktCap && (
                                        <td className="px-3 py-2.5 text-[10px] text-right text-text-secondary">{stock.marketCap || '—'}</td>
                                    )}
                                    {hasDollarData && (
                                        <td className="px-3 py-2.5 text-[11px] text-right font-bold text-neon-cyan">
                                            {stock.shortDollarValue || <span className="text-text-muted opacity-40">—</span>}
                                        </td>
                                    )}
                                    <td className="px-3 py-2.5 text-[10px] text-right text-text-muted">{stock.float}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-terminal-bg text-text-primary font-mono overflow-hidden">
            {/* Left Column */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-terminal-border">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border bg-terminal-card/30">
                    <div>
                        <h1 className="text-sm font-black text-neon-yellow uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={14} /> High Short Interest Database
                        </h1>
                        <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">
                            Real-time scraping engine &bull; Market vulnerability metrics
                        </p>
                    </div>
                    {loadState === 'done' && (
                        <button onClick={triggerScrape} className="text-[10px] flex items-center gap-1.5 px-3 py-1.5 bg-terminal-card border border-terminal-border rounded hover:border-neon-yellow/50 hover:text-neon-yellow transition-colors">
                            <RefreshCw size={10} /> REFRESH DATA
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">{renderContent()}</div>
            </div>

            {/* Right Sidebar */}
            <div className="w-[260px] flex flex-col bg-terminal-card/50">
                <div className="p-4 border-b border-terminal-border">
                    <h2 className="text-[10px] font-black tracking-widest uppercase text-text-primary mb-4 flex items-center gap-2">
                        <BarChart2 size={12} className="text-neon-cyan" /> Vulnerability Index
                    </h2>
                    <div className="space-y-3">
                        <div className="bg-black/40 border border-terminal-border p-3 rounded">
                            <div className="text-[9px] text-text-muted uppercase tracking-widest mb-1">Highest Short %</div>
                            <div className="text-lg font-black text-neon-yellow">{topByShortPct[0]?.ticker || '---'}</div>
                            <div className="text-[10px] text-neon-red font-bold mt-0.5">{topByShortPct[0]?.shortInterest || '---'}</div>
                        </div>
                        <div className="bg-black/40 border border-terminal-border p-3 rounded">
                            <div className="text-[9px] text-text-muted uppercase tracking-widest mb-1">Largest Short $ Exposure</div>
                            <div className="text-lg font-black text-neon-cyan">{topByDollar[0]?.ticker || '---'}</div>
                            <div className="text-[10px] text-neon-cyan/70 font-bold mt-0.5">{topByDollar[0]?.shortDollarValue || '---'}</div>
                            <div className="text-[9px] text-text-muted mt-0.5">{topByDollar[0]?.shortInterest ? `${topByDollar[0].shortInterest} short` : ''}</div>
                        </div>
                        <div className="bg-black/40 border border-terminal-border p-3 rounded">
                            <div className="text-[9px] text-text-muted uppercase tracking-widest mb-1">Total Tracked</div>
                            <div className="text-lg font-black text-text-primary">{shortData.length || '---'}</div>
                            <div className="text-[9px] text-text-secondary mt-0.5">Assets &gt; 20% Short</div>
                        </div>
                        <div className="bg-black/40 border border-terminal-border p-3 rounded">
                            <div className="text-[9px] text-text-muted uppercase tracking-widest mb-1">Data Status</div>
                            <div className={`text-xs font-black mt-1 flex items-center gap-1.5 ${loadState === 'done' ? 'text-neon-green' : 'text-orange-400'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${loadState === 'done' ? 'bg-neon-green' : 'bg-orange-400'}`} />
                                {loadState === 'done' ? 'LIVE DATA' : 'AWAITING CRAWL'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Vulnerable by Short $ */}
                <div className="flex-1 overflow-auto p-4">
                    <h2 className="text-[10px] font-black tracking-widest uppercase text-text-primary mb-1">Top by Short $ Value</h2>
                    <p className="text-[8px] text-text-muted mb-3 uppercase tracking-wider">Market cap × short interest</p>
                    <div className="space-y-1.5">
                        {topByDollar.slice(0, 10).map((stock) => (
                            <div key={stock.ticker} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                                <div>
                                    <span className="text-[10px] text-text-primary font-bold">{stock.ticker}</span>
                                    <span className="text-[8px] text-text-muted ml-1.5">{stock.shortInterest}</span>
                                </div>
                                <span className="text-[10px] text-neon-cyan font-mono font-bold">{stock.shortDollarValue}</span>
                            </div>
                        ))}
                        {topByDollar.length === 0 && (
                            <div className="text-[9px] text-text-muted italic opacity-50">No market cap data loaded.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
