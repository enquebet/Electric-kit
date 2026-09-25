import React, { useState, useMemo } from 'react';
import { calculateElectricalPower } from '../../engines/circuit/power';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { CircuitDiagram } from '../common/CircuitDiagram';

export const ElectricalPowerTool: React.FC = () => {
  const [formulaMode, setFormulaMode] = useState<'vi' | 'ir' | 'vr'>('vi');

  const [voltage, setVoltage] = useState<number>(24);
  const [vUnit, setVUnit] = useState<string>('V');

  const [current, setCurrent] = useState<number>(500);
  const [iUnit, setIUnit] = useState<string>('mA');

  const [resistance, setResistance] = useState<number>(47);
  const [rUnit, setRUnit] = useState<string>('Ω');

  const [timeHours, setTimeHours] = useState<number>(24);

  const vBase = toBaseUnit(voltage, 'voltage', vUnit);
  const iBase = toBaseUnit(current, 'current', iUnit);
  const rBase = toBaseUnit(resistance, 'resistance', rUnit);

  const result = useMemo(() => {
    switch (formulaMode) {
      case 'vi':
        return calculateElectricalPower({ voltage: vBase, current: iBase, timeHours });
      case 'ir':
        return calculateElectricalPower({ current: iBase, resistance: rBase, timeHours });
      case 'vr':
        return calculateElectricalPower({ voltage: vBase, resistance: rBase, timeHours });
    }
  }, [formulaMode, vBase, iBase, rBase, timeHours]);

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Power Equation Formulation
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'vi', label: 'P = V × I', desc: 'From Voltage & Current' },
            { id: 'ir', label: 'P = I² × R', desc: 'From Current & Resistance (Joule loss)' },
            { id: 'vr', label: 'P = V² / R', desc: 'From Voltage & Resistance' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setFormulaMode(mode.id as any)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                formulaMode === mode.id
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-semibold shadow-sm ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="font-mono text-sm font-bold">{mode.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Input Parameters</span>

          {(formulaMode === 'vi' || formulaMode === 'vr') && (
            <UnitInput
              id="power-v"
              label="Potential (Voltage)"
              symbol="V"
              quantity="voltage"
              value={voltage}
              unit={vUnit}
              onChangeValue={setVoltage}
              onChangeUnit={setVUnit}
            />
          )}

          {(formulaMode === 'vi' || formulaMode === 'ir') && (
            <UnitInput
              id="power-i"
              label="Operating Current"
              symbol="I"
              quantity="current"
              value={current}
              unit={iUnit}
              onChangeValue={setCurrent}
              onChangeUnit={setIUnit}
            />
          )}

          {(formulaMode === 'ir' || formulaMode === 'vr') && (
            <UnitInput
              id="power-r"
              label="Resistance"
              symbol="R"
              quantity="resistance"
              value={resistance}
              unit={rUnit}
              onChangeValue={setResistance}
              onChangeUnit={setRUnit}
              min={0.001}
            />
          )}

          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
            <label htmlFor="power-time" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Operating Duration (Energy Accumulation)</span>
              <span className="font-mono text-cyan-400">{timeHours} hours</span>
            </label>
            <input
              id="power-time"
              type="range"
              min={1}
              max={168}
              step={1}
              value={timeHours}
              onChange={(e) => setTimeHours(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1 hr</span>
              <span>24 hrs (1 day)</span>
              <span>168 hrs (1 week)</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <CircuitDiagram
            type="ohms-law"
            data={{
              voltage: formulaMode === 'ir' ? result.visualData?.calcV : vBase,
              current: formulaMode === 'vr' ? result.visualData?.calcI : iBase,
              resistance: rBase,
              power: result.primaryValue,
            }}
          />
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
