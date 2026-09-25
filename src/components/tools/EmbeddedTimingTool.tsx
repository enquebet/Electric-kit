import React, { useState, useMemo } from 'react';
import {
  calculateCpuTiming,
  calculateSensorThroughput,
} from '../../engines/embedded/embedded-timing';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';

export const EmbeddedTimingTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cpu' | 'sensor'>('cpu');

  // CPU Timing State
  const [cpuFreq, setCpuFreq] = useState<number>(72);
  const [cpuUnit, setCpuUnit] = useState<string>('MHz');
  const [instructionCount, setInstructionCount] = useState<number>(10000);
  const [cpi, setCpi] = useState<number>(1.25);
  const [flashWaitStates, setFlashWaitStates] = useState<number>(0);

  // Sensor Telemetry State
  const [samplingRate, setSamplingRate] = useState<number>(1000);
  const [srUnit, setSrUnit] = useState<string>('Hz');
  const [resolutionBits, setResolutionBits] = useState<number>(16);
  const [channelCount, setChannelCount] = useState<number>(4);
  const [packBytes, setPackBytes] = useState<boolean>(true);

  const cpuBase = toBaseUnit(cpuFreq, 'frequency', cpuUnit);
  const srBase = toBaseUnit(samplingRate, 'frequency', srUnit);

  const cpuResult = useMemo(() => {
    return calculateCpuTiming({
      cpuFrequencyHz: cpuBase,
      instructionCount,
      cpi,
      flashWaitStates,
    });
  }, [cpuBase, instructionCount, cpi, flashWaitStates]);

  const sensorResult = useMemo(() => {
    return calculateSensorThroughput({
      samplingRateHz: srBase,
      resolutionBits,
      channelCount,
      packBytes,
    });
  }, [srBase, resolutionBits, channelCount, packBytes]);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('cpu')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'cpu'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          CPU Cycles &amp; Instruction Timing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sensor')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'sensor'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Sensor Data Throughput &amp; Buffer Storage
        </button>
      </div>

      {/* TAB 1: CPU Timing */}
      {activeTab === 'cpu' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <UnitInput
              id="cpu-freq"
              label="CPU Core Clock Frequency"
              symbol="f_cpu"
              quantity="frequency"
              value={cpuFreq}
              unit={cpuUnit}
              onChangeValue={setCpuFreq}
              onChangeUnit={setCpuUnit}
              min={0.01}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cpu-instr" className="text-xs font-semibold text-slate-300">
                Instruction Count
              </label>
              <input
                id="cpu-instr"
                type="number"
                min="1"
                value={instructionCount}
                onChange={(e) => setInstructionCount(parseInt(e.target.value, 10) || 1)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cpu-cpi" className="text-xs font-semibold text-slate-300">
                Average CPI (Cycles / Instr)
              </label>
              <input
                id="cpu-cpi"
                type="number"
                step="0.05"
                min="0.5"
                max="10"
                value={cpi}
                onChange={(e) => setCpi(parseFloat(e.target.value) || 1)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              />
              <span className="text-[10px] text-slate-400">~1.25 Cortex-M4, ~1.0 Cortex-M7</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cpu-ws" className="text-xs font-semibold text-slate-300">
                Flash Memory Wait States (LATENCY)
              </label>
              <select
                id="cpu-ws"
                value={flashWaitStates}
                onChange={(e) => setFlashWaitStates(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              >
                <option value={0}>0 Wait States (0 WS)</option>
                <option value={1}>1 Wait State (1 WS)</option>
                <option value={2}>2 Wait States (2 WS)</option>
                <option value={3}>3 Wait States (3 WS)</option>
                <option value={5}>5 Wait States (5 WS)</option>
              </select>
            </div>
          </div>

          <ResultCard result={cpuResult} />
          <StepExplanation steps={cpuResult.steps} />
        </div>
      )}

      {/* TAB 2: Sensor Throughput */}
      {activeTab === 'sensor' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <UnitInput
              id="sens-rate"
              label="Sampling Frequency (f_s)"
              symbol="f_s"
              quantity="frequency"
              value={samplingRate}
              unit={srUnit}
              onChangeValue={setSamplingRate}
              onChangeUnit={setSrUnit}
              min={1}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="sens-res" className="text-xs font-semibold text-slate-300">
                ADC / Sensor Bit Resolution
              </label>
              <select
                id="sens-res"
                value={resolutionBits}
                onChange={(e) => setResolutionBits(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              >
                {[8, 10, 12, 14, 16, 24, 32].map((b) => (
                  <option key={b} value={b}>
                    {b}-bit resolution
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="sens-chan" className="text-xs font-semibold text-slate-300">
                Number of Concurrent Channels
              </label>
              <input
                id="sens-chan"
                type="number"
                min="1"
                max="64"
                value={channelCount}
                onChange={(e) => setChannelCount(parseInt(e.target.value, 10) || 1)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Storage Word Alignment</label>
              <button
                type="button"
                onClick={() => setPackBytes(!packBytes)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                  packBytes
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {packBytes ? 'Byte-Aligned (e.g. 12b → 2 Bytes)' : 'Bit-Packed (Exact Bits)'}
              </button>
            </div>
          </div>

          <ResultCard result={sensorResult} />
          <StepExplanation steps={sensorResult.steps} />
        </div>
      )}
    </div>
  );
};
