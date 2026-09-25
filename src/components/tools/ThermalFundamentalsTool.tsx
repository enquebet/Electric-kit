import React, { useState, useMemo } from 'react';
import {
  calculateHeatEnergy,
  calculateHeatTransferRate,
  convertTemperature,
  calculateTemperatureDifference,
  calculateThermalResistance,
  calculateThermalConductance,
  calculateSeriesThermalResistance,
  calculateParallelThermalResistance,
  convertResistanceConductance,
  solveThermalNetwork,
  THERMAL_MATERIALS,
  TemperatureUnit,
} from '../../engines/thermal/fundamentals';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Flame, ArrowRightLeft, Layers, GitFork, Gauge, Network } from 'lucide-react';

export function ThermalFundamentalsTool() {
  const [activeTab, setActiveTab] = useState<
    'energy' | 'rate' | 'temperature' | 'resistance' | 'series_parallel' | 'network'
  >('energy');

  // 1. Heat Energy state
  const [selectedMaterial, setSelectedMaterial] = useState<string>('aluminum_6061');
  const [massGrams, setMassGrams] = useState<number>(250);
  const [deltaTInput, setDeltaTInput] = useState<number>(40);

  // 2. Heat Transfer Rate state
  const [rateMode, setRateMode] = useState<'energy_time' | 'resistance_deltaT' | 'conduction_geometry'>('conduction_geometry');
  const [energyInputJ, setEnergyInputJ] = useState<number>(5000);
  const [timeInputS, setTimeInputS] = useState<number>(10);
  const [rateDeltaTC, setRateDeltaTC] = useState<number>(30);
  const [rateRth, setRateRth] = useState<number>(2.5);
  const [geomK, setGeomK] = useState<number>(167);
  const [geomAreaCm2, setGeomAreaCm2] = useState<number>(50);
  const [geomLengthMm, setGeomLengthMm] = useState<number>(25);

  // 3. Temperature Conversion & Difference
  const [tempVal, setTempVal] = useState<number>(25);
  const [fromTempUnit, setFromTempUnit] = useState<TemperatureUnit>('C');
  const [tHotVal, setTHotVal] = useState<number>(85);
  const [tColdVal, setTColdVal] = useState<number>(25);
  const [diffUnit, setDiffUnit] = useState<TemperatureUnit>('C');

  // 4. Resistance & Conductance
  const [resMode, setResMode] = useState<'geometry' | 'power_temp'>('geometry');
  const [resLengthMm, setResLengthMm] = useState<number>(5);
  const [resCondK, setResCondK] = useState<number>(1.5);
  const [resAreaCm2, setResAreaCm2] = useState<number>(10);
  const [resDeltaT, setResDeltaT] = useState<number>(15);
  const [resPowerW, setResPowerW] = useState<number>(20);
  const [bidirectionalVal, setBidirectionalVal] = useState<number>(1.25);
  const [bidirectionalType, setBidirectionalType] = useState<'R' | 'G'>('R');

  // 5. Series & Parallel Networks
  const [seriesR1, setSeriesR1] = useState<number>(0.8);
  const [seriesR2, setSeriesR2] = useState<number>(0.4);
  const [seriesR3, setSeriesR3] = useState<number>(1.5);
  const [networkPowerW, setNetworkPowerW] = useState<number>(35);
  const [parallelR1, setParallelR1] = useState<number>(2.0);
  const [parallelR2, setParallelR2] = useState<number>(4.0);

  // 6. Multi-node Nodal Solver
  const [node1HeatW, setNode1HeatW] = useState<number>(45);
  const [node2HeatW, setNode2HeatW] = useState<number>(15);
  const [fixedAmbC, setFixedAmbC] = useState<number>(25);
  const [rDieToCase, setRDieToCase] = useState<number>(0.5);
  const [rCaseToSink, setRCaseToSink] = useState<number>(0.3);
  const [rSinkToAmb, setRSinkToAmb] = useState<number>(1.2);

  // Calculations
  const mat = THERMAL_MATERIALS[selectedMaterial] || THERMAL_MATERIALS.aluminum_6061;
  const energyResult = useMemo(() => {
    return calculateHeatEnergy({
      massKg: massGrams / 1000,
      specificHeatJkgK: mat.c_p,
      deltaTKelvin: deltaTInput,
    });
  }, [massGrams, mat, deltaTInput]);

  const rateResult = useMemo(() => {
    return calculateHeatTransferRate({
      mode: rateMode,
      energyJoules: energyInputJ,
      timeSeconds: timeInputS,
      deltaTKelvin: rateDeltaTC,
      thermalResistanceKW: rateRth,
      thermalConductivityWmK: geomK,
      areaM2: geomAreaCm2 * 1e-4,
      lengthMeters: geomLengthMm * 1e-3,
    });
  }, [rateMode, energyInputJ, timeInputS, rateDeltaTC, rateRth, geomK, geomAreaCm2, geomLengthMm]);

  const convResult = useMemo(() => convertTemperature(tempVal, fromTempUnit), [tempVal, fromTempUnit]);
  const diffResult = useMemo(() => calculateTemperatureDifference(tHotVal, tColdVal, diffUnit), [tHotVal, tColdVal, diffUnit]);

  const rthResult = useMemo(() => {
    return calculateThermalResistance({
      mode: resMode,
      lengthMeters: resLengthMm * 1e-3,
      thermalConductivityWmK: resCondK,
      areaM2: resAreaCm2 * 1e-4,
      deltaTKelvin: resDeltaT,
      powerWatts: resPowerW,
    });
  }, [resMode, resLengthMm, resCondK, resAreaCm2, resDeltaT, resPowerW]);

  const bidiResult = useMemo(() => convertResistanceConductance(bidirectionalVal, bidirectionalType), [bidirectionalVal, bidirectionalType]);

  const seriesResult = useMemo(() => {
    return calculateSeriesThermalResistance(
      [
        { id: 'r1', name: 'Stage 1 (Die/Junction)', resistanceKW: seriesR1 },
        { id: 'r2', name: 'Stage 2 (Interface TIM)', resistanceKW: seriesR2 },
        { id: 'r3', name: 'Stage 3 (Heat Sink)', resistanceKW: seriesR3 },
      ],
      networkPowerW
    );
  }, [seriesR1, seriesR2, seriesR3, networkPowerW]);

  const parallelResult = useMemo(() => {
    return calculateParallelThermalResistance(
      [
        { id: 'p1', name: 'Primary Fin Bank', resistanceKW: parallelR1 },
        { id: 'p2', name: 'Chassis Conduction Path', resistanceKW: parallelR2 },
      ],
      networkPowerW
    );
  }, [parallelR1, parallelR2, networkPowerW]);

  const nodalResult = useMemo(() => {
    return solveThermalNetwork(
      [
        { id: 'die', name: 'Semiconductor Die (Junction)', heatSourceWatts: node1HeatW },
        { id: 'case', name: 'Device Case / Tab', heatSourceWatts: node2HeatW },
        { id: 'sink', name: 'Heatsink Base' },
        { id: 'amb', name: 'Ambient Air', fixedTemperatureC: fixedAmbC },
      ],
      [
        { fromNodeId: 'die', toNodeId: 'case', resistanceKW: rDieToCase },
        { fromNodeId: 'case', toNodeId: 'sink', resistanceKW: rCaseToSink },
        { fromNodeId: 'sink', toNodeId: 'amb', resistanceKW: rSinkToAmb },
      ]
    );
  }, [node1HeatW, node2HeatW, fixedAmbC, rDieToCase, rCaseToSink, rSinkToAmb]);

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('energy')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'energy' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Heat Energy (Q = mcΔT)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rate')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'rate' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Heat Transfer Rate (q)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('temperature')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'temperature' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Temp Conversions & ΔT
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('resistance')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'resistance' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Resistance & Conductance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('series_parallel')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'series_parallel' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          Series & Parallel Networks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'network' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Multi-Node Nodal Ladder
        </button>
      </div>

      {/* Tab 1: Heat Energy */}
      {activeTab === 'energy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-cyan-400" />
              Thermal Mass & Heat Energy Inputs
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Preset Material</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
              >
                {Object.entries(THERMAL_MATERIALS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.name} ({item.c_p} J/kg·K)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Mass (grams)</label>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={massGrams}
                  onChange={(e) => setMassGrams(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Temperature Rise ΔT (°C or K)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={deltaTInput}
                  onChange={(e) => setDeltaTInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-300">Material Specific Heat:</strong> {mat.c_p} J/(kg·K)</p>
              <p><strong className="text-slate-300">Density:</strong> {mat.density} kg/m³ | <strong className="text-slate-300">Conductivity:</strong> {mat.thermalConductivity} W/(m·K)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Thermal Energy (Q)" value={energyResult.energyJoules.toFixed(1)} unit="Joules" highlight />
              <ResultCard label="Energy in Watt-Hours" value={energyResult.energyWattHours.toFixed(4)} unit="Wh" />
              <ResultCard label="Thermal Capacitance (Cth)" value={energyResult.thermalCapacitanceJK.toFixed(2)} unit="J/K" />
              <ResultCard label="Energy in BTU" value={energyResult.energyBtu.toFixed(2)} unit="BTU" />
            </div>
            <CalculationStepViewer
              steps={[
                {
                  title: 'Thermal Capacitance Formula',
                  formula: 'C_{th} = m \\cdot c_p',
                  substitution: `C_{th} = ${(massGrams / 1000).toFixed(4)} \\text{ kg} \\times ${mat.c_p} \\text{ J/(kg·K)} = ${energyResult.thermalCapacitanceJK.toFixed(2)} \\text{ J/K}`,
                },
                {
                  title: 'Sensible Heat Energy Accumulated',
                  formula: 'Q = C_{th} \\cdot \\Delta T',
                  substitution: `Q = ${energyResult.thermalCapacitanceJK.toFixed(2)} \\text{ J/K} \\times ${deltaTInput} \\text{ K} = ${energyResult.energyJoules.toFixed(1)} \\text{ J}`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Heat Transfer Rate */}
      {activeTab === 'rate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Heat Transfer Rate Solver</h3>
            <div className="flex gap-2">
              {(['conduction_geometry', 'resistance_deltaT', 'energy_time'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRateMode(m)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg border ${
                    rateMode === m ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {m === 'conduction_geometry' ? '1D Conduction' : m === 'resistance_deltaT' ? 'ΔT / Rth' : 'Energy / Time'}
                </button>
              ))}
            </div>

            {rateMode === 'conduction_geometry' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Thermal Cond. k (W/mK)</label>
                  <input
                    type="number"
                    value={geomK}
                    onChange={(e) => setGeomK(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Area (cm²)</label>
                  <input
                    type="number"
                    value={geomAreaCm2}
                    onChange={(e) => setGeomAreaCm2(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Thickness / Length L (mm)</label>
                  <input
                    type="number"
                    value={geomLengthMm}
                    onChange={(e) => setGeomLengthMm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Temp Difference ΔT (K)</label>
                  <input
                    type="number"
                    value={rateDeltaTC}
                    onChange={(e) => setRateDeltaTC(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {rateMode === 'resistance_deltaT' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Thermal Resistance Rth (°C/W)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rateRth}
                    onChange={(e) => setRateRth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Temp Difference ΔT (°C or K)</label>
                  <input
                    type="number"
                    value={rateDeltaTC}
                    onChange={(e) => setRateDeltaTC(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {rateMode === 'energy_time' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Energy Q (Joules)</label>
                  <input
                    type="number"
                    value={energyInputJ}
                    onChange={(e) => setEnergyInputJ(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Time Duration (seconds)</label>
                  <input
                    type="number"
                    value={timeInputS}
                    onChange={(e) => setTimeInputS(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Heat Transfer Rate (q)" value={rateResult.heatRateWatts.toFixed(2)} unit="Watts" highlight />
              <ResultCard label="Rate in BTU/hr" value={rateResult.heatRateBtuPerHour.toFixed(2)} unit="BTU/hr" />
              <ResultCard label="Rate in cal/s" value={rateResult.heatRateCaloriesPerSec.toFixed(2)} unit="cal/s" />
              <ResultCard label="Effective Rth" value={rateResult.effectiveResistanceKW.toFixed(4)} unit="°C/W" />
            </div>
            <CalculationStepViewer
              steps={[
                {
                  title: 'Governing Thermal Conduction Rate',
                  formula: rateResult.formula,
                  substitution: `Heat flow q = ${rateResult.heatRateWatts.toFixed(2)} W`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Temperature Conversion & Difference */}
      {activeTab === 'temperature' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Absolute Temperature Conversion</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Input Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempVal}
                  onChange={(e) => setTempVal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Unit</label>
                <select
                  value={fromTempUnit}
                  onChange={(e) => setFromTempUnit(e.target.value as TemperatureUnit)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                >
                  <option value="C">Celsius (°C)</option>
                  <option value="F">Fahrenheit (°F)</option>
                  <option value="K">Kelvin (K)</option>
                  <option value="R">Rankine (°R)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <ResultCard label="Celsius" value={convResult.celsius.toFixed(2)} unit="°C" />
              <ResultCard label="Kelvin" value={convResult.kelvin.toFixed(2)} unit="K" />
              <ResultCard label="Fahrenheit" value={convResult.fahrenheit.toFixed(2)} unit="°F" />
              <ResultCard label="Rankine" value={convResult.rankine.toFixed(2)} unit="°R" />
            </div>

            <h3 className="text-sm font-semibold text-slate-200 pt-4 border-t border-slate-800">
              Temperature Difference (ΔT) Converter
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">T_hot</label>
                <input
                  type="number"
                  value={tHotVal}
                  onChange={(e) => setTHotVal(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">T_cold</label>
                <input
                  type="number"
                  value={tColdVal}
                  onChange={(e) => setTColdVal(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Unit</label>
                <select
                  value={diffUnit}
                  onChange={(e) => setDiffUnit(e.target.value as TemperatureUnit)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                >
                  <option value="C">°C</option>
                  <option value="F">°F</option>
                  <option value="K">K</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ResultCard label="ΔT (°C or K)" value={diffResult.deltaCelsius.toFixed(2)} unit="°C / K" highlight />
              <ResultCard label="ΔT (°F or °R)" value={diffResult.deltaFahrenheit.toFixed(2)} unit="°F / °R" />
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Fundamental Thermal Relationships</h3>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
              <p>• Absolute Zero: 0 K = -273.15 °C = -459.67 °F</p>
              <p>• T(K) = T(°C) + 273.15</p>
              <p>• T(°F) = T(°C) × 9/5 + 32</p>
              <p>• 1 K difference ≡ 1 °C difference ≡ 1.8 °F difference</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Resistance & Conductance */}
      {activeTab === 'resistance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Thermal Resistance Calculator</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResMode('geometry')}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border ${
                  resMode === 'geometry' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Geometry Rth = L/(k·A)
              </button>
              <button
                type="button"
                onClick={() => setResMode('power_temp')}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border ${
                  resMode === 'power_temp' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Ohm's Law Rth = ΔT / P
              </button>
            </div>

            {resMode === 'geometry' ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Thickness L (mm)</label>
                  <input
                    type="number"
                    value={resLengthMm}
                    onChange={(e) => setResLengthMm(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cond. k (W/mK)</label>
                  <input
                    type="number"
                    value={resCondK}
                    onChange={(e) => setResCondK(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Area A (cm²)</label>
                  <input
                    type="number"
                    value={resAreaCm2}
                    onChange={(e) => setResAreaCm2(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Temp Rise ΔT (°C)</label>
                  <input
                    type="number"
                    value={resDeltaT}
                    onChange={(e) => setResDeltaT(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Power P (Watts)</label>
                  <input
                    type="number"
                    value={resPowerW}
                    onChange={(e) => setResPowerW(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <ResultCard label="Thermal Resistance (Rth)" value={rthResult.resistanceKW.toFixed(4)} unit="°C/W" highlight />
              <ResultCard label="Thermal Conductance (Gth)" value={rthResult.conductanceWK.toFixed(4)} unit="W/°C" />
            </div>

            <h3 className="text-sm font-semibold text-slate-200 pt-4 border-t border-slate-800">
              Bidirectional Rth ↔ Gth Converter
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={bidirectionalVal}
                  onChange={(e) => setBidirectionalVal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Convert From</label>
                <select
                  value={bidirectionalType}
                  onChange={(e) => setBidirectionalType(e.target.value as 'R' | 'G')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                >
                  <option value="R">Thermal Resistance Rth (°C/W)</option>
                  <option value="G">Thermal Conductance Gth (W/°C)</option>
                </select>
              </div>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
              Result: Rth = {bidiResult.resistanceKW.toFixed(4)} °C/W ⇄ Gth = {bidiResult.conductanceWK.toFixed(4)} W/°C
            </div>
          </div>

          <div className="space-y-4">
            <CalculationStepViewer
              steps={[
                {
                  title: 'Calculation Derivation',
                  formula: rthResult.formula,
                  substitution: `Thermal resistance = ${rthResult.resistanceKW.toFixed(4)} °C/W`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 5: Series & Parallel Networks */}
      {activeTab === 'series_parallel' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Series Thermal Resistance Network</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">R1 (Die) °C/W</label>
                <input
                  type="number"
                  step="0.05"
                  value={seriesR1}
                  onChange={(e) => setSeriesR1(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">R2 (TIM) °C/W</label>
                <input
                  type="number"
                  step="0.05"
                  value={seriesR2}
                  onChange={(e) => setSeriesR2(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">R3 (Sink) °C/W</label>
                <input
                  type="number"
                  step="0.05"
                  value={seriesR3}
                  onChange={(e) => setSeriesR3(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Dissipated Power (Watts)</label>
              <input
                type="number"
                value={networkPowerW}
                onChange={(e) => setNetworkPowerW(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Total Series Rth" value={seriesResult.totalResistanceKW.toFixed(3)} unit="°C/W" highlight />
              <ResultCard label="Total ΔT Across Chain" value={(seriesResult.totalResistanceKW * networkPowerW).toFixed(2)} unit="°C" />
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <p className="text-xs font-medium text-slate-300">Temperature Drop Breakdown:</p>
              {seriesResult.voltageEquivalentDrops.map((d) => (
                <div key={d.id} className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>{d.name}:</span>
                  <span className="text-slate-200 font-semibold">{d.deltaTKelvin.toFixed(1)} °C ({d.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Parallel Thermal Resistance Network</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch 1 Rth (°C/W)</label>
                <input
                  type="number"
                  step="0.1"
                  value={parallelR1}
                  onChange={(e) => setParallelR1(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch 2 Rth (°C/W)</label>
                <input
                  type="number"
                  step="0.1"
                  value={parallelR2}
                  onChange={(e) => setParallelR2(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Equivalent Parallel Rth" value={parallelResult.totalResistanceKW.toFixed(4)} unit="°C/W" highlight />
              <ResultCard label="Total Conductance Gth" value={parallelResult.totalConductanceWK.toFixed(3)} unit="W/°C" />
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <p className="text-xs font-medium text-slate-300">Heat Flow Distribution:</p>
              {parallelResult.branchHeatFlows.map((b) => (
                <div key={b.id} className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>{b.name}:</span>
                  <span className="text-slate-200 font-semibold">{b.heatFlowWatts.toFixed(1)} W ({b.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Multi-Node Nodal Ladder */}
      {activeTab === 'network' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Nodal Thermal Ladder Network Solver
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Die Heat Source (W)</label>
                <input
                  type="number"
                  value={node1HeatW}
                  onChange={(e) => setNode1HeatW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Case Dissipation (W)</label>
                <input
                  type="number"
                  value={node2HeatW}
                  onChange={(e) => setNode2HeatW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ambient Ta (°C)</label>
                <input
                  type="number"
                  value={fixedAmbC}
                  onChange={(e) => setFixedAmbC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rθ_die-case (°C/W)</label>
                <input
                  type="number"
                  step="0.05"
                  value={rDieToCase}
                  onChange={(e) => setRDieToCase(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rθ_case-sink (°C/W)</label>
                <input
                  type="number"
                  step="0.05"
                  value={rCaseToSink}
                  onChange={(e) => setRCaseToSink(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rθ_sink-amb (°C/W)</label>
                <input
                  type="number"
                  step="0.05"
                  value={rSinkToAmb}
                  onChange={(e) => setRSinkToAmb(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Nodal Thermal Solution (Modified Nodal Analysis)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Die Junction Temp (Tj)" value={nodalResult.nodeTemperaturesC.die?.toFixed(1) ?? '0'} unit="°C" highlight />
              <ResultCard label="Case Temperature (Tc)" value={nodalResult.nodeTemperaturesC.case?.toFixed(1) ?? '0'} unit="°C" />
              <ResultCard label="Heatsink Temp (Ts)" value={nodalResult.nodeTemperaturesC.sink?.toFixed(1) ?? '0'} unit="°C" />
              <ResultCard label="Ambient Air (Ta)" value={nodalResult.nodeTemperaturesC.amb?.toFixed(1) ?? '0'} unit="°C" />
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <p className="text-xs font-medium text-slate-300">Branch Heat Flows:</p>
              {nodalResult.branchHeatFlowsWatts.map((f, i) => (
                <div key={i} className="flex justify-between text-xs font-mono text-slate-400 border-b border-slate-800/60 pb-1">
                  <span>{f.from} → {f.to}:</span>
                  <span className="text-cyan-400 font-bold">{f.heatFlowWatts.toFixed(2)} W</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
