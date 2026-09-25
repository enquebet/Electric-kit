import React, { useState, useMemo } from 'react';
import {
  calculateWaveformMetrics,
  analyzeWaveform,
  calculatePhaseDifference,
  WaveformType,
} from '../../engines/rf/signals-waveforms';
import { convertFrequencyToPeriod } from '../../engines/rf/freq-wavelength';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit, fromBaseUnit } from '../../lib/units/quantities';
import { Activity, Waves, Clock, Zap, Gauge } from 'lucide-react';

export const SignalFundamentalsTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'synthesizer' | 'phase' | 'freq-period'>('metrics');

  // Tab 1: Metrics
  const [waveformType, setWaveformType] = useState<WaveformType>('sine');
  const [metricMode, setMetricMode] = useState<'peak' | 'rms' | 'peak_to_peak' | 'average'>('peak');
  const [metricValue, setMetricValue] = useState<number>(10.0);

  const metricsResult = useMemo(() => {
    return calculateWaveformMetrics({
      waveformType,
      inputMode: metricMode,
      value: metricValue,
    });
  }, [waveformType, metricMode, metricValue]);

  // Tab 2: Synthesizer & Visualizer
  const [synthType, setSynthType] = useState<WaveformType>('sine');
  const [synthAmp, setSynthAmp] = useState<number>(5.0);
  const [synthDc, setSynthDc] = useState<number>(0.0);
  const [synthFreq, setSynthFreq] = useState<number>(1.0);
  const [synthFreqUnit, setSynthFreqUnit] = useState<string>('kHz');
  const [synthPhase, setSynthPhase] = useState<number>(0);
  const [synthDuty, setSynthDuty] = useState<number>(50);

  const synthFreqHz = toBaseUnit(synthFreq, 'frequency', synthFreqUnit);

  const synthResult = useMemo(() => {
    return analyzeWaveform({
      waveformType: synthType,
      amplitude: synthAmp,
      dcOffset: synthDc,
      frequencyHz: synthFreqHz,
      phaseDegrees: synthPhase,
      dutyCyclePercent: synthDuty,
      cyclesToShow: 2,
      samplePoints: 120,
    });
  }, [synthType, synthAmp, synthDc, synthFreqHz, synthPhase, synthDuty]);

  // Tab 3: Phase & Delay
  const [phaseMode, setPhaseMode] = useState<'time_to_phase' | 'phase_to_time'>('time_to_phase');
  const [phaseFreq, setPhaseFreq] = useState<number>(1.0);
  const [phaseFreqUnit, setPhaseFreqUnit] = useState<string>('kHz');
  const [timeDelta, setTimeDelta] = useState<number>(250);
  const [timeDeltaUnit, setTimeDeltaUnit] = useState<string>('µs');
  const [phaseDegInput, setPhaseDegInput] = useState<number>(90);

  const phaseFreqHz = toBaseUnit(phaseFreq, 'frequency', phaseFreqUnit);
  const timeDeltaSec = toBaseUnit(timeDelta, 'time', timeDeltaUnit);

  const phaseResult = useMemo(() => {
    return calculatePhaseDifference({
      frequencyHz: phaseFreqHz,
      mode: phaseMode,
      timeDeltaSec: phaseMode === 'time_to_phase' ? timeDeltaSec : undefined,
      phaseDeltaDeg: phaseMode === 'phase_to_time' ? phaseDegInput : undefined,
    });
  }, [phaseFreqHz, phaseMode, timeDeltaSec, phaseDegInput]);

  // Tab 4: Frequency & Period
  const [fpFreq, setFpFreq] = useState<number>(50);
  const [fpFreqUnit, setFpFreqUnit] = useState<string>('MHz');
  const fpFreqHz = toBaseUnit(fpFreq, 'frequency', fpFreqUnit);
  const fpResult = useMemo(() => {
    return convertFrequencyToPeriod(fpFreqHz);
  }, [fpFreqHz]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigator */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'metrics'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          RMS &amp; Peak Waveform Metrics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('synthesizer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'synthesizer'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          Signal Waveform Oscilloscope
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('phase')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'phase'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Phase Shift &amp; Delay (φ ↔ Δt)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('freq-period')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'freq-period'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Frequency, Period &amp; Angular Freq (f ↔ T ↔ ω)
        </button>
      </div>

      {/* TAB 1: WAVEFORM METRICS */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Waveform Geometry</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Waveform Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['sine', 'square', 'triangle'] as WaveformType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWaveformType(t)}
                    className={`py-2 px-2 text-xs font-bold capitalize rounded-lg border cursor-pointer transition-all ${
                      waveformType === t
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Known Parameter</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'peak', label: 'Peak (V_pk)' },
                  { id: 'rms', label: 'RMS (V_rms)' },
                  { id: 'peak_to_peak', label: 'Peak-to-Peak (V_pp)' },
                  { id: 'average', label: 'Rectified Avg (V_avg)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetricMode(m.id as any)}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border cursor-pointer transition-all ${
                      metricMode === m.id
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Input Value (Volts or Amperes)</label>
              <input
                type="number"
                step="any"
                value={metricValue}
                onChange={(e) => setMetricValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 flex flex-col gap-1 text-xs font-mono text-slate-400">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Formula Note</div>
              <div>{metricsResult.formulaNote}</div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">RMS Value (V_rms)</span>
                <span className="text-xl font-bold font-mono text-cyan-400 mt-1">
                  {metricsResult.vRms.toFixed(3)} V
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Heating power equivalent</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Peak Amplitude (V_pk)</span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {metricsResult.vPeak.toFixed(3)} V
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Crest from zero</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Peak-to-Peak (V_pp)</span>
                <span className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {metricsResult.vPeakToPeak.toFixed(3)} V
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Total dynamic excursion</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Rectified Average</span>
                <span className="text-xl font-bold font-mono text-indigo-400 mt-1">
                  {metricsResult.vAverage.toFixed(3)} V
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Mean absolute value</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Crest Factor</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-100">{metricsResult.crestFactor.toFixed(4)}</span>
                  <span className="text-xs text-slate-400 font-mono">(V_pk / V_rms)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Measures peak extremity relative to RMS content. Crucial for calculating amplifier headroom and clipping margin.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Form Factor</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-100">{metricsResult.formFactor.toFixed(4)}</span>
                  <span className="text-xs text-slate-400 font-mono">(V_rms / V_avg)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Ratio of RMS to rectified average. Analog meters calibrated for sine waves give erroneous readings on other waveforms by this factor.
                </p>
              </div>
            </div>

            {/* Waveform Visualization SVG */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waveform Geometry Preview</span>
                <span className="text-xs font-mono text-cyan-400">Normalized to 1 full cycle</span>
              </div>
              <div className="w-full h-32 flex items-center justify-center">
                <svg viewBox="0 0 400 120" className="w-full h-full">
                  {/* Grid Lines */}
                  <line x1="0" y1="60" x2="400" y2="60" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="20" x2="400" y2="20" stroke="#1e293b" strokeWidth="1" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#1e293b" strokeWidth="1" />
                  
                  {/* Peak Labels */}
                  <text x="5" y="18" fill="#10b981" fontSize="9" fontFamily="monospace">+V_pk</text>
                  <text x="5" y="58" fill="#64748b" fontSize="9" fontFamily="monospace">0 V</text>
                  <text x="5" y="108" fill="#10b981" fontSize="9" fontFamily="monospace">-V_pk</text>

                  {/* Waveform curve */}
                  {waveformType === 'sine' && (
                    <path
                      d="M 20,60 C 70,-10 130,-10 180,60 C 230,130 290,130 340,60 L 380,60"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                    />
                  )}
                  {waveformType === 'square' && (
                    <path
                      d="M 20,20 L 180,20 L 180,100 L 340,100 L 340,20 L 380,20"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                    />
                  )}
                  {waveformType === 'triangle' && (
                    <path
                      d="M 20,60 L 100,20 L 260,100 L 340,60 L 380,60"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYNTHESIZER & LIVE OSCILLOSCOPE */}
      {activeTab === 'synthesizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Signal Parameters</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Waveform Shape</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['sine', 'square', 'triangle'] as WaveformType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSynthType(t)}
                    className={`py-1.5 px-2 text-xs font-bold capitalize rounded-lg border cursor-pointer transition-all ${
                      synthType === t
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Peak Amplitude (V_pk)</label>
              <input
                type="number"
                step="any"
                value={synthAmp}
                onChange={(e) => setSynthAmp(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">DC Offset (V_dc)</label>
              <input
                type="number"
                step="any"
                value={synthDc}
                onChange={(e) => setSynthDc(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <UnitInput
              id="synth-freq-input"
              label="Signal Frequency (f)"
              symbol="f"
              value={synthFreq}
              unit={synthFreqUnit}
              quantity="frequency"
              onChangeValue={setSynthFreq}
              onChangeUnit={setSynthFreqUnit}
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400">Phase Angle (φ)</span>
                <span className="font-mono text-cyan-400">{synthPhase}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={synthPhase}
                onChange={(e) => setSynthPhase(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {synthType === 'square' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-400">Duty Cycle</span>
                  <span className="font-mono text-cyan-400">{synthDuty}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  step="1"
                  value={synthDuty}
                  onChange={(e) => setSynthDuty(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Live Scope Canvas */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Digital Storage Oscilloscope Trace</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  2 Cycles | T = {(synthResult.periodSec * 1e3).toFixed(3)} ms
                </span>
              </div>

              <div className="w-full h-48 bg-slate-950 relative overflow-hidden rounded-lg border border-slate-900">
                {/* Oscilloscope Grid */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 pointer-events-none opacity-20">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="border border-cyan-500/40" />
                  ))}
                </div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                  {/* Zero volt baseline */}
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#475569" strokeWidth="0.5" strokeDasharray="1 1" />
                  
                  {/* Waveform trace */}
                  {(() => {
                    const points = synthResult.samplePoints;
                    if (points.length === 0) return null;
                    const vMaxRange = Math.max(Math.abs(synthResult.vMax), Math.abs(synthResult.vMin), 1);
                    const pathD = points
                      .map((p, idx) => {
                        const x = (idx / (points.length - 1)) * 100;
                        const y = 50 - (p.voltage / (vMaxRange * 1.25)) * 50;
                        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
                      })
                      .join(' ');

                    return (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.2"
                        className="drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                      />
                    );
                  })()}
                </svg>
              </div>

              {/* Oscilloscope Readouts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">V_max:</span>
                  <span className="text-slate-200 font-bold">{synthResult.vMax.toFixed(2)} V</span>
                </div>
                <div>
                  <span className="text-slate-500 block">V_min:</span>
                  <span className="text-slate-200 font-bold">{synthResult.vMin.toFixed(2)} V</span>
                </div>
                <div>
                  <span className="text-slate-500 block">V_pp:</span>
                  <span className="text-cyan-400 font-bold">{synthResult.vPeakToPeak.toFixed(2)} V</span>
                </div>
                <div>
                  <span className="text-slate-500 block">V_rms (Total):</span>
                  <span className="text-emerald-400 font-bold">{synthResult.vRms.toFixed(2)} V</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Analytical Description</span>
              <div className="text-xs font-mono text-cyan-300">
                v(t) = {synthDc !== 0 ? `${synthDc.toFixed(2)} + ` : ''}{synthAmp.toFixed(2)} · {synthType}(2π × {(synthFreqHz).toFixed(0)} Hz × t {synthPhase >= 0 ? `+ ${synthPhase}°` : `${synthPhase}°`})
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Total RMS includes both the AC component ({synthResult.metrics.vRms.toFixed(3)} V) and DC offset ({synthDc.toFixed(2)} V) combined via quadrature: V_rms = √(V_ac² + V_dc²).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PHASE & DELAY */}
      {activeTab === 'phase' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Phase &amp; Delay Converter</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Calculation Direction</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPhaseMode('time_to_phase')}
                  className={`py-2 px-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                    phaseMode === 'time_to_phase'
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Delay → Phase (Δt → φ)
                </button>
                <button
                  type="button"
                  onClick={() => setPhaseMode('phase_to_time')}
                  className={`py-2 px-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                    phaseMode === 'phase_to_time'
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Phase → Delay (φ → Δt)
                </button>
              </div>
            </div>

            <UnitInput
              id="phase-freq-input"
              label="Signal Operating Frequency (f)"
              symbol="f"
              value={phaseFreq}
              unit={phaseFreqUnit}
              quantity="frequency"
              onChangeValue={setPhaseFreq}
              onChangeUnit={setPhaseFreqUnit}
            />

            {phaseMode === 'time_to_phase' ? (
              <UnitInput
                id="time-delta-input"
                label="Time Delay (Δt)"
                symbol="Δt"
                value={timeDelta}
                unit={timeDeltaUnit}
                quantity="time"
                onChangeValue={setTimeDelta}
                onChangeUnit={setTimeDeltaUnit}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Phase Shift (Degrees φ)</label>
                <input
                  type="number"
                  step="any"
                  value={phaseDegInput}
                  onChange={(e) => setPhaseDegInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <ResultCard result={phaseResult} />

            <StepExplanation steps={phaseResult.steps} />
          </div>
        </div>
      )}

      {/* TAB 4: FREQ, PERIOD & ANGULAR FREQ */}
      {activeTab === 'freq-period' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Frequency Input</h3>
            <UnitInput
              id="fp-freq-input"
              label="Operating Frequency (f)"
              symbol="f"
              value={fpFreq}
              unit={fpFreqUnit}
              quantity="frequency"
              onChangeValue={setFpFreq}
              onChangeUnit={setFpFreqUnit}
            />
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Wave Period (T = 1/f)</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {(fpResult.periodSeconds * 1e6).toFixed(3)} µs
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                {(fpResult.periodSeconds * 1e9).toFixed(1)} ns | {(fpResult.periodSeconds * 1e3).toFixed(3)} ms
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Angular Frequency (ω = 2πf)</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {(fpResult.omegaRadS / 1e6).toFixed(3)} Mrad/s
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                {fpResult.omegaRadS.toExponential(4)} rad/s
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Free-Space Wavelength (λ)</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1">
                {(299792458 / fpFreqHz).toFixed(3)} m
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                {((299792458 / fpFreqHz) * 100).toFixed(2)} cm in vacuum
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
