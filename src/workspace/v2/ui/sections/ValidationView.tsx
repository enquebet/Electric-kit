import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import {
  EngineeringMeasurementV2,
  ValidationMilestoneV2,
  MeasurementVerdict,
} from '../../types/validation';
import { EntityIds } from '../../identity/id-generator';
import {
  CheckCircle,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  X,
  Gauge,
} from 'lucide-react';

interface ValidationViewProps {
  project: ElectroKitProjectV2;
  onUpdateMeasurements: (measurements: EngineeringMeasurementV2[]) => void;
  onUpdateMilestones: (milestones: ValidationMilestoneV2[]) => void;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  project,
  onUpdateMeasurements,
  onUpdateMilestones,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Measurement Form
  const [testPoint, setTestPoint] = useState('');
  const [parameter, setParameter] = useState('');
  const [nominalExpected, setNominalExpected] = useState<number>(5.0);
  const [measuredValue, setMeasuredValue] = useState<number>(5.02);
  const [unit, setUnit] = useState('V');
  const [tolerancePercent, setTolerancePercent] = useState<number>(5.0);
  const [instrument, setInstrument] = useState('');
  const [operator, setOperator] = useState('');

  const openCreateModal = () => {
    setTestPoint('TP_VOUT');
    setParameter('Output Voltage');
    setNominalExpected(5.0);
    setMeasuredValue(5.01);
    setUnit('V');
    setTolerancePercent(5.0);
    setInstrument('Keysight 34461A DMM');
    setOperator('Lab Engineer');
    setIsModalOpen(true);
  };

  const handleCreateMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPoint.trim() || !parameter.trim()) return;

    const deltaAbsolute = Math.abs(measuredValue - nominalExpected);
    const deltaPercent =
      nominalExpected !== 0
        ? Math.round((deltaAbsolute / nominalExpected) * 10000) / 100
        : 0;

    let verdict: MeasurementVerdict = 'pass';
    if (deltaPercent > tolerancePercent) {
      verdict = 'fail';
    } else if (deltaPercent > tolerancePercent * 0.8) {
      verdict = 'warning';
    }

    const newMeas: EngineeringMeasurementV2 = {
      id: EntityIds.measurement(),
      testPoint: testPoint.trim(),
      parameter: parameter.trim(),
      nominalExpected,
      measuredValue,
      unit: unit.trim(),
      tolerancePercent,
      deltaAbsolute: Math.round(deltaAbsolute * 1000) / 1000,
      deltaPercent,
      verdict,
      instrument: instrument.trim() || undefined,
      operator: operator.trim() || undefined,
      measurementMethod: 'Direct bench measurement',
      timestamp: new Date().toISOString(),
    };

    onUpdateMeasurements([newMeas, ...project.measurements]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdateMeasurements(project.measurements.filter(m => m.id !== id));
  };

  const filteredMeasurements = project.measurements.filter(m =>
    m.testPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.parameter.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.instrument && m.instrument.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            Hardware Validation & Lab Measurements
          </h2>
          <p className="text-xs text-slate-400">
            Compare expected theoretical calculation results against physical lab bench measurements.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Measurement</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search test points, parameters, instruments..."
          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
        />
      </div>

      {/* Measurements Table / Cards */}
      <div className="space-y-2.5">
        {filteredMeasurements.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No bench measurements recorded. Click &quot;Record Measurement&quot; to log hardware validation data.
          </div>
        ) : (
          filteredMeasurements.map(meas => {
            const isPass = meas.verdict === 'pass';
            const isWarn = meas.verdict === 'warning';
            return (
              <div
                key={meas.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm font-mono text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                      {meas.testPoint}
                    </span>
                    <span className="text-slate-300 font-bold">{meas.parameter}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isPass
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : isWarn
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      }`}
                    >
                      {meas.verdict}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-slate-400 pt-1">
                    <span>
                      Expected: <strong className="text-slate-200">{meas.nominalExpected} {meas.unit}</strong>
                    </span>
                    <span>
                      Measured: <strong className={isPass ? 'text-emerald-400' : 'text-rose-400'}>{meas.measuredValue} {meas.unit}</strong>
                    </span>
                    <span>
                      Delta: <strong className="text-slate-200">{meas.deltaPercent}%</strong> (Tol: ±{meas.tolerancePercent}%)
                    </span>
                  </div>

                  {meas.instrument && (
                    <div className="text-[11px] text-slate-500">
                      Instrument: {meas.instrument} • Operator: {meas.operator || 'Lab Engineer'}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(meas.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer self-end md:self-center"
                  title="Delete measurement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Record Measurement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Record Bench Measurement</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeasurement} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Test Point (TP) *</label>
                  <input
                    type="text"
                    required
                    value={testPoint}
                    onChange={e => setTestPoint(e.target.value)}
                    placeholder="TP_VOUT_5V"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Parameter *</label>
                  <input
                    type="text"
                    required
                    value={parameter}
                    onChange={e => setParameter(e.target.value)}
                    placeholder="Output Voltage"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Expected</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={nominalExpected}
                    onChange={e => setNominalExpected(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Measured</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={measuredValue}
                    onChange={e => setMeasuredValue(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tolerance (±%)</label>
                  <input
                    type="number"
                    step="any"
                    value={tolerancePercent}
                    onChange={e => setTolerancePercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Operator</label>
                  <input
                    type="text"
                    value={operator}
                    onChange={e => setOperator(e.target.value)}
                    placeholder="Lab Engineer"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Instrument</label>
                <input
                  type="text"
                  value={instrument}
                  onChange={e => setInstrument(e.target.value)}
                  placeholder="e.g. Keysight 34461A DMM, Fluke 87V"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
