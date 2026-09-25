import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { checkBatterySafety } from '../../lib/safety/disclaimers';

export interface BatteryRuntimeInputs {
  nominalVoltage: number; // Volts
  capacityAh: number; // Ampere-hours (e.g. 2.5 for 2500mAh)
  chemistry: 'li-ion' | 'lifepo4' | 'lead-acid' | 'nimh' | 'alkaline';
  dischargeDepthPercent: number; // e.g. 80 for 80% DoD
  loadMode: 'current' | 'power';
  loadValue: number; // Amperes or Watts
  peukertExponent?: number; // default based on chemistry
}

export const BATTERY_CHEMISTRY_PRESETS: Record<
  string,
  { name: string; defaultVoltage: number; defaultDod: number; peukert: number; maxRecommendedC: number }
> = {
  'li-ion': {
    name: 'Lithium-Ion / LiPo (3.7V)',
    defaultVoltage: 3.7,
    defaultDod: 80,
    peukert: 1.08,
    maxRecommendedC: 2.0,
  },
  lifepo4: {
    name: 'Lithium Iron Phosphate / LiFePO4 (3.2V)',
    defaultVoltage: 3.2,
    defaultDod: 90,
    peukert: 1.05,
    maxRecommendedC: 3.0,
  },
  'lead-acid': {
    name: 'Sealed Lead-Acid / AGM (12V)',
    defaultVoltage: 12.0,
    defaultDod: 50,
    peukert: 1.25,
    maxRecommendedC: 0.5,
  },
  nimh: {
    name: 'Nickel-Metal Hydride / NiMH (1.2V)',
    defaultVoltage: 1.2,
    defaultDod: 80,
    peukert: 1.15,
    maxRecommendedC: 1.0,
  },
  alkaline: {
    name: 'Alkaline Primary (1.5V)',
    defaultVoltage: 1.5,
    defaultDod: 70,
    peukert: 1.30,
    maxRecommendedC: 0.2,
  },
};

export function calculateBatteryRuntime(inputs: BatteryRuntimeInputs): CalculationResult {
  const {
    nominalVoltage,
    capacityAh,
    chemistry,
    dischargeDepthPercent,
    loadMode,
    loadValue,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const preset = BATTERY_CHEMISTRY_PRESETS[chemistry] || BATTERY_CHEMISTRY_PRESETS['li-ion'];
  const peukert = inputs.peukertExponent || preset.peukert;

  // Stored gross energy
  const grossEnergyWh = capacityAh * nominalVoltage;
  const usableFraction = Math.min(Math.max(dischargeDepthPercent / 100, 0.05), 1.0);
  const usableCapacityAh = capacityAh * usableFraction;
  const usableEnergyWh = grossEnergyWh * usableFraction;

  // Convert load into current and power
  let currentA = 0;
  let powerW = 0;

  if (loadMode === 'current') {
    currentA = loadValue;
    powerW = currentA * nominalVoltage;
  } else {
    powerW = loadValue;
    currentA = nominalVoltage > 0 ? powerW / nominalVoltage : 0;
  }

  if (currentA < 0 || capacityAh <= 0 || nominalVoltage <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Invalid Load, Voltage, or Capacity',
      message: 'Capacity and voltage must be positive non-zero numbers. Load must be non-negative.',
    });
  }

  // Calculate C-rate
  const cRate = capacityAh > 0 ? currentA / capacityAh : 0;

  // Apply Peukert's law correction
  let runtimeHours = 0;
  if (currentA === 0) {
    runtimeHours = Infinity;
  } else if (currentA > 0 && capacityAh > 0) {
    const idealHours = usableCapacityAh / currentA;
    if (cRate > 0) {
      runtimeHours = idealHours * Math.pow(1 / Math.max(cRate, 0.05), peukert - 1);
    } else {
      runtimeHours = idealHours;
    }
  }

  const runtimeMinutes = Number.isFinite(runtimeHours) ? runtimeHours * 60 : Infinity;
  const runtimeDays = Number.isFinite(runtimeHours) ? runtimeHours / 24 : Infinity;

  let formattedRuntime = '';
  if (!Number.isFinite(runtimeHours)) {
    formattedRuntime = '∞ (No load)';
  } else if (runtimeHours < 1) {
    formattedRuntime = `${runtimeMinutes.toFixed(1)} mins`;
  } else if (runtimeHours < 48) {
    const hrs = Math.floor(runtimeHours);
    const mins = Math.round((runtimeHours - hrs) * 60);
    formattedRuntime = `${hrs}h ${mins}m (${runtimeHours.toFixed(2)} hrs)`;
  } else {
    formattedRuntime = `${runtimeDays.toFixed(1)} days (${runtimeHours.toFixed(1)} hrs)`;
  }

  steps.push({
    stepNumber: 1,
    title: 'Calculate Gross & Usable Energy Capacity',
    formula: 'E_usable = Capacity(Ah) × V_nominal × DoD',
    substitution: `${capacityAh} Ah × ${nominalVoltage} V × ${(dischargeDepthPercent / 100).toFixed(2)}`,
    result: `${usableEnergyWh.toFixed(2)} Wh (Gross: ${grossEnergyWh.toFixed(2)} Wh)`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Determine Discharge C-Rate',
    formula: 'C_rate = I_load / Capacity(Ah)',
    substitution: `${formatQuantity(currentA, 'current')} / ${capacityAh} Ah`,
    result: `${cRate.toFixed(2)} C`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Peukert Derated Runtime',
    formula: 't = (C_usable / I_load) × (1 / C_rate)^(k - 1)',
    substitution: `(${usableCapacityAh.toFixed(2)} Ah / ${formatQuantity(currentA, 'current')}) × (1 / ${cRate.toFixed(2)})^(${peukert} - 1)`,
    result: formattedRuntime,
  });

  // Safety checks
  const bWarn = checkBatterySafety(cRate, chemistry);
  if (bWarn) warnings.push(bWarn);

  if (cRate > preset.maxRecommendedC) {
    warnings.push({
      severity: 'warning',
      title: 'Discharge Rate Exceeds Chemistry Benchmark',
      message: `Current discharge is ${cRate.toFixed(2)}C, which exceeds the continuous recommended rate (${preset.maxRecommendedC}C) for ${preset.name}. Expect significant cell temperature rise and reduced overall cycle life.`,
    });
  }

  if (chemistry === 'lead-acid' && dischargeDepthPercent > 50) {
    warnings.push({
      severity: 'warning',
      title: 'Deep Discharge Sulphation Risk',
      message: 'Discharging standard lead-acid batteries beyond 50% Depth of Discharge drastically degrades plate life and causes irreversible lead sulfate crystallization.',
    });
  }

  return {
    primaryValue: runtimeHours,
    formattedValue: formattedRuntime,
    unit: 'hours',
    label: 'Estimated Runtime Under Load',
    warnings,
    steps,
    additionalOutputs: {
      runtimeMins: {
        label: 'Runtime (Minutes)',
        value: `${runtimeMinutes.toFixed(1)} min`,
      },
      usableEnergy: {
        label: 'Usable Energy',
        value: `${usableEnergyWh.toFixed(2)} Wh`,
        note: `Gross capacity: ${grossEnergyWh.toFixed(2)} Wh`,
      },
      cRate: {
        label: 'Discharge C-Rate',
        value: `${cRate.toFixed(2)} C`,
        note: cRate <= 1 ? 'Mild drain' : 'Heavy drain',
      },
      loadCurrent: {
        label: 'Discharge Current',
        value: formatQuantity(currentA, 'current'),
      },
      loadPower: {
        label: 'Discharge Power',
        value: formatQuantity(powerW, 'power'),
      },
      peukertUsed: {
        label: "Peukert's Exponent",
        value: peukert.toFixed(2),
        note: 'High-current battery capacity derating factor',
      },
    },
    visualData: {
      nominalVoltage,
      capacityAh,
      currentA,
      powerW,
      usableEnergyWh,
      grossEnergyWh,
      runtimeHours,
      cRate,
    },
  };
}
