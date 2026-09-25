import React, { useState, useMemo } from 'react';
import {
  calculateMosfetGateResistor,
  calculateMosfetConductionLoss,
  calculateMosfetSwitchingLoss,
} from '../../engines/components/mosfets';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Cpu, Flame, Gauge } from 'lucide-react';

export const MosfetTool: React.FC = () => {
  const [mosMode, setMosMode] = useState<'gate-resistor' | 'conduction' | 'switching'>('gate-resistor');

  // Gate resistor inputs
  const [qg, setQg] = useState<number>(30);
  const [qgUnit, setQgUnit] = useState<string>('nC');
  const [vdrv, setVdrv] = useState<number>(10);
  const [vdrvUnit, setVdrvUnit] = useState<string>('V');
  const [tsw, setTsw] = useState<number>(50);
  const [tswUnit, setTswUnit] = useState<string>('ns');
  const [rDrv, setRDrv] = useState<number>(2.0);

  // Conduction loss inputs
  const [irms, setIrms] = useState<number>(10);
  const [irmsUnit, setIrmsUnit] = useState<string>('A');
  const [rdson25, setRdson25] = useState<number>(20);
  const [rdson25Unit, setRdson25Unit] = useState<string>('mΩ');
  const [tj, setTj] = useState<number>(100);
  const [alpha, setAlpha] = useState<number>(0.6);

  // Switching loss inputs
  const [vbus, setVbus] = useState<number>(48);
  const [vbusUnit, setVbusUnit] = useState<string>('V');
  const [iload, setIload] = useState<number>(10);
  const [iloadUnit, setIloadUnit] = useState<string>('A');
  const [trise, setTrise] = useState<number>(20);
  const [triseUnit, setTriseUnit] = useState<string>('ns');
  const [tfall, setTfall] = useState<number>(25);
  const [tfallUnit, setTfallUnit] = useState<string>('ns');
  const [fsw, setFsw] = useState<number>(100);
  const [fswUnit, setFswUnit] = useState<string>('kHz');

  const result = useMemo(() => {
    if (mosMode === 'gate-resistor') {
      const qgBase = qg * (qgUnit === 'µC' ? 1e-6 : qgUnit === 'pC' ? 1e-12 : 1e-9);
      const tswBase = tsw * (tswUnit === 'µs' ? 1e-6 : tswUnit === 'ms' ? 1e-3 : 1e-9);
      return calculateMosfetGateResistor({
        gateCharge: qgBase,
        driverVoltage: toBaseUnit(vdrv, 'voltage', vdrvUnit),
        desiredSwitchingTime: tswBase,
        driverInternalResistance: rDrv,
      });
    } else if (mosMode === 'conduction') {
      return calculateMosfetConductionLoss({
        currentRms: toBaseUnit(irms, 'current', irmsUnit),
        rdsOn25: toBaseUnit(rdson25, 'resistance', rdson25Unit),
        operatingTempJunction: tj,
        tempCoeffPercentPerC: alpha,
      });
    } else {
      const triseBase = trise * (triseUnit === 'µs' ? 1e-6 : 1e-9);
      const tfallBase = tfall * (tfallUnit === 'µs' ? 1e-6 : 1e-9);
      return calculateMosfetSwitchingLoss({
        busVoltage: toBaseUnit(vbus, 'voltage', vbusUnit),
        loadCurrent: toBaseUnit(iload, 'current', iloadUnit),
        riseTime: triseBase,
        fallTime: tfallBase,
        switchingFreq: toBaseUnit(fsw, 'frequency', fswUnit),
      });
    }
  }, [
    mosMode, qg, qgUnit, vdrv, vdrvUnit, tsw, tswUnit, rDrv,
    irms, irmsUnit, rdson25, rdson25Unit, tj, alpha,
    vbus, vbusUnit, iload, iloadUnit, trise, triseUnit, tfall, tfallUnit, fsw, fswUnit,
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-tool Selector */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setMosMode('gate-resistor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            mosMode === 'gate-resistor'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Gate Resistor (Rg Sizing)
        </button>

        <button
          type="button"
          onClick={() => setMosMode('conduction')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            mosMode === 'conduction'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Conduction Loss (Rds(on) @ Tj)
        </button>

        <button
          type="button"
          onClick={() => setMosMode('switching')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            mosMode === 'switching'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          Switching Loss (E_sw × f_sw)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            {mosMode === 'gate-resistor' ? 'Gate Drive Parameters' : mosMode === 'conduction' ? 'Conduction Parameters' : 'Switching Waveform'}
          </span>

          {mosMode === 'gate-resistor' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Total Gate Charge (Qg)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={qg}
                    onChange={(e) => setQg(parseFloat(e.target.value) || 1)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                  <select
                    value={qgUnit}
                    onChange={(e) => setQgUnit(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
                  >
                    <option value="nC">nC</option>
                    <option value="µC">µC</option>
                  </select>
                </div>
              </div>
              <UnitInput
                id="mos-vdrv"
                label="Gate Driver Voltage (V_drv)"
                symbol="Vdrv"
                quantity="voltage"
                value={vdrv}
                unit={vdrvUnit}
                onChangeValue={setVdrv}
                onChangeUnit={setVdrvUnit}
                description="Common: 10V - 12V for Si MOSFETs, 5V for Logic Level"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Desired Transition Time (t_sw)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tsw}
                    onChange={(e) => setTsw(parseFloat(e.target.value) || 1)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                  <span className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono flex items-center">
                    ns
                  </span>
                </div>
              </div>
            </>
          )}

          {mosMode === 'conduction' && (
            <>
              <UnitInput
                id="mos-irms"
                label="Drain RMS Current (I_rms)"
                symbol="Irms"
                quantity="current"
                value={irms}
                unit={irmsUnit}
                onChangeValue={setIrms}
                onChangeUnit={setIrmsUnit}
              />
              <UnitInput
                id="mos-rdson"
                label="Datasheet Rds(on) at 25°C"
                symbol="Rds,25"
                quantity="resistance"
                value={rdson25}
                unit={rdson25Unit}
                onChangeValue={setRdson25}
                onChangeUnit={setRdson25Unit}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Junction Temp Tj (°C)</label>
                  <input
                    type="number"
                    value={tj}
                    onChange={(e) => setTj(parseFloat(e.target.value) || 25)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Temp Coeff (% / °C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value) || 0.6)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {mosMode === 'switching' && (
            <>
              <UnitInput
                id="mos-vbus"
                label="DC Bus Voltage (V_bus)"
                symbol="Vbus"
                quantity="voltage"
                value={vbus}
                unit={vbusUnit}
                onChangeValue={setVbus}
                onChangeUnit={setVbusUnit}
              />
              <UnitInput
                id="mos-iload"
                label="Switched Load Current (I_load)"
                symbol="Iload"
                quantity="current"
                value={iload}
                unit={iloadUnit}
                onChangeValue={setIload}
                onChangeUnit={setIloadUnit}
              />
              <UnitInput
                id="mos-fsw"
                label="Switching Frequency (f_sw)"
                symbol="fsw"
                quantity="frequency"
                value={fsw}
                unit={fswUnit}
                onChangeValue={setFsw}
                onChangeUnit={setFswUnit}
              />
            </>
          )}
        </div>

        {/* Analytical Loss Card */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              MOSFET Analytical Results
            </span>
            <span className="text-slate-500">Thermal Sizing</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
              <span className="text-xs text-slate-400 font-mono uppercase">
                {mosMode === 'gate-resistor' ? 'Recommended External Gate Resistor' : 'Calculated Power Loss'}
              </span>
              <span className="text-3xl font-mono font-bold text-cyan-300">
                {result.formattedValue}
              </span>
              {mosMode === 'conduction' && (
                <span className="text-xs text-amber-400 font-mono">
                  Elevated Rds(on) @ {tj}°C: {result.additionalOutputs?.rdsOnHot?.value || '—'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
