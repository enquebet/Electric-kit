# ElectroKit Calculation Engine Architecture & Developer Guide

## 1. Architectural Overview
ElectroKit follows a strict unidirectional, decoupled calculation architecture:

```
[ UI Component (React) ] 
       │ 
       ▼ (Passes typed inputs in base SI units)
[ Calculation Engine (Pure TS Function) ]
       │ 
       ├── 1. Mathematical formulas & checks
       ├── 2. Step-by-step mathematical breakdown
       ├── 3. Standard component snapping (E-series)
       ├── 4. Centralized safety audit checks
       └── 5. Interactive visual data generation
       │ 
       ▼
[ CalculationResult ] 
       │ 
       ├── primaryValue, formattedValue, unit, label
       ├── standardValue (E12/E24/E96 match)
       ├── powerDissipation (recommended rating)
       ├── warnings (danger / warning / info)
       ├── steps (formula, substitution, result)
       └── visualData (used by visualizers, e.g. SVG schematics)
```

**Cardinal Rules**:
1. **100% Client-Side**: No network requests, no server APIs.
2. **Pure Functions**: Engines are stateless, idempotent, and have no side effects.
3. **Never Throw**: An engine must never crash or throw unhandled exceptions. Edge cases must produce `Infinity`, `0`, or safe fallbacks along with appropriate `EngineeringWarning` objects.

---

## 2. Engine Interface Contract

Every engine file in `src/engines/<category>/` must define:
1. `Inputs` interface.
2. The calculation function returning `CalculationResult`.

```typescript
import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity, formatSignificantFigures } from '../../lib/units/formatter';
import { checkVoltageSafety } from '../../lib/safety/disclaimers';

export interface MyToolInputs {
  parameterA: number; // Base SI unit
  parameterB?: number;
}

export function calculateMyTool(inputs: MyToolInputs): CalculationResult {
  const { parameterA, parameterB = 1 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  // 1. Guard against edge cases
  if (parameterA <= 0) {
    warnings.push({
      severity: 'warning',
      title: 'Invalid Operating Range',
      message: 'Parameter must be strictly positive.',
    });
  }

  // 2. Perform core physics/math
  const primaryValue = parameterA * parameterB;

  // 3. Document mathematical steps for transparency
  steps.push({
    stepNumber: 1,
    title: 'Calculate Primary Output',
    formula: 'X = A × B',
    substitution: `X = ${parameterA} × ${parameterB}`,
    result: formatQuantity(primaryValue, 'voltage'),
  });

  // 4. Safety checks
  const vWarn = checkVoltageSafety(primaryValue);
  if (vWarn) warnings.push(vWarn);

  return {
    primaryValue,
    formattedValue: formatQuantity(primaryValue, 'voltage'),
    unit: 'V',
    label: 'Calculated Voltage',
    warnings,
    steps,
    visualData: {
      parameterA,
      parameterB,
      primaryValue,
    },
  };
}
```

---

## 3. Visual Data Contract
The `visualData` dictionary inside `CalculationResult` enables UI components to render interactive SVG schematics, phase angle diagrams, frequency spectrum views, and color band graphics:
- Keep all values in raw numeric or basic string form so graphics components can compute geometric offsets (e.g. SVG heights, arc angles, gradient positions).
- Do not pass formatted strings into `visualData` unless specifically intended for label rendering.

---

## 4. Registering a New Tool in Phase 03
When adding future tools to ElectroKit:
1. **Engine**: Implement `src/engines/<domain>/<tool-slug>.ts`.
2. **Component**: Implement `src/components/tools/<ToolComponent>.tsx` utilizing reusable UI components (`InputWithUnit`, `ResultDisplay`, `SafetyBanner`, `CalculationStepsList`).
3. **Registry**: Add tool metadata in `src/data/registry.ts` with taxonomy category, subcategory, keywords, formulas, and schema.
4. **Formula Book**: Add corresponding theoretical derivation to `src/data/formulas.ts`.
5. **Unit Verification**: Append verification assertions to `tests/engineering-audit.ts` and run `npm test`.
