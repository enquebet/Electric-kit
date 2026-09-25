import React, { useState, useMemo } from 'react';
import { CATEGORIES, COMPLETE_TAXONOMY_TOOLS } from '../../data/taxonomy';
import { Layers, CheckCircle2, Clock, ArrowUpRight, Search } from 'lucide-react';

interface TaxonomyExplorerViewProps {
  onSelectTool: (toolSlug: string) => void;
}

export const TaxonomyExplorerView: React.FC<TaxonomyExplorerViewProps> = ({ onSelectTool }) => {
  const [filterState, setFilterState] = useState<'all' | 'active' | 'roadmap'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const totalPlanned = COMPLETE_TAXONOMY_TOOLS.length;
  const totalImplemented = COMPLETE_TAXONOMY_TOOLS.filter((t) => t.implemented).length;

  const filteredTools = useMemo(() => {
    return COMPLETE_TAXONOMY_TOOLS.filter((tool) => {
      const matchStatus =
        filterState === 'all' ||
        (filterState === 'active' && tool.implemented) ||
        (filterState === 'roadmap' && !tool.implemented);

      const matchCat = selectedCat === 'all' || tool.category === selectedCat;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q);

      return matchStatus && matchCat && matchSearch;
    });
  }, [filterState, selectedCat, searchQuery]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Overview Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">ElectroKit 14-Domain Engineering Taxonomy</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive client-side electronics catalog spanning 14 categories and planned ~180 engineering calculators.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Phase 01 Implemented</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              {totalImplemented} Active Tools
            </span>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Domain Roadmap</span>
            <span className="text-lg font-mono font-bold text-cyan-400">
              ~180 Planned Tools
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search taxonomy tools by name, category, or function..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-mono text-slate-200 bg-slate-900/90 rounded-xl border border-slate-800 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
            {[
              { id: 'all', label: 'All Tools' },
              { id: 'active', label: 'Active (10)' },
              { id: 'roadmap', label: 'Roadmap' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterState(f.id as any)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  filterState === f.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap cursor-pointer transition-all ${
              selectedCat === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All 14 Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg border whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                selectedCat === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold opacity-75">[{cat.letter}]</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => {
          const categoryObj = CATEGORIES.find((c) => c.id === tool.category);
          return (
            <div
              key={tool.id}
              id={`tool-card-${tool.id}`}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                tool.implemented
                  ? 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-500/60 shadow-sm cursor-pointer'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-70'
              }`}
              onClick={() => {
                if (tool.implemented) {
                  onSelectTool(tool.id);
                }
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    Category {categoryObj?.letter || '•'}: {categoryObj?.name || tool.category}
                  </span>

                  {tool.implemented ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3" />
                      Active (PoC)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      <Clock className="w-3 h-3" />
                      Planned
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between group">
                  <span>{tool.name}</span>
                  {tool.implemented && (
                    <ArrowUpRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  )}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {tool.implemented && (
                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-medium">
                  <span>Open Tool</span>
                  <span className="font-mono text-[10px] text-slate-500">Instant client-side</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
