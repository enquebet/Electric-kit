import React, { useState, useMemo } from 'react';
import {
  calculateViaProperties,
  calculateViaArray,
} from '../../engines/pcb/vias';
import { ResultCard } from '../common/ResultCard';
import { Disc, Grid, Thermometer, ShieldCheck, Zap, Layers } from 'lucide-react';

export const ViaAmpacityTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'array'>('single');

  // Single Via State
  const [drillMm, setDrillMm] = useState<number>(0.3);
  const [padMm, setPadMm] = useState<number>(0.6);
  const [boardThicknessMm, setBoardThicknessMm] = useState<number>(1.6);
  const [platingThicknessUm, setPlatingThicknessUm] = useState<number>(25.0);
  const [temperatureC, setTemperatureC] = useState<number>(25.0);
  const [viaCurrentA, setViaCurrentA] = useState<number>(1.0);

  const viaResult = useMemo(() => {
    return calculateViaProperties({
      drillDiameterMeters: drillMm * 1e-3,
      padDiameterMeters: padMm * 1e-3,
      boardThicknessMeters: boardThicknessMm * 1e-3,
      platingThicknessMeters: platingThicknessUm * 1e-6,
      temperatureC,
      currentAmps: viaCurrentA,
    });
  }, [drillMm, padMm, boardThicknessMm, platingThicknessUm, temperatureC, viaCurrentA]);

  // Via Array State
  const [arrayTargetCurrent, setArrayTargetCurrent] = useState<number>(5.0);
  const [arrayTargetThermal, setArrayTargetThermal] = useState<number>(5.0);
  const [gridPitchMm, setGridPitchMm] = useState<number>(1.0);

  const arrayResult = useMemo(() => {
    return calculateViaArray({
      targetCurrentAmps: arrayTargetCurrent,
      targetThermalResistanceKPerW: arrayTargetThermal,
      singleViaProperties: {
        resistanceOhms: viaResult.outputs.resistanceOhms,
        thermalResistanceKPerW: viaResult.outputs.thermalResistanceKPerW,
        estimatedAmpacityAmps: viaResult.outputs.estimatedAmpacityAmps,
        drillDiameterMeters: drillMm * 1e-3,
      },
      gridPitchMeters: gridPitchMm * 1e-3,
    });
  }, [arrayTargetCurrent, arrayTargetThermal, viaResult, drillMm, gridPitchMm]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'single'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Disc className="w-4 h-4" />
          <span>Single Plated Via Geometry & Ampacity</span>
        </button>
        <button
          onClick={() => setActiveTab('array')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'array'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Thermal & Power Via Array Sizing</span>
        </button>
      </div>

      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Disc className="w-4 h-4 text-primary" />
                <span>Via Mechanical & Barrel Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Drill Diameter (mm)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="3.0"
                    value={drillMm}
                    onChange={(e) => setDrillMm(Math.max(0.05, parseFloat(e.target.value) || 0.05))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(drillMm / 0.0254).toFixed(1)} mils (drill size)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Outer Pad Diameter (mm)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.2"
                    max="5.0"
                    value={padMm}
                    onChange={(e) => setPadMm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(padMm / 0.0254).toFixed(1)} mils (copper annular land)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    PCB Board Thickness (mm)
                  </label>
                  <select
                    value={boardThicknessMm}
                    onChange={(e) => setBoardThicknessMm(parseFloat(e.target.value))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={0.8}>0.8 mm (Thin / 2-Layer Flex-Rigid)</option>
                    <option value={1.0}>1.0 mm (Compact Handheld)</option>
                    <option value={1.6}>1.6 mm (Standard 4/6-Layer)</option>
                    <option value={2.0}>2.0 mm (Heavy Backplane)</option>
                    <option value={2.4}>2.4 mm (High-Power Server)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Barrel Plating Thickness (µm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="70"
                    value={platingThicknessUm}
                    onChange={(e) => setPlatingThicknessUm(Math.max(5, parseFloat(e.target.value) || 5))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Standard IPC Class 2: 20–25 µm (1.0 mil)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Operating Current (A)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={viaCurrentA}
                    onChange={(e) => setViaCurrentA(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Operating Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={temperatureC}
                    onChange={(e) => setTemperatureC(parseFloat(e.target.value) || 25)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Interactive SVG Diagram */}
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                Plated Through-Hole Cross-Section Diagram
              </h4>
              <div className="w-full h-44 bg-muted/20 border border-border rounded-lg flex items-center justify-center p-2 relative">
                <svg className="w-64 h-36" viewBox="0 0 240 140">
                  {/* FR4 Dielectric Core */}
                  <rect x="20" y="30" width="200" height="80" fill="#2d3748" rx="2" />
                  <text x="30" y="75" fill="#718096" fontSize="10" fontFamily="sans-serif">FR-4 Substrate ({boardThicknessMm} mm)</text>

                  {/* Top Copper Pad */}
                  <rect x="70" y="22" width="100" height="8" fill="#d97706" rx="1" />
                  {/* Bottom Copper Pad */}
                  <rect x="70" y="110" width="100" height="8" fill="#d97706" rx="1" />

                  {/* Via Plated Barrel (Copper Shell) */}
                  <rect x="95" y="22" width="50" height="96" fill="#f59e0b" />
                  {/* Hollow Drill Hole */}
                  <rect x="103" y="18" width="34" height="104" fill="#0f172a" />

                  {/* Annotations */}
                  <line x1="70" y1="16" x2="170" y2="16" stroke="#f59e0b" strokeWidth="1" />
                  <text x="120" y="12" fill="#f59e0b" fontSize="8" textAnchor="middle">Pad: {padMm} mm</text>

                  <line x1="103" y1="130" x2="137" y2="130" stroke="#38bdf8" strokeWidth="1" />
                  <text x="120" y="138" fill="#38bdf8" fontSize="8" textAnchor="middle">Hole: {(drillMm - 2 * platingThicknessUm * 1e-3).toFixed(2)} mm</text>
                </svg>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={viaResult} />
          </div>
        </div>
      )}

      {activeTab === 'array' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Grid className="w-4 h-4 text-primary" />
                <span>Thermal & Power Via Array Sizing</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Target Power Current (Amperes)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={arrayTargetCurrent}
                    onChange={(e) => setArrayTargetCurrent(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Continuous bus or MOSFET source/drain connection current.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Target Thermal Resistance R_θ (°C/W)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={arrayTargetThermal}
                    onChange={(e) => setArrayTargetThermal(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    QFN / DFN exposed power pad heat transfer to internal ground plane.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Grid Via Center-to-Center Pitch (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3.0"
                    value={gridPitchMm}
                    onChange={(e) => setGridPitchMm(Math.max(0.3, parseFloat(e.target.value) || 0.3))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Standard thermal via matrix pitch is typically 1.0 to 1.2 mm.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/40 border border-border rounded-lg p-4 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center space-x-2 font-medium text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Thermal Via Design Best Practice</span>
              </div>
              <p>
                Thermal vias under exposed ground pads should use 0.3 mm (12 mil) drill diameter to prevent solder wicking into holes during surface-mount reflow (or specify tented / plugged vias).
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={arrayResult} />
          </div>
        </div>
      )}
    </div>
  );
};
