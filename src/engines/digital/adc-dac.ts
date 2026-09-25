import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface AdcInputs {
  resolutionBits: number; // e.g. 8, 10, 12, 14, 16, 24
  vRef: number; // Volts (e.g. 3.3, 5.0)
  inputVoltage?: number; // Analog input in V
  adcCode?: number; // Raw digital integer code
  mode: 'voltage-to-code' | 'code-to-voltage';
  convention?: '2^N' | '2^N-1';
  inlDnlLsb?: number; // Real ADC INL/DNL error in LSB (default 1.0)
}

export function calculateAdc(inputs: AdcInputs): CalculationResult {
  const {
    resolutionBits: N,
    vRef,
    inputVoltage = 0,
    adcCode = 0,
    mode,
    convention = '2^N',
    inlDnlLsb = 1.0,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const totalCodes = Math.pow(2, N);
  const maxCode = totalCodes - 1;
  const divisor = convention === '2^N' ? totalCodes : maxCode;

  // LSB Voltage Step
  const lsbVoltage = vRef / divisor;

  // Theoretical Quantization Noise (RMS) = q / sqrt(12)
  const rmsQuantizationNoise = lsbVoltage / Math.sqrt(12);

  // Theoretical Ideal SNR = 6.02 * N + 1.76 dB
  const idealSnrDb = 6.02 * N + 1.76;

  let calculatedCode = 0;
  let calculatedVoltage = 0;

  if (mode === 'voltage-to-code') {
    if (inputVoltage < 0) {
      warnings.push({
        severity: 'warning',
        title: 'Negative Input Voltage (Underflow)',
        message: `Input ${inputVoltage} V is below ground (0 V) and will clamp to code 0 in unipolar mode.`,
      });
    } else if (inputVoltage > vRef) {
      warnings.push({
        severity: 'warning',
        title: 'Input Exceeds V_ref (ADC Saturation)',
        message: `Input ${inputVoltage} V exceeds reference ${vRef} V. ADC output is saturated at full scale code ${maxCode}.`,
      });
    }

    const clampedV = Math.max(0, Math.min(inputVoltage, vRef));
    calculatedCode = Math.min(Math.floor(clampedV / lsbVoltage), maxCode);
    calculatedVoltage = calculatedCode * lsbVoltage;

    steps.push({
      stepNumber: 1,
      title: 'Calculate ADC Quantization Step (1 LSB)',
      formula: `V_LSB = V_ref / ${divisor === totalCodes ? '2^N' : '(2^N - 1)'}`,
      substitution: `V_LSB = ${vRef} V / ${divisor.toLocaleString()}`,
      result: `1 LSB = ${formatQuantity(lsbVoltage, 'voltage')} (${(lsbVoltage * 1e3).toFixed(4)} mV)`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Quantize Analog Input Voltage to Digital Code',
      formula: 'Code = floor( V_in / V_LSB )',
      substitution: `Code = floor( ${inputVoltage} V / ${(lsbVoltage * 1e3).toFixed(4)} mV )`,
      result: `ADC Code = ${calculatedCode} (0x${calculatedCode.toString(16).toUpperCase()})`,
    });
  } else {
    // code-to-voltage
    if (adcCode < 0 || adcCode > maxCode) {
      warnings.push({
        severity: 'warning',
        title: 'Code Out of Bounds',
        message: `Entered code ${adcCode} exceeds ${N}-bit range [0 ... ${maxCode}].`,
      });
    }
    const clampedCode = Math.max(0, Math.min(adcCode, maxCode));
    calculatedVoltage = clampedCode * lsbVoltage;
    calculatedCode = clampedCode;

    steps.push({
      stepNumber: 1,
      title: 'Calculate ADC Quantization Step (1 LSB)',
      formula: `V_LSB = V_ref / ${divisor === totalCodes ? '2^N' : '(2^N - 1)'}`,
      substitution: `V_LSB = ${vRef} V / ${divisor.toLocaleString()}`,
      result: `1 LSB = ${formatQuantity(lsbVoltage, 'voltage')}`,
    });

    steps.push({
      stepNumber: 2,
      title: 'Reconstruct Equivalent Analog Voltage',
      formula: 'V_out = Code × V_LSB',
      substitution: `V_out = ${clampedCode} × ${formatQuantity(lsbVoltage, 'voltage')}`,
      result: `Reconstructed V = ${formatQuantity(calculatedVoltage, 'voltage')}`,
    });
  }

  // Real ADC ENOB (Effective Number of Bits) degradation estimate with INL
  const estimatedSinad = idealSnrDb - 20 * Math.log10(1 + inlDnlLsb);
  const estimatedEnob = Math.max(0, (estimatedSinad - 1.76) / 6.02);

  steps.push({
    stepNumber: 3,
    title: 'Calculate Theoretical Quantization Noise & Ideal SNR',
    formula: 'SNR_ideal = 6.02 × N + 1.76 dB;  V_noise,rms = q / √12',
    substitution: `SNR = 6.02 × ${N} + 1.76 = ${idealSnrDb.toFixed(2)} dB;  V_noise = ${formatQuantity(lsbVoltage, 'voltage')} / √12`,
    result: `Ideal SNR: ${idealSnrDb.toFixed(2)} dB | RMS Noise: ${formatQuantity(rmsQuantizationNoise, 'voltage')}`,
  });

  return {
    primaryValue: mode === 'voltage-to-code' ? calculatedCode : calculatedVoltage,
    formattedValue:
      mode === 'voltage-to-code'
        ? `${calculatedCode} (0x${calculatedCode.toString(16).toUpperCase()})`
        : formatQuantity(calculatedVoltage, 'voltage'),
    unit: mode === 'voltage-to-code' ? '' : 'V',
    label: mode === 'voltage-to-code' ? 'ADC Output Code' : 'Equivalent Analog Voltage',
    classification: 'THEORETICAL',
    standardsContext: 'IEEE Std 1241-2010 Standard for Terminology and Test Methods for Analog-to-Digital Converters.',
    warnings,
    steps,
    additionalOutputs: {
      lsbSize: {
        label: 'Quantization Step (1 LSB)',
        value: formatQuantity(lsbVoltage, 'voltage'),
        note: `${(lsbVoltage * 1e3).toFixed(4)} mV / step`,
      },
      rmsNoise: {
        label: 'RMS Quantization Noise',
        value: formatQuantity(rmsQuantizationNoise, 'voltage'),
        note: 'q / √12 theoretical noise floor',
      },
      idealSnr: {
        label: 'Theoretical Ideal SNR',
        value: `${idealSnrDb.toFixed(2)} dB`,
        note: '6.02N + 1.76 dB (Nyquist bandwidth)',
      },
      estimatedEnob: {
        label: 'Estimated ENOB (with INL)',
        value: `${estimatedEnob.toFixed(2)} bits`,
        note: `Assumes ±${inlDnlLsb} LSB nonlinearity`,
      },
      fullScaleRange: {
        label: 'Full-Scale Input Range',
        value: `0.0 V to ${vRef.toFixed(3)} V`,
        note: `${totalCodes.toLocaleString()} quantization levels`,
      },
    },
    visualData: {
      N,
      vRef,
      totalCodes,
      maxCode,
      lsbVoltage,
      rmsQuantizationNoise,
      idealSnrDb,
      calculatedCode,
      calculatedVoltage,
      estimatedEnob,
      mode,
    },
  };
}

// -------------------------------------------------------------
// DAC Engine (Digital-to-Analog Converter)
// -------------------------------------------------------------
export interface DacInputs {
  resolutionBits: number;
  vRef: number;
  digitalCode: number;
  isBipolar?: boolean; // unipolar (0 to Vref) or bipolar (-Vref to +Vref)
  settlingTimeNs?: number;
  glitchImpulseNvS?: number;
}

export function calculateDac(inputs: DacInputs): CalculationResult {
  const {
    resolutionBits: N,
    vRef,
    digitalCode: code,
    isBipolar = false,
    settlingTimeNs = 100,
    glitchImpulseNvS = 5,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const totalCodes = Math.pow(2, N);
  const maxCode = totalCodes - 1;

  if (code < 0 || code > maxCode) {
    warnings.push({
      severity: 'warning',
      title: 'DAC Code Out of Range',
      message: `Code ${code} is outside ${N}-bit range [0 ... ${maxCode}]. It will be clamped.`,
    });
  }

  const clampedCode = Math.max(0, Math.min(code, maxCode));
  const lsbVoltage = isBipolar ? (2 * vRef) / totalCodes : vRef / totalCodes;

  let outputVoltage = 0;
  if (isBipolar) {
    // Two's complement or offset binary: Midscale is 0 V
    const offset = totalCodes / 2;
    outputVoltage = ((clampedCode - offset) / offset) * vRef;
  } else {
    outputVoltage = (clampedCode / totalCodes) * vRef;
  }

  steps.push({
    stepNumber: 1,
    title: `Calculate DAC LSB Step Size (${isBipolar ? 'Bipolar' : 'Unipolar'})`,
    formula: isBipolar ? 'V_LSB = 2 × V_ref / 2^N' : 'V_LSB = V_ref / 2^N',
    substitution: `V_LSB = ${isBipolar ? `2 × ${vRef}` : `${vRef}`} V / ${totalCodes.toLocaleString()}`,
    result: `1 LSB = ${formatQuantity(lsbVoltage, 'voltage')}`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Analog Output Voltage',
    formula: isBipolar
      ? 'V_out = [ (Code - 2^(N-1)) / 2^(N-1) ] × V_ref'
      : 'V_out = (Code / 2^N) × V_ref',
    substitution: `Code = ${clampedCode} / ${totalCodes}`,
    result: `V_out = ${formatQuantity(outputVoltage, 'voltage')}`,
  });

  return {
    primaryValue: outputVoltage,
    formattedValue: formatQuantity(outputVoltage, 'voltage'),
    unit: 'V',
    label: 'DAC Analog Output Voltage',
    classification: 'THEORETICAL',
    standardsContext: 'IEEE Std 1658-2011 Standard for Terminology and Test Methods for Digital-to-Analog Converters.',
    warnings,
    steps,
    additionalOutputs: {
      lsbStep: {
        label: 'Step Resolution (1 LSB)',
        value: formatQuantity(lsbVoltage, 'voltage'),
      },
      voltageRange: {
        label: 'Full-Scale Span',
        value: isBipolar ? `±${vRef.toFixed(3)} V (-${vRef}V to +${vRef}V)` : `0.0 V to ${vRef.toFixed(3)} V`,
      },
      settlingSpec: {
        label: 'Settling Time (to ±0.5 LSB)',
        value: `${settlingTimeNs} ns`,
        note: `Max update rate: ~${formatQuantity(1e9 / settlingTimeNs, 'frequency')}`,
      },
      glitchImpulse: {
        label: 'Glitch Energy Area',
        value: `${glitchImpulseNvS} nV·s`,
        note: 'Major carry transition glitch impulse',
      },
    },
    visualData: {
      N,
      vRef,
      code: clampedCode,
      isBipolar,
      outputVoltage,
      lsbVoltage,
      totalCodes,
    },
  };
}
