import React, { useState } from 'react';
import { Layers, Activity, Scale, ShieldAlert, Zap, AlertTriangle } from 'lucide-react';
import {
  calculateConductorResistance,
  calculatePreliminaryCableSize,
  compareCableSizes,
} from '../../engines/electrical/conductors';
import { IEC_STANDARD_METRIC_AREAS_MM2 } from '../../lib/standards/standards-profile';

export const CableEngineeringTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'estimator' | 'resistance' | 'comparison'>('estimator');

  // Estimator state
  const [circuitType, setCircuitType] = useState<'dc' | 'ac-single-phase' | 'three-phase'>('three-phase');
  const [estVoltage, setEstVoltage] = useState<number>(400);
  const [estCurrent, setEstCurrent] = useState<number>(45);
  const [estLength, setEstLength] = useState<number>(75);
  const [estMaterial, setEstMaterial] = useState<'copper' | 'aluminium'>('copper');
  const [maxDropPct, setMaxDropPct] = useState<number>(3.0);
  const [opTemp, setOpTemp] = useState<number>(70);

  // Resistance state
  const [resMaterial, setResMaterial] = useState<'copper' | 'aluminium'>('copper');
  const [resLength, setResLength] = useState<number>(100);
  const [resArea, setResArea] = useState<number>(4.0);
  const [resTemp, setResTemp] = useState<number>(20);

  const estimatorResult = calculatePreliminaryCableSize({
    circuitType,
    systemVoltageV: estVoltage,
    loadCurrentA: estCurrent,
    oneWayLengthM: estLength,
    material: estMaterial,
    maxAllowedVoltageDropPercent: maxDropPct,
    operatingTempC: opTemp,
  });

  const resResult = calculateConductorResistance({
    material: resMaterial,
    lengthMeters: resLength,
    areaMm2: resArea,
    temperatureC: resTemp,
  });

  const comparisons = compareCableSizes({
    circuitType,
    systemVoltageV: estVoltage,
    loadCurrentA: estCurrent,
    oneWayLengthM: estLength,
    operatingHoursPerYear: 3500,
    tariffPerKwh: 0.16,
  });

  return (
    <div className="space-y-6" id="cable-engineering-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Conductor & Cable Engineering</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              ENGINEERING ESTIMATE
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Preliminary conductor sizing, temperature-adjusted resistance (R_T), and side-by-side lifecycle thermal loss analysis.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('estimator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'estimator'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Scale className="w-4 h-4" />
          Preliminary Conductor Sizing
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'comparison'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Layers className="w-4 h-4" />
          Cross-Section Comparison Table
        </button>
        <button
          onClick={() => setActiveTab('resistance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'resistance'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Zap className="w-4 h-4" />
          Conductor Resistance & Temp Factor
        </button>
      </div>

      {/* Tab 1: Estimator */}
      {activeTab === 'estimator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Design Requirements</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Circuit System</label>
                <select
                  value={circuitType}
                  onChange={e => {
                    const val = e.target.value as any;
                    setCircuitType(val);
                    if (val === 'three-phase') setEstVoltage(400);
                    else if (val === 'ac-single-phase') setEstVoltage(230);
                    else setEstVoltage(24);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  <option value="three-phase">Three-Phase AC (400V / 480V)</option>
                  <option value="ac-single-phase">Single-Phase AC (230V / 120V)</option>
                  <option value="dc">Direct Current (DC)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">System Voltage (V)</label>
                  <input
                    type="number"
                    value={estVoltage}
                    onChange={e => setEstVoltage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Continuous Load (A)</label>
                  <input
                    type="number"
                    value={estCurrent}
                    onChange={e => setEstCurrent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">One-Way Run (m)</label>
                  <input
                    type="number"
                    value={estLength}
                    onChange={e => setEstLength(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Material</label>
                  <select
                    value={estMaterial}
                    onChange={e => setEstMaterial(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  >
                    <option value="copper">Copper (Cu)</option>
                    <option value="aluminium">Aluminium (Al)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Max Allowable Drop %: {maxDropPct.toFixed(1)}%</label>
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.5"
                  value={maxDropPct}
                  onChange={e => setMaxDropPct(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Conductor Max Operating Temp (°C)</label>
                <select
                  value={opTemp}
                  onChange={e => setOpTemp(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  <option value={60}>60°C (Standard PVC Terminal Limit)</option>
                  <option value={70}>70°C (Standard European PVC 70)</option>
                  <option value={90}>90°C (XLPE / Thermoset EPR insulation)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Recommended Commercial Size</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {estimatorResult.additionalOutputs?.governingCriterion?.value}
                </span>
              </div>
              <div className="text-4xl font-extrabold text-foreground">{estimatorResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Actual expected drop with this standard size: <strong className="text-foreground">{estimatorResult.additionalOutputs?.actualVoltageDrop?.value}</strong>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Exact Theoretical Min</span>
                  <span className="text-sm font-bold text-foreground">{estimatorResult.additionalOutputs?.minimumTheoreticalArea?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-[11px] text-muted-foreground block">IEC Standard Metric</span>
                  <span className="text-sm font-bold text-foreground">{estimatorResult.additionalOutputs?.iecSize?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-[11px] text-muted-foreground block">NEC / AWG Reference</span>
                  <span className="text-sm font-bold text-foreground">{estimatorResult.additionalOutputs?.awgSize?.value}</span>
                </div>
              </div>
            </div>

            {/* Mandatory Engineering Warning Banner */}
            {estimatorResult.warnings && estimatorResult.warnings.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-2 text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {estimatorResult.warnings[0].title}
                </div>
                <p>{estimatorResult.warnings[0].message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Comparison Table */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Standard Size</th>
                  <th className="p-3">Loop Resistance</th>
                  <th className="p-3">Voltage Drop</th>
                  <th className="p-3">Drop %</th>
                  <th className="p-3">Thermal Loss</th>
                  <th className="p-3">Annual Waste (kWh)</th>
                  <th className="p-3">Annual Cost ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {comparisons.map(item => (
                  <tr key={item.areaMm2} className="hover:bg-muted/30">
                    <td className="p-3 font-bold text-foreground">{item.areaMm2} mm²</td>
                    <td className="p-3">{item.resistanceOhm.toFixed(4)} Ω</td>
                    <td className="p-3">{item.voltageDropV.toFixed(2)} V</td>
                    <td className="p-3 font-semibold">
                      <span className={item.voltageDropPct > 5 ? 'text-red-500' : item.voltageDropPct > 3 ? 'text-amber-500' : 'text-emerald-500'}>
                        {item.voltageDropPct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-3 font-mono">{item.lossWatts.toFixed(0)} W</td>
                    <td className="p-3">{item.annualKwhLoss.toFixed(0)} kWh</td>
                    <td className="p-3 font-semibold text-foreground">${item.annualCostLoss.toFixed(2)}/yr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            * Comparison based on {estLength}m feeder run at {estCurrent}A operating for 3,500 hours/year at $0.16/kWh. Notice how upgrading by one cable size pays for itself over the cable lifetime through reduced I²R thermal dissipation!
          </p>
        </div>
      )}

      {/* Tab 3: Resistance */}
      {activeTab === 'resistance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Conductor Properties</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Material</label>
                <select
                  value={resMaterial}
                  onChange={e => setResMaterial(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  <option value="copper">Copper (ρ₂₀ = 1.724 × 10⁻⁸ Ω·m)</option>
                  <option value="aluminium">Aluminium (ρ₂₀ = 2.826 × 10⁻⁸ Ω·m)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Cross-Sectional Area (mm²)</label>
                <select
                  value={resArea}
                  onChange={e => setResArea(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  {IEC_STANDARD_METRIC_AREAS_MM2.map(s => (
                    <option key={s} value={s}>
                      {s} mm²
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Length (m)</label>
                <input
                  type="number"
                  value={resLength}
                  onChange={e => setResLength(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Conductor Temperature (°C): {resTemp}°C</label>
                <input
                  type="range"
                  min="-20"
                  max="120"
                  step="5"
                  value={resTemp}
                  onChange={e => setResTemp(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Conductor Resistance (R_T)</span>
              <div className="text-4xl font-extrabold text-foreground">{resResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Formula: R_T = (ρ₂₀ × L / A) × [ 1 + α × (T - 20°C) ]
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Resistance Per Kilometer</span>
                  <span className="text-sm font-bold text-foreground">{resResult.additionalOutputs?.resistancePerKm?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Temperature Factor</span>
                  <span className="text-sm font-bold text-foreground">{resResult.additionalOutputs?.tempRiseFactor?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
