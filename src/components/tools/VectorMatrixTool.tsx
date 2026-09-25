import React, { useState, useMemo } from 'react';
import {
  vectorMagnitude,
  vectorDirection,
  vectorAdd,
  vectorSub,
  vectorDotProduct,
  vectorCrossProduct,
  vectorProjection,
  vectorUnit,
  angleBetweenVectors,
  Vector3D,
} from '../../engines/math/vectors';
import {
  Matrix,
  matrixAdd,
  matrixSub,
  matrixMul,
  matrixTranspose,
  matrixDeterminant,
  matrixInverse,
  matrixRank,
  solveLinearSystem2x2,
  solveLinearSystem3x3,
} from '../../engines/math/matrices';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { MoveRight, Grid, Cpu } from 'lucide-react';

export function VectorMatrixTool() {
  const [activeTab, setActiveTab] = useState<'vectors' | 'matrices' | 'linear_systems'>('vectors');

  // 1. Vectors State
  const [u3D, setU3D] = useState<Vector3D>([3, 4, 0]);
  const [v3D, setV3D] = useState<Vector3D>([1, 2, 2]);

  // 2. Matrices State
  const [matrixSize, setMatrixSize] = useState<2 | 3>(2);
  const [matA, setMatA] = useState<Matrix>([
    [4, 2],
    [1, 3],
  ]);
  const [matB, setMatB] = useState<Matrix>([
    [1, 0],
    [0, 1],
  ]);
  const [matrixOp, setMatrixOp] = useState<'+' | '-' | '*' | 'inv' | 'det' | 'rank' | 'trans'>('det');

  // 3. Linear Systems State
  const [sysDim, setSysDim] = useState<2 | 3>(2);
  const [sysA2, setSysA2] = useState<Matrix>([
    [2, 1],
    [1, 3],
  ]);
  const [sysB2, setSysB2] = useState<number[]>([8, 14]);

  const [sysA3, setSysA3] = useState<Matrix>([
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2],
  ]);
  const [sysB3, setSysB3] = useState<number[]>([8, -11, -3]);

  // Vector Calculations
  const magU = useMemo(() => vectorMagnitude(u3D), [u3D]);
  const magV = useMemo(() => vectorMagnitude(v3D), [v3D]);
  const dirU = useMemo(() => vectorDirection(u3D), [u3D]);
  const dotUV = useMemo(() => vectorDotProduct(u3D, v3D), [u3D, v3D]);
  const crossUV = useMemo(() => vectorCrossProduct(u3D, v3D), [u3D, v3D]);
  const projUV = useMemo(() => {
    try {
      return vectorProjection(u3D, v3D);
    } catch {
      return null;
    }
  }, [u3D, v3D]);
  const angleUV = useMemo(() => {
    try {
      return angleBetweenVectors(u3D, v3D);
    } catch {
      return null;
    }
  }, [u3D, v3D]);

  // Matrix Calculations
  const detA = useMemo(() => matrixDeterminant(matA), [matA]);
  const invA = useMemo(() => matrixInverse(matA), [matA]);
  const rankA = useMemo(() => matrixRank(matA), [matA]);
  const transA = useMemo(() => matrixTranspose(matA), [matA]);
  const addAB = useMemo(() => {
    try {
      return matrixAdd(matA, matB);
    } catch {
      return null;
    }
  }, [matA, matB]);
  const mulAB = useMemo(() => {
    try {
      return matrixMul(matA, matB);
    } catch {
      return null;
    }
  }, [matA, matB]);

  // System Solvers
  const sol2x2 = useMemo(() => solveLinearSystem2x2(sysA2, sysB2), [sysA2, sysB2]);
  const sol3x3 = useMemo(() => solveLinearSystem3x3(sysA3, sysB3), [sysA3, sysB3]);

  const updateMatrixSize = (size: 2 | 3) => {
    setMatrixSize(size);
    if (size === 2) {
      setMatA([
        [4, 2],
        [1, 3],
      ]);
      setMatB([
        [1, 0],
        [0, 1],
      ]);
    } else {
      setMatA([
        [2, 1, 0],
        [1, 3, 2],
        [0, 1, 4],
      ]);
      setMatB([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('vectors')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'vectors'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoveRight className="w-3.5 h-3.5" />
          Vectors (2D / 3D)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('matrices')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'matrices'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          Matrix Algebra & Inversion
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('linear_systems')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'linear_systems'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Linear System Solvers (2×2, 3×3)
        </button>
      </div>

      {/* 1. Vectors Tab */}
      {activeTab === 'vectors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Vector Inputs (u and v in ℝ³)</h3>
            {/* Vector u */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400">Vector u = [ux, uy, uz]</span>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="number"
                    step="any"
                    value={u3D[idx]}
                    onChange={(e) => {
                      const next = [...u3D] as Vector3D;
                      next[idx] = parseFloat(e.target.value) || 0;
                      setU3D(next);
                    }}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300 text-center"
                  />
                ))}
              </div>
            </div>

            {/* Vector v */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <span className="text-xs font-mono font-bold text-indigo-400">Vector v = [vx, vy, vz]</span>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="number"
                    step="any"
                    value={v3D[idx]}
                    onChange={(e) => {
                      const next = [...v3D] as Vector3D;
                      next[idx] = parseFloat(e.target.value) || 0;
                      setV3D(next);
                    }}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-indigo-300 text-center"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Dot Product (u · v)"
                value={dotUV.toFixed(4)}
                subtext={angleUV ? `Angle between: ${angleUV.angleDeg.toFixed(2)}° (${angleUV.angleRad.toFixed(4)} rad)` : 'Scalar inner product'}
                classification="THEORETICAL"
              />
              <ResultCard
                label="Cross Product (u × v)"
                value={`[${crossUV.map((c) => c.toFixed(2)).join(', ')}]`}
                subtext={`Orthogonal vector magnitude: ${vectorMagnitude(crossUV).toFixed(3)}`}
                classification="THEORETICAL"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Magnitude |u|"
                value={magU.toFixed(4)}
                subtext={`Unit vector: [${dirU.unitVector.map((c) => c.toFixed(3)).join(', ')}]`}
                classification="THEORETICAL"
              />
              <ResultCard
                label="Magnitude |v|"
                value={magV.toFixed(4)}
                subtext={projUV ? `Proj_v(u): [${projUV.projectedVector.map((c) => c.toFixed(2)).join(', ')}]` : 'Projection'}
                classification="THEORETICAL"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Matrices Tab */}
      {activeTab === 'matrices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Matrix Editor</h3>
              <div className="flex gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => updateMatrixSize(2)}
                  className={`px-2 py-0.5 text-xs font-mono rounded ${
                    matrixSize === 2 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  2×2
                </button>
                <button
                  type="button"
                  onClick={() => updateMatrixSize(3)}
                  className={`px-2 py-0.5 text-xs font-mono rounded ${
                    matrixSize === 3 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  3×3
                </button>
              </div>
            </div>

            {/* Matrix A Inputs */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-cyan-400">Matrix A</span>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 1fr))` }}
              >
                {matA.map((row, r) =>
                  row.map((val, c) => (
                    <input
                      key={`${r}-${c}`}
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => {
                        const next = matA.map((rw) => [...rw]);
                        next[r][c] = parseFloat(e.target.value) || 0;
                        setMatA(next);
                      }}
                      className="px-2 py-2 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono text-cyan-300"
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Determinant det(A)"
                value={detA.toFixed(4)}
                subtext={Math.abs(detA) < 1e-12 ? 'Matrix is Singular (det = 0)' : 'Non-singular (Invertible)'}
                classification="THEORETICAL"
              />
              <ResultCard
                label="Matrix Rank"
                value={`${rankA} / ${matrixSize}`}
                subtext={rankA === matrixSize ? 'Full Rank' : 'Rank Deficient'}
                classification="THEORETICAL"
              />
            </div>

            {invA.isInvertible && invA.inverse ? (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                  Inverse Matrix A⁻¹:
                </span>
                <div
                  className="grid gap-2 max-w-sm mt-2"
                  style={{ gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 1fr))` }}
                >
                  {invA.inverse.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`${r}-${c}`}
                        className="p-2 bg-slate-950 border border-slate-800 rounded text-center text-xs font-mono text-emerald-400"
                      >
                        {val.toFixed(3)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-950/30 border border-amber-800 rounded-xl text-xs text-amber-300">
                {invA.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Linear Systems Tab */}
      {activeTab === 'linear_systems' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">System Ax = b</h3>
              <div className="flex gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSysDim(2)}
                  className={`px-2 py-0.5 text-xs font-mono rounded ${
                    sysDim === 2 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  2 Equations
                </button>
                <button
                  type="button"
                  onClick={() => setSysDim(3)}
                  className={`px-2 py-0.5 text-xs font-mono rounded ${
                    sysDim === 3 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  3 Equations
                </button>
              </div>
            </div>

            {sysDim === 2 ? (
              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-400">[a₁₁·x₁ + a₁₂·x₂ = b₁]</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={sysA2[0][0]}
                    onChange={(e) => {
                      const next = [...sysA2];
                      next[0][0] = parseFloat(e.target.value) || 0;
                      setSysA2(next);
                    }}
                    className="p-1.5 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono text-cyan-300"
                  />
                  <input
                    type="number"
                    value={sysA2[0][1]}
                    onChange={(e) => {
                      const next = [...sysA2];
                      next[0][1] = parseFloat(e.target.value) || 0;
                      setSysA2(next);
                    }}
                    className="p-1.5 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono text-cyan-300"
                  />
                  <input
                    type="number"
                    value={sysB2[0]}
                    onChange={(e) => {
                      const next = [...sysB2];
                      next[0] = parseFloat(e.target.value) || 0;
                      setSysB2(next);
                    }}
                    className="p-1.5 bg-slate-950 border border-emerald-700 rounded text-center text-xs font-mono text-emerald-300"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={sysA2[1][0]}
                    onChange={(e) => {
                      const next = [...sysA2];
                      next[1][0] = parseFloat(e.target.value) || 0;
                      setSysA2(next);
                    }}
                    className="p-1.5 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono text-cyan-300"
                  />
                  <input
                    type="number"
                    value={sysA2[1][1]}
                    onChange={(e) => {
                      const next = [...sysA2];
                      next[1][1] = parseFloat(e.target.value) || 0;
                      setSysA2(next);
                    }}
                    className="p-1.5 bg-slate-950 border border-slate-700 rounded text-center text-xs font-mono text-cyan-300"
                  />
                  <input
                    type="number"
                    value={sysB2[1]}
                    onChange={(e) => {
                      const next = [...sysB2];
                      next[1] = parseFloat(e.target.value) || 0;
                      setSysB2(next);
                    }}
                    className="p-1.5 bg-slate-950 border border-emerald-700 rounded text-center text-xs font-mono text-emerald-300"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Solving 3-variable system:
                <pre className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300">
                  {sysA3.map((row, i) => `${row.join('x + ')} = ${sysB3[i]}`).join('\n')}
                </pre>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            {sysDim === 2 ? (
              <>
                <ResultCard
                  label="2×2 Solution (x₁, x₂)"
                  value={
                    sol2x2.solution
                      ? `x₁ = ${sol2x2.solution[0].toFixed(4)}, x₂ = ${sol2x2.solution[1].toFixed(4)}`
                      : sol2x2.status
                  }
                  subtext={sol2x2.message}
                  classification="THEORETICAL"
                />
                <CalculationStepViewer steps={sol2x2.steps} />
              </>
            ) : (
              <>
                <ResultCard
                  label="3×3 Solution (x₁, x₂, x₃)"
                  value={
                    sol3x3.solution
                      ? `[${sol3x3.solution.map((v) => v.toFixed(3)).join(', ')}]`
                      : sol3x3.status
                  }
                  subtext={sol3x3.message}
                  classification="THEORETICAL"
                />
                <CalculationStepViewer steps={sol3x3.steps} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
