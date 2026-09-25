import React, { useState, useMemo } from 'react';
import {
  bisectionMethod,
  newtonRaphsonMethod,
  secantMethod,
  RootFindingResult,
} from '../../engines/math/root-finding';
import { MathFunction } from '../../engines/math/calculus';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Target, Table, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface EquationPreset {
  id: string;
  name: string;
  latex: string;
  fn: MathFunction;
  dfn?: MathFunction;
  suggestedA: number;
  suggestedB: number;
  suggestedX0: number;
}

const EQUATION_PRESETS: EquationPreset[] = [
  {
    id: 'diode',
    name: 'Shockley Diode Operating Point: 10 - 1000·(1e-12·(e^(40x) - 1)) - x = 0',
    latex: 'V_{in} - I_s(e^{V_d/V_t} - 1)R - V_d = 0',
    fn: (x) => 10 - 1000 * 1e-9 * (Math.exp(Math.min(40, 20 * x)) - 1) - x,
    suggestedA: 0.1,
    suggestedB: 1.0,
    suggestedX0: 0.5,
  },
  {
    id: 'cubic',
    name: 'Cubic Equation: x³ - 2x - 5 = 0',
    latex: 'x^3 - 2x - 5 = 0',
    fn: (x) => x * x * x - 2 * x - 5,
    dfn: (x) => 3 * x * x - 2,
    suggestedA: 1,
    suggestedB: 3,
    suggestedX0: 2,
  },
  {
    id: 'transcendental',
    name: 'Transcendental: cos(x) - x = 0',
    latex: '\\cos(x) - x = 0',
    fn: (x) => Math.cos(x) - x,
    dfn: (x) => -Math.sin(x) - 1,
    suggestedA: 0,
    suggestedB: 1,
    suggestedX0: 0.5,
  },
  {
    id: 'decay_zero',
    name: 'Exponential: e^(−x) - x/2 = 0',
    latex: 'e^{-x} - \\frac{x}{2} = 0',
    fn: (x) => Math.exp(-x) - x / 2,
    dfn: (x) => -Math.exp(-x) - 0.5,
    suggestedA: 0,
    suggestedB: 2,
    suggestedX0: 1,
  },
];

export function RootFindingTool() {
  const [selectedEqId, setSelectedEqId] = useState<string>('cubic');
  const activeEq = useMemo(
    () => EQUATION_PRESETS.find((e) => e.id === selectedEqId) || EQUATION_PRESETS[0],
    [selectedEqId]
  );

  const [method, setMethod] = useState<'bisection' | 'newton' | 'secant'>('newton');

  // Parameters
  const [bracketA, setBracketA] = useState<number>(activeEq.suggestedA);
  const [bracketB, setBracketB] = useState<number>(activeEq.suggestedB);
  const [initX0, setInitX0] = useState<number>(activeEq.suggestedX0);
  const [initX1, setInitX1] = useState<number>(activeEq.suggestedX0 + 0.5);
  const [tolerance, setTolerance] = useState<number>(1e-7);
  const [maxIter, setMaxIter] = useState<number>(50);

  // Sync defaults when equation changes
  const handleSelectEquation = (eq: EquationPreset) => {
    setSelectedEqId(eq.id);
    setBracketA(eq.suggestedA);
    setBracketB(eq.suggestedB);
    setInitX0(eq.suggestedX0);
    setInitX1(eq.suggestedX0 + 0.5);
  };

  // Solve
  const solveResult: RootFindingResult = useMemo(() => {
    if (method === 'bisection') {
      return bisectionMethod(activeEq.fn, bracketA, bracketB, { tolerance, maxIterations: maxIter });
    }
    if (method === 'newton') {
      return newtonRaphsonMethod(activeEq.fn, initX0, {
        derivativeFn: activeEq.dfn,
        tolerance,
        maxIterations: maxIter,
      });
    }
    // Secant
    return secantMethod(activeEq.fn, initX0, initX1, { tolerance, maxIterations: maxIter });
  }, [activeEq, method, bracketA, bracketB, initX0, initX1, tolerance, maxIter]);

  return (
    <div className="space-y-6">
      {/* Preset Equation Selector */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
          Target Nonlinear Equation f(x) = 0
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EQUATION_PRESETS.map((eq) => (
            <button
              key={eq.id}
              type="button"
              onClick={() => handleSelectEquation(eq)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedEqId === eq.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-mono font-bold truncate">{eq.name}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{eq.latex}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Solver Controls & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Solver Method & Bounds</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['bisection', 'newton', 'secant'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`py-1.5 text-xs font-mono capitalize rounded border transition-all ${
                  method === m
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {m === 'newton' ? 'Newton' : m}
              </button>
            ))}
          </div>

          {method === 'bisection' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Bracket Lower [a]</label>
                <input
                  type="number"
                  step="any"
                  value={bracketA}
                  onChange={(e) => setBracketA(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Bracket Upper [b]</label>
                <input
                  type="number"
                  step="any"
                  value={bracketB}
                  onChange={(e) => setBracketB(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
            </div>
          ) : method === 'newton' ? (
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Initial Guess (x₀)</label>
              <input
                type="number"
                step="any"
                value={initX0}
                onChange={(e) => setInitX0(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">First Guess (x₀)</label>
                <input
                  type="number"
                  step="any"
                  value={initX0}
                  onChange={(e) => setInitX0(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Second Guess (x₁)</label>
                <input
                  type="number"
                  step="any"
                  value={initX1}
                  onChange={(e) => setInitX1(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Tolerance (ε)</label>
              <input
                type="number"
                step="any"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value) || 1e-7)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Max Iterations</label>
              <input
                type="number"
                value={maxIter}
                onChange={(e) => setMaxIter(parseInt(e.target.value, 10) || 50)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
          </div>
        </div>

        {/* Results & Status */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard
              label="Computed Root (x*)"
              value={solveResult.root !== null ? solveResult.root.toFixed(7) : 'Not Found'}
              subtext={`Final Residual |f(x*)| = ${solveResult.finalResidual.toExponential(3)}`}
              classification="THEORETICAL"
            />
            <ResultCard
              label="Convergence Status"
              value={solveResult.converged ? 'CONVERGED' : solveResult.status.toUpperCase()}
              subtext={`${solveResult.iterationsCount} iterations | Rate: ${solveResult.convergenceRateEstimated || 'N/A'}`}
              classification="THEORETICAL"
            />
          </div>

          {solveResult.status === 'bracket_invalid' && (
            <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-200">{solveResult.message}</p>
            </div>
          )}

          {solveResult.steps.length > 0 && <CalculationStepViewer steps={solveResult.steps} />}

          {/* Iteration History Table */}
          {solveResult.history.length > 0 && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-cyan-400" />
                  Iteration Convergence Log ({solveResult.history.length} steps)
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-[11px] font-mono text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2">Iter</th>
                      <th className="p-2">xₙ</th>
                      <th className="p-2">f(xₙ)</th>
                      <th className="p-2">Step Δ</th>
                      <th className="p-2">Residual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {solveResult.history.map((rec) => (
                      <tr key={rec.iteration} className="hover:bg-slate-800/30">
                        <td className="p-2 text-slate-400">#{rec.iteration}</td>
                        <td className="p-2 text-cyan-300">{rec.xCurrent.toFixed(6)}</td>
                        <td className="p-2">{rec.fxCurrent.toExponential(3)}</td>
                        <td className="p-2 text-slate-400">{rec.stepDelta.toExponential(2)}</td>
                        <td className="p-2 text-emerald-400">{rec.residual.toExponential(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
