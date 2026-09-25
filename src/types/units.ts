export type QuantityType =
  | 'voltage'
  | 'current'
  | 'resistance'
  | 'power'
  | 'apparent_power'
  | 'reactive_power'
  | 'capacitance'
  | 'inductance'
  | 'frequency'
  | 'wavelength'
  | 'time'
  | 'energy'
  | 'charge'
  | 'temperature'
  | 'duty_cycle'
  | 'ratio_db'
  | 'rotational_speed'
  | 'torque'
  | 'length'
  | 'area'
  | 'dimensionless';

export interface Prefix {
  symbol: string;
  factor: number;
  name: string;
}

export interface Unit {
  symbol: string;
  name: string;
  quantity: QuantityType;
  factorToBase: number; // Multiplied to get standard SI unit (e.g., mV -> 0.001)
  isBase?: boolean;
}

export interface FormattedValue {
  value: number;
  formatted: string;
  unit: string;
  fullString: string;
}
