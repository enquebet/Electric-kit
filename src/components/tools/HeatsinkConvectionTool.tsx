import React, { useState, useMemo } from 'react';
import {
  calculateRequiredHeatsinkRth,
  calculateNaturalConvectionSizing,
  calculateForcedAirSizing,
  calculateAirflowRequirement,
  calculateVelocityAndH,
  calculateExtrusionSizing,
  calculateFinEfficiency,
  calculateHeatsinkPressureDrop,
  calculateFinTemperatureProfile,
  calculateAltitudeDerating,
} from '../../engines/thermal/heatsinks';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { Wind, Box, BarChart3, CloudRain, Gauge, Activity } from 'lucide-react';

export function HeatsinkConvectionTool() {
  const [activeTab, setActiveTab] = useState<'required_rth' | 'convection' | 'airflow' | 'fins_pressure' | 'altitude'>('required_rth');

  // 1. Required Rth
  const [pDiss, setPDiss] = useState<number>(30);
  const [tjMax, setTjMax] = useState<number>(125);
  const [tAmb, setTAmb] = useState<number>(45);
  const [rJc, setRJc] = useState<number>(1.0);
  const [rCs, setRCs] = useState<number>(0.3);
  const [safetyMargin, setSafetyMargin] = useState<number>(15);

  // 2. Natural vs Forced Sizing
  const [convMode, setConvMode] = useState<'natural' | 'forced'>('forced');
  const [targetDeltaT, setTargetDeltaT] = useState<number>(35);
  const [airVelocityMps, setAirVelocityMps] = useState<number>(2.0); // ~400 LFM
  const [finOrientation, setFinOrientation] = useState<'vertical' | 'horizontal'>('vertical');

  // 3. Airflow & Velocity
  const [flowPowerW, setFlowPowerW] = useState<number>(100);
  const [allowedAirRiseC, setAllowedAirRiseC] = useState<number>(12);
  const [ductAreaCm2, setDuctAreaCm2] = useState<number>(80);

  // 4. Fin Efficiency & Pressure Drop
  const [numFins, setNumFins] = useState<number>(16);
  const [finHeightMm, setFinHeightMm] = useState<number>(35);
  const [finThickMm, setFinThickMm] = useState<number>(1.2);
  const [finLengthMm, setFinLengthMm] = useState<number>(100);
  const [baseWidthMm, setBaseWidthMm] = useState<number>(80);
  const [finK, setFinK] = useState<number>(167); // Al 6061

  // 5. Altitude Derating
  const [altitudeM, setAltitudeM] = useState<number>(2000);
  const [seaRth, setSeaRth] = useState<number>(1.5);
  const [altCoolingType, setAltCoolingType] = useState<'natural' | 'forced'>('forced');

  // Calculations
  const reqRthResult = useMemo(() => {
    try {
      return calculateRequiredHeatsinkRth({
        maxJunctionTempC: tjMax,
        ambientTempC: tAmb,
        powerWatts: pDiss,
        rthJcKW: rJc,
        rthCsKW: rCs,
        safetyMarginPct: safetyMargin,
      });
    } catch {
      return null;
    }
  }, [tjMax, tAmb, pDiss, rJc, rCs, safetyMargin]);

  const natResult = useMemo(() => {
    return calculateNaturalConvectionSizing({
      powerWatts: pDiss,
      targetDeltaTKelvin: targetDeltaT,
      finOrientation,
    });
  }, [pDiss, targetDeltaT, finOrientation]);

  const forcedResult = useMemo(() => {
    return calculateForcedAirSizing({
      powerWatts: pDiss,
      targetDeltaTKelvin: targetDeltaT,
      airVelocityMps,
    });
  }, [pDiss, targetDeltaT, airVelocityMps]);

  const extrusionEstimate = useMemo(() => {
    const target = reqRthResult ? reqRthResult.requiredRthSaKW : 1.5;
    return calculateExtrusionSizing(target, convMode === 'natural' ? 'natural' : airVelocityMps > 3 ? 'forced_high' : 'forced_low');
  }, [reqRthResult, convMode, airVelocityMps]);

  const airflowResult = useMemo(() => {
    return calculateAirflowRequirement({
      powerWatts: flowPowerW,
      allowedAirTempRiseC: allowedAirRiseC,
    });
  }, [flowPowerW, allowedAirRiseC]);

  const velocityResult = useMemo(() => {
    return calculateVelocityAndH(airflowResult.airflowCfm, ductAreaCm2 * 1e-4);
  }, [airflowResult, ductAreaCm2]);

  const finResult = useMemo(() => {
    const h = convMode === 'natural' ? natResult.heatTransferCoefficientWm2K : forcedResult.heatTransferCoefficientWm2K;
    return calculateFinEfficiency({
      finLengthM: finLengthMm * 1e-3,
      finHeightM: finHeightMm * 1e-3,
      finThicknessM: finThickMm * 1e-3,
      numberOfFins: numFins,
      baseWidthM: baseWidthMm * 1e-3,
      baseLengthM: finLengthMm * 1e-3,
      heatTransferCoefficientWm2K: h,
      finThermalConductivityWmK: finK,
    });
  }, [finLengthMm, finHeightMm, finThickMm, numFins, baseWidthMm, finK, convMode, natResult, forcedResult]);

  const pressureResult = useMemo(() => {
    const flowArea = (baseWidthMm * 1e-3 - numFins * (finThickMm * 1e-3)) * (finHeightMm * 1e-3);
    const dh = 0.015;
    return calculateHeatsinkPressureDrop(airflowResult.airflowM3s, Math.max(1e-5, flowArea), finLengthMm * 1e-3, dh);
  }, [airflowResult, baseWidthMm, numFins, finThickMm, finHeightMm, finLengthMm]);

  const profileResult = useMemo(() => {
    const m = Math.sqrt((2 * forcedResult.heatTransferCoefficientWm2K) / (finK * (finThickMm * 1e-3)));
    return calculateFinTemperatureProfile(85, tAmb, finHeightMm * 1e-3, m, 8);
  }, [forcedResult, finK, finThickMm, tAmb, finHeightMm]);

  const altResult = useMemo(() => {
    return calculateAltitudeDerating(altitudeM, seaRth, altCoolingType);
  }, [altitudeM, seaRth, altCoolingType]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('required_rth')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'required_rth' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          Required Rθsa & Sizing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('convection')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'convection' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          Natural vs Forced Air
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('airflow')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'airflow' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Airflow CFM & Velocity
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fins_pressure')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'fins_pressure' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Fin Efficiency & Pressure Drop
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('altitude')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'altitude' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          Altitude Density Derating
        </button>
      </div>

      {/* Tab 1: Required Rθsa */}
      {activeTab === 'required_rth' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">System Heat Load & Temperature Budget</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Power Dissipated (W)</label>
                <input
                  type="number"
                  value={pDiss}
                  onChange={(e) => setPDiss(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Junction Tj (°C)</label>
                <input
                  type="number"
                  value={tjMax}
                  onChange={(e) => setTjMax(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Ambient Ta (°C)</label>
                <input
                  type="number"
                  value={tAmb}
                  onChange={(e) => setTAmb(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Safety Margin (%)</label>
                <input
                  type="number"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rθjc (Semiconductor) °C/W</label>
                <input
                  type="number"
                  step="0.05"
                  value={rJc}
                  onChange={(e) => setRJc(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rθcs (TIM Interface) °C/W</label>
                <input
                  type="number"
                  step="0.05"
                  value={rCs}
                  onChange={(e) => setRCs(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {reqRthResult ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <ResultCard label="Required Rθsa (Nominal)" value={reqRthResult.requiredRthSaKW.toFixed(3)} unit="°C/W" highlight />
                  <ResultCard label="Rθsa with Safety Margin" value={reqRthResult.requiredRthSaWithMarginKW.toFixed(3)} unit="°C/W" />
                  <ResultCard label="Max Allowable Total Rθja" value={reqRthResult.maxAllowableTotalRthJaKW.toFixed(3)} unit="°C/W" />
                  <ResultCard label="Estimated Volume Envelope" value={extrusionEstimate.volumeCm3.toFixed(0)} unit="cm³" />
                </div>
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <p className="font-semibold text-slate-200">Recommended Extrusion Dimensions (Natural Convection):</p>
                  <p className="font-mono text-cyan-300">
                    {extrusionEstimate.widthMm} mm (W) × {extrusionEstimate.lengthMm} mm (L) × {extrusionEstimate.heightMm} mm (H)
                  </p>
                  <p className="text-slate-400">
                    Volumetric resistance index Rv = {extrusionEstimate.volumetricRv} cm³·K/W
                  </p>
                </div>
              </>
            ) : (
              <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs">
                Thermal envelope violated: Internal package resistances exceed allowable budget. Reduce power or ambient temperature.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Natural vs Forced Air */}
      {activeTab === 'convection' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Convective Cooling Mode</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConvMode('natural')}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border ${
                  convMode === 'natural' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Natural Convection
              </button>
              <button
                type="button"
                onClick={() => setConvMode('forced')}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border ${
                  convMode === 'forced' ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Forced Air Convection
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Sink-to-Air ΔT (K)</label>
                <input
                  type="number"
                  value={targetDeltaT}
                  onChange={(e) => setTargetDeltaT(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>

              {convMode === 'natural' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Fin Orientation</label>
                  <select
                    value={finOrientation}
                    onChange={(e) => setFinOrientation(e.target.value as 'vertical' | 'horizontal')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  >
                    <option value="vertical">Vertical Chimney (Optimal)</option>
                    <option value="horizontal">Horizontal (25% derated)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Air Velocity (m/s)</label>
                  <input
                    type="number"
                    step="0.2"
                    value={airVelocityMps}
                    onChange={(e) => setAirVelocityMps(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {convMode === 'natural' ? (
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Natural h_conv" value={natResult.heatTransferCoefficientWm2K.toFixed(2)} unit="W/(m²·K)" highlight />
                <ResultCard label="Req Surface Area" value={natResult.requiredSurfaceAreaCm2.toFixed(1)} unit="cm²" />
                <ResultCard label="Req Volume" value={natResult.volumetricEstimateCm3.toFixed(0)} unit="cm³" />
                <ResultCard label="Area in m²" value={natResult.requiredSurfaceAreaM2.toFixed(4)} unit="m²" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <ResultCard label="Forced h_conv" value={forcedResult.heatTransferCoefficientWm2K.toFixed(2)} unit="W/(m²·K)" highlight />
                <ResultCard label="Req Surface Area" value={forcedResult.requiredEffectiveAreaCm2.toFixed(1)} unit="cm²" />
                <ResultCard label="Air Velocity (LFM)" value={forcedResult.linearFeetPerMinuteLFM.toFixed(0)} unit="LFM" />
                <ResultCard label="Req Volume" value={forcedResult.volumetricEstimateCm3.toFixed(0)} unit="cm³" />
              </div>
            )}

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs text-slate-400">
              <p>
                <strong className="text-slate-200">Comparison Insight:</strong> Forced air convection increases the heat transfer coefficient h by{' '}
                <span className="text-cyan-300 font-bold">
                  {(forcedResult.heatTransferCoefficientWm2K / natResult.heatTransferCoefficientWm2K).toFixed(1)}×
                </span>
                , reducing the required heatsink surface area from {natResult.requiredSurfaceAreaCm2.toFixed(0)} cm² down to{' '}
                {forcedResult.requiredEffectiveAreaCm2.toFixed(0)} cm².
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Airflow & Velocity */}
      {activeTab === 'airflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Airflow & Duct Sizing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Total Internal Heat (W)</label>
                <input
                  type="number"
                  value={flowPowerW}
                  onChange={(e) => setFlowPowerW(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Allowed Air Temp Rise ΔT (°C)</label>
                <input
                  type="number"
                  value={allowedAirRiseC}
                  onChange={(e) => setAllowedAirRiseC(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Flow Cross-Sectional Area (cm²)</label>
                <input
                  type="number"
                  value={ductAreaCm2}
                  onChange={(e) => setDuctAreaCm2(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Required Airflow (CFM)" value={airflowResult.airflowCfm.toFixed(1)} unit="CFM" highlight />
              <ResultCard label="Airflow (m³/h)" value={airflowResult.airflowM3h.toFixed(1)} unit="m³/h" />
              <ResultCard label="Linear Air Velocity" value={velocityResult.velocityMps.toFixed(2)} unit="m/s" />
              <ResultCard label="Reynolds Number" value={velocityResult.reynoldsNumber.toString()} unit={velocityResult.flowRegime} />
            </div>

            <CalculationStepViewer
              steps={[
                {
                  title: 'Sensible Airflow Heat Pickup Formula',
                  formula: 'CFM = 1.76 \\cdot P / \\Delta T_{air}',
                  substitution: `CFM = 1.76 \\times ${flowPowerW} / ${allowedAirRiseC} = ${airflowResult.airflowCfm.toFixed(1)} CFM`,
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Fin Efficiency & Pressure Drop */}
      {activeTab === 'fins_pressure' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Fin Geometry Parameters</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Number of Fins</label>
                <input
                  type="number"
                  value={numFins}
                  onChange={(e) => setNumFins(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Fin Height (mm)</label>
                <input
                  type="number"
                  value={finHeightMm}
                  onChange={(e) => setFinHeightMm(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Fin Thick (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={finThickMm}
                  onChange={(e) => setFinThickMm(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Length (mm)</label>
                <input
                  type="number"
                  value={finLengthMm}
                  onChange={(e) => setFinLengthMm(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Base Width (mm)</label>
                <input
                  type="number"
                  value={baseWidthMm}
                  onChange={(e) => setBaseWidthMm(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Fin k (W/mK)</label>
                <input
                  type="number"
                  value={finK}
                  onChange={(e) => setFinK(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Fin Efficiency (η_fin)" value={(finResult.finEfficiency * 100).toFixed(1)} unit="%" highlight />
              <ResultCard label="Overall Efficiency (η_o)" value={(finResult.overallEfficiency * 100).toFixed(1)} unit="%" />
              <ResultCard label="Total Surface Area" value={(finResult.totalSurfaceAreaM2 * 10000).toFixed(1)} unit="cm²" />
              <ResultCard label="Channel ΔP" value={pressureResult.deltaPressurePa.toFixed(1)} unit="Pa" />
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs">
              <p className="font-semibold text-slate-200">Fin Temperature Gradient (Base to Tip):</p>
              <div className="grid grid-cols-4 gap-2 font-mono text-[11px] pt-1 text-slate-400">
                {profileResult.slice(0, 4).map((p, i) => (
                  <div key={i} className="p-1.5 bg-slate-950 rounded border border-slate-800 text-center">
                    <span className="block text-slate-500">{p.distanceMm}mm</span>
                    <span className="text-cyan-300 font-bold">{p.temperatureC}°C</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Altitude Derating */}
      {activeTab === 'altitude' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Barometric Altitude Derating</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Operating Altitude (meters)</label>
                <input
                  type="number"
                  step="250"
                  value={altitudeM}
                  onChange={(e) => setAltitudeM(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sea Level Rθsa (°C/W)</label>
                <input
                  type="number"
                  step="0.1"
                  value={seaRth}
                  onChange={(e) => setSeaRth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Cooling Mechanism</label>
                <select
                  value={altCoolingType}
                  onChange={(e) => setAltCoolingType(e.target.value as 'natural' | 'forced')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                >
                  <option value="natural">Natural Convection (Derates by (ρ₀/ρ)^0.8)</option>
                  <option value="forced">Forced Air Convection (Derates by (ρ₀/ρ)^0.6)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Derated Rθsa at Altitude" value={altResult.deratedRthKW.toFixed(3)} unit="°C/W" highlight />
              <ResultCard label="Derating Multiplier" value={altResult.deratingFactor.toFixed(3)} unit="×" />
              <ResultCard label="Air Density" value={altResult.airDensityKgM3.toFixed(3)} unit="kg/m³" />
              <ResultCard label="Equivalent Elevation" value={altResult.altitudeFeet.toString()} unit="feet" />
            </div>

            <CalculationStepViewer
              steps={[
                {
                  title: 'Barometric Density Ratio',
                  formula: '\\rho / \\rho_0 = (1 - 0.0065 h / 288.15)^{4.256}',
                  substitution: `Density ratio = ${altResult.densityRatio} (Density = ${altResult.airDensityKgM3} kg/m³)`,
                },
                {
                  title: 'Thermal Resistance Derating',
                  formula: 'R_{\\theta}(h) = R_{\\theta,0} \\cdot (\\rho_0 / \\rho)^n',
                  substitution: `${seaRth} \\times ${altResult.deratingFactor} = ${altResult.deratedRthKW.toFixed(3)} °C/W`,
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
