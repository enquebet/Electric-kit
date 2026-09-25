import React, { useState } from 'react';
import { Cpu, Gauge, Fuel, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import {
  calculateGeneratorRatings,
  calculateGeneratorRuntime,
} from '../../engines/electrical/generators';

export const GeneratorTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'ratings' | 'runtime'>('ratings');

  // Generator ratings state
  const [circuitType, setCircuitType] = useState<'three-phase' | 'single-phase'>('three-phase');
  const [voltage, setVoltage] = useState<number>(400);
  const [ratedCurrent, setRatedCurrent] = useState<number>(145);
  const [powerFactor, setPowerFactor] = useState<number>(0.8);
  const [currentLoadKw, setCurrentLoadKw] = useState<number>(65);

  // Runtime state
  const [tankLiters, setTankLiters] = useState<number>(300);
  const [burnRateLph, setBurnRateLph] = useState<number>(22);
  const [fuelCost, setFuelCost] = useState<number>(1.25);

  const ratingsResult = calculateGeneratorRatings({
    circuitType,
    voltageV: voltage,
    ratedCurrentA: ratedCurrent,
    powerFactor,
    actualLoadKw: currentLoadKw,
  });

  const runtimeResult = calculateGeneratorRuntime({
    fuelTankCapacityLiters: tankLiters,
    fuelConsumptionLitersPerHour: burnRateLph,
    fuelCostPerLiter: fuelCost,
  });

  const loadPct = ratingsResult.visualData?.loadPct || 0;

  return (
    <div className="space-y-6" id="generator-tool-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Generator & Standby Power Sizing</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              ENGINEERING ESTIMATE
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Genset kVA/kW prime ratings, load utilization percentage, diesel wet-stacking diagnostics (&lt;30%), and fuel autonomy duration.
          </p>
        </div>
      </div>

      {/* Warnings */}
      {ratingsResult.warnings && ratingsResult.warnings.length > 0 && (
        <div className="space-y-2">
          {ratingsResult.warnings.map((w, idx) => (
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('ratings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ratings'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Zap className="w-4 h-4" />
          kVA / kW Capacity & Loading
        </button>
        <button
          onClick={() => setActiveTab('runtime')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'runtime'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Fuel className="w-4 h-4" />
          Fuel Consumption & Autonomy
        </button>
      </div>

      {/* Tab 1: Ratings */}
      {activeTab === 'ratings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Alternator Specs</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Configuration</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCircuitType('three-phase');
                      setVoltage(400);
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      circuitType === 'three-phase' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                    }`}
                  >
                    3-Phase (400V)
                  </button>
                  <button
                    onClick={() => {
                      setCircuitType('single-phase');
                      setVoltage(230);
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      circuitType === 'single-phase' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                    }`}
                  >
                    Single Phase (230V)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Line Voltage (V)</label>
                  <input
                    type="number"
                    value={voltage}
                    onChange={e => setVoltage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Rated Current (A)</label>
                  <input
                    type="number"
                    value={ratedCurrent}
                    onChange={e => setRatedCurrent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Rated Power Factor (typically 0.8)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1.0"
                  value={powerFactor}
                  onChange={e => setPowerFactor(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Current Active Load Demand (kW)</label>
                <input
                  type="number"
                  value={currentLoadKw}
                  onChange={e => setCurrentLoadKw(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Generator Continuous Prime Capacity</span>
              <div className="text-4xl font-extrabold text-foreground">{ratingsResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Apparent Power Capacity: <strong className="text-foreground">{ratingsResult.additionalOutputs?.apparentPowerKva?.value}</strong>
              </p>

              {/* Load Percentage Progress Meter */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Current Operating Load</span>
                  <span className="font-semibold text-foreground">{loadPct.toFixed(1)}%</span>
                </div>
                <div className="h-3.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loadPct > 100 ? 'bg-red-500' : loadPct < 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(loadPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                  <span className="text-amber-500">&lt; 30% Wet Stacking Hazard</span>
                  <span className="text-emerald-500">50%–80% Optimal Operating Zone</span>
                  <span className="text-red-500">&gt; 100% Overload</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Line Current per Phase</span>
                  <span className="text-base font-bold text-foreground">{ratingsResult.additionalOutputs?.ratedLineCurrent?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Apparent Rating</span>
                  <span className="text-base font-bold text-foreground">{ratingsResult.additionalOutputs?.apparentPowerKva?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Runtime */}
      {activeTab === 'runtime' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Fuel System Inputs</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Fuel Tank Gross Capacity (Liters)</label>
                <input
                  type="number"
                  value={tankLiters}
                  onChange={e => setTankLiters(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                <span className="text-[11px] text-muted-foreground">Accounts for 10% bottom unusable fuel / sludge reserve</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Fuel Burn Rate at Load (Liters / Hour)</label>
                <input
                  type="number"
                  value={burnRateLph}
                  onChange={e => setBurnRateLph(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Fuel Price ($ / Liter)</label>
                <input
                  type="number"
                  step="0.05"
                  value={fuelCost}
                  onChange={e => setFuelCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Estimated Continuous Run Time</span>
              <div className="text-4xl font-extrabold text-foreground">{runtimeResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Continuous autonomy: <strong className="text-foreground">{runtimeResult.additionalOutputs?.runtimeDays?.value}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Hourly Operating Fuel Cost</span>
                  <span className="text-base font-bold text-foreground">{runtimeResult.additionalOutputs?.hourlyFuelCost?.value}</span>
                </div>
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Full Tank Fill Expense</span>
                  <span className="text-base font-bold text-foreground">{runtimeResult.additionalOutputs?.fullTankFillCost?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
