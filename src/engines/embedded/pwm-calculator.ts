import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface PwmInputs {
  frequencyHz: number;
  dutyCyclePercent: number; // 0 to 100
  supplyVoltage: number; // Volts
  mcuClockHz?: number; // Microcontroller system/timer clock
  prescaler?: number; // Timer prescaler (e.g. 1, 8, 64, 256)
  counterWidthBits?: 8 | 16 | 32;
}

export interface McuProfile {
  name: string;
  clockHz: number;
  defaultPsc: number;
  timerWidthBits: 8 | 16 | 32;
  maxBits?: number;
  architecture: string;
  notes: string;
}

export type McuTimerPreset = McuProfile;

export const COMMON_MCU_PRESETS: McuProfile[] = [
  {
    name: 'Generic Timer (16 MHz / 16-Bit)',
    clockHz: 16e6,
    defaultPsc: 1,
    timerWidthBits: 16,
    maxBits: 16,
    architecture: 'Generic MCU',
    notes: 'Standard 16-bit auto-reload timer architecture.',
  },
  {
    name: 'Arduino Uno / ATmega328P (16 MHz)',
    clockHz: 16e6,
    defaultPsc: 64,
    timerWidthBits: 8,
    maxBits: 8,
    architecture: '8-bit AVR',
    notes: 'Fast PWM mode on Timer0/Timer2 uses 8-bit registers (top = 255). Timer1 is 16-bit.',
  },
  {
    name: 'STM32F103 BluePill (72 MHz TIM1/TIM2)',
    clockHz: 72e6,
    defaultPsc: 71, // PSC = 71 -> 1 MHz tick
    timerWidthBits: 16,
    maxBits: 16,
    architecture: 'ARM Cortex-M3',
    notes: '16-bit Auto-Reload Register (ARR), 16-bit Prescaler (PSC + 1 division).',
  },
  {
    name: 'STM32F401 BlackPill (84 MHz APB1/2)',
    clockHz: 84e6,
    defaultPsc: 83,
    timerWidthBits: 16,
    maxBits: 16,
    architecture: 'ARM Cortex-M4',
    notes: 'TIM2/TIM5 are 32-bit timers; other general timers are 16-bit.',
  },
  {
    name: 'ESP32 APB Timer (80 MHz)',
    clockHz: 80e6,
    defaultPsc: 80,
    timerWidthBits: 16,
    maxBits: 16,
    architecture: 'Xtensa Dual-Core',
    notes: 'LEDC peripheral allows configurable resolution up to 16 bits.',
  },
  {
    name: 'Raspberry Pi Pico RP2040 (125 MHz PWM)',
    clockHz: 125e6,
    defaultPsc: 1,
    timerWidthBits: 16,
    maxBits: 16,
    architecture: 'ARM Cortex-M0+',
    notes: '8 PWM slices, each with two channels and 16-bit counter (TOP) with fractional clock divider.',
  },
];

export function calculatePwm(inputs: PwmInputs): CalculationResult {
  const {
    frequencyHz: f,
    dutyCyclePercent: dPercent,
    supplyVoltage: Vcc,
    mcuClockHz,
    prescaler = 1,
    counterWidthBits = 16,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safePsc = Math.max(prescaler, 1);
  const clampedDuty = Math.min(Math.max(dPercent, 0), 100);
  const dutyFraction = clampedDuty / 100;

  if (dPercent < 0 || dPercent > 100) {
    warnings.push({
      severity: 'warning',
      title: 'Duty Cycle Clamped',
      message: `Duty cycle (${dPercent}%) was clamped to standard range [0% ... 100%].`,
    });
  }

  if (f <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero or Negative Frequency',
      message: 'PWM Frequency must be greater than zero.',
    });
  }

  // Period T
  const periodSeconds = f > 0 ? 1 / f : Infinity;
  const onTimeSeconds = Number.isFinite(periodSeconds) ? periodSeconds * dutyFraction : 0;
  const offTimeSeconds = Number.isFinite(periodSeconds) ? periodSeconds * (1 - dutyFraction) : 0;

  // Voltages: DC Filtered Average and True RMS
  const averageVoltage = Vcc * dutyFraction;
  const rmsVoltage = Vcc * Math.sqrt(dutyFraction);

  if (f > 0) {
    steps.push({
      stepNumber: 1,
      title: 'Calculate Period & Pulse Widths',
      formula: 'T = 1 / f;  T_on = D × T;  T_off = (1 - D) × T',
      substitution: `T = 1 / ${formatQuantity(f, 'frequency')} = ${formatQuantity(periodSeconds, 'time')};  T_on = ${clampedDuty}% × ${formatQuantity(periodSeconds, 'time')}`,
      result: `T_on: ${formatQuantity(onTimeSeconds, 'time')} | T_off: ${formatQuantity(offTimeSeconds, 'time')}`,
    });
  }

  steps.push({
    stepNumber: 2,
    title: 'Calculate Filtered DC Average & True RMS Voltages',
    formula: 'V_avg = D × V_cc;  V_rms = √(D) × V_cc',
    substitution: `V_avg = ${dutyFraction.toFixed(4)} × ${Vcc} V;  V_rms = √(${dutyFraction.toFixed(4)}) × ${Vcc} V`,
    result: `V_avg: ${formatQuantity(averageVoltage, 'voltage')} | V_rms: ${formatQuantity(rmsVoltage, 'voltage')}`,
  });

  // Microcontroller register calculations if clock is provided
  let arrValue: number | undefined;
  let ccrValue: number | undefined;
  let resolutionBits: number | undefined;
  let timerTickFreq: number | undefined;
  let timerOverflowSec: number | undefined;

  const maxCounterVal = Math.pow(2, counterWidthBits) - 1;

  if (mcuClockHz && mcuClockHz > 0 && f > 0) {
    timerTickFreq = mcuClockHz / safePsc;
    const ticksPerPeriod = timerTickFreq / f;
    arrValue = Math.max(Math.round(ticksPerPeriod - 1), 0);
    ccrValue = Math.round((arrValue + 1) * dutyFraction);
    resolutionBits = Math.max(Math.log2(arrValue + 1), 0);
    timerOverflowSec = (arrValue + 1) / timerTickFreq;

    steps.push({
      stepNumber: 3,
      title: 'Calculate Timer Auto-Reload (ARR) & Compare (CCR) Register',
      formula: 'ARR = [ f_clk / (PSC × f_pwm) ] - 1;  CCR = (ARR + 1) × D',
      substitution: `ARR = [ ${formatQuantity(mcuClockHz, 'frequency')} / (${safePsc} × ${formatQuantity(f, 'frequency')}) ] - 1`,
      result: `ARR = ${arrValue} counts | CCR = ${ccrValue} | Resolution: ${resolutionBits.toFixed(1)} bits`,
    });

    if (arrValue > maxCounterVal) {
      warnings.push({
        severity: 'warning',
        title: `${counterWidthBits}-Bit Timer Register Overflow`,
        message: `Required ARR count (${arrValue}) exceeds standard ${counterWidthBits}-bit timer limit (${maxCounterVal.toLocaleString()}). You must increase the timer prescaler (PSC) or select a 32-bit timer peripheral.`,
      });
    } else if (arrValue < 10) {
      warnings.push({
        severity: 'warning',
        title: 'Very Low PWM Resolution',
        message: `ARR is only ${arrValue} counts (${resolutionBits?.toFixed(1)} bits). Duty cycle granularity is coarse. Decrease prescaler or lower frequency.`,
      });
    }
  }

  // Audio range warning for acoustic noise
  if (f >= 20 && f <= 20000) {
    warnings.push({
      severity: 'info',
      title: 'Audible Frequency Band (Coil Whine Notice)',
      message: `PWM frequency (${formatQuantity(f, 'frequency')}) is inside the human audible range (20 Hz – 20 kHz). Inductors, ceramic capacitors, and motor windings may emit audible whine.`,
    });
  }

  return {
    primaryValue: averageVoltage,
    formattedValue: formatQuantity(averageVoltage, 'voltage'),
    unit: 'V',
    label: 'Average Output Voltage (V_avg)',
    classification: 'HARDWARE-DEPENDENT',
    standardsContext: 'Microcontroller timer and pulse-width modulation output per manufacturer silicon reference manuals.',
    warnings,
    steps,
    additionalOutputs: {
      period: {
        label: 'PWM Period (T)',
        value: formatQuantity(periodSeconds, 'time'),
        note: `f = ${formatQuantity(f, 'frequency')}`,
      },
      onTime: {
        label: 'Pulse Width / On-Time (T_on)',
        value: formatQuantity(onTimeSeconds, 'time'),
      },
      offTime: {
        label: 'Off-Time (T_off)',
        value: formatQuantity(offTimeSeconds, 'time'),
      },
      rmsVoltage: {
        label: 'True RMS Voltage',
        value: formatQuantity(rmsVoltage, 'voltage'),
        note: 'Effective thermal heating potential',
      },
      ...(arrValue !== undefined
        ? {
            timerArr: {
              label: 'Timer ARR / Period Reg',
              value: arrValue.toString(),
              note: `Top limit (0x${arrValue.toString(16).toUpperCase()})`,
            },
            timerCcr: {
              label: 'Timer CCR / Compare Match',
              value: ccrValue?.toString() || '0',
              note: `Match count (0x${ccrValue?.toString(16).toUpperCase()})`,
            },
            pwmResolution: {
              label: 'Effective Resolution',
              value: `${resolutionBits?.toFixed(2)} bits`,
              note: `${Math.round(Math.pow(2, resolutionBits || 0))} discrete steps`,
            },
            tickFrequency: {
              label: 'Timer Tick Frequency',
              value: formatQuantity(timerTickFreq || 0, 'frequency'),
              note: `f_clk / PSC (${mcuClockHz ? formatQuantity(mcuClockHz, 'frequency') : ''} / ${safePsc})`,
            },
          }
        : {}),
    },
    visualData: {
      f,
      dPercent,
      Vcc,
      periodSeconds,
      onTimeSeconds,
      offTimeSeconds,
      averageVoltage,
      rmsVoltage,
      arrValue,
      ccrValue,
      resolutionBits,
      timerTickFreq,
      timerOverflowSec,
      counterWidthBits,
    },
  };
}

// -------------------------------------------------------------
// Timer Prescaler & Period Optimizer
// -------------------------------------------------------------
export interface TimerPrescalerCandidate {
  prescaler: number;
  arr: number;
  periodRegister: number;
  actualFrequencyHz: number;
  frequencyErrorPercent: number;
  errorPercent: number;
  resolutionBits: number;
  isWithinBitWidth: boolean;
}

export function findOptimalTimerPrescalers(
  clockHz: number,
  targetFrequencyHz: number,
  counterWidthBits: 8 | 16 | 32 = 16
): TimerPrescalerCandidate[] {
  const maxCounter = Math.pow(2, counterWidthBits) - 1;
  const commonPrescalers = [1, 2, 4, 8, 16, 32, 64, 71, 72, 80, 84, 128, 256, 1024, 4096];
  const results: TimerPrescalerCandidate[] = [];

  for (const psc of commonPrescalers) {
    const tickFreq = clockHz / psc;
    const exactArr = tickFreq / targetFrequencyHz - 1;
    const roundedArr = Math.round(exactArr);

    if (roundedArr >= 1) {
      const actualFreq = tickFreq / (roundedArr + 1);
      const errorPercent = Math.abs((actualFreq - targetFrequencyHz) / targetFrequencyHz) * 100;
      const resBits = Math.log2(roundedArr + 1);

      results.push({
        prescaler: psc,
        arr: roundedArr,
        periodRegister: roundedArr,
        actualFrequencyHz: actualFreq,
        frequencyErrorPercent: errorPercent,
        errorPercent: errorPercent,
        resolutionBits: resBits,
        isWithinBitWidth: roundedArr <= maxCounter,
      });
    }
  }

  // Purely mathematical ranking by numerical closeness to target frequency
  return results.sort((a, b) => {
    if (a.isWithinBitWidth && !b.isWithinBitWidth) return -1;
    if (!a.isWithinBitWidth && b.isWithinBitWidth) return 1;
    return a.frequencyErrorPercent - b.frequencyErrorPercent;
  });
}

export interface PwmTradeoffRow {
  frequencyHz: number;
  freqHz: number;
  prescaler: number;
  arr: number;
  arrCounts: number;
  resolutionBits: number;
  stepsCount: number;
  stepPercent: number;
}

export function generatePwmTradeoffTable(clockHz: number, prescaler: number = 1): PwmTradeoffRow[] {
  const targetFreqs = [100, 500, 1000, 5000, 10000, 20000, 50000, 100000, 500000, 1000000];
  const timerClk = clockHz / prescaler;
  return targetFreqs.map((f) => {
    const arr = Math.max(1, Math.round(timerClk / f) - 1);
    const steps = arr + 1;
    const bits = Math.log2(steps);
    return {
      frequencyHz: f,
      freqHz: f,
      prescaler,
      arr,
      arrCounts: arr,
      resolutionBits: bits,
      stepsCount: steps,
      stepPercent: (1 / steps) * 100,
    };
  });
}
