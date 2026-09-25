import React, { useState, useMemo } from 'react';
import { calculateSeriesCapacitors, calculateParallelCapacitors } from '../../engines/circuit/series-parallel-c';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Plus, Trash2, GitFork, ArrowRightLeft } from 'lucide-react';

export const SeriesParallelCapacitorTool: React.FC<{ initialMode?: 'series' | 'parallel' }> = ({ initialMode = 'parallel' }) => {
  const [mode, setMode] = useState<'series' | 'parallel'>(initialMode);
  const [capacitors, setCapacitors] = useState<Array<{ id: string; val: number; unit: string }>>([
    { id: '1', val: 10, unit: 'µF' },
    { id: '2', val: 22, unit: 'µF' },
  ]);
  const [voltage, setVoltage] = useState<number>(25);
  const [voltageUnit, setVoltageUnit] = useState<string>('V');

  const addCapacitor = () => {
    const nextId = (capacitors.length + 1).toString();
    setCapacitors([...capacitors, { id: nextId, val: 10, unit: 'µF' }]);
  };

  const removeCapacitor = (index: number) => {
    if (capacitors.length <= 2) return;
    setCapacitors(capacitors.filter((_, i) => i !== index));
  };

  const updateCapacitor = (index: number, val: number, unit: string) => {
    const next = [...capacitors];
    next[index] = { ...next[index], val, unit };
    setCapacitors(next);
  };

  const baseCapacitors = useMemo(() => {
    return capacitors.map(c => toBaseUnit(c.val, 'capacitance', c.unit));
  }, [capacitors]);

  const baseVoltage = toBaseUnit(voltage, 'voltage', voltageUnit);

  const result = useMemo(() => {
    if (mode === 'series') {
      return calculateSeriesCapacitors({
        capacitors: baseCapacitors,
        voltage: baseVoltage > 0 ? baseVoltage : undefined,
      });
    } else {
      return calculateParallelCapacitors({
        capacitors: baseCapacitors,
        voltage: baseVoltage > 0 ? baseVoltage : undefined,
      });
    }
  }, [mode, baseCapacitors, baseVoltage]);

  return (
    <div className="flex flex-col gap-6">
      {/* Topology Mode Selector */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
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
          Parallel Network (C₁ + C₂ + ...)
        </button>

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
          Series Network (1 / ∑ 1/Cᵢ)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Network Inputs */}
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              {mode === 'parallel' ? 'Parallel Capacitor Elements' : 'Series Capacitor Elements'}
            </span>
            <button
              type="button"
              onClick={addCapacitor}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Capacitor
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
            {capacitors.map((cap, idx) => (
              <div key={cap.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <UnitInput
                    id={`cap-${mode}-${idx}`}
                    label={`Capacitor C${idx + 1}`}
                    symbol={`C${idx + 1}`}
                    quantity="capacitance"
                    value={cap.val}
                    unit={cap.unit}
                    onChangeValue={(v) => updateCapacitor(idx, v, cap.unit)}
                    onChangeUnit={(u) => updateCapacitor(idx, cap.val, u)}
                    min={1e-12}
                  />
                </div>
                {capacitors.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCapacitor(idx)}
                    className="mt-6 p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Remove Capacitor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <UnitInput
              id="cap-supply-v"
              label="Applied DC Voltage (V)"
              symbol="V"
              quantity="voltage"
              value={voltage}
              unit={voltageUnit}
              onChangeValue={setVoltage}
              onChangeUnit={setVoltageUnit}
              description="Voltage used to determine stored electrostatic energy (0.5 C V²) and charge (Q = C V)"
            />
          </div>
        </div>

        {/* Charge & Voltage Distribution Visualizer */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              {mode === 'parallel' ? 'Parallel Charge Accumulation' : 'Series Voltage Divider Drops'}
            </span>
            <span className="text-slate-500">{capacitors.length} Capacitors</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] text-slate-400">Total Electrostatic Energy:</span>
                <span className="text-base font-mono font-bold text-amber-400">
                  {result.additionalOutputs?.energy?.value || '—'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <span className="text-[11px] text-slate-400">Total Charge (Q):</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {result.additionalOutputs?.totalCharge?.value || '—'}
                </span>
              </div>
            </div>

            {mode === 'series' && result.visualData?.voltageDrops && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Capacitor Voltage Drops (V_i = Q / C_i):</span>
                {result.visualData.voltageDrops.map((vd: number, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-300">C{i + 1} ({capacitors[i]?.val}{capacitors[i]?.unit}):</span>
                    <span className="text-cyan-400 font-bold">{vd.toFixed(2)} V</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
