import React, { useState, useMemo } from 'react';
import { calculateVoltageDivider } from '../../engines/circuit/voltage-divider';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { CircuitDiagram } from '../common/CircuitDiagram';
import { toBaseUnit } from '../../lib/units/quantities';

export const VoltageDividerTool: React.FC = () => {
  const [vin, setVin] = useState<number>(5.0);
  const [vinUnit, setVinUnit] = useState<string>('V');

  const [r1, setR1] = useState<number>(10);
  const [r1Unit, setR1Unit] = useState<string>('kΩ');

  const [r2, setR2] = useState<number>(10);
  const [r2Unit, setR2Unit] = useState<string>('kΩ');

  const [hasLoad, setHasLoad] = useState<boolean>(false);
  const [rLoad, setRLoad] = useState<number>(100);
  const [rLoadUnit, setRLoadUnit] = useState<string>('kΩ');

  const vinBase = toBaseUnit(vin, 'voltage', vinUnit);
  const r1Base = toBaseUnit(r1, 'resistance', r1Unit);
  const r2Base = toBaseUnit(r2, 'resistance', r2Unit);
  const rLoadBase = hasLoad ? toBaseUnit(rLoad, 'resistance', rLoadUnit) : undefined;

  const result = useMemo(() => {
    return calculateVoltageDivider({
      vin: vinBase,
      r1: r1Base,
      r2: r2Base,
      loadResistance: rLoadBase,
    });
  }, [vinBase, r1Base, r2Base, rLoadBase]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Divider Parameters</span>

          <UnitInput
            id="vdiv-vin"
            label="Input Voltage (V_in)"
            symbol="Vin"
            quantity="voltage"
            value={vin}
            unit={vinUnit}
            onChangeValue={setVin}
            onChangeUnit={setVinUnit}
            description="Reference input potential"
          />

          <UnitInput
            id="vdiv-r1"
            label="Top Resistor (R₁)"
            symbol="R1"
            quantity="resistance"
            value={r1}
            unit={r1Unit}
            onChangeValue={setR1}
            onChangeUnit={setR1Unit}
            min={0.01}
            description="Upper series leg"
          />

          <UnitInput
            id="vdiv-r2"
            label="Bottom Resistor (R₂)"
            symbol="R2"
            quantity="resistance"
            value={r2}
            unit={r2Unit}
            onChangeValue={setR2}
            onChangeUnit={setR2Unit}
            min={0.01}
            description="Lower reference leg to ground"
          />

          {/* Optional Load Switch */}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasLoad}
                onChange={(e) => setHasLoad(e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-300">
                Include External Load Resistor (R_load droop analysis)
              </span>
            </label>

            {hasLoad && (
              <UnitInput
                id="vdiv-rload"
                label="Load Resistance (R_load)"
                symbol="RL"
                quantity="resistance"
                value={rLoad}
                unit={rLoadUnit}
                onChangeValue={setRLoad}
                onChangeUnit={setRLoadUnit}
                min={0.1}
                description="Parallel resistance connected to Vout"
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <CircuitDiagram type="voltage-divider" data={result.visualData || {}} />
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
