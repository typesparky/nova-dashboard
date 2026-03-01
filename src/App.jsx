import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Radio, Zap, Clock, Wifi,
  BarChart3, Newspaper, PieChart, ArrowLeftRight,
  UserCheck, FolderOpen, ChevronRight, Target
} from 'lucide-react';
import { TAB_LABELS } from './data/mockData';
import MacroDashboard from './components/MacroDashboard';
import NewsTerminal from './components/NewsTerminal';
import CotPositioning from './components/CotPositioning';
import EtfFlows from './components/EtfFlows';
import NasdaqOptions from './components/NasdaqOptions';
import LocalVault from './components/LocalVault';
import SectorOverview from './components/SectorOverview';

const TAB_ICONS = {
  macro: BarChart3,
  news: Newspaper,
  cot: PieChart,
  etf: ArrowLeftRight,
  options: Zap,
  vault: FolderOpen,
  sector: Target,
};

const TAB_COMPONENTS = {
  macro: MacroDashboard,
  news: NewsTerminal,
  cot: CotPositioning,
  etf: EtfFlows,
  options: NasdaqOptions,
  vault: LocalVault,
  sector: SectorOverview,
};

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

function Header({ time }) {
  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour12: false });
  const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header className="bg-terminal-card border-b border-terminal-border px-4 py-1.5 flex items-center justify-between select-none">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-neon-cyan" />
          <span className="text-neon-cyan font-bold text-sm tracking-wider">NOVA CAPITAL</span>
        </div>
        <span className="text-text-muted text-[10px]">|</span>
        <span className="text-text-secondary text-[10px] uppercase tracking-widest">Nova Capital Terminal v1.0</span>
      </div>

      {/* Center: Market Status */}
      <div className="flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green pulse-live inline-block" />
          <span className="text-neon-green">MARKET OPEN</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Activity size={10} />
          <span className="text-orange-400/60">SPX ——</span>
          <span className="text-orange-400/40 text-[9px]">NO FEED</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Radio size={10} />
          <span className="text-orange-400/60">DXY ——</span>
          <span className="text-orange-400/40 text-[9px]">NO FEED</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-secondary">
          <span className="text-orange-400/60">VIX ——</span>
          <span className="text-orange-400/40 text-[9px]">NO FEED</span>
        </div>
      </div>

      {/* Right: Clock & Status */}
      <div className="flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Wifi size={10} className="text-neon-green" />
          <span className="text-neon-green">CONNECTED</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="text-text-muted" />
          <span className="text-text-primary font-bold tabular-nums">{formatTime(time)}</span>
          <span className="text-text-muted">{formatDate(time)}</span>
        </div>
      </div>
    </header>
  );
}

function ErrorBoundaryFallback({ tabId }) {
  return (
    <div className="h-full flex items-center justify-center text-xs font-mono">
      <div className="text-center">
        <div className="text-neon-red mb-2">{'>'} DATA_FEED_OFFLINE</div>
        <div className="text-text-muted">Module [{tabId.toUpperCase()}] failed to render</div>
        <div className="text-text-muted mt-1">{'>'} Contact sys admin or retry with CTRL+R<span className="cursor-blink">_</span></div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('macro');
  const [tabError, setTabError] = useState(null);
  const time = useClock();

  const handleTabChange = useCallback((tabId) => {
    setTabError(null);
    setActiveTab(tabId);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= 'F1' && e.key <= 'F7') {
        e.preventDefault();
        const idx = parseInt(e.key.slice(1)) - 1;
        if (TAB_LABELS[idx]) {
          handleTabChange(TAB_LABELS[idx].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange]);

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      <Header time={time} />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar Navigation */}
        <nav className="w-[140px] bg-terminal-card border-r border-terminal-border flex flex-col py-1 select-none">
          {TAB_LABELS.map(tab => {
            const Icon = TAB_ICONS[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-left transition-all relative group ${isActive
                  ? 'text-neon-cyan bg-neon-cyan/5'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.02]'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-neon-cyan rounded-r" />
                )}
                <Icon size={12} className={isActive ? 'text-neon-cyan' : 'text-text-muted group-hover:text-text-secondary'} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold tracking-wider">{tab.label}</div>
                  <div className="text-[8px] text-text-muted">{tab.shortcut}</div>
                </div>
                {isActive && <ChevronRight size={10} className="text-neon-cyan" />}
              </button>
            );
          })}

          {/* Bottom System Info */}
          <div className="mt-auto border-t border-terminal-border px-3 py-2 text-[8px] text-text-muted">
            <div>SYS: NOMINAL</div>
            <div>MEM: 128MB / 512MB</div>
            <div>FEED: 6/6 ACTIVE</div>
            <div className="mt-1 text-neon-green">● ALL SYSTEMS GO</div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {tabError ? (
            <ErrorBoundaryFallback tabId={activeTab} />
          ) : (
            <ActiveComponent />
          )}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="bg-terminal-card border-t border-terminal-border px-4 py-0.5 flex items-center justify-between text-[9px] text-text-muted select-none">
        <div className="flex items-center gap-4">
          <span>NOVA CAPITAL TERMINAL</span>
          <span>|</span>
          <span>Session: {Math.random().toString(36).slice(2, 10).toUpperCase()}</span>
          <span>|</span>
          <span>Latency: 12ms</span>
        </div>
        <div className="flex items-center gap-4">
          <span>F1-F6: Switch Tabs</span>
          <span>|</span>
          <span>© 2024 Nova Capital</span>
        </div>
      </footer>
    </div>
  );
}
