import React, { useState, useMemo } from 'react';
import { FORMULA_BOOK } from '../../data/formulas';
import { CATEGORIES } from '../../data/taxonomy';
import { BookMarked, Search, ArrowRight, Layers } from 'lucide-react';

interface FormulaBookViewProps {
  onSelectTool: (toolSlug: string) => void;
}

export const FormulaBookView: React.FC<FormulaBookViewProps> = ({ onSelectTool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFormulas = useMemo(() => {
    return FORMULA_BOOK.filter((f) => {
      const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchCat;

      const matchText =
        f.name.toLowerCase().includes(query) ||
        f.equationText.toLowerCase().includes(query) ||
        f.explanation.toLowerCase().includes(query) ||
        f.variables.some((v) => v.name.toLowerCase().includes(query) || v.symbol.toLowerCase().includes(query));

      return matchCat && matchText;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">Engineering Formula Book</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Definitive directory of electronics formulas, variable definitions, SI units, and derivations.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800/40">
            {filteredFormulas.length} Formulas Available
          </span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formulas by name, equation symbol, variable, or principle..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-mono text-slate-200 bg-slate-900/90 rounded-xl border border-slate-800 outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 text-xs font-medium rounded-lg border whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.slice(0, 7).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === c.id
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Formula Cards List */}
      <div className="flex flex-col gap-4">
        {filteredFormulas.map((item) => (
          <div
            key={item.id}
            id={item.id}
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col gap-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                  fx
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{item.name}</h3>
                  <span className="text-[11px] text-cyan-400/90 font-mono capitalize">
                    Category: {item.category}
                  </span>
                </div>
              </div>

              {item.relatedToolId && (
                <button
                  type="button"
                  onClick={() => onSelectTool(item.relatedToolId!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 text-xs font-medium transition-all cursor-pointer self-start sm:self-center"
                >
                  <span>Open Interactive Calculator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Display Equation */}
            <div className="py-3 px-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Equation:</span>
              <span className="text-base sm:text-lg font-mono font-bold text-cyan-300 tracking-wide">
                {item.equationText}
              </span>
            </div>

            {/* Variable definitions */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Variable Definitions &amp; Units
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
                {item.variables.map((v) => (
                  <div
                    key={v.symbol}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-300 font-bold text-xs">{v.symbol}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded">
                        {v.unit}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-200 mt-0.5">{v.name}</span>
                    <span className="text-[11px] text-slate-400 leading-snug">{v.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scientific Explanation & Example */}
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              <p>{item.explanation}</p>
              {item.example && (
                <p className="text-slate-400 font-mono text-[11px] mt-1 pt-1 border-t border-slate-800">
                  <span className="text-cyan-400 font-semibold">Example: </span>
                  {item.example}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
