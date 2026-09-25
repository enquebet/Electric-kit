import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';

export type BinaryArithmeticOp = 'add' | 'subtract' | 'multiply' | 'divide';
export type ArithmeticOp = BinaryArithmeticOp;

export interface BinaryArithmeticInputs {
  operandA: string; // binary or hex or dec string
  operandB: string;
  operation: BinaryArithmeticOp;
  bitWidth: 4 | 8 | 16 | 32 | 64;
  isSigned: boolean;
}

export function calculateBinaryArithmetic(inputs: BinaryArithmeticInputs): CalculationResult {
  const { operandA, operandB, operation, bitWidth, isSigned } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const parseBigInt = (val: string): bigint => {
    const s = val.trim();
    if (s.startsWith('0b') || s.startsWith('0B')) return BigInt(s);
    if (s.startsWith('0x') || s.startsWith('0X')) return BigInt(s);
    if (/^[01]+$/.test(s)) return BigInt('0b' + s);
    if (/^[+-]?[0-9]+$/.test(s)) return BigInt(s);
    return 0n;
  };

  const a = parseBigInt(operandA);
  const b = parseBigInt(operandB);

  const modulus = 1n << BigInt(bitWidth);
  const maxUnsigned = modulus - 1n;
  const minSigned = -(1n << BigInt(bitWidth - 1));
  const maxSigned = (1n << BigInt(bitWidth - 1)) - 1n;

  let rawResult = 0n;
  let carry = false;
  let borrow = false;
  let overflow = false;
  let remainder = 0n;

  switch (operation) {
    case 'add': {
      rawResult = a + b;
      carry = rawResult > maxUnsigned;
      if (isSigned) {
        // Overflow in two's complement addition: adding two positives yields negative, or two negatives yields positive
        const aNeg = (a & (1n << BigInt(bitWidth - 1))) !== 0n;
        const bNeg = (b & (1n << BigInt(bitWidth - 1))) !== 0n;
        const rNeg = (rawResult & (1n << BigInt(bitWidth - 1))) !== 0n;
        overflow = (aNeg && bNeg && !rNeg) || (!aNeg && !bNeg && rNeg);
      } else {
        overflow = carry;
      }
      break;
    }
    case 'subtract': {
      rawResult = a - b;
      borrow = a < b;
      if (isSigned) {
        overflow = rawResult < minSigned || rawResult > maxSigned;
      } else {
        overflow = borrow;
      }
      break;
    }
    case 'multiply': {
      rawResult = a * b;
      overflow = isSigned ? rawResult < minSigned || rawResult > maxSigned : rawResult > maxUnsigned;
      break;
    }
    case 'divide': {
      if (b === 0n) {
        warnings.push({
          severity: 'danger',
          title: 'Division by Zero',
          message: 'Cannot divide by binary zero.',
        });
        rawResult = 0n;
      } else {
        rawResult = a / b;
        remainder = a % b;
      }
      break;
    }
  }

  // Wrapped register value
  const wrappedResult = ((rawResult % modulus) + modulus) % modulus;
  const binResult = wrappedResult.toString(2).padStart(bitWidth, '0');
  const hexResult = '0x' + wrappedResult.toString(16).toUpperCase().padStart(Math.ceil(bitWidth / 4), '0');

  const binA = ((a % modulus) + modulus) % modulus;
  const binB = ((b % modulus) + modulus) % modulus;

  steps.push({
    stepNumber: 1,
    title: `Binary Arithmetic: ${operation.toUpperCase()}`,
    formula: `Register: ${bitWidth}-bit (mod 2^${bitWidth})`,
    substitution: `A = ${binA.toString(2).padStart(bitWidth, '0')} (${a.toString()}) ; B = ${binB.toString(2).padStart(bitWidth, '0')} (${b.toString()})`,
    result: `Raw: ${rawResult.toString()} → Register: ${binResult} (${hexResult})`,
  });

  if (overflow) {
    warnings.push({
      severity: 'warning',
      title: 'Arithmetic Register Overflow',
      message: `Result exceeds ${bitWidth}-bit register boundary and was truncated.`,
    });
  }

  return {
    primaryValue: Number(wrappedResult & 0xffffffffn),
    formattedValue: hexResult,
    unit: '',
    label: `Arithmetic Result (${binResult})`,
    classification: 'THEORETICAL',
    standardsContext: 'ALU arithmetic conventions and status flags (Carry, Overflow, Zero, Negative).',
    warnings,
    steps,
    additionalOutputs: {
      binaryResult: {
        label: 'Binary Output',
        value: binResult,
      },
      decimalResult: {
        label: 'Decimal Result',
        value: wrappedResult.toString(),
      },
      hexResult: {
        label: 'Hexadecimal Output',
        value: hexResult,
      },
      statusFlags: {
        label: 'ALU Status Flags',
        value: `C=${carry ? '1' : '0'}, V=${overflow ? '1' : '0'}, Z=${wrappedResult === 0n ? '1' : '0'}, N=${(wrappedResult & (1n << BigInt(bitWidth - 1))) !== 0n ? '1' : '0'}`,
        note: 'Carry (C), Overflow (V), Zero (Z), Negative (N)',
      },
      ...(operation === 'divide'
        ? {
            remainderOutput: {
              label: 'Division Remainder (Modulo)',
              value: `${remainder.toString()} (0b${remainder.toString(2)})`,
            },
          }
        : {}),
    },
    visualData: {
      a: a.toString(),
      b: b.toString(),
      binA: binA.toString(2).padStart(bitWidth, '0'),
      binB: binB.toString(2).padStart(bitWidth, '0'),
      binResult,
      hexResult,
      wrappedResult: wrappedResult.toString(),
      carry,
      borrow,
      overflow,
      operation,
      bitWidth,
    },
  };
}

// -------------------------------------------------------------
// Data Rate & Storage Converter (SI vs IEC binary prefixes)
// -------------------------------------------------------------
export type StorageUnit = 'B' | 'KB' | 'KiB' | 'MB' | 'MiB' | 'GB' | 'GiB' | 'TB' | 'TiB';

export interface DataRateInputs {
  fileSize: number;
  sizeUnit: StorageUnit;
  transferRate: number; // in rateUnit
  rateUnit: 'bps' | 'Kbps' | 'Mbps' | 'Gbps' | 'Bps' | 'KBps' | 'MBps';
}

export function calculateDataTransfer(inputs: DataRateInputs): CalculationResult {
  const { fileSize, sizeUnit, transferRate, rateUnit } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Convert fileSize to total Bytes
  let totalBytes = 0;
  switch (sizeUnit) {
    case 'B':
      totalBytes = fileSize;
      break;
    case 'KB': // Decimal SI: 1,000
      totalBytes = fileSize * 1e3;
      break;
    case 'KiB': // IEC Binary: 1,024
      totalBytes = fileSize * 1024;
      break;
    case 'MB':
      totalBytes = fileSize * 1e6;
      break;
    case 'MiB':
      totalBytes = fileSize * Math.pow(1024, 2);
      break;
    case 'GB':
      totalBytes = fileSize * 1e9;
      break;
    case 'GiB':
      totalBytes = fileSize * Math.pow(1024, 3);
      break;
    case 'TB':
      totalBytes = fileSize * 1e12;
      break;
    case 'TiB':
      totalBytes = fileSize * Math.pow(1024, 4);
      break;
  }

  const totalBits = totalBytes * 8;

  // Convert transfer rate to bits per second
  let bps = 0;
  switch (rateUnit) {
    case 'bps':
      bps = transferRate;
      break;
    case 'Kbps':
      bps = transferRate * 1e3;
      break;
    case 'Mbps':
      bps = transferRate * 1e6;
      break;
    case 'Gbps':
      bps = transferRate * 1e9;
      break;
    case 'Bps':
      bps = transferRate * 8;
      break;
    case 'KBps':
      bps = transferRate * 8e3;
      break;
    case 'MBps':
      bps = transferRate * 8e6;
      break;
  }

  if (bps <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero Transfer Rate',
      message: 'Transfer rate must be greater than zero.',
    });
  }

  const transferTimeSec = bps > 0 ? totalBits / bps : Infinity;

  // Format transfer time human readable
  const hours = Math.floor(transferTimeSec / 3600);
  const minutes = Math.floor((transferTimeSec % 3600) / 60);
  const seconds = (transferTimeSec % 60).toFixed(2);
  const formattedDuration = `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;

  steps.push({
    stepNumber: 1,
    title: 'Normalize Storage Size (SI vs IEC Prefixes)',
    formula: 'Total Bits = Bytes × 8',
    substitution: `${fileSize} ${sizeUnit} = ${totalBytes.toLocaleString()} Bytes = ${totalBits.toLocaleString()} bits`,
    result: `${(totalBytes / 1e6).toFixed(3)} MB (decimal) | ${(totalBytes / Math.pow(1024, 2)).toFixed(3)} MiB (binary)`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Transfer Time',
    formula: 't = Total Bits / Data Rate (bps)',
    substitution: `t = ${totalBits.toExponential(3)} bits / ${bps.toExponential(3)} bps`,
    result: `Time = ${transferTimeSec.toFixed(3)} s (${formattedDuration})`,
  });

  return {
    primaryValue: transferTimeSec,
    formattedValue: formattedDuration,
    unit: 's',
    label: 'Transfer Duration',
    classification: 'THEORETICAL',
    standardsContext: 'IEC 80000-13 / IEEE 1541-2002 Units for prefixes for binary multiples (KiB, MiB, GiB).',
    warnings,
    steps,
    additionalOutputs: {
      timeSeconds: {
        label: 'Duration in Seconds',
        value: `${transferTimeSec.toFixed(3)} s`,
      },
      siSize: {
        label: 'Decimal SI Size (Base 10)',
        value: `${(totalBytes / 1e6).toFixed(3)} MB`,
        note: `${(totalBytes / 1e9).toFixed(4)} GB`,
      },
      iecSize: {
        label: 'IEC Binary Size (Base 2)',
        value: `${(totalBytes / Math.pow(1024, 2)).toFixed(3)} MiB`,
        note: `${(totalBytes / Math.pow(1024, 3)).toFixed(4)} GiB`,
      },
      effectiveThroughput: {
        label: 'Raw Bit Rate',
        value: `${(bps / 1e6).toFixed(3)} Mbps`,
        note: `${(bps / 8e6).toFixed(3)} MB/s`,
      },
    },
    visualData: {
      totalBytes,
      totalBits,
      bps,
      transferTimeSec,
      formattedDuration,
    },
  };
}

export function convertStorageUnits(fileSize: number, sizeUnit: StorageUnit = 'MB') {
  let bytes = fileSize;
  switch (sizeUnit) {
    case 'B':
      bytes = fileSize;
      break;
    case 'KB':
      bytes = fileSize * 1e3;
      break;
    case 'KiB':
      bytes = fileSize * 1024;
      break;
    case 'MB':
      bytes = fileSize * 1e6;
      break;
    case 'MiB':
      bytes = fileSize * Math.pow(1024, 2);
      break;
    case 'GB':
      bytes = fileSize * 1e9;
      break;
    case 'GiB':
      bytes = fileSize * Math.pow(1024, 3);
      break;
    case 'TB':
      bytes = fileSize * 1e12;
      break;
    case 'TiB':
      bytes = fileSize * Math.pow(1024, 4);
      break;
  }

  return {
    bytes,
    kB: bytes / 1e3,
    MB: bytes / 1e6,
    GB: bytes / 1e9,
    KiB: bytes / 1024,
    MiB: bytes / Math.pow(1024, 2),
    GiB: bytes / Math.pow(1024, 3),
    kilobytes: bytes / 1e3,
    megabytes: bytes / 1e6,
    gigabytes: bytes / 1e9,
    kibibytes: bytes / 1024,
    mebibytes: bytes / Math.pow(1024, 2),
    gibibytes: bytes / Math.pow(1024, 3),
  };
}

