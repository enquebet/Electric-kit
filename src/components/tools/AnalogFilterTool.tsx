import React, { useState, useMemo } from 'react';
import {
  calculateRcLowPass,
  calculateRcHighPass,
  calculateRlLowPass,
  calculateRlHighPass,
  calculateBandwidthQ,
  generateRlcBodePoints,
  calculateFilterOrderSynthesis,
  FILTER_ORDER_TABLE,
} from '../../engines/circuit/filters';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Filter, Sliders, Activity, Table, Layers } from 'lucide-react';

export const AnalogFilterTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'passive-1st' | 'bw-q' | 'rlc-2nd' | 'roll-off'>('passive-1st');

  // Tab 1: 1st Order Passive Filters
  const [filterType, setFilterType] = useState<'rc-lowpass' | 'rc-highpass' | 'rl-lowpass' | 'rl-highpass'>('rc-lowpass');

  const [resistance, setResistance] = useState<number>(1.0);
  const [resistanceUnit, setResistanceUnit] = useState<string>('kΩ');

  const [capacitance, setCapacitance] = useState<number>(100);
  const [capacitanceUnit, setCapacitanceUnit] = useState<string>('nF');

  const [inductance, setInductance] = useState<number>(10);
  const [inductanceUnit, setInductanceUnit] = useState<string>('mH');

  const [vin, setVin] = useState<number>(1.0);
  const [vinUnit, setVinUnit] = useState<string>('V');

  const R = toBaseUnit(resistance, 'resistance', resistanceUnit);
  const C = toBaseUnit(capacitance, 'capacitance', capacitanceUnit);
  const L = toBaseUnit(inductance, 'inductance', inductanceUnit);
  const V = toBaseUnit(vin, 'voltage', vinUnit);

  const result = useMemo(() => {
    switch (filterType) {
      case 'rc-lowpass':
        return calculateRcLowPass({ resistance: R, capacitance: C, inputVoltage: V });
      case 'rc-highpass':
        return calculateRcHighPass({ resistance: R, capacitance: C, inputVoltage: V });
      case 'rl-lowpass':
        return calculateRlLowPass({ resistance: R, inductance: L, inputVoltage: V });
      case 'rl-highpass':
      default:
        return calculateRlHighPass({ resistance: R, inductance: L, inputVoltage: V });
    }
  }, [filterType, R, C, L, V]);

  const bodePoints = result.visualData?.bodePoints || [];

  // Generate SVG frequency response curve (magnitude dB vs log freq)
  const bodeSvgPath = useMemo(() => {
    if (bodePoints.length === 0) return '';
    const width = 320;
    const height = 130;
    const paddingLeft = 30;
    const paddingBottom = 20;
    const plotW = width - paddingLeft - 10;
    const plotH = height - paddingBottom - 10;

    const minDb = -40;
    const maxDb = 5;

    const pts = bodePoints.map((pt: any, idx: number) => {
      const x = paddingLeft + (idx / (bodePoints.length - 1)) * plotW;
      const clampedDb = Math.max(minDb, Math.min(maxDb, pt.magDb));
      const y = 10 + (1 - (clampedDb - minDb) / (maxDb - minDb)) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${pts.join(' L ')}`;
  }, [bodePoints]);

  // Tab 2: Bandwidth & Q
  const [fLow, setFLow] = useState<number>(98);
  const [fLowUnit, setFLowUnit] = useState<string>('MHz');
  const [fHigh, setFHigh] = useState<number>(102);
  const [fHighUnit, setFHighUnit] = useState<string>('MHz');

  const fLowHz = toBaseUnit(fLow, 'frequency', fLowUnit);
  const fHighHz = toBaseUnit(fHigh, 'frequency', fHighUnit);

  const bwResult = useMemo(() => {
    return calculateBandwidthQ({ fLowHz, fHighHz });
  }, [fLowHz, fHighHz]);

  // Tab 3: 2nd Order RLC (Bandpass & Notch)
  const [rlcType, setRlcType] = useState<'bandpass' | 'notch'>('bandpass');
  const [rlcF0, setRlcF0] = useState<number>(10.0);
  const [rlcF0Unit, setRlcF0Unit] = useState<string>('MHz');
  const [rlcQ, setRlcQ] = useState<number>(10.0);

  const rlcF0Hz = toBaseUnit(rlcF0, 'frequency', rlcF0Unit);
  const rlcBodePoints = useMemo(() => {
    return generateRlcBodePoints({
      type: rlcType,
      centerFreqHz: rlcF0Hz,
      qFactor: rlcQ,
    });
  }, [rlcType, rlcF0Hz, rlcQ]);

  // Tab 4: Filter Order Synthesis (Butterworth, Chebyshev, Bessel)
  const [synthFpass, setSynthFpass] = useState<number>(10.0);
  const [synthFpassUnit, setSynthFpassUnit] = useState<string>('kHz');
  const [synthFstop, setSynthFstop] = useState<number>(30.0);
  const [synthFstopUnit, setSynthFstopUnit] = useState<string>('kHz');
  const [synthAstop, setSynthAstop] = useState<number>(40.0);

  const synthFpassHz = toBaseUnit(synthFpass, 'frequency', synthFpassUnit);
  const synthFstopHz = toBaseUnit(synthFstop, 'frequency', synthFstopUnit);

  const synthesisResult = useMemo(() => {
    return calculateFilterOrderSynthesis({
      passbandFreqHz: synthFpassHz,
      stopbandFreqHz: synthFstopHz,
      stopbandAttenuationDb: synthAstop,
    });
  }, [synthFpassHz, synthFstopHz, synthAstop]);

  const rlcBodeSvgPath = useMemo(() => {
    if (rlcBodePoints.length === 0) return '';
    const width = 340;
    const height = 130;
    const paddingLeft = 30;
    const paddingBottom = 20;
    const plotW = width - paddingLeft - 10;
    const plotH = height - paddingBottom - 10;

    const minDb = -50;
    const maxDb = 5;

    const pts = rlcBodePoints.map((pt, idx) => {
      const x = paddingLeft + (idx / (rlcBodePoints.length - 1)) * plotW;
      const clampedDb = Math.max(minDb, Math.min(maxDb, pt.gainDb));
      const y = 10 + (1 - (clampedDb - minDb) / (maxDb - minDb)) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${pts.join(' L ')}`;
  }, [rlcBodePoints]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('passive-1st')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'passive-1st'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          1st-Order RC / RL Passive Filters
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bw-q')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bw-q'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Bandwidth &amp; Q-Factor (BW = f_H - f_L)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rlc-2nd')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rlc-2nd'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          2nd-Order Bandpass &amp; Notch Response
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roll-off')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'roll-off'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Filter Order &amp; Synthesis
        </button>
      </div>

      {/* TAB 1: 1ST ORDER PASSIVE FILTERS */}
      {activeTab === 'passive-1st' && (
        <div className="flex flex-col gap-6">
          {/* Topology Selector */}
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setFilterType('rc-lowpass')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterType === 'rc-lowpass'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RC Low-Pass
            </button>
            <button
              type="button"
              onClick={() => setFilterType('rc-highpass')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterType === 'rc-highpass'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RC High-Pass
            </button>
            <button
              type="button"
              onClick={() => setFilterType('rl-lowpass')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterType === 'rl-lowpass'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RL Low-Pass
            </button>
            <button
              type="button"
              onClick={() => setFilterType('rl-highpass')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterType === 'rl-highpass'
                  ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RL High-Pass
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Component Values</span>

              <UnitInput
                id="filter-r"
                label="Resistance (R)"
                symbol="R"
                quantity="resistance"
                value={resistance}
                unit={resistanceUnit}
                onChangeValue={setResistance}
                onChangeUnit={setResistanceUnit}
                min={0.001}
              />

              {filterType.startsWith('rc') ? (
                <UnitInput
                  id="filter-c"
                  label="Capacitance (C)"
                  symbol="C"
                  quantity="capacitance"
                  value={capacitance}
                  unit={capacitanceUnit}
                  onChangeValue={setCapacitance}
                  onChangeUnit={setCapacitanceUnit}
                  min={0.000001}
                />
              ) : (
                <UnitInput
                  id="filter-l"
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

              <UnitInput
                id="filter-vin"
                label="Test Input Voltage Amplitude (V_in)"
                symbol="V_in"
                quantity="voltage"
                value={vin}
                unit={vinUnit}
                onChangeValue={setVin}
                onChangeUnit={setVinUnit}
                min={0.001}
              />
            </div>

            {/* Bode Plot Preview */}
            <div className="lg:col-span-6 flex flex-col bg-slate-900/50 p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Frequency Response (Bode Plot)</span>
                <span className="text-[11px] font-mono text-cyan-400">Cutoff f_c = {result.additionalOutputs?.cutoff?.value}</span>
              </div>

              <div className="w-full h-44 bg-slate-950 rounded-lg p-2 relative flex flex-col justify-end border border-slate-800">
                <svg viewBox="0 0 320 130" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="30" y1="10" x2="310" y2="10" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="30" y1="36" x2="310" y2="36" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="30" y1="70" x2="310" y2="70" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="30" y1="110" x2="310" y2="110" stroke="#334155" strokeWidth="1" />

                  {/* Frequency Response Path */}
                  <path d={bodeSvgPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

                  {/* Y-Axis dB Labels */}
                  <text x="5" y="14" fill="#64748b" fontSize="8" fontFamily="monospace">0 dB</text>
                  <text x="5" y="40" fill="#06b6d4" fontSize="8" fontFamily="monospace">-3 dB</text>
                  <text x="5" y="74" fill="#64748b" fontSize="8" fontFamily="monospace">-20 dB</text>
                  <text x="5" y="114" fill="#64748b" fontSize="8" fontFamily="monospace">-40 dB</text>

                  {/* Frequency Labels */}
                  <text x="30" y="125" fill="#64748b" fontSize="8" fontFamily="monospace">0.01·fc</text>
                  <text x="165" y="125" fill="#06b6d4" fontSize="8" fontFamily="monospace" textAnchor="middle">fc</text>
                  <text x="310" y="125" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">100·fc</text>
                </svg>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Roll-off: -20 dB/decade (-6 dB/octave)</span>
                <span>Phase Shift at f_c: {filterType.includes('low') ? '-45°' : '+45°'}</span>
              </div>
            </div>
          </div>

          <ResultCard result={result} />
          <StepExplanation steps={result.steps} />
        </div>
      )}

      {/* TAB 2: BANDWIDTH & Q FACTOR */}
      {activeTab === 'bw-q' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Band Frequencies</h3>

            <UnitInput
              id="flow-input"
              label="Lower -3dB Frequency (f_L)"
              symbol="f_L"
              value={fLow}
              unit={fLowUnit}
              quantity="frequency"
              onChangeValue={setFLow}
              onChangeUnit={setFLowUnit}
            />

            <UnitInput
              id="fhigh-input"
              label="Upper -3dB Frequency (f_H)"
              symbol="f_H"
              value={fHigh}
              unit={fHighUnit}
              quantity="frequency"
              onChangeValue={setFHigh}
              onChangeUnit={setFHighUnit}
            />
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bandwidth (BW = f_H - f_L)</span>
              <div className="text-3xl font-bold font-mono text-cyan-400 mt-1">
                {(bwResult.bandwidthHz / 1e6).toFixed(3)} MHz
              </div>
              <span className="text-xs font-mono text-slate-400">
                {bwResult.bandwidthHz.toFixed(0)} Hz ({bwResult.bandwidthHz >= 1e3 ? (bwResult.bandwidthHz / 1e3).toFixed(2) + ' kHz' : ''})
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Passband width between half-power (-3 dB) cutoff points.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quality Factor (Q = f₀ / BW)</span>
              <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">
                {bwResult.qFactor.toFixed(3)}
              </div>
              <span className="text-xs font-mono text-slate-400">
                Fractional BW: {(bwResult.fractionalBandwidth * 100).toFixed(2)}%
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Higher Q indicates narrower selectivity and sharper resonance skirts.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Center Frequency</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Geometric Mean (f₀ = √(f_L · f_H)):</span>
                  <span className="text-slate-200 font-bold text-sm">{(bwResult.centerFreqHz / 1e6).toFixed(4)} MHz</span>
                  <span className="text-[10px] text-slate-500 block">Logarithmically symmetrical (RF filters)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Arithmetic Mean ((f_L + f_H) / 2):</span>
                  <span className="text-slate-200 font-bold text-sm">{(bwResult.centerFreqArithmeticHz / 1e6).toFixed(4)} MHz</span>
                  <span className="text-[10px] text-slate-500 block">Linear midpoint</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 2ND ORDER RLC RESPONSE */}
      {activeTab === 'rlc-2nd' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">2nd-Order RLC Filter</h3>

            <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setRlcType('bandpass')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  rlcType === 'bandpass'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bandpass
              </button>
              <button
                type="button"
                onClick={() => setRlcType('notch')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  rlcType === 'notch'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Notch (Bandstop)
              </button>
            </div>

            <UnitInput
              id="rlc-f0-input"
              label="Center Resonance Frequency (f₀)"
              symbol="f₀"
              value={rlcF0}
              unit={rlcF0Unit}
              quantity="frequency"
              onChangeValue={setRlcF0}
              onChangeUnit={setRlcF0Unit}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Quality Factor (Q)</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={rlcQ}
                onChange={(e) => setRlcQ(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500">
                Bandwidth BW = f₀ / Q = {((rlcF0Hz / rlcQ) / 1e3).toFixed(2)} kHz.
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2nd-Order Frequency Response (4 Decades)
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  Q = {rlcQ.toFixed(2)} | f₀ = {(rlcF0Hz / 1e6).toFixed(2)} MHz
                </span>
              </div>

              <div className="w-full h-48 bg-slate-950 rounded-lg p-2 relative flex flex-col justify-end border border-slate-900">
                <svg viewBox="0 0 340 130" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="30" y1="10" x2="330" y2="10" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="30" y1="60" x2="330" y2="60" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="30" y1="110" x2="330" y2="110" stroke="#334155" strokeWidth="1" />

                  {/* Path */}
                  <path d={rlcBodeSvgPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

                  {/* Y-axis Labels */}
                  <text x="5" y="14" fill="#64748b" fontSize="8" fontFamily="monospace">0 dB</text>
                  <text x="5" y="64" fill="#64748b" fontSize="8" fontFamily="monospace">-25 dB</text>
                  <text x="5" y="114" fill="#64748b" fontSize="8" fontFamily="monospace">-50 dB</text>

                  {/* X-axis Labels */}
                  <text x="30" y="125" fill="#64748b" fontSize="8" fontFamily="monospace">0.01·f₀</text>
                  <text x="180" y="125" fill="#06b6d4" fontSize="8" fontFamily="monospace" textAnchor="middle">f₀</text>
                  <text x="330" y="125" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">100·f₀</text>
                </svg>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Asymptotes: ±20 dB/decade roll-off per side for 2nd order bandpass; deep notch at f₀ for bandstop.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FILTER ORDER & ROLL-OFF TABLE + SYNTHESIS CALCULATOR */}
      {activeTab === 'roll-off' && (
        <div className="flex flex-col gap-6">
          {/* Synthesis Order Calculator */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">Filter Order Synthesis (Stopband Rejection Sizing)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Calculate the minimum required pole count (filter order N) to meet a specified stopband attenuation specification across Butterworth, Chebyshev, and Bessel polynomial approximations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <UnitInput
                id="filter-synth-fpass"
                label="Passband Cutoff (f_pass)"
                symbol="f_p"
                value={synthFpass}
                unit={synthFpassUnit}
                quantity="frequency"
                onChangeValue={(v: number) => setSynthFpass(v)}
                onChangeUnit={(u: string) => setSynthFpassUnit(u)}
              />
              <UnitInput
                id="filter-synth-fstop"
                label="Stopband Edge (f_stop)"
                symbol="f_s"
                value={synthFstop}
                unit={synthFstopUnit}
                quantity="frequency"
                onChangeValue={(v: number) => setSynthFstop(v)}
                onChangeUnit={(u: string) => setSynthFstopUnit(u)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400">Stopband Attenuation (A_stop)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    step="1"
                    value={synthAstop}
                    onChange={(e) => setSynthAstop(parseFloat(e.target.value) || 20)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono">dB</span>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-950 border border-cyan-900/40 rounded-lg">
                <span className="text-[11px] font-semibold text-cyan-400">Butterworth (Flat)</span>
                <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">Order {synthesisResult.butterworthOrder}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Exact N = {synthesisResult.butterworthExactOrder.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500 mt-1">Maximally flat passband, 0 dB ripple, monotonic roll-off.</div>
              </div>

              <div className="p-3 bg-slate-950 border border-amber-900/40 rounded-lg">
                <span className="text-[11px] font-semibold text-amber-400">Chebyshev 0.5 dB</span>
                <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">Order {synthesisResult.chebyshev05DbOrder}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Exact N = {synthesisResult.chebyshev05DbExactOrder.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500 mt-1">Faster transition than Butterworth with ±0.25 dB ripple.</div>
              </div>

              <div className="p-3 bg-slate-950 border border-rose-900/40 rounded-lg">
                <span className="text-[11px] font-semibold text-rose-400">Chebyshev 1.0 dB</span>
                <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">Order {synthesisResult.chebyshev10DbOrder}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Exact N = {synthesisResult.chebyshev10DbExactOrder.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500 mt-1">Steepest transition with ±0.5 dB passband ripple.</div>
              </div>

              <div className="p-3 bg-slate-950 border border-emerald-900/40 rounded-lg">
                <span className="text-[11px] font-semibold text-emerald-400">Bessel (Linear Phase)</span>
                <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">Order ~{synthesisResult.besselEstimatedOrder}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ratio: {synthesisResult.frequencyRatio.toFixed(2)}x cutoff</div>
                <div className="text-[10px] text-slate-500 mt-1">Constant group delay (no pulse overshoot / distortion).</div>
              </div>
            </div>
          </div>

          {/* Reference Table */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Filter Order &amp; Asymptotic Roll-Off Reference</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Theoretical stopband attenuation rates for Butterworth, Bessel, and Chebyshev polynomials as frequency moves into the stopband.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                    <th className="py-2.5 px-3 font-sans font-semibold">Filter Order (N)</th>
                    <th className="py-2.5 px-3">Roll-Off Rate (dB / decade)</th>
                    <th className="py-2.5 px-3">Roll-Off Rate (dB / octave)</th>
                    <th className="py-2.5 px-3">Attenuation at 2 × f_c</th>
                    <th className="py-2.5 px-3">Attenuation at 10 × f_c</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {FILTER_ORDER_TABLE.map((row) => (
                    <tr key={row.order} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-sans text-cyan-400 font-bold">{row.order} (Order {row.order})</td>
                      <td className="py-2.5 px-3 text-slate-200 font-bold">-{row.rollOffDbPerDecade} dB/dec</td>
                      <td className="py-2.5 px-3 text-slate-300">-{row.rollOffDbPerOctave.toFixed(1)} dB/oct</td>
                      <td className="py-2.5 px-3 text-emerald-400">~{row.attenuationAt2fcDb.toFixed(1)} dB</td>
                      <td className="py-2.5 px-3 text-indigo-400 font-bold">~{row.attenuationAt10fcDb} dB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
