import React, { useState, useMemo } from 'react';
import {
  calculateUart,
  calculateSpi,
  calculateI2c,
  calculateCan,
} from '../../engines/embedded/serial-protocols';
import { UnitInput } from '../common/UnitInput';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { toBaseUnit } from '../../lib/units/quantities';

export const SerialProtocolsTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'uart' | 'spi' | 'i2c' | 'can'>('uart');

  // UART State
  const [uartBaud, setUartBaud] = useState<number>(115200);
  const [uartDataBits, setUartDataBits] = useState<5 | 6 | 7 | 8 | 9>(8);
  const [uartParity, setUartParity] = useState<'none' | 'even' | 'odd'>('none');
  const [uartStopBits, setUartStopBits] = useState<1 | 1.5 | 2>(1);
  const [uartActualBaud, setUartActualBaud] = useState<number>(115200);

  // SPI State
  const [spiSck, setSpiSck] = useState<number>(10);
  const [sckUnit, setSckUnit] = useState<string>('MHz');
  const [spiWordBits, setSpiWordBits] = useState<8 | 16 | 32>(8);
  const [spiBytes, setSpiBytes] = useState<number>(128);
  const [spiCsDelayNs, setSpiCsDelayNs] = useState<number>(100);
  const [spiInterWordNs, setSpiInterWordNs] = useState<number>(50);

  // I2C State
  const [i2cMode, setI2cMode] = useState<'standard' | 'fast' | 'fast-plus'>('fast');
  const [i2cAddrMode, setI2cAddrMode] = useState<'7-bit' | '10-bit'>('7-bit');
  const [i2cBytes, setI2cBytes] = useState<number>(16);
  const [i2cCbPf, setI2cCbPf] = useState<number>(150);
  const [i2cVdd, setI2cVdd] = useState<number>(3.3);

  // CAN State
  const [canBaud, setCanBaud] = useState<number>(500000);
  const [canClock, setCanClock] = useState<number>(40);
  const [canClockUnit, setCanClockUnit] = useState<string>('MHz');
  const [canFrame, setCanFrame] = useState<'standard' | 'extended'>('standard');
  const [canBytes, setCanBytes] = useState<number>(8);

  const sckBase = toBaseUnit(spiSck, 'frequency', sckUnit);
  const canClockBase = toBaseUnit(canClock, 'frequency', canClockUnit);

  const uartResult = useMemo(() => {
    return calculateUart({
      targetBaudRate: uartBaud,
      dataBits: uartDataBits,
      parity: uartParity,
      stopBits: uartStopBits,
    });
  }, [uartBaud, uartDataBits, uartParity, uartStopBits]);

  const spiResult = useMemo(() => {
    return calculateSpi({
      sckFrequencyHz: sckBase,
      wordSizeBits: spiWordBits,
      byteCount: spiBytes,
      csSetupHoldNs: spiCsDelayNs,
      interWordDelayNs: spiInterWordNs,
    });
  }, [sckBase, spiWordBits, spiBytes, spiCsDelayNs, spiInterWordNs]);

  const i2cResult = useMemo(() => {
    return calculateI2c({
      speedMode: i2cMode,
      addressMode: i2cAddrMode,
      payloadBytes: i2cBytes,
      busCapacitancePf: i2cCbPf,
      supplyVoltageV: i2cVdd,
    });
  }, [i2cMode, i2cAddrMode, i2cBytes, i2cCbPf, i2cVdd]);

  const canResult = useMemo(() => {
    return calculateCan({
      nominalBitRateBps: canBaud,
      canClockHz: canClockBase,
      frameFormat: canFrame,
      payloadBytes: canBytes,
    });
  }, [canBaud, canClockBase, canFrame, canBytes]);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        {[
          { id: 'uart', label: 'UART / RS-232 / RS-485' },
          { id: 'spi', label: 'SPI Bus' },
          { id: 'i2c', label: 'I²C Bus & Pull-Up Sizing' },
          { id: 'can', label: 'CAN Bus Bit Timing' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: UART */}
      {activeTab === 'uart' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            {/* Baud Rate */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="uart-baud" className="text-xs font-semibold text-slate-300">
                Target Baud Rate (bps)
              </label>
              <select
                id="uart-baud"
                value={uartBaud}
                onChange={(e) => {
                  const b = parseInt(e.target.value, 10);
                  setUartBaud(b);
                  setUartActualBaud(b);
                }}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              >
                {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600, 1000000, 2000000].map((b) => (
                  <option key={b} value={b}>
                    {b.toLocaleString()} bps
                  </option>
                ))}
              </select>
            </div>

            {/* Data Bits */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Data Bits</label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                {([7, 8, 9] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setUartDataBits(b)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded cursor-pointer ${
                      uartDataBits === b ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {b} bits
                  </button>
                ))}
              </div>
            </div>

            {/* Parity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Parity Bit</label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                {(['none', 'even', 'odd'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setUartParity(p)}
                    className={`flex-1 py-1.5 text-xs font-bold capitalize rounded cursor-pointer ${
                      uartParity === p ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Stop Bits */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Stop Bits</label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                {([1, 1.5, 2] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUartStopBits(s)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded cursor-pointer ${
                      uartStopBits === s ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ResultCard result={uartResult} />
          <StepExplanation steps={uartResult.steps} />
        </div>
      )}

      {/* TAB 2: SPI */}
      {activeTab === 'spi' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <UnitInput
              id="spi-sck"
              label="SPI Master SCK Frequency"
              symbol="f_sck"
              quantity="frequency"
              value={spiSck}
              unit={sckUnit}
              onChangeValue={setSpiSck}
              onChangeUnit={setSckUnit}
              min={0.01}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="spi-payload" className="text-xs font-semibold text-slate-300">
                Payload Size (Bytes)
              </label>
              <input
                id="spi-payload"
                type="number"
                min="1"
                value={spiBytes}
                onChange={(e) => setSpiBytes(parseInt(e.target.value, 10) || 1)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="spi-cs" className="text-xs font-semibold text-slate-300">
                CS Setup &amp; Hold Overhead (ns)
              </label>
              <input
                id="spi-cs"
                type="number"
                min="0"
                value={spiCsDelayNs}
                onChange={(e) => setSpiCsDelayNs(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="spi-delay" className="text-xs font-semibold text-slate-300">
                Inter-Word Gap / Delay (ns)
              </label>
              <input
                id="spi-delay"
                type="number"
                min="0"
                value={spiInterWordNs}
                onChange={(e) => setSpiInterWordNs(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>
          </div>

          <ResultCard result={spiResult} />
          <StepExplanation steps={spiResult.steps} />
        </div>
      )}

      {/* TAB 3: I2C */}
      {activeTab === 'i2c' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            {/* Speed Mode */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="i2c-speed" className="text-xs font-semibold text-slate-300">
                I²C Speed Mode
              </label>
              <select
                id="i2c-speed"
                value={i2cMode}
                onChange={(e) => setI2cMode(e.target.value as any)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              >
                <option value="standard">Standard Mode (100 kHz)</option>
                <option value="fast">Fast Mode (400 kHz)</option>
                <option value="fast-plus">Fast Mode Plus (1.0 MHz)</option>
              </select>
            </div>

            {/* Bus Capacitance */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="i2c-cap" className="text-xs font-semibold text-slate-300">
                Total Bus Capacitance C_b (pF)
              </label>
              <input
                id="i2c-cap"
                type="number"
                min="10"
                max="1000"
                value={i2cCbPf}
                onChange={(e) => setI2cCbPf(parseFloat(e.target.value) || 10)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              />
              <span className="text-[10px] text-slate-400">PCB traces + pin capacitance</span>
            </div>

            {/* Supply Voltage */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="i2c-vdd" className="text-xs font-semibold text-slate-300">
                Bus Supply Voltage V_DD (V)
              </label>
              <input
                id="i2c-vdd"
                type="number"
                step="0.1"
                min="1.8"
                max="5.5"
                value={i2cVdd}
                onChange={(e) => setI2cVdd(parseFloat(e.target.value) || 3.3)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>

            {/* Payload */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="i2c-payload" className="text-xs font-semibold text-slate-300">
                Data Payload (Bytes)
              </label>
              <input
                id="i2c-payload"
                type="number"
                min="1"
                value={i2cBytes}
                onChange={(e) => setI2cBytes(parseInt(e.target.value, 10) || 1)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>
          </div>

          <ResultCard result={i2cResult} />
          <StepExplanation steps={i2cResult.steps} />
        </div>
      )}

      {/* TAB 4: CAN */}
      {activeTab === 'can' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            {/* CAN Baud */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="can-baud" className="text-xs font-semibold text-slate-300">
                Nominal Bit Rate
              </label>
              <select
                id="can-baud"
                value={canBaud}
                onChange={(e) => setCanBaud(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              >
                <option value={125000}>125 kbps (Low-speed)</option>
                <option value={250000}>250 kbps (Commercial/J1939)</option>
                <option value={500000}>500 kbps (Automotive standard)</option>
                <option value={1000000}>1.0 Mbps (High-speed CAN)</option>
              </select>
            </div>

            <UnitInput
              id="can-clk"
              label="CAN Controller Peripheral Clock"
              symbol="f_can"
              quantity="frequency"
              value={canClock}
              unit={canClockUnit}
              onChangeValue={setCanClock}
              onChangeUnit={setCanClockUnit}
              min={1}
            />

            {/* Frame Format */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Identifier Format</label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setCanFrame('standard')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    canFrame === 'standard' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  11-bit ID
                </button>
                <button
                  type="button"
                  onClick={() => setCanFrame('extended')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    canFrame === 'extended' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  29-bit ID
                </button>
              </div>
            </div>

            {/* Payload */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="can-bytes" className="text-xs font-semibold text-slate-300">
                Payload DLC (0 to 8 Bytes)
              </label>
              <input
                id="can-bytes"
                type="number"
                min="0"
                max="8"
                value={canBytes}
                onChange={(e) => setCanBytes(parseInt(e.target.value, 10) || 0)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>
          </div>

          <ResultCard result={canResult} />
          <StepExplanation steps={canResult.steps} />
        </div>
      )}
    </div>
  );
};
