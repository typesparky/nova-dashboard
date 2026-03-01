import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Newspaper, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { fetchAllNews, classifyNewsCategory } from '../data/api.jsx';

const FILTERS = ['All', 'Geopolitics', 'US Economy', 'Global', 'Business', 'Finance', 'Investing'];

const SENTIMENT_STYLES = {
  bullish: 'text-neon-green border-neon-green/30 bg-neon-green/5',
  bearish: 'text-neon-red border-neon-red/30 bg-neon-red/5',
  neutral: 'text-text-muted border-terminal-border bg-white/[0.02]',
};

function SentimentBadge({ sentiment }) {
  return (
    <span className={`text-[8px] px-1.5 py-0.5 border uppercase tracking-wider font-bold ${SENTIMENT_STYLES[sentiment] || SENTIMENT_STYLES.neutral}`}>
      {sentiment === 'bullish' ? '▲' : sentiment === 'bearish' ? '▼' : '●'} {sentiment || 'neutral'}
    </span>
  );
}

function CategoryBadge({ category }) {
  const styles = {
    'Geopolitics': 'bg-orange-500/15 text-orange-400',
    'US Economy': 'bg-blue-500/15 text-blue-400',
    'Global': 'bg-purple-500/15 text-purple-400',
    'Business': 'bg-gray-500/15 text-gray-400',
    'Finance': 'bg-cyan-500/15 text-cyan-400',
    'Investing': 'bg-emerald-500/15 text-emerald-400',
  };
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${styles[category] || 'bg-gray-500/15 text-gray-400'}`}>
      {category}
    </span>
  );
}

export default function NewsTerminal() {
  const [news, setNews] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const loadNews = async () => {
    setLoading(true);
    try {
      const articles = await fetchAllNews();
      // Enrich with geo-economic category
      const processed = articles.map(a => ({
        ...a,
        category: a.category !== 'General' ? a.category : classifyNewsCategory(a.headline, a.description),
      }));
      if (processed.length > 0) {
        setNews(processed);
        setIsLive(true);
        setLastUpdated(new Date());
      }
    } catch {
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() =>
    filter === 'All' ? news : news.filter(n => n.category === filter),
    [news, filter]);

  const categories = useMemo(() => {
    const cats = new Set(news.map(n => n.category));
    return ['All', ...Array.from(cats).sort()];
  }, [news]);

  return (
    <div className="h-full flex flex-col bg-terminal-bg text-text-primary overflow-hidden font-mono">
      {/* Header */}
      <div className="border-b border-terminal-border px-4 py-2.5 flex items-center justify-between bg-terminal-card/50">
        <div className="flex items-center gap-3">
          <Newspaper size={13} className="text-neon-cyan" />
          <span className="text-[10px] text-text-primary font-bold tracking-widest uppercase">News Terminal</span>
          {isLive ? (
            <span className="flex items-center gap-1 text-[8px] text-neon-green">
              <Wifi size={8} /> LIVE · CNBC RSS
            </span>
          ) : loading ? (
            <span className="text-[8px] text-neon-yellow animate-pulse">CONNECTING...</span>
          ) : (
            <span className="flex items-center gap-1 text-[8px] text-text-muted">
              <WifiOff size={8} /> OFFLINE
            </span>
          )}
          {lastUpdated && (
            <span className="text-[8px] text-text-muted">· {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-text-muted">{filtered.length} articles</span>
          <button onClick={loadNews} disabled={loading}
            className="flex items-center gap-1 px-2 py-1 border border-terminal-border text-[9px] text-text-muted hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
            <RefreshCw size={9} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-1 px-4 py-2 border-b border-terminal-border flex-wrap bg-terminal-card/20">
        {categories.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[9px] px-2.5 py-1 rounded transition-all font-bold uppercase tracking-wider ${filter === f
                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                : 'text-text-muted hover:text-text-primary border border-transparent hover:bg-white/5'
              }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-auto">
        {loading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <RefreshCw size={24} className="animate-spin text-neon-cyan" />
            <div className="text-[10px] uppercase tracking-widest animate-pulse">Connecting to RSS feeds...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Newspaper size={28} className="text-text-muted" />
            <div className="text-[11px] text-text-muted">No articles in "{filter}" category</div>
          </div>
        ) : (
          <div className="divide-y divide-terminal-border/60">
            {filtered.map((item, i) => (
              <div key={item.id || i}
                className="px-4 py-3 hover:bg-white/[0.02] transition-all group cursor-pointer"
                onClick={() => item.link && window.open(item.link, '_blank')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <SentimentBadge sentiment={item.sentiment} />
                      <CategoryBadge category={item.category} />
                      <span className="text-[8px] text-text-muted">{item.time}</span>
                      <span className="text-[8px] text-text-muted opacity-60">{item.source}</span>
                    </div>
                    <div className="text-[11px] text-text-primary leading-relaxed group-hover:text-neon-cyan transition-colors">
                      {item.headline}
                    </div>
                    {item.description && (
                      <div className="text-[9px] text-text-muted mt-1 leading-relaxed line-clamp-2">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <ExternalLink size={10} className="flex-none text-text-muted group-hover:text-neon-cyan transition-colors mt-1 opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
