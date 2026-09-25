import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface JouleHeatingInputs {
  currentA?: number;
  voltageV?: number;
  resistanceOhms?: number;
  durationSeconds: number;
}

export function calculateJouleHeating(inputs: JouleHeatingInputs): CalculationResult {
  const { currentA: I, voltageV: V, resistanceOhms: R, durationSeconds: t } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let powerWatts = 0;
  if (I !== undefined && R !== undefined) {
    powerWatts = I * I * R;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Thermal Power Dissipation (Joule Law)',
      formula: 'P = I² × R',
      substitution: `(${I} A)² × ${R} Ω`,
      result: `P = ${formatQuantity(powerWatts, 'power')}`,
    });
  } else if (V !== undefined && R !== undefined && R > 0) {
    powerWatts = (V * V) / R;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Thermal Power Dissipation',
      formula: 'P = V² / R',
      substitution: `(${V} V)² / ${R} Ω`,
      result: `P = ${formatQuantity(powerWatts, 'power')}`,
    });
  } else if (V !== undefined && I !== undefined) {
    powerWatts = V * I;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Thermal Power Dissipation',
      formula: 'P = V × I',
      substitution: `${V} V × ${I} A`,
      result: `P = ${formatQuantity(powerWatts, 'power')}`,
    });
  } else {
    powerWatts = 1000;
  }

  // Energy Q = P * t in Joules
  const energyJoules = powerWatts * t;
  const energyWh = energyJoules / 3600;
  const energyKwh = energyWh / 1000;
  const energyBtu = energyKwh * 3412.142;
  const energyKcal = energyJoules / 4184;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Total Heat Released Over Time (Q = P × t)',
    formula: 'Q = P × t',
    substitution: `${formatQuantity(powerWatts, 'power')} × ${t} seconds`,
    result: `Q = ${formatQuantity(energyJoules, 'energy')} (${energyBtu.toFixed(1)} BTU / ${energyKcal.toFixed(1)} kcal)`,
  });

  return {
    primaryValue: energyJoules,
    formattedValue: formatQuantity(energyJoules, 'energy'),
    unit: 'J',
    label: 'Thermal Heat Energy Released (Q)',
    classification: 'THEORETICAL',
    standardsContext: 'Pure thermodynamic Joule conversion (100% electrical-to-thermal conversion in pure resistive conductors per first law of thermodynamics).',
    warnings,
    steps,
    additionalOutputs: {
      heatPower: { label: 'Thermal Dissipation Power', value: formatQuantity(powerWatts, 'power') },
      joules: { label: 'Energy in Joules', value: formatQuantity(energyJoules, 'energy') },
      kilowattHours: { label: 'Energy in kWh', value: `${energyKwh.toFixed(4)} kWh` },
      btu: { label: 'British Thermal Units (BTU)', value: `${energyBtu.toFixed(1)} BTU` },
      kilocalories: { label: 'Metric Kilocalories', value: `${energyKcal.toFixed(1)} kcal` },
    },
    visualData: {
      powerWatts,
      energyJoules,
      energyKwh,
      energyBtu,
      durationSeconds: t,
    },
  };
}

export interface ResistiveHeaterCostInputs {
  powerRatingWatts: number;
  operatingHoursPerDay: number;
  daysPerMonth?: number;
  tariffPerKwh: number;
}

export function calculateHeaterEnergyCost(inputs: ResistiveHeaterCostInputs): CalculationResult {
  const { powerRatingWatts, operatingHoursPerDay, daysPerMonth = 30, tariffPerKwh } = inputs;
  const steps: CalculationStep[] = [];
  const warnings: EngineeringWarning[] = [];

  const dailyKwh = (powerRatingWatts * operatingHoursPerDay) / 1000;
  const monthlyKwh = dailyKwh * daysPerMonth;
  const monthlyCost = monthlyKwh * tariffPerKwh;
  const monthlyBtu = monthlyKwh * 3412.142;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Monthly Electric Heating Consumption',
    formula: 'E_month = (P × Hours/Day × Days) / 1000',
    substitution: `(${powerRatingWatts} W × ${operatingHoursPerDay} h × ${daysPerMonth}) / 1000`,
    result: `${monthlyKwh.toFixed(1)} kWh/month (${(monthlyBtu / 1e6).toFixed(2)} MMBTU)`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Monthly Heating Bill',
    formula: 'Cost = E_month × Tariff Rate',
    substitution: `${monthlyKwh.toFixed(1)} kWh × $${tariffPerKwh.toFixed(3)}/kWh`,
    result: `$${monthlyCost.toFixed(2)}/month`,
  });

  return {
    primaryValue: monthlyCost,
    formattedValue: `$${monthlyCost.toFixed(2)}/month`,
    unit: '$/mo',
    label: 'Estimated Heating Operating Cost',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      monthlyCost: { label: 'Monthly Cost', value: `$${monthlyCost.toFixed(2)}` },
      monthlyEnergy: { label: 'Monthly Electricity', value: `${monthlyKwh.toFixed(1)} kWh` },
      monthlyHeatOutput: { label: 'Total Heat Delivered', value: `${(monthlyBtu / 1000).toFixed(0)} kBTU` },
      annualCost: { label: 'Annual Cost (12 Months)', value: `$${(monthlyCost * 12).toFixed(2)}` },
    },
  };
}

export interface HeatingElementInputs {
  supplyVoltageV: number;
  ratedPowerWatts: number;
}

export function calculateHeatingElement(inputs: HeatingElementInputs): CalculationResult {
  const { supplyVoltageV: V, ratedPowerWatts: P } = inputs;
  const resistanceOhms = (V * V) / Math.max(P, 1e-6);
  const currentAmperes = P / Math.max(V, 1e-6);
  const steps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Calculate Operating Resistance (Hot State)',
      formula: 'R = V² / P',
      substitution: `(${V} V)² / ${P} W`,
      result: `R = ${resistanceOhms.toFixed(2)} Ω`,
    },
    {
      stepNumber: 2,
      title: 'Calculate Steady-State Operating Current',
      formula: 'I = P / V',
      substitution: `${P} W / ${V} V`,
      result: `I = ${currentAmperes.toFixed(2)} A`,
    },
  ];

  return {
    primaryValue: resistanceOhms,
    formattedValue: `${resistanceOhms.toFixed(2)} Ω`,
    unit: 'Ω',
    label: 'Heater Element Resistance',
    classification: 'THEORETICAL',
    warnings: [],
    steps,
    additionalOutputs: {
      resistance: { label: 'Hot Resistance', value: `${resistanceOhms.toFixed(2)} Ω` },
      current: { label: 'Full Load Current', value: `${currentAmperes.toFixed(2)} A` },
      powerDensity: { label: 'Nominal Rating', value: formatQuantity(P, 'power') },
    },
    visualData: {
      resistanceOhms,
      currentAmperes,
      powerWatts: P,
      voltageV: V,
    },
  };
}

export interface FluidHeatingInputs {
  fluidType: 'water' | 'oil' | 'air';
  volumeLiters: number;
  initialTempC: number;
  targetTempC: number;
  heatUpTimeHours: number;
}

export function calculateFluidHeatingPower(inputs: FluidHeatingInputs): CalculationResult {
  const { fluidType, volumeLiters, initialTempC, targetTempC, heatUpTimeHours } = inputs;
  const deltaT = Math.max(targetTempC - initialTempC, 0);

  // Specific heat capacity c in kJ/(kg·K) & density in kg/L
  let c = 4.184; // water
  let density = 1.0;
  if (fluidType === 'oil') {
    c = 2.0;
    density = 0.88;
  } else if (fluidType === 'air') {
    c = 1.005;
    density = 0.0012;
  }

  const massKg = volumeLiters * density;
  // Sensible energy in kWh: E_kWh = (m * c * deltaT) / 3600
  const energyKwh = (massKg * c * deltaT) / 3600;
  // Account for typical 15% vessel surface thermal radiation loss
  const lossFactor = 1.15;
  const requiredEnergyKwh = energyKwh * lossFactor;
  const requiredPowerKw = requiredEnergyKwh / Math.max(heatUpTimeHours, 0.01);

  const steps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Calculate Thermal Energy (Sensible Heating Q = m·c·ΔT)',
      formula: 'E_ideal = (m × c × ΔT) / 3600',
      substitution: `(${massKg.toFixed(1)} kg × ${c} kJ/kg·K × ${deltaT} K) / 3600`,
      result: `E = ${energyKwh.toFixed(3)} kWh`,
    },
    {
      stepNumber: 2,
      title: 'Apply Thermal Vessel Heat Losses (15%) and Required Time',
      formula: 'P_req = (E_ideal × 1.15) / t_hours',
      substitution: `(${energyKwh.toFixed(3)} kWh × 1.15) / ${heatUpTimeHours} h`,
      result: `P = ${requiredPowerKw.toFixed(2)} kW`,
    },
  ];

  return {
    primaryValue: requiredPowerKw,
    formattedValue: `${requiredPowerKw.toFixed(2)} kW`,
    unit: 'kW',
    label: 'Required Heating Power',
    classification: 'THEORETICAL',
    warnings: [],
    steps,
    additionalOutputs: {
      requiredPowerKw: { label: 'Heating Element Power', value: `${requiredPowerKw.toFixed(2)} kW` },
      theoreticalEnergyKwh: { label: 'Ideal Thermal Heat', value: `${energyKwh.toFixed(3)} kWh` },
      fluidMass: { label: 'Heated Fluid Mass', value: `${massKg.toFixed(1)} kg` },
      tempRise: { label: 'Temperature Elevation', value: `+${deltaT.toFixed(1)} °C` },
    },
    visualData: {
      requiredPowerKw,
      energyKwh,
      massKg,
      deltaT,
    },
  };
}

export interface EnclosureHeaterInputs {
  enclosureSurfaceAreaM2: number;
  deltaTC: number;
  insulationLevel?: 'standard-sheet-steel' | 'insulated' | 'outdoor-weatherproof';
}

export function calculateEnclosureHeater(inputs: EnclosureHeaterInputs): CalculationResult {
  const { enclosureSurfaceAreaM2: A, deltaTC: dT, insulationLevel = 'standard-sheet-steel' } = inputs;

  // Heat transfer coefficient U in W/(m²·K)
  let U = 5.5; // sheet steel
  if (insulationLevel === 'insulated') U = 2.5;
  if (insulationLevel === 'outdoor-weatherproof') U = 6.5;

  // Heat loss Q = A * U * dT
  const heatLossWatts = A * U * dT;
  // Safety margin for anti-condensation heating: 1.25x
  const recommendedHeaterWatts = heatLossWatts * 1.25;

  const steps: CalculationStep[] = [
    {
      stepNumber: 1,
      title: 'Calculate Enclosure Thermal Envelope Dissipation',
      formula: 'Q_loss = A × U × ΔT',
      substitution: `${A} m² × ${U} W/m²·K × ${dT} K`,
      result: `Q = ${heatLossWatts.toFixed(1)} W`,
    },
    {
      stepNumber: 2,
      title: 'Apply Anti-Condensation Reserve Factor (25%)',
      formula: 'P_heater = Q_loss × 1.25',
      substitution: `${heatLossWatts.toFixed(1)} W × 1.25`,
      result: `P_heater = ${recommendedHeaterWatts.toFixed(1)} W`,
    },
  ];

  return {
    primaryValue: recommendedHeaterWatts,
    formattedValue: `${recommendedHeaterWatts.toFixed(0)} W`,
    unit: 'W',
    label: 'Recommended Anti-Condensation Heater',
    classification: 'ENGINEERING ESTIMATE',
    warnings: [],
    steps,
    additionalOutputs: {
      recommendedHeaterWatts: { label: 'Recommended Heater Size', value: `${recommendedHeaterWatts.toFixed(0)} W` },
      continuousHeatLoss: { label: 'Conduction Envelope Loss', value: `${heatLossWatts.toFixed(1)} W` },
      uFactor: { label: 'Heat Transfer Coefficient (U)', value: `${U} W/m²·K` },
    },
    visualData: {
      recommendedHeaterWatts,
      heatLossWatts,
      A,
      dT,
    },
  };
}
