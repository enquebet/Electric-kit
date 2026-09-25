import React, { useState, useMemo } from 'react';
import {
  calculateThermalNoise,
  calculateNoiseFigureFactor,
  calculateReceiverNoiseFloor,
  calculateCascadedNoiseFigure,
  calculateAdcQuantizationSnr,
  NoiseStage,
} from '../../engines/rf/rf-noise';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { toBaseUnit } from '../../lib/units/quantities';
import { Volume2, Layers, Gauge, Activity, ShieldCheck, Plus, Trash2 } from 'lucide-react';

export const RfNoiseTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'thermal' | 'nf-temp' | 'noise-floor' | 'cascaded' | 'adc-dr'>('thermal');

  // Tab 1: Thermal Noise
  const [tempMode, setTempMode] = useState<'K' | 'C'>('K');
  const [tempVal, setTempVal] = useState<number>(290.0);
  const [bwVal, setBwVal] = useState<number>(1.0);
  const [bwUnit, setBwUnit] = useState<string>('MHz');
  const bwHz = toBaseUnit(bwVal, 'frequency', bwUnit);

  const thermalResult = useMemo(() => {
    return calculateThermalNoise({
      bandwidthHz: bwHz,
      temperatureKelvin: tempMode === 'K' ? tempVal : tempVal + 273.15,
    });
  }, [bwHz, tempMode, tempVal]);

  // Tab 2: Noise Figure & Temperature
  const [nfMode, setNfMode] = useState<'from_nf' | 'from_te' | 'from_factor'>('from_nf');
  const [nfVal, setNfVal] = useState<number>(3.0);

  const nfResult = useMemo(() => {
    return calculateNoiseFigureFactor({
      mode: nfMode,
      value: nfVal,
      refTempKelvin: 290,
    });
  }, [nfMode, nfVal]);

  // Tab 3: Receiver Noise Floor & Sensitivity
  const [rxBw, setRxBw] = useState<number>(20.0);
  const [rxBwUnit, setRxBwUnit] = useState<string>('MHz');
  const [rxNf, setRxNf] = useState<number>(4.5);
  const [reqSnr, setReqSnr] = useState<number>(10.0); // e.g. 10 dB SNR for QPSK
  const rxBwHz = toBaseUnit(rxBw, 'frequency', rxBwUnit);

  const noiseFloorResult = useMemo(() => {
    return calculateReceiverNoiseFloor({
      bandwidthHz: rxBwHz,
      noiseFigureDb: rxNf,
      requiredSnrDb: reqSnr,
    });
  }, [rxBwHz, rxNf, reqSnr]);

  // Tab 4: Cascaded Noise Figure (Friis)
  const [cascadedStages, setCascadedStages] = useState<NoiseStage[]>([
    { name: 'RF Filter (Preselector)', gainDb: -1.5, noiseFigureDb: 1.5 },
    { name: 'Low Noise Amplifier (LNA)', gainDb: 20.0, noiseFigureDb: 1.2 },
    { name: 'Interstage SAW Filter', gainDb: -2.0, noiseFigureDb: 2.0 },
    { name: 'Mixer Downconverter', gainDb: -6.0, noiseFigureDb: 7.0 },
    { name: 'IF Amplifier', gainDb: 25.0, noiseFigureDb: 4.0 },
  ]);

  const [newStageName, setNewStageName] = useState<string>('');
  const [newStageGain, setNewStageGain] = useState<number>(10);
  const [newStageNf, setNewStageNf] = useState<number>(2);

  const cascadedResult = useMemo(() => {
    return calculateCascadedNoiseFigure({
      stages: cascadedStages,
    });
  }, [cascadedStages]);

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    setCascadedStages([
      ...cascadedStages,
      { name: newStageName.trim(), gainDb: newStageGain, noiseFigureDb: newStageNf },
    ]);
    setNewStageName('');
    setNewStageGain(10);
    setNewStageNf(2);
  };

  const handleRemoveStage = (idx: number) => {
    setCascadedStages(cascadedStages.filter((_, i) => i !== idx));
  };

  // Tab 5: ADC & Dynamic Range
  const [adcBits, setAdcBits] = useState<number>(12);
  const [enob, setEnob] = useState<number>(10.8);
  const adcResult = useMemo(() => {
    return calculateAdcQuantizationSnr({
      resolutionBits: adcBits,
      enob,
    });
  }, [adcBits, enob]);

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation Bar */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('thermal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'thermal'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          Thermal Noise (kTB &amp; -174 dBm/Hz)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nf-temp')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'nf-temp'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          NF, Noise Factor &amp; Noise Temp
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('noise-floor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'noise-floor'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Noise Floor &amp; RX Sensitivity
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cascaded')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cascaded'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Cascaded Noise (Friis Formula)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('adc-dr')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'adc-dr'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          ADC Dynamic Range &amp; ENOB
        </button>
      </div>

      {/* TAB 1: THERMAL NOISE */}
      {activeTab === 'thermal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Thermal Noise Parameters</h3>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400">Physical Temperature</label>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTempMode('K')}
                    className={`px-1.5 py-0.5 rounded ${tempMode === 'K' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    K
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempMode('C')}
                    className={`px-1.5 py-0.5 rounded ${tempMode === 'C' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    °C
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="any"
                value={tempVal}
                onChange={(e) => setTempVal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500">Standard reference T₀ = 290 K (~16.85 °C / ~62.3 °F).</span>
            </div>

            <UnitInput
              id="bw-input"
              label="Noise Bandwidth (B)"
              symbol="B"
              value={bwVal}
              unit={bwUnit}
              quantity="frequency"
              onChangeValue={setBwVal}
              onChangeUnit={setBwUnit}
            />
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Thermal Noise Power (kTB)</span>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {thermalResult.powerDbm.toFixed(2)} dBm
              </div>
              <span className="text-xs font-mono text-slate-400">
                {thermalResult.powerWatts.toExponential(4)} Watts ({thermalResult.powerDbw.toFixed(2)} dBW)
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Available thermal Johnson-Nyquist noise power delivered into a matched load over the specified bandwidth.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Noise Spectral Density (N₀ = kT)</span>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {thermalResult.noiseSpectralDensityDbmHz.toFixed(2)} dBm/Hz
              </div>
              <span className="text-xs font-mono text-slate-400">
                {thermalResult.noiseSpectralDensityWHz.toExponential(4)} W/Hz
              </span>
              <p className="text-xs text-slate-400 mt-2">
                At T₀ = 290 K, N₀ is universally referenced as exactly -174.0 dBm/Hz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NF, NOISE FACTOR & TEMP */}
      {activeTab === 'nf-temp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Input Mode</h3>

            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'from_nf', label: 'NF (dB)' },
                  { id: 'from_factor', label: 'Factor (F)' },
                  { id: 'from_te', label: 'Temp (Te)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setNfMode(m.id as any)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                      nfMode === m.id
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">
                {nfMode === 'from_nf' ? 'Noise Figure (dB)' : nfMode === 'from_factor' ? 'Noise Factor (F, linear)' : 'Noise Temperature (Kelvin)'}
              </label>
              <input
                type="number"
                step="any"
                value={nfVal}
                onChange={(e) => setNfVal(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Noise Figure (NF)</span>
              <span className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {nfResult.noiseFigureDb.toFixed(2)} dB
              </span>
              <span className="text-[10px] text-slate-500 mt-1">NF = 10·log₁₀(F)</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Noise Factor (F)</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {nfResult.noiseFactorLinear.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">F = SNR_in / SNR_out</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Equivalent Noise Temp (T_e)</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {nfResult.equivalentNoiseTempKelvin.toFixed(1)} K
              </span>
              <span className="text-[10px] text-slate-500 mt-1">T_e = T₀ · (F - 1)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOISE FLOOR & RX SENSITIVITY */}
      {activeTab === 'noise-floor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Receiver Specifications</h3>

            <UnitInput
              id="rxbw-input"
              label="Channel Bandwidth (BW)"
              symbol="BW"
              value={rxBw}
              unit={rxBwUnit}
              quantity="frequency"
              onChangeValue={setRxBw}
              onChangeUnit={setRxBwUnit}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Receiver Noise Figure (NF, dB)</label>
              <input
                type="number"
                step="0.1"
                value={rxNf}
                onChange={(e) => setRxNf(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Required Demodulation SNR (dB)</label>
              <input
                type="number"
                step="0.5"
                value={reqSnr}
                onChange={(e) => setReqSnr(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500">
                E.g. ~3-5 dB for BPSK, ~10 dB for QPSK, ~18 dB for 16-QAM, ~24 dB for 64-QAM.
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receiver Noise Floor</span>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {noiseFloorResult.noiseFloorDbm.toFixed(2)} dBm
              </div>
              <span className="text-xs font-mono text-slate-400">
                P_noise = -174 + 10·log₁₀(BW) + NF
              </span>
              <p className="text-xs text-slate-400 mt-2">
                The minimum intrinsic noise power present at the receiver input inside the channel bandwidth.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receiver Sensitivity (MDS)</span>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {noiseFloorResult.sensitivityDbm !== undefined ? `${noiseFloorResult.sensitivityDbm.toFixed(2)} dBm` : '—'}
              </div>
              <span className="text-xs font-mono text-slate-400">
                S_rx = Noise Floor + SNR_required
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Minimum detectable signal required at the antenna connector to achieve the target bit error rate (BER).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CASCADED NOISE FIGURE (FRIIS) */}
      {activeTab === 'cascaded' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Cascaded RF Chain</h3>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add Stage</span>
              <input
                type="text"
                placeholder="Stage Name (e.g. LNA)"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">Gain (dB)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newStageGain}
                    onChange={(e) => setNewStageGain(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">NF (dB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStageNf}
                    onChange={(e) => setNewStageNf(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddStage}
                className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Stage
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Total Cascaded NF</span>
                <span className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {cascadedResult.totalNoiseFigureDb.toFixed(2)} dB
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  F_total = {cascadedResult.totalNoiseFactorLinear.toFixed(3)}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Total System Gain</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {cascadedResult.totalGainDb >= 0 ? `+${cascadedResult.totalGainDb.toFixed(2)}` : cascadedResult.totalGainDb.toFixed(2)} dB
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  Overall amplifier chain gain
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Effective Noise Temp</span>
                <span className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {cascadedResult.totalEquivalentNoiseTempKelvin.toFixed(1)} K
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  T_e = 290 · (F_tot - 1)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3 overflow-x-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Friis Noise Stage Breakdown</span>
                <span className="text-[11px] font-mono text-cyan-400">F_tot = F₁ + (F₂-1)/G₁ + (F₃-1)/(G₁G₂) ...</span>
              </div>
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2 font-sans font-semibold">Stage Name</th>
                    <th className="py-2 px-2">Stage Gain</th>
                    <th className="py-2 px-2">Stage NF</th>
                    <th className="py-2 px-2">Noise Contribution (ΔF)</th>
                    <th className="py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cascadedResult.stages.map((st, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-sans text-slate-200 font-medium">{st.name}</td>
                      <td className={`py-2 px-2 ${st.gainDb >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {st.gainDb >= 0 ? `+${st.gainDb.toFixed(2)}` : st.gainDb.toFixed(2)} dB
                      </td>
                      <td className="py-2 px-2 text-slate-300">{st.noiseFigureDb.toFixed(2)} dB</td>
                      <td className="py-2 px-2 text-cyan-300 font-bold">
                        +{st.stageContributionLinear.toFixed(4)}
                      </td>
                      <td className="py-2 px-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(idx)}
                          className="text-slate-600 hover:text-rose-400 transition-colors p-1 cursor-pointer"
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

      {/* TAB 5: ADC & DYNAMIC RANGE */}
      {activeTab === 'adc-dr' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">ADC Quantization Parameters</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Nominal Resolution (N Bits)</label>
              <input
                type="number"
                min="1"
                max="32"
                value={adcBits}
                onChange={(e) => setAdcBits(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Effective Number of Bits (ENOB)</label>
              <input
                type="number"
                step="0.1"
                value={enob}
                onChange={(e) => setEnob(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500">
                Datasheet ENOB accounts for actual converter distortion (SINAD), clock jitter, and non-linearity.
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ideal Theoretical SNR</span>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {adcResult.idealSnrDb.toFixed(2)} dB
              </div>
              <span className="text-xs font-mono text-slate-400">
                SNR = 6.02·N + 1.76 dB ({adcBits} bits = {adcResult.quantizationLevels} levels)
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Fundamental limit set purely by uniform quantization rounding noise across the Nyquist bandwidth.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actual SINAD from ENOB</span>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {adcResult.sinadFromEnobDb !== undefined ? `${adcResult.sinadFromEnobDb.toFixed(2)} dB` : '—'}
              </div>
              <span className="text-xs font-mono text-slate-400">
                SINAD = 6.02·ENOB + 1.76 dB
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Real-world signal-to-noise and distortion ratio measured in lab testing at full scale.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
