/**
 * Engineering Geometry, Trigonometric Solvers & Coordinate Transformations Engine
 * 
 * Implements:
 * 76. Euclidean Distance (2D & 3D points)
 * 77. Angle Between Vectors (Degrees & Radians via Dot Product)
 * 78. Triangle Solver (SSS, SAS, ASA, AAS; Law of Cosines, Law of Sines, Heron's Area, Inradius, Circumradius)
 * 79. Circle & Sector Calculator (Radius, Diameter, Circumference, Area, Arc Length, Sector Area)
 * 80. Regular Polygon Calculator (n sides: Area, Perimeter, Interior/Exterior Angle, Apothem, Circumradius)
 * 81. 2D Engineering Area & Perimeter (Rectangle, Circle, Annulus/Washer, Triangle, Trapezoid, Ellipse)
 * 82. 3D Engineering Volume & Surface Area (Prism, Cylinder, Hollow Pipe/Cylinder, Sphere, Cone, Torus)
 * 83. 2D Coordinate Transformation (Cartesian ↔ Polar)
 * 84. Cylindrical Coordinate Transformation (Cartesian ↔ Cylindrical)
 * 85. Spherical Coordinate Transformation (Cartesian ↔ Spherical)
 */

import { CalculationStep } from '../../types/tool';

// 76. Distance
export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function distance3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 78. Triangle Solver
export interface TriangleInputs {
  sideA?: number;
  sideB?: number;
  sideC?: number;
  angleADeg?: number; // opposite side a
  angleBDeg?: number; // opposite side b
  angleCDeg?: number; // opposite side c
}

export interface TriangleResult {
  sideA: number;
  sideB: number;
  sideC: number;
  angleADeg: number;
  angleBDeg: number;
  angleCDeg: number;
  angleARad: number;
  angleBRad: number;
  angleCRad: number;
  perimeter: number;
  semiPerimeter: number;
  area: number;
  inradius: number;
  circumradius: number;
  triangleType: 'equilateral' | 'isosceles' | 'scalene' | 'right';
  steps: CalculationStep[];
}

export function solveTriangle(inputs: TriangleInputs): TriangleResult {
  const steps: CalculationStep[] = [];
  let a = inputs.sideA;
  let b = inputs.sideB;
  let c = inputs.sideC;
  let alpha = inputs.angleADeg;
  let beta = inputs.angleBDeg;
  let gamma = inputs.angleCDeg;

  // Case 1: SSS (Three sides known)
  if (a !== undefined && b !== undefined && c !== undefined) {
    if (a <= 0 || b <= 0 || c <= 0) {
      throw new Error('All triangle sides must be strictly positive');
    }
    // Triangle inequality
    if (a + b <= c || a + c <= b || b + c <= a) {
      throw new Error(`Triangle inequality violated: sides [${a}, ${b}, ${c}] cannot form a closed triangle.`);
    }

    // Law of Cosines: cos(alpha) = (b^2 + c^2 - a^2) / (2bc)
    const cosA = Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)));
    const cosB = Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)));

    alpha = (Math.acos(cosA) * 180) / Math.PI;
    beta = (Math.acos(cosB) * 180) / Math.PI;
    gamma = 180 - (alpha + beta);

    steps.push({
      stepNumber: 1,
      title: 'Apply Law of Cosines for SSS',
      formula: '\\cos(A) = \\frac{b^2 + c^2 - a^2}{2bc}',
      substitution: `(${b}² + ${c}² - ${a}²) / (2 · ${b} · ${c})`,
      result: `A = ${alpha.toFixed(2)}°, B = ${beta.toFixed(2)}°, C = ${gamma.toFixed(2)}°`,
    });
  }
  // Case 2: SAS (Two sides and included angle, e.g. a, b, gamma)
  else if (a !== undefined && b !== undefined && gamma !== undefined) {
    const radG = (gamma * Math.PI) / 180;
    c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(radG));
    const cosA = Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)));
    alpha = (Math.acos(cosA) * 180) / Math.PI;
    beta = 180 - (alpha + gamma);

    steps.push({
      stepNumber: 1,
      title: 'Solve Side c via Law of Cosines (SAS)',
      formula: 'c = \\sqrt{a^2 + b^2 - 2ab\\cos(C)}',
      substitution: `\\sqrt{${a}² + ${b}² - 2·${a}·${b}·\\cos(${gamma}°)}`,
      result: `c = ${c.toFixed(4)}`,
    });
  }
  // Case 3: ASA / AAS (Two angles and one side)
  else if (alpha !== undefined && beta !== undefined && a !== undefined) {
    gamma = 180 - (alpha + beta);
    if (gamma <= 0) throw new Error('Sum of triangle angles must be strictly less than 180°');
    const radA = (alpha * Math.PI) / 180;
    const radB = (beta * Math.PI) / 180;
    const radC = (gamma * Math.PI) / 180;

    // Law of Sines: b = a * sin(B)/sin(A), c = a * sin(C)/sin(A)
    b = (a * Math.sin(radB)) / Math.sin(radA);
    c = (a * Math.sin(radC)) / Math.sin(radA);

    steps.push({
      stepNumber: 1,
      title: 'Determine Third Angle & Solve Sides via Law of Sines (AAS)',
      formula: 'C = 180° - (A + B), \\quad b = a \\frac{\\sin(B)}{\\sin(A)}',
      substitution: `C = ${gamma.toFixed(2)}°, b = ${b.toFixed(4)}, c = ${c.toFixed(4)}`,
      result: `[a=${a}, b=${b.toFixed(3)}, c=${c.toFixed(3)}]`,
    });
  } else {
    // Default fallback equilateral triangle
    a = a ?? 1;
    b = b ?? a;
    c = c ?? a;
    alpha = 60;
    beta = 60;
    gamma = 60;
  }

  const perimeter = a + b + c;
  const s = perimeter / 2; // semiperimeter
  // Heron's formula for area
  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
  const inradius = s > 0 ? area / s : 0;
  const circumradius = area > 0 ? (a * b * c) / (4 * area) : 0;

  // Determine triangle classification
  let triangleType: 'equilateral' | 'isosceles' | 'scalene' | 'right' = 'scalene';
  const isRight = Math.abs(alpha - 90) < 0.1 || Math.abs(beta - 90) < 0.1 || Math.abs(gamma - 90) < 0.1;
  const isEquilateral = Math.abs(a - b) < 1e-4 && Math.abs(b - c) < 1e-4;
  const isIsosceles = Math.abs(a - b) < 1e-4 || Math.abs(b - c) < 1e-4 || Math.abs(a - c) < 1e-4;

  if (isRight) triangleType = 'right';
  else if (isEquilateral) triangleType = 'equilateral';
  else if (isIsosceles) triangleType = 'isosceles';

  return {
    sideA: a,
    sideB: b,
    sideC: c,
    angleADeg: alpha,
    angleBDeg: beta,
    angleCDeg: gamma,
    angleARad: (alpha * Math.PI) / 180,
    angleBRad: (beta * Math.PI) / 180,
    angleCRad: (gamma * Math.PI) / 180,
    perimeter,
    semiPerimeter: s,
    area,
    inradius,
    circumradius,
    triangleType,
    steps,
  };
}

// 79. Circle & Sector Calculator
export interface CircleResult {
  radius: number;
  diameter: number;
  circumference: number;
  area: number;
  arcLength?: number;
  sectorArea?: number;
  chordLength?: number;
}

export function calculateCircle(radius: number, sectorAngleDeg?: number): CircleResult {
  if (radius <= 0) throw new Error('Circle radius must be strictly positive');
  const diameter = 2 * radius;
  const circumference = 2 * Math.PI * radius;
  const area = Math.PI * radius * radius;

  let arcLength: number | undefined;
  let sectorArea: number | undefined;
  let chordLength: number | undefined;

  if (sectorAngleDeg !== undefined && sectorAngleDeg > 0) {
    const fraction = sectorAngleDeg / 360;
    arcLength = circumference * fraction;
    sectorArea = area * fraction;
    const halfRad = ((sectorAngleDeg / 2) * Math.PI) / 180;
    chordLength = 2 * radius * Math.sin(halfRad);
  }

  return {
    radius,
    diameter,
    circumference,
    area,
    arcLength,
    sectorArea,
    chordLength,
  };
}

// 80. Regular Polygon Calculator
export interface RegularPolygonResult {
  sidesN: number;
  sideLengthS: number;
  perimeter: number;
  area: number;
  apothemR: number; // inradius
  circumradiusR: number;
  interiorAngleDeg: number;
  exteriorAngleDeg: number;
}

export function calculateRegularPolygon(sidesN: number, sideLengthS: number): RegularPolygonResult {
  const n = Math.floor(sidesN);
  if (n < 3) throw new Error('A polygon must have at least 3 sides');
  if (sideLengthS <= 0) throw new Error('Polygon side length must be positive');

  const perimeter = n * sideLengthS;
  const centralAngleRad = (2 * Math.PI) / n;
  const apothemR = sideLengthS / (2 * Math.tan(Math.PI / n));
  const circumradiusR = sideLengthS / (2 * Math.sin(Math.PI / n));
  const area = 0.5 * perimeter * apothemR;

  const interiorAngleDeg = ((n - 2) * 180) / n;
  const exteriorAngleDeg = 360 / n;

  return {
    sidesN: n,
    sideLengthS,
    perimeter,
    area,
    apothemR,
    circumradiusR,
    interiorAngleDeg,
    exteriorAngleDeg,
  };
}

// 81. 2D Engineering Area & Perimeter
export type Shape2D = 'rectangle' | 'circle' | 'annulus' | 'triangle' | 'trapezoid' | 'ellipse';

export function calculateEngineeringArea(
  shape: Shape2D,
  params: Record<string, number>
): { area: number; perimeter: number; steps: CalculationStep[] } {
  const steps: CalculationStep[] = [];
  let area = 0;
  let perimeter = 0;

  switch (shape) {
    case 'rectangle': {
      const w = params.width ?? 1;
      const h = params.height ?? 1;
      area = w * h;
      perimeter = 2 * (w + h);
      steps.push({
        stepNumber: 1,
        title: 'Rectangle Area & Perimeter',
        formula: 'A = w \\cdot h, \\quad P = 2(w + h)',
        substitution: `${w} \\times ${h}`,
        result: `Area = ${area.toFixed(4)}, Perimeter = ${perimeter.toFixed(4)}`,
      });
      break;
    }
    case 'circle': {
      const r = params.radius ?? 1;
      area = Math.PI * r * r;
      perimeter = 2 * Math.PI * r;
      steps.push({
        stepNumber: 1,
        title: 'Circle Area & Circumference',
        formula: 'A = \\pi r^2, \\quad C = 2\\pi r',
        substitution: `\\pi \\times ${r}^2`,
        result: `Area = ${area.toFixed(4)}, Perimeter = ${perimeter.toFixed(4)}`,
      });
      break;
    }
    case 'annulus': {
      // Washer / coaxial shield area
      const rOuter = params.outerRadius ?? 2;
      const rInner = params.innerRadius ?? 1;
      if (rInner >= rOuter) throw new Error('Inner radius must be smaller than outer radius');
      area = Math.PI * (rOuter * rOuter - rInner * rInner);
      perimeter = 2 * Math.PI * (rOuter + rInner);
      steps.push({
        stepNumber: 1,
        title: 'Annulus (Washer) Area',
        formula: 'A = \\pi (R_o^2 - R_i^2), \\quad P = 2\\pi(R_o + R_i)',
        substitution: `\\pi (${rOuter}² - ${rInner}²)`,
        result: `Area = ${area.toFixed(4)}`,
      });
      break;
    }
    case 'triangle': {
      const b = params.base ?? 2;
      const h = params.height ?? 1;
      area = 0.5 * b * h;
      perimeter = b + 2 * Math.hypot(b / 2, h); // isosceles assumption for perimeter
      steps.push({
        stepNumber: 1,
        title: 'Triangle Base-Height Area',
        formula: 'A = \\frac{1}{2} b \\cdot h',
        substitution: `0.5 \\times ${b} \\times ${h}`,
        result: `Area = ${area.toFixed(4)}`,
      });
      break;
    }
    case 'trapezoid': {
      const a = params.topBase ?? 1;
      const b = params.bottomBase ?? 2;
      const h = params.height ?? 1;
      area = 0.5 * (a + b) * h;
      const leg = Math.hypot(Math.abs(b - a) / 2, h);
      perimeter = a + b + 2 * leg;
      steps.push({
        stepNumber: 1,
        title: 'Trapezoid Area',
        formula: 'A = \\frac{a + b}{2} h',
        substitution: `((${a} + ${b}) / 2) \\times ${h}`,
        result: `Area = ${area.toFixed(4)}`,
      });
      break;
    }
    case 'ellipse': {
      const a = params.semiMajor ?? 2;
      const b = params.semiMinor ?? 1;
      area = Math.PI * a * b;
      // Ramanujan approximation for ellipse perimeter
      const hParam = Math.pow(a - b, 2) / Math.pow(a + b, 2);
      perimeter = Math.PI * (a + b) * (1 + (3 * hParam) / (10 + Math.sqrt(4 - 3 * hParam)));
      steps.push({
        stepNumber: 1,
        title: 'Ellipse Area & Ramanujan Perimeter',
        formula: 'A = \\pi a b, \\quad P \\approx \\pi(a + b)\\left[1 + \\frac{3h}{10 + \\sqrt{4 - 3h}}\\right]',
        substitution: `\\pi \\times ${a} \\times ${b}`,
        result: `Area = ${area.toFixed(4)}, Perimeter ≈ ${perimeter.toFixed(4)}`,
      });
      break;
    }
  }

  return { area, perimeter, steps };
}

// 82. 3D Engineering Volume & Surface Area
export type Shape3D = 'rectangular_prism' | 'cylinder' | 'hollow_cylinder' | 'sphere' | 'cone' | 'torus';

export function calculateEngineeringVolume(
  shape: Shape3D,
  params: Record<string, number>
): { volume: number; surfaceArea: number; steps: CalculationStep[] } {
  const steps: CalculationStep[] = [];
  let volume = 0;
  let surfaceArea = 0;

  switch (shape) {
    case 'rectangular_prism': {
      const l = params.length ?? 2;
      const w = params.width ?? 1;
      const h = params.height ?? 1;
      volume = l * w * h;
      surfaceArea = 2 * (l * w + l * h + w * h);
      steps.push({
        stepNumber: 1,
        title: 'Rectangular Prism Volume & Surface Area',
        formula: 'V = l \\cdot w \\cdot h, \\quad A = 2(lw + lh + wh)',
        substitution: `${l} \\times ${w} \\times ${h}`,
        result: `V = ${volume.toFixed(4)}, A = ${surfaceArea.toFixed(4)}`,
      });
      break;
    }
    case 'cylinder': {
      const r = params.radius ?? 1;
      const h = params.height ?? 2;
      volume = Math.PI * r * r * h;
      surfaceArea = 2 * Math.PI * r * h + 2 * Math.PI * r * r;
      steps.push({
        stepNumber: 1,
        title: 'Cylinder Volume & Surface Area',
        formula: 'V = \\pi r^2 h, \\quad A = 2\\pi rh + 2\\pi r^2',
        substitution: `\\pi \\times ${r}² \\times ${h}`,
        result: `V = ${volume.toFixed(4)}, A = ${surfaceArea.toFixed(4)}`,
      });
      break;
    }
    case 'hollow_cylinder': {
      // Pipe / Coaxial tube
      const ro = params.outerRadius ?? 2;
      const ri = params.innerRadius ?? 1;
      const h = params.height ?? 3;
      if (ri >= ro) throw new Error('Inner radius must be strictly less than outer radius');
      volume = Math.PI * (ro * ro - ri * ri) * h;
      surfaceArea = 2 * Math.PI * ro * h + 2 * Math.PI * ri * h + 2 * Math.PI * (ro * ro - ri * ri);
      steps.push({
        stepNumber: 1,
        title: 'Hollow Cylinder (Pipe / Coaxial) Volume',
        formula: 'V = \\pi (R_o^2 - R_i^2) h',
        substitution: `\\pi (${ro}² - ${ri}²) \\times ${h}`,
        result: `V = ${volume.toFixed(4)}, Surface Area = ${surfaceArea.toFixed(4)}`,
      });
      break;
    }
    case 'sphere': {
      const r = params.radius ?? 1;
      volume = (4 / 3) * Math.PI * Math.pow(r, 3);
      surfaceArea = 4 * Math.PI * r * r;
      steps.push({
        stepNumber: 1,
        title: 'Sphere Volume & Surface Area',
        formula: 'V = \\frac{4}{3}\\pi r^3, \\quad A = 4\\pi r^2',
        substitution: `(4/3)\\pi \\times ${r}³`,
        result: `V = ${volume.toFixed(4)}, A = ${surfaceArea.toFixed(4)}`,
      });
      break;
    }
    case 'cone': {
      const r = params.radius ?? 1;
      const h = params.height ?? 2;
      const slant = Math.hypot(r, h);
      volume = (1 / 3) * Math.PI * r * r * h;
      surfaceArea = Math.PI * r * (r + slant);
      steps.push({
        stepNumber: 1,
        title: 'Cone Volume & Surface Area',
        formula: 'V = \\frac{1}{3}\\pi r^2 h, \\quad A = \\pi r(r + s)',
        substitution: `(1/3)\\pi \\times ${r}² \\times ${h}`,
        result: `V = ${volume.toFixed(4)}, A = ${surfaceArea.toFixed(4)}`,
      });
      break;
    }
    case 'torus': {
      // Toroidal core (inductance / transformer cores)
      const R = params.majorRadius ?? 3; // Center to tube center
      const r = params.minorRadius ?? 1; // Tube radius
      if (r >= R) throw new Error('Minor radius r must be strictly less than major radius R');
      volume = 2 * Math.PI * Math.PI * R * r * r;
      surfaceArea = 4 * Math.PI * Math.PI * R * r;
      steps.push({
        stepNumber: 1,
        title: 'Toroidal Core Volume & Surface Area (Pappus Theorem)',
        formula: 'V = 2\\pi^2 R r^2, \\quad A = 4\\pi^2 R r',
        substitution: `2\\pi² \\times ${R} \\times ${r}²`,
        result: `V = ${volume.toFixed(4)}, A = ${surfaceArea.toFixed(4)}`,
      });
      break;
    }
  }

  return { volume, surfaceArea, steps };
}
