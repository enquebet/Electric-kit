import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface FilterBodePoint {
  freq: number;
  freqRatio: number; // f / fc
  gainLinear: number;
  gainDb: number;
  phaseDeg: number;
}

function generateBodePoints(fc: number, type: 'rc-lp' | 'rc-hp' | 'rl-lp' | 'rl-hp'): FilterBodePoint[] {
  const points: FilterBodePoint[] = [];
  // Generate 40 logarithmically spaced points from 0.01 * fc to 100 * fc
  const decades = 4; // 2 below, 2 above
  const totalPoints = 40;
  for (let i = 0; i <= totalPoints; i++) {
    const logRatio = -2 + (decades * i) / totalPoints; // -2 to +2
    const ratio = Math.pow(10, logRatio);
    const freq = fc * ratio;

    let gainLinear = 0;
    let phaseDeg = 0;

    switch (type) {
      case 'rc-lp':
      case 'rl-lp':
        // H(s) = 1 / (1 + j(f/fc))
        gainLinear = 1 / Math.sqrt(1 + ratio * ratio);
        phaseDeg = -Math.atan(ratio) * (180 / Math.PI);
        break;
      case 'rc-hp':
      case 'rl-hp':
        // H(s) = j(f/fc) / (1 + j(f/fc))
        gainLinear = ratio / Math.sqrt(1 + ratio * ratio);
        phaseDeg = 90 - Math.atan(ratio) * (180 / Math.PI);
        break;
    }

    const gainDb = 20 * Math.log10(Math.max(gainLinear, 1e-6));
    points.push({ freq, freqRatio: ratio, gainLinear, gainDb, phaseDeg });
  }
  return points;
}

export interface RcFilterInputs {
  resistance: number;  // Base Ohms
  capacitance: number; // Base Farads
  inputFreq?: number;  // Test frequency (Hz)
  inputVoltage?: number; // Input amplitude (V)
}

export function calculateRcLowPass(inputs: RcFilterInputs): CalculationResult {
  const { resistance, capacitance, inputFreq, inputVoltage = 1.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R = Number.isFinite(resistance) && resistance > 0 ? resistance : 1000;
  const C = Number.isFinite(capacitance) && capacitance > 0 ? capacitance : 1e-7;
  const Vin = Number.isFinite(inputVoltage) && inputVoltage >= 0 ? inputVoltage : 1.0;

  // fc = 1 / (2 * pi * R * C)
  const tau = R * C;
  const fc = 1 / (2 * Math.PI * tau);
  const fin = inputFreq !== undefined && Number.isFinite(inputFreq) && inputFreq > 0 ? inputFreq : fc;

  const ratio = fin / fc;
  const gainLinear = 1 / Math.sqrt(1 + ratio * ratio);
  const gainDb = 20 * Math.log10(gainLinear);
  const phaseDeg = -Math.atan(ratio) * (180 / Math.PI);
  const vout = Vin * gainLinear;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Filter Cutoff Frequency (-3dB Point)',
    formula: 'f_c = 1 / [ 2π × R × C ] = 1 / [ 2π × τ ]',
    substitution: `f_c = 1 / [ 2π × ${formatQuantity(R, 'resistance')} × ${formatQuantity(C, 'capacitance')} ]`,
    result: `f_c = ${formatQuantity(fc, 'frequency')} (Time Constant τ = ${(tau * 1e3).toFixed(3)} ms)`,
    annotation: 'At the cutoff frequency, signal power is halved (-3.01 dB) and output lags input by exactly -45.0°.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Operating Frequency Response',
    formula: '|A_v| = 1 / √[ 1 + (f / f_c)² ] ;   θ = -arctan(f / f_c)',
    substitution: `f = ${formatQuantity(fin, 'frequency')} (ratio f/f_c = ${ratio.toFixed(2)}) → |A_v| = 1 / √[ 1 + (${ratio.toFixed(2)})² ]`,
    result: `Gain = ${gainLinear.toFixed(4)} (${gainDb.toFixed(2)} dB) ;   Phase = ${phaseDeg.toFixed(1)}°`,
  });

  const bodePoints = generateBodePoints(fc, 'rc-lp');

  return {
    primaryValue: fc,
    formattedValue: formatQuantity(fc, 'frequency'),
    unit: 'Hz',
    label: 'RC Low-Pass Cutoff Frequency (f_c)',
    warnings,
    steps,
    additionalOutputs: {
      cutoff: {
        label: '-3dB Cutoff Frequency',
        value: formatQuantity(fc, 'frequency'),
        unit: 'Hz',
      },
      timeConstant: {
        label: 'Filter Time Constant (τ)',
        value: `${(tau * 1000).toFixed(3)} ms`,
        unit: 's',
      },
      operatingGain: {
        label: `Gain at ${formatQuantity(fin, 'frequency')}`,
        value: `${gainLinear.toFixed(4)} (${gainDb.toFixed(2)} dB)`,
      },
      phaseShift: {
        label: 'Phase Shift',
        value: `${phaseDeg.toFixed(1)}°`,
      },
      outputVoltage: {
        label: 'Output Amplitude (V_out)',
        value: `${vout.toFixed(3)} V (from ${Vin.toFixed(2)} V)`,
        unit: 'V',
      },
      rollOffRate: {
        label: 'Stopband Roll-off Rate',
        value: '-20 dB / decade (-6 dB / octave)',
      },
    },
    visualData: {
      fc,
      tau,
      R,
      C,
      fin,
      Vin,
      Vout: vout,
      gainLinear,
      gainDb,
      phaseDeg,
      bodePoints,
      filterType: 'Low-Pass (RC)',
    },
  };
}

export function calculateRcHighPass(inputs: RcFilterInputs): CalculationResult {
  const { resistance, capacitance, inputFreq, inputVoltage = 1.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R = Number.isFinite(resistance) && resistance > 0 ? resistance : 1000;
  const C = Number.isFinite(capacitance) && capacitance > 0 ? capacitance : 1e-7;
  const Vin = Number.isFinite(inputVoltage) && inputVoltage >= 0 ? inputVoltage : 1.0;

  const tau = R * C;
  const fc = 1 / (2 * Math.PI * tau);
  const fin = inputFreq !== undefined && Number.isFinite(inputFreq) && inputFreq > 0 ? inputFreq : fc;

  const ratio = fin / fc;
  const gainLinear = ratio / Math.sqrt(1 + ratio * ratio);
  const gainDb = 20 * Math.log10(Math.max(gainLinear, 1e-6));
  const phaseDeg = 90 - Math.atan(ratio) * (180 / Math.PI);
  const vout = Vin * gainLinear;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Filter Cutoff Frequency (-3dB Point)',
    formula: 'f_c = 1 / [ 2π × R × C ]',
    substitution: `f_c = 1 / [ 2π × ${formatQuantity(R, 'resistance')} × ${formatQuantity(C, 'capacitance')} ]`,
    result: `f_c = ${formatQuantity(fc, 'frequency')}`,
    annotation: 'High-pass filter blocks DC and low frequencies while passing frequencies above fc. Phase leads by +45° at fc.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Operating Frequency Response',
    formula: '|A_v| = (f / f_c) / √[ 1 + (f / f_c)² ] ;   θ = 90° - arctan(f / f_c)',
    substitution: `f = ${formatQuantity(fin, 'frequency')} → Gain = ${gainLinear.toFixed(4)} (${gainDb.toFixed(2)} dB)`,
    result: `Output = ${vout.toFixed(3)} V ;   Phase = +${phaseDeg.toFixed(1)}°`,
  });

  const bodePoints = generateBodePoints(fc, 'rc-hp');

  return {
    primaryValue: fc,
    formattedValue: formatQuantity(fc, 'frequency'),
    unit: 'Hz',
    label: 'RC High-Pass Cutoff Frequency (f_c)',
    warnings,
    steps,
    additionalOutputs: {
      cutoff: {
        label: '-3dB Cutoff Frequency',
        value: formatQuantity(fc, 'frequency'),
        unit: 'Hz',
      },
      timeConstant: {
        label: 'Filter Time Constant (τ)',
        value: `${(tau * 1000).toFixed(3)} ms`,
        unit: 's',
      },
      operatingGain: {
        label: `Gain at ${formatQuantity(fin, 'frequency')}`,
        value: `${gainLinear.toFixed(4)} (${gainDb.toFixed(2)} dB)`,
      },
      phaseShift: {
        label: 'Phase Shift',
        value: `+${phaseDeg.toFixed(1)}°`,
      },
      outputVoltage: {
        label: 'Output Amplitude (V_out)',
        value: `${vout.toFixed(3)} V`,
        unit: 'V',
      },
      rollOffRate: {
        label: 'Stopband Roll-off Rate',
        value: '+20 dB / decade below fc',
      },
    },
    visualData: {
      fc,
      tau,
      R,
      C,
      fin,
      Vin,
      Vout: vout,
      gainLinear,
      gainDb,
      phaseDeg,
      bodePoints,
      filterType: 'High-Pass (RC)',
    },
  };
}

export interface RlFilterInputs {
  resistance: number;  // Base Ohms
  inductance: number;  // Base Henries
  inputFreq?: number;  // Test frequency (Hz)
  inputVoltage?: number;
}

export function calculateRlLowPass(inputs: RlFilterInputs): CalculationResult {
  const { resistance, inductance, inputFreq, inputVoltage = 1.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R = Number.isFinite(resistance) && resistance > 0 ? resistance : 1000;
  const L = Number.isFinite(inductance) && inductance > 0 ? inductance : 10e-3;
  const Vin = Number.isFinite(inputVoltage) && inputVoltage >= 0 ? inputVoltage : 1.0;

  // Topology: Series L, Shunt R to Ground. Vout taken across R.
  // fc = R / (2 * pi * L)
  const tau = L / R;
  const fc = R / (2 * Math.PI * L);
  const fin = inputFreq !== undefined && Number.isFinite(inputFreq) && inputFreq > 0 ? inputFreq : fc;

  const xl = 2 * Math.PI * fin * L;
  const gainLinear = R / Math.sqrt(R * R + xl * xl);
  const gainDb = 20 * Math.log10(gainLinear);
  const phaseDeg = -Math.atan(xl / R) * (180 / Math.PI);
  const vout = Vin * gainLinear;

  steps.push({
    stepNumber: 1,
    title: 'Calculate RL Low-Pass Cutoff Frequency',
    formula: 'f_c = R / [ 2π × L ]   (Topology: Series L, Shunt R output)',
    substitution: `f_c = ${formatQuantity(R, 'resistance')} / [ 2π × ${formatQuantity(L, 'inductance')} ]`,
    result: `f_c = ${formatQuantity(fc, 'frequency')}`,
    annotation: 'Inductor series reactance XL increases with frequency, dropping more voltage and leaving less across R.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Evaluate Gain at Operating Frequency',
    formula: '|A_v| = R / √[ R² + (2πfL)² ]',
    substitution: `X_L = ${formatQuantity(xl, 'resistance')} at ${formatQuantity(fin, 'frequency')} → |A_v| = ${gainLinear.toFixed(4)}`,
    result: `${gainDb.toFixed(2)} dB (Phase = ${phaseDeg.toFixed(1)}°)`,
  });

  const bodePoints = generateBodePoints(fc, 'rl-lp');

  return {
    primaryValue: fc,
    formattedValue: formatQuantity(fc, 'frequency'),
    unit: 'Hz',
    label: 'RL Low-Pass Cutoff Frequency (f_c)',
    warnings,
    steps,
    additionalOutputs: {
      cutoff: {
        label: '-3dB Cutoff Frequency',
        value: formatQuantity(fc, 'frequency'),
        unit: 'Hz',
      },
      timeConstant: {
        label: 'Time Constant (τ = L/R)',
        value: `${(tau * 1e6).toFixed(2)} µs`,
        unit: 's',
      },
      operatingGain: {
        label: `Gain at ${formatQuantity(fin, 'frequency')}`,
        value: `${gainLinear.toFixed(4)} (${gainDb.toFixed(2)} dB)`,
      },
      phaseShift: {
        label: 'Phase Shift',
        value: `${phaseDeg.toFixed(1)}°`,
      },
      outputVoltage: {
        label: 'Output Voltage (V_out)',
        value: `${vout.toFixed(3)} V`,
        unit: 'V',
      },
    },
    visualData: {
      fc,
      tau,
      R,
      L,
      fin,
      Vin,
      Vout: vout,
      gainLinear,
      gainDb,
      phaseDeg,
      bodePoints,
      filterType: 'Low-Pass (RL: Series L, Shunt R)',
    },
  };
}

export function calculateRlHighPass(inputs: RlFilterInputs): CalculationResult {
  const { resistance, inductance, inputFreq, inputVoltage = 1.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R = Number.isFinite(resistance) && resistance > 0 ? resistance : 1000;
  const L = Number.isFinite(inductance) && inductance > 0 ? inductance : 10e-3;
  const Vin = Number.isFinite(inputVoltage) && inputVoltage >= 0 ? inputVoltage : 1.0;

  // Topology: Series R, Shunt L to Ground. Vout taken across L.
  // fc = R / (2 * pi * L)
  const tau = L / R;
  const fc = R / (2 * Math.PI * L);
  const fin = inputFreq !== undefined && Number.isFinite(inputFreq) && inputFreq > 0 ? inputFreq : fc;

  const xl = 2 * Math.PI * fin * L;
  const gainLinear = xl / Math.sqrt(R * R + xl * xl);
  const gainDb = 20 * Math.log10(Math.max(gainLinear, 1e-6));
  const phaseDeg = 90 - Math.atan(xl / R) * (180 / Math.PI);
  const vout = Vin * gainLinear;

  steps.push({
    stepNumber: 1,
    title: 'Calculate RL High-Pass Cutoff Frequency',
    formula: 'f_c = R / [ 2π × L ]   (Topology: Series R, Shunt L output)',
    substitution: `f_c = ${formatQuantity(R, 'resistance')} / [ 2π × ${formatQuantity(L, 'inductance')} ]`,
    result: `f_c = ${formatQuantity(fc, 'frequency')}`,
    annotation: 'Inductor shunts low frequencies to ground. High frequencies encounter high XL, appearing across the output.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Evaluate Gain at Operating Frequency',
    formula: '|A_v| = (2πfL) / √[ R² + (2πfL)² ]',
    substitution: `X_L = ${formatQuantity(xl, 'resistance')} → Gain = ${gainLinear.toFixed(4)} (${gainDb.toFixed(2)} dB)`,
    result: `Output = ${vout.toFixed(3)} V (Phase = +${phaseDeg.toFixed(1)}°)`,
  });

  const bodePoints = generateBodePoints(fc, 'rl-hp');

  return {
    primaryValue: fc,
    formattedValue: formatQuantity(fc, 'frequency'),
    unit: 'Hz',
    label: 'RL High-Pass Cutoff Frequency (f_c)',
    warnings,
    steps,
    additionalOutputs: {
      cutoff: {
        label: '-3dB Cutoff Frequency',
        value: formatQuantity(fc, 'frequency'),
        unit: 'Hz',
      },
      timeConstant: {
        label: 'Time Constant (τ = L/R)',
        value: `${(tau * 1e6).toFixed(2)} µs`,
        unit: 's',
      },
      operatingGain: {
        label: `Gain at ${formatQuantity(fin, 'frequency')}`,
        value: `${gainLinear.toFixed(4)} (${gainDb.toFixed(2)} dB)`,
      },
      phaseShift: {
        label: 'Phase Shift',
        value: `+${phaseDeg.toFixed(1)}°`,
      },
      outputVoltage: {
        label: 'Output Voltage (V_out)',
        value: `${vout.toFixed(3)} V`,
        unit: 'V',
      },
    },
    visualData: {
      fc,
      tau,
      R,
      L,
      fin,
      Vin,
      Vout: vout,
      gainLinear,
      gainDb,
      phaseDeg,
      bodePoints,
      filterType: 'High-Pass (RL: Series R, Shunt L)',
    },
  };
}

// -------------------------------------------------------------
// Bandwidth & Q Factor Calculations
// -------------------------------------------------------------
export interface BandwidthQInputs {
  fLowHz: number;
  fHighHz: number;
}

export interface BandwidthQResult {
  bandwidthHz: number;
  centerFreqHz: number; // Geometric mean f0 = sqrt(fL * fH) or arithmetic mean
  centerFreqArithmeticHz: number;
  qFactor: number;
  fractionalBandwidth: number;
}

export function calculateBandwidthQ(inputs: BandwidthQInputs): BandwidthQResult {
  const fL = Math.max(0.1, inputs.fLowHz);
  const fH = Math.max(fL + 0.001, inputs.fHighHz);

  const bw = fH - fL;
  const f0Geom = Math.sqrt(fL * fH);
  const f0Arith = (fL + fH) / 2;
  const q = f0Geom / bw;
  const fb = bw / f0Geom;

  return {
    bandwidthHz: bw,
    centerFreqHz: f0Geom,
    centerFreqArithmeticHz: f0Arith,
    qFactor: q,
    fractionalBandwidth: fb,
  };
}

// -------------------------------------------------------------
// Filter Order & Roll-Off Reference
// -------------------------------------------------------------
export interface FilterOrderInfo {
  order: number;
  rollOffDbPerDecade: number;
  rollOffDbPerOctave: number;
  attenuationAt2fcDb: number; // Low pass at 2*fc: 20*n*log10(2) ≈ 6.02*n
  attenuationAt10fcDb: number; // Low pass at 10*fc: 20*n dB
}

export function getFilterOrderProperties(order: number): FilterOrderInfo {
  const n = Math.max(1, Math.min(10, Math.round(order)));
  return {
    order: n,
    rollOffDbPerDecade: 20 * n,
    rollOffDbPerOctave: 6.0206 * n,
    attenuationAt2fcDb: 6.0206 * n,
    attenuationAt10fcDb: 20 * n,
  };
}

export const FILTER_ORDER_TABLE: FilterOrderInfo[] = [1, 2, 3, 4, 5, 6, 7, 8].map(getFilterOrderProperties);

// -------------------------------------------------------------
// Filter Order Synthesis (Butterworth, Chebyshev, Bessel)
// -------------------------------------------------------------
export interface FilterOrderSynthesisInputs {
  passbandFreqHz: number;
  stopbandFreqHz: number;
  stopbandAttenuationDb: number;
  passbandRippleDb?: number;
}

export interface FilterOrderSynthesisResult {
  frequencyRatio: number;
  butterworthOrder: number;
  butterworthExactOrder: number;
  chebyshev05DbOrder: number;
  chebyshev05DbExactOrder: number;
  chebyshev10DbOrder: number;
  chebyshev10DbExactOrder: number;
  besselEstimatedOrder: number;
  passbandFreqHz: number;
  stopbandFreqHz: number;
  stopbandAttenuationDb: number;
}

export function calculateFilterOrderSynthesis(inputs: FilterOrderSynthesisInputs): FilterOrderSynthesisResult {
  const fPass = Math.max(1, inputs.passbandFreqHz);
  const fStop = Math.max(fPass * 1.01, inputs.stopbandFreqHz);
  const Astop = Math.max(1, inputs.stopbandAttenuationDb);
  const ratio = fStop / fPass;

  // Butterworth: N = log10( (10^(Astop/10) - 1) / (10^(Apass/10) - 1) ) / (2 * log10(ratio))
  const ApassButterworth = inputs.passbandRippleDb ?? 3.0103;
  const numButterworth = Math.log10((Math.pow(10, Astop / 10) - 1) / (Math.pow(10, ApassButterworth / 10) - 1));
  const denButterworth = 2 * Math.log10(ratio);
  const butterworthExact = numButterworth / denButterworth;
  const butterworthOrder = Math.max(1, Math.ceil(butterworthExact));

  // Chebyshev: N = arcosh( sqrt( (10^(Astop/10) - 1) / (10^(Apass/10) - 1) ) ) / arcosh(ratio)
  const calcChebyshev = (rippleDb: number) => {
    const epsilonSq = Math.pow(10, rippleDb / 10) - 1;
    const stopVal = Math.pow(10, Astop / 10) - 1;
    const x = Math.sqrt(stopVal / epsilonSq);
    const arcoshX = Math.log(x + Math.sqrt(Math.max(0, x * x - 1)));
    const arcoshRatio = Math.log(ratio + Math.sqrt(Math.max(0, ratio * ratio - 1)));
    const exact = arcoshX / arcoshRatio;
    return { exact, order: Math.max(1, Math.ceil(exact)) };
  };

  const cheb05 = calcChebyshev(0.5);
  const cheb10 = calcChebyshev(1.0);

  // Bessel filters prioritize linear phase over roll-off, requiring ~1.35x Butterworth order for equivalent stopband rejection
  const besselEstimatedOrder = Math.max(1, Math.ceil(butterworthExact * 1.35));

  return {
    frequencyRatio: ratio,
    butterworthOrder,
    butterworthExactOrder: butterworthExact,
    chebyshev05DbOrder: cheb05.order,
    chebyshev05DbExactOrder: cheb05.exact,
    chebyshev10DbOrder: cheb10.order,
    chebyshev10DbExactOrder: cheb10.exact,
    besselEstimatedOrder,
    passbandFreqHz: fPass,
    stopbandFreqHz: fStop,
    stopbandAttenuationDb: Astop,
  };
}

// -------------------------------------------------------------
// 2nd-Order RLC Bandpass & Notch Frequency Response
// -------------------------------------------------------------
export interface RlcFilterResponseInputs {
  type: 'bandpass' | 'notch';
  centerFreqHz: number;
  qFactor: number;
}

export function generateRlcBodePoints(inputs: RlcFilterResponseInputs): FilterBodePoint[] {
  const { type, centerFreqHz, qFactor } = inputs;
  const f0 = Math.max(1, centerFreqHz);
  const Q = Math.max(0.05, qFactor);

  const points: FilterBodePoint[] = [];
  const decades = 4; // 2 below f0, 2 above f0
  const totalPoints = 50;

  for (let i = 0; i <= totalPoints; i++) {
    const logRatio = -2 + (decades * i) / totalPoints;
    const ratio = Math.pow(10, logRatio); // f / f0
    const freq = f0 * ratio;

    let gainLinear = 0;
    let phaseDeg = 0;

    if (type === 'bandpass') {
      // H(s) = (s / (Q * w0)) / [ 1 - (w/w0)^2 + j*(w / (Q*w0)) ]
      // In terms of ratio r = f/f0:
      // denom_real = 1 - r^2
      // denom_imag = r / Q
      // num_imag = r / Q
      const denomReal = 1 - ratio * ratio;
      const denomImag = ratio / Q;
      const denomMagSq = denomReal * denomReal + denomImag * denomImag;
      gainLinear = (ratio / Q) / Math.sqrt(denomMagSq);

      // Phase = 90 - atan2(denomImag, denomReal)
      const denomAngle = Math.atan2(denomImag, denomReal);
      phaseDeg = (Math.PI / 2 - denomAngle) * (180 / Math.PI);
    } else {
      // Notch / Bandstop:
      // H(s) = (1 - r^2) / [ (1 - r^2) + j*(r/Q) ]
      const numReal = 1 - ratio * ratio;
      const denomReal = 1 - ratio * ratio;
      const denomImag = ratio / Q;
      const denomMagSq = denomReal * denomReal + denomImag * denomImag;
      gainLinear = Math.abs(numReal) / Math.sqrt(denomMagSq);

      const numAngle = numReal >= 0 ? 0 : Math.PI;
      const denomAngle = Math.atan2(denomImag, denomReal);
      phaseDeg = (numAngle - denomAngle) * (180 / Math.PI);
      if (phaseDeg > 180) phaseDeg -= 360;
      if (phaseDeg < -180) phaseDeg += 360;
    }

    const gainDb = 20 * Math.log10(Math.max(gainLinear, 1e-5));
    points.push({ freq, freqRatio: ratio, gainLinear, gainDb, phaseDeg });
  }

  return points;
}

