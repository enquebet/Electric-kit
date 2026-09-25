import React, { useState, useMemo } from 'react';
import {
  calculateInvertingAmplifier,
  calculateNonInvertingAmplifier,
  calculateOpAmpFollower,
  calculateSummingAmplifier,
  calculateDifferentialAmplifier,
} from '../../engines/components/opamps';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';
import { Activity, Plus, Trash2, Sliders } from 'lucide-react';

export const OpAmpTool: React.FC = () => {
  const [opMode, setOpMode] = useState<'inverting' | 'non-inverting' | 'follower' | 'summing' | 'differential'>('inverting');

  // Common resistors
  const [rin, setRin] = useState<number>(10);
  const [rinUnit, setRinUnit] = useState<string>('kΩ');
  const [rf, setRf] = useState<number>(100);
  const [rfUnit, setRfUnit] = useState<string>('kΩ');
  const [vin, setVin] = useState<number>(1.0);
  const [vinUnit, setVinUnit] = useState<string>('V');

  // Supply rails
  const [vpos, setVpos] = useState<number>(15);
  const [vneg, setVneg] = useState<number>(-15);

  // Differential mode
  const [r1Diff, setR1Diff] = useState<number>(10);
  const [r2Diff, setR2Diff] = useState<number>(100);
  const [v1Diff, setV1Diff] = useState<number>(1.0);
  const [v2Diff, setV2Diff] = useState<number>(1.5);

  // Summing mode channels
  const [channels, setChannels] = useState<Array<{ id: string; vin: number; rin: number }>>([
    { id: '1', vin: 1.0, rin: 10 },
    { id: '2', vin: 2.0, rin: 10 },
  ]);

  const addChannel = () => {
    setChannels([...channels, { id: (channels.length + 1).toString(), vin: 1.0, rin: 10 }]);
  };

  const removeChannel = (idx: number) => {
    if (channels.length <= 1) return;
    setChannels(channels.filter((_, i) => i !== idx));
  };

  const updateChannel = (idx: number, field: 'vin' | 'rin', val: number) => {
    const next = [...channels];
    next[idx] = { ...next[idx], [field]: val };
    setChannels(next);
  };

  const RinBase = toBaseUnit(rin, 'resistance', rinUnit);
  const RfBase = toBaseUnit(rf, 'resistance', rfUnit);
  const VinBase = toBaseUnit(vin, 'voltage', vinUnit);

  const result = useMemo(() => {
    switch (opMode) {
      case 'non-inverting':
        return calculateNonInvertingAmplifier({
          rGround: RinBase,
          rFeedback: RfBase,
          vIn: VinBase,
          vSupplyPos: vpos,
          vSupplyNeg: vneg,
        });
      case 'follower':
        return calculateOpAmpFollower({
          vIn: VinBase,
          vSupplyPos: vpos,
          vSupplyNeg: vneg,
        });
      case 'summing':
        return calculateSummingAmplifier({
          channels: channels.map(c => ({
            vIn: c.vin,
            rIn: c.rin * 1000,
          })),
          rFeedback: RfBase,
          vSupplyPos: vpos,
          vSupplyNeg: vneg,
        });
      case 'differential':
        return calculateDifferentialAmplifier({
          r1: r1Diff * 1000,
          r2: r2Diff * 1000,
          r3: r1Diff * 1000,
          r4: r2Diff * 1000,
          v1: v1Diff,
          v2: v2Diff,
          vSupplyPos: vpos,
          vSupplyNeg: vneg,
        });
      case 'inverting':
      default:
        return calculateInvertingAmplifier({
          rIn: RinBase,
          rFeedback: RfBase,
          vIn: VinBase,
          vSupplyPos: vpos,
          vSupplyNeg: vneg,
        });
    }
  }, [opMode, RinBase, RfBase, VinBase, vpos, vneg, r1Diff, r2Diff, v1Diff, v2Diff, channels]);

  return (
    <div className="flex flex-col gap-6">
      {/* Op-Amp Topologies */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setOpMode('inverting')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            opMode === 'inverting'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Inverting (Av = -Rf/Rin)
        </button>

        <button
          type="button"
          onClick={() => setOpMode('non-inverting')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            opMode === 'non-inverting'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Non-Inverting (Av = 1 + Rf/Rg)
        </button>

        <button
          type="button"
          onClick={() => setOpMode('follower')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            opMode === 'follower'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Voltage Follower (Buffer Av = 1)
        </button>

        <button
          type="button"
          onClick={() => setOpMode('summing')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            opMode === 'summing'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Summing Amplifier
        </button>

        <button
          type="button"
          onClick={() => setOpMode('differential')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            opMode === 'differential'
              ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Differential Amplifier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-4 bg-slate-900/50 p-5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Feedback &amp; Source Configuration
          </span>

          {(opMode === 'inverting' || opMode === 'non-inverting' || opMode === 'follower') && (
            <UnitInput
              id="op-vin"
              label="Input Voltage (V_in)"
              symbol="Vin"
              quantity="voltage"
              value={vin}
              unit={vinUnit}
              onChangeValue={setVin}
              onChangeUnit={setVinUnit}
            />
          )}

          {(opMode === 'inverting' || opMode === 'non-inverting') && (
            <>
              <UnitInput
                id="op-rin"
                label={opMode === 'inverting' ? 'Input Resistor (R_in)' : 'Ground Resistor (R_g)'}
                symbol="Rin"
                quantity="resistance"
                value={rin}
                unit={rinUnit}
                onChangeValue={setRin}
                onChangeUnit={setRinUnit}
                min={0.01}
              />
              <UnitInput
                id="op-rf"
                label="Feedback Resistor (R_f)"
                symbol="Rf"
                quantity="resistance"
                value={rf}
                unit={rfUnit}
                onChangeValue={setRf}
                onChangeUnit={setRfUnit}
                min={0.01}
              />
            </>
          )}

          {opMode === 'summing' && (
            <div className="flex flex-col gap-3">
              <UnitInput
                id="op-sum-rf"
                label="Feedback Resistor (R_f)"
                symbol="Rf"
                quantity="resistance"
                value={rf}
                unit={rfUnit}
                onChangeValue={setRf}
                onChangeUnit={setRfUnit}
                min={0.01}
              />
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-300">Input Channels</span>
                <button
                  type="button"
                  onClick={addChannel}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded bg-cyan-950/60 border border-cyan-800/50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Channel
                </button>
              </div>
              {channels.map((ch, i) => (
                <div key={ch.id} className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-xs font-mono text-slate-400">CH{i + 1}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={ch.vin}
                    onChange={(e) => updateChannel(i, 'vin', parseFloat(e.target.value) || 0)}
                    placeholder="Vin (V)"
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                  <span className="text-xs text-slate-500">V</span>
                  <input
                    type="number"
                    value={ch.rin}
                    onChange={(e) => updateChannel(i, 'rin', parseFloat(e.target.value) || 1)}
                    placeholder="Rin (kΩ)"
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                  <span className="text-xs text-slate-500">kΩ</span>
                  {channels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChannel(i)}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {opMode === 'differential' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">Input V1 (Inverting Leg)</label>
                  <input
                    type="number"
                    value={v1Diff}
                    onChange={(e) => setV1Diff(parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">Input V2 (Non-Inverting Leg)</label>
                  <input
                    type="number"
                    value={v2Diff}
                    onChange={(e) => setV2Diff(parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">R1, R3 (kΩ)</label>
                  <input
                    type="number"
                    value={r1Diff}
                    onChange={(e) => setR1Diff(parseFloat(e.target.value) || 1)}
                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">R2, R4 (kΩ)</label>
                  <input
                    type="number"
                    value={r2Diff}
                    onChange={(e) => setR2Diff(parseFloat(e.target.value) || 1)}
                    className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Supply Rails */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-mono">+V_rail (V)</label>
              <input
                type="number"
                value={vpos}
                onChange={(e) => setVpos(parseFloat(e.target.value) || 15)}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-mono">-V_rail (V)</label>
              <input
                type="number"
                value={vneg}
                onChange={(e) => setVneg(parseFloat(e.target.value) || -15)}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Op-Amp Analytical Metrics */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              Transfer Characteristics &amp; Saturation
            </span>
            <span className="text-slate-500">Linear Op-Amp Model</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-400 font-mono uppercase">Theoretical Closed-Loop Output (V_out)</span>
              <span className="text-3xl font-mono font-extrabold text-cyan-300 mt-1">
                {result.formattedValue}
              </span>
              <span className="text-xs text-slate-400 font-mono mt-1">
                Closed-Loop Voltage Gain (Av):{' '}
                <span className="text-amber-400 font-bold">{result.visualData?.gain?.toFixed(3) ?? '1.000'}</span>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Rail Saturation Check:</span>
              {result.visualData?.isClipped ? (
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 font-bold">
                  Saturated at {result.visualData.actualOutput?.toFixed(1)} V
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                  In Linear Headroom Range
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
