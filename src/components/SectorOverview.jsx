import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, RefreshCw, BarChart2, ShieldAlert, Database } from 'lucide-react';
import cachedData from '../data/shortInterestData.json';

export default function SectorOverview() {
    const [shortData, setShortData] = useState([]);
    const [loadState, setLoadState] = useState('idle'); // 'idle' | 'loading' | 'crawling' | 'done' | 'error'
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoadState('loading');
        setError(null);
        try {
            const res = await fetch('/api/short-interest');

            // Guard against empty / non-JSON responses (DB offline)
            const text = await res.text();
            if (!text || text.trim() === '') {
                // Fall back to cached local data
                if (cachedData && cachedData.length > 0) {
                    setShortData(cachedData);
                    setLoadState('done');
                } else {
                    setLoadState('idle');
                }
                return;
            }

            let json;
            try {
                json = JSON.parse(text);
            } catch {
                if (cachedData && cachedData.length > 0) {
                    setShortData(cachedData);
                    setLoadState('done');
                } else {
                    setLoadState('idle');
                }
                return;
            }

            if (json.success && json.data && json.data.length > 0) {
                setShortData(json.data);
                setLoadState('done');
            } else if (json.error) {
                throw new Error(json.error);
            } else {
                // Success but empty DB — fall back to cached
                if (cachedData && cachedData.length > 0) {
                    setShortData(cachedData);
                    setLoadState('done');
                } else {
                    setLoadState('idle');
                }
            }
        } catch (err) {
            // On any error, try local cache first
            if (cachedData && cachedData.length > 0) {
                setShortData(cachedData);
                setLoadState('done');
            } else {
                setError(err.message);
                setLoadState('error');
            }
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

            if (!json.error) {
                await fetchData();
            } else {
                throw new Error(json.error);
            }
        } catch (err) {
            setError(`CRAWL_FAILED: ${err.message}`);
            setLoadState('error');
        }
    };

    const topShorted = shortData.slice(0, 15);

    const renderContent = () => {
        if (loadState === 'loading') {
            return (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <Activity className="animate-spin text-neon-yellow mb-4" size={32} />
                    <div className="text-[10px] uppercase tracking-widest animate-pulse">Querying Database...</div>
                </div>
            );
        }

        if (loadState === 'crawling') {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <RefreshCw className="animate-spin text-neon-yellow" size={36} />
                    <div className="text-xs font-bold text-neon-yellow uppercase tracking-widest animate-pulse">
                        Crawler Running...
                    </div>
                    <div className="text-[10px] text-text-muted font-mono max-w-xs text-center leading-relaxed">
                        Python scraper is fetching high short-interest data from highshortinterest.com.
                        This may take 15–30 seconds.
                    </div>
                </div>
            );
        }

        if (loadState === 'idle') {
            return (
                <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-10">
                    <Database size={48} className="text-neon-yellow opacity-30" />
                    <div>
                        <div className="text-xs font-bold text-text-primary uppercase tracking-widest mb-2">
                            No Short Interest Data in Database
                        </div>
                        <div className="text-[10px] text-text-muted font-mono leading-relaxed max-w-xs">
                            Click <span className="text-neon-yellow font-bold">TRIGGER CRAWLER</span> to scrape
                            live high short-interest stocks from highshortinterest.com and populate the database.
                        </div>
                    </div>
                    <button
                        onClick={triggerScrape}
                        className="text-[10px] flex items-center gap-2 px-5 py-2.5 bg-neon-yellow/10 border border-neon-yellow/40 text-neon-yellow rounded hover:bg-neon-yellow/20 transition-colors font-bold uppercase tracking-widest"
                    >
                        <RefreshCw size={12} />
                        TRIGGER CRAWLER
                    </button>
                </div>
            );
        }

        if (loadState === 'error') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-neon-red px-10 text-center gap-4">
                    <AlertTriangle size={36} />
                    <div>
                        <div className="text-xs font-bold uppercase tracking-widest mb-2">Scrape Error Detected</div>
                        <div className="text-[10px] font-mono">{error}</div>
                    </div>
                    <button
                        onClick={triggerScrape}
                        className="text-[10px] flex items-center gap-2 px-4 py-2 bg-neon-red/10 border border-neon-red/30 text-neon-red rounded hover:bg-neon-red/20 transition-colors mt-2"
                    >
                        <RefreshCw size={10} />
                        RETRY CRAWLER
                    </button>
                </div>
            );
        }

        // loadState === 'done'
        return (
            <div className="border border-terminal-border rounded-md overflow-hidden bg-terminal-card flex flex-col shadow-2xl shadow-neon-yellow/5">
                <table className="w-full text-left font-mono">
                    <thead className="bg-black/40 border-b border-terminal-border">
                        <tr>
                            <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black">Rank</th>
                            <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black">Ticker</th>
                            <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black">Company</th>
                            <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black text-right">Short Interest</th>
                            <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black text-right">Float</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {shortData.map((stock, idx) => (
                            <tr key={stock.ticker} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-4 py-3 text-[10px] text-text-muted font-mono">#{idx + 1}</td>
                                <td className="px-4 py-3 text-xs font-bold text-neon-yellow">{stock.ticker}</td>
                                <td className="px-4 py-3 text-[10px] text-text-primary group-hover:text-white truncate max-w-[200px]">{stock.company}</td>
                                <td className="px-4 py-3 text-xs text-right font-black text-neon-red">{stock.shortInterest}</td>
                                <td className="px-4 py-3 text-[10px] text-right text-text-muted">{stock.float}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-terminal-bg text-text-primary font-mono overflow-hidden">
            {/* Left Column - Main Content */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-terminal-border">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border bg-terminal-card/30">
                    <div>
                        <h1 className="text-sm font-black text-neon-yellow uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={14} />
                            High Short Interest Database
                        </h1>
                        <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">
                            Real-time scraping engine &bull; Market vulnerability metrics
                        </p>
                    </div>
                    {loadState === 'done' && (
                        <button
                            onClick={triggerScrape}
                            className="text-[10px] flex items-center gap-1.5 px-3 py-1.5 bg-terminal-card border border-terminal-border rounded hover:border-neon-yellow/50 hover:text-neon-yellow transition-colors"
                        >
                            <RefreshCw size={10} />
                            REFRESH DATA
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    {renderContent()}
                </div>
            </div>

            {/* Right Column - Sidebar & Metrics */}
            <div className="w-[300px] flex flex-col bg-terminal-card/50">
                <div className="p-4 border-b border-terminal-border">
                    <h2 className="text-[10px] font-black tracking-widest uppercase text-text-primary mb-4 flex items-center gap-2">
                        <BarChart2 size={12} className="text-neon-cyan" />
                        Vulnerability Index
                    </h2>

                    <div className="space-y-4">
                        <div className="bg-black/40 border border-terminal-border p-3 rounded">
                            <div className="text-[9px] text-text-muted uppercase tracking-widest mb-1">Most Shorted Asset</div>
                            <div className="text-lg font-black text-neon-yellow">
                                {topShorted[0]?.ticker || '---'}
                            </div>
                            <div className="text-[10px] text-neon-red font-bold mt-1">
                                {topShorted[0]?.shortInterest || '---'}
                            </div>
                        </div>

                        <div className="bg-black/40 border border-terminal-border p-3 rounded">
                            <div className="text-[9px] text-text-muted uppercase tracking-widest mb-1">Total Tracked</div>
                            <div className="text-lg font-black text-neon-cyan">
                                {shortData.length || '---'}
                            </div>
                            <div className="text-[10px] text-text-secondary font-bold mt-1">
                                Assets &gt; 20% Short
                            </div>
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

                <div className="flex-1 overflow-auto p-4">
                    <h2 className="text-[10px] font-black tracking-widest uppercase text-text-primary mb-3">Top Vulnerable</h2>
                    <div className="space-y-2">
                        {topShorted.slice(1, 10).map((stock) => (
                            <div key={stock.ticker} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                                <span className="text-[10px] text-text-primary font-bold">{stock.ticker}</span>
                                <span className="text-[10px] text-neon-red font-mono">{stock.shortInterest}</span>
                            </div>
                        ))}
                        {topShorted.length === 0 && (
                            <div className="text-[9px] text-text-muted italic font-mono opacity-50 pt-2">
                                No data loaded yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
