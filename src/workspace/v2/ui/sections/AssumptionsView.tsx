import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import {
  EngineeringAssumptionV2,
  AssumptionClassification,
  AssumptionSensitivity,
} from '../../types/requirements';
import { EntityIds } from '../../identity/id-generator';
import { HelpCircle, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

interface AssumptionsViewProps {
  project: ElectroKitProjectV2;
  onUpdateAssumptions: (assumptions: EngineeringAssumptionV2[]) => void;
}

export const AssumptionsView: React.FC<AssumptionsViewProps> = ({
  project,
  onUpdateAssumptions,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsm, setEditingAsm] = useState<EngineeringAssumptionV2 | null>(null);

  const [parameter, setParameter] = useState('');
  const [value, setValue] = useState<string | number>('');
  const [unit, setUnit] = useState('');
  const [classification, setClassification] = useState<AssumptionClassification>('user_assumption');
  const [sensitivity, setSensitivity] = useState<AssumptionSensitivity>('medium');
  const [description, setDescription] = useState('');
  const [applicableWorkflow, setApplicableWorkflow] = useState('');

  const openCreateModal = () => {
    setEditingAsm(null);
    setParameter('');
    setValue('');
    setUnit('');
    setClassification('user_assumption');
    setSensitivity('medium');
    setDescription('');
    setApplicableWorkflow('');
    setIsModalOpen(true);
  };

  const openEditModal = (a: EngineeringAssumptionV2) => {
    setEditingAsm(a);
    setParameter(a.parameter);
    setValue(a.value);
    setUnit(a.unit);
    setClassification(a.classification);
    setSensitivity(a.sensitivity);
    setDescription(a.description);
    setApplicableWorkflow(a.applicableWorkflow || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parameter.trim()) return;

    if (editingAsm) {
      const updated = project.assumptions.map(a =>
        a.id === editingAsm.id
          ? {
              ...a,
              parameter: parameter.trim(),
              value,
              unit: unit.trim(),
              classification,
              sensitivity,
              description: description.trim(),
              applicableWorkflow: applicableWorkflow.trim() || undefined,
            }
          : a
      );
      onUpdateAssumptions(updated);
    } else {
      const newAsm: EngineeringAssumptionV2 = {
        id: EntityIds.assumption(),
        parameter: parameter.trim(),
        value,
        unit: unit.trim(),
        classification,
        sensitivity,
        description: description.trim(),
        isUserConfigurable: true,
        applicableWorkflow: applicableWorkflow.trim() || undefined,
      };
      onUpdateAssumptions([newAsm, ...project.assumptions]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdateAssumptions(project.assumptions.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            Engineering Assumptions Register
          </h2>
          <p className="text-xs text-slate-400">
            Explicitly declared mathematical, physical, and environmental estimates under which designs are evaluated.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Assumption</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {project.assumptions.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No assumptions declared. Add operating assumptions to document your design parameters.
          </div>
        ) : (
          project.assumptions.map(asm => (
            <div
              key={asm.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                      {asm.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {asm.classification.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        asm.sensitivity === 'high'
                          ? 'text-rose-400 bg-rose-950/60 border border-rose-800/40'
                          : asm.sensitivity === 'medium'
                          ? 'text-amber-400 bg-amber-950/60'
                          : 'text-slate-400 bg-slate-800'
                      }`}
                    >
                      {asm.sensitivity} Sensitivity
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(asm)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(asm.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{asm.parameter}</h3>

                <div className="flex items-baseline gap-2 pt-1 font-mono">
                  <span className="text-xs text-slate-400">Assumed Value:</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {asm.value} {asm.unit}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{asm.description}</p>

                {asm.applicableWorkflow && (
                  <div className="text-[11px] font-mono text-indigo-400 pt-1">
                    Applicable Workflow: {asm.applicableWorkflow}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">
                {editingAsm ? 'Edit Assumption' : 'Declare Engineering Assumption'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Parameter Name *</label>
                <input
                  type="text"
                  required
                  value={parameter}
                  onChange={e => setParameter(e.target.value)}
                  placeholder="e.g. Copper Surface Roughness"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Assumed Value *</label>
                  <input
                    type="text"
                    required
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="1.8"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="µm"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Classification</label>
                  <select
                    value={classification}
                    onChange={e => setClassification(e.target.value as AssumptionClassification)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="user_assumption">User Defined</option>
                    <option value="standards_estimate">Standards Estimate</option>
                    <option value="physics_law">Physics Law</option>
                    <option value="datasheet_typical">Datasheet Typical</option>
                    <option value="environmental_boundary">Environmental Boundary</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Sensitivity</label>
                  <select
                    value={sensitivity}
                    onChange={e => setSensitivity(e.target.value as AssumptionSensitivity)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="high">High Sensitivity</option>
                    <option value="medium">Medium Sensitivity</option>
                    <option value="low">Low Sensitivity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description / Rationale</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Justification and physical conditions..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Applicable Workflow</label>
                <input
                  type="text"
                  value={applicableWorkflow}
                  onChange={e => setApplicableWorkflow(e.target.value)}
                  placeholder="e.g. pcb-impedance, thermal-system"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  {editingAsm ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
