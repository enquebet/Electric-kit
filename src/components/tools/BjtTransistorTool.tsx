import React, { useState, useMemo } from 'react';
import {
  calculateBjtBaseResistor,
  calculateBjtBias,
  calculateBjtPower,
} from '../../engines/components/transistors';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Cpu, Power, ShieldAlert } from 'lucide-react';

export const BjtTransistorTool: React.FC = () => {
  const [bjtMode, setBjtMode] = useState<'switch' | 'bias' | 'power'>('switch');

  // Switch mode inputs
  const [vin, setVin] = useState<number>(5.0);
  const [vinUnit, setVinUnit] = useState<string>('V');
  const [ic, setIc] = useState<number>(100);
  const [icUnit, setIcUnit] = useState<string>('mA');
  const [beta, setBeta] = useState<number>(100);
  const [forcedBeta, setForcedBeta] = useState<number>(10);

  // Bias mode inputs (voltage divider bias)
  const [vcc, setVcc] = useState<number>(12);
  const [vccUnit, setVccUnit] = useState<string>('V');
  const [r1, setR1] = useState<number>(33);
  const [r1Unit, setR1Unit] = useState<string>('kΩ');
  const [r2, setR2] = useState<number>(10);
  const [r2Unit, setR2Unit] = useState<string>('kΩ');
  const [rc, setRc] = useState<number>(2.2);
  const [rcUnit, setRcUnit] = useState<string>('kΩ');
  const [re, setRe] = useState<number>(1.0);
  const [reUnit, setReUnit] = useState<string>('kΩ');

  // Power mode inputs
  const [vce, setVce] = useState<number>(5.0);
  const [vceUnit, setVceUnit] = useState<string>('V');
  const [icPower, setIcPower] = useState<number>(50);
  const [icPowerUnit, setIcPowerUnit] = useState<string>('mA');
  const [rThetaJa, setRThetaJa] = useState<number>(200);
  const [ambientTemp, setAmbientTemp] = useState<number>(25);

  const result = useMemo(() => {
    if (bjtMode === 'switch') {
      return calculateBjtBaseResistor({
        vin: toBaseUnit(vin, 'voltage', vinUnit),
        collectorCurrent: toBaseUnit(ic, 'current', icUnit),
        transistorBeta: beta,
        forcedBeta,
      });
    } else if (bjtMode === 'bias') {
      return calculateBjtBias({
        vcc: toBaseUnit(vcc, 'voltage', vccUnit),
        r1: toBaseUnit(r1, 'resistance', r1Unit),
        r2: toBaseUnit(r2, 'resistance', r2Unit),
        rc: toBaseUnit(rc, 'resistance', rcUnit),
        re: toBaseUnit(re, 'resistance', reUnit),
        beta,
      });
    } else {
      return calculateBjtPower({
        vce: toBaseUnit(vce, 'voltage', vceUnit),
        ic: toBaseUnit(icPower, 'current', icPowerUnit),
        rThetaJa,
        ambientTemp,
      });
    }
  }, [
    bjtMode, vin, vinUnit, ic, icUnit, beta, forcedBeta,
    vcc, vccUnit, r1, r1Unit, r2, r2Unit, rc, rcUnit, re, reUnit,
    vce, vceUnit, icPower, icPowerUnit, rThetaJa, ambientTemp,
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Mode Selector */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setBjtMode('switch')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            bjtMode === 'switch'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          BJT Base Resistor (Saturated Switch)
        </button>

        <button
          type="button"
          onClick={() => setBjtMode('bias')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            bjtMode === 'bias'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          BJT Linear Amplifier Bias (Q-Point)
        </button>

        <button
          type="button"
          onClick={() => setBjtMode('power')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            bjtMode === 'power'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          BJT Power &amp; Thermal Junction (Tj)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            {bjtMode === 'switch' ? 'Switch Parameters' : bjtMode === 'bias' ? 'Divider Network Resistors' : 'Thermal Parameters'}
          </span>

          {bjtMode === 'switch' && (
            <>
              <UnitInput
                id="bjt-vin"
                label="Base Input Voltage (V_in / MCU GPIO)"
                symbol="Vin"
                quantity="voltage"
                value={vin}
                unit={vinUnit}
                onChangeValue={setVin}
                onChangeUnit={setVinUnit}
                description="3.3V or 5V logic signal from microcontroller"
              />
              <UnitInput
                id="bjt-ic"
                label="Collector Current (I_c)"
                symbol="Ic"
                quantity="current"
                value={ic}
                unit={icUnit}
                onChangeValue={setIc}
                onChangeUnit={setIcUnit}
                description="Load current through relay, buzzer, or coil"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Transistor hFE (β)</label>
                  <input
                    type="number"
                    value={beta}
                    onChange={(e) => setBeta(parseFloat(e.target.value) || 100)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Forced β (Overdrive)</label>
                  <input
                    type="number"
                    value={forcedBeta}
                    onChange={(e) => setForcedBeta(parseFloat(e.target.value) || 10)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {bjtMode === 'bias' && (
            <>
              <UnitInput
                id="bjt-vcc"
                label="Supply Rail (V_cc)"
                symbol="Vcc"
                quantity="voltage"
                value={vcc}
                unit={vccUnit}
                onChangeValue={setVcc}
                onChangeUnit={setVccUnit}
              />
              <div className="grid grid-cols-2 gap-3">
                <UnitInput
                  id="bjt-r1"
                  label="Top Bias (R₁)"
                  symbol="R1"
                  quantity="resistance"
                  value={r1}
                  unit={r1Unit}
                  onChangeValue={setR1}
                  onChangeUnit={setR1Unit}
                />
                <UnitInput
                  id="bjt-r2"
                  label="Bottom Bias (R₂)"
                  symbol="R2"
                  quantity="resistance"
                  value={r2}
                  unit={r2Unit}
                  onChangeValue={setR2}
                  onChangeUnit={setR2Unit}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <UnitInput
                  id="bjt-rc"
                  label="Collector Load (R_c)"
                  symbol="Rc"
                  quantity="resistance"
                  value={rc}
                  unit={rcUnit}
                  onChangeValue={setRc}
                  onChangeUnit={setRcUnit}
                />
                <UnitInput
                  id="bjt-re"
                  label="Emitter Resistor (R_e)"
                  symbol="Re"
                  quantity="resistance"
                  value={re}
                  unit={reUnit}
                  onChangeValue={setRe}
                  onChangeUnit={setReUnit}
                />
              </div>
            </>
          )}

          {bjtMode === 'power' && (
            <>
              <UnitInput
                id="bjt-vce"
                label="Collector-Emitter Voltage (V_ce)"
                symbol="Vce"
                quantity="voltage"
                value={vce}
                unit={vceUnit}
                onChangeValue={setVce}
                onChangeUnit={setVceUnit}
              />
              <UnitInput
                id="bjt-ic-pwr"
                label="Collector Current (I_c)"
                symbol="Ic"
                quantity="current"
                value={icPower}
                unit={icPowerUnit}
                onChangeValue={setIcPower}
                onChangeUnit={setIcPowerUnit}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Rθja (°C/W)</label>
                  <input
                    type="number"
                    value={rThetaJa}
                    onChange={(e) => setRThetaJa(parseFloat(e.target.value) || 200)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Ambient Temp (°C)</label>
                  <input
                    type="number"
                    value={ambientTemp}
                    onChange={(e) => setAmbientTemp(parseFloat(e.target.value) || 25)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* BJT Operating Point & Analytics */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              Operating Region &amp; Safe Operating Area (SOA)
            </span>
            <span className="text-slate-500">
              {bjtMode === 'bias' ? result.additionalOutputs?.operatingRegion?.value || 'Active' : 'Linear / Saturation'}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3">
            {bjtMode === 'switch' && (
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-mono">RECOMMENDED BASE RESISTOR (R_B)</span>
                <span className="text-2xl font-mono font-bold text-cyan-300">
                  {result.standardValue?.recommendedValue ? `${result.standardValue.recommendedValue} Ω (E24)` : result.formattedValue}
                </span>
                <span className="text-xs text-slate-400">
                  Forced base drive current: <span className="text-amber-400 font-bold">{result.additionalOutputs?.baseCurrent?.value || '—'}</span>
                </span>
              </div>
            )}

            {bjtMode === 'bias' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">COLLECTOR CURRENT (I_C)</span>
                  <span className="text-cyan-300 font-bold text-base">
                    {result.additionalOutputs?.collectorCurrent?.value || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">COLLECTOR-EMITTER VOLTAGE</span>
                  <span className="text-amber-400 font-bold text-base">
                    {result.additionalOutputs?.vce?.value || '—'}
                  </span>
                </div>
              </div>
            )}

            {bjtMode === 'power' && (
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-mono">ESTIMATED JUNCTION TEMPERATURE (Tj)</span>
                <span className="text-2xl font-mono font-bold text-amber-400">
                  {result.additionalOutputs?.junctionTemp?.value || '—'}
                </span>
                <span className="text-xs text-slate-400">
                  Total Active Power Dissipation: <span className="text-cyan-300 font-bold">{result.formattedValue}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
