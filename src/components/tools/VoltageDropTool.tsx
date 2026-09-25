import React, { useState } from 'react';
import { Compass, Zap, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import {
  calculateVoltageDrop,
  generateVoltageDropCurve,
  VoltageDropInputs,
} from '../../engines/electrical/voltage-drop';
import { IEC_STANDARD_METRIC_AREAS_MM2 } from '../../lib/standards/standards-profile';

export const VoltageDropTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [circuitType, setCircuitType] = useState<'dc' | 'ac-single-phase' | 'three-phase'>('three-phase');
  const [voltage, setVoltage] = useState<number>(400);
  const [current, setCurrent] = useState<number>(32);
  const [lengthMeters, setLengthMeters] = useState<number>(60);
  const [material, setMaterial] = useState<'copper' | 'aluminium'>('copper');
  const [areaMm2, setAreaMm2] = useState<number>(6.0);
  const [powerFactor, setPowerFactor] = useState<number>(0.9);
  const [tempC, setTempC] = useState<number>(50);

  const dropInputs: VoltageDropInputs = {
    circuitType,
    systemVoltageV: voltage,
    loadCurrentA: current,
    oneWayLengthMeters: lengthMeters,
    conductorMaterial: material,
    conductorAreaMm2: areaMm2,
    powerFactor,
    operatingTemperatureC: tempC,
  };

  const result = calculateVoltageDrop(dropInputs);
  const curvePoints = generateVoltageDropCurve(dropInputs, 150, 10);

  const pctDrop = result.additionalOutputs?.dropPercent?.value
    ? parseFloat(result.additionalOutputs.dropPercent.value)
    : 0;

  return (
    <div className="space-y-6" id="voltage-drop-tool-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Feeder Voltage Drop & Distance Analysis</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              STANDARDS-DEPENDENT
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate loop feeder impedance, voltage drop (ΔV), load terminal voltage, and thermal I²R losses against IEC 60364-5-52 and NEC 210.19 benchmarks.
          </p>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((w, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                w.severity === 'danger'
                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">{w.title}</span>
                <span>{w.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Feeder Parameters</h3>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Circuit Configuration</label>
              <select
                value={circuitType}
                onChange={e => {
                  const val = e.target.value as any;
                  setCircuitType(val);
                  if (val === 'three-phase') setVoltage(400);
                  else if (val === 'ac-single-phase') setVoltage(230);
                  else setVoltage(24);
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
              >
                <option value="three-phase">Three-Phase AC (3φ, √3 Multiplier)</option>
                <option value="ac-single-phase">Single-Phase AC (1φ, 2x Multiplier)</option>
                <option value="dc">Direct Current (DC, 2x Loop Multiplier)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nominal Voltage (V)</label>
                <input
                  type="number"
                  value={voltage}
                  onChange={e => setVoltage(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Load Current (A)</label>
                <input
                  type="number"
                  value={current}
                  onChange={e => setCurrent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">One-Way Feeder Distance: {lengthMeters} m</span>
                <span className="text-xs text-muted-foreground">({(lengthMeters * 3.28084).toFixed(0)} ft)</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={lengthMeters}
                onChange={e => setLengthMeters(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Conductor Material</label>
                <select
                  value={material}
                  onChange={e => setMaterial(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  <option value="copper">Copper (Cu)</option>
                  <option value="aluminium">Aluminium (Al)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Conductor Size (mm²)</label>
                <select
                  value={areaMm2}
                  onChange={e => setAreaMm2(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  {IEC_STANDARD_METRIC_AREAS_MM2.map(s => (
                    <option key={s} value={s}>
                      {s} mm²
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {circuitType !== 'dc' && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Load Power Factor: {powerFactor.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={powerFactor}
                  onChange={e => setPowerFactor(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Results & Visual Chart */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calculated Voltage Drop</span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                  pctDrop <= 3.0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : pctDrop <= 5.0
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}
              >
                {pctDrop <= 3.0 ? 'PASS (≤ 3% Lighting/Branch)' : pctDrop <= 5.0 ? 'ACCEPTABLE (≤ 5% Feeder)' : 'EXCEEDED (> 5% Limit)'}
              </span>
            </div>

            <div className="text-4xl font-extrabold text-foreground">{result.formattedValue}</div>
            <p className="text-xs text-muted-foreground">
              Receiving End Terminal Voltage: <strong className="text-foreground">{result.additionalOutputs?.terminalVoltage?.value}</strong>
            </p>

            {/* Drop % Gauge Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Drop vs Allowed Thresholds</span>
                <span className="font-semibold text-foreground">{pctDrop.toFixed(2)}%</span>
              </div>
              <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pctDrop <= 3 ? 'bg-emerald-500' : pctDrop <= 5 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(pctDrop * 10, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                <span>0%</span>
                <span className="text-emerald-500">3% (IEC Lighting)</span>
                <span className="text-amber-500">5% (NEC Feeder Total)</span>
                <span>10%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[11px] text-muted-foreground block">One-Way Resistance</span>
                <span className="text-sm font-bold text-foreground">{result.additionalOutputs?.oneWayResistance?.value}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[11px] text-muted-foreground block">Max Distance (3% Limit)</span>
                <span className="text-sm font-bold text-foreground">{result.additionalOutputs?.maxDistance3Percent?.value}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[11px] text-muted-foreground block">Cable I²R Thermal Loss</span>
                <span className="text-sm font-bold text-foreground">{result.additionalOutputs?.powerLossWatts?.value}</span>
              </div>
            </div>
          </div>

          {/* Voltage Drop Curve Visualization */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Voltage Drop vs Feeder Run Distance (0 to 150m)
            </h4>
            <div className="space-y-1 text-xs">
              <div className="grid grid-cols-6 gap-2 text-[11px] text-muted-foreground font-semibold border-b border-border pb-1">
                <span>Distance</span>
                <span>Drop (V)</span>
                <span>Drop (%)</span>
                <span className="col-span-3">Status</span>
              </div>
              {curvePoints.filter((_: any, i: number) => i % 2 === 0).map((pt: any, idx: number) => (
                <div key={idx} className="grid grid-cols-6 gap-2 text-xs py-1 border-b border-border/30">
                  <span className="font-medium text-foreground">{pt.distanceM} m</span>
                  <span>{pt.dropV.toFixed(2)} V</span>
                  <span className={pt.dropPercent > 5 ? 'text-red-500 font-bold' : pt.dropPercent > 3 ? 'text-amber-500 font-semibold' : 'text-emerald-500'}>
                    {pt.dropPercent.toFixed(2)}%
                  </span>
                  <span className="col-span-3 text-[11px] text-muted-foreground">
                    {pt.dropPercent <= 3 ? '✓ Compliant' : pt.dropPercent <= 5 ? '⚠ Feeder only' : '❌ Excessive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
