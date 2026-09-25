import React, { useState, useMemo } from 'react';
import {
  calculateBatteryRuntime,
  BATTERY_CHEMISTRY_PRESETS,
} from '../../engines/batteries/battery-runtime';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { CircuitDiagram } from '../common/CircuitDiagram';
import { toBaseUnit } from '../../lib/units/quantities';

export const BatteryRuntimeTool: React.FC = () => {
  const [chemistry, setChemistry] = useState<'li-ion' | 'lifepo4' | 'lead-acid' | 'nimh' | 'alkaline'>('li-ion');

  const [voltage, setVoltage] = useState<number>(3.7);
  const [capacity, setCapacity] = useState<number>(2500);
  const [capacityUnit, setCapacityUnit] = useState<string>('mAh');

  const [dod, setDod] = useState<number>(80);

  const [loadMode, setLoadMode] = useState<'current' | 'power'>('current');
  const [loadCurrent, setLoadCurrent] = useState<number>(500);
  const [loadCurrentUnit, setLoadCurrentUnit] = useState<string>('mA');

  const [loadPower, setLoadPower] = useState<number>(2.5);
  const [loadPowerUnit, setLoadPowerUnit] = useState<string>('W');

  // Chemistry change helper
  const handleChemistryChange = (chem: typeof chemistry) => {
    setChemistry(chem);
    const p = BATTERY_CHEMISTRY_PRESETS[chem];
    if (p) {
      setVoltage(p.defaultVoltage);
      setDod(p.defaultDod);
    }
  };

  const capBaseAh =
    capacityUnit === 'mAh' ? capacity / 1000 : capacity;

  const currentBase = toBaseUnit(loadCurrent, 'current', loadCurrentUnit);
  const powerBase = toBaseUnit(loadPower, 'power', loadPowerUnit);

  const result = useMemo(() => {
    return calculateBatteryRuntime({
      nominalVoltage: voltage,
      capacityAh: capBaseAh,
      chemistry,
      dischargeDepthPercent: dod,
      loadMode,
      loadValue: loadMode === 'current' ? currentBase : powerBase,
    });
  }, [voltage, capBaseAh, chemistry, dod, loadMode, currentBase, powerBase]);

  return (
    <div className="flex flex-col gap-6">
      {/* Battery Chemistry Presets */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Battery Cell Chemistry
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(BATTERY_CHEMISTRY_PRESETS).map(([key, data]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleChemistryChange(key as any)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                chemistry === key
                  ? 'border-cyan-400 bg-cyan-950/40 text-slate-100 ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="text-xs font-bold truncate">{data.name.split(' (')[0]}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">{data.defaultVoltage}V nom · {data.defaultDod}% DoD</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Battery Parameters</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="batt-v" className="text-xs font-semibold text-slate-300">
                Pack Nominal Voltage (V)
              </label>
              <input
                id="batt-v"
                type="number"
                step="0.1"
                min="0.5"
                value={voltage}
                onChange={(e) => setVoltage(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-900/90 rounded-lg border border-slate-700 outline-none focus:border-cyan-500"
              />
            </div>

            <UnitInput
              id="batt-cap"
              label="Rated Capacity"
              symbol="C"
              quantity="charge"
              value={capacity}
              unit={capacityUnit}
              onChangeValue={setCapacity}
              onChangeUnit={setCapacityUnit}
              min={1}
            />
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <label htmlFor="batt-dod" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Depth of Discharge (DoD)</span>
              <span className="font-mono text-cyan-400">{dod}% usable</span>
            </label>
            <input
              id="batt-dod"
              type="range"
              min={10}
              max={100}
              value={dod}
              onChange={(e) => setDod(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>10% (conservative)</span>
              <span>80% (recommended)</span>
              <span>100% (full drain)</span>
            </div>
          </div>

          {/* Load specification mode */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Load Specification</span>
              <div className="flex rounded bg-slate-950 p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setLoadMode('current')}
                  className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer ${
                    loadMode === 'current' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Current (A)
                </button>
                <button
                  type="button"
                  onClick={() => setLoadMode('power')}
                  className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer ${
                    loadMode === 'power' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Power (W)
                </button>
              </div>
            </div>

            {loadMode === 'current' ? (
              <UnitInput
                id="batt-load-i"
                label="Discharge Current"
                symbol="I_load"
                quantity="current"
                value={loadCurrent}
                unit={loadCurrentUnit}
                onChangeValue={setLoadCurrent}
                onChangeUnit={setLoadCurrentUnit}
                min={0.1}
              />
            ) : (
              <UnitInput
                id="batt-load-p"
                label="Discharge Power"
                symbol="P_load"
                quantity="power"
                value={loadPower}
                unit={loadPowerUnit}
                onChangeValue={setLoadPower}
                onChangeUnit={setLoadPowerUnit}
                min={0.1}
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <CircuitDiagram type="battery" data={result.visualData || {}} />
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
