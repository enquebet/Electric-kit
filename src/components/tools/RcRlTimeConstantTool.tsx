import React, { useState, useMemo } from 'react';
import { calculateRcTimeConstant, calculateRlTimeConstant } from '../../engines/circuit/rc-rl-time';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Clock, Zap, Activity } from 'lucide-react';

export const RcRlTimeConstantTool: React.FC<{ initialType?: 'rc' | 'rl' }> = ({ initialType = 'rc' }) => {
  const [circuitType, setCircuitType] = useState<'rc' | 'rl'>(initialType);

  // RC inputs
  const [rcResistance, setRcResistance] = useState<number>(10);
  const [rcResistanceUnit, setRcResistanceUnit] = useState<string>('kΩ');
  const [rcCapacitance, setRcCapacitance] = useState<number>(100);
  const [rcCapacitanceUnit, setRcCapacitanceUnit] = useState<string>('µF');
  const [rcVoltage, setRcVoltage] = useState<number>(5);
  const [rcVoltageUnit, setRcVoltageUnit] = useState<string>('V');

  // RL inputs
  const [rlInductance, setRlInductance] = useState<number>(10);
  const [rlInductanceUnit, setRlInductanceUnit] = useState<string>('mH');
  const [rlResistance, setRlResistance] = useState<number>(100);
  const [rlResistanceUnit, setRlResistanceUnit] = useState<string>('Ω');
  const [rlVoltage, setRlVoltage] = useState<number>(5);
  const [rlVoltageUnit, setRlVoltageUnit] = useState<string>('V');

  const rcR = toBaseUnit(rcResistance, 'resistance', rcResistanceUnit);
  const rcC = toBaseUnit(rcCapacitance, 'capacitance', rcCapacitanceUnit);
  const rcV = toBaseUnit(rcVoltage, 'voltage', rcVoltageUnit);

  const rlL = toBaseUnit(rlInductance, 'inductance', rlInductanceUnit);
  const rlR = toBaseUnit(rlResistance, 'resistance', rlResistanceUnit);
  const rlV = toBaseUnit(rlVoltage, 'voltage', rlVoltageUnit);

  const result = useMemo(() => {
    if (circuitType === 'rc') {
      return calculateRcTimeConstant({
        resistance: rcR,
        capacitance: rcC,
        supplyVoltage: rcV,
      });
    } else {
      return calculateRlTimeConstant({
        inductance: rlL,
        resistance: rlR,
        stepVoltage: rlV,
      });
    }
  }, [circuitType, rcR, rcC, rcV, rlL, rlR, rlV]);

  const curvePoints = result.visualData?.curvePoints || [];
  const tau = result.primaryValue || 1;

  // Generate SVG path for exponential transient curve
  const svgPath = useMemo(() => {
    if (curvePoints.length === 0) return '';
    const width = 320;
    const height = 140;
    const padding = 20;
    const maxT = 5 * tau;
    const maxVal = circuitType === 'rc' ? rcV : result.visualData?.iMax || 1;

    const points = curvePoints.map((p: any) => {
      const x = padding + (p.t / maxT) * (width - 2 * padding);
      const yVal = circuitType === 'rc' ? p.v : p.i;
      const y = height - padding - (yVal / (maxVal || 1)) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  }, [curvePoints, tau, circuitType, rcV, result.visualData]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setCircuitType('rc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            circuitType === 'rc'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          RC Circuit (τ = R × C)
        </button>

        <button
          type="button"
          onClick={() => setCircuitType('rl')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            circuitType === 'rl'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          RL Circuit (τ = L / R)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            {circuitType === 'rc' ? 'RC Circuit Parameters' : 'RL Circuit Parameters'}
          </span>

          {circuitType === 'rc' ? (
            <>
              <UnitInput
                id="rc-res"
                label="Series Resistance (R)"
                symbol="R"
                quantity="resistance"
                value={rcResistance}
                unit={rcResistanceUnit}
                onChangeValue={setRcResistance}
                onChangeUnit={setRcResistanceUnit}
                min={0.01}
                description="Charging / discharging path resistance"
              />
              <UnitInput
                id="rc-cap"
                label="Capacitance (C)"
                symbol="C"
                quantity="capacitance"
                value={rcCapacitance}
                unit={rcCapacitanceUnit}
                onChangeValue={setRcCapacitance}
                onChangeUnit={setRcCapacitanceUnit}
                min={1e-12}
                description="Storage capacitor"
              />
              <UnitInput
                id="rc-v"
                label="Step Supply Voltage (V_s)"
                symbol="Vs"
                quantity="voltage"
                value={rcVoltage}
                unit={rcVoltageUnit}
                onChangeValue={setRcVoltage}
                onChangeUnit={setRcVoltageUnit}
                description="Step voltage applied across RC series combination"
              />
            </>
          ) : (
            <>
              <UnitInput
                id="rl-ind"
                label="Series Inductance (L)"
                symbol="L"
                quantity="inductance"
                value={rlInductance}
                unit={rlInductanceUnit}
                onChangeValue={setRlInductance}
                onChangeUnit={setRlInductanceUnit}
                min={1e-9}
                description="Coil inductance"
              />
              <UnitInput
                id="rl-res"
                label="Series Resistance (R)"
                symbol="R"
                quantity="resistance"
                value={rlResistance}
                unit={rlResistanceUnit}
                onChangeValue={setRlResistance}
                onChangeUnit={setRlResistanceUnit}
                min={0.01}
                description="Internal coil + external series resistance"
              />
              <UnitInput
                id="rl-v"
                label="Step Voltage (V_step)"
                symbol="Vs"
                quantity="voltage"
                value={rlVoltage}
                unit={rlVoltageUnit}
                onChangeValue={setRlVoltage}
                onChangeUnit={setRlVoltageUnit}
                description="Applied step excitation voltage"
              />
            </>
          )}
        </div>

        {/* Transient Response Curve Visualizer */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
              <Activity className="w-3.5 h-3.5" />
              Transient Response Curve (0 to 5τ)
            </span>
            <span className="text-[10px] text-slate-500">
              {circuitType === 'rc' ? 'v(t) = Vs(1 - e^(-t/τ))' : 'i(t) = (Vs/R)(1 - e^(-t/τ))'}
            </span>
          </div>

          <div className="w-full flex flex-col items-center justify-center">
            <svg viewBox="0 0 320 160" className="w-full h-auto select-none">
              {/* Grid Lines */}
              <line x1="20" y1="140" x2="300" y2="140" stroke="#334155" strokeWidth="1.5" />
              <line x1="20" y1="20" x2="20" y2="140" stroke="#334155" strokeWidth="1.5" />

              {/* 1 Tau, 2 Tau, 3 Tau, 4 Tau, 5 Tau ticks */}
              {[1, 2, 3, 4, 5].map((mult) => {
                const x = 20 + (mult / 5) * 280;
                return (
                  <g key={mult}>
                    <line x1={x} y1="20" x2={x} y2="140" stroke="#1e293b" strokeDasharray="3 3" />
                    <text x={x} y="152" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      {mult}τ
                    </text>
                  </g>
                );
              })}

              {/* 63.2% (1 tau) guide line */}
              <line x1="20" y1={140 - 0.632 * 120} x2="300" y2={140 - 0.632 * 120} stroke="#f59e0b" strokeDasharray="2 2" opacity="0.6" />
              <text x="25" y={135 - 0.632 * 120} fill="#f59e0b" fontSize="8" fontFamily="monospace">
                63.2% (1τ)
              </text>

              {/* 99.3% (5 tau) guide line */}
              <line x1="20" y1={140 - 0.993 * 120} x2="300" y2={140 - 0.993 * 120} stroke="#10b981" strokeDasharray="2 2" opacity="0.6" />
              <text x="25" y={135 - 0.993 * 120} fill="#10b981" fontSize="8" fontFamily="monospace">
                99.3% Steady-State (5τ)
              </text>

              {/* Transient Curve */}
              {svgPath && (
                <path d={svgPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              )}
            </svg>
          </div>

          {/* Key Milestones Grid */}
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 text-center">
              <span className="text-slate-400 block text-[10px]">1τ (63.2%)</span>
              <span className="text-cyan-400 font-bold">{result.formattedValue}</span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 text-center">
              <span className="text-slate-400 block text-[10px]">3τ (95.0%)</span>
              <span className="text-amber-400 font-bold">{(3 * tau).toExponential(3)} s</span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60 text-center">
              <span className="text-slate-400 block text-[10px]">5τ (99.3%)</span>
              <span className="text-emerald-400 font-bold">{result.additionalOutputs?.timeTo993?.value || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
