import React, { useState, useMemo } from 'react';
import {
  calculateMicrostripImpedance,
  synthesizeMicrostripWidth,
  calculateStriplineImpedance,
  synthesizeStriplineWidth,
  calculateCoplanarWaveguideImpedance,
} from '../../engines/pcb/transmission-lines';
import { ResultCard } from '../common/ResultCard';
import { Radio, Layers, Sliders, ShieldCheck } from 'lucide-react';

export const ControlledImpedanceTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'microstrip' | 'stripline' | 'cpwg'>('microstrip');

  // Microstrip State
  const [msTargetZ0, setMsTargetZ0] = useState<number>(50.0);
  const [msWidthMm, setMsWidthMm] = useState<number>(0.35);
  const [msHeightMm, setMsHeightMm] = useState<number>(0.20);
  const [msThicknessUm, setMsThicknessUm] = useState<number>(35.0);
  const [msEr, setMsEr] = useState<number>(4.2);

  const msResult = useMemo(() => {
    return calculateMicrostripImpedance({
      traceWidthMeters: msWidthMm * 1e-3,
      dielectricHeightMeters: msHeightMm * 1e-3,
      copperThicknessMeters: msThicknessUm * 1e-6,
      relativePermittivityEr: msEr,
    });
  }, [msWidthMm, msHeightMm, msThicknessUm, msEr]);

  const synthesizedMs = useMemo(() => {
    return synthesizeMicrostripWidth(msTargetZ0, msHeightMm * 1e-3, msThicknessUm * 1e-6, msEr);
  }, [msTargetZ0, msHeightMm, msThicknessUm, msEr]);

  // Stripline State
  const [slTargetZ0, setSlTargetZ0] = useState<number>(50.0);
  const [slWidthMm, setSlWidthMm] = useState<number>(0.25);
  const [slPlaneSpacingMm, setSlPlaneSpacingMm] = useState<number>(0.60);
  const [slThicknessUm, setSlThicknessUm] = useState<number>(17.5);
  const [slEr, setSlEr] = useState<number>(4.2);

  const slResult = useMemo(() => {
    return calculateStriplineImpedance({
      traceWidthMeters: slWidthMm * 1e-3,
      groundPlaneSpacingMeters: slPlaneSpacingMm * 1e-3,
      copperThicknessMeters: slThicknessUm * 1e-6,
      relativePermittivityEr: slEr,
    });
  }, [slWidthMm, slPlaneSpacingMm, slThicknessUm, slEr]);

  const synthesizedSl = useMemo(() => {
    return synthesizeStriplineWidth(slTargetZ0, slPlaneSpacingMm * 1e-3, slThicknessUm * 1e-6, slEr);
  }, [slTargetZ0, slPlaneSpacingMm, slThicknessUm, slEr]);

  // GCPW State
  const [cpwWidthMm, setCpwWidthMm] = useState<number>(0.40);
  const [cpwGapMm, setCpwGapMm] = useState<number>(0.25);
  const [cpwHeightMm, setCpwHeightMm] = useState<number>(0.50);
  const [cpwEr, setCpwEr] = useState<number>(4.2);

  const cpwResult = useMemo(() => {
    return calculateCoplanarWaveguideImpedance({
      traceWidthMeters: cpwWidthMm * 1e-3,
      gapMeters: cpwGapMm * 1e-3,
      dielectricHeightMeters: cpwHeightMm * 1e-3,
      copperThicknessMeters: 35e-6,
      relativePermittivityEr: cpwEr,
    });
  }, [cpwWidthMm, cpwGapMm, cpwHeightMm, cpwEr]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('microstrip')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'microstrip'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Surface Microstrip (Z₀)</span>
        </button>
        <button
          onClick={() => setActiveTab('stripline')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stripline'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Symmetric Stripline (Z₀)</span>
        </button>
        <button
          onClick={() => setActiveTab('cpwg')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'cpwg'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Grounded CPW (CPWG)</span>
        </button>
      </div>

      {/* Tab 1: Surface Microstrip */}
      {activeTab === 'microstrip' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Radio className="w-4 h-4 text-primary" />
                <span>Microstrip Geometry Parameters</span>
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
                    value={msWidthMm}
                    onChange={(e) => setMsWidthMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(msWidthMm / 0.0254).toFixed(1)} mils
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Dielectric Height H (mm)
                  </label>
                  <input
                    type="number"
                    step="0.02"
                    min="0.05"
                    value={msHeightMm}
                    onChange={(e) => setMsHeightMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(msHeightMm / 0.0254).toFixed(1)} mils (prepreg to L2 GND)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Copper Thickness T (µm)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    value={msThicknessUm}
                    onChange={(e) => setMsThicknessUm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    35 µm (1 oz) / 17.5 µm (0.5 oz)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Relative Permittivity (ε_r)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    value={msEr}
                    onChange={(e) => setMsEr(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Standard FR-4: ~4.2 to 4.4
                  </p>
                </div>
              </div>

              {/* Inverse Synthesizer Card */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Target Width Synthesizer
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Target Z₀:</span>
                    <input
                      type="number"
                      step="5"
                      min="20"
                      max="120"
                      value={msTargetZ0}
                      onChange={(e) => setMsTargetZ0(parseFloat(e.target.value) || 50)}
                      className="w-16 bg-background border border-input rounded px-2 py-1 text-xs text-foreground text-center"
                    />
                    <span className="text-xs text-muted-foreground">Ω</span>
                  </div>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Synthesized Required Width:</div>
                    <div className="text-lg font-bold text-primary">
                      {synthesizedMs.widthMm.toFixed(3)} mm ({synthesizedMs.widthMils.toFixed(1)} mils)
                    </div>
                  </div>
                  <button
                    onClick={() => setMsWidthMm(parseFloat(synthesizedMs.widthMm.toFixed(3)))}
                    className="py-1.5 px-3 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 transition-colors"
                  >
                    Apply Width
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={msResult} />
          </div>
        </div>
      )}

      {/* Tab 2: Symmetric Stripline */}
      {activeTab === 'stripline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Centered Stripline Parameters</span>
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
                    value={slWidthMm}
                    onChange={(e) => setSlWidthMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(slWidthMm / 0.0254).toFixed(1)} mils
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Ground Plane Spacing b (mm)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={slPlaneSpacingMm}
                    onChange={(e) => setSlPlaneSpacingMm(Math.max(0.05, parseFloat(e.target.value) || 0.05))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total dielectric height between upper & lower GND
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Copper Thickness T (µm)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    value={slThicknessUm}
                    onChange={(e) => setSlThicknessUm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Relative Permittivity (ε_r)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    value={slEr}
                    onChange={(e) => setSlEr(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Stripline Synthesizer */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Target Stripline Width
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Target Z₀:</span>
                    <input
                      type="number"
                      step="5"
                      min="20"
                      max="120"
                      value={slTargetZ0}
                      onChange={(e) => setSlTargetZ0(parseFloat(e.target.value) || 50)}
                      className="w-16 bg-background border border-input rounded px-2 py-1 text-xs text-foreground text-center"
                    />
                    <span className="text-xs text-muted-foreground">Ω</span>
                  </div>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Synthesized Required Width:</div>
                    <div className="text-lg font-bold text-primary">
                      {synthesizedSl.widthMm.toFixed(3)} mm ({synthesizedSl.widthMils.toFixed(1)} mils)
                    </div>
                  </div>
                  <button
                    onClick={() => setSlWidthMm(parseFloat(synthesizedSl.widthMm.toFixed(3)))}
                    className="py-1.5 px-3 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 transition-colors"
                  >
                    Apply Width
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={slResult} />
          </div>
        </div>
      )}

      {/* Tab 3: Grounded CPW */}
      {activeTab === 'cpwg' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Grounded Coplanar Waveguide Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Trace Width W (mm)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={cpwWidthMm}
                    onChange={(e) => setCpwWidthMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(cpwWidthMm / 0.0254).toFixed(1)} mils
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Ground Gap S (mm)
                  </label>
                  <input
                    type="number"
                    step="0.02"
                    min="0.05"
                    value={cpwGapMm}
                    onChange={(e) => setCpwGapMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(cpwGapMm / 0.0254).toFixed(1)} mils (coplanar pour gap)
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
                    step="0.05"
                    min="0.05"
                    value={cpwHeightMm}
                    onChange={(e) => setCpwHeightMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Permittivity (ε_r)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    value={cpwEr}
                    onChange={(e) => setCpwEr(Math.max(1.0, parseFloat(e.target.value) || 1.0))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={cpwResult} />
          </div>
        </div>
      )}
    </div>
  );
};
