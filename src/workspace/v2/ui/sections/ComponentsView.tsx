import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import {
  EngineeringComponentV2,
  ComponentCategory,
  ComponentLifecycleStatus,
  ComponentPinV2,
  ComponentRatingV2,
  RatingType,
  PinType,
  PinDirection,
  PinElectricalRole,
} from '../../types/components';
import { EntityIds } from '../../identity/id-generator';
import {
  cloneComponent,
  canDeleteComponent,
  deleteComponentSafely,
  getComponentConnectedComponents,
  getUpstreamObjects,
  getDownstreamObjects,
} from '../../objects/engineering-object-model';
import {
  Cpu,
  Plus,
  Search,
  Edit2,
  Copy,
  Trash2,
  X,
  Info,
  Sliders,
  Maximize2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Hash,
  Activity,
  FileText,
} from 'lucide-react';

interface ComponentsViewProps {
  project: ElectroKitProjectV2;
  onUpdateComponents: (components: EngineeringComponentV2[]) => void;
  onUpdateProject?: (project: ElectroKitProjectV2) => void;
}

export const ComponentsView: React.FC<ComponentsViewProps> = ({
  project,
  onUpdateComponents,
  onUpdateProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<EngineeringComponentV2 | null>(null);

  // Inspector state
  const [inspectedComp, setInspectedComp] = useState<EngineeringComponentV2 | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'pins' | 'ratings' | 'properties' | 'graph'>('overview');

  // Delete Safety Warning state
  const [compToDelete, setCompToDelete] = useState<EngineeringComponentV2 | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{
    safe: boolean;
    reasons: string[];
    dependentEntities: { id: string; type: string; name: string }[];
  } | null>(null);

  // Form State
  const [refDes, setRefDes] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('integrated_circuit');
  const [manufacturer, setManufacturer] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [packageType, setPackageType] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ComponentLifecycleStatus>('selected');
  const [rThetaJc, setRThetaJc] = useState<number | undefined>();
  const [rThetaJa, setRThetaJa] = useState<number | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  // Sub-forms inside Inspector for adding Pins & Ratings
  const [newPinNumber, setNewPinNumber] = useState('');
  const [newPinName, setNewPinName] = useState('');
  const [newPinType, setNewPinType] = useState<PinType>('passive');
  const [newPinRole, setNewPinRole] = useState<PinElectricalRole>('passive');
  const [newPinDirection, setNewPinDirection] = useState<PinDirection>('unspecified');

  const [newRatingParam, setNewRatingParam] = useState('');
  const [newRatingValue, setNewRatingValue] = useState<number | ''>('');
  const [newRatingUnit, setNewRatingUnit] = useState('V');
  const [newRatingType, setNewRatingType] = useState<RatingType>('absolute_maximum');
  const [newRatingCondition, setNewRatingCondition] = useState('');

  const openCreateModal = () => {
    setEditingComp(null);
    setRefDes('');
    setName('');
    setCategory('integrated_circuit');
    setManufacturer('');
    setPartNumber('');
    setPackageType('');
    setDescription('');
    setStatus('selected');
    setRThetaJc(undefined);
    setRThetaJa(undefined);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: EngineeringComponentV2) => {
    setEditingComp(c);
    setRefDes(c.refDes);
    setName(c.name);
    setCategory(c.category);
    setManufacturer(c.manufacturer || '');
    setPartNumber(c.partNumber || c.manufacturerPartNumber || '');
    setPackageType(c.packageType || c.package || '');
    setDescription(c.description);
    setStatus(c.status || c.lifecycleStatus || 'selected');
    setRThetaJc(c.thermalProperties?.rThetaJC);
    setRThetaJa(c.thermalProperties?.rThetaJA);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refDes.trim() || !name.trim()) {
      setFormError('Reference designator and component name are required.');
      return;
    }
    const now = new Date().toISOString();

    const thermalProperties =
      rThetaJc !== undefined || rThetaJa !== undefined
        ? { rThetaJC: rThetaJc, rThetaJA: rThetaJa }
        : undefined;

    if (editingComp) {
      const updated = project.components.map(c =>
        c.id === editingComp.id
          ? {
              ...c,
              refDes: refDes.trim().toUpperCase(),
              name: name.trim(),
              category,
              manufacturer: manufacturer.trim() || undefined,
              partNumber: partNumber.trim() || undefined,
              manufacturerPartNumber: partNumber.trim() || undefined,
              packageType: packageType.trim() || undefined,
              package: packageType.trim() || undefined,
              description: description.trim(),
              status,
              lifecycleStatus: status,
              thermalProperties,
              updatedAt: now,
            }
          : c
      );
      onUpdateComponents(updated);
      if (inspectedComp && inspectedComp.id === editingComp.id) {
        setInspectedComp(updated.find(x => x.id === editingComp.id) || null);
      }
    } else {
      const newComp: EngineeringComponentV2 = {
        id: EntityIds.component(),
        refDes: refDes.trim().toUpperCase(),
        name: name.trim(),
        category,
        description: description.trim(),
        manufacturer: manufacturer.trim() || undefined,
        partNumber: partNumber.trim() || undefined,
        manufacturerPartNumber: partNumber.trim() || undefined,
        packageType: packageType.trim() || undefined,
        package: packageType.trim() || undefined,
        status,
        lifecycleStatus: status,
        parametricRatings: {},
        ratings: [],
        pins: [],
        thermalProperties,
        createdAt: now,
        updatedAt: now,
      };
      onUpdateComponents([newComp, ...project.components]);
    }
    setIsModalOpen(false);
  };

  // Safe Cloning via Wave 03 cloneComponent
  const handleDuplicate = (c: EngineeringComponentV2) => {
    const dup = cloneComponent(c);
    onUpdateComponents([dup, ...project.components]);
  };

  // Safe Deletion with Dependency Check
  const initiateDelete = (c: EngineeringComponentV2) => {
    const check = canDeleteComponent(project, c.id);
    if (!check.safe) {
      setCompToDelete(c);
      setDeleteWarning(check);
    } else {
      // Safe to delete immediately
      if (onUpdateProject) {
        const res = deleteComponentSafely(project, c.id, false);
        if (res.success) onUpdateProject(res.project);
      } else {
        onUpdateComponents(project.components.filter(x => x.id !== c.id));
      }
      if (inspectedComp && inspectedComp.id === c.id) {
        setInspectedComp(null);
      }
    }
  };

  const confirmForceDelete = () => {
    if (!compToDelete) return;
    if (onUpdateProject) {
      const res = deleteComponentSafely(project, compToDelete.id, true);
      if (res.success) onUpdateProject(res.project);
    } else {
      onUpdateComponents(project.components.filter(x => x.id !== compToDelete.id));
    }
    if (inspectedComp && inspectedComp.id === compToDelete.id) {
      setInspectedComp(null);
    }
    setCompToDelete(null);
    setDeleteWarning(null);
  };

  // Add Pin in Inspector
  const handleAddPin = () => {
    if (!inspectedComp || !newPinName.trim() || !newPinNumber.trim()) return;
    const newPin: ComponentPinV2 = {
      id: EntityIds.pin(),
      pinNumber: newPinNumber.trim(),
      name: newPinName.trim(),
      type: newPinType,
      electricalRole: newPinRole,
      direction: newPinDirection,
    };
    const updatedComp = {
      ...inspectedComp,
      pins: [...(inspectedComp.pins || []), newPin],
      updatedAt: new Date().toISOString(),
    };
    const updatedList = project.components.map(c => (c.id === inspectedComp.id ? updatedComp : c));
    onUpdateComponents(updatedList);
    setInspectedComp(updatedComp);
    setNewPinName('');
    setNewPinNumber('');
  };

  // Add Rating in Inspector
  const handleAddRating = () => {
    if (!inspectedComp || !newRatingParam.trim() || typeof newRatingValue !== 'number') return;
    const newRat: ComponentRatingV2 = {
      id: EntityIds.rating(),
      parameter: newRatingParam.trim(),
      value: newRatingValue,
      unit: newRatingUnit.trim() || 'V',
      ratingType: newRatingType,
      condition: newRatingCondition.trim() || undefined,
    };
    const updatedComp = {
      ...inspectedComp,
      ratings: [...(inspectedComp.ratings || []), newRat],
      updatedAt: new Date().toISOString(),
    };
    const updatedList = project.components.map(c => (c.id === inspectedComp.id ? updatedComp : c));
    onUpdateComponents(updatedList);
    setInspectedComp(updatedComp);
    setNewRatingParam('');
    setNewRatingValue('');
    setNewRatingCondition('');
  };

  const filtered = project.components.filter(c => {
    const pNumber = c.partNumber || c.manufacturerPartNumber || '';
    const matchesSearch =
      c.refDes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.manufacturer && c.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            Engineering Component Inventory
          </h2>
          <p className="text-xs text-slate-400">
            Selected bill-of-materials components with pins, structured ratings, physical packages, and lifecycle state.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Component</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by RefDes, part number, manufacturer..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-600"
        >
          <option value="all">All Component Categories</option>
          <option value="integrated_circuit">Integrated Circuit (IC)</option>
          <option value="microcontroller">Microcontroller (MCU)</option>
          <option value="power_management">Power Management (PMIC)</option>
          <option value="semiconductor_transistor">Transistor / FET</option>
          <option value="semiconductor_diode">Diode / Rectifier</option>
          <option value="passive_resistor">Resistor</option>
          <option value="passive_capacitor">Capacitor</option>
          <option value="passive_inductor">Inductor / Choke</option>
          <option value="battery_cell">Battery Cell</option>
          <option value="sensor">Sensor</option>
          <option value="rf_frontend">RF Front-End</option>
          <option value="connector">Connector</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Component Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
          No components match the active filter or search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(comp => (
            <div
              key={comp.id}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {comp.refDes}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {comp.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border capitalize ${
                      comp.status === 'qualified' || comp.status === 'validated'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : comp.status === 'tested'
                        ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    {comp.status || comp.lifecycleStatus || 'selected'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {comp.description}
                </p>

                <div className="space-y-1 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 mb-3">
                  {(comp.partNumber || comp.manufacturerPartNumber) && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">MPN:</span>
                      <span className="text-slate-300 font-semibold">{comp.partNumber || comp.manufacturerPartNumber}</span>
                    </div>
                  )}
                  {comp.manufacturer && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mfg:</span>
                      <span className="text-slate-300">{comp.manufacturer}</span>
                    </div>
                  )}
                  {(comp.packageType || comp.package) && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pkg:</span>
                      <span className="text-slate-300">{comp.packageType || comp.package}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pins / Ratings:</span>
                    <span className="text-cyan-400">{comp.pins?.length || 0} pins • {(comp.ratings?.length || 0) + Object.keys(comp.parametricRatings || {}).length} ratings</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setInspectedComp(comp)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
                  title="Inspect Object Details, Pins & Ratings"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(comp)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                    title="Deep Clone Component"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(comp)}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                    title="Edit Metadata"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => initiateDelete(comp)}
                    className="p-1.5 rounded text-red-400/70 hover:text-red-300 hover:bg-red-950/40 cursor-pointer"
                    title="Delete Component"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Component Inspector Modal */}
      {inspectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="text-base font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/60">
                  {inspectedComp.refDes}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    {inspectedComp.name}
                    <span className="text-xs font-normal text-slate-400">
                      ({inspectedComp.manufacturer || ''} {inspectedComp.partNumber || inspectedComp.manufacturerPartNumber || ''})
                    </span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">ID: {inspectedComp.id}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedComp(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center gap-1 px-4 border-b border-slate-800 bg-slate-950/40 text-xs">
              <button
                type="button"
                onClick={() => setInspectorTab('overview')}
                className={`px-3 py-2 font-medium border-b-2 transition ${
                  inspectorTab === 'overview'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('pins')}
                className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
                  inspectorTab === 'pins'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Pins</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 font-mono">
                  {inspectedComp.pins?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('ratings')}
                className={`px-3 py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
                  inspectorTab === 'ratings'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Ratings</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 font-mono">
                  {(inspectedComp.ratings?.length || 0) + Object.keys(inspectedComp.parametricRatings || {}).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('properties')}
                className={`px-3 py-2 font-medium border-b-2 transition ${
                  inspectorTab === 'properties'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Properties
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('graph')}
                className={`px-3 py-2 font-medium border-b-2 transition ${
                  inspectorTab === 'graph'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Graph &amp; Connections
              </button>
            </div>

            {/* Inspector Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Tab 1: Overview */}
              {inspectorTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
                    <div>
                      <span className="text-slate-500 block">Category</span>
                      <span className="text-slate-200 font-medium capitalize">{inspectedComp.category.replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Package</span>
                      <span className="text-slate-200 font-medium">{inspectedComp.packageType || inspectedComp.package || 'Discrete / Module'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Lifecycle Status</span>
                      <span className="text-cyan-400 font-medium capitalize">{inspectedComp.status || inspectedComp.lifecycleStatus || 'selected'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Cost Est.</span>
                      <span className="text-slate-200 font-medium">{inspectedComp.costEstimateUsd ? `$${inspectedComp.costEstimateUsd.toFixed(2)}` : 'Unquoted'}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-200 mb-1">Description</h4>
                    <p className="text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded border border-slate-800">
                      {inspectedComp.description || 'No detailed description provided.'}
                    </p>
                  </div>

                  {inspectedComp.notes && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 mb-1">Engineering Notes</h4>
                      <p className="text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded border border-slate-800">
                        {inspectedComp.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Pins */}
              {inspectorTab === 'pins' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200">Component Physical Pins</h4>
                    <span className="text-[11px] text-slate-500">{(inspectedComp.pins || []).length} assigned</span>
                  </div>

                  {/* Add Pin Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <input
                      type="text"
                      placeholder="Pin #"
                      value={newPinNumber}
                      onChange={e => setNewPinNumber(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="Pin Name (e.g. SW)"
                      value={newPinName}
                      onChange={e => setNewPinName(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
                    />
                    <select
                      value={newPinType}
                      onChange={e => setNewPinType(e.target.value as PinType)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300"
                    >
                      <option value="power">Power</option>
                      <option value="ground">Ground</option>
                      <option value="passive">Passive</option>
                      <option value="analog_in">Analog In</option>
                      <option value="analog_out">Analog Out</option>
                      <option value="digital_in">Digital In</option>
                      <option value="digital_out">Digital Out</option>
                      <option value="digital_io">Digital I/O</option>
                      <option value="rf">RF</option>
                      <option value="clock">Clock</option>
                      <option value="no_connect">NC</option>
                    </select>
                    <select
                      value={newPinRole}
                      onChange={e => setNewPinRole(e.target.value as PinElectricalRole)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300"
                    >
                      <option value="power_supply">Power Supply</option>
                      <option value="power_ground">Power Ground</option>
                      <option value="passive">Passive</option>
                      <option value="input">Input</option>
                      <option value="output">Output</option>
                      <option value="bidirectional">Bidirectional</option>
                      <option value="control">Control</option>
                      <option value="clock">Clock</option>
                    </select>
                    <select
                      value={newPinDirection}
                      onChange={e => setNewPinDirection(e.target.value as PinDirection)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300"
                    >
                      <option value="unspecified">Unspecified</option>
                      <option value="in">In</option>
                      <option value="out">Out</option>
                      <option value="bidirectional">Bi-dir</option>
                      <option value="power">Power</option>
                      <option value="ground">Ground</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddPin}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium cursor-pointer"
                    >
                      + Add Pin
                    </button>
                  </div>

                  {/* Pins Table */}
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Role</th>
                          <th className="p-2.5">Direction</th>
                          <th className="p-2.5">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                        {(!inspectedComp.pins || inspectedComp.pins.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-500 font-sans">
                              No pins added yet. Use the form above to add component pins.
                            </td>
                          </tr>
                        ) : (
                          inspectedComp.pins.map(pin => (
                            <tr key={pin.id}>
                              <td className="p-2.5 text-cyan-400 font-bold">{pin.pinNumber}</td>
                              <td className="p-2.5 font-bold">{pin.name}</td>
                              <td className="p-2.5 text-slate-400 capitalize">{pin.type}</td>
                              <td className="p-2.5 text-slate-400 capitalize">{pin.electricalRole || '-'}</td>
                              <td className="p-2.5 text-slate-400 capitalize">{pin.direction || '-'}</td>
                              <td className="p-2.5 text-slate-500">{pin.netId || 'Unconnected'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Ratings */}
              {inspectorTab === 'ratings' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200">Engineering Ratings &amp; Operating Limits</h4>
                    <span className="text-[11px] text-slate-500">Max, Min, Recommended, Typical</span>
                  </div>

                  {/* Add Rating Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <input
                      type="text"
                      placeholder="Parameter (e.g. Vds_max)"
                      value={newRatingParam}
                      onChange={e => setNewRatingParam(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
                    />
                    <input
                      type="number"
                      placeholder="Value (e.g. 100)"
                      value={newRatingValue}
                      onChange={e => setNewRatingValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g. V, A, W)"
                      value={newRatingUnit}
                      onChange={e => setNewRatingUnit(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
                    />
                    <select
                      value={newRatingType}
                      onChange={e => setNewRatingType(e.target.value as RatingType)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300"
                    >
                      <option value="absolute_maximum">Absolute Max</option>
                      <option value="recommended_operating">Recommended</option>
                      <option value="typical">Typical</option>
                      <option value="minimum">Minimum</option>
                      <option value="maximum">Maximum</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Condition (TJ=25°C)"
                      value={newRatingCondition}
                      onChange={e => setNewRatingCondition(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddRating}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium cursor-pointer"
                    >
                      + Add Rating
                    </button>
                  </div>

                  {/* Ratings List */}
                  <div className="space-y-2">
                    {/* Structured Ratings */}
                    {(inspectedComp.ratings || []).map(r => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200">{r.parameter}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border capitalize ${
                              r.ratingType === 'absolute_maximum'
                                ? 'bg-red-950/60 border-red-800 text-red-300'
                                : r.ratingType === 'recommended_operating'
                                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            {r.ratingType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-cyan-400 font-bold">
                            {r.value} {r.unit}
                          </span>
                          {r.condition && (
                            <span className="text-slate-500 text-[11px]">({r.condition})</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Parametric ratings record (V1/Wave 01 compatibility) */}
                    {Object.entries(inspectedComp.parametricRatings || {}).map(([k, pr]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs"
                      >
                        <span className="font-mono font-bold text-slate-300">{pr.parameter}</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {pr.value} {pr.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Properties */}
              {inspectorTab === 'properties' && (
                <div className="space-y-4 text-xs font-mono">
                  {/* Thermal Properties */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <h5 className="font-sans font-bold text-slate-200">Thermal Resistances &amp; Limits</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-400">
                      <div>RθJC: <span className="text-slate-200">{inspectedComp.thermalProperties?.rThetaJC ?? '-'} °C/W</span></div>
                      <div>RθJA: <span className="text-slate-200">{inspectedComp.thermalProperties?.rThetaJA ?? '-'} °C/W</span></div>
                      <div>Max Tj: <span className="text-slate-200">{inspectedComp.thermalProperties?.maxJunctionTempC ?? '-'} °C</span></div>
                    </div>
                  </div>

                  {/* Electrical Properties */}
                  {inspectedComp.propertyGroups?.electrical && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <h5 className="font-sans font-bold text-slate-200">Electrical Sizing</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-400">
                        <div>Nominal Voltage: <span className="text-slate-200">{inspectedComp.propertyGroups.electrical.nominalVoltageV ?? '-'} V</span></div>
                        <div>Max Voltage: <span className="text-slate-200">{inspectedComp.propertyGroups.electrical.maxVoltageV ?? '-'} V</span></div>
                        <div>Nominal Current: <span className="text-slate-200">{inspectedComp.propertyGroups.electrical.nominalCurrentA ?? '-'} A</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Graph & Connections */}
              {inspectorTab === 'graph' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-200 mb-2">Connected Components</h5>
                    {getComponentConnectedComponents(project, inspectedComp.id).length === 0 ? (
                      <p className="text-slate-500 italic bg-slate-950 p-3 rounded border border-slate-800">
                        No direct connections routed to this component yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {getComponentConnectedComponents(project, inspectedComp.id).map(conn => (
                          <div
                            key={conn.component.id}
                            className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800 font-mono"
                          >
                            <span className="font-bold text-cyan-400">{conn.component.refDes} ({conn.component.name})</span>
                            <span className="text-slate-400 text-[11px]">via net {conn.viaNet} [{conn.connectionType}]</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-200 mb-2">Upstream Dependencies (Driven By)</h5>
                    {getUpstreamObjects(project, inspectedComp.id).length === 0 ? (
                      <p className="text-slate-500 italic bg-slate-950 p-3 rounded border border-slate-800">
                        No upstream requirements or systems directly driving this component.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {getUpstreamObjects(project, inspectedComp.id).map(up => (
                          <div
                            key={up.id}
                            className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800"
                          >
                            <span className="font-semibold text-slate-200">{up.name}</span>
                            <span className="font-mono text-cyan-400 text-[10px] uppercase">{up.relationship}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-200 mb-2">Downstream Impacts (Drives)</h5>
                    {getDownstreamObjects(project, inspectedComp.id).length === 0 ? (
                      <p className="text-slate-500 italic bg-slate-950 p-3 rounded border border-slate-800">
                        No downstream calculations or validations depending on this component.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {getDownstreamObjects(project, inspectedComp.id).map(down => (
                          <div
                            key={down.id}
                            className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800"
                          >
                            <span className="font-semibold text-slate-200">{down.name}</span>
                            <span className="font-mono text-cyan-400 text-[10px] uppercase">{down.relationship}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-4 border-t border-slate-800 bg-slate-950">
              <button
                type="button"
                onClick={() => setInspectedComp(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dependency Warning Modal */}
      {deleteWarning && compToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-red-900/80 shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-950/80 text-red-400 border border-red-800/80">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-100">
                  Cannot Safely Delete Component: {compToDelete.refDes}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  This component is actively referenced by other engineering objects in the project graph.
                </p>
              </div>
            </div>

            {/* Dependency List */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              {deleteWarning.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-[11px]">
                  <span className="text-red-400">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              Note: Historical calculation snapshots will remain permanently intact regardless of deletion.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCompToDelete(null);
                  setDeleteWarning(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmForceDelete}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
              >
                Force Cascade Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Component Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>{editingComp ? `Edit Component: ${editingComp.refDes}` : 'Add Engineering Component'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">RefDes *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q1, R1, U3"
                    value={refDes}
                    onChange={e => setRefDes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 uppercase font-mono focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Component Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Synchronous Buck Controller"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ComponentCategory)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="integrated_circuit">Integrated Circuit (IC)</option>
                    <option value="microcontroller">Microcontroller (MCU)</option>
                    <option value="power_management">Power Management</option>
                    <option value="semiconductor_transistor">Transistor / FET</option>
                    <option value="semiconductor_diode">Diode / Rectifier</option>
                    <option value="passive_resistor">Resistor</option>
                    <option value="passive_capacitor">Capacitor</option>
                    <option value="passive_inductor">Inductor / Choke</option>
                    <option value="battery_cell">Battery Cell</option>
                    <option value="sensor">Sensor</option>
                    <option value="rf_frontend">RF Front-End</option>
                    <option value="connector">Connector</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Lifecycle Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as ComponentLifecycleStatus)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-600 capitalize"
                  >
                    <option value="concept">Concept</option>
                    <option value="selected">Selected</option>
                    <option value="procured">Procured</option>
                    <option value="tested">Tested</option>
                    <option value="qualified">Qualified</option>
                    <option value="obsolete">Obsolete</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. TI, EPC"
                    value={manufacturer}
                    onChange={e => setManufacturer(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Part Number</label>
                  <input
                    type="text"
                    placeholder="e.g. EPC2045"
                    value={partNumber}
                    onChange={e => setPartNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Package</label>
                  <input
                    type="text"
                    placeholder="e.g. QFN-32, 0805"
                    value={packageType}
                    onChange={e => setPackageType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Functional engineering description..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">RθJC (°C/W)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 0.8"
                    value={rThetaJc ?? ''}
                    onChange={e => setRThetaJc(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">RθJA (°C/W)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 32.0"
                    value={rThetaJa ?? ''}
                    onChange={e => setRThetaJa(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold cursor-pointer shadow-sm"
                >
                  {editingComp ? 'Update Component' : 'Add Component'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
