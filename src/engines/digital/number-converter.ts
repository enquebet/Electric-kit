import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';

export type BitWidth = 4 | 8 | 16 | 32 | 64;

export interface NumberConverterInputs {
  sourceRadix: 2 | 8 | 10 | 16 | number;
  rawValue: string;
  bitWidth: BitWidth;
  isSigned: boolean;
}

export function calculateNumberConversion(inputs: NumberConverterInputs): CalculationResult {
  const { sourceRadix, rawValue, bitWidth, isSigned } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const cleanInput = rawValue.trim().replace(/^0b|^0x|^0o/i, '');

  let rawBigInt = 0n;
  let isValid = false;

  try {
    if (sourceRadix === 2) {
      if (/^[+-]?[01]+$/.test(cleanInput)) {
        isValid = true;
        const sign = cleanInput.startsWith('-') ? -1n : 1n;
        const mag = cleanInput.replace(/^[+-]/, '');
        rawBigInt = sign * BigInt('0b' + mag);
      }
    } else if (sourceRadix === 8) {
      if (/^[+-]?[0-7]+$/.test(cleanInput)) {
        isValid = true;
        const sign = cleanInput.startsWith('-') ? -1n : 1n;
        const mag = cleanInput.replace(/^[+-]/, '');
        rawBigInt = sign * BigInt('0o' + mag);
      }
    } else if (sourceRadix === 10) {
      if (/^[+-]?[0-9]+$/.test(cleanInput)) {
        isValid = true;
        rawBigInt = BigInt(cleanInput);
      }
    } else if (sourceRadix === 16) {
      if (/^[+-]?[0-9a-fA-F]+$/.test(cleanInput)) {
        isValid = true;
        const sign = cleanInput.startsWith('-') ? -1n : 1n;
        const mag = cleanInput.replace(/^[+-]/, '');
        rawBigInt = sign * BigInt('0x' + mag);
      }
    } else if (sourceRadix >= 2 && sourceRadix <= 36) {
      // Arbitrary radix parsing via integer parse
      const parsed = parseInt(cleanInput, sourceRadix);
      if (!isNaN(parsed)) {
        isValid = true;
        rawBigInt = BigInt(parsed);
      }
    }
  } catch {
    isValid = false;
  }

  if (!isValid) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Radix Literal',
      message: `The entered value "${rawValue.trim()}" is invalid for base-${sourceRadix}.`,
    });
    rawBigInt = 0n;
  }

  const modulus = 1n << BigInt(bitWidth);
  const maxUnsigned = modulus - 1n;
  const minSigned = -(1n << BigInt(bitWidth - 1));
  const maxSigned = (1n << BigInt(bitWidth - 1)) - 1n;

  // Range and overflow check
  if (isSigned && (rawBigInt < minSigned || rawBigInt > maxSigned)) {
    warnings.push({
      severity: 'warning',
      title: 'Signed Integer Overflow',
      message: `Value ${rawBigInt.toString()} exceeds ${bitWidth}-bit signed range [${minSigned.toString()} ... ${maxSigned.toString()}]. It will wrap in two's complement arithmetic.`,
    });
  } else if (!isSigned && (rawBigInt < 0n || rawBigInt > maxUnsigned)) {
    warnings.push({
      severity: 'warning',
      title: 'Unsigned Range Out of Bounds',
      message: `Value ${rawBigInt.toString()} is outside ${bitWidth}-bit unsigned range [0 ... ${maxUnsigned.toString()}].`,
    });
  }

  // Normalized unsigned word in register
  const unsignedWord = ((rawBigInt % modulus) + modulus) % modulus;

  // Signed interpretation
  const signThreshold = 1n << BigInt(bitWidth - 1);
  const signedVal = unsignedWord >= signThreshold ? unsignedWord - modulus : unsignedWord;

  // Binary string padded to bitWidth
  let binStr = unsignedWord.toString(2).padStart(bitWidth, '0');
  if (binStr.length > bitWidth) {
    binStr = binStr.slice(-bitWidth);
  }

  // Group into 4-bit nibbles
  const nibbles: string[] = [];
  for (let i = 0; i < binStr.length; i += 4) {
    nibbles.push(binStr.slice(i, i + 4));
  }
  const formattedBinary = nibbles.join(' ');

  // Hex string
  const hexNibblesCount = Math.ceil(bitWidth / 4);
  const hexStr = unsignedWord.toString(16).toUpperCase().padStart(hexNibblesCount, '0');

  // Octal string
  const octStr = unsignedWord.toString(8);

  // Bit array for UI rendering
  const bitArray = binStr.split('').map((char, index) => ({
    bitPosition: bitWidth - 1 - index,
    value: parseInt(char, 10),
    isSignBit: index === 0,
  }));

  // Byte Endianness
  const totalBytes = Math.ceil(bitWidth / 8);
  const bytes: string[] = [];
  for (let i = 0; i < totalBytes; i++) {
    const shift = BigInt((totalBytes - 1 - i) * 8);
    const byteVal = Number((unsignedWord >> shift) & 0xffn);
    bytes.push(byteVal.toString(16).toUpperCase().padStart(2, '0'));
  }
  const bigEndianHex = bytes.map((b) => '0x' + b).join(' ');
  const littleEndianHex = [...bytes].reverse().map((b) => '0x' + b).join(' ');

  steps.push({
    stepNumber: 1,
    title: `Normalize to ${bitWidth}-Bit Register`,
    formula: `Mask = 2^${bitWidth} - 1 (0x${maxUnsigned.toString(16).toUpperCase()})`,
    substitution: `Input "${cleanInput}" (Base ${sourceRadix}) → Raw: ${rawBigInt.toString()} | Unsigned: ${unsignedWord.toString()} | Signed: ${signedVal.toString()}`,
    result: `Hex: 0x${hexStr} | Dec (${isSigned ? 'Signed' : 'Unsigned'}): ${isSigned ? signedVal.toString() : unsignedWord.toString()}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Format Binary Nibbles & Sign Bit',
    formula: `Bit Width = ${bitWidth}, MSB = Bit ${bitWidth - 1} (${bitArray[0]?.value === 1 ? '1 = Negative' : '0 = Positive'})`,
    substitution: `Bits: ${binStr}`,
    result: formattedBinary,
  });

  const numericPrimary = Number(isSigned ? signedVal : unsignedWord);

  return {
    primaryValue: Number.isSafeInteger(numericPrimary) ? numericPrimary : Number(unsignedWord & 0xffffffffn),
    formattedValue: isSigned ? signedVal.toString() : unsignedWord.toString(),
    unit: '',
    label: `Decimal (${isSigned ? 'Signed' : 'Unsigned'})`,
    classification: 'THEORETICAL',
    standardsContext: "IEC 61131-3 & ISO/IEC 9899 Integer data representations and two's complement binary encoding.",
    warnings,
    steps,
    additionalOutputs: {
      hex: {
        label: 'Hexadecimal',
        value: `0x${hexStr}`,
        note: `${hexNibblesCount} nibbles`,
      },
      binary: {
        label: 'Binary (Base 2)',
        value: formattedBinary,
        note: `${bitWidth} bits`,
      },
      octal: {
        label: 'Octal (Base 8)',
        value: `0o${octStr}`,
      },
      signedDecimal: {
        label: "Two's Complement Signed",
        value: signedVal.toString(),
        note: signedVal < 0n ? 'Negative (MSB = 1)' : 'Positive (MSB = 0)',
      },
      unsignedDecimal: {
        label: 'Unsigned Decimal',
        value: unsignedWord.toString(),
        note: `Range: [0 ... ${maxUnsigned.toString()}]`,
      },
      bigEndian: {
        label: 'Big-Endian Bytes',
        value: bigEndianHex,
        note: 'Network byte order (MSB first)',
      },
      littleEndian: {
        label: 'Little-Endian Bytes',
        value: littleEndianHex,
        note: 'x86 / ARM Cortex byte order (LSB first)',
      },
    },
    visualData: {
      bitWidth,
      isSigned,
      decValue: Number(unsignedWord), // provided for backward-compat
      unsignedWord: Number(unsignedWord),
      signedVal: Number(signedVal),
      rawBigInt: rawBigInt.toString(),
      unsignedBigInt: unsignedWord.toString(),
      signedBigInt: signedVal.toString(),
      hexStr,
      formattedBinary,
      bitArray,
      bytes,
    },
  };
}

export function convertNumber(inputs: {
  rawInput: string;
  sourceRadix: 2 | 8 | 10 | 16;
  bitWidth: 8 | 16 | 32;
  isSigned: boolean;
}): CalculationResult {
  return calculateNumberConversion({
    rawValue: inputs.rawInput,
    sourceRadix: inputs.sourceRadix,
    bitWidth: inputs.bitWidth as BitWidth,
    isSigned: inputs.isSigned,
  });
}

// -------------------------------------------------------------
// Two's Complement Dedicated Engine
// -------------------------------------------------------------
export interface TwosComplementInputs {
  mode: 'decimal-to-binary' | 'binary-to-decimal';
  inputValue: string;
  bitWidth: BitWidth;
}

export function calculateTwosComplement(inputs: TwosComplementInputs): CalculationResult {
  const { mode, inputValue, bitWidth } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const modulus = 1n << BigInt(bitWidth);
  const minSigned = -(1n << BigInt(bitWidth - 1));
  const maxSigned = (1n << BigInt(bitWidth - 1)) - 1n;
  const signThreshold = 1n << BigInt(bitWidth - 1);

  let signedDec = 0n;
  let unsignedWord = 0n;
  let binaryStr = '';

  if (mode === 'decimal-to-binary') {
    const cleaned = inputValue.trim();
    if (!/^[+-]?[0-9]+$/.test(cleaned)) {
      warnings.push({
        severity: 'danger',
        title: 'Invalid Decimal Integer',
        message: `"${inputValue}" is not a valid signed decimal integer.`,
      });
    } else {
      signedDec = BigInt(cleaned);
      if (signedDec < minSigned || signedDec > maxSigned) {
        warnings.push({
          severity: 'warning',
          title: "Two's Complement Overflow",
          message: `Value ${signedDec.toString()} is outside ${bitWidth}-bit range [${minSigned.toString()} ... ${maxSigned.toString()}]. Result will be wrapped.`,
        });
      }
      unsignedWord = ((signedDec % modulus) + modulus) % modulus;
      binaryStr = unsignedWord.toString(2).padStart(bitWidth, '0');
    }
  } else {
    // binary-to-decimal
    const cleaned = inputValue.replace(/\s+/g, '');
    if (!/^[01]+$/.test(cleaned)) {
      warnings.push({
        severity: 'danger',
        title: 'Invalid Binary String',
        message: 'Binary input must contain only characters 0 and 1.',
      });
      binaryStr = '0'.repeat(bitWidth);
    } else {
      binaryStr = cleaned.padStart(bitWidth, '0').slice(-bitWidth);
      unsignedWord = BigInt('0b' + binaryStr);
      signedDec = unsignedWord >= signThreshold ? unsignedWord - modulus : unsignedWord;
    }
  }

  // Formatting binary in nibbles
  const nibbles: string[] = [];
  for (let i = 0; i < binaryStr.length; i += 4) {
    nibbles.push(binaryStr.slice(i, i + 4));
  }
  const formattedBinary = nibbles.join(' ');

  // Invert bits + 1 derivation step
  const invertedBinary = binaryStr
    .split('')
    .map((b) => (b === '1' ? '0' : '1'))
    .join('');

  steps.push({
    stepNumber: 1,
    title: "Two's Complement Representation",
    formula: `Range: [ -2^(${bitWidth}-1) ... +2^(${bitWidth}-1) - 1 ] = [ ${minSigned.toString()} ... ${maxSigned.toString()} ]`,
    substitution: `Decimal: ${signedDec.toString()} ↔ Word: 0x${unsignedWord.toString(16).toUpperCase()}`,
    result: `Binary: ${formattedBinary}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Negation Derivation (Bit Inversion + 1)',
    formula: "-X = (~X) + 1",
    substitution: `~(${binaryStr}) = ${invertedBinary} ; (+ 1)`,
    result: `Magnitude / Complement resolved with MSB=${binaryStr[0]} (${binaryStr[0] === '1' ? 'Negative' : 'Positive'})`,
  });

  return {
    primaryValue: Number(signedDec),
    formattedValue: signedDec.toString(),
    unit: '',
    label: "Two's Complement Signed Decimal",
    classification: 'THEORETICAL',
    standardsContext: "Two's complement encoding per ISO/IEC 10967 standard mathematical computer arithmetic.",
    warnings,
    steps,
    additionalOutputs: {
      binary: {
        label: 'Binary Representation',
        value: formattedBinary,
        note: `${bitWidth}-bit string`,
      },
      hex: {
        label: 'Hexadecimal Equivalent',
        value: '0x' + unsignedWord.toString(16).toUpperCase().padStart(Math.ceil(bitWidth / 4), '0'),
      },
      signBit: {
        label: 'Sign Bit (MSB)',
        value: binaryStr[0] || '0',
        note: binaryStr[0] === '1' ? 'Negative' : 'Positive or Zero',
      },
      validRange: {
        label: 'Representable Range',
        value: `[ ${minSigned.toString()} ... ${maxSigned.toString()} ]`,
      },
    },
    visualData: {
      mode,
      bitWidth,
      signedDec: signedDec.toString(),
      unsignedWord: unsignedWord.toString(),
      binaryStr,
      formattedBinary,
      invertedBinary,
    },
  };
}

// -------------------------------------------------------------
// Fixed-Point Q-Format Converter
// -------------------------------------------------------------
export interface QFormatInputs {
  integerBits: number; // m
  fractionalBits: number; // n
  isSigned: boolean;
  floatValue: number;
}

export function calculateQFormat(inputs: QFormatInputs): CalculationResult {
  const { integerBits: m, fractionalBits: n, isSigned, floatValue: x } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const totalBits = (isSigned ? 1 : 0) + m + n;
  if (totalBits > 64) {
    warnings.push({
      severity: 'warning',
      title: 'Word Width Exceeds 64 Bits',
      message: `Total bit width (${totalBits} bits) exceeds standard 64-bit integer arithmetic.`,
    });
  }

  // Quantization step / resolution
  const resolution = Math.pow(2, -n);

  // Maximum and minimum representable values
  const maxVal = isSigned ? Math.pow(2, m) - resolution : Math.pow(2, m) - resolution;
  const minVal = isSigned ? -Math.pow(2, m) : 0;

  if (x < minVal || x > maxVal) {
    warnings.push({
      severity: 'warning',
      title: 'Fixed-Point Saturation / Overflow',
      message: `Input ${x} is outside representable Q${m}.${n} range [${minVal.toFixed(4)} ... ${maxVal.toFixed(4)}].`,
    });
  }

  // Clamped & quantized value
  const clampedX = Math.max(minVal, Math.min(x, maxVal));
  const scalingFactor = Math.pow(2, n);
  const rawCode = Math.round(clampedX * scalingFactor);
  const quantizedFloat = rawCode / scalingFactor;
  const quantizationError = Math.abs(x - quantizedFloat);

  // Unsigned binary code representation
  const modulus = 1n << BigInt(Math.min(totalBits, 64));
  let bigIntCode = BigInt(rawCode);
  if (bigIntCode < 0n) {
    bigIntCode = ((bigIntCode % modulus) + modulus) % modulus;
  }
  const binaryString = bigIntCode.toString(2).padStart(totalBits, '0');
  const integerPartBin = binaryString.slice(0, (isSigned ? 1 : 0) + m);
  const fractionalPartBin = binaryString.slice((isSigned ? 1 : 0) + m);
  const formattedQBinary = `${integerPartBin}.${fractionalPartBin}`;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Q-Format Resolution & Dynamic Range',
    formula: `Resolution = 2^(-n) = 2^(-${n}); Range = [${minVal.toFixed(4)} ... ${maxVal.toFixed(4)}]`,
    substitution: `m = ${m} integer bits, n = ${n} fractional bits, total = ${totalBits} bits`,
    result: `Resolution (LSB): ${resolution.toFixed(8)} | Step: 2^(${ -n })`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Quantize Decimal to Fixed-Point Word',
    formula: 'Code = round( x × 2^n ); x_quantized = Code / 2^n',
    substitution: `Code = round( ${x} × ${scalingFactor} ) = ${rawCode}`,
    result: `Quantized: ${quantizedFloat.toFixed(6)} | Error: ${quantizationError.toFixed(8)} (≤ 0.5 LSB: ${(resolution / 2).toFixed(8)})`,
  });

  return {
    primaryValue: quantizedFloat,
    formattedValue: quantizedFloat.toFixed(6),
    unit: '',
    label: `Q${m}.${n} Quantized Value`,
    classification: 'THEORETICAL',
    standardsContext: 'Fixed-Point DSP Arithmetic (CMSIS-DSP Q7, Q15, Q31 and generic Qm.n format).',
    warnings,
    steps,
    additionalOutputs: {
      qFormatName: {
        label: 'Format Specification',
        value: `${isSigned ? 'Q' : 'UQ'}${m}.${n}`,
        note: `${totalBits} total bits (${isSigned ? '1 sign + ' : ''}${m} int + ${n} frac)`,
      },
      resolution: {
        label: 'Resolution (LSB Size)',
        value: resolution.toExponential(4),
        note: `2^(-${n})`,
      },
      hexCode: {
        label: 'Hex Register Code',
        value: '0x' + bigIntCode.toString(16).toUpperCase(),
      },
      binaryCode: {
        label: 'Fixed-Point Binary',
        value: formattedQBinary,
        note: `${integerPartBin} (int) . ${fractionalPartBin} (frac)`,
      },
      quantizationError: {
        label: 'Quantization Error',
        value: quantizationError.toExponential(4),
        note: `Max theoretical error: ±${(resolution / 2).toExponential(4)}`,
      },
      dynamicRange: {
        label: 'Representable Range',
        value: `[ ${minVal} ... ${maxVal} ]`,
      },
    },
    visualData: {
      m,
      n,
      isSigned,
      totalBits,
      resolution,
      rawCode,
      quantizedFloat,
      quantizationError,
      formattedQBinary,
      integerPartBin,
      fractionalPartBin,
    },
  };
}

// -------------------------------------------------------------
// Engineering Bit Manipulation Tool
// -------------------------------------------------------------
export type BitwiseOp =
  | 'set'
  | 'clear'
  | 'toggle'
  | 'test'
  | 'shift-left'
  | 'shift-right-logical'
  | 'shift-right-arithmetic'
  | 'rotate-left'
  | 'rotate-right'
  | 'and-mask'
  | 'or-mask'
  | 'xor-mask'
  | 'not';

export interface BitManipulationInputs {
  initialValue: string; // hex, dec, or bin
  bitWidth: BitWidth;
  operation: BitwiseOp;
  bitIndex?: number; // 0 to bitWidth - 1
  shiftAmount?: number; // 1 to bitWidth
  maskValue?: string; // for mask operations
}

export function calculateBitManipulation(inputs: BitManipulationInputs): CalculationResult {
  const { initialValue, bitWidth, operation, bitIndex = 0, shiftAmount = 1, maskValue = '0x00' } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const modulus = 1n << BigInt(bitWidth);
  const maxMask = modulus - 1n;

  // Parse initial value
  let initialBigInt = 0n;
  try {
    const s = initialValue.trim();
    if (s.startsWith('0b') || s.startsWith('0B')) initialBigInt = BigInt(s);
    else if (s.startsWith('0x') || s.startsWith('0X')) initialBigInt = BigInt(s);
    else if (/^[0-9]+$/.test(s)) initialBigInt = BigInt(s);
    else initialBigInt = BigInt('0x' + s);
  } catch {
    initialBigInt = 0n;
    warnings.push({
      severity: 'warning',
      title: 'Invalid Input',
      message: 'Could not parse initial value. Falling back to 0.',
    });
  }
  const initialWord = ((initialBigInt % modulus) + modulus) % modulus;

  // Parse mask value
  let maskBigInt = 0n;
  try {
    const s = maskValue.trim();
    if (s.startsWith('0b') || s.startsWith('0B')) maskBigInt = BigInt(s);
    else if (s.startsWith('0x') || s.startsWith('0X')) maskBigInt = BigInt(s);
    else if (/^[0-9]+$/.test(s)) maskBigInt = BigInt(s);
    else maskBigInt = BigInt('0x' + s);
  } catch {
    maskBigInt = 0n;
  }
  const maskWord = ((maskBigInt % modulus) + modulus) % modulus;

  let resultWord = initialWord;
  let testResult: boolean | undefined;
  const safeBit = BigInt(Math.max(0, Math.min(bitIndex, bitWidth - 1)));
  const safeShift = BigInt(Math.max(0, shiftAmount % bitWidth));

  switch (operation) {
    case 'set':
      resultWord = initialWord | (1n << safeBit);
      break;
    case 'clear':
      resultWord = initialWord & ~(1n << safeBit) & maxMask;
      break;
    case 'toggle':
      resultWord = (initialWord ^ (1n << safeBit)) & maxMask;
      break;
    case 'test':
      testResult = (initialWord & (1n << safeBit)) !== 0n;
      resultWord = initialWord;
      break;
    case 'shift-left':
      resultWord = (initialWord << safeShift) & maxMask;
      break;
    case 'shift-right-logical':
      resultWord = (initialWord >> safeShift) & maxMask;
      break;
    case 'shift-right-arithmetic': {
      const isNegative = (initialWord & (1n << BigInt(bitWidth - 1))) !== 0n;
      let shifted = initialWord >> safeShift;
      if (isNegative) {
        // Sign-extend from top
        const signMask = (maxMask >> (BigInt(bitWidth) - safeShift)) << (BigInt(bitWidth) - safeShift);
        shifted |= signMask;
      }
      resultWord = shifted & maxMask;
      break;
    }
    case 'rotate-left':
      resultWord = ((initialWord << safeShift) | (initialWord >> (BigInt(bitWidth) - safeShift))) & maxMask;
      break;
    case 'rotate-right':
      resultWord = ((initialWord >> safeShift) | (initialWord << (BigInt(bitWidth) - safeShift))) & maxMask;
      break;
    case 'and-mask':
      resultWord = initialWord & maskWord;
      break;
    case 'or-mask':
      resultWord = initialWord | maskWord;
      break;
    case 'xor-mask':
      resultWord = initialWord ^ maskWord;
      break;
    case 'not':
      resultWord = ~initialWord & maxMask;
      break;
  }

  const inBin = initialWord.toString(2).padStart(bitWidth, '0');
  const outBin = resultWord.toString(2).padStart(bitWidth, '0');
  const hexOut = '0x' + resultWord.toString(16).toUpperCase().padStart(Math.ceil(bitWidth / 4), '0');

  steps.push({
    stepNumber: 1,
    title: `Execute Operation: ${operation.toUpperCase()}`,
    formula: `Register: ${bitWidth}-bit mask (0x${maxMask.toString(16).toUpperCase()})`,
    substitution: `Input: ${inBin} | Op: ${operation}${operation.includes('shift') || operation.includes('rotate') ? ` by ${shiftAmount}` : ` on bit ${bitIndex}`}`,
    result: `Result: ${outBin} (${hexOut})`,
  });

  return {
    primaryValue: Number(resultWord & 0xffffffffn),
    formattedValue: hexOut,
    unit: '',
    label: 'Bitwise Result',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      binary: {
        label: 'Result Binary',
        value: outBin,
      },
      hex: {
        label: 'Result Hex',
        value: hexOut,
      },
      decimal: {
        label: 'Result Decimal',
        value: resultWord.toString(),
      },
      ...(testResult !== undefined
        ? {
            testBit: {
              label: `Bit ${bitIndex} Status`,
              value: testResult ? 'SET (1)' : 'CLEARED (0)',
              note: testResult ? 'Condition TRUE' : 'Condition FALSE',
            },
          }
        : {}),
    },
    visualData: {
      initialWord: initialWord.toString(),
      resultWord: resultWord.toString(),
      inBin,
      outBin,
      bitWidth,
      operation,
      testResult,
    },
  };
}

// -------------------------------------------------------------
// Integer Range Calculator
// -------------------------------------------------------------
export interface IntegerRangeResult {
  bitWidth: BitWidth;
  unsigned: { min: string; max: string; totalValues: string };
  signedMagnitude: { min: string; max: string; zeroNotes: string };
  onesComplement: { min: string; max: string; zeroNotes: string };
  twosComplement: { min: string; max: string; asymmetric: boolean };
}

export function calculateIntegerRanges(bitWidth: BitWidth): IntegerRangeResult {
  const n = BigInt(bitWidth);
  const unsignedMax = (1n << n) - 1n;
  const signedMagMax = (1n << (n - 1n)) - 1n;
  const signedMagMin = -signedMagMax;
  const twosCompMin = -(1n << (n - 1n));
  const twosCompMax = (1n << (n - 1n)) - 1n;

  return {
    bitWidth,
    unsigned: {
      min: '0',
      max: unsignedMax.toString(),
      totalValues: (1n << n).toString(),
    },
    signedMagnitude: {
      min: signedMagMin.toString(),
      max: signedMagMax.toString(),
      zeroNotes: 'Dual zeros (+0 and -0)',
    },
    onesComplement: {
      min: signedMagMin.toString(),
      max: signedMagMax.toString(),
      zeroNotes: 'Dual zeros: 00...0 (+0) and 11...1 (-0)',
    },
    twosComplement: {
      min: twosCompMin.toString(),
      max: twosCompMax.toString(),
      asymmetric: true, // extra negative number
    },
  };
}
