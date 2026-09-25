import React, { useState, useMemo } from 'react';
import {
  calculateDecouplingCapacitor,
  calculatePdnTargetImpedance,
  calculatePowerPlane,
} from '../../engines/pcb/power-integrity';
import { STANDARD_COPPER_WEIGHTS } from '../../engines/pcb/copper-trace';
import { ResultCard } from '../common/ResultCard';
import { BatteryCharging, Target, Layers, ShieldCheck, Zap } from 'lucide-react';

export const PowerIntegrityTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'decoupling' | 'target-z' | 'planes'>('decoupling');

  // Decoupling State
  const [transientCurrentA, setTransientCurrentA] = useState<number>(2.0);
  const [transientDurationNs, setTransientDurationNs] = useState<number>(50.0);
  const [allowedDroopMv, setAllowedDroopMv] = useState<number>(50.0); // 50 mV
  const [esrMilliOhms, setEsrMilliOhms] = useState<number>(5.0); // 5 mΩ
  const [railVoltageV, setRailVoltageV] = useState<number>(3.3);

  const decouplingResult = useMemo(() => {
    return calculateDecouplingCapacitor({
      transientCurrentAmps: transientCurrentA,
      transientDurationSec: transientDurationNs * 1e-9,
      allowedDroopVolts: allowedDroopMv * 1e-3,
      capacitorEsrOhms: esrMilliOhms * 1e-3,
      railVoltageVolts: railVoltageV,
    });
  }, [transientCurrentA, transientDurationNs, allowedDroopMv, esrMilliOhms, railVoltageV]);

  // Target Impedance State
  const [targetRailV, setTargetRailV] = useState<number>(1.2);
  const [allowedRipplePct, setAllowedRipplePct] = useState<number>(3.0); // 3%
  const [pdnStepCurrentA, setPdnStepCurrentA] = useState<number>(4.0);

  const pdnResult = useMemo(() => {
    return calculatePdnTargetImpedance({
      railVoltageVolts: targetRailV,
      allowedRipplePercent: allowedRipplePct,
      transientCurrentAmps: pdnStepCurrentA,
    });
  }, [targetRailV, allowedRipplePct, pdnStepCurrentA]);

  // Power Plane State
  const [planeLengthMm, setPlaneLengthMm] = useState<number>(100.0);
  const [planeWidthMm, setPlaneWidthMm] = useState<number>(50.0);
  const [planeCopperOz, setPlaneCopperOz] = useState<number>(1.0);
  const [planeCurrentA, setPlaneCurrentA] = useState<number>(5.0);
  const [planeTempC, setPlaneTempC] = useState<number>(25.0);

  const planeThicknessM = useMemo(() => {
    const selected = STANDARD_COPPER_WEIGHTS.find((w) => w.oz === planeCopperOz);
    return (selected ? selected.thicknessUm : 35.0) * 1e-6;
  }, [planeCopperOz]);

  const planeResult = useMemo(() => {
    return calculatePowerPlane({
      lengthMeters: planeLengthMm * 1e-3,
      widthMeters: planeWidthMm * 1e-3,
      copperThicknessMeters: planeThicknessM,
      currentAmps: planeCurrentA,
      temperatureC: planeTempC,
    });
  }, [planeLengthMm, planeWidthMm, planeThicknessM, planeCurrentA, planeTempC]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('decoupling')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'decoupling'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BatteryCharging className="w-4 h-4" />
          <span>Decoupling Capacitor Sizing</span>
        </button>
        <button
          onClick={() => setActiveTab('target-z')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'target-z'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>PDN Target Impedance (Z_target)</span>
        </button>
        <button
          onClick={() => setActiveTab('planes')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'planes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Copper Power Plane Conduction</span>
        </button>
      </div>

      {/* Tab 1: Decoupling */}
      {activeTab === 'decoupling' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <BatteryCharging className="w-4 h-4 text-primary" />
                <span>Transient Current & Rail Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Transient Current Step ΔI (A)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.05"
                    value={transientCurrentA}
                    onChange={(e) => setTransientCurrentA(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Transient Duration Δt (ns)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="1"
                    value={transientDurationNs}
                    onChange={(e) => setTransientDurationNs(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Power supply regulator loop response time window
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Allowed Voltage Droop (mV)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="1"
                    value={allowedDroopMv}
                    onChange={(e) => setAllowedDroopMv(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Capacitor Bank ESR (mΩ)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0.1"
                    value={esrMilliOhms}
                    onChange={(e) => setEsrMilliOhms(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  DC Rail Nominal Voltage (V)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={railVoltageV}
                  onChange={(e) => setRailVoltageV(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={decouplingResult} />
          </div>
        </div>
      )}

      {/* Tab 2: Target Impedance */}
      {activeTab === 'target-z' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Target className="w-4 h-4 text-primary" />
                <span>PDN Target Impedance Parameters</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Nominal Rail Voltage (V)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={targetRailV}
                    onChange={(e) => setTargetRailV(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Allowed Ripple Tolerance (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="15"
                    value={allowedRipplePct}
                    onChange={(e) => setAllowedRipplePct(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Typical: ±3% for core rails, ±5% for I/O
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Maximum Transient Current Step ΔI (A)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={pdnStepCurrentA}
                  onChange={(e) => setPdnStepCurrentA(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={pdnResult} />
          </div>
        </div>
      )}

      {/* Tab 3: Power Planes */}
      {activeTab === 'planes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Continuous Copper Plane Dimensions</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Plane Length L (mm)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="1"
                    value={planeLengthMm}
                    onChange={(e) => setPlaneLengthMm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dimension along current flow direction
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Plane Width W (mm)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="1"
                    value={planeWidthMm}
                    onChange={(e) => setPlaneWidthMm(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dimension perpendicular to current
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Copper Foil Weight
                  </label>
                  <select
                    value={planeCopperOz}
                    onChange={(e) => setPlaneCopperOz(parseFloat(e.target.value))}
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
                    Operating Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={planeTempC}
                    onChange={(e) => setPlaneTempC(parseFloat(e.target.value) || 25)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  DC Conduction Current (Amps)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={planeCurrentA}
                  onChange={(e) => setPlaneCurrentA(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ResultCard result={planeResult} />
          </div>
        </div>
      )}
    </div>
  );
};
