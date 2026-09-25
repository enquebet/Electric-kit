import { Prefix } from '../../types/units';

export const SI_PREFIXES: Prefix[] = [
  { symbol: 'T', factor: 1e12, name: 'tera' },
  { symbol: 'G', factor: 1e9, name: 'giga' },
  { symbol: 'M', factor: 1e6, name: 'mega' },
  { symbol: 'k', factor: 1e3, name: 'kilo' },
  { symbol: '', factor: 1, name: 'base' },
  { symbol: 'm', factor: 1e-3, name: 'milli' },
  { symbol: 'µ', factor: 1e-6, name: 'micro' },
  { symbol: 'n', factor: 1e-9, name: 'nano' },
  { symbol: 'p', factor: 1e-12, name: 'pico' },
  { symbol: 'f', factor: 1e-15, name: 'femto' },
];
