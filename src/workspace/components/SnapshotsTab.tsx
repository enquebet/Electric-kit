import React, { useState } from 'react';
import { ElectroKitProject, CalculationSnapshot, ValidationStatus } from '../types';
import {
  createSnapshotFromCalculation,
  recalculateSnapshot,
  updateValidationStatus,
} from '../snapshot-orchestrator';
import {
  Layers,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Tag,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface SnapshotsTabProps {
  project: ElectroKitProject;
  onUpdateProject: (updated: ElectroKitProject) => void;
  onRunAiAction?: (action: 'explain' | 'critique' | 'test-plan', snap: CalculationSnapshot) => void;
}

export const SnapshotsTab: React.FC<SnapshotsTabProps> = ({
  project,
  onUpdateProject,
  onRunAiAction,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState('dc-power-budget');
  const [customName, setCustomName] = useState('');

  const activeCase =
    project.designCases.find((c) => c.id === project.activeCaseId) || project.designCases[0];

  const handleAddDefaultSnapshot = () => {
    if (!activeCase) return;

    let toolSlug = 'power-system-design';
    let engineId = selectedEngine;
    let category = 'power';
    let defaultInputs: Record<string, any> = {};
    let defaultOutputs: Record<string, any> = {};
    let name = customName;

    if (selectedEngine === 'dc-power-budget') {
      name = name || 'Main DC Rail Power Budget';
      toolSlug = 'power-system-design';
      category = 'power';
      defaultInputs = {
        supplyVoltageVolts: 12,
        supplyMaxPowerWatts: 45,
        loads: [
          { name: 'Core SoC', nominalCurrentAmps: 1.8 },
          { name: 'RF Radio', nominalCurrentAmps: 0.8 },
        ],
      };
    } else if (selectedEngine === 'thermal-junction-chain') {
      name = name || 'MOSFET Junction-to-Ambient Thermal Chain';
      toolSlug = 'thermal-system-design';
      category = 'thermal';
      defaultInputs = {
        powerDissipationWatts: 3.5,
        rThetaJunctionToCase: 1.2,
        rThetaCaseToSink: 0.5,
        rThetaSinkToAmbient: 6.5,
        ambientTemperatureC: 40,
        maxAllowedJunctionTempC: 125,
      };
    } else if (selectedEngine === 'battery-to-load') {
      name = name || 'Li-Ion Battery Bank Sizing (3-Day Autonomy)';
      toolSlug = 'battery-system-design';
      category = 'battery';
      defaultInputs = {
        dailyEnergyConsumptionWh: 24,
        desiredAutonomyDays: 3,
        nominalBatteryVoltageVolts: 3.7,
        maxDepthOfDischargePercent: 80,
        temperatureDeratingPercent: 10,
        endOfLifeCapacityRetentionPercent: 80,
        targetDesignMarginPercent: 15,
      };
    } else if (selectedEngine === 'controlled-impedance') {
      name = name || '50Ω High-Speed Microstrip Line';
      toolSlug = 'controlled-impedance';
      category = 'pcb';
      defaultInputs = {
        targetImpedanceOhms: 50,
        traceWidthMm: 0.32,
        dielectricHeightMm: 0.18,
        dielectricConstantEr: 4.2,
      };
    } else if (selectedEngine === 'pdn-target-impedance') {
      name = name || 'Core Rail PDN Target Impedance';
      toolSlug = 'power-integrity';
      category = 'pcb';
      defaultInputs = {
        supplyVoltageVolts: 1.0,
        maxAllowedRipplePercent: 3,
        maxTransientCurrentStepAmps: 2.0,
      };
    }

    // Create raw snapshot and run deterministic recalculation
    const initialSnap = createSnapshotFromCalculation({
      toolSlug,
      engineId,
      name,
      category,
      inputs: defaultInputs,
      outputs: defaultOutputs,
    });

    const evaluated = recalculateSnapshot(initialSnap);

    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    const targetCase = clone.designCases.find((c) => c.id === activeCase.id);
    if (targetCase) {
      if (!targetCase.calculationSnapshots) targetCase.calculationSnapshots = [];
      targetCase.calculationSnapshots.unshift(evaluated);
    }

    onUpdateProject(clone);
    setCustomName('');
    setShowAddModal(false);
  };

  const handleRecalculate = (snapId: string) => {
    if (!activeCase) return;
    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    const targetCase = clone.designCases.find((c) => c.id === activeCase.id);
    if (!targetCase) return;

    const snap = targetCase.calculationSnapshots.find((s) => s.id === snapId);
    if (!snap) return;

    const updated = recalculateSnapshot(snap);
    const idx = targetCase.calculationSnapshots.findIndex((s) => s.id === snapId);
    targetCase.calculationSnapshots[idx] = updated;

    onUpdateProject(clone);
  };

  const handleDeleteSnapshot = (snapId: string) => {
    if (!activeCase) return;
    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    const targetCase = clone.designCases.find((c) => c.id === activeCase.id);
    if (!targetCase) return;

    targetCase.calculationSnapshots = targetCase.calculationSnapshots.filter(
      (s) => s.id !== snapId
    );
    onUpdateProject(clone);
  };

  const handleChangeStatus = (snapId: string, status: ValidationStatus) => {
    if (!activeCase) return;
    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    const targetCase = clone.designCases.find((c) => c.id === activeCase.id);
    if (!targetCase) return;

    const snap = targetCase.calculationSnapshots.find((s) => s.id === snapId);
    if (!snap) return;

    snap.validationStatus = status;
    onUpdateProject(clone);
  };

  const snapshots = activeCase?.calculationSnapshots || [];

  return (
    <div className="space-y-6">
      {/* Top Controls Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Calculation Snapshots ({snapshots.length}) in "{activeCase?.name || 'Active Case'}"
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic calculation states preserved with exact inputs, outputs, margins, and assumptions.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-cyan-950"
          >
            <Plus className="w-3.5 h-3.5" />
            Pin Calculation
          </button>
        </div>

        {/* Modal / Inline Creator */}
        {showAddModal && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-cyan-800/50 space-y-3 text-xs">
            <h4 className="font-semibold text-cyan-400 font-mono">Pin Calculation to Case</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Select Engineering Engine</label>
                <select
                  value={selectedEngine}
                  onChange={(e) => setSelectedEngine(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="dc-power-budget">DC Power Budget & Supply Headroom (Phase 12)</option>
                  <option value="thermal-junction-chain">Junction-to-Ambient Thermal Chain (Phase 10/12)</option>
                  <option value="battery-to-load">Battery-to-Load Autonomy Sizing (Phase 11/12)</option>
                  <option value="controlled-impedance">Controlled Microstrip Impedance (Phase 08/12)</option>
                  <option value="pdn-target-impedance">PCB PDN Target Impedance (Phase 08/12)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Custom Snapshot Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Primary 5V Converter Thermal Margin"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDefaultSnapshot}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-slate-950 font-medium hover:bg-cyan-500"
              >
                Evaluate & Pin
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Snapshots Cards List */}
      {snapshots.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 font-mono text-xs">
          No calculation snapshots pinned to this case yet. Click "Pin Calculation" above to attach verified calculations.
        </div>
      ) : (
        <div className="space-y-4">
          {snapshots.map((snap) => (
            <div
              key={snap.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md transition-all hover:border-slate-700"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-100">{snap.name}</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                        {snap.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Engine: {snap.engineId}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validation Status & Quick Actions */}
                <div className="flex items-center gap-2">
                  <select
                    value={snap.validationStatus}
                    onChange={(e) => handleChangeStatus(snap.id, e.target.value as ValidationStatus)}
                    className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] font-mono text-slate-300"
                  >
                    <option value="Unvalidated">Unvalidated</option>
                    <option value="Calculated">Calculated</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Hardware Validated">Hardware Validated</option>
                    <option value="Manufacturer Data Verified">Manufacturer Verified</option>
                  </select>

                  <button
                    onClick={() => handleRecalculate(snap.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Recalculate with Deterministic Engine"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body: Inputs & Outputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4">
                {/* Inputs */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Exact Inputs
                  </span>
                  <div className="space-y-1">
                    {Object.entries(snap.inputs).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-slate-900 py-0.5">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-slate-200 font-bold">{JSON.stringify(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deterministic Outputs */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block mb-2">
                    Deterministic Outputs
                  </span>
                  <div className="space-y-1">
                    {Object.entries(snap.outputs).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-slate-900 py-0.5">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-emerald-400 font-bold">
                          {typeof v === 'number' ? v.toFixed(3) : JSON.stringify(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Margins Row */}
              {(snap.margins || []).length > 0 && (
                <div className="mb-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Margins:</span>
                  {snap.margins.map((m, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                        m.isSatisfied
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {m.isSatisfied ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {m.parameter}: {m.marginAbsolute > 0 ? '+' : ''}
                      {m.marginAbsolute.toFixed(2)} {m.unit} ({m.statusText})
                    </span>
                  ))}
                </div>
              )}

              {/* Quick AI Review Action Bar */}
              {onRunAiAction && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">Peer Review Assistant:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onRunAiAction('explain', snap)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px] transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Explain Physics
                    </button>
                    <button
                      onClick={() => onRunAiAction('critique', snap)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[11px] transition-colors flex items-center gap-1"
                    >
                      Critique Assumptions
                    </button>
                    <button
                      onClick={() => onRunAiAction('test-plan', snap)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[11px] transition-colors flex items-center gap-1"
                    >
                      Bench Test Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
