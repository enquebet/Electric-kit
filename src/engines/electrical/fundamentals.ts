import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { checkVoltageSafety, checkCurrentSafety } from '../../lib/safety/disclaimers';

export interface DcPowerInputs {
  voltage?: number;
  current?: number;
  resistance?: number;
  timeHours?: number;
}

export function calculateDcPower(inputs: DcPowerInputs): CalculationResult {
  const { voltage: V, current: I, resistance: R, timeHours = 1 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let p = 0;
  let vCalc = V ?? 0;
  let iCalc = I ?? 0;
  let rCalc = R ?? 0;

  if (V !== undefined && I !== undefined) {
    p = V * I;
    rCalc = I !== 0 ? Math.abs(V / I) : 0;
    steps.push({
      stepNumber: 1,
      title: 'Calculate Electrical Power from Voltage and Current',
      formula: 'P = V × I',
      substitution: `${V} V × ${I} A`,
      result: `${formatQuantity(p, 'power')}`,
    });
  } else if (I !== undefined && R !== undefined) {
    p = I * I * R;
    vCalc = Math.abs(I * R);
    steps.push({
      stepNumber: 1,
      title: 'Calculate Electrical Power from Current and Resistance (Joule Heating)',
      formula: 'P = I² × R',
      substitution: `(${I} A)² × ${R} Ω`,
      result: `${formatQuantity(p, 'power')}`,
    });
  } else if (V !== undefined && R !== undefined) {
    if (R <= 0) {
      warnings.push({
        severity: 'danger',
        title: 'Zero Resistance / Short Circuit',
        message: 'Resistance must be greater than zero to avoid infinite power dissipation.',
      });
      p = Infinity;
    } else {
      p = (V * V) / R;
      iCalc = Math.abs(V / R);
      steps.push({
        stepNumber: 1,
        title: 'Calculate Electrical Power from Voltage and Resistance',
        formula: 'P = V² / R',
        substitution: `(${V} V)² / ${R} Ω`,
        result: `${formatQuantity(p, 'power')}`,
      });
    }
  } else {
    warnings.push({
      severity: 'danger',
      title: 'Insufficient Inputs',
      message: 'Provide at least two of Voltage, Current, or Resistance.',
    });
  }

  // Energy over time
  const energyWh = p !== Infinity ? p * timeHours : 0;
  const energyKwh = energyWh / 1000;
  const energyJoules = energyWh * 3600;

  if (p !== Infinity) {
    steps.push({
      stepNumber: 2,
      title: 'Calculate Total Stored / Dissipated Energy over Time',
      formula: 'E = P × t',
      substitution: `${formatQuantity(p, 'power')} × ${timeHours} h`,
      result: `${energyKwh.toFixed(4)} kWh (${formatQuantity(energyJoules, 'energy')})`,
    });
  }

  if (vCalc > 0) {
    const vWarn = checkVoltageSafety(vCalc, false);
    if (vWarn) warnings.push(vWarn);
  }
  if (iCalc > 0) {
    const iWarn = checkCurrentSafety(iCalc);
    if (iWarn) warnings.push(iWarn);
  }

  return {
    primaryValue: p,
    formattedValue: formatQuantity(p, 'power'),
    unit: 'W',
    label: 'Electrical Power (P)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      voltage: { label: 'Voltage (V)', value: `${vCalc.toFixed(2)} V` },
      current: { label: 'Current (I)', value: `${iCalc.toFixed(3)} A` },
      resistance: { label: 'Equivalent Resistance (R)', value: `${rCalc.toFixed(2)} Ω` },
      energyWh: { label: 'Energy (Watt-hours)', value: `${energyWh.toFixed(2)} Wh` },
      energyKwh: { label: 'Energy (Kilowatt-hours)', value: `${energyKwh.toFixed(4)} kWh` },
      energyJoules: { label: 'Energy (Joules)', value: formatQuantity(energyJoules, 'energy') },
    },
  };
}

export interface EnergyCostInputs {
  powerWatts: number;
  hoursPerDay: number;
  daysPerMonth?: number;
  tariffPerKwh: number;
  currencySymbol?: string;
}

export function calculateEnergyCost(inputs: EnergyCostInputs): CalculationResult {
  const {
    powerWatts,
    hoursPerDay,
    daysPerMonth = 30,
    tariffPerKwh,
    currencySymbol = '$',
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (powerWatts < 0 || hoursPerDay < 0 || tariffPerKwh < 0) {
    warnings.push({
      severity: 'warning',
      title: 'Negative Input Value',
      message: 'Power, operating hours, and electricity tariff must be non-negative numbers.',
    });
  }

  if (hoursPerDay > 24) {
    warnings.push({
      severity: 'warning',
      title: 'Hours Exceed Day',
      message: 'Operating hours per day cannot exceed 24 hours.',
    });
  }

  const safeHours = Math.min(Math.max(hoursPerDay, 0), 24);
  const dailyKwh = (powerWatts * safeHours) / 1000;
  const monthlyKwh = dailyKwh * daysPerMonth;
  const annualKwh = dailyKwh * 365.25;

  const dailyCost = dailyKwh * tariffPerKwh;
  const monthlyCost = monthlyKwh * tariffPerKwh;
  const annualCost = annualKwh * tariffPerKwh;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Daily Electrical Energy Consumption',
    formula: 'E_day = (P × t_day) / 1000',
    substitution: `(${powerWatts} W × ${safeHours} h) / 1000`,
    result: `${dailyKwh.toFixed(3)} kWh/day`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Monthly & Annual Energy Consumption',
    formula: 'E_month = E_day × Days;   E_year = E_day × 365.25',
    substitution: `${dailyKwh.toFixed(3)} kWh × ${daysPerMonth} days ;   ${dailyKwh.toFixed(3)} kWh × 365.25 days`,
    result: `${monthlyKwh.toFixed(1)} kWh/mo ;  ${annualKwh.toFixed(1)} kWh/yr`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Calculate Estimated Electricity Cost (User Tariff)',
    formula: 'Cost = Energy (kWh) × Tariff Rate',
    substitution: `${monthlyKwh.toFixed(1)} kWh × ${currencySymbol}${tariffPerKwh.toFixed(4)}/kWh`,
    result: `${currencySymbol}${monthlyCost.toFixed(2)}/month`,
  });

  return {
    primaryValue: monthlyCost,
    formattedValue: `${currencySymbol}${monthlyCost.toFixed(2)}`,
    unit: `${currencySymbol}/mo`,
    label: 'Estimated Monthly Energy Cost',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Cost is based on user-supplied flat tariff; does not account for tiered pricing, time-of-use (TOU) rates, demand charges, or standing service fees.',
    warnings,
    steps,
    additionalOutputs: {
      dailyKwh: { label: 'Daily Energy', value: `${dailyKwh.toFixed(3)} kWh` },
      monthlyKwh: { label: 'Monthly Energy', value: `${monthlyKwh.toFixed(2)} kWh` },
      annualKwh: { label: 'Annual Energy', value: `${annualKwh.toFixed(1)} kWh` },
      dailyCost: { label: 'Daily Cost', value: `${currencySymbol}${dailyCost.toFixed(2)}` },
      annualCost: { label: 'Annual Cost', value: `${currencySymbol}${annualCost.toFixed(2)}` },
    },
  };
}

export interface EfficiencyInputs {
  pinWatts: number;
  poutWatts: number;
}

export function calculateElectricalEfficiency(inputs: EfficiencyInputs): CalculationResult {
  const { pinWatts, poutWatts } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  if (pinWatts <= 0) {
    warnings.push({
      severity: 'danger',
      title: 'Zero or Negative Input Power',
      message: 'Input power Pin must be positive to evaluate thermodynamic efficiency.',
    });
  }

  if (poutWatts > pinWatts) {
    warnings.push({
      severity: 'danger',
      title: 'Conservation of Energy Violation (η > 100%)',
      message: 'Output power cannot exceed input power in a passive or closed conversion system.',
    });
  }

  const safePin = Math.max(pinWatts, 1e-9);
  const efficiency = (poutWatts / safePin) * 100;
  const ploss = Math.max(pinWatts - poutWatts, 0);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Conversion Efficiency',
    formula: 'η = (P_out / P_in) × 100%',
    substitution: `(${poutWatts} W / ${pinWatts} W) × 100%`,
    result: `${efficiency.toFixed(2)}%`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Thermal / Electrical Losses',
    formula: 'P_loss = P_in - P_out',
    substitution: `${pinWatts} W - ${poutWatts} W`,
    result: `${formatQuantity(ploss, 'power')}`,
  });

  return {
    primaryValue: efficiency,
    formattedValue: `${efficiency.toFixed(2)}%`,
    unit: '%',
    label: 'Electrical Efficiency (η)',
    classification: 'THEORETICAL',
    warnings,
    steps,
    additionalOutputs: {
      lossWatts: { label: 'Power Loss (Ploss)', value: formatQuantity(ploss, 'power'), note: 'Dissipated as heat' },
      ratio: { label: 'Efficiency Ratio', value: (efficiency / 100).toFixed(4) },
      pout: { label: 'Useful Output Power', value: formatQuantity(poutWatts, 'power') },
      pin: { label: 'Total Input Power', value: formatQuantity(pinWatts, 'power') },
    },
  };
}

export interface LoadItem {
  id: string;
  name: string;
  voltage: number;
  powerWatts: number;
  quantity: number;
  hoursPerDay: number;
}

export function calculateDcLoadSchedule(loads: LoadItem[]): CalculationResult {
  const steps: CalculationStep[] = [];
  const warnings: EngineeringWarning[] = [];

  let totalConnectedWatts = 0;
  let totalDailyKwh = 0;

  loads.forEach((load, idx) => {
    const qty = Math.max(load.quantity, 0);
    const itemTotalWatts = load.powerWatts * qty;
    const itemDailyKwh = (itemTotalWatts * Math.min(Math.max(load.hoursPerDay, 0), 24)) / 1000;

    totalConnectedWatts += itemTotalWatts;
    totalDailyKwh += itemDailyKwh;

    steps.push({
      stepNumber: idx + 1,
      title: `Load ${idx + 1}: ${load.name || 'Unnamed'}`,
      formula: 'P_sub = Qty × P_unit;  E_day = P_sub × Hours / 1000',
      substitution: `${qty} × ${load.powerWatts} W ; ${itemTotalWatts} W × ${load.hoursPerDay} h / 1000`,
      result: `${itemTotalWatts} W (${itemDailyKwh.toFixed(3)} kWh/day)`,
    });
  });

  const totalMonthlyKwh = totalDailyKwh * 30;
  const totalAnnualKwh = totalDailyKwh * 365.25;

  return {
    primaryValue: totalConnectedWatts,
    formattedValue: `${(totalConnectedWatts / 1000).toFixed(3)} kW`,
    unit: 'kW',
    label: 'Total Connected Load',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      totalWatts: { label: 'Total Connected Power', value: `${totalConnectedWatts.toFixed(1)} W` },
      dailyKwh: { label: 'Daily Energy Demand', value: `${totalDailyKwh.toFixed(2)} kWh/day` },
      monthlyKwh: { label: 'Monthly Energy Demand', value: `${totalMonthlyKwh.toFixed(1)} kWh/month` },
      annualKwh: { label: 'Annual Energy Demand', value: `${totalAnnualKwh.toFixed(0)} kWh/year` },
      loadCount: { label: 'Active Load Count', value: `${loads.length} items` },
    },
  };
}
