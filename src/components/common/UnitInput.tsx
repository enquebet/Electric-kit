import React from 'react';
import { QuantityType } from '../../types/units';
import { UNITS_REGISTRY } from '../../lib/units/quantities';

interface UnitInputProps {
  id: string;
  label: string;
  symbol: string;
  quantity: QuantityType;
  value: number | string;
  unit: string;
  onChangeValue: (newVal: number) => void;
  onChangeUnit?: (newUnit: string) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  disabled?: boolean;
}

export const UnitInput: React.FC<UnitInputProps> = ({
  id,
  label,
  symbol,
  quantity,
  value,
  unit,
  onChangeValue,
  onChangeUnit,
  min,
  max,
  step,
  description,
  disabled = false,
}) => {
  const units = UNITS_REGISTRY[quantity] || [];
  const [localInput, setLocalInput] = React.useState<string>(String(value));
  const [isFocused, setIsFocused] = React.useState(false);

  // Synchronize local input when prop value changes from outside (e.g. presets, reset), unless user is actively editing
  React.useEffect(() => {
    if (!isFocused) {
      setLocalInput(String(value));
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalInput(raw);

    if (raw === '' || raw === '-' || raw === '.') {
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChangeValue(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localInput === '' || localInput === '-' || localInput === '.') {
      setLocalInput('0');
      onChangeValue(0);
    } else {
      const parsed = parseFloat(localInput);
      if (!isNaN(parsed)) {
        setLocalInput(String(parsed));
        onChangeValue(parsed);
      } else {
        setLocalInput('0');
        onChangeValue(0);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
            {symbol}
          </span>
        </label>
        {description && (
          <span className="text-[11px] text-slate-500 hidden sm:inline">{description}</span>
        )}
      </div>

      <div className="flex rounded-lg border border-slate-700 bg-slate-900/90 shadow-inner focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all overflow-hidden">
        <input
          id={id}
          type="number"
          value={isFocused ? localInput : value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step ?? 'any'}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm font-mono text-slate-100 bg-transparent outline-none placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="0.0"
        />

        {units.length > 1 && onChangeUnit ? (
          <select
            id={`${id}-unit-select`}
            value={unit}
            onChange={(e) => onChangeUnit(e.target.value)}
            disabled={disabled}
            aria-label={`${label} unit`}
            className="px-2.5 py-2 text-xs font-mono font-medium text-cyan-300 bg-slate-800/80 border-l border-slate-700 outline-none hover:bg-slate-800 cursor-pointer transition-colors"
          >
            {units.map((u) => (
              <option key={u.symbol} value={u.symbol} className="bg-slate-900 text-slate-200">
                {u.symbol} ({u.name})
              </option>
            ))}
          </select>
        ) : (
          <span className="px-3 py-2 text-xs font-mono font-semibold text-slate-400 bg-slate-800/50 border-l border-slate-700 flex items-center">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
