import React, { useState } from 'react';
import {
  IPC7351_LAND_PATTERNS,
  COPPER_FOIL_REFERENCE,
  FABRICATION_RULE_TIERS,
} from '../../engines/pcb/pcb-reference-data';
import { DIELECTRIC_MATERIALS } from '../../engines/pcb/stackup-dielectrics';
import { BookOpen, Layers, Database, ShieldCheck, Box } from 'lucide-react';

export const PcbReferenceTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'copper' | 'smd' | 'drc-matrix' | 'dielectrics'>('copper');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('copper')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'copper'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Copper Foil Weights & Resistance</span>
        </button>
        <button
          onClick={() => setActiveTab('smd')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'smd'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>SMD Land Patterns (IPC-7351)</span>
        </button>
        <button
          onClick={() => setActiveTab('drc-matrix')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'drc-matrix'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Fabrication Capability Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('dielectrics')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'dielectrics'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Dielectric Substrates Matrix</span>
        </button>
      </div>

      {/* Tab 1: Copper Foil */}
      {activeTab === 'copper' && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Standard PCB Copper Foil Specifications</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Foil Weight</th>
                  <th className="py-2.5 px-3">Nominal Thickness</th>
                  <th className="py-2.5 px-3">Min Thickness (IPC-6012)</th>
                  <th className="py-2.5 px-3 text-cyan-400">Sheet Res. @ 20°C (R_□)</th>
                  <th className="py-2.5 px-3 text-amber-400">Sheet Res. @ 100°C (R_□)</th>
                  <th className="py-2.5 px-3">Ampacity Guideline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COPPER_FOIL_REFERENCE.map((foil) => (
                  <tr key={foil.ozWeight} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-semibold text-foreground">{foil.ozWeight} oz/ft²</td>
                    <td className="py-2.5 px-3 font-mono">{foil.nominalUm} µm ({foil.nominalMils} mil)</td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">{foil.minThicknessUm} µm</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{foil.sheetResistance20CMilliOhms.toFixed(3)} mΩ/□</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">{foil.sheetResistance100CMilliOhms.toFixed(3)} mΩ/□</td>
                    <td className="py-2.5 px-3">{foil.currentDensityLimitAmpsPerMm2} A/mm² max continuous</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: SMD Land Patterns */}
      {activeTab === 'smd' && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <Box className="w-4 h-4 text-primary" />
              <span>IPC-7351 Nominal Land Patterns Reference</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Component Package</th>
                  <th className="py-2.5 px-3">Codes (Imp / Metric)</th>
                  <th className="py-2.5 px-3 text-cyan-400">Pad Width X (mm)</th>
                  <th className="py-2.5 px-3 text-cyan-400">Pad Height Y (mm)</th>
                  <th className="py-2.5 px-3 text-amber-400">Pad Spacing S (mm)</th>
                  <th className="py-2.5 px-3">Total Footprint Span</th>
                  <th className="py-2.5 px-3">Application Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {IPC7351_LAND_PATTERNS.map((pkg) => (
                  <tr key={pkg.name} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{pkg.name}</td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">{pkg.imperialCode} / {pkg.metricCode}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{pkg.padWidthMm.toFixed(2)} mm</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{pkg.padHeightMm.toFixed(2)} mm</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">{pkg.padSpacingMm.toFixed(2)} mm</td>
                    <td className="py-2.5 px-3 font-mono">{pkg.totalSpanMm.toFixed(2)} mm</td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-xs">{pkg.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: DRC Capability Matrix */}
      {activeTab === 'drc-matrix' && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>PCB Manufacturer Design Rule Tiers</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Capability Tier</th>
                  <th className="py-2.5 px-3 text-cyan-400">Min Trace / Space</th>
                  <th className="py-2.5 px-3 text-amber-400">Min Drill Hole</th>
                  <th className="py-2.5 px-3">Min Annular Ring</th>
                  <th className="py-2.5 px-3">Aspect Ratio</th>
                  <th className="py-2.5 px-3">Cost Multiplier</th>
                  <th className="py-2.5 px-3">Target Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FABRICATION_RULE_TIERS.map((tier) => (
                  <tr key={tier.tierName} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{tier.tierName}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{tier.minTraceWidthMm} mm ({tier.minTraceWidthMil} mil)</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">{tier.minDrillHoleMm} mm ({tier.minDrillHoleMil} mil)</td>
                    <td className="py-2.5 px-3 font-mono">{tier.minAnnularRingMm} mm ({tier.minAnnularRingMil} mil)</td>
                    <td className="py-2.5 px-3 font-mono">{tier.maxAspectRatio}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-400">{tier.relativeCostFactor}</td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-xs">{tier.typicalApplication}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            Note: Representative industry engineering design rule profiles. Exact process capabilities, minimum drill sizes, aspect ratios, and cost multipliers depend on specific fabrication house equipment and order volume.
          </p>
        </div>
      )}

      {/* Tab 4: Dielectrics Matrix */}
      {activeTab === 'dielectrics' && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <Database className="w-4 h-4 text-primary" />
              <span>High-Frequency & Standard PCB Substrate Materials</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Substrate Material</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-cyan-400">Permittivity (ε_r @ 1GHz)</th>
                  <th className="py-2.5 px-3 text-amber-400">Loss Tangent (tan δ @ 1GHz)</th>
                  <th className="py-2.5 px-3">Glass Temp (T_g)</th>
                  <th className="py-2.5 px-3">Dielectric Strength</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DIELECTRIC_MATERIALS.map((mat) => (
                  <tr key={mat.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{mat.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground capitalize">{mat.category.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">{mat.relativePermittivityEr.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">{mat.lossTangent.toFixed(4)}</td>
                    <td className="py-2.5 px-3">{mat.glassTransitionTempC ? `${mat.glassTransitionTempC}°C` : 'N/A'}</td>
                    <td className="py-2.5 px-3">{mat.typicalDielectricStrengthKvPerMm} kV/mm</td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-xs">{mat.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            Note: Relative permittivity (ε_r) and loss tangent (tan δ) values are nominal engineering reference values evaluated at ~1 GHz and 25°C for preliminary simulation and stackup design. Exact Dk/Df values in production vary by resin content, glass weave style (e.g., 1080 vs 7628), operating frequency, and temperature.
          </p>
        </div>
      )}
    </div>
  );
};
