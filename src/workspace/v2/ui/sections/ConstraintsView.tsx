import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import {
  EngineeringConstraintV2,
  ConstraintCategory,
  ConstraintLimitType,
} from '../../types/requirements';
import { EntityIds } from '../../identity/id-generator';
import { ShieldAlert, Plus, Edit2, Trash2, X } from 'lucide-react';

interface ConstraintsViewProps {
  project: ElectroKitProjectV2;
  onUpdateConstraints: (constraints: EngineeringConstraintV2[]) => void;
}

export const ConstraintsView: React.FC<ConstraintsViewProps> = ({
  project,
  onUpdateConstraints,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCon, setEditingCon] = useState<EngineeringConstraintV2 | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ConstraintCategory>('electrical');
  const [value, setValue] = useState<string | number>('');
  const [unit, setUnit] = useState('');
  const [limitType, setLimitType] = useState<ConstraintLimitType>('max');
  const [marginThresholdPercent, setMarginThresholdPercent] = useState<number>(10);
  const [governingStandard, setGoverningStandard] = useState('');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingCon(null);
    setName('');
    setCategory('electrical');
    setValue('');
    setUnit('V');
    setLimitType('max');
    setMarginThresholdPercent(10);
    setGoverningStandard('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: EngineeringConstraintV2) => {
    setEditingCon(c);
    setName(c.name);
    setCategory(c.category);
    setValue(c.value);
    setUnit(c.unit);
    setLimitType(c.limitType);
    setMarginThresholdPercent(c.marginThresholdPercent || 10);
    setGoverningStandard(c.governingStandard || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCon) {
      const updated = project.constraints.map(c =>
        c.id === editingCon.id
          ? {
              ...c,
              name: name.trim(),
              category,
              value,
              unit: unit.trim(),
              limitType,
              marginThresholdPercent,
              governingStandard: governingStandard.trim() || undefined,
              notes: notes.trim() || undefined,
            }
          : c
      );
      onUpdateConstraints(updated);
    } else {
      const newCon: EngineeringConstraintV2 = {
        id: EntityIds.constraint(),
        name: name.trim(),
        category,
        value,
        unit: unit.trim(),
        limitType,
        marginThresholdPercent,
        governingStandard: governingStandard.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      onUpdateConstraints([newCon, ...project.constraints]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdateConstraints(project.constraints.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Engineering Constraints & Boundaries
          </h2>
          <p className="text-xs text-slate-400">
            Hard physical, regulatory, environmental, and thermal limits that cannot be violated.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Constraint</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {project.constraints.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No constraints defined yet. Add physical or environmental boundaries.
          </div>
        ) : (
          project.constraints.map(con => (
            <div
              key={con.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                      {con.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 uppercase">
                      {con.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(con)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(con.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{con.name}</h3>

                <div className="flex items-baseline gap-2 pt-1 font-mono">
                  <span className="text-xs text-slate-400">Limit ({con.limitType}):</span>
                  <span className="text-sm font-bold text-amber-300">
                    {con.value} {con.unit}
                  </span>
                </div>

                {con.governingStandard && (
                  <div className="text-[11px] font-mono text-cyan-400">
                    Standard: {con.governingStandard}
                  </div>
                )}

                {con.notes && (
                  <p className="text-xs text-slate-400">{con.notes}</p>
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
                {editingCon ? 'Edit Constraint' : 'Create Constraint'}
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
                <label className="text-xs text-slate-400 block mb-1">Constraint Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Max Allowed Semiconductor Junction Temp"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ConstraintCategory)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="electrical">Electrical</option>
                    <option value="power">Power</option>
                    <option value="thermal">Thermal</option>
                    <option value="battery">Battery</option>
                    <option value="pcb">PCB</option>
                    <option value="rf">RF</option>
                    <option value="environmental">Environmental</option>
                    <option value="mechanical">Mechanical</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Limit Type</label>
                  <select
                    value={limitType}
                    onChange={e => setLimitType(e.target.value as ConstraintLimitType)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="max">Maximum (Upper Bound)</option>
                    <option value="min">Minimum (Lower Bound)</option>
                    <option value="exact">Exact (Target)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Value *</label>
                  <input
                    type="text"
                    required
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="110"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="°C"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Governing Standard</label>
                <input
                  type="text"
                  value={governingStandard}
                  onChange={e => setGoverningStandard(e.target.value)}
                  placeholder="e.g. IPC-9592B Class II"
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
                  {editingCon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
