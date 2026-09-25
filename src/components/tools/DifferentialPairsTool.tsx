import React, { useState, useMemo } from 'react';
import {
  calculateDifferentialMicrostrip,
  calculateIntraPairSkew,
  HIGH_SPEED_SKEW_LIMITS,
  HighSpeedSkewLimit,
} from '../../engines/pcb/differential-pairs';
import { ResultCard } from '../common/ResultCard';
import { GitCommit, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

export const DifferentialPairsTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'impedance' | 'skew'>('impedance');

  // Differential Microstrip State
  const [diffWidthMm, setDiffWidthMm] = useState<number>(0.30);
  const [diffSpacingMm, setDiffSpacingMm] = useState<number>(0.20);
  const [diffHeightMm, setDiffHeightMm] = useState<number>(0.20);
  const [diffThicknessUm, setDiffThicknessUm] = useState<number>(35.0);
  const [diffEr, setDiffEr] = useState<number>(4.2);

  const diffResult = useMemo(() => {
    return calculateDifferentialMicrostrip({
      traceWidthMeters: diffWidthMm * 1e-3,
      pairSpacingMeters: diffSpacingMm * 1e-3,
      dielectricHeightMeters: diffHeightMm * 1e-3,
      copperThicknessMeters: diffThicknessUm * 1e-6,
      relativePermittivityEr: diffEr,
    });
  }, [diffWidthMm, diffSpacingMm, diffHeightMm, diffThicknessUm, diffEr]);

  // Skew State
  const [posLengthMm, setPosLengthMm] = useState<number>(100.5);
  const [negLengthMm, setNegLengthMm] = useState<number>(100.0);
  const [delayPsPerInch, setDelayPsPerInch] = useState<number>(150.0);

  const skewResult = useMemo(() => {
    return calculateIntraPairSkew({
      positiveTraceLengthMm: posLengthMm,
      negativeTraceLengthMm: negLengthMm,
      delayPsPerInch,
    });
  }, [posLengthMm, negLengthMm, delayPsPerInch]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('impedance')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'impedance'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Differential Impedance (Z_diff & Z_odd)</span>
        </button>
        <button
          onClick={() => setActiveTab('skew')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'skew'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Intra-Pair Skew & Length Matching</span>
        </button>
      </div>

      {activeTab === 'impedance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <GitCommit className="w-4 h-4 text-primary" />
                <span>Edge-Coupled Microstrip Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Trace Width W (mm)
                  </label>
                  <input
                    type="number"
                    step="0.02"
                    min="0.05"
                    value={diffWidthMm}
                    onChange={(e) => setDiffWidthMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(diffWidthMm / 0.0254).toFixed(1)} mils
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Edge Spacing S (mm)
                  </label>
                  <input
                    type="number"
                    step="0.02"
                    min="0.05"
                    value={diffSpacingMm}
                    onChange={(e) => setDiffSpacingMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(diffSpacingMm / 0.0254).toFixed(1)} mils (inter-trace gap)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Dielectric Height H (mm)
                  </label>
                  <input
                    type="number"
                    step="0.02"
                    min="0.05"
                    value={diffHeightMm}
                    onChange={(e) => setDiffHeightMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Distance to underlying reference plane
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Permittivity (ε_r)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    value={diffEr}
                    onChange={(e) => setDiffEr(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Copper Thickness T (µm)
                </label>
                <input
                  type="number"
                  step="5"
                  min="5"
                  value={diffThicknessUm}
                  onChange={(e) => setDiffThicknessUm(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Differential Cross-Section SVG */}
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                Edge-Coupled Differential Pair Geometry
              </h4>
              <div className="w-full h-36 bg-muted/20 border border-border rounded-lg flex items-center justify-center p-2">
                <svg className="w-64 h-28" viewBox="0 0 240 100">
                  {/* Ground Plane */}
                  <rect x="10" y="75" width="220" height="8" fill="#d97706" rx="1" />
                  <text x="120" y="93" fill="#718096" fontSize="9" textAnchor="middle">Reference Ground Plane</text>

                  {/* Dielectric Substrate */}
                  <rect x="10" y="35" width="220" height="40" fill="#1e293b" opacity="0.6" />

                  {/* Trace D+ */}
                  <rect x="65" y="25" width="45" height="10" fill="#f59e0b" rx="1" />
                  <text x="87" y="21" fill="#f59e0b" fontSize="8" textAnchor="middle">D+ (W)</text>

                  {/* Trace D- */}
                  <rect x="130" y="25" width="45" height="10" fill="#f59e0b" rx="1" />
                  <text x="152" y="21" fill="#f59e0b" fontSize="8" textAnchor="middle">D− (W)</text>

                  {/* Gap S Annotation */}
                  <line x1="110" y1="30" x2="130" y2="30" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="120" y="42" fill="#38bdf8" fontSize="8" textAnchor="middle">S</text>

                  {/* Height H Annotation */}
                  <line x1="45" y1="35" x2="45" y2="75" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="35" y="58" fill="#a855f7" fontSize="8" textAnchor="middle">H</text>
                </svg>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={diffResult} />
          </div>
        </div>
      )}

      {activeTab === 'skew' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Trace Length & Propagation Delay</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Positive Trace D+ Length (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={posLengthMm}
                    onChange={(e) => setPosLengthMm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(posLengthMm / 25.4).toFixed(3)} inches
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Negative Trace D− Length (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={negLengthMm}
                    onChange={(e) => setNegLengthMm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(negLengthMm / 25.4).toFixed(3)} inches
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Substrate Propagation Delay (ps / inch)
                </label>
                <input
                  type="number"
                  step="5"
                  min="50"
                  max="300"
                  value={delayPsPerInch}
                  onChange={(e) => setDelayPsPerInch(Math.max(10, parseFloat(e.target.value) || 10))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  FR-4 Microstrip: ~140–160 ps/in | Stripline: ~170–185 ps/in
                </p>
              </div>
            </div>

            {/* Protocol Skew Budget Reference Table */}
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                  High-Speed Bus Intra-Pair Skew Tolerances & Impedance Targets
                </h4>
                <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                  Informational Reference Guidelines
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="py-2 px-3">Protocol</th>
                      <th className="py-2 px-3">Bit Rate</th>
                      <th className="py-2 px-3 text-amber-400">Target Z_diff</th>
                      <th className="py-2 px-3 text-cyan-400">Max Skew</th>
                      <th className="py-2 px-3">Max Delta (FR-4)</th>
                      <th className="py-2 px-3">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {HIGH_SPEED_SKEW_LIMITS.map((proto: HighSpeedSkewLimit) => (
                      <tr key={proto.protocol} className="hover:bg-muted/20">
                        <td className="py-2 px-3 font-medium text-foreground">{proto.protocol}</td>
                        <td className="py-2 px-3 text-muted-foreground">{proto.bitRate}</td>
                        <td className="py-2 px-3 font-mono font-medium text-amber-400">{proto.targetZdiffOhms} Ω</td>
                        <td className="py-2 px-3 font-semibold text-cyan-400">{proto.maxSkewPs} ps</td>
                        <td className="py-2 px-3">{proto.maxDeltaMm.toFixed(2)} mm ({(proto.maxDeltaMm / 0.0254).toFixed(0)} mil)</td>
                        <td className="py-2 px-3 text-[10px] text-muted-foreground">
                          {proto.budgetType === 'specification_limit' ? 'Spec Limit' : 'Routing Target'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                Note: Values represent typical hardware layout design targets and reference budgets. Exact skew allowances and jitter allocations depend on complete channel loss budgets, IC transceiver specifications, and standard revisions.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={skewResult} />
          </div>
        </div>
      )}
    </div>
  );
};
