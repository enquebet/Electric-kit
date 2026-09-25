/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Module: Requirement-to-Calculation Traceability (Capability 57)
 */

import { TraceabilityStep, EngineeringMargin } from './types';

export class TraceabilityRegister {
  private steps: TraceabilityStep[] = [];

  public record(step: TraceabilityStep): void {
    this.steps.push(step);
  }

  public getByRequirement(requirementId: string): TraceabilityStep[] {
    return this.steps.filter((s) => s.requirementId === requirementId);
  }

  public getAll(): TraceabilityStep[] {
    return [...this.steps];
  }

  public clear(): void {
    this.steps = [];
  }

  public createMargin(
    parameter: string,
    required: number,
    availableOrCalculated: number,
    unit: string,
    mode: 'higher_is_better' | 'lower_is_better' = 'higher_is_better'
  ): EngineeringMargin {
    if (required === 0 && availableOrCalculated === 0) {
      return {
        parameter,
        requiredValue: 0,
        availableOrCalculatedValue: 0,
        marginAbsolute: 0,
        marginPercent: 0,
        unit,
        isSatisfied: true,
        statusText: 'SATISFIED',
      };
    }

    let isSatisfied = false;
    let marginAbs = 0;
    let marginPct = 0;
    let utilPct = 0;

    if (mode === 'higher_is_better') {
      // available must be >= required (e.g. current rating, capacity, voltage withstand)
      isSatisfied = availableOrCalculated >= required;
      marginAbs = availableOrCalculated - required;
      marginPct = required > 0 ? (marginAbs / required) * 100 : 0;
      utilPct = availableOrCalculated > 0 ? (required / availableOrCalculated) * 100 : 0;
    } else {
      // calculated must be <= required (e.g. temperature rise, voltage ripple, power dissipation)
      isSatisfied = availableOrCalculated <= required;
      marginAbs = required - availableOrCalculated;
      marginPct = required > 0 ? (marginAbs / required) * 100 : 0;
      utilPct = required > 0 ? (availableOrCalculated / required) * 100 : 0;
    }

    let statusText: 'SATISFIED' | 'TIGHT_MARGIN' | 'VIOLATED' = 'SATISFIED';
    if (!isSatisfied) {
      statusText = 'VIOLATED';
    } else if (marginPct < 15.0) {
      statusText = 'TIGHT_MARGIN';
    }

    return {
      parameter,
      requiredValue: Number(required.toFixed(3)),
      availableOrCalculatedValue: Number(availableOrCalculated.toFixed(3)),
      marginAbsolute: Number(marginAbs.toFixed(3)),
      marginPercent: Number(marginPct.toFixed(2)),
      utilizationPercent: Number(utilPct.toFixed(2)),
      unit,
      isSatisfied,
      statusText,
    };
  }
}

export const globalTraceabilityRegister = new TraceabilityRegister();
