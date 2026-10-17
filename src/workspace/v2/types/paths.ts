/**
 * ElectroKit V2 — Engineering Object Model
 * Reusable Power Paths, Signal Paths, Thermal Paths, Operating Conditions & References
 */

export type ReferenceType =
  | 'datasheet'
  | 'application_note'
  | 'standard'
  | 'manufacturer_page'
  | 'internal_document'
  | 'measurement_record'
  | 'external_reference';

export interface EngineeringReferenceV2 {
  id: string; // ref_...
  type: ReferenceType;
  title: string;
  publisher?: string; // e.g. "Texas Instruments", "EPC", "IEEE"
  identifier?: string; // e.g. "SLVSC21", "EPC2045", "IPC-2152"
  url?: string;
  revision?: string; // e.g. "Rev B", "2019"
  date?: string; // e.g. "2023-04-15"
  notes?: string;
  manufacturerPartNumber?: string;
  componentIds?: string[];
}

export interface OperatingConditionV2 {
  id: string; // cond_...
  name: string; // e.g. "Nominal Room Temp", "Worst Case High Temp"
  ambientTemperatureC?: number;
  junctionTemperatureC?: number;
  inputVoltageV?: number;
  loadCurrentA?: number;
  frequencyHz?: number;
  airflowLfm?: number;
  stateOfChargePercent?: number;
  ambientPressureKpa?: number;
  notes?: string;
}

export interface PowerPathV2 {
  id: string; // ppath_...
  name: string; // e.g. "Main 24V to 3.3V Core Rail"
  description?: string;
  sourceComponentId: string; // e.g. comp_... (Battery, Wall Adapter, DC Jack)
  stageComponentIds: string[]; // e.g. [comp_..., comp_...] (Fuse, Reverse FET, Buck, Inductor)
  destinationComponentId: string; // e.g. comp_... (MCU Core, Load Resistor)
  associatedRailId?: string; // rail_...
  requirements?: string[]; // IDs of linked requirements (e.g. req_...)
  calculationIds?: string[]; // IDs of linked calculation instances (calc_...)
  snapshotIds?: string[]; // IDs of historical calculation snapshots (snap_...)
  expectedEfficiencyPercent?: number;
  maxCurrentAmps?: number;
  notes?: string;
}

export type SignalPathType =
  | 'digital_high_speed'
  | 'digital_low_speed'
  | 'analog_low_level'
  | 'rf'
  | 'differential'
  | 'clock'
  | 'bus'
  | 'other';

export interface SignalPathV2 {
  id: string; // spath_...
  name: string; // e.g. "SPI Master Bus", "Analog Sensor Channel 1"
  description?: string;
  sourceComponentId: string; // e.g. comp_... (RTD Temp Sensor, Transceiver)
  stageComponentIds: string[]; // e.g. [comp_...] (RC Filter, Instrumentation Amp, ADC)
  destinationComponentId: string; // e.g. comp_... (MCU SPI Peripheral)
  netIds: string[]; // net_...
  signalType: SignalPathType;
  frequencyHz?: number;
  direction: 'unidirectional' | 'bidirectional';
  requirements?: string[]; // req_...
  notes?: string;
}

export interface ThermalPathV2 {
  id: string; // thpath_...
  name: string; // e.g. "Q1 Junction to Ambient Path"
  description?: string;
  sourceNodeOrComponentId: string; // e.g. comp_... or thnode_... (MOSFET Q1 Junction)
  stageIds: string[]; // e.g. [thnode_..., thnode_...] (Leadframe, Thermal Pad, PCB Thermal Vias, Heatsink)
  destinationNodeOrComponentId: string; // e.g. Ambient Air node
  thermalInterfaceMaterial?: string; // e.g. "Bergquist Gap Pad 0.5mm"
  totalResistanceCPerW?: number;
  conditions?: Record<string, any>;
  relatedComponentIds?: string[]; // comp_...
  notes?: string;
}
