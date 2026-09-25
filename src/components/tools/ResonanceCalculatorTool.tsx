import React, { useState, useMemo } from 'react';
import { calculateRlcResonance, calculateLcResonance } from '../../engines/circuit/rlc-resonance';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Radio, Gauge } from 'lucide-react';

export const ResonanceCalculatorTool: React.FC = () => {
  const [circuitMode, setCircuitMode] = useState<'rlc-series' | 'rlc-parallel' | 'lc-tank'>('rlc-series');

  const [inductance, setInductance] = useState<number>(10);
  const [inductanceUnit, setInductanceUnit] = useState<string>('µH');

  const [capacitance, setCapacitance] = useState<number>(100);
  const [capacitanceUnit, setCapacitanceUnit] = useState<string>('pF');

  const [resistance, setResistance] = useState<number>(10);
  const [resistanceUnit, setResistanceUnit] = useState<string>('Ω');

  const [voltage, setVoltage] = useState<number>(5.0);
  const [voltageUnit, setVoltageUnit] = useState<string>('V');

  const L = toBaseUnit(inductance, 'inductance', inductanceUnit);
  const C = toBaseUnit(capacitance, 'capacitance', capacitanceUnit);
  const R = toBaseUnit(resistance, 'resistance', resistanceUnit);
  const V = toBaseUnit(voltage, 'voltage', voltageUnit);

  const result = useMemo(() => {
    if (circuitMode === 'lc-tank') {
      return calculateLcResonance({
        inductance: L,
        capacitance: C,
        voltage: V > 0 ? V : undefined,
      });
    } else {
      return calculateRlcResonance({
        resistance: R,
        inductance: L,
        capacitance: C,
        topology: circuitMode === 'rlc-series' ? 'series' : 'parallel',
      });
    }
  }, [circuitMode, L, C, R, V]);

  return (
    <div className="flex flex-col gap-6">
      {/* Topology Selector */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setCircuitMode('rlc-series')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            circuitMode === 'rlc-series'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Series RLC Circuit
        </button>

        <button
          type="button"
          onClick={() => setCircuitMode('rlc-parallel')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            circuitMode === 'rlc-parallel'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Parallel RLC Circuit
        </button>

        <button
          type="button"
          onClick={() => setCircuitMode('lc-tank')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            circuitMode === 'lc-tank'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Ideal LC Tank (Undamped)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Resonant Tank Components
          </span>

          <UnitInput
            id="res-inductance"
            label="Inductance (L)"
            symbol="L"
            quantity="inductance"
            value={inductance}
            unit={inductanceUnit}
            onChangeValue={setInductance}
            onChangeUnit={setInductanceUnit}
            min={1e-12}
            description="Tuning coil inductance"
          />

          <UnitInput
            id="res-capacitance"
            label="Capacitance (C)"
            symbol="C"
            quantity="capacitance"
            value={capacitance}
            unit={capacitanceUnit}
            onChangeValue={setCapacitance}
            onChangeUnit={setCapacitanceUnit}
            min={1e-15}
            description="Tuning capacitor"
          />

          {circuitMode !== 'lc-tank' ? (
            <UnitInput
              id="res-resistance"
              label="Damping Resistance (R)"
              symbol="R"
              quantity="resistance"
              value={resistance}
              unit={resistanceUnit}
              onChangeValue={setResistance}
              onChangeUnit={setResistanceUnit}
              min={0.001}
              description={circuitMode === 'rlc-series' ? 'Series dissipative loss' : 'Parallel shunting resistance'}
            />
          ) : (
            <UnitInput
              id="res-voltage"
              label="Tank Terminal Voltage (V)"
              symbol="V"
              quantity="voltage"
              value={voltage}
              unit={voltageUnit}
              onChangeValue={setVoltage}
              onChangeUnit={setVoltageUnit}
              description="Voltage used to determine peak circulating energy"
            />
          )}
        </div>

        {/* Resonant Metrics and Tank Q Display */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              Resonance &amp; Selectivity Analytics
            </span>
            <span className="text-slate-500">Thomson Formula</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Natural Resonant Frequency (f₀)</span>
              <span className="text-3xl font-mono font-extrabold text-cyan-300 mt-1">
                {result.formattedValue}
              </span>
              <span className="text-xs text-slate-500 font-mono mt-1">
                Angular: {result.additionalOutputs?.omega0?.value || '—'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col">
                <span className="text-[11px] text-slate-400">Characteristic Impedance (Z₀):</span>
                <span className="text-base font-mono font-bold text-amber-400">
                  {result.additionalOutputs?.z0?.value || '—'}
                </span>
                <span className="text-[10px] text-slate-500">Z₀ = √(L / C)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col">
                <span className="text-[11px] text-slate-400">Quality Factor (Q):</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {result.additionalOutputs?.qFactor?.value || '—'}
                </span>
                <span className="text-[10px] text-slate-500">Bandwidth: {result.additionalOutputs?.bandwidth?.value || 'N/A'}</span>
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
