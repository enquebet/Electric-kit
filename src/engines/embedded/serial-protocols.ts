import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

// -------------------------------------------------------------
// UART Engine (Baud Rate, Framing, Clock Tolerance)
// -------------------------------------------------------------
export interface UartInputs {
  targetBaudRate: number; // e.g. 9600, 115200, 921600
  dataBits: 5 | 6 | 7 | 8 | 9;
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space';
  stopBits: 1 | 1.5 | 2;
  actualClockHz?: number; // MCU peripheral clock driving USART
  divider?: number; // Prescaler / divider value used by hardware
}

export function calculateUart(inputs: UartInputs): CalculationResult {
  const { targetBaudRate, dataBits, parity, stopBits, actualClockHz, divider } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const bitPeriodSec = 1 / targetBaudRate;
  const startBits = 1;
  const parityBits = parity === 'none' ? 0 : 1;
  const totalBitsPerFrame = startBits + dataBits + parityBits + stopBits;
  const frameDurationSec = totalBitsPerFrame * bitPeriodSec;

  // Efficiency and effective payload rate
  const payloadBitsPerFrame = dataBits;
  const framingEfficiencyPercent = (payloadBitsPerFrame / totalBitsPerFrame) * 100;
  const payloadDataRateBps = (payloadBitsPerFrame / totalBitsPerFrame) * targetBaudRate;
  const payloadBytesPerSec = payloadDataRateBps / 8;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Frame Bit Count & Duration',
    formula: 'N_frame = Start (1) + Data + Parity + Stop;  T_frame = N_frame × T_bit',
    substitution: `N_frame = 1 + ${dataBits} + ${parityBits} + ${stopBits} = ${totalBitsPerFrame} bits;  T_bit = 1 / ${targetBaudRate} = ${(bitPeriodSec * 1e6).toFixed(3)} µs`,
    result: `Frame Period = ${(frameDurationSec * 1e6).toFixed(2)} µs | Efficiency = ${framingEfficiencyPercent.toFixed(1)}%`,
  });

  // Clock Error Calculation if MCU clock & divider provided
  let actualBaud = targetBaudRate;
  let baudErrorPercent = 0;

  if (actualClockHz && actualClockHz > 0) {
    // For standard 16x oversampling USART: baud = f_clk / (16 * DIV)
    const sampleMultiplier = 16;
    let divVal = divider;
    if (!divVal || divVal <= 0) {
      divVal = Math.round(actualClockHz / (sampleMultiplier * targetBaudRate));
    }
    actualBaud = actualClockHz / (sampleMultiplier * divVal);
    baudErrorPercent = ((actualBaud - targetBaudRate) / targetBaudRate) * 100;

    steps.push({
      stepNumber: 2,
      title: 'Analyze Hardware Clock Divider & Baud Rate Error',
      formula: 'Baud_actual = f_clk / (16 × BRR);  Error% = [ (Baud_actual - Baud_target) / Baud_target ] × 100%',
      substitution: `f_clk = ${formatQuantity(actualClockHz, 'frequency')}, BRR = ${divVal} → Baud_actual = ${actualBaud.toFixed(1)} baud`,
      result: `Baud Error: ${baudErrorPercent >= 0 ? '+' : ''}${baudErrorPercent.toFixed(2)}%`,
    });

    if (Math.abs(baudErrorPercent) > 2.5) {
      warnings.push({
        severity: 'danger',
        title: 'Excessive UART Clock Error (Framing Error Hazard)',
        message: `Baud rate deviation is ${baudErrorPercent.toFixed(2)}%. Asynchronous UART requires cumulative clock error between receiver and transmitter to stay below ±2.5% to ±3.0% over a 10-bit frame. Corrupted bytes and framing errors will occur.`,
      });
    } else if (Math.abs(baudErrorPercent) > 1.5) {
      warnings.push({
        severity: 'warning',
        title: 'Marginal UART Baud Error',
        message: `Baud rate error is ${baudErrorPercent.toFixed(2)}%. While under 2.5%, temperature drift in internal RC oscillators may push it out of spec. An external quartz crystal or fractional baud generator is recommended.`,
      });
    }
  }

  return {
    primaryValue: frameDurationSec,
    formattedValue: `${(frameDurationSec * 1e6).toFixed(2)} µs`,
    unit: 's',
    label: 'Single Frame Transmission Time',
    classification: 'PROTOCOL/TIMING MODEL',
    standardsContext: 'ANSI/TIA/EIA-232-F / ISO/IEC 13239 Asynchronous Serial Character Framing.',
    warnings,
    steps,
    additionalOutputs: {
      bitPeriod: {
        label: 'Bit Period (T_bit)',
        value: `${(bitPeriodSec * 1e6).toFixed(3)} µs`,
      },
      frameBits: {
        label: 'Bits per Frame',
        value: `${totalBitsPerFrame} bits`,
        note: `1 start + ${dataBits} data + ${parityBits} parity + ${stopBits} stop`,
      },
      payloadThroughput: {
        label: 'Effective Payload Throughput',
        value: `${(payloadDataRateBps / 1e3).toFixed(2)} kbps`,
        note: `${payloadBytesPerSec.toFixed(1)} bytes/second`,
      },
      efficiency: {
        label: 'Framing Protocol Efficiency',
        value: `${framingEfficiencyPercent.toFixed(1)}%`,
        note: `${(100 - framingEfficiencyPercent).toFixed(1)}% protocol overhead`,
      },
      ...(actualClockHz
        ? {
            hardwareBaud: {
              label: 'Actual Synthesized Baud',
              value: `${actualBaud.toFixed(1)} baud`,
              note: `Error: ${baudErrorPercent >= 0 ? '+' : ''}${baudErrorPercent.toFixed(2)}%`,
            },
          }
        : {}),
    },
    visualData: {
      targetBaudRate,
      bitPeriodSec,
      totalBitsPerFrame,
      frameDurationSec,
      payloadBytesPerSec,
      framingEfficiencyPercent,
      baudErrorPercent,
      dataBits,
      parity,
      stopBits,
    },
  };
}

// -------------------------------------------------------------
// SPI Engine (Clock, Word, Transfer Time, Bus Utilization)
// -------------------------------------------------------------
export interface SpiInputs {
  sckFrequencyHz: number; // e.g. 10 MHz
  byteCount: number; // e.g. 512 bytes
  wordSizeBits?: 8 | 16 | 32;
  csSetupHoldNs?: number; // Chip-select assert to first clock + deassert
  interWordDelayNs?: number; // Inter-byte delay
  transmissionIntervalMs?: number; // Total burst period (for utilization %)
}

export function calculateSpi(inputs: SpiInputs): CalculationResult {
  const {
    sckFrequencyHz: fSck,
    byteCount,
    wordSizeBits = 8,
    csSetupHoldNs = 50,
    interWordDelayNs = 20,
    transmissionIntervalMs,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const totalBits = byteCount * 8;
  const numWords = Math.ceil(totalBits / wordSizeBits);

  // Pure clock time
  const clockPeriodSec = 1 / fSck;
  const pureClockTimeSec = totalBits * clockPeriodSec;

  // Overhead time (CS setup/hold + inter-word delays)
  const csOverheadSec = csSetupHoldNs * 1e-9;
  const interWordOverheadSec = Math.max(0, numWords - 1) * (interWordDelayNs * 1e-9);
  const totalTransferTimeSec = pureClockTimeSec + csOverheadSec + interWordOverheadSec;

  // Throughput
  const effectivePayloadThroughputBps = totalBits / totalTransferTimeSec;
  const effectiveBytesPerSec = effectivePayloadThroughputBps / 8;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Active Clock Transfer Time',
    formula: 'T_clock = (Bytes × 8) / f_sck',
    substitution: `(${byteCount} bytes × 8) / ${formatQuantity(fSck, 'frequency')} = ${totalBits} clock cycles`,
    result: `Pure Clock Duration = ${(pureClockTimeSec * 1e6).toFixed(2)} µs`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Include Chip-Select & Inter-Word Timing Latency',
    formula: 'T_total = T_clock + T_cs_overhead + (N_words - 1) × T_inter_word',
    substitution: `CS = ${csSetupHoldNs} ns ; Inter-word = ${numWords - 1} × ${interWordDelayNs} ns`,
    result: `Total Burst Time = ${(totalTransferTimeSec * 1e6).toFixed(2)} µs`,
  });

  let busUtilizationPercent: number | undefined;
  if (transmissionIntervalMs && transmissionIntervalMs > 0) {
    const periodSec = transmissionIntervalMs * 1e-3;
    busUtilizationPercent = Math.min((totalTransferTimeSec / periodSec) * 100, 100);

    if (totalTransferTimeSec > periodSec) {
      warnings.push({
        severity: 'danger',
        title: 'SPI Bus Bandwidth Saturation',
        message: `Transfer duration (${(totalTransferTimeSec * 1e3).toFixed(2)} ms) exceeds repeat interval (${transmissionIntervalMs} ms). The SPI bus is 100% saturated.`,
      });
    }
  }

  return {
    primaryValue: totalTransferTimeSec,
    formattedValue: `${(totalTransferTimeSec * 1e6).toFixed(2)} µs`,
    unit: 's',
    label: 'SPI Burst Transfer Time',
    classification: 'PROTOCOL/TIMING MODEL',
    standardsContext: 'Motorola SPI (Serial Peripheral Interface) synchronous bus timing model.',
    warnings,
    steps,
    additionalOutputs: {
      pureClockTime: {
        label: 'Clock Active Time',
        value: `${(pureClockTimeSec * 1e6).toFixed(2)} µs`,
      },
      effectiveThroughput: {
        label: 'Effective Payload Bandwidth',
        value: `${(effectiveBytesPerSec / 1e6).toFixed(3)} MB/s`,
        note: `${(effectivePayloadThroughputBps / 1e6).toFixed(2)} Mbps`,
      },
      clockFrequency: {
        label: 'SCK Clock Speed',
        value: formatQuantity(fSck, 'frequency'),
        note: `Period: ${(clockPeriodSec * 1e9).toFixed(1)} ns`,
      },
      ...(busUtilizationPercent !== undefined
        ? {
            busUtilization: {
              label: 'Bus Duty Cycle / Utilization',
              value: `${busUtilizationPercent.toFixed(2)}%`,
              note: `Over ${transmissionIntervalMs} ms frame period`,
            },
          }
        : {}),
    },
    visualData: {
      fSck,
      byteCount,
      totalBits,
      pureClockTimeSec,
      totalTransferTimeSec,
      effectiveBytesPerSec,
      busUtilizationPercent,
    },
  };
}

// -------------------------------------------------------------
// I²C Engine (Transfer Time, Pull-Up Resistor Sizing)
// -------------------------------------------------------------
export type I2cBusSpeed = 'standard' | 'fast' | 'fast-plus' | 'high-speed';

export interface I2cInputs {
  speedMode: I2cBusSpeed;
  addressMode: '7-bit' | '10-bit';
  payloadBytes: number;
  busCapacitancePf: number; // e.g. 100 pF to 400 pF
  supplyVoltageV: number; // e.g. 3.3V or 5.0V
}

export function calculateI2c(inputs: I2cInputs): CalculationResult {
  const { speedMode, addressMode, payloadBytes, busCapacitancePf, supplyVoltageV } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Speeds and Max Rise Times per NXP UM10204 I2C Specification
  let clockFreqHz = 100000;
  let maxRiseTimeNs = 1000;
  let maxFallTimeNs = 300;
  let standardName = 'Standard-mode (100 kHz)';

  switch (speedMode) {
    case 'standard':
      clockFreqHz = 100000;
      maxRiseTimeNs = 1000;
      maxFallTimeNs = 300;
      standardName = 'Standard-mode (100 kHz)';
      break;
    case 'fast':
      clockFreqHz = 400000;
      maxRiseTimeNs = 300;
      maxFallTimeNs = 300;
      standardName = 'Fast-mode (400 kHz)';
      break;
    case 'fast-plus':
      clockFreqHz = 1000000;
      maxRiseTimeNs = 120;
      maxFallTimeNs = 120;
      standardName = 'Fast-mode Plus (1 MHz)';
      break;
    case 'high-speed':
      clockFreqHz = 3400000;
      maxRiseTimeNs = 80;
      maxFallTimeNs = 80;
      standardName = 'High-speed mode (3.4 MHz)';
      break;
  }

  // Frame bit counts:
  // START (1 bit equivalent time)
  // Address: 7-bit + R/W + ACK (9 bits) or 10-bit (18 bits)
  // Each data byte: 8 bits data + 1 bit ACK = 9 bits
  // STOP (1 bit equivalent time)
  const addrBits = addressMode === '7-bit' ? 9 : 18;
  const dataBitsTotal = payloadBytes * 9;
  const framingBits = 2; // START + STOP
  const totalBusClockCycles = framingBits + addrBits + dataBitsTotal;

  const clockPeriodSec = 1 / clockFreqHz;
  const transferTimeSec = totalBusClockCycles * clockPeriodSec;
  const effectivePayloadThroughputBps = (payloadBytes * 8) / transferTimeSec;

  steps.push({
    stepNumber: 1,
    title: `Calculate ${standardName} Frame Duration`,
    formula: 'Cycles = START (1) + Addr (9/18) + Data (9 × N) + STOP (1)',
    substitution: `Cycles = 1 + ${addrBits} + (${payloadBytes} × 9) + 1 = ${totalBusClockCycles} clock cycles`,
    result: `Frame Duration = ${(transferTimeSec * 1e6).toFixed(2)} µs | Payload Rate = ${(effectivePayloadThroughputBps / 1e3).toFixed(1)} kbps`,
  });

  // Pull-Up Resistor Calculation
  // Exponential RC rise time from 0.3*VDD to 0.7*VDD:
  // t_r = -ln( (1 - 0.7) / (1 - 0.3) ) * R_p * C_b = -ln(0.3 / 0.7) * R_p * C_b ≈ 0.8473 * R_p * C_b
  // Therefore: R_p(max) = t_r(max) / (0.8473 * C_b)
  const Cb = busCapacitancePf * 1e-12;
  const trMaxSec = maxRiseTimeNs * 1e-9;
  const maxPullUpOhms = trMaxSec / (0.8473 * Cb);

  // Minimum Pull-Up Resistor is governed by open-drain driver sink current capability I_OL:
  // Standard mode I_OL = 3 mA at V_OL = 0.4V
  // R_p(min) = (V_DD - V_OL) / I_OL
  const volMax = 0.4;
  const iOlMax = speedMode === 'fast-plus' ? 0.02 : 0.003; // 20mA for Fm+, 3mA standard/fast
  const minPullUpOhms = (supplyVoltageV - volMax) / iOlMax;

  steps.push({
    stepNumber: 2,
    title: 'Calculate I²C Bus Pull-Up Resistor Window (R_p)',
    formula: 'R_p,max = t_r,max / (0.8473 × C_b);  R_p,min = (V_DD - V_OL) / I_OL',
    substitution: `t_r,max = ${maxRiseTimeNs} ns, C_b = ${busCapacitancePf} pF, V_DD = ${supplyVoltageV} V`,
    result: `Valid Window: ${minPullUpOhms.toFixed(0)} Ω ≤ R_p ≤ ${(maxPullUpOhms / 1e3).toFixed(2)} kΩ`,
  });

  if (minPullUpOhms > maxPullUpOhms) {
    warnings.push({
      severity: 'danger',
      title: 'Bus Capacitance Exceeds Specification',
      message: `At ${busCapacitancePf} pF, the required pull-up resistance to meet the ${maxRiseTimeNs} ns rise time (${(maxPullUpOhms / 1e3).toFixed(2)} kΩ) would draw more current than the open-drain transceivers can sink (${(minPullUpOhms / 1e3).toFixed(2)} kΩ limit). Reduce bus trace length, isolate sub-buses with an I2C buffer, or reduce bus speed.`,
    });
  }

  return {
    primaryValue: transferTimeSec,
    formattedValue: `${(transferTimeSec * 1e6).toFixed(2)} µs`,
    unit: 's',
    label: 'I²C Frame Duration',
    classification: 'PROTOCOL/TIMING MODEL',
    standardsContext: 'NXP UM10204 I2C-bus specification and user manual.',
    warnings,
    steps,
    additionalOutputs: {
      busSpeed: {
        label: 'Bus Clock Rate',
        value: formatQuantity(clockFreqHz, 'frequency'),
        note: standardName,
      },
      pullUpMax: {
        label: 'Maximum Pull-Up (R_p,max)',
        value: `${(maxPullUpOhms / 1e3).toFixed(2)} kΩ`,
        note: `To guarantee t_r ≤ ${maxRiseTimeNs} ns`,
      },
      pullUpMin: {
        label: 'Minimum Pull-Up (R_p,min)',
        value: `${minPullUpOhms.toFixed(0)} Ω`,
        note: `Prevents exceeding I_OL sink current`,
      },
      recommendedRp: {
        label: 'Recommended Pull-Up (Standard Value)',
        value: `${((minPullUpOhms + maxPullUpOhms) / 2000).toFixed(1)} kΩ`,
      },
      payloadThroughput: {
        label: 'Payload Data Rate',
        value: `${(effectivePayloadThroughputBps / 1e3).toFixed(1)} kbps`,
      },
    },
    visualData: {
      clockFreqHz,
      totalBusClockCycles,
      transferTimeSec,
      busCapacitancePf,
      minPullUpOhms,
      maxPullUpOhms,
      maxRiseTimeNs,
      speedMode,
    },
  };
}

// -------------------------------------------------------------
// CAN Engine (Bit Rate, Time Quanta, Sample Point, Throughput)
// -------------------------------------------------------------
export interface CanInputs {
  nominalBitRateBps: number; // e.g. 125000, 250000, 500000, 1000000
  canClockHz: number; // e.g. 16 MHz, 40 MHz, 80 MHz
  frameFormat: 'standard' | 'extended'; // 11-bit vs 29-bit identifier
  payloadBytes: number; // 0 to 8 bytes (classic CAN)
  syncSegTq?: number; // Always 1 Tq
  propSegTq?: number;
  phaseSeg1Tq?: number;
  phaseSeg2Tq?: number;
  sjwTq?: number;
}

export function calculateCan(inputs: CanInputs): CalculationResult {
  const {
    nominalBitRateBps: baud,
    canClockHz,
    frameFormat,
    payloadBytes,
    syncSegTq = 1,
    propSegTq = 3,
    phaseSeg1Tq = 4,
    phaseSeg2Tq = 2,
    sjwTq = 1,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const totalTq = syncSegTq + propSegTq + phaseSeg1Tq + phaseSeg2Tq;
  const bitTimeSec = 1 / baud;
  const tqSec = bitTimeSec / totalTq;

  // Sample Point = (SYNC + PROP + PHASE1) / Total Tq
  const samplePointPercent = ((syncSegTq + propSegTq + phaseSeg1Tq) / totalTq) * 100;

  // Prescaler required = f_can / (baud * totalTq)
  const prescalerBRP = canClockHz / (baud * totalTq);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Time Quanta & Sample Point',
    formula: 'Total Tq = SYNC + PROP + PHASE1 + PHASE2;  Sample Point% = [ (SYNC + PROP + PHASE1) / Total Tq ] × 100',
    substitution: `Total = ${syncSegTq} + ${propSegTq} + ${phaseSeg1Tq} + ${phaseSeg2Tq} = ${totalTq} Tq`,
    result: `Sample Point = ${samplePointPercent.toFixed(1)}% | T_q = ${(tqSec * 1e9).toFixed(1)} ns (BRP = ${prescalerBRP.toFixed(2)})`,
  });

  if (Math.abs(prescalerBRP - Math.round(prescalerBRP)) > 1e-4) {
    warnings.push({
      severity: 'danger',
      title: 'Non-Integer CAN Clock Prescaler (BRP)',
      message: `CAN clock ${formatQuantity(canClockHz, 'frequency')} does not divide evenly into ${totalTq} Tq at ${baud} bps (BRP = ${prescalerBRP.toFixed(3)}). Adjust Tq segments or CAN peripheral clock source.`,
    });
  }

  if (samplePointPercent < 75 || samplePointPercent > 87.5) {
    warnings.push({
      severity: 'warning',
      title: 'Sample Point Outside CiA Recommended Window',
      message: `Sample point (${samplePointPercent.toFixed(1)}%) is outside the CiA 301 standard recommended range of 75.0% to 87.5%.`,
    });
  }

  // Classic CAN Frame bit counts
  // Standard frame (11-bit ID): SOF(1) + ID(11) + RTR(1) + IDE(1) + r0(1) + DLC(4) + Data(0-64) + CRC(15) + CRCDel(1) + ACK(1) + ACKDel(1) + EOF(7) + IFS(3) = 47 + 8*DLC
  // Extended frame (29-bit ID): adds 18 bits (SRR, IDE, ID ext, r1) = 67 + 8*DLC
  const baseFrameBits = frameFormat === 'standard' ? 47 : 67;
  const nominalBits = baseFrameBits + payloadBytes * 8;

  // Bit stuffing occurs on SOF, Arb, Control, Data, CRC (approx max 20% overhead in worst-case patterns)
  const estimatedStuffBits = Math.ceil((nominalBits - 10) / 5);
  const totalEstimatedBits = nominalBits + estimatedStuffBits;
  const frameTimeSec = totalEstimatedBits * bitTimeSec;

  const payloadThroughputBps = (payloadBytes * 8) / frameTimeSec;

  steps.push({
    stepNumber: 2,
    title: `Estimate ${frameFormat.toUpperCase()} CAN Frame Duration with Stuff Bits`,
    formula: 'N_bits ≈ N_nominal + N_stuff_estimate;  T_frame = N_bits × T_bit',
    substitution: `Nominal: ${nominalBits} bits + Est. Stuff: ${estimatedStuffBits} bits = ${totalEstimatedBits} bits`,
    result: `Frame Duration = ${(frameTimeSec * 1e6).toFixed(1)} µs | Payload Rate = ${(payloadThroughputBps / 1e3).toFixed(1)} kbps`,
  });

  return {
    primaryValue: frameTimeSec,
    formattedValue: `${(frameTimeSec * 1e6).toFixed(1)} µs`,
    unit: 's',
    label: 'CAN Frame Transmission Time',
    classification: 'PROTOCOL/TIMING MODEL',
    standardsContext: 'ISO 11898-1:2015 Road vehicles — Controller area network (CAN).',
    warnings,
    steps,
    additionalOutputs: {
      samplePoint: {
        label: 'Sample Point Location',
        value: `${samplePointPercent.toFixed(1)}%`,
        note: 'Target: 75% to 87.5% per CiA 301',
      },
      prescalerBrp: {
        label: 'Baud Rate Prescaler (BRP)',
        value: prescalerBRP.toFixed(2),
        note: `f_clk / (baud × ${totalTq} Tq)`,
      },
      totalBits: {
        label: 'Total Frame Bits (with Stuff)',
        value: `~${totalEstimatedBits} bits`,
        note: `${nominalBits} nominal + ~${estimatedStuffBits} stuff bits`,
      },
      payloadDataRate: {
        label: 'Effective Payload Bandwidth',
        value: `${(payloadThroughputBps / 1e3).toFixed(1)} kbps`,
      },
    },
    visualData: {
      baud,
      totalTq,
      samplePointPercent,
      prescalerBRP,
      totalEstimatedBits,
      frameTimeSec,
      payloadThroughputBps,
    },
  };
}
