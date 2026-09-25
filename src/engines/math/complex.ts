/**
 * Complex Number & Euler Form Calculation Engine
 * 
 * Implements:
 * 9. Rectangular ↔ Polar Complex Converter
 * 10. Complex Addition
 * 11. Complex Subtraction
 * 12. Complex Multiplication
 * 13. Complex Division
 * 14. Complex Magnitude & Phase (degrees and radians)
 * 15. Complex Conjugate
 * 16. Complex Power / Exponent (De Moivre's theorem & general power)
 * 17. Euler Exponential Form Converter (r · e^(jθ))
 */

import { CalculationStep } from '../../types/tool';
import {
  ComplexNumber,
  PolarForm,
  rectangularToPolar,
  polarToRectangular,
} from '../rf/phasor-signals';

// Re-export core types for shared engineering mathematics
export type { ComplexNumber, PolarForm };
export { rectangularToPolar, polarToRectangular };

export interface ComplexEulerForm {
  magnitude: number;
  phaseRad: number;
  phaseDeg: number;
  eulerString: string;
  polarString: string;
  rectangularString: string;
}

export function complexAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    real: a.real + b.real,
    imag: a.imag + b.imag,
  };
}

export function complexSub(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    real: a.real - b.real,
    imag: a.imag - b.imag,
  };
}

export function complexMul(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  // (a + jb)(c + jd) = (ac - bd) + j(ad + bc)
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  };
}

export function complexDiv(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  // (a + jb) / (c + jd) = ((ac + bd) + j(bc - ad)) / (c^2 + d^2)
  const denom = b.real * b.real + b.imag * b.imag;
  if (denom === 0) {
    throw new Error('Complex division by zero: denominator magnitude |B| is 0');
  }
  return {
    real: (a.real * b.real + a.imag * b.imag) / denom,
    imag: (a.imag * b.real - a.real * b.imag) / denom,
  };
}

export function complexMagnitude(a: ComplexNumber): number {
  return Math.hypot(a.real, a.imag);
}

export function complexPhase(a: ComplexNumber, returnDegrees = true): number {
  const rad = Math.atan2(a.imag, a.real);
  return returnDegrees ? (rad * 180) / Math.PI : rad;
}

export function complexConjugate(a: ComplexNumber): ComplexNumber {
  return {
    real: a.real,
    imag: -a.imag,
  };
}

/**
 * Complex Power z^n using De Moivre's theorem:
 * z = r · e^(jθ) => z^n = r^n · e^(j·nθ) = r^n (cos(nθ) + j sin(nθ))
 */
export function complexPower(a: ComplexNumber, power: number): ComplexNumber {
  if (power === 0) {
    return { real: 1, imag: 0 };
  }
  const r = complexMagnitude(a);
  if (r === 0) {
    if (power < 0) throw new Error('Cannot raise 0 to a negative power in complex field');
    return { real: 0, imag: 0 };
  }
  const theta = Math.atan2(a.imag, a.real);
  const rPowered = Math.pow(r, power);
  const angle = theta * power;

  return {
    real: rPowered * Math.cos(angle),
    imag: rPowered * Math.sin(angle),
  };
}

/**
 * Complex Exponential e^(a + jb) = e^a · (cos b + j sin b)
 */
export function complexExp(a: ComplexNumber): ComplexNumber {
  const expReal = Math.exp(a.real);
  return {
    real: expReal * Math.cos(a.imag),
    imag: expReal * Math.sin(a.imag),
  };
}

/**
 * Principal Complex Square Root √z
 */
export function complexSqrt(a: ComplexNumber): ComplexNumber {
  return complexPower(a, 0.5);
}

/**
 * Complex Natural Logarithm ln(z) = ln|z| + j·Arg(z)
 */
export function complexLn(a: ComplexNumber): ComplexNumber {
  const r = complexMagnitude(a);
  if (r === 0) throw new Error('Complex logarithm undefined at singularity z = 0');
  const theta = Math.atan2(a.imag, a.real);
  return {
    real: Math.log(r),
    imag: theta,
  };
}

/**
 * Formats a complex number to Euler form, polar form, and rectangular form
 */
export function toEulerForm(a: ComplexNumber): ComplexEulerForm {
  const magnitude = complexMagnitude(a);
  const phaseRad = Math.atan2(a.imag, a.real);
  const phaseDeg = (phaseRad * 180) / Math.PI;

  const magStr = magnitude.toFixed(4);
  const radStr = phaseRad.toFixed(4);
  const degStr = phaseDeg.toFixed(2);

  const sign = a.imag >= 0 ? '+' : '−';
  const absImag = Math.abs(a.imag).toFixed(4);
  const rectStr = `${a.real.toFixed(4)} ${sign} j${absImag}`;

  const eulerString = `${magStr} · e^(j · ${radStr} rad) [${magStr} · e^(j · ${degStr}°)]`;
  const polarString = `${magStr} ∠ ${degStr}°`;

  return {
    magnitude,
    phaseRad,
    phaseDeg,
    eulerString,
    polarString,
    rectangularString: rectStr,
  };
}

export function formatComplex(c: ComplexNumber, decimals = 4): string {
  const r = c.real.toFixed(decimals);
  const absI = Math.abs(c.imag).toFixed(decimals);
  if (c.imag >= 0) {
    return `${r} + j${absI}`;
  }
  return `${r} - j${absI}`;
}
