import React, { useState, useMemo } from 'react';
import {
  calculateCapacitorEnergy,
  calculateInductorEnergy,
  calculateResistorEnergy,
} from '../../engines/circuit/energy';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { BatteryCharging, Disc, Flame } from 'lucide-react';

export const EnergyPowerTool: React.FC = () => {
  const [energyMode, setEnergyMode] = useState<'capacitor' | 'inductor' | 'resistor'>('capacitor');

  // Capacitor inputs
  const [capVal, setCapVal] = useState<number>(100);
  const [capUnit, setCapUnit] = useState<string>('µF');
  const [capV, setCapV] = useState<number>(50);
  const [capVUnit, setCapVUnit] = useState<string>('V');

  // Inductor inputs
  const [indVal, setIndVal] = useState<number>(10);
  const [indUnit, setIndUnit] = useState<string>('mH');
  const [indI, setIndI] = useState<number>(2.0);
  const [indIUnit, setIndIUnit] = useState<string>('A');

  // Resistor inputs
  const [resVal, setResVal] = useState<number>(100);
  const [resUnit, setResUnit] = useState<string>('Ω');
  const [resV, setResV] = useState<number>(12);
  const [resVUnit, setResVUnit] = useState<string>('V');
  const [durationSec, setDurationSec] = useState<number>(60);

  const C = toBaseUnit(capVal, 'capacitance', capUnit);
  const Vcap = toBaseUnit(capV, 'voltage', capVUnit);

  const L = toBaseUnit(indVal, 'inductance', indUnit);
  const Iind = toBaseUnit(indI, 'current', indIUnit);

  const R = toBaseUnit(resVal, 'resistance', resUnit);
  const Vres = toBaseUnit(resV, 'voltage', resVUnit);

  const result = useMemo(() => {
    if (energyMode === 'capacitor') {
      return calculateCapacitorEnergy({
        capacitance: C,
        voltage: Vcap,
      });
    } else if (energyMode === 'inductor') {
      return calculateInductorEnergy({
        inductance: L,
        current: Iind,
      });
    } else {
      return calculateResistorEnergy({
        resistance: R,
        voltage: Vres,
        durationSeconds: durationSec,
      });
    }
  }, [energyMode, C, Vcap, L, Iind, R, Vres, durationSec]);

  return (
    <div className="flex flex-col gap-6">
      {/* Component Type Selector */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setEnergyMode('capacitor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            energyMode === 'capacitor'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BatteryCharging className="w-3.5 h-3.5" />
          Capacitor Electrostatic Energy (½ C V²)
        </button>

        <button
          type="button"
          onClick={() => setEnergyMode('inductor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            energyMode === 'inductor'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          Inductor Magnetic Energy (½ L I²)
        </button>

        <button
          type="button"
          onClick={() => setEnergyMode('resistor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            energyMode === 'resistor'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Resistor Thermal Energy (P × t)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Component Values &amp; Terminal Excitation
          </span>

          {energyMode === 'capacitor' && (
            <>
              <UnitInput
                id="e-cap"
                label="Capacitance (C)"
                symbol="C"
                quantity="capacitance"
                value={capVal}
                unit={capUnit}
                onChangeValue={setCapVal}
                onChangeUnit={setCapUnit}
                min={1e-15}
              />
              <UnitInput
                id="e-cap-v"
                label="Charged Voltage (V)"
                symbol="V"
                quantity="voltage"
                value={capV}
                unit={capVUnit}
                onChangeValue={setCapV}
                onChangeUnit={setCapVUnit}
              />
            </>
          )}

          {energyMode === 'inductor' && (
            <>
              <UnitInput
                id="e-ind"
                label="Inductance (L)"
                symbol="L"
                quantity="inductance"
                value={indVal}
                unit={indUnit}
                onChangeValue={setIndVal}
                onChangeUnit={setIndUnit}
                min={1e-12}
              />
              <UnitInput
                id="e-ind-i"
                label="Carrying Current (I)"
                symbol="I"
                quantity="current"
                value={indI}
                unit={indIUnit}
                onChangeValue={setIndI}
                onChangeUnit={setIndIUnit}
              />
            </>
          )}

          {energyMode === 'resistor' && (
            <>
              <UnitInput
                id="e-res"
                label="Resistance (R)"
                symbol="R"
                quantity="resistance"
                value={resVal}
                unit={resUnit}
                onChangeValue={setResVal}
                onChangeUnit={setResUnit}
                min={0.01}
              />
              <UnitInput
                id="e-res-v"
                label="Applied Voltage (V)"
                symbol="V"
                quantity="voltage"
                value={resV}
                unit={resVUnit}
                onChangeValue={setResV}
                onChangeUnit={setResVUnit}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Dissipation Duration (seconds)</label>
                <input
                  type="number"
                  min="0.1"
                  value={durationSec}
                  onChange={(e) => setDurationSec(parseFloat(e.target.value) || 1)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </>
          )}
        </div>

        {/* Analytical Energy Units Card */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              Energy Equivalence &amp; Conversion
            </span>
            <span className="text-slate-500">Joules / Wh / Calories</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-400 font-mono uppercase">Calculated Stored / Dissipated Energy</span>
              <span className="text-3xl font-mono font-extrabold text-cyan-300 mt-1">
                {result.formattedValue}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500">WATT-HOURS (Wh)</span>
                <span className="text-amber-300 font-bold text-sm">
                  {result.additionalOutputs?.wattHours?.value || '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-500">HEAT CALORIES (cal)</span>
                <span className="text-emerald-300 font-bold text-sm">
                  {result.additionalOutputs?.calories?.value || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
