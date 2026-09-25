import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { getInstallationContextWarning } from '../../lib/standards/standards-profile';

export const STANDARD_OVERCURRENT_RATINGS: number[] = [
  1, 2, 4, 6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800,
];

export interface FuseEstimateInputs {
  loadCurrentA: number;
  loadType: 'resistive' | 'motor-inductive' | 'capacitive-smps';
  isContinuousLoad: boolean; // >3 hours continuous: 125% rule
}

export function calculateFuseEstimate(inputs: FuseEstimateInputs): CalculationResult {
  const { loadCurrentA: Ib, loadType, isContinuousLoad } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const continuousMultiplier = isContinuousLoad ? 1.25 : 1.0;
  let inrushMultiplier = 1.0;
  let fuseTypeNote = 'Standard gG / General Purpose fast-acting';

  if (loadType === 'motor-inductive') {
    inrushMultiplier = 1.5; // allowance for DOL motor start without nuisance tripping
    fuseTypeNote = 'Time-delay / slow-blow / Motor rated (aM or Class J/RK5 time-delay)';
  } else if (loadType === 'capacitive-smps') {
    inrushMultiplier = 1.3;
    fuseTypeNote = 'High inrush withstand / slow-blow';
  }

  const effectiveMinCurrent = Ib * continuousMultiplier * inrushMultiplier;

  // Find standard fuse rating greater than or equal to effective current
  const recommendedFuseA = STANDARD_OVERCURRENT_RATINGS.find(r => r >= effectiveMinCurrent)
    || STANDARD_OVERCURRENT_RATINGS[STANDARD_OVERCURRENT_RATINGS.length - 1];

  steps.push({
    stepNumber: 1,
    title: 'Apply Continuous Load & Inrush Derating Multipliers',
    formula: 'I_fuse_min = I_load × k_continuous × k_inrush',
    substitution: `${Ib} A × ${continuousMultiplier.toFixed(2)} × ${inrushMultiplier.toFixed(2)}`,
    result: `Minimum design threshold: ${effectiveMinCurrent.toFixed(2)} A`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Select Standard Fuse Rating',
    formula: 'I_n ≥ I_fuse_min',
    substitution: `Nearest standard size above ${effectiveMinCurrent.toFixed(2)} A`,
    result: `Recommended Fuse: ${recommendedFuseA} A (${fuseTypeNote})`,
  });

  warnings.push(getInstallationContextWarning('Fuse Sizing', [
    'time-current characteristics curves (I²t pre-arcing and clearing energy)',
    'downstream conductor thermal withstand (k²S² ≥ I²t)',
    'minimum prospective short circuit current for rapid clearing within mandated disconnection time (e.g. 0.4s or 5s per IEC 60364-4-41)',
  ]));

  return {
    primaryValue: recommendedFuseA,
    formattedValue: `${recommendedFuseA} A`,
    unit: 'A',
    label: 'Recommended Fuse Rating (I_n)',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Preliminary recommendation based on standard nominal ratings and continuous load factors (NEC 210.20 / IEC 60269). Actual protection requires time-current curve coordination and let-through energy verification.',
    warnings,
    steps,
    additionalOutputs: {
      standardRating: { label: 'Standard Rating', value: `${recommendedFuseA} A` },
      loadCurrent: { label: 'Nominal Load Current (I_B)', value: `${Ib.toFixed(2)} A` },
      fuseType: { label: 'Recommended Characteristic', value: fuseTypeNote },
      continuousMargin: { label: 'Continuous Load Factor', value: `${(continuousMultiplier * 100).toFixed(0)}%` },
    },
  };
}

export interface OvercurrentCoordinationInputs {
  designCurrentA: number; // I_B
  deviceRatingA: number; // I_n
  conductorAmpacityA: number; // I_z
}

export function evaluateOvercurrentCoordination(inputs: OvercurrentCoordinationInputs): CalculationResult {
  const { designCurrentA: Ib, deviceRatingA: In, conductorAmpacityA: Iz } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // IEC 60364-4-43 fundamental rule: I_B <= I_n <= I_z
  const satisfiesLoadRule = In >= Ib;
  const satisfiesCableRule = In <= Iz;
  const isCoordinated = satisfiesLoadRule && satisfiesCableRule;

  steps.push({
    stepNumber: 1,
    title: 'Verify Load Adequacy Condition (I_B ≤ I_n)',
    formula: 'I_B ≤ I_n',
    substitution: `${Ib} A ${satisfiesLoadRule ? '≤' : '>'} ${In} A`,
    result: satisfiesLoadRule ? 'PASS: Device will not nuisance trip under normal operating load' : 'FAIL: Device will trip under continuous full load',
  });

  steps.push({
    stepNumber: 2,
    title: 'Verify Conductor Protection Condition (I_n ≤ I_z)',
    formula: 'I_n ≤ I_z',
    substitution: `${In} A ${satisfiesCableRule ? '≤' : '>'} ${Iz} A`,
    result: satisfiesCableRule ? 'PASS: Conductor is protected against continuous thermal overload' : 'FAIL: CABLE FIRE HAZARD: Conductor ampacity is less than protective breaker rating',
  });

  if (!satisfiesLoadRule) {
    warnings.push({
      severity: 'warning',
      title: 'Nuisance Tripping Risk (I_n < I_B)',
      message: `The protective device rating (${In} A) is less than the design load current (${Ib} A). The circuit will trip during regular continuous operation.`,
    });
  }

  if (!satisfiesCableRule) {
    warnings.push({
      severity: 'danger',
      title: 'CRITICAL HAZARD: Unprotected Conductor (I_n > I_z)',
      message: `The protective device rating (${In} A) exceeds the allowable current-carrying capacity of the cable (${Iz} A). Under sustained overload, the cable will overheat and ignite before the breaker trips. Upgrade conductor size or downsize the breaker immediately.`,
    });
  }

  return {
    primaryValue: isCoordinated ? 1 : 0,
    formattedValue: isCoordinated ? 'COORDINATED (PASS)' : 'NON-COMPLIANT (FAIL)',
    unit: '',
    label: 'Protection Coordination Status (I_B ≤ I_n ≤ I_z)',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'Fundamental thermal overload protection criterion according to IEC 60364-4-43 and NEC Article 240.4.',
    warnings,
    steps,
    additionalOutputs: {
      coordinationStatus: { label: 'Status', value: isCoordinated ? 'COMPLIANT' : 'VIOLATION' },
      loadCurrent: { label: 'Design Current (I_B)', value: `${Ib.toFixed(1)} A` },
      deviceRating: { label: 'Protective Device (I_n)', value: `${In.toFixed(1)} A` },
      cableAmpacity: { label: 'Cable Capacity (I_z)', value: `${Iz.toFixed(1)} A` },
      thermalMargin: { label: 'Cable Thermal Margin', value: `${(Iz - In).toFixed(1)} A reserve` },
    },
  };
}

export interface TransformerFaultCurrentInputs {
  transformerKva: number;
  secondaryVoltageLineV: number;
  percentImpedance: number; // %Z, e.g. 4.0% to 6.0%
}

export function calculateTransformerFaultCurrent(inputs: TransformerFaultCurrentInputs): CalculationResult {
  const { transformerKva, secondaryVoltageLineV: V_L, percentImpedance: pctZ } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeKva = Math.max(transformerKva, 1);
  const safeV = Math.max(V_L, 1);
  const safeZ = Math.max(pctZ, 0.1);

  // Full load secondary line current: I_FL = (S * 1000) / (sqrt(3) * V_L)
  const fullLoadCurrentA = (safeKva * 1000) / (Math.sqrt(3) * safeV);

  // Prospective symmetrical short-circuit current at transformer terminals:
  // I_sc = I_FL / (%Z / 100)
  const faultCurrentA = fullLoadCurrentA / (safeZ / 100);
  const faultCurrentKa = faultCurrentA / 1000;

  // Short-circuit apparent power MVA_sc = S_rated / (%Z / 100)
  const faultMva = (safeKva / 1000) / (safeZ / 100);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Full-Load Rated Secondary Current',
    formula: 'I_FL = S_rated / (√3 × V_L)',
    substitution: `(${safeKva} × 1000 VA) / (1.732 × ${safeV} V)`,
    result: `I_FL = ${fullLoadCurrentA.toFixed(1)} A`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Prospective Symmetrical Short-Circuit Current (Infinite Bus Source)',
    formula: 'I_sc = I_FL / (%Z / 100)',
    substitution: `${fullLoadCurrentA.toFixed(1)} A / (${safeZ}% / 100)`,
    result: `I_sc = ${faultCurrentKa.toFixed(2)} kA (${faultCurrentA.toFixed(0)} A rms)`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Short-Circuit Apparent Power Capacity (Fault Level)',
    formula: 'S_sc = S_rated / (%Z / 100)',
    substitution: `${(safeKva / 1000).toFixed(2)} MVA / (${safeZ} / 100)`,
    result: `S_sc = ${faultMva.toFixed(2)} MVA`,
  });

  warnings.push(getInstallationContextWarning('Transformer Fault Current', [
    'infinite bus primary supply assumption (upstream MV utility grid source impedance will slightly reduce fault level)',
    'switchgear breaking/interrupting capacity (kAIR / Icu must exceed calculated I_sc)',
    'peak asymmetrical dynamic force (peak make current Ip ≈ 2.2 × I_sc)',
    'arc flash boundary and incident energy cal/cm²',
  ]));

  return {
    primaryValue: faultCurrentKa,
    formattedValue: `${faultCurrentKa.toFixed(2)} kA`,
    unit: 'kA',
    label: 'Prospective Fault Current (I_sc)',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'Worst-case bolted 3-phase symmetrical short-circuit current at transformer secondary terminals assuming infinite upstream primary source impedance (IEC 60909 / IEEE 141).',
    warnings,
    steps,
    additionalOutputs: {
      faultCurrentKa: { label: 'Fault Current (kA rms)', value: `${faultCurrentKa.toFixed(2)} kA` },
      faultCurrentA: { label: 'Fault Current (Amperes)', value: `${faultCurrentA.toFixed(0)} A` },
      fullLoadCurrent: { label: 'Full-Load Current (I_FL)', value: `${fullLoadCurrentA.toFixed(1)} A` },
      faultPowerMva: { label: 'Short-Circuit Fault Level', value: `${faultMva.toFixed(2)} MVA` },
      switchgearRequirement: { label: 'Minimum Switchgear Rating', value: `≥ ${Math.ceil(faultCurrentKa * 1.1)} kA breaking capacity` },
    },
    visualData: {
      faultCurrentKa,
      faultCurrentA,
      fullLoadCurrentA,
      pctZ: safeZ,
      transformerKva: safeKva,
    },
  };
}

export interface McbRatingInputs {
  designCurrentA: number;
  cableAmpacityA: number;
  loadType?: 'resistive' | 'motor' | 'lighting' | 'high-inrush';
  isContinuous?: boolean;
}

export function calculateMcbRating(inputs: McbRatingInputs): CalculationResult {
  const { designCurrentA: Ib, cableAmpacityA: Iz, loadType = 'resistive', isContinuous = false } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // MCB standard ratings: 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125 A
  const mcbStandardRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

  const continuousFactor = isContinuous ? 1.25 : 1.0;
  const targetCurrent = Ib * continuousFactor;

  // Find standard rating In where Ib <= In <= Iz (or nearest valid)
  const candidateIn = mcbStandardRatings.find(r => r >= targetCurrent) || mcbStandardRatings[mcbStandardRatings.length - 1];

  // Trip curve selection
  let curveType = 'Type B';
  let magneticThreshold = '3 to 5 × In';
  let applicationDescription = 'Domestic / resistive heating / general lighting';

  if (loadType === 'motor' || loadType === 'lighting') {
    curveType = 'Type C';
    magneticThreshold = '5 to 10 × In';
    applicationDescription = 'Fluorescent / LED lighting arrays and small induction motors';
  }
  if (loadType === 'high-inrush' || loadType === 'motor') {
    curveType = 'Type D';
    magneticThreshold = '10 to 20 × In';
    applicationDescription = 'Heavy industrial motors, transformers, X-ray and weld loads';
  }

  steps.push({
    stepNumber: 1,
    title: 'Select Nominal Trip Rating (In) per Coordination Rule (Ib ≤ In ≤ Iz)',
    formula: 'I_n ≥ I_design × k_continuous',
    substitution: `${Ib} A × ${continuousFactor.toFixed(2)} = ${targetCurrent.toFixed(1)} A`,
    result: `Recommended Rating: ${candidateIn} A`,
  });

  steps.push({
    stepNumber: 2,
    title: `Assign Magnetic Instantaneous Trip Characteristic Curve (${curveType})`,
    formula: `Trip threshold: ${magneticThreshold}`,
    substitution: `Load profile: ${loadType}`,
    result: `${curveType} (${applicationDescription})`,
  });

  return {
    primaryValue: candidateIn,
    formattedValue: `${candidateIn} A (${curveType})`,
    unit: 'A',
    label: 'Recommended MCB Rating',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'IEC 60898-1 / EN 60898 miniature circuit breaker specification.',
    warnings,
    steps,
    additionalOutputs: {
      ratingAmperes: { label: 'Nominal Current (I_n)', value: `${candidateIn} A` },
      curveType: { label: 'Instantaneous Trip Curve', value: curveType },
      magneticTripBand: { label: 'Magnetic Trip Range', value: magneticThreshold },
      coordinationCheck: { label: 'Thermal Cable Coordination', value: candidateIn <= Iz ? 'PASS (In ≤ Iz)' : 'FAIL (In > Iz)' },
    },
    visualData: {
      candidateIn,
      curveType,
      Ib,
      Iz,
    },
  };
}

export interface PsccInputs {
  systemVoltageV: number;
  faultLoopImpedanceOhms: number;
}

export function calculateProspectiveShortCircuit(inputs: PsccInputs): CalculationResult {
  const { systemVoltageV: V, faultLoopImpedanceOhms: Zs } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeZs = Math.max(Zs, 0.001);
  const psccAmperes = V / safeZs;
  const psccKa = psccAmperes / 1000;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Prospective Fault / Short-Circuit Current (Ohm Law)',
    formula: 'I_pfc = U₀ / Z_s',
    substitution: `${V} V / ${safeZs.toFixed(3)} Ω`,
    result: `I_pfc = ${psccAmperes.toFixed(1)} A (${psccKa.toFixed(2)} kA)`,
  });

  return {
    primaryValue: psccAmperes,
    formattedValue: `${psccAmperes.toFixed(0)} A (${psccKa.toFixed(2)} kA)`,
    unit: 'A',
    label: 'Prospective Fault Current (I_pfc)',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'IEC 60364-4-41 earth fault loop prospective short circuit current.',
    warnings,
    steps,
    additionalOutputs: {
      faultAmperes: { label: 'Fault Current', value: `${psccAmperes.toFixed(0)} A` },
      faultKiloAmperes: { label: 'Fault Level (kA)', value: `${psccKa.toFixed(2)} kA` },
      loopImpedance: { label: 'Loop Impedance (Zs)', value: `${safeZs.toFixed(3)} Ω` },
    },
    visualData: {
      psccAmperes,
      psccKa,
      V,
      Zs: safeZs,
    },
  };
}

export interface RcdSensitivityInputs {
  applicationType: 'socket-outlets' | 'bathroom' | 'fire-protection' | 'sub-distribution';
}

export function calculateRcdSensitivity(inputs: RcdSensitivityInputs): CalculationResult {
  const { applicationType } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let sensitivityMa = 30;
  let reason = 'Mandatory personal protection against direct/indirect electric shock';
  let maxDisconnectionTime = '≤ 0.4 seconds (230V TN)';

  if (applicationType === 'fire-protection') {
    sensitivityMa = 300;
    reason = 'Fire mitigation against tracking arc currents in dusty/timber locations';
    maxDisconnectionTime = '≤ 1.0 second';
  } else if (applicationType === 'sub-distribution') {
    sensitivityMa = 100;
    reason = 'Selective time-delayed upstream protection (Type S)';
    maxDisconnectionTime = '≤ 0.5 seconds';
  }

  steps.push({
    stepNumber: 1,
    title: `Identify Mandated Residual Operating Current (I_Δn) per IEC 60364-4-41`,
    formula: 'I_Δn mandated by location category',
    substitution: `Application: ${applicationType}`,
    result: `Rated Residual Current = ${sensitivityMa} mA (${reason})`,
  });

  return {
    primaryValue: sensitivityMa,
    formattedValue: `${sensitivityMa} mA`,
    unit: 'mA',
    label: 'RCD Sensitivity (I_Δn)',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'IEC 60364-4-41 / BS 7671 Table 41.1 requirements for fault protection.',
    warnings,
    steps,
    additionalOutputs: {
      residualCurrentMa: { label: 'Trip Threshold (I_Δn)', value: `${sensitivityMa} mA` },
      maxDisconnectionTime: { label: 'Max Clearing Time', value: maxDisconnectionTime },
      applicationNotes: { label: 'Protection Purpose', value: reason },
    },
    visualData: {
      sensitivityMa,
      applicationType,
    },
  };
}
