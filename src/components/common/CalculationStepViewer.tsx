import React from 'react';
import { StepExplanation } from './StepExplanation';
import { CalculationStep } from '../../types/tool';

export type FlexibleStep = CalculationStep | {
  stepNumber?: number;
  title: string;
  formula: string;
  substitution: string;
  result?: string;
  annotation?: string;
};

interface CalculationStepViewerProps {
  steps: FlexibleStep[];
}

export const CalculationStepViewer: React.FC<CalculationStepViewerProps> = ({ steps }) => {
  const normalizedSteps: CalculationStep[] = steps.map((s, idx) => ({
    stepNumber: s.stepNumber ?? (idx + 1),
    title: s.title,
    formula: s.formula,
    substitution: s.substitution,
    result: s.result ?? s.substitution,
    annotation: s.annotation,
  }));
  return <StepExplanation steps={normalizedSteps} />;
};

export default CalculationStepViewer;
