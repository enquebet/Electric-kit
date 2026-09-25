import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Zap, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import {
  calculateFuseEstimate,
  evaluateOvercurrentCoordination,
  calculateTransformerFaultCurrent,
  STANDARD_OVERCURRENT_RATINGS,
} from '../../engines/electrical/protection';

export const ElectricalProtectionTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'coordination' | 'fuse' | 'fault'>('coordination');

  // Coordination state: I_B <= I_n <= I_z
  const [designCurrentIb, setDesignCurrentIb] = useState<number>(24);
  const [breakerRatingIn, setBreakerRatingIn] = useState<number>(32);
  const [cableCapacityIz, setCableCapacityIz] = useState<number>(36);

  // Fuse estimate state
  const [fuseLoadA, setFuseLoadA] = useState<number>(18);
  const [loadType, setLoadType] = useState<'resistive' | 'motor-inductive' | 'capacitive-smps'>('motor-inductive');
  const [isContinuous, setIsContinuous] = useState<boolean>(true);

  // Transformer fault current state
  const [txKva, setTxKva] = useState<number>(1000); // 1 MVA
  const [txSecV, setTxSecV] = useState<number>(400);
  const [txZpct, setTxZpct] = useState<number>(5.0); // 5%

  const coordResult = evaluateOvercurrentCoordination({
    designCurrentA: designCurrentIb,
    deviceRatingA: breakerRatingIn,
    conductorAmpacityA: cableCapacityIz,
  });

  const fuseResult = calculateFuseEstimate({
    loadCurrentA: fuseLoadA,
    loadType,
    isContinuousLoad: isContinuous,
  });

  const faultResult = calculateTransformerFaultCurrent({
    transformerKva: txKva,
    secondaryVoltageLineV: txSecV,
    percentImpedance: txZpct,
  });

  const isCoordinated = coordResult.primaryValue === 1;

  return (
    <div className="space-y-6" id="electrical-protection-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Electrical Protection & Fault Analysis</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              STANDARDS-DEPENDENT
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Overcurrent coordination (I_B ≤ I_n ≤ I_z) per IEC 60364-4-43, fuse rating estimation, and transformer prospective short-circuit current (kA).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('coordination')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'coordination'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Overcurrent Coordination (I_B ≤ I_n ≤ I_z)
        </button>
        <button
          onClick={() => setActiveTab('fault')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'fault'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Zap className="w-4 h-4" />
          Transformer Fault Current (kA)
        </button>
        <button
          onClick={() => setActiveTab('fuse')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'fuse'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Flame className="w-4 h-4" />
          Fuse Rating Estimator
        </button>
      </div>

      {/* Tab 1: Coordination */}
      {activeTab === 'coordination' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Circuit Current Trio</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  1. Design Operating Load Current I_B (A)
                </label>
                <input
                  type="number"
                  value={designCurrentIb}
                  onChange={e => setDesignCurrentIb(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                <span className="text-[11px] text-muted-foreground">Normal expected steady-state current</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  2. Protective Device Nominal Rating I_n (A)
                </label>
                <select
                  value={breakerRatingIn}
                  onChange={e => setBreakerRatingIn(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  {STANDARD_OVERCURRENT_RATINGS.map(r => (
                    <option key={r} value={r}>
                      {r} A (Standard Breaker / Fuse)
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground">MCB / MCCB / Fuse nominal trip rating</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  3. Conductor Current-Carrying Capacity I_z (A)
                </label>
                <input
                  type="number"
                  value={cableCapacityIz}
                  onChange={e => setCableCapacityIz(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                <span className="text-[11px] text-muted-foreground">Continuous ampacity after grouping/temperature derating</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className={`p-6 rounded-xl border ${isCoordinated ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'} space-y-4`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coordination Assessment</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isCoordinated ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
                >
                  {coordResult.formattedValue}
                </span>
              </div>

              {/* Visual Inequality Bar: I_B <= I_n <= I_z */}
              <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-around gap-3 text-center">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-medium">Load I_B</span>
                  <span className="text-xl font-extrabold text-foreground">{designCurrentIb} A</span>
                </div>
                <div className="text-sm font-bold text-muted-foreground">
                  {breakerRatingIn >= designCurrentIb ? '≤ (OK)' : '> (TRIP RISK)'}
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-medium">Breaker I_n</span>
                  <span className="text-xl font-extrabold text-primary">{breakerRatingIn} A</span>
                </div>
                <div className="text-sm font-bold text-muted-foreground">
                  {cableCapacityIz >= breakerRatingIn ? '≤ (SAFE)' : '> (FIRE HAZARD)'}
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-medium">Cable I_z</span>
                  <span className="text-xl font-extrabold text-foreground">{cableCapacityIz} A</span>
                </div>
              </div>

              {/* Warnings */}
              {coordResult.warnings?.map((w, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <span className="font-bold block">{w.title}</span>
                    <span>{w.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fault Current */}
      {activeTab === 'fault' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Transformer Data</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Transformer Rating (kVA)</label>
                <input
                  type="number"
                  value={txKva}
                  onChange={e => setTxKva(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Secondary Line Voltage (V)</label>
                <input
                  type="number"
                  value={txSecV}
                  onChange={e => setTxSecV(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Impedance %Z: {txZpct.toFixed(1)}%</label>
                <input
                  type="range"
                  min="2.0"
                  max="10.0"
                  step="0.2"
                  value={txZpct}
                  onChange={e => setTxZpct(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <span className="text-[11px] text-muted-foreground">Standard values: 4.0% (small), 5.0%–6.0% (≥1000 kVA)</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Prospective Short-Circuit Current</span>
              <div className="text-4xl font-extrabold text-foreground">{faultResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Formula: I_sc = I_FL / (%Z / 100) = S_rated / [ √3 × V_L × (%Z / 100) ]
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Secondary Full-Load Current</span>
                  <span className="text-base font-bold text-foreground">{faultResult.additionalOutputs?.fullLoadCurrent?.value}</span>
                </div>
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Switchgear Breaking Capacity Required</span>
                  <span className="text-base font-bold text-red-500">{faultResult.additionalOutputs?.switchgearRequirement?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fuse Estimator */}
      {activeTab === 'fuse' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Load Characterization</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nominal Steady-State Load Current (A)</label>
                <input
                  type="number"
                  value={fuseLoadA}
                  onChange={e => setFuseLoadA(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Load Inrush Characteristic</label>
                <select
                  value={loadType}
                  onChange={e => setLoadType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  <option value="motor-inductive">Motor / Inductive (DOL Inrush, requires slow-blow/aM)</option>
                  <option value="capacitive-smps">Switch-Mode Power Supply / LED Driver (High initial peak)</option>
                  <option value="resistive">Pure Resistive Heater / Incandescent (General purpose gG)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="continuous-chk"
                  checked={isContinuous}
                  onChange={e => setIsContinuous(e.target.checked)}
                  className="rounded border-border accent-primary"
                />
                <label htmlFor="continuous-chk" className="text-xs text-foreground font-medium">
                  Continuous Load (Operates &gt; 3 hours, apply 125% factor)
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Recommended Fuse Nominal Rating</span>
              <div className="text-4xl font-extrabold text-foreground">{fuseResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Characteristic: <strong className="text-foreground">{fuseResult.additionalOutputs?.fuseType?.value}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Continuous Margin Applied</span>
                  <span className="text-sm font-bold text-foreground">{fuseResult.additionalOutputs?.continuousMargin?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Operating Current</span>
                  <span className="text-sm font-bold text-foreground">{fuseResult.additionalOutputs?.loadCurrent?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
