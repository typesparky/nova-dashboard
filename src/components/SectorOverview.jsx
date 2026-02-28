import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

export default function SectorOverview() {
    const [shortData, setShortData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/short-interest');
            const json = await res.json();
            if (json.success) {
                setShortData(json.data);
            } else {
                throw new Error(json.error || 'Failed to fetch short interest data from database');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const triggerScrape = async () => {
        setLoading(true);
        setError('INITIALIZING SHORT INTEREST CRAWLER PROTOCOL...');
        try {
            const res = await fetch('/api/short-interest/trigger-scrape', { method: 'POST' });
            const json = await res.json();
            if (!json.error) {
                await fetchData();
            } else {
                throw new Error(json.error);
            }
        } catch (err) {
            setError(`SCRAPE_FAILED: ${err.message}`);
            setLoading(false);
        }
    };

    const topShorted = shortData.slice(0, 15);

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
                            Real-time scraping engine &bull; Market vulnerabilty metrics
                        </p>
                    </div>
                    <button
                        onClick={triggerScrape}
                        disabled={loading}
                        className="text-[10px] flex items-center gap-1.5 px-3 py-1.5 bg-terminal-card border border-terminal-border rounded hover:border-neon-yellow/50 hover:text-neon-yellow transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                        TRIGGER CRAWLER
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50">
                            <Activity className="animate-spin text-neon-yellow mb-4" size={32} />
                            <div className="text-[10px] uppercase tracking-widest animate-pulse">Scanning Order Books...</div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-neon-red px-10 text-center">
                            <AlertTriangle size={36} className="mb-4" />
                            <div className="text-xs font-bold uppercase tracking-widest mb-2">Scrape Error Detected</div>
                            <div className="text-[10px] font-mono">{error}</div>
                        </div>
                    ) : (
                        <div className="border border-terminal-border rounded-md overflow-hidden bg-terminal-card flex flex-col shadow-2xl shadow-neon-yellow/5">
                            <table className="w-full text-left font-mono">
                                <thead className="bg-black/40 border-b border-terminal-border">
                                    <tr>
                                        <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black">Ticker</th>
                                        <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black">Company</th>
                                        <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black text-right">Short Interest</th>
                                        <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black text-right">Float</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {shortData.map((stock, idx) => (
                                        <tr key={stock.ticker} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-4 py-3 text-xs font-bold text-neon-yellow">{stock.ticker}</td>
                                            <td className="px-4 py-3 text-[10px] text-text-primary group-hover:text-white truncate max-w-[200px]">{stock.company}</td>
                                            <td className="px-4 py-3 text-xs text-right font-black text-neon-red">{stock.shortInterest}</td>
                                            <td className="px-4 py-3 text-[10px] text-right text-text-muted">{stock.float}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
                                {shortData.length}
                            </div>
                            <div className="text-[10px] text-text-secondary font-bold mt-1">
                                Assets &gt; 20% Short
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    <h2 className="text-[10px] font-black tracking-widest uppercase text-text-primary mb-3">Top Vulnerable</h2>
                    <div className="space-y-2">
                        {topShorted.slice(1, 10).map((stock, i) => (
                            <div key={stock.ticker} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                                <span className="text-[10px] text-text-primary font-bold">{stock.ticker}</span>
                                <span className="text-[10px] text-neon-red font-mono">{stock.shortInterest}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
