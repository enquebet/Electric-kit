import React, { useState } from 'react';
import { Gauge, Sparkles, TrendingUp, AlertCircle, ArrowDownRight } from 'lucide-react';
import {
  calculatePowerFactor,
  calculatePfcCapacitor,
  calculatePfcSavings,
} from '../../engines/electrical/power-factor';

export const PowerFactorTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'correction' | 'savings'>('correction');

  // PF Calc state
  const [activeP, setActiveP] = useState<number>(45000); // 45 kW
  const [apparentS, setApparentS] = useState<number>(60000); // 60 kVA

  // PFC sizing state
  const [pfcActiveP, setPfcActiveP] = useState<number>(75); // 75 kW
  const [initPf, setInitPf] = useState<number>(0.74);
  const [targetPf, setTargetPf] = useState<number>(0.96);
  const [voltage, setVoltage] = useState<number>(400);
  const [frequency, setFrequency] = useState<number>(50);
  const [circuitType, setCircuitType] = useState<'single-phase' | 'three-phase'>('three-phase');

  // Savings state
  const [feederCurrent, setFeederCurrent] = useState<number>(140);
  const [cableResistance, setCableResistance] = useState<number>(0.08);
  const [operatingHours, setOperatingHours] = useState<number>(3500);
  const [kwhRate, setKwhRate] = useState<number>(0.16);

  const calcResult = calculatePowerFactor({ activePowerW: activeP, apparentPowerVa: apparentS });

  const pfcResult = calculatePfcCapacitor({
    activePowerW: pfcActiveP * 1000,
    initialPf: initPf,
    targetPf: targetPf,
    voltageV: voltage,
    frequencyHz: frequency,
    circuitType,
  });

  const savingsResult = calculatePfcSavings({
    activePowerW: pfcActiveP * 1000,
    initialPf: initPf,
    targetPf: targetPf,
    voltageV: voltage,
    circuitType,
    feederResistanceOhms: cableResistance,
    operatingHoursPerYear: operatingHours,
    electricityTariffPerKwh: kwhRate,
  });

  return (
    <div className="space-y-6" id="power-factor-tool-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Power Factor Engineering & PFC</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              THEORETICAL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Determine displacement power factor (cos φ), size capacitor banks (kVAR & µF), and quantify I²R loss and transformer capacity savings.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('correction')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'correction'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          PFC Capacitor Sizing
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'savings'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Feeder & Loss Savings
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'calculator'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Gauge className="w-4 h-4" />
          PF & Quadrature Calculator
        </button>
      </div>

      {/* Tab: PFC Capacitor Sizing */}
      {activeTab === 'correction' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Facility Parameters</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Total Active Real Load (kW)</label>
                <input
                  type="number"
                  value={pfcActiveP}
                  onChange={e => setPfcActiveP(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Circuit Type</label>
                  <select
                    value={circuitType}
                    onChange={e => setCircuitType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  >
                    <option value="three-phase">3-Phase (400V / 480V)</option>
                    <option value="single-phase">1-Phase (230V / 120V)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Mains Voltage (V)</label>
                  <input
                    type="number"
                    value={voltage}
                    onChange={e => setVoltage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Initial Power Factor: {initPf.toFixed(2)}</span>
                  <span className="text-amber-500 font-semibold">{initPf < 0.85 ? 'Low (Penalized)' : 'Fair'}</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.95"
                  step="0.01"
                  value={initPf}
                  onChange={e => setInitPf(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Target Power Factor: {targetPf.toFixed(2)}</span>
                  <span className="text-emerald-500 font-semibold">{targetPf >= 0.95 ? 'Optimal (No Penalty)' : 'Adequate'}</span>
                </div>
                <input
                  type="range"
                  min={initPf}
                  max="1.0"
                  step="0.01"
                  value={targetPf}
                  onChange={e => setTargetPf(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Required Capacitor Bank Rating</span>
              <div className="text-4xl font-extrabold text-foreground">{pfcResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Formula: Q_c = P × [ tan(arccos(PF₁)) - tan(arccos(PF₂)) ]
              </p>

              {/* Before vs After comparison bar */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Apparent Demand Before Correction</span>
                  <span className="font-semibold text-foreground">{pfcResult.additionalOutputs?.initialApparentPower?.value}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Apparent Demand After Correction</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{pfcResult.additionalOutputs?.targetApparentPower?.value}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(initPf / targetPf) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Required Capacitance</span>
                  <span className="text-sm font-bold text-foreground">{pfcResult.additionalOutputs?.requiredCapacitance?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Mains Current Reduction</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {pfcResult.additionalOutputs?.currentReduction?.value}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Savings */}
      {activeTab === 'savings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Feeder & Financial Inputs</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Feeder Loop Resistance (Ω)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cableResistance}
                  onChange={e => setCableResistance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Annual Operating Hours</label>
                <input
                  type="number"
                  value={operatingHours}
                  onChange={e => setOperatingHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">8,760 h = 24/7 continuous; 4,000 h = 2 shifts</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tariff Rate ($ / kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={kwhRate}
                  onChange={e => setKwhRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cable Thermal I²R Loss Reduction</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {savingsResult.additionalOutputs?.cableLossReductionPercent?.value} less heat
                </span>
              </div>
              <div className="text-3xl font-extrabold text-foreground">{savingsResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Because line current dropped from {savingsResult.additionalOutputs?.initialCurrent?.value} to {savingsResult.additionalOutputs?.improvedCurrent?.value}, transmission thermal waste is slashed.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-xs text-muted-foreground block">Annual Energy Saved</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {savingsResult.additionalOutputs?.annualEnergySavedKwh?.value}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-xs text-muted-foreground block">Transformer kVA Capacity Freed</span>
                  <span className="text-base font-bold text-foreground">
                    {savingsResult.additionalOutputs?.kvaCapacityReleased?.value}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PF Calculator */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Input Readings</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Active Power (Watts)</label>
                <input
                  type="number"
                  value={activeP}
                  onChange={e => setActiveP(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Apparent Power (Volt-Amperes)</label>
                <input
                  type="number"
                  value={apparentS}
                  onChange={e => setApparentS(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Calculated Power Factor</span>
              <div className="text-4xl font-extrabold text-foreground">{calcResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Displacement Phase Angle: {calcResult.additionalOutputs?.phaseAngle?.value}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Quadrature Reactive Power (Q)</span>
                  <span className="text-sm font-semibold text-foreground">{calcResult.additionalOutputs?.reactivePower?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Efficiency Status</span>
                  <span className="text-sm font-semibold text-foreground">{calcResult.additionalOutputs?.rating?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
