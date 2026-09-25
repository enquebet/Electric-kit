import React, { useState, useMemo } from 'react';
import {
  calculateAdc,
  calculateDac,
} from '../../engines/digital/adc-dac';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';

export const AdcDacTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'adc' | 'dac'>('adc');

  // ADC State
  const [adcBits, setAdcBits] = useState<number>(12);
  const [adcVref, setAdcVref] = useState<number>(3.3);
  const [adcMode, setAdcMode] = useState<'voltage-to-code' | 'code-to-voltage'>('voltage-to-code');
  const [adcInputVoltage, setAdcInputVoltage] = useState<number>(1.65);
  const [adcDigitalCode, setAdcDigitalCode] = useState<number>(2048);

  // DAC State
  const [dacBits, setDacBits] = useState<number>(12);
  const [dacVref, setDacVref] = useState<number>(5.0);
  const [dacMode, setDacMode] = useState<'code-to-voltage' | 'voltage-to-code'>('code-to-voltage');
  const [dacDigitalCode, setDacDigitalCode] = useState<number>(2048);
  const [dacInputVoltage, setDacInputVoltage] = useState<number>(2.5);
  const [dacBipolar, setDacBipolar] = useState<boolean>(false);

  const adcResult = useMemo(() => {
    return calculateAdc({
      resolutionBits: adcBits,
      vRef: adcVref,
      mode: adcMode,
      inputVoltage: adcInputVoltage,
      adcCode: adcDigitalCode,
    });
  }, [adcBits, adcVref, adcMode, adcInputVoltage, adcDigitalCode]);

  const dacResult = useMemo(() => {
    return calculateDac({
      resolutionBits: dacBits,
      vRef: dacVref,
      digitalCode: dacDigitalCode,
      isBipolar: dacBipolar,
    });
  }, [dacBits, dacVref, dacDigitalCode, dacBipolar]);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('adc')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'adc'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Analog-to-Digital Converter (ADC)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dac')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'dac'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Digital-to-Analog Converter (DAC)
        </button>
      </div>

      {/* TAB 1: ADC */}
      {activeTab === 'adc' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            {/* Resolution */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="adc-res" className="text-xs font-semibold text-slate-300">
                ADC Resolution (Bits)
              </label>
              <select
                id="adc-res"
                value={adcBits}
                onChange={(e) => setAdcBits(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              >
                {[8, 10, 12, 14, 16, 18, 24].map((b) => (
                  <option key={b} value={b}>
                    {b}-bit (2^{b} = {(1 << b).toLocaleString()} steps)
                  </option>
                ))}
              </select>
            </div>

            {/* Vref */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="adc-vref" className="text-xs font-semibold text-slate-300">
                Reference Voltage (V_ref)
              </label>
              <div className="flex gap-2">
                <input
                  id="adc-vref"
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={adcVref}
                  onChange={(e) => setAdcVref(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                />
                <select
                  value={adcVref}
                  onChange={(e) => setAdcVref(parseFloat(e.target.value))}
                  className="w-24 px-2 py-2 text-xs font-mono text-slate-200 bg-slate-950 rounded-lg border border-slate-700"
                >
                  <option value={3.3}>3.3 V</option>
                  <option value={5.0}>5.0 V</option>
                  <option value={2.5}>2.5 V</option>
                  <option value={1.024}>1.024 V</option>
                  <option value={2.048}>2.048 V</option>
                  <option value={4.096}>4.096 V</option>
                </select>
              </div>
            </div>

            {/* Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Input Mode</label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setAdcMode('voltage-to-code')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    adcMode === 'voltage-to-code' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Voltage → Code
                </button>
                <button
                  type="button"
                  onClick={() => setAdcMode('code-to-voltage')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    adcMode === 'code-to-voltage' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Code → Voltage
                </button>
              </div>
            </div>

            {/* Input Value */}
            <div className="flex flex-col gap-1.5">
              {adcMode === 'voltage-to-code' ? (
                <>
                  <label htmlFor="adc-vin" className="text-xs font-semibold text-slate-300">
                    Analog Input Voltage (V_in)
                  </label>
                  <input
                    id="adc-vin"
                    type="number"
                    step="0.01"
                    value={adcInputVoltage}
                    onChange={(e) => setAdcInputVoltage(parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                  />
                </>
              ) : (
                <>
                  <label htmlFor="adc-code" className="text-xs font-semibold text-slate-300">
                    Digital Output Code (0 to {(1 << adcBits) - 1})
                  </label>
                  <input
                    id="adc-code"
                    type="number"
                    min="0"
                    max={(1 << adcBits) - 1}
                    value={adcDigitalCode}
                    onChange={(e) => setAdcDigitalCode(parseInt(e.target.value, 10) || 0)}
                    className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                  />
                </>
              )}
            </div>
          </div>

          <ResultCard result={adcResult} />
          <StepExplanation steps={adcResult.steps} />
        </div>
      )}

      {/* TAB 2: DAC */}
      {activeTab === 'dac' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            {/* Resolution */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dac-res" className="text-xs font-semibold text-slate-300">
                DAC Resolution (Bits)
              </label>
              <select
                id="dac-res"
                value={dacBits}
                onChange={(e) => setDacBits(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              >
                {[8, 10, 12, 14, 16].map((b) => (
                  <option key={b} value={b}>
                    {b}-bit ({(1 << b).toLocaleString()} steps)
                  </option>
                ))}
              </select>
            </div>

            {/* Vref */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dac-vref" className="text-xs font-semibold text-slate-300">
                Full-Scale Reference (V_ref)
              </label>
              <input
                id="dac-vref"
                type="number"
                step="0.1"
                min="0.5"
                value={dacVref}
                onChange={(e) => setDacVref(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>

            {/* Output Polarity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Output Polarity</label>
              <button
                type="button"
                onClick={() => setDacBipolar(!dacBipolar)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                  dacBipolar
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {dacBipolar ? 'Bipolar (-Vref to +Vref)' : 'Unipolar (0 to Vref)'}
              </button>
            </div>

            {/* Mode & Value */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dac-in-code" className="text-xs font-semibold text-slate-300">
                Digital Input Code
              </label>
              <input
                id="dac-in-code"
                type="number"
                min="0"
                max={(1 << dacBits) - 1}
                value={dacDigitalCode}
                onChange={(e) => setDacDigitalCode(parseInt(e.target.value, 10) || 0)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>
          </div>

          <ResultCard result={dacResult} />
          <StepExplanation steps={dacResult.steps} />
        </div>
      )}
    </div>
  );
};
