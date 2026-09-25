import React, { useState } from 'react';
import { Activity, Zap, Compass, Plus, Trash2 } from 'lucide-react';
import {
  calculateSinglePhaseCurrent,
  calculatePowerTriangle,
  calculateAcLoadSchedule,
  AcLoadItem,
} from '../../engines/electrical/ac-single-phase';

export const AcSinglePhaseTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'triangle' | 'schedule'>('triangle');

  // Single phase current state
  const [currentMode, setCurrentMode] = useState<'real-power' | 'apparent-power'>('real-power');
  const [voltage, setVoltage] = useState<number>(230);
  const [powerInput, setPowerInput] = useState<number>(2300);
  const [pfInput, setPfInput] = useState<number>(0.9);

  // Power triangle state
  const [triActiveP, setTriActiveP] = useState<number>(3000);
  const [triPf, setTriPf] = useState<number>(0.82);
  const [triPfType, setTriPfType] = useState<'lagging' | 'leading'>('lagging');

  // AC Schedule state
  const [acLoads, setAcLoads] = useState<AcLoadItem[]>([
    { id: '1', name: 'Workshop Induction Motor', voltage: 230, powerWatts: 1500, powerFactor: 0.8, pfType: 'lagging', quantity: 1, hoursPerDay: 4 },
    { id: '2', name: 'LED Highbay Lighting', voltage: 230, powerWatts: 400, powerFactor: 0.95, pfType: 'leading', quantity: 1, hoursPerDay: 10 },
    { id: '3', name: 'Resistive Space Heater', voltage: 230, powerWatts: 2000, powerFactor: 1.0, pfType: 'lagging', quantity: 1, hoursPerDay: 3 },
  ]);

  const currentResult = calculateSinglePhaseCurrent({
    mode: currentMode,
    voltageRms: voltage,
    powerValue: powerInput,
    powerFactor: pfInput,
  });

  const triangleResult = calculatePowerTriangle({
    activePowerW: triActiveP,
    powerFactor: triPf,
    pfType: triPfType,
  });

  const scheduleResult = calculateAcLoadSchedule(acLoads, voltage);

  const addAcLoad = () => {
    setAcLoads([
      ...acLoads,
      {
        id: Date.now().toString(),
        name: 'New AC Branch Load',
        voltage: 230,
        powerWatts: 500,
        powerFactor: 0.85,
        pfType: 'lagging',
        quantity: 1,
        hoursPerDay: 5,
      },
    ]);
  };

  const updateAcLoad = (id: string, field: keyof AcLoadItem, val: any) => {
    setAcLoads(acLoads.map(item => (item.id === id ? { ...item, [field]: val } : item)));
  };

  const removeAcLoad = (id: string) => {
    if (acLoads.length <= 1) return;
    setAcLoads(acLoads.filter(item => item.id !== id));
  };

  // Interactive Power Triangle SVG rendering parameters
  const P_val = triActiveP;
  const Q_val = triangleResult.visualData?.Q || 0;
  const S_val = triangleResult.visualData?.S || 1;
  const phiDeg = triangleResult.visualData?.phiDeg || 0;

  // Normalized dimensions for SVG canvas (width 320, height 180)
  const maxDim = Math.max(P_val, Math.abs(Q_val), 1);
  const scale = 140 / maxDim;
  const originX = 40;
  const originY = triPfType === 'lagging' ? 140 : 40;
  const cornerX = originX + P_val * scale;
  const cornerY = originY;
  const hypEndY = originY + (triPfType === 'lagging' ? -Math.abs(Q_val) * scale : Math.abs(Q_val) * scale);

  return (
    <div className="space-y-6" id="ac-single-phase-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Single-Phase AC Power & Triangle</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              THEORETICAL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            AC line current, apparent power (S), reactive power (Q), phase angle (φ), and vector load schedule addition.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('triangle')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'triangle'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Compass className="w-4 h-4" />
          Power Triangle (P, Q, S)
        </button>
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'current'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Zap className="w-4 h-4" />
          Single-Phase Current (I = P / V·PF)
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'schedule'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Activity className="w-4 h-4" />
          Vector AC Load Aggregator
        </button>
      </div>

      {/* Tab 1: Power Triangle */}
      {activeTab === 'triangle' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Triangle Parameters</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Active Real Power P (Watts)</label>
                <input
                  type="number"
                  value={triActiveP}
                  onChange={e => setTriActiveP(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-muted-foreground">Power Factor (cos φ): {triPf.toFixed(2)}</label>
                  <span className="text-xs font-semibold text-primary">{phiDeg.toFixed(1)}° phase</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.01"
                  value={triPf}
                  onChange={e => setTriPf(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Phase Displacement Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTriPfType('lagging')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      triPfType === 'lagging'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    Lagging (Inductive Motors)
                  </button>
                  <button
                    onClick={() => setTriPfType('leading')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      triPfType === 'leading'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    Leading (Capacitive)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {/* Visual SVG Power Triangle */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phasor Power Triangle</span>
                <span className="text-xs font-mono font-bold text-foreground">S = {triangleResult.formattedValue}</span>
              </div>

              <div className="flex justify-center p-2 bg-muted/20 rounded-lg border border-border/50">
                <svg viewBox="0 0 340 180" className="w-full max-w-sm h-48">
                  {/* Grid lines */}
                  <line x1="20" y1={originY} x2="320" y2={originY} stroke="currentColor" strokeOpacity="0.15" strokeDasharray="3,3" />

                  {/* Adjacent side: Real Power P */}
                  <line
                    x1={originX}
                    y1={originY}
                    x2={cornerX}
                    y2={cornerY}
                    stroke="#10b981"
                    strokeWidth="3"
                  />
                  <text x={(originX + cornerX) / 2} y={originY + (triPfType === 'lagging' ? 18 : -8)} fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
                    P = {triActiveP} W
                  </text>

                  {/* Opposite side: Reactive Power Q */}
                  <line
                    x1={cornerX}
                    y1={cornerY}
                    x2={cornerX}
                    y2={hypEndY}
                    stroke="#f59e0b"
                    strokeWidth="3"
                  />
                  <text x={cornerX + 8} y={(cornerY + hypEndY) / 2} fill="#f59e0b" fontSize="11" fontWeight="bold" dominantBaseline="middle">
                    Q = {Math.abs(Math.round(triangleResult.visualData?.Q || 0))} VAR
                  </text>

                  {/* Hypotenuse: Apparent Power S */}
                  <line
                    x1={originX}
                    y1={originY}
                    x2={cornerX}
                    y2={hypEndY}
                    stroke="#6366f1"
                    strokeWidth="3.5"
                  />
                  <text x={(originX + cornerX) / 2 - 12} y={(originY + hypEndY) / 2 - 8} fill="#6366f1" fontSize="11" fontWeight="bold" textAnchor="end">
                    S = {Math.round(S_val)} VA
                  </text>

                  {/* Origin Angle arc */}
                  <circle cx={originX} cy={originY} r="4" fill="currentColor" />
                </svg>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase block">Active Power (P)</span>
                  <span className="text-sm font-bold text-foreground">{triangleResult.additionalOutputs?.activePower?.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase block">Reactive Power (Q)</span>
                  <span className="text-sm font-bold text-foreground">{triangleResult.additionalOutputs?.reactivePower?.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase block">Apparent Power (S)</span>
                  <span className="text-sm font-bold text-foreground">{triangleResult.formattedValue}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/60 border border-border">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Phase Angle (φ)</span>
                  <span className="text-sm font-bold text-foreground">{triangleResult.additionalOutputs?.phaseAngle?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Single Phase Current */}
      {activeTab === 'current' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Calculation Inputs</h3>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Input Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCurrentMode('real-power')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      currentMode === 'real-power'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    Real Power (Watts)
                  </button>
                  <button
                    onClick={() => setCurrentMode('apparent-power')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      currentMode === 'apparent-power'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    Apparent Power (VA)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {currentMode === 'real-power' ? 'Active Power P (W)' : 'Apparent Power S (VA)'}
                </label>
                <input
                  type="number"
                  value={powerInput}
                  onChange={e => setPowerInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">RMS Voltage (V)</label>
                <input
                  type="number"
                  value={voltage}
                  onChange={e => setVoltage(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>

              {currentMode === 'real-power' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Power Factor (0.1 to 1.0)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1.0"
                    value={pfInput}
                    onChange={e => setPfInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Calculated Line Current</span>
              <div className="text-4xl font-extrabold text-foreground">{currentResult.formattedValue}</div>
              <p className="text-xs text-muted-foreground">
                Formula: {currentMode === 'real-power' ? 'I = P / (V × PF)' : 'I = S / V'}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Real Active Power</span>
                  <span className="text-sm font-semibold text-foreground">{currentResult.additionalOutputs?.activePower?.value}</span>
                </div>
                <div className="p-3 rounded-lg bg-card/80 border border-border">
                  <span className="text-xs text-muted-foreground block">Apparent Power (S)</span>
                  <span className="text-sm font-semibold text-foreground">{currentResult.additionalOutputs?.apparentPower?.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AC Schedule (Vector Addition) */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Single-Phase AC Branch Schedule (Vector Sum)</h3>
              <p className="text-xs text-muted-foreground">
                Accurately sums active watts and reactive VARs in quadrature (Pythagorean vector addition).
              </p>
            </div>
            <button
              onClick={addAcLoad}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" />
              Add AC Branch
            </button>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Circuit / Load</th>
                  <th className="p-3">Watts</th>
                  <th className="p-3">PF</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {acLoads.map(item => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateAcLoad(item.id, 'name', e.target.value)}
                        className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-full max-w-[160px]"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={item.powerWatts}
                        onChange={e => updateAcLoad(item.id, 'powerWatts', Number(e.target.value))}
                        className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-20"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="1.0"
                        value={item.powerFactor}
                        onChange={e => updateAcLoad(item.id, 'powerFactor', Number(e.target.value))}
                        className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-16"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={item.pfType}
                        onChange={e => updateAcLoad(item.id, 'pfType', e.target.value as any)}
                        className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs"
                      >
                        <option value="lagging">Lagging</option>
                        <option value="leading">Leading</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateAcLoad(item.id, 'quantity', Number(e.target.value))}
                        className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-14"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={item.hoursPerDay}
                        onChange={e => updateAcLoad(item.id, 'hoursPerDay', Number(e.target.value))}
                        className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-14"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => removeAcLoad(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40 border border-border">
            <div>
              <span className="text-[11px] text-muted-foreground block">Vector Apparent Power</span>
              <span className="text-base font-bold text-foreground">{scheduleResult.additionalOutputs?.totalApparentPower?.value}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Net Power Factor</span>
              <span className="text-base font-bold text-foreground">{scheduleResult.additionalOutputs?.systemPowerFactor?.value}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Total Mains Current</span>
              <span className="text-base font-bold text-foreground">{scheduleResult.additionalOutputs?.totalMainsCurrent?.value}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Daily Energy</span>
              <span className="text-base font-bold text-foreground">{scheduleResult.additionalOutputs?.dailyEnergy?.value}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
