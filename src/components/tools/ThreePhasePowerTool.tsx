import React, { useState } from 'react';
import { Layers, Activity, GitBranch, Cpu, AlertTriangle } from 'lucide-react';
import {
  calculateThreePhasePower,
  calculateStarDeltaRelationships,
  calculateThreePhasePfc,
} from '../../engines/electrical/three-phase';

export const ThreePhasePowerTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'power' | 'stardelta' | 'pfc'>('power');

  // 3-phase power state
  const [lineVoltage, setLineVoltage] = useState<number>(400);
  const [lineCurrent, setLineCurrent] = useState<number>(25);
  const [powerFactor, setPowerFactor] = useState<number>(0.85);
  const [pfType, setPfType] = useState<'lagging' | 'leading'>('lagging');

  // Star-Delta converter state
  const [sdMode, setSdMode] = useState<'star' | 'delta'>('star');
  const [sdVoltage, setSdVoltage] = useState<number>(400);
  const [sdCurrent, setSdCurrent] = useState<number>(30);

  // 3-Phase PFC state
  const [pfcPowerKw, setPfcPowerKw] = useState<number>(50);
  const [initialPf, setInitialPf] = useState<number>(0.78);
  const [targetPf, setTargetPf] = useState<number>(0.96);
  const [freq, setFreq] = useState<number>(50);

  const powerResult = calculateThreePhasePower({
    lineVoltageV: lineVoltage,
    lineCurrentA: lineCurrent,
    powerFactor,
    pfType,
    frequencyHz: freq,
  });

  const starDeltaResult = calculateStarDeltaRelationships({
    mode: sdMode,
    lineVoltageV: sdVoltage,
    lineCurrentA: sdCurrent,
  });

  const pfcResult = calculateThreePhasePfc({
    activePowerKw: pfcPowerKw,
    initialPf,
    targetPf,
    lineVoltageV: lineVoltage,
    frequencyHz: freq,
  });

  return (
    <div className="space-y-6" id="three-phase-power-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Three-Phase Electrical Systems</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              THEORETICAL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Balanced three-phase power (P = √3·V_L·I_L·PF), Star (Wye) vs Delta relationships, and 3-phase capacitor bank sizing.
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
          <Activity className="w-4 h-4" />
          3-Phase Power (P, Q, S)
        </button>
        <button
          onClick={() => setActiveTab('stardelta')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'stardelta'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Star (Y) ↔ Delta (Δ) Converter
        </button>
        <button
          onClick={() => setActiveTab('pfc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'pfc'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Cpu className="w-4 h-4" />
          3-Phase Power Factor Correction
        </button>
      </div>

      {/* Tab 1: 3-Phase Power */}
      {activeTab === 'power' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">System Parameters</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Line-to-Line Voltage V_LL (V)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={lineVoltage}
                    onChange={e => setLineVoltage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                  <span className="flex items-center px-3 rounded-lg bg-muted text-xs font-medium">V_rms</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => setLineVoltage(400)} className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground">
                    400V (EU / IEC)
                  </button>
                  <button onClick={() => setLineVoltage(208)} className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground">
                    208V (US Comm.)
                  </button>
                  <button onClick={() => setLineVoltage(480)} className="text-[11px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground">
                    480V (US Ind.)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Line Current I_L (Amperes)</label>
                <input
                  type="number"
                  value={lineCurrent}
                  onChange={e => setLineCurrent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Power Factor (cos φ): {powerFactor.toFixed(2)}</span>
                  <span className="text-primary font-semibold">{pfType.toUpperCase()}</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.01"
                  value={powerFactor}
                  onChange={e => setPowerFactor(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Phase Displacement</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPfType('lagging')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      pfType === 'lagging'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background text-foreground'
                    }`}
                  >
                    Lagging (Inductive)
                  </button>
                  <button
                    onClick={() => setPfType('leading')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      pfType === 'leading'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background text-foreground'
                    }`}
                  >
                    Leading (Capacitive)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">3-Phase Active Power (Real Work)</span>
              <div className="text-4xl font-extrabold text-foreground">{powerResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Formula: P = √3 × V_L × I_L × cos(φ)
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Apparent Power (S)</span>
                  <span className="text-sm font-semibold text-foreground">{powerResult.additionalOutputs?.apparentPower?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Reactive Power (Q)</span>
                  <span className="text-sm font-semibold text-foreground">{powerResult.additionalOutputs?.reactivePower?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Phase Voltage (V_LN)</span>
                  <span className="text-sm font-semibold text-foreground">{powerResult.additionalOutputs?.vPhase?.value}</span>
                </div>
              </div>
            </div>

            {/* Step by step */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">3-Phase Phasor Derivation</h4>
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

      {/* Tab 2: Star-Delta */}
      {activeTab === 'stardelta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Topology Configuration</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSdMode('star')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                    sdMode === 'star'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-background text-foreground'
                  }`}
                >
                  Star / Wye (Y)
                </button>
                <button
                  onClick={() => setSdMode('delta')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                    sdMode === 'delta'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-background text-foreground'
                  }`}
                >
                  Delta (Δ)
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Line-to-Line Voltage V_L (V)</label>
                <input
                  type="number"
                  value={sdVoltage}
                  onChange={e => setSdVoltage(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">External Line Current I_L (A)</label>
                <input
                  type="number"
                  value={sdCurrent}
                  onChange={e => setSdCurrent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {sdMode === 'star' ? 'Star (Wye) Characteristics' : 'Delta (Δ) Characteristics'}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  √3 = 1.73205
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground block">Winding Voltage (V_phase)</span>
                  <span className="text-2xl font-bold text-foreground">{starDeltaResult.additionalOutputs?.phaseVoltage?.value}</span>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    {sdMode === 'star' ? 'V_ph = V_L / √3 (Line-to-Neutral)' : 'V_ph = V_L (Full Line Voltage across coil)'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground block">Winding Current (I_phase)</span>
                  <span className="text-2xl font-bold text-foreground">{starDeltaResult.additionalOutputs?.phaseCurrent?.value}</span>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    {sdMode === 'star' ? 'I_ph = I_L (Series with line)' : 'I_ph = I_L / √3 (Split inside Δ loops)'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
                <strong>Practical Engineering Rule:</strong> When starting an induction motor in Star (Y), the starting torque and current are reduced to exactly <strong>1/3 (33.3%)</strong> of their direct-on-line Delta (Δ) values, because V_ph is reduced by 1/√3 and power scales with V².
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 3-Phase PFC */}
      {activeTab === 'pfc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">PFC Bank Parameters</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Load Active Power (kW)</label>
                <input
                  type="number"
                  value={pfcPowerKw}
                  onChange={e => setPfcPowerKw(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Initial Power Factor: {initialPf.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.01"
                  value={initialPf}
                  onChange={e => setInitialPf(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Target Power Factor: {targetPf.toFixed(2)}</label>
                <input
                  type="range"
                  min={initialPf}
                  max="1.0"
                  step="0.01"
                  value={targetPf}
                  onChange={e => setTargetPf(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">System Frequency (Hz)</label>
                <select
                  value={freq}
                  onChange={e => setFreq(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                >
                  <option value={50}>50 Hz (IEC / European Standard)</option>
                  <option value={60}>60 Hz (North American Standard)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Required 3-Phase Reactive Relief</span>
              <div className="text-4xl font-extrabold text-foreground">{pfcResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Formula: Q_c = P × [ tan(arccos(PF₁)) - tan(arccos(PF₂)) ]
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs font-bold text-foreground block mb-1">Delta (Δ) Bank Capacitance</span>
                  <span className="text-base font-bold text-primary">{pfcResult.additionalOutputs?.deltaCapPerPhase?.value}</span>
                  <span className="text-[11px] text-muted-foreground mt-1 block">Industrial standard: lower capacitance needed per phase</span>
                </div>
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs font-bold text-foreground block mb-1">Feeder Current Relief</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {pfcResult.additionalOutputs?.currentReductionPercent?.value} lower current
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Drops from {pfcResult.additionalOutputs?.initialCurrent?.value} down to {pfcResult.additionalOutputs?.improvedCurrent?.value}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
