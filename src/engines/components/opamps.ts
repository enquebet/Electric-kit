import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface InvertingAmpInputs {
  rIn: number;          // Input resistor Rin (Ohms)
  rFeedback: number;    // Feedback resistor Rf (Ohms)
  vIn: number;          // Input voltage Vin (V)
  vSupplyPos?: number;  // Positive rail Vcc+ (V, default 15V)
  vSupplyNeg?: number;  // Negative rail Vee- (V, default -15V)
}

export function calculateInvertingAmplifier(inputs: InvertingAmpInputs): CalculationResult {
  const { rIn, rFeedback, vIn, vSupplyPos = 15.0, vSupplyNeg = -15.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Rin = Number.isFinite(rIn) && rIn > 0 ? rIn : 10000;
  const Rf = Number.isFinite(rFeedback) && rFeedback >= 0 ? rFeedback : 100000;
  const Vin = Number.isFinite(vIn) ? vIn : 1.0;
  const Vpos = Number.isFinite(vSupplyPos) ? vSupplyPos : 15.0;
  const Vneg = Number.isFinite(vSupplyNeg) ? vSupplyNeg : -15.0;

  // Av = -Rf / Rin
  const gain = -(Rf / Rin);
  const gainDb = 20 * Math.log10(Math.max(1e-6, Math.abs(gain)));
  const vOutIdeal = gain * Vin;

  // Rail clamping (practical saturation headroom ~1.2V below rails for standard op-amps)
  const vOutSaturatedMax = Vpos - 1.2;
  const vOutSaturatedMin = Vneg + 1.2;
  let vOutClamped = vOutIdeal;
  let isClipped = false;

  if (vOutIdeal > vOutSaturatedMax) {
    vOutClamped = vOutSaturatedMax;
    isClipped = true;
    warnings.push({
      severity: 'danger',
      title: 'Positive Rail Saturation (Clipping)',
      message: `Ideal output (${formatQuantity(vOutIdeal, 'voltage')}) exceeds positive rail ceiling (${formatQuantity(vOutSaturatedMax, 'voltage')}). Waveform will clip flat.`,
    });
  } else if (vOutIdeal < vOutSaturatedMin) {
    vOutClamped = vOutSaturatedMin;
    isClipped = true;
    warnings.push({
      severity: 'danger',
      title: 'Negative Rail Saturation (Clipping)',
      message: `Ideal output (${formatQuantity(vOutIdeal, 'voltage')}) exceeds negative rail floor (${formatQuantity(vOutSaturatedMin, 'voltage')}). Waveform will clip flat.`,
    });
  }

  // Virtual ground input current: I_in = Vin / Rin
  const iIn = Vin / Rin;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Closed-Loop Inverting Voltage Gain',
    formula: 'A_v = -R_f / R_in',
    substitution: `A_v = -(${formatQuantity(Rf, 'resistance')} / ${formatQuantity(Rin, 'resistance')})`,
    result: `A_v = ${gain.toFixed(3)} (${gainDb.toFixed(2)} dB, 180° inverted phase)`,
    annotation: 'The inverting input is held at a virtual ground (0V) by negative feedback; input impedance equals Rin.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Output Voltage',
    formula: 'V_out = A_v × V_in',
    substitution: `V_out = ${gain.toFixed(3)} × ${formatQuantity(Vin, 'voltage')}`,
    result: isClipped ? `${formatQuantity(vOutClamped, 'voltage')} [Clipped from ${formatQuantity(vOutIdeal, 'voltage')}]` : formatQuantity(vOutIdeal, 'voltage'),
  });

  return {
    primaryValue: vOutClamped,
    formattedValue: formatQuantity(vOutClamped, 'voltage'),
    unit: 'V',
    label: 'Amplifier Output Voltage (V_out)',
    warnings,
    steps,
    additionalOutputs: {
      voltageGain: {
        label: 'Voltage Gain (A_v)',
        value: `${gain.toFixed(3)} (${gainDb.toFixed(2)} dB)`,
      },
      inputImpedance: {
        label: 'Input Impedance (Z_in)',
        value: formatQuantity(Rin, 'resistance'),
        unit: 'Ω',
      },
      virtualGroundCurrent: {
        label: 'Virtual Ground Input Current',
        value: formatQuantity(iIn, 'current'),
        unit: 'A',
      },
      railStatus: {
        label: 'Output Dynamic Range',
        value: isClipped ? 'Saturated / Clipped' : 'Linear Range',
      },
    },
    visualData: {
      Rin,
      Rf,
      Vin,
      gain,
      vOutIdeal,
      vOutClamped,
      isClipped,
      Vpos,
      Vneg,
    },
  };
}

export interface NonInvertingAmpInputs {
  rGround: number;      // Ground resistor Rg (Ohms)
  rFeedback: number;    // Feedback resistor Rf (Ohms)
  vIn: number;          // Input voltage Vin (V)
  vSupplyPos?: number;  // Positive rail (V)
  vSupplyNeg?: number;  // Negative rail (V)
}

export function calculateNonInvertingAmplifier(inputs: NonInvertingAmpInputs): CalculationResult {
  const { rGround, rFeedback, vIn, vSupplyPos = 15.0, vSupplyNeg = -15.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Rg = Number.isFinite(rGround) && rGround > 0 ? rGround : 10000;
  const Rf = Number.isFinite(rFeedback) && rFeedback >= 0 ? rFeedback : 90000;
  const Vin = Number.isFinite(vIn) ? vIn : 1.0;
  const Vpos = Number.isFinite(vSupplyPos) ? vSupplyPos : 15.0;
  const Vneg = Number.isFinite(vSupplyNeg) ? vSupplyNeg : -15.0;

  // Av = 1 + (Rf / Rg) >= 1.0 always
  const gain = 1 + (Rf / Rg);
  const gainDb = 20 * Math.log10(gain);
  const vOutIdeal = gain * Vin;

  const vOutSaturatedMax = Vpos - 1.2;
  const vOutSaturatedMin = Vneg + 1.2;
  let vOutClamped = vOutIdeal;
  let isClipped = false;

  if (vOutIdeal > vOutSaturatedMax) {
    vOutClamped = vOutSaturatedMax;
    isClipped = true;
    warnings.push({
      severity: 'danger',
      title: 'Positive Rail Saturation (Clipping)',
      message: `Output (${formatQuantity(vOutIdeal, 'voltage')}) exceeds positive rail ceiling (${formatQuantity(vOutSaturatedMax, 'voltage')}).`,
    });
  } else if (vOutIdeal < vOutSaturatedMin) {
    vOutClamped = vOutSaturatedMin;
    isClipped = true;
    warnings.push({
      severity: 'danger',
      title: 'Negative Rail Saturation (Clipping)',
      message: `Output (${formatQuantity(vOutIdeal, 'voltage')}) exceeds negative rail floor (${formatQuantity(vOutSaturatedMin, 'voltage')}).`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Closed-Loop Non-Inverting Voltage Gain',
    formula: 'A_v = 1 + (R_f / R_g)',
    substitution: `A_v = 1 + (${formatQuantity(Rf, 'resistance')} / ${formatQuantity(Rg, 'resistance')}) = 1 + ${(Rf / Rg).toFixed(2)}`,
    result: `A_v = +${gain.toFixed(3)} (+${gainDb.toFixed(2)} dB, in-phase 0°)`,
    annotation: 'Non-inverting configuration offers extremely high input impedance (typically >10¹² Ω for FET-input op-amps).',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Output Voltage',
    formula: 'V_out = A_v × V_in',
    substitution: `V_out = ${gain.toFixed(3)} × ${formatQuantity(Vin, 'voltage')}`,
    result: formatQuantity(vOutClamped, 'voltage'),
  });

  return {
    primaryValue: vOutClamped,
    formattedValue: formatQuantity(vOutClamped, 'voltage'),
    unit: 'V',
    label: 'Amplifier Output Voltage (V_out)',
    warnings,
    steps,
    additionalOutputs: {
      voltageGain: {
        label: 'Voltage Gain (A_v)',
        value: `+${gain.toFixed(3)} (+${gainDb.toFixed(2)} dB)`,
      },
      inputImpedance: {
        label: 'Input Impedance (Z_in)',
        value: '> 10¹² Ω (FET-input typical)',
      },
      feedbackRatio: {
        label: 'Feedback Attenuation Factor β',
        value: `${(1 / gain).toFixed(4)}`,
      },
    },
    visualData: {
      Rg,
      Rf,
      Vin,
      gain,
      vOutIdeal,
      vOutClamped,
      isClipped,
      Vpos,
      Vneg,
    },
  };
}

export interface OpAmpFollowerInputs {
  vIn: number;          // Input voltage (V)
  vSupplyPos?: number;  // Positive rail (V)
  vSupplyNeg?: number;  // Negative rail (V)
  slewRate?: number;    // V/µs (e.g. 0.5 for LM741, 20 for TL071)
}

export function calculateOpAmpFollower(inputs: OpAmpFollowerInputs): CalculationResult {
  const { vIn, vSupplyPos = 15.0, vSupplyNeg = -15.0, slewRate = 10.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Vin = Number.isFinite(vIn) ? vIn : 3.3;
  const Vpos = Number.isFinite(vSupplyPos) ? vSupplyPos : 15.0;
  const Vneg = Number.isFinite(vSupplyNeg) ? vSupplyNeg : -15.0;
  const sr = Number.isFinite(slewRate) && slewRate > 0 ? slewRate : 10.0; // V/us

  const gain = 1.0;
  const gainDb = 0.0;
  const vOutIdeal = Vin;

  const vOutSaturatedMax = Vpos - 1.2;
  const vOutSaturatedMin = Vneg + 1.2;
  let vOutClamped = vOutIdeal;
  let isClipped = false;

  if (vOutIdeal > vOutSaturatedMax) {
    vOutClamped = vOutSaturatedMax;
    isClipped = true;
    warnings.push({
      severity: 'danger',
      title: 'Rail Saturation',
      message: `Input (${formatQuantity(Vin, 'voltage')}) exceeds buffer positive headroom (${formatQuantity(vOutSaturatedMax, 'voltage')}).`,
    });
  } else if (vOutIdeal < vOutSaturatedMin) {
    vOutClamped = vOutSaturatedMin;
    isClipped = true;
    warnings.push({
      severity: 'danger',
      title: 'Rail Saturation',
      message: `Input (${formatQuantity(Vin, 'voltage')}) exceeds buffer negative headroom (${formatQuantity(vOutSaturatedMin, 'voltage')}).`,
    });
  }

  // Full power bandwidth: f_max = SlewRate / (2 * pi * V_peak)
  const vPeak = Math.max(0.1, Math.abs(Vin));
  const srVoltsPerSec = sr * 1e6;
  const fFullPower = srVoltsPerSec / (2 * Math.PI * vPeak);

  steps.push({
    stepNumber: 1,
    title: 'Unity Gain Buffer Relationship',
    formula: 'A_v = 1.000 (0.0 dB) ;   V_out = V_in',
    substitution: `V_out = 1.0 × ${formatQuantity(Vin, 'voltage')}`,
    result: formatQuantity(vOutClamped, 'voltage'),
    annotation: 'Provides 100% negative feedback with zero external components, isolating high-impedance sources from low-impedance loads.',
  });

  steps.push({
    stepNumber: 2,
    title: 'Slew-Rate Limited Full Power Bandwidth',
    formula: 'f_max = SlewRate / (2π × V_peak)',
    substitution: `f_max = (${sr} V/µs) / (2π × ${formatQuantity(vPeak, 'voltage')})`,
    result: formatQuantity(fFullPower, 'frequency'),
  });

  warnings.push({
    severity: 'info',
    title: 'Practical Engineering Caveat',
    message: 'Driving capacitive cable or bypass capacitance (>100pF) directly from a follower output can erode phase margin, causing high-frequency ringing or sustained oscillation. An isolation series resistor (22Ω-100Ω) outside the feedback loop is standard practice.',
  });

  return {
    primaryValue: vOutClamped,
    formattedValue: formatQuantity(vOutClamped, 'voltage'),
    unit: 'V',
    label: 'Buffer Output Voltage (V_out)',
    warnings,
    steps,
    additionalOutputs: {
      gain: { label: 'Voltage Gain', value: '1.000 (0.00 dB)' },
      inputImpedance: { label: 'Input Impedance', value: 'Extremely High (~10¹² Ω)' },
      outputImpedance: { label: 'Output Impedance', value: 'Extremely Low (< 0.1 Ω)' },
      fullPowerBandwidth: { label: 'Full Power Bandwidth', value: formatQuantity(fFullPower, 'frequency'), unit: 'Hz' },
    },
    visualData: {
      Vin,
      vOutClamped,
      isClipped,
      sr,
      fFullPower,
    },
  };
}

export interface SummingAmpChannel {
  vIn: number;
  rIn: number;
}

export interface SummingAmpInputs {
  channels: SummingAmpChannel[];
  rFeedback: number;
  vSupplyPos?: number;
  vSupplyNeg?: number;
}

export function calculateSummingAmplifier(inputs: SummingAmpInputs): CalculationResult {
  const { channels, rFeedback, vSupplyPos = 15.0, vSupplyNeg = -15.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Rf = Number.isFinite(rFeedback) && rFeedback > 0 ? rFeedback : 10000;
  const validChannels = channels.length > 0
    ? channels
    : [{ vIn: 1.0, rIn: 10000 }, { vIn: 2.0, rIn: 10000 }];

  // Inverting summing amp: Vout = -Rf * sum(Vi / Ri)
  let sumTerm = 0;
  const channelBreakdown = validChannels.map((ch, idx) => {
    const vi = Number.isFinite(ch.vIn) ? ch.vIn : 0;
    const ri = Number.isFinite(ch.rIn) && ch.rIn > 0 ? ch.rIn : 10000;
    const chGain = -(Rf / ri);
    const chContribution = chGain * vi;
    sumTerm += (vi / ri);
    return {
      channel: idx + 1,
      vIn: vi,
      rIn: ri,
      gain: chGain,
      contribution: chContribution,
    };
  });

  const vOutIdeal = -Rf * sumTerm;
  const Vpos = Number.isFinite(vSupplyPos) ? vSupplyPos : 15.0;
  const Vneg = Number.isFinite(vSupplyNeg) ? vSupplyNeg : -15.0;

  const vOutMax = Vpos - 1.2;
  const vOutMin = Vneg + 1.2;
  let vOutClamped = vOutIdeal;
  let isClipped = false;

  if (vOutIdeal > vOutMax || vOutIdeal < vOutMin) {
    isClipped = true;
    vOutClamped = vOutIdeal > vOutMax ? vOutMax : vOutMin;
    warnings.push({
      severity: 'danger',
      title: 'Summing Output Saturated',
      message: `Ideal summed output (${formatQuantity(vOutIdeal, 'voltage')}) exceeds op-amp supply rails.`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: 'Inverting Weighted Summation',
    formula: 'V_out = -R_f × ∑(V_i / R_i) = ∑ [ -(R_f / R_i) × V_i ]',
    substitution: `V_out = -${formatQuantity(Rf, 'resistance')} × [ ${validChannels.map(c => `${c.vIn}V/${formatQuantity(c.rIn, 'resistance')}`).join(' + ')} ]`,
    result: formatQuantity(vOutClamped, 'voltage'),
  });

  return {
    primaryValue: vOutClamped,
    formattedValue: formatQuantity(vOutClamped, 'voltage'),
    unit: 'V',
    label: 'Summed Output Voltage (V_out)',
    warnings,
    steps,
    additionalOutputs: {
      channelsCount: { label: 'Input Channels', value: validChannels.length.toString() },
      idealOutput: { label: 'Unclipped Ideal Output', value: formatQuantity(vOutIdeal, 'voltage'), unit: 'V' },
      feedbackResistor: { label: 'Feedback Resistor (R_f)', value: formatQuantity(Rf, 'resistance'), unit: 'Ω' },
    },
    visualData: {
      Rf,
      channels: channelBreakdown,
      vOutIdeal,
      vOutClamped,
      isClipped,
    },
  };
}

export interface DifferentialAmpInputs {
  r1: number; // Inverting input series resistor (Ohms)
  r2: number; // Feedback resistor from output to inverting node (Ohms)
  r3: number; // Non-inverting input series resistor (Ohms)
  r4: number; // Reference resistor from non-inverting node to ground (Ohms)
  v1: number; // Inverting terminal input (V)
  v2: number; // Non-inverting terminal input (V)
  vSupplyPos?: number;
  vSupplyNeg?: number;
}

export function calculateDifferentialAmplifier(inputs: DifferentialAmpInputs): CalculationResult {
  const { r1, r2, r3, r4, v1, v2, vSupplyPos = 15.0, vSupplyNeg = -15.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R1 = Number.isFinite(r1) && r1 > 0 ? r1 : 10000;
  const R2 = Number.isFinite(r2) && r2 > 0 ? r2 : 100000;
  const R3 = Number.isFinite(r3) && r3 > 0 ? r3 : 10000;
  const R4 = Number.isFinite(r4) && r4 > 0 ? r4 : 100000;
  const V1 = Number.isFinite(v1) ? v1 : 1.0;
  const V2 = Number.isFinite(v2) ? v2 : 1.5;

  // General superposition equation for 4-resistor difference amplifier:
  // Vout = V2 * [ R4 / (R3 + R4) ] * [ (R1 + R2) / R1 ] - V1 * [ R2 / R1 ]
  const vNonInvGain = (R4 / (R3 + R4)) * ((R1 + R2) / R1);
  const vInvGain = R2 / R1;
  const vOutIdeal = (V2 * vNonInvGain) - (V1 * vInvGain);

  // Check matching ratio:
  const ratio1 = R2 / R1;
  const ratio2 = R4 / R3;
  const isMatched = Math.abs(ratio1 - ratio2) / ratio1 < 0.001; // 0.1% match

  // Common mode gain: A_cm = vNonInvGain - vInvGain
  const aCm = vNonInvGain - vInvGain;
  // Differential gain: A_d = 0.5 * (vNonInvGain + vInvGain)
  const aD = 0.5 * (vNonInvGain + vInvGain);
  // CMRR = 20 * log10(|A_d / A_cm|)
  const cmrrDb = Math.abs(aCm) > 1e-6 ? 20 * Math.log10(Math.abs(aD / aCm)) : 120; // 120dB if perfectly matched

  steps.push({
    stepNumber: 1,
    title: 'Evaluate Resistor Bridge Matching Condition',
    formula: 'Matched Condition: R₂ / R₁ = R₄ / R₃ = K',
    substitution: `R₂/R₁ = ${formatQuantity(R2, 'resistance')} / ${formatQuantity(R1, 'resistance')} = ${ratio1.toFixed(3)} ;   R₄/R₃ = ${formatQuantity(R4, 'resistance')} / ${formatQuantity(R3, 'resistance')} = ${ratio2.toFixed(3)}`,
    result: isMatched ? `Perfect Match (Differential Gain K = ${ratio1.toFixed(3)})` : `Mismatch Detected (Δ = ${(Math.abs(ratio1 - ratio2) / ratio1 * 100).toFixed(2)}%)`,
    annotation: 'Any tolerance mismatch between resistor pairs severely degrades Common Mode Rejection Ratio (CMRR).',
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Differential Output Voltage & CMRR',
    formula: 'V_out = V₂ × [R₄/(R₃+R₄)][(R₁+R₂)/R₁] - V₁ × [R₂/R₁]',
    substitution: `V_out = (${V2}V × ${vNonInvGain.toFixed(3)}) - (${V1}V × ${vInvGain.toFixed(3)})`,
    result: `V_out = ${formatQuantity(vOutIdeal, 'voltage')} (CMRR ≈ ${cmrrDb.toFixed(1)} dB)`,
  });

  if (!isMatched) {
    warnings.push({
      severity: 'warning',
      title: 'Resistor Mismatch Degrades CMRR',
      message: `Resistor ratios differ by ${(Math.abs(ratio1 - ratio2) / ratio1 * 100).toFixed(2)}%. Common-mode rejection drops to ${cmrrDb.toFixed(1)} dB. Use 0.1% thin-film matched resistors or an instrumentation amplifier (e.g. INA128).`,
    });
  }

  return {
    primaryValue: vOutIdeal,
    formattedValue: formatQuantity(vOutIdeal, 'voltage'),
    unit: 'V',
    label: 'Differential Output Voltage (V_out)',
    warnings,
    steps,
    additionalOutputs: {
      diffVoltage: { label: 'Differential Input (V₂ - V₁)', value: formatQuantity(V2 - V1, 'voltage'), unit: 'V' },
      differentialGain: { label: 'Differential Gain (A_d)', value: aD.toFixed(3) },
      cmrr: { label: 'Common Mode Rejection (CMRR)', value: `${cmrrDb.toFixed(1)} dB` },
      commonModeGain: { label: 'Common Mode Gain (A_cm)', value: aCm.toFixed(5) },
    },
    visualData: {
      R1,
      R2,
      R3,
      R4,
      V1,
      V2,
      vOutIdeal,
      cmrrDb,
      isMatched,
    },
  };
}
