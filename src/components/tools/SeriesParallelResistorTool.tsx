import React, { useState, useMemo } from 'react';
import { calculateSeriesResistors, calculateParallelResistors } from '../../engines/circuit/series-parallel-r';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Plus, Trash2, GitFork, ArrowRightLeft } from 'lucide-react';

export const SeriesParallelResistorTool: React.FC<{ initialMode?: 'series' | 'parallel' }> = ({ initialMode = 'series' }) => {
  const [mode, setMode] = useState<'series' | 'parallel'>(initialMode);
  const [resistors, setResistors] = useState<Array<{ id: string; val: number; unit: string }>>([
    { id: '1', val: 100, unit: 'Ω' },
    { id: '2', val: 220, unit: 'Ω' },
    { id: '3', val: 470, unit: 'Ω' },
  ]);
  const [voltage, setVoltage] = useState<number>(12);
  const [voltageUnit, setVoltageUnit] = useState<string>('V');

  const addResistor = () => {
    const nextId = (resistors.length + 1).toString();
    setResistors([...resistors, { id: nextId, val: 1, unit: 'kΩ' }]);
  };

  const removeResistor = (index: number) => {
    if (resistors.length <= 2) return;
    setResistors(resistors.filter((_, i) => i !== index));
  };

  const updateResistor = (index: number, val: number, unit: string) => {
    const next = [...resistors];
    next[index] = { ...next[index], val, unit };
    setResistors(next);
  };

  const baseResistors = useMemo(() => {
    return resistors.map(r => toBaseUnit(r.val, 'resistance', r.unit));
  }, [resistors]);

  const baseVoltage = toBaseUnit(voltage, 'voltage', voltageUnit);

  const result = useMemo(() => {
    if (mode === 'series') {
      return calculateSeriesResistors({
        resistors: baseResistors,
        voltage: baseVoltage > 0 ? baseVoltage : undefined,
      });
    } else {
      return calculateParallelResistors({
        resistors: baseResistors,
        voltage: baseVoltage > 0 ? baseVoltage : undefined,
      });
    }
  }, [mode, baseResistors, baseVoltage]);

  return (
    <div className="flex flex-col gap-6">
      {/* Topology Mode Selector */}
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
          Series Network (R₁ + R₂ + ...)
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
          Parallel Network (1 / ∑ 1/Rᵢ)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Network Inputs */}
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              {mode === 'series' ? 'Series Resistor Elements' : 'Parallel Resistor Elements'}
            </span>
            <button
              type="button"
              onClick={addResistor}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Resistor
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
            {resistors.map((res, idx) => (
              <div key={res.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <UnitInput
                    id={`res-${mode}-${idx}`}
                    label={`Resistor R${idx + 1}`}
                    symbol={`R${idx + 1}`}
                    quantity="resistance"
                    value={res.val}
                    unit={res.unit}
                    onChangeValue={(v) => updateResistor(idx, v, res.unit)}
                    onChangeUnit={(u) => updateResistor(idx, res.val, u)}
                    min={0.01}
                  />
                </div>
                {resistors.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeResistor(idx)}
                    className="mt-6 p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Remove Resistor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <UnitInput
              id="res-supply-v"
              label="Network Terminal Voltage (V_supply)"
              symbol="V"
              quantity="voltage"
              value={voltage}
              unit={voltageUnit}
              onChangeValue={setVoltage}
              onChangeUnit={setVoltageUnit}
              description="Applied voltage to calculate branch currents, voltage drops, and total power"
            />
          </div>
        </div>

        {/* Dynamic Visual Schematic / Current Distribution */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              {mode === 'series' ? 'Series Current Loop' : 'Parallel Branch Distribution'}
            </span>
            <span className="text-slate-500">{resistors.length} Resistors Active</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {mode === 'series' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Loop Current:</span>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    {result.additionalOutputs?.totalCurrent?.value || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Individual Voltage Drops (V_i = I × R_i):</span>
                  {result.visualData?.voltageDrops?.map((vd: number, i: number) => {
                    const pct = baseVoltage > 0 ? ((vd / baseVoltage) * 100).toFixed(1) : '0';
                    return (
                      <div key={i} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-300">R{i + 1} ({resistors[i]?.val}{resistors[i]?.unit}):</span>
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-bold">{vd.toFixed(2)} V</span>
                          <span className="text-slate-500 text-[10px]">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Total Supply Current (Kirchhoff's Current Law):</span>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    {result.additionalOutputs?.totalCurrent?.value || '—'}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Branch Currents (I_i = V / R_i):</span>
                  {result.visualData?.branchCurrents?.map((bc: number, i: number) => {
                    const totI = result.visualData?.totalCurrent || 1;
                    const pct = totI > 0 ? ((bc / totI) * 100).toFixed(1) : '0';
                    return (
                      <div key={i} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-300">Branch R{i + 1} ({resistors[i]?.val}{resistors[i]?.unit}):</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">
                            {bc < 0.01 ? (bc * 1000).toFixed(2) + ' mA' : bc.toFixed(3) + ' A'}
                          </span>
                          <span className="text-slate-500 text-[10px]">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
