import React, { useState, useMemo } from 'react';
import {
  toScientificNotation,
  toEngineeringNotation,
  countSignificantFigures,
  calculatePercentageDifference,
  calculatePercentageError,
  calculateRatioAndProportion,
  convertEngineeringPrefix,
  roundPrecision,
  RoundingMethod,
  SI_PREFIX_MAP,
} from '../../engines/math/precision';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Hash, Percent, Shuffle, ArrowRightLeft, Compass } from 'lucide-react';

export function EngineeringPrecisionTool() {
  const [activeTab, setActiveTab] = useState<
    'notation' | 'sigfigs' | 'percent_diff' | 'percent_error' | 'ratios' | 'prefixes' | 'rounding'
  >('notation');

  // 1. Notation State
  const [numInput, setNumInput] = useState<number>(0.000047);
  const [sigFigsInput, setSigFigsInput] = useState<number>(4);

  // 2. Significant Figures State
  const [sigFigStr, setSigFigStr] = useState<string>('0.004500');

  // 3. Percentage Diff State
  const [valA, setValA] = useState<number>(100);
  const [valB, setValB] = useState<number>(105);

  // 4. Percentage Error State
  const [expVal, setExpVal] = useState<number>(9.81);
  const [theoVal, setTheoVal] = useState<number>(9.78);

  // 5. Ratio State
  const [ratioA, setRatioA] = useState<number>(16);
  const [ratioB, setRatioB] = useState<number>(9);
  const [scalingFactor, setScalingFactor] = useState<number>(120);

  // 6. Prefixes State
  const [prefixVal, setPrefixVal] = useState<number>(4.7);
  const [fromExp, setFromExp] = useState<number>(-6); // micro
  const [toExp, setToExp] = useState<number>(-3);   // milli

  // 7. Rounding State
  const [roundVal, setRoundVal] = useState<number>(12.34567);
  const [roundMethod, setRoundMethod] = useState<RoundingMethod>('round_half_even');
  const [roundDigits, setRoundDigits] = useState<number>(2);

  // Calculations
  const sciResult = useMemo(() => toScientificNotation(numInput, sigFigsInput), [numInput, sigFigsInput]);
  const engResult = useMemo(() => toEngineeringNotation(numInput, sigFigsInput), [numInput, sigFigsInput]);
  const sigFigResult = useMemo(() => countSignificantFigures(sigFigStr), [sigFigStr]);
  const pctDiffResult = useMemo(() => calculatePercentageDifference(valA, valB), [valA, valB]);
  const pctErrorResult = useMemo(() => calculatePercentageError(expVal, theoVal), [expVal, theoVal]);
  const ratioResult = useMemo(
    () => calculateRatioAndProportion({ a: ratioA, b: ratioB, scalingFactor }),
    [ratioA, ratioB, scalingFactor]
  );
  const prefixResult = useMemo(
    () => convertEngineeringPrefix(prefixVal, fromExp, toExp),
    [prefixVal, fromExp, toExp]
  );
  const roundResult = useMemo(
    () => roundPrecision(roundVal, roundMethod, roundDigits),
    [roundVal, roundMethod, roundDigits]
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('notation')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'notation'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          Scientific & Eng Notation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sigfigs')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'sigfigs'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Significant Figures
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('percent_diff')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'percent_diff'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          % Difference
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('percent_error')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'percent_error'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          % Error (Exp vs Theo)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ratios')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'ratios'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shuffle className="w-3.5 h-3.5" />
          Ratio & Proportion
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prefixes')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'prefixes'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          SI Prefix Converter
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rounding')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'rounding'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          Rounding & Banker's Rule
        </button>
      </div>

      {/* 1. Notation Tab */}
      {activeTab === 'notation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Value & Precision Controls</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Decimal or Floating-Point Value</label>
              <input
                type="number"
                step="any"
                value={numInput}
                onChange={(e) => setNumInput(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Examples: 0.000047 (47 µF), 1500000 (1.5 MHz), 0.000000001 (1 ns)
              </span>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Significant Digits: {sigFigsInput}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={sigFigsInput}
                onChange={(e) => setSigFigsInput(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Scientific Notation"
                value={sciResult.formatted}
                subtext={`Exponent: 10^${sciResult.exponent} (Arbitrary integer exponent)`}
                classification="THEORETICAL"
              />
              <ResultCard
                label="Engineering Notation"
                value={engResult.formatted}
                subtext={
                  engResult.prefix
                    ? `SI Prefix: ${engResult.prefix} (${engResult.prefixSymbol}) | 10^${engResult.exponent}`
                    : `Exponent multiple of 3 (10^${engResult.exponent})`
                }
                classification="THEORETICAL"
              />
            </div>
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-xs font-bold uppercase text-slate-400 font-mono tracking-wider block mb-2">
                Engineering Convention Note
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                In electrical engineering, <strong>Engineering Notation</strong> constrains exponential powers to integer
                multiples of 3 (10³, 10⁶, 10⁻³, 10⁻⁶, etc.), aligning directly with physical SI component prefixes (kilo,
                mega, milli, micro, nano, pico).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Significant Figures Tab */}
      {activeTab === 'sigfigs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Significant Digits Inspector</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Raw Number String</label>
              <input
                type="text"
                value={sigFigStr}
                onChange={(e) => setSigFigStr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                placeholder="e.g. 0.004500, 1200, 1200.0"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Type exact digits including trailing zeros and decimal points.
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <ResultCard
              label="Significant Figures Count"
              value={`${sigFigResult.significantDigitsCount} sig figs`}
              subtext={`Significant digits: "${sigFigResult.digitsString}"`}
              classification="THEORETICAL"
            />
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                Audited ISO / NIST Rules Applied:
              </span>
              <ul className="space-y-1.5">
                {sigFigResult.rulesApplied.map((rule, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-400 font-mono font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. Percentage Difference Tab */}
      {activeTab === 'percent_diff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Two Equal-Status Quantities</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Value A</label>
              <input
                type="number"
                step="any"
                value={valA}
                onChange={(e) => setValA(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Value B</label>
              <input
                type="number"
                step="any"
                value={valB}
                onChange={(e) => setValB(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <ResultCard
              label="Percentage Difference"
              value={pctDiffResult.formatted}
              subtext={`Absolute Delta: ${pctDiffResult.absoluteDiff} | Average: ${pctDiffResult.average}`}
              classification="THEORETICAL"
            />
            <CalculationStepViewer steps={pctDiffResult.steps} />
          </div>
        </div>
      )}

      {/* 4. Percentage Error Tab */}
      {activeTab === 'percent_error' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Experimental vs Theoretical Baseline</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Experimental / Measured Value (V_exp)</label>
              <input
                type="number"
                step="any"
                value={expVal}
                onChange={(e) => setExpVal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Theoretical / Standard Baseline (V_theo)</label>
              <input
                type="number"
                step="any"
                value={theoVal}
                onChange={(e) => setTheoVal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <ResultCard
              label="Relative Percentage Error"
              value={pctErrorResult.formatted}
              subtext={`Absolute error: ${pctErrorResult.absoluteError.toFixed(4)} (${pctErrorResult.isOverestimate ? 'Overestimate +' : 'Underestimate −'})`}
              classification="THEORETICAL"
            />
            <CalculationStepViewer steps={pctErrorResult.steps} />
          </div>
        </div>
      )}

      {/* 5. Ratio & Proportion Tab */}
      {activeTab === 'ratios' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Ratio A : B & Scaling</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Numerator A</label>
                <input
                  type="number"
                  value={ratioA}
                  onChange={(e) => setRatioA(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Denominator B</label>
                <input
                  type="number"
                  value={ratioB}
                  onChange={(e) => setRatioB(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Scaling Factor k</label>
              <input
                type="number"
                value={scalingFactor}
                onChange={(e) => setScalingFactor(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Reduced Integer Ratio"
                value={`${ratioResult.reducedRatio[0]} : ${ratioResult.reducedRatio[1]}`}
                subtext={`Decimal ratio: ${ratioResult.ratioDecimal.toFixed(4)}`}
                classification="THEORETICAL"
              />
              {ratioResult.scaledRatio && (
                <ResultCard
                  label="Scaled Ratio"
                  value={`${ratioResult.scaledRatio[0]} : ${ratioResult.scaledRatio[1]}`}
                  subtext={`Scaled by factor k = ${scalingFactor}`}
                  classification="THEORETICAL"
                />
              )}
            </div>
            <CalculationStepViewer steps={ratioResult.steps} />
          </div>
        </div>
      )}

      {/* 6. SI Prefixes Tab */}
      {activeTab === 'prefixes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Metric SI Prefix Converter</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Input Value</label>
              <input
                type="number"
                step="any"
                value={prefixVal}
                onChange={(e) => setPrefixVal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">From Prefix</label>
                <select
                  value={fromExp}
                  onChange={(e) => setFromExp(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                >
                  {Object.entries(SI_PREFIX_MAP).map(([expStr, info]) => (
                    <option key={expStr} value={expStr}>
                      {info.symbol ? `${info.symbol} (${info.name}) 10^${expStr}` : `Base unit 10^0`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">To Prefix</label>
                <select
                  value={toExp}
                  onChange={(e) => setToExp(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                >
                  {Object.entries(SI_PREFIX_MAP).map(([expStr, info]) => (
                    <option key={expStr} value={expStr}>
                      {info.symbol ? `${info.symbol} (${info.name}) 10^${expStr}` : `Base unit 10^0`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <ResultCard
              label="Converted Quantity"
              value={`${prefixResult.convertedValue} ${prefixResult.toSymbol}`}
              subtext={`Conversion Factor: 10^${fromExp - toExp} (${prefixResult.multiplier})`}
              classification="THEORETICAL"
            />
          </div>
        </div>
      )}

      {/* 7. Rounding Methods Tab */}
      {activeTab === 'rounding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Rounding Algorithm</h3>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Numerical Value</label>
              <input
                type="number"
                step="any"
                value={roundVal}
                onChange={(e) => setRoundVal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Rounding Method</label>
              <select
                value={roundMethod}
                onChange={(e) => setRoundMethod(e.target.value as RoundingMethod)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
              >
                <option value="round_half_even">Banker's Rounding (Round Half to Even - IEEE 754)</option>
                <option value="round_half_up">Round Half Up (Standard Arithmetic)</option>
                <option value="decimal_places">Fixed Decimal Places</option>
                <option value="significant_figures">Significant Figures</option>
                <option value="floor">Floor (Truncate downwards)</option>
                <option value="ceil">Ceiling (Round upwards)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Precision / Decimal Places / Digits</label>
              <input
                type="number"
                min="0"
                max="10"
                value={roundDigits}
                onChange={(e) => setRoundDigits(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-cyan-300"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <ResultCard
              label="Rounded Output"
              value={roundResult.formatted}
              subtext={roundResult.explanation}
              classification="THEORETICAL"
            />
          </div>
        </div>
      )}
    </div>
  );
}
