import React, { useState } from 'react';
import { Check, Copy, Flame, Layers } from 'lucide-react';
import { CalculationResult } from '../../types/tool';
import { SafetyBadge } from './SafetyBadge';

interface ResultCardProps {
  result?: CalculationResult;
  label?: string;
  title?: string;
  value?: string | number;
  unit?: string;
  highlight?: boolean;
  subtext?: string;
  subtitle?: string;
  classification?: string;
  status?: string;
  warning?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  label,
  title,
  value,
  unit,
  highlight,
  subtext,
  subtitle,
  classification,
  status,
  warning,
}) => {
  const [copied, setCopied] = useState(false);

  const finalLabel = label ?? title;
  const finalSubtext = subtext ?? subtitle;
  const finalClassification = classification ?? status;

  const formattedStr = value !== undefined
    ? `${value}${unit ? ` ${unit}` : ''}`
    : undefined;

  const effectiveResult: CalculationResult | undefined = result || (finalLabel || value !== undefined ? {
    label: finalLabel,
    primaryValue: typeof value === 'number' ? value : 0,
    formattedValue: formattedStr || (typeof value === 'string' ? value : String(value ?? '')),
    classification: (finalClassification as any) || 'THEORETICAL',
    warnings: warning ? [{ severity: 'warning', title: 'Notice', message: warning }] : [],
    standardsContext: finalSubtext,
    steps: [],
  } : undefined);

  if (!effectiveResult) {
    return null;
  }

  const displayLabel = effectiveResult.label || 'Calculation Result';
  const displayValue =
    effectiveResult.formattedValue ||
    effectiveResult.formattedResult ||
    (effectiveResult.primaryUnit ? `${effectiveResult.primaryValue} ${effectiveResult.primaryUnit}` : effectiveResult.unit ? `${effectiveResult.primaryValue} ${effectiveResult.unit}` : String(effectiveResult.primaryValue ?? '—'));

  const handleCopy = () => {
    const textToCopy = `${displayLabel}: ${displayValue}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validAdditionalEntries = effectiveResult.additionalOutputs
    ? Object.entries(effectiveResult.additionalOutputs).filter(
        ([_, item]) => item !== null && item !== undefined
      )
    : [];

  return (
    <div className="rounded-xl border border-slate-700/80 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-lg flex flex-col gap-4">
      {/* Primary Result Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 font-sans">
              {displayLabel}
            </span>
            {effectiveResult.classification && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                  effectiveResult.classification === 'THEORETICAL'
                    ? 'bg-blue-950/60 border-blue-800/70 text-blue-300'
                    : effectiveResult.classification === 'ENGINEERING ESTIMATE'
                    ? 'bg-amber-950/60 border-amber-800/70 text-amber-300'
                    : effectiveResult.classification === 'STANDARDS-DEPENDENT'
                    ? 'bg-emerald-950/60 border-emerald-800/70 text-emerald-300'
                    : effectiveResult.classification === 'COMPONENT-DATA DEPENDENT'
                    ? 'bg-purple-950/60 border-purple-800/70 text-purple-300'
                    : 'bg-cyan-950/60 border-cyan-800/70 text-cyan-300'
                }`}
              >
                {effectiveResult.classification}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-300 tracking-tight">
              {displayValue}
            </span>
          </div>
          {effectiveResult.standardsContext && (
            <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
              {effectiveResult.standardsContext}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy result to clipboard"
          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all active:scale-95 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Standard EIA Series Recommendation */}
      {effectiveResult.standardValue && (
        <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">
                Nearest Standard Value ({effectiveResult.standardValue.series})
              </span>
              <span className="text-[11px] text-slate-400">
                Nominal: <span className="font-mono text-slate-300">{effectiveResult.standardValue.formattedNominal}</span>
                {' · '}
                Tolerance error: <span className={`font-mono font-medium ${Math.abs(effectiveResult.standardValue.deviationPercent) < 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {effectiveResult.standardValue.deviationPercent > 0 ? '+' : ''}{effectiveResult.standardValue.deviationPercent}%
                </span>
              </span>
            </div>
          </div>
          <div className="text-right sm:self-center">
            <span className="text-base font-bold font-mono text-amber-300 bg-amber-950/30 px-2.5 py-1 rounded border border-amber-800/40">
              {effectiveResult.standardValue.formattedRecommended}
            </span>
          </div>
        </div>
      )}

      {/* Power Dissipation & Thermal Rating Suggestion */}
      {effectiveResult.powerDissipation && (
        <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">
                Power Dissipation & Minimum Rating
              </span>
              <span className="text-[11px] text-slate-400">
                Thermal load: <span className="font-mono text-slate-300">{effectiveResult.powerDissipation.formatted}</span>
                {' · '}
                <span className="text-slate-400">{effectiveResult.powerDissipation.warning}</span>
              </span>
            </div>
          </div>
          <div className="text-right sm:self-center">
            <span className="text-xs font-semibold font-mono text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-800/40">
              {effectiveResult.powerDissipation.suggestedRating}
            </span>
          </div>
        </div>
      )}

      {/* Additional Output Parameters */}
      {validAdditionalEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {validAdditionalEntries.map(([key, item]) => {
            const anyItem = item as any;
            const itemLabel = typeof anyItem === 'object' && anyItem?.label ? anyItem.label : key;
            const itemValue = typeof anyItem === 'object' && anyItem?.value !== undefined ? anyItem.value : String(anyItem);
            const itemUnit = typeof anyItem === 'object' ? anyItem?.unit || '' : '';
            const itemNote = typeof anyItem === 'object' ? anyItem?.note : undefined;

            return (
              <div
                key={key}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-0.5"
              >
                <span className="text-[11px] text-slate-400 font-medium">{itemLabel}</span>
                <span className="text-sm font-bold font-mono text-slate-100">
                  {itemValue} {itemUnit}
                </span>
                {itemNote && <span className="text-[10px] text-slate-500">{itemNote}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Contextual Engineering Safety Warnings */}
      <SafetyBadge warnings={effectiveResult.warnings || []} />
    </div>
  );
};
