import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

// -------------------------------------------------------------
// CPU Cycles & Instruction Execution Timing
// -------------------------------------------------------------
export interface CpuTimingInputs {
  cpuFrequencyHz: number; // e.g. 16 MHz, 72 MHz, 168 MHz, 480 MHz
  cyclesCount?: number;
  instructionCount?: number;
  cpi?: number; // Average Cycles Per Instruction (default 1.25 for Cortex-M)
  flashWaitStates?: number; // Flash memory wait states (e.g. 0, 1, 2, 3, 5)
}

export function calculateCpuTiming(inputs: CpuTimingInputs): CalculationResult {
  const {
    cpuFrequencyHz: fCpu,
    cyclesCount,
    instructionCount = 1000,
    cpi = 1.25,
    flashWaitStates = 0,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (fCpu <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid CPU Frequency',
      message: 'CPU Frequency must be greater than zero.',
    });
  }

  const cyclePeriodSec = fCpu > 0 ? 1 / fCpu : Infinity;

  // Total effective cycles
  let totalCycles = cyclesCount;
  if (totalCycles === undefined) {
    // Calculated from instruction count and CPI
    const effectiveCpi = cpi + flashWaitStates * 0.25; // branch/fetch latency penalty
    totalCycles = Math.round(instructionCount * effectiveCpi);
  }

  const executionTimeSec = totalCycles * cyclePeriodSec;
  const mips = fCpu > 0 ? (fCpu / (cpi * 1e6)) : 0;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Single Clock Cycle Duration',
    formula: 'T_cycle = 1 / f_cpu',
    substitution: `T_cycle = 1 / ${formatQuantity(fCpu, 'frequency')}`,
    result: `T_cycle = ${(cyclePeriodSec * 1e9).toFixed(3)} ns / cycle`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Total Execution Time',
    formula: 't_exec = Cycles × T_cycle = (Instructions × CPI) / f_cpu',
    substitution: `${totalCycles.toLocaleString()} cycles × ${(cyclePeriodSec * 1e9).toFixed(3)} ns`,
    result: `Execution Time = ${(executionTimeSec * 1e6).toFixed(3)} µs (${formatQuantity(executionTimeSec, 'time')})`,
  });

  return {
    primaryValue: executionTimeSec,
    formattedValue: formatQuantity(executionTimeSec, 'time'),
    unit: 's',
    label: 'Execution Duration',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Microprocessor architecture timing, CPI and pipeline execution models.',
    warnings,
    steps,
    additionalOutputs: {
      cycleDuration: {
        label: 'Clock Period (1 Cycle)',
        value: `${(cyclePeriodSec * 1e9).toFixed(3)} ns`,
      },
      mipsRating: {
        label: 'Estimated MIPS Performance',
        value: `${mips.toFixed(1)} MIPS`,
        note: `At ${cpi.toFixed(2)} average CPI`,
      },
      totalCyclesOutput: {
        label: 'Total CPU Cycles',
        value: totalCycles.toLocaleString(),
      },
      frequencyContext: {
        label: 'Core Clock Frequency',
        value: formatQuantity(fCpu, 'frequency'),
      },
    },
    visualData: {
      fCpu,
      cyclePeriodSec,
      totalCycles,
      executionTimeSec,
      mips,
      instructionCount,
      cpi,
    },
  };
}

// -------------------------------------------------------------
// Embedded Data Throughput & Buffer Storage Calculator
// -------------------------------------------------------------
export interface SensorThroughputInputs {
  samplingRateHz: number; // e.g. 1000 Hz, 44100 Hz, 100000 Hz
  resolutionBits: number; // e.g. 10, 12, 16, 24 bits
  channelCount: number; // e.g. 1 to 16 channels
  packBytes: boolean; // whether 12-bit is padded to 16-bit (2 bytes) or packed
}

export function calculateSensorThroughput(inputs: SensorThroughputInputs): CalculationResult {
  const { samplingRateHz: fs, resolutionBits, channelCount: channels, packBytes } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const rawBitsPerSample = resolutionBits;
  const storedBytesPerSample = packBytes ? Math.ceil(resolutionBits / 8) : resolutionBits / 8;

  const bitsPerSecond = fs * rawBitsPerSample * channels;
  const bytesPerSecond = fs * storedBytesPerSample * channels;

  const bytesPerMinute = bytesPerSecond * 60;
  const bytesPerHour = bytesPerMinute * 60;
  const bytesPerDay = bytesPerHour * 24;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Streaming Data Rate',
    formula: 'Throughput (Bps) = f_s × Channels × Bytes_per_sample',
    substitution: `${formatQuantity(fs, 'frequency')} × ${channels} channel(s) × ${storedBytesPerSample} byte(s)`,
    result: `Data Rate = ${(bytesPerSecond / 1e3).toFixed(2)} kB/s (${(bitsPerSecond / 1e3).toFixed(1)} kbps)`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Buffer & Flash Memory Storage Accumulation',
    formula: 'Storage = Throughput × Duration',
    substitution: `1 Hour = ${(bytesPerHour / 1e6).toFixed(2)} MB ; 24 Hours = ${(bytesPerDay / 1e6).toFixed(2)} MB`,
    result: `Daily Storage = ${(bytesPerDay / 1e9).toFixed(3)} GB`,
  });

  return {
    primaryValue: bytesPerSecond,
    formattedValue: `${(bytesPerSecond / 1e3).toFixed(2)} kB/s`,
    unit: 'B/s',
    label: 'Streaming Data Throughput',
    classification: 'THEORETICAL',
    standardsContext: 'Embedded sensor telemetry and data acquisition buffer dimensioning.',
    warnings,
    steps,
    additionalOutputs: {
      bitRate: {
        label: 'Raw Bit Rate',
        value: `${(bitsPerSecond / 1e3).toFixed(1)} kbps`,
      },
      perMinuteStorage: {
        label: 'Storage per Minute',
        value: `${(bytesPerMinute / 1e3).toFixed(1)} kB`,
      },
      perHourStorage: {
        label: 'Storage per Hour',
        value: `${(bytesPerHour / 1e6).toFixed(2)} MB`,
      },
      perDayStorage: {
        label: 'Storage per 24 Hours',
        value: `${(bytesPerDay / 1e6).toFixed(2)} MB (${(bytesPerDay / 1e9).toFixed(3)} GB)`,
      },
    },
    visualData: {
      fs,
      channels,
      resolutionBits,
      bitsPerSecond,
      bytesPerSecond,
      bytesPerHour,
      bytesPerDay,
    },
  };
}
