import React, { useState } from 'react';
import { ElectroKitProject, ValidationItem, ValidationStatus, MeasurementPlaceholder } from '../types';
import {
  getValidationProgress,
  addValidationItem,
  updateValidationItem,
  deleteValidationItem,
  addMeasurement,
  compareMeasurementWithCalculated,
  addManufacturerPart,
  setManufacturerVerification,
} from '../validation-tracker';
import {
  ClipboardCheck,
  Plus,
  Trash2,
  ExternalLink,
  Activity,
  CheckCircle,
  AlertCircle,
  Cpu,
  Layers,
} from 'lucide-react';

interface ValidationTabProps {
  project: ElectroKitProject;
  onUpdateProject: (updated: ElectroKitProject) => void;
}

export const ValidationTab: React.FC<ValidationTabProps> = ({ project, onUpdateProject }) => {
  const [showAddVal, setShowAddVal] = useState(false);
  const [newValTitle, setNewValTitle] = useState('');
  const [newValCat, setNewValCat] = useState<ValidationItem['category']>('prototype');

  const [showAddMeas, setShowAddMeas] = useState(false);
  const [measTp, setMeasTp] = useState('');
  const [measParam, setMeasParam] = useState('');
  const [measVal, setMeasVal] = useState<number>(0);
  const [measCalc, setMeasCalc] = useState<number>(0);
  const [measUnit, setMeasUnit] = useState('V');
  const [measInstrument, setMeasInstrument] = useState('');

  const progress = getValidationProgress(project);

  const handleAddValidationItem = () => {
    if (!newValTitle) return;
    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    addValidationItem(clone, newValTitle, newValCat, true);
    onUpdateProject(clone);
    setNewValTitle('');
    setShowAddVal(false);
  };

  const handleUpdateItemStatus = (id: string, status: ValidationStatus) => {
    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    updateValidationItem(clone, id, { status });
    onUpdateProject(clone);
  };

  const handleDeleteItem = (id: string) => {
    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    deleteValidationItem(clone, id);
    onUpdateProject(clone);
  };

  const handleAddMeasurement = () => {
    if (!measTp || !measParam) return;
    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    addMeasurement(clone, {
      testPoint: measTp,
      parameter: measParam,
      measuredValue: measVal,
      unit: measUnit,
      measurementMethod: 'Laboratory bench Kelvin probe',
      instrument: measInstrument || 'True-RMS DMM',
    });
    onUpdateProject(clone);
    setMeasTp('');
    setMeasParam('');
    setShowAddMeas(false);
  };

  const handleTogglePartVerification = (id: string, current: boolean) => {
    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    setManufacturerVerification(clone, id, !current);
    onUpdateProject(clone);
  };

  return (
    <div className="space-y-6">
      {/* Progress & Readiness Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-cyan-400" />
              Hardware & Prototype Validation Tracker
            </h3>
            <p className="text-xs text-slate-400">
              Correlate mathematical calculations against real physical hardware measurements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {progress.percentComplete}% Complete
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>

        {/* Status Count Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Unvalidated</span>
            <span className="text-slate-300 font-bold">{progress.unvalidated}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Calculated</span>
            <span className="text-cyan-400 font-bold">{progress.calculated}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Reviewed</span>
            <span className="text-indigo-400 font-bold">{progress.reviewed}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">HW Validated</span>
            <span className="text-emerald-400 font-bold">{progress.hardwareValidated}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">Datasheet OK</span>
            <span className="text-teal-400 font-bold">{progress.verified}</span>
          </div>
        </div>
      </div>

      {/* Validation Checklist Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">
            Validation Milestones ({project.validationItems?.length || 0})
          </h3>
          <button
            onClick={() => setShowAddVal(!showAddVal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Milestone
          </button>
        </div>

        {showAddVal && (
          <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-cyan-800/50 space-y-3 text-xs">
            <h4 className="font-semibold text-cyan-400 font-mono">New Validation Milestone</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Verify switching frequency jitter on oscilloscope"
                  value={newValTitle}
                  onChange={(e) => setNewValTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={newValCat}
                  onChange={(e) => setNewValCat(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="prototype">Prototype Measurement</option>
                  <option value="thermal">Thermal Camera Scan</option>
                  <option value="electrical">Electrical Rail Stability</option>
                  <option value="battery">Battery Discharge Curve</option>
                  <option value="pcb">PCB DRC / Microsection</option>
                  <option value="si">Signal Integrity & TDR</option>
                  <option value="compliance">EMI / EMC Pre-Compliance</option>
                  <option value="datasheet">Datasheet Verification</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddVal(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddValidationItem}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-slate-950 font-medium hover:bg-cyan-500"
              >
                Save Milestone
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {(project.validationItems || []).map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700 uppercase">
                  {item.category}
                </span>
                <span className="font-sans text-slate-200 font-medium">{item.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={item.status}
                  onChange={(e) => handleUpdateItemStatus(item.id, e.target.value as ValidationStatus)}
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-300 font-mono"
                >
                  <option value="Unvalidated">Unvalidated</option>
                  <option value="Calculated">Calculated</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Hardware Validated">Hardware Validated</option>
                  <option value="Manufacturer Data Verified">Datasheet Verified</option>
                </select>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lab Measurements Comparison Table */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Lab Test Bench Measurements ({project.measurements?.length || 0})
            </h3>
            <p className="text-xs text-slate-400">
              Oscilloscope, DMM, and thermal measurements with calculated delta.
            </p>
          </div>
          <button
            onClick={() => setShowAddMeas(!showAddMeas)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            Log Measurement
          </button>
        </div>

        {showAddMeas && (
          <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-cyan-800/50 space-y-3 text-xs font-mono">
            <h4 className="font-semibold text-cyan-400 font-sans">Record Lab Measurement</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Test Point</label>
                <input
                  type="text"
                  placeholder="TP_VOUT"
                  value={measTp}
                  onChange={(e) => setMeasTp(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Parameter</label>
                <input
                  type="text"
                  placeholder="Vout DC"
                  value={measParam}
                  onChange={(e) => setMeasParam(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Measured Value</label>
                <input
                  type="number"
                  step="any"
                  value={measVal}
                  onChange={(e) => setMeasVal(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Unit</label>
                <input
                  type="text"
                  value={measUnit}
                  onChange={(e) => setMeasUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddMeas(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 font-sans"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMeasurement}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-slate-950 font-medium hover:bg-cyan-500 font-sans"
              >
                Save Measurement
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3">Test Point</th>
                <th className="py-2 px-3">Parameter</th>
                <th className="py-2 px-3">Measured</th>
                <th className="py-2 px-3">Instrument</th>
                <th className="py-2 px-3">Method</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(project.measurements || []).map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{m.testPoint}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-sans">{m.parameter}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">
                    {m.measuredValue} {m.unit}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{m.instrument || '-'}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">{m.measurementMethod}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        const clone = JSON.parse(JSON.stringify(project));
                        clone.measurements = clone.measurements.filter((x: any) => x.id !== m.id);
                        onUpdateProject(clone);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manufacturer Part Cross-Reference */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Manufacturer Datasheet Verification ({project.manufacturerData?.length || 0})
        </h3>
        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {(project.manufacturerData || []).map((part) => (
            <div key={part.id} className="py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-bold text-cyan-400">{part.componentRef}</span>
                <span className="text-slate-300 font-sans">
                  {part.manufacturer} {part.partNumber} ({part.parameter}: {part.value} {part.unit})
                </span>
              </div>
              <div className="flex items-center gap-3">
                {part.datasheetUrl && (
                  <a
                    href={part.datasheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    <span>Datasheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => handleTogglePartVerification(part.id, part.verified)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    part.verified
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {part.verified ? 'Verified' : 'Unverified'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
