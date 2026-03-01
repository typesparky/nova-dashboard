
import React, { useState } from 'react';
import { Search, Loader2, Zap, LayoutTemplate, RefreshCw, AlertCircle, MousePointerClick } from 'lucide-react';

export default function NasdaqOptions() {
    const [tickerInput, setTickerInput] = useState('');
    const [activeTicker, setActiveTicker] = useState(null);
    const [activeTab, setActiveTab] = useState('options'); // 'options', 'earnings', 'institutional', 'financials'
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [hasRequested, setHasRequested] = useState(false);

    const TABS = [
        { id: 'options', label: 'Options Chain' },
        { id: 'institutional', label: 'Institutional Flows' },
        { id: 'earnings', label: 'Earnings & EPS' },
        { id: 'financials', label: 'Financials' },
    ];

    const fetchData = async (symbol, tab) => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            const res = await fetch(`/api/nasdaq/${tab}/${window.encodeURIComponent(symbol)}`);
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.error || result.details || `Failed to fetch ${tab} data`);
            }

            setData(result.data);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const ticker = tickerInput.trim().toUpperCase();
        if (!ticker) return;
        setActiveTicker(ticker);
        setHasRequested(true);
        fetchData(ticker, activeTab);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // Re-fetch for the new tab if we already have a ticker loaded
        if (hasRequested && activeTicker) {
            fetchData(activeTicker, tab);
        }
    };

    const OptionGroup = ({ data }) => {
        if (!data || data.length === 0) return null;

        return (
            <div className="border border-terminal-border bg-terminal-card rounded-md overflow-hidden flex flex-col min-h-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead>
                            <tr className="border-b border-terminal-border bg-terminal-bg text-[10px] text-text-muted">
                                <th className="px-2 py-2 w-20 font-normal">EXPIRY</th>
                                <th className="px-2 py-2 text-right text-neon-green/80 font-normal">LAST</th>
                                <th className="px-2 py-2 text-right text-neon-green/80 font-normal">CHANGE</th>
                                <th className="px-2 py-2 text-right text-neon-green/80 font-normal">BID</th>
                                <th className="px-2 py-2 text-right text-neon-green/80 font-normal">ASK</th>
                                <th className="px-2 py-2 text-center text-neon-cyan/80 bg-neon-cyan/5 font-semibold border-x border-terminal-border">STRIKE</th>
                                <th className="px-2 py-2 text-left text-orange-400/80 font-normal">LAST</th>
                                <th className="px-2 py-2 text-left text-orange-400/80 font-normal">CHANGE</th>
                                <th className="px-2 py-2 text-left text-orange-400/80 font-normal">BID</th>
                                <th className="px-2 py-2 text-left text-orange-400/80 font-normal">ASK</th>
                                <th className="px-2 py-2 text-right font-normal">C VOL</th>
                                <th className="px-2 py-2 text-right font-normal">C OPEN</th>
                                <th className="px-2 py-2 text-left font-normal border-l border-terminal-border pl-4">P VOL</th>
                                <th className="px-2 py-2 text-left font-normal">P OPEN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="border-b border-terminal-border hover:bg-white/[0.02] tabular-nums">
                                    <td className="px-2 py-1.5 text-text-muted">{row.expiry}</td>
                                    <td className="px-2 py-1.5 text-right text-neon-green">{row.calls.last}</td>
                                    <td className={`px-2 py-1.5 text-right ${row.calls.change.includes('-') ? 'text-neon-red' : 'text-neon-green'}`}>
                                        {row.calls.change !== '--' ? row.calls.change : '-'}
                                    </td>
                                    <td className="px-2 py-1.5 text-right text-text-secondary">{row.calls.bid}</td>
                                    <td className="px-2 py-1.5 text-right text-text-secondary">{row.calls.ask}</td>

                                    <td className="px-2 py-1.5 text-center text-neon-cyan font-bold bg-neon-cyan/5 border-x border-terminal-border">
                                        {row.strike}
                                    </td>

                                    <td className="px-2 py-1.5 text-left text-orange-500">{row.puts.last}</td>
                                    <td className={`px-2 py-1.5 text-left ${row.puts.change.includes('-') ? 'text-neon-red' : 'text-neon-green'}`}>
                                        {row.puts.change !== '--' ? row.puts.change : '-'}
                                    </td>
                                    <td className="px-2 py-1.5 text-left text-text-secondary">{row.puts.bid}</td>
                                    <td className="px-2 py-1.5 text-left text-text-secondary">{row.puts.ask}</td>

                                    <td className="px-2 py-1.5 text-right text-text-secondary whitespace-nowrap">{row.calls.volume}</td>
                                    <td className="px-2 py-1.5 text-right text-text-muted">{row.calls.openInterest}</td>

                                    <td className="px-2 py-1.5 text-left text-text-secondary border-l border-terminal-border pl-4">{row.puts.volume}</td>
                                    <td className="px-2 py-1.5 text-left text-text-muted">{row.puts.openInterest}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-terminal-bg text-text-primary p-4 overflow-hidden gap-4 flex-1">
            {/* Search Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neon-cyan">
                        <Zap size={18} />
                        <h1 className="text-xl font-bold tracking-widest uppercase">Nasdaq Equities \ Options</h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2 p-1 bg-terminal-card border border-terminal-border rounded-md w-[420px]">
                    <div className="flex items-center px-3 text-text-muted">
                        <Search size={14} />
                    </div>
                    <input
                        type="text"
                        value={tickerInput}
                        onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                        placeholder="Enter ticker symbol (e.g. AAPL, TSLA, NVDA)"
                        className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted uppercase"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !tickerInput.trim()}
                        className="px-4 py-1.5 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan rounded text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <MousePointerClick size={13} />}
                        {isLoading ? 'Scraping...' : 'REQUEST DATA'}
                    </button>
                </form>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                {/* Tabs */}
                <div className="flex border-b border-gray-800 mb-6 bg-gray-950 p-1 rounded-sm border">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex-1 py-1.5 px-4 text-xs font-mono transition-colors ${activeTab === tab.id
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Idle state — show before first request */}
                {!hasRequested && !isLoading && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center pb-12">
                        <div className="w-16 h-16 rounded-full bg-neon-cyan/5 border border-neon-cyan/20 flex items-center justify-center">
                            <Search size={28} className="text-neon-cyan opacity-40" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-text-primary uppercase tracking-widest mb-2">
                                Enter a Ticker to Begin
                            </div>
                            <div className="text-[10px] text-text-muted font-mono leading-relaxed max-w-sm">
                                Type a stock symbol above and press{' '}
                                <span className="text-neon-cyan font-bold">REQUEST DATA</span>{' '}
                                to scrape live options chain, institutional flows, and earnings data from Nasdaq.
                            </div>
                        </div>
                        <div className="flex gap-3 text-[9px] text-text-muted font-mono uppercase tracking-widest opacity-60">
                            <span>Options Chain</span>
                            <span>•</span>
                            <span>Institutional Flows</span>
                            <span>•</span>
                            <span>Earnings &amp; EPS</span>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-500 font-mono text-sm space-y-4">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <p>Scraping live {activeTab} data for {activeTicker}...</p>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded text-red-400 font-mono text-xs flex items-start space-x-3">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="font-bold mb-1">SCRAPE FAILED</p>
                            <p>{error}</p>
                            {error.includes('No API data intercepted') && (
                                <p className="mt-2 text-red-300/80">
                                    Nasdaq's bot protection (Cloudflare/PerimeterX) blocked the headless worker.
                                </p>
                            )}
                            <button
                                onClick={() => fetchData(activeTicker, activeTab)}
                                className="mt-3 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors"
                            >
                                RETRY FETCH
                            </button>
                        </div>
                    </div>
                )}

                {/* Content based on Active Tab */}
                {!isLoading && !error && data && activeTab === 'options' && (
                    <div className="flex-1 flex flex-col min-h-0 min-w-0">
                        {data.length > 0 ? (
                            <>
                                <div className="mb-2 flex items-center gap-3">
                                    <span className="text-sm font-bold bg-neon-cyan text-black px-2 py-0.5 rounded uppercase">{activeTicker} Option Chain</span>
                                    <div className="text-xs text-text-muted flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                                        Live Scraped Data
                                    </div>
                                </div>
                                <OptionGroup data={data} />
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center gap-4 text-text-muted border border-terminal-border border-dashed rounded-lg bg-terminal-card/50">
                                <LayoutTemplate size={32} />
                                <div>No option chain data available for {activeTicker}.</div>
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && !error && data && activeTab === 'institutional' && data.institutional && (
                    <div className="space-y-6 flex-1 flex flex-col min-h-0">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-4 shrink-0">
                            {[...(data.institutional.activePositions?.rows || []), ...(data.institutional.newSoldOutPositions?.rows || [])].map((pos, idx) => {
                                if (pos.positions === "Total Institutional Shares" || pos.positions === "Held Positions") return null;

                                const isPositive = pos.positions.includes("Increased") || pos.positions.includes("New");
                                const isNegative = pos.positions.includes("Decreased") || pos.positions.includes("Sold");
                                const colorClass = isPositive ? 'text-neon-green' : isNegative ? 'text-neon-red' : 'text-neon-cyan';
                                const bgClass = isPositive ? 'bg-neon-green/5 border-neon-green/20' : isNegative ? 'bg-neon-red/5 border-neon-red/20' : 'bg-terminal-card border-terminal-border';

                                return (
                                    <div key={idx} className={`p-4 border rounded-lg ${bgClass} flex flex-col justify-center`}>
                                        <div className="text-xs text-text-muted mb-1 uppercase tracking-wider">{pos.positions}</div>
                                        <div className={`text-xl font-bold font-mono ${colorClass}`}>{pos.holders} Funds</div>
                                        <div className="text-xs text-text-secondary mt-1 tracking-widest">{pos.shares} Shares</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Top Holders Table */}
                        <div className="border border-terminal-border bg-terminal-card rounded-md overflow-hidden flex flex-col min-h-0 flex-1">
                            <div className="bg-terminal-bg border-b border-terminal-border px-4 py-2 flex items-center justify-between shrink-0">
                                <h3 className="text-text-primary font-bold tracking-widest uppercase text-xs">Top Institutional Activity</h3>
                                <div className="text-[10px] text-text-muted">LATEST FILINGS</div>
                            </div>
                            <div className="overflow-y-auto flex-1 p-1">
                                <table className="w-full text-left text-xs border-collapse font-mono">
                                    <thead className="sticky top-0 bg-terminal-card shadow-md z-10">
                                        <tr className="border-b border-terminal-border text-[#8b949e]">
                                            <th className="px-3 py-2 font-normal truncate">FIRM</th>
                                            <th className="px-3 py-2 font-normal text-right">DATE</th>
                                            <th className="px-3 py-2 font-normal text-right">SHARES HELD</th>
                                            <th className="px-3 py-2 font-normal text-right">CHANGE</th>
                                            <th className="px-3 py-2 font-normal text-right">% CHG</th>
                                            <th className="px-3 py-2 font-normal text-right">VALUE ($k)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.institutional.holdingsTransactions?.table?.rows?.map((row, idx) => {
                                            const isIncrease = !row.sharesChange.includes('-') && row.sharesChange !== '0' && row.sharesChangePCT !== '0%';
                                            const isDecrease = row.sharesChange.includes('-');
                                            const colorClass = isIncrease ? 'text-neon-green' : isDecrease ? 'text-neon-red' : 'text-text-muted';

                                            // Make firm name Title Case for cleaner UI
                                            const firmName = row.ownerName.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                                            return (
                                                <tr key={idx} className="border-b border-terminal-border/50 hover:bg-white/[0.02] transition-colors tabular-nums">
                                                    <td className="px-3 py-2.5 text-blue-300 font-semibold truncate max-w-[200px]" title={row.ownerName}>{firmName}</td>
                                                    <td className="px-3 py-2.5 text-right text-text-muted">{row.date}</td>
                                                    <td className="px-3 py-2.5 text-right text-white font-medium">{row.sharesHeld}</td>
                                                    <td className={`px-3 py-2.5 text-right font-bold ${colorClass}`}>
                                                        {isIncrease && !row.sharesChange.includes('New') ? '+' : ''}{row.sharesChange}
                                                    </td>
                                                    <td className={`px-3 py-2.5 text-right ${colorClass}`}>{row.sharesChangePCT}</td>
                                                    <td className="px-3 py-2.5 text-right text-neon-cyan/80">{row.marketValue.replace('$', '')}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && !error && data && activeTab === 'earnings' && data.eps && (
                    <div className="space-y-6">
                        <div className="bg-gray-900 border border-gray-800 rounded p-4">
                            <h3 className="text-gray-400 font-mono text-sm mb-4">EARNINGS PER SHARE (EPS)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right font-mono text-xs">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-gray-800">
                                            <th className="font-normal pb-2 text-left">PERIOD</th>
                                            <th className="font-normal pb-2">TYPE</th>
                                            <th className="font-normal pb-2">CONSENSUS</th>
                                            <th className="font-normal pb-2">REPORTED</th>
                                            <th className="font-normal pb-2">SURPRISE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {data.eps.earningsPerShare?.map((item, idx) => {
                                            const diff = item.earnings ? (item.earnings - item.consensus).toFixed(2) : '-';
                                            const diffColor = diff !== '-' && diff > 0 ? 'text-green-400' : diff !== '-' && diff < 0 ? 'text-red-400' : 'text-gray-400';
                                            return (
                                                <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="py-2.5 text-left text-gray-300">{item.period}</td>
                                                    <td className="py-2.5 text-gray-400">{item.type}</td>
                                                    <td className="py-2.5 text-blue-300">{item.consensus?.toFixed(2) || '-'}</td>
                                                    <td className="py-2.5 text-white">{item.earnings ? item.earnings.toFixed(2) : 'TBD'}</td>
                                                    <td className={`py-2.5 ${diffColor}`}>{diff !== '-' && diff > 0 ? '+' : ''}{diff}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && !error && data && activeTab === 'financials' && (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-500 font-mono text-sm space-y-4">
                        <p className="text-yellow-500/70 border border-yellow-500/20 p-2 rounded">Financials parser not yet implemented.</p>
                    </div>
                )}

                {!isLoading && !error && (!data || (Object.keys(data).length === 0 && activeTab !== 'options')) && (
                    <div className="text-center p-12 text-gray-600 font-mono text-sm border border-dashed border-gray-800 rounded">
                        No {activeTab} data found for {activeTicker}.
                    </div>
                )}
            </div>
        </div>
    );
}
