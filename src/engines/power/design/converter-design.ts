import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';
import { formatQuantity } from '../../../lib/units/formatter';

export type ConverterDesignTopology = 'auto' | 'buck' | 'boost' | 'inverting-buck-boost' | 'sepic';

export interface ConverterDesignInputs {
  inputVoltageMinV: number;
  inputVoltageMaxV: number;
  outputVoltageV: number;
  outputCurrentA: number;
  switchingFrequencyHz: number;
  targetEfficiencyPercent?: number; // e.g. 90%
  selectedTopology?: ConverterDesignTopology;
  maxRippleCurrentRatio?: number; // e.g. 0.3 for 30%
  maxOutputRippleVoltageV?: number; // e.g. 0.03 V
}

export function designPowerConverter(inputs: ConverterDesignInputs): CalculationResult {
  const {
    inputVoltageMinV: VinMin,
    inputVoltageMaxV: VinMax,
    outputVoltageV: Vout,
    outputCurrentA: Iout,
    switchingFrequencyHz: fs,
    targetEfficiencyPercent: targetEffPct = 90,
    selectedTopology = 'auto',
    maxRippleCurrentRatio: rRatio = 0.35,
    maxOutputRippleVoltageV: maxRipV = 0.03,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeVinMin = Math.max(VinMin, 0.1);
  const safeVinMax = Math.max(VinMax, safeVinMin);
  const safeVinNom = (safeVinMin + safeVinMax) / 2;
  const safeVout = Math.max(Vout, 0.1);
  const safeIout = Math.max(Iout, 0.01);
  const safeFs = Math.max(fs, 1000);
  const eta = Math.max(0.2, Math.min(targetEffPct / 100, 0.99));

  // Topology selection logic if 'auto'
  let resolvedTopology: 'buck' | 'boost' | 'inverting-buck-boost' | 'sepic' = 'buck';
  let topologyReason = '';

  if (selectedTopology === 'auto') {
    if (safeVinMin > safeVout * 1.1) {
      resolvedTopology = 'buck';
      topologyReason = 'Input voltage is always higher than output voltage (Vin,min > Vout). Standard step-down Buck converter selected.';
    } else if (safeVinMax < safeVout * 0.9) {
      resolvedTopology = 'boost';
      topologyReason = 'Input voltage is always lower than output voltage (Vin,max < Vout). Standard step-up Boost converter selected.';
    } else {
      resolvedTopology = 'sepic';
      topologyReason = 'Input voltage range overlaps output voltage (Vin,min < Vout < Vin,max). Non-inverting SEPIC topology selected for seamless buck/boost capability.';
    }
  } else {
    resolvedTopology = selectedTopology === 'inverting-buck-boost' ? 'inverting-buck-boost' : selectedTopology;
    topologyReason = `User explicitly selected ${resolvedTopology.toUpperCase()} topology.`;
  }

  // Duty cycles at VinMin, VinNom, VinMax
  let dNom = 0;
  let dMin = 0; // at VinMax
  let dMax = 0; // at VinMin
  let inductanceH = 0;
  let capacitanceF = 0;
  let switchPeakV = 0;
  let switchRmsA = 0;
  let diodePeakV = 0;
  let deltaIL = 0;

  if (resolvedTopology === 'buck') {
    dNom = safeVout / safeVinNom;
    dMin = safeVout / safeVinMax;
    dMax = safeVout / safeVinMin;
    deltaIL = safeIout * rRatio;
    inductanceH = (safeVout * (1 - dNom)) / (safeFs * deltaIL);
    capacitanceF = deltaIL / (8 * safeFs * maxRipV);
    switchPeakV = safeVinMax * 1.3; // with margin
    diodePeakV = safeVinMax * 1.3;
    switchRmsA = safeIout * Math.sqrt(dNom);
  } else if (resolvedTopology === 'boost') {
    dNom = 1 - safeVinNom / safeVout;
    dMin = 1 - safeVinMax / safeVout;
    dMax = 1 - safeVinMin / safeVout;
    const iInAvg = safeIout / (1 - dNom);
    deltaIL = iInAvg * rRatio;
    inductanceH = (safeVinNom * dNom) / (safeFs * deltaIL);
    capacitanceF = (safeIout * dNom) / (safeFs * maxRipV);
    switchPeakV = safeVout * 1.3;
    diodePeakV = safeVout * 1.3;
    switchRmsA = iInAvg * Math.sqrt(dNom);
  } else if (resolvedTopology === 'inverting-buck-boost') {
    dNom = safeVout / (safeVout + safeVinNom);
    dMin = safeVout / (safeVout + safeVinMax);
    dMax = safeVout / (safeVout + safeVinMin);
    const iLAvg = safeIout / (1 - dNom);
    deltaIL = iLAvg * rRatio;
    inductanceH = (safeVinNom * dNom) / (safeFs * deltaIL);
    capacitanceF = (safeIout * dNom) / (safeFs * maxRipV);
    switchPeakV = (safeVinMax + safeVout) * 1.3;
    diodePeakV = (safeVinMax + safeVout) * 1.3;
    switchRmsA = iLAvg * Math.sqrt(dNom);
  } else {
    // SEPIC
    dNom = (safeVout + 0.5) / (safeVinNom + safeVout + 0.5);
    dMin = (safeVout + 0.5) / (safeVinMax + safeVout + 0.5);
    dMax = (safeVout + 0.5) / (safeVinMin + safeVout + 0.5);
    const iInAvg = safeIout * (dNom / (1 - dNom));
    deltaIL = (iInAvg + safeIout) * rRatio * 0.5;
    inductanceH = (safeVinNom * dNom) / (safeFs * deltaIL);
    capacitanceF = (safeIout * dNom) / (safeFs * maxRipV);
    switchPeakV = (safeVinMax + safeVout + 0.5) * 1.3;
    diodePeakV = (safeVinMax + safeVout + 0.5) * 1.3;
    switchRmsA = (iInAvg + safeIout) * Math.sqrt(dNom);
  }

  const pOutWatts = safeVout * safeIout;
  const pInWatts = pOutWatts / eta;
  const totalEstimatedLossWatts = pInWatts - pOutWatts;

  // Breakdown approximation:
  const mosfetLossW = totalEstimatedLossWatts * 0.45;
  const diodeLossW = totalEstimatedLossWatts * 0.25;
  const magneticLossW = totalEstimatedLossWatts * 0.20;
  const capAndOtherLossW = totalEstimatedLossWatts * 0.10;

  // Estimated thermal junction rise of main MOSFET (assuming typical SMD copper area Rθ_JA ≈ 45 °C/W):
  const estimatedTjRise = mosfetLossW * 45;
  const estimatedTjC = 35 + estimatedTjRise; // at 35°C ambient

  // Prominent engineering disclaimer:
  warnings.push({
    severity: 'info',
    title: 'Preliminary Design Mode Scope Disclaimer',
    message:
      'This calculation is a preliminary first-pass architectural sizing aid. Practical hardware design requires detailed magnetic core geometry, PCB loop inductance control, feedback loop stability compensation, and laboratory thermal & EMC validation.',
  });

  steps.push({
    stepNumber: 1,
    title: `Topology Selection & Duty Cycle Range Analysis`,
    formula: 'Operating Conversion Range',
    substitution: `V_in: ${safeVinMin} V – ${safeVinMax} V, V_out: ${safeVout} V @ ${safeIout} A`,
    result: `Topology: ${resolvedTopology.toUpperCase()} (${topologyReason})`,
    annotation: `Duty Range: D_min = ${(dMin * 100).toFixed(1)}%, D_nom = ${(dNom * 100).toFixed(1)}%, D_max = ${(dMax * 100).toFixed(1)}%`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Power Conversion & Loss Budget Distribution',
    formula: 'P_out = V_out × I_out;  P_loss,budget = P_out × (1/η - 1)',
    substitution: `${safeVout} V × ${safeIout} A = ${pOutWatts.toFixed(1)} W;  Loss Budget = ${totalEstimatedLossWatts.toFixed(2)} W`,
    result: `P_out = ${formatQuantity(pOutWatts, 'power')},  P_in = ${formatQuantity(pInWatts, 'power')}`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Preliminary Energy Storage Sizing (L & C_out)',
    formula: 'Target Inductor Ripple & Capacitor Voltage Droop',
    substitution: `Ripple Ratio = ${(rRatio * 100).toFixed(0)}%, ΔV_out ≤ ${(maxRipV * 1000).toFixed(0)} mV`,
    result: `L ≥ ${formatQuantity(inductanceH, 'inductance')},  C_out ≥ ${formatQuantity(capacitanceF, 'capacitance')}`,
  });

  steps.push({
    stepNumber: 4,
    title: 'Semiconductor Voltage & Thermal Stress Sizing',
    formula: 'V_stress(recommended) ≥ 1.3 × V_peak;  T_j ≈ T_amb + P_loss × R_θ',
    substitution: `Switch Peak: ${switchPeakV.toFixed(0)} V rating;  MOSFET Dissipation ≈ ${mosfetLossW.toFixed(2)} W`,
    result: `Switch Rating ≥ ${switchPeakV.toFixed(0)} V,  Estimated MOSFET T_j ≈ ${estimatedTjC.toFixed(0)} °C`,
  });

  return {
    primaryValue: pOutWatts,
    formattedValue: `${formatQuantity(pOutWatts, 'power')} (${resolvedTopology.toUpperCase()})`,
    unit: 'W',
    label: 'Converter Designed Power Capacity',
    classification: 'TOPOLOGY / DESIGN DEPENDENT',
    standardsContext: 'Preliminary multi-parameter power converter stage synthesizer. Combines steady-state volt-second balance, ripple bounds, and thermal estimates.',
    warnings,
    steps,
    additionalOutputs: {
      recommendedTopology: { label: 'Recommended Topology', value: resolvedTopology.toUpperCase() },
      nominalDutyCycle: { label: 'Nominal Duty Cycle (D_nom)', value: `${(dNom * 100).toFixed(1)}%` },
      dutyCycleRange: { label: 'Duty Cycle Span (D_min – D_max)', value: `${(dMin * 100).toFixed(1)}% – ${(dMax * 100).toFixed(1)}%` },
      recommendedInductance: { label: 'Recommended Inductor (L)', value: formatQuantity(inductanceH, 'inductance') },
      inductorRippleCurrent: { label: 'Inductor Ripple (ΔI_L)', value: `${deltaIL.toFixed(3)} A` },
      recommendedCapacitance: { label: 'Recommended Output Cap (C_out)', value: formatQuantity(capacitanceF, 'capacitance') },
      switchVoltageRating: { label: 'MOSFET Minimum V_ds Rating', value: `≥ ${switchPeakV.toFixed(0)} V` },
      diodeVoltageRating: { label: 'Diode Minimum Reverse Rating', value: `≥ ${diodePeakV.toFixed(0)} V` },
      switchRmsCurrent: { label: 'Switch RMS Current (I_sw,rms)', value: `${switchRmsA.toFixed(3)} A` },
      totalEstimatedLoss: { label: 'Estimated Power Dissipation', value: `${totalEstimatedLossWatts.toFixed(2)} W` },
      estimatedMosfetTj: { label: 'Est. MOSFET T_j (35°C Amb)', value: `~${estimatedTjC.toFixed(0)} °C` },
    },
    visualData: {
      resolvedTopology,
      dNom,
      dMin,
      dMax,
      inductanceH,
      capacitanceF,
      pOutWatts,
      pInWatts,
      totalEstimatedLossWatts,
      mosfetLossW,
      diodeLossW,
      magneticLossW,
      capAndOtherLossW,
      switchPeakV,
      switchRmsA,
      estimatedTjC,
    },
  };
}
