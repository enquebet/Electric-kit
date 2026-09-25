import React, { useState, useMemo } from 'react';
import {
  calculateLogicGate,
  generateTruthTable,
  solveKarnaughMap,
  GateType,
} from '../../engines/digital/logic-gates';
import { ResultCard } from '../common/ResultCard';
import { StepExplanation } from '../common/StepExplanation';

export const LogicDesignTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gates' | 'kmap'>('gates');

  // Gates State
  const [gateType, setGateType] = useState<GateType>('NAND');
  const [inputCount, setInputCount] = useState<number>(2);
  const [inputStates, setInputStates] = useState<boolean[]>([true, true, false, false]);

  // K-Map State
  const [kmapVars, setKmapVars] = useState<2 | 3 | 4>(3);
  const [selectedMinterms, setSelectedMinterms] = useState<number[]>([0, 1, 2, 3]);

  // Gate Calculation
  const activeInputs = useMemo(() => {
    return gateType === 'NOT' ? [inputStates[0]] : inputStates.slice(0, inputCount);
  }, [gateType, inputStates, inputCount]);

  const gateResult = useMemo(() => {
    return calculateLogicGate({
      gateType,
      inputs: activeInputs,
    });
  }, [gateType, activeInputs]);

  const truthTable = useMemo(() => {
    return generateTruthTable(gateType, gateType === 'NOT' ? 1 : inputCount);
  }, [gateType, inputCount]);

  // K-Map Calculation
  const kmapResult = useMemo(() => {
    return solveKarnaughMap({
      variables: kmapVars,
      minterms: selectedMinterms,
    });
  }, [kmapVars, selectedMinterms]);

  const toggleInputState = (idx: number) => {
    setInputStates((prev) => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  const toggleMinterm = (m: number) => {
    setSelectedMinterms((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const totalMintermsCount = 1 << kmapVars;

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('gates')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'gates'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Logic Gates &amp; Truth Tables
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kmap')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'kmap'
              ? 'bg-slate-900 border-t-2 border-cyan-400 text-cyan-300 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          Karnaugh Map (K-Map) Solver
        </button>
      </div>

      {/* TAB 1: Logic Gates */}
      {activeTab === 'gates' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          {/* Gate Selection Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Logic Gate Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'] as GateType[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGateType(g)}
                  className={`p-3 rounded-lg border text-center font-bold text-sm transition-all cursor-pointer ${
                    gateType === g
                      ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 ring-1 ring-cyan-500/30'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Gate Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 flex flex-col gap-4 p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Input Terminals
                </span>
                {gateType !== 'NOT' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Inputs:</span>
                    {[2, 3, 4].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setInputCount(cnt)}
                        className={`px-2 py-0.5 text-xs font-mono font-bold rounded cursor-pointer ${
                          inputCount === cnt ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2.5">
                {activeInputs.map((val, idx) => {
                  const label = String.fromCharCode(65 + idx); // A, B, C, D
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/80"
                    >
                      <span className="text-sm font-bold text-slate-200">Terminal {label}</span>
                      <button
                        type="button"
                        onClick={() => toggleInputState(idx)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          val
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {val ? 'HIGH (1)' : 'LOW (0)'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Output Monitor */}
              <div className="mt-2 p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-300">Gate Output (Y)</span>
                <span
                  className={`px-4 py-1.5 rounded-lg text-sm font-mono font-bold ${
                    gateResult.primaryValue === 1
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-rose-950 border border-rose-800 text-rose-300'
                  }`}
                >
                  {gateResult.primaryValue === 1 ? '1 (HIGH)' : '0 (LOW)'}
                </span>
              </div>
            </div>

            {/* Dynamic Truth Table */}
            <div className="md:col-span-6 flex flex-col gap-2 p-4 rounded-xl border border-slate-800 bg-slate-950">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Comprehensive Truth Table ({gateType})
              </span>
              <div className="overflow-y-auto max-h-64 border border-slate-800 rounded-lg">
                <table className="w-full text-center text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      {Array.from({ length: gateType === 'NOT' ? 1 : inputCount }).map((_, i) => (
                        <th key={i} className="p-2">
                          {String.fromCharCode(65 + i)}
                        </th>
                      ))}
                      <th className="p-2 text-cyan-300 font-bold">Y (Output)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {truthTable.map((row, rIdx) => {
                      const isCurrentState =
                        row.inputs.length === activeInputs.length &&
                        row.inputs.every((val, i) => val === (activeInputs[i] ? 1 : 0));
                      return (
                        <tr
                          key={rIdx}
                          className={`${
                            isCurrentState ? 'bg-cyan-950/60 font-bold text-cyan-200' : 'hover:bg-slate-900/40'
                          }`}
                        >
                          {row.inputs.map((val, cIdx) => (
                            <td key={cIdx} className="p-2">
                              {val}
                            </td>
                          ))}
                          <td
                            className={`p-2 font-bold ${
                              row.output === 1 ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {row.output}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <ResultCard result={gateResult} />
          <StepExplanation steps={gateResult.steps} />
        </div>
      )}

      {/* TAB 2: Karnaugh Map Solver */}
      {activeTab === 'kmap' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Karnaugh Map Dimension (Variables)
            </span>
            <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
              {[2, 3, 4].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setKmapVars(v as 2 | 3 | 4);
                    setSelectedMinterms(selectedMinterms.filter((m) => m < 1 << v));
                  }}
                  className={`px-4 py-1.5 text-xs font-mono font-bold rounded cursor-pointer ${
                    kmapVars === v ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v} Vars ({v === 2 ? 'A,B' : v === 3 ? 'A,B,C' : 'A,B,C,D'})
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Minterm Grid */}
          <div className="flex flex-col gap-3 p-5 rounded-xl border border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Click Cells to Toggle Minterm (1 = ON / active minterm, 0 = OFF / zero)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMinterms(Array.from({ length: totalMintermsCount }, (_, i) => i))}
                  className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  All 1s
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMinterms([])}
                  className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Clear (All 0s)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
              {Array.from({ length: totalMintermsCount }).map((_, m) => {
                const isSelected = selectedMinterms.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMinterm(m)}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-900/50 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-slate-400">m{m}</span>
                    <span className="text-base font-mono font-bold mt-1">{isSelected ? '1' : '0'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <ResultCard result={kmapResult} />
          <StepExplanation steps={kmapResult.steps} />
        </div>
      )}
    </div>
  );
};
