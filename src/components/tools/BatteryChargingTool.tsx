import React, { useState, useMemo } from 'react';
import {
  calculateCcCharging,
  calculateCvCharging,
  estimateCcCvChargingTime,
  calculateChargeEnergy,
  calculateRoundTripEnergyEfficiency,
  calculateCoulombicEfficiency,
  calculateChargingPower,
  sizeChargingCurrent,
  calculateChargeLoss,
  estimateChargeHeatGeneration,
} from '../../engines/batteries/battery-charging';
import { ResultCard } from '../common/ResultCard';
import { CalculationStepViewer } from '../common/CalculationStepViewer';
import { BatteryCharging, Zap, Thermometer, Flame, Gauge } from 'lucide-react';

export function BatteryChargingTool() {
  const [activeTab, setActiveTab] = useState<'cccv' | 'power_loss' | 'heat_thermal'>('cccv');

  // Tab 1: CC/CV Profile
  const [packCapacityAh, setPackCapacityAh] = useState<number>(50.0);
  const [startSocPct, setStartSocPct] = useState<number>(10);
  const [ccCutoffSocPct, setCcCutoffSocPct] = useState<number>(80);
  const [ccChargeCurrentA, setCcChargeCurrentA] = useState<number>(25.0); // 0.5C
  const [cvCutoffCurrentA, setCvCutoffCurrentA] = useState<number>(1.5); // 0.03C
  const [tauDecayMins, setTauDecayMins] = useState<number>(40);

  // Tab 2: Charging Power & Losses
  const [chargeVoc, setChargeVoc] = useState<number>(52.0);
  const [chargingCurrentA, setChargingCurrentA] = useState<number>(20.0);
  const [chargingRintOhms, setChargingRintOhms] = useState<number>(0.04);
  const [energyInWh, setEnergyInWh] = useState<number>(2600);
  const [energyStoredWh, setEnergyStoredWh] = useState<number>(2400);
  const [coulombInAh, setCoulombInAh] = useState<number>(50.5);
  const [coulombOutAh, setCoulombOutAh] = useState<number>(49.8);

  // Tab 3: Heat & Thermal Rise
  const [heatCurrentA, setHeatCurrentA] = useState<number>(30.0);
  const [heatRintOhms, setHeatRintOhms] = useState<number>(0.035);
  const [packMassKg, setPackMassKg] = useState<number>(12.0);
  const [durationSecs, setDurationSecs] = useState<number>(3600); // 1 hour

  // Computations
  const cccvResult = useMemo(() => {
    try {
      return estimateCcCvChargingTime({
        nominalCapacityAh: packCapacityAh,
        initialSocPercent: startSocPct,
        ccChargeCurrentAmps: ccChargeCurrentA,
        ccCutoffSocPercent: ccCutoffSocPct,
        cvCutoffCurrentAmps: cvCutoffCurrentA,
        tauDecayMinutes: tauDecayMins,
      });
    } catch {
      return null;
    }
  }, [packCapacityAh, startSocPct, ccChargeCurrentA, ccCutoffSocPct, cvCutoffCurrentA, tauDecayMins]);

  const powerResult = useMemo(() => {
    try {
      return calculateChargingPower({
        openCircuitVoltage: chargeVoc,
        chargeCurrentAmps: chargingCurrentA,
        internalResistanceOhms: chargingRintOhms,
      });
    } catch {
      return null;
    }
  }, [chargeVoc, chargingCurrentA, chargingRintOhms]);

  const lossResult = useMemo(() => {
    try {
      return calculateChargeLoss(energyInWh, energyStoredWh);
    } catch {
      return null;
    }
  }, [energyInWh, energyStoredWh]);

  const roundTripWhResult = useMemo(() => {
    try {
      return calculateRoundTripEnergyEfficiency(energyStoredWh, energyInWh);
    } catch {
      return null;
    }
  }, [energyStoredWh, energyInWh]);

  const coulombEffResult = useMemo(() => {
    try {
      return calculateCoulombicEfficiency(coulombOutAh, coulombInAh);
    } catch {
      return null;
    }
  }, [coulombOutAh, coulombInAh]);

  const heatResult = useMemo(() => {
    try {
      return estimateChargeHeatGeneration({
        chargeCurrentAmps: heatCurrentA,
        internalResistanceOhms: heatRintOhms,
        batteryMassKg: packMassKg,
        durationSeconds: durationSecs,
      });
    } catch {
      return null;
    }
  }, [heatCurrentA, heatRintOhms, packMassKg, durationSecs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
            <BatteryCharging className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Battery Charging & Efficiency Models</h1>
            <p className="text-xs text-slate-400">
              Tools 41–50: CC/CV Charging Time Estimates, Coulombic & Wh Efficiencies, Terminal Charging Voltage & Heat Dissipation
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('cccv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'cccv' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> 41–43. CC/CV Charge Profile
          </button>
          <button
            onClick={() => setActiveTab('power_loss')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'power_loss' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" /> 44–49. Power & Efficiency
          </button>
          <button
            onClick={() => setActiveTab('heat_thermal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'heat_thermal' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> 50. Internal Heat Generation
          </button>
        </div>
      </div>

      {/* Tab 1: CC/CV Charging Profile */}
      {activeTab === 'cccv' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">CC/CV Parameters</h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Pack Nominal Capacity (Ah)</label>
              <input
                type="number"
                step="5"
                value={packCapacityAh}
                onChange={(e) => setPackCapacityAh(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Start SOC (%)</label>
                <input
                  type="number"
                  step="5"
                  value={startSocPct}
                  onChange={(e) => setStartSocPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">CC Switchover (%)</label>
                <input
                  type="number"
                  step="5"
                  value={ccCutoffSocPct}
                  onChange={(e) => setCcCutoffSocPct(parseFloat(e.target.value) || 80)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">CC Current (A)</label>
                <input
                  type="number"
                  step="1"
                  value={ccChargeCurrentA}
                  onChange={(e) => setCcChargeCurrentA(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">CV Cutoff Current (A)</label>
                <input
                  type="number"
                  step="0.5"
                  value={cvCutoffCurrentA}
                  onChange={(e) => setCvCutoffCurrentA(parseFloat(e.target.value) || 0.5)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">CV Current Decay Tau (Minutes)</label>
              <input
                type="number"
                step="5"
                value={tauDecayMins}
                onChange={(e) => setTauDecayMins(parseFloat(e.target.value) || 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ResultCard
                label="Total Estimated Charge Time"
                value={`${cccvResult?.totalChargeTimeHours ?? 0} hrs`}
                subtext={`${cccvResult?.totalChargeTimeMinutes ?? 0} total minutes`}
                highlight
              />
              <ResultCard
                label="CC Stage (Fast Charge)"
                value={`${cccvResult?.ccStageMinutes ?? 0} mins`}
                subtext={`${cccvResult?.ccStagePercentageOfTime ?? 0}% of time (up to ${ccCutoffSocPct}% SOC)`}
              />
              <ResultCard
                label="CV Stage (Saturation)"
                value={`${cccvResult?.cvStageMinutes ?? 0} mins`}
                subtext={`${cccvResult?.cvStagePercentageOfTime ?? 0}% of time (taper to ${cvCutoffCurrentA}A)`}
              />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
              <strong className="text-cyan-400">CC/CV Algorithm:</strong> During the Constant Current (CC) stage, maximum allowable current is forced into the battery until cell voltages reach maximum upper threshold (e.g. 4.2V/cell for Li-ion, 3.65V for LiFePO4). The charger then clamps the voltage (CV stage) while current exponentially decays until reaching the cutoff threshold (~C/20 to C/50).
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Power & Losses */}
      {activeTab === 'power_loss' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">47. Charging Power & Terminal Voltage</h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Pack Voc (V)</label>
                <input
                  type="number"
                  step="0.5"
                  value={chargeVoc}
                  onChange={(e) => setChargeVoc(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Charge I (A)</label>
                <input
                  type="number"
                  step="1"
                  value={chargingCurrentA}
                  onChange={(e) => setChargingCurrentA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">R_int (Ω)</label>
                <input
                  type="number"
                  step="0.005"
                  value={chargingRintOhms}
                  onChange={(e) => setChargingRintOhms(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <ResultCard
              label="Terminal Charger Voltage Needed"
              value={`${powerResult?.terminalChargingVoltage ?? 0} V`}
              subtext={`Total Power: ${powerResult?.totalChargingPowerWatts ?? 0} W (IR Loss: ${powerResult?.internalJouleLossWatts ?? 0} W)`}
              highlight
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">45–46. Efficiency Benchmarking</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Energy In (Wh)</label>
                <input
                  type="number"
                  value={energyInWh}
                  onChange={(e) => setEnergyInWh(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Energy Out (Wh)</label>
                <input
                  type="number"
                  value={energyStoredWh}
                  onChange={(e) => setEnergyStoredWh(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Ah Charged</label>
                <input
                  type="number"
                  value={coulombInAh}
                  onChange={(e) => setCoulombInAh(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Ah Discharged</label>
                <input
                  type="number"
                  value={coulombOutAh}
                  onChange={(e) => setCoulombOutAh(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                label="Round-Trip Wh Efficiency"
                value={`${roundTripWhResult?.energyEfficiencyPercent ?? 0}%`}
                subtext={`Loss: ${roundTripWhResult?.energyLossWh ?? 0} Wh`}
              />
              <ResultCard
                label="Coulombic Ah Efficiency"
                value={`${coulombEffResult?.coulombicEfficiencyPercent ?? 0}%`}
                subtext={`Lost capacity: ${coulombEffResult?.lostCapacityAh ?? 0} Ah`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Heat & Thermal Rise */}
      {activeTab === 'heat_thermal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">50. Internal Heat Generation Inputs</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Charging Current (A)</label>
                <input
                  type="number"
                  step="1"
                  value={heatCurrentA}
                  onChange={(e) => setHeatCurrentA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Pack Internal Resistance (Ω)</label>
                <input
                  type="number"
                  step="0.005"
                  value={heatRintOhms}
                  onChange={(e) => setHeatRintOhms(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Battery Pack Mass (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={packMassKg}
                  onChange={(e) => setPackMassKg(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Charge Duration (Seconds)</label>
                <input
                  type="number"
                  step="300"
                  value={durationSecs}
                  onChange={(e) => setDurationSecs(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              label="Instantaneous Heat Generation"
              value={`${heatResult?.heatGenerationRateWatts ?? 0} W`}
              subtext={`Total Heat Energy: ${heatResult?.totalHeatEnergyWh ?? 0} Wh (${heatResult?.totalHeatEnergyJoules ?? 0} Joules)`}
              highlight
            />
            <ResultCard
              label="Adiabatic Temp Rise (Zero Cooling)"
              value={`+${heatResult?.adiabaticTemperatureRiseKelvin ?? 0} °C`}
              subtext="Worst-case temperature escalation assuming no convective cooling."
            />
          </div>
        </div>
      )}
    </div>
  );
}
