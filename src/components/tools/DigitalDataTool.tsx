import React, { useState, useMemo } from 'react';
import {
  calculateBinaryArithmetic,
  calculateDataTransfer,
  convertStorageUnits,
  ArithmeticOp,
} from '../../engines/digital/digital-data';
import { BitWidth } from '../../engines/digital/number-converter';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';

export const DigitalDataTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alu' | 'transfer'>('alu');

  // ALU state
  const [operandA, setOperandA] = useState<string>('15');
  const [operandB, setOperandB] = useState<string>('1');
  const [aluOp, setAluOp] = useState<ArithmeticOp>('add');
  const [bitWidth, setBitWidth] = useState<BitWidth>(8);
  const [isSigned, setIsSigned] = useState<boolean>(false);

  // Data Transfer state
  const [fileSize, setFileSize] = useState<number>(100);
  const [sizeUnit, setSizeUnit] = useState<'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'KiB' | 'MiB' | 'GiB'>('MB');
  const [transferRate, setTransferRate] = useState<number>(50);
  const [rateUnit, setRateUnit] = useState<'bps' | 'Kbps' | 'Mbps' | 'Gbps' | 'Bps' | 'KBps' | 'MBps'>('Mbps');

  const aluResult = useMemo(() => {
    return calculateBinaryArithmetic({
      operandA,
      operandB,
      operation: aluOp,
      bitWidth,
      isSigned,
    });
  }, [operandA, operandB, aluOp, bitWidth, isSigned]);

  const transferResult = useMemo(() => {
    return calculateDataTransfer({
      fileSize,
      sizeUnit,
      transferRate,
      rateUnit,
    });
  }, [fileSize, sizeUnit, transferRate, rateUnit]);

  const storageEquivalents = useMemo(() => {
    return convertStorageUnits(fileSize, sizeUnit);
  }, [fileSize, sizeUnit]);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('alu')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'alu'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Binary Arithmetic &amp; ALU Flags
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transfer')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'transfer'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Data Rate &amp; Transfer Time
        </button>
      </div>

      {/* TAB 1: ALU Arithmetic */}
      {activeTab === 'alu' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Register Bit Width:</span>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                {[4, 8, 16, 32, 64].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setBitWidth(w as BitWidth)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
                      bitWidth === w ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {w}-bit
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSigned}
                onChange={(e) => setIsSigned(e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-300">Signed (Two&apos;s Complement)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="alu-op-a" className="text-xs font-semibold text-slate-300">
                Operand A (Dec/Hex/Bin)
              </label>
              <input
                id="alu-op-a"
                type="text"
                value={operandA}
                onChange={(e) => setOperandA(e.target.value)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                placeholder="e.g. 255 or 0xFF"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Arithmetic / Logic Operation</label>
              <select
                value={aluOp}
                onChange={(e) => setAluOp(e.target.value as ArithmeticOp)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              >
                <option value="add">Addition (+)</option>
                <option value="sub">Subtraction (-)</option>
                <option value="mul">Multiplication (×)</option>
                <option value="div">Division (/)</option>
                <option value="mod">Modulo / Remainder (%)</option>
                <option value="and">Bitwise AND (&amp;)</option>
                <option value="or">Bitwise OR (|)</option>
                <option value="xor">Bitwise XOR (^)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="alu-op-b" className="text-xs font-semibold text-slate-300">
                Operand B (Dec/Hex/Bin)
              </label>
              <input
                id="alu-op-b"
                type="text"
                value={operandB}
                onChange={(e) => setOperandB(e.target.value)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                placeholder="e.g. 1 or 0x01"
              />
            </div>
          </div>

          {/* Processor Status Flags Panel */}
          {aluResult.visualData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950">
              <div
                className={`p-3 rounded-lg border flex flex-col items-center ${
                  aluResult.visualData.carry
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] uppercase font-bold">Carry (C)</span>
                <span className="text-lg font-mono font-bold mt-0.5">
                  {aluResult.visualData.carry ? '1 (SET)' : '0 (CLEAR)'}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg border flex flex-col items-center ${
                  aluResult.visualData.overflow
                    ? 'bg-rose-950/50 border-rose-500 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] uppercase font-bold">Overflow (V)</span>
                <span className="text-lg font-mono font-bold mt-0.5">
                  {aluResult.visualData.overflow ? '1 (SET)' : '0 (CLEAR)'}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg border flex flex-col items-center ${
                  aluResult.visualData.zero
                    ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] uppercase font-bold">Zero (Z)</span>
                <span className="text-lg font-mono font-bold mt-0.5">
                  {aluResult.visualData.zero ? '1 (SET)' : '0 (CLEAR)'}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg border flex flex-col items-center ${
                  aluResult.visualData.negative
                    ? 'bg-purple-950/50 border-purple-500 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] uppercase font-bold">Negative (N)</span>
                <span className="text-lg font-mono font-bold mt-0.5">
                  {aluResult.visualData.negative ? '1 (SET)' : '0 (CLEAR)'}
                </span>
              </div>
            </div>
          )}

          <ResultCard result={aluResult} />
          <StepExplanation steps={aluResult.steps} />
        </div>
      )}

      {/* TAB 2: Data Transfer & Rate */}
      {activeTab === 'transfer' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            {/* File Size */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="trans-size" className="text-xs font-semibold text-slate-300">
                Payload / Storage Volume
              </label>
              <div className="flex gap-2">
                <input
                  id="trans-size"
                  type="number"
                  min="0.001"
                  step="any"
                  value={fileSize}
                  onChange={(e) => setFileSize(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                />
                <select
                  value={sizeUnit}
                  onChange={(e) => setSizeUnit(e.target.value as any)}
                  className="w-28 px-2 py-2 text-xs font-mono text-slate-200 bg-slate-950 rounded-lg border border-slate-700"
                >
                  <option value="B">Bytes (B)</option>
                  <option value="KB">kB (10³)</option>
                  <option value="MB">MB (10⁶)</option>
                  <option value="GB">GB (10⁹)</option>
                  <option value="TB">TB (10¹²)</option>
                  <option value="KiB">KiB (2¹⁰)</option>
                  <option value="MiB">MiB (2²⁰)</option>
                  <option value="GiB">GiB (2³⁰)</option>
                </select>
              </div>
            </div>

            {/* Transfer Rate */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="trans-rate" className="text-xs font-semibold text-slate-300">
                Network Throughput / Transfer Rate
              </label>
              <div className="flex gap-2">
                <input
                  id="trans-rate"
                  type="number"
                  min="0.001"
                  step="any"
                  value={transferRate}
                  onChange={(e) => setTransferRate(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                />
                <select
                  value={rateUnit}
                  onChange={(e) => setRateUnit(e.target.value as any)}
                  className="w-28 px-2 py-2 text-xs font-mono text-slate-200 bg-slate-950 rounded-lg border border-slate-700"
                >
                  <option value="bps">bps</option>
                  <option value="Kbps">kbps</option>
                  <option value="Mbps">Mbps</option>
                  <option value="Gbps">Gbps</option>
                  <option value="Bps">B/s</option>
                  <option value="KBps">kB/s</option>
                  <option value="MBps">MB/s</option>
                </select>
              </div>
            </div>
          </div>

          {/* SI vs IEC Comparison Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Storage Equivalent Formats (SI Decimal vs IEC Binary)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 text-xs font-mono p-3">
              <div className="p-2">
                <div className="text-slate-400 text-[10px]">Exact Bytes:</div>
                <div className="text-cyan-300 font-bold mt-0.5">{storageEquivalents.bytes.toLocaleString()} B</div>
              </div>
              <div className="p-2">
                <div className="text-slate-400 text-[10px]">SI Kilobytes (kB):</div>
                <div className="text-slate-200 mt-0.5">{storageEquivalents.kB.toLocaleString()} kB</div>
              </div>
              <div className="p-2">
                <div className="text-slate-400 text-[10px]">IEC Kibibytes (KiB):</div>
                <div className="text-slate-200 mt-0.5">{storageEquivalents.KiB.toLocaleString()} KiB</div>
              </div>
              <div className="p-2">
                <div className="text-slate-400 text-[10px]">Megabytes / Mebibytes:</div>
                <div className="text-slate-200 mt-0.5">
                  {storageEquivalents.MB.toFixed(2)} MB / {storageEquivalents.MiB.toFixed(2)} MiB
                </div>
              </div>
            </div>
          </div>

          <ResultCard result={transferResult} />
          <StepExplanation steps={transferResult.steps} />
        </div>
      )}
    </div>
  );
};
