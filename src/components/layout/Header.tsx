import React from 'react';
import { Cpu, Search, BookMarked, Layers, ShieldCheck, Menu } from 'lucide-react';

interface HeaderProps {
  activeView: 'tool' | 'formulas' | 'taxonomy';
  onSelectView: (view: 'tool' | 'formulas' | 'taxonomy') => void;
  onOpenSearch: () => void;
  onToggleMobileSidebar: () => void;
  activeToolName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onOpenSearch,
  onToggleMobileSidebar,
  activeToolName,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onSelectView('tool')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 p-0.5 shadow-md shadow-cyan-950 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-100">
                  Electro<span className="text-cyan-400">Kit</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Client-Side Electronics Engineering Toolbox
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Trigger) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-mono text-slate-400 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search 10 tools &amp; engineering formulas...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700 shadow-sm">
              ⌘K / /
            </kbd>
          </button>
        </div>

        {/* Navigation Tabs & Status */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onSelectView('formulas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              activeView === 'formulas'
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Formula Book</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('taxonomy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              activeView === 'taxonomy'
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Taxonomy (180+)</span>
          </button>

          {/* Offline / Client-Side Persistence Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Client-Side</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb row if active tool */}
      {activeView === 'tool' && activeToolName && (
        <div className="px-4 sm:px-6 py-1.5 bg-slate-900/60 border-t border-slate-800/50 flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-slate-500">Tool:</span>
          <span className="text-cyan-400 font-semibold">{activeToolName}</span>
        </div>
      )}
    </header>
  );
};
