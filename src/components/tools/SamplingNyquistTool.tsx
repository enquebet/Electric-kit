import React, { useState, useMemo } from 'react';
import {
  calculateSampling,
} from '../../engines/digital/sampling';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';

export const SamplingNyquistTool: React.FC = () => {
  const [signalFreq, setSignalFreq] = useState<number>(1000);
  const [sigUnit, setSigUnit] = useState<string>('Hz');

  const [samplingFreq, setSamplingFreq] = useState<number>(5000);
  const [fsUnit, setFsUnit] = useState<string>('Hz');

  const sigBase = toBaseUnit(signalFreq, 'frequency', sigUnit);
  const fsBase = toBaseUnit(samplingFreq, 'frequency', fsUnit);

  const result = useMemo(() => {
    return calculateSampling({
      signalFreqHz: sigBase,
      samplingFreqHz: fsBase,
    });
  }, [sigBase, fsBase]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <UnitInput
          id="samp-fsig"
          label="Analog Input Signal Frequency (f_sig / f_max)"
          symbol="f_sig"
          quantity="frequency"
          value={signalFreq}
          unit={sigUnit}
          onChangeValue={setSignalFreq}
          onChangeUnit={setSigUnit}
          min={1}
          description="Highest significant spectral frequency component"
        />

        <UnitInput
          id="samp-fs"
          label="Sampling Frequency (f_s)"
          symbol="f_s"
          quantity="frequency"
          value={samplingFreq}
          unit={fsUnit}
          onChangeValue={setSamplingFreq}
          onChangeUnit={setFsUnit}
          min={1}
          description="Sampling clock / ADC conversion rate"
        />
      </div>

      {/* Nyquist Zone & Spectrum Diagram */}
      {result.visualData && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Discrete-Time Frequency Spectrum &amp; Nyquist Zones
            </span>
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                result.visualData.isAliased
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {result.visualData.isAliased
                ? `ALIASED into Zone ${result.visualData.nyquistZone}`
                : 'NYQUIST COMPLIANT (Baseband)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Nyquist Frequency (f_N)</span>
              <div className="text-base font-mono font-bold text-cyan-300 mt-0.5">
                {(result.visualData.nyquistFreqHz / 1e3).toFixed(2)} kHz
              </div>
              <span className="text-[10px] text-slate-500">Half the sampling rate (f_s / 2)</span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Sampling Interval (T_s)</span>
              <div className="text-base font-mono font-bold text-slate-200 mt-0.5">
                {(result.visualData.samplingPeriodSec * 1e6).toFixed(2)} µs
              </div>
              <span className="text-[10px] text-slate-500">Time between ADC acquisitions</span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Apparent Baseband Frequency</span>
              <div
                className={`text-base font-mono font-bold mt-0.5 ${
                  result.visualData.isAliased ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {(result.primaryValue / 1e3).toFixed(2)} kHz
              </div>
              <span className="text-[10px] text-slate-500">
                {result.visualData.isAliased ? 'Folded ghost alias frequency' : 'True unaliased frequency'}
              </span>
            </div>
          </div>
        </div>
      )}

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
