import React, { useState, useMemo } from 'react';
import {
  analyzePcbPowerIntegrity,
  analyzeTraceCurrentAndThermal,
  analyzeControlledImpedance,
  analyzeDifferentialPairWorkflow,
  analyzeSignalIntegrityRisk,
  analyzeViaCurrentAndThermal,
  analyzePcbClearanceCreepage,
} from '../../engines/design/pcb-workflows';
import { ResultCard } from '../common/ResultCard';
import { Layers, Activity, Zap, ShieldAlert, Cpu } from 'lucide-react';

export function PcbSystemDesignTool() {
  const [activeTab, setActiveTab] = useState<'power_integrity' | 'trace_thermal' | 'impedance' | 'differential' | 'si_drc'>('power_integrity');

  // Power Integrity state
  const [railV, setRailV] = useState<number>(3.3);
  const [transI, setTransI] = useState<number>(2.5);
  const [ripplePct, setRipplePct] = useState<number>(3.0);
  const [swFreqKhz, setSwFreqKhz] = useState<number>(500);

  // Trace state
  const [tLenMm, setTLenMm] = useState<number>(100);
  const [tWidthMm, setTWidthMm] = useState<number>(1.2);
  const [cuOz, setCuOz] = useState<number>(1.0);
  const [opI, setOpI] = useState<number>(3.0);

  // Impedance state
  const [targetZ, setTargetZ] = useState<number>(50);
  const [traceWMm, setTraceWMm] = useState<number>(0.3);
  const [dielHMm, setDielHMm] = useState<number>(0.18);
  const [er, setEr] = useState<number>(4.3);

  // Differential pair state
  const [diffTargetZ, setDiffTargetZ] = useState<number>(100);
  const [diffWMm, setDiffWMm] = useState<number>(0.2);
  const [diffSMm, setDiffSMm] = useState<number>(0.15);

  // SI state
  const [riseTimeNs, setRiseTimeNs] = useState<number>(0.8);
  const [hiSpeedLenMm, setHiSpeedLenMm] = useState<number>(75);

  // DRC state
  const [peakVolt, setPeakVolt] = useState<number>(48);

  // Calculations
  const piRes = useMemo(() => {
    try {
      return analyzePcbPowerIntegrity({
        railVoltageVolts: railV,
        maxTransientCurrentAmps: transI,
        maxRipplePercent: ripplePct,
        switchingFrequencyHz: swFreqKhz * 1000,
      });
    } catch {
      return null;
    }
  }, [railV, transI, ripplePct, swFreqKhz]);

  const traceRes = useMemo(() => {
    try {
      return analyzeTraceCurrentAndThermal({
        traceLengthMm: tLenMm,
        traceWidthMm: tWidthMm,
        copperThicknessOz: cuOz,
        operatingCurrentAmps: opI,
        ambientTempC: 25,
      });
    } catch {
      return null;
    }
  }, [tLenMm, tWidthMm, cuOz, opI]);

  const zRes = useMemo(() => {
    try {
      return analyzeControlledImpedance({
        targetImpedanceOhms: targetZ,
        traceWidthMm: traceWMm,
        dielectricHeightMm: dielHMm,
        dielectricConstantEr: er,
      });
    } catch {
      return null;
    }
  }, [targetZ, traceWMm, dielHMm, er]);

  const diffRes = useMemo(() => {
    try {
      return analyzeDifferentialPairWorkflow({
        traceWidthMm: diffWMm,
        traceSpacingMm: diffSMm,
        dielectricHeightMm: dielHMm,
        dielectricConstantEr: er,
        targetDiffImpedanceOhms: diffTargetZ,
      });
    } catch {
      return null;
    }
  }, [diffWMm, diffSMm, dielHMm, er, diffTargetZ]);

  const siRes = useMemo(() => {
    try {
      return analyzeSignalIntegrityRisk({
        signalRiseTimeNs: riseTimeNs,
        traceLengthMm: hiSpeedLenMm,
      });
    } catch {
      return null;
    }
  }, [riseTimeNs, hiSpeedLenMm]);

  const drcRes = useMemo(() => {
    try {
      return analyzePcbClearanceCreepage(peakVolt, 'external_uncoated', 2);
    } catch {
      return null;
    }
  }, [peakVolt]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">PCB &amp; System-Level Analysis Workflows</h2>
            <p className="text-sm text-muted-foreground">
              PDN target impedance, trace ampacity / voltage drop, microstrip &amp; differential impedance synthesis, and high-speed SI analysis
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('power_integrity')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'power_integrity' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>PDN Power Integrity</span>
        </button>
        <button
          onClick={() => setActiveTab('trace_thermal')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'trace_thermal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Trace Current &amp; Thermal</span>
        </button>
        <button
          onClick={() => setActiveTab('impedance')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'impedance' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Single-Ended Z0</span>
        </button>
        <button
          onClick={() => setActiveTab('differential')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'differential' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Differential Pairs</span>
        </button>
        <button
          onClick={() => setActiveTab('si_drc')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'si_drc' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Signal Integrity &amp; DRC</span>
        </button>
      </div>

      {/* Tab 1: PDN */}
      {activeTab === 'power_integrity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Rail Transient Specifications</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Rail Voltage (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={railV}
                  onChange={(e) => setRailV(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Transient Step ΔI (A)</label>
                <input
                  type="number"
                  step="0.5"
                  value={transI}
                  onChange={(e) => setTransI(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Allowed Ripple (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={ripplePct}
                  onChange={(e) => setRipplePct(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Switching Freq (kHz)</label>
                <input
                  type="number"
                  value={swFreqKhz}
                  onChange={(e) => setSwFreqKhz(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Target PDN Impedance Z_target"
              value={`${piRes?.targetPdnImpedanceMilliohms ?? 0} mΩ`}
              subtitle={`Allowed Ripple: ${piRes?.allowedRippleVolts ?? 0} V | Recommended Bulk C: ${piRes?.recommendedBulkCapacitanceUf ?? 0} µF`}
              status="normal"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Trace Thermal */}
      {activeTab === 'trace_thermal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Copper Trace Dimensions</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Length (mm)</label>
                <input
                  type="number"
                  value={tLenMm}
                  onChange={(e) => setTLenMm(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Width (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tWidthMm}
                  onChange={(e) => setTWidthMm(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Copper Weight (oz)</label>
                <input
                  type="number"
                  step="0.5"
                  value={cuOz}
                  onChange={(e) => setCuOz(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Operating Current (A)</label>
                <input
                  type="number"
                  step="0.5"
                  value={opI}
                  onChange={(e) => setOpI(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Trace Ampacity &amp; Drop"
              value={`${traceRes?.voltageDropVolts ?? 0} V Drop`}
              subtitle={`IPC-2152 Limit: ${traceRes?.maxCurrentCapacityIpc2152Amps ?? 0} A | Joule Loss: ${traceRes?.joulePowerLossWatts ?? 0} W`}
              status={traceRes?.traceCurrentMargin.isSatisfied ? 'normal' : 'danger'}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Single-Ended Z0 */}
      {activeTab === 'impedance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Microstrip Geometry</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Trace Width W (mm)</label>
                <input
                  type="number"
                  step="0.05"
                  value={traceWMm}
                  onChange={(e) => setTraceWMm(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Dielectric Height H (mm)</label>
                <input
                  type="number"
                  step="0.02"
                  value={dielHMm}
                  onChange={(e) => setDielHMm(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Substrate εr (Dk)</label>
              <input
                type="number"
                step="0.1"
                value={er}
                onChange={(e) => setEr(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Calculated Characteristic Impedance Z0"
              value={`${zRes?.characteristicImpedanceOhms ?? 0} Ω`}
              subtitle={`Effective Er: ${zRes?.effectivePermittivity ?? 0} | Delay: ${zRes?.propagationDelayPsPerMm ?? 0} ps/mm`}
              status="normal"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Differential Pairs */}
      {activeTab === 'differential' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">Differential Pair Parameters</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Trace Width W (mm)</label>
                <input
                  type="number"
                  step="0.05"
                  value={diffWMm}
                  onChange={(e) => setDiffWMm(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Pair Spacing S (mm)</label>
                <input
                  type="number"
                  step="0.05"
                  value={diffSMm}
                  onChange={(e) => setDiffSMm(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Target Diff Z (Ω)</label>
              <input
                type="number"
                value={diffTargetZ}
                onChange={(e) => setDiffTargetZ(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Differential Impedance Z_diff"
              value={`${diffRes?.differentialZDiffOhms ?? 0} Ω`}
              subtitle={`Single-Ended Z0: ${diffRes?.singleEndedZ0Ohms ?? 0} Ω | Coupling k: ${diffRes?.couplingCoefficientPercent ?? 0}%`}
              status="normal"
            />
          </div>
        </div>
      )}

      {/* Tab 5: SI & DRC */}
      {activeTab === 'si_drc' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
            <h3 className="text-base font-semibold">High-Speed Edge &amp; DRC Voltage</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Rise Time tr (ns)</label>
                <input
                  type="number"
                  step="0.1"
                  value={riseTimeNs}
                  onChange={(e) => setRiseTimeNs(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Trace Length (mm)</label>
                <input
                  type="number"
                  value={hiSpeedLenMm}
                  onChange={(e) => setHiSpeedLenMm(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Peak Working Voltage (V)</label>
              <input
                type="number"
                value={peakVolt}
                onChange={(e) => setPeakVolt(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-1.5 rounded border border-input bg-background text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <ResultCard
              title="Signal Integrity Risk Assessment"
              value={siRes?.riskSeverity ?? 'LOW_LUMPED'}
              subtitle={`Knee Freq: ${siRes?.kneeFrequencyGhz ?? 0} GHz | Critical Length: ${siRes?.criticalLengthMm ?? 0} mm`}
              status={siRes?.riskSeverity === 'CRITICAL_REFLECTIONS' ? 'danger' : 'normal'}
            />
            <div className="p-4 rounded-xl border border-border bg-card space-y-1 text-xs text-muted-foreground">
              <h4 className="font-semibold text-foreground">IPC-2221B Spacing Guidelines:</h4>
              <p>Recommended Minimum Clearance: <span className="font-mono text-foreground font-semibold">{drcRes?.recommendedClearanceMm} mm</span></p>
              <p>Recommended Minimum Creepage: <span className="font-mono text-foreground font-semibold">{drcRes?.recommendedCreepageMm} mm</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
