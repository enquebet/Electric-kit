import React, { useState, useMemo } from 'react';
import { calculateLedResistor, COMMON_LED_PRESETS } from '../../engines/circuit/led-resistor';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { CircuitDiagram } from '../common/CircuitDiagram';
import { toBaseUnit } from '../../lib/units/quantities';

export const LedResistorTool: React.FC = () => {
  const [supplyV, setSupplyV] = useState<number>(5.0);
  const [supplyVUnit, setSupplyVUnit] = useState<string>('V');

  const [ledVf, setLedVf] = useState<number>(2.0);
  const [ledCurrent, setLedCurrent] = useState<number>(20);
  const [ledCurrentUnit, setLedCurrentUnit] = useState<string>('mA');

  const [seriesCount, setSeriesCount] = useState<number>(1);
  const [selectedPreset, setSelectedPreset] = useState<string>('Standard Red');

  const vsBase = toBaseUnit(supplyV, 'voltage', supplyVUnit);
  const ifBase = toBaseUnit(ledCurrent, 'current', ledCurrentUnit);

  const result = useMemo(() => {
    return calculateLedResistor({
      supplyVoltage: vsBase,
      ledForwardVoltage: ledVf,
      ledCurrent: ifBase,
      seriesCount,
    });
  }, [vsBase, ledVf, ifBase, seriesCount]);

  const handleApplyPreset = (preset: typeof COMMON_LED_PRESETS[0]) => {
    setSelectedPreset(preset.name);
    setLedVf(preset.vf);
    setLedCurrent(preset.defaultIf * 1000);
    setLedCurrentUnit('mA');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Preset LED Types */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Quick LED Presets (Forward Drop &amp; Chemistry)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COMMON_LED_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                selectedPreset === p.name
                  ? 'border-cyan-400 bg-cyan-950/40 text-slate-100 ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-slate-600"
                style={{ backgroundColor: p.color }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate">{p.name}</span>
                <span className="text-[10px] font-mono text-slate-400">{p.vf}V @ 20mA</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Circuit Variables</span>

          <UnitInput
            id="led-vs"
            label="Supply Voltage (V_supply)"
            symbol="Vs"
            quantity="voltage"
            value={supplyV}
            unit={supplyVUnit}
            onChangeValue={setSupplyV}
            onChangeUnit={setSupplyVUnit}
            min={0.5}
            description="Power rail potential (e.g. 5V, 12V)"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="led-vf" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>LED Forward Voltage (V_forward)</span>
              <span className="font-mono text-cyan-400">{ledVf} V</span>
            </label>
            <input
              id="led-vf"
              type="number"
              step="0.1"
              min="0.5"
              max="10"
              value={ledVf}
              onChange={(e) => {
                setLedVf(parseFloat(e.target.value) || 0);
                setSelectedPreset('Custom');
              }}
              className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-900/90 rounded-lg border border-slate-700 outline-none focus:border-cyan-500"
            />
          </div>

          <UnitInput
            id="led-if"
            label="Target Forward Current (I_forward)"
            symbol="If"
            quantity="current"
            value={ledCurrent}
            unit={ledCurrentUnit}
            onChangeValue={setLedCurrent}
            onChangeUnit={setLedCurrentUnit}
            min={1}
            max={5000}
            description="20mA standard indicator, 350mA+ high-power"
          />

          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
            <label htmlFor="led-series-count" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>LEDs in Series (N)</span>
              <span className="font-mono text-cyan-400">{seriesCount} {seriesCount === 1 ? 'LED' : 'LEDs'}</span>
            </label>
            <input
              id="led-series-count"
              type="range"
              min={1}
              max={10}
              value={seriesCount}
              onChange={(e) => setSeriesCount(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1</span>
              <span>5</span>
              <span>10 in series</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <CircuitDiagram type="led-resistor" data={result.visualData || {}} />
        </div>
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
