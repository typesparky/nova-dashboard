import { useMemo } from 'react';
import { CalendarDays, LineChart as LineChartIcon } from 'lucide-react';
import calendarData from '../data/economicCalendar.json';

const PRIORITY_STYLES = {
    high: { dot: 'bg-neon-red', label: 'bg-neon-red/15 text-neon-red border-neon-red/30', text: 'text-neon-red' },
    medium: { dot: 'bg-neon-yellow', label: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/25', text: 'text-neon-yellow' },
    low: { dot: 'bg-text-muted', label: 'bg-white/5 text-text-muted border-white/10', text: 'text-text-muted' },
};

// Map calendar shortNames to FRED_SERIES keys for chartability indicator
const CHARTABLE_EVENTS = {
    'CPI': 'CPI YoY',
    'NFP': 'Unemployment', // Using Unemployment chart as proxy for NFP day
    'Fed Funds': 'Fed Funds Rate',
    'PCE': 'Core PCE',
};

function dayDiff(isoDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(isoDate);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
}

function relativeLabel(diff) {
    if (diff < 0) return 'past';
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'tomorrow';
    return `in ${diff}d`;
}

export default function EconomicCalendar({ onEventClick, selectedEventId }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to upcoming events (today + future), prioritised
    const events = useMemo(() => {
        return calendarData
            .map(e => ({ ...e, diff: dayDiff(e.date), id: `${e.date}-${e.shortName}` }))
            .filter(e => e.diff >= 0)
            .sort((a, b) => a.diff - b.diff || (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0));
    }, []);

    const next = events.find(e => e.priority === 'high' && e.diff >= 0);

    return (
        <div className="flex flex-col h-full bg-terminal-bg text-text-primary overflow-hidden font-mono">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border bg-terminal-card/30">
                <div>
                    <h1 className="text-sm font-black text-neon-cyan uppercase tracking-widest flex items-center gap-2">
                        <CalendarDays size={14} /> Economic Calendar
                    </h1>
                    <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">
                        BLS Release Schedule • Click events with <LineChartIcon size={10} className="inline opacity-50" /> to view historical data
                    </p>
                </div>
                {next && (
                    <div className="text-right">
                        <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Next Major Release</div>
                        <div className="text-sm font-black text-neon-red">{next.shortName}</div>
                        <div className="text-[10px] text-neon-red/70 font-bold">{relativeLabel(next.diff)}</div>
                    </div>
                )}
            </div>

            {/* Events list */}
            <div className="flex-1 overflow-y-auto p-4">
                {events.length === 0 ? (
                    <div className="p-8 text-xs text-text-muted text-center opacity-50 border border-dashed border-white/10 rounded">No upcoming events found. Run crawler.</div>
                ) : (
                    <div className="border border-terminal-border rounded-md overflow-hidden bg-terminal-card shadow-2xl shadow-neon-cyan/5">
                        <table className="w-full text-left font-mono">
                            <thead className="bg-black/40 border-b border-terminal-border sticky top-0 hidden md:table-header-group">
                                <tr>
                                    <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black w-10"></th>
                                    <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black w-32">Date</th>
                                    <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black w-24">Time</th>
                                    <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black">Release</th>
                                    <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black text-right">Impact</th>
                                    <th className="px-4 py-3 text-[9px] text-text-secondary uppercase tracking-widest font-black w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 cursor-default">
                                {events.map((e) => {
                                    const s = PRIORITY_STYLES[e.priority] || PRIORITY_STYLES.low;
                                    const isToday = e.diff === 0;
                                    const isSoon = e.diff <= 3;
                                    const chartSeries = CHARTABLE_EVENTS[e.shortName];
                                    const isSelected = selectedEventId === e.id;

                                    return (
                                        <tr
                                            key={e.id}
                                            onClick={() => chartSeries && onEventClick && onEventClick(e, chartSeries)}
                                            className={`transition-colors group ${isSelected ? 'bg-neon-cyan/10 border-l-2 border-neon-cyan' :
                                                    isToday ? 'bg-white/[0.03] border-l-2 border-transparent' :
                                                        'hover:bg-white/[0.02] border-l-2 border-transparent'
                                                } ${chartSeries ? 'cursor-pointer' : ''}`}
                                        >
                                            {/* Dot */}
                                            <td className="px-4 py-3">
                                                <div className={`w-2 h-2 rounded-full mx-auto ${s.dot} ${isSoon ? 'animate-pulse' : 'opacity-70'}`} />
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-3">
                                                <div className={`text-xs font-bold ${isToday ? 'text-neon-cyan' : 'text-text-primary'}`}>
                                                    {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                                <div className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${isToday ? 'text-neon-cyan' : isSoon ? s.text : 'text-text-muted opacity-50'}`}>
                                                    {relativeLabel(e.diff)}
                                                </div>
                                            </td>

                                            {/* Time */}
                                            <td className="px-4 py-3 text-[10px] text-text-muted">
                                                {e.time || 'TBA'}
                                            </td>

                                            {/* Release Name */}
                                            <td className="px-4 py-3">
                                                <div className={`text-xs font-bold ${isSelected ? 'text-neon-cyan' : isToday ? 'text-white' : 'text-text-primary'} group-hover:text-neon-cyan`}>
                                                    {e.name}
                                                    {e.name !== e.shortName && <span className="ml-2 text-[10px] font-normal text-text-muted">({e.shortName})</span>}
                                                </div>
                                                <div className="text-[9px] text-text-muted mt-1">{e.period}</div>
                                            </td>

                                            {/* Priority Badge */}
                                            <td className="px-4 py-3 text-right">
                                                {e.priority !== 'low' && (
                                                    <span className={`text-[8px] px-2 py-1 rounded border uppercase tracking-wider font-bold inline-block ${s.label}`}>
                                                        {e.priority === 'high' ? 'High Impact' : 'Medium Impact'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Chartable Icon */}
                                            <td className="px-4 py-3 text-center">
                                                {chartSeries && (
                                                    <LineChartIcon
                                                        size={14}
                                                        className={`mx-auto ${isSelected ? 'text-neon-cyan' : 'text-text-muted group-hover:text-neon-cyan transition-colors'}`}
                                                        title={`View ${chartSeries} Chart`}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
