import React, { useState, useMemo } from 'react';
import {
  calculatePeukertRuntime,
  calculatePeukertExponent,
  calculateInternalResistanceAging,
  calculateCapacityDegradation,
  estimateCycleLife,
  estimateCalendarLife,
  calculateTemperatureDerating,
  calculateBatteryThermalPower,
  sizeEnergyStorage,
  calculateDesignMargins,
} from '../../engines/batteries/battery-aging';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { History, Thermometer, ShieldAlert, Database, Award } from 'lucide-react';

export function BatteryAgingTool() {
  const [activeTab, setActiveTab] = useState<'peukert' | 'aging_life' | 'temperature' | 'storage_sizing'>('peukert');

  // Tab 1: Peukert
  const [peukertCapAh, setPeukertCapAh] = useState<number>(100);
  const [peukertExp, setPeukertExp] = useState<number>(1.25);
  const [peukertHours, setPeukertHours] = useState<number>(20.0);
  const [peukertDischargeA, setPeukertDischargeA] = useState<number>(25.0);
  const [test1I, setTest1I] = useState<number>(5.0);
  const [test1T, setTest1T] = useState<number>(20.0);
  const [test2I, setTest2I] = useState<number>(25.0);
  const [test2T, setTest2T] = useState<number>(2.5);

  // Tab 2: Aging & Life Curves
  const [agingCycles, setAgingCycles] = useState<number>(1200);
  const [agingDays, setAgingDays] = useState<number>(730); // 2 years
  const [agingInitCapAh, setAgingInitCapAh] = useState<number>(100);
  const [agingInitRMOhm, setAgingInitRMOhm] = useState<number>(20);
  const [cycleDoDPct, setCycleDoDPct] = useState<number>(80);
  const [ratedCyclesAt80DoD, setRatedCyclesAt80DoD] = useState<number>(2000);
  const [storageTempC, setStorageTempC] = useState<number>(35);
  const [storageSocPct, setStorageSocPct] = useState<number>(90);

  // Tab 3: Temperature Derating & Thermal Power
  const [cellTempC, setCellTempC] = useState<number>(-10);
  const [tempChemistry, setTempChemistry] = useState<'li-ion' | 'lifepo4' | 'lead-acid'>('li-ion');
  const [thermalCurrentA, setThermalCurrentA] = useState<number>(30.0);
  const [thermalRintMOhm, setThermalRintMOhm] = useState<number>(25.0);

  // Tab 4: Energy Storage Sizing & Design Margins
  const [dailyKwh, setDailyKwh] = useState<number>(12.0); // 12 kWh daily load
  const [autonomyDays, setAutonomyDays] = useState<number>(2.0);
  const [sizingDoDPct, setSizingDoDPct] = useState<number>(80);
  const [inverterEffPct, setInverterEffPct] = useState<number>(92);
  const [systemVoltageV, setSystemVoltageV] = useState<number>(48.0);
  const [marginContRatedA, setMarginContRatedA] = useState<number>(100);
  const [marginContOpA, setMarginContOpA] = useState<number>(65);
  const [marginPeakRatedA, setMarginPeakRatedA] = useState<number>(200);
  const [marginPeakOpA, setMarginPeakOpA] = useState<number>(120);
  const [marginMaxV, setMarginMaxV] = useState<number>(58.4);
  const [marginOpV, setMarginOpV] = useState<number>(57.6);
  const [marginMaxT, setMarginMaxT] = useState<number>(60);
  const [marginOpT, setMarginOpT] = useState<number>(42);

  // Computations
  const peukertResult = useMemo(() => {
    try {
      return calculatePeukertRuntime({
        ratedCapacityAh: peukertCapAh,
        peukertExponent: peukertExp,
        ratedDischargeHours: peukertHours,
        dischargeCurrentAmps: peukertDischargeA,
      });
    } catch {
      return null;
    }
  }, [peukertCapAh, peukertExp, peukertHours, peukertDischargeA]);

  const peukertExpCalcResult = useMemo(() => {
    try {
      return calculatePeukertExponent(test1I, test1T, test2I, test2T);
    } catch {
      return null;
    }
  }, [test1I, test1T, test2I, test2T]);

  const degResult = useMemo(() => {
    try {
      return calculateCapacityDegradation(agingInitCapAh, agingCycles, agingDays);
    } catch {
      return null;
    }
  }, [agingInitCapAh, agingCycles, agingDays]);

  const rAgingResult = useMemo(() => {
    try {
      return calculateInternalResistanceAging(agingInitRMOhm / 1000, agingCycles, agingDays);
    } catch {
      return null;
    }
  }, [agingInitRMOhm, agingCycles, agingDays]);

  const cycleLifeResult = useMemo(() => {
    try {
      return estimateCycleLife(ratedCyclesAt80DoD, cycleDoDPct);
    } catch {
      return null;
    }
  }, [ratedCyclesAt80DoD, cycleDoDPct]);

  const calendarLifeResult = useMemo(() => {
    try {
      return estimateCalendarLife(storageTempC, storageSocPct);
    } catch {
      return null;
    }
  }, [storageTempC, storageSocPct]);

  const tempDeratingResult = useMemo(() => {
    try {
      return calculateTemperatureDerating(cellTempC, tempChemistry);
    } catch {
      return null;
    }
  }, [cellTempC, tempChemistry]);

  const thermalPowerResult = useMemo(() => {
    try {
      return calculateBatteryThermalPower({
        currentAmps: thermalCurrentA,
        internalResistanceOhms: thermalRintMOhm / 1000,
        cellTemperatureCelsius: cellTempC,
      });
    } catch {
      return null;
    }
  }, [thermalCurrentA, thermalRintMOhm, cellTempC]);

  const sizingResult = useMemo(() => {
    try {
      return sizeEnergyStorage({
        dailyEnergyConsumptionWh: dailyKwh * 1000,
        desiredAutonomyDays: autonomyDays,
        maxAllowedDepthOfDischargePercent: sizingDoDPct,
        systemInverterEfficiencyPercent: inverterEffPct,
        systemNominalVoltage: systemVoltageV,
      });
    } catch {
      return null;
    }
  }, [dailyKwh, autonomyDays, sizingDoDPct, inverterEffPct, systemVoltageV]);

  const marginResult = useMemo(() => {
    try {
      return calculateDesignMargins({
        ratedContinuousCurrentAmps: marginContRatedA,
        operatingContinuousCurrentAmps: marginContOpA,
        ratedPeakCurrentAmps: marginPeakRatedA,
        operatingPeakCurrentAmps: marginPeakOpA,
        maxChargeVoltage: marginMaxV,
        operatingChargeVoltage: marginOpV,
        maxOperatingTempCelsius: marginMaxT,
        operatingTempCelsius: marginOpT,
      });
    } catch {
      return null;
    }
  }, [marginContRatedA, marginContOpA, marginPeakRatedA, marginPeakOpA, marginMaxV, marginOpV, marginMaxT, marginOpT]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Battery Performance, Aging & Energy Storage Sizing</h1>
            <p className="text-xs text-slate-400">
              Tools 51–60: Peukert Law, SEI Degradation, Cycle/Calendar Life, Temperature Derating, ESS Sizing & Safety Margins
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('peukert')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'peukert' ? 'bg-purple-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" /> 51–52. Peukert Law
          </button>
          <button
            onClick={() => setActiveTab('aging_life')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'aging_life' ? 'bg-purple-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> 53–56. Aging & Life Expectancy
          </button>
          <button
            onClick={() => setActiveTab('temperature')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'temperature' ? 'bg-purple-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" /> 57–58. Temperature & Thermal
          </button>
          <button
            onClick={() => setActiveTab('storage_sizing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'storage_sizing' ? 'bg-purple-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> 59–60. Storage Sizing & Margins
          </button>
        </div>
      </div>

      {/* Tab 1: Peukert */}
      {activeTab === 'peukert' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">51. Peukert Runtime Calculator</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rated Capacity (Ah)</label>
                <input
                  type="number"
                  value={peukertCapAh}
                  onChange={(e) => setPeukertCapAh(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Peukert Exponent (k)</label>
                <input
                  type="number"
                  step="0.02"
                  value={peukertExp}
                  onChange={(e) => setPeukertExp(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rated Duration H (Hours)</label>
                <input
                  type="number"
                  value={peukertHours}
                  onChange={(e) => setPeukertHours(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Discharge Current (A)</label>
                <input
                  type="number"
                  step="1"
                  value={peukertDischargeA}
                  onChange={(e) => setPeukertDischargeA(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <ResultCard
              label="Peukert Derated Runtime"
              value={`${peukertResult?.runtimeHours ?? 0} hrs (${peukertResult?.runtimeMinutes ?? 0} mins)`}
              subtext={`Effective Capacity: ${peukertResult?.effectiveCapacityAh ?? 0} Ah (Lost: ${peukertResult?.capacityLossDueToRatePercent ?? 0}%)`}
              highlight
            />
            <div className="text-xs text-slate-400 italic">{peukertResult?.applicabilityNote}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">52. Derive Peukert Exponent From Test Data</h2>
            <div className="p-3 bg-slate-800/60 rounded-lg space-y-2 border border-slate-700/50">
              <span className="text-xs font-semibold text-slate-300">Discharge Test 1 (Low C-Rate)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block">Current I1 (A)</label>
                  <input
                    type="number"
                    value={test1I}
                    onChange={(e) => setTest1I(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Time t1 (Hours)</label>
                  <input
                    type="number"
                    value={test1T}
                    onChange={(e) => setTest1T(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg space-y-2 border border-slate-700/50">
              <span className="text-xs font-semibold text-purple-300">Discharge Test 2 (High C-Rate)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block">Current I2 (A)</label>
                  <input
                    type="number"
                    value={test2I}
                    onChange={(e) => setTest2I(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Time t2 (Hours)</label>
                  <input
                    type="number"
                    value={test2T}
                    onChange={(e) => setTest2T(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <ResultCard
              label="Derived Peukert Exponent (k)"
              value={`k = ${peukertExpCalcResult?.peukertExponent ?? 0}`}
              subtext="Calculated from k = ln(t2/t1) / ln(I1/I2)"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Aging & Life */}
      {activeTab === 'aging_life' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">53–54. Degradation Over Time & Cycles</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cycle Count (N)</label>
                <input
                  type="number"
                  value={agingCycles}
                  onChange={(e) => setAgingCycles(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Calendar Days (t)</label>
                <input
                  type="number"
                  value={agingDays}
                  onChange={(e) => setAgingDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ResultCard
                label="Remaining Usable Capacity"
                value={`${degResult?.remainingCapacityAh ?? 0} Ah`}
                subtext={`Retention: ${degResult?.capacityRetentionPercent ?? 0}%`}
                highlight
              />
              <ResultCard
                label="Aged Resistance R_int"
                value={`${((rAgingResult?.agedResistanceOhms ?? 0) * 1000).toFixed(1)} mΩ`}
                subtext={`+${rAgingResult?.resistanceIncreasePercent ?? 0}% increase`}
              />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">55–56. Cycle Life vs Depth of Discharge</h2>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Operating DoD</span>
                <span className="font-mono text-purple-400">{cycleDoDPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={cycleDoDPct}
                onChange={(e) => setCycleDoDPct(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500"
              />
            </div>

            <ResultCard
              label="Estimated Cycles to 80% EOL"
              value={`${cycleLifeResult?.estimatedCyclesToEol.toLocaleString() ?? 0} Cycles`}
              subtext={`${cycleLifeResult?.cycleMultiplierVs80DoD ?? 0}× multiplier compared to standard 80% DoD`}
              highlight
            />

            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Storage Temp (°C)</label>
                <input
                  type="number"
                  value={storageTempC}
                  onChange={(e) => setStorageTempC(parseFloat(e.target.value) || 25)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Storage SOC (%)</label>
                <input
                  type="number"
                  value={storageSocPct}
                  onChange={(e) => setStorageSocPct(parseFloat(e.target.value) || 50)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
            <div className="text-xs text-slate-400">
              Estimated Calendar Shelf Life: <strong className="text-amber-400">{calendarLifeResult?.estimatedShelfLifeYears ?? 0} years</strong> (Acceleration factor: {calendarLifeResult?.temperatureAccelerationFactor ?? 0}×)
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Temperature & Thermal */}
      {activeTab === 'temperature' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">57. Temperature Capacity & Charge Lockout</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Cell Temp (°C)</label>
                <input
                  type="number"
                  value={cellTempC}
                  onChange={(e) => setCellTempC(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Chemistry</label>
                <select
                  value={tempChemistry}
                  onChange={(e) => setTempChemistry(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                >
                  <option value="li-ion">Lithium-Ion</option>
                  <option value="lifepo4">LiFePO4</option>
                  <option value="lead-acid">Lead-Acid</option>
                </select>
              </div>
            </div>

            <ResultCard
              label="Available Usable Capacity"
              value={`${tempDeratingResult?.usableCapacityPercent ?? 0}%`}
              subtext={`Max recommended discharge: ${tempDeratingResult?.maxRecommendedDischargeCRate ?? 0}C | Charge Allowed: ${tempDeratingResult?.isChargeAllowed ? 'YES' : 'LOCKED'}`}
              highlight={tempDeratingResult?.isChargeAllowed}
            />
            <div className="p-3 bg-slate-800/60 rounded-lg text-xs text-amber-300 border border-amber-800/40">
              {tempDeratingResult?.warningNote}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">58. Battery Thermal Power Dissipation</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Current (A)</label>
                <input
                  type="number"
                  value={thermalCurrentA}
                  onChange={(e) => setThermalCurrentA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">R_int (mΩ)</label>
                <input
                  type="number"
                  value={thermalRintMOhm}
                  onChange={(e) => setThermalRintMOhm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <ResultCard
              label="Total Thermal Heat Rate"
              value={`${thermalPowerResult?.totalThermalPowerWatts ?? 0} W`}
              subtext={`Joule I²R: ${thermalPowerResult?.jouleHeatingWatts ?? 0} W | Reversible Entropic: ${thermalPowerResult?.entropicHeatingWatts ?? 0} W`}
              highlight
            />
          </div>
        </div>
      )}

      {/* Tab 4: ESS Sizing & Margins */}
      {activeTab === 'storage_sizing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">59. Energy Storage System (ESS) Sizing</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Daily Energy (kWh)</label>
                <input
                  type="number"
                  step="1"
                  value={dailyKwh}
                  onChange={(e) => setDailyKwh(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Autonomy Days</label>
                <input
                  type="number"
                  step="0.5"
                  value={autonomyDays}
                  onChange={(e) => setAutonomyDays(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">DoD (%)</label>
                <input
                  type="number"
                  value={sizingDoDPct}
                  onChange={(e) => setSizingDoDPct(parseFloat(e.target.value) || 80)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Inverter Eff (%)</label>
                <input
                  type="number"
                  value={inverterEffPct}
                  onChange={(e) => setInverterEffPct(parseFloat(e.target.value) || 90)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Sys Voltage (V)</label>
                <input
                  type="number"
                  value={systemVoltageV}
                  onChange={(e) => setSystemVoltageV(parseFloat(e.target.value) || 48)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <ResultCard
              label="Recommended Nameplate Battery Bank"
              value={`${sizingResult?.nominalNameplateEnergyRequiredKwh ?? 0} kWh`}
              subtext={`Capacity: ${sizingResult?.requiredBatteryCapacityAh ?? 0} Ah at ${systemVoltageV} V nominal`}
              highlight
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">60. Battery Safety & Engineering Margin</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400 block">Continuous Current</span>
                <span className="font-mono text-slate-100">{marginResult?.continuousCurrentMarginPercent}% margin</span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400 block">Peak Current</span>
                <span className="font-mono text-slate-100">{marginResult?.peakCurrentMarginPercent}% margin</span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400 block">Voltage Headroom</span>
                <span className="font-mono text-slate-100">{marginResult?.voltageHeadroomVolts} V</span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-lg">
                <span className="text-slate-400 block">Temperature Headroom</span>
                <span className="font-mono text-slate-100">{marginResult?.temperatureHeadroomCelsius} °C</span>
              </div>
            </div>

            <ResultCard
              label="Overall Engineering Design Tier"
              value={marginResult?.overallStatus ?? 'N/A'}
              subtext="Design validation for safe operating area margins"
              highlight={marginResult?.overallStatus === 'EXCELLENT_MARGIN' || marginResult?.overallStatus === 'ACCEPTABLE_DESIGN'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
