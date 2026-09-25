import React, { useState, useMemo } from 'react';
import {
  calculateBatteryToLoadSizing,
  analyzeBatteryPackRequirements,
  analyzeRuntimeVsLoad,
  checkPeakCurrentCompatibility,
  checkBatteryVoltageCompatibility,
  analyzeWorstCaseBatteryScenario,
} from '../../engines/design/battery-workflows';
import { ResultCard } from '../common/ResultCard';
import { BatteryCharging, Battery, Gauge, AlertTriangle, ShieldCheck } from 'lucide-react';

export function BatterySystemDesignTool() {
  const [activeTab, setActiveTab] = useState<'sizing' | 'pack_analyzer' | 'runtime_load' | 'compatibility' | 'worst_case'>('sizing');

  // Sizing state
  const [dailyWh, setDailyWh] = useState<number>(450);
  const [autonomyDays, setAutonomyDays] = useState<number>(2.0);
  const [convEff, setConvEff] = useState<number>(92);
  const [dodLimit, setDodLimit] = useState<number>(80);
  const [sysV, setSysV] = useState<number>(48);

  // Pack analyzer state
  const [targetV, setTargetV] = useState<number>(48);
  const [targetAh, setTargetAh] = useState<number>(20);
  const [targetContI, setTargetContI] = useState<number>(30);
  const [cellKey, setCellKey] = useState<string>('molicel_p42a_21700');

  // Compatibility state
  const [battPeakI, setBattPeakI] = useState<number>(60);
  const [convPeakI, setConvPeakI] = useState<number>(45);
  const [loadPeakI, setLoadPeakI] = useState<number>(40);
  const [battMinV, setBattMinV] = useState<number>(38);
  const [battMaxV, setBattMaxV] = useState<number>(54.6);
  const [convMinV, setConvMinV] = useState<number>(36);
  const [convMaxV, setConvMaxV] = useState<number>(60);

  // Calculations
  const sizingRes = useMemo(() => {
    try {
      return calculateBatteryToLoadSizing({
        dailyLoadWh: dailyWh,
        autonomyDays,
        converterEfficiencyPercent: convEff,
        maxDodPercent: dodLimit,
        systemNominalVoltage: sysV,
      });
    } catch {
      return null;
    }
  }, [dailyWh, autonomyDays, convEff, dodLimit, sysV]);

  const packRes = useMemo(() => {
    try {
      return analyzeBatteryPackRequirements(targetV, targetAh, targetContI, cellKey);
    } catch {
      return null;
    }
  }, [targetV, targetAh, targetContI, cellKey]);

  const runtimeCurve = useMemo(() => {
    try {
      return analyzeRuntimeVsLoad(targetAh, targetV, targetV * 0.85, [50, 100, 250, 500]);
    } catch {
      return [];
    }
  }, [targetAh, targetV]);

  const peakCompat = useMemo(() => {
    try {
      return checkPeakCurrentCompatibility(battPeakI, convPeakI, loadPeakI);
    } catch {
      return null;
    }
  }, [battPeakI, convPeakI, loadPeakI]);

  const voltCompat = useMemo(() => {
    try {
      return checkBatteryVoltageCompatibility(battMinV, battMaxV, convMinV, convMaxV);
    } catch {
      return null;
    }
  }, [battMinV, battMaxV, convMinV, convMaxV]);

  const worstCaseBatt = useMemo(() => {
    try {
      return analyzeWorstCaseBatteryScenario({
        nominalCapacityAh: targetAh,
        nominalVoltage: targetV,
        operatingCurrentAmps: 10,
        ambientTempC: -5,
        converterEfficiencyPercent: convEff,
      });
    } catch {
      return null;
    }
  }, [targetAh, targetV, convEff]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <BatteryCharging className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Battery &amp; Energy Storage System Workflows</h2>
            <p className="text-sm text-muted-foreground">
              End-to-end battery-to-load storage sizing, cell pack requirement synthesis, voltage compatibility, and cold EOL scenarios
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('sizing')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sizing' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Battery className="w-4 h-4" />
          <span>Battery-to-Load Sizing</span>
        </button>
        <button
          onClick={() => setActiveTab('pack_analyzer')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pack_analyzer' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Pack Requirement Analyzer</span>
        </button>
        <button
          onClick={() => setActiveTab('runtime_load')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'runtime_load' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <BatteryCharging className="w-4 h-4" />
          <span>Runtime vs Load</span>
        </button>
        <button
          onClick={() => setActiveTab('compatibility')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'compatibility' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Peak &amp; Voltage Compatibility</span>
        </button>
        <button
          onClick={() => setActiveTab('worst_case')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'worst_case' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Worst-Case Scenarios</span>
        </button>
      </div>

      {/* Tab 1: Sizing */}
      {activeTab === 'sizing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Mission Load &amp; Autonomy Targets</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Daily Consumption (Wh)</label>
                <input
                  type="number"
                  value={dailyWh}
                  onChange={(e) => setDailyWh(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Autonomy Days (d)</label>
                <input
                  type="number"
                  step="0.5"
                  value={autonomyDays}
                  onChange={(e) => setAutonomyDays(parseFloat(e.target.value) || 0)}
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
                <label className="text-xs text-muted-foreground font-medium">Max DoD (%)</label>
                <input
                  type="number"
                  value={dodLimit}
                  onChange={(e) => setDodLimit(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">System Bus (V)</label>
                <input
                  type="number"
                  value={sysV}
                  onChange={(e) => setSysV(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Required Nameplate Battery Bank"
              value={`${sizingRes?.grossRequiredStorageKwh ?? 0} kWh`}
              subtitle={`Required Capacity: ${sizingRes?.requiredBatteryCapacityAh ?? 0} Ah at ${sysV}V | Delivered: ${sizingRes?.deliveredLoadEnergyWh ?? 0} Wh`}
              status="normal"
            />
            <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>Net Autonomy Energy</span>
                <span className="font-semibold text-foreground">{sizingRes?.sizingBreakdown.autonomyEnergyWh} Wh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>After Converter &amp; Wiring Losses</span>
                <span className="font-semibold text-foreground">{sizingRes?.sizingBreakdown.afterConverterLossesWh} Wh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span>After DoD &amp; Temp Derating</span>
                <span className="font-semibold text-foreground">{sizingRes?.sizingBreakdown.afterTempDeratingWh} Wh</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Gross with 80% EOL Reserve</span>
                <span className="font-semibold text-foreground">{sizingRes?.sizingBreakdown.afterEolReserveWh} Wh</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Pack Analyzer */}
      {activeTab === 'pack_analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Target Pack Goals</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Target V</label>
                <input
                  type="number"
                  value={targetV}
                  onChange={(e) => setTargetV(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Target Ah</label>
                <input
                  type="number"
                  value={targetAh}
                  onChange={(e) => setTargetAh(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Target Cont I (A)</label>
                <input
                  type="number"
                  value={targetContI}
                  onChange={(e) => setTargetContI(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Cell Chemistry Preset</label>
              <select
                value={cellKey}
                onChange={(e) => setCellKey(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
              >
                <option value="molicel_p42a_21700">Molicel P42A 21700 (Li-ion 4200mAh 45A)</option>
                <option value="samsung_30q_18650">Samsung 30Q 18650 (Li-ion 3000mAh 15A)</option>
                <option value="eve_280ah_lifepo4">EVE LF280K Prismatic (LiFePO4 280Ah 1C)</option>
                <option value="a123_26650_lifepo4">A123 ANR26650 (LiFePO4 2500mAh 50A)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Recommended Architecture"
              value={packRes?.recommendedConfig ?? '13S5P'}
              subtitle={`${packRes?.totalCells ?? 0} Cells | Mass: ${packRes?.packWeightKg ?? 0} kg`}
              status="normal"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Runtime vs Load */}
      {activeTab === 'runtime_load' && (
        <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
          <h3 className="text-base font-semibold">Multi-Power Discharge Runtime Evaluation</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {runtimeCurve.map((pt) => (
              <div key={pt.loadWatts} className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1">
                <span className="font-bold text-sm">{pt.loadWatts} W Load</span>
                <p className="text-xs text-muted-foreground">Current: {pt.loadCurrentAmps} A</p>
                <p className="text-sm font-semibold text-primary">{pt.runtimeHours} Hours</p>
                <p className="text-xs text-muted-foreground">Delivered: {pt.deliveredEnergyWh} Wh</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Compatibility */}
      {activeTab === 'compatibility' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Peak Current Ratings</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Battery Peak (A)</label>
                <input
                  type="number"
                  value={battPeakI}
                  onChange={(e) => setBattPeakI(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Converter Peak (A)</label>
                <input
                  type="number"
                  value={convPeakI}
                  onChange={(e) => setConvPeakI(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Demand Peak (A)</label>
                <input
                  type="number"
                  value={loadPeakI}
                  onChange={(e) => setLoadPeakI(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>

            <h3 className="text-base font-semibold pt-3 border-t border-border">Voltage Windows</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Battery Vmin / Vmax</label>
                <div className="flex space-x-1 mt-1">
                  <input
                    type="number"
                    value={battMinV}
                    onChange={(e) => setBattMinV(parseFloat(e.target.value) || 0)}
                    className="w-1/2 px-2 py-1 rounded border border-input bg-background text-xs"
                  />
                  <input
                    type="number"
                    value={battMaxV}
                    onChange={(e) => setBattMaxV(parseFloat(e.target.value) || 0)}
                    className="w-1/2 px-2 py-1 rounded border border-input bg-background text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Converter Vmin / Vmax</label>
                <div className="flex space-x-1 mt-1">
                  <input
                    type="number"
                    value={convMinV}
                    onChange={(e) => setConvMinV(parseFloat(e.target.value) || 0)}
                    className="w-1/2 px-2 py-1 rounded border border-input bg-background text-xs"
                  />
                  <input
                    type="number"
                    value={convMaxV}
                    onChange={(e) => setConvMaxV(parseFloat(e.target.value) || 0)}
                    className="w-1/2 px-2 py-1 rounded border border-input bg-background text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Interface Compatibility Status"
              value={peakCompat?.isCompatible && voltCompat?.isCompatible ? 'COMPATIBLE' : 'WARNINGS'}
              subtitle={`Limiting Current Node: ${peakCompat?.limitingComponent ?? 'NONE'} | Low V Headroom: ${voltCompat?.lowVoltageHeadroomVolts ?? 0}V`}
              status={peakCompat?.isCompatible && voltCompat?.isCompatible ? 'normal' : 'danger'}
            />
            {voltCompat?.warnings.map((w) => (
              <div key={w.id} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                {w.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Worst Case */}
      {activeTab === 'worst_case' && (
        <div className="space-y-4">
          <ResultCard
            title="Cold Sub-Zero EOL Worst-Case Performance"
            value={`${worstCaseBatt?.estimatedRuntimeHours ?? 0} Hours`}
            subtitle={`Effective Usable Energy: ${worstCaseBatt?.effectiveDeliveredEnergyWh ?? 0} Wh (Cold Derating: ${worstCaseBatt?.deratingFactorsApplied.tempFactor ?? 1}x)`}
            status="normal"
          />
          {worstCaseBatt?.warnings.map((w) => (
            <div key={w.id} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
              {w.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
