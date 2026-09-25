import React, { useState, useMemo } from 'react';
import {
  calculateResistorFromColor,
  RESISTOR_COLORS,
  ResistorColor,
} from '../../engines/circuit/resistor-color';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';
import { CircuitDiagram } from '../common/CircuitDiagram';

export const ResistorColorTool: React.FC = () => {
  const [bandCount, setBandCount] = useState<4 | 5 | 6>(4);

  const [band1, setBand1] = useState<ResistorColor>('yellow');
  const [band2, setBand2] = useState<ResistorColor>('violet');
  const [band3, setBand3] = useState<ResistorColor>('red');
  const [band4, setBand4] = useState<ResistorColor>('gold');
  const [band5, setBand5] = useState<ResistorColor>('brown');
  const [band6, setBand6] = useState<ResistorColor>('red');

  const result = useMemo(() => {
    return calculateResistorFromColor({
      bandCount,
      band1,
      band2,
      band3,
      band4,
      band5: bandCount >= 5 ? band5 : undefined,
      band6: bandCount === 6 ? band6 : undefined,
    });
  }, [bandCount, band1, band2, band3, band4, band5, band6]);

  const digitColors: ResistorColor[] = [
    'black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'
  ];

  const multiplierColors: ResistorColor[] = [
    'black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'gold', 'silver'
  ];

  const toleranceColors: ResistorColor[] = [
    'brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver'
  ];

  const tempcoColors: ResistorColor[] = [
    'brown', 'red', 'orange', 'yellow', 'blue', 'violet'
  ];

  const renderColorSelect = (
    label: string,
    value: ResistorColor,
    onChange: (c: ResistorColor) => void,
    palette: ResistorColor[]
  ) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-300">{label}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {palette.map((c) => {
            const info = RESISTOR_COLORS[c];
            const isSelected = value === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-500/40 bg-slate-800'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-700/80 shrink-0"
                  style={{ backgroundColor: info.hex }}
                />
                <span className="truncate">{info.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Band Count Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Select Number of Bands</h3>
          <p className="text-xs text-slate-400">IEC 60062 Standard Color Code System</p>
        </div>
        <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
          {[4, 5, 6].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setBandCount(num as any)}
              className={`px-4 py-1.5 text-xs font-bold font-mono rounded-md transition-all cursor-pointer ${
                bandCount === num
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {num} Bands
            </button>
          ))}
        </div>
      </div>

      {/* Visual Resistor Canvas */}
      <CircuitDiagram type="resistor-color" data={result.visualData || {}} />

      {/* Band Selectors */}
      <div className="flex flex-col gap-5 p-5 rounded-xl border border-slate-800 bg-slate-900/50">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
          Resistor Color Bands Configuration
        </span>

        {renderColorSelect('1st Band (Significant Digit)', band1, setBand1, digitColors)}
        {renderColorSelect('2nd Band (Significant Digit)', band2, setBand2, digitColors)}

        {bandCount >= 5 ? (
          <>
            {renderColorSelect('3rd Band (Significant Digit)', band3, setBand3, digitColors)}
            {renderColorSelect('4th Band (Multiplier)', band4, setBand4, multiplierColors)}
            {renderColorSelect('5th Band (Tolerance)', band5, setBand5, toleranceColors)}
            {bandCount === 6 &&
              renderColorSelect('6th Band (Temperature Coefficient)', band6, setBand6, tempcoColors)}
          </>
        ) : (
          <>
            {renderColorSelect('3rd Band (Multiplier)', band3, setBand3, multiplierColors)}
            {renderColorSelect('4th Band (Tolerance)', band4, setBand4, toleranceColors)}
          </>
        )}
      </div>

      <ResultCard result={result} />
      <StepExplanation steps={result.steps} />
    </div>
  );
};
