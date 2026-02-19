import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { fetchCotData, TAB_LABELS } from '../data/mockData';

const CATEGORIES = ['All', 'Equities', 'Metals', 'Energy', 'Currencies', 'Rates', 'Agriculture'];

const formatContracts = (val) => {
  const abs = Math.abs(val);
  if (abs >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toString();
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-terminal-card border border-terminal-border px-3 py-2 text-xs min-w-[200px]">
      <div className="text-neon-cyan font-bold mb-1">{d.asset}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
        <span className="text-text-secondary">Net Position:</span>
        <span className={d.netLong >= 0 ? 'text-neon-green' : 'text-neon-red'}>
          {formatContracts(d.netLong)}
        </span>
        <span className="text-text-secondary">WoW Change:</span>
        <span className={d.change >= 0 ? 'text-neon-green' : 'text-neon-red'}>
          {d.change > 0 ? '+' : ''}{formatContracts(d.change)}
        </span>
        <span className="text-text-secondary">Open Interest:</span>
        <span className="text-text-primary">{formatContracts(d.openInterest)}</span>
      </div>
    </div>
  );
};

export default function CotPositioning() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cotData, setCotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchCotData(activeCategory);
        
        if (!data || data.length === 0) {
          throw new Error('No COT data available');
        }

        setCotData(data);
      } catch (err) {
        setError(err.message);
        console.error('COT Data Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCategory]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] text-text-muted">
        <div className="text-center">
          <div className="animate-spin mb-2">Loading COT Data...</div>
          <div>Connecting to Nasdaq Data Link</div>
        </div>
      </div>
    );
  }

  if (error || !cotData) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] text-text-muted">
        <div className="text-center">
          <div className="text-neon-red mb-2">{'>'} DATA_FETCH_ERROR</div>
          <div>{error || 'No data available'}</div>
          <div className="mt-2 text-[8px] text-text-muted">Try refreshing the page</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="border-b border-terminal-border bg-terminal-card px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider">
            Commitment of Traders — CFTC Weekly Report
          </div>
          <div className="text-[9px] text-text-muted">
            Report Date: {cotData[0]?.date || '2024-02-13'} | Data delayed 3 days
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${activeCategory === cat
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                  : 'text-text-muted hover:text-text-secondary border border-transparent'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-3 min-h-0">
        <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
          Non-Commercial Net Positioning (Contracts)
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={cotData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a36" horizontal={false} />
            <XAxis
              type="number"
              stroke="#4a5568"
              tick={{ fontSize: 9, fill: '#7a8a9e' }}
              tickFormatter={formatContracts}
            />
            <YAxis
              type="category"
              dataKey="asset"
              stroke="#4a5568"
              tick={{ fontSize: 9, fill: '#7a8a9e' }}
              width={130}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#4a5568" />
            <Bar dataKey="netLong" radius={[0, 2, 2, 0]} maxBarSize={20}>
              {cotData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.netLong >= 0 ? '#00ff88' : '#ff3366'}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-terminal-border max-h-[200px] overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] text-text-secondary uppercase tracking-wider border-b border-terminal-border bg-terminal-card">
          Week-over-Week Changes — Speculative Positioning
        </div>
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Category</th>
              <th>Net Position</th>
              <th>WoW Chg</th>
              <th>Direction</th>
              <th>Open Interest</th>
            </tr>
          </thead>
          <tbody>
            {cotData.map(row => (
              <tr key={row.asset} className="hover:bg-white/[0.02]">
                <td className="text-text-primary font-bold">{row.asset}</td>
                <td className="text-text-secondary">{row.category}</td>
                <td className={row.netLong >= 0 ? 'text-neon-green font-bold' : 'text-neon-red font-bold'}>
                  {formatContracts(row.netLong)}
                </td>
                <td className={row.change >= 0 ? 'text-neon-green' : 'text-neon-red'}>
                  <span className="flex items-center gap-1">
                    {row.change >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {row.change > 0 ? '+' : ''}{formatContracts(row.change)}
                  </span>
                </td>
                <td>
                  <span className="flex items-center gap-1 text-text-secondary text-[10px]">
                    {row.netLong >= 0 ? (
                      <><ArrowRight size={8} className="text-neon-green" /> Net Long</>
                    ) : (
                      <><ArrowRight size={8} className="text-neon-red rotate-180" /> Net Short</>
                    )}
                  </span>
                </td>
                <td className="text-text-secondary">{formatContracts(row.openInterest)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
