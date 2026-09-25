import React, { useState, useEffect } from 'react';
import {
  ListPlus,
  Save,
  FolderOpen,
  Trash2,
  AlertTriangle,
  Zap,
  Activity,
  DollarSign,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  calculateComprehensiveLoadSchedule,
  ScheduleCircuitItem,
} from '../../engines/electrical/load-schedule';
import {
  CalculationProject,
  saveCalculationProject,
  loadSavedProjects,
  deleteCalculationProject,
} from '../../lib/storage/local';

export const LoadScheduleTool: React.FC<{ onNavigate?: (id: string) => void }> = () => {
  const [systemVoltageLL, setSystemVoltageLL] = useState<number>(400);
  const [tariffRate, setTariffRate] = useState<number>(0.16);
  const [projectName, setProjectName] = useState<string>('Distribution Board DB-1');
  const [savedProjects, setSavedProjects] = useState<CalculationProject[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const [circuits, setCircuits] = useState<ScheduleCircuitItem[]>([
    {
      id: '1',
      name: 'Highbay LED Lighting',
      category: 'lighting',
      phase: 'A',
      voltageV: 230,
      powerWatts: 1800,
      powerFactor: 0.95,
      pfType: 'leading',
      quantity: 1,
      demandFactor: 0.9,
      hoursPerDay: 12,
    },
    {
      id: '2',
      name: 'Machine Shop Sockets',
      category: 'receptacle',
      phase: 'B',
      voltageV: 230,
      powerWatts: 2400,
      powerFactor: 0.85,
      pfType: 'lagging',
      quantity: 1,
      demandFactor: 0.6,
      hoursPerDay: 8,
    },
    {
      id: '3',
      name: 'Server Rack UPS Feeder',
      category: 'it-server',
      phase: 'C',
      voltageV: 230,
      powerWatts: 2200,
      powerFactor: 0.9,
      pfType: 'lagging',
      quantity: 1,
      demandFactor: 1.0,
      hoursPerDay: 24,
    },
    {
      id: '4',
      name: 'Chiller Compressor Unit',
      category: 'hvac',
      phase: '3P',
      voltageV: 400,
      powerWatts: 7500,
      powerFactor: 0.82,
      pfType: 'lagging',
      quantity: 1,
      demandFactor: 0.8,
      hoursPerDay: 10,
    },
  ]);

  useEffect(() => {
    setSavedProjects(loadSavedProjects().filter(p => p.toolId === 'load-schedule'));
  }, []);

  const result = calculateComprehensiveLoadSchedule(circuits, systemVoltageLL, tariffRate);

  const addCircuit = () => {
    const newCircuit: ScheduleCircuitItem = {
      id: Date.now().toString(),
      name: `Branch Circuit ${circuits.length + 1}`,
      category: 'general',
      phase: 'A',
      voltageV: 230,
      powerWatts: 1500,
      powerFactor: 0.85,
      pfType: 'lagging',
      quantity: 1,
      demandFactor: 0.8,
      hoursPerDay: 8,
    };
    setCircuits([...circuits, newCircuit]);
  };

  const updateCircuit = (id: string, field: keyof ScheduleCircuitItem, val: any) => {
    setCircuits(circuits.map(c => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const removeCircuit = (id: string) => {
    if (circuits.length <= 1) return;
    setCircuits(circuits.filter(c => c.id !== id));
  };

  const handleSaveProject = () => {
    const proj: CalculationProject = {
      id: `ls-${Date.now()}`,
      name: projectName.trim() || 'Untitled Load Schedule',
      toolId: 'load-schedule',
      category: 'electrical',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        circuits,
        systemVoltageLL,
        tariffRate,
      },
      notes: `Total Diversified Demand: ${result.formattedValue}`,
    };
    saveCalculationProject(proj);
    setSavedProjects(loadSavedProjects().filter(p => p.toolId === 'load-schedule'));
    setNotification('Schedule successfully saved to local storage.');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleLoadProject = (p: CalculationProject) => {
    if (p.data?.circuits) {
      setCircuits(p.data.circuits);
      setProjectName(p.name);
      if (p.data.systemVoltageLL) setSystemVoltageLL(p.data.systemVoltageLL);
      if (p.data.tariffRate) setTariffRate(p.data.tariffRate);
      setNotification(`Loaded project "${p.name}".`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const handleDeleteProject = (id: string) => {
    deleteCalculationProject(id);
    setSavedProjects(loadSavedProjects().filter(p => p.toolId === 'load-schedule'));
  };

  const unbalance = result.visualData?.unbalancePercent || 0;
  const currents = result.visualData?.currents || { A: 0, B: 0, C: 0 };

  return (
    <div className="space-y-6" id="load-schedule-tool-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Electrical Load Schedule & Balancing</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              ENGINEERING ESTIMATE
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-branch panelboard load schedule, phase current distribution (A, B, C), unbalance factor, and diversified demand (kW / kVA).
          </p>
        </div>

        {/* Project Save Controls */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs w-48 font-medium"
            placeholder="Panelboard Project Name"
          />
          <button
            onClick={handleSaveProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            <Save className="w-3.5 h-3.5" />
            Save Project
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Saved Projects Drawer */}
      {savedProjects.length > 0 && (
        <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-primary" />
            Saved Panel Schedules ({savedProjects.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {savedProjects.map(proj => (
              <div
                key={proj.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs"
              >
                <button
                  onClick={() => handleLoadProject(proj)}
                  className="font-medium text-foreground hover:text-primary transition-colors text-left"
                >
                  {proj.name}
                </button>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  className="text-muted-foreground hover:text-red-500 p-0.5"
                  title="Delete schedule"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Settings Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-border bg-card">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Mains Line-to-Line Voltage (V_LL)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={systemVoltageLL}
              onChange={e => setSystemVoltageLL(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
            />
            <span className="flex items-center px-2.5 rounded bg-muted text-[11px]">V_LL</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Line-to-Neutral: {(systemVoltageLL / Math.sqrt(3)).toFixed(0)} V</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Electricity Tariff Rate ($/kWh)</label>
          <input
            type="number"
            step="0.01"
            value={tariffRate}
            onChange={e => setTariffRate(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Total Branch Circuits</label>
          <div className="flex justify-between items-center h-8">
            <span className="text-sm font-bold text-foreground">{circuits.length} Circuits Configured</span>
            <button
              onClick={addCircuit}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold"
            >
              <ListPlus className="w-3.5 h-3.5" />
              Add Circuit
            </button>
          </div>
        </div>
      </div>

      {/* Phase Balancing Bar */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Three-Phase Current Distribution & Balance
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              unbalance <= 10
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {unbalance.toFixed(1)}% Unbalance {unbalance <= 10 ? '(Balanced)' : '(High Unbalance)'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <span className="text-xs font-bold text-red-500 block">Phase A (L1)</span>
            <span className="text-xl font-extrabold text-foreground">{currents.A.toFixed(1)} A</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-xs font-bold text-amber-500 block">Phase B (L2)</span>
            <span className="text-xl font-extrabold text-foreground">{currents.B.toFixed(1)} A</span>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
            <span className="text-xs font-bold text-blue-500 block">Phase C (L3)</span>
            <span className="text-xl font-extrabold text-foreground">{currents.C.toFixed(1)} A</span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((w, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                w.severity === 'danger'
                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">{w.title}</span>
                <span>{w.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Circuits Table */}
      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
            <tr>
              <th className="p-3">Circuit Name</th>
              <th className="p-3">Phase</th>
              <th className="p-3">Connected W</th>
              <th className="p-3">PF</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Demand %</th>
              <th className="p-3">Design Demand</th>
              <th className="p-3">Hours</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {circuits.map(item => {
              const itemConnW = item.powerWatts * item.quantity;
              const itemDemandW = itemConnW * item.demandFactor;
              return (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium text-foreground">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateCircuit(item.id, 'name', e.target.value)}
                      className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-full max-w-[170px]"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={item.phase}
                      onChange={e => updateCircuit(item.id, 'phase', e.target.value as any)}
                      className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs font-semibold"
                    >
                      <option value="A">Phase A</option>
                      <option value="B">Phase B</option>
                      <option value="C">Phase C</option>
                      <option value="3P">Balanced 3P</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.powerWatts}
                      onChange={e => updateCircuit(item.id, 'powerWatts', Number(e.target.value))}
                      className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-20"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={item.powerFactor}
                      onChange={e => updateCircuit(item.id, 'powerFactor', Number(e.target.value))}
                      className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-16"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateCircuit(item.id, 'quantity', Number(e.target.value))}
                      className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-14"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={item.demandFactor}
                      onChange={e => updateCircuit(item.id, 'demandFactor', Number(e.target.value))}
                      className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-16"
                    />
                  </td>
                  <td className="p-3 font-semibold text-foreground">{(itemDemandW / 1000).toFixed(2)} kW</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={item.hoursPerDay}
                      onChange={e => updateCircuit(item.id, 'hoursPerDay', Number(e.target.value))}
                      className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-14"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => removeCircuit(item.id)}
                      className="text-xs text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground uppercase block font-semibold">Total Connected</span>
          <span className="text-xl font-extrabold text-foreground">{result.additionalOutputs?.connectedLoad?.value}</span>
        </div>
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
          <span className="text-[11px] text-primary uppercase block font-semibold">Diversified Demand</span>
          <span className="text-xl font-extrabold text-foreground">{result.additionalOutputs?.diversifiedDemand?.value}</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground uppercase block font-semibold">Total Apparent Power</span>
          <span className="text-xl font-extrabold text-foreground">{result.additionalOutputs?.apparentPowerKva?.value}</span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[11px] text-muted-foreground uppercase block font-semibold">Estimated Monthly Bill</span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{result.additionalOutputs?.monthlyCost?.value}</span>
        </div>
      </div>
    </div>
  );
};
