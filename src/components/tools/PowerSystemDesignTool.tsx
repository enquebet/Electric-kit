import React, { useState, useMemo } from 'react';
import {
  calculateDcPowerBudget,
  calculateMultiRailPowerBudget,
  calculateConverterLossChain,
  calculateBatteryToLoadChain,
  analyzePeakVsContinuousPower,
  PowerLoadItem,
  PowerRailDefinition,
  ConverterStage,
} from '../../engines/design/power-workflows';
import { ResultCard } from '../common/ResultCard';
import { Zap, GitBranch, BatteryCharging, Gauge, ArrowRight } from 'lucide-react';

export function PowerSystemDesignTool() {
  const [activeTab, setActiveTab] = useState<'budget' | 'multirail' | 'converter_chain' | 'battery_chain' | 'peak_continuous'>('budget');

  // Budget state
  const [supplyV, setSupplyV] = useState<number>(12);
  const [supplyMaxW, setSupplyMaxW] = useState<number>(60);
  const [loads, setLoads] = useState<PowerLoadItem[]>([
    { id: '1', name: 'Microcontroller & Core', voltageRailVolts: 12, nominalCurrentAmps: 0.8, peakCurrentAmps: 1.5 },
    { id: '2', name: 'Sensor Array', voltageRailVolts: 12, nominalCurrentAmps: 0.4, peakCurrentAmps: 0.6 },
    { id: '3', name: 'RF Transmitter', voltageRailVolts: 12, nominalCurrentAmps: 1.2, peakCurrentAmps: 2.8 },
  ]);

  // Multi-rail state
  const [rails] = useState<PowerRailDefinition[]>([
    { railId: '12V', voltageVolts: 12, maxCurrentCapacityAmps: 5.0, converterEfficiencyPercent: 95 },
    { railId: '5V', voltageVolts: 5, maxCurrentCapacityAmps: 4.0, converterEfficiencyPercent: 90 },
    { railId: '3.3V', voltageVolts: 3.3, maxCurrentCapacityAmps: 3.0, converterEfficiencyPercent: 88 },
  ]);

  // Converter chain state
  const [stages, setStages] = useState<ConverterStage[]>([
    { stageId: 'stage1', name: 'Primary Buck (24V -> 12V)', inputVoltageVolts: 24, outputVoltageVolts: 12, efficiencyPercent: 94, outputPowerWatts: 48 },
    { stageId: 'stage2', name: 'Secondary LDO/Buck (12V -> 3.3V)', inputVoltageVolts: 12, outputVoltageVolts: 3.3, efficiencyPercent: 88, outputPowerWatts: 15 },
  ]);

  // Battery-to-load state
  const [battV, setBattV] = useState<number>(14.8);
  const [battAh, setBattAh] = useState<number>(10.0);
  const [convEff, setConvEff] = useState<number>(92);
  const [targetLoadW, setTargetLoadW] = useState<number>(35);
  const [targetHours, setTargetHours] = useState<number>(3.0);

  // Peak vs Cont state
  const [contW, setContW] = useState<number>(45);
  const [peakW, setPeakW] = useState<number>(85);
  const [srcContW, setSrcContW] = useState<number>(60);
  const [srcPeakW, setSrcPeakW] = useState<number>(100);

  // Calculations
  const budgetRes = useMemo(() => {
    try {
      return calculateDcPowerBudget(loads, supplyV, supplyMaxW);
    } catch {
      return null;
    }
  }, [loads, supplyV, supplyMaxW]);

  const multiRailRes = useMemo(() => {
    try {
      return calculateMultiRailPowerBudget(rails, [
        { id: '1', name: '12V Rail Load', voltageRailVolts: 12, nominalCurrentAmps: 2.0 },
        { id: '2', name: '5V Rail Load', voltageRailVolts: 5, nominalCurrentAmps: 1.5 },
        { id: '3', name: '3.3V Rail Load', voltageRailVolts: 3.3, nominalCurrentAmps: 1.2 },
      ]);
    } catch {
      return null;
    }
  }, [rails]);

  const chainRes = useMemo(() => {
    try {
      return calculateConverterLossChain(stages);
    } catch {
      return null;
    }
  }, [stages]);

  const battChainRes = useMemo(() => {
    try {
      return calculateBatteryToLoadChain({
        batteryNominalVoltage: battV,
        batteryCapacityAh: battAh,
        converterEfficiencyPercent: convEff,
        loadPowerWatts: targetLoadW,
        runtimeTargetHours: targetHours,
      });
    } catch {
      return null;
    }
  }, [battV, battAh, convEff, targetLoadW, targetHours]);

  const peakRes = useMemo(() => {
    try {
      return analyzePeakVsContinuousPower(contW, peakW, srcContW, srcPeakW);
    } catch {
      return null;
    }
  }, [contW, peakW, srcContW, srcPeakW]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Power System Design & Budgeting</h2>
            <p className="text-sm text-muted-foreground">
              Multi-rail DC power budgeting, converter loss chains, cascaded efficiency, and battery-to-load sizing
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
          <Zap className="w-4 h-4" />
          <span>DC Power Budget</span>
        </button>
        <button
          onClick={() => setActiveTab('multirail')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'multirail' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Multi-Rail Budget</span>
        </button>
        <button
          onClick={() => setActiveTab('converter_chain')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'converter_chain' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          <span>Converter Loss Chain</span>
        </button>
        <button
          onClick={() => setActiveTab('battery_chain')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'battery_chain' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <BatteryCharging className="w-4 h-4" />
          <span>Battery-to-Load Chain</span>
        </button>
        <button
          onClick={() => setActiveTab('peak_continuous')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'peak_continuous' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Peak vs Continuous</span>
        </button>
      </div>

      {/* Tab 1: DC Power Budget */}
      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">DC Power Source & Loads</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Supply Voltage (V)</label>
                <input
                  type="number"
                  value={supplyV}
                  onChange={(e) => setSupplyV(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Supply Rating (W)</label>
                <input
                  type="number"
                  value={supplyMaxW}
                  onChange={(e) => setSupplyMaxW(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Load Elements</span>
              {loads.map((load, idx) => (
                <div key={load.id} className="grid grid-cols-3 gap-2 items-center text-xs">
                  <span className="font-mono text-muted-foreground">{load.name}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={load.nominalCurrentAmps}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const next = [...loads];
                      next[idx].nominalCurrentAmps = val;
                      setLoads(next);
                    }}
                    className="px-2 py-1 rounded border border-input bg-background text-xs"
                  />
                  <span>{(load.nominalCurrentAmps * supplyV).toFixed(1)} W</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="DC Power Budget Total"
              value={`${budgetRes?.totalLoadPowerWatts ?? 0} W`}
              subtitle={`Total Current: ${budgetRes?.totalLoadCurrentAmps ?? 0} A | Headroom: ${budgetRes?.powerMargin.marginPercent ?? 0}%`}
              status={budgetRes?.powerMargin.isSatisfied ? 'normal' : 'danger'}
            />
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Load Breakdown</h4>
              {budgetRes?.loadContributions.map((c) => (
                <div key={c.id} className="flex justify-between items-center text-sm py-1 border-b border-border/40">
                  <span>{c.name}</span>
                  <span className="font-mono font-semibold">{c.powerWatts} W ({c.percentageOfTotal}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Multi-Rail */}
      {activeTab === 'multirail' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {multiRailRes?.rails.map((r) => (
              <div key={r.railId} className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-base">{r.railId} Rail</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted font-mono">{r.utilizationPercent}% Load</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>Load: {r.totalCurrentAmps} A ({r.totalPowerWatts} W)</p>
                  <p>Input Draw: {r.converterInputPowerWatts} W</p>
                  <p className={r.margin.isSatisfied ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    Margin: {r.margin.marginPercent}% ({r.margin.statusText})
                  </p>
                </div>
              </div>
            ))}
          </div>
          <ResultCard
            title="Aggregate Multi-Rail Input Power"
            value={`${multiRailRes?.aggregateConverterInputWatts ?? 0} W`}
            subtitle={`Delivered: ${multiRailRes?.aggregateSystemPowerWatts ?? 0} W | Weighted Efficiency: ${multiRailRes?.overallEfficiencyPercent ?? 0}%`}
            status="normal"
          />
        </div>
      )}

      {/* Tab 3: Converter Loss Chain */}
      {activeTab === 'converter_chain' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Cascaded Conversion Stages</h3>
            {stages.map((st, i) => (
              <div key={st.stageId} className="p-3 rounded-lg border border-border/60 space-y-2 bg-muted/20">
                <span className="font-semibold text-sm">{st.name}</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-muted-foreground">Output Power (W)</label>
                    <input
                      type="number"
                      value={st.outputPowerWatts}
                      onChange={(e) => {
                        const next = [...stages];
                        next[i].outputPowerWatts = parseFloat(e.target.value) || 0;
                        setStages(next);
                      }}
                      className="w-full mt-1 px-2 py-1 rounded border border-input bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground">Efficiency (%)</label>
                    <input
                      type="number"
                      value={st.efficiencyPercent}
                      onChange={(e) => {
                        const next = [...stages];
                        next[i].efficiencyPercent = parseFloat(e.target.value) || 0;
                        setStages(next);
                      }}
                      className="w-full mt-1 px-2 py-1 rounded border border-input bg-background"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Cascaded System Efficiency"
              value={`${chainRes?.cascadedEfficiencyPercent ?? 0} %`}
              subtitle={`Total Input: ${chainRes?.totalSystemInputPowerWatts ?? 0} W | Total Losses: ${chainRes?.totalSystemLossWatts ?? 0} W`}
              status="normal"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Battery-to-Load Chain */}
      {activeTab === 'battery_chain' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Battery Source & Mission Profile</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Battery Voltage (V)</label>
                <input
                  type="number"
                  value={battV}
                  onChange={(e) => setBattV(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Capacity (Ah)</label>
                <input
                  type="number"
                  value={battAh}
                  onChange={(e) => setBattAh(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Converter η (%)</label>
                <input
                  type="number"
                  value={convEff}
                  onChange={(e) => setConvEff(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Load Power (W)</label>
                <input
                  type="number"
                  value={targetLoadW}
                  onChange={(e) => setTargetLoadW(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Target Hours (h)</label>
                <input
                  type="number"
                  value={targetHours}
                  onChange={(e) => setTargetHours(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Achievable Mission Runtime"
              value={`${battChainRes?.achievableRuntimeHours ?? 0} Hours`}
              subtitle={`Gross: ${battChainRes?.batteryGrossEnergyWh ?? 0} Wh | Delivered: ${battChainRes?.deliveredLoadEnergyWh ?? 0} Wh`}
              status={battChainRes?.energyMargin.isSatisfied ? 'normal' : 'danger'}
            />
          </div>
        </div>
      )}

      {/* Tab 5: Peak vs Continuous */}
      {activeTab === 'peak_continuous' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Demand vs Source Sizing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Continuous Load (W)</label>
                <input
                  type="number"
                  value={contW}
                  onChange={(e) => setContW(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Peak Load (W)</label>
                <input
                  type="number"
                  value={peakW}
                  onChange={(e) => setPeakW(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Source Continuous Rating (W)</label>
                <input
                  type="number"
                  value={srcContW}
                  onChange={(e) => setSrcContW(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Source Peak Rating (W)</label>
                <input
                  type="number"
                  value={srcPeakW}
                  onChange={(e) => setSrcPeakW(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Power Margin Analysis"
              value={`Status: ${peakRes?.status ?? 'SATISFIED'}`}
              subtitle={`Cont Margin: ${peakRes?.continuousMargin.marginPercent ?? 0}% | Peak Margin: ${peakRes?.peakMargin.marginPercent ?? 0}%`}
              status={peakRes?.status === 'SATISFIED' ? 'normal' : 'danger'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
