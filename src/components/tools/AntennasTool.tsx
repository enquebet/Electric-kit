import React, { useState, useMemo } from 'react';
import {
  calculateAntennaDimensions,
  calculateAntennaGain,
  calculateEffectiveAperture,
  estimateApertureBeamwidth,
  POLARIZATION_MISMATCH_TABLE,
} from '../../engines/rf/antennas';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { toBaseUnit } from '../../lib/units/quantities';
import { Radio, Disc, Maximize2, Compass, ShieldAlert, Sparkles } from 'lucide-react';

export const AntennasTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dimensions' | 'gain' | 'aperture' | 'beamwidth' | 'polarization'>('dimensions');

  // Tab 1: Dimensions
  const [dimFreq, setDimFreq] = useState<number>(433.92);
  const [dimFreqUnit, setDimFreqUnit] = useState<string>('MHz');
  const [dimVf, setDimVf] = useState<number>(0.95); // Bare wire / insulated wire factor
  const dimFreqHz = toBaseUnit(dimFreq, 'frequency', dimFreqUnit);

  const dimResult = useMemo(() => {
    return calculateAntennaDimensions({
      frequencyHz: dimFreqHz,
      velocityFactor: dimVf,
    });
  }, [dimFreqHz, dimVf]);

  // Tab 2: Gain & Efficiency
  const [directivityDbi, setDirectivityDbi] = useState<number>(6.0);
  const [efficiencyPct, setEfficiencyPct] = useState<number>(85);

  const gainResult = useMemo(() => {
    return calculateAntennaGain({
      directivityDbi,
      radiationEfficiencyPercent: efficiencyPct,
    });
  }, [directivityDbi, efficiencyPct]);

  // Tab 3: Effective Aperture
  const [apFreq, setApFreq] = useState<number>(2.4);
  const [apFreqUnit, setApFreqUnit] = useState<string>('GHz');
  const [apGainDbi, setApGainDbi] = useState<number>(12.0);
  const [powerDensity, setPowerDensity] = useState<number>(0.1); // W/m²
  const apFreqHz = toBaseUnit(apFreq, 'frequency', apFreqUnit);

  const apResult = useMemo(() => {
    return calculateEffectiveAperture({
      frequencyHz: apFreqHz,
      gainDbi: apGainDbi,
      powerDensityWattsPerM2: powerDensity,
    });
  }, [apFreqHz, apGainDbi, powerDensity]);

  // Tab 4: Dish Beamwidth
  const [dishFreq, setDishFreq] = useState<number>(10.5);
  const [dishFreqUnit, setDishFreqUnit] = useState<string>('GHz');
  const [dishDiameter, setDishDiameter] = useState<number>(0.6); // 60 cm dish
  const [dishEff, setDishEff] = useState<number>(55);
  const dishFreqHz = toBaseUnit(dishFreq, 'frequency', dishFreqUnit);

  const dishResult = useMemo(() => {
    return estimateApertureBeamwidth({
      frequencyHz: dishFreqHz,
      diameterMeters: dishDiameter,
      apertureEfficiencyPercent: dishEff,
    });
  }, [dishFreqHz, dishDiameter, dishEff]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('dimensions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'dimensions'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Resonant Dimensions (λ/4, λ/2, 5/8λ)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gain')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gain'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Directivity, Realized Gain &amp; Efficiency
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('aperture')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'aperture'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Effective Aperture (A_e)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('beamwidth')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'beamwidth'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          Aperture Beamwidth (Dish)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('polarization')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'polarization'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Polarization Mismatch Table
        </button>
      </div>

      {/* TAB 1: RESONANT DIMENSIONS */}
      {activeTab === 'dimensions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Resonant Frequency</h3>
            <UnitInput
              id="dim-freq-input"
              label="Operating Frequency"
              symbol="f"
              value={dimFreq}
              unit={dimFreqUnit}
              quantity="frequency"
              onChangeValue={setDimFreq}
              onChangeUnit={setDimFreqUnit}
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400">End-Effect / Velocity Factor (k)</span>
                <span className="font-mono text-cyan-400">{dimVf.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.00"
                step="0.01"
                value={dimVf}
                onChange={(e) => setDimVf(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500">
                Typically 0.95 for thin wire dipoles, 0.90–0.93 for thick elements / PCB traces, 1.00 for ideal vacuum.
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Quarter-Wave Monopole (λ/4)</span>
              <span className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {dimResult.quarterWaveMeters < 1
                  ? `${(dimResult.quarterWaveMeters * 100).toFixed(2)} cm`
                  : `${dimResult.quarterWaveMeters.toFixed(3)} m`}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                {(dimResult.quarterWaveMeters * 39.37).toFixed(2)} inches | Needs ground plane (~36.5 Ω)
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">Half-Wave Dipole (λ/2)</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {dimResult.halfWaveMeters < 1
                  ? `${(dimResult.halfWaveMeters * 100).toFixed(2)} cm`
                  : `${dimResult.halfWaveMeters.toFixed(3)} m`}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                {(dimResult.halfWaveMeters * 39.37).toFixed(2)} inches | Balanced center feed (~73 Ω)
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
              <span className="text-xs text-slate-400 font-medium">5/8-Wave Monopole (5/8λ)</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {dimResult.fiveEighthsWaveMeters < 1
                  ? `${(dimResult.fiveEighthsWaveMeters * 100).toFixed(2)} cm`
                  : `${dimResult.fiveEighthsWaveMeters.toFixed(3)} m`}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                {(dimResult.fiveEighthsWaveMeters * 39.37).toFixed(2)} inches | Low radiation angle (~3 dBi)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GAIN & EFFICIENCY */}
      {activeTab === 'gain' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Antenna Parameters</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Directivity (dBi)</label>
              <input
                type="number"
                step="0.1"
                value={directivityDbi}
                onChange={(e) => setDirectivityDbi(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400">Radiation Efficiency (η)</span>
                <span className="font-mono text-cyan-400">{efficiencyPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={efficiencyPct}
                onChange={(e) => setEfficiencyPct(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500">
                η = R_rad / (R_rad + R_loss). Accounts for copper ohmic losses and dielectric dissipation.
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realized Gain (dBi)</span>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {gainResult.realizedGainDbi.toFixed(2)} dBi
              </div>
              <span className="text-xs font-mono text-slate-400">
                Linear Gain: {gainResult.gainLinear.toFixed(2)}× isotropic
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Gain combines directional focusing (directivity) with electrical efficiency: G = η · D.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dipole-Referenced Gain (dBd)</span>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {gainResult.gainDbd.toFixed(2)} dBd
              </div>
              <span className="text-xs font-mono text-slate-400">
                G_dBd = G_dBi - 2.15 dB
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Referenced to a standard half-wave resonant dipole in free space rather than an isotropic point source.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EFFECTIVE APERTURE */}
      {activeTab === 'aperture' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Aperture Settings</h3>

            <UnitInput
              id="ap-freq-input"
              label="Operating Frequency"
              symbol="f"
              value={apFreq}
              unit={apFreqUnit}
              quantity="frequency"
              onChangeValue={setApFreq}
              onChangeUnit={setApFreqUnit}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Antenna Gain (dBi)</label>
              <input
                type="number"
                step="0.5"
                value={apGainDbi}
                onChange={(e) => setApGainDbi(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Incident Power Flux Density (W/m²)</label>
              <input
                type="number"
                step="any"
                value={powerDensity}
                onChange={(e) => setPowerDensity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Effective Aperture Area (A_e)</span>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {apResult.effectiveApertureM2 < 0.01
                  ? `${(apResult.effectiveApertureM2 * 1e4).toFixed(2)} cm²`
                  : `${apResult.effectiveApertureM2.toFixed(4)} m²`}
              </div>
              <span className="text-xs font-mono text-slate-400">
                A_e = (G · λ²) / (4π)
              </span>
              <p className="text-xs text-slate-400 mt-2">
                The effective geometric capture cross-section an antenna presents to an incoming electromagnetic wavefront.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Intercepted RF Power</span>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {apResult.receivedPowerWatts !== undefined
                  ? `${(apResult.receivedPowerWatts * 1000).toFixed(3)} mW`
                  : '—'}
              </div>
              <span className="text-xs font-mono text-slate-400">
                P_rx = S · A_e
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Delivered power into a matched load at the receiver terminals assuming co-polarized alignment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: APERTURE BEAMWIDTH (DISH) */}
      {activeTab === 'beamwidth' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-slate-200">Parabolic Reflector Settings</h3>

            <UnitInput
              id="dish-freq-input"
              label="Operating Frequency"
              symbol="f"
              value={dishFreq}
              unit={dishFreqUnit}
              quantity="frequency"
              onChangeValue={setDishFreq}
              onChangeUnit={setDishFreqUnit}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Dish Diameter (meters)</label>
              <input
                type="number"
                step="0.05"
                value={dishDiameter}
                onChange={(e) => setDishDiameter(parseFloat(e.target.value) || 0.1)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Aperture Illumination Efficiency (%)</label>
              <input
                type="number"
                value={dishEff}
                onChange={(e) => setDishEff(parseFloat(e.target.value) || 55)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500">Typically 50% - 65% for parabolic prime-focus or Cassegrain feeds.</span>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated 3dB Beamwidth (HPBW)</span>
                <div className="text-3xl font-bold font-mono text-cyan-400">
                  {dishResult.beamwidthDeg.toFixed(2)}°
                </div>
                <span className="text-xs font-mono text-slate-400">
                  θ_3dB ≈ 70° · (λ / D)
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Full angle between half-power points of main radiation lobe.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Antenna Gain</span>
                <div className="text-3xl font-bold font-mono text-emerald-400">
                  {dishResult.estimatedGainDbi.toFixed(2)} dBi
                </div>
                <span className="text-xs font-mono text-slate-400">
                  G ≈ η · (π · D / λ)²
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Theoretical boresight gain for circular parabolic reflector.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Aperture-Only Constraint:</strong> This beamwidth approximation is strictly applicable to uniform/tapered aperture antennas (parabolic reflectors, horns, lens antennas) where D &gt;&gt; λ. It is NOT valid for wire antennas, dipole arrays, or small microstrip patches.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: POLARIZATION REFERENCE */}
      {activeTab === 'polarization' && (
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Antenna Polarization Alignment &amp; Mismatch Loss</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Coupling efficiency between transmit and receive antenna E-field polarization states.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                  <th className="py-2.5 px-3 font-sans font-semibold">Transmitter Polarization</th>
                  <th className="py-2.5 px-3 font-sans font-semibold">Receiver Polarization</th>
                  <th className="py-2.5 px-3">Theoretical Loss</th>
                  <th className="py-2.5 px-3 font-sans">Engineering Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {POLARIZATION_MISMATCH_TABLE.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-sans text-slate-200 font-medium">{row.tx}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-200 font-medium">{row.rx}</td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        row.lossDb === 0
                          ? 'text-emerald-400'
                          : row.lossDb === 3
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {row.lossDb === 0 ? '0 dB' : row.lossDb === Infinity ? '> 20–30 dB' : `-${row.lossDb} dB`}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
