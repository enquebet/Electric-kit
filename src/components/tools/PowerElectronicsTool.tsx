import React, { useState, useMemo } from 'react';
import {
  calculateIdealBuck,
  calculateBuckInductor,
  calculateBuckOutputCapacitor,
  calculateBuckCcmDcmBoundary,
  calculateIdealBoost,
  calculateBoostInductor,
  calculateBoostOutputCapacitor,
  calculateBoostCcmDcmBoundary,
  calculateInvertingBuckBoost,
  calculateNonInvertingBuckBoost,
  calculateSepicConverter,
  calculateCukConverter,
  calculateFlybackFundamentals,
  calculateFlybackTurnsRatio,
  calculateFlybackMagnetizingInductance,
  calculateHalfWaveRectifier,
  calculateFullWaveCenterTappedRectifier,
  calculateBridgeRectifierAdvanced,
  calculateRectifierCapacitorFilter,
  calculateRectifierDiodeStress,
  calculateSwitchingFrequency,
  calculatePwmPowerConverter,
  calculateMosfetVoltageStress,
  calculateMosfetCurrentStress,
  calculateMosfetConductionLoss,
  calculateMosfetSwitchingLoss,
  calculateDiodeRecoveryLoss,
  calculateInductorStoredEnergy,
  calculateRmsInductorCurrent,
  calculateMagneticFluxDensity,
  calculateCoreSaturationMargin,
  calculateConverterOutputCapacitor,
  calculateCapacitorEsrRipple,
  calculateConverterEfficiency,
  calculateConverterLossBudget,
  calculatePowerThermalDissipation,
  calculateHBridgeFundamentals,
  calculateSpwmFundamentals,
  calculateInverterRmsOutput,
  calculateInverterPower,
  designPowerConverter,
} from '../../engines/power';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import {
  Zap,
  Cpu,
  Flame,
  Layers,
  Activity,
  Compass,
} from 'lucide-react';

export const PowerElectronicsTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'converters' | 'rectifiers' | 'inverters' | 'semiconductors' | 'design-mode'
  >('converters');

  // Sub-selector for converters
  const [converterType, setConverterType] = useState<
    'buck' | 'boost' | 'inverting-buck-boost' | 'sepic' | 'cuk' | 'flyback'
  >('buck');

  // Converter inputs
  const [vin, setVin] = useState<number>(24);
  const [vinUnit, setVinUnit] = useState<string>('V');
  const [vout, setVout] = useState<number>(5);
  const [voutUnit, setVoutUnit] = useState<string>('V');
  const [iout, setIout] = useState<number>(3);
  const [ioutUnit, setIoutUnit] = useState<string>('A');
  const [fsKhz, setFsKhz] = useState<number>(250);
  const [rippleRatioPct, setRippleRatioPct] = useState<number>(30);
  const [targetRippleV, setTargetRippleV] = useState<number>(0.03);

  // Rectifier states
  const [rectMode, setRectMode] = useState<'bridge' | 'half-wave' | 'center-tap' | 'cap-filter'>('bridge');
  const [rectVacRms, setRectVacRms] = useState<number>(12);
  const [rectFreq, setRectFreq] = useState<number>(60);
  const [rectFilterC, setRectFilterC] = useState<number>(1000);
  const [rectFilterCUnit, setRectFilterCUnit] = useState<string>('µF');
  const [rectIload, setRectIload] = useState<number>(1.5);

  // Inverter states
  const [inverterMode, setInverterMode] = useState<'spwm' | 'hbridge' | 'power'>('spwm');
  const [vBus, setVBus] = useState<number>(400);
  const [ma, setMa] = useState<number>(0.85);
  const [carrierKhz, setCarrierKhz] = useState<number>(20);
  const [fundHz, setFundHz] = useState<number>(60);
  const [hBridgeState, setHBridgeState] = useState<
    'forward' | 'reverse' | 'freewheel-low' | 'freewheel-high' | 'shoot-through'
  >('forward');

  // Semiconductor & magnetics states
  const [semiMode, setSemiMode] = useState<'conduction' | 'switching' | 'magnetics' | 'thermal'>('conduction');
  const [mosRmsA, setMosRmsA] = useState<number>(4.5);
  const [rdsOnMOhms, setRdsOnMOhms] = useState<number>(25);
  const [tjMosfet, setTjMosfet] = useState<number>(85);
  const [vdsSw, setVdsSw] = useState<number>(48);
  const [idSw, setIdSw] = useState<number>(5);
  const [trNs, setTrNs] = useState<number>(15);
  const [tfNs, setTfNs] = useState<number>(20);
  const [thermalPlossW, setThermalPlossW] = useState<number>(3.5);
  const [thermalRtheta, setThermalRtheta] = useState<number>(30);
  const [ambientTempC, setAmbientTempC] = useState<number>(40);

  // Design Mode inputs
  const [desVinMin, setDesVinMin] = useState<number>(9);
  const [desVinMax, setDesVinMax] = useState<number>(36);
  const [desVout, setDesVout] = useState<number>(12);
  const [desIout, setDesIout] = useState<number>(2.5);
  const [desFsKhz, setDesFsKhz] = useState<number>(300);
  const [desEffTarget, setDesEffTarget] = useState<number>(92);
  const [desTopology, setDesTopology] = useState<'auto' | 'buck' | 'boost' | 'inverting-buck-boost' | 'sepic'>('auto');

  // Main calculation memoization
  const result = useMemo(() => {
    const rawVin = toBaseUnit(vin, 'voltage', vinUnit);
    const rawVout = toBaseUnit(vout, 'voltage', voutUnit);
    const rawIout = toBaseUnit(iout, 'current', ioutUnit);
    const rawFs = fsKhz * 1000;

    if (activeTab === 'converters') {
      switch (converterType) {
        case 'buck':
          return calculateBuckInductor({
            inputVoltageV: rawVin,
            outputVoltageV: rawVout,
            outputCurrentA: rawIout,
            switchingFrequencyHz: rawFs,
            rippleRatioPercent: rippleRatioPct,
          });
        case 'boost':
          return calculateBoostInductor({
            inputVoltageV: rawVin,
            outputVoltageV: rawVout,
            outputCurrentA: rawIout,
            switchingFrequencyHz: rawFs,
            rippleRatioPercent: rippleRatioPct,
          });
        case 'inverting-buck-boost':
          return calculateInvertingBuckBoost({
            inputVoltageV: rawVin,
            outputVoltageMagnitudeV: Math.abs(rawVout),
            outputCurrentA: rawIout,
            switchingFrequencyHz: rawFs,
          });
        case 'sepic':
          return calculateSepicConverter({
            inputVoltageV: rawVin,
            outputVoltageV: rawVout,
            outputCurrentA: rawIout,
            switchingFrequencyHz: rawFs,
            inductorRipplePercent: rippleRatioPct,
            desiredOutputRippleV: targetRippleV,
          });
        case 'cuk':
          return calculateCukConverter({
            inputVoltageV: rawVin,
            outputVoltageMagnitudeV: Math.abs(rawVout),
            outputCurrentA: rawIout,
            switchingFrequencyHz: rawFs,
            desiredOutputRippleV: targetRippleV,
          });
        case 'flyback':
          return calculateFlybackFundamentals({
            inputVoltageV: rawVin,
            outputVoltageV: rawVout,
            outputCurrentA: rawIout,
            switchingFrequencyHz: rawFs,
            primaryToSecondaryTurnsRatioNpNs: 2.0,
          });
      }
    } else if (activeTab === 'rectifiers') {
      if (rectMode === 'bridge') {
        return calculateBridgeRectifierAdvanced({
          acRmsVoltageV: rectVacRms,
          inputFrequencyHz: rectFreq,
          loadCurrentA: rectIload,
        });
      } else if (rectMode === 'half-wave') {
        return calculateHalfWaveRectifier({
          inputRmsVoltageV: rectVacRms,
          inputFrequencyHz: rectFreq,
          loadResistanceOhms: rectVacRms / Math.max(rectIload, 0.1),
        });
      } else if (rectMode === 'center-tap') {
        return calculateFullWaveCenterTappedRectifier({
          secondaryRmsPerLegVoltageV: rectVacRms,
          inputFrequencyHz: rectFreq,
          loadResistanceOhms: rectVacRms / Math.max(rectIload, 0.1),
        });
      } else {
        const cFarads = toBaseUnit(rectFilterC, 'capacitance', rectFilterCUnit);
        return calculateRectifierCapacitorFilter({
          loadCurrentA: rectIload,
          capacitanceFarads: cFarads,
          inputFrequencyHz: rectFreq,
          rectifierTopology: 'full-wave',
          inputPeakVoltageV: rectVacRms * Math.SQRT2 - 1.4,
        });
      }
    } else if (activeTab === 'inverters') {
      if (inverterMode === 'spwm') {
        return calculateSpwmFundamentals({
          dcBusVoltageV: vBus,
          modulationIndexMa: ma,
          carrierFrequencyHz: carrierKhz * 1000,
          fundamentalFrequencyHz: fundHz,
        });
      } else if (inverterMode === 'hbridge') {
        return calculateHBridgeFundamentals({
          dcBusVoltageV: vBus,
          selectedState: hBridgeState,
        });
      } else {
        return calculateInverterPower({
          outputRmsVoltageV: (ma * vBus) / Math.SQRT2,
          outputRmsCurrentA: 5.0,
          powerFactor: 0.9,
          dcBusVoltageV: vBus,
        });
      }
    } else if (activeTab === 'semiconductors') {
      if (semiMode === 'conduction') {
        return calculateMosfetConductionLoss({
          rmsCurrentA: mosRmsA,
          rdsOnAt25mOhms: rdsOnMOhms,
          junctionTemperatureC: tjMosfet,
        });
      } else if (semiMode === 'switching') {
        return calculateMosfetSwitchingLoss({
          drainSourceVoltageV: vdsSw,
          drainCurrentA: idSw,
          riseTimeNs: trNs,
          fallTimeNs: tfNs,
          switchingFrequencyHz: fsKhz * 1000,
        });
      } else if (semiMode === 'thermal') {
        return calculatePowerThermalDissipation({
          powerDissipationWatts: thermalPlossW,
          ambientTemperatureC: ambientTempC,
          thermalResistanceJaCPerW: thermalRtheta,
        });
      } else {
        return calculateInductorStoredEnergy({
          inductanceH: 47e-6,
          currentA: mosRmsA,
        });
      }
    } else {
      // Design Mode
      return designPowerConverter({
        inputVoltageMinV: desVinMin,
        inputVoltageMaxV: desVinMax,
        outputVoltageV: desVout,
        outputCurrentA: desIout,
        switchingFrequencyHz: desFsKhz * 1000,
        targetEfficiencyPercent: desEffTarget,
        selectedTopology: desTopology,
      });
    }
  }, [
    activeTab,
    converterType,
    vin,
    vinUnit,
    vout,
    voutUnit,
    iout,
    ioutUnit,
    fsKhz,
    rippleRatioPct,
    targetRippleV,
    rectMode,
    rectVacRms,
    rectFreq,
    rectFilterC,
    rectFilterCUnit,
    rectIload,
    inverterMode,
    vBus,
    ma,
    carrierKhz,
    fundHz,
    hBridgeState,
    semiMode,
    mosRmsA,
    rdsOnMOhms,
    tjMosfet,
    vdsSw,
    idSw,
    trNs,
    tfNs,
    thermalPlossW,
    thermalRtheta,
    ambientTempC,
    desVinMin,
    desVinMax,
    desVout,
    desIout,
    desFsKhz,
    desEffTarget,
    desTopology,
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Primary Category Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('converters')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'converters'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          DC-DC Converters
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rectifiers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rectifiers'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          AC-DC Rectifiers
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inverters')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inverters'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          Inverters & SPWM
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('semiconductors')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'semiconductors'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-400" />
          Semiconductor & Thermal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('design-mode')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'design-mode'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4 text-amber-400" />
          Design Mode
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          {/* Sub-menu for Converters */}
          {activeTab === 'converters' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Topology Selection</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'buck', label: 'Buck (Step-Down)' },
                  { id: 'boost', label: 'Boost (Step-Up)' },
                  { id: 'inverting-buck-boost', label: 'Buck-Boost (-V)' },
                  { id: 'sepic', label: 'SEPIC (+V)' },
                  { id: 'cuk', label: 'Ćuk (-V)' },
                  { id: 'flyback', label: 'Flyback (Iso)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setConverterType(item.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      converterType === item.id
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <UnitInput
                  id="pe-vin"
                  label="Input Voltage (V_in)"
                  symbol="Vin"
                  quantity="voltage"
                  value={vin}
                  unit={vinUnit}
                  onChangeValue={setVin}
                  onChangeUnit={setVinUnit}
                />
                <UnitInput
                  id="pe-vout"
                  label="Output Voltage (V_out)"
                  symbol="Vout"
                  quantity="voltage"
                  value={vout}
                  unit={voutUnit}
                  onChangeValue={setVout}
                  onChangeUnit={setVoutUnit}
                />
                <UnitInput
                  id="pe-iout"
                  label="Load Current (I_out)"
                  symbol="Iout"
                  quantity="current"
                  value={iout}
                  unit={ioutUnit}
                  onChangeValue={setIout}
                  onChangeUnit={setIoutUnit}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Switching Frequency (kHz)</label>
                  <input
                    type="number"
                    value={fsKhz}
                    onChange={(e) => setFsKhz(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Target Inductor Ripple Ratio (%)</label>
                  <input
                    type="number"
                    value={rippleRatioPct}
                    onChange={(e) => setRippleRatioPct(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Allowable Output Ripple (V pk-pk)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetRippleV}
                    onChange={(e) => setTargetRippleV(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sub-menu for Rectifiers */}
          {activeTab === 'rectifiers' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rectifier Architecture</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'bridge', label: 'Full Bridge' },
                  { id: 'half-wave', label: 'Half-Wave' },
                  { id: 'center-tap', label: 'Center-Tap' },
                  { id: 'cap-filter', label: 'Capacitor Filter' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRectMode(item.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      rectMode === item.id
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">AC Input Voltage (V RMS)</label>
                  <input
                    type="number"
                    value={rectVacRms}
                    onChange={(e) => setRectVacRms(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Line Frequency (Hz)</label>
                  <input
                    type="number"
                    value={rectFreq}
                    onChange={(e) => setRectFreq(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">DC Load Current (A)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rectIload}
                    onChange={(e) => setRectIload(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                {rectMode === 'cap-filter' && (
                  <UnitInput
                    id="pe-rect-filter-c"
                    label="Filter Capacitance (C)"
                    symbol="C"
                    quantity="capacitance"
                    value={rectFilterC}
                    unit={rectFilterCUnit}
                    onChangeValue={setRectFilterC}
                    onChangeUnit={setRectFilterCUnit}
                  />
                )}
              </div>
            </div>
          )}

          {/* Sub-menu for Inverters */}
          {activeTab === 'inverters' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inverter Module</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'spwm', label: 'SPWM Modulation' },
                  { id: 'hbridge', label: 'H-Bridge State' },
                  { id: 'power', label: 'Inverter Power' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setInverterMode(item.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      inverterMode === item.id
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">DC Bus Voltage (V_bus)</label>
                  <input
                    type="number"
                    value={vBus}
                    onChange={(e) => setVBus(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {inverterMode === 'spwm' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Modulation Index (m_a)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={ma}
                        onChange={(e) => setMa(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Carrier Frequency (kHz)</label>
                      <input
                        type="number"
                        value={carrierKhz}
                        onChange={(e) => setCarrierKhz(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Fundamental AC Frequency (Hz)</label>
                      <input
                        type="number"
                        value={fundHz}
                        onChange={(e) => setFundHz(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {inverterMode === 'hbridge' && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">Switch Combination</label>
                    <select
                      value={hBridgeState}
                      onChange={(e) => setHBridgeState(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="forward">Forward Drive (Q1 + Q4 Closed → +Vbus)</option>
                      <option value="reverse">Reverse Drive (Q2 + Q3 Closed → -Vbus)</option>
                      <option value="freewheel-low">Freewheel Low (Q3 + Q4 Closed → 0V)</option>
                      <option value="freewheel-high">Freewheel High (Q1 + Q2 Closed → 0V)</option>
                      <option value="shoot-through">Shoot-Through Hazard (Q1 + Q3 Cross-Conduction)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-menu for Semiconductors & Thermal */}
          {activeTab === 'semiconductors' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Analysis Mode</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'conduction', label: 'MOSFET Conduction' },
                  { id: 'switching', label: 'Switching Loss' },
                  { id: 'thermal', label: 'Thermal Stack' },
                  { id: 'magnetics', label: 'Inductor Energy' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSemiMode(item.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      semiMode === item.id
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {semiMode === 'conduction' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Conduction RMS Current (A)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={mosRmsA}
                        onChange={(e) => setMosRmsA(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">R_ds(on) at 25°C (mΩ)</label>
                      <input
                        type="number"
                        value={rdsOnMOhms}
                        onChange={(e) => setRdsOnMOhms(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Junction Temp T_j (°C)</label>
                      <input
                        type="number"
                        value={tjMosfet}
                        onChange={(e) => setTjMosfet(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {semiMode === 'switching' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Drain Voltage V_ds (V)</label>
                      <input
                        type="number"
                        value={vdsSw}
                        onChange={(e) => setVdsSw(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Turn-Off Current I_d (A)</label>
                      <input
                        type="number"
                        value={idSw}
                        onChange={(e) => setIdSw(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Current Rise Time t_r (ns)</label>
                      <input
                        type="number"
                        value={trNs}
                        onChange={(e) => setTrNs(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Voltage Fall Time t_f (ns)</label>
                      <input
                        type="number"
                        value={tfNs}
                        onChange={(e) => setTfNs(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {semiMode === 'thermal' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Power Loss (W)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={thermalPlossW}
                        onChange={(e) => setThermalPlossW(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Thermal Resistance R_θ,JA (°C/W)</label>
                      <input
                        type="number"
                        value={thermalRtheta}
                        onChange={(e) => setThermalRtheta(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Ambient Temperature (°C)</label>
                      <input
                        type="number"
                        value={ambientTempC}
                        onChange={(e) => setAmbientTempC(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Sub-menu for Design Mode */}
          {activeTab === 'design-mode' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Preliminary Converter Specifications
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Minimum Input V_in,min (V)</label>
                  <input
                    type="number"
                    value={desVinMin}
                    onChange={(e) => setDesVinMin(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Maximum Input V_in,max (V)</label>
                  <input
                    type="number"
                    value={desVinMax}
                    onChange={(e) => setDesVinMax(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Target Output Voltage V_out (V)</label>
                  <input
                    type="number"
                    value={desVout}
                    onChange={(e) => setDesVout(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Target Output Current I_out (A)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={desIout}
                    onChange={(e) => setDesIout(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Switching Frequency (kHz)</label>
                  <input
                    type="number"
                    value={desFsKhz}
                    onChange={(e) => setDesFsKhz(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Topology Mode</label>
                  <select
                    value={desTopology}
                    onChange={(e) => setDesTopology(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="auto">Auto-Recommend Best Topology</option>
                    <option value="buck">Force Buck</option>
                    <option value="boost">Force Boost</option>
                    <option value="inverting-buck-boost">Force Inverting Buck-Boost</option>
                    <option value="sepic">Force SEPIC</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results & Step Derivation Column */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <ResultCard result={result} />
          {result.steps && result.steps.length > 0 && <StepExplanation steps={result.steps} />}
        </div>
      </div>
    </div>
  );
};
