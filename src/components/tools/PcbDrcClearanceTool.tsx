import React, { useState, useMemo } from 'react';
import {
  calculateClearanceAndCreepage,
  checkAnnularRingDrc,
  runPcbGeometryDrcCheck,
  StandardsFramework,
  ConductorLocation,
  PollutionDegree,
  CtiMaterialGroup,
  IpcClass,
  DrcRuleResult,
} from '../../engines/pcb/drc-clearance';
import { ResultCard } from '../common/ResultCard';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Sliders, Shield } from 'lucide-react';

export const PcbDrcClearanceTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clearance' | 'drc'>('clearance');

  // Clearance & Creepage State
  const [standard, setStandard] = useState<StandardsFramework>('IPC_2221B');
  const [voltagePeak, setVoltagePeak] = useState<number>(48.0);
  const [location, setLocation] = useState<ConductorLocation>('external_coated');
  const [pollutionDegree, setPollutionDegree] = useState<PollutionDegree>(2);
  const [materialGroup, setMaterialGroup] = useState<CtiMaterialGroup>('group_IIIa');
  const [altitudeMeters, setAltitudeMeters] = useState<number>(0);

  const clearanceResult = useMemo(() => {
    return calculateClearanceAndCreepage({
      standard,
      voltagePeakOrDc: voltagePeak,
      location,
      pollutionDegree,
      materialGroup,
      altitudeMeters,
    });
  }, [standard, voltagePeak, location, pollutionDegree, materialGroup, altitudeMeters]);

  // DRC Geometry State
  const [tier, setTier] = useState<'standard' | 'advanced' | 'leading_edge'>('standard');
  const [traceWidthMm, setTraceWidthMm] = useState<number>(0.15); // ~6 mil
  const [traceSpacingMm, setTraceSpacingMm] = useState<number>(0.15); // ~6 mil
  const [drillToCopperMm, setDrillToCopperMm] = useState<number>(0.22); // ~9 mil
  const [viaToTraceMm, setViaToTraceMm] = useState<number>(0.14); // ~5.5 mil

  const [padDiameterMm, setPadDiameterMm] = useState<number>(0.60);
  const [drillDiameterMm, setDrillDiameterMm] = useState<number>(0.30);
  const [ipcClass, setIpcClass] = useState<IpcClass>('class2');

  const annularResult = useMemo(() => {
    return checkAnnularRingDrc({
      padDiameterMm,
      drillDiameterMm,
      ipcClass,
      isExternalLayer: true,
    });
  }, [padDiameterMm, drillDiameterMm, ipcClass]);

  const geometryResults = useMemo(() => {
    return runPcbGeometryDrcCheck({
      traceWidthMm,
      traceSpacingMm,
      drillToCopperMm,
      viaToTraceMm,
      fabricationCapabilityTier: tier,
    });
  }, [traceWidthMm, traceSpacingMm, drillToCopperMm, viaToTraceMm, tier]);

  const allDrcRules: DrcRuleResult[] = useMemo(() => {
    return [annularResult, ...geometryResults];
  }, [annularResult, geometryResults]);

  const totalPass = allDrcRules.filter((r) => r.status === 'pass').length;
  const totalFail = allDrcRules.filter((r) => r.status === 'fail').length;
  const totalMarginal = allDrcRules.filter((r) => r.status === 'marginal').length;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('clearance')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'clearance'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Clearance & Creepage (IPC-2221B / IEC 60664)</span>
        </button>
        <button
          onClick={() => setActiveTab('drc')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'drc'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Manufacturing DRC & Annular Ring Check</span>
        </button>
      </div>

      {activeTab === 'clearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Voltage & Standards Architecture</span>
              </h3>

              {/* Standard Selector */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Regulatory Standard Framework
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setStandard('IPC_2221B')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      standard === 'IPC_2221B'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    IPC-2221B Table 6-1
                  </button>
                  <button
                    onClick={() => setStandard('IEC_60664_1')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      standard === 'IEC_60664_1'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    IEC 60664-1 Insulation
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Peak Working Voltage (Volts DC or AC Peak)
                </label>
                <input
                  type="number"
                  step="5"
                  min="1"
                  value={voltagePeak}
                  onChange={(e) => setVoltagePeak(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Conductor Placement & Protection
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as ConductorLocation)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="external_coated">External with Permanent Solder Mask / Conformal Coat</option>
                  <option value="external_uncoated">External Bare / Uncoated Conductors</option>
                  <option value="internal">Internal Layer (Encapsulated in Prepreg/Core)</option>
                </select>
              </div>

              {standard === 'IEC_60664_1' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Pollution Degree
                    </label>
                    <select
                      value={pollutionDegree}
                      onChange={(e) => setPollutionDegree(parseInt(e.target.value) as PollutionDegree)}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value={1}>Degree 1 (Cleanroom / Hermetic)</option>
                      <option value={2}>Degree 2 (Commercial / Office / Lab)</option>
                      <option value={3}>Degree 3 (Industrial / Harsh Dust)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      CTI Material Group
                    </label>
                    <select
                      value={materialGroup}
                      onChange={(e) => setMaterialGroup(e.target.value as CtiMaterialGroup)}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="group_I">Group I (CTI ≥ 600)</option>
                      <option value="group_II">Group II (400 ≤ CTI &lt; 600)</option>
                      <option value="group_IIIa">Group IIIa (175 ≤ CTI &lt; 400, FR-4)</option>
                      <option value="group_IIIb">Group IIIb (100 ≤ CTI &lt; 175)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Operating Altitude (meters above sea level)
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  max="10000"
                  value={altitudeMeters}
                  onChange={(e) => setAltitudeMeters(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Altitudes &gt; 2,000 m require air breakdown clearance derating (IEC 60664-1 Table A.2).
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={clearanceResult} />
          </div>
        </div>
      )}

      {/* Tab 2: DRC Rules */}
      {activeTab === 'drc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-primary" />
                    <span>Fabrication Capability Tier</span>
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTier('standard')}
                    className={`py-2 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                      tier === 'standard'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Standard (5/5 mil)
                  </button>
                  <button
                    onClick={() => setTier('advanced')}
                    className={`py-2 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                      tier === 'advanced'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Advanced (3.5/3.5)
                  </button>
                  <button
                    onClick={() => setTier('leading_edge')}
                    className={`py-2 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                      tier === 'leading_edge'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    HDI (2.5/2.5 mil)
                  </button>
                </div>

                <div className="pt-2 border-t border-border space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                    Trace & Clearance Geometry
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Trace Width (mm)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.02"
                        value={traceWidthMm}
                        onChange={(e) => setTraceWidthMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Trace Spacing (mm)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.02"
                        value={traceSpacingMm}
                        onChange={(e) => setTraceSpacingMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Drill-to-Copper (mm)
                      </label>
                      <input
                        type="number"
                        step="0.02"
                        min="0.05"
                        value={drillToCopperMm}
                        onChange={(e) => setDrillToCopperMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Via-to-Trace (mm)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.02"
                        value={viaToTraceMm}
                        onChange={(e) => setViaToTraceMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                    Via Annular Ring Parameters
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Pad Dia (mm)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        value={padDiameterMm}
                        onChange={(e) => setPadDiameterMm(Math.max(0.05, parseFloat(e.target.value) || 0.05))}
                        className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Drill Dia (mm)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        value={drillDiameterMm}
                        onChange={(e) => setDrillDiameterMm(Math.max(0.05, parseFloat(e.target.value) || 0.05))}
                        className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                        IPC Class
                      </label>
                      <select
                        value={ipcClass}
                        onChange={(e) => setIpcClass(e.target.value as IpcClass)}
                        className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="class1">Class 1</option>
                        <option value="class2">Class 2</option>
                        <option value="class3">Class 3</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Dashboard */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-card border border-border rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-base font-semibold text-foreground">
                    DRC Audit Summary
                  </h3>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold">
                      {totalPass} Passed
                    </span>
                    {totalMarginal > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold">
                        {totalMarginal} Marginal
                      </span>
                    )}
                    {totalFail > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold">
                        {totalFail} Failed
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {allDrcRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs space-y-1 transition-all ${
                        rule.status === 'pass'
                          ? 'bg-emerald-950/20 border-emerald-800/40'
                          : rule.status === 'marginal'
                          ? 'bg-amber-950/20 border-amber-800/40'
                          : 'bg-rose-950/20 border-rose-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center space-x-1.5">
                          {rule.status === 'pass' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : rule.status === 'marginal' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                          <span>{rule.ruleName}</span>
                        </span>

                        <span
                          className={`uppercase font-bold text-[10px] px-2 py-0.5 rounded ${
                            rule.status === 'pass'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : rule.status === 'marginal'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {rule.status}
                        </span>
                      </div>

                      <p className="text-muted-foreground pl-5.5">{rule.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
