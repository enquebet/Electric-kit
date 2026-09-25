import React, { useState, useMemo } from 'react';
import { calculateSeriesInductors, calculateParallelInductors } from '../../engines/circuit/series-parallel-l';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Plus, Trash2, GitFork, ArrowRightLeft } from 'lucide-react';

export const SeriesParallelInductorTool: React.FC<{ initialMode?: 'series' | 'parallel' }> = ({ initialMode = 'series' }) => {
  const [mode, setMode] = useState<'series' | 'parallel'>(initialMode);
  const [inductors, setInductors] = useState<Array<{ id: string; val: number; unit: string }>>([
    { id: '1', val: 10, unit: 'mH' },
    { id: '2', val: 15, unit: 'mH' },
  ]);
  const [current, setCurrent] = useState<number>(2.0);
  const [currentUnit, setCurrentUnit] = useState<string>('A');

  const addInductor = () => {
    const nextId = (inductors.length + 1).toString();
    setInductors([...inductors, { id: nextId, val: 10, unit: 'mH' }]);
  };

  const removeInductor = (index: number) => {
    if (inductors.length <= 2) return;
    setInductors(inductors.filter((_, i) => i !== index));
  };

  const updateInductor = (index: number, val: number, unit: string) => {
    const next = [...inductors];
    next[index] = { ...next[index], val, unit };
    setInductors(next);
  };

  const baseInductors = useMemo(() => {
    return inductors.map(l => toBaseUnit(l.val, 'inductance', l.unit));
  }, [inductors]);

  const baseCurrent = toBaseUnit(current, 'current', currentUnit);

  const result = useMemo(() => {
    if (mode === 'series') {
      return calculateSeriesInductors({
        inductors: baseInductors,
        current: baseCurrent > 0 ? baseCurrent : undefined,
      });
    } else {
      return calculateParallelInductors({
        inductors: baseInductors,
        current: baseCurrent > 0 ? baseCurrent : undefined,
      });
    }
  }, [mode, baseInductors, baseCurrent]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode('series')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            mode === 'series'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Series Inductors (L₁ + L₂ + ...)
        </button>

        <button
          type="button"
          onClick={() => setMode('parallel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            mode === 'parallel'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          Parallel Inductors (1 / ∑ 1/Lᵢ)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              {mode === 'series' ? 'Series Inductors' : 'Parallel Inductors'}
            </span>
            <button
              type="button"
              onClick={addInductor}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Inductor
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
            {inductors.map((ind, idx) => (
              <div key={ind.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <UnitInput
                    id={`ind-${mode}-${idx}`}
                    label={`Inductor L${idx + 1}`}
                    symbol={`L${idx + 1}`}
                    quantity="inductance"
                    value={ind.val}
                    unit={ind.unit}
                    onChangeValue={(v) => updateInductor(idx, v, ind.unit)}
                    onChangeUnit={(u) => updateInductor(idx, ind.val, u)}
                    min={1e-9}
                  />
                </div>
                {inductors.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeInductor(idx)}
                    className="mt-6 p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Remove Inductor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <UnitInput
              id="ind-supply-i"
              label="Circuit Total Current (I)"
              symbol="I"
              quantity="current"
              value={current}
              unit={currentUnit}
              onChangeValue={setCurrent}
              onChangeUnit={setCurrentUnit}
              description="Conductor current to calculate magnetic field energy storage: E = ½ L I²"
            />
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              Magnetic Energy & Flux Coupling
            </span>
            <span className="text-slate-500">{inductors.length} Inductors</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
              <span className="text-xs text-slate-400">Stored Magnetic Field Energy:</span>
              <span className="text-xl font-mono font-bold text-amber-400">
                {result.additionalOutputs?.energy?.value || '—'}
              </span>
              <span className="text-[11px] text-slate-500">
                Assumption: Mutual inductive coupling coefficient k = 0 (isolated magnetic flux paths).
              </span>
            </div>
          </div>
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
