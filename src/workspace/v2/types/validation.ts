/**
 * ElectroKit V2 — Architecture & Engineering Data Model
 * Hardware Validation, Lab Measurements, and Tolerance Bounds
 */

export type ValidationCategoryV2 =
  | 'electrical_dc'
  | 'power_efficiency'
  | 'thermal_ambient'
  | 'thermal_hotspot'
  | 'battery_runtime'
  | 'battery_impedance'
  | 'signal_integrity'
  | 'rf_s_parameters'
  | 'pcb_trace_temp'
  | 'compliance_emc';

export type MeasurementVerdict = 'pass' | 'warning' | 'fail' | 'untested';

export interface EngineeringMeasurementV2 {
  id: string; // meas_...
  testPoint: string; // e.g. "TP_3V3", "TP_SW_NODE", "TP_BATT+"
  parameter: string; // e.g. "Output Voltage", "Peak Inductor Current", "Max Case Temp"
  nominalExpected: number;
  measuredValue: number;
  unit: string;
  toleranceAbsolute?: number;
  tolerancePercent?: number;
  deltaAbsolute: number; // |measured - expected|
  deltaPercent: number; // (|measured - expected| / expected) * 100
  verdict: MeasurementVerdict;
  instrument?: string; // e.g. "Keysight InfiniiVision 3000X", "Fluke 87V"
  instrumentCalibrationDate?: string;
  measurementMethod: string;
  ambientTemperatureC?: number;
  operator?: string;
  timestamp: string;
  associatedRequirementId?: string;
  associatedCalculationId?: string;
  notes?: string;
}

export interface DatasheetVerificationV2 {
  id: string; // dsver_...
  componentId: string;
  componentRef: string;
  parameter: string;
  datasheetMin?: number | string;
  datasheetTyp?: number | string;
  datasheetMax?: number | string;
  unit: string;
  manufacturer: string;
  partNumber: string;
  datasheetUrl?: string;
  verifiedBy: string;
  verifiedAt: string;
  status: 'verified' | 'unverified' | 'discrepancy_flagged';
  notes?: string;
}

export interface ValidationMilestoneV2 {
  id: string; // val_...
  title: string;
  category: ValidationCategoryV2;
  status: 'unvalidated' | 'in_progress' | 'passed' | 'failed' | 'waived';
  hardwareValidationRequired: boolean;
  assignedEngineer?: string;
  targetCompletionDate?: string;
  verifiedAt?: string;
  associatedRequirementIds: string[];
  associatedMeasurementIds: string[];
  notes?: string;
}
