import React, { useState, useMemo } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import { PcbBoardV2, PcbDrcFindingV2 } from '../../types/pcb';
import {
  runPcbDrcAudit,
  auditPcbConnectivity,
  analyzePcbPowerDistribution,
  evaluateStackup,
  evaluateTraceProperties,
  evaluateDifferentialPair,
  createPcbAnalysisSnapshot,
  createDefaultPcbBoard,
} from '../../pcb';
import {
  Layers,
  Cpu,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Camera,
  RefreshCw,
  Zap,
  Activity,
  Crosshair,
  Grid,
  Check,
  Compass,
} from 'lucide-react';

interface PcbViewProps {
  project: ElectroKitProjectV2;
  onUpdateProject: (updated: ElectroKitProjectV2) => void;
}

type PcbSubTab = 'layout' | 'stackup' | 'drc' | 'connectivity' | 'power_dist' | 'diff_pairs';

export const PcbView: React.FC<PcbViewProps> = ({ project, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<PcbSubTab>('layout');
  const [selectedLayerId, setSelectedLayerId] = useState<string>('all');
  const [drcFilter, setDrcFilter] = useState<'ALL' | 'ERROR' | 'WARNING'>('ALL');
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null);

  // Active board selection or fallback to first board, or seed one
  const boards = project.pcbBoards || [];
  const currentBoard: PcbBoardV2 = useMemo(() => {
    if (boards.length > 0) {
      if (project.activeBoardId) {
        const found = boards.find(b => b.id === project.activeBoardId);
        if (found) return found;
      }
      return boards[0];
    }
    return createDefaultPcbBoard(project);
  }, [boards, project]);

  // Evaluated Stackup metrics via Phase 08 engines
  const stackupSummary = useMemo(() => {
    return evaluateStackup(currentBoard.stackup);
  }, [currentBoard]);

  // Evaluated DRC findings
  const drcFindings = useMemo(() => {
    return runPcbDrcAudit(project, currentBoard);
  }, [project, currentBoard]);

  // Evaluated Physical Connectivity
  const connectivityAudit = useMemo(() => {
    return auditPcbConnectivity(project, currentBoard);
  }, [project, currentBoard]);

  // Power Distribution Analysis
  const powerDistribution = useMemo(() => {
    return analyzePcbPowerDistribution(project, currentBoard);
  }, [project, currentBoard]);

  // Counts
  const errorCount = drcFindings.filter(f => f.severity === 'ERROR').length;
  const warningCount = drcFindings.filter(f => f.severity === 'WARNING').length;

  const handleTakeSnapshot = () => {
    const { snapshot, updatedProject } = createPcbAnalysisSnapshot(
      project,
      currentBoard,
      `PCB Snapshot: ${currentBoard.name}`,
      `PCB Engineering Analysis Snapshot for ${currentBoard.name} (${currentBoard.revision})`
    );
    onUpdateProject(updatedProject);
    setSnapshotSuccess(`Snapshot ${snapshot.id} generated with SHA-256 digest: ${snapshot.integrityDigest.slice(0, 16)}...`);
    setTimeout(() => setSnapshotSuccess(null), 4000);
  };

  const handleSelectBoard = (boardId: string) => {
    onUpdateProject({
      ...project,
      activeBoardId: boardId,
    });
  };

  const filteredDrcFindings = drcFindings.filter(f => {
    if (drcFilter === 'ERROR') return f.severity === 'ERROR';
    if (drcFilter === 'WARNING') return f.severity === 'WARNING';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Board Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                Deep PCB Design Workspace
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                {currentBoard.revision}
              </span>
              <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                {currentBoard.stackup.layerCount} Layers
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Multi-layer physical design, deterministic transmission line sizing, IPC ampacity, and DRC verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {boards.length > 1 && (
              <select
                value={currentBoard.id}
                onChange={e => handleSelectBoard(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {boards.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.revision})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleTakeSnapshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              Capture PCB Snapshot
            </button>
          </div>
        </div>

        {snapshotSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{snapshotSuccess}</span>
          </div>
        )}

        {/* Board Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Dimensions</span>
            <span className="text-white font-semibold text-sm">
              {currentBoard.outline.widthMm} × {currentBoard.outline.heightMm} mm
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Thickness</span>
            <span className="text-white font-semibold text-sm">{stackupSummary.totalThicknessMm} mm</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Components Placed</span>
            <span className="text-white font-semibold text-sm">{currentBoard.placements.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Traces / Vias</span>
            <span className="text-white font-semibold text-sm">
              {currentBoard.traces.length} / {currentBoard.vias.length}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">DRC Errors</span>
            <span className={`font-semibold text-sm ${errorCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {errorCount} {errorCount === 0 ? '✓ Clean' : 'Violations'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Routing Complete</span>
            <span className={`font-semibold text-sm ${connectivityAudit.completionPercentage === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {connectivityAudit.completionPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('layout')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-1.5 transition ${
            activeTab === 'layout'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Physical Board & Layout
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stackup')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-1.5 transition ${
            activeTab === 'stackup'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Stackup & Dielectrics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('drc')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-1.5 transition ${
            activeTab === 'drc'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          DRC Rules Audit ({drcFindings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('connectivity')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-1.5 transition ${
            activeTab === 'connectivity'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Connectivity & Continuity
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('power_dist')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-1.5 transition ${
            activeTab === 'power_dist'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Power Distribution & IR Drop
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('diff_pairs')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-1.5 transition ${
            activeTab === 'diff_pairs'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          Differential Pairs & High-Speed
        </button>
      </div>

      {/* TAB 1: PHYSICAL BOARD & LAYOUT */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          {/* Layer Filter Toolbar */}
          <div className="flex items-center justify-between text-xs font-mono bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Filter Layer:</span>
              <button
                type="button"
                onClick={() => setSelectedLayerId('all')}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  selectedLayerId === 'all'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Copper
              </button>
              {currentBoard.stackup.copperLayers.map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLayerId(l.id)}
                  className={`px-2.5 py-1 rounded text-xs transition flex items-center gap-1.5 ${
                    selectedLayerId === l.id
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: l.color || '#3b82f6' }}
                  />
                  {l.name}
                </button>
              ))}
            </div>

            <span className="text-slate-500">
              Scale: 1mm = 6px | Canvas: {currentBoard.outline.widthMm * 6} × {currentBoard.outline.heightMm * 6} px
            </span>
          </div>

          {/* 2D Engineering Board Canvas (Deterministic SVG Rendering) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center overflow-x-auto">
            <svg
              width={currentBoard.outline.widthMm * 6 + 40}
              height={currentBoard.outline.heightMm * 6 + 40}
              viewBox={`-20 -20 ${currentBoard.outline.widthMm * 6 + 40} ${currentBoard.outline.heightMm * 6 + 40}`}
              className="select-none filter drop-shadow-md"
            >
              {/* Board Outline Body */}
              <rect
                x={0}
                y={0}
                width={currentBoard.outline.widthMm * 6}
                height={currentBoard.outline.heightMm * 6}
                rx={(currentBoard.outline.cornerRadiusMm || 3) * 6}
                ry={(currentBoard.outline.cornerRadiusMm || 3) * 6}
                fill="#064e3b" // FR-4 Solder Mask Green
                stroke="#047857"
                strokeWidth={3}
              />

              {/* Grid guide markings */}
              <defs>
                <pattern id="pcbGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#065f46" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>
              </defs>
              <rect
                x={0}
                y={0}
                width={currentBoard.outline.widthMm * 6}
                height={currentBoard.outline.heightMm * 6}
                fill="url(#pcbGrid)"
              />

              {/* Mounting Hole Cutouts */}
              {currentBoard.outline.cutouts.map(c => {
                if (c.center && c.radiusMm) {
                  return (
                    <g key={c.id}>
                      {/* Copper Annular Ring Pad */}
                      <circle
                        cx={c.center.x * 6}
                        cy={c.center.y * 6}
                        r={(c.radiusMm + 0.8) * 6}
                        fill="#ca8a04" // Exposed Gold / Copper plating
                      />
                      {/* Drill Hole */}
                      <circle
                        cx={c.center.x * 6}
                        cy={c.center.y * 6}
                        r={c.radiusMm * 6}
                        fill="#020617" // Hole background
                        stroke="#78350f"
                        strokeWidth={1}
                      />
                    </g>
                  );
                }
                return null;
              })}

              {/* Copper Zones (L2 GND / L3 Power Islands) */}
              {currentBoard.copperZones.map(zone => {
                if (selectedLayerId !== 'all' && zone.layerId !== selectedLayerId) return null;
                const pointsStr = zone.polygonPoints.map(p => `${p.x * 6},${p.y * 6}`).join(' ');
                return (
                  <polygon
                    key={zone.id}
                    points={pointsStr}
                    fill={zone.name.includes('GND') ? '#0284c7' : '#eab308'}
                    fillOpacity={0.25}
                    stroke={zone.name.includes('GND') ? '#0284c7' : '#eab308'}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                );
              })}

              {/* Keepout Zones */}
              {currentBoard.keepouts.map(ko => {
                const pointsStr = ko.polygonPoints.map(p => `${p.x * 6},${p.y * 6}`).join(' ');
                return (
                  <polygon
                    key={ko.id}
                    points={pointsStr}
                    fill="#ef4444"
                    fillOpacity={0.15}
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Routed PCB Traces */}
              {currentBoard.traces.map(tr => {
                return tr.segments.map(seg => {
                  if (selectedLayerId !== 'all' && seg.layerId !== selectedLayerId) return null;
                  return (
                    <line
                      key={seg.id}
                      x1={seg.startX * 6}
                      y1={seg.startY * 6}
                      x2={seg.endX * 6}
                      y2={seg.endY * 6}
                      stroke={tr.name.includes('VIN') ? '#f97316' : tr.name.includes('SW') ? '#a855f7' : '#22c55e'}
                      strokeWidth={seg.widthMm * 6}
                      strokeLinecap="round"
                    />
                  );
                });
              })}

              {/* Vias */}
              {currentBoard.vias.map(v => {
                return (
                  <g key={v.id}>
                    <circle
                      cx={v.xMm * 6}
                      cy={v.yMm * 6}
                      r={(v.padDiameterMm / 2) * 6}
                      fill="#eab308"
                    />
                    <circle
                      cx={v.xMm * 6}
                      cy={v.yMm * 6}
                      r={(v.drillDiameterMm / 2) * 6}
                      fill="#0f172a"
                    />
                  </g>
                );
              })}

              {/* Component Footprints and Placements */}
              {currentBoard.placements.map(pl => {
                const fp = currentBoard.footprints.find(f => f.id === pl.footprintId);
                const w = fp ? fp.courtyardWidthMm * 6 : 40;
                const h = fp ? fp.courtyardLengthMm * 6 : 40;
                const bodyW = fp ? fp.bodyWidthMm * 6 : 30;
                const bodyH = fp ? fp.bodyLengthMm * 6 : 30;

                return (
                  <g key={pl.id} transform={`translate(${pl.xMm * 6}, ${pl.yMm * 6})`}>
                    {/* Component Courtyard Boundary */}
                    <rect
                      x={-w / 2}
                      y={-h / 2}
                      width={w}
                      height={h}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={0.8}
                      strokeDasharray="2 2"
                    />

                    {/* Component Package Body */}
                    <rect
                      x={-bodyW / 2}
                      y={-bodyH / 2}
                      width={bodyW}
                      height={bodyH}
                      fill="#1e293b"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      rx={2}
                    />

                    {/* Footprint Pads */}
                    {fp &&
                      fp.pads.map(pad => (
                        <rect
                          key={pad.id}
                          x={pad.offsetXFromCenterMm * 6 - (pad.widthMm * 6) / 2}
                          y={pad.offsetYFromCenterMm * 6 - (pad.heightMm * 6) / 2}
                          width={pad.widthMm * 6}
                          height={pad.heightMm * 6}
                          fill="#fbbf24"
                          stroke="#d97706"
                          strokeWidth={0.5}
                        />
                      ))}

                    {/* Silkscreen Reference Designator */}
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#f8fafc"
                      fontSize={11}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {pl.refDes}
                    </text>
                  </g>
                );
              })}

              {/* Test Points */}
              {currentBoard.testPoints.map(tp => (
                <g key={tp.id} transform={`translate(${tp.xMm * 6}, ${tp.yMm * 6})`}>
                  <circle r={8} fill="#38bdf8" fillOpacity={0.3} stroke="#38bdf8" strokeWidth={1} />
                  <circle r={3} fill="#38bdf8" />
                  <text x={12} y={3} fill="#7dd3fc" fontSize={9} fontFamily="monospace">
                    {tp.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Physical Route Metrics Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-emerald-400" />
              Routed Traces Physical Sizing & IPC Ampacity Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Trace Name</th>
                    <th className="pb-2">Net</th>
                    <th className="pb-2">Length</th>
                    <th className="pb-2">Avg Width</th>
                    <th className="pb-2">Resistance</th>
                    <th className="pb-2">IPC Capacity</th>
                    <th className="pb-2">Class</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {currentBoard.traces.map(tr => {
                    const evalTr = evaluateTraceProperties(tr, currentBoard);
                    return (
                      <tr key={tr.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 font-semibold text-white">{tr.name}</td>
                        <td className="py-2.5 text-slate-400">{tr.netId}</td>
                        <td className="py-2.5">{tr.totalLengthMm} mm</td>
                        <td className="py-2.5">{tr.averageWidthMm} mm</td>
                        <td className="py-2.5 text-emerald-400">{evalTr.resistanceOhms} Ω</td>
                        <td className="py-2.5 text-amber-400">{evalTr.ampacityAmps} A</td>
                        <td className="py-2.5 uppercase text-[10px] text-slate-400">{tr.impedanceClass}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              evalTr.status === 'routed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {evalTr.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STACKUP & DIELECTRICS */}
      {activeTab === 'stackup' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  {currentBoard.stackup.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated using Phase 08 transmission line, dielectric constant, and stackup sizing engines.
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-slate-400">Total Nominal: </span>
                <span className="text-emerald-400 font-bold">{stackupSummary.totalThicknessMm} mm</span>
              </div>
            </div>

            {/* Stackup Visual Cross-Section */}
            <div className="space-y-1.5 font-mono text-xs mt-6">
              {currentBoard.stackup.copperLayers.map((cl, idx) => {
                const diel = currentBoard.stackup.dielectricLayers[idx];
                return (
                  <React.Fragment key={cl.id}>
                    {/* Copper Layer Bar */}
                    <div className="p-3 rounded bg-slate-800 border-l-4 border-emerald-500 flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-bold w-12">{cl.name.split('_')[0]}</span>
                        <span className="font-semibold">{cl.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 uppercase">
                          {cl.electricalType || cl.layerClass}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-slate-300">
                        <span>{cl.copperThicknessOz} oz ({cl.copperThicknessMm * 1000} µm)</span>
                        <span className="text-slate-500 text-[10px]">{cl.side} side</span>
                      </div>
                    </div>

                    {/* Dielectric Substrate Layer */}
                    {diel && (
                      <div className="px-4 py-2 my-1 rounded bg-slate-950/70 border border-dashed border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                          <span>{diel.name} ({diel.materialName})</span>
                          <span className="text-slate-500">[{diel.type}]</span>
                        </div>
                        <div className="flex items-center gap-6 font-mono">
                          <span>εr = {diel.dielectricConstantEr}</span>
                          <span>tanδ = {diel.lossTangent}</span>
                          <span className="text-white font-medium">{diel.thicknessMm} mm</span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Controlled Impedance Reference Geometry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">50Ω Microstrip Trace Width (L1 Top)</span>
                <span className="text-emerald-400 font-bold text-base mt-1 block">
                  {stackupSummary.outerLayerMicrostrip50OhmWidthMm} mm (13.8 mil)
                </span>
                <span className="text-slate-500 text-[10px]">Reference to L2 GND Plane (h=0.2mm, εr=4.3)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">50Ω Stripline Trace Width (Inner)</span>
                <span className="text-emerald-400 font-bold text-base mt-1 block">
                  {stackupSummary.innerLayerStripline50OhmWidthMm} mm (7.9 mil)
                </span>
                <span className="text-slate-500 text-[10px]">Symmetrical Stripline Between Planes</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Propagation Delay (FR-4)</span>
                <span className="text-emerald-400 font-bold text-base mt-1 block">
                  {stackupSummary.propagationDelayPsPerMm} ps / mm
                </span>
                <span className="text-slate-500 text-[10px]">Deterministic velocity factor based on εr=4.3</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DRC RULES AUDIT */}
      {activeTab === 'drc' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">Filter Severity:</span>
              <button
                type="button"
                onClick={() => setDrcFilter('ALL')}
                className={`px-3 py-1 rounded text-xs font-mono transition ${
                  drcFilter === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                All ({drcFindings.length})
              </button>
              <button
                type="button"
                onClick={() => setDrcFilter('ERROR')}
                className={`px-3 py-1 rounded text-xs font-mono transition ${
                  drcFilter === 'ERROR' ? 'bg-red-900/60 text-red-300 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Errors ({errorCount})
              </button>
              <button
                type="button"
                onClick={() => setDrcFilter('WARNING')}
                className={`px-3 py-1 rounded text-xs font-mono transition ${
                  drcFilter === 'WARNING' ? 'bg-amber-900/60 text-amber-300 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Warnings ({warningCount})
              </button>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Audit Scope: 12 Rule Categories
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredDrcFindings.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center font-mono">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Zero DRC Violations Detected</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Board geometry, clearances, annular rings, transmission lines, and power routes comply with rules.
                </p>
              </div>
            ) : (
              filteredDrcFindings.map(finding => {
                const isError = finding.severity === 'ERROR';
                return (
                  <div
                    key={finding.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 font-mono text-xs ${
                      isError
                        ? 'bg-red-950/30 border-red-800/80 text-red-200'
                        : 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isError ? (
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              isError ? 'bg-red-900 text-red-200' : 'bg-amber-900 text-amber-200'
                            }`}
                          >
                            {finding.severity}
                          </span>
                          <span className="text-slate-400 font-semibold">{finding.category}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-white font-medium">{finding.ruleName}</span>
                        </div>
                        <p className="mt-1 text-slate-300">{finding.description}</p>
                      </div>
                    </div>

                    {(finding.measuredValue !== undefined || finding.limitValue !== undefined) && (
                      <div className="text-right shrink-0 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                        {finding.measuredValue !== undefined && (
                          <div className="text-slate-400">
                            Measured: <span className="text-white font-bold">{finding.measuredValue} {finding.unit}</span>
                          </div>
                        )}
                        {finding.limitValue !== undefined && (
                          <div className="text-slate-400">
                            Limit: <span className="text-emerald-400 font-bold">{finding.limitValue} {finding.unit}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONNECTIVITY & ROUTING */}
      {activeTab === 'connectivity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs">
              <span className="text-slate-400 block text-[10px] uppercase">Total Nets</span>
              <span className="text-white font-bold text-lg mt-1 block">{connectivityAudit.totalNets}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs">
              <span className="text-slate-400 block text-[10px] uppercase">Fully Routed Nets</span>
              <span className="text-emerald-400 font-bold text-lg mt-1 block">{connectivityAudit.fullyRoutedNets}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs">
              <span className="text-slate-400 block text-[10px] uppercase">Unrouted Nets</span>
              <span className={`font-bold text-lg mt-1 block ${connectivityAudit.unroutedNets > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {connectivityAudit.unroutedNets}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs">
              <span className="text-slate-400 block text-[10px] uppercase">Connectivity Status</span>
              <span
                className={`font-bold text-sm mt-1.5 block ${
                  connectivityAudit.status === 'COMPLETE' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {connectivityAudit.status}
              </span>
            </div>
          </div>

          {/* Broken Power Paths Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
              Power Path Continuity Verification (Wave 04 Integration)
            </h3>
            {connectivityAudit.brokenPowerPaths.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 font-mono text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                All Wave 04 system power paths are physically verified and routed on PCB copper planes or wide traces.
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {connectivityAudit.brokenPowerPaths.map(bp => (
                  <div key={bp.pathId} className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-200">
                    <span className="font-bold text-white">{bp.name}:</span> {bp.missingHop}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: POWER DISTRIBUTION & IR DROP */}
      {activeTab === 'power_dist' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-400" />
              System Power Rails to PCB Copper Distribution & IR Drop
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Power Rail</th>
                    <th className="pb-2">Nominal Voltage</th>
                    <th className="pb-2">Allocated Current</th>
                    <th className="pb-2">Distribution</th>
                    <th className="pb-2">Copper Resistance</th>
                    <th className="pb-2">Estimated IR Drop</th>
                    <th className="pb-2">Voltage at Load</th>
                    <th className="pb-2">Power Loss</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {powerDistribution.map(pd => (
                    <tr key={pd.railId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-white">{pd.railName}</td>
                      <td className="py-2.5">{pd.voltage} V</td>
                      <td className="py-2.5 text-amber-400">{pd.allocatedCurrentAmps} A</td>
                      <td className="py-2.5 uppercase text-[10px] text-slate-400">
                        {pd.distributionMethod.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 text-emerald-400">
                        {(pd.totalTraceResistanceOhms + pd.totalViaResistanceOhms).toFixed(4)} Ω
                      </td>
                      <td className="py-2.5 text-amber-300 font-semibold">
                        {pd.estimatedIrDropVolts} V ({pd.percentageVoltageDrop}%)
                      </td>
                      <td className="py-2.5 text-white font-bold">{pd.voltageAtLoadVolts} V</td>
                      <td className="py-2.5">{pd.powerDissipationWatts} W</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pd.status === 'PASS'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : pd.status === 'MARGINAL'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {pd.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DIFFERENTIAL PAIRS & HIGH-SPEED */}
      {activeTab === 'diff_pairs' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-4">
              <Grid className="w-4 h-4 text-emerald-400" />
              Controlled Differential Pairs & High-Speed Impedance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Pair Name</th>
                    <th className="pb-2">Target Zdiff</th>
                    <th className="pb-2">Calculated Zdiff</th>
                    <th className="pb-2">Width / Spacing</th>
                    <th className="pb-2">P Length</th>
                    <th className="pb-2">N Length</th>
                    <th className="pb-2">Skew Length</th>
                    <th className="pb-2">Skew Delay</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {currentBoard.differentialPairs.map(dp => {
                    const evalDp = evaluateDifferentialPair(dp, currentBoard);
                    return (
                      <tr key={dp.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 font-bold text-white">{dp.name}</td>
                        <td className="py-2.5">{dp.targetDifferentialImpedanceOhms} Ω ± {dp.tolerancePercent}%</td>
                        <td className="py-2.5 text-emerald-400 font-bold">{evalDp.calculatedDifferentialImpedanceOhms} Ω</td>
                        <td className="py-2.5">{dp.traceWidthMm} / {dp.traceSpacingMm} mm</td>
                        <td className="py-2.5">{dp.totalLengthPositiveMm} mm</td>
                        <td className="py-2.5">{dp.totalLengthNegativeMm} mm</td>
                        <td className="py-2.5 text-amber-400">{evalDp.skewLengthMm} mm</td>
                        <td className="py-2.5">{evalDp.skewDelayPicoseconds} ps</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              evalDp.status === 'PASS'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {evalDp.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
