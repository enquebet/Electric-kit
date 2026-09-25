/**
 * Vector Mathematics & Coordinate Transformation Engine
 * 
 * Implements:
 * 18. Vector Magnitude
 * 19. Vector Direction (2D polar angle, 3D direction angles / cosines)
 * 20. Vector Addition
 * 21. Vector Subtraction
 * 22. Dot Product
 * 23. Cross Product (3D)
 * 24. Vector Projection & Scalar Component
 * 25. Unit Vector Normalization
 * 26. 2D / 3D Coordinate Transformations (Cartesian ↔ Polar, Cylindrical, Spherical)
 */

import { CalculationStep } from '../../types/tool';

export type Vector2D = [number, number];
export type Vector3D = [number, number, number];

export function vectorMagnitude(v: number[]): number {
  if (v.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < v.length; i++) {
    sumSq += v[i] * v[i];
  }
  return Math.sqrt(sumSq);
}

export interface VectorDirectionResult {
  dimension: 2 | 3 | number;
  angle2DDeg?: number;
  angle2DRad?: number;
  // 3D Direction Angles with X, Y, Z axes
  alphaDeg?: number; // with X-axis
  betaDeg?: number;  // with Y-axis
  gammaDeg?: number; // with Z-axis
  directionCosines?: number[];
  unitVector: number[];
}

export function vectorDirection(v: number[]): VectorDirectionResult {
  const mag = vectorMagnitude(v);
  if (mag === 0) {
    return {
      dimension: v.length,
      unitVector: v.map(() => 0),
    };
  }

  const unitVector = v.map((comp) => comp / mag);

  if (v.length === 2) {
    const rad = Math.atan2(v[1], v[0]);
    const deg = (rad * 180) / Math.PI;
    return {
      dimension: 2,
      angle2DDeg: deg >= 0 ? deg : deg + 360,
      angle2DRad: rad >= 0 ? rad : rad + 2 * Math.PI,
      unitVector,
    };
  }

  if (v.length === 3) {
    const cosAlpha = unitVector[0];
    const cosBeta = unitVector[1];
    const cosGamma = unitVector[2];

    const alphaDeg = (Math.acos(Math.max(-1, Math.min(1, cosAlpha))) * 180) / Math.PI;
    const betaDeg = (Math.acos(Math.max(-1, Math.min(1, cosBeta))) * 180) / Math.PI;
    const gammaDeg = (Math.acos(Math.max(-1, Math.min(1, cosGamma))) * 180) / Math.PI;

    return {
      dimension: 3,
      alphaDeg,
      betaDeg,
      gammaDeg,
      directionCosines: [cosAlpha, cosBeta, cosGamma],
      unitVector,
    };
  }

  return {
    dimension: v.length,
    unitVector,
    directionCosines: unitVector,
  };
}

export function vectorAdd(u: number[], v: number[]): number[] {
  if (u.length !== v.length) {
    throw new Error(`Vector addition requires identical dimensions: ${u.length} vs ${v.length}`);
  }
  return u.map((val, idx) => val + v[idx]);
}

export function vectorSub(u: number[], v: number[]): number[] {
  if (u.length !== v.length) {
    throw new Error(`Vector subtraction requires identical dimensions: ${u.length} vs ${v.length}`);
  }
  return u.map((val, idx) => val - v[idx]);
}

export function vectorScale(v: number[], scalar: number): number[] {
  return v.map((val) => val * scalar);
}

export function vectorDotProduct(u: number[], v: number[]): number {
  if (u.length !== v.length) {
    throw new Error(`Dot product requires matching vector lengths: ${u.length} vs ${v.length}`);
  }
  let sum = 0;
  for (let i = 0; i < u.length; i++) {
    sum += u[i] * v[i];
  }
  return sum;
}

/**
 * 3D Vector Cross Product u × v
 * | i   j   k |
 * | ux  uy  uz|
 * | vx  vy  vz|
 */
export function vectorCrossProduct(u: Vector3D, v: Vector3D): Vector3D {
  if (u.length !== 3 || v.length !== 3) {
    throw new Error('Vector cross product is strictly defined in 3-dimensional space');
  }
  return [
    u[1] * v[2] - u[2] * v[1], // i
    u[2] * v[0] - u[0] * v[2], // j
    u[0] * v[1] - u[1] * v[0], // k
  ];
}

export interface VectorProjectionResult {
  projectedVector: number[];
  scalarComponent: number; // Signed length of projection
  fractionOfBase: number;
}

/**
 * Orthogonal projection of vector u onto vector v:
 * proj_v(u) = ((u · v) / |v|^2) * v
 */
export function vectorProjection(u: number[], ontoV: number[]): VectorProjectionResult {
  const vMag = vectorMagnitude(ontoV);
  if (vMag === 0) {
    throw new Error('Cannot project onto a zero-magnitude vector');
  }
  const dot = vectorDotProduct(u, ontoV);
  const factor = dot / (vMag * vMag);
  const projectedVector = ontoV.map((comp) => comp * factor);
  const scalarComponent = dot / vMag;

  return {
    projectedVector,
    scalarComponent,
    fractionOfBase: factor,
  };
}

export function vectorUnit(v: number[]): number[] {
  const mag = vectorMagnitude(v);
  if (mag === 0) {
    throw new Error('Zero vector [0, 0, ...] has undefined direction and no unit vector');
  }
  return v.map((comp) => comp / mag);
}

export function angleBetweenVectors(u: number[], v: number[]): { angleRad: number; angleDeg: number } {
  const magU = vectorMagnitude(u);
  const magV = vectorMagnitude(v);
  if (magU === 0 || magV === 0) {
    throw new Error('Angle is undefined for zero-length vectors');
  }
  const dot = vectorDotProduct(u, v);
  const cosTheta = Math.max(-1, Math.min(1, dot / (magU * magV)));
  const angleRad = Math.acos(cosTheta);
  const angleDeg = (angleRad * 180) / Math.PI;

  return { angleRad, angleDeg };
}

// 2D & 3D Coordinate Conversions

export function cartesianToPolar2D(x: number, y: number): { r: number; thetaDeg: number; thetaRad: number } {
  const r = Math.hypot(x, y);
  const thetaRad = Math.atan2(y, x);
  const rawDeg = (thetaRad * 180) / Math.PI;
  const thetaDeg = rawDeg >= 0 ? rawDeg : rawDeg + 360;
  return { r, thetaDeg, thetaRad };
}

export function polarToCartesian2D(r: number, thetaDeg: number): { x: number; y: number } {
  const rad = (thetaDeg * Math.PI) / 180;
  return {
    x: r * Math.cos(rad),
    y: r * Math.sin(rad),
  };
}

export function cartesianToCylindrical(x: number, y: number, z: number): {
  r: number;
  thetaDeg: number;
  thetaRad: number;
  z: number;
} {
  const polar = cartesianToPolar2D(x, y);
  return {
    r: polar.r,
    thetaDeg: polar.thetaDeg,
    thetaRad: polar.thetaRad,
    z,
  };
}

export function cylindricalToCartesian(r: number, thetaDeg: number, z: number): {
  x: number;
  y: number;
  z: number;
} {
  const cart2d = polarToCartesian2D(r, thetaDeg);
  return {
    x: cart2d.x,
    y: cart2d.y,
    z,
  };
}

export function cartesianToSpherical(x: number, y: number, z: number): {
  rho: number;       // radial distance
  thetaDeg: number;  // azimuth (in x-y plane)
  phiDeg: number;    // inclination / polar angle from +z axis
  thetaRad: number;
  phiRad: number;
} {
  const rho = Math.sqrt(x * x + y * y + z * z);
  const thetaRad = Math.atan2(y, x);
  const rawThetaDeg = (thetaRad * 180) / Math.PI;
  const thetaDeg = rawThetaDeg >= 0 ? rawThetaDeg : rawThetaDeg + 360;

  const phiRad = rho === 0 ? 0 : Math.acos(Math.max(-1, Math.min(1, z / rho)));
  const phiDeg = (phiRad * 180) / Math.PI;

  return {
    rho,
    thetaDeg,
    phiDeg,
    thetaRad,
    phiRad,
  };
}

export function sphericalToCartesian(rho: number, thetaDeg: number, phiDeg: number): {
  x: number;
  y: number;
  z: number;
} {
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const phiRad = (phiDeg * Math.PI) / 180;

  return {
    x: rho * Math.sin(phiRad) * Math.cos(thetaRad),
    y: rho * Math.sin(phiRad) * Math.sin(thetaRad),
    z: rho * Math.cos(phiRad),
  };
}
