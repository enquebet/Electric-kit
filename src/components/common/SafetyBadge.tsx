import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { EngineeringWarning } from '../../types/tool';

interface SafetyBadgeProps {
  warnings: EngineeringWarning[];
}

export const SafetyBadge: React.FC<SafetyBadgeProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 my-3">
      {warnings.map((w, idx) => {
        const isDanger = w.severity === 'danger';
        const isWarning = w.severity === 'warning';

        return (
          <div
            key={idx}
            id={`warning-${idx}`}
            className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 transition-all ${
              isDanger
                ? 'bg-rose-950/40 border-rose-600/60 text-rose-200'
                : isWarning
                ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
                : 'bg-sky-950/30 border-sky-700/50 text-sky-200'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isDanger ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : isWarning ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <Info className="w-4 h-4 text-sky-400" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold tracking-wide flex items-center gap-1.5 uppercase text-[10px] opacity-90">
                {w.title}
              </span>
              <p className="text-slate-300 font-normal">{w.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
