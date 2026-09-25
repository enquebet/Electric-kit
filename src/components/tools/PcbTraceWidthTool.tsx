import React, { useState, useMemo } from 'react';
import {
  calculateTraceResistance,
  calculateIpcTraceAmpacity,
  STANDARD_COPPER_WEIGHTS,
  generateTraceResistanceVsWidthData,
  TraceLayerType,
} from '../../engines/pcb/copper-trace';
import { ResultCard } from '../common/ResultCard';
import { Layers, Thermometer, Zap, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export const PcbTraceWidthTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ampacity' | 'resistance' | 'curves'>('ampacity');

  // Ampacity & Width Calculator State
  const [calcMode, setCalcMode] = useState<'solve_current' | 'solve_width'>('solve_width');
  const [layer, setLayer] = useState<TraceLayerType>('external');
  const [copperWeightOz, setCopperWeightOz] = useState<number>(1.0);
  const [traceWidthMm, setTraceWidthMm] = useState<number>(0.5);
  const [targetCurrentAmps, setTargetCurrentAmps] = useState<number>(2.0);
  const [tempRiseC, setTempRiseC] = useState<number>(10.0);

  // Selected copper thickness in meters
  const copperThicknessM = useMemo(() => {
    const selected = STANDARD_COPPER_WEIGHTS.find((w) => w.oz === copperWeightOz);
    return (selected ? selected.thicknessUm : 35.0) * 1e-6;
  }, [copperWeightOz]);

  const ampacityResult = useMemo(() => {
    if (calcMode === 'solve_current') {
      return calculateIpcTraceAmpacity({
        layer,
        thicknessMeters: copperThicknessM,
        widthMeters: traceWidthMm * 1e-3,
        tempRiseC,
      });
    } else {
      return calculateIpcTraceAmpacity({
        layer,
        thicknessMeters: copperThicknessM,
        currentAmps: targetCurrentAmps,
        tempRiseC,
      });
    }
  }, [calcMode, layer, copperThicknessM, traceWidthMm, targetCurrentAmps, tempRiseC]);

  // Resistance & Voltage Drop Calculator State
  const [traceLengthMm, setTraceLengthMm] = useState<number>(100.0);
  const [resTraceWidthMm, setResTraceWidthMm] = useState<number>(0.5);
  const [resCopperWeightOz, setResCopperWeightOz] = useState<number>(1.0);
  const [operatingTempC, setOperatingTempC] = useState<number>(25.0);
  const [loadCurrentAmps, setLoadCurrentAmps] = useState<number>(1.5);
  const [sourceVoltageVolts, setSourceVoltageVolts] = useState<number>(3.3);

  const resThicknessM = useMemo(() => {
    const selected = STANDARD_COPPER_WEIGHTS.find((w) => w.oz === resCopperWeightOz);
    return (selected ? selected.thicknessUm : 35.0) * 1e-6;
  }, [resCopperWeightOz]);

  const resistanceResult = useMemo(() => {
    return calculateTraceResistance({
      lengthMeters: traceLengthMm * 1e-3,
      widthMeters: resTraceWidthMm * 1e-3,
      thicknessMeters: resThicknessM,
      temperatureC: operatingTempC,
      currentAmps: loadCurrentAmps,
      sourceVoltage: sourceVoltageVolts,
    });
  }, [traceLengthMm, resTraceWidthMm, resThicknessM, operatingTempC, loadCurrentAmps, sourceVoltageVolts]);

  // Curve Generation State
  const [curveLengthMm, setCurveLengthMm] = useState<number>(100.0);
  const [curveTempC, setCurveTempC] = useState<number>(25.0);

  const curveData = useMemo(() => {
    return generateTraceResistanceVsWidthData(curveLengthMm * 1e-3, curveTempC, 0.1, 3.0, 25);
  }, [curveLengthMm, curveTempC]);

  const maxR = useMemo(() => {
    return Math.max(...curveData.map((d) => d.rHalfOz));
  }, [curveData]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('ampacity')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ampacity'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Thermometer className="w-4 h-4" />
          <span>Trace Current & Thermal (IPC-2221)</span>
        </button>
        <button
          onClick={() => setActiveTab('resistance')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'resistance'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Resistance & Voltage Drop</span>
        </button>
        <button
          onClick={() => setActiveTab('curves')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'curves'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Resistance vs. Width Curves</span>
        </button>
      </div>

      {/* Tab 1: Ampacity & Width */}
      {activeTab === 'ampacity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Trace Ampacity Parameters</span>
              </h3>

              {/* Mode Toggle */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Calculation Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCalcMode('solve_width')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      calcMode === 'solve_width'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Solve Width from Current
                  </button>
                  <button
                    onClick={() => setCalcMode('solve_current')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      calcMode === 'solve_current'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Solve Max Current from Width
                  </button>
                </div>
              </div>

              {/* Layer Placement */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Trace Layer Placement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLayer('external')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      layer === 'external'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    External Surface Layer (k = 0.048)
                  </button>
                  <button
                    onClick={() => setLayer('internal')}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      layer === 'internal'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Internal Sub-Layer (k = 0.024)
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Internal traces dissipate heat approximately half as fast due to insulating FR-4 encapsulation.
                </p>
              </div>

              {/* Copper Weight */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Copper Foil Weight (oz/ft²)
                </label>
                <select
                  value={copperWeightOz}
                  onChange={(e) => setCopperWeightOz(parseFloat(e.target.value))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STANDARD_COPPER_WEIGHTS.map((opt) => (
                    <option key={opt.oz} value={opt.oz}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Input based on Mode */}
              {calcMode === 'solve_width' ? (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Target Continuous Current (Amperes)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.05"
                    max="50"
                    value={targetCurrentAmps}
                    onChange={(e) => setTargetCurrentAmps(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Trace Width (mm)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="20"
                    value={traceWidthMm}
                    onChange={(e) => setTraceWidthMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(traceWidthMm / 0.0254).toFixed(1)} mils (thou)
                  </p>
                </div>
              )}

              {/* Allowed Temperature Rise */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Allowable Temperature Rise ΔT (°C)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="1"
                    value={tempRiseC}
                    onChange={(e) => setTempRiseC(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-sm font-semibold text-foreground w-14 text-right">
                    +{tempRiseC}°C
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10°C (Standard IPC)</span>
                  <span>20°C (High-Density)</span>
                  <span>45°C (Power Rails)</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/40 border border-border rounded-lg p-4 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center space-x-2 font-medium text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>IPC-2221 vs. IPC-2152 Engineering Note</span>
              </div>
              <p>
                IPC-2221 equations use empirical power-law relationships formulated for isolated traces in still air. Modern IPC-2152 guidelines demonstrate that adjacent ground/power copper planes reduce trace temperature rise by 20% to 50% through vertical heat spreading.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={ampacityResult} />
          </div>
        </div>
      )}

      {/* Tab 2: Resistance & Voltage Drop */}
      {activeTab === 'resistance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>Trace Geometry & Conduction Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Trace Length (mm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={traceLengthMm}
                    onChange={(e) => setTraceLengthMm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(traceLengthMm / 25.4).toFixed(2)} inches
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Trace Width (mm)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={resTraceWidthMm}
                    onChange={(e) => setResTraceWidthMm(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(resTraceWidthMm / 0.0254).toFixed(1)} mils
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Copper Weight
                  </label>
                  <select
                    value={resCopperWeightOz}
                    onChange={(e) => setResCopperWeightOz(parseFloat(e.target.value))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {STANDARD_COPPER_WEIGHTS.map((opt) => (
                      <option key={opt.oz} value={opt.oz}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Operating Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="-40"
                    max="150"
                    value={operatingTempC}
                    onChange={(e) => setOperatingTempC(parseFloat(e.target.value) || 25)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Copper α₂₀ = +0.393%/°C
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Load Current (Amps)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={loadCurrentAmps}
                    onChange={(e) => setLoadCurrentAmps(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Source Bus Voltage (V)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={sourceVoltageVolts}
                    onChange={(e) => setSourceVoltageVolts(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={resistanceResult} />
          </div>
        </div>
      )}

      {/* Tab 3: Resistance Curves */}
      {activeTab === 'curves' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Trace Resistance vs. Width Sweep
                </h3>
                <p className="text-xs text-muted-foreground">
                  Client-side comparison of 0.5 oz (17.5 µm), 1.0 oz (35 µm), and 2.0 oz (70 µm) copper traces.
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Length:</span>
                  <input
                    type="number"
                    step="10"
                    min="10"
                    max="1000"
                    value={curveLengthMm}
                    onChange={(e) => setCurveLengthMm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-20 bg-background border border-input rounded px-2 py-1 text-xs text-foreground"
                  />
                  <span className="text-xs text-muted-foreground">mm</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Temp:</span>
                  <input
                    type="number"
                    step="5"
                    value={curveTempC}
                    onChange={(e) => setCurveTempC(parseFloat(e.target.value) || 25)}
                    className="w-16 bg-background border border-input rounded px-2 py-1 text-xs text-foreground"
                  />
                  <span className="text-xs text-muted-foreground">°C</span>
                </div>
              </div>
            </div>

            {/* SVG Graph */}
            <div className="w-full h-72 bg-muted/20 border border-border rounded-lg p-4 relative flex flex-col justify-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="500" y2="160" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />

                {/* 0.5 oz Curve (Orange/Amber) */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  points={curveData
                    .map((d, idx) => {
                      const x = (idx / (curveData.length - 1)) * 500;
                      const y = 190 - (d.rHalfOz / maxR) * 170;
                      return `${x},${Math.max(10, y)}`;
                    })
                    .join(' ')}
                />

                {/* 1.0 oz Curve (Cyan/Primary) */}
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  points={curveData
                    .map((d, idx) => {
                      const x = (idx / (curveData.length - 1)) * 500;
                      const y = 190 - (d.rOneOz / maxR) * 170;
                      return `${x},${Math.max(10, y)}`;
                    })
                    .join(' ')}
                />

                {/* 2.0 oz Curve (Emerald/Green) */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  points={curveData
                    .map((d, idx) => {
                      const x = (idx / (curveData.length - 1)) * 500;
                      const y = 190 - (d.rTwoOz / maxR) * 170;
                      return `${x},${Math.max(10, y)}`;
                    })
                    .join(' ')}
                />
              </svg>

              {/* Graph Legend */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border mt-2">
                <span>Width: 0.1 mm</span>
                <div className="flex items-center space-x-6">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-1 bg-[#f59e0b] rounded-full inline-block"></span>
                    <span className="text-foreground font-medium">0.5 oz Cu</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-1 bg-[#06b6d4] rounded-full inline-block"></span>
                    <span className="text-foreground font-medium">1.0 oz Cu</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-1 bg-[#10b981] rounded-full inline-block"></span>
                    <span className="text-foreground font-medium">2.0 oz Cu</span>
                  </span>
                </div>
                <span>Width: 3.0 mm</span>
              </div>
            </div>

            {/* Quick Readout Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="py-2 px-3">Trace Width</th>
                    <th className="py-2 px-3 text-amber-500">0.5 oz (17.5 µm)</th>
                    <th className="py-2 px-3 text-cyan-500">1.0 oz (35 µm)</th>
                    <th className="py-2 px-3 text-emerald-500">2.0 oz (70 µm)</th>
                    <th className="py-2 px-3">Recommended Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 px-3 font-medium text-foreground">0.15 mm (6 mil)</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (0.15e-3 * 17.5e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (0.15e-3 * 35e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (0.15e-3 * 70e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3 text-muted-foreground">High-density digital signal</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-foreground">0.30 mm (12 mil)</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (0.30e-3 * 17.5e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (0.30e-3 * 35e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (0.30e-3 * 70e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3 text-muted-foreground">Standard 50Ω microstrip</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-foreground">1.00 mm (40 mil)</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (1.00e-3 * 17.5e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (1.00e-3 * 35e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (1.00e-3 * 70e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3 text-muted-foreground">Low-current power rail (1–2A)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-foreground">2.50 mm (100 mil)</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (2.50e-3 * 17.5e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (2.50e-3 * 35e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3">{((curveLengthMm * 1e-3 * 1.724e-8 * 1.0197) / (2.50e-3 * 70e-6) * 1000).toFixed(1)} mΩ</td>
                    <td className="py-2 px-3 text-muted-foreground">High-current power feeder (&gt;4A)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
