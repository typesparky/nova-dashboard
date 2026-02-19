import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Bitcoin, Wallet, Award, RefreshCw } from 'lucide-react';
import { fetchEtfFlows, fetchEtfSummary, etfColors, etfIssuers } from '../data/mockData';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div className="bg-terminal-card border border-terminal-border px-3 py-2 text-xs min-w-[180px]">
      <div className="text-text-secondary mb-1.5">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4 text-[10px]">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className={p.value >= 0 ? 'text-neon-green' : 'text-neon-red'}>
            {p.value >= 0 ? '+' : ''}{p.value.toFixed(1)}M
          </span>
        </div>
      ))}
      <div className="border-t border-terminal-border mt-1.5 pt-1 flex justify-between font-bold text-[10px]">
        <span className="text-text-secondary">Net Total:</span>
        <span className={total >= 0 ? 'text-neon-green' : 'text-neon-red'}>
          {total >= 0 ? '+' : ''}{total.toFixed(1)}M
        </span>
      </div>
    </div>
  );
};

function SummaryCard({ icon: Icon, label, value, subValue, color = 'text-neon-cyan' }) {
  return (
    <div className="bg-terminal-card border border-terminal-border rounded-md px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} className="text-text-muted" />
        <span className="text-[9px] text-text-secondary uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      {subValue && <div className="text-[9px] text-text-muted mt-0.5">{subValue}</div>}
    </div>
  );
}

export default function EtfFlows() {
  const [viewDays, setViewDays] = useState(30);
  const [chartData, setChartData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [flows, summary] = await Promise.all([
          fetchEtfFlows(viewDays),
          fetchEtfSummary()
        ]);

        if (!flows || !summary) {
          throw new Error('Failed to fetch ETF data');
        }

        setChartData(flows.chartData);
        setSummaryData(summary);
      } catch (err) {
        setError(err.message);
        console.error('ETF Data Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viewDays]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] text-text-muted">
        <div className="text-center">
          <div className="animate-spin mb-2">Loading ETF Data...</div>
          <div>Connecting to ETFDB.com via Highcharts pixel extraction</div>
        </div>
      </div>
    );
  }

  if (error || !chartData) {
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
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-text-secondary uppercase tracking-wider">
            Spot Bitcoin ETF Flows from ETFDB.com — 10-Year History
          </div>
          <div className="flex gap-1">
            {[7, 14, 30, 60].map(d => (
              <button
                key={d}
                onClick={() => setViewDays(d)}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${viewDays === d
                    ? 'bg-neon-cyan/10 text-neon-cyan'
                    : 'text-text-muted hover:text-text-secondary'
                  }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {summaryData && (
        <div className="grid grid-cols-5 gap-2 p-3 border-b border-terminal-border">
          <SummaryCard icon={Bitcoin} label="Total BTC in ETFs" value={summaryData.totalBtcFlow?.toFixed(0) || '-'} subValue={summaryData.spotFlows?.value?.toFixed(2) + '%' || ''} />
          <SummaryCard icon={TrendingUp} label="7-Day Net Flow" value={summaryData.sevenDayNetFlow || '-'} color="text-neon-green" />
          <SummaryCard icon={Award} label="Top Accumulator" value={summaryData.topAccumulator || '-'} subValue={summaryData.topAccumulatorFlow || ''} />
          <SummaryCard icon={Wallet} label="Total ETH in ETFs" value={summaryData.totalEthHeld?.toFixed(0) || '-'} subValue={summaryData.totalEthValue || ''} />
          <SummaryCard icon={TrendingDown} label="Largest Outflow" value={summaryData.topAccumulatorFlow ? 'GBTC (Grayscale)' : '-'} subValue={summaryData.spotFlows?.change?.toFixed(2) + '%' || ''} color="text-neon-red" />
        </div>
      )}

      <div className="flex-1 p-3 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a36" />
            <XAxis
              dataKey="date"
              stroke="#4a5568"
              tick={{ fontSize: 8, fill: '#7a8a9e' }}
              tickFormatter={v => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval={viewDays <= 7 ? 0 : viewDays <= 14 ? 1 : 'preserveStartEnd'}
              minTickGap={20}
            />
            <YAxis
              stroke="#4a5568"
              tick={{ fontSize: 9, fill: '#7a8a9e' }}
              tickFormatter={v => `$${v.toFixed(0)}M`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#4a5568" strokeWidth={1} />
            <Legend
              iconType="rect"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
            />
            {etfIssuers.map(issuer => (
              <Bar
                key={issuer}
                dataKey={issuer}
                stackId="flows"
                fill={etfColors[issuer]}
                fillOpacity={0.8}
                maxBarSize={24}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-terminal-border bg-terminal-card px-3 py-1.5 text-[9px] text-text-muted flex items-center justify-between">
        <span>Data source: ETFDB.com pixel extraction from Highcharts SVG | Refresh: Daily 4:30 PM ET</span>
        <span className="flex items-center gap-1">
          <RefreshCw size={10} className="text-neon-cyan cursor-pointer" onClick={() => window.location.reload()} />
          Real-time data
        </span>
      </div>
    </div>
  );
}
