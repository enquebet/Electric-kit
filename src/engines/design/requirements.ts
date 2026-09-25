/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Module A: Requirements & Design Inputs (Capabilities 1 - 10)
 */

import { EngineeringRequirement, WorkflowWarning, EngineeringMargin } from './types';
import { globalTraceabilityRegister } from './traceability';

export interface ElectricalRequirementInput {
  nominalVoltage: number;
  minimumVoltage: number;
  maximumVoltage: number;
  continuousCurrentAmps: number;
  peakCurrentAmps: number;
  operatingConditions?: string;
}

export interface PowerRequirementInput {
  continuousPowerWatts: number;
  peakPowerWatts: number;
  startupInrushPowerWatts?: number;
  dutyCycleFraction?: number; // 0 to 1
  operatingDurationHours?: number;
}

export interface EnvironmentalRequirementInput {
  ambientTemperatureCelsius: number;
  minimumTemperatureCelsius: number;
  maximumTemperatureCelsius: number;
  altitudeMeters?: number;
  relativeHumidityPercent?: number;
}

export interface ThermalRequirementInput {
  maxAmbientTemperatureCelsius: number;
  maxJunctionTemperatureCelsius: number;
  maxEnclosureTemperatureCelsius: number;
  allowableTemperatureRiseCelsius: number;
  thermalMarginTargetCelsius?: number;
}

export interface MechanicalConstraintInput {
  maxMassKg: number;
  maxVolumeLiters?: number;
  enclosureDimensionsMm?: { length: number; width: number; height: number };
  mountingType?: 'din_rail' | 'panel' | 'pcb_chassis' | 'rackmount' | 'custom';
  isolationClearanceMm?: number;
}

export interface ComponentConstraintInput {
  maxVoltageRatingVolts: number;
  maxCurrentRatingAmps: number;
  maxPowerRatingWatts: number;
  maxOperatingTemperatureCelsius: number;
  deratingFactorVoltage?: number; // e.g. 0.80 (80% derating rule)
  deratingFactorCurrent?: number; // e.g. 0.75
}

export interface DesignMarginConfigInput {
  voltageMarginPercent: number;
  currentMarginPercent: number;
  powerMarginPercent: number;
  thermalMarginCelsius: number;
  capacityMarginPercent: number;
}

export interface ConsistencyCheckResult {
  isValid: boolean;
  violations: string[];
  warnings: WorkflowWarning[];
}

/** 1. Electrical Requirement Specification */
export function specifyElectricalRequirement(input: ElectricalRequirementInput): {
  requirements: EngineeringRequirement[];
  voltageSpan: number;
  peakToContinuousRatio: number;
} {
  const { nominalVoltage, minimumVoltage, maximumVoltage, continuousCurrentAmps, peakCurrentAmps } = input;
  if (nominalVoltage <= 0 || minimumVoltage <= 0 || maximumVoltage <= 0) {
    throw new Error('Voltage requirements must be strictly positive.');
  }
  if (continuousCurrentAmps <= 0 || peakCurrentAmps < continuousCurrentAmps) {
    throw new Error('Continuous current must be > 0 and peak current must be >= continuous current.');
  }
  if (minimumVoltage > nominalVoltage || nominalVoltage > maximumVoltage) {
    throw new Error('Voltage hierarchy must obey: Minimum <= Nominal <= Maximum.');
  }

  const reqs: EngineeringRequirement[] = [
    {
      id: 'req-elec-v-nom',
      category: 'electrical',
      name: 'Nominal System Voltage',
      nominalValue: nominalVoltage,
      minValue: minimumVoltage,
      maxValue: maximumVoltage,
      unit: 'V',
      source: 'user',
      description: input.operatingConditions ?? 'Standard operating condition',
    },
    {
      id: 'req-elec-i-cont',
      category: 'electrical',
      name: 'Continuous Load Current',
      nominalValue: continuousCurrentAmps,
      maxValue: peakCurrentAmps,
      unit: 'A',
      source: 'user',
    },
  ];

  return {
    requirements: reqs,
    voltageSpan: Number((maximumVoltage - minimumVoltage).toFixed(3)),
    peakToContinuousRatio: Number((peakCurrentAmps / continuousCurrentAmps).toFixed(2)),
  };
}

/** 2. Power Requirement Specification */
export function specifyPowerRequirement(input: PowerRequirementInput): {
  requirements: EngineeringRequirement[];
  isDimensionallyConsistent: boolean;
  inrushRatio: number;
} {
  const { continuousPowerWatts, peakPowerWatts } = input;
  const inrushW = input.startupInrushPowerWatts ?? peakPowerWatts;
  const dutyCycle = input.dutyCycleFraction ?? 1.0;

  if (continuousPowerWatts <= 0 || peakPowerWatts < continuousPowerWatts) {
    throw new Error('Continuous power must be > 0 and peak power must be >= continuous power.');
  }
  if (dutyCycle <= 0 || dutyCycle > 1.0) {
    throw new Error('Duty cycle fraction must be within 0.0 to 1.0.');
  }

  const reqs: EngineeringRequirement[] = [
    {
      id: 'req-pwr-cont',
      category: 'power',
      name: 'Continuous Power Demand',
      nominalValue: continuousPowerWatts,
      maxValue: peakPowerWatts,
      unit: 'W',
      source: 'user',
    },
    {
      id: 'req-pwr-inrush',
      category: 'power',
      name: 'Peak / Inrush Power Limit',
      nominalValue: inrushW,
      unit: 'W',
      source: 'user',
    },
  ];

  return {
    requirements: reqs,
    isDimensionallyConsistent: true,
    inrushRatio: Number((inrushW / continuousPowerWatts).toFixed(2)),
  };
}

/** 3. Voltage/Current Operating Point Definition & Basic Margin */
export function defineOperatingPointMargins(
  nominalV: number,
  measuredV: number,
  ratedI: number,
  operatingI: number
): { voltageDelta: number; currentMargin: EngineeringMargin } {
  const vDelta = measuredV - nominalV;
  const iMargin = globalTraceabilityRegister.createMargin('Continuous Current', operatingI, ratedI, 'A', 'higher_is_better');

  return {
    voltageDelta: Number(vDelta.toFixed(3)),
    currentMargin: iMargin,
  };
}

/** 4. Environmental Requirement Definition */
export function specifyEnvironmentalRequirement(input: EnvironmentalRequirementInput): {
  requirements: EngineeringRequirement[];
  temperatureRangeCelsius: number;
  requiresHardwareAltitudeTesting: boolean;
} {
  const { ambientTemperatureCelsius, minimumTemperatureCelsius, maximumTemperatureCelsius } = input;
  if (minimumTemperatureCelsius > ambientTemperatureCelsius || ambientTemperatureCelsius > maximumTemperatureCelsius) {
    throw new Error('Temperature hierarchy must obey: T_min <= T_ambient <= T_max.');
  }

  const alt = input.altitudeMeters ?? 0;
  const humidity = input.relativeHumidityPercent ?? 50;

  const reqs: EngineeringRequirement[] = [
    {
      id: 'req-env-temp',
      category: 'environmental',
      name: 'Ambient Operating Temperature',
      nominalValue: ambientTemperatureCelsius,
      minValue: minimumTemperatureCelsius,
      maxValue: maximumTemperatureCelsius,
      unit: '°C',
      source: 'user',
      description: `Altitude: ${alt}m, RH: ${humidity}%`,
    },
  ];

  return {
    requirements: reqs,
    temperatureRangeCelsius: maximumTemperatureCelsius - minimumTemperatureCelsius,
    requiresHardwareAltitudeTesting: alt > 2000,
  };
}

/** 5. Thermal Requirement Definition */
export function specifyThermalRequirement(input: ThermalRequirementInput): {
  requirements: EngineeringRequirement[];
  maxAllowableDeltaT: number;
} {
  const { maxAmbientTemperatureCelsius, maxJunctionTemperatureCelsius, maxEnclosureTemperatureCelsius } = input;
  if (maxAmbientTemperatureCelsius >= maxJunctionTemperatureCelsius) {
    throw new Error('Maximum junction temperature must be strictly greater than maximum ambient temperature.');
  }

  const deltaT = maxJunctionTemperatureCelsius - maxAmbientTemperatureCelsius;

  const reqs: EngineeringRequirement[] = [
    {
      id: 'req-therm-tj',
      category: 'thermal',
      name: 'Maximum Junction Temperature Tj',
      nominalValue: maxJunctionTemperatureCelsius,
      unit: '°C',
      source: 'user',
    },
    {
      id: 'req-therm-enc',
      category: 'thermal',
      name: 'Maximum Enclosure Temperature',
      nominalValue: maxEnclosureTemperatureCelsius,
      unit: '°C',
      source: 'user',
    },
  ];

  return {
    requirements: reqs,
    maxAllowableDeltaT: deltaT,
  };
}

/** 6. Mechanical Constraint Definition */
export function specifyMechanicalConstraints(input: MechanicalConstraintInput): {
  constraints: EngineeringRequirement[];
  calculatedVolumeLiters: number | null;
} {
  if (input.maxMassKg <= 0) throw new Error('Maximum mass constraint must be strictly positive.');

  let vol = input.maxVolumeLiters ?? null;
  if (!vol && input.enclosureDimensionsMm) {
    const { length, width, height } = input.enclosureDimensionsMm;
    if (length > 0 && width > 0 && height > 0) {
      vol = (length * width * height) / 1e6; // mm³ to Liters
    }
  }

  const reqs: EngineeringRequirement[] = [
    {
      id: 'req-mech-mass',
      category: 'mechanical',
      name: 'Maximum Assembly Mass',
      nominalValue: input.maxMassKg,
      unit: 'kg',
      source: 'user',
    },
  ];

  if (vol !== null) {
    reqs.push({
      id: 'req-mech-vol',
      category: 'mechanical',
      name: 'Maximum Enclosure Volume',
      nominalValue: Number(vol.toFixed(3)),
      unit: 'L',
      source: 'user',
    });
  }

  return {
    constraints: reqs,
    calculatedVolumeLiters: vol !== null ? Number(vol.toFixed(3)) : null,
  };
}

/** 7. Component Constraint & Derating Definition */
export function specifyComponentConstraints(input: ComponentConstraintInput): {
  deratedVoltageLimitVolts: number;
  deratedCurrentLimitAmps: number;
} {
  const vFactor = input.deratingFactorVoltage ?? 0.80;
  const iFactor = input.deratingFactorCurrent ?? 0.75;

  if (input.maxVoltageRatingVolts <= 0 || input.maxCurrentRatingAmps <= 0) {
    throw new Error('Component ratings must be strictly positive.');
  }

  return {
    deratedVoltageLimitVolts: Number((input.maxVoltageRatingVolts * vFactor).toFixed(2)),
    deratedCurrentLimitAmps: Number((input.maxCurrentRatingAmps * iFactor).toFixed(2)),
  };
}

/** 8. Design Margin Configuration */
export function configureDesignMargins(input: DesignMarginConfigInput): EngineeringRequirement[] {
  return [
    {
      id: 'margin-cfg-voltage',
      category: 'margin',
      name: 'Target Voltage Engineering Design Margin',
      nominalValue: input.voltageMarginPercent,
      unit: '%',
      source: 'user',
      description: 'Standard engineering design margin; not safety certification.',
    },
    {
      id: 'margin-cfg-current',
      category: 'margin',
      name: 'Target Current Engineering Design Margin',
      nominalValue: input.currentMarginPercent,
      unit: '%',
      source: 'user',
    },
    {
      id: 'margin-cfg-power',
      category: 'margin',
      name: 'Target Power Engineering Design Margin',
      nominalValue: input.powerMarginPercent,
      unit: '%',
      source: 'user',
    },
    {
      id: 'margin-cfg-thermal',
      category: 'margin',
      name: 'Target Thermal Headroom Margin',
      nominalValue: input.thermalMarginCelsius,
      unit: '°C',
      source: 'user',
    },
  ];
}

/** 9. Requirement Consistency Checker */
export function checkRequirementConsistency(
  electrical?: ElectricalRequirementInput,
  power?: PowerRequirementInput,
  thermal?: ThermalRequirementInput,
  environmental?: EnvironmentalRequirementInput
): ConsistencyCheckResult {
  const violations: string[] = [];
  const warnings: WorkflowWarning[] = [];

  if (electrical) {
    if (electrical.minimumVoltage > electrical.nominalVoltage) {
      violations.push(`Minimum voltage (${electrical.minimumVoltage}V) cannot exceed nominal voltage (${electrical.nominalVoltage}V).`);
    }
    if (electrical.nominalVoltage > electrical.maximumVoltage) {
      violations.push(`Nominal voltage (${electrical.nominalVoltage}V) cannot exceed maximum voltage (${electrical.maximumVoltage}V).`);
    }
    if (electrical.continuousCurrentAmps <= 0) {
      violations.push('Continuous current must be strictly positive.');
    }
    if (electrical.peakCurrentAmps < electrical.continuousCurrentAmps) {
      violations.push('Peak current cannot be less than continuous current.');
    }
  }

  if (power && electrical) {
    // Check dimensional consistency P_calc = V_nom * I_cont
    const expectedP = electrical.nominalVoltage * electrical.continuousCurrentAmps;
    const ratio = power.continuousPowerWatts / expectedP;
    if (ratio < 0.2 || ratio > 5.0) {
      warnings.push({
        id: 'warn-pwr-elec-mismatch',
        severity: 'warning',
        category: 'power',
        message: `Specified continuous power (${power.continuousPowerWatts}W) deviates substantially from nominal V · I product (${expectedP.toFixed(1)}W). Verify conversion stage or load assumptions.`,
      });
    }
  }

  if (thermal && environmental) {
    if (environmental.maximumTemperatureCelsius > thermal.maxAmbientTemperatureCelsius) {
      violations.push(`Environmental max ambient (${environmental.maximumTemperatureCelsius}°C) exceeds thermal budget max ambient (${thermal.maxAmbientTemperatureCelsius}°C).`);
    }
    if (thermal.maxAmbientTemperatureCelsius >= thermal.maxJunctionTemperatureCelsius) {
      violations.push(`Max ambient (${thermal.maxAmbientTemperatureCelsius}°C) is >= max junction temperature (${thermal.maxJunctionTemperatureCelsius}°C), leaving zero thermal headroom.`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
  };
}

/** 10. Engineering Requirement Summary */
export function generateRequirementSummary(requirements: EngineeringRequirement[]): {
  totalRequirementsCount: number;
  categoryBreakdown: Record<string, number>;
  summaryText: string;
} {
  const breakdown: Record<string, number> = {};
  requirements.forEach((r) => {
    breakdown[r.category] = (breakdown[r.category] ?? 0) + 1;
  });

  const text = requirements
    .map((r) => `• [${r.category.toUpperCase()}] ${r.name}: ${r.nominalValue} ${r.unit}${r.description ? ` (${r.description})` : ''}`)
    .join('\n');

  return {
    totalRequirementsCount: requirements.length,
    categoryBreakdown: breakdown,
    summaryText: text,
  };
}
