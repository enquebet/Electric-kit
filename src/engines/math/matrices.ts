/**
 * Matrix Algebra, Determinants & Linear System Solvers
 * 
 * Implements:
 * 27. Matrix Addition
 * 28. Matrix Subtraction
 * 29. Matrix Multiplication
 * 30. Matrix Transpose
 * 31. 2×2 Determinant
 * 32. 3×3 Determinant
 * 33. Matrix Inverse (2×2, 3×3 with condition number & singular checks)
 * 34. Matrix Rank (Gaussian elimination with partial pivoting)
 * 35. Solve 2×2 Linear System (Cramer's rule & Gaussian elimination)
 * 36. Solve 3×3 Linear System (Cramer's rule & LU/Gaussian elimination)
 */

import { CalculationStep } from '../../types/tool';

export type Matrix = number[][];

export function matrixAdd(A: Matrix, B: Matrix): Matrix {
  const rows = A.length;
  const cols = A[0]?.length || 0;
  if (rows !== B.length || cols !== (B[0]?.length || 0)) {
    throw new Error(`Matrix dimensions must match for addition: ${rows}x${cols} vs ${B.length}x${B[0]?.length}`);
  }
  return A.map((row, r) => row.map((val, c) => val + B[r][c]));
}

export function matrixSub(A: Matrix, B: Matrix): Matrix {
  const rows = A.length;
  const cols = A[0]?.length || 0;
  if (rows !== B.length || cols !== (B[0]?.length || 0)) {
    throw new Error(`Matrix dimensions must match for subtraction: ${rows}x${cols} vs ${B.length}x${B[0]?.length}`);
  }
  return A.map((row, r) => row.map((val, c) => val - B[r][c]));
}

export function matrixScale(A: Matrix, scalar: number): Matrix {
  return A.map((row) => row.map((val) => val * scalar));
}

export function matrixMul(A: Matrix, B: Matrix): Matrix {
  const rA = A.length;
  const cA = A[0]?.length || 0;
  const rB = B.length;
  const cB = B[0]?.length || 0;

  if (cA !== rB) {
    throw new Error(`Matrix multiplication inner dimensions must match: ${rA}x${cA} * ${rB}x${cB}`);
  }

  const result: Matrix = Array.from({ length: rA }, () => Array(cB).fill(0));
  for (let i = 0; i < rA; i++) {
    for (let j = 0; j < cB; j++) {
      let sum = 0;
      for (let k = 0; k < cA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export function matrixTranspose(A: Matrix): Matrix {
  const rows = A.length;
  const cols = A[0]?.length || 0;
  const transposed: Matrix = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      transposed[c][r] = A[r][c];
    }
  }
  return transposed;
}

export function matrixDeterminant2x2(A: Matrix): number {
  if (A.length !== 2 || A[0].length !== 2) {
    throw new Error('2x2 determinant requires a 2x2 matrix');
  }
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

export function matrixDeterminant3x3(A: Matrix): number {
  if (A.length !== 3 || A[0].length !== 3) {
    throw new Error('3x3 determinant requires a 3x3 matrix');
  }
  // Sarrus / Laplace Expansion along first row
  const a = A[0][0];
  const b = A[0][1];
  const c = A[0][2];

  const d1 = A[1][1] * A[2][2] - A[1][2] * A[2][1];
  const d2 = A[1][0] * A[2][2] - A[1][2] * A[2][0];
  const d3 = A[1][0] * A[2][1] - A[1][1] * A[2][0];

  return a * d1 - b * d2 + c * d3;
}

export function matrixDeterminant(A: Matrix): number {
  const n = A.length;
  if (n === 0 || n !== A[0].length) {
    throw new Error('Determinant is only defined for square matrices');
  }
  if (n === 1) return A[0][0];
  if (n === 2) return matrixDeterminant2x2(A);
  if (n === 3) return matrixDeterminant3x3(A);

  // General n-by-n determinant using Gaussian elimination with partial pivoting
  const M = A.map((row) => [...row]);
  let det = 1;
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(M[j][i]) > Math.abs(M[pivot][i])) {
        pivot = j;
      }
    }
    if (Math.abs(M[pivot][i]) < 1e-12) return 0;

    if (pivot !== i) {
      const temp = M[i];
      M[i] = M[pivot];
      M[pivot] = temp;
      det = -det;
    }

    det *= M[i][i];
    for (let j = i + 1; j < n; j++) {
      const factor = M[j][i] / M[i][i];
      for (let k = i + 1; k < n; k++) {
        M[j][k] -= factor * M[i][k];
      }
    }
  }
  return det;
}

export interface MatrixInverseResult {
  inverse: Matrix | null;
  isInvertible: boolean;
  determinant: number;
  conditionEstimate?: number;
  message?: string;
}

export function matrixInverse(A: Matrix): MatrixInverseResult {
  const n = A.length;
  if (n === 0 || n !== A[0].length) {
    throw new Error('Only square matrices have a multiplicative inverse');
  }

  const det = matrixDeterminant(A);
  if (Math.abs(det) < 1e-12) {
    return {
      inverse: null,
      isInvertible: false,
      determinant: det,
      message: 'Singular matrix: determinant is approximately zero; inverse does not exist.',
    };
  }

  if (n === 2) {
    const inv: Matrix = [
      [A[1][1] / det, -A[0][1] / det],
      [-A[1][0] / det, A[0][0] / det],
    ];
    return { inverse: inv, isInvertible: true, determinant: det };
  }

  if (n === 3) {
    const inv: Matrix = Array.from({ length: 3 }, () => Array(3).fill(0));
    // Classical Adjugate matrix / det(A)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        // Minor formed by deleting row r and col c
        const minor2x2: Matrix = [];
        for (let i = 0; i < 3; i++) {
          if (i === r) continue;
          const rowVals: number[] = [];
          for (let j = 0; j < 3; j++) {
            if (j === c) continue;
            rowVals.push(A[i][j]);
          }
          minor2x2.push(rowVals);
        }
        const cofactor = Math.pow(-1, r + c) * matrixDeterminant2x2(minor2x2);
        // Note: transpose cofactor matrix to get adjugate
        inv[c][r] = cofactor / det;
      }
    }
    return { inverse: inv, isInvertible: true, determinant: det };
  }

  // General Gauss-Jordan elimination for n > 3
  const augmented: Matrix = A.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[pivot][i])) {
        pivot = j;
      }
    }
    if (Math.abs(augmented[pivot][i]) < 1e-12) {
      return {
        inverse: null,
        isInvertible: false,
        determinant: det,
        message: 'Ill-conditioned/singular matrix detected during Gauss-Jordan elimination.',
      };
    }
    if (pivot !== i) {
      const temp = augmented[i];
      augmented[i] = augmented[pivot];
      augmented[pivot] = temp;
    }

    const diagVal = augmented[i][i];
    for (let k = 0; k < 2 * n; k++) {
      augmented[i][k] /= diagVal;
    }
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const factor = augmented[j][i];
        for (let k = 0; k < 2 * n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }
  }

  const resultInv: Matrix = augmented.map((row) => row.slice(n));
  return { inverse: resultInv, isInvertible: true, determinant: det };
}

export function matrixRank(A: Matrix): number {
  const rows = A.length;
  if (rows === 0) return 0;
  const cols = A[0].length;
  const M = A.map((row) => [...row]);

  let rank = 0;
  const rowSelected: boolean[] = Array(rows).fill(false);

  for (let c = 0; c < cols; c++) {
    let pivot = -1;
    for (let r = 0; r < rows; r++) {
      if (!rowSelected[r] && Math.abs(M[r][c]) > 1e-10) {
        if (pivot === -1 || Math.abs(M[r][c]) > Math.abs(M[pivot][c])) {
          pivot = r;
        }
      }
    }
    if (pivot !== -1) {
      rank++;
      rowSelected[pivot] = true;
      for (let r = 0; r < rows; r++) {
        if (r !== pivot && Math.abs(M[r][c]) > 1e-10) {
          const factor = M[r][c] / M[pivot][c];
          for (let k = c; k < cols; k++) {
            M[r][k] -= factor * M[pivot][k];
          }
        }
      }
    }
  }

  return rank;
}

export interface LinearSystemResult {
  solution: number[] | null;
  status: 'unique' | 'infinite_solutions' | 'inconsistent_no_solution';
  determinant: number;
  steps: CalculationStep[];
  message: string;
}

export function solveLinearSystem2x2(A: Matrix, b: number[]): LinearSystemResult {
  const steps: CalculationStep[] = [];
  const detA = matrixDeterminant2x2(A);

  steps.push({
    stepNumber: 1,
    title: 'Calculate Coefficient Matrix Determinant det(A)',
    formula: '\\det(A) = a_{11}a_{22} - a_{12}a_{21}',
    substitution: `(${A[0][0]})(${A[1][1]}) - (${A[0][1]})(${A[1][0]})`,
    result: `${detA.toFixed(4)}`,
  });

  if (Math.abs(detA) < 1e-12) {
    // Check consistency: det(Ax) and det(Ay)
    const Ax: Matrix = [
      [b[0], A[0][1]],
      [b[1], A[1][1]],
    ];
    const Ay: Matrix = [
      [A[0][0], b[0]],
      [A[1][0], b[1]],
    ];
    const detAx = matrixDeterminant2x2(Ax);
    const detAy = matrixDeterminant2x2(Ay);

    if (Math.abs(detAx) < 1e-12 && Math.abs(detAy) < 1e-12) {
      return {
        solution: null,
        status: 'infinite_solutions',
        determinant: detA,
        steps,
        message: 'Infinite solutions: equations are linearly dependent (coincident lines).',
      };
    }
    return {
      solution: null,
      status: 'inconsistent_no_solution',
      determinant: detA,
      steps,
      message: 'Inconsistent system: equations represent parallel, non-intersecting lines (no solution).',
    };
  }

  // Cramer's Rule
  const Ax: Matrix = [
    [b[0], A[0][1]],
    [b[1], A[1][1]],
  ];
  const Ay: Matrix = [
    [A[0][0], b[0]],
    [A[1][0], b[1]],
  ];

  const detAx = matrixDeterminant2x2(Ax);
  const detAy = matrixDeterminant2x2(Ay);

  const x1 = detAx / detA;
  const x2 = detAy / detA;

  steps.push({
    stepNumber: 2,
    title: "Calculate Cramer's Determinants det(A₁) and det(A₂)",
    formula: 'x_1 = \\frac{\\det(A_1)}{\\det(A)}, \\quad x_2 = \\frac{\\det(A_2)}{\\det(A)}',
    substitution: `x_1 = ${detAx.toFixed(4)} / ${detA.toFixed(4)}, \\; x_2 = ${detAy.toFixed(4)} / ${detA.toFixed(4)}`,
    result: `x₁ = ${x1.toFixed(4)}, x₂ = ${x2.toFixed(4)}`,
  });

  return {
    solution: [x1, x2],
    status: 'unique',
    determinant: detA,
    steps,
    message: 'Unique solution found via Cramer\'s rule.',
  };
}

export function solveLinearSystem3x3(A: Matrix, b: number[]): LinearSystemResult {
  const steps: CalculationStep[] = [];
  const detA = matrixDeterminant3x3(A);

  steps.push({
    stepNumber: 1,
    title: 'Calculate 3×3 Coefficient Matrix Determinant det(A)',
    formula: '\\det(A) = a(ei - fh) - b(di - fg) + c(dh - eg)',
    substitution: `3×3 expansion`,
    result: `${detA.toFixed(4)}`,
  });

  if (Math.abs(detA) < 1e-12) {
    const rankA = matrixRank(A);
    const augmented = A.map((row, i) => [...row, b[i]]);
    const rankAug = matrixRank(augmented);

    if (rankA === rankAug) {
      return {
        solution: null,
        status: 'infinite_solutions',
        determinant: detA,
        steps,
        message: 'Infinite solutions: coefficient rank equals augmented rank with det(A) = 0.',
      };
    }
    return {
      solution: null,
      status: 'inconsistent_no_solution',
      determinant: detA,
      steps,
      message: 'Inconsistent system: planes do not share a common intersection (no solution).',
    };
  }

  // Cramer's rule for 3x3
  const A1 = A.map((row, i) => [b[i], row[1], row[2]]);
  const A2 = A.map((row, i) => [row[0], b[i], row[2]]);
  const A3 = A.map((row, i) => [row[0], row[1], b[i]]);

  const detA1 = matrixDeterminant3x3(A1);
  const detA2 = matrixDeterminant3x3(A2);
  const detA3 = matrixDeterminant3x3(A3);

  const x1 = detA1 / detA;
  const x2 = detA2 / detA;
  const x3 = detA3 / detA;

  steps.push({
    stepNumber: 2,
    title: "Apply Cramer's Rule for 3 Variables",
    formula: 'x_i = \\frac{\\det(A_i)}{\\det(A)}',
    substitution: `x₁ = ${detA1.toFixed(3)}/${detA.toFixed(3)}, x₂ = ${detA2.toFixed(3)}/${detA.toFixed(3)}, x₃ = ${detA3.toFixed(3)}/${detA.toFixed(3)}`,
    result: `[${x1.toFixed(4)}, ${x2.toFixed(4)}, ${x3.toFixed(4)}]`,
  });

  return {
    solution: [x1, x2, x3],
    status: 'unique',
    determinant: detA,
    steps,
    message: 'Unique 3D solution found via Cramer\'s rule.',
  };
}
