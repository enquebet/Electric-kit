import React, { useState, useMemo } from 'react';
import {
  calculatePcbSpreadingResistance,
  calculateThermalViaArray,
  calculatePcbCopperPlaneConductivity,
  calculateEnclosureHeatTransfer,
  calculateSealedEnclosureTemp,
  calculateVentedEnclosureStackEffect,
  calculateEnclosureFanCfm,
  calculateSolarRadiationHeatLoad,
  calculateStefanBoltzmannRadiation,
  calculateCombinedConvectionRadiation,
} from '../../engines/thermal/pcb_enclosure';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Box, Sun, Wind, Layers, Cpu, Radio } from 'lucide-react';

export function PcbEnclosureThermalTool() {
  const [activeTab, setActiveTab] = useState<'pcb_spreading' | 'thermal_vias' | 'enclosure_cooling' | 'radiation_solar'>('pcb_spreading');

  // 1. PCB Spreading & Copper Planes
  const [sourceW, setSourceW] = useState<number>(10);
  const [sourceL, setSourceL] = useState<number>(10);
  const [subW, setSubW] = useState<number>(60);
  const [subL, setSubL] = useState<number>(60);
  const [pcbThickMm, setPcbThickMm] = useState<number>(1.6);
  const [pcbKM, setPcbKM] = useState<number>(18.5); // effective k
  const [copperLayerCount, setCopperLayerCount] = useState<number>(4);
  const [copperOz, setCopperOz] = useState<number>(1.0);

  // 2. Thermal Vias
  const [viaDrillMm, setViaDrillMm] = useState<number>(0.3);
  const [viaPlatingUm, setViaPlatingUm] = useState<number>(25);
  const [viaCount, setViaCount] = useState<number>(16);
  const [viaFill, setViaFill] = useState<'air' | 'solder_sac305' | 'conductive_epoxy'>('solder_sac305');

  // 3. Enclosure Cooling (Sealed vs Vented vs Fan)
  const [encLengthM, setEncLengthM] = useState<number>(0.25);
  const [encWidthM, setEncWidthM] = useState<number>(0.18);
  const [encHeightM, setEncHeightM] = useState<number>(0.10);
  const [internalHeatW, setInternalHeatW] = useState<number>(35);
  const [ambientTaC, setAmbientTaC] = useState<number>(30);
  const [wallThickMm, setWallThickMm] = useState<number>(2.0);
  const [wallK, setWallK] = useState<number>(167); // Al
  const [coolingMode, setCoolingMode] = useState<'sealed' | 'vented' | 'fan'>('sealed');
  const [ventHeightM, setVentHeightM] = useState<number>(0.08);
  const [ventAreaCm2, setVentAreaCm2] = useState<number>(15);
  const [targetRiseC, setTargetRiseC] = useState<number>(15);

  // 4. Radiation & Solar Load
  const [surfTempC, setSurfTempC] = useState<number>(75);
  const [radAmbC, setRadAmbC] = useState<number>(35);
  const [emissivity, setEmissivity] = useState<number>(0.85);
  const [solarFluxW, setSolarFluxW] = useState<number>(900);
  const [solarFinish, setSolarFinish] = useState<'gloss_white_paint' | 'bare_aluminum' | 'anodized_black' | 'dark_gray_industrial'>('bare_aluminum');

  // Calculations
  const spreadingResult = useMemo(() => {
    return calculatePcbSpreadingResistance({
      sourceLengthMm: sourceL,
      sourceWidthMm: sourceW,
      substrateLengthMm: subL,
      substrateWidthMm: subW,
      pcbThicknessMm: pcbThickMm,
      pcbConductivityWmK: pcbKM,
    });
  }, [sourceL, sourceW, subL, subW, pcbThickMm, pcbKM]);

  const planesResult = useMemo(() => {
    return calculatePcbCopperPlaneConductivity({
      totalThicknessMm: pcbThickMm,
      layersCount: copperLayerCount,
      copperLayers: Array(copperLayerCount).fill({ thicknessOz: copperOz, coverageFraction: 0.75 }),
    });
  }, [pcbThickMm, copperLayerCount, copperOz]);

  const viaResult = useMemo(() => {
    return calculateThermalViaArray({
      drillDiameterMm: viaDrillMm,
      platingThicknessUm: viaPlatingUm,
      pcbThicknessMm: pcbThickMm,
      viaCount,
      filledMaterial: viaFill,
    });
  }, [viaDrillMm, viaPlatingUm, pcbThickMm, viaCount, viaFill]);

  const enclosureResult = useMemo(() => {
    return calculateEnclosureHeatTransfer({
      lengthM: encLengthM,
      widthM: encWidthM,
      heightM: encHeightM,
      wallThicknessMm: wallThickMm,
      wallMaterialConductivityWmK: wallK,
      internalHeatWatts: internalHeatW,
      ambientTempC: ambientTaC,
      surfaceEmissivity: emissivity,
    });
  }, [encLengthM, encWidthM, encHeightM, wallThickMm, wallK, internalHeatW, ambientTaC, emissivity]);

  const ventedResult = useMemo(() => {
    return calculateVentedEnclosureStackEffect(
      internalHeatW,
      ventHeightM,
      ventAreaCm2 * 1e-4,
      ventAreaCm2 * 1e-4,
      ambientTaC
    );
  }, [internalHeatW, ventHeightM, ventAreaCm2, ambientTaC]);

  const fanResult = useMemo(() => {
    return calculateEnclosureFanCfm(internalHeatW, targetRiseC);
  }, [internalHeatW, targetRiseC]);

  const solarResult = useMemo(() => {
    const projArea = encLengthM * encWidthM;
    return calculateSolarRadiationHeatLoad({
      solarIrradianceWperM2: solarFluxW,
      projectedAreaM2: projArea,
      surfaceFinish: solarFinish,
    });
  }, [solarFluxW, encLengthM, encWidthM, solarFinish]);

  const radiationResult = useMemo(() => {
    return calculateStefanBoltzmannRadiation({
      surfaceTempC: surfTempC,
      ambientOrEnclosureTempC: radAmbC,
      surfaceAreaM2: 0.05,
      emissivity,
    });
  }, [surfTempC, radAmbC, emissivity]);

  const combinedResult = useMemo(() => {
    return calculateCombinedConvectionRadiation(surfTempC, radAmbC, 0.05, 6.5, emissivity);
  }, [surfTempC, radAmbC, emissivity]);

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('pcb_spreading')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'pcb_spreading' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          PCB Spreading & Planes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('thermal_vias')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'thermal_vias' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Thermal Via Arrays
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('enclosure_cooling')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'enclosure_cooling' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          Enclosure Heat Dissipation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('radiation_solar')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'radiation_solar' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          Radiation & Solar Load
        </button>
      </div>

      {/* Tab 1: PCB Spreading & Planes */}
      {activeTab === 'pcb_spreading' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">PCB Conduction & Spreading Geometry</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Component Width (mm)</label>
                <input
                  type="number"
                  value={sourceW}
                  onChange={(e) => setSourceW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Component Length (mm)</label>
                <input
                  type="number"
                  value={sourceL}
                  onChange={(e) => setSourceL(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">PCB Substrate W (mm)</label>
                <input
                  type="number"
                  value={subW}
                  onChange={(e) => setSubW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">PCB Substrate L (mm)</label>
                <input
                  type="number"
                  value={subL}
                  onChange={(e) => setSubL(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">PCB Thickness (mm)</label>
                <input
                  type="number"
                  step="0.2"
                  value={pcbThickMm}
                  onChange={(e) => setPcbThickMm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Copper Layers Count</label>
                <input
                  type="number"
                  value={copperLayerCount}
                  onChange={(e) => setCopperLayerCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Spreading Resistance (R_spread)" value={spreadingResult.spreadingResistanceKW.toFixed(2)} unit="°C/W" highlight />
              <ResultCard label="1D Through-Thickness R" value={spreadingResult.oneDimConductionResistanceKW.toFixed(2)} unit="°C/W" />
              <ResultCard label="In-Plane Cond. (k_xy)" value={planesResult.inPlaneConductivityKxyWmK.toFixed(1)} unit="W/mK" />
              <ResultCard label="Through-Plane Cond. (k_z)" value={planesResult.throughPlaneConductivityKzWmK.toFixed(3)} unit="W/mK" />
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs text-slate-400">
              <p>
                <strong className="text-slate-200">Orthotropic Conductivity Anisotropy:</strong> In-plane conductivity is{' '}
                <span className="text-cyan-300 font-bold">{planesResult.anisotropyRatio}× higher</span> than through-plane
                conductivity because continuous copper planes conduct heat laterally along x-y planes, while FR4 epoxy limits through-plane heat transfer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Thermal Vias */}
      {activeTab === 'thermal_vias' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Thermal Via Array Parameters</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Drill Diameter (mm)</label>
                <input
                  type="number"
                  step="0.05"
                  value={viaDrillMm}
                  onChange={(e) => setViaDrillMm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Copper Barrel Plating (µm)</label>
                <input
                  type="number"
                  value={viaPlatingUm}
                  onChange={(e) => setViaPlatingUm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Number of Vias (N)</label>
                <input
                  type="number"
                  value={viaCount}
                  onChange={(e) => setViaCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Via Fill Material</label>
                <select
                  value={viaFill}
                  onChange={(e) => setViaFill(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                >
                  <option value="solder_sac305">Solder Filled (58 W/mK)</option>
                  <option value="conductive_epoxy">Conductive Epoxy (8 W/mK)</option>
                  <option value="air">Open Barrel / Air Filled (0.026 W/mK)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Array Equivalent Rθ" value={viaResult.arrayEquivalentResistanceKW.toFixed(2)} unit="°C/W" highlight />
              <ResultCard label="Single Via Resistance" value={viaResult.singleViaResistanceKW.toFixed(1)} unit="°C/W" />
              <ResultCard label="Copper Cross-Section" value={viaResult.singleViaCopperAreaMm2.toFixed(4)} unit="mm²" />
              <ResultCard label="Total Array Area" value={viaResult.totalViasAreaMm2.toFixed(2)} unit="mm²" />
            </div>

            <CalculationStepViewer
              steps={[
                {
                  title: 'Plated Through-Hole Cylindrical Resistance',
                  formula: 'R_{via} = \\frac{L_{pcb}}{k_{cu} \\cdot A_{cu} + k_{fill} \\cdot A_{fill}}',
                  substitution: `Single via = ${viaResult.singleViaResistanceKW.toFixed(1)} °C/W`,
                },
                {
                  title: 'Parallel Via Array Resistance',
                  formula: 'R_{array} = \\frac{R_{via}}{N}',
                  substitution: `${viaResult.singleViaResistanceKW.toFixed(1)} / ${viaCount} = ${viaResult.arrayEquivalentResistanceKW.toFixed(2)} °C/W`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Enclosure Heat Dissipation */}
      {activeTab === 'enclosure_cooling' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Enclosure Dissipation Architecture</h3>
            <div className="flex gap-2">
              {(['sealed', 'vented', 'fan'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCoolingMode(m)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg border ${
                    coolingMode === m ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {m === 'sealed' ? 'Sealed NEMA/IP67' : m === 'vented' ? 'Natural Vented' : 'Fan Forced'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Length (m)</label>
                <input
                  type="number"
                  step="0.05"
                  value={encLengthM}
                  onChange={(e) => setEncLengthM(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Width (m)</label>
                <input
                  type="number"
                  step="0.05"
                  value={encWidthM}
                  onChange={(e) => setEncWidthM(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Height (m)</label>
                <input
                  type="number"
                  step="0.05"
                  value={encHeightM}
                  onChange={(e) => setEncHeightM(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Internal Heat (Watts)</label>
                <input
                  type="number"
                  value={internalHeatW}
                  onChange={(e) => setInternalHeatW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Ambient Ta (°C)</label>
                <input
                  type="number"
                  value={ambientTaC}
                  onChange={(e) => setAmbientTaC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {coolingMode === 'sealed' && (
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Internal Air Temp" value={enclosureResult.internalAirTempC.toFixed(1)} unit="°C" highlight />
                <ResultCard label="Surface Temp" value={enclosureResult.externalSurfaceTempC.toFixed(1)} unit="°C" />
                <ResultCard label="Overall U Coefficient" value={enclosureResult.overallUWm2K.toFixed(2)} unit="W/(m²·K)" />
                <ResultCard label="Total Envelope Area" value={enclosureResult.surfaceAreaM2.toFixed(3)} unit="m²" />
              </div>
            )}

            {coolingMode === 'vented' && (
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Vented Air Temp" value={ventedResult.internalAirTempC.toFixed(1)} unit="°C" highlight />
                <ResultCard label="Natural Draft Velocity" value={ventedResult.draftVelocityMps.toFixed(3)} unit="m/s" />
                <ResultCard label="Airflow Generated" value={ventedResult.volumetricAirflowCfm.toFixed(1)} unit="CFM" />
                <ResultCard label="Air Rise ΔT" value={ventedResult.airTempRiseC.toFixed(1)} unit="°C" />
              </div>
            )}

            {coolingMode === 'fan' && (
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Required Fan CFM" value={fanResult.requiredCfm.toFixed(1)} unit="CFM" highlight />
                <ResultCard label="Recommendation" value={fanResult.fanSelectionRecommendation} unit="" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Radiation & Solar Load */}
      {activeTab === 'radiation_solar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Stefan-Boltzmann Radiation & Solar Load</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Surface Temp (°C)</label>
                <input
                  type="number"
                  value={surfTempC}
                  onChange={(e) => setSurfTempC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Surroundings Temp (°C)</label>
                <input
                  type="number"
                  value={radAmbC}
                  onChange={(e) => setRadAmbC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Emissivity ε (0 to 1)</label>
                <input
                  type="number"
                  step="0.05"
                  value={emissivity}
                  onChange={(e) => setEmissivity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Solar Finish</label>
                <select
                  value={solarFinish}
                  onChange={(e) => setSolarFinish(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                >
                  <option value="bare_aluminum">Bare Aluminum (α = 0.55)</option>
                  <option value="gloss_white_paint">White Paint (α = 0.22)</option>
                  <option value="dark_gray_industrial">Dark Gray (α = 0.80)</option>
                  <option value="anodized_black">Black Anodized (α = 0.94)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Radiated Heat Power" value={radiationResult.radiatedPowerWatts.toFixed(2)} unit="Watts" highlight />
              <ResultCard label="Linearized h_rad" value={radiationResult.linearizedRadiativeHWm2K.toFixed(2)} unit="W/(m²·K)" />
              <ResultCard label="Solar Absorbed Load" value={solarResult.absorbedSolarHeatWatts.toFixed(1)} unit="Watts" />
              <ResultCard label="Combined Total h_eff" value={combinedResult.effectiveTotalHWm2K.toFixed(2)} unit="W/(m²·K)" />
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs text-slate-400">
              <p>
                <strong className="text-slate-200">Cooling Loss Balance:</strong> Convection accounts for{' '}
                <span className="text-cyan-300 font-bold">{combinedResult.convectionFractionPct}%</span> and radiation accounts for{' '}
                <span className="text-amber-300 font-bold">{combinedResult.radiationFractionPct}%</span> of total heat rejection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
