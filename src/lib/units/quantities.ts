import { QuantityType, Unit } from '../../types/units';

export const UNITS_REGISTRY: Record<QuantityType, Unit[]> = {
  voltage: [
    { symbol: 'µV', name: 'Microvolts', quantity: 'voltage', factorToBase: 1e-6 },
    { symbol: 'mV', name: 'Millivolts', quantity: 'voltage', factorToBase: 1e-3 },
    { symbol: 'V', name: 'Volts', quantity: 'voltage', factorToBase: 1, isBase: true },
    { symbol: 'kV', name: 'Kilovolts', quantity: 'voltage', factorToBase: 1e3 },
  ],
  current: [
    { symbol: 'nA', name: 'Nanoamperes', quantity: 'current', factorToBase: 1e-9 },
    { symbol: 'µA', name: 'Microamperes', quantity: 'current', factorToBase: 1e-6 },
    { symbol: 'mA', name: 'Milliamperes', quantity: 'current', factorToBase: 1e-3 },
    { symbol: 'A', name: 'Amperes', quantity: 'current', factorToBase: 1, isBase: true },
    { symbol: 'kA', name: 'Kiloamperes', quantity: 'current', factorToBase: 1e3 },
  ],
  resistance: [
    { symbol: 'mΩ', name: 'Milliohms', quantity: 'resistance', factorToBase: 1e-3 },
    { symbol: 'Ω', name: 'Ohms', quantity: 'resistance', factorToBase: 1, isBase: true },
    { symbol: 'kΩ', name: 'Kilohms', quantity: 'resistance', factorToBase: 1e3 },
    { symbol: 'MΩ', name: 'Megaohms', quantity: 'resistance', factorToBase: 1e6 },
  ],
  power: [
    { symbol: 'µW', name: 'Microwatts', quantity: 'power', factorToBase: 1e-6 },
    { symbol: 'mW', name: 'Milliwatts', quantity: 'power', factorToBase: 1e-3 },
    { symbol: 'W', name: 'Watts', quantity: 'power', factorToBase: 1, isBase: true },
    { symbol: 'kW', name: 'Kilowatts', quantity: 'power', factorToBase: 1e3 },
    { symbol: 'MW', name: 'Megawatts', quantity: 'power', factorToBase: 1e6 },
    { symbol: 'hp', name: 'Horsepower', quantity: 'power', factorToBase: 745.69987 },
  ],
  apparent_power: [
    { symbol: 'mVA', name: 'Millivolt-Amperes', quantity: 'apparent_power', factorToBase: 1e-3 },
    { symbol: 'VA', name: 'Volt-Amperes', quantity: 'apparent_power', factorToBase: 1, isBase: true },
    { symbol: 'kVA', name: 'Kilovolt-Amperes', quantity: 'apparent_power', factorToBase: 1e3 },
    { symbol: 'MVA', name: 'Megavolt-Amperes', quantity: 'apparent_power', factorToBase: 1e6 },
  ],
  reactive_power: [
    { symbol: 'mVAR', name: 'Milli Volt-Amperes Reactive', quantity: 'reactive_power', factorToBase: 1e-3 },
    { symbol: 'VAR', name: 'Volt-Amperes Reactive', quantity: 'reactive_power', factorToBase: 1, isBase: true },
    { symbol: 'kVAR', name: 'Kilovolt-Amperes Reactive', quantity: 'reactive_power', factorToBase: 1e3 },
    { symbol: 'MVAR', name: 'Megavolt-Amperes Reactive', quantity: 'reactive_power', factorToBase: 1e6 },
  ],
  capacitance: [
    { symbol: 'pF', name: 'Picofarads', quantity: 'capacitance', factorToBase: 1e-12 },
    { symbol: 'nF', name: 'Nanofarads', quantity: 'capacitance', factorToBase: 1e-9 },
    { symbol: 'µF', name: 'Microfarads', quantity: 'capacitance', factorToBase: 1e-6 },
    { symbol: 'mF', name: 'Millifarads', quantity: 'capacitance', factorToBase: 1e-3 },
    { symbol: 'F', name: 'Farads', quantity: 'capacitance', factorToBase: 1, isBase: true },
  ],
  inductance: [
    { symbol: 'nH', name: 'Nanohenries', quantity: 'inductance', factorToBase: 1e-9 },
    { symbol: 'µH', name: 'Microhenries', quantity: 'inductance', factorToBase: 1e-6 },
    { symbol: 'mH', name: 'Millihenries', quantity: 'inductance', factorToBase: 1e-3 },
    { symbol: 'H', name: 'Henries', quantity: 'inductance', factorToBase: 1, isBase: true },
  ],
  frequency: [
    { symbol: 'Hz', name: 'Hertz', quantity: 'frequency', factorToBase: 1, isBase: true },
    { symbol: 'kHz', name: 'Kilohertz', quantity: 'frequency', factorToBase: 1e3 },
    { symbol: 'MHz', name: 'Megahertz', quantity: 'frequency', factorToBase: 1e6 },
    { symbol: 'GHz', name: 'Gigahertz', quantity: 'frequency', factorToBase: 1e9 },
    { symbol: 'THz', name: 'Terahertz', quantity: 'frequency', factorToBase: 1e12 },
  ],
  wavelength: [
    { symbol: 'nm', name: 'Nanometers', quantity: 'wavelength', factorToBase: 1e-9 },
    { symbol: 'µm', name: 'Micrometers', quantity: 'wavelength', factorToBase: 1e-6 },
    { symbol: 'mm', name: 'Millimeters', quantity: 'wavelength', factorToBase: 1e-3 },
    { symbol: 'cm', name: 'Centimeters', quantity: 'wavelength', factorToBase: 1e-2 },
    { symbol: 'm', name: 'Meters', quantity: 'wavelength', factorToBase: 1, isBase: true },
    { symbol: 'km', name: 'Kilometers', quantity: 'wavelength', factorToBase: 1e3 },
  ],
  time: [
    { symbol: 'ps', name: 'Picoseconds', quantity: 'time', factorToBase: 1e-12 },
    { symbol: 'ns', name: 'Nanoseconds', quantity: 'time', factorToBase: 1e-9 },
    { symbol: 'µs', name: 'Microseconds', quantity: 'time', factorToBase: 1e-6 },
    { symbol: 'ms', name: 'Milliseconds', quantity: 'time', factorToBase: 1e-3 },
    { symbol: 's', name: 'Seconds', quantity: 'time', factorToBase: 1, isBase: true },
    { symbol: 'min', name: 'Minutes', quantity: 'time', factorToBase: 60 },
    { symbol: 'h', name: 'Hours', quantity: 'time', factorToBase: 3600 },
  ],
  energy: [
    { symbol: 'µJ', name: 'Microjoules', quantity: 'energy', factorToBase: 1e-6 },
    { symbol: 'mJ', name: 'Millijoules', quantity: 'energy', factorToBase: 1e-3 },
    { symbol: 'J', name: 'Joules', quantity: 'energy', factorToBase: 1, isBase: true },
    { symbol: 'kJ', name: 'Kilojoules', quantity: 'energy', factorToBase: 1e3 },
    { symbol: 'Wh', name: 'Watt-hours', quantity: 'energy', factorToBase: 3600 },
    { symbol: 'kWh', name: 'Kilowatt-hours', quantity: 'energy', factorToBase: 3.6e6 },
  ],
  charge: [
    { symbol: 'mAh', name: 'Milliampere-hours', quantity: 'charge', factorToBase: 3.6 },
    { symbol: 'Ah', name: 'Ampere-hours', quantity: 'charge', factorToBase: 3600 },
    { symbol: 'C', name: 'Coulombs', quantity: 'charge', factorToBase: 1, isBase: true },
  ],
  temperature: [
    { symbol: '°C', name: 'Degrees Celsius', quantity: 'temperature', factorToBase: 1, isBase: true },
    { symbol: 'K', name: 'Kelvin', quantity: 'temperature', factorToBase: 1 },
  ],
  duty_cycle: [
    { symbol: '%', name: 'Percent', quantity: 'duty_cycle', factorToBase: 0.01 },
    { symbol: 'ratio', name: 'Fraction (0-1)', quantity: 'duty_cycle', factorToBase: 1, isBase: true },
  ],
  ratio_db: [
    { symbol: 'dB', name: 'Decibels', quantity: 'ratio_db', factorToBase: 1, isBase: true },
  ],
  rotational_speed: [
    { symbol: 'rpm', name: 'Revolutions Per Minute', quantity: 'rotational_speed', factorToBase: 1, isBase: true },
    { symbol: 'rad/s', name: 'Radians per Second', quantity: 'rotational_speed', factorToBase: 60 / (2 * Math.PI) },
    { symbol: 'Hz', name: 'Hertz (rev/s)', quantity: 'rotational_speed', factorToBase: 60 },
  ],
  torque: [
    { symbol: 'N·m', name: 'Newton Meters', quantity: 'torque', factorToBase: 1, isBase: true },
    { symbol: 'kN·m', name: 'Kilonewton Meters', quantity: 'torque', factorToBase: 1000 },
    { symbol: 'lbf·ft', name: 'Pound-force Feet', quantity: 'torque', factorToBase: 1.355818 },
  ],
  length: [
    { symbol: 'mm', name: 'Millimeters', quantity: 'length', factorToBase: 0.001 },
    { symbol: 'm', name: 'Meters', quantity: 'length', factorToBase: 1, isBase: true },
    { symbol: 'km', name: 'Kilometers', quantity: 'length', factorToBase: 1000 },
    { symbol: 'ft', name: 'Feet', quantity: 'length', factorToBase: 0.3048 },
    { symbol: 'in', name: 'Inches', quantity: 'length', factorToBase: 0.0254 },
  ],
  area: [
    { symbol: 'mm²', name: 'Square Millimeters', quantity: 'area', factorToBase: 1e-6 },
    { symbol: 'cm²', name: 'Square Centimeters', quantity: 'area', factorToBase: 1e-4 },
    { symbol: 'm²', name: 'Square Meters', quantity: 'area', factorToBase: 1, isBase: true },
    { symbol: 'kcmil', name: 'Thousand Circular Mils', quantity: 'area', factorToBase: 0.5067075e-6 },
  ],
  dimensionless: [
    { symbol: '', name: 'Unitless', quantity: 'dimensionless', factorToBase: 1, isBase: true },
  ],
};

export function getUnit(quantity: QuantityType, symbol: string): Unit | undefined {
  return UNITS_REGISTRY[quantity]?.find(u => u.symbol === symbol);
}

export function toBaseUnit(value: number, quantity: QuantityType, unitSymbol: string): number {
  const unit = getUnit(quantity, unitSymbol);
  if (!unit) return value;
  return value * unit.factorToBase;
}

export function fromBaseUnit(baseValue: number, quantity: QuantityType, targetUnitSymbol: string): number {
  const unit = getUnit(quantity, targetUnitSymbol);
  if (!unit || unit.factorToBase === 0) return baseValue;
  return baseValue / unit.factorToBase;
}
