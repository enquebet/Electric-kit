import React, { useState, useMemo } from 'react';
import {
  calculatePowerDb,
  calculateVoltageDb,
  convertRfPower,
  calculateGainChain,
  linearRatioToDb,
  dbToLinearRatio,
  GainStage,
} from '../../engines/rf/decibels-power';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Layers, Activity, Sliders, ArrowRight, Plus, Trash2, ShieldAlert } from 'lucide-react';

export const DecibelsPowerTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ratios' | 'rf-power' | 'gain-chain' | 'linear-db'>('ratios');

  // Tab 1: Ratios
  const [ratioType, setRatioType] = useState<'power' | 'voltage'>('power');
  const [p1, setP1] = useState<number>(1.0);
  const [p1Unit, setP1Unit] = useState<string>('mW');
  const [p2, setP2] = useState<number>(100.0);
  const [p2Unit, setP2Unit] = useState<string>('mW');

  const [v1, setV1] = useState<number>(1.0);
  const [v1Unit, setV1Unit] = useState<string>('V');
  const [v2, setV2] = useState<number>(10.0);
  const [v2Unit, setV2Unit] = useState<string>('V');
  const [impedance, setImpedance] = useState<number>(50);

  const p1Watts = toBaseUnit(p1, 'power', p1Unit);
  const p2Watts = toBaseUnit(p2, 'power', p2Unit);
  const v1Volts = toBaseUnit(v1, 'voltage', v1Unit);
  const v2Volts = toBaseUnit(v2, 'voltage', v2Unit);

  const ratioResult = useMemo(() => {
    if (ratioType === 'power') {
      return calculatePowerDb(p1Watts, p2Watts);
    } else {
      return calculateVoltageDb(v1Volts, v2Volts, impedance);
    }
  }, [ratioType, p1Watts, p2Watts, v1Volts, v2Volts, impedance]);

  // Tab 2: RF Power Conversions
  const [rfValue, setRfValue] = useState<number>(0);
  const [rfUnit, setRfUnit] = useState<'W' | 'mW' | 'uW' | 'dBm' | 'dBW'>('dBm');

  const rfResult = useMemo(() => {
    return convertRfPower(rfValue, rfUnit);
  }, [rfValue, rfUnit]);

  // Tab 3: Gain Chain
  const [chainInputDbm, setChainInputDbm] = useState<number>(-10);
  const [stages, setStages] = useState<GainStage[]>([
    { name: 'Low Noise Amplifier (LNA)', gainDb: 18.0 },
    { name: 'RF Bandpass Filter', gainDb: -2.5 },
    { name: 'Coaxial Cable Run', gainDb: -1.5 },
    { name: 'IF Downconverter Mixer', gainDb: -6.0 },
    { name: 'IF Buffer Amplifier', gainDb: 15.0 },
  ]);

  const [newStageName, setNewStageName] = useState<string>('');
  const [newStageGain, setNewStageGain] = useState<number>(0);

  const gainChainResult = useMemo(() => {
    return calculateGainChain({
      inputPowerDbm: chainInputDbm,
      stages,
    });
  }, [chainInputDbm, stages]);

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    setStages([...stages, { name: newStageName.trim(), gainDb: newStageGain }]);
    setNewStageName('');
    setNewStageGain(0);
  };

  const handleRemoveStage = (idx: number) => {
    setStages(stages.filter((_, i) => i !== idx));
  };

  // Tab 4: Linear Ratio ↔ dB
  const [linMode, setLinMode] = useState<'linear_to_db' | 'db_to_linear'>('linear_to_db');
  const [linQuantity, setLinQuantity] = useState<'power' | 'voltage'>('power');
  const [linInputValue, setLinInputValue] = useState<number>(10);

  const linResult = useMemo(() => {
    if (linMode === 'linear_to_db') {
      const db = linearRatioToDb(linInputValue, linQuantity);
      return {
        inputValue: linInputValue,
        outputValue: db,
        inputLabel: 'Linear Ratio (X)',
        outputLabel: 'Decibels (dB)',
        formula: linQuantity === 'power' ? 'dB = 10 × log₁₀(Ratio)' : 'dB = 20 × log₁₀(Ratio)',
      };
    } else {
      const lin = dbToLinearRatio(linInputValue, linQuantity);
      return {
        inputValue: linInputValue,
        outputValue: lin,
        inputLabel: 'Decibels (dB)',
        outputLabel: 'Linear Ratio (X)',
        formula: linQuantity === 'power' ? 'Ratio = 10^(dB / 10)' : 'Ratio = 10^(dB / 20)',
      };
    }
  }, [linMode, linQuantity, linInputValue]);

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('ratios')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ratios'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Power &amp; Voltage Decibels (dB)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rf-power')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rf-power'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          dBm, dBW &amp; RF Power Converter
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gain-chain')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gain-chain'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Multi-Stage dB Gain / Loss Chain
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('linear-db')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'linear-db'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Linear Ratio ↔ Decibels
        </button>
      </div>

      {/* TAB 1: POWER & VOLTAGE DB */}
      {activeTab === 'ratios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Decibel Type</h3>

            <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setRatioType('power')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  ratioType === 'power'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Power (10·log₁₀)
              </button>
              <button
                type="button"
                onClick={() => setRatioType('voltage')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  ratioType === 'voltage'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Voltage (20·log₁₀)
              </button>
            </div>

            {ratioType === 'power' ? (
              <>
                <UnitInput
                  id="p1-input"
                  label="Reference Input Power (P₁)"
                  symbol="P₁"
                  value={p1}
                  unit={p1Unit}
                  quantity="power"
                  onChangeValue={setP1}
                  onChangeUnit={setP1Unit}
                />
                <UnitInput
                  id="p2-input"
                  label="Output Signal Power (P₂)"
                  symbol="P₂"
                  value={p2}
                  unit={p2Unit}
                  quantity="power"
                  onChangeValue={setP2}
                  onChangeUnit={setP2Unit}
                />
              </>
            ) : (
              <>
                <UnitInput
                  id="v1-input"
                  label="Reference Input Voltage (V₁)"
                  symbol="V₁"
                  value={v1}
                  unit={v1Unit}
                  quantity="voltage"
                  onChangeValue={setV1}
                  onChangeUnit={setV1Unit}
                />
                <UnitInput
                  id="v2-input"
                  label="Output Signal Voltage (V₂)"
                  symbol="V₂"
                  value={v2}
                  unit={v2Unit}
                  quantity="voltage"
                  onChangeValue={setV2}
                  onChangeUnit={setV2Unit}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">System Impedance (Z)</label>
                  <input
                    type="number"
                    value={impedance}
                    onChange={(e) => setImpedance(parseFloat(e.target.value) || 50)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-0.5">
                    <ShieldAlert className="w-3 h-3 shrink-0" />
                    20·log₁₀ requires equal input and output impedance (Z₁ = Z₂).
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <ResultCard result={ratioResult} />

            <StepExplanation steps={ratioResult.steps} />
          </div>
        </div>
      )}

      {/* TAB 2: DBM, DBW & RF POWER */}
      {activeTab === 'rf-power' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Input RF Power</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Select Input Unit</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['dBm', 'dBW', 'mW', 'W', 'uW'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setRfUnit(u)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                      rfUnit === u
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Value in {rfUnit}</label>
              <input
                type="number"
                step="any"
                value={rfValue}
                onChange={(e) => setRfValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-400 flex flex-col gap-1.5">
              <div className="font-bold text-cyan-400">Quick Reference Anchors:</div>
              <div>• 0 dBm = 1.00 mW</div>
              <div>• +30 dBm = 0 dBW = 1.00 W</div>
              <div>• +10 dBm = 10.0 mW (Standard Wi-Fi low)</div>
              <div>• +20 dBm = 100 mW (Wi-Fi ceiling, 2.4 GHz)</div>
              <div>• -174 dBm/Hz = Thermal noise at 290 K</div>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Power in dBm (ref 1 mW)</span>
              <span className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {Number.isFinite(rfResult.dbm) ? `${rfResult.dbm.toFixed(2)} dBm` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">dBm = 10·log₁₀(P_mW)</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Power in dBW (ref 1 Watt)</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {Number.isFinite(rfResult.dbw) ? `${rfResult.dbw.toFixed(2)} dBW` : '—'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">dBW = dBm - 30</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Linear Power (Milliwatts &amp; Watts)</span>
              <span className="text-xl font-bold font-mono text-slate-100 mt-1">
                {rfResult.milliwatts.toFixed(4)} mW
              </span>
              <span className="text-xs font-mono text-slate-400 mt-0.5">
                {rfResult.watts.toExponential(4)} W ({rfResult.microwatts.toFixed(2)} µW)
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Equivalent 50 Ω Voltage</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1">
                {rfResult.voltageRms50Ohm < 1
                  ? `${(rfResult.voltageRms50Ohm * 1000).toFixed(2)} mV_rms`
                  : `${rfResult.voltageRms50Ohm.toFixed(3)} V_rms`}
              </span>
              <span className="text-xs font-mono text-slate-400 mt-0.5">
                Peak: {(rfResult.voltagePeak50Ohm < 1 ? rfResult.voltagePeak50Ohm * 1000 : rfResult.voltagePeak50Ohm).toFixed(2)} {rfResult.voltagePeak50Ohm < 1 ? 'mV_pk' : 'V_pk'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GAIN / LOSS CHAIN */}
      {activeTab === 'gain-chain' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">RF Signal Chain Settings</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Input Power (dBm)</label>
              <input
                type="number"
                value={chainInputDbm}
                onChange={(e) => setChainInputDbm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add RF Stage</span>
              <input
                type="text"
                placeholder="Stage Name (e.g. Attenuator)"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Gain / Loss in dB"
                  value={newStageGain}
                  onChange={(e) => setNewStageGain(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Net Performance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Total Net Gain / Loss</span>
                <span className={`text-2xl font-bold font-mono mt-1 ${gainChainResult.totalGainDb >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {gainChainResult.totalGainDb >= 0 ? '+' : ''}{gainChainResult.totalGainDb.toFixed(2)} dB
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  Linear Ratio: {gainChainResult.netLinearPowerRatio.toFixed(3)}×
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Chain Output Power (dBm)</span>
                <span className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {gainChainResult.outputPowerDbm.toFixed(2)} dBm
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  P_out = P_in + ∑ Gains
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Linear Output Power</span>
                <span className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {gainChainResult.outputPowerWatts >= 1
                    ? `${gainChainResult.outputPowerWatts.toFixed(3)} W`
                    : `${(gainChainResult.outputPowerWatts * 1000).toFixed(3)} mW`}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  {(gainChainResult.outputPowerWatts * 1e6).toFixed(1)} µW
                </span>
              </div>
            </div>

            {/* Stage-by-Stage Waterfall Table */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3 overflow-x-auto">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Signal Chain Progression Table</span>
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2 font-sans font-semibold">Component Stage</th>
                    <th className="py-2 px-2">Stage Gain</th>
                    <th className="py-2 px-2">Cumulative Gain</th>
                    <th className="py-2 px-2">P_out (dBm)</th>
                    <th className="py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="text-slate-400 bg-slate-900/30">
                    <td className="py-2 px-2 text-slate-600">0</td>
                    <td className="py-2 px-2 font-sans text-slate-300">Input Source Power</td>
                    <td className="py-2 px-2">—</td>
                    <td className="py-2 px-2">0.00 dB</td>
                    <td className="py-2 px-2 text-cyan-400 font-bold">{chainInputDbm.toFixed(2)} dBm</td>
                    <td className="py-2 px-2">—</td>
                  </tr>
                  {gainChainResult.stageProgress.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-2 text-slate-500">{s.stageIndex}</td>
                      <td className="py-2 px-2 font-sans text-slate-200 font-medium">{s.name}</td>
                      <td className={`py-2 px-2 font-bold ${s.stageGainDb >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {s.stageGainDb >= 0 ? `+${s.stageGainDb.toFixed(2)}` : s.stageGainDb.toFixed(2)} dB
                      </td>
                      <td className="py-2 px-2 text-slate-300">
                        {s.cumulativeGainDb >= 0 ? `+${s.cumulativeGainDb.toFixed(2)}` : s.cumulativeGainDb.toFixed(2)} dB
                      </td>
                      <td className="py-2 px-2 text-cyan-300 font-bold">{s.powerOutDbm.toFixed(2)} dBm</td>
                      <td className="py-2 px-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(idx)}
                          className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                          title="Delete stage"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LINEAR RATIO ↔ DB */}
      {activeTab === 'linear-db' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Linear / dB Conversion</h3>

            <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setLinMode('linear_to_db')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  linMode === 'linear_to_db'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Linear → dB
              </button>
              <button
                type="button"
                onClick={() => setLinMode('db_to_linear')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  linMode === 'db_to_linear'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                dB → Linear
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Signal Domain</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLinQuantity('power')}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                    linQuantity === 'power'
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Power (10·log)
                </button>
                <button
                  type="button"
                  onClick={() => setLinQuantity('voltage')}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                    linQuantity === 'voltage'
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Voltage/Field (20·log)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">{linResult.inputLabel}</label>
              <input
                type="number"
                step="any"
                value={linInputValue}
                onChange={(e) => setLinInputValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{linResult.outputLabel}</span>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {linMode === 'linear_to_db'
                  ? `${linResult.outputValue >= 0 ? '+' : ''}${linResult.outputValue.toFixed(2)} dB`
                  : `${linResult.outputValue.toFixed(4)}×`}
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-400">
                <span className="text-cyan-400 font-bold block mb-0.5">Applied Formula:</span>
                {linResult.formula}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
