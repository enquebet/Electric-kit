import React, { useState, useMemo } from 'react';
import { calculateAcPower } from '../../engines/electrical/ac-power';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { CircuitDiagram } from '../common/CircuitDiagram';
import { toBaseUnit } from '../../lib/units/quantities';

export const AcPowerTool: React.FC = () => {
  const [phaseSystem, setPhaseSystem] = useState<'single' | 'three'>('single');

  const [voltage, setVoltage] = useState<number>(230);
  const [vUnit, setVUnit] = useState<string>('V');

  const [current, setCurrent] = useState<number>(10);
  const [iUnit, setIUnit] = useState<string>('A');

  const [pf, setPf] = useState<number>(0.8);
  const [pfType, setPfType] = useState<'lagging' | 'leading'>('lagging');

  const [frequencyHz, setFrequencyHz] = useState<number>(50);
  const [targetPf, setTargetPf] = useState<number>(0.95);

  const vBase = toBaseUnit(voltage, 'voltage', vUnit);
  const iBase = toBaseUnit(current, 'current', iUnit);

  const result = useMemo(() => {
    return calculateAcPower({
      systemType: phaseSystem === 'single' ? 'single-phase' : 'three-phase-wye',
      voltageRms: vBase,
      currentRms: iBase,
      powerFactor: pf,
      pfType: pfType,
      frequencyHz,
      targetPowerFactor: targetPf,
    });
  }, [phaseSystem, vBase, iBase, pf, pfType, frequencyHz, targetPf]);


  return (
    <div className="flex flex-col gap-6">
      {/* System Selection: Single vs Three Phase */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Select AC System Phase Architecture</h3>
          <p className="text-xs text-slate-400">Standard single-phase (L-N) or balanced 3-phase (L-L) system</p>
        </div>
        <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => {
              setPhaseSystem('single');
              setVoltage(230);
            }}
            className={`px-4 py-1.5 text-xs font-bold font-mono rounded-md transition-all cursor-pointer ${
              phaseSystem === 'single'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1-Phase AC (230V / 120V)
          </button>
          <button
            type="button"
            onClick={() => {
              setPhaseSystem('three');
              setVoltage(400);
            }}
            className={`px-4 py-1.5 text-xs font-bold font-mono rounded-md transition-all cursor-pointer ${
              phaseSystem === 'three'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3-Phase AC (400V / 480V)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">AC Electrical Inputs</span>

          <UnitInput
            id="ac-v"
            label={phaseSystem === 'three' ? 'Line-to-Line Voltage (V_LL)' : 'RMS Voltage (V)'}
            symbol="V_rms"
            quantity="voltage"
            value={voltage}
            unit={vUnit}
            onChangeValue={setVoltage}
            onChangeUnit={setVUnit}
            min={1}
          />

          <UnitInput
            id="ac-i"
            label={phaseSystem === 'three' ? 'Line Current (I_line)' : 'Load Current (I_rms)'}
            symbol="I_rms"
            quantity="current"
            value={current}
            unit={iUnit}
            onChangeValue={setCurrent}
            onChangeUnit={setIUnit}
            min={0.1}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ac-pf" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Power Factor (cos φ)</span>
                <span className="font-mono text-cyan-400">{pf.toFixed(2)}</span>
              </label>
              <input
                id="ac-pf"
                type="number"
                step="0.01"
                min="0.1"
                max="1.0"
                value={pf}
                onChange={(e) => setPf(parseFloat(e.target.value) || 0.1)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-900/90 rounded-lg border border-slate-700 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-300">Phase Nature</span>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900/90 overflow-hidden h-[38px]">
                <button
                  type="button"
                  onClick={() => setPfType('lagging')}
                  className={`flex-1 text-xs font-medium cursor-pointer ${
                    pfType === 'lagging' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Lagging (Inductive)
                </button>
                <button
                  type="button"
                  onClick={() => setPfType('leading')}
                  className={`flex-1 text-xs font-medium cursor-pointer ${
                    pfType === 'leading' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Leading (Capacitive)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ac-freq" className="text-xs font-semibold text-slate-300">
                Grid Frequency (Hz)
              </label>
              <select
                id="ac-freq"
                value={frequencyHz}
                onChange={(e) => setFrequencyHz(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-xs font-mono text-slate-200 bg-slate-900/90 rounded-lg border border-slate-700 outline-none"
              >
                <option value={50}>50 Hz (Europe, Asia, Africa, AU)</option>
                <option value={60}>60 Hz (North America, Brazil)</option>
                <option value={400}>400 Hz (Aerospace / Avionics)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ac-target-pf" className="text-xs font-semibold text-slate-300">
                Target Power Factor for PFC
              </label>
              <input
                id="ac-target-pf"
                type="number"
                step="0.01"
                min="0.8"
                max="1.0"
                value={targetPf}
                onChange={(e) => setTargetPf(parseFloat(e.target.value) || 0.95)}
                className="px-3 py-2 text-xs font-mono text-slate-200 bg-slate-900/90 rounded-lg border border-slate-700 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <CircuitDiagram type="ac-power" data={result.visualData || {}} />
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
