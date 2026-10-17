/**
 * ElectroKit V2 — Architecture & Engineering Data Model
 * Wave 03: Engineering Object Model — Components, Pins, Nets, Properties, Ratings, Connections
 */

export type ComponentCategory =
  | 'integrated_circuit'
  | 'microcontroller'
  | 'power_management'
  | 'passive_resistor'
  | 'passive_capacitor'
  | 'passive_inductor'
  | 'semiconductor_diode'
  | 'semiconductor_transistor'
  | 'connector'
  | 'battery_cell'
  | 'sensor'
  | 'rf_frontend'
  | 'heatsink'
  | 'crystal_oscillator'
  | 'protection_device'
  // Common object model category groups
  | 'passive'
  | 'active'
  | 'ic'
  | 'semiconductor'
  | 'actuator'
  | 'power'
  | 'battery'
  | 'mechanical'
  | 'thermal'
  | 'rf'
  | 'other';

export type ComponentLifecycleStatus =
  | 'concept'
  | 'selected'
  | 'procured'
  | 'tested'
  | 'qualified'
  | 'obsolete'
  | 'draft'
  | 'active'
  | 'review'
  | 'validated'
  | 'archived';

export type PinType =
  | 'power'
  | 'ground'
  | 'digital_in'
  | 'digital_out'
  | 'digital_io'
  | 'analog_in'
  | 'analog_out'
  | 'passive'
  | 'rf'
  | 'no_connect'
  | 'clock'
  | 'control'
  | 'mechanical'
  | 'other';

export type PinDirection =
  | 'in'
  | 'out'
  | 'bidirectional'
  | 'passive'
  | 'power'
  | 'ground'
  | 'unspecified';

export type PinDomain =
  | 'power'
  | 'ground'
  | 'analog'
  | 'digital'
  | 'clock'
  | 'rf'
  | 'control'
  | 'passive'
  | 'mechanical'
  | 'other';

export type PinElectricalRole =
  | 'input'
  | 'output'
  | 'bidirectional'
  | 'power_supply'
  | 'power_ground'
  | 'passive'
  | 'control'
  | 'clock'
  | 'high_impedance'
  | 'nc';

export interface ComponentPinV2 {
  id: string; // pin_...
  pinNumber: string | number;
  name: string;
  type: PinType;
  direction?: PinDirection;
  domain?: PinDomain;
  description?: string;
  electricalRole?: PinElectricalRole;
  netId?: string; // net_...
  voltageRatingV?: number;
  currentRatingA?: number;
  metadata?: Record<string, any>;
  notes?: string;
}

export type RatingType =
  | 'absolute_maximum'
  | 'recommended_operating'
  | 'typical'
  | 'minimum'
  | 'maximum';

export interface ComponentRatingV2 {
  id: string; // rat_...
  parameter: string; // e.g. "Vds_max", "Id_continuous", "PowerDissipation"
  value: number;
  unit: string; // e.g. "V", "A", "W", "°C"
  ratingType: RatingType;
  condition?: string; // e.g. "TJ = 25°C, VGS = 10V"
  temperatureC?: number;
  source?: string; // e.g. "Datasheet Rev 3.2, Table 4"
  isGuaranteed?: boolean;
  notes?: string;
}

export interface ParametricRatingV2 {
  parameter: string; // e.g. "Resistance", "Capacitance", "Inductance", "RDS(on)", "V_ds_max"
  value: number | string;
  unit: string;
  min?: number;
  max?: number;
  typical?: number;
  testCondition?: string;
}

export interface ParametricPropertyV2 {
  name: string;
  value: number;
  unit: string;
  nominal?: number;
  minimum?: number;
  maximum?: number;
  tolerancePercent?: number;
  condition?: string;
  source?: string;
}

export interface ElectricalPropertiesV2 {
  nominalVoltageV?: number;
  maxVoltageV?: number;
  nominalCurrentA?: number;
  maxCurrentA?: number;
  powerWatts?: number;
  resistanceOhms?: number;
  capacitanceFarads?: number;
  inductanceHenries?: number;
  frequencyHz?: number;
  impedanceOhms?: number;
  tolerancePercent?: number;
}

export interface ThermalPropertiesV2 {
  rThetaJC?: number; // °C/W
  rThetaJA?: number; // °C/W
  rThetaJB?: number; // °C/W
  maxJunctionTempC?: number;
  caseTemperatureC?: number;
  typicalPowerDissipationWatts?: number;
  temperatureCoefficientPpm?: number;
}

export interface PhysicalPropertiesV2 {
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  massGrams?: number;
  package?: string; // e.g. "0805", "SOIC-8", "TO-220"
  mountingType?: 'smd' | 'through_hole' | 'chassis' | 'other';
}

export interface RfPropertiesV2 {
  frequencyMinHz?: number;
  frequencyMaxHz?: number;
  impedanceOhms?: number;
  gainDb?: number;
  noiseFigureDb?: number;
  returnLossDb?: number;
  isolationDb?: number;
}

export interface BatteryPropertiesV2 {
  chemistry?: string;
  nominalVoltageV?: number;
  capacityAh?: number;
  internalResistanceOhms?: number;
  seriesCount?: number;
  parallelCount?: number;
  maxContinuousDischargeA?: number;
}

export interface ComponentPropertyGroupsV2 {
  electrical?: ElectricalPropertiesV2;
  thermal?: ThermalPropertiesV2;
  physical?: PhysicalPropertiesV2;
  rf?: RfPropertiesV2;
  battery?: BatteryPropertiesV2;
}

export interface EngineeringComponentV2 {
  id: string; // comp_...
  refDes: string; // e.g. "U1", "R1", "C12", "Q4", "L2", "BAT1"
  name: string;
  category: ComponentCategory;
  subcategory?: string;
  description: string;
  manufacturer?: string;
  partNumber?: string;
  manufacturerPartNumber?: string; // alias to partNumber
  packageType?: string; // e.g. "0805", "QFN-32", "SOIC-8", "TO-220", "18650"
  package?: string; // alias to packageType
  datasheetUrl?: string;
  status: ComponentLifecycleStatus;
  lifecycleStatus?: ComponentLifecycleStatus; // alias to status
  parametricRatings: Record<string, ParametricRatingV2>;
  ratings?: ComponentRatingV2[]; // Structured ratings array
  propertyGroups?: ComponentPropertyGroupsV2; // Domain-typed property groups
  pins: ComponentPinV2[];
  thermalProperties?: ThermalPropertiesV2;
  references?: string[]; // IDs of associated EngineeringReferenceV2
  subsystemId?: string;
  costEstimateUsd?: number;
  metadata?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type NetClass =
  | 'power_rail'
  | 'ground'
  | 'analog'
  | 'high_speed_digital'
  | 'general_io'
  | 'rf_line'
  | 'sense';

export type NetDomain =
  | 'power'
  | 'ground'
  | 'analog'
  | 'digital'
  | 'rf'
  | 'thermal'
  | 'mechanical'
  | 'other';

export interface EngineeringNetV2 {
  id: string; // net_...
  name: string; // e.g. "GND", "+3V3", "I2C_SDA", "SW_NODE"
  netClass: NetClass;
  domain?: NetDomain;
  description?: string;
  nominalVoltage?: number;
  maxCurrentAmps?: number;
  targetImpedanceOhms?: number;
  railId?: string; // link to PowerRailV2 if power_rail
  pinIds?: string[]; // pin_... connected to this net
  connectionIds?: string[]; // conn_... routed along this net
  properties?: Record<string, any>;
  references?: string[]; // ref_...
  notes?: string;
}

export type ConnectionType =
  | 'schematic_wire'
  | 'pcb_trace'
  | 'differential_pair'
  | 'cable_wire'
  | 'thermal_interface'
  | 'bus'
  | 'power'
  | 'signal'
  | 'rf'
  | 'mechanical'
  | 'logical'
  | 'other';

export interface EngineeringConnectionV2 {
  id: string; // conn_...
  netId: string;
  name?: string;
  connectionType: ConnectionType;
  sourceComponentId: string;
  sourcePinId?: string;
  sourceId?: string; // generic source reference
  targetComponentId: string;
  targetPinId?: string;
  targetId?: string; // generic target reference
  direction?: 'unidirectional' | 'bidirectional';
  description?: string;
  properties?: Record<string, any>;
  traceLengthMm?: number;
  traceWidthMm?: number;
  notes?: string;
}
