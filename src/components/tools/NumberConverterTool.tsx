import React, { useState, useMemo } from 'react';
import {
  calculateNumberConversion,
  calculateTwosComplement,
  calculateQFormat,
  calculateBitManipulation,
  calculateIntegerRanges,
  BitWidth,
  BitwiseOp,
} from '../../engines/digital/number-converter';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';

export const NumberConverterTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'radix' | 'twos-comp' | 'q-format' | 'bit-manip' | 'ranges'>('radix');

  // Radix Converter state
  const [sourceRadix, setSourceRadix] = useState<number>(10);
  const [inputValue, setInputValue] = useState<string>('255');
  const [bitWidth, setBitWidth] = useState<BitWidth>(8);
  const [isSigned, setIsSigned] = useState<boolean>(false);

  // Two's Complement state
  const [tcMode, setTcMode] = useState<'decimal-to-binary' | 'binary-to-decimal'>('decimal-to-binary');
  const [tcInput, setTcInput] = useState<string>('-42');
  const [tcWidth, setTcWidth] = useState<BitWidth>(8);

  // Q-Format state
  const [qIntBits, setQIntBits] = useState<number>(8);
  const [qFracBits, setQFracBits] = useState<number>(8);
  const [qSigned, setQSigned] = useState<boolean>(true);
  const [qFloatVal, setQFloatVal] = useState<number>(3.14159);

  // Bit Manipulation state
  const [bmInitialVal, setBmInitialVal] = useState<string>('0xAA');
  const [bmWidth, setBmWidth] = useState<BitWidth>(8);
  const [bmOp, setBmOp] = useState<BitwiseOp>('set');
  const [bmBitIndex, setBmBitIndex] = useState<number>(2);
  const [bmShiftAmt, setBmShiftAmt] = useState<number>(1);
  const [bmMask, setBmMask] = useState<string>('0x0F');

  // Calculation Results
  const radixResult = useMemo(() => {
    return calculateNumberConversion({
      rawValue: inputValue,
      sourceRadix,
      bitWidth,
      isSigned,
    });
  }, [inputValue, sourceRadix, bitWidth, isSigned]);

  const tcResult = useMemo(() => {
    return calculateTwosComplement({
      mode: tcMode,
      inputValue: tcInput,
      bitWidth: tcWidth,
    });
  }, [tcMode, tcInput, tcWidth]);

  const qResult = useMemo(() => {
    return calculateQFormat({
      integerBits: qIntBits,
      fractionalBits: qFracBits,
      isSigned: qSigned,
      floatValue: qFloatVal,
    });
  }, [qIntBits, qFracBits, qSigned, qFloatVal]);

  const bmResult = useMemo(() => {
    return calculateBitManipulation({
      initialValue: bmInitialVal,
      bitWidth: bmWidth,
      operation: bmOp,
      bitIndex: bmBitIndex,
      shiftAmount: bmShiftAmt,
      maskValue: bmMask,
    });
  }, [bmInitialVal, bmWidth, bmOp, bmBitIndex, bmShiftAmt, bmMask]);

  const handleBitToggle = (bitIndex: number) => {
    try {
      const currentWord = BigInt(radixResult.visualData?.unsignedBigInt || '0');
      const toggled = currentWord ^ (1n << BigInt(bitIndex));
      if (sourceRadix === 10) {
        setInputValue(toggled.toString(10));
      } else if (sourceRadix === 16) {
        setInputValue(toggled.toString(16).toUpperCase());
      } else if (sourceRadix === 2) {
        setInputValue(toggled.toString(2));
      } else if (sourceRadix === 8) {
        setInputValue(toggled.toString(8));
      } else {
        setInputValue(toggled.toString(sourceRadix));
      }
    } catch {
      // ignore
    }
  };

  const integerRangesData = useMemo(() => {
    return [4, 8, 16, 32, 64].map((w) => calculateIntegerRanges(w as BitWidth));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        {[
          { id: 'radix', label: 'Multi-Radix & Bitfield' },
          { id: 'twos-comp', label: "Two's Complement" },
          { id: 'q-format', label: 'Fixed-Point (Q-Format)' },
          { id: 'bit-manip', label: 'Bitwise Manipulator' },
          { id: 'ranges', label: 'Integer Ranges & Bounds' },
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

      {/* TAB 1: Multi-Radix Converter */}
      {activeTab === 'radix' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          {/* Bit Width & Signed Mode Switches */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Register Width:</span>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                {[4, 8, 16, 32, 64].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setBitWidth(w as BitWidth)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
                      bitWidth === w ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
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
              <span className="text-xs font-semibold text-slate-300">
                Two&apos;s Complement Signed Mode (MSB = Sign)
              </span>
            </label>
          </div>

          {/* Input Radix Tabs & Field */}
          <div className="flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Input Base (Radix)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { radix: 10, name: 'Decimal (Base 10)', prefix: '' },
                  { radix: 16, name: 'Hexadecimal (Base 16)', prefix: '0x' },
                  { radix: 2, name: 'Binary (Base 2)', prefix: '0b' },
                  { radix: 8, name: 'Octal (Base 8)', prefix: '0o' },
                ].map((r) => (
                  <button
                    key={r.radix}
                    type="button"
                    onClick={() => setSourceRadix(r.radix)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      sourceRadix === r.radix
                        ? 'border-cyan-400 bg-cyan-950/40 text-slate-100 ring-1 ring-cyan-500/30'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{r.name}</div>
                    <div className="text-[10px] font-mono text-cyan-400">{r.prefix || 'Dec digits'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="num-input" className="text-xs font-semibold text-slate-300">
                Input Numeric Literal
              </label>
              <input
                id="num-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-2.5 text-base font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder={
                  sourceRadix === 16 ? 'e.g. 0xFF or FF' : sourceRadix === 2 ? 'e.g. 10101010' : 'e.g. 255 or -42'
                }
              />
            </div>
          </div>

          {/* Interactive Bit Toggler Grid */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Interactive Bitfield (Click Any Bit to Toggle)
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                MSB (Bit {bitWidth - 1}) ↔ LSB (Bit 0)
              </span>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="flex items-center justify-start sm:justify-center gap-1 min-w-max py-2">
                {Array.from({ length: bitWidth })
                  .map((_, i) => bitWidth - 1 - i)
                  .map((bitIndex) => {
                    const currentWord = BigInt(radixResult.visualData?.unsignedBigInt || '0');
                    const isBitSet = (currentWord & (1n << BigInt(bitIndex))) !== 0n;
                    const isNibbleBoundary = bitIndex % 4 === 0 && bitIndex !== 0;

                    return (
                      <React.Fragment key={bitIndex}>
                        <button
                          type="button"
                          onClick={() => handleBitToggle(bitIndex)}
                          className={`w-7 sm:w-8 h-12 rounded flex flex-col items-center justify-between p-1 transition-all cursor-pointer border ${
                            isBitSet
                              ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-900/50 ring-1 ring-cyan-500/50'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                          }`}
                        >
                          <span className="text-[9px] font-mono text-slate-400">{bitIndex}</span>
                          <span className="text-sm font-mono font-bold">{isBitSet ? '1' : '0'}</span>
                        </button>
                        {isNibbleBoundary && <div className="w-1.5" />}
                      </React.Fragment>
                    );
                  })}
              </div>
            </div>
          </div>

          <ResultCard result={radixResult} />
          <StepExplanation steps={radixResult.steps} />
        </div>
      )}

      {/* TAB 2: Two's Complement Dedicated Tool */}
      {activeTab === 'twos-comp' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Conversion Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTcMode('decimal-to-binary');
                    setTcInput('-42');
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    tcMode === 'decimal-to-binary'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Signed Decimal → Binary
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTcMode('binary-to-decimal');
                    setTcInput('11010110');
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    tcMode === 'binary-to-decimal'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Binary String → Signed Dec
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Register Bit Width
              </label>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                {[8, 16, 32, 64].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTcWidth(w as BitWidth)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded cursor-pointer ${
                      tcWidth === w ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {w}-bit
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="tc-input" className="text-xs font-semibold text-slate-300">
                {tcMode === 'decimal-to-binary' ? 'Signed Integer Value (e.g. -128, -1, 127)' : 'Binary Bit Pattern'}
              </label>
              <input
                id="tc-input"
                type="text"
                value={tcInput}
                onChange={(e) => setTcInput(e.target.value)}
                className="w-full px-4 py-2.5 text-base font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <ResultCard result={tcResult} />
          <StepExplanation steps={tcResult.steps} />
        </div>
      )}

      {/* TAB 3: Fixed-Point Q-Format Converter */}
      {activeTab === 'q-format' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="q-int" className="text-xs font-semibold text-slate-300">
                Integer Bits (m)
              </label>
              <input
                id="q-int"
                type="number"
                min="0"
                max="32"
                value={qIntBits}
                onChange={(e) => setQIntBits(parseInt(e.target.value, 10) || 0)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="q-frac" className="text-xs font-semibold text-slate-300">
                Fractional Bits (n)
              </label>
              <input
                id="q-frac"
                type="number"
                min="1"
                max="32"
                value={qFracBits}
                onChange={(e) => setQFracBits(parseInt(e.target.value, 10) || 1)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Signedness</label>
              <button
                type="button"
                onClick={() => setQSigned(!qSigned)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                  qSigned
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {qSigned ? 'Signed (1 Sign Bit)' : 'Unsigned (UQ)'}
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="q-val" className="text-xs font-semibold text-slate-300">
                Analog / Float Value
              </label>
              <input
                id="q-val"
                type="number"
                step="0.001"
                value={qFloatVal}
                onChange={(e) => setQFloatVal(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 text-sm font-mono text-cyan-300 font-bold bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>
          </div>

          <ResultCard result={qResult} />
          <StepExplanation steps={qResult.steps} />
        </div>
      )}

      {/* TAB 4: Bitwise Operations & Shift/Rotate */}
      {activeTab === 'bit-manip' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bm-init" className="text-xs font-semibold text-slate-300">
                Initial Word (Hex/Bin/Dec)
              </label>
              <input
                id="bm-init"
                type="text"
                value={bmInitialVal}
                onChange={(e) => setBmInitialVal(e.target.value)}
                className="px-3 py-2 text-sm font-mono font-bold text-cyan-300 bg-slate-950 rounded-lg border border-slate-700"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Register Bit Width</label>
              <select
                value={bmWidth}
                onChange={(e) => setBmWidth(parseInt(e.target.value, 10) as BitWidth)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              >
                {[4, 8, 16, 32, 64].map((w) => (
                  <option key={w} value={w}>
                    {w}-bit
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Operation</label>
              <select
                value={bmOp}
                onChange={(e) => setBmOp(e.target.value as BitwiseOp)}
                className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
              >
                <option value="set">SET Bit ( | (1 &lt;&lt; n) )</option>
                <option value="clear">CLEAR Bit ( &amp; ~(1 &lt;&lt; n) )</option>
                <option value="toggle">TOGGLE Bit ( ^ (1 &lt;&lt; n) )</option>
                <option value="test">TEST Bit ( &amp; (1 &lt;&lt; n) )</option>
                <option value="shift-left">Shift Left (&lt;&lt;)</option>
                <option value="shift-right-logical">Shift Right Logical (&gt;&gt;&gt;)</option>
                <option value="shift-right-arithmetic">Shift Right Arithmetic (&gt;&gt;)</option>
                <option value="rotate-left">Rotate Left (ROL)</option>
                <option value="rotate-right">Rotate Right (ROR)</option>
                <option value="and-mask">Bitwise AND Mask (&amp;)</option>
                <option value="or-mask">Bitwise OR Mask (|)</option>
                <option value="xor-mask">Bitwise XOR Mask (^)</option>
                <option value="not">Bitwise NOT (~)</option>
              </select>
            </div>

            {['set', 'clear', 'toggle', 'test'].includes(bmOp) && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bm-idx" className="text-xs font-semibold text-slate-300">
                  Target Bit Index (0 to {bmWidth - 1})
                </label>
                <input
                  id="bm-idx"
                  type="number"
                  min="0"
                  max={bmWidth - 1}
                  value={bmBitIndex}
                  onChange={(e) => setBmBitIndex(parseInt(e.target.value, 10) || 0)}
                  className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
                />
              </div>
            )}

            {['shift-left', 'shift-right-logical', 'shift-right-arithmetic', 'rotate-left', 'rotate-right'].includes(bmOp) && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bm-shift" className="text-xs font-semibold text-slate-300">
                  Shift / Rotate Amount
                </label>
                <input
                  id="bm-shift"
                  type="number"
                  min="1"
                  max={bmWidth}
                  value={bmShiftAmt}
                  onChange={(e) => setBmShiftAmt(parseInt(e.target.value, 10) || 1)}
                  className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
                />
              </div>
            )}

            {['and-mask', 'or-mask', 'xor-mask'].includes(bmOp) && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bm-mask" className="text-xs font-semibold text-slate-300">
                  Mask Value
                </label>
                <input
                  id="bm-mask"
                  type="text"
                  value={bmMask}
                  onChange={(e) => setBmMask(e.target.value)}
                  className="px-3 py-2 text-sm font-mono text-slate-100 bg-slate-950 rounded-lg border border-slate-700"
                />
              </div>
            )}
          </div>

          <ResultCard result={bmResult} />
          <StepExplanation steps={bmResult.steps} />
        </div>
      )}

      {/* TAB 5: Integer Ranges & Bounds */}
      {activeTab === 'ranges' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-bold text-slate-200 mb-1">
              Standard Microcontroller &amp; Hardware Integer Representation Bounds
            </h3>
            <p className="text-xs text-slate-400">
              Comparative limits across standard register widths under Unsigned, Signed Magnitude, One&apos;s Complement, and Two&apos;s Complement arithmetic.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Width</th>
                  <th className="p-3">Unsigned Range</th>
                  <th className="p-3">Signed Magnitude</th>
                  <th className="p-3">One&apos;s Complement</th>
                  <th className="p-3 text-cyan-300">Two&apos;s Complement (Standard)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {integerRangesData.map((row) => (
                  <tr key={row.bitWidth} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-200">{row.bitWidth}-bit</td>
                    <td className="p-3">0 to {row.unsigned.max}</td>
                    <td className="p-3">{row.signedMagnitude.min} to +{row.signedMagnitude.max}</td>
                    <td className="p-3">{row.onesComplement.min} to +{row.onesComplement.max}</td>
                    <td className="p-3 font-bold text-cyan-400">
                      {row.twosComplement.min} to {row.twosComplement.max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
