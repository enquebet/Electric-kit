import React, { useState, useMemo } from 'react';
import {
  calculateSoc,
  calculateSocFromCapacity,
  estimateSocFromVoltage,
  calculateDoD,
  calculateSoh,
  calculateCapacityFade,
  calculateEquivalentFullCycles,
  stepCoulombCounting,
  estimateRemainingEnergy,
  calculateRemainingRuntime,
  REFERENCE_OCV_CURVES,
  BatteryChemistryType,
} from '../../engines/batteries/battery-soc';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Gauge, HeartPulse, History, Cpu, AlertCircle } from 'lucide-react';

export function BatterySocTool() {
  const [activeTab, setActiveTab] = useState<'soc_ocv' | 'soh_fade' | 'coulomb_counting'>('soc_ocv');

  // Tab 1: SOC & OCV Reference
  const [ocvChemistry, setOcvChemistry] = useState<BatteryChemistryType>('li-ion');
  const [ocvVoltage, setOcvVoltage] = useState<number>(3.82);
  const [remCapAh, setRemCapAh] = useState<number>(18.5);
  const [nomCapAh, setNomCapAh] = useState<number>(25.0);
  const [packVNom, setPackVNom] = useState<number>(48.0);
  const [runtimeLoadA, setRuntimeLoadA] = useState<number>(5.0);

  // Tab 2: SOH & Degradation
  const [sohCurrentCapAh, setSohCurrentCapAh] = useState<number>(42.0);
  const [sohOrigCapAh, setSohOrigCapAh] = useState<number>(50.0);
  const [sohCurrentRint, setSohCurrentRint] = useState<number>(0.045);
  const [sohNewRint, setSohNewRint] = useState<number>(0.025);
  const [cumThroughputAh, setCumThroughputAh] = useState<number>(45000);

  // Tab 3: Coulomb Counting
  const [ccInitSoc, setCcInitSoc] = useState<number>(85);
  const [ccPackCap, setCcPackCap] = useState<number>(20);
  const [ccCurrentA, setCcCurrentA] = useState<number>(10); // positive = discharge
  const [ccDurationS, setCcDurationS] = useState<number>(1800); // 30 mins
  const [ccEtaPct, setCcEtaPct] = useState<number>(99);

  // Computations
  const socCapResult = useMemo(() => {
    try {
      return calculateSoc({ remainingCapacityAh: remCapAh, nominalCapacityAh: nomCapAh });
    } catch {
      return null;
    }
  }, [remCapAh, nomCapAh]);

  const ocvResult = useMemo(() => {
    try {
      return estimateSocFromVoltage(ocvVoltage, ocvChemistry);
    } catch {
      return null;
    }
  }, [ocvVoltage, ocvChemistry]);

  const remEnergyResult = useMemo(() => {
    try {
      const soc = socCapResult?.socPercent ?? 50;
      return estimateRemainingEnergy(soc, nomCapAh, packVNom);
    } catch {
      return null;
    }
  }, [socCapResult, nomCapAh, packVNom]);

  const remRuntimeResult = useMemo(() => {
    try {
      return calculateRemainingRuntime(remCapAh, runtimeLoadA);
    } catch {
      return null;
    }
  }, [remCapAh, runtimeLoadA]);

  const sohResult = useMemo(() => {
    try {
      return calculateSoh({
        currentMaxUsableCapacityAh: sohCurrentCapAh,
        originalRatedCapacityAh: sohOrigCapAh,
        currentInternalResistanceOhms: sohCurrentRint,
        initialNewInternalResistanceOhms: sohNewRint,
      });
    } catch {
      return null;
    }
  }, [sohCurrentCapAh, sohOrigCapAh, sohCurrentRint, sohNewRint]);

  const fadeResult = useMemo(() => {
    try {
      return calculateCapacityFade(sohOrigCapAh, sohCurrentCapAh);
    } catch {
      return null;
    }
  }, [sohOrigCapAh, sohCurrentCapAh]);

  const efcResult = useMemo(() => {
    try {
      return calculateEquivalentFullCycles(cumThroughputAh, sohOrigCapAh);
    } catch {
      return null;
    }
  }, [cumThroughputAh, sohOrigCapAh]);

  const coulombStepResult = useMemo(() => {
    try {
      return stepCoulombCounting({
        initialSocPercent: ccInitSoc,
        nominalCapacityAh: ccPackCap,
        currentAmps: ccCurrentA,
        timeDurationSeconds: ccDurationS,
        coulombicEfficiencyFraction: ccEtaPct / 100,
      });
    } catch {
      return null;
    }
  }, [ccInitSoc, ccPackCap, ccCurrentA, ccDurationS, ccEtaPct]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">State Estimation: SOC, SOH & Tracking</h1>
            <p className="text-xs text-slate-400">
              Tools 31–40: State of Charge (SOC), Reference Voltage Curves, State of Health (SOH), Capacity Fade & Coulomb Counting
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('soc_ocv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'soc_ocv' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" /> 31–34. SOC & OCV Reference
          </button>
          <button
            onClick={() => setActiveTab('soh_fade')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'soh_fade' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" /> 35–37. SOH & Life Cycles
          </button>
          <button
            onClick={() => setActiveTab('coulomb_counting')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'coulomb_counting' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" /> 38–40. Coulomb Counting & Rem Runtime
          </button>
        </div>
      </div>

      {/* Tab 1: SOC & OCV Reference */}
      {activeTab === 'soc_ocv' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">31–34. SOC Estimation Inputs</h2>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Remaining (Ah)</label>
                <input
                  type="number"
                  step="0.5"
                  value={remCapAh}
                  onChange={(e) => setRemCapAh(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nominal (Ah)</label>
                <input
                  type="number"
                  step="0.5"
                  value={nomCapAh}
                  onChange={(e) => setNomCapAh(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-emerald-400">33. Open-Circuit Voltage Reference</h3>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Chemistry</label>
                <select
                  value={ocvChemistry}
                  onChange={(e) => setOcvChemistry(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                >
                  <option value="li-ion">Lithium-Ion / NMC (3.7V)</option>
                  <option value="lifepo4">Lithium Iron Phosphate / LiFePO4 (3.2V)</option>
                  <option value="lead-acid">Lead-Acid / AGM (2.0V/cell)</option>
                  <option value="nimh">NiMH (1.2V/cell)</option>
                  <option value="lto">Lithium Titanate / LTO (2.3V)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cell Open-Circuit Voltage Voc (V)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ocvVoltage}
                  onChange={(e) => setOcvVoltage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-400 block mb-1">Discharge Load for Runtime (A)</label>
              <input
                type="number"
                step="0.5"
                value={runtimeLoadA}
                onChange={(e) => setRuntimeLoadA(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ResultCard
                label="Capacity-Based SOC"
                value={`${socCapResult?.socPercent ?? 0}%`}
                subtext={`Depth of Discharge: ${socCapResult?.dodPercent ?? 0}% DoD`}
                highlight
              />
              <ResultCard
                label="Voltage Reference SOC"
                value={`${ocvResult?.estimatedSocPercent ?? 0}%`}
                subtext={`At ${ocvVoltage}V relaxed Voc (${ocvChemistry})`}
              />
              <ResultCard
                label="Remaining Energy & Runtime"
                value={`${remEnergyResult?.remainingEnergyWh ?? 0} Wh`}
                subtext={`t_rem: ${remRuntimeResult?.runtimeHours ?? 0}h (${remRuntimeResult?.runtimeMinutes ?? 0}m) @ ${runtimeLoadA}A`}
              />
            </div>

            {/* Disclaimer Alert */}
            <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 flex gap-3 text-amber-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Reference Estimate — Chemistry Dependent</div>
                <p className="text-amber-300/80 leading-relaxed">
                  Open-circuit voltage to SOC mapping requires a fully relaxed cell (&gt;30–60 minutes rest with zero current). Under load or dynamic cycling, internal resistance IR drop and electrochemical hysteresis render pure voltage-based SOC inaccurate. LiFePO4 in particular features an extremely flat plateau (3.25V–3.30V across 20%–80% SOC).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SOH & Degradation */}
      {activeTab === 'soh_fade' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">35–37. SOH & Degradation Inputs</h2>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Current Max Cap (Ah)</label>
                <input
                  type="number"
                  step="0.5"
                  value={sohCurrentCapAh}
                  onChange={(e) => setSohCurrentCapAh(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Original Rated Cap (Ah)</label>
                <input
                  type="number"
                  step="0.5"
                  value={sohOrigCapAh}
                  onChange={(e) => setSohOrigCapAh(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Current R_int (Ω)</label>
                <input
                  type="number"
                  step="0.005"
                  value={sohCurrentRint}
                  onChange={(e) => setSohCurrentRint(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Original R_int (Ω)</label>
                <input
                  type="number"
                  step="0.005"
                  value={sohNewRint}
                  onChange={(e) => setSohNewRint(parseFloat(e.target.value) || 0.001)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Lifetime Cumulative Ah Throughput (Ah)</label>
              <input
                type="number"
                step="500"
                value={cumThroughputAh}
                onChange={(e) => setCumThroughputAh(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ResultCard
                label="Capacity State of Health (SOH)"
                value={`${sohResult?.capacitySohPercent ?? 0}%`}
                subtext={`Status: ${sohResult?.statusText ?? 'N/A'}`}
                highlight={!(sohResult?.isEndOfLife)}
              />
              <ResultCard
                label="Resistance Degradation"
                value={`${sohResult?.resistanceHealthIndicatorRatio ?? 0}×`}
                subtext={`Internal resistance increased by ${(((sohResult?.resistanceHealthIndicatorRatio ?? 1) - 1) * 100).toFixed(0)}%`}
              />
              <ResultCard
                label="Equivalent Full Cycles (EFC)"
                value={`${efcResult?.equivalentFullCycles ?? 0} EFC`}
                subtext={`Throughput: ${cumThroughputAh.toLocaleString()} Ah total`}
              />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-200 mb-2">36. Capacity Fade Summary:</h3>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-slate-400">Total Lost Capacity</div>
                  <div className="text-base font-bold font-mono text-rose-400">{fadeResult?.fadeAh ?? 0} Ah</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-slate-400">Fade Percentage</div>
                  <div className="text-base font-bold font-mono text-rose-400">{fadeResult?.fadePercent ?? 0}%</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-slate-400">Remaining Usable</div>
                  <div className="text-base font-bold font-mono text-emerald-400">{fadeResult?.remainingCapacityPercent ?? 0}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Coulomb Counting */}
      {activeTab === 'coulomb_counting' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">38. Discrete Coulomb Counting Step</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Initial SOC (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={ccInitSoc}
                  onChange={(e) => setCcInitSoc(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Pack Capacity (Ah)</label>
                <input
                  type="number"
                  step="1"
                  value={ccPackCap}
                  onChange={(e) => setCcPackCap(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Current (A) — <span className="text-amber-400">+ for Discharge, - for Charge</span>
              </label>
              <input
                type="number"
                step="0.5"
                value={ccCurrentA}
                onChange={(e) => setCcCurrentA(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Interval Duration (Seconds)</label>
                <input
                  type="number"
                  step="60"
                  value={ccDurationS}
                  onChange={(e) => setCcDurationS(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Coulombic Eff (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={ccEtaPct}
                  onChange={(e) => setCcEtaPct(parseFloat(e.target.value) || 99)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              label="Next State of Charge SOC(t + Δt)"
              value={`${coulombStepResult?.nextSocPercent ?? 0}%`}
              subtext={`Charge transferred: ${coulombStepResult?.deltaAh ?? 0} Ah (${coulombStepResult?.coulombsTransferred ?? 0} Coulombs) [${coulombStepResult?.direction}]`}
              highlight
            />
            <CalculationStepViewer
              steps={[
                {
                  title: 'Discrete Coulomb Integral',
                  formula: 'SOC_{next} = SOC_{init} - \\frac{I \\cdot \\Delta t}{Q_{nom}} · 100\\%',
                  substitution: `${ccInitSoc}% - (${ccCurrentA} A × ${ccDurationS}s / (3600 × ${ccPackCap} Ah)) × 100%`,
                  result: `${coulombStepResult?.nextSocPercent ?? 0}%`,
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
