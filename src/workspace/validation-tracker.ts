/**
 * ElectroKit — Phase 13 Engineering Workspace
 * Hardware Validation Tracker & Lab Measurement Engine
 */

import {
  ElectroKitProject,
  ValidationItem,
  ValidationStatus,
  MeasurementPlaceholder,
  ManufacturerPlaceholder,
} from './types';

export interface MeasurementComparisonResult {
  parameter: string;
  unit: string;
  calculatedValue: number;
  measuredValue: number;
  absoluteDelta: number;
  percentageError: number;
  isWithinTolerance: boolean;
  statusRemark: string;
}

export function addValidationItem(
  project: ElectroKitProject,
  title: string,
  category: ValidationItem['category'],
  hardwareValidationRequired: boolean = true,
  notes?: string
): ValidationItem {
  const item: ValidationItem = {
    id: 'val_' + Math.random().toString(36).substring(2, 8),
    title,
    category,
    status: 'Unvalidated',
    hardwareValidationRequired,
    notes,
  };
  project.validationItems.push(item);
  return item;
}

export function updateValidationItem(
  project: ElectroKitProject,
  itemId: string,
  updates: Partial<Omit<ValidationItem, 'id'>>
): boolean {
  const item = project.validationItems.find((i) => i.id === itemId);
  if (!item) return false;
  Object.assign(item, updates);
  if (updates.status === 'Hardware Validated' || updates.status === 'Manufacturer Data Verified') {
    item.verifiedAt = new Date().toISOString();
  }
  return true;
}

export function deleteValidationItem(project: ElectroKitProject, itemId: string): boolean {
  const idx = project.validationItems.findIndex((i) => i.id === itemId);
  if (idx < 0) return false;
  project.validationItems.splice(idx, 1);
  return true;
}

export function getValidationProgress(project: ElectroKitProject): {
  total: number;
  unvalidated: number;
  calculated: number;
  reviewed: number;
  hardwareValidated: number;
  verified: number;
  percentComplete: number;
} {
  const items = project.validationItems || [];
  const total = items.length;
  if (total === 0) {
    return {
      total: 0,
      unvalidated: 0,
      calculated: 0,
      reviewed: 0,
      hardwareValidated: 0,
      verified: 0,
      percentComplete: 0,
    };
  }

  let unval = 0;
  let calc = 0;
  let rev = 0;
  let hwVal = 0;
  let ver = 0;

  for (const item of items) {
    switch (item.status) {
      case 'Unvalidated':
        unval++;
        break;
      case 'Calculated':
        calc++;
        break;
      case 'Reviewed':
        rev++;
        break;
      case 'Hardware Validated':
        hwVal++;
        break;
      case 'Manufacturer Data Verified':
        ver++;
        break;
    }
  }

  // Hardware validated and manufacturer verified count as full, reviewed as 0.75, calculated as 0.4
  const weightedScore = (hwVal + ver) * 1.0 + rev * 0.75 + calc * 0.4;
  const percentComplete = Math.min(100, Math.round((weightedScore / total) * 100));

  return {
    total,
    unvalidated: unval,
    calculated: calc,
    reviewed: rev,
    hardwareValidated: hwVal,
    verified: ver,
    percentComplete,
  };
}

export function addMeasurement(
  project: ElectroKitProject,
  params: {
    testPoint: string;
    parameter: string;
    measuredValue: number | string;
    unit: string;
    measurementMethod: string;
    instrument?: string;
    tolerance?: string;
  }
): MeasurementPlaceholder {
  const measurement: MeasurementPlaceholder = {
    id: 'meas_' + Math.random().toString(36).substring(2, 8),
    testPoint: params.testPoint,
    parameter: params.parameter,
    measuredValue: params.measuredValue,
    unit: params.unit,
    measurementMethod: params.measurementMethod,
    instrument: params.instrument,
    tolerance: params.tolerance,
    timestamp: new Date().toISOString(),
  };
  project.measurements.push(measurement);
  return measurement;
}

export function compareMeasurementWithCalculated(
  calculatedValue: number,
  measuredValue: number,
  parameterName: string,
  unit: string,
  allowedTolerancePercent: number = 10.0
): MeasurementComparisonResult {
  const delta = measuredValue - calculatedValue;
  const absDelta = Math.abs(delta);
  // Safe percentage error calculation avoiding NaN/Infinity on zero-base
  let pctError = 0;
  if (calculatedValue !== 0) {
    pctError = (absDelta / Math.abs(calculatedValue)) * 100;
  } else {
    pctError = measuredValue === 0 ? 0 : 100;
  }
  // Boundary definition: equality (pctError === allowedTolerancePercent) is considered within tolerance
  const isWithin = pctError <= allowedTolerancePercent;

  let remark = '';
  if (pctError <= allowedTolerancePercent * 0.5) {
    remark = 'Excellent agreement with model (<5% deviation)';
  } else if (isWithin) {
    remark = `Acceptable correlation within allowable ±${allowedTolerancePercent}% tolerance (inclusive)`;
  } else {
    remark = `Discrepancy exceeds ±${allowedTolerancePercent}%! Check test setup, stray parasitics, or probe loading`;
  }

  return {
    parameter: parameterName,
    unit,
    calculatedValue,
    measuredValue,
    absoluteDelta: Number(absDelta.toFixed(4)),
    percentageError: Number(pctError.toFixed(2)),
    isWithinTolerance: isWithin,
    statusRemark: remark,
  };
}

export function addManufacturerPart(
  project: ElectroKitProject,
  params: {
    componentRef: string;
    parameter: string;
    value: number | string;
    unit: string;
    manufacturer: string;
    partNumber: string;
    datasheetUrl?: string;
  }
): ManufacturerPlaceholder {
  const entry: ManufacturerPlaceholder = {
    id: 'mfr_' + Math.random().toString(36).substring(2, 8),
    componentRef: params.componentRef,
    parameter: params.parameter,
    value: params.value,
    unit: params.unit,
    manufacturer: params.manufacturer,
    partNumber: params.partNumber,
    datasheetUrl: params.datasheetUrl,
    verified: false,
  };
  project.manufacturerData.push(entry);
  return entry;
}

export function setManufacturerVerification(
  project: ElectroKitProject,
  id: string,
  verified: boolean
): boolean {
  const part = project.manufacturerData.find((p) => p.id === id);
  if (!part) return false;
  part.verified = verified;
  return true;
}
