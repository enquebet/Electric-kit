/**
 * ElectroKit — Phase 12 Engineering Design, System Analysis & Workflows
 * Module: Engineering Assumption Register (Capability 58)
 */

import { EngineeringAssumption, ModelClassification } from './types';

export class AssumptionRegister {
  private assumptions: Map<string, EngineeringAssumption> = new Map();

  constructor() {
    this.seedDefaultAssumptions();
  }

  public register(assumption: EngineeringAssumption): void {
    this.assumptions.set(assumption.id, assumption);
  }

  public get(id: string): EngineeringAssumption | undefined {
    return this.assumptions.get(id);
  }

  public getAll(): EngineeringAssumption[] {
    return Array.from(this.assumptions.values());
  }

  public getByWorkflow(workflow: string): EngineeringAssumption[] {
    return this.getAll().filter((a) => a.applicableWorkflow === workflow || a.applicableWorkflow === 'all');
  }

  public getByClassification(classification: ModelClassification): EngineeringAssumption[] {
    return this.getAll().filter((a) => a.classification === classification);
  }

  private seedDefaultAssumptions(): void {
    const defaults: EngineeringAssumption[] = [
      {
        id: 'asm-converter-efficiency',
        parameter: 'Converter Stage Efficiency',
        value: '92% (nominal DC-DC)',
        unit: '%',
        classification: 'User-defined assumption',
        description: 'Power converter efficiency depends on inductor DCR, MOSFET Rdson, switching frequency, and duty cycle. Requires manufacturer datasheet curves.',
        isUserConfigurable: true,
        applicableWorkflow: 'power',
      },
      {
        id: 'asm-battery-voltage-plateau',
        parameter: 'Battery Operating Voltage',
        value: 'Midpoint Nominal Plateau',
        unit: 'V',
        classification: 'Idealized model',
        description: 'Assumes linear or plateau midpoint discharge voltage rather than continuous non-linear electrochemical potential tracking.',
        isUserConfigurable: true,
        applicableWorkflow: 'battery',
      },
      {
        id: 'asm-thermal-1d-conduction',
        parameter: 'Thermal Resistance Network Model',
        value: 'Lumped 1D Series Conduction',
        unit: '°C/W',
        classification: 'Idealized model',
        description: '1D lumped parameter thermal model (T = Ta + P · θJA). Spreading resistance and 3D boundary layer gradients are simplified.',
        isUserConfigurable: false,
        applicableWorkflow: 'thermal',
      },
      {
        id: 'asm-copper-resistivity',
        parameter: 'PCB Annealed Copper Resistivity',
        value: 1.72e-8,
        unit: 'Ω·m',
        classification: 'Reference estimate',
        description: 'Standard annealed copper at 20°C with temperature coefficient α = 0.00393/°C per IPC-2152 standard.',
        isUserConfigurable: false,
        applicableWorkflow: 'pcb',
      },
      {
        id: 'asm-dielectric-fr4',
        parameter: 'FR-4 Dielectric Constant (Dk/εr)',
        value: 4.4,
        unit: 'relative',
        classification: 'Reference estimate',
        description: 'Standard FR-4 glass-epoxy laminate effective permittivity at 1 GHz. Varies with resin content and frequency.',
        isUserConfigurable: true,
        applicableWorkflow: 'pcb',
      },
      {
        id: 'asm-joule-heating',
        parameter: 'Joule Dissipation P = I²R',
        value: 'Exact Ohm-Joule Relation',
        unit: 'W',
        classification: 'Exact mathematical relationship',
        description: 'Fundamental thermodynamic resistive energy conversion.',
        isUserConfigurable: false,
        applicableWorkflow: 'all',
      },
    ];

    defaults.forEach((d) => this.register(d));
  }
}

export const globalAssumptionRegister = new AssumptionRegister();
