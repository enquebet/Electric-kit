import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import { CalculationSnapshotV2 } from '../../types/calculations';
import { verifySnapshotIntegrity } from '../../integrity/hasher';
import {
  Camera,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Clock,
  ChevronRight,
  Search,
} from 'lucide-react';

interface SnapshotsViewProps {
  project: ElectroKitProjectV2;
  selectedSnapshotId?: string;
  onSelectSnapshot?: (id: string) => void;
}

export const SnapshotsView: React.FC<SnapshotsViewProps> = ({
  project,
  selectedSnapshotId,
  onSelectSnapshot,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    selectedSnapshotId || project.calculationSnapshots[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');

  const activeId = selectedSnapshotId || internalSelectedId;
  const selectedSnap =
    project.calculationSnapshots.find(s => s.id === activeId) ||
    project.calculationSnapshots[0];

  const handleSelect = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectSnapshot) {
      onSelectSnapshot(id);
    }
  };

  const filteredSnapshots = project.calculationSnapshots.filter(s =>
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.calculationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            Calculation Snapshots Archive
          </h2>
          <p className="text-xs text-slate-400">
            Immutable, cryptographically verified calculation evidence records frozen in time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Snapshots List */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search snapshots..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {filteredSnapshots.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                No snapshots match the search criteria.
              </div>
            ) : (
              filteredSnapshots.map(snap => {
                const isSelected = snap.id === selectedSnap?.id;
                const isVerified = verifySnapshotIntegrity(snap);
                return (
                  <div
                    key={snap.id}
                    onClick={() => handleSelect(snap.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-600 text-slate-100 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                        {snap.id}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        {isVerified ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            Tampered
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-300 truncate">
                      Calc ID: {snap.calculationId}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {snap.notes || 'No description notes'}
                    </div>

                    <div className="pt-1 text-[10px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-800/60">
                      <span>{new Date(snap.timestamp).toLocaleDateString()}</span>
                      <span>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Selected Snapshot Inspector */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSnap ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                      {selectedSnap.id}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-400">
                      <Lock className="w-3 h-3 text-slate-500" />
                      Read-Only Immutable Evidence
                    </span>
                  </div>
                  <h3 className="text-sm font-mono font-bold text-slate-200">
                    Calculation Source: {selectedSnap.calculationId}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400">
                    Timestamp: {selectedSnap.timestamp}
                  </div>
                </div>

                {/* Cryptographic Digest Check */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">
                    Integrity Digest:
                  </span>
                  <div className="text-emerald-400 font-bold truncate max-w-[200px]" title={selectedSnap.integrityDigest}>
                    {selectedSnap.integrityDigest}
                  </div>
                </div>
              </div>

              {selectedSnap.formulaSnippet && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Evaluated Mathematical Formulation:
                  </span>
                  <div className="text-cyan-300">{selectedSnap.formulaSnippet}</div>
                </div>
              )}

              {/* Read Only Inputs and Outputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Frozen Inputs
                  </span>
                  <div className="space-y-1 font-mono text-xs max-h-56 overflow-y-auto">
                    {Object.entries(selectedSnap.inputs || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-900">
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-bold text-slate-200">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                    Frozen Outputs
                  </span>
                  <div className="space-y-1 font-mono text-xs max-h-56 overflow-y-auto">
                    {Object.entries(selectedSnap.outputs || {}).map(([k, v]) => (
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

              {/* Frozen Margins */}
              {selectedSnap.margins.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Frozen Headroom Margins
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedSnap.margins.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="text-slate-300 font-bold">{m.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {m.nominalValue} / {m.limitValue} {m.unit}
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
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              No snapshot selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
