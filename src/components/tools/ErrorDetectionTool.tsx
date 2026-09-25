import React, { useState, useMemo } from 'react';
import {
  calculateParity,
  calculateCrc,
  calculateHamming74,
  CRC_PRESETS,
} from '../../engines/digital/error-detection';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';

export const ErrorDetectionTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'parity' | 'crc' | 'hamming'>('parity');

  // Parity state
  const [parityInput, setParityInput] = useState<string>('1011001');
  const [parityType, setParityType] = useState<'even' | 'odd'>('even');
  const [parityMode, setParityMode] = useState<'generate' | 'verify'>('generate');

  // CRC state
  const [crcString, setCrcString] = useState<string>('123456789');
  const [isHexInput, setIsHexInput] = useState<boolean>(false);
  const [crcPreset, setCrcPreset] = useState<string>(CRC_PRESETS[0].name);

  // Hamming state
  const [hammingData, setHammingData] = useState<string>('1011');
  const [receivedCode, setReceivedCode] = useState<string>('0110011');

  const parityResult = useMemo(() => {
    return calculateParity({
      inputData: parityInput,
      parityType,
      mode: parityMode,
    });
  }, [parityInput, parityType, parityMode]);

  const crcResult = useMemo(() => {
    return calculateCrc({
      inputString: crcString,
      isHexInput,
      presetName: crcPreset,
    });
  }, [crcString, isHexInput, crcPreset]);

  const hammingResult = useMemo(() => {
    return calculateHamming74({
      dataBits: hammingData,
      receivedCode,
    });
  }, [hammingData, receivedCode]);

  const handleInjectBitFlip = (bitPos: number) => {
    if (!receivedCode || receivedCode.length < 7) return;
    const bits = receivedCode.replace(/\s+/g, '').slice(0, 7).split('');
    const idx = bitPos - 1;
    bits[idx] = bits[idx] === '1' ? '0' : '1';
    setReceivedCode(bits.join(''));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('parity')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'parity'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Parity Generator &amp; Check
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('crc')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'crc'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Cyclic Redundancy Check (CRC)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hamming')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'hamming'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Hamming Code (7,4) SEC
        </button>
      </div>

      {/* TAB 1: Parity */}
      {activeTab === 'parity' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="parity-data" className="text-xs font-semibold text-slate-300">
                Binary Bitstream
              </label>
              <input
                id="parity-data"
                type="text"
                value={parityInput}
                onChange={(e) => setParityInput(e.target.value)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                placeholder="e.g. 1011001"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Parity Convention</label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setParityType('even')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    parityType === 'even' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Even Parity
                </button>
                <button
                  type="button"
                  onClick={() => setParityType('odd')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    parityType === 'odd' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Odd Parity
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Operation Mode</label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setParityMode('generate')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    parityMode === 'generate' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Generate Bit
                </button>
                <button
                  type="button"
                  onClick={() => setParityMode('verify')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    parityMode === 'verify' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Verify Frame
                </button>
              </div>
            </div>
          </div>

          <ResultCard result={parityResult} />
          <StepExplanation steps={parityResult.steps} />
        </div>
      )}

      {/* TAB 2: CRC */}
      {activeTab === 'crc' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              CRC Standard Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {CRC_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setCrcPreset(p.name)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    crcPreset === p.name
                      ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 ring-1 ring-cyan-500/30'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{p.name}</div>
                  <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                    Poly 0x{p.poly.toString(16).toUpperCase()} · {p.width}-bit
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="md:col-span-8 flex flex-col gap-1.5">
              <label htmlFor="crc-payload" className="text-xs font-semibold text-slate-300">
                Payload String / Data
              </label>
              <input
                id="crc-payload"
                type="text"
                value={crcString}
                onChange={(e) => setCrcString(e.target.value)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                placeholder={isHexInput ? 'e.g. 01 03 00 00 00 0A' : 'e.g. 123456789 or Hello'}
              />
            </div>

            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Input Data Encoding</label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setIsHexInput(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded cursor-pointer ${
                    !isHexInput ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  ASCII Text
                </button>
                <button
                  type="button"
                  onClick={() => setIsHexInput(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded cursor-pointer ${
                    isHexInput ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Hex Bytes
                </button>
              </div>
            </div>
          </div>

          <ResultCard result={crcResult} />
          <StepExplanation steps={crcResult.steps} />
        </div>
      )}

      {/* TAB 3: Hamming (7,4) */}
      {activeTab === 'hamming' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hamming-data" className="text-xs font-semibold text-slate-300">
                Original 4-bit Data Nibble (d3 d5 d6 d7)
              </label>
              <input
                id="hamming-data"
                type="text"
                maxLength={4}
                value={hammingData}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^01]/g, '').slice(0, 4);
                  setHammingData(v);
                  if (v.length === 4) {
                    // Update codeword template
                    const d = v.split('').map((c) => parseInt(c, 10) & 1);
                    const p1 = d[0] ^ d[1] ^ d[3];
                    const p2 = d[0] ^ d[2] ^ d[3];
                    const p4 = d[1] ^ d[2] ^ d[3];
                    setReceivedCode(`${p1}${p2}${d[0]}${p4}${d[1]}${d[2]}${d[3]}`);
                  }
                }}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
                placeholder="e.g. 1011"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="hamming-rx" className="text-xs font-semibold text-slate-300">
                Received 7-bit Codeword [p1 p2 d3 p4 d5 d6 d7]
              </label>
              <input
                id="hamming-rx"
                type="text"
                maxLength={7}
                value={receivedCode}
                onChange={(e) => setReceivedCode(e.target.value.replace(/[^01]/g, '').slice(0, 7))}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>
          </div>

          {/* Interactive Error Injection Grid */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Simulate Channel Noise: Click Bit to Inject Single-Bit Error
              </span>
              <button
                type="button"
                onClick={() => {
                  const d = hammingData.padStart(4, '0').split('').map((c) => parseInt(c, 10) & 1);
                  const p1 = d[0] ^ d[1] ^ d[3];
                  const p2 = d[0] ^ d[2] ^ d[3];
                  const p4 = d[1] ^ d[2] ^ d[3];
                  setReceivedCode(`${p1}${p2}${d[0]}${p4}${d[1]}${d[2]}${d[3]}`);
                }}
                className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Reset to Clean Codeword
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {[
                { pos: 1, label: 'p1 (Bit 1)' },
                { pos: 2, label: 'p2 (Bit 2)' },
                { pos: 3, label: 'd3 (Bit 3)' },
                { pos: 4, label: 'p4 (Bit 4)' },
                { pos: 5, label: 'd5 (Bit 5)' },
                { pos: 6, label: 'd6 (Bit 6)' },
                { pos: 7, label: 'd7 (Bit 7)' },
              ].map((b) => {
                const bitChar = receivedCode[b.pos - 1] || '0';
                return (
                  <button
                    key={b.pos}
                    type="button"
                    onClick={() => handleInjectBitFlip(b.pos)}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/80 hover:border-cyan-500 flex flex-col items-center cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-mono text-slate-400">{b.label}</span>
                    <span className="text-base font-mono font-bold text-cyan-300 mt-1">{bitChar}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <ResultCard result={hammingResult} />
          <StepExplanation steps={hammingResult.steps} />
        </div>
      )}
    </div>
  );
};
