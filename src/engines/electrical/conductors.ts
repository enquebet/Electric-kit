import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import {
  CONDUCTOR_MATERIALS,
  IEC_STANDARD_METRIC_AREAS_MM2,
  AWG_STANDARD_SIZES,
  getInstallationContextWarning,
} from '../../lib/standards/standards-profile';

export interface ConductorResistanceInputs {
  material: 'copper' | 'aluminium';
  lengthMeters: number;
  areaMm2: number;
  temperatureC?: number; // default 20°C
}

export function calculateConductorResistance(inputs: ConductorResistanceInputs): CalculationResult {
  const { material, lengthMeters: L, areaMm2: A, temperatureC = 20 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const matData = CONDUCTOR_MATERIALS[material];
  const areaM2 = A * 1e-6;

  // Base resistance at 20°C: R20 = rho20 * L / A
  const r20 = (matData.resistivity20C * L) / Math.max(areaM2, 1e-12);

  // Temperature correction: RT = R20 * [1 + alpha * (T - 20)]
  const tempFactor = 1 + matData.tempCoefficient20C * (temperatureC - 20);
  const rT = r20 * Math.max(tempFactor, 0.01);

  steps.push({
    stepNumber: 1,
    title: `Calculate DC Conductor Resistance at 20°C (ρ = ${matData.resistivity20C.toExponential(4)} Ω·m)`,
    formula: 'R₂₀ = ρ₂₀ × L / A',
    substitution: `(${matData.resistivity20C.toExponential(3)} Ω·m × ${L} m) / (${A} × 10⁻⁶ m²)`,
    result: `R₂₀ = ${r20.toFixed(4)} Ω (${(r20 / (L / 1000)).toFixed(3)} Ω/km)`,
  });

  if (temperatureC !== 20) {
    steps.push({
      stepNumber: 2,
      title: `Apply Conductor Temperature Correction to ${temperatureC}°C`,
      formula: 'R_T = R₂₀ × [1 + α × (T - 20°C)]',
      substitution: `${r20.toFixed(4)} Ω × [1 + ${matData.tempCoefficient20C} × (${temperatureC} - 20)]`,
      result: `R_${temperatureC}°C = ${rT.toFixed(4)} Ω`,
    });
  }

  return {
    primaryValue: rT,
    formattedValue: `${rT.toFixed(4)} Ω`,
    unit: 'Ω',
    label: `Conductor Resistance (${temperatureC}°C)`,
    classification: 'THEORETICAL',
    standardsContext: 'Pure DC resistance calculation per Ohm-meter law. Does not include AC skin effect (negligible under 16 mm² at 50/60 Hz) or proximity effects.',
    warnings,
    steps,
    additionalOutputs: {
      resistancePerKm: { label: 'Resistance per km', value: `${((rT / L) * 1000).toFixed(3)} Ω/km` },
      materialName: { label: 'Conductor Material', value: matData.name },
      nominalArea: { label: 'Cross-Sectional Area', value: `${A} mm²` },
      tempRiseFactor: { label: 'Thermal Resistance Multiplier', value: `×${tempFactor.toFixed(3)}` },
    },
    visualData: {
      r20,
      rT,
      temperatureC,
      A,
      L,
      material,
    },
  };
}

export interface CableEstimatorInputs {
  circuitType: 'dc' | 'ac-single-phase' | 'three-phase';
  systemVoltageV: number;
  loadCurrentA: number;
  oneWayLengthM: number;
  material: 'copper' | 'aluminium';
  maxAllowedVoltageDropPercent: number; // e.g. 3%
  operatingTempC?: number; // e.g. 75°C
  powerFactor?: number;
}

export function calculatePreliminaryCableSize(inputs: CableEstimatorInputs): CalculationResult {
  const {
    circuitType,
    systemVoltageV: Vnom,
    loadCurrentA: I,
    oneWayLengthM: L,
    material,
    maxAllowedVoltageDropPercent,
    operatingTempC = 70,
    powerFactor = 0.9,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const matData = CONDUCTOR_MATERIALS[material];
  // Temperature adjusted resistivity: rho_T = rho_20 * (1 + alpha * (T - 20))
  const rho_T = matData.resistivity20C * (1 + matData.tempCoefficient20C * (operatingTempC - 20));

  // Max allowable drop in Volts
  const maxDropV = (maxAllowedVoltageDropPercent / 100) * Vnom;

  // Multiplier for loop distance: 2 for 1-phase/DC, sqrt(3) for 3-phase
  const lengthMultiplier = circuitType === 'three-phase' ? Math.sqrt(3) : 2.0;

  // Minimum required cross-sectional area based purely on voltage drop limit:
  // deltaV = k * I * (rho_T * L / A) * cosPhi => A_vdrop = (k * rho_T * L * I * cosPhi) / deltaV
  const pf = circuitType === 'dc' ? 1.0 : Math.min(Math.max(powerFactor, 0.1), 1.0);
  const minAreaVdropM2 = (lengthMultiplier * rho_T * L * I * pf) / Math.max(maxDropV, 0.1);
  const minAreaVdropMm2 = minAreaVdropM2 * 1e6;

  // Approximate thermal benchmark density (educational estimate: ~4-6 A/mm² for small, 2-3 A/mm² for large)
  // Simple preliminary heuristic baseline:
  const baselineCurrentDensityAmpsPerMm2 = material === 'copper' ? 4.0 : 2.5;
  const minAreaThermalMm2 = I / baselineCurrentDensityAmpsPerMm2;

  const governingAreaMm2 = Math.max(minAreaVdropMm2, minAreaThermalMm2);

  // Match to standard IEC sizes
  const recommendedStandardMetric = IEC_STANDARD_METRIC_AREAS_MM2.find(size => size >= governingAreaMm2)
    || IEC_STANDARD_METRIC_AREAS_MM2[IEC_STANDARD_METRIC_AREAS_MM2.length - 1];

  // Match to standard AWG sizes
  const recommendedAwg = AWG_STANDARD_SIZES.slice().reverse().find(entry => entry.areaMm2 >= governingAreaMm2)
    || AWG_STANDARD_SIZES[AWG_STANDARD_SIZES.length - 1];

  // Calculate actual drop with recommended metric size
  const actualResistanceOneWay = (rho_T * L) / (recommendedStandardMetric * 1e-6);
  const actualDropV = lengthMultiplier * I * actualResistanceOneWay * pf;
  const actualDropPercent = (actualDropV / Vnom) * 100;
  const actualConductorLossW = (circuitType === 'three-phase' ? 3 : 2) * I * I * actualResistanceOneWay;

  steps.push({
    stepNumber: 1,
    title: `Calculate Allowable Maximum Voltage Drop (${maxAllowedVoltageDropPercent}% of ${Vnom} V)`,
    formula: 'ΔV_max = (Allowed% / 100) × V_nominal',
    substitution: `(${maxAllowedVoltageDropPercent} / 100) × ${Vnom} V`,
    result: `ΔV_max = ${maxDropV.toFixed(2)} V limit`,
  });

  steps.push({
    stepNumber: 2,
    title: `Calculate Minimum Cross-Sectional Area by Voltage Drop (Operating Temp ${operatingTempC}°C)`,
    formula: circuitType === 'three-phase' ? 'A_min = (√3 × ρ_T × L × I × cos φ) / ΔV_max' : 'A_min = (2 × ρ_T × L × I × cos φ) / ΔV_max',
    substitution: `(${lengthMultiplier.toFixed(3)} × ${(rho_T * 1e6).toFixed(4)} Ω·mm²/m × ${L} m × ${I} A × ${pf.toFixed(2)}) / ${maxDropV.toFixed(2)} V`,
    result: `A_min(voltage drop) = ${minAreaVdropMm2.toFixed(2)} mm²`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Select Nearest Higher Commercial Standard Conductor Size',
    formula: 'A_standard ≥ max(A_vdrop, A_thermal)',
    substitution: `Governing: ${governingAreaMm2.toFixed(2)} mm²`,
    result: `Recommended IEC: ${recommendedStandardMetric} mm²  |  Recommended NEC: ${recommendedAwg.awg}`,
  });

  warnings.push(getInstallationContextWarning('Conductor Sizing Estimate', [
    'installation method (tray, conduit, direct buried per IEC 60364-5-52 Table B.52 / NEC Table 310.16)',
    'ambient temperature derating and thermal grouping factors',
    'terminal temperature ratings (60°C / 75°C / 90°C)',
    'adiabatic short-circuit withstand rating (k²S² ≥ I²t)',
    'fault loop earth fault loop impedance (Zs) for breaker disconnection time',
  ]));

  return {
    primaryValue: recommendedStandardMetric,
    formattedValue: `${recommendedStandardMetric} mm² (${recommendedAwg.awg})`,
    unit: 'mm²',
    label: 'Recommended Conductor Size',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Preliminary mathematical sizing based on permissible voltage drop and thermal current density. Must NOT be used for final electrical installation without licensed engineer review and installation method derating.',
    warnings,
    steps,
    additionalOutputs: {
      governingCriterion: { label: 'Governing Limit', value: minAreaVdropMm2 > minAreaThermalMm2 ? 'Voltage Drop Dominated' : 'Thermal Ampacity Dominated' },
      actualVoltageDrop: { label: 'Actual Expected Drop', value: `${actualDropV.toFixed(2)} V (${actualDropPercent.toFixed(2)}%)` },
      conductorLoss: { label: 'Total Cable Power Loss', value: formatQuantity(actualConductorLossW, 'power') },
      minimumTheoreticalArea: { label: 'Exact Mathematical Minimum', value: `${governingAreaMm2.toFixed(2)} mm²` },
      iecSize: { label: 'IEC Standard Metric', value: `${recommendedStandardMetric} mm²` },
      awgSize: { label: 'North American AWG Reference', value: `${recommendedAwg.awg} (${recommendedAwg.areaMm2} mm²)` },
    },
    visualData: {
      governingAreaMm2,
      minAreaVdropMm2,
      minAreaThermalMm2,
      recommendedStandardMetric,
      recommendedAwg: recommendedAwg.awg,
      actualDropPercent,
      actualConductorLossW,
    },
  };
}

export function compareCableSizes(inputs: {
  circuitType: 'dc' | 'ac-single-phase' | 'three-phase';
  systemVoltageV: number;
  loadCurrentA: number;
  oneWayLengthM: number;
  operatingHoursPerYear: number;
  tariffPerKwh: number;
  sizesMm2?: number[];
}) {
  const {
    circuitType,
    systemVoltageV,
    loadCurrentA: I,
    oneWayLengthM: L,
    operatingHoursPerYear = 3000,
    tariffPerKwh = 0.15,
    sizesMm2 = [1.5, 2.5, 4.0, 6.0, 10.0, 16.0],
  } = inputs;

  const rho = 1.724e-8 * (1 + 0.00393 * (50 - 20)); // Cu at 50°C
  const mult = circuitType === 'three-phase' ? Math.sqrt(3) : 2.0;
  const wireMult = circuitType === 'three-phase' ? 3 : 2;

  return sizesMm2.map(area => {
    const R_one_way = (rho * L) / (area * 1e-6);
    const dropV = mult * I * R_one_way;
    const dropPct = (dropV / systemVoltageV) * 100;
    const lossWatts = wireMult * I * I * R_one_way;
    const annualKwhLoss = (lossWatts * operatingHoursPerYear) / 1000;
    const annualCostLoss = annualKwhLoss * tariffPerKwh;

    return {
      areaMm2: area,
      resistanceOhm: R_one_way,
      voltageDropV: dropV,
      voltageDropPct: dropPct,
      lossWatts,
      annualKwhLoss,
      annualCostLoss,
    };
  });
}

export interface CableAmpacityInputs {
  standard?: 'IEC' | 'NEC';
  conductorMaterial: 'copper' | 'aluminium';
  insulationType: 'PVC' | 'XLPE';
  nominalCrossSectionMm2: number;
  installationMethod?: string; // 'A1', 'A2', 'B1', 'B2', 'C', 'D'
  ambientTemperatureC?: number;
  numberOfLoadedCircuits?: number;
}

export function calculateCableAmpacity(inputs: CableAmpacityInputs): CalculationResult {
  const {
    standard = 'IEC',
    conductorMaterial,
    insulationType,
    nominalCrossSectionMm2: area,
    installationMethod = 'B2',
    ambientTemperatureC = 30,
    numberOfLoadedCircuits = 1,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // IEC 60364-5-52 Table A.52.3 simplified baseline table (Method B2, 3 loaded conductors, 30°C)
  const baseTableCuPvcB2: Record<number, number> = {
    1.5: 14.5,
    2.5: 19.5,
    4.0: 26.0,
    6.0: 34.0,
    10.0: 46.0,
    16.0: 61.0,
    25.0: 80.0,
    35.0: 99.0,
    50.0: 119.0,
    70.0: 151.0,
    95.0: 182.0,
    120.0: 210.0,
  };

  // Approximate baseline lookup or area interpolation
  let baseAmpacity = baseTableCuPvcB2[area];
  if (!baseAmpacity) {
    // Continuous approximation: I ~ k * Area^0.625
    baseAmpacity = 11.5 * Math.pow(area, 0.62);
  }

  // Material factor: Aluminium has ~0.78 current carrying capacity of copper
  if (conductorMaterial === 'aluminium') {
    baseAmpacity *= 0.78;
  }

  // Insulation factor: XLPE runs at 90°C compared to 70°C for PVC (+ ~20% ampacity)
  if (insulationType === 'XLPE') {
    baseAmpacity *= 1.22;
  }

  // Temperature derating factor (Ca)
  const maxOperatingTemp = insulationType === 'XLPE' ? 90 : 70;
  let tempDerating = 1.0;
  if (ambientTemperatureC >= maxOperatingTemp) {
    tempDerating = 0.05;
    warnings.push({
      code: 'HIGH_TEMP',
      title: 'Ambient Temperature Exceeds Rating',
      message: `Ambient temperature (${ambientTemperatureC}°C) is near or exceeds cable insulation rating (${maxOperatingTemp}°C).`,
      severity: 'danger',
    });
  } else if (ambientTemperatureC !== 30) {
    tempDerating = Math.sqrt(Math.max(0.01, (maxOperatingTemp - ambientTemperatureC) / (maxOperatingTemp - 30)));
  }

  // Grouping derating factor (Cg)
  let groupingDerating = 1.0;
  if (numberOfLoadedCircuits > 1) {
    if (numberOfLoadedCircuits === 2) groupingDerating = 0.80;
    else if (numberOfLoadedCircuits === 3) groupingDerating = 0.70;
    else if (numberOfLoadedCircuits === 4) groupingDerating = 0.65;
    else if (numberOfLoadedCircuits <= 6) groupingDerating = 0.60;
    else groupingDerating = 0.50;
  }

  const deratedAmpacity = baseAmpacity * tempDerating * groupingDerating;

  steps.push({
    stepNumber: 1,
    title: `Determine Reference Base Ampacity (I_ref) per ${standard} Standards`,
    formula: 'I_ref from Standard Tables (Method B2, 30°C)',
    substitution: `${area} mm² ${conductorMaterial.toUpperCase()} with ${insulationType} insulation`,
    result: `I_ref = ${baseAmpacity.toFixed(1)} A`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Thermal Correction & Grouping Derating Factors',
    formula: 'C_a = √[(T_max - T_amb) / (T_max - 30°C)] | C_g from grouping table',
    substitution: `C_a = ${tempDerating.toFixed(3)} (at ${ambientTemperatureC}°C), C_g = ${groupingDerating.toFixed(3)} (${numberOfLoadedCircuits} circuits)`,
    result: `Combined Derating = ${(tempDerating * groupingDerating).toFixed(3)}`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Derated Continuous Conductor Ampacity (I_z)',
    formula: 'I_z = I_ref × C_a × C_g',
    substitution: `${baseAmpacity.toFixed(1)} A × ${tempDerating.toFixed(3)} × ${groupingDerating.toFixed(3)}`,
    result: `I_z = ${deratedAmpacity.toFixed(1)} A`,
  });

  return {
    primaryValue: deratedAmpacity,
    formattedValue: `${deratedAmpacity.toFixed(1)} A`,
    unit: 'A',
    label: 'Derated Cable Ampacity (I_z)',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: `${standard} 60364-5-52 Table A.52 / NEC 310.16 conductor current capacity derating.`,
    warnings,
    steps,
    additionalOutputs: {
      baseAmpacity: { label: 'Nominal Base Ampacity (I_ref)', value: `${baseAmpacity.toFixed(1)} A` },
      tempDeratingFactor: { label: 'Temperature Factor (C_a)', value: tempDerating.toFixed(3) },
      groupingFactor: { label: 'Grouping Factor (C_g)', value: groupingDerating.toFixed(3) },
      effectiveDeratingRatio: { label: 'Combined Derating Ratio', value: `${((tempDerating * groupingDerating) * 100).toFixed(1)}%` },
    },
    visualData: {
      deratedAmpacity,
      baseAmpacity,
      tempDerating,
      groupingDerating,
      area,
    },
  };
}

export interface CableShortCircuitInputs {
  conductorMaterial: 'copper' | 'aluminium';
  insulationType: 'PVC' | 'XLPE';
  crossSectionMm2: number;
  faultDurationSeconds: number;
}

export function calculateCableShortCircuitWithstand(inputs: CableShortCircuitInputs): CalculationResult {
  const { conductorMaterial, insulationType, crossSectionMm2: S, faultDurationSeconds: t } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Adiabatic constant k per IEC 60364-5-54 Table A.54
  let k = 115; // default Cu/PVC
  if (conductorMaterial === 'copper') {
    k = insulationType === 'XLPE' ? 143 : 115;
  } else {
    k = insulationType === 'XLPE' ? 94 : 76;
  }

  // Maximum fault current I_sc = (k * S) / sqrt(t)
  const maxFaultCurrentA = (k * S) / Math.sqrt(Math.max(t, 0.001));

  steps.push({
    stepNumber: 1,
    title: 'Lookup Adiabatic Conductor Material Factor (k)',
    formula: 'k from IEC 60364-5-54 / BS 7671 standards',
    substitution: `${conductorMaterial.toUpperCase()} with ${insulationType} insulation`,
    result: `k = ${k} A·s^0.5 / mm²`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Thermal Short-Circuit Withstand Current (Adiabatic Equation)',
    formula: 'I_sc = (k × S) / √t',
    substitution: `(${k} × ${S} mm²) / √(${t} s)`,
    result: `I_withstand = ${maxFaultCurrentA.toFixed(0)} A (${(maxFaultCurrentA / 1000).toFixed(2)} kA)`,
  });

  return {
    primaryValue: maxFaultCurrentA,
    formattedValue: `${(maxFaultCurrentA / 1000).toFixed(2)} kA`,
    unit: 'kA',
    label: 'Adiabatic Short-Circuit Withstand',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'IEC 60364-5-54 / IEEE Std 242 adiabatic thermal withstand rating of insulated conductors.',
    warnings,
    steps,
    additionalOutputs: {
      withstandCurrentAmperes: { label: 'Fault Withstand Current', value: `${maxFaultCurrentA.toFixed(0)} A` },
      materialKFactor: { label: 'Adiabatic Constant (k)', value: `${k} A·s^0.5/mm²` },
      faultDuration: { label: 'Clearance Time (t)', value: `${(t * 1000).toFixed(0)} ms` },
      letThroughEnergy: { label: 'Thermal Capacity (k²S²)', value: `${((k * S) * (k * S)).toExponential(3)} A²·s` },
    },
    visualData: {
      maxFaultCurrentA,
      k,
      S,
      t,
    },
  };
}
