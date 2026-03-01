import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import calendarData from '../data/economicCalendar.json';

const PRIORITY_STYLES = {
    high: { dot: 'bg-neon-red', label: 'bg-neon-red/15 text-neon-red border-neon-red/30', text: 'text-neon-red' },
    medium: { dot: 'bg-neon-yellow', label: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/25', text: 'text-neon-yellow' },
    low: { dot: 'bg-text-muted', label: 'bg-white/5 text-text-muted border-white/10', text: 'text-text-muted' },
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

export default function EconomicCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to upcoming events (today + future), prioritised
    const events = useMemo(() => {
        return calendarData
            .map(e => ({ ...e, diff: dayDiff(e.date) }))
            .filter(e => e.diff >= 0)
            .sort((a, b) => a.diff - b.diff || (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0));
    }, []);

    const next = events.find(e => e.priority === 'high' && e.diff >= 0);

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border bg-terminal-card/30">
                <CalendarDays size={11} className="text-neon-cyan" />
                <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Economic Calendar</span>
                {next && (
                    <span className="ml-auto text-[8px] text-neon-cyan opacity-70">
                        Next: <span className="font-bold text-neon-cyan">{next.shortName}</span> in {next.diff}d
                    </span>
                )}
            </div>

            {/* Events list */}
            <div className="flex-1 overflow-y-auto">
                {events.length === 0 ? (
                    <div className="p-3 text-[9px] text-text-muted text-center opacity-50">No upcoming events</div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {events.map((e, i) => {
                            const s = PRIORITY_STYLES[e.priority] || PRIORITY_STYLES.low;
                            const isToday = e.diff === 0;
                            const isSoon = e.diff <= 3;
                            return (
                                <div key={i} className={`px-3 py-2 flex items-center gap-2.5 group transition-colors ${isToday ? 'bg-neon-cyan/5' : 'hover:bg-white/[0.02]'}`}>
                                    {/* Priority dot */}
                                    <div className={`w-1.5 h-1.5 rounded-full flex-none ${s.dot} ${isSoon ? 'animate-pulse' : 'opacity-70'}`} />

                                    {/* Date */}
                                    <div className="w-[52px] flex-none">
                                        <div className={`text-[9px] font-bold ${isToday ? 'text-neon-cyan' : 'text-text-muted'}`}>
                                            {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className={`text-[8px] font-bold uppercase tracking-wider ${isToday ? 'text-neon-cyan' : isSoon ? s.text : 'text-text-muted opacity-50'}`}>
                                            {relativeLabel(e.diff)}
                                        </div>
                                    </div>

                                    {/* Event name */}
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-[10px] font-bold truncate ${isToday ? 'text-white' : 'text-text-primary'}`}>{e.shortName}</div>
                                        <div className="text-[8px] text-text-muted truncate">{e.period} · {e.time}</div>
                                    </div>

                                    {/* Priority badge */}
                                    {e.priority !== 'low' && (
                                        <span className={`text-[7px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold flex-none ${s.label}`}>
                                            {e.priority === 'high' ? '!!!' : '!'}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
