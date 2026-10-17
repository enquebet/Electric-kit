import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import { DesignScenarioV2, ScenarioTypeV2 } from '../../types/cases';
import { EntityIds } from '../../identity/id-generator';
import { Sliders, Plus, CheckCircle, Trash2, X, Thermometer, Battery, Zap } from 'lucide-react';

interface ScenariosViewProps {
  project: ElectroKitProjectV2;
  activeCaseId: string;
  activeScenarioId?: string;
  onSelectScenario: (scenarioId: string) => void;
  onUpdateScenarios: (scenarios: DesignScenarioV2[], caseId: string) => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  project,
  activeCaseId,
  activeScenarioId,
  onSelectScenario,
  onUpdateScenarios,
}) => {
  const activeCase = project.designCases.find(c => c.id === activeCaseId) || project.designCases[0];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scenName, setScenName] = useState('');
  const [scenType, setScenType] = useState<ScenarioTypeV2>('nominal');
  const [description, setDescription] = useState('');
  const [ambientTempC, setAmbientTempC] = useState<number | undefined>();
  const [inputVoltageV, setInputVoltageV] = useState<number | undefined>();
  const [loadCurrentA, setLoadCurrentA] = useState<number | undefined>();

  const openCreateModal = () => {
    setScenName('');
    setScenType('worst_case_max');
    setDescription('');
    setAmbientTempC(70);
    setInputVoltageV(32);
    setLoadCurrentA(6);
    setIsModalOpen(true);
  };

  const handleCreateScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenName.trim() || !activeCase) return;
    const now = new Date().toISOString();

    const newScen: DesignScenarioV2 = {
      id: EntityIds.scenario(),
      caseId: activeCase.id,
      name: scenName.trim(),
      type: scenType,
      description: description.trim(),
      environmentalOverrides: {
        ambientTemperatureC: ambientTempC,
        inputVoltageV: inputVoltageV,
        loadCurrentA: loadCurrentA,
      },
      parameterOverrides: {},
      createdAt: now,
    };

    const updated = [...(activeCase.scenarios || []), newScen];
    onUpdateScenarios(updated, activeCase.id);
    onSelectScenario(newScen.id);
    setIsModalOpen(false);
  };

  const handleDeleteScenario = (id: string) => {
    if (!activeCase || activeCase.scenarios.length <= 1) return;
    const remaining = activeCase.scenarios.filter(s => s.id !== id);
    onUpdateScenarios(remaining, activeCase.id);
    if (activeScenarioId === id) {
      onSelectScenario(remaining[0].id);
    }
  };

  const currentScenarios = activeCase?.scenarios || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Operating Envelopes & Corner Scenarios
          </h2>
          <p className="text-xs text-slate-400">
            Corner operating conditions for <strong className="text-cyan-300">{activeCase?.name}</strong> (Hot, Cold, Heavy Load, EOL).
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Scenario</span>
        </button>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentScenarios.map(scen => {
          const isSelected = scen.id === activeScenarioId || (!activeScenarioId && scen.type === 'nominal');
          return (
            <div
              key={scen.id}
              className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 shadow-sm ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/40">
                      {scen.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 uppercase">
                      {scen.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        ACTIVE
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectScenario(scen.id)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                      >
                        Activate
                      </button>
                    )}

                    {currentScenarios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteScenario(scen.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                        title="Delete scenario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{scen.name}</h3>
                <p className="text-xs text-slate-400">{scen.description}</p>

                {/* Environmental Overrides */}
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Ambient</span>
                    <span className="font-bold text-slate-300">
                      {scen.environmentalOverrides.ambientTemperatureC !== undefined
                        ? `${scen.environmentalOverrides.ambientTemperatureC}°C`
                        : 'Nominal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Input Line</span>
                    <span className="font-bold text-slate-300">
                      {scen.environmentalOverrides.inputVoltageV !== undefined
                        ? `${scen.environmentalOverrides.inputVoltageV}V`
                        : 'Nominal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Load Demand</span>
                    <span className="font-bold text-slate-300">
                      {scen.environmentalOverrides.loadCurrentA !== undefined
                        ? `${scen.environmentalOverrides.loadCurrentA}A`
                        : 'Nominal'}
                    </span>
                  </div>
                </div>
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
              <h3 className="text-sm font-bold text-slate-100">Create Corner Scenario</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateScenario} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Scenario Name *</label>
                <input
                  type="text"
                  required
                  value={scenName}
                  onChange={e => setScenName(e.target.value)}
                  placeholder="e.g. Worst-Case High Line & High Temp"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Scenario Type</label>
                <select
                  value={scenType}
                  onChange={e => setScenType(e.target.value as ScenarioTypeV2)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                >
                  <option value="nominal">Nominal Benchmark</option>
                  <option value="worst_case_max">Worst-Case Maximum Stress</option>
                  <option value="worst_case_min">Worst-Case Minimum Bounds</option>
                  <option value="high_temperature">High Temperature Corner (+85°C)</option>
                  <option value="cold_start">Cold Start Corner (-40°C)</option>
                  <option value="heavy_load">Maximum Overload Transient</option>
                  <option value="light_load_quiescent">Light Load / Quiescent Sleep</option>
                  <option value="battery_eol">End-of-Life Battery Degradation</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ambient (°C)</label>
                  <input
                    type="number"
                    value={ambientTempC ?? ''}
                    onChange={e => setAmbientTempC(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="70"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Input (V)</label>
                  <input
                    type="number"
                    value={inputVoltageV ?? ''}
                    onChange={e => setInputVoltageV(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="32"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Load (A)</label>
                  <input
                    type="number"
                    value={loadCurrentA ?? ''}
                    onChange={e => setLoadCurrentA(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="6"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Stress boundary conditions..."
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
                  Create Scenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
