import React, { useState, useEffect, useRef } from 'react';
import { ElectroKitProjectV2 } from '../types/project';
import { searchProject, SearchResultItem, WorkspaceSectionKey } from '../search/global-search';
import { Search, X, ChevronRight, Tag } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  project: ElectroKitProjectV2;
  onClose: () => void;
  onNavigate: (section: WorkspaceSectionKey, entityId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  project,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const found = searchProject(project, query);
    setResults(found);
    setSelectedIndex(0);
  }, [query, project]);

  // Keyboard navigation inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        const sel = results[selectedIndex];
        onNavigate(sel.targetSection, sel.id);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search requirements, systems, components, calculations, snapshots..."
            className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Type to search across all requirements, constraints, systems, components, calculations, snapshots, and governance.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching engineering entities found for &quot;<span className="text-cyan-300">{query}</span>&quot;
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.entityType}_${item.id}_${idx}`}
                  type="button"
                  onClick={() => {
                    onNavigate(item.targetSection, item.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-lg flex items-start justify-between gap-3 transition cursor-pointer ${
                    isSelected ? 'bg-cyan-950/60 border border-cyan-800/60 text-slate-100' : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700 uppercase">
                        {item.entityType}
                      </span>
                      {item.category && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 truncate">{item.title}</span>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.snippet}</p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 self-center" />
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard hints */}
        <div className="p-2 border-t border-slate-800 bg-slate-950/60 text-[10px] font-mono text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
};
