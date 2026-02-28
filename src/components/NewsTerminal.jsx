import { useState, useEffect } from 'react';
import { RefreshCw, Newspaper, ExternalLink, AlertCircle } from 'lucide-react';

const FILTERS = ['All', 'Macro', 'Crypto', 'Equities', 'Commodities', 'Forex'];

function SentimentBadge({ sentiment }) {
  const styles = {
    bullish: 'text-neon-green border-neon-green/30 bg-neon-green/5',
    bearish: 'text-neon-red border-neon-red/30 bg-neon-red/5',
    neutral: 'text-text-muted border-terminal-border',
  };
  return (
    <span className={`text-[8px] px-1 py-0.5 border uppercase tracking-wider ${styles[sentiment] || styles.neutral}`}>
      {sentiment || 'neutral'}
    </span>
  );
}

export default function NewsTerminal() {
  const [news, setNews] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('Backend offline');
      const data = await res.json();
      setNews(Array.isArray(data) ? data : data.data || []);
      setLastUpdated(new Date());
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 5 * 60 * 1000); // refresh every 5min
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'All' ? news : news.filter(n => n.category?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="h-full flex flex-col bg-terminal-bg text-text-primary overflow-hidden">
      {/* Header */}
      <div className="border-b border-terminal-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-neon-cyan" />
          <span className="text-[10px] text-text-muted tracking-widest">NEWS TERMINAL</span>
          {lastUpdated && <span className="text-[9px] text-text-muted">· {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-terminal-border">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[10px] transition-all
                  ${filter === f ? 'bg-neon-cyan text-black font-bold' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={loadNews} disabled={loading}
            className="flex items-center gap-1 px-2 py-1 border border-terminal-border text-[10px] text-text-muted hover:text-text-primary transition-all">
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Newspaper size={28} className="text-text-muted mx-auto mb-3" />
              <div className="text-[11px] text-text-muted">No news data available</div>
              <div className="text-[9px] text-text-muted mt-1">Configure news sources in server.js</div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-terminal-border">
            {filtered.map((item, i) => (
              <div key={i} className="px-4 py-3 hover:bg-white/[0.02] transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SentimentBadge sentiment={item.sentiment} />
                      {item.category && (
                        <span className="text-[8px] text-text-muted uppercase tracking-wider">{item.category}</span>
                      )}
                      <span className="text-[8px] text-text-muted">{item.time || item.published_at}</span>
                    </div>
                    <div className="text-[11px] text-text-primary leading-relaxed group-hover:text-white transition-colors">
                      {item.headline || item.title}
                    </div>
                    {item.summary && (
                      <div className="text-[10px] text-text-muted mt-1 leading-relaxed">{item.summary}</div>
                    )}
                    <div className="text-[9px] text-text-muted mt-1">{item.source}</div>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="flex-none text-text-muted hover:text-neon-cyan transition-colors mt-1"
                      onClick={e => e.stopPropagation()}>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
