import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import {
  EngineeringSystemV2,
  SubsystemV2,
  PowerRailV2,
  SystemDomain,
  PowerRailType,
} from '../../types/systems';
import { EntityIds } from '../../identity/id-generator';
import {
  Network,
  Plus,
  Zap,
  Flame,
  Battery,
  Radio,
  Layers,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SystemsViewProps {
  project: ElectroKitProjectV2;
  onUpdateSystems: (systems: EngineeringSystemV2[]) => void;
  onUpdatePowerRails: (rails: PowerRailV2[]) => void;
}

export const SystemsView: React.FC<SystemsViewProps> = ({
  project,
  onUpdateSystems,
  onUpdatePowerRails,
}) => {
  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    project.systems[0]?.id || ''
  );

  // System Modal
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [sysName, setSysName] = useState('');
  const [sysDescription, setSysDescription] = useState('');
  const [sysDomain, setSysDomain] = useState<SystemDomain>('power');

  // Rail Modal
  const [isRailModalOpen, setIsRailModalOpen] = useState(false);
  const [railName, setRailName] = useState('');
  const [railType, setRailType] = useState<PowerRailType>('regulated_dc');
  const [nominalVoltage, setNominalVoltage] = useState<number>(3.3);
  const [maxCurrentAmps, setMaxCurrentAmps] = useState<number>(2.0);

  const selectedSystem = project.systems.find(s => s.id === selectedSystemId) || project.systems[0];

  const handleCreateSystem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sysName.trim()) return;
    const now = new Date().toISOString();
    const newSys: EngineeringSystemV2 = {
      id: EntityIds.system(),
      name: sysName.trim(),
      description: sysDescription.trim(),
      primaryDomain: sysDomain,
      subsystems: [],
      createdAt: now,
      updatedAt: now,
    };
    onUpdateSystems([...project.systems, newSys]);
    setSelectedSystemId(newSys.id);
    setIsSystemModalOpen(false);
  };

  const handleCreateRail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!railName.trim()) return;
    const newRail: PowerRailV2 = {
      id: EntityIds.rail(),
      name: railName.trim(),
      type: railType,
      nominalVoltage,
      minVoltage: nominalVoltage * 0.95,
      maxVoltage: nominalVoltage * 1.05,
      maxCurrentAmps,
    };
    onUpdatePowerRails([...project.powerRails, newRail]);
    setIsRailModalOpen(false);
  };

  const handleDeleteSystem = (id: string) => {
    const remaining = project.systems.filter(s => s.id !== id);
    onUpdateSystems(remaining);
    if (selectedSystemId === id && remaining.length > 0) {
      setSelectedSystemId(remaining[0].id);
    }
  };

  const handleDeleteRail = (id: string) => {
    onUpdatePowerRails(project.powerRails.filter(r => r.id !== id));
  };

  const getDomainIcon = (domain: SystemDomain) => {
    switch (domain) {
      case 'power':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'thermal':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'battery':
        return <Battery className="w-4 h-4 text-emerald-400" />;
      case 'rf':
        return <Radio className="w-4 h-4 text-purple-400" />;
      case 'pcb':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      default:
        return <Network className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            Engineering Systems & Power Architecture
          </h2>
          <p className="text-xs text-slate-400">
            Multi-domain system hierarchy, power distribution rails, and subsystem boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRailName('');
              setNominalVoltage(3.3);
              setMaxCurrentAmps(2.0);
              setIsRailModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Power Rail</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSysName('');
              setSysDescription('');
              setSysDomain('power');
              setIsSystemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add System</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Systems Tree List (Left Column) */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            System Hierarchy ({project.systems.length})
          </span>

          <div className="space-y-1.5">
            {project.systems.map(sys => {
              const isSelected = sys.id === selectedSystem?.id;
              return (
                <div
                  key={sys.id}
                  onClick={() => setSelectedSystemId(sys.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-700 text-slate-100 shadow-sm'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getDomainIcon(sys.primaryDomain)}
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{sys.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        {sys.primaryDomain} • {sys.subsystems.length} subsystems
                      </div>
                    </div>
                  </div>

                  {project.systems.length > 1 && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteSystem(sys.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400"
                      title="Delete system"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Configured Power Rails Box */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              Configured Power Rails ({project.powerRails.length})
            </span>

            <div className="space-y-1.5">
              {project.powerRails.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800">
                  No power rails configured.
                </div>
              ) : (
                project.powerRails.map(rail => (
                  <div
                    key={rail.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-slate-200">{rail.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {rail.nominalVoltage}V • Max {rail.maxCurrentAmps}A
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRail(rail.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected System Details (Right 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSystem ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                      {selectedSystem.id}
                    </span>
                    <span className="text-xs font-mono text-slate-400 uppercase font-bold">
                      Domain: {selectedSystem.primaryDomain}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{selectedSystem.name}</h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{selectedSystem.description}</p>

              {/* Subsystems List */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Subsystems ({selectedSystem.subsystems.length})
                </h4>

                {selectedSystem.subsystems.length === 0 ? (
                  <div className="p-4 text-center rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500">
                    No subsystems attached to this architecture block.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedSystem.subsystems.map(sub => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                          <span>{sub.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{sub.domain}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{sub.description}</p>
                        <div className="pt-1 text-[10px] font-mono text-cyan-400">
                          {sub.componentIds.length} components linked
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Power Architecture Highlights */}
              {selectedSystem.powerArchitecture && (
                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Power Conversion Summary
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Payload Power</div>
                      <div className="text-sm font-bold text-slate-200">
                        {selectedSystem.powerArchitecture.totalPayloadPowerWatts} W
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Input Demand</div>
                      <div className="text-sm font-bold text-slate-200">
                        {selectedSystem.powerArchitecture.totalInputPowerWatts} W
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Cascaded Eff.</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {selectedSystem.powerArchitecture.cascadedEfficiencyPercent}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Thermal System Highlights */}
              {selectedSystem.thermalSystem && (
                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                    Thermal Dissipation Summary
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Ambient</div>
                      <div className="font-bold text-slate-200">
                        {selectedSystem.thermalSystem.ambientTemperatureC}°C
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Enclosure Rise</div>
                      <div className="font-bold text-slate-200">
                        +{selectedSystem.thermalSystem.maxEnclosureRiseC}°C
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Nodes</div>
                      <div className="font-bold text-slate-200">
                        {selectedSystem.thermalSystem.nodes.length}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Posture</div>
                      <div className="font-bold text-emerald-400 uppercase">
                        {selectedSystem.thermalSystem.status}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              Select or create a system to view details.
            </div>
          )}
        </div>
      </div>

      {/* Add System Modal */}
      {isSystemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsSystemModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Create Engineering System</h3>
              <button
                type="button"
                onClick={() => setIsSystemModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSystem} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">System Name *</label>
                <input
                  type="text"
                  required
                  value={sysName}
                  onChange={e => setSysName(e.target.value)}
                  placeholder="e.g. RF Front-End Architecture"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Primary Domain</label>
                <select
                  value={sysDomain}
                  onChange={e => setSysDomain(e.target.value as SystemDomain)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                >
                  <option value="power">Power Electronics</option>
                  <option value="thermal">Thermal System</option>
                  <option value="battery">Battery & Energy</option>
                  <option value="rf">RF / Microwave</option>
                  <option value="pcb">PCB Physical / Stackup</option>
                  <option value="embedded">Embedded Control</option>
                  <option value="multi_domain">Multi-Domain System</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={sysDescription}
                  onChange={e => setSysDescription(e.target.value)}
                  placeholder="Architecture overview and boundaries..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSystemModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rail Modal */}
      {isRailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsRailModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Add Power Distribution Rail</h3>
              <button
                type="button"
                onClick={() => setIsRailModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRail} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rail Name *</label>
                <input
                  type="text"
                  required
                  value={railName}
                  onChange={e => setRailName(e.target.value)}
                  placeholder="e.g. VCC_3V3 or VDD_CORE"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nominal Voltage (V)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={nominalVoltage}
                    onChange={e => setNominalVoltage(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Max Current (A)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={maxCurrentAmps}
                    onChange={e => setMaxCurrentAmps(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRailModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Add Rail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
