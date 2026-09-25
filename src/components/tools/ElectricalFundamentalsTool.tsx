import React, { useState } from 'react';
import { Zap, DollarSign, Activity, ListPlus, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  calculateDcPower,
  calculateEnergyCost,
  calculateElectricalEfficiency,
  calculateDcLoadSchedule,
  LoadItem,
} from '../../engines/electrical/fundamentals';

export const ElectricalFundamentalsTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'power' | 'cost' | 'efficiency' | 'loads'>('power');

  // DC Power state
  const [voltage, setVoltage] = useState<number>(24);
  const [current, setCurrent] = useState<number>(5);
  const [hours, setHours] = useState<number>(8);

  // Cost state
  const [costPower, setCostPower] = useState<number>(1500);
  const [costHours, setCostHours] = useState<number>(6);
  const [tariff, setTariff] = useState<number>(0.16);

  // Efficiency state
  const [pin, setPin] = useState<number>(1000);
  const [pout, setPout] = useState<number>(880);

  // DC Loads state
  const [loads, setLoads] = useState<LoadItem[]>([
    { id: '1', name: 'Control PLC & Relays', voltage: 24, powerWatts: 45, quantity: 1, hoursPerDay: 24 },
    { id: '2', name: '24V DC Stepper Drives', voltage: 24, powerWatts: 90, quantity: 2, hoursPerDay: 8 },
    { id: '3', name: 'LED Cabinet Lighting', voltage: 24, powerWatts: 30, quantity: 3, hoursPerDay: 12 },
  ]);

  const powerResult = calculateDcPower({ voltage, current, timeHours: hours });
  const costResult = calculateEnergyCost({ powerWatts: costPower, hoursPerDay: costHours, tariffPerKwh: tariff });
  const effResult = calculateElectricalEfficiency({ pinWatts: pin, poutWatts: pout });
  const loadResult = calculateDcLoadSchedule(loads);

  const addLoadItem = () => {
    const newItem: LoadItem = {
      id: Date.now().toString(),
      name: 'New 24V Load',
      voltage: 24,
      powerWatts: 50,
      quantity: 1,
      hoursPerDay: 8,
    };
    setLoads([...loads, newItem]);
  };

  const updateLoad = (id: string, field: keyof LoadItem, value: any) => {
    setLoads(loads.map(l => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const removeLoad = (id: string) => {
    if (loads.length <= 1) return;
    setLoads(loads.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-6" id="electrical-fundamentals-container">
      {/* Header & Classification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Electrical Fundamentals</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              THEORETICAL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Core DC power equations (P = VI, I²R, V²/R), energy integration (Joules/kWh), utility cost projection, and efficiency.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('power')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'power'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Zap className="w-4 h-4" />
          DC Power & Energy
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
          Energy Cost Calculator
        </button>
        <button
          onClick={() => setActiveTab('efficiency')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'efficiency'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Activity className="w-4 h-4" />
          Electrical Efficiency (η)
        </button>
        <button
          onClick={() => setActiveTab('loads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'loads'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <ListPlus className="w-4 h-4" />
          DC Load Schedule
        </button>
      </div>

      {/* Tab 1: DC Power */}
      {activeTab === 'power' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Circuit Inputs</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">DC Voltage (V)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={voltage}
                    onChange={e => setVoltage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                  <span className="flex items-center px-3 rounded-lg bg-muted text-xs font-medium">V</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Current (I)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={current}
                    onChange={e => setCurrent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                  <span className="flex items-center px-3 rounded-lg bg-muted text-xs font-medium">A</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Operating Duration (Hours)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={hours}
                    onChange={e => setHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                  <span className="flex items-center px-3 rounded-lg bg-muted text-xs font-medium">h</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-xs font-medium text-muted-foreground mb-2">Standard Bench Presets</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setVoltage(5); setCurrent(2); }}
                    className="text-xs px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    5V @ 2A (USB)
                  </button>
                  <button
                    onClick={() => { setVoltage(12); setCurrent(10); }}
                    className="text-xs px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    12V @ 10A (Automotive)
                  </button>
                  <button
                    onClick={() => { setVoltage(24); setCurrent(15); }}
                    className="text-xs px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    24V @ 15A (Industrial PLC)
                  </button>
                  <button
                    onClick={() => { setVoltage(48); setCurrent(25); }}
                    className="text-xs px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    48V @ 25A (Telecom / Solar)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {/* Primary Result Card */}
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Calculated Active Power</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground">
                {powerResult.formattedValue}
              </div>
              <p className="text-xs text-muted-foreground">
                Equivalent DC Resistance: {powerResult.additionalOutputs?.resistance?.value}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
                <div className="p-2.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Energy (Wh)</span>
                  <span className="text-sm font-semibold text-foreground">{powerResult.additionalOutputs?.energyWh?.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Energy (kWh)</span>
                  <span className="text-sm font-semibold text-foreground">{powerResult.additionalOutputs?.energyKwh?.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Energy (Joules)</span>
                  <span className="text-sm font-semibold text-foreground">{powerResult.additionalOutputs?.energyJoules?.value}</span>
                </div>
              </div>
            </div>

            {/* Derivation Steps */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Step-by-Step Derivation</h4>
              {powerResult.steps?.map((step, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/40 text-xs space-y-1">
                  <div className="font-semibold text-foreground">{step.title}</div>
                  <div className="font-mono text-primary">{step.formula}</div>
                  <div className="text-muted-foreground">{step.substitution} = <span className="font-semibold text-foreground">{step.result}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cost Calculator */}
      {activeTab === 'cost' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Operating Parameters</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Appliance / Load Power (W)</label>
                <input
                  type="number"
                  value={costPower}
                  onChange={e => setCostPower(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Hours Operated Per Day (0 - 24 h)</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={costHours}
                  onChange={e => setCostHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Electricity Tariff Rate ($ / kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tariff}
                  onChange={e => setTariff(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">Typical rates: US $0.15–0.25/kWh, EU €0.25–0.40/kWh</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projected Energy Expense</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  ENGINEERING ESTIMATE
                </span>
              </div>
              <div className="text-3xl font-extrabold text-foreground">{costResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Based on continuous {costHours} h/day usage across a 30-day month at ${tariff.toFixed(3)}/kWh.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Daily Energy</span>
                  <span className="text-sm font-semibold text-foreground">{costResult.additionalOutputs?.dailyKwh?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Monthly Energy</span>
                  <span className="text-sm font-semibold text-foreground">{costResult.additionalOutputs?.monthlyKwh?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Daily Cost</span>
                  <span className="text-sm font-semibold text-foreground">{costResult.additionalOutputs?.dailyCost?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Annual Cost</span>
                  <span className="text-sm font-semibold text-foreground">{costResult.additionalOutputs?.annualCost?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Efficiency */}
      {activeTab === 'efficiency' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Power Balance</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Total Electrical Input Power Pin (W)</label>
                <input
                  type="number"
                  value={pin}
                  onChange={e => setPin(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Useful Mechanical/Electrical Output Pout (W)</label>
                <input
                  type="number"
                  value={pout}
                  onChange={e => setPout(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-border bg-card space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversion Efficiency</span>
              <div className="text-4xl font-extrabold text-foreground">{effResult.formattedValue}</div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(effResult.primaryValue, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-xs text-muted-foreground block">Dissipated Thermal Loss (Ploss)</span>
                  <span className="text-sm font-semibold text-red-500">{effResult.additionalOutputs?.lossWatts?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-xs text-muted-foreground block">Efficiency Ratio</span>
                  <span className="text-sm font-semibold text-foreground">{effResult.additionalOutputs?.ratio?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: DC Load Schedule */}
      {activeTab === 'loads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground text-sm">DC Branch Circuit Schedule</h3>
              <p className="text-xs text-muted-foreground">List individual 12V/24V/48V appliances to calculate aggregated bus demand.</p>
            </div>
            <button
              onClick={addLoadItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <ListPlus className="w-3.5 h-3.5" />
              Add Branch Load
            </button>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Circuit / Load Name</th>
                  <th className="p-3">Voltage (V)</th>
                  <th className="p-3">Watts / Unit</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Total Watts</th>
                  <th className="p-3">Hours/Day</th>
                  <th className="p-3">Daily kWh</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {loads.map(load => {
                  const itemWatts = load.powerWatts * load.quantity;
                  const itemDailyKwh = (itemWatts * load.hoursPerDay) / 1000;
                  return (
                    <tr key={load.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium text-foreground">
                        <input
                          type="text"
                          value={load.name}
                          onChange={e => updateLoad(load.id, 'name', e.target.value)}
                          className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-full max-w-[180px]"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={load.voltage}
                          onChange={e => updateLoad(load.id, 'voltage', Number(e.target.value))}
                          className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-16"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={load.powerWatts}
                          onChange={e => updateLoad(load.id, 'powerWatts', Number(e.target.value))}
                          className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-20"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          value={load.quantity}
                          onChange={e => updateLoad(load.id, 'quantity', Number(e.target.value))}
                          className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-14"
                        />
                      </td>
                      <td className="p-3 font-semibold text-foreground">{itemWatts} W</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={load.hoursPerDay}
                          onChange={e => updateLoad(load.id, 'hoursPerDay', Number(e.target.value))}
                          className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-14"
                        />
                      </td>
                      <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">{itemDailyKwh.toFixed(3)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeLoad(load.id)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40 border border-border">
            <div>
              <span className="text-[11px] text-muted-foreground block">Total Connected Power</span>
              <span className="text-base font-bold text-foreground">{loadResult.formattedValue}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Daily Energy Demand</span>
              <span className="text-base font-bold text-foreground">{loadResult.additionalOutputs?.dailyKwh?.value}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Monthly Energy Demand</span>
              <span className="text-base font-bold text-foreground">{loadResult.additionalOutputs?.monthlyKwh?.value}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Annual Energy Demand</span>
              <span className="text-base font-bold text-foreground">{loadResult.additionalOutputs?.annualKwh?.value}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
