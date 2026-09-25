import React, { useState, useMemo } from 'react';
import {
  calculateJunctionTemperature,
  calculateCaseTemperature,
  calculateMaxAmbientTemperature,
  calculateRthJc,
  calculateRthCs,
  calculateRthSa,
  calculateRthJa,
  calculateMaxAllowablePower,
  calculateTemperatureDerating,
  calculateMultiDeviceThermal,
  SEMICONDUCTOR_PACKAGES,
} from '../../engines/thermal/semiconductor';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Cpu, Thermometer, TrendingDown, Users, ShieldAlert, Zap } from 'lucide-react';

export function SemiconductorThermalTool() {
  const [activeTab, setActiveTab] = useState<'junction' | 'resistances' | 'derating' | 'multidevice'>('junction');

  // 1. Junction & Case state
  const [selectedPackage, setSelectedPackage] = useState<string>('to220');
  const [powerWatts, setPowerWatts] = useState<number>(15);
  const [ambientTempC, setAmbientTempC] = useState<number>(40);
  const [rthJcInput, setRthJcInput] = useState<number>(1.5);
  const [rthCsInput, setRthCsInput] = useState<number>(0.5);
  const [rthSaInput, setRthSaInput] = useState<number>(3.0);
  const [maxTjInput, setMaxTjInput] = useState<number>(150);

  // 2. Resistance Extraction state
  const [testTj, setTestTj] = useState<number>(115);
  const [testTc, setTestTc] = useState<number>(85);
  const [testTs, setTestTs] = useState<number>(75);
  const [testTa, setTestTa] = useState<number>(35);
  const [testPowerW, setTestPowerW] = useState<number>(25);

  // 3. Derating state
  const [ratedPowerW, setRatedPowerW] = useState<number>(50);
  const [kneeTempC, setKneeTempC] = useState<number>(25);
  const [maxJunctionForDerate, setMaxJunctionForDerate] = useState<number>(150);
  const [operatingTempC, setOperatingTempC] = useState<number>(75);
  const [operatingPowerW, setOperatingPowerW] = useState<number>(30);

  // 4. Multi-device on shared heatsink
  const [sharedRthSa, setSharedRthSa] = useState<number>(1.0);
  const [sharedAmbC, setSharedAmbC] = useState<number>(35);
  const [dev1Power, setDev1Power] = useState<number>(20);
  const [dev1Rjc, setDev1Rjc] = useState<number>(1.2);
  const [dev1Rcs, setDev1Rcs] = useState<number>(0.4);
  const [dev2Power, setDev2Power] = useState<number>(15);
  const [dev2Rjc, setDev2Rjc] = useState<number>(1.5);
  const [dev2Rcs, setDev2Rcs] = useState<number>(0.5);
  const [dev3Power, setDev3Power] = useState<number>(10);
  const [dev3Rjc, setDev3Rjc] = useState<number>(2.0);
  const [dev3Rcs, setDev3Rcs] = useState<number>(0.6);

  // Handlers for package selection
  const handleSelectPackage = (pkgKey: string) => {
    setSelectedPackage(pkgKey);
    const p = SEMICONDUCTOR_PACKAGES[pkgKey];
    if (p) {
      setRthJcInput(p.typicalRthJc);
      setRthCsInput(p.typicalRthCsGreased);
      setMaxTjInput(p.maxTjDefault);
    }
  };

  // Calculations
  const junctionResult = useMemo(() => {
    return calculateJunctionTemperature({
      powerDissipationWatts: powerWatts,
      ambientTempC,
      rthJcKW: rthJcInput,
      rthCsKW: rthCsInput,
      rthSaKW: rthSaInput,
      maxJunctionTempC: maxTjInput,
    });
  }, [powerWatts, ambientTempC, rthJcInput, rthCsInput, rthSaInput, maxTjInput]);

  const maxPowerResult = useMemo(() => {
    return calculateMaxAllowablePower(maxTjInput, ambientTempC, rthJcInput + rthCsInput + rthSaInput);
  }, [maxTjInput, ambientTempC, rthJcInput, rthCsInput, rthSaInput]);

  const maxAmbResult = useMemo(() => {
    return calculateMaxAmbientTemperature(maxTjInput, powerWatts, rthJcInput + rthCsInput + rthSaInput);
  }, [maxTjInput, powerWatts, rthJcInput, rthCsInput, rthSaInput]);

  const extractedRjc = useMemo(() => {
    try {
      return calculateRthJc(testTj, testTc, testPowerW);
    } catch {
      return { rthJcKW: 0, formula: '' };
    }
  }, [testTj, testTc, testPowerW]);

  const extractedRcs = useMemo(() => {
    try {
      return calculateRthCs(testTc, testTs, testPowerW);
    } catch {
      return { rthCsKW: 0, formula: '' };
    }
  }, [testTc, testTs, testPowerW]);

  const extractedRsa = useMemo(() => {
    try {
      return calculateRthSa(testTs, testTa, testPowerW);
    } catch {
      return { rthSaKW: 0, formula: '' };
    }
  }, [testTs, testTa, testPowerW]);

  const extractedRja = useMemo(() => {
    return calculateRthJa(extractedRjc.rthJcKW, extractedRcs.rthCsKW, extractedRsa.rthSaKW);
  }, [extractedRjc, extractedRcs, extractedRsa]);

  const deratingResult = useMemo(() => {
    return calculateTemperatureDerating(ratedPowerW, kneeTempC, maxJunctionForDerate, operatingTempC, operatingPowerW);
  }, [ratedPowerW, kneeTempC, maxJunctionForDerate, operatingTempC, operatingPowerW]);

  const multiResult = useMemo(() => {
    return calculateMultiDeviceThermal(
      [
        { id: 'q1', name: 'Q1 (High-Side Switch)', powerWatts: dev1Power, rthJcKW: dev1Rjc, rthCsKW: dev1Rcs, tjMaxC: 150 },
        { id: 'q2', name: 'Q2 (Low-Side Switch)', powerWatts: dev2Power, rthJcKW: dev2Rjc, rthCsKW: dev2Rcs, tjMaxC: 150 },
        { id: 'd1', name: 'D1 (Freewheeling Diode)', powerWatts: dev3Power, rthJcKW: dev3Rjc, rthCsKW: dev3Rcs, tjMaxC: 150 },
      ],
      sharedRthSa,
      sharedAmbC
    );
  }, [sharedRthSa, sharedAmbC, dev1Power, dev1Rjc, dev1Rcs, dev2Power, dev2Rjc, dev2Rcs, dev3Power, dev3Rjc, dev3Rcs]);

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('junction')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'junction' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Junction / Case / Ambient
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('resistances')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'resistances' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" />
          Rθjc, Rθcs, Rθsa Extraction
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('derating')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'derating' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Temperature Derating Curve
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('multidevice')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'multidevice' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Multi-Device Shared Heatsink
        </button>
      </div>

      {/* Tab 1: Junction Temperature */}
      {activeTab === 'junction' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Package & Thermal Chain Parameters</h3>
              <span className="text-xs font-mono text-cyan-400">Tj = Ta + P·Rth</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Semiconductor Package Preset</label>
              <select
                value={selectedPackage}
                onChange={(e) => handleSelectPackage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
              >
                {Object.entries(SEMICONDUCTOR_PACKAGES).map(([k, p]) => (
                  <option key={k} value={k}>
                    {p.name} (Rθjc = {p.typicalRthJc} °C/W)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Power Dissipated (Watts)</label>
                <input
                  type="number"
                  step="0.5"
                  value={powerWatts}
                  onChange={(e) => setPowerWatts(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ambient Air Ta (°C)</label>
                <input
                  type="number"
                  value={ambientTempC}
                  onChange={(e) => setAmbientTempC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rθjc (Junction-to-Case) °C/W</label>
                <input
                  type="number"
                  step="0.1"
                  value={rthJcInput}
                  onChange={(e) => setRthJcInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rθcs (Case-to-Sink TIM) °C/W</label>
                <input
                  type="number"
                  step="0.05"
                  value={rthCsInput}
                  onChange={(e) => setRthCsInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rθsa (Sink-to-Ambient) °C/W</label>
                <input
                  type="number"
                  step="0.1"
                  value={rthSaInput}
                  onChange={(e) => setRthSaInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Rated Tj (°C)</label>
                <input
                  type="number"
                  value={maxTjInput}
                  onChange={(e) => setMaxTjInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                junctionResult.isSafe
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Safety Status: <strong>{junctionResult.statusText}</strong> (Margin: {junctionResult.tempMarginC.toFixed(1)} °C)
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Junction Temperature (Tj)" value={junctionResult.junctionTempC.toFixed(1)} unit="°C" highlight />
              <ResultCard label="Case Temperature (Tc)" value={junctionResult.caseTempC.toFixed(1)} unit="°C" />
              <ResultCard label="Heatsink Temp (Ts)" value={junctionResult.sinkTempC.toFixed(1)} unit="°C" />
              <ResultCard label="Total Rθja" value={junctionResult.totalRthJaKW.toFixed(3)} unit="°C/W" />
              <ResultCard label="Max Allowable Power" value={maxPowerResult.maxPowerWatts.toFixed(1)} unit="Watts" />
              <ResultCard label="Max Allowed Ambient Ta" value={maxAmbResult.maxAmbientC.toFixed(1)} unit="°C" />
            </div>

            <CalculationStepViewer
              steps={[
                {
                  title: 'Total Thermal Resistance Stackup',
                  formula: 'R_{\\theta ja} = R_{\\theta jc} + R_{\\theta cs} + R_{\\theta sa}',
                  substitution: `R_{\\theta ja} = ${rthJcInput} + ${rthCsInput} + ${rthSaInput} = ${junctionResult.totalRthJaKW.toFixed(3)} \\text{ °C/W}`,
                },
                {
                  title: 'Steady-State Junction Temperature Calculation',
                  formula: 'T_j = T_a + P_d \\cdot R_{\\theta ja}',
                  substitution: `T_j = ${ambientTempC} + ${powerWatts} \\times ${junctionResult.totalRthJaKW.toFixed(3)} = ${junctionResult.junctionTempC.toFixed(1)} \\text{ °C}`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Resistance Extraction */}
      {activeTab === 'resistances' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Thermal Resistance Extraction from Bench Tests</h3>
            <p className="text-xs text-slate-400">
              Measure thermocouple operating points at rated power to isolate individual package, interface, and heatsink thermal impedances.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Measured Tj (°C)</label>
                <input
                  type="number"
                  value={testTj}
                  onChange={(e) => setTestTj(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Measured Case Tc (°C)</label>
                <input
                  type="number"
                  value={testTc}
                  onChange={(e) => setTestTc(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Measured Sink Ts (°C)</label>
                <input
                  type="number"
                  value={testTs}
                  onChange={(e) => setTestTs(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Measured Ambient Ta (°C)</label>
                <input
                  type="number"
                  value={testTa}
                  onChange={(e) => setTestTa(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Dissipated Test Power (Watts)</label>
                <input
                  type="number"
                  value={testPowerW}
                  onChange={(e) => setTestPowerW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Extracted Rθjc" value={extractedRjc.rthJcKW.toFixed(4)} unit="°C/W" highlight />
              <ResultCard label="Extracted Rθcs" value={extractedRcs.rthCsKW.toFixed(4)} unit="°C/W" />
              <ResultCard label="Extracted Rθsa" value={extractedRsa.rthSaKW.toFixed(4)} unit="°C/W" />
              <ResultCard label="Extracted Rθja" value={extractedRja.rthJaKW.toFixed(4)} unit="°C/W" />
            </div>
            <CalculationStepViewer
              steps={[
                {
                  title: 'Junction-to-Case Resistance',
                  formula: 'R_{\\theta jc} = (T_j - T_c) / P_d',
                  substitution: `(${testTj} - ${testTc}) / ${testPowerW} = ${extractedRjc.rthJcKW.toFixed(4)} °C/W`,
                },
                {
                  title: 'Case-to-Sink Resistance',
                  formula: 'R_{\\theta cs} = (T_c - T_s) / P_d',
                  substitution: `(${testTc} - ${testTs}) / ${testPowerW} = ${extractedRcs.rthCsKW.toFixed(4)} °C/W`,
                },
                {
                  title: 'Sink-to-Ambient Resistance',
                  formula: 'R_{\\theta sa} = (T_s - T_a) / P_d',
                  substitution: `(${testTs} - ${testTa}) / ${testPowerW} = ${extractedRsa.rthSaKW.toFixed(4)} °C/W`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Temperature Derating */}
      {activeTab === 'derating' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Datasheet Power Derating Curve</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rated Power (W)</label>
                <input
                  type="number"
                  value={ratedPowerW}
                  onChange={(e) => setRatedPowerW(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Knee Temp (°C)</label>
                <input
                  type="number"
                  value={kneeTempC}
                  onChange={(e) => setKneeTempC(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Tj (°C)</label>
                <input
                  type="number"
                  value={maxJunctionForDerate}
                  onChange={(e) => setMaxJunctionForDerate(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Operating Temp (°C)</label>
                <input
                  type="number"
                  value={operatingTempC}
                  onChange={(e) => setOperatingTempC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Operating Power (W)</label>
                <input
                  type="number"
                  value={operatingPowerW}
                  onChange={(e) => setOperatingPowerW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                deratingResult.isOperatingWithinDerating
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span>
                {deratingResult.isOperatingWithinDerating
                  ? 'SAFE: Operating power is within derated limit.'
                  : 'OVERSTRESS: Operating power exceeds derated limit at this temperature!'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Derated Limit at Op Temp" value={deratingResult.operatingPointDeratedLimitWatts.toFixed(2)} unit="Watts" highlight />
              <ResultCard label="Derating Slope" value={deratingResult.slopeDeratingWperC.toFixed(3)} unit="W/°C" />
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <p className="text-xs font-medium text-slate-300">Derating Curve Table:</p>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                {deratingResult.points.map((pt, i) => (
                  <div key={i} className="flex justify-between text-slate-400 border-b border-slate-800/50 pb-0.5">
                    <span>{pt.temperatureC} °C</span>
                    <span className="text-slate-200 font-bold">{pt.deratedPowerWatts.toFixed(1)} W ({pt.deratingFactorPercent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Multi-Device Shared Heatsink */}
      {activeTab === 'multidevice' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Shared Heatsink Parameters</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Heatsink Rθsa (°C/W)</label>
                <input
                  type="number"
                  step="0.05"
                  value={sharedRthSa}
                  onChange={(e) => setSharedRthSa(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ambient Ta (°C)</label>
                <input
                  type="number"
                  value={sharedAmbC}
                  onChange={(e) => setSharedAmbC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <h4 className="text-xs font-semibold text-slate-300 pt-2 border-t border-slate-800">Device Dissipations & Resistances</h4>
            <div className="space-y-3">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-3 gap-2">
                <span className="col-span-3 text-xs text-cyan-400 font-bold">Device 1 (Q1)</span>
                <div>
                  <label className="text-[10px] text-slate-500">Power (W)</label>
                  <input
                    type="number"
                    value={dev1Power}
                    onChange={(e) => setDev1Power(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Rθjc (°C/W)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dev1Rjc}
                    onChange={(e) => setDev1Rjc(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Rθcs (°C/W)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={dev1Rcs}
                    onChange={(e) => setDev1Rcs(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-3 gap-2">
                <span className="col-span-3 text-xs text-cyan-400 font-bold">Device 2 (Q2)</span>
                <div>
                  <label className="text-[10px] text-slate-500">Power (W)</label>
                  <input
                    type="number"
                    value={dev2Power}
                    onChange={(e) => setDev2Power(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Rθjc (°C/W)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dev2Rjc}
                    onChange={(e) => setDev2Rjc(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Rθcs (°C/W)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={dev2Rcs}
                    onChange={(e) => setDev2Rcs(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-3 gap-2">
                <span className="col-span-3 text-xs text-cyan-400 font-bold">Device 3 (D1)</span>
                <div>
                  <label className="text-[10px] text-slate-500">Power (W)</label>
                  <input
                    type="number"
                    value={dev3Power}
                    onChange={(e) => setDev3Power(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Rθjc (°C/W)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dev3Rjc}
                    onChange={(e) => setDev3Rjc(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Rθcs (°C/W)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={dev3Rcs}
                    onChange={(e) => setDev3Rcs(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Total Dissipated Power" value={multiResult.totalPowerWatts.toFixed(1)} unit="Watts" highlight />
              <ResultCard label="Common Heatsink Temp (Ts)" value={multiResult.heatsinkTempC.toFixed(1)} unit="°C" />
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-slate-200">Device Junction Temperatures & Margins:</p>
              {multiResult.devices.map((d) => (
                <div key={d.id} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-200">{d.name}</span>
                    <span className={d.isSafe ? 'text-emerald-400' : 'text-rose-400'}>
                      Tj = {d.junctionTempC} °C (Margin: {d.marginC} °C)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px] font-mono">
                    <span>Power: {d.powerWatts} W</span>
                    <span>Case Tc: {d.caseTempC} °C</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
