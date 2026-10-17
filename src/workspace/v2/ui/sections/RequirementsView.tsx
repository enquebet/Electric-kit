import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import {
  EngineeringRequirementV2,
  RequirementCategory,
  RequirementPriority,
  VerificationMethod,
  VerificationStatus,
} from '../../types/requirements';
import { EntityIds } from '../../identity/id-generator';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronDown,
  X,
} from 'lucide-react';

interface RequirementsViewProps {
  project: ElectroKitProjectV2;
  onUpdateRequirements: (requirements: EngineeringRequirementV2[]) => void;
  onNavigateToCalculation?: (calcId: string) => void;
}

export const RequirementsView: React.FC<RequirementsViewProps> = ({
  project,
  onUpdateRequirements,
  onNavigateToCalculation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<EngineeringRequirementV2 | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RequirementCategory>('electrical');
  const [description, setDescription] = useState('');
  const [nominalValue, setNominalValue] = useState<number | undefined>();
  const [minValue, setMinValue] = useState<number | undefined>();
  const [maxValue, setMaxValue] = useState<number | undefined>();
  const [unit, setUnit] = useState('');
  const [priority, setPriority] = useState<RequirementPriority>('high');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('calculation');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');

  const openCreateModal = () => {
    setEditingReq(null);
    setName('');
    setCategory('electrical');
    setDescription('');
    setNominalValue(undefined);
    setMinValue(undefined);
    setMaxValue(undefined);
    setUnit('V');
    setPriority('high');
    setVerificationMethod('calculation');
    setVerificationStatus('unverified');
    setIsModalOpen(true);
  };

  const openEditModal = (r: EngineeringRequirementV2) => {
    setEditingReq(r);
    setName(r.name);
    setCategory(r.category);
    setDescription(r.description);
    setNominalValue(r.nominalValue);
    setMinValue(r.minValue);
    setMaxValue(r.maxValue);
    setUnit(r.unit);
    setPriority(r.priority);
    setVerificationMethod(r.verificationMethod);
    setVerificationStatus(r.verificationStatus);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const now = new Date().toISOString();

    if (editingReq) {
      const updated = project.requirements.map(r =>
        r.id === editingReq.id
          ? {
              ...r,
              name: name.trim(),
              category,
              description: description.trim(),
              nominalValue,
              minValue,
              maxValue,
              unit: unit.trim(),
              priority,
              verificationMethod,
              verificationStatus,
              updatedAt: now,
            }
          : r
      );
      onUpdateRequirements(updated);
    } else {
      const newReq: EngineeringRequirementV2 = {
        id: EntityIds.requirement(),
        name: name.trim(),
        category,
        description: description.trim(),
        nominalValue,
        minValue,
        maxValue,
        unit: unit.trim(),
        priority,
        verificationMethod,
        verificationStatus,
        satisfiedByCalculationIds: [],
        satisfiedByMeasurementIds: [],
        source: 'user',
        createdAt: now,
        updatedAt: now,
      };
      onUpdateRequirements([newReq, ...project.requirements]);
    }
    setIsModalOpen(false);
  };

  const handleDuplicate = (r: EngineeringRequirementV2) => {
    const now = new Date().toISOString();
    const dup: EngineeringRequirementV2 = {
      ...r,
      id: EntityIds.requirement(),
      name: `${r.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    onUpdateRequirements([dup, ...project.requirements]);
  };

  const handleDelete = (id: string) => {
    onUpdateRequirements(project.requirements.filter(r => r.id !== id));
  };

  // Filter logic
  const filtered = project.requirements.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || r.verificationStatus === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || r.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3" />
            PASSED
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            <Clock className="w-3 h-3" />
            IN PROGRESS
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800/60">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            UNVERIFIED
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            Engineering Requirements Specification
          </h2>
          <p className="text-xs text-slate-400">
            Defines quantifiable electrical, thermal, power, and environmental performance targets.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Requirement</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search requirements..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-600"
        >
          <option value="all">All Categories</option>
          <option value="electrical">Electrical</option>
          <option value="power">Power</option>
          <option value="thermal">Thermal</option>
          <option value="battery">Battery</option>
          <option value="pcb">PCB</option>
          <option value="rf">RF</option>
          <option value="environmental">Environmental</option>
        </select>

        <select
          value={selectedPriority}
          onChange={e => setSelectedPriority(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-600"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-600"
        >
          <option value="all">All Verification Statuses</option>
          <option value="passed">Passed</option>
          <option value="in_progress">In Progress</option>
          <option value="unverified">Unverified</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Requirements List Cards */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No requirements match the current filter criteria.
          </div>
        ) : (
          filtered.map(req => (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
            >
              <div className="space-y-1.5 max-w-2xl min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                    {req.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 uppercase">
                    {req.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                    req.priority === 'critical' ? 'text-rose-400 bg-rose-950/60' : req.priority === 'high' ? 'text-amber-400 bg-amber-950/60' : 'text-slate-400 bg-slate-800'
                  }`}>
                    {req.priority}
                  </span>
                  {getStatusBadge(req.verificationStatus)}
                </div>

                <h3 className="text-sm font-bold text-slate-100">{req.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{req.description}</p>

                {/* Target / Spec Range */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
                  {req.nominalValue !== undefined && (
                    <span className="text-slate-300">
                      Target: <span className="font-bold text-cyan-300">{req.nominalValue} {req.unit}</span>
                    </span>
                  )}
                  {req.minValue !== undefined && req.maxValue !== undefined && (
                    <span className="text-slate-400">
                      Range: [{req.minValue} - {req.maxValue}] {req.unit}
                    </span>
                  )}
                  <span className="text-slate-500">
                    Method: <span className="text-slate-300">{req.verificationMethod}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons & Traceability Jump */}
              <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                {req.satisfiedByCalculationIds.length > 0 && onNavigateToCalculation && (
                  <button
                    type="button"
                    onClick={() => onNavigateToCalculation(req.satisfiedByCalculationIds[0])}
                    className="p-1.5 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-800/60 transition cursor-pointer text-xs flex items-center gap-1"
                    title="Jump to calculating engine"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Calc</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDuplicate(req)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Duplicate requirement"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(req)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                  title="Edit requirement"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(req.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 transition cursor-pointer"
                  title="Delete requirement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">
                {editingReq ? 'Edit Requirement' : 'Create Engineering Requirement'}
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
                <label className="text-xs text-slate-400 block mb-1">Requirement Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 3.3V Output Voltage Regulation"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as RequirementCategory)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="electrical">Electrical</option>
                    <option value="power">Power</option>
                    <option value="thermal">Thermal</option>
                    <option value="battery">Battery</option>
                    <option value="pcb">PCB</option>
                    <option value="rf">RF</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="environmental">Environmental</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as RequirementPriority)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description / Spec Statement</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed functional specification..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nominal</label>
                  <input
                    type="number"
                    step="any"
                    value={nominalValue ?? ''}
                    onChange={e => setNominalValue(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="3.3"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Min</label>
                  <input
                    type="number"
                    step="any"
                    value={minValue ?? ''}
                    onChange={e => setMinValue(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="3.15"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Max</label>
                  <input
                    type="number"
                    step="any"
                    value={maxValue ?? ''}
                    onChange={e => setMaxValue(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="3.45"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="V"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Verification Method</label>
                  <select
                    value={verificationMethod}
                    onChange={e => setVerificationMethod(e.target.value as VerificationMethod)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="calculation">Calculation</option>
                    <option value="simulation">Simulation</option>
                    <option value="measurement">Lab Measurement</option>
                    <option value="datasheet_inspection">Datasheet Inspection</option>
                    <option value="formal_review">Formal Review</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Verification Status</label>
                  <select
                    value={verificationStatus}
                    onChange={e => setVerificationStatus(e.target.value as VerificationStatus)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="unverified">Unverified</option>
                    <option value="in_progress">In Progress</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="waived">Waived</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
                  {editingReq ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
