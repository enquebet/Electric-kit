import React, { useState, useMemo } from 'react';
import {
  numericalDerivative,
  numericalSecondDerivative,
  numericalIntegration,
  MathFunction,
} from '../../engines/math/calculus';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { TrendingUp, Binary, Sliders } from 'lucide-react';

interface FunctionPreset {
  id: string;
  name: string;
  formulaTex: string;
  fn: MathFunction;
  analyticalDeriv?: (x: number) => number;
}

const PRESET_FUNCTIONS: FunctionPreset[] = [
  {
    id: 'sine',
    name: 'Sine Wave: sin(2π · x)',
    formulaTex: 'f(x) = \\sin(2\\pi x)',
    fn: (x) => Math.sin(2 * Math.PI * x),
    analyticalDeriv: (x) => 2 * Math.PI * Math.cos(2 * Math.PI * x),
  },
  {
    id: 'poly',
    name: 'Polynomial: 2x³ − 4x² + 5x − 1',
    formulaTex: 'f(x) = 2x^3 - 4x^2 + 5x - 1',
    fn: (x) => 2 * x * x * x - 4 * x * x + 5 * x - 1,
    analyticalDeriv: (x) => 6 * x * x - 8 * x + 5,
  },
  {
    id: 'exp_decay',
    name: 'Exponential Decay: e^(−2x)',
    formulaTex: 'f(x) = e^{-2x}',
    fn: (x) => Math.exp(-2 * x),
    analyticalDeriv: (x) => -2 * Math.exp(-2 * x),
  },
  {
    id: 'gaussian',
    name: 'Gaussian Pulse: e^(−x²)',
    formulaTex: 'f(x) = e^{-x^2}',
    fn: (x) => Math.exp(-x * x),
    analyticalDeriv: (x) => -2 * x * Math.exp(-x * x),
  },
];

export function CalculusNumericalTool() {
  const [activeTab, setActiveTab] = useState<'derivatives' | 'integration'>('derivatives');

  // Selected Function
  const [selectedFnId, setSelectedFnId] = useState<string>('sine');
  const activeFnPreset = useMemo(
    () => PRESET_FUNCTIONS.find((p) => p.id === selectedFnId) || PRESET_FUNCTIONS[0],
    [selectedFnId]
  );

  // Derivative Inputs
  const [evalX, setEvalX] = useState<number>(0.25);
  const [stepH, setStepH] = useState<number>(1e-4);
  const [diffMethod, setDiffMethod] = useState<'central' | 'forward' | 'backward'>('central');

  // Integration Inputs
  const [boundA, setBoundA] = useState<number>(0);
  const [boundB, setBoundB] = useState<number>(1);
  const [intervalsN, setIntervalsN] = useState<number>(50);
  const [intMethod, setIntMethod] = useState<'simpson' | 'trapezoidal' | 'midpoint'>('simpson');

  // Calculations
  const derivResult = useMemo(
    () => numericalDerivative(activeFnPreset.fn, evalX, stepH, diffMethod),
    [activeFnPreset, evalX, stepH, diffMethod]
  );

  const secondDerivResult = useMemo(
    () => numericalSecondDerivative(activeFnPreset.fn, evalX, stepH),
    [activeFnPreset, evalX, stepH]
  );

  const exactDeriv = useMemo(
    () => (activeFnPreset.analyticalDeriv ? activeFnPreset.analyticalDeriv(evalX) : null),
    [activeFnPreset, evalX]
  );

  const derivError = useMemo(() => {
    if (exactDeriv === null) return null;
    return Math.abs(derivResult.derivative - exactDeriv);
  }, [derivResult, exactDeriv]);

  const intResult = useMemo(
    () => numericalIntegration(activeFnPreset.fn, boundA, boundB, intervalsN, intMethod),
    [activeFnPreset, boundA, boundB, intervalsN, intMethod]
  );

  return (
    <div className="space-y-6">
      {/* Function Preset Selector Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Test Function f(x)
          </span>
          <span className="text-sm font-semibold text-cyan-300 font-mono">
            {activeFnPreset.name}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PRESET_FUNCTIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedFnId(p.id)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
                selectedFnId === p.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('derivatives')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'derivatives'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Numerical Derivatives (1st & 2nd)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('integration')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'integration'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Binary className="w-3.5 h-3.5" />
          Numerical Integration & Quadrature
        </button>
      </div>

      {/* 1. Derivatives Tab */}
      {activeTab === 'derivatives' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Differentiation Parameters</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Evaluation Point x</label>
              <input
                type="number"
                step="any"
                value={evalX}
                onChange={(e) => setEvalX(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Finite Step Size h</label>
              <input
                type="number"
                step="any"
                value={stepH}
                onChange={(e) => setStepH(Math.max(1e-12, parseFloat(e.target.value) || 1e-5))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard precision sweet-spot: 1e-4 to 1e-6 (avoids floating-point subtraction cancellation).
              </span>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Difference Scheme</label>
              <div className="grid grid-cols-3 gap-2">
                {(['central', 'forward', 'backward'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDiffMethod(m)}
                    className={`py-1.5 text-xs font-mono capitalize rounded border transition-all ${
                      diffMethod === m
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label={`First Derivative f'(x) [${derivResult.truncationErrorOrder}]`}
                value={derivResult.derivative.toFixed(6)}
                subtext={
                  exactDeriv !== null
                    ? `Exact closed-form: ${exactDeriv.toFixed(6)} (Error: ${derivError?.toExponential(2)})`
                    : 'Discrete numerical approximation'
                }
                classification="THEORETICAL"
              />
              <ResultCard
                label="Second Derivative f''(x) [O(h²)]"
                value={secondDerivResult.secondDerivative.toFixed(6)}
                subtext="Central difference curvature: (f(x+h) - 2f(x) + f(x-h)) / h²"
                classification="THEORETICAL"
              />
            </div>
            <CalculationStepViewer steps={derivResult.steps} />
          </div>
        </div>
      )}

      {/* 2. Integration Tab */}
      {activeTab === 'integration' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Definite Integral ∫ₐᵇ f(x) dx</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Lower Bound a</label>
                <input
                  type="number"
                  step="any"
                  value={boundA}
                  onChange={(e) => setBoundA(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Upper Bound b</label>
                <input
                  type="number"
                  step="any"
                  value={boundB}
                  onChange={(e) => setBoundB(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Discretization Panels (n): {intervalsN}</label>
              <input
                type="range"
                min="4"
                max="200"
                step="2"
                value={intervalsN}
                onChange={(e) => setIntervalsN(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Quadrature Algorithm</label>
              <div className="grid grid-cols-3 gap-2">
                {(['simpson', 'trapezoidal', 'midpoint'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setIntMethod(m)}
                    className={`py-1.5 text-xs font-mono capitalize rounded border transition-all ${
                      intMethod === m
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {m === 'simpson' ? "Simpson's 1/3" : m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <ResultCard
              label={`Definite Integral Value [${intResult.estimatedOrder}]`}
              value={intResult.integral.toFixed(6)}
              subtext={`Evaluated using ${intResult.intervalsN} panels with step size h = ${intResult.stepSizeH.toFixed(5)}`}
              classification="THEORETICAL"
            />
            <CalculationStepViewer steps={intResult.steps} />
          </div>
        </div>
      )}
    </div>
  );
}
