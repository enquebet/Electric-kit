import React, { useState, useMemo } from 'react';
import {
  conductElectricalDesignReview,
  conductPowerDesignReview,
  conductThermalDesignReview,
  conductBatteryDesignReview,
  conductPcbDesignReview,
  conductSignalIntegrityReview,
  generateSystemEngineeringDesignReport,
  BuildSystemDesignReportInput,
} from '../../engines/design/design-review';
import { globalAssumptionRegister } from '../../engines/design/assumptions';
import { globalWarningAggregator } from '../../engines/design/warnings';
import { globalTraceabilityRegister } from '../../engines/design/traceability';
import { EngineeringRequirement, EngineeringMargin } from '../../engines/design/types';
import { ResultCard } from '../common/ResultCard';
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Zap,
  Thermometer,
  Battery,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export function SystemDesignReviewTool() {
  const [activeTab, setActiveTab] = useState<'system_report' | 'domain_reviews' | 'assumptions_register' | 'warnings_traceability'>('system_report');

  // Report metadata state
  const [projectTitle, setProjectTitle] = useState<string>('High-Reliability Industrial IoT Gateway System');
  const [projectDesc, setProjectDesc] = useState<string>('24V nominal input, 3.3V/5V/12V multi-rail power distribution with backup LiFePO4 battery pack and IP65 thermal enclosure.');

  // Editable sample requirements & margins
  const [sysPowerW, setSysPowerW] = useState<number>(45.0);
  const [converterLossW, setConverterLossW] = useState<number>(4.2);
  const [efficiencyPct, setEfficiencyPct] = useState<number>(91.5);
  const [powerMarginPct, setPowerMarginPct] = useState<number>(25.0);

  const [totalHeatW, setTotalHeatW] = useState<number>(18.5);
  const [peakTjC, setPeakTjC] = useState<number>(98.0);
  const [maxTjC, setMaxTjC] = useState<number>(125.0);
  const [thermalMarginC, setThermalMarginC] = useState<number>(27.0);

  const [packConfig, setPackConfig] = useState<string>('8S2P (25.6V 6.4Ah)');
  const [packEnergyWh, setPackEnergyWh] = useState<number>(163.8);
  const [autonomyH, setAutonomyH] = useState<number>(3.5);
  const [eolReservePct, setEolReservePct] = useState<number>(20.0);
  const [batteryMarginPct, setBatteryMarginPct] = useState<number>(15.0);

  const [impedanceDevOhms, setImpedanceDevOhms] = useState<number>(2.4);
  const [clearanceOk, setClearanceOk] = useState<boolean>(true);
  const [kneeFreqGhz, setKneeFreqGhz] = useState<number>(1.2);
  const [critLenMm, setCritLenMm] = useState<number>(35.0);
  const [actualLenMm, setActualLenMm] = useState<number>(42.0);
  const [terminationReq, setTerminationReq] = useState<boolean>(true);

  // Synthesized margins
  const testMargins = useMemo<EngineeringMargin[]>(() => {
    return [
      {
        parameter: 'System Power Headroom',
        requiredValue: sysPowerW,
        availableOrCalculatedValue: sysPowerW * (1 + powerMarginPct / 100),
        marginAbsolute: (sysPowerW * powerMarginPct) / 100,
        marginPercent: powerMarginPct,
        unit: 'W',
        isSatisfied: powerMarginPct >= 10,
        statusText: powerMarginPct >= 20 ? 'SATISFIED' : powerMarginPct >= 10 ? 'TIGHT_MARGIN' : 'VIOLATED',
      },
      {
        parameter: 'Semiconductor Thermal Headroom (Tj)',
        requiredValue: maxTjC,
        availableOrCalculatedValue: peakTjC,
        marginAbsolute: maxTjC - peakTjC,
        marginPercent: ((maxTjC - peakTjC) / maxTjC) * 100,
        unit: '°C',
        isSatisfied: peakTjC <= maxTjC,
        statusText: maxTjC - peakTjC >= 25 ? 'SATISFIED' : maxTjC - peakTjC >= 10 ? 'TIGHT_MARGIN' : 'VIOLATED',
      },
      {
        parameter: 'Battery Backup Energy Headroom',
        requiredValue: packEnergyWh,
        availableOrCalculatedValue: packEnergyWh * (1 + batteryMarginPct / 100),
        marginAbsolute: (packEnergyWh * batteryMarginPct) / 100,
        marginPercent: batteryMarginPct,
        unit: 'Wh',
        isSatisfied: batteryMarginPct >= 5,
        statusText: batteryMarginPct >= 15 ? 'SATISFIED' : batteryMarginPct >= 5 ? 'TIGHT_MARGIN' : 'VIOLATED',
      },
      {
        parameter: 'High-Speed Controlled Impedance Matching',
        requiredValue: 50.0,
        availableOrCalculatedValue: 50.0 + impedanceDevOhms,
        marginAbsolute: impedanceDevOhms,
        marginPercent: (impedanceDevOhms / 50.0) * 100,
        unit: 'Ω',
        isSatisfied: Math.abs(impedanceDevOhms) <= 5.0,
        statusText: Math.abs(impedanceDevOhms) <= 3.0 ? 'SATISFIED' : Math.abs(impedanceDevOhms) <= 5.0 ? 'TIGHT_MARGIN' : 'VIOLATED',
      },
    ];
  }, [sysPowerW, powerMarginPct, maxTjC, peakTjC, packEnergyWh, batteryMarginPct, impedanceDevOhms]);

  const testRequirements = useMemo<EngineeringRequirement[]>(() => {
    return [
      { id: 'REQ-PWR-01', category: 'power', name: 'Continuous Operating Power', nominalValue: sysPowerW, unit: 'W', source: 'user' },
      { id: 'REQ-THM-01', category: 'thermal', name: 'Maximum Junction Temp', nominalValue: maxTjC, unit: '°C', source: 'reference' },
      { id: 'REQ-BAT-01', category: 'electrical', name: 'Backup Stored Energy', nominalValue: packEnergyWh, unit: 'Wh', source: 'user' },
      { id: 'REQ-PCB-01', category: 'component', name: 'High-Speed Line Impedance', nominalValue: 50, unit: 'Ω', source: 'reference' },
    ];
  }, [sysPowerW, maxTjC, packEnergyWh]);

  // Domain Reviews
  const elecReview = useMemo(() => conductElectricalDesignReview(testRequirements, testMargins), [testRequirements, testMargins]);
  const pwrReview = useMemo(() => conductPowerDesignReview(sysPowerW, converterLossW, efficiencyPct, testMargins[0]), [sysPowerW, converterLossW, efficiencyPct, testMargins]);
  const thmReview = useMemo(() => conductThermalDesignReview(totalHeatW, peakTjC, maxTjC, thermalMarginC), [totalHeatW, peakTjC, maxTjC, thermalMarginC]);
  const battReview = useMemo(() => conductBatteryDesignReview(packConfig, packEnergyWh, autonomyH, eolReservePct, testMargins[2]), [packConfig, packEnergyWh, autonomyH, eolReservePct, testMargins]);
  const pcbReview = useMemo(() => conductPcbDesignReview([testMargins[3]], impedanceDevOhms, clearanceOk), [testMargins, impedanceDevOhms, clearanceOk]);
  const siReview = useMemo(() => conductSignalIntegrityReview(kneeFreqGhz, critLenMm, actualLenMm, terminationReq), [kneeFreqGhz, critLenMm, actualLenMm, terminationReq]);

  // System Design Report
  const systemReport = useMemo(() => {
    const input: BuildSystemDesignReportInput = {
      title: projectTitle,
      projectDescription: projectDesc,
      requirements: testRequirements,
      margins: testMargins,
    };
    return generateSystemEngineeringDesignReport(input);
  }, [projectTitle, projectDesc, testRequirements, testMargins]);

  const assumptions = useMemo(() => globalAssumptionRegister.getAll(), []);
  const warnings = useMemo(() => globalWarningAggregator.getAll(), []);
  const traces = useMemo(() => globalTraceabilityRegister.getAll(), []);

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('system_report')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'system_report'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>System Design Report (Synthesizer)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('domain_reviews')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'domain_reviews'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Domain Engineering Reviews</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assumptions_register')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'assumptions_register'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Assumptions Register ({assumptions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('warnings_traceability')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'warnings_traceability'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Traceability & Warnings ({warnings.length})</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM DESIGN REPORT */}
      {activeTab === 'system_report' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                Project Specification Parameters
              </span>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300">Project / System Title</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300">System Architecture Description</label>
                <textarea
                  rows={2}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">Continuous Power (W)</label>
                  <input
                    type="number"
                    value={sysPowerW}
                    onChange={(e) => setSysPowerW(parseFloat(e.target.value) || 0)}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">Power Headroom (%)</label>
                  <input
                    type="number"
                    value={powerMarginPct}
                    onChange={(e) => setPowerMarginPct(parseFloat(e.target.value) || 0)}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">Peak Junction Tj (°C)</label>
                  <input
                    type="number"
                    value={peakTjC}
                    onChange={(e) => setPeakTjC(parseFloat(e.target.value) || 0)}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">Max Allowable Tj (°C)</label>
                  <input
                    type="number"
                    value={maxTjC}
                    onChange={(e) => setMaxTjC(parseFloat(e.target.value) || 0)}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300"
                  />
                </div>
              </div>
            </div>

            {/* Overall Verdict Banner */}
            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
              systemReport.overallStatus === 'Validated calculation'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : systemReport.overallStatus === 'Requirement satisfied by modeled inputs'
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                {systemReport.overallStatus === 'Validated calculation' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider">Overall Design Synthesis Status</span>
                  <span className="text-sm font-extrabold">{systemReport.overallStatus}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                Synthesized across electrical, power, thermal, battery, and PCB domain models. Standards-aware, assumption-bounded client-side calculation output.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* System Design Report Preview */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex flex-col">
                  <h2 className="text-base font-bold text-slate-100">{systemReport.title}</h2>
                  <span className="text-xs text-slate-400">{systemReport.projectDescription}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  SYSTEM DESIGN REPORT
                </span>
              </div>

              {/* Remarks List */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Executive Remarks:</span>
                {systemReport.summaryRemarks.map((remark, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-mono">
                    <span className="text-cyan-400">•</span>
                    <span>{remark}</span>
                  </div>
                ))}
              </div>

              {/* Margins Matrix */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Design Margins Verification</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {systemReport.margins.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                        m.isSatisfied
                          ? 'bg-slate-950/60 border-slate-800'
                          : 'bg-rose-950/30 border-rose-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 truncate">{m.parameter}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            m.statusText === 'SATISFIED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : m.statusText === 'TIGHT_MARGIN'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          }`}
                        >
                          {m.statusText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Req: {m.requiredValue} {m.unit}</span>
                        <span className="text-cyan-300 font-bold">Margin: {m.marginPercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Warnings in Report */}
              {systemReport.warnings.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Engineering Warnings & Hardware Validation Requirements ({systemReport.warnings.length})
                  </span>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {systemReport.warnings.slice(0, 4).map((w, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded text-xs border flex flex-col gap-0.5 ${
                          w.severity === 'critical'
                            ? 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                            : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="uppercase text-[10px] tracking-wider font-mono">[{w.category}]</span>
                          {w.requiresHardwareValidation && (
                            <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-300 border border-slate-700">
                              Physical Test Mandated
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-tight text-slate-300">{w.message}</p>
                        {w.remedyHint && (
                          <span className="text-[10px] text-cyan-300 font-mono mt-0.5">Remedy: {w.remedyHint}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOMAIN ENGINEERING REVIEWS */}
      {activeTab === 'domain_reviews' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Electrical Review Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Electrical Review
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                elecReview.overallElectricalStatus === 'SATISFIED' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
              }`}>
                {elecReview.overallElectricalStatus}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-slate-300 font-mono">
              <div className="flex justify-between"><span>Requirements:</span><span className="text-slate-100">{elecReview.requirementsCount}</span></div>
              <div className="flex justify-between"><span>Satisfied Margins:</span><span className="text-emerald-400">{elecReview.satisfiedMarginsCount}</span></div>
              <div className="flex justify-between"><span>Violations:</span><span className="text-rose-400">{elecReview.violationsCount}</span></div>
            </div>
          </div>

          {/* Power Review Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                Power Review
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                {pwrReview.systemEfficiencyRating}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
              {pwrReview.powerBalanceSummary}
            </p>
          </div>

          {/* Thermal Review Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4" />
                Thermal Review
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                {thmReview.thermalRiskLevel}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
              {thmReview.summaryRemarks}
            </p>
          </div>

          {/* Battery Review Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Battery className="w-4 h-4" />
                Battery Review
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                {battReview.packSuitability}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
              {battReview.summaryText}
            </p>
          </div>

          {/* PCB Review Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                PCB Review
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                {pcbReview.pcbReadiness}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
              {pcbReview.traceabilityNotes}
            </p>
          </div>

          {/* Signal Integrity Review Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Signal Integrity Review
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400">
                {siReview.siRiskScore}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {siReview.recommendations.map((rec, i) => (
                <span key={i} className="text-[11px] text-slate-300 leading-tight">• {rec}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ASSUMPTIONS REGISTER */}
      {activeTab === 'assumptions_register' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Global Engineering Assumptions Register</h3>
              <p className="text-xs text-slate-400">
                Every calculation assumption is classified and auditable. No hidden constants.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">
              {assumptions.length} Active Assumptions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Parameter</th>
                  <th className="py-2 px-3">Value</th>
                  <th className="py-2 px-3">Classification</th>
                  <th className="py-2 px-3">Workflow</th>
                  <th className="py-2 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {assumptions.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-semibold text-slate-200">{a.parameter}</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{a.value} {a.unit ?? ''}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                        {a.classification}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">{a.applicableWorkflow}</td>
                    <td className="py-2 px-3 text-[11px] text-slate-400 font-sans max-w-md">{a.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TRACEABILITY & WARNINGS */}
      {activeTab === 'warnings_traceability' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Warnings Aggregator */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Aggregated System Warnings
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {warnings.length} Total
              </span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
              {warnings.map((w) => (
                <div
                  key={w.id}
                  className={`p-3 rounded-lg border flex flex-col gap-1 ${
                    w.severity === 'critical'
                      ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                      : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">
                      [{w.category}] • {w.severity}
                    </span>
                    {w.requiresHardwareValidation && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        Hardware Validation Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">{w.message}</p>
                  {w.remedyHint && (
                    <span className="text-[11px] text-cyan-300 font-mono mt-1">
                      Action: {w.remedyHint}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Traceability Matrix */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Traceability Matrix
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {traces.length} Mapped Steps
              </span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
              {traces.map((t, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{t.requirementName}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{t.requirementId}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Engine: <span className="text-slate-300">{t.participatingEngine}</span> | Method: <span className="text-slate-300">{t.formulaOrMethod}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono pt-1 border-t border-slate-900">
                    <span className="text-slate-400">Calculated:</span>
                    <span className="text-emerald-300 font-bold">{t.calculatedValue} {t.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
