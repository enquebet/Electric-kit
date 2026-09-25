import React, { useState, useMemo } from 'react';
import {
  calculateWavelength,
  calculateFrequency,
  VELOCITY_FACTOR_PRESETS,
  RF_BANDS_TABLE,
} from '../../engines/rf/freq-wavelength';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { CircuitDiagram } from '../common/CircuitDiagram';
import { toBaseUnit } from '../../lib/units/quantities';
import { Radio, Table } from 'lucide-react';

export const FreqWavelengthTool: React.FC = () => {
  const [solveFor, setSolveFor] = useState<'wavelength' | 'frequency'>('wavelength');

  const [frequency, setFrequency] = useState<number>(2.4);
  const [fUnit, setFUnit] = useState<string>('GHz');

  const [wavelength, setWavelength] = useState<number>(12.5);
  const [lUnit, setLUnit] = useState<string>('cm');

  const [vfPreset, setVfPreset] = useState<string>('Vacuum / Free Space (Air)');
  const [velocityFactor, setVelocityFactor] = useState<number>(1.0);

  const [showBandTable, setShowBandTable] = useState<boolean>(false);

  const fBase = toBaseUnit(frequency, 'frequency', fUnit);
  const lBase = toBaseUnit(wavelength, 'wavelength', lUnit);

  const result = useMemo(() => {
    if (solveFor === 'wavelength') {
      return calculateWavelength({
        frequencyHz: fBase,
        velocityFactor,
      });
    } else {
      return calculateFrequency({
        wavelengthMeters: lBase,
        velocityFactor,
      });
    }
  }, [solveFor, fBase, lBase, velocityFactor]);

  const handleSelectPreset = (p: typeof VELOCITY_FACTOR_PRESETS[0]) => {
    setVfPreset(p.medium);
    setVelocityFactor(p.vf);
  };


  return (
    <div className="flex flex-col gap-6">
      {/* Direction toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Select Transformation Direction</h3>
          <p className="text-xs text-slate-400">c = λ × f with dielectric velocity factor adjustment</p>
        </div>
        <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => setSolveFor('wavelength')}
            className={`px-4 py-1.5 text-xs font-bold font-mono rounded-md transition-all cursor-pointer ${
              solveFor === 'wavelength'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Frequency → Wavelength (f → λ)
          </button>
          <button
            type="button"
            onClick={() => setSolveFor('frequency')}
            className={`px-4 py-1.5 text-xs font-bold font-mono rounded-md transition-all cursor-pointer ${
              solveFor === 'frequency'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wavelength → Frequency (λ → f)
          </button>
        </div>
      </div>

      {/* Medium Velocity Factor Presets */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Propagation Medium &amp; Dielectric Velocity Factor (VF)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VELOCITY_FACTOR_PRESETS.map((p) => (
            <button
              key={p.medium}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                vfPreset === p.medium
                  ? 'border-cyan-400 bg-cyan-950/40 text-slate-100 ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="text-xs font-semibold truncate">{p.medium}</div>
              <div className="text-[10px] font-mono text-cyan-400 mt-0.5">VF = {p.vf.toFixed(2)} ({(p.vf * 100).toFixed(0)}% c)</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Input Parameter</span>

          {solveFor === 'wavelength' ? (
            <UnitInput
              id="rf-freq"
              label="Oscillation Frequency (f)"
              symbol="f"
              quantity="frequency"
              value={frequency}
              unit={fUnit}
              onChangeValue={setFrequency}
              onChangeUnit={setFUnit}
              min={0.001}
              description="e.g. 144 MHz, 2.4 GHz, 5 GHz"
            />
          ) : (
            <UnitInput
              id="rf-wave"
              label="Physical Wavelength (λ)"
              symbol="λ"
              quantity="wavelength"
              value={wavelength}
              unit={lUnit}
              onChangeValue={setWavelength}
              onChangeUnit={setLUnit}
              min={0.001}
              description="e.g. 2 meters, 12.5 cm"
            />
          )}

          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
            <label htmlFor="rf-vf" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Velocity Factor (VF)</span>
              <span className="font-mono text-cyan-400">{velocityFactor.toFixed(3)}</span>
            </label>
            <input
              id="rf-vf"
              type="number"
              step="0.01"
              min="0.1"
              max="1.0"
              value={velocityFactor}
              onChange={(e) => {
                setVelocityFactor(parseFloat(e.target.value) || 1.0);
                setVfPreset('Custom');
              }}
              className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-900/90 rounded-lg border border-slate-700 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <CircuitDiagram type="freq-wavelength" data={result.visualData || {}} />
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />

      {/* ITU Frequency Bands Reference Section */}
      <div className="flex flex-col gap-3 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">ITU Frequency Band Designations</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowBandTable(!showBandTable)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
          >
            {showBandTable ? 'Hide Table' : 'Show Full ITU Table'}
          </button>
        </div>

        {showBandTable && (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                  <th className="py-2 px-2">Designation</th>
                  <th className="py-2 px-2 font-sans font-semibold">Band Name</th>
                  <th className="py-2 px-2">Frequency Range</th>
                  <th className="py-2 px-2">Wavelength (Free Space)</th>
                  <th className="py-2 px-2 font-sans">Common Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {RF_BANDS_TABLE.map((b) => (
                  <tr key={b.name} className="hover:bg-slate-900/40">
                    <td className="py-2 px-2 text-cyan-400 font-bold">{b.name}</td>
                    <td className="py-2 px-2 font-sans text-slate-300">{b.description}</td>
                    <td className="py-2 px-2 text-slate-200">{b.frequencyRange}</td>
                    <td className="py-2 px-2 text-emerald-400">{b.wavelengthRange}</td>
                    <td className="py-2 px-2 font-sans text-slate-400">{b.applications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
