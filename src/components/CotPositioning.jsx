import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area,
  BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, LineChart as LineChartIcon, Activity } from 'lucide-react';
import { useFetch, fetchCOTSeries, COT_ASSETS } from '../data/api';

const PARTIES = [
  { id: 'nonComm', label: 'Speculators', color: '#00ff88', longKey: 'nonCommLong', shortKey: 'nonCommShort', netKey: 'netNonComm' },
  { id: 'comm', label: 'Commercials', color: '#ff3366', longKey: 'commLong', shortKey: 'commShort', netKey: 'netComm' },
];

const TRANSFORMATIONS = [
  { id: 'net', label: 'Net Position' },
  { id: 'pct', label: '% of Open Interest' },
  { id: 'change', label: 'WoW Change' },
];

const formatVal = (val) => {
  const abs = Math.abs(val);
  if (abs >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toString();
};

export default function CotPositioning() {
  const [selectedAsset, setSelectedAsset] = useState(COT_ASSETS[0]);
  const [activeParty, setActiveParty] = useState(PARTIES[0]);
  const [activeTransform, setActiveTransform] = useState(TRANSFORMATIONS[0]);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  const { data: rawData, isLoading, isError, errorMsg, refetch } = useFetch(
    () => fetchCOTSeries(selectedAsset.id, 52),
    [selectedAsset.id]
  );

  const chartData = useMemo(() => {
    if (!rawData) return [];
    return [...rawData].reverse().map(d => {
      let value = 0;
      if (activeTransform.id === 'net') value = d[activeParty.netKey];
      else if (activeTransform.id === 'pct') {
        const lp = activeParty.id === 'nonComm' ? d.pctOINonCommLong : 100 - (d.pctOINonCommLong + d.pctOINonCommShort); // Approx
        const sp = activeParty.id === 'nonComm' ? d.pctOINonCommShort : 0;
        value = lp - sp;
      } else if (activeTransform.id === 'change') {
        value = activeParty.id === 'nonComm' ? (d.changeNonCommLong - d.changeNonCommShort) : 0;
      }

      return {
        ...d,
        displayValue: value,
      };
    });
  }, [rawData, activeParty, activeTransform]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] text-text-muted font-mono">
        <div className="text-center">
          <div className="animate-pulse mb-2">{'>'} CONNECTING_COT_FEED...</div>
          <div className="flex gap-1 justify-center">
            <Activity className="animate-spin text-neon-cyan/40" size={16} />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] text-neon-red font-mono">
        <div className="text-center p-6 border border-neon-red/20 bg-neon-red/5 rounded shadow-lg shadow-neon-red/5">
          <div className="flex justify-center mb-3">
            <TrendingDown size={24} className="text-neon-red shadow-[0_0_10px_rgba(255,51,102,0.4)]" />
          </div>
          <div className="font-bold text-xs">FEED_SYNC_FAILED</div>
          <div className="text-text-muted mt-2 text-[8px] max-w-[200px] break-words uppercase">
            {errorMsg}
          </div>
          <div className="mt-4 text-[8px] text-text-muted">Ensure backend is running (npm run server)</div>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-1.5 border border-neon-red/40 hover:bg-neon-red/10 transition-all flex items-center gap-2 mx-auto rounded-sm group font-bold"
          >
            <RefreshCw size={10} className="group-hover:rotate-180 transition-transform duration-500" />
            AUTO_RECONNECT
          </button>
        </div>
      </div>
    );
  }

  const latest = chartData[chartData.length - 1] || {};

  return (
    <div className="h-full flex flex-col overflow-hidden bg-terminal-bg">
      {/* Control Bar */}
      <div className="border-b border-terminal-border bg-terminal-card p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] text-text-muted mb-0.5 tracking-widest font-mono">ASSET_SELECTOR</span>
              <select
                value={selectedAsset.id}
                onChange={(e) => setSelectedAsset(COT_ASSETS.find(a => a.id === e.target.value))}
                className="bg-terminal-bg border border-terminal-border text-neon-cyan text-xs rounded px-2 py-1.5 outline-none focus:border-neon-cyan/50 transition-colors font-bold uppercase min-w-[200px]"
              >
                {COT_ASSETS.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.label}</option>
                ))}
              </select>
            </div>
            <div className="h-10 w-[1px] bg-terminal-border mx-1" />
            <div className="flex flex-col">
              <span className="text-[8px] text-text-muted mb-0.5 tracking-widest font-mono">DATA_TRANSFORM</span>
              <div className="flex bg-terminal-bg rounded border border-terminal-border p-0.5">
                {TRANSFORMATIONS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTransform(t)}
                    className={`px-3 py-1 text-[9px] rounded uppercase transition-all font-bold ${activeTransform.id === t.id
                      ? 'bg-neon-cyan/20 text-neon-cyan shadow-[inset_0_0_8px_rgba(0,212,255,0.1)]'
                      : 'text-text-muted hover:text-text-secondary'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-4">
              <div className="text-[8px] text-text-muted font-mono uppercase">Market Code</div>
              <div className="text-[10px] text-neon-cyan/70 font-mono tracking-tighter">{selectedAsset.id}</div>
            </div>
            <div className="h-8 w-[1px] bg-terminal-border mr-2" />
            <div className="flex items-center bg-terminal-bg rounded border border-terminal-border p-0.5 shadow-inner">
              <button
                onClick={() => setViewMode('chart')}
                title="Chart View"
                className={`p-2 rounded transition-all ${viewMode === 'chart' ? 'bg-neon-cyan/20 text-neon-cyan shadow-[inset_0_0_5px_rgba(0,212,255,0.2)]' : 'text-text-muted'}`}
              >
                <LineChartIcon size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-2 rounded transition-all ${viewMode === 'table' ? 'bg-neon-cyan/20 text-neon-cyan shadow-[inset_0_0_5px_rgba(0,212,255,0.2)]' : 'text-text-muted'}`}
              >
                <BarChart3 size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-terminal-border/40">
          <div className="flex gap-4">
            {PARTIES.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveParty(p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all group ${activeParty.id === p.id
                  ? 'bg-terminal-bg border border-neon-cyan/20 text-text-primary'
                  : 'border border-transparent text-text-muted hover:bg-white/5'
                  }`}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color, boxShadow: activeParty.id === p.id ? `0 0 10px ${p.color}` : 'none' }} />
                <span className={`text-[10px] uppercase font-bold tracking-tight transition-colors ${activeParty.id === p.id ? 'text-text-primary' : 'group-hover:text-text-secondary'}`}>{p.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-6 pr-4">
            <div className="text-right">
              <span className="text-[9px] text-text-muted font-mono block">DATE:</span>
              <span className="text-[10px] text-text-primary font-mono font-bold uppercase">{latest.date || '---'}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-text-muted font-mono block">OI:</span>
              <span className="text-[10px] text-text-primary font-mono font-bold uppercase">{formatVal(latest.openInterest || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {viewMode === 'chart' ? (
          <div className="h-full p-6 flex flex-col">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h1 className="text-neon-cyan text-xl font-black uppercase tracking-tighter flex items-center gap-2 leading-none">
                  {selectedAsset.label}
                  <span className="text-text-muted text-[10px] font-normal tracking-widest ml-4 border-l border-terminal-border pl-4">COT POSITIONING REPORT</span>
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: activeParty.color }} />
                    <span>REPORTING_PARTY: {activeParty.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                    <div className="w-1 h-3 bg-terminal-border" />
                    <span>METRIC: {activeTransform.label}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 bg-terminal-card/50 px-6 py-3 rounded-md border border-terminal-border/30">
                <div className="text-right">
                  <div className="text-[9px] text-text-muted uppercase tracking-widest mb-1 italic">Normalized Value</div>
                  <div className={`text-2xl font-black font-mono leading-none ${latest.displayValue >= 0 ? 'text-neon-green contrast-125' : 'text-neon-red contrast-125'}`}>
                    {latest.displayValue > 0 ? '+' : ''}{formatVal(latest.displayValue)}
                  </div>
                </div>
                <div className="text-right border-l border-terminal-border/50 pl-8">
                  <div className="text-[9px] text-text-muted uppercase tracking-widest mb-1 italic">Total Positions</div>
                  <div className="text-2xl font-black font-mono leading-none text-text-primary">
                    {formatVal(latest[activeParty.netKey] || 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-terminal-card/20 rounded border border-terminal-border/20 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeParty.color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={activeParty.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 4" stroke="#1e2a36" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#4a5568"
                    tick={{ fontSize: 9, fill: '#7a8a9e', fontWeight: 'bold' }}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                    minTickGap={40}
                    axisLine={{ stroke: '#1e2a36' }}
                  />
                  <YAxis
                    stroke="#4a5568"
                    tick={{ fontSize: 9, fill: '#7a8a9e', fontFamily: 'monospace' }}
                    tickFormatter={formatVal}
                    orientation="right"
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ stroke: '#00d4ff', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#090c10', border: '1px solid #1e2a36', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}
                    itemStyle={{ color: activeParty.color, fontWeight: 'bold' }}
                    labelStyle={{ color: '#00d4ff', marginBottom: '6px', fontWeight: 'black', letterSpacing: '0.05em' }}
                    formatter={(val) => [formatVal(val), activeTransform.label]}
                  />
                  <ReferenceLine y={0} stroke="#4a5568" strokeWidth={1} />
                  <Area
                    type="stepAfter"
                    dataKey="displayValue"
                    stroke={activeParty.color}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPos)"
                    animationDuration={1500}
                    activeDot={{ r: 4, fill: activeParty.color, stroke: '#000', strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center text-[8px] text-text-muted font-mono tracking-widest">
              <span>REPLICATION_SEED: 0x42A-138B</span>
              <span>TIME_SERIES: 52_WEEKS_LOOKBACK</span>
              <span>SOURCE_ID: CFTC_SOCRATA_V1</span>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 scrollbar-terminal">
            <table className="w-full text-left text-[11px] border-collapse bg-terminal-card/10 rounded overflow-hidden">
              <thead className="sticky top-0 bg-terminal-card z-10 border-b border-terminal-border">
                <tr>
                  <th className="py-3 px-4 text-text-muted uppercase tracking-widest font-black text-[9px]">Reporting Date</th>
                  <th className="py-3 px-4 text-text-muted uppercase tracking-widest font-black text-[9px]">Long Pos</th>
                  <th className="py-3 px-4 text-text-muted uppercase tracking-widest font-black text-[9px]">Short Pos</th>
                  <th className="py-3 px-4 text-text-muted uppercase tracking-widest font-black text-[9px]">Net Exposure</th>
                  <th className="py-3 px-4 text-text-muted uppercase tracking-widest font-black text-[9px]">WoW Delta</th>
                  <th className="py-3 px-4 text-text-muted uppercase tracking-widest font-black text-[9px]">Open Interest</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().map((row, idx) => {
                  const prevRow = chartData[chartData.length - idx - 2] || row;
                  const net = row[activeParty.netKey];
                  const change = net - (prevRow[activeParty.netKey]);

                  return (
                    <tr key={idx} className="border-b border-terminal-border/20 hover:bg-white/[0.03] font-mono transition-colors">
                      <td className="py-2.5 px-4 text-text-secondary">{row.date}</td>
                      <td className="py-2.5 px-4 text-neon-green font-bold">{formatVal(row[activeParty.longKey])}</td>
                      <td className="py-2.5 px-4 text-neon-red font-bold">{formatVal(row[activeParty.shortKey])}</td>
                      <td className={`py-2.5 px-4 font-black ${net >= 0 ? 'text-neon-green border-l-2 border-neon-green/30' : 'text-neon-red border-l-2 border-neon-red/30'}`}>
                        {net > 0 ? '+' : ''}{formatVal(net)}
                      </td>
                      <td className={`py-2.5 px-4 font-bold flex items-center gap-1.5 ${change >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                        {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {change > 0 ? '+' : ''}{formatVal(change)}
                      </td>
                      <td className="py-2.5 px-4 text-text-primary text-opacity-80">{formatVal(row.openInterest)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Stats Bar */}
      <div className="bg-terminal-card border-t border-terminal-border px-4 flex justify-between items-center h-12 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        <div className="flex gap-10">
          <div className="flex flex-col">
            <span className="text-[7px] text-text-muted uppercase tracking-widest">Speculative Ratio</span>
            <span className="text-xs font-black text-neon-cyan leading-none">
              {((latest.nonCommLong / latest.openInterest) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex flex-col border-l border-terminal-border/50 pl-10">
            <span className="text-[7px] text-text-muted uppercase tracking-widest">Commercial Hedging</span>
            <span className="text-xs font-black text-text-primary leading-none">
              {((latest.commLong / latest.openInterest) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex flex-col border-l border-terminal-border/50 pl-10">
            <span className="text-[7px] text-text-muted uppercase tracking-widest">Net Spec Delta</span>
            <span className={`text-xs font-black leading-none ${latest.changeNonCommLong >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {latest.changeNonCommLong > 0 ? '+' : ''}{formatVal(latest.changeNonCommLong || 0)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[8px] text-text-muted font-mono bg-black/40 px-2 py-0.5 rounded-full border border-terminal-border/40">
            v2.4_PRO_RELEASE
          </div>
          <div className="flex items-center gap-2 font-black text-[9px] text-neon-green font-mono border border-neon-green/30 px-3 py-1 rounded bg-neon-green/5 shadow-[0_0_10px_rgba(0,255,136,0.1)]">
            <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse shadow-[0_0_5px_#00ff88]" />
            SYNC_ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
}
