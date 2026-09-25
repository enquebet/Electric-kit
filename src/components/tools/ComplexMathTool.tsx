import React, { useState, useMemo } from 'react';
import {
  ComplexNumber,
  complexAdd,
  complexSub,
  complexMul,
  complexDiv,
  complexMagnitude,
  complexPhase,
  complexConjugate,
  complexPower,
  complexSqrt,
  toEulerForm,
  formatComplex,
  rectangularToPolar,
  polarToRectangular,
} from '../../engines/math/complex';
import { ResultCard } from '../common/ResultCard';
import { Compass, RotateCw, Activity, Layers } from 'lucide-react';

export function ComplexMathTool() {
  const [activeTab, setActiveTab] = useState<'arithmetic' | 'converter' | 'powers_euler'>('arithmetic');

  // Arithmetic State: Z1 and Z2
  const [r1, setR1] = useState<number>(4);
  const [i1, setI1] = useState<number>(3);
  const [r2, setR2] = useState<number>(1);
  const [i2, setI2] = useState<number>(-2);
  const [op, setOp] = useState<'+' | '-' | '*' | '/'>('+');

  // Converter State
  const [convMode, setConvMode] = useState<'rect_to_polar' | 'polar_to_rect'>('rect_to_polar');
  const [rectReal, setRectReal] = useState<number>(50);
  const [rectImag, setRectImag] = useState<number>(25);
  const [polarMag, setPolarMag] = useState<number>(120);
  const [polarAngleDeg, setPolarAngleDeg] = useState<number>(45);

  // Power & Euler State
  const [zReal, setZReal] = useState<number>(3);
  const [zImag, setZImag] = useState<number>(4);
  const [powerExponent, setPowerExponent] = useState<number>(3);

  // Arithmetic Calculations
  const z1: ComplexNumber = useMemo(() => ({ real: r1, imag: i1 }), [r1, i1]);
  const z2: ComplexNumber = useMemo(() => ({ real: r2, imag: i2 }), [r2, i2]);

  const arithResult = useMemo(() => {
    try {
      if (op === '+') return { res: complexAdd(z1, z2), error: null };
      if (op === '-') return { res: complexSub(z1, z2), error: null };
      if (op === '*') return { res: complexMul(z1, z2), error: null };
      if (op === '/') return { res: complexDiv(z1, z2), error: null };
      return { res: z1, error: null };
    } catch (err: any) {
      return { res: null, error: err.message || 'Arithmetic error' };
    }
  }, [z1, z2, op]);

  // Converter Calculations
  const polarFromRect = useMemo(() => rectangularToPolar(rectReal, rectImag), [rectReal, rectImag]);
  const rectFromPolar = useMemo(() => polarToRectangular(polarMag, polarAngleDeg), [polarMag, polarAngleDeg]);

  // Power & Euler Calculations
  const zBase: ComplexNumber = useMemo(() => ({ real: zReal, imag: zImag }), [zReal, zImag]);
  const zPowered = useMemo(() => complexPower(zBase, powerExponent), [zBase, powerExponent]);
  const zSqrt = useMemo(() => complexSqrt(zBase), [zBase]);
  const zEuler = useMemo(() => toEulerForm(zBase), [zBase]);
  const zConj = useMemo(() => complexConjugate(zBase), [zBase]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('arithmetic')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'arithmetic'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Complex Arithmetic (+, −, ×, ÷)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('converter')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'converter'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          Polar ↔ Rectangular Converter
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('powers_euler')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'powers_euler'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Powers, Roots & Euler Form
        </button>
      </div>

      {/* 1. Arithmetic Tab */}
      {activeTab === 'arithmetic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Operands (Z₁ and Z₂)</h3>
            {/* Z1 */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400">Operand Z₁ = R₁ + jX₁</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400">Real (R₁)</label>
                  <input
                    type="number"
                    step="any"
                    value={r1}
                    onChange={(e) => setR1(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">Imag (X₁)</label>
                  <input
                    type="number"
                    step="any"
                    value={i1}
                    onChange={(e) => setI1(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                  />
                </div>
              </div>
            </div>

            {/* Operator Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Operation</label>
              <div className="grid grid-cols-4 gap-2">
                {(['+', '-', '*', '/'] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOp(o)}
                    className={`py-1.5 text-xs font-mono font-bold rounded border transition-all ${
                      op === o
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {o === '*' ? '× (Mul)' : o === '/' ? '÷ (Div)' : o}
                  </button>
                ))}
              </div>
            </div>

            {/* Z2 */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <span className="text-xs font-mono font-bold text-indigo-400">Operand Z₂ = R₂ + jX₂</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400">Real (R₂)</label>
                  <input
                    type="number"
                    step="any"
                    value={r2}
                    onChange={(e) => setR2(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">Imag (X₂)</label>
                  <input
                    type="number"
                    step="any"
                    value={i2}
                    onChange={(e) => setI2(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-indigo-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {arithResult.error ? (
              <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
                {arithResult.error}
              </div>
            ) : arithResult.res ? (
              <>
                <ResultCard
                  label={`Z₁ ${op} Z₂ (Rectangular Form)`}
                  value={formatComplex(arithResult.res)}
                  subtext={`Real: ${arithResult.res.real.toFixed(4)}, Imag: ${arithResult.res.imag.toFixed(4)}`}
                  classification="THEORETICAL"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    label="Magnitude |Z|"
                    value={complexMagnitude(arithResult.res).toFixed(4)}
                    subtext="Hypotenuse: √(R² + X²)"
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Phase Angle θ"
                    value={`${complexPhase(arithResult.res, true).toFixed(2)}°`}
                    subtext={`${complexPhase(arithResult.res, false).toFixed(4)} rad`}
                    classification="THEORETICAL"
                  />
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                    Phasor & Polar Representation:
                  </span>
                  <p className="text-xs font-mono text-cyan-300">
                    {complexMagnitude(arithResult.res).toFixed(4)} ∠ {complexPhase(arithResult.res, true).toFixed(2)}°
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Conjugate Z* = {formatComplex(complexConjugate(arithResult.res))}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 2. Converter Tab */}
      {activeTab === 'converter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Coordinate Transform</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConvMode('rect_to_polar')}
                className={`py-1.5 px-3 text-xs font-mono rounded border transition-all ${
                  convMode === 'rect_to_polar'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Rectangular → Polar
              </button>
              <button
                type="button"
                onClick={() => setConvMode('polar_to_rect')}
                className={`py-1.5 px-3 text-xs font-mono rounded border transition-all ${
                  convMode === 'polar_to_rect'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Polar → Rectangular
              </button>
            </div>

            {convMode === 'rect_to_polar' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Real Component R</label>
                  <input
                    type="number"
                    step="any"
                    value={rectReal}
                    onChange={(e) => setRectReal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Imaginary Component X</label>
                  <input
                    type="number"
                    step="any"
                    value={rectImag}
                    onChange={(e) => setRectImag(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Magnitude |Z|</label>
                  <input
                    type="number"
                    step="any"
                    value={polarMag}
                    onChange={(e) => setPolarMag(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Phase Angle θ (Degrees)</label>
                  <input
                    type="number"
                    step="any"
                    value={polarAngleDeg}
                    onChange={(e) => setPolarAngleDeg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            {convMode === 'rect_to_polar' ? (
              <>
                <ResultCard
                  label="Polar / Phasor Form"
                  value={`${polarFromRect.magnitude.toFixed(4)} ∠ ${polarFromRect.phaseDeg.toFixed(2)}°`}
                  subtext={`Phase in Radians: ${polarFromRect.phaseRad.toFixed(4)} rad`}
                  classification="THEORETICAL"
                />
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase font-mono">Conversion Formulas</span>
                  <p className="text-xs font-mono text-slate-300">|Z| = √(R² + X²) = √({rectReal}² + {rectImag}²)</p>
                  <p className="text-xs font-mono text-slate-300">θ = atan2(X, R) = atan2({rectImag}, {rectReal})</p>
                </div>
              </>
            ) : (
              <>
                <ResultCard
                  label="Rectangular Form"
                  value={`${rectFromPolar.real.toFixed(4)} ${rectFromPolar.imag >= 0 ? '+' : '−'} j${Math.abs(rectFromPolar.imag).toFixed(4)}`}
                  subtext={`Real: ${rectFromPolar.real.toFixed(4)}, Imag: ${rectFromPolar.imag.toFixed(4)}`}
                  classification="THEORETICAL"
                />
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase font-mono">Euler Expansion Formulas</span>
                  <p className="text-xs font-mono text-slate-300">R = |Z| · cos(θ) = {polarMag} · cos({polarAngleDeg}°)</p>
                  <p className="text-xs font-mono text-slate-300">X = |Z| · sin(θ) = {polarMag} · sin({polarAngleDeg}°)</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Powers & Euler Tab */}
      {activeTab === 'powers_euler' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Base Complex Number z</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Real Component</label>
                <input
                  type="number"
                  step="any"
                  value={zReal}
                  onChange={(e) => setZReal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Imaginary Component</label>
                <input
                  type="number"
                  step="any"
                  value={zImag}
                  onChange={(e) => setZImag(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Power Exponent n</label>
              <input
                type="number"
                step="any"
                value={powerExponent}
                onChange={(e) => setPowerExponent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <ResultCard
              label="Euler Exponential Form"
              value={zEuler.eulerString}
              subtext={`Polar: ${zEuler.polarString}`}
              classification="THEORETICAL"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label={`Power z^${powerExponent} (De Moivre)`}
                value={formatComplex(zPowered)}
                subtext={`Magnitude: ${complexMagnitude(zPowered).toFixed(3)} ∠ ${complexPhase(zPowered).toFixed(1)}°`}
                classification="THEORETICAL"
              />
              <ResultCard
                label="Square Root √z"
                value={formatComplex(zSqrt)}
                subtext={`Magnitude: ${complexMagnitude(zSqrt).toFixed(3)} ∠ ${complexPhase(zSqrt).toFixed(1)}°`}
                classification="THEORETICAL"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
