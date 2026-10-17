import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import { DesignCaseV2 } from '../../types/cases';
import { EntityIds } from '../../identity/id-generator';
import { GitBranch, Plus, Star, CheckCircle, Copy, Trash2, X, Sliders } from 'lucide-react';

interface CasesViewProps {
  project: ElectroKitProjectV2;
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  onUpdateCases: (cases: DesignCaseV2[], newActiveId?: string) => void;
}

export const CasesView: React.FC<CasesViewProps> = ({
  project,
  activeCaseId,
  onSelectCase,
  onUpdateCases,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [baseOnCaseId, setBaseOnCaseId] = useState<string>('');

  const openCreateModal = () => {
    setCaseName('');
    setCaseDescription('');
    setBaseOnCaseId(activeCaseId || project.designCases[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;
    const now = new Date().toISOString();
    const newCaseId = EntityIds.case();

    const parentCase = project.designCases.find(c => c.id === baseOnCaseId);
    const clonedInputs = parentCase ? JSON.parse(JSON.stringify(parentCase.inputs)) : {};

    const newCase: DesignCaseV2 = {
      id: newCaseId,
      name: caseName.trim(),
      description: caseDescription.trim(),
      isBaseline: false,
      revisionNumber: (parentCase?.revisionNumber || 1) + 1,
      inputs: clonedInputs,
      assumptionOverrides: [],
      scenarios: [
        {
          id: EntityIds.scenario(),
          caseId: newCaseId,
          name: 'Nominal Operating Point',
          type: 'nominal',
          description: 'Standard nominal operating conditions',
          environmentalOverrides: {},
          parameterOverrides: {},
          createdAt: now,
        },
      ],
      associatedCalculationIds: parentCase ? [...parentCase.associatedCalculationIds] : [],
      associatedSnapshotIds: [],
      createdAt: now,
      updatedAt: now,
    };

    const updatedCases = [...project.designCases, newCase];
    onUpdateCases(updatedCases, newCaseId);
    onSelectCase(newCaseId);
    setIsModalOpen(false);
  };

  const handleSetBaseline = (id: string) => {
    const updated = project.designCases.map(c => ({
      ...c,
      isBaseline: c.id === id,
    }));
    onUpdateCases(updated);
  };

  const handleDeleteCase = (id: string) => {
    if (project.designCases.length <= 1) return;
    const updated = project.designCases.filter(c => c.id !== id);
    const fallbackId = updated[0].id;
    onUpdateCases(updated, activeCaseId === id ? fallbackId : undefined);
    if (activeCaseId === id) {
      onSelectCase(fallbackId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            Design Cases & Architecture Variants
          </h2>
          <p className="text-xs text-slate-400">
            Isolated design alternatives (e.g. Baseline, GaN vs Silicon, High-Temp) with independent calculation states.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Design Case</span>
        </button>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {project.designCases.map(c => {
          const isActive = c.id === activeCaseId;
          return (
            <div
              key={c.id}
              className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm ${
                isActive
                  ? 'bg-slate-900 border-cyan-500/80 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                    {c.id}
                  </span>
                  {c.isBaseline && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                      <Star className="w-3 h-3 fill-amber-300" />
                      BASELINE
                    </span>
                  )}
                  {isActive && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      ACTIVE WORKSPACE
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">
                    Rev {c.revisionNumber}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{c.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                  <span>Scenarios: <strong className="text-slate-200">{c.scenarios.length}</strong></span>
                  <span>Calculations: <strong className="text-slate-200">{c.associatedCalculationIds.length}</strong></span>
                  <span>Snapshots: <strong className="text-slate-200">{c.associatedSnapshotIds.length}</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => onSelectCase(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 transition cursor-pointer"
                  >
                    Set Active
                  </button>
                )}

                {!c.isBaseline && (
                  <button
                    type="button"
                    onClick={() => handleSetBaseline(c.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                    title="Designate as project baseline"
                  >
                    Make Baseline
                  </button>
                )}

                {project.designCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCase(c.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 transition cursor-pointer"
                    title="Delete case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Create New Design Case</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Case Name *</label>
                <input
                  type="text"
                  required
                  value={caseName}
                  onChange={e => setCaseName(e.target.value)}
                  placeholder="e.g. Revision B - GaN Architecture"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Base Parameters On</label>
                <select
                  value={baseOnCaseId}
                  onChange={e => setBaseOnCaseId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                >
                  {project.designCases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isBaseline ? '(Baseline)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description / Trade-off Objective</label>
                <textarea
                  rows={2}
                  value={caseDescription}
                  onChange={e => setCaseDescription(e.target.value)}
                  placeholder="Reason for alternative design..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
