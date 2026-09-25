import React, { useState } from 'react';
import { RotateCw, Gauge, Zap, Activity, Cpu } from 'lucide-react';
import {
  calculateMotorSpeedSlip,
  calculateMotorPowerTorque,
  calculateMotorCurrent,
} from '../../engines/electrical/motors';

export const ElectricMotorsTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'torque' | 'speed'>('current');

  // Motor Current state
  const [motorCircuit, setMotorCircuit] = useState<'three-phase' | 'single-phase'>('three-phase');
  const [motorPowerKw, setMotorPowerKw] = useState<number>(11); // 11 kW (15 HP)
  const [motorVoltage, setMotorVoltage] = useState<number>(400);
  const [motorEfficiency, setMotorEfficiency] = useState<number>(91.4); // IE3 class
  const [motorPf, setMotorPf] = useState<number>(0.84);

  // Power & Torque state
  const [torqueMode, setTorqueMode] = useState<'from-power' | 'from-torque'>('from-power');
  const [shaftPowerW, setShaftPowerW] = useState<number>(7500); // 7.5 kW
  const [shaftTorqueNm, setShaftTorqueNm] = useState<number>(48.8);
  const [shaftRpm, setShaftRpm] = useState<number>(1465);

  // Speed & Slip state
  const [gridFreq, setGridFreq] = useState<number>(50);
  const [poles, setPoles] = useState<number>(4);
  const [rotorRpm, setRotorRpm] = useState<number>(1440);

  const currentResult = calculateMotorCurrent({
    circuitType: motorCircuit,
    mechanicalPowerWatts: motorPowerKw * 1000,
    voltageV: motorVoltage,
    efficiencyPercent: motorEfficiency,
    powerFactor: motorPf,
  });

  const torqueResult = calculateMotorPowerTorque(
    torqueMode === 'from-power'
      ? { powerWatts: shaftPowerW, speedRpm: shaftRpm }
      : { torqueNm: shaftTorqueNm, speedRpm: shaftRpm }
  );

  const slipResult = calculateMotorSpeedSlip({
    frequencyHz: gridFreq,
    poles,
    rotorSpeedRpm: rotorRpm,
  });

  return (
    <div className="space-y-6" id="electric-motors-tool-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Electric Motors Engineering</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              THEORETICAL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Full-load rated amperes (FLA), starting inrush, shaft torque (T = P/ω), synchronous speed (120f/p), and rotor induction slip.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'current'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Zap className="w-4 h-4" />
          Full-Load Motor Current (FLA)
        </button>
        <button
          onClick={() => setActiveTab('torque')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'torque'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          Power & Shaft Torque
        </button>
        <button
          onClick={() => setActiveTab('speed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'speed'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Gauge className="w-4 h-4" />
          Synchronous Speed & Slip
        </button>
      </div>

      {/* Tab 1: Current */}
      {activeTab === 'current' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Nameplate Data</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Configuration</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMotorCircuit('three-phase');
                      setMotorVoltage(400);
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      motorCircuit === 'three-phase' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                    }`}
                  >
                    3-Phase AC (400V)
                  </button>
                  <button
                    onClick={() => {
                      setMotorCircuit('single-phase');
                      setMotorVoltage(230);
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      motorCircuit === 'single-phase' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                    }`}
                  >
                    Single Phase (230V)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Mechanical Shaft Power (kW)</label>
                <input
                  type="number"
                  value={motorPowerKw}
                  onChange={e => setMotorPowerKw(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
                <span className="text-[11px] text-muted-foreground">Equivalent to {(motorPowerKw / 0.7457).toFixed(1)} Horsepower (HP)</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Rated Voltage (V)</label>
                <input
                  type="number"
                  value={motorVoltage}
                  onChange={e => setMotorVoltage(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Efficiency Class η (%): {motorEfficiency}%</label>
                <input
                  type="range"
                  min="70"
                  max="98"
                  step="0.5"
                  value={motorEfficiency}
                  onChange={e => setMotorEfficiency(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>IE1 Standard (80%)</span>
                  <span>IE3 Premium (91%)</span>
                  <span>IE4 Super (94%)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Full-Load Power Factor: {motorPf.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.6"
                  max="0.95"
                  step="0.01"
                  value={motorPf}
                  onChange={e => setMotorPf(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Full-Load Operating Current (FLA)</span>
              <div className="text-4xl font-extrabold text-foreground">{currentResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Formula: I_FLA = P_mech / [ {motorCircuit === 'three-phase' ? '√3 × V_L' : 'V'} × PF × η ]
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">DOL Starting Inrush (LRA)</span>
                  <span className="text-base font-bold text-amber-500">{currentResult.additionalOutputs?.estimatedInrushCurrent?.value}</span>
                </div>
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Electrical Input Power</span>
                  <span className="text-base font-bold text-foreground">{currentResult.additionalOutputs?.electricalInputPower?.value}</span>
                </div>
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Thermal Heat Dissipation</span>
                  <span className="text-base font-bold text-foreground">{currentResult.additionalOutputs?.thermalLosses?.value}</span>
                </div>
                <div className="p-3.5 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Shaft Mechanical Power</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{currentResult.additionalOutputs?.mechanicalOutputPower?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Torque */}
      {activeTab === 'torque' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Mechanical Kinematics</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTorqueMode('from-power')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                    torqueMode === 'from-power' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                  }`}
                >
                  From Power (W)
                </button>
                <button
                  onClick={() => setTorqueMode('from-torque')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                    torqueMode === 'from-torque' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
                  }`}
                >
                  From Torque (N·m)
                </button>
              </div>

              {torqueMode === 'from-power' ? (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Mechanical Shaft Power (W)</label>
                  <input
                    type="number"
                    value={shaftPowerW}
                    onChange={e => setShaftPowerW(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Shaft Torque (N·m)</label>
                  <input
                    type="number"
                    value={shaftTorqueNm}
                    onChange={e => setShaftTorqueNm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Shaft Rotation Speed (RPM)</label>
                <input
                  type="number"
                  value={shaftRpm}
                  onChange={e => setShaftRpm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">{torqueResult.label}</span>
              <div className="text-4xl font-extrabold text-foreground">{torqueResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Relationship: T = P / ω = (60 × P) / (2π × N) ≈ 9.549 × (P / N)
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Torque in Imperial Units</span>
                  <span className="text-sm font-bold text-foreground">{torqueResult.additionalOutputs?.torqueLbFt?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Angular Velocity (ω)</span>
                  <span className="text-sm font-bold text-foreground">{torqueResult.additionalOutputs?.angularSpeed?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Power in Horsepower</span>
                  <span className="text-sm font-bold text-foreground">{torqueResult.additionalOutputs?.powerHp?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Mechanical Kilowatts</span>
                  <span className="text-sm font-bold text-foreground">{torqueResult.additionalOutputs?.powerKw?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Speed & Slip */}
      {activeTab === 'speed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Rotor & Grid Dynamics</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Mains Frequency (Hz)</label>
                <select
                  value={gridFreq}
                  onChange={e => setGridFreq(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  <option value={50}>50 Hz (50 cycles/sec)</option>
                  <option value={60}>60 Hz (60 cycles/sec)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Magnetic Poles</label>
                <select
                  value={poles}
                  onChange={e => setPoles(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
                >
                  <option value={2}>2 Poles (3000 RPM @ 50Hz / 3600 RPM @ 60Hz)</option>
                  <option value={4}>4 Poles (1500 RPM @ 50Hz / 1800 RPM @ 60Hz)</option>
                  <option value={6}>6 Poles (1000 RPM @ 50Hz / 1200 RPM @ 60Hz)</option>
                  <option value={8}>8 Poles (750 RPM @ 50Hz / 900 RPM @ 60Hz)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Actual Rotor Shaft Speed (RPM)</label>
                <input
                  type="number"
                  value={rotorRpm}
                  onChange={e => setRotorRpm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Synchronous Magnetic Field Speed</span>
              <div className="text-4xl font-extrabold text-foreground">{slipResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Formula: N_s = (120 × f) / Poles
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-xs text-muted-foreground block">Rotor Slip Percentage</span>
                  <span className="text-2xl font-bold text-primary">{slipResult.additionalOutputs?.slipPercent?.value}</span>
                  <span className="text-[11px] text-muted-foreground mt-1 block">s = [(N_s - N_r) / N_s] × 100%</span>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-xs text-muted-foreground block">Induced Rotor Frequency</span>
                  <span className="text-2xl font-bold text-foreground">{slipResult.additionalOutputs?.rotorFrequency?.value}</span>
                  <span className="text-[11px] text-muted-foreground mt-1 block">f_rotor = s × f_mains</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
