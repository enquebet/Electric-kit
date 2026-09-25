import React, { useState, useMemo } from 'react';
import {
  calculateConstantCurrentDischarge,
  calculateConstantPowerDischarge,
  calculateVariableLoadRuntime,
  calculateAverageLoad,
  analyzePeakLoad,
  calculateVoltageSag,
  calculateInternalResistance,
  calculateAvailablePower,
  calculateDischargeEfficiency,
} from '../../engines/batteries/battery-discharge';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { TrendingDown, Activity, AlertTriangle, Zap, Sliders } from 'lucide-react';

export function BatteryDischargeTool() {
  const [activeTab, setActiveTab] = useState<'cc_cp' | 'variable_load' | 'voltage_sag_ir' | 'available_power'>('cc_cp');

  // Tab 1: CC & CP
  const [dischargeMode, setDischargeMode] = useState<'cc' | 'cp'>('cc');
  const [ccCapAh, setCcCapAh] = useState<number>(50);
  const [ccCurrentA, setCcCurrentA] = useState<number>(10);
  const [ccVNom, setCcVNom] = useState<number>(48.0);
  const [ccDoDPct, setCcDoDPct] = useState<number>(90);
  const [cpPowerW, setCpPowerW] = useState<number>(500);
  const [cpCutoffV, setCpCutoffV] = useState<number>(42.0);
  const [cpEtaPct, setCpEtaPct] = useState<number>(95);

  // Tab 2: Variable Load Profile
  const [dutySleepMins, setDutySleepMins] = useState<number>(55);
  const [dutySleepCurrentA, setDutySleepCurrentA] = useState<number>(0.02);
  const [dutyActiveMins, setDutyActiveMins] = useState<number>(5);
  const [dutyActiveCurrentA, setDutyActiveCurrentA] = useState<number>(4.5);
  const [varCapAh, setVarCapAh] = useState<number>(10.0);
  const [varVNom, setVarVNom] = useState<number>(12.8);

  // Tab 3: Voltage Sag & Internal Resistance
  const [sagVoc, setSagVoc] = useState<number>(4.15);
  const [sagLoadI, setSagLoadI] = useState<number>(15.0);
  const [sagRintMOhm, setSagRintMOhm] = useState<number>(25.0); // 25 mΩ
  const [sagRwireMOhm, setSagRwireMOhm] = useState<number>(10.0); // 10 mΩ

  // IR measurement calculator
  const [irMode, setIrMode] = useState<'single_step' | 'two_step_pulse'>('single_step');
  const [irV1, setIrV1] = useState<number>(4.18);
  const [irV2, setIrV2] = useState<number>(3.88);
  const [irI1, setIrI1] = useState<number>(10.0);
  const [irI2, setIrI2] = useState<number>(20.0);

  // Tab 4: Available Power & Peak Load
  const [availVoc, setAvailVoc] = useState<number>(50.4);
  const [availRintMOhm, setAvailRintMOhm] = useState<number>(80);
  const [availVCutoff, setAvailVCutoff] = useState<number>(39.0);
  const [ratedContA, setRatedContA] = useState<number>(40);
  const [ratedPeakA, setRatedPeakA] = useState<number>(80);
  const [measPeakA, setMeasPeakA] = useState<number>(65);
  const [measDurationS, setMeasDurationS] = useState<number>(6);

  // Calculations
  const ccResult = useMemo(() => {
    try {
      return calculateConstantCurrentDischarge({
        nominalCapacityAh: ccCapAh,
        dischargeCurrentAmps: ccCurrentA,
        nominalVoltage: ccVNom,
        dischargeDepthFraction: ccDoDPct / 100,
      });
    } catch {
      return null;
    }
  }, [ccCapAh, ccCurrentA, ccVNom, ccDoDPct]);

  const cpResult = useMemo(() => {
    try {
      return calculateConstantPowerDischarge({
        nominalCapacityAh: ccCapAh,
        nominalVoltage: ccVNom,
        cutoffVoltage: cpCutoffV,
        loadPowerWatts: cpPowerW,
        converterEfficiencyPercent: cpEtaPct,
        dischargeDepthFraction: ccDoDPct / 100,
      });
    } catch {
      return null;
    }
  }, [ccCapAh, ccVNom, cpCutoffV, cpPowerW, cpEtaPct, ccDoDPct]);

  const varLoadResult = useMemo(() => {
    try {
      return calculateVariableLoadRuntime(
        varCapAh,
        varVNom,
        [
          { id: '1', name: 'Standby / Sleep', durationMinutes: dutySleepMins, currentAmps: dutySleepCurrentA },
          { id: '2', name: 'Active Pulse', durationMinutes: dutyActiveMins, currentAmps: dutyActiveCurrentA },
        ],
        0.85
      );
    } catch {
      return null;
    }
  }, [varCapAh, varVNom, dutySleepMins, dutySleepCurrentA, dutyActiveMins, dutyActiveCurrentA]);

  const sagResult = useMemo(() => {
    try {
      return calculateVoltageSag({
        openCircuitVoltage: sagVoc,
        loadCurrentAmps: sagLoadI,
        internalResistanceOhms: sagRintMOhm / 1000,
        wiringResistanceOhms: sagRwireMOhm / 1000,
      });
    } catch {
      return null;
    }
  }, [sagVoc, sagLoadI, sagRintMOhm, sagRwireMOhm]);

  const irResult = useMemo(() => {
    try {
      return calculateInternalResistance(irMode, irV1, irV2, irI1, irI2);
    } catch {
      return null;
    }
  }, [irMode, irV1, irV2, irI1, irI2]);

  const dischEffResult = useMemo(() => {
    try {
      return calculateDischargeEfficiency(sagVoc, sagLoadI, (sagRintMOhm + sagRwireMOhm) / 1000);
    } catch {
      return null;
    }
  }, [sagVoc, sagLoadI, sagRintMOhm, sagRwireMOhm]);

  const availResult = useMemo(() => {
    try {
      return calculateAvailablePower(availVoc, availRintMOhm / 1000, availVCutoff);
    } catch {
      return null;
    }
  }, [availVoc, availRintMOhm, availVCutoff]);

  const peakCheckResult = useMemo(() => {
    try {
      return analyzePeakLoad({
        continuousRatingAmps: ratedContA,
        peakRatingAmps: ratedPeakA,
        measuredPeakLoadAmps: measPeakA,
        peakDurationSeconds: measDurationS,
      });
    } catch {
      return null;
    }
  }, [ratedContA, ratedPeakA, measPeakA, measDurationS]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Discharge, Load Profiles & Voltage Sag</h1>
            <p className="text-xs text-slate-400">
              Tools 21–30: Constant-Current / Constant-Power Runtime, Duty Cycle Profiles, Sag & Internal Resistance
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('cc_cp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'cc_cp' ? 'bg-rose-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> 21–22. CC vs CP Discharge
          </button>
          <button
            onClick={() => setActiveTab('variable_load')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'variable_load' ? 'bg-rose-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> 23–26. Variable Load & Profiles
          </button>
          <button
            onClick={() => setActiveTab('voltage_sag_ir')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'voltage_sag_ir' ? 'bg-rose-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> 27–28. Voltage Sag & IR
          </button>
          <button
            onClick={() => setActiveTab('available_power')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'available_power' ? 'bg-rose-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> 29–30. Available Power & Peak
          </button>
        </div>
      </div>

      {/* Tab 1: CC vs CP */}
      {activeTab === 'cc_cp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Discharge Inputs</h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Discharge Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDischargeMode('cc')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    dischargeMode === 'cc' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Constant Current (A)
                </button>
                <button
                  onClick={() => setDischargeMode('cp')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    dischargeMode === 'cp' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Constant Power (W)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Nominal Battery Capacity (Ah)</label>
              <input
                type="number"
                step="1"
                value={ccCapAh}
                onChange={(e) => setCcCapAh(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Nominal Voltage (V)</label>
              <input
                type="number"
                step="0.5"
                value={ccVNom}
                onChange={(e) => setCcVNom(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            {dischargeMode === 'cc' ? (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Load Current (A)</label>
                <input
                  type="number"
                  step="0.5"
                  value={ccCurrentA}
                  onChange={(e) => setCcCurrentA(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Load Power (W)</label>
                  <input
                    type="number"
                    step="10"
                    value={cpPowerW}
                    onChange={(e) => setCpPowerW(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Cutoff (V)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={cpCutoffV}
                      onChange={(e) => setCpCutoffV(parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Converter Eff (%)</label>
                    <input
                      type="number"
                      step="1"
                      value={cpEtaPct}
                      onChange={(e) => setCpEtaPct(parseFloat(e.target.value) || 90)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Depth of Discharge (DoD)</span>
                <span className="font-mono text-rose-400">{ccDoDPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={ccDoDPct}
                onChange={(e) => setCcDoDPct(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {dischargeMode === 'cc' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ResultCard
                    label="Constant-Current Runtime"
                    value={`${ccResult?.runtimeHours ?? 0} hrs`}
                    subtext={`${ccResult?.runtimeMinutes ?? 0} minutes`}
                    highlight
                  />
                  <ResultCard
                    label="Energy Delivered"
                    value={`${ccResult?.energyDeliveredWh ?? 0} Wh`}
                    subtext={`${ccResult?.ampHoursRemoved ?? 0} Ah delivered`}
                  />
                  <ResultCard
                    label="Discharge C-Rate"
                    value={`${ccResult?.cRate ?? 0} C`}
                    subtext={`Load: ${ccCurrentA} A on ${ccCapAh} Ah`}
                  />
                </div>
                <CalculationStepViewer
                  steps={[
                    {
                      title: 'Constant Current Runtime',
                      formula: 't = (C_{nom} · DoD) / I_{load}',
                      substitution: `(${ccCapAh} Ah × ${(ccDoDPct / 100).toFixed(2)}) / ${ccCurrentA} A`,
                      result: `${ccResult?.runtimeHours ?? 0} hours (${ccResult?.runtimeMinutes ?? 0} mins)`,
                    },
                  ]}
                />
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <ResultCard
                    label="Constant-Power Runtime"
                    value={`${cpResult?.estimatedRuntimeHours ?? 0} hrs`}
                    subtext={`${cpResult?.estimatedRuntimeMinutes ?? 0} minutes`}
                    highlight
                  />
                  <ResultCard
                    label="Current Escalation"
                    value={`${cpResult?.initialCurrentAmps ?? 0}A → ${cpResult?.finalCurrentAtCutoffAmps ?? 0}A`}
                    subtext={`Avg current: ${cpResult?.averageCurrentAmps ?? 0} A`}
                  />
                  <ResultCard
                    label="Delivered Energy"
                    value={`${cpResult?.deliveredEnergyWh ?? 0} Wh`}
                    subtext={`Converter efficiency: ${cpEtaPct}%`}
                  />
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
                  <strong className="text-amber-400">Constant-Power Dynamics:</strong> In switch-mode SMPS loads, as the battery voltage drops towards cutoff, current drawn increases according to <code className="text-slate-200">I(t) = P / V(t)</code>. This accelerates voltage sag near end-of-discharge.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Variable Load */}
      {activeTab === 'variable_load' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Two-Phase Duty Cycle</h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Pack Capacity (Ah) & Voltage (V)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={varCapAh}
                  onChange={(e) => setVarCapAh(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
                <input
                  type="number"
                  step="0.5"
                  value={varVNom}
                  onChange={(e) => setVarVNom(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg space-y-2 border border-slate-700/50">
              <span className="text-xs font-semibold text-slate-300">Phase 1: Sleep / Standby</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block">Duration (min)</label>
                  <input
                    type="number"
                    step="1"
                    value={dutySleepMins}
                    onChange={(e) => setDutySleepMins(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Current (A)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dutySleepCurrentA}
                    onChange={(e) => setDutySleepCurrentA(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg space-y-2 border border-slate-700/50">
              <span className="text-xs font-semibold text-rose-300">Phase 2: Active / Transmission</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block">Duration (min)</label>
                  <input
                    type="number"
                    step="1"
                    value={dutyActiveMins}
                    onChange={(e) => setDutyActiveMins(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Current (A)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={dutyActiveCurrentA}
                    onChange={(e) => setDutyActiveCurrentA(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ResultCard
                label="Mission Operating Lifetime"
                value={`${varLoadResult?.totalRuntimeHours ?? 0} hrs`}
                subtext={`${((varLoadResult?.totalRuntimeHours ?? 0) / 24).toFixed(1)} days (${varLoadResult?.estimatedCyclesUntilEmpty ?? 0} cycles)`}
                highlight
              />
              <ResultCard
                label="Weighted Average Load"
                value={`${varLoadResult?.averageCurrentAmps ?? 0} A`}
                subtext={`${varLoadResult?.averagePowerWatts ?? 0} W average`}
              />
              <ResultCard
                label="Cycle Consumption"
                value={`${varLoadResult?.cycleAhConsumed ?? 0} Ah`}
                subtext={`${varLoadResult?.cycleWhConsumed ?? 0} Wh per ${varLoadResult?.totalCycleDurationMinutes ?? 0}m cycle`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Voltage Sag & IR */}
      {activeTab === 'voltage_sag_ir' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">27. Battery Voltage Sag Simulation</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Open Circuit Voltage Voc (V)</label>
                <input
                  type="number"
                  step="0.05"
                  value={sagVoc}
                  onChange={(e) => setSagVoc(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Load Current (A)</label>
                <input
                  type="number"
                  step="1"
                  value={sagLoadI}
                  onChange={(e) => setSagLoadI(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cell Internal Resistance (mΩ)</label>
                <input
                  type="number"
                  step="1"
                  value={sagRintMOhm}
                  onChange={(e) => setSagRintMOhm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Wiring & Connectors (mΩ)</label>
                <input
                  type="number"
                  step="1"
                  value={sagRwireMOhm}
                  onChange={(e) => setSagRwireMOhm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <ResultCard
              label="Loaded Terminal Voltage"
              value={`${sagResult?.terminalVoltage ?? 0} V`}
              subtext={`Sag: ${sagResult?.voltageSagVolts ?? 0} V (${sagResult?.sagPercentage ?? 0}% drop) | I²R Loss: ${sagResult?.totalLossWatts ?? 0} W`}
              highlight
            />
            <div className="text-xs text-slate-400">
              Discharge Efficiency at this operating point: <strong className="text-emerald-400">{dischEffResult?.efficiencyPercent ?? 0}%</strong>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">28. Internal Resistance Calculator</h2>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Measurement Mode</label>
              <select
                value={irMode}
                onChange={(e) => setIrMode(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              >
                <option value="single_step">Single Step (Open Circuit Voc → Loaded Vload)</option>
                <option value="two_step_pulse">Two-Step Pulse (Load Step: I1 → I2)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{irMode === 'single_step' ? 'Voc (V)' : 'V1 at I1 (V)'}</label>
                <input
                  type="number"
                  step="0.01"
                  value={irV1}
                  onChange={(e) => setIrV1(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">{irMode === 'single_step' ? 'V_load (V)' : 'V2 at I2 (V)'}</label>
                <input
                  type="number"
                  step="0.01"
                  value={irV2}
                  onChange={(e) => setIrV2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">{irMode === 'single_step' ? 'Load Current (A)' : 'I1 (A)'}</label>
                <input
                  type="number"
                  step="0.5"
                  value={irI1}
                  onChange={(e) => setIrI1(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              {irMode === 'two_step_pulse' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">I2 (A)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={irI2}
                    onChange={(e) => setIrI2(parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
              )}
            </div>

            <ResultCard
              label="Derived Internal Resistance R_int"
              value={`${irResult?.internalResistanceMilliohms ?? 0} mΩ`}
              subtext={`${irResult?.internalResistanceOhms ?? 0} Ω`}
              highlight
            />
          </div>
        </div>
      )}

      {/* Tab 4: Available Power & Peak Load */}
      {activeTab === 'available_power' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">29. Available Power Under Sag</h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Voc (V)</label>
                <input
                  type="number"
                  step="0.5"
                  value={availVoc}
                  onChange={(e) => setAvailVoc(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">R_int (mΩ)</label>
                <input
                  type="number"
                  step="5"
                  value={availRintMOhm}
                  onChange={(e) => setAvailRintMOhm(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">V_cutoff (V)</label>
                <input
                  type="number"
                  step="0.5"
                  value={availVCutoff}
                  onChange={(e) => setAvailVCutoff(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ResultCard
                label="Usable Power at Cutoff"
                value={`${availResult?.usablePowerAtCutoffWatts ?? 0} W`}
                subtext={`At ${availResult?.currentAtCutoffAmps ?? 0} A current`}
                highlight
              />
              <ResultCard
                label="Theoretical Max Power"
                value={`${availResult?.theoreticalMaxPowerWatts ?? 0} W`}
                subtext={`At 50% voltage sag (${availResult?.terminalVoltageAtTheoreticalMax ?? 0} V)`}
              />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">26. Peak Load & Duration Safety Check</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Continuous Rating (A)</label>
                <input
                  type="number"
                  value={ratedContA}
                  onChange={(e) => setRatedContA(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Peak Rating (A)</label>
                <input
                  type="number"
                  value={ratedPeakA}
                  onChange={(e) => setRatedPeakA(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Measured Load (A)</label>
                <input
                  type="number"
                  value={measPeakA}
                  onChange={(e) => setMeasPeakA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Pulse Duration (s)</label>
                <input
                  type="number"
                  value={measDurationS}
                  onChange={(e) => setMeasDurationS(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <ResultCard
              label="Peak Pulse Status"
              value={peakCheckResult?.status ?? 'N/A'}
              subtext={`Peak/Cont Ratio: ${peakCheckResult?.peakToContinuousRatio ?? 0}× | Pulse safe: ${peakCheckResult?.peakDurationSafe ? 'YES' : 'NO'}`}
              highlight={peakCheckResult?.status === 'SAFE_CONTINUOUS' || peakCheckResult?.status === 'SAFE_PEAK_PULSE'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
