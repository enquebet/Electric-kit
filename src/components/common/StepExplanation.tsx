import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FunctionSquare } from 'lucide-react';
import { CalculationStep } from '../../types/tool';

interface StepExplanationProps {
  steps: CalculationStep[];
}

export const StepExplanation: React.FC<StepExplanationProps> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 mt-4 shadow-sm">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <FunctionSquare className="w-4 h-4 text-cyan-400" />
          <span>Step-by-Step Engineering Derivation</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </span>
        </div>
        <button
          type="button"
          aria-label={isExpanded ? 'Collapse derivation' : 'Expand derivation'}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 flex flex-col gap-3.5 border-t border-slate-800/80 pt-3">
          {steps.map((step) => (
            <div
              key={step.stepNumber}
              id={`step-${step.stepNumber}`}
              className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-3 flex flex-col gap-2 font-mono text-xs"
            >
              <div className="flex items-center justify-between text-slate-300 font-sans font-medium text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center font-mono text-[11px] font-bold">
                    {step.stepNumber}
                  </span>
                  <span>{step.title}</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                  {step.result}
                </span>
              </div>

              <div className="pl-7 flex flex-col gap-1 text-[11px]">
                <div className="text-slate-400">
                  <span className="text-slate-500 mr-2">Formula:</span>
                  <span className="text-cyan-300 font-semibold">{step.formula}</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500 mr-2">Substituted:</span>
                  <span>{step.substitution}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
