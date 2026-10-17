/**
 * ElectroKit V2 — Architecture & Engineering Data Model
 * Engineering Systems, Subsystems & Multi-Domain System Architectures
 */

export type SystemDomain =
  | 'power'
  | 'thermal'
  | 'battery'
  | 'rf'
  | 'pcb'
  | 'embedded'
  | 'mixed_signal'
  | 'multi_domain';

export type PowerRailType =
  | 'regulated_dc'
  | 'unregulated_dc'
  | 'ac_mains'
  | 'battery_bus'
  | 'analog_quiet'
  | 'rf_clean'
  | 'auxiliary';

export interface PowerRailV2 {
  id: string; // rail_...
  name: string; // e.g. "VCC_3V3", "VBAT_12V", "VDD_CORE_1V0"
  type: PowerRailType;
  nominalVoltage: number;
  minVoltage: number;
  maxVoltage: number;
  maxCurrentAmps: number;
  currentLimitAmps?: number;
  powerLimitWatts?: number;
  quiescentCurrentMicroAmps?: number;
  targetRippleMilliVolts?: number;
  sourceConverterId?: string; // id of converter supplying this rail
  source?: string; // source description/id
  loadIds?: string[]; // IDs of components or subsystems powered by this rail
  netReferences?: string[]; // IDs of associated nets
  requirements?: string[]; // IDs of satisfied requirements
  notes?: string;
}

export type ConverterTopology =
  | 'buck'
  | 'boost'
  | 'buck_boost'
  | 'ldo'
  | 'flyback'
  | 'charge_pump'
  | 'sepic'
  | 'inverter';

export interface PowerConversionStageV2 {
  id: string; // conv_...
  name: string;
  topology: ConverterTopology;
  inputRailId: string;
  outputRailId: string;
  expectedEfficiencyPercent: number;
  maxOutputCurrentAmps: number;
  switchingFrequencyKhz?: number;
  quiescentCurrentMicroAmps?: number;
  thermalDissipationWatts?: number;
  associatedComponentIds?: string[];
  associatedCalculationId?: string;
}

export interface PowerArchitectureV2 {
  rails: PowerRailV2[];
  conversionStages: PowerConversionStageV2[];
  totalPayloadPowerWatts: number;
  totalInputPowerWatts: number;
  cascadedEfficiencyPercent: number;
  batteryBusRailId?: string;
  notes?: string;
}

export type ThermalNodeClassification =
  | 'junction'
  | 'case'
  | 'heatsink'
  | 'pcb_copper_plane'
  | 'internal_air'
  | 'enclosure'
  | 'ambient';

export interface ThermalNodeV2 {
  id: string; // thnode_...
  name: string;
  classification: ThermalNodeClassification;
  heatDissipationWatts: number;
  maxAllowedTemperatureC: number;
  calculatedTemperatureC?: number;
  thermalMarginC?: number;
  associatedComponentId?: string;
}

export interface ThermalResistancePathV2 {
  id: string; // thpath_...
  fromNodeId: string;
  toNodeId: string;
  resistanceCPerW: number;
  interfaceMaterial?: string;
  notes?: string;
}

export interface ThermalSystemV2 {
  nodes: ThermalNodeV2[];
  resistancePaths: ThermalResistancePathV2[];
  ambientTemperatureC: number;
  maxEnclosureRiseC: number;
  enclosureSurfaceAreaCm2?: number;
  forcedAirVelocityLfm?: number;
  status: 'conservative' | 'marginal' | 'violation' | 'unmodeled';
}

export type BatteryChemistry =
  | 'li_ion_nmc'
  | 'lifepo4'
  | 'li_po'
  | 'lto'
  | 'lead_acid'
  | 'nimh'
  | 'alkaline'
  | 'primary_lithium_socl2';

export interface BatterySystemV2 {
  chemistry: BatteryChemistry;
  seriesCount: number; // S
  parallelCount: number; // P
  cellNominalCapacityAh: number;
  packNominalVoltage: number;
  packCutoffVoltage: number;
  packFullChargeVoltage: number;
  packTotalEnergyWh: number;
  cellInternalResistanceMilliOhms: number;
  maxContinuousDischargeCurrentAmps: number;
  targetAutonomyHours: number;
  stateOfHealthPercent: number; // 100% fresh, 80% EOL
  operatingTemperatureC: number;
  deratingFactor: number; // accounting for temp & aging
  notes?: string;
}

export interface RfPortV2 {
  id: string; // rfport_...
  name: string;
  portType: 'antenna' | 'lna_input' | 'pa_output' | 'mixer' | 'filter' | 'transceiver_pin';
  impedanceOhms: number;
  nominalPowerDbm?: number;
  frequencyHz: number;
}

export interface RfSystemV2 {
  frequencyHz: number;
  bandwidthHz: number;
  ports: RfPortV2[];
  systemTargetImpedanceOhms: number; // standard 50Ω or 75Ω
  txPowerDbm?: number;
  rxSensitivityDbm?: number;
  linkMarginDb?: number;
  stackupDielectricConstant: number;
  notes?: string;
}

export interface SystemPcbLayerV2 {
  layerNumber: number;
  name: string;
  type: 'signal' | 'plane' | 'mixed' | 'dielectric';
  copperWeightOz?: number;
  thicknessMm: number;
  dielectricConstantDk?: number;
  dissipationFactorDf?: number;
}

export interface PcbSystemV2 {
  layerCount: number;
  layers: SystemPcbLayerV2[];
  boardThicknessMm: number;
  boardWidthMm: number;
  boardLengthMm: number;
  copperRoughnessUm?: number;
  ipcClass: 'class_1' | 'class_2' | 'class_3';
  pdnTargetImpedanceMilliOhms?: number;
  minTraceWidthMm?: number;
  minClearanceMm?: number;
  minViaDrillMm?: number;
  notes?: string;
}

export interface SubsystemV2 {
  id: string; // subsys_...
  parentSystemId: string;
  name: string;
  description: string;
  domain: SystemDomain;
  componentIds: string[];
  notes?: string;
}

export interface EngineeringSystemV2 {
  id: string; // sys_...
  name: string;
  description: string;
  primaryDomain: SystemDomain;
  subsystems: SubsystemV2[];
  powerArchitecture?: PowerArchitectureV2;
  thermalSystem?: ThermalSystemV2;
  batterySystem?: BatterySystemV2;
  rfSystem?: RfSystemV2;
  pcbSystem?: PcbSystemV2;
  createdAt: string;
  updatedAt: string;
}
