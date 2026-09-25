import React, { useState, useMemo } from 'react';
import {
  calculateCellsInSeries,
  calculateCellsInParallel,
  calculateSeriesPackVoltage,
  calculateParallelPackCapacity,
  calculatePackEnergy,
  calculatePackCurrentCapability,
  calculatePackCRate,
  designBatteryPack,
  calculateCellToPackScaling,
  verifyPackCapacityAndEnergy,
  POPULAR_CELL_PRESETS,
  CellSpecification,
} from '../../engines/batteries/battery-pack';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Layers, Cpu, ShieldCheck, Scale, Compass } from 'lucide-react';

export function BatteryPackTool() {
  const [activeTab, setActiveTab] = useState<'designer' | 'series_parallel' | 'scaling_verification'>('designer');

  // Pack Designer State
  const [selectedCellKey, setSelectedCellKey] = useState<string>('molicel_p42a_21700');
  const [targetPackV, setTargetPackV] = useState<number>(48.0);
  const [targetEnergyWh, setTargetEnergyWh] = useState<number>(1000);
  const [targetCapacityAh, setTargetCapacityAh] = useState<number>(20);
  const [targetCurrentA, setTargetCurrentA] = useState<number>(50);

  // Manual S & P State
  const [manualS, setManualS] = useState<number>(13);
  const [manualP, setManualP] = useState<number>(4);
  const [cellVNom, setCellVNom] = useState<number>(3.6);
  const [cellVMax, setCellVMax] = useState<number>(4.2);
  const [cellVCutoff, setCellVCutoff] = useState<number>(2.5);
  const [cellCapAh, setCellCapAh] = useState<number>(3.5);
  const [cellContA, setCellContA] = useState<number>(10.0);
  const [cellPeakA, setCellPeakA] = useState<number>(20.0);
  const [testDischargeA, setTestDischargeA] = useState<number>(25.0);

  // Scaling & Verification State
  const [scalingCellWh, setScalingCellWh] = useState<number>(15.12);
  const [scalingCellWeightG, setScalingCellWeightG] = useState<number>(70);
  const [scalingCellVolMl, setScalingCellVolMl] = useState<number>(26.0); // 26 mL
  const [scalingTotalCells, setScalingTotalCells] = useState<number>(56);
  const [overheadMassPct, setOverheadMassPct] = useState<number>(22);
  const [packVolFactor, setPackVolFactor] = useState<number>(0.72);
  const [mismatchPct, setMismatchPct] = useState<number>(2.5);
  const [busbarLossPct, setBusbarLossPct] = useState<number>(1.2);
  const [bmsParasiticW, setBmsParasiticW] = useState<number>(1.5);

  const selectedCell: CellSpecification = useMemo(() => {
    return POPULAR_CELL_PRESETS[selectedCellKey] || POPULAR_CELL_PRESETS['molicel_p42a_21700'];
  }, [selectedCellKey]);

  // Designer Output
  const designerResult = useMemo(() => {
    try {
      return designBatteryPack({
        targetVoltage: targetPackV,
        targetEnergyWh,
        targetCapacityAh,
        targetContinuousCurrentAmps: targetCurrentA,
        cell: selectedCell,
      });
    } catch {
      return null;
    }
  }, [targetPackV, targetEnergyWh, targetCapacityAh, targetCurrentA, selectedCell]);

  // Manual S / P Outputs
  const seriesVResult = useMemo(() => {
    try {
      return calculateSeriesPackVoltage(manualS, cellVNom, cellVMax, cellVCutoff);
    } catch {
      return null;
    }
  }, [manualS, cellVNom, cellVMax, cellVCutoff]);

  const parallelCResult = useMemo(() => {
    try {
      return calculateParallelPackCapacity(manualP, cellCapAh);
    } catch {
      return null;
    }
  }, [manualP, cellCapAh]);

  const packEnergyResult = useMemo(() => {
    try {
      return calculatePackEnergy(manualS, manualP, cellVNom, cellCapAh);
    } catch {
      return null;
    }
  }, [manualS, manualP, cellVNom, cellCapAh]);

  const packCurrentResult = useMemo(() => {
    try {
      return calculatePackCurrentCapability(manualP, cellContA, cellPeakA);
    } catch {
      return null;
    }
  }, [manualP, cellContA, cellPeakA]);

  const packCRateResult = useMemo(() => {
    try {
      const cPack = parallelCResult?.packCapacityAh ?? manualP * cellCapAh;
      return calculatePackCRate(testDischargeA, cPack);
    } catch {
      return null;
    }
  }, [testDischargeA, parallelCResult, manualP, cellCapAh]);

  // Scaling & Verification Outputs
  const scalingResult = useMemo(() => {
    try {
      return calculateCellToPackScaling({
        cellEnergyWh: scalingCellWh,
        cellWeightKg: scalingCellWeightG / 1000,
        cellVolumeLiters: scalingCellVolMl / 1000,
        totalCellCount: scalingTotalCells,
        structuralOverheadMassFraction: overheadMassPct / 100,
        volumetricPackingFactor: packVolFactor,
      });
    } catch {
      return null;
    }
  }, [scalingCellWh, scalingCellWeightG, scalingCellVolMl, scalingTotalCells, overheadMassPct, packVolFactor]);

  const verificationResult = useMemo(() => {
    try {
      const theorWh = scalingResult?.packGravimetricDensityWhKg
        ? scalingCellWh * scalingTotalCells
        : (packEnergyResult?.packEnergyWh ?? 1000);
      return verifyPackCapacityAndEnergy({
        theoreticalPackEnergyWh: theorWh,
        cellCapacityMismatchPercent: mismatchPct,
        busbarInterconnectLossPercent: busbarLossPct,
        bmsParasiticConsumptionWatts: bmsParasiticW,
      });
    } catch {
      return null;
    }
  }, [scalingResult, scalingCellWh, scalingTotalCells, packEnergyResult, mismatchPct, busbarLossPct, bmsParasiticW]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Battery Pack Configuration & Sizing</h1>
            <p className="text-xs text-slate-400">
              Tools 11–20: Series / Parallel Cell Scaling, Configuration Designer (18650/21700/Prismatic) & Pack Verification
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('designer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'designer' ? 'bg-blue-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> 18. Pack Configuration Designer
          </button>
          <button
            onClick={() => setActiveTab('series_parallel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'series_parallel' ? 'bg-blue-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> 11–17. Series & Parallel Scaling
          </button>
          <button
            onClick={() => setActiveTab('scaling_verification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'scaling_verification' ? 'bg-blue-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> 19–20. Densities & Derating
          </button>
        </div>
      </div>

      {/* Tab 1: Designer */}
      {activeTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Design Targets</h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Cell Model Preset</label>
              <select
                value={selectedCellKey}
                onChange={(e) => setSelectedCellKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              >
                {Object.entries(POPULAR_CELL_PRESETS).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                {selectedCell.nominalVoltage}V nom | {selectedCell.nominalCapacityAh}Ah | Cont: {selectedCell.maxContinuousDischargeCurrentAmps}A
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Nominal Pack Voltage (V)</label>
              <input
                type="number"
                step="1"
                value={targetPackV}
                onChange={(e) => setTargetPackV(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Pack Energy (Wh)</label>
              <input
                type="number"
                step="50"
                value={targetEnergyWh}
                onChange={(e) => setTargetEnergyWh(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Capacity (Ah)</label>
              <input
                type="number"
                step="1"
                value={targetCapacityAh}
                onChange={(e) => setTargetCapacityAh(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Continuous Current (A)</label>
              <input
                type="number"
                step="5"
                value={targetCurrentA}
                onChange={(e) => setTargetCurrentA(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ResultCard
                label="Optimal Configuration"
                value={designerResult?.configurationString ?? 'N/A'}
                subtext={`${designerResult?.totalCellCount ?? 0} total cells (${designerResult?.seriesCount ?? 0}S × ${designerResult?.parallelCount ?? 0}P)`}
                highlight
              />
              <ResultCard
                label="Nominal Pack Energy"
                value={`${designerResult?.actualEnergyWh ?? 0} Wh`}
                subtext={`${designerResult?.actualEnergyKwh ?? 0} kWh`}
              />
              <ResultCard
                label="Current Limits"
                value={`${designerResult?.maxContinuousDischargeAmps ?? 0} A`}
                subtext={`Peak: ${designerResult?.peakDischargeAmps ?? 0} A (Pulse)`}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
              <div>
                <div className="text-[11px] text-slate-400">Nominal Voltage</div>
                <div className="text-base font-bold font-mono text-slate-100">{designerResult?.actualNominalVoltage ?? 0} V</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Full Charge Voltage</div>
                <div className="text-base font-bold font-mono text-blue-400">{designerResult?.actualMaxVoltage ?? 0} V</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Cutoff Voltage</div>
                <div className="text-base font-bold font-mono text-amber-400">{designerResult?.actualCutoffVoltage ?? 0} V</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Total Cell Weight</div>
                <div className="text-base font-bold font-mono text-slate-100">{designerResult?.totalCellWeightKg ?? 0} kg</div>
              </div>
            </div>

            <CalculationStepViewer
              steps={[
                {
                  title: 'Series String Sizing',
                  formula: 'S = \\lceil V_{target} / V_{cell} \\rfloor',
                  substitution: `${targetPackV} V / ${selectedCell.nominalVoltage} V = ${(targetPackV / selectedCell.nominalVoltage).toFixed(2)}`,
                  result: `${designerResult?.seriesCount ?? 0} cells in series (${designerResult?.actualNominalVoltage ?? 0} V)`,
                },
                {
                  title: 'Parallel String Sizing',
                  formula: 'P = \\max(P_{capacity}, P_{energy}, P_{current})',
                  substitution: `P_{cap}: ${(targetCapacityAh / selectedCell.nominalCapacityAh).toFixed(2)}, P_{current}: ${(targetCurrentA / selectedCell.maxContinuousDischargeCurrentAmps).toFixed(2)}`,
                  result: `${designerResult?.parallelCount ?? 0} cells in parallel (${designerResult?.actualCapacityAh ?? 0} Ah)`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Manual Series / Parallel */}
      {activeTab === 'series_parallel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Manual Pack Parameters</h2>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Series Count (S)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={manualS}
                  onChange={(e) => setManualS(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Parallel Count (P)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={manualP}
                  onChange={(e) => setManualP(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">V_nom (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cellVNom}
                  onChange={(e) => setCellVNom(parseFloat(e.target.value) || 3.6)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">V_max (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cellVMax}
                  onChange={(e) => setCellVMax(parseFloat(e.target.value) || 4.2)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">V_cut (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cellVCutoff}
                  onChange={(e) => setCellVCutoff(parseFloat(e.target.value) || 2.5)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Cap (Ah)</label>
                <input
                  type="number"
                  step="0.5"
                  value={cellCapAh}
                  onChange={(e) => setCellCapAh(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">I_cont (A)</label>
                <input
                  type="number"
                  step="1"
                  value={cellContA}
                  onChange={(e) => setCellContA(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">I_peak (A)</label>
                <input
                  type="number"
                  step="1"
                  value={cellPeakA}
                  onChange={(e) => setCellPeakA(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Pack Discharge Current for C-Rate Check (A)</label>
              <input
                type="number"
                step="1"
                value={testDischargeA}
                onChange={(e) => setTestDischargeA(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ResultCard
                label="Pack Voltage (Nominal)"
                value={`${seriesVResult?.nominalVoltage ?? 0} V`}
                subtext={`Full: ${seriesVResult?.maxChargeVoltage ?? 0}V | Cutoff: ${seriesVResult?.cutoffDischargeVoltage ?? 0}V`}
                highlight
              />
              <ResultCard
                label="Pack Capacity"
                value={`${parallelCResult?.packCapacityAh ?? 0} Ah`}
                subtext={`${parallelCResult?.packCapacityMah ?? 0} mAh`}
              />
              <ResultCard
                label="Total Pack Energy"
                value={`${packEnergyResult?.packEnergyWh ?? 0} Wh`}
                subtext={`${packEnergyResult?.packEnergyKwh ?? 0} kWh (${packEnergyResult?.totalCells ?? 0} cells)`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Current Limits"
                value={`${packCurrentResult?.continuousDischargeAmps ?? 0} A cont`}
                subtext={`Peak: ${packCurrentResult?.peakDischargeAmps ?? 0} A`}
              />
              <ResultCard
                label="Pack Operating C-Rate"
                value={`${packCRateResult?.packCRate ?? 0} C`}
                subtext={`Per-cell current: ${packCRateResult?.equivalentCellCurrentAmps(manualP) ?? 0} A`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Scaling & Verification */}
      {activeTab === 'scaling_verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Physical & Derating Parameters</h2>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cell Energy (Wh)</label>
                <input
                  type="number"
                  step="0.5"
                  value={scalingCellWh}
                  onChange={(e) => setScalingCellWh(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cell Mass (g)</label>
                <input
                  type="number"
                  step="1"
                  value={scalingCellWeightG}
                  onChange={(e) => setScalingCellWeightG(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Structural Mass Overhead (%)</label>
                <input
                  type="number"
                  step="1"
                  value={overheadMassPct}
                  onChange={(e) => setOverheadMassPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Volumetric Factor</label>
                <input
                  type="number"
                  step="0.05"
                  value={packVolFactor}
                  onChange={(e) => setPackVolFactor(parseFloat(e.target.value) || 0.7)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-slate-300 mb-2">20. Pack Capacity Deratings</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400 block">Cell Mismatch Loss (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={mismatchPct}
                    onChange={(e) => setMismatchPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block">Busbar Interconnect Loss (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={busbarLossPct}
                    onChange={(e) => setBusbarLossPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block">BMS Consumption (W)</label>
                  <input
                    type="number"
                    step="0.2"
                    value={bmsParasiticW}
                    onChange={(e) => setBmsParasiticW(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Pack Gravimetric Energy Density"
                value={`${scalingResult?.packGravimetricDensityWhKg ?? 0} Wh/kg`}
                subtext={`Cell Level: ${scalingResult?.cellGravimetricDensityWhKg ?? 0} Wh/kg (${scalingResult?.massPackagingEfficiencyPercent ?? 0}% cell fraction)`}
                highlight
              />
              <ResultCard
                label="Pack Volumetric Energy Density"
                value={`${scalingResult?.packVolumetricDensityWhL ?? 0} Wh/L`}
                subtext={`Cell Level: ${scalingResult?.cellVolumetricDensityWhL ?? 0} Wh/L (Total pack: ${scalingResult?.packTotalVolumeLiters ?? 0} L)`}
              />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Pack Usable Energy Derating Verification</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Theoretical</div>
                  <div className="text-sm font-bold font-mono text-slate-100">{verificationResult?.theoreticalEnergyWh ?? 0} Wh</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Derated Usable</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">{verificationResult?.deratedPackEnergyWh ?? 0} Wh</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Usable Fraction</div>
                  <div className="text-sm font-bold font-mono text-blue-400">{verificationResult?.usableFractionPercent ?? 0}%</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Total Derating Loss</div>
                  <div className="text-sm font-bold font-mono text-rose-400">
                    {((verificationResult?.mismatchLossWh ?? 0) + (verificationResult?.interconnectLossWh ?? 0) + (verificationResult?.bmsLossWh ?? 0)).toFixed(1)} Wh
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
