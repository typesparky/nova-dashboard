import { useState, useMemo } from 'react';
import { Search, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { insiderTrades } from '../data/mockData';

const formatValue = (val) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val}`;
};

const formatShares = (val) => {
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
    return val.toString();
};

export default function InsiderTracking() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [showClustersOnly, setShowClustersOnly] = useState(false);

    const filteredTrades = useMemo(() => {
        let data = insiderTrades;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(t =>
                t.ticker.toLowerCase().includes(q) ||
                t.company.toLowerCase().includes(q) ||
                t.insider.toLowerCase().includes(q)
            );
        }
        if (filterType !== 'All') {
            data = data.filter(t => t.type === filterType);
        }
        if (showClustersOnly) {
            data = data.filter(t => t.cluster);
        }
        return data;
    }, [searchQuery, filterType, showClustersOnly]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-terminal-border bg-terminal-card px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                        SEC Form 4 Filings — Insider & Institutional Transactions
                    </div>
                    <div className="text-[9px] text-text-muted">
                        {filteredTrades.length} records | Updated daily
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search ticker, company, or insider..."
                            className="w-full bg-terminal-bg border border-terminal-border rounded pl-7 pr-3 py-1 text-xs text-text-primary placeholder-text-muted focus:border-neon-cyan focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="flex gap-1">
                        {['All', 'Buy', 'Sell'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${filterType === t
                                        ? t === 'Buy' ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
                                            : t === 'Sell' ? 'bg-neon-red/10 text-neon-red border border-neon-red/30'
                                                : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                                        : 'text-text-muted hover:text-text-secondary border border-transparent'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowClustersOnly(!showClustersOnly)}
                        className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${showClustersOnly
                                ? 'bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30'
                                : 'text-text-muted hover:text-text-secondary border border-transparent'
                            }`}
                    >
                        <AlertTriangle size={9} /> Clusters Only
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Ticker</th>
                            <th>Company</th>
                            <th>Insider</th>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Shares</th>
                            <th>Value</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrades.map((trade, idx) => {
                            const isBuy = trade.type === 'Buy';
                            const isCEOBuy = isBuy && trade.title === 'CEO';
                            const highlight = trade.cluster && isBuy;
                            return (
                                <tr
                                    key={idx}
                                    className={`hover:bg-white/[0.02] ${highlight ? 'bg-neon-green/[0.03]' : ''}`}
                                >
                                    <td className="w-6">
                                        {trade.cluster && (
                                            <AlertTriangle size={10} className="text-neon-yellow" title="Cluster Activity" />
                                        )}
                                    </td>
                                    <td className={`font-bold ${isCEOBuy ? 'text-neon-green' : 'text-neon-cyan'}`}>
                                        {trade.ticker}
                                    </td>
                                    <td className="text-text-primary">{trade.company}</td>
                                    <td className={isCEOBuy ? 'text-neon-green font-bold' : 'text-text-primary'}>
                                        {trade.insider}
                                    </td>
                                    <td className={`text-text-secondary ${isCEOBuy ? 'text-neon-green font-bold' : ''}`}>
                                        {trade.title}
                                    </td>
                                    <td>
                                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${isBuy ? 'text-neon-green' : 'text-neon-red'
                                            }`}>
                                            {isBuy ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                                            {trade.type}
                                        </span>
                                    </td>
                                    <td className="text-text-primary font-bold">{formatShares(trade.shares)}</td>
                                    <td className={`font-bold ${isBuy ? 'text-neon-green' : 'text-neon-red'}`}>
                                        {formatValue(trade.value)}
                                    </td>
                                    <td className="text-text-secondary">{trade.date}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredTrades.length === 0 && (
                    <div className="text-text-muted text-xs p-4 font-mono">
                        {'>'} NO_MATCHING_FILINGS<span className="cursor-blink">_</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-terminal-border bg-terminal-card px-3 py-1.5 text-[9px] text-text-muted flex items-center justify-between">
                <span>
                    <AlertTriangle size={8} className="inline text-neon-yellow mr-1" />
                    Cluster buys highlighted — Multiple insiders buying within 7 days
                </span>
                <span>Source: SEC EDGAR / Financial Modeling Prep — Mock Data</span>
            </div>
        </div>
    );
}
