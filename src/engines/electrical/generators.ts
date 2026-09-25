import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { getInstallationContextWarning } from '../../lib/standards/standards-profile';

export interface GeneratorRatingInputs {
  circuitType: 'single-phase' | 'three-phase';
  voltageV: number;
  ratedCurrentA: number;
  powerFactor: number; // typically 0.8 for industrial gensets
  actualLoadKw?: number;
}

export function calculateGeneratorRatings(inputs: GeneratorRatingInputs): CalculationResult {
  const { circuitType, voltageV: V, ratedCurrentA: I_rated, powerFactor: pf, actualLoadKw } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const is3Phase = circuitType === 'three-phase';
  const multiplier = is3Phase ? Math.sqrt(3) : 1.0;
  const safePf = Math.min(Math.max(pf, 0.1), 1.0);

  // Rated Apparent Power S = k * V * I
  const ratedVa = multiplier * V * I_rated;
  const ratedKva = ratedVa / 1000;

  // Rated Prime/Standby Real Power P = S * PF
  const ratedKw = ratedKva * safePf;

  steps.push({
    stepNumber: 1,
    title: `Calculate Generator Continuous Apparent Rating (${is3Phase ? '3-Phase' : 'Single-Phase'})`,
    formula: is3Phase ? 'S = (√3 × V_L × I_rated) / 1000' : 'S = (V × I_rated) / 1000',
    substitution: is3Phase
      ? `(1.732 × ${V} V × ${I_rated} A) / 1000`
      : `(${V} V × ${I_rated} A) / 1000`,
    result: `S_rated = ${ratedKva.toFixed(1)} kVA`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Continuous Real Active Power Output at Rated Power Factor',
    formula: 'P = S_rated × PF',
    substitution: `${ratedKva.toFixed(1)} kVA × ${safePf.toFixed(2)}`,
    result: `P_rated = ${ratedKw.toFixed(1)} kW (${(ratedKw / 0.7457).toFixed(0)} HP mechanical engine equivalent)`,
  });

  let loadPct = 0;
  if (actualLoadKw !== undefined && actualLoadKw > 0) {
    loadPct = (actualLoadKw / ratedKw) * 100;
    steps.push({
      stepNumber: 3,
      title: 'Calculate Operating Load Percentage',
      formula: 'Load% = (P_actual / P_rated) × 100%',
      substitution: `(${actualLoadKw} kW / ${ratedKw.toFixed(1)} kW) × 100%`,
      result: `Operating at ${loadPct.toFixed(1)}% of prime rating`,
    });

    if (loadPct < 30) {
      warnings.push({
        severity: 'warning',
        title: 'Diesel Wet Stacking & Carbon Glazing Risk (< 30% Load)',
        message: `Operating a diesel generator below 30% continuous load causes unburned fuel accumulation in exhaust manifolds, cylinder glazing, and heavy carbon buildup. Periodic load-bank testing or supplemental resistive loading is recommended.`,
      });
    } else if (loadPct > 100) {
      warnings.push({
        severity: 'danger',
        title: 'Generator Overload Condition (> 100%)',
        message: `Current load (${actualLoadKw} kW) exceeds the continuous rating (${ratedKw.toFixed(1)} kW). Sustained overload will cause alternator winding overheating, voltage collapse, or engine stall.`,
      });
    }
  }

  warnings.push(getInstallationContextWarning('Generator Installation', [
    'automatic transfer switch (ATS) mechanical & electrical interlocks preventing backfeed into utility lines',
    'neutral-ground bonding configuration (separately derived vs non-separately derived system per NEC 250.30)',
    'starting kVA (SkVA) capability for motor loads',
    'altitude and ambient temperature derating factors (~1% per 100m above 1000m, 1% per 5°C above 40°C)',
  ]));

  return {
    primaryValue: ratedKw,
    formattedValue: `${ratedKw.toFixed(1)} kW (${ratedKva.toFixed(1)} kVA)`,
    unit: 'kW',
    label: 'Generator Rated Real Power',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Continuous prime rating in accordance with ISO 8528-1 and NFPA 110. Does not substitute for emergency standby sizing software.',
    warnings,
    steps,
    additionalOutputs: {
      apparentPowerKva: { label: 'Apparent Power Rating', value: `${ratedKva.toFixed(1)} kVA` },
      activePowerKw: { label: 'Prime Active Power Rating', value: `${ratedKw.toFixed(1)} kW` },
      ratedLineCurrent: { label: 'Rated Output Current', value: `${I_rated.toFixed(1)} A per line` },
      loadPercentage: { label: 'Current Operating Load', value: actualLoadKw ? `${loadPct.toFixed(1)}%` : 'N/A' },
    },
    visualData: {
      ratedKva,
      ratedKw,
      actualLoadKw: actualLoadKw ?? 0,
      loadPct,
    },
  };
}

export interface GeneratorRuntimeInputs {
  fuelTankCapacityLiters: number;
  fuelConsumptionLitersPerHour: number;
  fuelCostPerLiter?: number;
}

export function calculateGeneratorRuntime(inputs: GeneratorRuntimeInputs): CalculationResult {
  const { fuelTankCapacityLiters, fuelConsumptionLitersPerHour, fuelCostPerLiter = 1.20 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeRate = Math.max(fuelConsumptionLitersPerHour, 0.01);
  // Reserve safety margin: 10% bottom unusable fuel
  const usableFuelLiters = fuelTankCapacityLiters * 0.9;
  const runtimeHours = usableFuelLiters / safeRate;
  const hourlyFuelCost = safeRate * fuelCostPerLiter;
  const fullTankCost = fuelTankCapacityLiters * fuelCostPerLiter;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Usable Fuel Volume (Accounting for 10% Sludge/Bottom Tank Reserve)',
    formula: 'V_usable = V_tank × 0.90',
    substitution: `${fuelTankCapacityLiters} L × 0.90`,
    result: `V_usable = ${usableFuelLiters.toFixed(1)} Liters`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Operating Autonomy Runtime',
    formula: 't_run = V_usable / Consumption_rate',
    substitution: `${usableFuelLiters.toFixed(1)} L / ${safeRate.toFixed(1)} L/h`,
    result: `Autonomy = ${runtimeHours.toFixed(1)} hours (${(runtimeHours / 24).toFixed(1)} days continuous)`,
  });

  return {
    primaryValue: runtimeHours,
    formattedValue: `${runtimeHours.toFixed(1)} hours`,
    unit: 'hours',
    label: 'Estimated Continuous Runtime',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      runtimeHours: { label: 'Autonomy Duration', value: `${runtimeHours.toFixed(1)} hours` },
      runtimeDays: { label: 'Days of Autonomy', value: `${(runtimeHours / 24).toFixed(1)} days` },
      hourlyFuelCost: { label: 'Estimated Fuel Burn Cost', value: `$${hourlyFuelCost.toFixed(2)}/hour` },
      fullTankFillCost: { label: 'Full Tank Cost', value: `$${fullTankCost.toFixed(2)}` },
      usableFuel: { label: 'Usable Fuel Capacity', value: `${usableFuelLiters.toFixed(1)} Liters (${(usableFuelLiters * 0.264172).toFixed(1)} gal)` },
    },
    visualData: {
      runtimeHours,
      fuelTankCapacityLiters,
      usableFuelLiters,
      safeRate,
    },
  };
}

export interface GeneratorSizingInputs {
  continuousKva: number;
  largestMotorHp: number;
  motorStartingMethod?: 'direct-on-line' | 'star-delta' | 'soft-starter' | 'vfd';
  ambientTempC?: number;
  altitudeMeters?: number;
  powerFactor?: number;
}

export function calculateGeneratorSizing(inputs: GeneratorSizingInputs): CalculationResult {
  const {
    continuousKva,
    largestMotorHp,
    motorStartingMethod = 'direct-on-line',
    ambientTempC = 25,
    altitudeMeters = 0,
    powerFactor = 0.8,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Motor running kVA: HP * 0.7457 kW / (0.85 eff * pf)
  const motorRunningKw = largestMotorHp * 0.7457;
  const motorRunningKva = motorRunningKw / 0.85;

  // Motor starting multiplier kVA factor
  let startingMultiplier = 6.0;
  if (motorStartingMethod === 'star-delta') startingMultiplier = 2.5;
  if (motorStartingMethod === 'soft-starter') startingMultiplier = 3.0;
  if (motorStartingMethod === 'vfd') startingMultiplier = 1.25;

  const motorStartingKva = motorRunningKva * startingMultiplier;

  // Surge requirement: continuous load minus largest motor running kVA + motor starting surge
  const baseConnectedNonMotorKva = Math.max(0, continuousKva - motorRunningKva);
  const peakStepSurgeKva = baseConnectedNonMotorKva + motorStartingKva;

  // Standard gensets typically allow 300% short-term motor starting kVA (SkVA dip ~20-25%)
  const minGensetBySurgeKva = peakStepSurgeKva / 2.0;

  // Environmental derating: 1% per 100m above 1000m, 1% per 5°C above 40°C
  let altitudeDerate = 1.0;
  if (altitudeMeters > 1000) {
    altitudeDerate -= ((altitudeMeters - 1000) / 100) * 0.01;
  }
  let tempDerate = 1.0;
  if (ambientTempC > 40) {
    tempDerate -= ((ambientTempC - 40) / 5) * 0.01;
  }
  const combinedEnvDerate = Math.max(0.6, altitudeDerate * tempDerate);

  // Governing continuous kVA required with 20% future growth/headroom:
  const requiredContinuousKva = Math.max(continuousKva * 1.25, minGensetBySurgeKva) / combinedEnvDerate;

  // Standard commercial genset sizes (kVA)
  const standardSizesKva = [15, 20, 30, 45, 60, 80, 100, 125, 150, 200, 250, 300, 400, 500, 600, 800, 1000];
  const recommendedStandardKva = standardSizesKva.find(s => s >= requiredContinuousKva) || Math.ceil(requiredContinuousKva / 50) * 50;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Largest Motor Starting Surge kVA',
    formula: 'kVA_start = (HP × 0.7457 / η) × Starting_Multiplier',
    substitution: `(${largestMotorHp} HP × 0.7457 / 0.85) × ${startingMultiplier} (${motorStartingMethod})`,
    result: `kVA_start = ${motorStartingKva.toFixed(1)} kVA`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Evaluate Environmental Altitude & Temperature Derating',
    formula: 'Derate = Alt_Factor × Temp_Factor',
    substitution: `Alt (${altitudeMeters}m) × Temp (${ambientTempC}°C)`,
    result: `Net Capacity Factor = ${(combinedEnvDerate * 100).toFixed(1)}%`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Select Commercial Standby/Prime Generator Size',
    formula: 'S_genset ≥ max(Continuous × 1.25, Peak_Surge / 2.0) / Derate',
    substitution: `Governing requirement = ${requiredContinuousKva.toFixed(1)} kVA`,
    result: `Recommended Standard Genset = ${recommendedStandardKva} kVA (${(recommendedStandardKva * powerFactor).toFixed(0)} kW)`,
  });

  return {
    primaryValue: recommendedStandardKva,
    formattedValue: `${recommendedStandardKva} kVA`,
    unit: 'kVA',
    label: 'Recommended Generator Rating',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'ISO 8528-5 generator dynamic transient response and starting kVA capability guidelines.',
    warnings,
    steps,
    additionalOutputs: {
      recommendedGensetKva: { label: 'Recommended Genset Rating', value: `${recommendedStandardKva} kVA` },
      ratedActiveKw: { label: 'Rated Active Prime Power', value: `${(recommendedStandardKva * powerFactor).toFixed(0)} kW` },
      motorSurgeKva: { label: 'Motor Inrush Step Surge', value: `${motorStartingKva.toFixed(1)} kVA` },
      derateFactor: { label: 'Environmental Capacity', value: `${(combinedEnvDerate * 100).toFixed(1)}%` },
    },
    visualData: {
      recommendedStandardKva,
      requiredContinuousKva,
      motorStartingKva,
      continuousKva,
      combinedEnvDerate,
    },
  };
}

export interface GeneratorFuelInputs {
  ratedKva: number;
  operatingLoadPercent: number; // e.g. 75%
  fuelType?: 'diesel' | 'natural-gas';
}

export function calculateGeneratorFuelConsumption(inputs: GeneratorFuelInputs): CalculationResult {
  const { ratedKva, operatingLoadPercent: loadPct, fuelType = 'diesel' } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // Typical specific fuel consumption for diesel genset: ~0.26 to 0.28 L / kWh
  // Hourly burn L/hr ≈ ratedKva * 0.8 kW * (load% / 100) * 0.27 L/kWh
  const actualKw = ratedKva * 0.8 * (loadPct / 100);
  let litersPerHour = actualKw * 0.27;
  if (fuelType === 'natural-gas') {
    // Approx m3/hr for natural gas (~0.35 m3/kWh)
    litersPerHour = actualKw * 0.35;
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Instantaneous Operating Mechanical/Electrical Load',
    formula: 'P_actual = S_rated × PF × (Load% / 100)',
    substitution: `${ratedKva} kVA × 0.8 × (${loadPct}% / 100)`,
    result: `P = ${actualKw.toFixed(1)} kW`,
  });

  steps.push({
    stepNumber: 2,
    title: `Calculate Specific Hourly Fuel Consumption (${fuelType === 'diesel' ? 'Diesel ~0.27 L/kWh' : 'Natural Gas'})`,
    formula: 'Burn_Rate = P_actual × Specific_Consumption',
    substitution: `${actualKw.toFixed(1)} kW × 0.27 L/kWh`,
    result: `Rate = ${litersPerHour.toFixed(1)} ${fuelType === 'diesel' ? 'Liters/hr' : 'm³/hr'}`,
  });

  return {
    primaryValue: litersPerHour,
    formattedValue: `${litersPerHour.toFixed(1)} ${fuelType === 'diesel' ? 'L/h' : 'm³/h'}`,
    unit: fuelType === 'diesel' ? 'L/h' : 'm³/h',
    label: 'Estimated Fuel Consumption',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      hourlyBurnRate: { label: 'Hourly Consumption', value: `${litersPerHour.toFixed(1)} ${fuelType === 'diesel' ? 'L/h' : 'm³/h'}` },
      eightHourShiftFuel: { label: '8-Hour Shift Requirement', value: `${(litersPerHour * 8).toFixed(0)} ${fuelType === 'diesel' ? 'L' : 'm³'}` },
      twentyFourHourFuel: { label: '24-Hour Emergency Stock', value: `${(litersPerHour * 24).toFixed(0)} ${fuelType === 'diesel' ? 'L' : 'm³'}` },
    },
    visualData: {
      litersPerHour,
      actualKw,
      ratedKva,
      loadPct,
    },
  };
}
