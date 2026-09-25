import React, { useState, useMemo } from 'react';
import {
  calculateLinearRegression,
  minMaxNormalize,
  zScoreStandardize,
  calculateSimpleMovingAverage,
  calculateExponentialMovingAverage,
  RegressionPoint,
} from '../../engines/math/regression';
import {
  linearInterpolation,
  polynomialInterpolation,
  DataPoint,
} from '../../engines/math/interpolation';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { LineChart, Spline, Waves, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function CurveFittingTool() {
  const [activeTab, setActiveTab] = useState<'regression' | 'interpolation' | 'filtering'>('regression');

  // 1. Regression Data Points
  const [pointsText, setPointsText] = useState<string>(
    '1.0, 2.1\n2.0, 3.9\n3.0, 6.2\n4.0, 7.8\n5.0, 10.1'
  );

  // 2. Interpolation Points & Target
  const [interpPointsText, setInterpPointsText] = useState<string>(
    '0, 0\n10, 25\n20, 65\n30, 115\n40, 180'
  );
  const [targetX, setTargetX] = useState<number>(15);

  // 3. Filtering State
  const [filterDataText, setFilterDataText] = useState<string>(
    '12, 15, 14, 18, 22, 21, 26, 30, 28, 35, 33, 40'
  );
  const [smaWindow, setSmaWindow] = useState<number>(3);
  const [emaAlpha, setEmaAlpha] = useState<number>(0.3);

  // Parse Regression Points
  const parsedRegPoints: RegressionPoint[] = useMemo(() => {
    return pointsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split(/[,\s\t]+/);
        return {
          x: parseFloat(parts[0]) || 0,
          y: parseFloat(parts[1]) || 0,
        };
      });
  }, [pointsText]);

  // Parse Interpolation Points
  const parsedInterpPoints: DataPoint[] = useMemo(() => {
    return interpPointsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split(/[,\s\t]+/);
        return {
          x: parseFloat(parts[0]) || 0,
          y: parseFloat(parts[1]) || 0,
        };
      });
  }, [interpPointsText]);

  // Parse Filtering Array
  const parsedFilterData: number[] = useMemo(() => {
    return filterDataText
      .split(/[,\s\t]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((v) => !isNaN(v));
  }, [filterDataText]);

  // Calculations
  const regResult = useMemo(() => {
    try {
      if (parsedRegPoints.length >= 2) {
        return calculateLinearRegression(parsedRegPoints);
      }
      return null;
    } catch {
      return null;
    }
  }, [parsedRegPoints]);

  const linearInterpResult = useMemo(() => {
    try {
      if (parsedInterpPoints.length >= 2) {
        return linearInterpolation(parsedInterpPoints, targetX);
      }
      return null;
    } catch {
      return null;
    }
  }, [parsedInterpPoints, targetX]);

  const polyInterpResult = useMemo(() => {
    try {
      if (parsedInterpPoints.length >= 2) {
        return polynomialInterpolation(parsedInterpPoints, targetX);
      }
      return null;
    } catch {
      return null;
    }
  }, [parsedInterpPoints, targetX]);

  const smaResult = useMemo(
    () => calculateSimpleMovingAverage(parsedFilterData, smaWindow),
    [parsedFilterData, smaWindow]
  );
  const emaResult = useMemo(
    () => calculateExponentialMovingAverage(parsedFilterData, emaAlpha),
    [parsedFilterData, emaAlpha]
  );
  const normalizedData = useMemo(() => minMaxNormalize(parsedFilterData), [parsedFilterData]);
  const zScoreData = useMemo(() => zScoreStandardize(parsedFilterData), [parsedFilterData]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('regression')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'regression'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          Linear Least-Squares Regression
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('interpolation')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'interpolation'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Spline className="w-3.5 h-3.5" />
          Interpolation & Extrapolation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('filtering')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'filtering'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          Moving Averages & Scaling
        </button>
      </div>

      {/* 1. Regression Tab */}
      {activeTab === 'regression' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Data Points (x, y)</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Enter (x, y) pairs (one per line, comma or space separated):
              </label>
              <textarea
                rows={8}
                value={pointsText}
                onChange={(e) => setPointsText(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 resize-none"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {regResult ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    label="Regression Equation"
                    value={regResult.equationText}
                    subtext={`Slope m = ${regResult.slope.toFixed(4)}, Intercept b = ${regResult.intercept.toFixed(4)}`}
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Goodness of Fit R²"
                    value={regResult.rSquared.toFixed(4)}
                    subtext={`Pearson r = ${regResult.r.toFixed(4)} | ${(regResult.rSquared * 100).toFixed(2)}% variance explained`}
                    classification="THEORETICAL"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    label="Standard Error of Estimate (S_yx)"
                    value={regResult.standardErrorEstimate.toFixed(4)}
                    subtext={`SSE = ${regResult.sumSquaredErrors.toFixed(4)} over ${regResult.pointsCount} points`}
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Parameter Uncertainty (S_m)"
                    value={`±${regResult.standardErrorSlope.toFixed(4)}`}
                    subtext={`Intercept SE S_b = ±${regResult.standardErrorIntercept.toFixed(4)}`}
                    classification="THEORETICAL"
                  />
                </div>
                <CalculationStepViewer steps={regResult.steps} />
              </>
            ) : (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
                Please enter at least 2 valid data points to perform regression.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Interpolation Tab */}
      {activeTab === 'interpolation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Table Coordinates (x, y)</h3>
            <textarea
              rows={6}
              value={interpPointsText}
              onChange={(e) => setInterpPointsText(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 resize-none"
            />
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Target Evaluation x</label>
              <input
                type="number"
                step="any"
                value={targetX}
                onChange={(e) => setTargetX(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {linearInterpResult?.extrapolation.isExtrapolated && (
              <div className="p-4 bg-amber-950/40 border border-amber-800 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200">
                  {linearInterpResult.extrapolation.warningMessage}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Linear Interpolation y(target)"
                value={linearInterpResult ? linearInterpResult.interpolatedY.toFixed(4) : 'N/A'}
                subtext={
                  linearInterpResult
                    ? `Segment slope: ${linearInterpResult.slope.toFixed(3)}`
                    : ''
                }
                classification="THEORETICAL"
              />
              <ResultCard
                label={`Polynomial (Degree ${polyInterpResult?.polynomialDegree || 0})`}
                value={polyInterpResult ? polyInterpResult.interpolatedY.toFixed(4) : 'N/A'}
                subtext="Lagrange polynomial basis sum"
                classification="THEORETICAL"
              />
            </div>

            {linearInterpResult && <CalculationStepViewer steps={linearInterpResult.steps} />}
          </div>
        </div>
      )}

      {/* 3. Filtering & Scaling Tab */}
      {activeTab === 'filtering' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Raw Data Series</h3>
            <textarea
              rows={4}
              value={filterDataText}
              onChange={(e) => setFilterDataText(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">SMA Window (w)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={smaWindow}
                  onChange={(e) => setSmaWindow(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">EMA Alpha (α)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  max="1.0"
                  value={emaAlpha}
                  onChange={(e) => setEmaAlpha(parseFloat(e.target.value) || 0.3)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider block">
                Filtered Signals Comparison:
              </span>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-0.5">Simple Moving Average (SMA w={smaWindow}):</span>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-cyan-300 truncate">
                    [{smaResult.map((v) => v.toFixed(2)).join(', ')}]
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Exponential Moving Average (EMA α={emaAlpha}):</span>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-indigo-300 truncate">
                    [{emaResult.map((v) => v.toFixed(2)).join(', ')}]
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Min-Max Normalized [0, 1]:</span>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-emerald-300 truncate">
                    [{normalizedData.map((v) => v.toFixed(2)).join(', ')}]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
