import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';

// -------------------------------------------------------------
// Parity Generator & Validator
// -------------------------------------------------------------
export interface ParityInputs {
  inputData: string; // binary string or hex
  parityType: 'even' | 'odd';
  mode: 'generate' | 'verify';
  receivedParityBit?: 0 | 1;
}

export function calculateParity(inputs: ParityInputs): CalculationResult {
  const { inputData, parityType, mode, receivedParityBit } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let cleanBin = inputData.replace(/\s+/g, '');
  if (cleanBin.startsWith('0x') || cleanBin.startsWith('0X')) {
    cleanBin = BigInt(cleanBin).toString(2);
  }

  if (!/^[01]+$/.test(cleanBin)) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Binary Data',
      message: 'Input data must contain only 0 and 1 binary digits.',
    });
    cleanBin = '0';
  }

  const onesCount = cleanBin.split('').filter((b) => b === '1').length;
  // In Even parity, total number of 1s (including parity bit) must be even
  // If onesCount is even, parity bit = 0; if odd, parity bit = 1
  const generatedParity = parityType === 'even' ? (onesCount % 2 === 0 ? 0 : 1) : (onesCount % 2 === 0 ? 1 : 0);

  const fullWord = cleanBin + generatedParity.toString();

  steps.push({
    stepNumber: 1,
    title: `Count Ones in Payload (${parityType.toUpperCase()} Parity)`,
    formula: 'Ones Count = ∑ bits',
    substitution: `Data: ${cleanBin} → Contains ${onesCount} logic HIGH ('1') bit(s)`,
    result: `Ones count is ${onesCount % 2 === 0 ? 'EVEN' : 'ODD'}`,
  });

  let parityError = false;
  if (mode === 'verify' && receivedParityBit !== undefined) {
    parityError = generatedParity !== receivedParityBit;
    steps.push({
      stepNumber: 2,
      title: 'Verify Received Parity Bit',
      formula: 'Expected Parity Bit == Received Parity Bit',
      substitution: `Expected: ${generatedParity} ; Received: ${receivedParityBit}`,
      result: parityError ? 'PARITY ERROR DETECTED' : 'PARITY CHECK PASSED',
    });

    if (parityError) {
      warnings.push({
        severity: 'danger',
        title: 'Parity Check Failure',
        message: `Parity mismatch! Received parity bit ${receivedParityBit} does not match expected ${parityType} parity bit ${generatedParity}. An odd number of bit errors occurred.`,
      });
    }
  } else {
    steps.push({
      stepNumber: 2,
      title: `Append ${parityType.toUpperCase()} Parity Bit`,
      formula: `${parityType === 'even' ? 'Parity = (∑ bits) mod 2' : 'Parity = 1 - ((∑ bits) mod 2)'}`,
      substitution: `${parityType.toUpperCase()} Parity bit = ${generatedParity}`,
      result: `Transmitted Word = ${cleanBin} [${generatedParity}] (${cleanBin.length + 1} bits)`,
    });
  }

  return {
    primaryValue: generatedParity,
    formattedValue: mode === 'verify' ? (parityError ? 'ERROR' : 'VALID') : generatedParity.toString(),
    unit: '',
    label: mode === 'verify' ? 'Parity Integrity' : `${parityType.toUpperCase()} Parity Bit`,
    classification: 'THEORETICAL',
    standardsContext: 'ISO 1177 / ITU-T V.4 Parity bit error detection for asynchronous transmission.',
    warnings,
    steps,
    additionalOutputs: {
      parityBit: {
        label: 'Calculated Parity Bit',
        value: generatedParity.toString(),
      },
      onesCount: {
        label: '1s in Data Word',
        value: onesCount.toString(),
        note: onesCount % 2 === 0 ? 'Even count' : 'Odd count',
      },
      transmittedWord: {
        label: 'Payload + Parity Bit',
        value: fullWord,
        note: `Total ${fullWord.length} bits`,
      },
      integrityStatus: {
        label: 'Detection Capability',
        value: 'Single-bit error detection',
        note: 'Blind to even numbers of bit flips',
      },
    },
    visualData: {
      cleanBin,
      onesCount,
      generatedParity,
      fullWord,
      parityType,
      mode,
      parityError,
    },
  };
}

// -------------------------------------------------------------
// CRC Calculator (Cyclic Redundancy Check)
// -------------------------------------------------------------
export interface CrcPreset {
  name: string;
  width: number;
  poly: number; // e.g. 0x07 for CRC-8, 0x1021 for CRC-16
  init: number;
  xorOut: number;
  refIn: boolean;
  refOut: boolean;
}

export const CRC_PRESETS: CrcPreset[] = [
  {
    name: 'CRC-8 (SMBus / ATM)',
    width: 8,
    poly: 0x07,
    init: 0x00,
    xorOut: 0x00,
    refIn: false,
    refOut: false,
  },
  {
    name: 'CRC-8 / DALLAS-MAXIM (1-Wire)',
    width: 8,
    poly: 0x31,
    init: 0x00,
    xorOut: 0x00,
    refIn: true,
    refOut: true,
  },
  {
    name: 'CRC-16 / CCITT-FALSE',
    width: 16,
    poly: 0x1021,
    init: 0xffff,
    xorOut: 0x0000,
    refIn: false,
    refOut: false,
  },
  {
    name: 'CRC-16 / MODBUS',
    width: 16,
    poly: 0x8005,
    init: 0xffff,
    xorOut: 0x0000,
    refIn: true,
    refOut: true,
  },
  {
    name: 'CRC-32 (IEEE 802.3 / Ethernet / PNG / ZIP)',
    width: 32,
    poly: 0x04c11db7,
    init: 0xffffffff,
    xorOut: 0xffffffff,
    refIn: true,
    refOut: true,
  },
];

export interface CrcInputs {
  inputString: string; // ASCII or Hex bytes (e.g. "123456789" or "0x31 0x32")
  isHexInput: boolean;
  presetName: string;
}

function reflect(val: number, width: number): number {
  let res = 0;
  for (let i = 0; i < width; i++) {
    if ((val & (1 << i)) !== 0) {
      res |= 1 << (width - 1 - i);
    }
  }
  return res >>> 0;
}

export function calculateCrc(inputs: CrcInputs): CalculationResult {
  const { inputString, isHexInput, presetName } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const preset = CRC_PRESETS.find((p) => p.name === presetName) || CRC_PRESETS[0];
  const { width, poly, init, xorOut, refIn, refOut } = preset;

  // Convert inputString to bytes
  const bytes: number[] = [];
  if (isHexInput) {
    const tokens = inputString.trim().split(/[\s,]+/);
    for (const t of tokens) {
      if (t) {
        const b = parseInt(t.replace(/^0x/i, ''), 16);
        if (!isNaN(b)) bytes.push(b & 0xff);
      }
    }
  } else {
    for (let i = 0; i < inputString.length; i++) {
      bytes.push(inputString.charCodeAt(i) & 0xff);
    }
  }

  if (bytes.length === 0) {
    warnings.push({
      severity: 'warning',
      title: 'Empty Payload',
      message: 'No data bytes entered for CRC calculation.',
    });
  }

  // Standard CRC execution
  let crc = init >>> 0;
  const topBit = 1 << (width - 1);
  const mask = width === 32 ? 0xffffffff : (1 << width) - 1;

  for (const byte of bytes) {
    let b = byte;
    if (refIn) {
      b = reflect(b, 8);
    }

    crc = (crc ^ (b << (width - 8))) >>> 0;

    for (let i = 0; i < 8; i++) {
      if ((crc & topBit) !== 0) {
        crc = ((crc << 1) ^ poly) >>> 0;
      } else {
        crc = (crc << 1) >>> 0;
      }
    }
    crc = (crc & mask) >>> 0;
  }

  if (refOut) {
    crc = reflect(crc, width);
  }

  crc = (crc ^ xorOut) & mask;
  const hexCrc = '0x' + (crc >>> 0).toString(16).toUpperCase().padStart(Math.ceil(width / 4), '0');

  steps.push({
    stepNumber: 1,
    title: `Initialize ${preset.name} Register`,
    formula: `Polynomial: 0x${poly.toString(16).toUpperCase()} | Init: 0x${init.toString(16).toUpperCase()} | XOR Out: 0x${xorOut.toString(16).toUpperCase()}`,
    substitution: `Payload: ${bytes.length} byte(s) [${bytes.map((b) => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).slice(0, 12).join(' ')}${bytes.length > 12 ? '...' : ''}]`,
    result: `Reflect In: ${refIn} | Reflect Out: ${refOut}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Bit-by-Bit Polynomial Division & Remainder Extraction',
    formula: 'CRC = (Data × x^w) mod G(x) ⊕ XOR_Out',
    substitution: `Evaluated ${bytes.length * 8} bit shifts with polynomial division`,
    result: `Checksum = ${hexCrc} (${(crc >>> 0).toString(2).padStart(width, '0')})`,
  });

  return {
    primaryValue: crc >>> 0,
    formattedValue: hexCrc,
    unit: '',
    label: `${preset.name} Checksum`,
    classification: 'THEORETICAL',
    standardsContext: 'ISO/IEC 13239 / IEEE 802.3 Cyclic Redundancy Check error-detecting codes.',
    warnings,
    steps,
    additionalOutputs: {
      hexChecksum: {
        label: 'Hexadecimal Checksum',
        value: hexCrc,
      },
      binaryChecksum: {
        label: 'Binary Checksum',
        value: (crc >>> 0).toString(2).padStart(width, '0'),
      },
      decimalChecksum: {
        label: 'Decimal Checksum',
        value: (crc >>> 0).toString(),
      },
      dataLength: {
        label: 'Data Payload Size',
        value: `${bytes.length} bytes (${bytes.length * 8} bits)`,
      },
    },
    visualData: {
      bytes,
      crc: crc >>> 0,
      hexCrc,
      width,
      poly,
      presetName: preset.name,
    },
  };
}

// -------------------------------------------------------------
// Hamming Code (7,4) Engine
// -------------------------------------------------------------
export interface HammingInputs {
  dataBits: string; // 4 bits: e.g. "1011"
  receivedCode?: string; // 7 bits for decode/correction: e.g. "0110011"
}

export function calculateHamming74(inputs: HammingInputs): CalculationResult {
  const { dataBits, receivedCode } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Data bits d1, d2, d3, d4
  const dClean = dataBits.replace(/\s+/g, '').padStart(4, '0').slice(-4);
  const d = dClean.split('').map((c) => parseInt(c, 10) & 1); // d[0]=d3, d[1]=d5, d[2]=d6, d[3]=d7 in 1-based Hamming positions
  const [d3, d5, d6, d7] = d;

  // Parity bit generation for standard Hamming (7,4):
  // Bit 1 (p1): covers 1, 3, 5, 7 -> p1 = d3 ⊕ d5 ⊕ d7
  // Bit 2 (p2): covers 2, 3, 6, 7 -> p2 = d3 ⊕ d6 ⊕ d7
  // Bit 4 (p4): covers 4, 5, 6, 7 -> p4 = d5 ⊕ d6 ⊕ d7
  const p1 = d3 ^ d5 ^ d7;
  const p2 = d3 ^ d6 ^ d7;
  const p4 = d5 ^ d6 ^ d7;

  // 7-bit encoded codeword: [p1, p2, d3, p4, d5, d6, d7]
  const encodedCodeword = [p1, p2, d3, p4, d5, d6, d7];
  const encodedStr = encodedCodeword.join('');

  steps.push({
    stepNumber: 1,
    title: 'Generate Hamming(7,4) Parity Bits',
    formula: 'p1 = d3 ⊕ d5 ⊕ d7;  p2 = d3 ⊕ d6 ⊕ d7;  p4 = d5 ⊕ d6 ⊕ d7',
    substitution: `p1 = ${d3}⊕${d5}⊕${d7} = ${p1};  p2 = ${d3}⊕${d6}⊕${d7} = ${p2};  p4 = ${d5}⊕${d6}⊕${d7} = ${p4}`,
    result: `7-Bit Codeword [p1,p2,d3,p4,d5,d6,d7] = ${encodedStr}`,
  });

  // Syndrome decoding if receivedCode provided
  let syndrome = 0;
  let correctedCode = encodedStr;
  let errorPosition = 0;

  if (receivedCode && receivedCode.trim().length >= 7) {
    const rBits = receivedCode.replace(/\s+/g, '').slice(0, 7).split('').map((c) => parseInt(c, 10) & 1);
    const [r1, r2, r3, r4, r5, r6, r7] = rBits;

    const s1 = r1 ^ r3 ^ r5 ^ r7;
    const s2 = r2 ^ r3 ^ r6 ^ r7;
    const s4 = r4 ^ r5 ^ r6 ^ r7;

    syndrome = (s4 << 2) | (s2 << 1) | s1;
    errorPosition = syndrome;

    const rBitsCopy = [...rBits];
    if (errorPosition > 0 && errorPosition <= 7) {
      rBitsCopy[errorPosition - 1] ^= 1; // Flip the erroneous bit
      correctedCode = rBitsCopy.join('');
      warnings.push({
        severity: 'warning',
        title: `Single-Bit Error at Position ${errorPosition}`,
        message: `Syndrome [s4,s2,s1] = ${s4}${s2}${s1} indicates a single-bit error at bit position ${errorPosition}. The error has been automatically corrected.`,
      });
    }

    steps.push({
      stepNumber: 2,
      title: 'Calculate Syndrome Vector & Correct Error',
      formula: 's1 = r1 ⊕ r3 ⊕ r5 ⊕ r7;  s2 = r2 ⊕ r3 ⊕ r6 ⊕ r7;  s4 = r4 ⊕ r5 ⊕ r6 ⊕ r7',
      substitution: `s1 = ${s1}, s2 = ${s2}, s4 = ${s4} → Syndrome = ${syndrome}`,
      result: errorPosition === 0 ? 'No errors detected' : `Error located at Bit ${errorPosition} → Corrected: ${correctedCode}`,
    });
  }

  return {
    primaryValue: parseInt(encodedStr, 2),
    formattedValue: encodedStr,
    unit: '',
    label: 'Hamming(7,4) Codeword',
    classification: 'THEORETICAL',
    standardsContext: 'Richard Hamming (1950) forward error correction block code for single-bit error correction.',
    warnings,
    steps,
    additionalOutputs: {
      codeword: {
        label: '7-Bit Codeword',
        value: encodedStr,
        note: `p1=${p1}, p2=${p2}, d3=${d3}, p4=${p4}, d5=${d5}, d6=${d6}, d7=${d7}`,
      },
      parityBits: {
        label: 'Parity Bits',
        value: `p1=${p1}, p2=${p2}, p4=${p4}`,
      },
      syndromeStatus: {
        label: 'Syndrome Vector',
        value: errorPosition === 0 ? '000 (No Error)' : `Position ${errorPosition} Corrupted`,
        note: `Corrected codeword: ${correctedCode}`,
      },
    },
    visualData: {
      dClean,
      encodedCodeword,
      encodedStr,
      p1,
      p2,
      p4,
      d3,
      d5,
      d6,
      d7,
      syndrome,
      errorPosition,
      correctedCode,
    },
  };
}
