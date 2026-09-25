import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatSignificantFigures } from '../../lib/units/formatter';

export interface ComplexNumber {
  real: number;
  imag: number;
}

export interface PolarForm {
  magnitude: number;
  phaseDeg: number;
  phaseRad: number;
}

/** Converts rectangular a + jb to polar r ∠ θ */
export function rectangularToPolar(real: number, imag: number): PolarForm {
  const magnitude = Math.hypot(real, imag);
  const phaseRad = Math.atan2(imag, real);
  const phaseDeg = (phaseRad * 180) / Math.PI;
  return { magnitude, phaseDeg, phaseRad };
}

/** Converts polar r ∠ θ (degrees) to rectangular a + jb */
export function polarToRectangular(magnitude: number, phaseDeg: number): ComplexNumber {
  const phaseRad = (phaseDeg * Math.PI) / 180;
  const real = magnitude * Math.cos(phaseRad);
  const imag = magnitude * Math.sin(phaseRad);
  return { real, imag };
}

export type PhasorOperation = 'add' | 'subtract' | 'multiply' | 'divide';

export interface PhasorArithmeticInputs {
  operation: PhasorOperation;
  inputFormat: 'rectangular' | 'polar';
  // Operand A
  aReal?: number;
  aImag?: number;
  aMag?: number;
  aPhaseDeg?: number;
  // Operand B
  bReal?: number;
  bImag?: number;
  bMag?: number;
  bPhaseDeg?: number;
}

export interface PhasorArithmeticResult {
  real: number;
  imag: number;
  magnitude: number;
  phaseDeg: number;
  phaseRad: number;
  rectangularFormatted: string;
  polarFormatted: string;
  steps: CalculationStep[];
}

export function calculatePhasorArithmetic(inputs: PhasorArithmeticInputs): PhasorArithmeticResult {
  const { operation, inputFormat } = inputs;
  const steps: CalculationStep[] = [];

  // Parse Operand A
  let a: ComplexNumber = { real: 0, imag: 0 };
  let aPol: PolarForm = { magnitude: 0, phaseDeg: 0, phaseRad: 0 };
  if (inputFormat === 'polar') {
    const mag = inputs.aMag ?? 1;
    const ph = inputs.aPhaseDeg ?? 0;
    aPol = { magnitude: mag, phaseDeg: ph, phaseRad: (ph * Math.PI) / 180 };
    a = polarToRectangular(mag, ph);
  } else {
    a = { real: inputs.aReal ?? 0, imag: inputs.aImag ?? 0 };
    aPol = rectangularToPolar(a.real, a.imag);
  }

  // Parse Operand B
  let b: ComplexNumber = { real: 0, imag: 0 };
  let bPol: PolarForm = { magnitude: 0, phaseDeg: 0, phaseRad: 0 };
  if (inputFormat === 'polar') {
    const mag = inputs.bMag ?? 1;
    const ph = inputs.bPhaseDeg ?? 0;
    bPol = { magnitude: mag, phaseDeg: ph, phaseRad: (ph * Math.PI) / 180 };
    b = polarToRectangular(mag, ph);
  } else {
    b = { real: inputs.bReal ?? 0, imag: inputs.bImag ?? 0 };
    bPol = rectangularToPolar(b.real, b.imag);
  }

  let resReal = 0;
  let resImag = 0;

  switch (operation) {
    case 'add': {
      resReal = a.real + b.real;
      resImag = a.imag + b.imag;
      steps.push({
        stepNumber: 1,
        title: 'Add Real and Imaginary Components Separately',
        formula: 'Z_total = (a₁ + a₂) + j(b₁ + b₂)',
        substitution: `(${a.real.toFixed(3)} + ${b.real.toFixed(3)}) + j(${a.imag.toFixed(3)} + ${b.imag.toFixed(3)})`,
        result: `${resReal.toFixed(3)} + j${resImag.toFixed(3)}`,
      });
      break;
    }
    case 'subtract': {
      resReal = a.real - b.real;
      resImag = a.imag - b.imag;
      steps.push({
        stepNumber: 1,
        title: 'Subtract Real and Imaginary Components',
        formula: 'Z_diff = (a₁ - a₂) + j(b₁ - b₂)',
        substitution: `(${a.real.toFixed(3)} - ${b.real.toFixed(3)}) + j(${a.imag.toFixed(3)} - ${b.imag.toFixed(3)})`,
        result: `${resReal.toFixed(3)} + j${resImag.toFixed(3)}`,
      });
      break;
    }
    case 'multiply': {
      // (r1 ∠ θ1) × (r2 ∠ θ2) = (r1·r2) ∠ (θ1 + θ2)
      const resMag = aPol.magnitude * bPol.magnitude;
      let resPh = aPol.phaseDeg + bPol.phaseDeg;
      // Normalize -180 to 180
      resPh = ((resPh + 180) % 360 + 360) % 360 - 180;
      const rect = polarToRectangular(resMag, resPh);
      resReal = rect.real;
      resImag = rect.imag;
      steps.push({
        stepNumber: 1,
        title: 'Multiply Magnitudes and Add Phase Angles in Polar Form',
        formula: '(r₁ ∠ θ₁) × (r₂ ∠ θ₂) = (r₁ × r₂) ∠ (θ₁ + θ₂)',
        substitution: `(${aPol.magnitude.toFixed(3)} × ${bPol.magnitude.toFixed(3)}) ∠ (${aPol.phaseDeg.toFixed(1)}° + ${bPol.phaseDeg.toFixed(1)}°)`,
        result: `${resMag.toFixed(3)} ∠ ${resPh.toFixed(1)}°`,
      });
      break;
    }
    case 'divide': {
      const denomMag = bPol.magnitude;
      if (denomMag === 0) {
        resReal = Infinity;
        resImag = Infinity;
        steps.push({
          stepNumber: 1,
          title: 'Division by Zero Phasor',
          formula: 'Z = A / 0',
          substitution: 'Denominator magnitude is 0',
          result: 'Undefined / Infinite',
        });
      } else {
        const resMag = aPol.magnitude / denomMag;
        let resPh = aPol.phaseDeg - bPol.phaseDeg;
        resPh = ((resPh + 180) % 360 + 360) % 360 - 180;
        const rect = polarToRectangular(resMag, resPh);
        resReal = rect.real;
        resImag = rect.imag;
        steps.push({
          stepNumber: 1,
          title: 'Divide Magnitudes and Subtract Phase Angles in Polar Form',
          formula: '(r₁ ∠ θ₁) / (r₂ ∠ θ₂) = (r₁ / r₂) ∠ (θ₁ - θ₂)',
          substitution: `(${aPol.magnitude.toFixed(3)} / ${bPol.magnitude.toFixed(3)}) ∠ (${aPol.phaseDeg.toFixed(1)}° - ${bPol.phaseDeg.toFixed(1)}°)`,
          result: `${resMag.toFixed(3)} ∠ ${resPh.toFixed(1)}°`,
        });
      }
      break;
    }
  }

  const pol = rectangularToPolar(resReal, resImag);
  const sign = pol.phaseDeg >= 0 ? '+' : '-';
  const absDeg = Math.abs(pol.phaseDeg);

  const rectFormatted = `${resReal.toFixed(3)} ${resImag >= 0 ? '+' : '-'} j${Math.abs(resImag).toFixed(3)}`;
  const polFormatted = `${pol.magnitude.toFixed(3)} ∠ ${sign}${absDeg.toFixed(2)}°`;

  return {
    real: resReal,
    imag: resImag,
    magnitude: pol.magnitude,
    phaseDeg: pol.phaseDeg,
    phaseRad: pol.phaseRad,
    rectangularFormatted: rectFormatted,
    polarFormatted: polFormatted,
    steps,
  };
}

// -------------------------------------------------------------
// AC Signal / Phasor Time-Domain Relationship
// -------------------------------------------------------------
export interface AcSignalPhasorInputs {
  rmsVoltage: number;    // V_rms
  frequencyHz: number;   // Hz
  phaseDegrees: number;  // θ in degrees
}

export interface AcSignalPhasorResult {
  vRms: number;
  vPeak: number;
  vPeakToPeak: number;
  frequencyHz: number;
  periodSec: number;
  omegaRadS: number;
  phaseDegrees: number;
  phaseRadians: number;
  realComponent: number; // In-phase
  imagComponent: number; // Quadrature
  timeEquation: string;
  samplePoints: { timeSec: number; voltage: number }[];
}

export function analyzeAcSignalPhasor(inputs: AcSignalPhasorInputs): AcSignalPhasorResult {
  const { rmsVoltage, frequencyHz, phaseDegrees } = inputs;

  const vRms = Math.max(0, rmsVoltage);
  const vPeak = vRms * Math.SQRT2;
  const vPeakToPeak = 2 * vPeak;
  const f = Math.max(frequencyHz, 1e-9);
  const T = 1 / f;
  const omega = 2 * Math.PI * f;
  const phaseRad = (phaseDegrees * Math.PI) / 180;

  // Phasor components: V = V_rms * e^(j*phase)
  const realComponent = vRms * Math.cos(phaseRad);
  const imagComponent = vRms * Math.sin(phaseRad);

  const sign = phaseDegrees >= 0 ? '+' : '-';
  const absDeg = Math.abs(phaseDegrees);
  const timeEquation = `v(t) = ${vPeak.toFixed(2)} × cos(2π × ${formatQuantity(f, 'frequency')} × t ${sign} ${absDeg.toFixed(1)}°)`;

  const points: { timeSec: number; voltage: number }[] = [];
  const numPoints = 100;
  const duration = 2 * T;

  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * duration;
    const v = vPeak * Math.cos(omega * t + phaseRad);
    points.push({ timeSec: t, voltage: v });
  }

  return {
    vRms,
    vPeak,
    vPeakToPeak,
    frequencyHz: f,
    periodSec: T,
    omegaRadS: omega,
    phaseDegrees,
    phaseRadians: phaseRad,
    realComponent,
    imagComponent,
    timeEquation,
    samplePoints: points,
  };
}

// -------------------------------------------------------------
// UI Adapter helpers for Phasor Transformations & Arithmetic
// -------------------------------------------------------------
export interface Phasor {
  real: number;
  imag: number;
  magnitude: number;
  angleDeg: number;
  angleRad: number;
}

export interface ConvertPhasorInputs {
  mode: 'to_polar' | 'to_rect';
  real?: number;
  imag?: number;
  magnitude?: number;
  angleDeg?: number;
}

export function convertPhasor(inputs: ConvertPhasorInputs): Phasor {
  if (inputs.mode === 'to_polar') {
    const r = inputs.real ?? 0;
    const i = inputs.imag ?? 0;
    const polar = rectangularToPolar(r, i);
    return {
      real: r,
      imag: i,
      magnitude: polar.magnitude,
      angleDeg: polar.phaseDeg,
      angleRad: polar.phaseRad,
    };
  } else {
    const mag = Math.max(0, inputs.magnitude ?? 0);
    const ang = inputs.angleDeg ?? 0;
    const rect = polarToRectangular(mag, ang);
    return {
      real: rect.real,
      imag: rect.imag,
      magnitude: mag,
      angleDeg: ang,
      angleRad: (ang * Math.PI) / 180,
    };
  }
}

export function performPhasorArithmetic(
  p1: Phasor,
  p2: Phasor,
  op: '+' | '-' | '*' | '/'
): { result: Phasor; explanation: string } {
  let real = 0;
  let imag = 0;

  if (op === '+') {
    real = p1.real + p2.real;
    imag = p1.imag + p2.imag;
    const polar = rectangularToPolar(real, imag);
    return {
      result: {
        real,
        imag,
        magnitude: polar.magnitude,
        angleDeg: polar.phaseDeg,
        angleRad: polar.phaseRad,
      },
      explanation: `Addition in rectangular form: (${p1.real.toFixed(3)} + ${p2.real.toFixed(3)}) + j(${p1.imag.toFixed(3)} + ${p2.imag.toFixed(3)}) = ${real.toFixed(3)} + j${imag.toFixed(3)}`,
    };
  } else if (op === '-') {
    real = p1.real - p2.real;
    imag = p1.imag - p2.imag;
    const polar = rectangularToPolar(real, imag);
    return {
      result: {
        real,
        imag,
        magnitude: polar.magnitude,
        angleDeg: polar.phaseDeg,
        angleRad: polar.phaseRad,
      },
      explanation: `Subtraction in rectangular form: (${p1.real.toFixed(3)} - ${p2.real.toFixed(3)}) + j(${p1.imag.toFixed(3)} - ${p2.imag.toFixed(3)}) = ${real.toFixed(3)} + j${imag.toFixed(3)}`,
    };
  } else if (op === '*') {
    const mag = p1.magnitude * p2.magnitude;
    const ang = p1.angleDeg + p2.angleDeg;
    const rect = polarToRectangular(mag, ang);
    return {
      result: {
        real: rect.real,
        imag: rect.imag,
        magnitude: mag,
        angleDeg: ang,
        angleRad: (ang * Math.PI) / 180,
      },
      explanation: `Multiplication in polar form: (${p1.magnitude.toFixed(3)} · ${p2.magnitude.toFixed(3)}) ∠ (${p1.angleDeg.toFixed(2)}° + ${p2.angleDeg.toFixed(2)}°) = ${mag.toFixed(3)} ∠ ${ang.toFixed(2)}°`,
    };
  } else {
    if (p2.magnitude === 0) {
      return {
        result: {
          real: Infinity,
          imag: Infinity,
          magnitude: Infinity,
          angleDeg: 0,
          angleRad: 0,
        },
        explanation: 'Division by zero: Denominator phasor magnitude is 0, resulting in an undefined/infinite quotient.',
      };
    }
    const mag = p1.magnitude / p2.magnitude;
    const ang = p1.angleDeg - p2.angleDeg;
    const rect = polarToRectangular(mag, ang);
    return {
      result: {
        real: rect.real,
        imag: rect.imag,
        magnitude: mag,
        angleDeg: ang,
        angleRad: (ang * Math.PI) / 180,
      },
      explanation: `Division in polar form: (${p1.magnitude.toFixed(3)} / ${p2.magnitude.toFixed(3)}) ∠ (${p1.angleDeg.toFixed(2)}° - ${p2.angleDeg.toFixed(2)}°) = ${mag.toFixed(3)} ∠ ${ang.toFixed(2)}°`,
    };
  }
}
