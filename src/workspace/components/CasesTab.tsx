import React, { useState } from 'react';
import { ElectroKitProject, DesignCase, ScenarioType } from '../types';
import {
  addDesignCase,
  setBaselineCase,
  deleteDesignCase,
  addScenario,
  deleteScenario,
  compareDesignCases,
} from '../case-manager';
import {
  GitBranch,
  Plus,
  Trash2,
  Check,
  Sliders,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface CasesTabProps {
  project: ElectroKitProject;
  onUpdateProject: (updated: ElectroKitProject) => void;
}

export const CasesTab: React.FC<CasesTabProps> = ({ project, onUpdateProject }) => {
  const [showAddCase, setShowAddCase] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [cloneCaseId, setCloneCaseId] = useState<string>('');

  const [showAddScenario, setShowAddScenario] = useState(false);
  const [scenName, setScenName] = useState('');
  const [scenType, setScenType] = useState<ScenarioType>('worst-case');

  const activeCase =
    project.designCases.find((c) => c.id === project.activeCaseId) || project.designCases[0];

  const handleCreateCase = () => {
    if (!newCaseName) return;
    const clone = JSON.parse(JSON.stringify(project));
    addDesignCase(clone, newCaseName, newCaseDesc, cloneCaseId || undefined);
    onUpdateProject(clone);
    setNewCaseName('');
    setNewCaseDesc('');
    setShowAddCase(false);
  };

  const handleSetActiveCase = (caseId: string) => {
    onUpdateProject({ ...project, activeCaseId: caseId });
  };

  const handleSetBaseline = (caseId: string) => {
    const clone = JSON.parse(JSON.stringify(project));
    setBaselineCase(clone, caseId);
    onUpdateProject(clone);
  };

  const handleDeleteCase = (caseId: string) => {
    const clone = JSON.parse(JSON.stringify(project));
    if (deleteDesignCase(clone, caseId)) {
      onUpdateProject(clone);
    }
  };

  const handleAddScenario = () => {
    if (!scenName || !activeCase) return;
    const clone = JSON.parse(JSON.stringify(project));
    addScenario(clone, activeCase.id, scenName, scenType, {});
    onUpdateProject(clone);
    setScenName('');
    setShowAddScenario(false);
  };

  const handleDeleteScen = (id: string) => {
    const clone = JSON.parse(JSON.stringify(project));
    deleteScenario(clone, id);
    onUpdateProject(clone);
  };

  // Run multi-case comparison matrix
  const comparison = compareDesignCases(project);

  return (
    <div className="space-y-6">
      {/* Design Cases Header & Switcher */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              Design Cases ({project.designCases?.length || 0})
            </h3>
            <p className="text-xs text-slate-400">
              Explore design variants, parameter trade-offs, and alternative architectures.
            </p>
          </div>
          <button
            onClick={() => setShowAddCase(!showAddCase)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-cyan-950"
          >
            <Plus className="w-3.5 h-3.5" />
            New Design Case
          </button>
        </div>

        {/* Add Case Form */}
        {showAddCase && (
          <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-cyan-800/50 space-y-3 text-xs">
            <h4 className="font-semibold text-cyan-400 font-mono">Create New Design Case</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Case Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rev B - Low DCR Inductor"
                  value={newCaseName}
                  onChange={(e) => setNewCaseName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Clone Snapshots From</label>
                <select
                  value={cloneCaseId}
                  onChange={(e) => setCloneCaseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="">Start Empty</option>
                  {project.designCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isBaseline ? '(Baseline)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Target improvements or architecture notes..."
                  value={newCaseDesc}
                  onChange={(e) => setNewCaseDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCase(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCase}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-slate-950 font-medium hover:bg-cyan-500"
              >
                Create Case
              </button>
            </div>
          </div>
        )}

        {/* Case Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {project.designCases.map((c) => {
            const isActive = c.id === project.activeCaseId;
            return (
              <div
                key={c.id}
                onClick={() => handleSetActiveCase(c.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-100">{c.name}</span>
                    {c.isBaseline && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-800">
                        Baseline
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">{c.description || 'No description'}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span>{(c.calculationSnapshots || []).length} snapshot(s)</span>
                  <div className="flex items-center gap-1.5">
                    {!c.isBaseline && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetBaseline(c.id);
                        }}
                        className="text-[10px] text-slate-400 hover:text-cyan-400 underline"
                      >
                        Set Baseline
                      </button>
                    )}
                    {project.designCases.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCase(c.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Delete Case"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Multi-Case Margin & Comparison Matrix */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              Multi-Case Engineering Comparison Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Rigorous margin delta tracking against baseline ({comparison.cases.find((c) => c.isBaseline)?.name || 'N/A'}).
            </p>
          </div>
        </div>

        {comparison.margins.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No calculation margins recorded yet. Add snapshots in the Calculation Snapshots tab to see comparative margin analysis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Margin Name</th>
                  {comparison.cases.map((c) => (
                    <th key={c.id} className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200 font-sans font-semibold">{c.name}</span>
                        {c.isBaseline && <span className="text-[10px] text-indigo-400 font-mono">(Base)</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparison.margins.map((m) => (
                  <tr key={m.marginName} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-300 font-sans font-medium">
                      {m.marginName} <span className="text-slate-500 font-mono">({m.unit})</span>
                    </td>
                    {comparison.cases.map((c) => {
                      const val = m.values[c.id];
                      const delta = m.deltasVsBaseline?.[c.id];
                      if (!val) {
                        return (
                          <td key={c.id} className="py-2.5 px-3 text-slate-600">
                            -
                          </td>
                        );
                      }
                      return (
                        <td key={c.id} className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                val.isSatisfied
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                  : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                              }`}
                            >
                              {val.marginValue > 0 ? '+' : ''}
                              {val.marginValue.toFixed(2)} {m.unit}
                            </span>
                            {!c.isBaseline && delta !== undefined && (
                              <span
                                className={`text-[10px] flex items-center gap-0.5 ${
                                  delta > 0
                                    ? 'text-emerald-400'
                                    : delta < 0
                                    ? 'text-rose-400'
                                    : 'text-slate-500'
                                }`}
                              >
                                {delta > 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : delta < 0 ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : null}
                                {delta > 0 ? '+' : ''}
                                {delta.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Summary Row */}
                <tr className="bg-slate-950 font-bold border-t-2 border-slate-800">
                  <td className="py-3 px-3 text-slate-400">Verdict vs Baseline</td>
                  {comparison.cases.map((c) => {
                    if (c.isBaseline) {
                      return (
                        <td key={c.id} className="py-3 px-3 text-indigo-400 font-sans text-xs">
                          BASELINE REFERENCE
                        </td>
                      );
                    }
                    const v = comparison.verdict[c.id];
                    return (
                      <td key={c.id} className="py-3 px-3 font-sans text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            v === 'IMPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : v === 'DEGRADED'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {v}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scenarios Section for Active Case */}
      {activeCase && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Scenarios for "{activeCase.name}" (
                {(project.scenarios || []).filter((s) => s.caseId === activeCase.id).length})
              </h3>
              <p className="text-xs text-slate-400">
                Operating corners: High temperature, minimum input rail, aged battery EOL.
              </p>
            </div>
            <button
              onClick={() => setShowAddScenario(!showAddScenario)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              Add Corner Scenario
            </button>
          </div>

          {showAddScenario && (
            <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-cyan-800/50 space-y-3 text-xs">
              <h4 className="font-semibold text-cyan-400 font-mono">Define Scenario</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Scenario Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Extreme Cold Ambient (-40°C)"
                    value={scenName}
                    onChange={(e) => setScenName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Corner Type</label>
                  <select
                    value={scenType}
                    onChange={(e) => setScenType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="worst-case">Worst-Case</option>
                    <option value="temperature">Temperature Corner</option>
                    <option value="supply-variation">Supply Variation</option>
                    <option value="battery-eol">Battery EOL (80% SOH)</option>
                    <option value="load">Dynamic Step Load</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddScenario(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddScenario}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 text-slate-950 font-medium hover:bg-cyan-500"
                >
                  Save Scenario
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(project.scenarios || [])
              .filter((s) => s.caseId === activeCase.id)
              .map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-200">{s.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-400 border border-slate-700">
                      {s.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mb-2">
                    Overrides: {JSON.stringify(s.parameterOverrides)}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDeleteScen(s.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
