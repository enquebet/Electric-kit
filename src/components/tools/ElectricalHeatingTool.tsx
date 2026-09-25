import React, { useState } from 'react';
import { Flame, DollarSign, Zap, Activity } from 'lucide-react';
import {
  calculateJouleHeating,
  calculateHeaterEnergyCost,
} from '../../engines/electrical/heating';

export const ElectricalHeatingTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'joule' | 'cost'>('joule');

  // Joule heating state
  const [current, setCurrent] = useState<number>(10);
  const [resistance, setResistance] = useState<number>(24);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Heater cost state
  const [heaterWatts, setHeaterWatts] = useState<number>(2000);
  const [hoursPerDay, setHoursPerDay] = useState<number>(6);
  const [tariffRate, setTariffRate] = useState<number>(0.16);

  const jouleResult = calculateJouleHeating({
    currentA: current,
    resistanceOhms: resistance,
    durationSeconds: durationMinutes * 60,
  });

  const costResult = calculateHeaterEnergyCost({
    powerRatingWatts: heaterWatts,
    operatingHoursPerDay: hoursPerDay,
    tariffPerKwh: tariffRate,
  });

  return (
    <div className="space-y-6" id="electrical-heating-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Electrical Heating & Joule Thermal Law</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              THEORETICAL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Thermodynamic Joule heating (Q = I²Rt), heat conversions (Joules, kWh, BTU, kcal), and resistive heating utility cost modeling.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('joule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'joule'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Flame className="w-4 h-4" />
          Joule Heating & BTU Output
        </button>
        <button
          onClick={() => setActiveTab('cost')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'cost'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Heater Energy & Operating Cost
        </button>
      </div>

      {/* Tab 1: Joule Heating */}
      {activeTab === 'joule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Thermal Element Inputs</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Element Current (A)</label>
                <input
                  type="number"
                  value={current}
                  onChange={e => setCurrent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Heating Resistance (Ω)</label>
                <input
                  type="number"
                  value={resistance}
                  onChange={e => setResistance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Heating Duration (Minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Total Heat Energy Released</span>
              <div className="text-4xl font-extrabold text-foreground">{jouleResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Dissipation Power: <strong className="text-foreground">{jouleResult.additionalOutputs?.heatPower?.value}</strong>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">British Thermal Units</span>
                  <span className="text-base font-bold text-foreground">{jouleResult.additionalOutputs?.btu?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Electricity (kWh)</span>
                  <span className="text-base font-bold text-foreground">{jouleResult.additionalOutputs?.kilowattHours?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Calories (kcal)</span>
                  <span className="text-base font-bold text-foreground">{jouleResult.additionalOutputs?.kilocalories?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cost */}
      {activeTab === 'cost' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Operating Schedule</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Heater Rating (Watts)</label>
                <input
                  type="number"
                  value={heaterWatts}
                  onChange={e => setHeaterWatts(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Operating Hours / Day</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hoursPerDay}
                  onChange={e => setHoursPerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Electricity Tariff ($ / kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tariffRate}
                  onChange={e => setTariffRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Monthly Heating Utility Bill</span>
              <div className="text-4xl font-extrabold text-foreground">{costResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Heat output delivered: <strong className="text-foreground">{costResult.additionalOutputs?.monthlyHeatOutput?.value}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Monthly Electricity</span>
                  <span className="text-base font-bold text-foreground">{costResult.additionalOutputs?.monthlyEnergy?.value}</span>
                </div>
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Projected Annual Cost</span>
                  <span className="text-base font-bold text-foreground">{costResult.additionalOutputs?.annualCost?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
