import React, { useState, useMemo } from 'react';
import {
  calculateBatteryCapacity,
  calculateBatteryEnergy,
  convertWhAndAh,
  calculateFundamentalRuntime,
  calculateBatteryCurrent,
  calculateBatteryPower,
  calculateBatteryVoltage,
  calculateCRate,
  calculateChargeDischargeTime,
  calculateBatteryEnergyEfficiency,
} from '../../engines/batteries/battery-fundamentals';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Battery, Zap, Clock, ArrowRightLeft, Gauge, Percent } from 'lucide-react';

export function BatteryFundamentalsTool() {
  const [activeTab, setActiveTab] = useState<'capacity_energy' | 'runtime' | 'power_voltage' | 'crate' | 'efficiency'>('capacity_energy');

  // Tab 1: Capacity & Energy & Wh/Ah Conversion
  const [currentA, setCurrentA] = useState<number>(2.5);
  const [timeH, setTimeH] = useState<number>(4.0);
  const [vNom, setVNom] = useState<number>(3.7);
  const [convVal, setConvVal] = useState<number>(50);
  const [convUnit, setConvUnit] = useState<'Wh' | 'Ah' | 'kWh' | 'mAh'>('Wh');

  // Tab 2: Runtime & Usable Capacity
  const [runCapAh, setRunCapAh] = useState<number>(3.0);
  const [runLoadVal, setRunLoadVal] = useState<number>(1.5);
  const [runLoadType, setRunLoadType] = useState<'current' | 'power'>('current');
  const [runDodPct, setRunDodPct] = useState<number>(80);
  const [runVNom, setRunVNom] = useState<number>(3.7);

  // Tab 3: Current, Power & Voltage
  const [calcPVolts, setCalcPVolts] = useState<number>(12.8);
  const [calcPCurrent, setCalcPCurrent] = useState<number>(10);
  const [vFromPVal, setVFromPVal] = useState<number>(120);
  const [vFromIVal, setVFromIVal] = useState<number>(10);

  // Tab 4: C-Rate & Charge/Discharge Duration
  const [cRateCapAh, setCRateCapAh] = useState<number>(2.5);
  const [cRateVal, setCRateVal] = useState<number>(2.0);
  const [cRateMode, setCRateMode] = useState<'current_to_crate' | 'crate_to_current'>('current_to_crate');
  const [durationCRate, setDurationCRate] = useState<number>(1.0);
  const [durationMode, setDurationMode] = useState<'charge' | 'discharge'>('discharge');
  const [durationEta, setDurationEta] = useState<number>(98);

  // Tab 5: Energy Efficiency
  const [effEOut, setEffEOut] = useState<number>(90);
  const [effEIn, setEffEIn] = useState<number>(100);

  // Memoized Results
  const capResult = useMemo(() => {
    try {
      return calculateBatteryCapacity({ currentAmps: currentA, timeHours: timeH });
    } catch {
      return null;
    }
  }, [currentA, timeH]);

  const energyResult = useMemo(() => {
    try {
      const ah = capResult?.capacityAh ?? currentA * timeH;
      return calculateBatteryEnergy({ nominalVoltage: vNom, capacityAh: ah });
    } catch {
      return null;
    }
  }, [capResult, vNom, currentA, timeH]);

  const convResult = useMemo(() => {
    try {
      return convertWhAndAh({ value: convVal, fromUnit: convUnit, nominalVoltage: vNom });
    } catch {
      return null;
    }
  }, [convVal, convUnit, vNom]);

  const runtimeResult = useMemo(() => {
    try {
      return calculateFundamentalRuntime({
        capacityAh: runCapAh,
        loadValue: runLoadVal,
        loadType: runLoadType,
        nominalVoltage: runVNom,
        dischargeDepthFraction: runDodPct / 100,
      });
    } catch {
      return null;
    }
  }, [runCapAh, runLoadVal, runLoadType, runVNom, runDodPct]);

  const powerResult = useMemo(() => {
    try {
      return calculateBatteryPower(calcPVolts, calcPCurrent);
    } catch {
      return null;
    }
  }, [calcPVolts, calcPCurrent]);

  const voltResult = useMemo(() => {
    try {
      return calculateBatteryVoltage('power_current', vFromPVal, vFromIVal);
    } catch {
      return null;
    }
  }, [vFromPVal, vFromIVal]);

  const cRateResult = useMemo(() => {
    try {
      return calculateCRate(cRateMode, cRateCapAh, cRateVal);
    } catch {
      return null;
    }
  }, [cRateMode, cRateCapAh, cRateVal]);

  const durationResult = useMemo(() => {
    try {
      return calculateChargeDischargeTime({
        capacityAh: cRateCapAh,
        cRate: durationCRate,
        mode: durationMode,
        coulombicEfficiencyPercent: durationEta,
      });
    } catch {
      return null;
    }
  }, [cRateCapAh, durationCRate, durationMode, durationEta]);

  const efficiencyResult = useMemo(() => {
    try {
      return calculateBatteryEnergyEfficiency(effEOut, effEIn);
    } catch {
      return null;
    }
  }, [effEOut, effEIn]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Battery className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Battery Fundamentals & Units</h1>
            <p className="text-xs text-slate-400">
              Tools 1–10: Capacity (Ah/mAh/Coulombs), Energy (Wh/kWh), Runtime, C-Rates & Round-Trip Efficiency
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('capacity_energy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'capacity_energy' ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> 1–3. Capacity & Energy
          </button>
          <button
            onClick={() => setActiveTab('runtime')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'runtime' ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> 4–5. Runtime & Current
          </button>
          <button
            onClick={() => setActiveTab('power_voltage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'power_voltage' ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> 6–7. Power & Voltage
          </button>
          <button
            onClick={() => setActiveTab('crate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'crate' ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" /> 8–9. C-Rate & Time
          </button>
          <button
            onClick={() => setActiveTab('efficiency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'efficiency' ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Percent className="w-3.5 h-3.5" /> 10. Energy Efficiency
          </button>
        </div>
      </div>

      {/* Tab 1: Capacity & Energy */}
      {activeTab === 'capacity_energy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Capacity & Energy Inputs</h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Discharge / Charge Current (A)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={currentA}
                onChange={(e) => setCurrentA(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Duration (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={timeH}
                onChange={(e) => setTimeH(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Cell / Pack Nominal Voltage (V)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={vNom}
                onChange={(e) => setVNom(parseFloat(e.target.value) || 3.7)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-amber-400 mb-2">Wh ↔ Ah Converter</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Value</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={convVal}
                    onChange={(e) => setConvVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">From Unit</label>
                  <select
                    value={convUnit}
                    onChange={(e) => setConvUnit(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="Wh">Wh</option>
                    <option value="kWh">kWh</option>
                    <option value="Ah">Ah</option>
                    <option value="mAh">mAh</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Accumulated Capacity"
                value={`${capResult?.capacityAh ?? 0} Ah`}
                subtext={`${capResult?.capacityMah ?? 0} mAh (${(capResult?.chargeCoulombs ?? 0).toLocaleString()} Coulombs)`}
                highlight
              />
              <ResultCard
                label="Gross Stored Energy"
                value={`${energyResult?.energyWh ?? 0} Wh`}
                subtext={`${energyResult?.energyKwh ?? 0} kWh (${(energyResult?.energyJoules ?? 0).toLocaleString()} Joules)`}
              />
            </div>

            {convResult && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-slate-300 mb-2">Unit Conversion at {vNom} V:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-800/60 rounded-lg p-2.5">
                    <div className="text-xs text-slate-400">Watt-Hours</div>
                    <div className="text-base font-bold font-mono text-slate-100">{convResult.wattHours} Wh</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-2.5">
                    <div className="text-xs text-slate-400">Kilowatt-Hours</div>
                    <div className="text-base font-bold font-mono text-slate-100">{convResult.kiloWattHours} kWh</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-2.5">
                    <div className="text-xs text-slate-400">Amp-Hours</div>
                    <div className="text-base font-bold font-mono text-amber-400">{convResult.ampHours} Ah</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-2.5">
                    <div className="text-xs text-slate-400">Milliamp-Hours</div>
                    <div className="text-base font-bold font-mono text-amber-400">{convResult.milliAmpHours} mAh</div>
                  </div>
                </div>
              </div>
            )}

            <CalculationStepViewer
              steps={[
                {
                  title: 'Capacity Formula',
                  formula: 'Q = I · t',
                  substitution: `${currentA} A × ${timeH} h`,
                  result: `${capResult?.capacityAh ?? 0} Ah (${capResult?.capacityMah ?? 0} mAh)`,
                },
                {
                  title: 'Energy Formula',
                  formula: 'E = V_{nominal} · Q',
                  substitution: `${vNom} V × ${capResult?.capacityAh ?? 0} Ah`,
                  result: `${energyResult?.energyWh ?? 0} Wh (${energyResult?.energyKwh ?? 0} kWh)`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Runtime & Usable Capacity */}
      {activeTab === 'runtime' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Runtime Inputs</h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Nominal Capacity (Ah)</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={runCapAh}
                onChange={(e) => setRunCapAh(parseFloat(e.target.value) || 0.1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Load Type</label>
                <select
                  value={runLoadType}
                  onChange={(e) => setRunLoadType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  <option value="current">Current (A)</option>
                  <option value="power">Power (W)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Load Value</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={runLoadVal}
                  onChange={(e) => setRunLoadVal(parseFloat(e.target.value) || 0.01)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Depth of Discharge (DoD)</span>
                <span className="font-mono text-amber-400">{runDodPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={runDodPct}
                onChange={(e) => setRunDodPct(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Nominal Voltage (V)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={runVNom}
                onChange={(e) => setRunVNom(parseFloat(e.target.value) || 3.7)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ResultCard
                label="Estimated Runtime"
                value={`${runtimeResult?.runtimeHours ?? 0} hrs`}
                subtext={`${runtimeResult?.runtimeMinutes ?? 0} mins (${runtimeResult?.runtimeDays ?? 0} days)`}
                highlight
              />
              <ResultCard
                label="Usable Capacity"
                value={`${runtimeResult?.usableCapacityAh ?? 0} Ah`}
                subtext={`At ${runDodPct}% Depth of Discharge`}
              />
              <ResultCard
                label="Equivalent Load"
                value={`${runtimeResult?.loadCurrentAmps ?? 0} A`}
                subtext={`${runtimeResult?.loadPowerWatts ?? 0} W @ ${runVNom}V`}
              />
            </div>

            <CalculationStepViewer
              steps={[
                {
                  title: 'Usable Capacity',
                  formula: 'C_{usable} = C_{nom} · DoD',
                  substitution: `${runCapAh} Ah × ${(runDodPct / 100).toFixed(2)}`,
                  result: `${runtimeResult?.usableCapacityAh ?? 0} Ah`,
                },
                {
                  title: 'Runtime Calculation',
                  formula: 't = C_{usable} / I_{load}',
                  substitution: `${runtimeResult?.usableCapacityAh ?? 0} Ah / ${runtimeResult?.loadCurrentAmps ?? 0} A`,
                  result: `${runtimeResult?.runtimeHours ?? 0} hours (${runtimeResult?.runtimeMinutes ?? 0} minutes)`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Power & Voltage */}
      {activeTab === 'power_voltage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">6. Battery Power (P = V · I)</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Voltage (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcPVolts}
                  onChange={(e) => setCalcPVolts(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Current (A)</label>
                <input
                  type="number"
                  step="0.5"
                  value={calcPCurrent}
                  onChange={(e) => setCalcPCurrent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>
            <ResultCard
              label="Delivered / Absorbed Power"
              value={`${powerResult?.powerWatts ?? 0} W`}
              subtext={`${powerResult?.powerKilowatts ?? 0} kW`}
              highlight
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">7. Battery Voltage (V = P / I)</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Power (W)</label>
                <input
                  type="number"
                  step="1"
                  value={vFromPVal}
                  onChange={(e) => setVFromPVal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Current (A)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.01"
                  value={vFromIVal}
                  onChange={(e) => setVFromIVal(parseFloat(e.target.value) || 0.01)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>
            <ResultCard
              label="Derived Voltage"
              value={`${voltResult?.voltageVolts ?? 0} V`}
              subtext="Calculated from V = P / I"
            />
          </div>
        </div>
      )}

      {/* Tab 4: C-Rate & Charge/Discharge Duration */}
      {activeTab === 'crate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">8. C-Rate Calculator</h2>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Rated Battery Capacity (Ah)</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={cRateCapAh}
                onChange={(e) => setCRateCapAh(parseFloat(e.target.value) || 0.1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Calculation Mode</label>
                <select
                  value={cRateMode}
                  onChange={(e) => setCRateMode(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  <option value="current_to_crate">Current (A) → C-Rate</option>
                  <option value="crate_to_current">C-Rate → Current (A)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {cRateMode === 'current_to_crate' ? 'Discharge Current (A)' : 'Target C-Rate (e.g. 0.5C)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={cRateVal}
                  onChange={(e) => setCRateVal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <ResultCard
              label={cRateMode === 'current_to_crate' ? 'Computed C-Rate' : 'Discharge Current'}
              value={cRateMode === 'current_to_crate' ? `${cRateResult?.cRate ?? 0} C` : `${cRateResult?.currentAmps ?? 0} A`}
              subtext={`For ${cRateCapAh} Ah pack: ${cRateResult?.currentMilliamps ?? 0} mA equivalent`}
              highlight
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">9. Ideal Charge / Discharge Duration</h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">C-Rate</label>
                <input
                  type="number"
                  step="0.2"
                  min="0.05"
                  value={durationCRate}
                  onChange={(e) => setDurationCRate(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Mode</label>
                <select
                  value={durationMode}
                  onChange={(e) => setDurationMode(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  <option value="discharge">Discharge</option>
                  <option value="charge">Charge</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Coulombic Eff (%)</label>
                <input
                  type="number"
                  step="1"
                  min="50"
                  max="100"
                  value={durationEta}
                  onChange={(e) => setDurationEta(parseFloat(e.target.value) || 98)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <ResultCard
              label="Full Cycle Duration"
              value={`${durationResult?.timeHours ?? 0} hrs (${durationResult?.timeMinutes ?? 0} mins)`}
              subtext={`Current: ${durationResult?.currentAmps ?? 0} A (${durationResult?.timeSeconds ?? 0}s)`}
              highlight
            />
          </div>
        </div>
      )}

      {/* Tab 5: Energy Efficiency */}
      {activeTab === 'efficiency' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">10. Round-Trip Energy Efficiency Inputs</h2>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Energy Charged Into Battery (Wh or kWh)</label>
              <input
                type="number"
                step="1"
                min="0.1"
                value={effEIn}
                onChange={(e) => setEffEIn(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Energy Discharged Out of Battery (Wh or kWh)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={effEOut}
                onChange={(e) => setEffEOut(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              label="Round-Trip Watt-Hour Efficiency"
              value={`${efficiencyResult?.efficiencyPercent ?? 0}%`}
              subtext={`Loss: ${efficiencyResult?.energyLossWh ?? 0} Wh (${efficiencyResult?.lossPercentage ?? 0}% thermal dissipation)`}
              highlight
            />
            <CalculationStepViewer
              steps={[
                {
                  title: 'Efficiency Equation',
                  formula: 'η_{energy} = (E_{out} / E_{in}) · 100\\%',
                  substitution: `(${effEOut} Wh / ${effEIn} Wh) × 100%`,
                  result: `${efficiencyResult?.efficiencyPercent ?? 0}%`,
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
