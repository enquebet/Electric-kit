import React, { useState, useMemo } from 'react';
import {
  specifyElectricalRequirement,
  specifyPowerRequirement,
  defineOperatingPointMargins,
  specifyEnvironmentalRequirement,
  specifyThermalRequirement,
  specifyMechanicalConstraints,
  specifyComponentConstraints,
  configureDesignMargins,
  checkRequirementConsistency,
  generateRequirementSummary,
} from '../../engines/design/requirements';
import { ResultCard } from '../common/ResultCard';
import { FileSpreadsheet, ShieldAlert, Cpu, CheckCircle2, Sliders, Thermometer, Layers } from 'lucide-react';

export function RequirementsSpecificationTool() {
  const [activeTab, setActiveTab] = useState<'electrical_power' | 'thermal_env' | 'mechanical_derating' | 'consistency' | 'summary'>('electrical_power');

  // Electrical & Power state
  const [vNom, setVNom] = useState<number>(24);
  const [vMin, setVMin] = useState<number>(20);
  const [vMax, setVMax] = useState<number>(28);
  const [iCont, setICont] = useState<number>(5.0);
  const [iPeak, setIPeak] = useState<number>(10.0);
  const [pCont, setPCont] = useState<number>(120);
  const [pPeak, setPPeak] = useState<number>(240);

  // Environmental & Thermal state
  const [tAmb, setTAmb] = useState<number>(25);
  const [tMin, setTMin] = useState<number>(-10);
  const [tMax, setTMax] = useState<number>(55);
  const [altitude, setAltitude] = useState<number>(1000);
  const [maxTj, setMaxTj] = useState<number>(125);
  const [maxTEnc, setMaxTEnc] = useState<number>(65);

  // Mechanical & Component Derating state
  const [maxMassKg, setMaxMassKg] = useState<number>(3.5);
  const [dimL, setDimL] = useState<number>(200);
  const [dimW, setDimW] = useState<number>(150);
  const [dimH, setDimH] = useState<number>(80);
  const [compVRating, setCompVRating] = useState<number>(50);
  const [compIRating, setCompIRating] = useState<number>(15);

  // Margin targets
  const [vMarginPct, setVMarginPct] = useState<number>(20);
  const [iMarginPct, setIMarginPct] = useState<number>(25);
  const [pMarginPct, setPMarginPct] = useState<number>(20);
  const [tMarginC, setTMarginC] = useState<number>(25);

  // Calculations
  const elecRes = useMemo(() => {
    try {
      return specifyElectricalRequirement({
        nominalVoltage: vNom,
        minimumVoltage: vMin,
        maximumVoltage: vMax,
        continuousCurrentAmps: iCont,
        peakCurrentAmps: iPeak,
      });
    } catch {
      return null;
    }
  }, [vNom, vMin, vMax, iCont, iPeak]);

  const pwrRes = useMemo(() => {
    try {
      return specifyPowerRequirement({
        continuousPowerWatts: pCont,
        peakPowerWatts: pPeak,
      });
    } catch {
      return null;
    }
  }, [pCont, pPeak]);

  const envRes = useMemo(() => {
    try {
      return specifyEnvironmentalRequirement({
        ambientTemperatureCelsius: tAmb,
        minimumTemperatureCelsius: tMin,
        maximumTemperatureCelsius: tMax,
        altitudeMeters: altitude,
      });
    } catch {
      return null;
    }
  }, [tAmb, tMin, tMax, altitude]);

  const thermRes = useMemo(() => {
    try {
      return specifyThermalRequirement({
        maxAmbientTemperatureCelsius: tMax,
        maxJunctionTemperatureCelsius: maxTj,
        maxEnclosureTemperatureCelsius: maxTEnc,
        allowableTemperatureRiseCelsius: maxTj - tMax,
      });
    } catch {
      return null;
    }
  }, [tMax, maxTj, maxTEnc]);

  const mechRes = useMemo(() => {
    try {
      return specifyMechanicalConstraints({
        maxMassKg,
        enclosureDimensionsMm: { length: dimL, width: dimW, height: dimH },
      });
    } catch {
      return null;
    }
  }, [maxMassKg, dimL, dimW, dimH]);

  const compRes = useMemo(() => {
    try {
      return specifyComponentConstraints({
        maxVoltageRatingVolts: compVRating,
        maxCurrentRatingAmps: compIRating,
        maxPowerRatingWatts: compVRating * compIRating,
        maxOperatingTemperatureCelsius: maxTj,
      });
    } catch {
      return null;
    }
  }, [compVRating, compIRating, maxTj]);

  const consistencyRes = useMemo(() => {
    return checkRequirementConsistency(
      {
        nominalVoltage: vNom,
        minimumVoltage: vMin,
        maximumVoltage: vMax,
        continuousCurrentAmps: iCont,
        peakCurrentAmps: iPeak,
      },
      {
        continuousPowerWatts: pCont,
        peakPowerWatts: pPeak,
      },
      {
        maxAmbientTemperatureCelsius: tMax,
        maxJunctionTemperatureCelsius: maxTj,
        maxEnclosureTemperatureCelsius: maxTEnc,
        allowableTemperatureRiseCelsius: maxTj - tMax,
      },
      {
        ambientTemperatureCelsius: tAmb,
        minimumTemperatureCelsius: tMin,
        maximumTemperatureCelsius: tMax,
        altitudeMeters: altitude,
      }
    );
  }, [vNom, vMin, vMax, iCont, iPeak, pCont, pPeak, tMax, maxTj, maxTEnc, tAmb, tMin, altitude]);

  const allReqs = useMemo(() => {
    const list = [
      ...(elecRes?.requirements ?? []),
      ...(pwrRes?.requirements ?? []),
      ...(envRes?.requirements ?? []),
      ...(thermRes?.requirements ?? []),
      ...(mechRes?.constraints ?? []),
      ...configureDesignMargins({
        voltageMarginPercent: vMarginPct,
        currentMarginPercent: iMarginPct,
        powerMarginPercent: pMarginPct,
        thermalMarginCelsius: tMarginC,
        capacityMarginPercent: 20,
      }),
    ];
    return list;
  }, [elecRes, pwrRes, envRes, thermRes, mechRes, vMarginPct, iMarginPct, pMarginPct, tMarginC]);

  const summaryRes = useMemo(() => {
    return generateRequirementSummary(allReqs);
  }, [allReqs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">System Requirements & Design Inputs</h2>
            <p className="text-sm text-muted-foreground">
              Define electrical, power, thermal, environmental, and mechanical constraints with automated consistency checks
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('electrical_power')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'electrical_power' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Electrical & Power</span>
        </button>
        <button
          onClick={() => setActiveTab('thermal_env')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'thermal_env' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Thermometer className="w-4 h-4" />
          <span>Thermal & Environment</span>
        </button>
        <button
          onClick={() => setActiveTab('mechanical_derating')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'mechanical_derating' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mechanical & Component Derating</span>
        </button>
        <button
          onClick={() => setActiveTab('consistency')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'consistency' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Consistency Validation</span>
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'summary' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Requirement Summary</span>
        </button>
      </div>

      {/* Tab 1: Electrical & Power */}
      {activeTab === 'electrical_power' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Electrical Operating Point</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">V_min (V)</label>
                <input
                  type="number"
                  value={vMin}
                  onChange={(e) => setVMin(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">V_nom (V)</label>
                <input
                  type="number"
                  value={vNom}
                  onChange={(e) => setVNom(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">V_max (V)</label>
                <input
                  type="number"
                  value={vMax}
                  onChange={(e) => setVMax(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Continuous Current (A)</label>
                <input
                  type="number"
                  value={iCont}
                  onChange={(e) => setICont(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Peak Current (A)</label>
                <input
                  type="number"
                  value={iPeak}
                  onChange={(e) => setIPeak(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>

            <h3 className="text-base font-semibold pt-3 border-t border-border">Power Requirements</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Continuous Power (W)</label>
                <input
                  type="number"
                  value={pCont}
                  onChange={(e) => setPCont(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Peak Power (W)</label>
                <input
                  type="number"
                  value={pPeak}
                  onChange={(e) => setPPeak(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Electrical & Power Specification Results"
              value={`${vNom} V / ${pCont} W`}
              subtitle={`Voltage Span: ${elecRes?.voltageSpan ?? 0} V | Peak/Cont Ratio: ${elecRes?.peakToContinuousRatio ?? 1}x`}
              status="normal"
            />
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Generated Requirements</h4>
              <div className="space-y-1.5 text-sm">
                {elecRes?.requirements.map((r) => (
                  <div key={r.id} className="flex justify-between py-1 border-b border-border/50">
                    <span className="font-mono text-xs">{r.name}</span>
                    <span className="font-semibold">{r.nominalValue} {r.unit}</span>
                  </div>
                ))}
                {pwrRes?.requirements.map((r) => (
                  <div key={r.id} className="flex justify-between py-1 border-b border-border/50">
                    <span className="font-mono text-xs">{r.name}</span>
                    <span className="font-semibold">{r.nominalValue} {r.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Thermal & Environment */}
      {activeTab === 'thermal_env' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Environmental Conditions</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">T_min (°C)</label>
                <input
                  type="number"
                  value={tMin}
                  onChange={(e) => setTMin(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">T_ambient (°C)</label>
                <input
                  type="number"
                  value={tAmb}
                  onChange={(e) => setTAmb(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">T_max (°C)</label>
                <input
                  type="number"
                  value={tMax}
                  onChange={(e) => setTMax(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Installation Altitude (m)</label>
              <input
                type="number"
                value={altitude}
                onChange={(e) => setAltitude(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
              />
            </div>

            <h3 className="text-base font-semibold pt-3 border-t border-border">Thermal Limits</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Max Junction Temp Tj (°C)</label>
                <input
                  type="number"
                  value={maxTj}
                  onChange={(e) => setMaxTj(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Max Enclosure Temp (°C)</label>
                <input
                  type="number"
                  value={maxTEnc}
                  onChange={(e) => setMaxTEnc(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Thermal Budget Constraints"
              value={`ΔT max = ${thermRes?.maxAllowableDeltaT ?? 0} °C`}
              subtitle={`Max Junction: ${maxTj} °C | Max Ambient: ${tMax} °C`}
              status="normal"
            />
            {envRes?.requiresHardwareAltitudeTesting && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Altitude &gt; 2000m: Air density reduction reduces convective heat transfer and dielectric withstand voltage. Physical clearance validation required.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Mechanical & Derating */}
      {activeTab === 'mechanical_derating' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Mechanical Envelope</h3>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Max Mass (kg)</label>
              <input
                type="number"
                value={maxMassKg}
                onChange={(e) => setMaxMassKg(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-medium">L (mm)</label>
                <input
                  type="number"
                  value={dimL}
                  onChange={(e) => setDimL(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">W (mm)</label>
                <input
                  type="number"
                  value={dimW}
                  onChange={(e) => setDimW(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">H (mm)</label>
                <input
                  type="number"
                  value={dimH}
                  onChange={(e) => setDimH(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>

            <h3 className="text-base font-semibold pt-3 border-t border-border">Component Derating Rules</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Component V_rating (V)</label>
                <input
                  type="number"
                  value={compVRating}
                  onChange={(e) => setCompVRating(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Component I_rating (A)</label>
                <input
                  type="number"
                  value={compIRating}
                  onChange={(e) => setCompIRating(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Calculated Volume & Derated Limits"
              value={`${mechRes?.calculatedVolumeLiters ?? 0} Liters`}
              subtitle={`Derated V: ${compRes?.deratedVoltageLimitVolts ?? 0} V (80%) | Derated I: ${compRes?.deratedCurrentLimitAmps ?? 0} A (75%)`}
              status="normal"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Consistency Validation */}
      {activeTab === 'consistency' && (
        <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center space-x-2">
            {consistencyRes.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            )}
            <h3 className="text-base font-semibold">
              {consistencyRes.isValid ? 'All Specified Requirements Consistent' : 'Requirement Inconsistencies Detected'}
            </h3>
          </div>

          {consistencyRes.violations.length > 0 && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1">
              <span className="text-xs font-semibold text-rose-500 uppercase">Violations</span>
              {consistencyRes.violations.map((v, i) => (
                <p key={i} className="text-sm text-rose-400">• {v}</p>
              ))}
            </div>
          )}

          {consistencyRes.warnings.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-xs font-semibold text-amber-500 uppercase">Engineering Warnings</span>
              {consistencyRes.warnings.map((w) => (
                <p key={w.id} className="text-sm text-amber-400">• {w.message}</p>
              ))}
            </div>
          )}

          {consistencyRes.isValid && consistencyRes.warnings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No contradictions detected between voltage bounds, power demands, thermal thresholds, and environmental temperature ranges.
            </p>
          )}
        </div>
      )}

      {/* Tab 5: Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="text-base font-semibold">Formal Engineering Requirement Register</h3>
            <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary font-mono rounded-full font-semibold">
              {summaryRes.totalRequirementsCount} Registered Requirements
            </span>
          </div>
          <pre className="p-4 rounded-lg bg-muted/40 text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground border border-border/50">
            {summaryRes.summaryText}
          </pre>
        </div>
      )}
    </div>
  );
}
