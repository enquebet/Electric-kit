import React, { useState } from 'react';
import { ElectroKitProject, EngineeringRequirement, EngineeringConstraint, EngineeringTarget } from '../types';
import { Plus, Trash2, CheckCircle2, AlertCircle, FileSpreadsheet, ShieldAlert } from 'lucide-react';

interface SpecsTabProps {
  project: ElectroKitProject;
  onUpdateProject: (updated: ElectroKitProject) => void;
}

export const SpecsTab: React.FC<SpecsTabProps> = ({ project, onUpdateProject }) => {
  const [showAddReq, setShowAddReq] = useState(false);
  const [newReq, setNewReq] = useState<Partial<EngineeringRequirement>>({
    name: '',
    category: 'electrical',
    nominalValue: 5,
    unit: 'V',
    description: '',
  });

  const handleAddRequirement = () => {
    if (!newReq.name) return;
    const req: EngineeringRequirement = {
      id: 'req_' + Math.random().toString(36).substring(2, 7),
      name: newReq.name,
      category: newReq.category || 'electrical',
      nominalValue: Number(newReq.nominalValue ?? 0),
      minValue: newReq.minValue !== undefined ? Number(newReq.minValue) : undefined,
      maxValue: newReq.maxValue !== undefined ? Number(newReq.maxValue) : undefined,
      unit: newReq.unit || '',
      description: newReq.description,
      source: 'user',
    };

    const updated = {
      ...project,
      requirements: [...(project.requirements || []), req],
    };
    onUpdateProject(updated);
    setNewReq({ name: '', category: 'electrical', nominalValue: 5, unit: 'V' });
    setShowAddReq(false);
  };

  const handleDeleteRequirement = (id: string) => {
    const updated = {
      ...project,
      requirements: (project.requirements || []).filter((r) => r.id !== id),
    };
    onUpdateProject(updated);
  };

  return (
    <div className="space-y-6">
      {/* Project Objective & Context Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          Project Overview & System Engineering Goals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">Engineering Objective:</label>
            <textarea
              value={project.metadata.engineeringObjective || ''}
              onChange={(e) => {
                const updated = {
                  ...project,
                  metadata: { ...project.metadata, engineeringObjective: e.target.value },
                };
                onUpdateProject(updated);
              }}
              rows={3}
              placeholder="Primary hardware mission, regulatory specs, or efficiency goals..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Target Design Constraints:</label>
            <textarea
              value={project.metadata.designTarget || ''}
              onChange={(e) => {
                const updated = {
                  ...project,
                  metadata: { ...project.metadata, designTarget: e.target.value },
                };
                onUpdateProject(updated);
              }}
              rows={3}
              placeholder="e.g. Target envelope dimensions, maximum thermal dissipation, battery autonomy..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Engineering Requirements Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Engineering Requirements Register ({project.requirements?.length || 0})
            </h3>
            <p className="text-xs text-slate-400">
              Formally bounded system specifications against which calculation margins are evaluated.
            </p>
          </div>
          <button
            onClick={() => setShowAddReq(!showAddReq)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-cyan-950"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Requirement
          </button>
        </div>

        {/* Add Requirement Inline Form */}
        {showAddReq && (
          <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-cyan-800/50 space-y-3">
            <h4 className="text-xs font-semibold text-cyan-400 font-mono">New Requirement Specification</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Requirement Name</label>
                <input
                  type="text"
                  placeholder="e.g. Input Rail Voltage"
                  value={newReq.name}
                  onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={newReq.category}
                  onChange={(e) => setNewReq({ ...newReq, category: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="electrical">Electrical</option>
                  <option value="power">Power</option>
                  <option value="thermal">Thermal</option>
                  <option value="environmental">Environmental</option>
                  <option value="mechanical">Mechanical</option>
                  <option value="component">Component</option>
                  <option value="margin">Margin</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Nominal Value &amp; Unit</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="12.0"
                    value={newReq.nominalValue}
                    onChange={(e) => setNewReq({ ...newReq, nominalValue: Number(e.target.value) })}
                    className="w-2/3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="V"
                    value={newReq.unit}
                    onChange={(e) => setNewReq({ ...newReq, unit: e.target.value })}
                    className="w-1/3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>
            </div>
            <div className="text-xs">
              <label className="text-slate-400 block mb-1">Description &amp; Verification Method</label>
              <input
                type="text"
                placeholder="e.g. Operating tolerance window of regulator IC (verify via bench Kelvin meter)"
                value={newReq.description || ''}
                onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddReq(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRequirement}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-slate-950 font-medium text-xs hover:bg-cyan-500"
              >
                Save Requirement
              </button>
            </div>
          </div>
        )}

        {/* Requirements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Nominal Spec</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {(project.requirements || []).map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">{req.id}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">{req.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700">
                      {req.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-100 font-semibold">
                    {req.nominalValue} {req.unit}
                    {req.minValue !== undefined && req.maxValue !== undefined && (
                      <span className="text-[10px] text-slate-400 block font-normal">
                        [{req.minValue} to {req.maxValue} {req.unit}]
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans max-w-xs truncate">
                    {req.description || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteRequirement(req.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete Requirement"
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

      {/* Constraints & Assumptions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Engineering Constraints ({project.constraints?.length || 0})
          </h3>
          <div className="space-y-2">
            {(project.constraints || []).map((con) => (
              <div key={con.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200">{con.name}</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {con.limitType.toUpperCase()} {con.value} {con.unit}
                  </span>
                </div>
                {con.notes && <p className="text-[11px] text-slate-400">{con.notes}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400" />
            Design Target Headroom ({project.targets?.length || 0})
          </h3>
          <div className="space-y-2">
            {(project.targets || []).map((tgt) => (
              <div key={tgt.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200">{tgt.parameter}</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {tgt.targetValue} {tgt.unit}
                  </span>
                </div>
                {tgt.notes && <p className="text-[11px] text-slate-400">{tgt.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
