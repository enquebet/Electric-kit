import React from 'react';
import { ElectroKitProjectV2 } from '../types/project';
import { Search, Layers, Sliders, ChevronRight } from 'lucide-react';

interface ContextBarProps {
  project: ElectroKitProjectV2;
  activeCaseId: string;
  activeScenarioId?: string;
  onSelectCase: (caseId: string) => void;
  onSelectScenario: (scenarioId: string) => void;
  onOpenSearch: () => void;
}

export const ContextBar: React.FC<ContextBarProps> = ({
  project,
  activeCaseId,
  activeScenarioId,
  onSelectCase,
  onSelectScenario,
  onOpenSearch,
}) => {
  const activeCase = project.designCases.find(c => c.id === activeCaseId) || project.designCases[0];
  const activeScenario = activeCase?.scenarios.find(s => s.id === activeScenarioId) || activeCase?.scenarios[0];

  return (
    <div className="bg-slate-950/70 border-b border-slate-800/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* Context Breadcrumb & Quick Switchers */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
          <Layers className="w-3 h-3 text-cyan-400" />
          Context:
        </span>

        {/* Case Selector Chips */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {project.designCases.map(c => {
            const isSelected = c.id === activeCase?.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCase(c.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.name} {c.isBaseline && '★'}
              </button>
            );
          })}
        </div>

        <ChevronRight className="w-3 h-3 text-slate-600 hidden sm:inline" />

        {/* Scenario Selector Chips */}
        {activeCase && activeCase.scenarios.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-0.5">
              <Sliders className="w-2.5 h-2.5 text-indigo-400" />
              Scenario:
            </span>
            {activeCase.scenarios.map(s => {
              const isSelected = s.id === activeScenario?.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectScenario(s.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-bold shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Project Search Trigger */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
        title="Quick Search in Project (Cmd+K)"
      >
        <Search className="w-3 h-3 text-cyan-400" />
        <span className="hidden md:inline">Search project...</span>
        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
          ⌘K
        </span>
      </button>
    </div>
  );
};
