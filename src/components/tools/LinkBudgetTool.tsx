import React, { useState, useMemo } from 'react';
import {
  calculateFspl,
  calculateEirp,
  calculateLinkBudget,
  LinkBudgetInputs,
} from '../../engines/rf/link-budget';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { Radio, Signal, Compass, ShieldCheck, AlertTriangle } from 'lucide-react';

export const LinkBudgetTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'link-budget' | 'fspl' | 'eirp'>('link-budget');

  // Link Budget Parameters
  const [txPowerDbm, setTxPowerDbm] = useState<number>(20.0); // 100 mW
  const [txCableLossDb, setTxCableLossDb] = useState<number>(1.5);
  const [txAntennaGainDbi, setTxAntennaGainDbi] = useState<number>(14.0);

  const [distanceKm, setDistanceKm] = useState<number>(5.0);
  const [frequencyMhz, setFrequencyMhz] = useState<number>(2400); // 2.4 GHz
  const [miscLossDb, setMiscLossDb] = useState<number>(2.0); // Rain, fade, connectors

  const [rxAntennaGainDbi, setRxAntennaGainDbi] = useState<number>(14.0);
  const [rxCableLossDb, setRxCableLossDb] = useState<number>(1.5);
  const [rxSensitivityDbm, setRxSensitivityDbm] = useState<number>(-85.0); // Sensitivity

  const linkBudgetResult = useMemo(() => {
    return calculateLinkBudget({
      txPowerDbm,
      txCableLossDb,
      txAntennaGainDbi,
      distanceKm,
      frequencyMhz,
      miscLossDb,
      rxAntennaGainDbi,
      rxCableLossDb,
      rxSensitivityDbm,
    });
  }, [
    txPowerDbm,
    txCableLossDb,
    txAntennaGainDbi,
    distanceKm,
    frequencyMhz,
    miscLossDb,
    rxAntennaGainDbi,
    rxCableLossDb,
    rxSensitivityDbm,
  ]);

  // FSPL Standalone Tab
  const [fsplDist, setFsplDist] = useState<number>(10);
  const [fsplDistUnit, setFsplDistUnit] = useState<'km' | 'm' | 'miles' | 'nmi'>('km');
  const [fsplFreq, setFsplFreq] = useState<number>(5.8);
  const [fsplFreqUnit, setFsplFreqUnit] = useState<'GHz' | 'MHz' | 'kHz' | 'Hz'>('GHz');

  const fsplResult = useMemo(() => {
    return calculateFspl({
      distance: fsplDist,
      distanceUnit: fsplDistUnit,
      frequency: fsplFreq,
      frequencyUnit: fsplFreqUnit,
    });
  }, [fsplDist, fsplDistUnit, fsplFreq, fsplFreqUnit]);

  // EIRP Standalone Tab
  const [eirpTxPower, setEirpTxPower] = useState<number>(23); // 200 mW
  const [eirpLoss, setEirpLoss] = useState<number>(1.0);
  const [eirpGain, setEirpGain] = useState<number>(12.0);

  const eirpResult = useMemo(() => {
    return calculateEirp({
      txPowerDbm: eirpTxPower,
      txCableLossDb: eirpLoss,
      txAntennaGainDbi: eirpGain,
    });
  }, [eirpTxPower, eirpLoss, eirpGain]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('link-budget')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'link-budget'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Signal className="w-3.5 h-3.5" />
          Complete RF Link Budget &amp; Fade Margin
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fspl')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'fspl'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Free-Space Path Loss (FSPL)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('eirp')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'eirp'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          EIRP &amp; ERP Radiation Power
        </button>
      </div>

      {/* TAB 1: COMPLETE RF LINK BUDGET */}
      {activeTab === 'link-budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Link Budget Inputs</h3>

            {/* Transmitter Block */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950/40">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Transmitter (TX)</span>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">TX Power (dBm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={txPowerDbm}
                  onChange={(e) => setTxPowerDbm(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">TX Cable Loss (dB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={txCableLossDb}
                    onChange={(e) => setTxCableLossDb(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">TX Gain (dBi)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={txAntennaGainDbi}
                    onChange={(e) => setTxAntennaGainDbi(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Propagation Path Block */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950/40">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Propagation Path</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0.1)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Frequency (MHz)</label>
                  <input
                    type="number"
                    value={frequencyMhz}
                    onChange={(e) => setFrequencyMhz(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Misc / Weather / Foliage Loss (dB)</label>
                <input
                  type="number"
                  step="0.5"
                  value={miscLossDb}
                  onChange={(e) => setMiscLossDb(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Receiver Block */}
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950/40">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Receiver (RX)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">RX Gain (dBi)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={rxAntennaGainDbi}
                    onChange={(e) => setRxAntennaGainDbi(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">RX Cable Loss (dB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rxCableLossDb}
                    onChange={(e) => setRxCableLossDb(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Receiver Sensitivity (dBm)</label>
                <input
                  type="number"
                  step="1"
                  value={rxSensitivityDbm}
                  onChange={(e) => setRxSensitivityDbm(parseFloat(e.target.value) || -90)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Link Fade Margin</span>
                <span
                  className={`text-2xl font-bold font-mono mt-1 ${
                    linkBudgetResult.fadeMarginDb >= 20
                      ? 'text-emerald-400'
                      : linkBudgetResult.fadeMarginDb >= 10
                      ? 'text-cyan-400'
                      : linkBudgetResult.fadeMarginDb >= 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {linkBudgetResult.fadeMarginDb >= 0 ? `+${linkBudgetResult.fadeMarginDb.toFixed(2)}` : linkBudgetResult.fadeMarginDb.toFixed(2)} dB
                </span>
                <span className="text-[10px] text-slate-500 mt-1 capitalize">
                  Status: {linkBudgetResult.linkStatus}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Received Power (P_rx)</span>
                <span className="text-2xl font-bold font-mono text-slate-100 mt-1">
                  {linkBudgetResult.rxPowerDbm.toFixed(2)} dBm
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  {(linkBudgetResult.rxPowerWatts * 1e9).toFixed(3)} nW (at detector)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
                <span className="text-xs text-slate-400 font-medium">Free-Space Path Loss (FSPL)</span>
                <span className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {linkBudgetResult.fsplDb.toFixed(2)} dB
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  EIRP = {linkBudgetResult.eirp.eirpDbm.toFixed(1)} dBm
                </span>
              </div>
            </div>

            {/* Recommendations & Engineering Notes */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Reliability Assessment &amp; Guidelines
              </span>
              {linkBudgetResult.recommendations.map((rec, i) => (
                <p key={i} className="text-xs text-slate-400">
                  {rec}
                </p>
              ))}
              <span className="text-[11px] text-slate-500 italic mt-1">
                Note: Standard free-space path loss model assumes ideal unobstructed line of sight (LOS) and clears first Fresnel zone. Real-world terrain, rain attenuation above 10 GHz, and multipath reflections require additional site survey margins.
              </span>
            </div>

            {/* Link Budget Waterfall Table */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3 overflow-x-auto">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Detailed Link Budget Waterfall</span>
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                    <th className="py-2 px-2 font-sans font-semibold">Budget Item</th>
                    <th className="py-2 px-2">Stage Value</th>
                    <th className="py-2 px-2">Running Subtotal</th>
                    <th className="py-2 px-2 font-sans">Engineering Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {linkBudgetResult.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-900/40 ${
                        row.type === 'summary' ? 'bg-slate-900/40 font-bold' : ''
                      }`}
                    >
                      <td className="py-2 px-2 font-sans text-slate-200">{row.parameter}</td>
                      <td
                        className={`py-2 px-2 ${
                          row.valueDb > 0 && row.type === 'gain'
                            ? 'text-emerald-400'
                            : row.valueDb < 0
                            ? 'text-rose-400'
                            : 'text-slate-200'
                        }`}
                      >
                        {row.valueDb > 0 && row.type === 'gain' ? `+${row.valueDb.toFixed(2)}` : row.valueDb.toFixed(2)} {row.unit}
                      </td>
                      <td className="py-2 px-2 text-cyan-300 font-bold">
                        {row.subtotalDbm.toFixed(2)} {row.unit === 'dB' && row.type === 'summary' ? 'dB' : 'dBm'}
                      </td>
                      <td className="py-2 px-2 font-sans text-slate-400">{row.annotation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STANDALONE FSPL */}
      {activeTab === 'fspl' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Path Distance &amp; Frequency</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Distance Value</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={fsplDist}
                  onChange={(e) => setFsplDist(parseFloat(e.target.value) || 0.001)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
                <select
                  value={fsplDistUnit}
                  onChange={(e) => setFsplDistUnit(e.target.value as any)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="km">Kilometers (km)</option>
                  <option value="m">Meters (m)</option>
                  <option value="miles">Miles (mi)</option>
                  <option value="nmi">Nautical Miles</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">RF Frequency</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={fsplFreq}
                  onChange={(e) => setFsplFreq(parseFloat(e.target.value) || 1)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
                <select
                  value={fsplFreqUnit}
                  onChange={(e) => setFsplFreqUnit(e.target.value as any)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="GHz">GHz</option>
                  <option value="MHz">MHz</option>
                  <option value="kHz">kHz</option>
                  <option value="Hz">Hz</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Free-Space Path Loss (FSPL)</span>
              <div className="text-4xl font-bold font-mono text-cyan-400">
                {fsplResult.fsplDb.toFixed(2)} dB
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block">Distance:</span>
                  <span className="text-slate-200">{(fsplResult.distanceMeters / 1000).toFixed(3)} km ({fsplResult.distanceMeters.toFixed(0)} m)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Wavelength (λ):</span>
                  <span className="text-slate-200">{(fsplResult.wavelengthMeters * 100).toFixed(2)} cm</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Frequency:</span>
                  <span className="text-slate-200">{(fsplResult.frequencyHz / 1e6).toFixed(2)} MHz</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono text-slate-400 mt-2">
                <div className="text-cyan-400 font-bold mb-1">Standard Formula Representation:</div>
                <div>FSPL(dB) = 20·log₁₀(d) + 20·log₁₀(f) + 20·log₁₀(4π/c)</div>
                <div className="text-slate-500 mt-0.5">With d in km and f in MHz: FSPL(dB) = 20·log₁₀(d_km) + 20·log₁₀(f_MHz) + 32.44</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EIRP & ERP */}
      {activeTab === 'eirp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Radiation Power Settings</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Transmitter Output Power (dBm)</label>
              <input
                type="number"
                step="0.5"
                value={eirpTxPower}
                onChange={(e) => setEirpTxPower(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Cable &amp; Connector Loss (dB)</label>
              <input
                type="number"
                step="0.1"
                value={eirpLoss}
                onChange={(e) => setEirpLoss(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Transmitter Antenna Gain (dBi)</label>
              <input
                type="number"
                step="0.5"
                value={eirpGain}
                onChange={(e) => setEirpGain(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                EIRP (Equivalent Isotropically Radiated Power)
              </span>
              <div className="text-3xl font-bold font-mono text-slate-100">
                {eirpResult.eirpDbm.toFixed(2)} dBm
              </div>
              <span className="text-sm font-mono text-slate-400">
                {eirpResult.eirpWatts.toFixed(3)} Watts ({eirpResult.eirpDbw.toFixed(2)} dBW)
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Referenced to a theoretical isotropic point source (0 dBi) radiating equally in all directions.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                ERP (Effective Radiated Power)
              </span>
              <div className="text-3xl font-bold font-mono text-slate-100">
                {eirpResult.erpDbm.toFixed(2)} dBm
              </div>
              <span className="text-sm font-mono text-slate-400">
                {eirpResult.erpWatts.toFixed(3)} Watts ({eirpResult.erpDbw.toFixed(2)} dBW)
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Referenced to an ideal half-wave dipole (2.15 dBi). Commonly used in broadcast licensing: ERP = EIRP - 2.15 dB.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
