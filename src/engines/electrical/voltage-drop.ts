import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { getInstallationContextWarning } from '../../lib/standards/standards-profile';

export interface VoltageDropInputs {
  circuitType: 'dc' | 'ac-single-phase' | 'three-phase';
  nominalVoltageV?: number;
  systemVoltageV?: number;
  loadCurrentA: number;
  oneWayDistanceMeters?: number;
  oneWayLengthMeters?: number;
  conductorMaterial?: 'copper' | 'aluminium';
  conductorAreaMm2?: number;
  conductorResistanceOhmPerKm?: number; // R in Ω/km
  conductorReactanceOhmPerKm?: number; // X in Ω/km (for AC)
  powerFactor?: number; // 0.0 to 1.0 (for AC)
  operatingTemperatureC?: number;
  maxAllowedDropPercent?: number; // default 3% or 5%
}

export interface VoltageDropCurvePoint {
  distanceM: number;
  distanceMeters?: number;
  dropV: number;
  voltageDropV?: number;
  dropPercent: number;
  receivingVoltageV?: number;
}

export function generateVoltageDropCurve(
  inputs: VoltageDropInputs,
  maxDistanceM?: number,
  stepM?: number
): VoltageDropCurvePoint[] {
  const points: VoltageDropCurvePoint[] = [];
  const maxDist = maxDistanceM !== undefined
    ? maxDistanceM
    : (inputs.oneWayLengthMeters ?? inputs.oneWayDistanceMeters ?? 100);

  const stepsCount = 10;
  const step = stepM !== undefined ? stepM : (maxDist / stepsCount);

  for (let i = 0; i <= stepsCount; i++) {
    const d = Math.round(i * step * 10) / 10;
    const res = calculateVoltageDrop({
      ...inputs,
      oneWayLengthMeters: d,
      oneWayDistanceMeters: d,
    });
    const dropV = res.primaryValue;
    const dropPercent = res.visualData?.dropPercent || 0;
    const vNom = inputs.nominalVoltageV ?? inputs.systemVoltageV ?? 400;
    points.push({
      distanceM: d,
      distanceMeters: d,
      dropV,
      voltageDropV: dropV,
      dropPercent,
      receivingVoltageV: vNom - dropV,
    });
  }
  return points;
}

export function calculateVoltageDrop(inputs: VoltageDropInputs): CalculationResult {
  const {
    circuitType,
    loadCurrentA: I,
    conductorMaterial = 'copper',
    conductorAreaMm2,
    conductorReactanceOhmPerKm: X_km = 0.08,
    powerFactor = 0.9,
    operatingTemperatureC = 50,
    maxAllowedDropPercent = 3.0,
  } = inputs;

  const Vnom = inputs.nominalVoltageV ?? inputs.systemVoltageV ?? 400;
  const L_m = inputs.oneWayDistanceMeters ?? inputs.oneWayLengthMeters ?? 50;

  // Calculate R_km if conductorAreaMm2 is supplied
  let R_km: number;
  if (conductorAreaMm2 && conductorAreaMm2 > 0) {
    const rho20 = conductorMaterial === 'copper' ? 1.724e-8 : 2.826e-8;
    const alpha = conductorMaterial === 'copper' ? 0.00393 : 0.00403;
    const tempFactor = 1 + alpha * (operatingTemperatureC - 20);
    const rPerMeter = (rho20 / (conductorAreaMm2 * 1e-6)) * tempFactor;
    R_km = rPerMeter * 1000;
  } else {
    R_km = inputs.conductorResistanceOhmPerKm ?? 3.08;
  }

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const L_km = L_m / 1000;
  const R_total_one_way = R_km * L_km;
  const pf = Math.min(Math.max(powerFactor, 0.1), 1.0);
  const sinPhi = Math.sin(Math.acos(pf));

  let vDrop = 0;
  let multiplier = 1;
  let formulaStr = '';
  let subStr = '';

  if (circuitType === 'dc') {
    // 2-wire DC circuit: Loop resistance = 2 * R_one_way
    multiplier = 2;
    vDrop = 2 * I * R_total_one_way;
    formulaStr = 'V_drop = 2 × I × (R / km × L_km)';
    subStr = `2 × ${I} A × (${R_km} Ω/km × ${L_km.toFixed(3)} km)`;
  } else if (circuitType === 'ac-single-phase') {
    // 2-wire single phase AC: V_drop = 2 * I * L * (R*cosPhi + X*sinPhi)
    multiplier = 2;
    const zEffective = R_km * pf + X_km * sinPhi;
    vDrop = 2 * I * L_km * zEffective;
    formulaStr = 'V_drop = 2 × I × L × (R × cos φ + X × sin φ)';
    subStr = `2 × ${I} A × ${L_km.toFixed(3)} km × (${R_km} × ${pf.toFixed(2)} + ${X_km} × ${sinPhi.toFixed(2)})`;
  } else {
    // 3-Phase balanced line-to-line: V_drop = sqrt(3) * I * L * (R*cosPhi + X*sinPhi)
    multiplier = Math.sqrt(3);
    const zEffective = R_km * pf + X_km * sinPhi;
    vDrop = Math.sqrt(3) * I * L_km * zEffective;
    formulaStr = 'V_drop = √3 × I × L × (R × cos φ + X × sin φ)';
    subStr = `1.73205 × ${I} A × ${L_km.toFixed(3)} km × (${R_km} × ${pf.toFixed(2)} + ${X_km} × ${sinPhi.toFixed(2)})`;
  }

  const vDropPercent = (vDrop / Vnom) * 100;
  const vReceiving = Math.max(Vnom - vDrop, 0);

  // Total conductor power loss = multiplier * I^2 * R_one_way (2*I^2*R for 2-wire, 3*I^2*R for 3-wire)
  const conductorLossWatts = circuitType === 'three-phase'
    ? 3 * I * I * R_total_one_way
    : 2 * I * I * R_total_one_way;

  steps.push({
    stepNumber: 1,
    title: `Calculate Conductor Voltage Drop (${circuitType.toUpperCase()})`,
    formula: formulaStr,
    substitution: subStr,
    result: `V_drop = ${vDrop.toFixed(2)} V`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Voltage Drop Percentage & Receiving End Voltage',
    formula: '%Drop = (V_drop / V_nominal) × 100%;   V_load = V_nominal - V_drop',
    substitution: `(${vDrop.toFixed(2)} V / ${Vnom} V) × 100%`,
    result: `${vDropPercent.toFixed(2)}% drop (Receiving: ${vReceiving.toFixed(1)} V)`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Conductor Total Joule Heating Dissipation',
    formula: circuitType === 'three-phase' ? 'P_loss = 3 × I² × R_wire' : 'P_loss = 2 × I² × R_wire',
    substitution: `${circuitType === 'three-phase' ? '3' : '2'} × (${I} A)² × ${R_total_one_way.toFixed(4)} Ω`,
    result: `${formatQuantity(conductorLossWatts, 'power')} total conductor heat waste`,
  });

  if (vDropPercent > maxAllowedDropPercent) {
    warnings.push({
      severity: 'danger',
      title: `Excessive Voltage Drop (${vDropPercent.toFixed(1)}% > ${maxAllowedDropPercent}%)`,
      message: `The calculated voltage drop of ${vDropPercent.toFixed(2)}% exceeds the specified engineering limit of ${maxAllowedDropPercent}%. This risks equipment malfunction, motor overheating, brownout tripping, and excessive conductor heat. Select a larger conductor cross-sectional area.`,
    });
  }

  warnings.push(getInstallationContextWarning('Voltage Drop Calculation', [
    'elevated conductor operating temperatures (70°C/90°C resistance increase)',
    'conduit magnetic reactance (steel vs PVC)',
    'harmonics and skin/proximity effects',
    'starting inrush currents for motors',
  ]));

  return {
    primaryValue: vDrop,
    formattedValue: `${vDrop.toFixed(2)} V`,
    unit: 'V',
    label: 'Voltage Drop (ΔV)',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'Simplified resistance/reactance approximation based on IEC 60364-5-52 and NEC Article 210.19 Informational Note. Real installations must account for temperature correction, conduit reactance, and motor inrush.',
    warnings,
    steps,
    additionalOutputs: {
      dropPercent: { label: 'Percentage Voltage Drop', value: `${vDropPercent.toFixed(2)}%`, note: `Limit: ≤${maxAllowedDropPercent}%` },
      receivingVoltage: { label: 'Receiving End Voltage (V_load)', value: `${vReceiving.toFixed(1)} V` },
      terminalVoltage: { label: 'Receiving End Voltage (V_load)', value: `${vReceiving.toFixed(1)} V` },
      conductorLoss: { label: 'Conductor I²R Power Loss', value: formatQuantity(conductorLossWatts, 'power') },
      powerLossWatts: { label: 'Conductor I²R Power Loss', value: formatQuantity(conductorLossWatts, 'power') },
      oneWayResistance: { label: 'One-Way Conductor Resistance', value: `${R_total_one_way.toFixed(3)} Ω` },
      maxDistance3Percent: {
        label: 'Max Feeder Distance for 3% Drop',
        value: `${(R_km > 0 && I > 0 ? (0.03 * Vnom * 1000) / (multiplier * I * (R_km * pf + X_km * sinPhi)) : 0).toFixed(1)} m`,
      },
      distanceNote: { label: 'One-Way Feeder Distance', value: `${L_m} meters (${(L_m * 3.28084).toFixed(0)} ft)` },
    },
    visualData: {
      nominalVoltage: Vnom,
      voltageDrop: vDrop,
      dropPercent: vDropPercent,
      receivingVoltage: vReceiving,
      distanceMeters: L_m,
      circuitType,
    },
  };
}
