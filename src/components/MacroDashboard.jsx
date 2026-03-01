import { useState, useMemo, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import {
    macroChartData, macroIndicators, corePCEComponents,
    marketNews, timeRanges
} from '../data/mockData';
import { useFetch, fetchAllNews, fetchFREDSeries, FRED_SERIES, RSS_FEEDS, classifyNewsCategory, TerminalLoader } from '../data/api';
import { fetchMacroData } from '../data/mockData';
import EconomicCalendar from './EconomicCalendar';

const CHART_SERIES = Object.keys(macroChartData);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-terminal-card border border-terminal-border px-3 py-2 text-xs">
            <div className="text-text-secondary mb-1">{label}</div>
            <div className="text-neon-cyan font-bold">{payload[0].value.toFixed(2)}%</div>
        </div>
    );
};

function IndicatorCard({ item }) {
    const isMock = item.isMock || item.value === '——';
    const isPositive = item.change > 0;
    const isNeutral = item.change === 0 || item.change === null;
    return (
        <div className={`bg-terminal-card border rounded-md px-3 py-2 flex items-center justify-between ${isMock ? 'border-orange-500/20' : 'border-terminal-border'
            }`}>
            <div>
                <div className="text-text-secondary text-[10px] uppercase tracking-wider">{item.label}</div>
                <div className={`text-sm font-bold mt-0.5 ${isMock ? 'text-orange-400/60' : 'text-text-primary'}`}>
                    {item.value}
                    {isMock && <span className="ml-1 text-[7px] text-orange-500/50 font-normal">NEEDS DATA</span>}
                </div>
            </div>
            {item.change !== null && (
                <div className={`flex items-center gap-1 text-xs ${isNeutral ? 'text-text-muted' : isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
                    {isNeutral ? <Minus size={10} /> : isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span>{isPositive ? '+' : ''}{item.change}{item.unit}</span>
                </div>
            )}
        </div>
    );
}

function NewsItem({ item }) {
    const sentimentColor = item.sentiment === 'bullish' ? 'text-neon-green' :
        item.sentiment === 'bearish' ? 'text-neon-red' : 'text-neon-yellow';

    const categoryColor = item.category === 'US Economy' ? 'bg-blue-500/20 text-blue-400' :
        item.category === 'Global' ? 'bg-purple-500/20 text-purple-400' :
            item.category === 'Geopolitics' ? 'bg-orange-500/20 text-orange-400' :
                item.category === 'Finance' ? 'bg-cyan-500/20 text-cyan-400' :
                    item.category === 'Investing' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-gray-500/20 text-gray-400';

    return (
        <div
            className="border-b border-terminal-border py-2 px-2 hover:bg-white/[0.02] cursor-pointer group"
            onClick={() => item.link && window.open(item.link, '_blank')}
        >
            <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${categoryColor}`}>{item.category}</span>
                <span className="text-text-muted text-[10px]">{item.time}</span>
                <span className={`text-[9px] uppercase font-bold ${sentimentColor} ml-auto`}>
                    {item.sentiment === 'bullish' ? '▲' : item.sentiment === 'bearish' ? '▼' : '●'} {item.sentiment}
                </span>
            </div>
            <div className="text-[11px] text-text-primary leading-tight group-hover:text-neon-cyan transition-colors">
                {item.headline}
            </div>
            <div className="text-[9px] text-text-muted mt-1 flex items-center gap-1">
                {item.source} <ExternalLink size={8} />
            </div>
        </div>
    );
}

export default function MacroDashboard() {
    const [selectedEvent, setSelectedEvent] = useState(null); // { event: {}, seriesKey: string }
    const [activeSeries, setActiveSeries] = useState('CPI YoY'); // Fallback if no event selected
    const [timeRange, setTimeRange] = useState('1Y');
    const [newsFilter, setNewsFilter] = useState('All');

    const [indicators, setIndicators] = useState({ rates: [], inflation: [], labor: [] });
    const [indicatorsLoading, setIndicatorsLoading] = useState(true);

    useEffect(() => {
        const loadIndicators = async () => {
            setIndicatorsLoading(true);
            try {
                const data = await fetchMacroData();
                setIndicators(data);
            } catch (error) {
                console.error("Failed to fetch macro indicators:", error);
            } finally {
                setIndicatorsLoading(false);
            }
        };
        loadIndicators();
    }, []);

    // Fetch live news from RSS feeds — refresh every 5 minutes
    const { data: liveNews, isLoading: newsLoading, isError: newsError, refetch: refetchNews } = useFetch(
        () => fetchAllNews(),
        [],
        5 * 60 * 1000
    );

    // Fetch FRED data for the active series (only if FRED API key is set)
    const [fredData, setFredData] = useState(null);
    const [fredLoading, setFredLoading] = useState(false);

    useEffect(() => {
        const seriesConfig = FRED_SERIES[activeSeries];
        if (!seriesConfig || !import.meta.env.VITE_FRED_API_KEY) {
            setFredData(null);
            return;
        }
        setFredLoading(true);
        fetchFREDSeries(seriesConfig.id, '2019-01-01', seriesConfig.units)
            .then(data => setFredData(data))
            .catch(() => setFredData(null))
            .finally(() => setFredLoading(false));
    }, [activeSeries]);

    // Classify live news into geopolitical categories
    const processedNews = useMemo(() => {
        if (!liveNews || liveNews.length === 0) return null;
        return liveNews.map(article => ({
            ...article,
            category: classifyNewsCategory(article.headline, article.description),
        }));
    }, [liveNews]);

    // Use live news if available, otherwise fall back to mock
    const newsData = processedNews || marketNews;
    const isLiveNews = !!processedNews;

    // Use FRED data if available, otherwise fall back to mock
    const chartData = useMemo(() => {
        const currentSeries = selectedEvent ? selectedEvent.seriesKey : activeSeries;
        const source = fredData || macroChartData[currentSeries] || [];
        const now = new Date();
        const rangeMap = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '5Y': 1825 };
        const days = rangeMap[timeRange] || 365;
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - days);
        return source.filter(d => new Date(d.date) >= cutoff);
    }, [activeSeries, selectedEvent, timeRange, fredData]);

    const filteredNews = useMemo(() => {
        if (newsFilter === 'All') return newsData;
        return newsData.filter(n => n.category === newsFilter);
    }, [newsFilter, newsData]);

    const NEWS_CATEGORIES = useMemo(() => {
        const cats = new Set(newsData.map(n => n.category));
        return ['All', ...Array.from(cats).sort()];
    }, [newsData]);

    const handleEventClick = (event, seriesKey) => {
        setActiveSeries(seriesKey);
        setSelectedEvent({ event, seriesKey });
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Top: Chart + News Sidebar */}
            <div className="flex-1 flex min-h-0">
                {/* Main View Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {!selectedEvent ? (
                        // 1. Expanded Economic Calendar View
                        <div className="flex-1 p-0 min-h-0 bg-terminal-card/10">
                            <EconomicCalendar
                                onEventClick={handleEventClick}
                                selectedEventId={selectedEvent?.event?.id}
                            />
                        </div>
                    ) : (
                        // 2. Drill-down Chart View
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Chart Header */}
                            <div className="flex items-center justify-between px-4 py-2 bg-terminal-card border-b border-terminal-border shadow-sm">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="text-[10px] flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-terminal-border text-text-muted hover:text-white hover:bg-white/10 hover:border-white/30 rounded transition-all font-bold uppercase tracking-widest"
                                    >
                                        ← Back to Calendar
                                    </button>
                                    <div className="flex flex-col">
                                        <div className="text-xs font-black text-neon-cyan flex items-center gap-2">
                                            {selectedEvent.seriesKey}
                                            {fredData && <span className="text-[8px] px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/30 uppercase tracking-widest">Live FRED API</span>}
                                        </div>
                                        <div className="text-[10px] text-text-muted">
                                            {selectedEvent.event.name} • {selectedEvent.event.period}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-black/40 p-1 rounded border border-terminal-border">
                                    {timeRanges.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTimeRange(t)}
                                            className={`text-[9px] font-bold px-2.5 py-1 rounded transition-colors ${timeRange === t
                                                ? 'bg-neon-cyan text-black'
                                                : 'text-text-muted hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="flex-1 p-4 min-h-0 bg-terminal-bg relative">
                                {fredLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-terminal-bg/80 z-10">
                                        <TerminalLoader label="FETCHING FRED DATA" />
                                    </div>
                                ) : null}
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a36" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#4a5568"
                                            tick={{ fontSize: 9, fill: '#7a8a9e', fontWeight: 'bold' }}
                                            tickFormatter={v => {
                                                const d = new Date(v);
                                                return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
                                            }}
                                            interval="preserveStartEnd"
                                            minTickGap={50}
                                            tickMargin={10}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#4a5568"
                                            tick={{ fontSize: 9, fill: '#7a8a9e', fontWeight: 'bold' }}
                                            tickFormatter={v => `${v.toFixed(1)}%`}
                                            width={45}
                                            axisLine={false}
                                            tickLine={false}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4a5568', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <ReferenceLine y={0} stroke="#4a5568" strokeDasharray="3 3" />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#00d4ff"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#00d4ff', stroke: '#080d12', strokeWidth: 2 }}
                                            animationDuration={500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* News Sidebar + Calendar */}
                <div className="w-[340px] border-l border-terminal-border flex flex-col min-h-0">
                    <div className="px-3 py-2 border-b border-terminal-border bg-terminal-card">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className="text-[10px] text-text-secondary uppercase tracking-wider">Market News Feed</div>
                                {isLiveNews ? (
                                    <span className="flex items-center gap-1 text-[8px] text-neon-green">
                                        <Wifi size={8} /> LIVE
                                    </span>
                                ) : newsLoading ? (
                                    <span className="text-[8px] text-neon-yellow">LOADING...</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[8px] text-text-muted">
                                        <WifiOff size={8} /> CACHED
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={refetchNews}
                                className="text-text-muted hover:text-neon-cyan transition-colors p-0.5"
                                title="Refresh news feed"
                            >
                                <RefreshCw size={10} />
                            </button>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {NEWS_CATEGORIES.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setNewsFilter(f)}
                                    className={`text-[9px] px-2 py-0.5 rounded transition-colors ${newsFilter === f
                                        ? 'bg-neon-cyan/10 text-neon-cyan'
                                        : 'text-text-muted hover:text-text-secondary'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {newsLoading && !newsData.length ? (
                            <TerminalLoader label="CONNECTING TO NEWS FEEDS" />
                        ) : (
                            filteredNews.map(item => (
                                <NewsItem key={item.id} item={item} />
                            ))
                        )}
                    </div>
                    <div className="border-t border-terminal-border bg-terminal-card px-2 py-1 text-[8px] text-text-muted flex items-center justify-between">
                        <span>{filteredNews.length} articles</span>
                        <span>
                            {isLiveNews
                                ? `Sources: CNBC RSS × ${Object.keys(RSS_FEEDS).length} feeds`
                                : 'No live news — configure RSS proxy'
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Ticker Cards */}
            <div className="border-t border-terminal-border bg-terminal-card">
                <div className="grid grid-cols-3 divide-x divide-terminal-border">
                    {/* Rates */}
                    <div className="p-2">
                        <div className="text-[9px] text-neon-cyan uppercase tracking-wider mb-1.5 font-bold">Rates</div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {indicatorsLoading ? <div className="text-xs text-text-muted col-span-2">Loading...</div> :
                                indicators.rates.map(item => (
                                    <IndicatorCard key={item.label} item={item} />
                                ))}
                        </div>
                    </div>
                    {/* Inflation */}
                    <div className="p-2">
                        <div className="text-[9px] text-neon-cyan uppercase tracking-wider mb-1.5 font-bold">Inflation</div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {indicatorsLoading ? <div className="text-xs text-text-muted col-span-2">Loading...</div> :
                                indicators.inflation.map(item => (
                                    <IndicatorCard key={item.label} item={item} />
                                ))}
                        </div>
                    </div>
                    {/* Labor */}
                    <div className="p-2">
                        <div className="text-[9px] text-neon-cyan uppercase tracking-wider mb-1.5 font-bold">Labor</div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {indicatorsLoading ? <div className="text-xs text-text-muted col-span-2">Loading...</div> :
                                indicators.labor.map(item => (
                                    <IndicatorCard key={item.label} item={item} />
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
