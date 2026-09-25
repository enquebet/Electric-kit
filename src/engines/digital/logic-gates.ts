import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';

export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

export interface LogicGateInputs {
  gateType: GateType;
  inputs: boolean[];
}

export function evaluateGate(gateType: GateType, inputs: boolean[]): boolean {
  if (inputs.length === 0) return false;

  switch (gateType) {
    case 'NOT':
      return !inputs[0];
    case 'AND':
      return inputs.every((b) => b);
    case 'OR':
      return inputs.some((b) => b);
    case 'NAND':
      return !inputs.every((b) => b);
    case 'NOR':
      return !inputs.some((b) => b);
    case 'XOR':
      // Odd parity of true inputs
      return inputs.filter((b) => b).length % 2 === 1;
    case 'XNOR':
      return inputs.filter((b) => b).length % 2 === 0;
  }
}

export function calculateLogicGate(inputs: LogicGateInputs): CalculationResult {
  const { gateType, inputs: gateInputs } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const actualInputs = gateType === 'NOT' ? [gateInputs[0] ?? false] : gateInputs;
  const output = evaluateGate(gateType, actualInputs);

  const inputNames = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, actualInputs.length);
  const inputStr = actualInputs.map((val, i) => `${inputNames[i]}=${val ? '1' : '0'}`).join(', ');

  let expression = '';
  switch (gateType) {
    case 'AND':
      expression = inputNames.join(' · ');
      break;
    case 'OR':
      expression = inputNames.join(' + ');
      break;
    case 'NOT':
      expression = `¬${inputNames[0]}`;
      break;
    case 'NAND':
      expression = `¬(${inputNames.join(' · ')})`;
      break;
    case 'NOR':
      expression = `¬(${inputNames.join(' + ')})`;
      break;
    case 'XOR':
      expression = inputNames.join(' ⊕ ');
      break;
    case 'XNOR':
      expression = `¬(${inputNames.join(' ⊕ ')})`;
      break;
  }

  steps.push({
    stepNumber: 1,
    title: `Evaluate ${gateType} Gate`,
    formula: `Y = ${expression}`,
    substitution: `Inputs: ${inputStr}`,
    result: `Output Y = ${output ? '1 (HIGH)' : '0 (LOW)'}`,
  });

  // Generate truth table for up to 4 inputs
  const numInputs = Math.min(actualInputs.length, 4);
  const totalRows = Math.pow(2, numInputs);
  const truthTable: { inputs: number[]; output: number }[] = [];

  for (let r = 0; r < totalRows; r++) {
    const rowInputs: boolean[] = [];
    for (let c = 0; c < numInputs; c++) {
      const bit = (r >> (numInputs - 1 - c)) & 1;
      rowInputs.push(bit === 1);
    }
    const rowOut = evaluateGate(gateType, rowInputs);
    truthTable.push({
      inputs: rowInputs.map((b) => (b ? 1 : 0)),
      output: rowOut ? 1 : 0,
    });
  }

  return {
    primaryValue: output ? 1 : 0,
    formattedValue: output ? '1 (HIGH)' : '0 (LOW)',
    unit: '',
    label: `${gateType} Gate Output`,
    classification: 'THEORETICAL',
    standardsContext: 'IEEE Std 91/91a-1991 Graphic Symbols for Logic Functions.',
    warnings,
    steps,
    additionalOutputs: {
      gateType: {
        label: 'Gate Architecture',
        value: gateType,
        note: `${actualInputs.length} input(s)`,
      },
      booleanExpression: {
        label: 'Boolean Expression',
        value: `Y = ${expression}`,
      },
      outputLevel: {
        label: 'Logic Voltage State',
        value: output ? 'V_OH (High Level)' : 'V_OL (Low Level)',
      },
    },
    visualData: {
      gateType,
      actualInputs,
      output,
      expression,
      inputNames,
      truthTable,
    },
  };
}

export function generateTruthTable(
  gateType: GateType,
  numInputs: number = 2
): { inputs: number[]; output: number }[] {
  const clampedInputs = Math.max(1, Math.min(numInputs, 4));
  const totalRows = Math.pow(2, clampedInputs);
  const rows: { inputs: number[]; output: number }[] = [];

  for (let r = 0; r < totalRows; r++) {
    const rowInputs: boolean[] = [];
    for (let c = 0; c < clampedInputs; c++) {
      const bit = (r >> (clampedInputs - 1 - c)) & 1;
      rowInputs.push(bit === 1);
    }
    const rowOut = evaluateGate(gateType, rowInputs);
    rows.push({
      inputs: rowInputs.map((b) => (b ? 1 : 0)),
      output: rowOut ? 1 : 0,
    });
  }
  return rows;
}


// -------------------------------------------------------------
// Karnaugh Map Solver (2, 3, and 4 variables)
// -------------------------------------------------------------
export interface KMapInputs {
  variables: 2 | 3 | 4;
  minterms: number[]; // e.g. [0, 1, 2, 5, 7]
  dontCares?: number[]; // optional don't-care indices
}

export interface KMapGroup {
  terms: number[];
  size: number;
  expression: string;
}

export interface KMapResult {
  variables: 2 | 3 | 4;
  rowLabels: string[];
  colLabels: string[];
  grid: (0 | 1 | 'X')[][];
  minterms: number[];
  sopExpression: string;
  groups: KMapGroup[];
}

export function solveKarnaughMap(inputs: KMapInputs): CalculationResult {
  const { variables: numVars, minterms, dontCares = [] } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const totalCells = Math.pow(2, numVars);
  const mintermSet = new Set(minterms);
  const dontCareSet = new Set(dontCares);

  // Determine grid dimensions and Gray codes
  // 2-var: rows A (0, 1), cols B (0, 1)
  // 3-var: rows A (0, 1), cols BC (00, 01, 11, 10)
  // 4-var: rows AB (00, 01, 11, 10), cols CD (00, 01, 11, 10)
  const gray2 = ['00', '01', '11', '10'];
  const gray1 = ['0', '1'];

  const rowCodes = numVars === 4 ? gray2 : gray1;
  const colCodes = numVars >= 3 ? gray2 : gray1;

  const numRows = rowCodes.length;
  const numCols = colCodes.length;

  const grid: (0 | 1 | 'X')[][] = [];
  const cellMintermIndex: number[][] = [];

  for (let r = 0; r < numRows; r++) {
    grid[r] = [];
    cellMintermIndex[r] = [];
    for (let c = 0; c < numCols; c++) {
      const bitStr = rowCodes[r] + colCodes[c];
      const mIndex = parseInt(bitStr, 2);
      cellMintermIndex[r][c] = mIndex;
      if (dontCareSet.has(mIndex)) {
        grid[r][c] = 'X';
      } else if (mintermSet.has(mIndex)) {
        grid[r][c] = 1;
      } else {
        grid[r][c] = 0;
      }
    }
  }

  // Find prime implicants for SOP
  // Find rectangular power-of-2 groups (size 16, 8, 4, 2, 1) wrapping toroidally
  const varNames = ['A', 'B', 'C', 'D'].slice(0, numVars);

  // Helper to extract term string from set of minterm indices
  const getGroupExpression = (terms: number[]): string => {
    const parts: string[] = [];
    for (let bit = 0; bit < numVars; bit++) {
      const shift = numVars - 1 - bit;
      const firstBit = (terms[0] >> shift) & 1;
      const allMatch = terms.every((t) => ((t >> shift) & 1) === firstBit);
      if (allMatch) {
        parts.push(firstBit === 1 ? varNames[bit] : `¬${varNames[bit]}`);
      }
    }
    return parts.length === 0 ? '1' : parts.join('');
  };

  const candidateGroups: KMapGroup[] = [];

  // Group sizes to test: [16, 8, 4, 2, 1]
  const validSizes = [
    { rows: 4, cols: 4, size: 16 },
    { rows: 4, cols: 2, size: 8 },
    { rows: 2, cols: 4, size: 8 },
    { rows: 2, cols: 2, size: 4 },
    { rows: 4, cols: 1, size: 4 },
    { rows: 1, cols: 4, size: 4 },
    { rows: 2, cols: 1, size: 2 },
    { rows: 1, cols: 2, size: 2 },
    { rows: 1, cols: 1, size: 1 },
  ].filter((dim) => dim.rows <= numRows && dim.cols <= numCols && dim.size <= totalCells);

  for (const { rows: gRows, cols: gCols, size } of validSizes) {
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const termsInGroup: number[] = [];
        let allValid = true;

        for (let dr = 0; dr < gRows; dr++) {
          for (let dc = 0; dc < gCols; dc++) {
            const wrapR = (r + dr) % numRows;
            const wrapC = (c + dc) % numCols;
            const cellVal = grid[wrapR][wrapC];
            if (cellVal === 0) {
              allValid = false;
              break;
            }
            termsInGroup.push(cellMintermIndex[wrapR][wrapC]);
          }
          if (!allValid) break;
        }

        if (allValid && termsInGroup.length > 0) {
          // Must contain at least one 1 (not solely don't-cares)
          const hasAtLeastOne1 = termsInGroup.some((t) => mintermSet.has(t));
          if (hasAtLeastOne1) {
            const sortedTerms = [...new Set(termsInGroup)].sort((a, b) => a - b);
            // Check if already captured
            const existing = candidateGroups.some(
              (g) => g.terms.length === sortedTerms.length && g.terms.every((t, i) => t === sortedTerms[i])
            );
            if (!existing) {
              candidateGroups.push({
                terms: sortedTerms,
                size,
                expression: getGroupExpression(sortedTerms),
              });
            }
          }
        }
      }
    }
  }

  // Greedy set-cover for prime implicants covering all mintermSet
  const coveredMinterms = new Set<number>();
  const chosenGroups: KMapGroup[] = [];

  // Sort candidate groups by largest size first, then shortest expression
  candidateGroups.sort((a, b) => b.size - a.size);

  for (const group of candidateGroups) {
    const newlyCovered = group.terms.filter((t) => mintermSet.has(t) && !coveredMinterms.has(t));
    if (newlyCovered.length > 0) {
      chosenGroups.push(group);
      newlyCovered.forEach((t) => coveredMinterms.add(t));
    }
    if (coveredMinterms.size === mintermSet.size) break;
  }

  let sopExpression = '0';
  if (mintermSet.size === totalCells) {
    sopExpression = '1';
  } else if (chosenGroups.length > 0) {
    sopExpression = chosenGroups.map((g) => g.expression).join(' + ');
  }

  steps.push({
    stepNumber: 1,
    title: `Construct ${numVars}-Variable Karnaugh Map Grid`,
    formula: `Gray Code sequence: Rows [${rowCodes.join(', ')}], Columns [${colCodes.join(', ')}]`,
    substitution: `Active minterms Σm(${Array.from(mintermSet).sort((a, b) => a - b).join(', ')})`,
    result: `Identified ${chosenGroups.length} optimal rectangular prime implicant groups`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Extract Minimal Sum-of-Products (SOP)',
    formula: 'Y = ∑ Prime Implicants',
    substitution: chosenGroups.map((g) => `Group[${g.terms.join(',')}] → ${g.expression}`).join(' ; ') || 'No terms',
    result: `Y = ${sopExpression}`,
  });

  return {
    primaryValue: chosenGroups.length,
    formattedValue: sopExpression,
    unit: '',
    label: 'Minimized Boolean SOP',
    classification: 'THEORETICAL',
    standardsContext: 'Maurice Karnaugh (1953) map minimization for combinational digital logic.',
    warnings,
    steps,
    additionalOutputs: {
      simplifiedSop: {
        label: 'Sum of Products (SOP)',
        value: `Y = ${sopExpression}`,
      },
      mintermsList: {
        label: 'Canonical Minterms',
        value: `Σm(${Array.from(mintermSet).sort((a, b) => a - b).join(', ')})`,
      },
      groupsCount: {
        label: 'Prime Implicant Groups',
        value: chosenGroups.length.toString(),
        note: chosenGroups.map((g) => g.expression).join(', '),
      },
    },
    visualData: {
      numVars,
      rowCodes,
      colCodes,
      grid,
      cellMintermIndex,
      chosenGroups,
      sopExpression,
    },
  };
}
