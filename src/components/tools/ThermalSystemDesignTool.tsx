import React, { useState, useMemo } from 'react';
import {
  calculateSystemThermalBudget,
  calculateJunctionToAmbientChain,
  calculateHeatSinkRequirement,
  calculateEnclosureThermalBudget,
  analyzeWorstCaseThermal,
  generateThermalDesignSummary,
  HeatSourceItem,
} from '../../engines/design/thermal-workflows';
import { ResultCard } from '../common/ResultCard';
import { Thermometer, Flame, Box, ShieldAlert, Cpu } from 'lucide-react';

export function ThermalSystemDesignTool() {
  const [activeTab, setActiveTab] = useState<'budget' | 'chain' | 'heatsink' | 'enclosure' | 'worst_case'>('budget');

  // Heat budget state
  const [sources, setSources] = useState<HeatSourceItem[]>([
    { id: '1', name: 'Main Power MOSFET', category: 'semiconductor', dissipationWatts: 8.5 },
    { id: '2', name: 'Buck Inductor DCR', category: 'converter', dissipationWatts: 2.2 },
    { id: '3', name: 'Microcontroller (MCU)', category: 'semiconductor', dissipationWatts: 1.5 },
    { id: '4', name: 'Current Shunt Resistors', category: 'resistor', dissipationWatts: 0.8 },
  ]);

  // Thermal chain state
  const [pDiss, setPDiss] = useState<number>(12.0);
  const [tAmb, setTAmb] = useState<number>(35.0);
  const [rJc, setRJc] = useState<number>(1.2);
  const [rCs, setRCs] = useState<number>(0.5);
  const [rSa, setRSa] = useState<number>(3.8);
  const [maxTj, setMaxTj] = useState<number>(125.0);

  // Enclosure state
  const [encHeatW, setEncHeatW] = useState<number>(25.0);
  const [encAreaM2, setEncAreaM2] = useState<number>(0.25);
  const [encU, setEncU] = useState<number>(5.5);

  // Calculations
  const budgetRes = useMemo(() => {
    try {
      return calculateSystemThermalBudget(sources);
    } catch {
      return null;
    }
  }, [sources]);

  const chainRes = useMemo(() => {
    try {
      return calculateJunctionToAmbientChain({
        powerWatts: pDiss,
        ambientTempC: tAmb,
        rThetaJc: rJc,
        rThetaCs: rCs,
        rThetaSa: rSa,
        maxJunctionTempC: maxTj,
      });
    } catch {
      return null;
    }
  }, [pDiss, tAmb, rJc, rCs, rSa, maxTj]);

  const sinkRes = useMemo(() => {
    try {
      return calculateHeatSinkRequirement(pDiss, tAmb, maxTj, rJc, rCs);
    } catch {
      return null;
    }
  }, [pDiss, tAmb, maxTj, rJc, rCs]);

  const encRes = useMemo(() => {
    try {
      return calculateEnclosureThermalBudget(encHeatW, encAreaM2, encU, tAmb);
    } catch {
      return null;
    }
  }, [encHeatW, encAreaM2, encU, tAmb]);

  const worstCaseRes = useMemo(() => {
    try {
      return analyzeWorstCaseThermal({
        maxAmbientTempC: tAmb + 15,
        maxOperatingPowerWatts: pDiss * 1.2,
        rThetaJaMax: (rJc + rCs + rSa) * 1.1,
        maxJunctionTempC: maxTj,
      });
    } catch {
      return null;
    }
  }, [tAmb, pDiss, rJc, rCs, rSa, maxTj]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Thermal System Design & Budgeting</h2>
            <p className="text-sm text-muted-foreground">
              Junction-to-ambient thermal resistance chains, heatsink sizing, enclosure temperature rise, and worst-case thermal margins
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'budget' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Thermal Budget</span>
        </button>
        <button
          onClick={() => setActiveTab('chain')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'chain' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Thermal Resistance Chain</span>
        </button>
        <button
          onClick={() => setActiveTab('heatsink')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'heatsink' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Thermometer className="w-4 h-4" />
          <span>Heatsink Sizing</span>
        </button>
        <button
          onClick={() => setActiveTab('enclosure')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'enclosure' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Enclosure Budget</span>
        </button>
        <button
          onClick={() => setActiveTab('worst_case')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'worst_case' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Worst-Case Margins</span>
        </button>
      </div>

      {/* Tab 1: Thermal Budget */}
      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Heat Dissipating Components</h3>
            <div className="space-y-2">
              {sources.map((s, idx) => (
                <div key={s.id} className="grid grid-cols-3 gap-2 items-center text-xs">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={s.dissipationWatts}
                    onChange={(e) => {
                      const next = [...sources];
                      next[idx].dissipationWatts = parseFloat(e.target.value) || 0;
                      setSources(next);
                    }}
                    className="px-2 py-1 rounded border border-input bg-background"
                  />
                  <span className="text-muted-foreground font-mono">{s.dissipationWatts} W</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="System Thermal Heat Dissipation"
              value={`${budgetRes?.totalHeatDissipatedWatts ?? 0} Watts`}
              subtitle={`Semiconductor Heat: ${budgetRes?.categoryTotals['semiconductor'] ?? 0} W | Converter Heat: ${budgetRes?.categoryTotals['converter'] ?? 0} W`}
              status="normal"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Thermal Resistance Chain */}
      {activeTab === 'chain' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">1D Series Resistance Model</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Power Dissipation (W)</label>
                <input
                  type="number"
                  value={pDiss}
                  onChange={(e) => setPDiss(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Ambient Temp Ta (°C)</label>
                <input
                  type="number"
                  value={tAmb}
                  onChange={(e) => setTAmb(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Rθ_JC (°C/W)</label>
                <input
                  type="number"
                  step="0.1"
                  value={rJc}
                  onChange={(e) => setRJc(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Rθ_CS (TIM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={rCs}
                  onChange={(e) => setRCs(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Rθ_SA (Sink)</label>
                <input
                  type="number"
                  step="0.1"
                  value={rSa}
                  onChange={(e) => setRSa(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Calculated Junction Temperature Tj"
              value={`${chainRes?.junctionTempC ?? 0} °C`}
              subtitle={`Total Rθ_JA: ${chainRes?.rThetaTotal ?? 0} °C/W | Headroom: ${chainRes?.thermalMargin.marginAbsolute ?? 0} °C`}
              status={chainRes?.thermalMargin.isSatisfied ? 'normal' : 'danger'}
            />
            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Sink Temperature Ts</span>
                <span className="font-semibold text-foreground">{chainRes?.sinkTempC} °C</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Case Temperature Tc</span>
                <span className="font-semibold text-foreground">{chainRes?.caseTempC} °C</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Max Allowable Power at Ta</span>
                <span className="font-semibold text-foreground">{chainRes?.maxPowerWatts} W</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Heatsink Sizing */}
      {activeTab === 'heatsink' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Required Sink Specification</h3>
            <p className="text-xs text-muted-foreground">
              Evaluates the maximum allowable heatsink thermal resistance Rθ_SA to maintain junction temperature below Tj_max.
            </p>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Maximum Allowable Heatsink Resistance"
              value={`${sinkRes?.requiredSinkResistance ?? 0} °C/W`}
              subtitle={sinkRes?.isFeasible ? 'Feasible passive or forced air heatsink' : 'Infeasible with given Rθ_JC and Rθ_CS'}
              status={sinkRes?.isFeasible ? 'normal' : 'danger'}
            />
            {sinkRes?.warningNote && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                {sinkRes.warningNote}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Enclosure Budget */}
      {activeTab === 'enclosure' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Sealed Enclosure Parameters</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Internal Heat (W)</label>
                <input
                  type="number"
                  value={encHeatW}
                  onChange={(e) => setEncHeatW(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Surface Area (m²)</label>
                <input
                  type="number"
                  step="0.05"
                  value={encAreaM2}
                  onChange={(e) => setEncAreaM2(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">U (W/m²K)</label>
                <input
                  type="number"
                  step="0.5"
                  value={encU}
                  onChange={(e) => setEncU(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Internal Enclosure Temperature"
              value={`${encRes?.internalAirTempC ?? 0} °C`}
              subtitle={`Enclosure ΔT Rise: ${encRes?.deltaTempC ?? 0} °C above ${tAmb} °C Ambient`}
              status="normal"
            />
          </div>
        </div>
      )}

      {/* Tab 5: Worst-Case Margins */}
      {activeTab === 'worst_case' && (
        <div className="space-y-4">
          <ResultCard
            title="Worst-Case Operating Junction Temperature"
            value={`${worstCaseRes?.worstCaseJunctionTempC ?? 0} °C`}
            subtitle={`Worst-Case Margin: ${worstCaseRes?.thermalMargin.marginAbsolute ?? 0} °C (${worstCaseRes?.thermalMargin.statusText})`}
            status={worstCaseRes?.thermalMargin.isSatisfied ? 'normal' : 'danger'}
          />
          {worstCaseRes?.warnings.map((w) => (
            <div key={w.id} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
              {w.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
