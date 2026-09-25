import React, { useState, useMemo } from 'react';
import {
  calculateResistorImpedance,
  calculateCapacitorImpedance,
  calculateInductorImpedance,
  calculateRlcImpedance,
} from '../../engines/circuit/impedance';
import {
  convertPhasor,
  performPhasorArithmetic,
  Phasor,
} from '../../engines/rf/phasor-signals';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Waves, Disc, Activity, Compass, Calculator } from 'lucide-react';

export const AcImpedanceTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'components' | 'converter' | 'arithmetic'>('components');

  // Tab 1: Components
  const [componentType, setComponentType] = useState<'rlc-series' | 'rlc-parallel' | 'capacitor' | 'inductor' | 'resistor'>('rlc-series');
  const [frequency, setFrequency] = useState<number>(1.0);
  const [frequencyUnit, setFrequencyUnit] = useState<string>('kHz');
  const [resistance, setResistance] = useState<number>(100);
  const [resistanceUnit, setResistanceUnit] = useState<string>('Ω');
  const [capacitance, setCapacitance] = useState<number>(1.0);
  const [capacitanceUnit, setCapacitanceUnit] = useState<string>('µF');
  const [inductance, setInductance] = useState<number>(10);
  const [inductanceUnit, setInductanceUnit] = useState<string>('mH');

  const f = toBaseUnit(frequency, 'frequency', frequencyUnit);
  const R = toBaseUnit(resistance, 'resistance', resistanceUnit);
  const C = toBaseUnit(capacitance, 'capacitance', capacitanceUnit);
  const L = toBaseUnit(inductance, 'inductance', inductanceUnit);

  const result = useMemo(() => {
    switch (componentType) {
      case 'resistor':
        return calculateResistorImpedance({ resistance: R });
      case 'capacitor':
        return calculateCapacitorImpedance({ capacitance: C, frequency: f });
      case 'inductor':
        return calculateInductorImpedance({ inductance: L, frequency: f });
      case 'rlc-parallel':
        return calculateRlcImpedance({
          resistance: R,
          inductance: L,
          capacitance: C,
          frequency: f,
          topology: 'parallel',
        });
      case 'rlc-series':
      default:
        return calculateRlcImpedance({
          resistance: R,
          inductance: L,
          capacitance: C,
          frequency: f,
          topology: 'series',
        });
    }
  }, [componentType, f, R, C, L]);

  // Tab 2: Phasor Converter
  const [convMode, setConvMode] = useState<'to_polar' | 'to_rect'>('to_polar');
  const [realInput, setRealInput] = useState<number>(40);
  const [imagInput, setImagInput] = useState<number>(30);
  const [magInput, setMagInput] = useState<number>(50);
  const [angleInput, setAngleInput] = useState<number>(36.87);

  const convResult = useMemo(() => {
    return convertPhasor({
      mode: convMode,
      real: realInput,
      imag: imagInput,
      magnitude: magInput,
      angleDeg: angleInput,
    });
  }, [convMode, realInput, imagInput, magInput, angleInput]);

  // Tab 3: Phasor Arithmetic
  const [op, setOp] = useState<'+' | '-' | '*' | '/'>('+');
  const [z1Real, setZ1Real] = useState<number>(10);
  const [z1Imag, setZ1Imag] = useState<number>(15);
  const [z2Real, setZ2Real] = useState<number>(5);
  const [z2Imag, setZ2Imag] = useState<number>(-8);

  const p1: Phasor = useMemo(() => {
    const mag = Math.sqrt(z1Real * z1Real + z1Imag * z1Imag);
    const rad = Math.atan2(z1Imag, z1Real);
    return { real: z1Real, imag: z1Imag, magnitude: mag, angleDeg: rad * (180 / Math.PI), angleRad: rad };
  }, [z1Real, z1Imag]);

  const p2: Phasor = useMemo(() => {
    const mag = Math.sqrt(z2Real * z2Real + z2Imag * z2Imag);
    const rad = Math.atan2(z2Imag, z2Real);
    return { real: z2Real, imag: z2Imag, magnitude: mag, angleDeg: rad * (180 / Math.PI), angleRad: rad };
  }, [z2Real, z2Imag]);

  const arithResult = useMemo(() => {
    return performPhasorArithmetic(p1, p2, op);
  }, [p1, p2, op]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('components')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'components'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          Component &amp; RLC Impedance (Z = R + jX)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('converter')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'converter'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Phasor Converter (Rectangular ↔ Polar)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('arithmetic')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'arithmetic'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          Phasor Arithmetic (Z₁ ± × ÷ Z₂)
        </button>
      </div>

      {/* TAB 1: COMPONENT IMPEDANCE */}
      {activeTab === 'components' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setComponentType('rlc-series')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                componentType === 'rlc-series'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Series RLC
            </button>
            <button
              type="button"
              onClick={() => setComponentType('rlc-parallel')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                componentType === 'rlc-parallel'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Parallel RLC
            </button>
            <button
              type="button"
              onClick={() => setComponentType('capacitor')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                componentType === 'capacitor'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Capacitor (X_C)
            </button>
            <button
              type="button"
              onClick={() => setComponentType('inductor')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                componentType === 'inductor'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inductor (X_L)
            </button>
            <button
              type="button"
              onClick={() => setComponentType('resistor')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                componentType === 'resistor'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resistor (R)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Circuit Inputs</span>

              {componentType !== 'resistor' && (
                <UnitInput
                  id="ac-freq"
                  label="AC Signal Frequency (f)"
                  symbol="f"
                  quantity="frequency"
                  value={frequency}
                  unit={frequencyUnit}
                  onChangeValue={setFrequency}
                  onChangeUnit={setFrequencyUnit}
                  min={0.001}
                />
              )}

              {(componentType === 'resistor' || componentType.startsWith('rlc')) && (
                <UnitInput
                  id="ac-res"
                  label="Resistance (R)"
                  symbol="R"
                  quantity="resistance"
                  value={resistance}
                  unit={resistanceUnit}
                  onChangeValue={setResistance}
                  onChangeUnit={setResistanceUnit}
                  min={0}
                />
              )}

              {(componentType === 'capacitor' || componentType.startsWith('rlc')) && (
                <UnitInput
                  id="ac-cap"
                  label="Capacitance (C)"
                  symbol="C"
                  quantity="capacitance"
                  value={capacitance}
                  unit={capacitanceUnit}
                  onChangeValue={setCapacitance}
                  onChangeUnit={setCapacitanceUnit}
                  min={0.000001}
                />
              )}

              {(componentType === 'inductor' || componentType.startsWith('rlc')) && (
                <UnitInput
                  id="ac-ind"
                  label="Inductance (L)"
                  symbol="L"
                  quantity="inductance"
                  value={inductance}
                  unit={inductanceUnit}
                  onChangeValue={setInductance}
                  onChangeUnit={setInductanceUnit}
                  min={0.000001}
                />
              )}
            </div>

            {/* Visual Vector on Complex Plane */}
            <div className="lg:col-span-6 flex flex-col bg-slate-900/50 p-5 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                Complex Plane Phasor Diagram
              </span>

              <div className="w-full h-48 bg-slate-950 rounded-lg p-2 relative flex items-center justify-center border border-slate-800">
                <svg viewBox="-100 -100 200 200" className="w-full h-full">
                  {/* Axes */}
                  <line x1="-90" y1="0" x2="90" y2="0" stroke="#334155" strokeWidth="1" />
                  <line x1="0" y1="-90" x2="0" y2="90" stroke="#334155" strokeWidth="1" />

                  {/* Axis Labels */}
                  <text x="80" y="-5" fill="#64748b" fontSize="8" fontFamily="monospace">+Re (R)</text>
                  <text x="5" y="-80" fill="#64748b" fontSize="8" fontFamily="monospace">+j Im (X_L)</text>
                  <text x="5" y="85" fill="#64748b" fontSize="8" fontFamily="monospace">-j Im (X_C)</text>

                  {/* Impedance Vector */}
                  {(() => {
                    const real = result.visualData?.real ?? 10;
                    const imag = result.visualData?.imag ?? 0;
                    const mag = Math.sqrt(real * real + imag * imag) || 1;
                    const scale = 75 / mag;
                    const vx = real * scale;
                    const vy = -imag * scale; // Inverted SVG Y axis

                    return (
                      <>
                        <line x1="0" y1="0" x2={vx} y2={vy} stroke="#06b6d4" strokeWidth="2.5" markerEnd="url(#arrow)" />
                        <circle cx={vx} cy={vy} r="3.5" fill="#06b6d4" />
                        <text x={vx + 6} y={vy - 4} fill="#06b6d4" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          Z
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="mt-3 flex justify-between text-xs font-mono text-slate-400">
                <span>Phase: {result.additionalOutputs?.phase?.value ?? '0°'}</span>
                <span>Power Factor: {result.additionalOutputs?.powerFactor?.value ?? '1.0'}</span>
              </div>
            </div>
          </div>

          <ResultCard result={result} />
          <StepExplanation steps={result.steps} />
        </div>
      )}

      {/* TAB 2: PHASOR CONVERTER */}
      {activeTab === 'converter' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Phasor Transformation</h3>

            <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setConvMode('to_polar')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  convMode === 'to_polar'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rectangular → Polar
              </button>
              <button
                type="button"
                onClick={() => setConvMode('to_rect')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  convMode === 'to_rect'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Polar → Rectangular
              </button>
            </div>

            {convMode === 'to_polar' ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Real Part (R or X_re)</label>
                  <input
                    type="number"
                    step="any"
                    value={realInput}
                    onChange={(e) => setRealInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Imaginary Part (X or X_im)</label>
                  <input
                    type="number"
                    step="any"
                    value={imagInput}
                    onChange={(e) => setImagInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Magnitude (|Z| or r)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={magInput}
                    onChange={(e) => setMagInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Angle (θ, Degrees)</label>
                  <input
                    type="number"
                    step="any"
                    value={angleInput}
                    onChange={(e) => setAngleInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Polar Form (r ∠ θ)</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {convResult.magnitude.toFixed(3)} ∠ {convResult.angleDeg.toFixed(2)}°
              </div>
              <span className="text-xs font-mono text-slate-400">
                Angle in Radians: {convResult.angleRad.toFixed(4)} rad
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Ideal for multiplication and division of AC phasors.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rectangular Form (a + jb)</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {convResult.real.toFixed(3)} {convResult.imag >= 0 ? `+ j${convResult.imag.toFixed(3)}` : `- j${Math.abs(convResult.imag).toFixed(3)}`}
              </div>
              <span className="text-xs font-mono text-slate-400">
                Euler: {convResult.magnitude.toFixed(3)} · e^(j·{convResult.angleDeg.toFixed(1)}°)
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Ideal for addition and subtraction of impedances and voltages.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PHASOR ARITHMETIC */}
      {activeTab === 'arithmetic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Phasor Operands</h3>

            {/* Z1 */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950/40">
              <span className="text-[11px] font-bold text-cyan-400 uppercase">Phasor Z₁ (a₁ + jb₁)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">Real (a₁)</label>
                  <input
                    type="number"
                    value={z1Real}
                    onChange={(e) => setZ1Real(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Imag (b₁)</label>
                  <input
                    type="number"
                    value={z1Imag}
                    onChange={(e) => setZ1Imag(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Polar: {p1.magnitude.toFixed(2)} ∠ {p1.angleDeg.toFixed(1)}°
              </span>
            </div>

            {/* Operator */}
            <div className="flex justify-center gap-2">
              {(['+', '-', '*', '/'] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOp(o)}
                  className={`w-10 h-8 rounded-lg font-bold font-mono text-sm border cursor-pointer transition-all ${
                    op === o
                      ? 'border-cyan-400 bg-cyan-950 text-cyan-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>

            {/* Z2 */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950/40">
              <span className="text-[11px] font-bold text-amber-400 uppercase">Phasor Z₂ (a₂ + jb₂)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">Real (a₂)</label>
                  <input
                    type="number"
                    value={z2Real}
                    onChange={(e) => setZ2Real(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Imag (b₂)</label>
                  <input
                    type="number"
                    value={z2Imag}
                    onChange={(e) => setZ2Imag(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Polar: {p2.magnitude.toFixed(2)} ∠ {p2.angleDeg.toFixed(1)}°
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Arithmetic Result (Z₁ {op} Z₂)
              </span>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {arithResult.result.magnitude.toFixed(3)} ∠ {arithResult.result.angleDeg.toFixed(2)}°
              </div>
              <div className="text-sm font-mono text-slate-300">
                = {arithResult.result.real.toFixed(3)} {arithResult.result.imag >= 0 ? `+ j${arithResult.result.imag.toFixed(3)}` : `- j${Math.abs(arithResult.result.imag).toFixed(3)}`}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-xs font-mono text-slate-400 flex flex-col gap-1.5">
              <span className="text-cyan-400 font-bold">Calculation Steps:</span>
              <div>{arithResult.explanation}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
