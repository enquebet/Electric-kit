import React, { useState, useMemo } from 'react';
import {
  calculateTimResistance,
  calculateBltAndContact,
  calculatePressureEffect,
  compareTimPresets,
  calculatePhaseChangeModel,
  calculateInsulatingWasher,
  calculateSurfaceRoughnessImpact,
  calculateGreasePumpOut,
  calculateHeatFlux,
  calculateMultiLayerTimStackup,
  TIM_PRESETS,
} from '../../engines/thermal/interfaces';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Layers, ShieldCheck, Flame, ArrowDownUp, RefreshCw, BarChart2 } from 'lucide-react';

export function ThermalInterfaceTool() {
  const [activeTab, setActiveTab] = useState<'tim_calc' | 'comparison' | 'pcm_washer' | 'roughness_pumpout' | 'stackup'>('tim_calc');

  // 1. Basic TIM & Pressure
  const [bltMicrons, setBltMicrons] = useState<number>(30);
  const [timConductivity, setTimConductivity] = useState<number>(3.5);
  const [contactAreaCm2, setContactAreaCm2] = useState<number>(6.5);
  const [clampingPressureKPa, setClampingPressureKPa] = useState<number>(150);
  const [timType, setTimType] = useState<'grease' | 'pad' | 'pcm'>('grease');

  // 2. PCM & Washer
  const [pcmOperatingTemp, setPcmOperatingTemp] = useState<number>(65);
  const [pcmMeltTemp, setPcmMeltTemp] = useState<number>(52);
  const [washerMaterial, setWasherMaterial] = useState<'mica' | 'sil_pad' | 'kapton' | 'alumina'>('sil_pad');
  const [washerThicknessMm, setWasherThicknessMm] = useState<number>(0.25);
  const [washerGreased, setWasherGreased] = useState<boolean>(true);

  // 3. Roughness & Pump-out
  const [surfaceRaUm, setSurfaceRaUm] = useState<number>(1.2);
  const [flatnessDevUm, setFlatnessDevUm] = useState<number>(15);
  const [thermalCycles, setThermalCycles] = useState<number>(1000);
  const [deltaTCycle, setDeltaTCycle] = useState<number>(60);

  // 4. Heat Flux & Multi-layer Stackup
  const [fluxPowerW, setFluxPowerW] = useState<number>(85);
  const [dieAreaMm2, setDieAreaMm2] = useState<number>(120); // 1.2 cm²

  // Calculations
  const timResult = useMemo(() => {
    return calculateTimResistance({
      thicknessMeters: bltMicrons * 1e-6,
      thermalConductivityWmK: timConductivity,
      contactAreaM2: contactAreaCm2 * 1e-4,
    });
  }, [bltMicrons, timConductivity, contactAreaCm2]);

  const pressureResult = useMemo(() => {
    return calculatePressureEffect(bltMicrons, clampingPressureKPa, timType, timConductivity, contactAreaCm2);
  }, [bltMicrons, clampingPressureKPa, timType, timConductivity, contactAreaCm2]);

  const comparisonRows = useMemo(() => {
    return compareTimPresets(contactAreaCm2);
  }, [contactAreaCm2]);

  const pcmResult = useMemo(() => {
    return calculatePhaseChangeModel(pcmOperatingTemp, pcmMeltTemp, 60, 25, 3.5, contactAreaCm2);
  }, [pcmOperatingTemp, pcmMeltTemp, contactAreaCm2]);

  const washerResult = useMemo(() => {
    return calculateInsulatingWasher(washerMaterial, washerThicknessMm, contactAreaCm2, washerGreased);
  }, [washerMaterial, washerThicknessMm, contactAreaCm2, washerGreased]);

  const roughnessResult = useMemo(() => {
    return calculateSurfaceRoughnessImpact(bltMicrons, surfaceRaUm, flatnessDevUm, timConductivity, contactAreaCm2);
  }, [bltMicrons, surfaceRaUm, flatnessDevUm, timConductivity, contactAreaCm2]);

  const pumpOutResult = useMemo(() => {
    return calculateGreasePumpOut(timResult.totalTimResistanceKW, thermalCycles, deltaTCycle, timType === 'pcm');
  }, [timResult, thermalCycles, deltaTCycle, timType]);

  const fluxResult = useMemo(() => {
    return calculateHeatFlux(fluxPowerW, dieAreaMm2);
  }, [fluxPowerW, dieAreaMm2]);

  const stackupResult = useMemo(() => {
    return calculateMultiLayerTimStackup(
      [
        { id: 'tim1', name: 'TIM 1 (Indium Solder / Liquid Metal)', thicknessMm: 0.05, thermalConductivityWmK: 50, contactResistanceFactorCm2KW: 0.01 },
        { id: 'spreader', name: 'Copper Integrated Heat Spreader (IHS)', thicknessMm: 2.0, thermalConductivityWmK: 390, contactResistanceFactorCm2KW: 0.0 },
        { id: 'tim2', name: 'TIM 2 (Non-Silicone Thermal Grease)', thicknessMm: 0.035, thermalConductivityWmK: 4.5, contactResistanceFactorCm2KW: 0.03 },
        { id: 'base', name: 'Nickel-Plated Copper Sink Base', thicknessMm: 3.5, thermalConductivityWmK: 380, contactResistanceFactorCm2KW: 0.0 },
      ],
      dieAreaMm2 / 100,
      fluxPowerW
    );
  }, [dieAreaMm2, fluxPowerW]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('tim_calc')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'tim_calc' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          TIM Resistance & Pressure
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('comparison')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'comparison' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Grease vs Pad Comparison
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pcm_washer')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'pcm_washer' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          PCM & Insulating Washers
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roughness_pumpout')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'roughness_pumpout' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Roughness & Pump-Out
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stackup')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'stackup' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Heat Flux & Multi-Layer TIM
        </button>
      </div>

      {/* Tab 1: TIM Resistance & Pressure */}
      {activeTab === 'tim_calc' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">TIM Layer Properties</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Bond Line Thickness (BLT) µm</label>
                <input
                  type="number"
                  value={bltMicrons}
                  onChange={(e) => setBltMicrons(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Thermal Cond. k (W/mK)</label>
                <input
                  type="number"
                  step="0.5"
                  value={timConductivity}
                  onChange={(e) => setTimConductivity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Area (cm²)</label>
                <input
                  type="number"
                  step="0.5"
                  value={contactAreaCm2}
                  onChange={(e) => setContactAreaCm2(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Clamping Pressure (kPa)</label>
                <input
                  type="number"
                  step="25"
                  value={clampingPressureKPa}
                  onChange={(e) => setClampingPressureKPa(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Total TIM Resistance Rθ" value={timResult.totalTimResistanceKW.toFixed(4)} unit="°C/W" highlight />
              <ResultCard label="Bulk Conduction R_bulk" value={timResult.bulkTimResistanceKW.toFixed(4)} unit="°C/W" />
              <ResultCard label="Contact Resistance R_c" value={timResult.contactResistanceKW.toFixed(4)} unit="°C/W" />
              <ResultCard label="Specific Impedance" value={timResult.specificThermalImpedanceCm2KW.toFixed(3)} unit="cm²·K/W" />
              <ResultCard label="Effective Compressed BLT" value={pressureResult.effectiveBltMicrons.toFixed(1)} unit="µm" />
              <ResultCard label="Pressure Regime" value={pressureResult.pressureCategory} unit="" />
            </div>

            <CalculationStepViewer
              steps={[
                {
                  title: 'TIM Total Thermal Resistance Formulation',
                  formula: 'R_{\\theta tim} = \\frac{BLT}{k_{tim} \\cdot A} + R_{contact}',
                  substitution: `${(bltMicrons * 1e-6).toExponential(2)} / (${timConductivity} \\times ${(contactAreaCm2 * 1e-4).toExponential(2)}) + ${timResult.contactResistanceKW.toFixed(4)} = ${timResult.totalTimResistanceKW.toFixed(4)} °C/W`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Preset Comparison */}
      {activeTab === 'comparison' && (
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Thermal Interface Material Benchmark Library</h3>
            <span className="text-xs font-mono text-slate-400">Evaluated at A = {contactAreaCm2} cm²</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Material Description</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Conductivity (k)</th>
                  <th className="p-2.5">Nominal BLT</th>
                  <th className="p-2.5 text-cyan-400">Thermal Rθ</th>
                  <th className="p-2.5">Dielectric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparisonRows.map((row) => (
                  <tr key={row.presetId} className="hover:bg-slate-800/30">
                    <td className="p-2.5 text-slate-200 font-semibold">{row.name}</td>
                    <td className="p-2.5 text-slate-400">{row.category}</td>
                    <td className="p-2.5 text-slate-300">{row.conductivityWmK} W/mK</td>
                    <td className="p-2.5 text-slate-400">{row.typicalBltUm} µm</td>
                    <td className="p-2.5 text-cyan-300 font-bold">{row.thermalResistanceKW.toFixed(4)} °C/W</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.isDielectric ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {row.isDielectric ? 'ISOLATED' : 'CONDUCTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: PCM & Insulating Washer */}
      {activeTab === 'pcm_washer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Phase Change Material (PCM) State</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Operating Temp (°C)</label>
                <input
                  type="number"
                  value={pcmOperatingTemp}
                  onChange={(e) => setPcmOperatingTemp(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Melt Transition Temp (°C)</label>
                <input
                  type="number"
                  value={pcmMeltTemp}
                  onChange={(e) => setPcmMeltTemp(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <ResultCard label="Phase State" value={pcmResult.phaseState} unit="" highlight />
              <ResultCard label="Effective BLT" value={pcmResult.effectiveBltUm.toFixed(1)} unit="µm" />
              <ResultCard label="PCM Thermal Resistance" value={pcmResult.thermalResistanceKW.toFixed(4)} unit="°C/W" />
              <ResultCard label="Thermal Conductance" value={pcmResult.conductanceWK.toFixed(2)} unit="W/°C" />
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Insulating Washer Sizing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Washer Material</label>
                <select
                  value={washerMaterial}
                  onChange={(e) => setWasherMaterial(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                >
                  <option value="sil_pad">Sil-Pad Elastomer (1.3 W/mK)</option>
                  <option value="mica">Mica Sheet (0.6 W/mK)</option>
                  <option value="kapton">Kapton Polyimide (0.2 W/mK)</option>
                  <option value="alumina">Alumina Al2O3 Ceramic (25 W/mK)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Thickness (mm)</label>
                <input
                  type="number"
                  step="0.05"
                  value={washerThicknessMm}
                  onChange={(e) => setWasherThicknessMm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <ResultCard label="Washer Thermal Rθ" value={washerResult.thermalResistanceKW.toFixed(4)} unit="°C/W" highlight />
              <ResultCard label="Breakdown Voltage" value={washerResult.breakdownVoltageKv.toFixed(1)} unit="kV" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Roughness & Pump-Out */}
      {activeTab === 'roughness_pumpout' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Surface Roughness & Flatness Degradation</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Roughness Average Ra (µm)</label>
                <input
                  type="number"
                  step="0.2"
                  value={surfaceRaUm}
                  onChange={(e) => setSurfaceRaUm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Flatness Camber (µm)</label>
                <input
                  type="number"
                  step="5"
                  value={flatnessDevUm}
                  onChange={(e) => setFlatnessDevUm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Effective Micro-Gap" value={roughnessResult.effectiveBltMicrons.toFixed(1)} unit="µm" />
              <ResultCard label="Micro-Void Fraction" value={(roughnessResult.voidFraction * 100).toFixed(1)} unit="%" />
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Grease Pump-Out & Dry-Out Aging</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Power Thermal Cycles</label>
                <input
                  type="number"
                  step="250"
                  value={thermalCycles}
                  onChange={(e) => setThermalCycles(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cycle Temp Swing ΔT (°C)</label>
                <input
                  type="number"
                  value={deltaTCycle}
                  onChange={(e) => setDeltaTCycle(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Degraded Rθ After Cycles" value={pumpOutResult.degradedRthKW.toFixed(4)} unit="°C/W" highlight />
              <ResultCard label="Degradation Factor" value={pumpOutResult.degradationMultiplier.toFixed(2)} unit="×" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Heat Flux & Multi-layer Stackup */}
      {activeTab === 'stackup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Interface Heat Flux (W/cm²)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Die Power (Watts)</label>
                <input
                  type="number"
                  value={fluxPowerW}
                  onChange={(e) => setFluxPowerW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Die Active Area (mm²)</label>
                <input
                  type="number"
                  value={dieAreaMm2}
                  onChange={(e) => setDieAreaMm2(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Heat Flux (q'')" value={fluxResult.heatFluxWperCm2.toFixed(1)} unit="W/cm²" highlight />
              <ResultCard label="Flux in W/m²" value={fluxResult.heatFluxWperM2.toLocaleString()} unit="W/m²" />
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-400">
              <strong className="text-slate-200">Recommended Architecture:</strong> {fluxResult.recommendedCoolingStrategy}
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Multi-Layer TIM Stackup (Die → TIM1 → IHS → TIM2 → Sink)</h3>
            <ResultCard label="Total Stackup Rθ" value={stackupResult.totalResistanceKW.toFixed(4)} unit="°C/W" highlight />
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {stackupResult.layerResults.map((l) => (
                <div key={l.id} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 font-mono text-xs">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>{l.name}</span>
                    <span className="text-cyan-400">{l.totalLayerResistanceKW.toFixed(4)} °C/W ({l.pctOfTotal}%)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">ΔT across layer: {l.deltaTKelvin.toFixed(2)} °C</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
