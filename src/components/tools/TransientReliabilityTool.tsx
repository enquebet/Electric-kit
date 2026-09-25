import React, { useState, useMemo } from 'react';
import {
  calculateThermalCapacitance,
  calculateThermalTimeConstant,
  calculateSinglePulseResponse,
  calculateRepetitivePulseResponse,
  calculateFosterZth,
  calculateArrheniusAcceleration,
  calculateCoffinManson,
  calculateMtbfDerating,
  calculateTenDegreeRule,
  calculateThermalMargin,
} from '../../engines/thermal/transient_reliability';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Clock, Activity, ShieldAlert, Zap, Repeat, TrendingUp } from 'lucide-react';

export function TransientReliabilityTool() {
  const [activeTab, setActiveTab] = useState<'single_pulse' | 'repetitive' | 'foster_zth' | 'arrhenius_mtbf' | 'cycling_margin'>('single_pulse');

  // 1. Single Pulse & Time Constant
  const [pulsePowerW, setPulsePowerW] = useState<number>(120);
  const [pulseDurationMs, setPulseDurationMs] = useState<number>(10);
  const [thermalRth, setThermalRth] = useState<number>(1.2);
  const [thermalCth, setThermalCth] = useState<number>(0.05); // J/K
  const [initialTempC, setInitialTempC] = useState<number>(25);

  // 2. Repetitive Pulse
  const [repPkPowerW, setRepPkPowerW] = useState<number>(80);
  const [repPulseWidthMs, setRepPulseWidthMs] = useState<number>(2);
  const [repPeriodMs, setRepPeriodMs] = useState<number>(10); // 20% duty cycle

  // 3. Foster RC Network
  const [evalTimeS, setEvalTimeS] = useState<number>(0.01); // 10 ms

  // 4. Arrhenius & MTBF
  const [operatingTempC, setOperatingTempC] = useState<number>(85);
  const [baselineTempC, setBaselineTempC] = useState<number>(25);
  const [activationEnergyEv, setActivationEnergyEv] = useState<number>(0.7);
  const [baselineFit, setBaselineFit] = useState<number>(50); // FIT

  // 5. Cycling & Margin
  const [dtUseK, setDtUseK] = useState<number>(30);
  const [dtStressK, setDtStressK] = useState<number>(80);
  const [junctionTempC, setJunctionTempC] = useState<number>(105);
  const [maxTjC, setMaxTjC] = useState<number>(150);

  // Calculations
  const tauResult = useMemo(() => {
    return calculateThermalTimeConstant(thermalRth, thermalCth);
  }, [thermalRth, thermalCth]);

  const singlePulseResult = useMemo(() => {
    return calculateSinglePulseResponse({
      pulsePowerWatts: pulsePowerW,
      pulseDurationSeconds: pulseDurationMs * 1e-3,
      thermalResistanceKW: thermalRth,
      timeConstantSeconds: tauResult.timeConstantSeconds,
      initialTempC,
    });
  }, [pulsePowerW, pulseDurationMs, thermalRth, tauResult, initialTempC]);

  const repetitiveResult = useMemo(() => {
    return calculateRepetitivePulseResponse({
      peakPowerWatts: repPkPowerW,
      pulseWidthSeconds: repPulseWidthMs * 1e-3,
      periodSeconds: repPeriodMs * 1e-3,
      thermalResistanceKW: thermalRth,
      timeConstantSeconds: tauResult.timeConstantSeconds,
      ambientTempC: initialTempC,
    });
  }, [repPkPowerW, repPulseWidthMs, repPeriodMs, thermalRth, tauResult, initialTempC]);

  const fosterResult = useMemo(() => {
    return calculateFosterZth(
      [
        { id: 'stg1', name: 'Stage 1 (Silicon Die)', rKW: 0.15, tauSeconds: 0.001 },
        { id: 'stg2', name: 'Stage 2 (Solder Die Attach)', rKW: 0.25, tauSeconds: 0.01 },
        { id: 'stg3', name: 'Stage 3 (Copper Base Tab)', rKW: 0.35, tauSeconds: 0.1 },
        { id: 'stg4', name: 'Stage 4 (Extruded Heat Sink)', rKW: 0.75, tauSeconds: 2.5 },
      ],
      evalTimeS
    );
  }, [evalTimeS]);

  const arrheniusResult = useMemo(() => {
    return calculateArrheniusAcceleration({
      operatingTempC,
      stressTempC: baselineTempC,
      activationEnergyEv,
    });
  }, [operatingTempC, baselineTempC, activationEnergyEv]);

  const mtbfResult = useMemo(() => {
    return calculateMtbfDerating({
      baselineFit,
      baselineTempC,
      operatingTempC,
      activationEnergyEv,
    });
  }, [baselineFit, baselineTempC, operatingTempC, activationEnergyEv]);

  const tenDegreeResult = useMemo(() => {
    return calculateTenDegreeRule(5000, 105, operatingTempC);
  }, [operatingTempC]);

  const coffinMansonResult = useMemo(() => {
    return calculateCoffinManson({
      deltaTUseKelvin: dtUseK,
      deltaTStressKelvin: dtStressK,
    });
  }, [dtUseK, dtStressK]);

  const marginResult = useMemo(() => {
    return calculateThermalMargin({
      junctionTempC,
      maxJunctionTempC: maxTjC,
      ambientTempC: initialTempC,
    });
  }, [junctionTempC, maxTjC, initialTempC]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('single_pulse')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'single_pulse' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Single Pulse & Time Constant
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('repetitive')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'repetitive' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          Repetitive Pulse (PWM)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('foster_zth')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'foster_zth' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Foster Zth(t) RC Model
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('arrhenius_mtbf')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'arrhenius_mtbf' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Arrhenius, MTBF & 10°C Rule
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cycling_margin')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'cycling_margin' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Fatigue & Thermal Margin
        </button>
      </div>

      {/* Tab 1: Single Pulse & Time Constant */}
      {activeTab === 'single_pulse' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Single Transient Pulse Parameters</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pulse Power (Watts)</label>
                <input
                  type="number"
                  value={pulsePowerW}
                  onChange={(e) => setPulsePowerW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Duration (ms)</label>
                <input
                  type="number"
                  value={pulseDurationMs}
                  onChange={(e) => setPulseDurationMs(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Thermal Resistance Rth (°C/W)</label>
                <input
                  type="number"
                  step="0.1"
                  value={thermalRth}
                  onChange={(e) => setThermalRth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Thermal Capacitance Cth (J/K)</label>
                <input
                  type="number"
                  step="0.01"
                  value={thermalCth}
                  onChange={(e) => setThermalCth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Thermal Time Constant (τ)" value={tauResult.timeConstantMilliseconds.toFixed(1)} unit="ms" highlight />
              <ResultCard label="Transient Zth(t)" value={singlePulseResult.transientThermalImpedanceZthKW.toFixed(4)} unit="°C/W" />
              <ResultCard label="Peak Pulse Temp Rise" value={singlePulseResult.peakTempRiseKelvin.toFixed(1)} unit="°C" />
              <ResultCard label="Peak Junction Temp" value={(initialTempC + singlePulseResult.peakTempRiseKelvin).toFixed(1)} unit="°C" />
            </div>

            <CalculationStepViewer
              steps={[
                {
                  title: 'Thermal Time Constant',
                  formula: '\\tau = R_{th} \\cdot C_{th}',
                  substitution: `${thermalRth} \\times ${thermalCth} = ${tauResult.timeConstantSeconds.toFixed(4)} s (${tauResult.timeConstantMilliseconds.toFixed(1)} ms)`,
                },
                {
                  title: 'Single Pulse Temperature Rise',
                  formula: '\\Delta T(t_p) = P \\cdot R_{th} \\cdot (1 - e^{-t_p / \\tau})',
                  substitution: `${pulsePowerW} \\times ${thermalRth} \\times (1 - e^{-${pulseDurationMs * 1e-3} / ${tauResult.timeConstantSeconds.toFixed(4)}}) = ${singlePulseResult.peakTempRiseKelvin.toFixed(1)} °C`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Repetitive Pulse */}
      {activeTab === 'repetitive' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Periodic PWM Pulse Train</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Peak Power (W)</label>
                <input
                  type="number"
                  value={repPkPowerW}
                  onChange={(e) => setRepPkPowerW(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Pulse Width (ms)</label>
                <input
                  type="number"
                  value={repPulseWidthMs}
                  onChange={(e) => setRepPulseWidthMs(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Period T (ms)</label>
                <input
                  type="number"
                  value={repPeriodMs}
                  onChange={(e) => setRepPeriodMs(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Duty Cycle (D)" value={(repetitiveResult.dutyCycle * 100).toFixed(1)} unit="%" highlight />
              <ResultCard label="Average Power (P_avg)" value={repetitiveResult.averagePowerWatts.toFixed(1)} unit="Watts" />
              <ResultCard label="Peak Steady-State Tj" value={repetitiveResult.peakJunctionTempC.toFixed(1)} unit="°C" />
              <ResultCard label="Valley Steady-State Tj" value={repetitiveResult.valleyJunctionTempC.toFixed(1)} unit="°C" />
              <ResultCard label="Thermal Ripple" value={repetitiveResult.rippleAmplitudeKelvin.toFixed(1)} unit="°C pk-pk" />
              <ResultCard label="Effective Zth(D)" value={repetitiveResult.effectiveZthKW.toFixed(4)} unit="°C/W" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Foster Zth(t) */}
      {activeTab === 'foster_zth' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Foster Multi-Stage Thermal RC Network</h3>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Evaluation Pulse Duration t (seconds)</label>
              <input
                type="number"
                step="0.005"
                value={evalTimeS}
                onChange={(e) => setEvalTimeS(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
              />
            </div>
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5">
              <p className="font-semibold text-slate-300">Foster Network Stages:</p>
              {fosterResult.stagesContribution.map((s, i) => (
                <div key={i} className="flex justify-between text-slate-400">
                  <span>{s.name} (τ = {s.tauSeconds}s):</span>
                  <span className="text-cyan-400 font-bold">{s.rKW} °C/W</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Transient Zth(t)" value={fosterResult.zthAtTimeKW.toFixed(4)} unit="°C/W" highlight />
              <ResultCard label="DC Steady-State Rth" value={fosterResult.totalSteadyStateRthKW.toFixed(4)} unit="°C/W" />
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs">
              <p className="font-semibold text-slate-200">Zth(t) Transient Progression:</p>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1 text-slate-400">
                {fosterResult.curvePoints.filter((_, i) => i % 6 === 0).map((pt, i) => (
                  <div key={i} className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <span className="block text-slate-500">{pt.timeSeconds}s</span>
                    <span className="text-cyan-300 font-bold">{pt.zthKW.toFixed(3)} °C/W</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Arrhenius, MTBF & 10°C Rule */}
      {activeTab === 'arrhenius_mtbf' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Arrhenius Thermal Reliability Sizing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Operating Temp Top (°C)</label>
                <input
                  type="number"
                  value={operatingTempC}
                  onChange={(e) => setOperatingTempC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Baseline Reference Temp T0 (°C)</label>
                <input
                  type="number"
                  value={baselineTempC}
                  onChange={(e) => setBaselineTempC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Activation Energy Ea (eV)</label>
                <input
                  type="number"
                  step="0.05"
                  value={activationEnergyEv}
                  onChange={(e) => setActivationEnergyEv(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Baseline Failure Rate (FIT)</label>
                <input
                  type="number"
                  value={baselineFit}
                  onChange={(e) => setBaselineFit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Arrhenius Accel Factor (AF)" value={arrheniusResult.accelerationFactor.toFixed(2)} unit="×" highlight />
              <ResultCard label="Derated Failure Rate" value={mtbfResult.deratedFit.toFixed(1)} unit="FIT" />
              <ResultCard label="Derated MTBF" value={mtbfResult.deratedMtbfYears.toFixed(1)} unit="Years" />
              <ResultCard label="10°C Rule Life Multiplier" value={tenDegreeResult.lifeMultiplier.toFixed(2)} unit="×" />
            </div>

            <CalculationStepViewer
              steps={[
                {
                  title: 'Arrhenius Thermal Acceleration Factor',
                  formula: 'AF = \\exp\\left[ \\frac{E_a}{k_B} \\cdot \\left(\\frac{1}{T_{use}} - \\frac{1}{T_{stress}}\\right) \\right]',
                  substitution: `AF = ${arrheniusResult.accelerationFactor.toFixed(2)}`,
                },
                {
                  title: '10°C Life Doubling/Halving Rule of Thumb',
                  formula: 'L = L_0 \\cdot 2^{(T_{rated} - T_{op}) / 10}',
                  substitution: `Life multiplier = 2^(${105 - operatingTempC} / 10) = ${tenDegreeResult.lifeMultiplier.toFixed(2)}×`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 5: Fatigue & Thermal Margin */}
      {activeTab === 'cycling_margin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Coffin-Manson Thermal Cycling & Safety Margin</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Use ΔT Swing (°C)</label>
                <input
                  type="number"
                  value={dtUseK}
                  onChange={(e) => setDtUseK(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Stress Test ΔT Swing (°C)</label>
                <input
                  type="number"
                  value={dtStressK}
                  onChange={(e) => setDtStressK(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Actual Junction Temp Tj (°C)</label>
                <input
                  type="number"
                  value={junctionTempC}
                  onChange={(e) => setJunctionTempC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Rated Tj (°C)</label>
                <input
                  type="number"
                  value={maxTjC}
                  onChange={(e) => setMaxTjC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Thermal Budget Consumed" value={marginResult.thermalBudgetUsedPct.toFixed(1)} unit="%" highlight />
              <ResultCard label="Temperature Headroom" value={marginResult.absoluteMarginC.toFixed(1)} unit="°C" />
              <ResultCard label="Coffin-Manson AF" value={coffinMansonResult.totalAccelerationFactor.toFixed(2)} unit="×" />
              <ResultCard label="Reliability Classification" value={marginResult.safetyTier} unit="" />
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">{marginResult.statusText}</p>
              <p>{marginResult.recommendedAction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
