import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import { CalculationInstanceV2 } from '../../types/calculations';
import { executeCalculationInContext } from '../../execution/calculation-context';
import {
  Calculator,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface CalculationsViewProps {
  project: ElectroKitProjectV2;
  activeCaseId: string;
  activeScenarioId?: string;
  onUpdateProject: (updated: ElectroKitProjectV2) => void;
  onNavigateToSnapshot?: (snapId: string) => void;
}

export const CalculationsView: React.FC<CalculationsViewProps> = ({
  project,
  activeCaseId,
  activeScenarioId,
  onUpdateProject,
  onNavigateToSnapshot,
}) => {
  const [selectedCalcId, setSelectedCalcId] = useState<string>(
    project.calculations[0]?.id || ''
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcMessage, setCalcMessage] = useState<string | null>(null);

  const selectedCalc = project.calculations.find(c => c.id === selectedCalcId) || project.calculations[0];

  const handleRecalculate = (calculationId: string) => {
    setIsCalculating(true);
    setCalcMessage(null);
    try {
      const res = executeCalculationInContext({
        project,
        calculationId,
        caseId: activeCaseId,
        scenarioId: activeScenarioId,
      });
      onUpdateProject(res.updatedProject);
      setCalcMessage(`Successfully executed with engine "${res.calculation.engineId}". Snapshot generated.`);
    } catch (err: any) {
      setCalcMessage(`Calculation failed: ${err.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            Project Calculation Registry & Execution History
          </h2>
          <p className="text-xs text-slate-400">
            Authoritative deterministic calculation instances tied to active design case and corner scenarios.
          </p>
        </div>
      </div>

      {calcMessage && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-xs text-cyan-300 font-mono flex items-center justify-between">
          <span>{calcMessage}</span>
          <button
            type="button"
            onClick={() => setCalcMessage(null)}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Two Column Layout: List on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Calculation Instances List */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Calculations ({project.calculations.length})
          </span>

          <div className="space-y-1.5">
            {project.calculations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                No calculations registered in project.
              </div>
            ) : (
              project.calculations.map(calc => {
                const isSelected = calc.id === selectedCalc?.id;
                return (
                  <div
                    key={calc.id}
                    onClick={() => setSelectedCalcId(calc.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-600 text-slate-100 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                        {calc.id}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {calc.status}
                      </span>
                    </div>

                    <div className="text-xs font-bold truncate">{calc.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      Engine: {calc.engineId}
                    </div>

                    <div className="pt-1 text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-800/60">
                      <span>Last run:</span>
                      <span>
                        {calc.lastCalculatedAt
                          ? new Date(calc.lastCalculatedAt).toLocaleTimeString()
                          : 'never'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Selected Calculation Inspector & Execution */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCalc ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                      {selectedCalc.id}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Tool: <strong className="text-slate-300">{selectedCalc.toolSlug}</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{selectedCalc.name}</h3>
                  <div className="text-xs font-mono text-indigo-400">
                    Deterministic Engine ID: {selectedCalc.engineId}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRecalculate(selectedCalc.id)}
                  disabled={isCalculating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isCalculating ? 'Calculating...' : 'Run Engine'}</span>
                </button>
              </div>

              {/* Formula Reference */}
              {selectedCalc.formulaReferences.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Mathematical Formulation:
                  </span>
                  <div className="text-cyan-300">{selectedCalc.formulaReferences[0]}</div>
                </div>
              )}

              {/* Inputs & Outputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Inputs */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Inputs (Resolved in Context)
                  </span>
                  <div className="space-y-1 font-mono text-xs max-h-48 overflow-y-auto">
                    {Object.entries(selectedCalc.inputs || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900">
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-bold text-slate-200">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outputs */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                    Evaluated Numerical Outputs
                  </span>
                  <div className="space-y-1 font-mono text-xs max-h-48 overflow-y-auto">
                    {Object.entries(selectedCalc.outputs || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900">
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-bold text-emerald-300">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Margins */}
              {selectedCalc.margins.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Engineering Headroom & Margins
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCalc.margins.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="text-slate-300 font-bold">{m.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Nominal: {m.nominalValue} / Limit: {m.limitValue} {m.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">+{m.percentageHeadroom}%</div>
                          <div className="text-[10px] text-slate-400">({m.marginHeadroom} {m.unit})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Snapshot Link */}
              {selectedCalc.latestSnapshotId && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Latest Immutable Snapshot:</span>
                  {onNavigateToSnapshot ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToSnapshot(selectedCalc.latestSnapshotId!)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <span>{selectedCalc.latestSnapshotId}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-cyan-400 font-bold">{selectedCalc.latestSnapshotId}</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              Select a calculation to inspect its execution parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
