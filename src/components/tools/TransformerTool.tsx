import React, { useState } from 'react';
import { Layers, Activity, Zap, Cpu, Gauge } from 'lucide-react';
import {
  calculateTransformerRatio,
  calculateTransformerLoading,
  calculateTransformerEfficiency,
  calculateTransformerRegulation,
} from '../../engines/electrical/transformers';

export const TransformerTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'ratio' | 'loading' | 'losses' | 'regulation'>('ratio');

  // Turns ratio state
  const [vPrimary, setVPrimary] = useState<number>(400);
  const [vSecondary, setVSecondary] = useState<number>(230);
  const [nPrimary, setNPrimary] = useState<number>(800);
  const [iSecondary, setISecondary] = useState<number>(10);

  // Loading state
  const [ratingKva, setRatingKva] = useState<number>(50); // 50 kVA
  const [secVoltageV, setSecVoltageV] = useState<number>(400);
  const [loadCurrentA, setLoadCurrentA] = useState<number>(60);
  const [phaseConfig, setPhaseConfig] = useState<'single-phase' | 'three-phase'>('three-phase');

  // Losses & Efficiency state
  const [coreLossW, setCoreLossW] = useState<number>(280);
  const [fullLoadCuLossW, setFullLoadCuLossW] = useState<number>(1200);
  const [operatingLoadFrac, setOperatingLoadFrac] = useState<number>(0.75);
  const [opPf, setOpPf] = useState<number>(0.85);

  // Voltage regulation state
  const [vNoLoad, setVNoLoad] = useState<number>(240);
  const [vFullLoad, setVFullLoad] = useState<number>(230);

  const ratioResult = calculateTransformerRatio({
    primaryVoltageV: vPrimary,
    secondaryVoltageV: vSecondary,
    primaryTurns: nPrimary,
    secondaryCurrentA: iSecondary,
  });

  const loadingResult = calculateTransformerLoading({
    ratedKva: ratingKva,
    secondaryVoltageV: secVoltageV,
    loadCurrentA: loadCurrentA,
    circuitType: phaseConfig,
  });

  const effResult = calculateTransformerEfficiency({
    ratedKva: ratingKva,
    coreLossWatts: coreLossW,
    fullLoadCopperLossWatts: fullLoadCuLossW,
    loadFraction: operatingLoadFrac,
    powerFactor: opPf,
  });

  const regResult = calculateTransformerRegulation({
    vNoLoad: vNoLoad,
    vFullLoad: vFullLoad,
  });

  return (
    <div className="space-y-6" id="transformer-tool-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Transformer Engineering</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              THEORETICAL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Turns ratio (N₁/N₂), primary/secondary currents, kVA loading %, core vs copper losses, efficiency curves, and voltage regulation (%VR).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('ratio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ratio'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Layers className="w-4 h-4" />
          Turns Ratio & Currents
        </button>
        <button
          onClick={() => setActiveTab('loading')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'loading'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Activity className="w-4 h-4" />
          Capacity & Loading %
        </button>
        <button
          onClick={() => setActiveTab('losses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'losses'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Efficiency & Dual Losses
        </button>
        <button
          onClick={() => setActiveTab('regulation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'regulation'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Gauge className="w-4 h-4" />
          Voltage Regulation (%VR)
        </button>
      </div>

      {/* Tab 1: Ratio */}
      {activeTab === 'ratio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Winding Parameters</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Primary Voltage V₁ (V)</label>
                <input
                  type="number"
                  value={vPrimary}
                  onChange={e => setVPrimary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Secondary Voltage V₂ (V)</label>
                <input
                  type="number"
                  value={vSecondary}
                  onChange={e => setVSecondary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Primary Turns N₁</label>
                <input
                  type="number"
                  value={nPrimary}
                  onChange={e => setNPrimary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Secondary Load Current I₂ (A)</label>
                <input
                  type="number"
                  value={iSecondary}
                  onChange={e => setISecondary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {/* Visual Transformer Schematic */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transformer Circuit Model</span>
                <span className="text-xs font-mono font-bold text-primary">{ratioResult.additionalOutputs?.transformerType?.value}</span>
              </div>

              <div className="flex justify-center p-3 bg-muted/20 rounded-lg border border-border/50">
                <svg viewBox="0 0 320 120" className="w-full max-w-sm h-32">
                  {/* Primary Coil */}
                  <path d="M 40,20 C 60,20 60,35 40,35 C 60,35 60,50 40,50 C 60,50 60,65 40,65 C 60,65 60,80 40,80 C 60,80 60,95 40,95" fill="none" stroke="#6366f1" strokeWidth="3" />
                  <text x="35" y="112" fill="#6366f1" fontSize="10" textAnchor="middle" fontWeight="bold">N₁ = {nPrimary}</text>

                  {/* Laminated Iron Core */}
                  <line x1="140" y1="15" x2="140" y2="100" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" />
                  <line x1="150" y1="15" x2="150" y2="100" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" />
                  <text x="145" y="112" fill="currentColor" fontSize="9" textAnchor="middle" opacity="0.6">Magnetic Core</text>

                  {/* Secondary Coil */}
                  <path d="M 250,20 C 230,20 230,40 250,40 C 230,40 230,60 250,60 C 230,60 230,80 250,80 C 230,80 230,100 250,100" fill="none" stroke="#10b981" strokeWidth="3" />
                  <text x="255" y="112" fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="bold">N₂ = {ratioResult.additionalOutputs?.secondaryTurns?.value}</text>
                </svg>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase block">Turns Ratio</span>
                  <span className="text-sm font-bold text-foreground">{ratioResult.formattedValue}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase block">Secondary Turns</span>
                  <span className="text-sm font-bold text-foreground">{ratioResult.additionalOutputs?.secondaryTurns?.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase block">Primary Current</span>
                  <span className="text-sm font-bold text-foreground">{ratioResult.additionalOutputs?.primaryCurrent?.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase block">Volts Per Turn</span>
                  <span className="text-sm font-bold text-foreground">{ratioResult.additionalOutputs?.voltsPerTurn?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Loading */}
      {activeTab === 'loading' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Transformer Specs</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Configuration</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPhaseConfig('three-phase')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      phaseConfig === 'three-phase' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                    }`}
                  >
                    3-Phase (400V / 480V)
                  </button>
                  <button
                    onClick={() => setPhaseConfig('single-phase')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      phaseConfig === 'single-phase' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                    }`}
                  >
                    Single Phase
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nameplate Rated Capacity (kVA)</label>
                <input
                  type="number"
                  value={ratingKva}
                  onChange={e => setRatingKva(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Secondary Voltage (V)</label>
                <input
                  type="number"
                  value={secVoltageV}
                  onChange={e => setSecVoltageV(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Operating Secondary Current (A)</label>
                <input
                  type="number"
                  value={loadCurrentA}
                  onChange={e => setLoadCurrentA(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Transformer Utilization</span>
              <div className="text-4xl font-extrabold text-foreground">{loadingResult.formattedValue}</div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Load Utilization</span>
                  <span className="font-semibold text-foreground">{loadingResult.additionalOutputs?.loadPercentage?.value}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loadingResult.primaryValue > 100 ? 'bg-red-500' : loadingResult.primaryValue > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(loadingResult.primaryValue, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Full-Load Secondary Rating</span>
                  <span className="text-sm font-bold text-foreground">{loadingResult.additionalOutputs?.ratedSecondaryCurrent?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Operating Demand</span>
                  <span className="text-sm font-bold text-foreground">{loadingResult.additionalOutputs?.operatingKva?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Losses & Efficiency */}
      {activeTab === 'losses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Loss Test Parameters</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">No-Load Iron / Core Loss (W)</label>
                <input
                  type="number"
                  value={coreLossW}
                  onChange={e => setCoreLossW(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                <span className="text-[11px] text-muted-foreground">Constant loss independent of load</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Full-Load Copper Loss (W)</label>
                <input
                  type="number"
                  value={fullLoadCuLossW}
                  onChange={e => setFullLoadCuLossW(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                <span className="text-[11px] text-muted-foreground">I²R winding loss at 100% load</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Operating Load Fraction: {(operatingLoadFrac * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={operatingLoadFrac}
                  onChange={e => setOperatingLoadFrac(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Operating Power Factor: {opPf.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={opPf}
                  onChange={e => setOpPf(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Calculated Operating Efficiency</span>
              <div className="text-4xl font-extrabold text-foreground">{effResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Optimal Peak Efficiency occurs at {effResult.additionalOutputs?.maxEfficiencyLoad?.value}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Core Loss (P_core)</span>
                  <span className="text-sm font-semibold text-foreground">{effResult.additionalOutputs?.coreLoss?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Actual Copper Loss (x² × P_cu)</span>
                  <span className="text-sm font-semibold text-foreground">{effResult.additionalOutputs?.copperLoss?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Regulation */}
      {activeTab === 'regulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Secondary Terminal Voltages</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">No-Load Secondary Voltage V_NL (V)</label>
                <input
                  type="number"
                  value={vNoLoad}
                  onChange={e => setVNoLoad(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Full-Load Secondary Voltage V_FL (V)</label>
                <input
                  type="number"
                  value={vFullLoad}
                  onChange={e => setVFullLoad(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-border bg-card space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Voltage Regulation Percentage (%VR)</span>
              <div className="text-4xl font-extrabold text-foreground">{regResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Formula: %VR = [(V_NL - V_FL) / V_FL] × 100%
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-xs text-muted-foreground block">Voltage Drop on Load</span>
                  <span className="text-sm font-bold text-foreground">{regResult.additionalOutputs?.voltageDrop?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                  <span className="text-xs text-muted-foreground block">Quality Assessment</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{regResult.additionalOutputs?.assessment?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
