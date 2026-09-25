import React, { useState, useMemo } from 'react';
import {
  calculateDiodeSeriesResistor,
  calculateZenerResistor,
  calculateZenerPower,
  calculateRectifier,
} from '../../engines/components/diodes';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Zap, ShieldCheck, Cpu } from 'lucide-react';

export const DiodeRectifierTool: React.FC = () => {
  const [subTool, setSubTool] = useState<'diode-resistor' | 'zener-regulator' | 'rectifier'>('diode-resistor');

  // Diode series resistor state
  const [diodeVs, setDiodeVs] = useState<number>(12);
  const [diodeVsUnit, setDiodeVsUnit] = useState<string>('V');
  const [diodeVf, setDiodeVf] = useState<number>(0.7);
  const [diodeVfUnit, setDiodeVfUnit] = useState<string>('V');
  const [diodeIf, setDiodeIf] = useState<number>(20);
  const [diodeIfUnit, setDiodeIfUnit] = useState<string>('mA');
  const [diodeCount, setDiodeCount] = useState<number>(1);

  // Zener regulator state
  const [zenerVsMin, setZenerVsMin] = useState<number>(12);
  const [zenerVsMinUnit, setZenerVsMinUnit] = useState<string>('V');
  const [zenerVsMax, setZenerVsMax] = useState<number>(15);
  const [zenerVsMaxUnit, setZenerVsMaxUnit] = useState<string>('V');
  const [zenerVz, setZenerVz] = useState<number>(5.1);
  const [zenerVzUnit, setZenerVzUnit] = useState<string>('V');
  const [zenerIload, setZenerIload] = useState<number>(20);
  const [zenerIloadUnit, setZenerIloadUnit] = useState<string>('mA');

  // Rectifier state
  const [rectTopology, setRectTopology] = useState<'bridge' | 'full-wave-ct' | 'half-wave'>('bridge');
  const [rectVacRms, setRectVacRms] = useState<number>(12);
  const [rectVacRmsUnit, setRectVacRmsUnit] = useState<string>('V');
  const [rectDiodeVf, setRectDiodeVf] = useState<number>(0.7);
  const [rectDiodeVfUnit, setRectDiodeVfUnit] = useState<string>('V');
  const [rectIload, setRectIload] = useState<number>(1.0);
  const [rectIloadUnit, setRectIloadUnit] = useState<string>('A');

  const result = useMemo(() => {
    if (subTool === 'diode-resistor') {
      return calculateDiodeSeriesResistor({
        supplyVoltage: toBaseUnit(diodeVs, 'voltage', diodeVsUnit),
        forwardVoltage: toBaseUnit(diodeVf, 'voltage', diodeVfUnit),
        targetCurrent: toBaseUnit(diodeIf, 'current', diodeIfUnit),
        diodeCount,
      });
    } else if (subTool === 'zener-regulator') {
      return calculateZenerResistor({
        supplyVoltageMin: toBaseUnit(zenerVsMin, 'voltage', zenerVsMinUnit),
        supplyVoltageMax: toBaseUnit(zenerVsMax, 'voltage', zenerVsMaxUnit),
        zenerVoltage: toBaseUnit(zenerVz, 'voltage', zenerVzUnit),
        loadCurrentMax: toBaseUnit(zenerIload, 'current', zenerIloadUnit),
      });
    } else {
      return calculateRectifier({
        topology: rectTopology,
        acRmsVoltage: toBaseUnit(rectVacRms, 'voltage', rectVacRmsUnit),
        diodeDrop: toBaseUnit(rectDiodeVf, 'voltage', rectDiodeVfUnit),
        loadCurrent: toBaseUnit(rectIload, 'current', rectIloadUnit),
      });
    }
  }, [
    subTool,
    diodeVs, diodeVsUnit, diodeVf, diodeVfUnit, diodeIf, diodeIfUnit, diodeCount,
    zenerVsMin, zenerVsMinUnit, zenerVsMax, zenerVsMaxUnit, zenerVz, zenerVzUnit, zenerIload, zenerIloadUnit,
    rectTopology, rectVacRms, rectVacRmsUnit, rectDiodeVf, rectDiodeVfUnit, rectIload, rectIloadUnit,
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Tool Switcher */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setSubTool('diode-resistor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            subTool === 'diode-resistor'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Diode Current Limiter
        </button>

        <button
          type="button"
          onClick={() => setSubTool('zener-regulator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            subTool === 'zener-regulator'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Zener Voltage Regulator
        </button>

        <button
          type="button"
          onClick={() => setSubTool('rectifier')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            subTool === 'rectifier'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          AC Rectifier (Bridge / Half / Center)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            {subTool === 'diode-resistor' ? 'Diode Circuit Inputs' : subTool === 'zener-regulator' ? 'Zener Circuit Parameters' : 'Rectifier Input Parameters'}
          </span>

          {subTool === 'diode-resistor' && (
            <>
              <UnitInput
                id="d-vs"
                label="Supply Voltage (V_supply)"
                symbol="Vs"
                quantity="voltage"
                value={diodeVs}
                unit={diodeVsUnit}
                onChangeValue={setDiodeVs}
                onChangeUnit={setDiodeVsUnit}
                min={0}
              />
              <UnitInput
                id="d-vf"
                label="Diode Forward Voltage Drop (V_f)"
                symbol="Vf"
                quantity="voltage"
                value={diodeVf}
                unit={diodeVfUnit}
                onChangeValue={setDiodeVf}
                onChangeUnit={setDiodeVfUnit}
                description="Typical: 0.7V for Silicon, 0.3V for Schottky, 2.0V-3.3V for LEDs"
              />
              <UnitInput
                id="d-if"
                label="Target Forward Current (I_f)"
                symbol="If"
                quantity="current"
                value={diodeIf}
                unit={diodeIfUnit}
                onChangeValue={setDiodeIf}
                onChangeUnit={setDiodeIfUnit}
                min={0.001}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Number of Diodes in Series</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={diodeCount}
                  onChange={(e) => setDiodeCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </>
          )}

          {subTool === 'zener-regulator' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <UnitInput
                  id="z-vsmin"
                  label="Min Supply (Vs_min)"
                  symbol="Vs,min"
                  quantity="voltage"
                  value={zenerVsMin}
                  unit={zenerVsMinUnit}
                  onChangeValue={setZenerVsMin}
                  onChangeUnit={setZenerVsMinUnit}
                />
                <UnitInput
                  id="z-vsmax"
                  label="Max Supply (Vs_max)"
                  symbol="Vs,max"
                  quantity="voltage"
                  value={zenerVsMax}
                  unit={zenerVsMaxUnit}
                  onChangeValue={setZenerVsMax}
                  onChangeUnit={setZenerVsMaxUnit}
                />
              </div>
              <UnitInput
                id="z-vz"
                label="Zener Breakdown Voltage (V_z)"
                symbol="Vz"
                quantity="voltage"
                value={zenerVz}
                unit={zenerVzUnit}
                onChangeValue={setZenerVz}
                onChangeUnit={setZenerVzUnit}
                description="Target shunt regulated output voltage"
              />
              <UnitInput
                id="z-iload"
                label="Maximum Load Current (I_load)"
                symbol="I_load"
                quantity="current"
                value={zenerIload}
                unit={zenerIloadUnit}
                onChangeValue={setZenerIload}
                onChangeUnit={setZenerIloadUnit}
                description="Peak current drawn by the regulated load"
              />
            </>
          )}

          {subTool === 'rectifier' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Rectifier Topology</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bridge', 'full-wave-ct', 'half-wave'] as const).map((top) => (
                    <button
                      key={top}
                      type="button"
                      onClick={() => setRectTopology(top)}
                      className={`px-2 py-1.5 text-xs font-mono rounded border capitalize cursor-pointer transition-all ${
                        rectTopology === top
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {top.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <UnitInput
                id="rect-vac"
                label="AC Secondary RMS Voltage"
                symbol="Vac"
                quantity="voltage"
                value={rectVacRms}
                unit={rectVacRmsUnit}
                onChangeValue={setRectVacRms}
                onChangeUnit={setRectVacRmsUnit}
                description="Transformer secondary AC RMS output"
              />
              <UnitInput
                id="rect-vf"
                label="Diode Forward Drop (V_f)"
                symbol="Vf"
                quantity="voltage"
                value={rectDiodeVf}
                unit={rectDiodeVfUnit}
                onChangeValue={setRectDiodeVf}
                onChangeUnit={setRectDiodeVfUnit}
                description="0.7V for standard Si, 0.4V for Schottky"
              />
              <UnitInput
                id="rect-iload"
                label="DC Load Current (I_dc)"
                symbol="Idc"
                quantity="current"
                value={rectIload}
                unit={rectIloadUnit}
                onChangeValue={setRectIload}
                onChangeUnit={setRectIloadUnit}
                description="Used for filter capacitor sizing & ripple calculation"
              />
            </>
          )}
        </div>

        {/* Diode / Rectifier Analytical Diagram */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              Semiconductor Metrics &amp; Safety
            </span>
            <span className="text-slate-500">Standard Ratings</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3">
            {subTool === 'rectifier' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">PEAK DC OUTPUT VOLTAGE</span>
                  <span className="text-cyan-300 font-bold text-lg">
                    {result.additionalOutputs?.vPeakDc?.value || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">PEAK INVERSE VOLTAGE (PIV)</span>
                  <span className="text-amber-400 font-bold text-lg">
                    {result.additionalOutputs?.piv?.value || '—'}
                  </span>
                </div>
                <div className="col-span-2 p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">RECOMMENDED FILTER CAPACITOR (10% RIPPLE)</span>
                  <span className="text-emerald-400 font-bold text-base">
                    {result.additionalOutputs?.filterCapacitor?.value || '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-mono">RECOMMENDED E24 BALLAST RESISTOR</span>
                <span className="text-2xl font-mono font-bold text-cyan-300">
                  {result.standardValue?.recommendedValue ? `${result.standardValue.recommendedValue} Ω (E24)` : result.formattedValue}
                </span>
                <span className="text-xs text-amber-400 font-mono">
                  Suggested Resistor Rating: {result.additionalOutputs?.suggestedRating?.value || result.additionalOutputs?.suggestedWattage?.value || '0.5 W'}
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
