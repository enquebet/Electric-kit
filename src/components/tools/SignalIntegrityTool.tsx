import React, { useState, useMemo } from 'react';
import {
  calculateSignalIntegrity,
} from '../../engines/pcb/signal-integrity';
import { ResultCard } from '../common/ResultCard';
import { Activity, Radio, ShieldCheck, AlertTriangle, Cpu } from 'lucide-react';

export const SignalIntegrityTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'critical-length' | 'reflections'>('critical-length');

  // Parameters
  const [riseTimeNs, setRiseTimeNs] = useState<number>(0.8); // 800 ps
  const [characteristicZ0, setCharacteristicZ0] = useState<number>(50.0);
  const [loadZl, setLoadZl] = useState<number>(1000.0); // Hi-Z receiver
  const [delayPsPerInch, setDelayPsPerInch] = useState<number>(150.0);
  const [actualTraceLenIn, setActualTraceLenIn] = useState<number>(3.0);

  const siResult = useMemo(() => {
    return calculateSignalIntegrity({
      riseTimeNs,
      characteristicZ0Ohms: characteristicZ0,
      loadImpedanceZlOhms: loadZl,
      delayPsPerInch,
      actualTraceLengthInches: actualTraceLenIn,
    });
  }, [riseTimeNs, characteristicZ0, loadZl, delayPsPerInch, actualTraceLenIn]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab('critical-length')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'critical-length'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Rise Time, Knee Frequency & Critical Length</span>
        </button>
        <button
          onClick={() => setActiveTab('reflections')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reflections'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Reflections, Return Loss & VSWR</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-primary" />
              <span>Digital Signal Edge & Line Parameters</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Driver 10%–90% Rise Time t_r (nanoseconds)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  max="10.0"
                  value={riseTimeNs}
                  onChange={(e) => setRiseTimeNs(Math.max(0.005, parseFloat(e.target.value) || 0.005))}
                  className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground w-20">
                  {(riseTimeNs * 1000).toFixed(0)} ps
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Typical: 3.3V CMOS (~2–3 ns), Fast TTL (~1.5 ns), LVDS (~300–500 ps), PCIe Gen3/4 (~30–50 ps)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Trace Impedance Z₀ (Ω)
                </label>
                <input
                  type="number"
                  step="5"
                  min="10"
                  value={characteristicZ0}
                  onChange={(e) => setCharacteristicZ0(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Load Impedance Z_L (Ω)
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={loadZl}
                  onChange={(e) => setLoadZl(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Trace Delay (ps / inch)
                </label>
                <input
                  type="number"
                  step="5"
                  min="50"
                  value={delayPsPerInch}
                  onChange={(e) => setDelayPsPerInch(Math.max(10, parseFloat(e.target.value) || 10))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Actual Trace Length (inches)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={actualTraceLenIn}
                  onChange={(e) => setActualTraceLenIn(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(actualTraceLenIn * 25.4).toFixed(1)} mm
                </p>
              </div>
            </div>
          </div>

          {/* High-Speed Termination Topology Guide */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              High-Speed Transmission Line Termination Schemes
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-muted/40 border border-border">
                <div className="font-semibold text-foreground">Series Source Termination (Recommended for Point-to-Point)</div>
                <div className="text-muted-foreground mt-0.5">
                  Place resistor <code className="text-primary font-mono">R_s = Z₀ − R_driver</code> immediately at driver output pin. Absorbs reverse reflection at source. No DC quiescent power consumption.
                </div>
              </div>
              <div className="p-2.5 rounded bg-muted/40 border border-border">
                <div className="font-semibold text-foreground">Parallel End Termination</div>
                <div className="text-muted-foreground mt-0.5">
                  Place resistor <code className="text-primary font-mono">R_t = Z₀</code> at receiver directly to GND or VDD. Eliminates reflection at far end, but draws continuous DC current.
                </div>
              </div>
              <div className="p-2.5 rounded bg-muted/40 border border-border">
                <div className="font-semibold text-foreground">AC Capacitive Termination</div>
                <div className="text-muted-foreground mt-0.5">
                  Series RC network <code className="text-primary font-mono">R = Z₀, C = 50–100 pF</code> to GND at receiver. Absorbs high-frequency edges with zero DC power dissipation.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <ResultCard result={siResult} />
        </div>
      </div>
    </div>
  );
};
