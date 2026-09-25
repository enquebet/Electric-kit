import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Zap, BookMarked, ArrowRight } from 'lucide-react';
import { TOOLS_REGISTRY } from '../../data/registry';
import { FORMULA_BOOK } from '../../data/formulas';
import { CATEGORIES } from '../../data/taxonomy';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (slug: string) => void;
  onSelectFormulaView: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  onSelectFormulaView,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search in active tools
  const matchingTools = TOOLS_REGISTRY.filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q))
  );

  // Search in formula book
  const matchingFormulas = FORMULA_BOOK.filter(
    (f) =>
      q &&
      (f.name.toLowerCase().includes(q) ||
        f.equationText.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search engineering tools, formulas, components, or SI quantities..."
            className="w-full text-sm font-mono text-slate-100 bg-transparent outline-none placeholder:text-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 flex flex-col gap-5">
          {/* Active Calculators Section */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">
              Calculators &amp; Interactive Tools ({matchingTools.length})
            </span>
            {matchingTools.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No tools matching query</span>
            ) : (
              <div className="flex flex-col gap-1.5">
                {matchingTools.map((tool) => {
                  const cat = CATEGORIES.find((c) => c.id === tool.category);
                  return (
                    <div
                      key={tool.id}
                      onClick={() => {
                        onSelectTool(tool.id);
                        onClose();
                      }}
                      className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/80 hover:border-cyan-500/50 flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-md bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                            {tool.name}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate">
                            {tool.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {cat?.name.split(' ')[0]}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formulas Section */}
          {matchingFormulas.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                Formulas from Formula Book ({matchingFormulas.length})
              </span>
              <div className="flex flex-col gap-1.5">
                {matchingFormulas.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      if (f.relatedToolId) {
                        onSelectTool(f.relatedToolId);
                      } else {
                        onSelectFormulaView();
                      }
                      onClose();
                    }}
                    className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/80 hover:border-cyan-500/50 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-md bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
                        <BookMarked className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                          {f.name}
                        </span>
                        <span className="text-[11px] font-mono text-cyan-300">
                          {f.equationText}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">View Formula</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Client-side search · Fast indexing</span>
          <span className="font-mono">Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
