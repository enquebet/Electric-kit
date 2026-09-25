import React, { useState, useMemo } from 'react';
import {
  calculateDescriptiveStatistics,
  DescriptiveStatisticsResult,
} from '../../engines/math/statistics';
import {
  propagateAdditionSubtraction,
  propagateMultiplicationDivision,
  propagatePower,
  calculateCombinedUncertaintyGUM,
} from '../../engines/math/error-analysis';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { BarChart3, ShieldAlert, Layers } from 'lucide-react';

export function EngineeringStatisticsTool() {
  const [activeTab, setActiveTab] = useState<'statistics' | 'uncertainty'>('statistics');

  // 1. Statistics Data Input
  const [dataText, setDataText] = useState<string>(
    '10.2, 10.5, 9.8, 10.1, 10.4, 9.9, 10.3, 10.0, 10.2, 10.6'
  );

  // 2. Uncertainty Propagation Mode
  const [uncMode, setUncMode] = useState<'add_sub' | 'mul_div' | 'power' | 'gum'>('mul_div');

  // Multi-component state
  const [v1, setV1] = useState<number>(12.0); // e.g. Voltage V
  const [u1, setU1] = useState<number>(0.2);
  const [v2, setV2] = useState<number>(4.0);  // e.g. Current I
  const [u2, setU2] = useState<number>(0.1);

  // Power state
  const [baseVal, setBaseVal] = useState<number>(5.0);
  const [baseUnc, setBaseUnc] = useState<number>(0.1);
  const [exponent, setExponent] = useState<number>(2.0);

  // Parse Numbers
  const parsedData = useMemo(() => {
    return dataText
      .split(/[,\s\t]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((v) => !isNaN(v));
  }, [dataText]);

  // Descriptive Statistics Calculation
  const statsResult: DescriptiveStatisticsResult | null = useMemo(() => {
    try {
      if (parsedData.length > 0) {
        return calculateDescriptiveStatistics(parsedData);
      }
      return null;
    } catch {
      return null;
    }
  }, [parsedData]);

  // Error Propagation Calculation
  const uncResult = useMemo(() => {
    try {
      if (uncMode === 'add_sub') {
        return propagateAdditionSubtraction([
          { value: v1, uncertainty: u1, sign: 1 },
          { value: v2, uncertainty: u2, sign: 1 },
        ]);
      }
      if (uncMode === 'mul_div') {
        return propagateMultiplicationDivision([
          { value: v1, uncertainty: u1 },
          { value: v2, uncertainty: u2 },
        ]);
      }
      if (uncMode === 'power') {
        return propagatePower(baseVal, baseUnc, exponent);
      }
      // GUM general
      return calculateCombinedUncertaintyGUM(v1 * v2, [
        { value: v1, uncertainty: u1, sensitivityCoefficient: v2 },
        { value: v2, uncertainty: u2, sensitivityCoefficient: v1 },
      ]);
    } catch (err: any) {
      return null;
    }
  }, [uncMode, v1, u1, v2, u2, baseVal, baseUnc, exponent]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('statistics')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'statistics'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Descriptive Sample Statistics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('uncertainty')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'uncertainty'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Error & Uncertainty Propagation (GUM)
        </button>
      </div>

      {/* 1. Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Sample Dataset</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Raw Measurements (comma or space separated):
              </label>
              <textarea
                rows={6}
                value={dataText}
                onChange={(e) => setDataText(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 resize-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Sample count N = {parsedData.length} valid data points.
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {statsResult ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ResultCard
                    label="Arithmetic Mean (x̄)"
                    value={statsResult.mean.toFixed(4)}
                    subtext={`Median: ${statsResult.median.toFixed(4)}`}
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Sample Std Dev (s)"
                    value={statsResult.sampleStdDev.toFixed(4)}
                    subtext={`Variance s² = ${statsResult.sampleVariance.toFixed(4)}`}
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Standard Error (SEM)"
                    value={statsResult.standardErrorOfMean.toFixed(4)}
                    subtext="SEM = s / √N"
                    classification="THEORETICAL"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ResultCard
                    label="Root Mean Square (RMS)"
                    value={statsResult.rms.toFixed(4)}
                    subtext="√(Σ x² / N)"
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="Span (Min - Max)"
                    value={`${statsResult.min.toFixed(2)} to ${statsResult.max.toFixed(2)}`}
                    subtext={`Range Δ = ${statsResult.range.toFixed(3)}`}
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="IQR (Q3 − Q1)"
                    value={statsResult.percentiles.iqr.toFixed(4)}
                    subtext={`Q1: ${statsResult.percentiles.p25.toFixed(2)}, Q3: ${statsResult.percentiles.p75.toFixed(2)}`}
                    classification="THEORETICAL"
                  />
                </div>

                <CalculationStepViewer steps={statsResult.steps} />
              </>
            ) : (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
                Please enter at least one valid measurement value.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Uncertainty Propagation Tab */}
      {activeTab === 'uncertainty' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Uncertainty Propagation Model</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUncMode('mul_div')}
                className={`py-1.5 text-xs font-mono rounded border transition-all ${
                  uncMode === 'mul_div'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Multiplication (X · Y)
              </button>
              <button
                type="button"
                onClick={() => setUncMode('add_sub')}
                className={`py-1.5 text-xs font-mono rounded border transition-all ${
                  uncMode === 'add_sub'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Addition (X + Y)
              </button>
              <button
                type="button"
                onClick={() => setUncMode('power')}
                className={`py-1.5 text-xs font-mono rounded border transition-all ${
                  uncMode === 'power'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Power (Xⁿ)
              </button>
              <button
                type="button"
                onClick={() => setUncMode('gum')}
                className={`py-1.5 text-xs font-mono rounded border transition-all ${
                  uncMode === 'gum'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                General GUM
              </button>
            </div>

            {uncMode !== 'power' ? (
              <div className="space-y-3">
                {/* Quantity 1 */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">Quantity X₁ ± u(X₁)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400">Nominal Value</label>
                      <input
                        type="number"
                        step="any"
                        value={v1}
                        onChange={(e) => setV1(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400">Uncertainty (1σ)</label>
                      <input
                        type="number"
                        step="any"
                        value={u1}
                        onChange={(e) => setU1(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity 2 */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">Quantity X₂ ± u(X₂)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400">Nominal Value</label>
                      <input
                        type="number"
                        step="any"
                        value={v2}
                        onChange={(e) => setV2(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-indigo-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400">Uncertainty (1σ)</label>
                      <input
                        type="number"
                        step="any"
                        value={u2}
                        onChange={(e) => setU2(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-indigo-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Base Value</label>
                    <input
                      type="number"
                      step="any"
                      value={baseVal}
                      onChange={(e) => setBaseVal(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Base Unc (1σ)</label>
                    <input
                      type="number"
                      step="any"
                      value={baseUnc}
                      onChange={(e) => setBaseUnc(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Exponent n</label>
                  <input
                    type="number"
                    step="any"
                    value={exponent}
                    onChange={(e) => setExponent(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-cyan-300"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            {uncResult && (
              <>
                <ResultCard
                  label="Combined Result with 95% Confidence Interval"
                  value={uncResult.formattedInterval}
                  subtext={`Relative Uncertainty: ${uncResult.relativePercent} (Expanded factor k = 2.0)`}
                  classification="THEORETICAL"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResultCard
                    label="Combined 1-Sigma Uncertainty (u_c)"
                    value={`±${uncResult.combinedAbsoluteUncertainty.toFixed(4)}`}
                    subtext="Quadrature combination standard deviation"
                    classification="THEORETICAL"
                  />
                  <ResultCard
                    label="95% Coverage Interval [Min, Max]"
                    value={`[${uncResult.confidenceInterval95[0].toFixed(3)}, ${uncResult.confidenceInterval95[1].toFixed(3)}]`}
                    subtext="Two-sided normal distribution interval"
                    classification="THEORETICAL"
                  />
                </div>
                <CalculationStepViewer steps={uncResult.steps} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
