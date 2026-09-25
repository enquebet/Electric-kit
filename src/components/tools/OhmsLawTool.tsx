import React, { useState, useMemo } from 'react';
import { calculateOhmsLaw } from '../../engines/circuit/ohms-law';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { CircuitDiagram } from '../common/CircuitDiagram';
import { toBaseUnit } from '../../lib/units/quantities';
import { RotateCcw } from 'lucide-react';

export const OhmsLawTool: React.FC = () => {
  // Mode selection: which 2 are known?
  const [knownPair, setKnownPair] = useState<'v_i' | 'v_r' | 'i_r' | 'p_v' | 'p_i' | 'p_r'>('v_r');

  const [voltage, setVoltage] = useState<number>(12);
  const [vUnit, setVUnit] = useState<string>('V');

  const [current, setCurrent] = useState<number>(20);
  const [iUnit, setIUnit] = useState<string>('mA');

  const [resistance, setResistance] = useState<number>(1000);
  const [rUnit, setRUnit] = useState<string>('Ω');

  const [power, setPower] = useState<number>(5);
  const [pUnit, setPUnit] = useState<string>('W');

  // Convert to base units for calculation
  const vBase = toBaseUnit(voltage, 'voltage', vUnit);
  const iBase = toBaseUnit(current, 'current', iUnit);
  const rBase = toBaseUnit(resistance, 'resistance', rUnit);
  const pBase = toBaseUnit(power, 'power', pUnit);

  const result = useMemo(() => {
    switch (knownPair) {
      case 'v_i':
        return calculateOhmsLaw({ voltage: vBase, current: iBase });
      case 'v_r':
        return calculateOhmsLaw({ voltage: vBase, resistance: rBase });
      case 'i_r':
        return calculateOhmsLaw({ current: iBase, resistance: rBase });
      case 'p_v':
        return calculateOhmsLaw({ power: pBase, voltage: vBase });
      case 'p_i':
        return calculateOhmsLaw({ power: pBase, current: iBase });
      case 'p_r':
        return calculateOhmsLaw({ power: pBase, resistance: rBase });
    }
  }, [knownPair, vBase, iBase, rBase, pBase]);

  const handleReset = () => {
    setVoltage(12);
    setVUnit('V');
    setResistance(1000);
    setRUnit('Ω');
    setCurrent(20);
    setIUnit('mA');
    setPower(5);
    setPUnit('W');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Select Known Variables (2 Known → 2 Solved)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'v_r', label: 'Voltage & Resistance (V, R)' },
            { id: 'v_i', label: 'Voltage & Current (V, I)' },
            { id: 'i_r', label: 'Current & Resistance (I, R)' },
            { id: 'p_v', label: 'Power & Voltage (P, V)' },
            { id: 'p_i', label: 'Power & Current (P, I)' },
            { id: 'p_r', label: 'Power & Resistance (P, R)' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setKnownPair(mode.id as any)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                knownPair === mode.id
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-semibold shadow-sm ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form & Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Input Parameters</span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-cyan-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {(knownPair === 'v_i' || knownPair === 'v_r' || knownPair === 'p_v') && (
            <UnitInput
              id="ohm-voltage"
              label="Voltage"
              symbol="V"
              quantity="voltage"
              value={voltage}
              unit={vUnit}
              onChangeValue={setVoltage}
              onChangeUnit={setVUnit}
              description="Potential across component"
            />
          )}

          {(knownPair === 'v_i' || knownPair === 'i_r' || knownPair === 'p_i') && (
            <UnitInput
              id="ohm-current"
              label="Current"
              symbol="I"
              quantity="current"
              value={current}
              unit={iUnit}
              onChangeValue={setCurrent}
              onChangeUnit={setIUnit}
              description="Conductor current flow"
            />
          )}

          {(knownPair === 'v_r' || knownPair === 'i_r' || knownPair === 'p_r') && (
            <UnitInput
              id="ohm-resistance"
              label="Resistance"
              symbol="R"
              quantity="resistance"
              value={resistance}
              unit={rUnit}
              onChangeValue={setResistance}
              onChangeUnit={setRUnit}
              min={0.001}
              description="Ohmic load opposition"
            />
          )}

          {(knownPair === 'p_v' || knownPair === 'p_i' || knownPair === 'p_r') && (
            <UnitInput
              id="ohm-power"
              label="Power"
              symbol="P"
              quantity="power"
              value={power}
              unit={pUnit}
              onChangeValue={setPower}
              onChangeUnit={setPUnit}
              min={0}
              description="Dissipated or delivered wattage"
            />
          )}
        </div>

        {/* Schematic diagram */}
        <div className="lg:col-span-6 flex flex-col">
          <CircuitDiagram type="ohms-law" data={result.visualData || {}} />
        </div>
      </div>

      {/* Primary Result & Recommendations */}
      <ResultCard result={result} />

      {/* Step-by-Step Derivation */}
      <StepExplanation steps={result.steps} />
    </div>
  );
};
