import React, { useState, useMemo } from 'react';
import {
  calculatePwm,
  findOptimalTimerPrescalers,
  generatePwmTradeoffTable,
  COMMON_MCU_PRESETS,
  McuTimerPreset,
} from '../../engines/embedded/pwm-calculator';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { CircuitDiagram } from '../common/CircuitDiagram';
import { toBaseUnit } from '../../lib/units/quantities';
import { formatQuantity } from '../../lib/units/formatter';

export const PwmTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'waveform' | 'registers' | 'optimizer' | 'tradeoffs'>('waveform');

  // Waveform parameters
  const [frequency, setFrequency] = useState<number>(1000);
  const [fUnit, setFUnit] = useState<string>('Hz');
  const [dutyCycle, setDutyCycle] = useState<number>(50);
  const [vcc, setVcc] = useState<number>(5.0);

  // MCU parameters
  const [mcuPreset, setMcuPreset] = useState<string>(COMMON_MCU_PRESETS[0].name);
  const [mcuClock, setMcuClock] = useState<number>(16);
  const [clockUnit, setClockUnit] = useState<string>('MHz');
  const [prescaler, setPrescaler] = useState<number>(64);
  const [timerResolutionBits, setTimerResolutionBits] = useState<16 | 32>(16);

  // Optimizer parameters
  const [optTargetFreq, setOptTargetFreq] = useState<number>(20000); // 20 kHz
  const [optUnit, setOptUnit] = useState<string>('Hz');

  const fBase = toBaseUnit(frequency, 'frequency', fUnit);
  const clockBase = toBaseUnit(mcuClock, 'frequency', clockUnit);
  const optBase = toBaseUnit(optTargetFreq, 'frequency', optUnit);

  const result = useMemo(() => {
    return calculatePwm({
      frequencyHz: fBase,
      dutyCyclePercent: dutyCycle,
      supplyVoltage: vcc,
      mcuClockHz: clockBase,
      prescaler,
    });
  }, [fBase, dutyCycle, vcc, clockBase, prescaler]);

  const optimalPrescalers = useMemo(() => {
    return findOptimalTimerPrescalers(clockBase, optBase, timerResolutionBits);
  }, [clockBase, optBase, timerResolutionBits]);

  const tradeoffRows = useMemo(() => {
    return generatePwmTradeoffTable(clockBase, prescaler);
  }, [clockBase, prescaler]);

  const handleSelectPreset = (p: McuTimerPreset) => {
    setMcuPreset(p.name);
    setMcuClock(p.clockHz / 1e6);
    setClockUnit('MHz');
    setPrescaler(p.defaultPsc);
    setTimerResolutionBits(p.maxBits as 16 | 32);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        {[
          { id: 'waveform', label: 'PWM Waveform & Output' },
          { id: 'registers', label: 'MCU Timer Registers' },
          { id: 'optimizer', label: 'Prescaler & ARR Optimizer' },
          { id: 'tradeoffs', label: 'Frequency vs Resolution' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Common Microcontroller Architecture Header Bar */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Microcontroller Architecture &amp; Timer Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {COMMON_MCU_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                mcuPreset === p.name
                  ? 'border-cyan-400 bg-cyan-950/40 text-slate-100 ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="text-xs font-bold truncate">{p.name.split(' (')[0]}</div>
              <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                {p.clockHz / 1e6} MHz · PSC {p.defaultPsc} · {p.maxBits}-bit
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: PWM Waveform & Output */}
      {activeTab === 'waveform' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                PWM Modulation Parameters
              </span>

              <UnitInput
                id="pwm-freq"
                label="Switching Frequency (f_pwm)"
                symbol="f"
                quantity="frequency"
                value={frequency}
                unit={fUnit}
                onChangeValue={setFrequency}
                onChangeUnit={setFUnit}
                min={1}
                description="e.g. 490 Hz (Arduino), 25 kHz (Fan), 100 kHz (SMPS)"
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pwm-duty" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Duty Cycle (D)</span>
                  <span className="font-mono text-cyan-400">{dutyCycle.toFixed(1)}%</span>
                </label>
                <input
                  id="pwm-duty"
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={dutyCycle}
                  onChange={(e) => setDutyCycle(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0% (OFF)</span>
                  <span>50% (Half)</span>
                  <span>100% (Full Rail)</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pwm-vcc" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Logic High Rail Voltage (V_cc)</span>
                  <span className="font-mono text-cyan-400">{vcc} V</span>
                </label>
                <input
                  id="pwm-vcc"
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={vcc}
                  onChange={(e) => setVcc(parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-900/90 rounded-lg border border-slate-700 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col">
              <CircuitDiagram type="pwm" data={result.visualData || {}} />
            </div>
          </div>

          <ResultCard result={result} />
          <StepExplanation steps={result.steps} />
        </div>
      )}

      {/* TAB 2: MCU Timer Registers */}
      {activeTab === 'registers' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <UnitInput
              id="pwm-mcu-clk"
              label="MCU Peripheral / Timer Clock"
              symbol="f_clk"
              quantity="frequency"
              value={mcuClock}
              unit={clockUnit}
              onChangeValue={setMcuClock}
              onChangeUnit={setClockUnit}
              min={0.1}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pwm-psc-val" className="text-xs font-semibold text-slate-300">
                Timer Prescaler Value (PSC)
              </label>
              <input
                id="pwm-psc-val"
                type="number"
                min="1"
                max="65535"
                value={prescaler}
                onChange={(e) => setPrescaler(parseInt(e.target.value, 10) || 1)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              />
              <span className="text-[10px] text-slate-400">
                Tick Rate = {(clockBase / prescaler / 1e6).toFixed(3)} MHz
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Timer Counter Bit Width</label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                {[16, 32].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTimerResolutionBits(w as 16 | 32)}
                    className={`flex-1 py-2 text-xs font-mono font-bold rounded cursor-pointer ${
                      timerResolutionBits === w ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {w}-bit
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ResultCard result={result} />
          <StepExplanation steps={result.steps} />
        </div>
      )}

      {/* TAB 3: Prescaler & ARR Optimizer */}
      {activeTab === 'optimizer' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <UnitInput
              id="opt-target"
              label="Target PWM Frequency"
              symbol="f_target"
              quantity="frequency"
              value={optTargetFreq}
              unit={optUnit}
              onChangeValue={setOptTargetFreq}
              onChangeUnit={setOptUnit}
              min={1}
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Timer Clock Input</span>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-sm text-cyan-300">
                {formatQuantity(clockBase, 'frequency')} ({timerResolutionBits}-bit Timer)
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Optimal Prescaler &amp; Period Register (ARR / ICR1) Configurations
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Prescaler (PSC)</th>
                    <th className="p-3">Auto-Reload (ARR/TOP)</th>
                    <th className="p-3">Actual Freq</th>
                    <th className="p-3">Error</th>
                    <th className="p-3">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {optimalPrescalers.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-3 font-bold text-slate-200">#{idx + 1}</td>
                      <td className="p-3 text-cyan-300">{row.prescaler}</td>
                      <td className="p-3 text-emerald-300">
                        {row.periodRegister} (0x{row.periodRegister.toString(16).toUpperCase()})
                      </td>
                      <td className="p-3">{formatQuantity(row.actualFrequencyHz, 'frequency')}</td>
                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            Math.abs(row.errorPercent) < 0.1
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {row.errorPercent >= 0 ? '+' : ''}
                          {row.errorPercent.toFixed(3)}%
                        </span>
                      </td>
                      <td className="p-3">{row.resolutionBits.toFixed(1)} bits</td>
                    </tr>
                  ))}
                  {optimalPrescalers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500">
                        No valid prescalers found for target frequency with {timerResolutionBits}-bit timer limits.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Frequency vs Resolution Trade-offs */}
      {activeTab === 'tradeoffs' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-slate-200 mb-1">
              Microcontroller Frequency vs. Duty Resolution Trade-Off
            </h3>
            <p className="text-xs text-slate-400">
              As PWM carrier frequency increases, the timer counter has fewer clock ticks per cycle to divide into duty steps, reducing PWM resolution.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Target Frequency</th>
                  <th className="p-3">ARR / Counts per Cycle</th>
                  <th className="p-3">Duty Resolution</th>
                  <th className="p-3">Smallest Duty Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {tradeoffRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-200">{formatQuantity(row.freqHz, 'frequency')}</td>
                    <td className="p-3 text-cyan-400">{row.arrCounts}</td>
                    <td className="p-3 text-emerald-300 font-bold">{row.resolutionBits.toFixed(1)} bits</td>
                    <td className="p-3">{row.stepPercent.toFixed(3)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
