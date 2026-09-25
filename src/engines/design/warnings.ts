/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Module: Design Warning Aggregator (Capability 59)
 */

import { WorkflowWarning } from './types';

export class WarningAggregator {
  private warnings: WorkflowWarning[] = [];

  public add(warning: WorkflowWarning): void {
    if (!this.warnings.some((w) => w.id === warning.id)) {
      this.warnings.push(warning);
    }
  }

  public addBatch(warnings: WorkflowWarning[]): void {
    warnings.forEach((w) => this.add(w));
  }

  public getAll(): WorkflowWarning[] {
    return [...this.warnings];
  }

  public getBySeverity(severity: 'info' | 'warning' | 'critical'): WorkflowWarning[] {
    return this.warnings.filter((w) => w.severity === severity);
  }

  public getByCategory(category: WorkflowWarning['category']): WorkflowWarning[] {
    return this.warnings.filter((w) => w.category === category);
  }

  public getHardwareValidationRequired(): WorkflowWarning[] {
    return this.warnings.filter((w) => w.requiresHardwareValidation === true);
  }

  public clear(): void {
    this.warnings = [];
  }

  public hasCriticalViolations(): boolean {
    return this.warnings.some((w) => w.severity === 'critical');
  }
}

export const globalWarningAggregator = new WarningAggregator();
