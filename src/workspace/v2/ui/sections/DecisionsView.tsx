import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import { EngineeringDecisionV2 } from '../../types/governance';
import { EntityIds } from '../../identity/id-generator';
import {
  Award,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface DecisionsViewProps {
  project: ElectroKitProjectV2;
  onUpdateDecisions: (decisions: EngineeringDecisionV2[]) => void;
  onNavigateToSnapshot?: (snapId: string) => void;
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({
  project,
  onUpdateDecisions,
  onNavigateToSnapshot,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [context, setContext] = useState('');
  const [tradeoffs, setTradeoffs] = useState('');
  const [evidenceSnapId, setEvidenceSnapId] = useState('');

  const openCreateModal = () => {
    setTitle('');
    setStatement('');
    setContext('');
    setTradeoffs('');
    setEvidenceSnapId(project.calculationSnapshots[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !statement.trim()) return;
    const now = new Date().toISOString();

    const newDec: EngineeringDecisionV2 = {
      id: EntityIds.decision(),
      title: title.trim(),
      statement: statement.trim(),
      context: context.trim(),
      optionsConsidered: [
        { id: 'opt_1', title: 'Selected Architecture', description: statement.trim(), pros: ['Optimal efficiency and thermal margin'], cons: [] },
      ],
      chosenOptionId: 'opt_1',
      tradeoffsSummary: tradeoffs.trim(),
      evidenceSnapshotIds: evidenceSnapId ? [evidenceSnapId] : [],
      decisionMaker: project.metadata.author || 'Lead Hardware Engineer',
      decidedAt: now,
      status: 'approved',
    };

    onUpdateDecisions([newDec, ...project.decisions]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdateDecisions(project.decisions.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            Engineering Decision Records (ADRs)
          </h2>
          <p className="text-xs text-slate-400">
            Formally log architectural trade-offs, topology choices, and component selections with calculation snapshot evidence.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Decision</span>
        </button>
      </div>

      {/* Decisions List */}
      <div className="space-y-3">
        {project.decisions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No engineering decisions logged yet. Record your component and architectural trade-offs.
          </div>
        ) : (
          project.decisions.map(dec => (
            <div
              key={dec.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/40">
                      {dec.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                      {dec.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(dec.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400"
                    title="Delete decision"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{dec.title}</h3>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                    Decision Statement:
                  </span>
                  <p className="text-slate-200">{dec.statement}</p>
                </div>

                {dec.context && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Context:</strong> {dec.context}
                  </p>
                )}

                {dec.tradeoffsSummary && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Trade-offs:</strong> {dec.tradeoffsSummary}
                  </p>
                )}

                {/* Evidence Snapshot Links */}
                {dec.evidenceSnapshotIds.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Supporting Evidence Snapshot:</span>
                    {onNavigateToSnapshot ? (
                      <button
                        type="button"
                        onClick={() => onNavigateToSnapshot(dec.evidenceSnapshotIds[0])}
                        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{dec.evidenceSnapshotIds[0]}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-cyan-400 font-bold">{dec.evidenceSnapshotIds[0]}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Log Engineering Decision</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Decision Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Select GaN FET over Silicon MOSFET"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Decision Statement *</label>
                <textarea
                  rows={2}
                  required
                  value={statement}
                  onChange={e => setStatement(e.target.value)}
                  placeholder="We decided to use EPC2045 GaN FETs to eliminate body-diode recovery losses..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Context / Motivation</label>
                <textarea
                  rows={2}
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="At 500 kHz switching frequency, Silicon MOSFET recovery loss exceeds 2.1W..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Trade-offs & Rationale</label>
                <input
                  type="text"
                  value={tradeoffs}
                  onChange={e => setTradeoffs(e.target.value)}
                  placeholder="Higher component cost offset by 50% smaller heatsink requirement."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Evidence Calculation Snapshot</label>
                <select
                  value={evidenceSnapId}
                  onChange={e => setEvidenceSnapId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono"
                >
                  <option value="">No snapshot attached</option>
                  {project.calculationSnapshots.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} (Calc: {s.calculationId})
                    </option>
                  ))}
                </select>
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
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
