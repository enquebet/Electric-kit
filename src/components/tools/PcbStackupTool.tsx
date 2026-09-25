import React, { useState, useMemo } from 'react';
import {
  DIELECTRIC_MATERIALS,
  STANDARD_STACKUP_PRESETS,
  calculatePropagationDelay,
  PcbStackupPreset,
  DielectricMaterial,
} from '../../engines/pcb/stackup-dielectrics';
import { ResultCard } from '../common/ResultCard';
import { Layers, Zap, Database, Clock, Info } from 'lucide-react';

export const PcbStackupTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stackup' | 'materials' | 'propagation'>('stackup');

  // Stackup Visualizer State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('4layer_standard');
  const currentPreset = useMemo(() => {
    return STANDARD_STACKUP_PRESETS.find((p) => p.id === selectedPresetId) || STANDARD_STACKUP_PRESETS[1];
  }, [selectedPresetId]);

  const totalCalculatedThicknessMm = useMemo(() => {
    return currentPreset.layers.reduce((acc, l) => acc + l.thicknessMeters * 1e3, 0);
  }, [currentPreset]);

  // Propagation Delay Calculator State
  const [selectedMatId, setSelectedMatId] = useState<string>('fr4_hightg');
  const [geomType, setGeomType] = useState<'microstrip' | 'stripline'>('microstrip');
  const [propWidthMm, setPropWidthMm] = useState<number>(0.3);
  const [propHeightMm, setPropHeightMm] = useState<number>(0.2);
  const [propLengthMm, setPropLengthMm] = useState<number>(100.0);

  const selectedMaterial = useMemo(() => {
    return DIELECTRIC_MATERIALS.find((m) => m.id === selectedMatId) || DIELECTRIC_MATERIALS[0];
  }, [selectedMatId]);

  const delayResult = useMemo(() => {
    return calculatePropagationDelay({
      relativePermittivityEr: selectedMaterial.relativePermittivityEr,
      geometryType: geomType,
      traceWidthMeters: propWidthMm * 1e-3,
      dielectricHeightMeters: propHeightMm * 1e-3,
      traceLengthMeters: propLengthMm * 1e-3,
    });
  }, [selectedMaterial, geomType, propWidthMm, propHeightMm, propLengthMm]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('stackup')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stackup'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Layer Stackup Visualizer</span>
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'materials'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Dielectric Materials Reference</span>
        </button>
        <button
          onClick={() => setActiveTab('propagation')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'propagation'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Propagation Velocity & Delay</span>
        </button>
      </div>

      {/* Tab 1: Stackup Visualizer */}
      {activeTab === 'stackup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Standard Stackup Preset</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Stackup Configuration
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STANDARD_STACKUP_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentPreset.description}
                </p>
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-md text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nominal Board Thickness:</span>
                  <span className="font-semibold text-foreground">{totalCalculatedThicknessMm.toFixed(3)} mm ({(totalCalculatedThicknessMm / 0.0254).toFixed(1)} mil)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Copper Layers:</span>
                  <span className="font-semibold text-foreground">{currentPreset.layerCount} Layers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground">
                Stackup Cross-Section Diagram
              </h3>

              {/* Layer Stackup Render */}
              <div className="space-y-1.5 font-mono text-xs">
                {currentPreset.layers.map((layer, idx) => {
                  let bgColor = 'bg-slate-700 text-slate-200';
                  let borderColor = 'border-slate-600';
                  if (layer.type === 'copper') {
                    if (layer.role === 'ground_plane') {
                      bgColor = 'bg-emerald-950/80 text-emerald-300';
                      borderColor = 'border-emerald-700/60';
                    } else if (layer.role === 'power_plane') {
                      bgColor = 'bg-amber-950/80 text-amber-300';
                      borderColor = 'border-amber-700/60';
                    } else {
                      bgColor = 'bg-orange-950/80 text-orange-300';
                      borderColor = 'border-orange-700/60';
                    }
                  } else if (layer.type === 'soldermask') {
                    bgColor = 'bg-emerald-900/40 text-emerald-400';
                    borderColor = 'border-emerald-800/40';
                  } else if (layer.type === 'core') {
                    bgColor = 'bg-slate-800 text-slate-300';
                    borderColor = 'border-slate-700';
                  } else if (layer.type === 'prepreg') {
                    bgColor = 'bg-slate-800/70 text-slate-400';
                    borderColor = 'border-slate-700/60';
                  }

                  return (
                    <div
                      key={layer.id}
                      className={`flex items-center justify-between p-2.5 rounded border ${bgColor} ${borderColor} transition-all`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] text-muted-foreground w-6">#{idx + 1}</span>
                        <span className="font-semibold">{layer.name}</span>
                        {layer.role && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-muted-foreground uppercase">
                            {layer.role.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span>{(layer.thicknessMeters * 1e3).toFixed(3)} mm</span>
                        <span className="text-muted-foreground ml-2 text-[10px]">
                          ({(layer.thicknessMeters / 0.0000254).toFixed(1)} mil)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-orange-700 rounded-sm inline-block"></span>
                    <span>Signal</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-emerald-700 rounded-sm inline-block"></span>
                    <span>GND Plane</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-amber-700 rounded-sm inline-block"></span>
                    <span>PWR Plane</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-slate-700 rounded-sm inline-block"></span>
                    <span>Dielectric</span>
                  </span>
                </div>
                <span className="font-semibold text-foreground">Total: {totalCalculatedThicknessMm.toFixed(3)} mm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Materials Reference */}
      {activeTab === 'materials' && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <Database className="w-4 h-4 text-primary" />
              <span>PCB Substrate Dielectric Properties (1 GHz Reference)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Substrate Material</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-cyan-400">Permittivity (ε_r)</th>
                  <th className="py-2.5 px-3 text-amber-400">Loss Tangent (tan δ)</th>
                  <th className="py-2.5 px-3">Glass Temp (T_g)</th>
                  <th className="py-2.5 px-3">Dielectric Strength</th>
                  <th className="py-2.5 px-3">Primary Application</th>
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
        </div>
      )}

      {/* Tab 3: Propagation Velocity & Delay */}
      {activeTab === 'propagation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Signal Propagation Parameters</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Substrate Dielectric
                </label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {DIELECTRIC_MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (ε_r = {m.relativePermittivityEr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Transmission Line Routing Topology
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGeomType('microstrip')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      geomType === 'microstrip'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Surface Microstrip (Mixed Air/FR4)
                  </button>
                  <button
                    onClick={() => setGeomType('stripline')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      geomType === 'stripline'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Embedded Stripline (Homogeneous)
                  </button>
                </div>
              </div>

              {geomType === 'microstrip' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Trace Width W (mm)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      value={propWidthMm}
                      onChange={(e) => setPropWidthMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Dielectric Height H (mm)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      value={propHeightMm}
                      onChange={(e) => setPropHeightMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Trace Physical Length (mm)
                </label>
                <input
                  type="number"
                  step="5"
                  min="1"
                  value={propLengthMm}
                  onChange={(e) => setPropLengthMm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(propLengthMm / 25.4).toFixed(2)} inches
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={delayResult} />
          </div>
        </div>
      )}
    </div>
  );
};
