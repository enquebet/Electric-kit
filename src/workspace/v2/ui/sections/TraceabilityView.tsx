import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import { TraceabilityGraph } from '../../traceability/traceability-graph';
import {
  GitMerge,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileCheck,
} from 'lucide-react';

interface TraceabilityViewProps {
  project: ElectroKitProjectV2;
}

export const TraceabilityView: React.FC<TraceabilityViewProps> = ({ project }) => {
  const graph = new TraceabilityGraph(project.traceabilityLinks);
  const coverage = graph.calculateCoverage(project);

  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    project.requirements[0]?.id || project.calculations[0]?.id || ''
  );

  const upstreamLinks = selectedEntityId ? graph.getUpstream(selectedEntityId) : [];
  const downstreamLinks = selectedEntityId ? graph.getDownstream(selectedEntityId) : [];
  const impactRadius = selectedEntityId ? graph.getImpactRadius(selectedEntityId) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-cyan-400" />
            Engineering Traceability & Impact Analysis
          </h2>
          <p className="text-xs text-slate-400">
            Bi-directional mathematical audit trail linking requirements, design objects, calculations, snapshots, and validations.
          </p>
        </div>
      </div>

      {/* Requirements Coverage Summary Card */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Requirement Verification Coverage
          </span>
          <span className="text-sm font-bold font-mono text-cyan-400">
            {coverage.coveragePercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${Math.min(100, coverage.coveragePercent)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-center pt-1">
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Total Requirements</span>
            <span className="font-bold text-slate-200">{coverage.totalRequirements}</span>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Satisfied by Calc/Meas</span>
            <span className="font-bold text-emerald-400">{coverage.satisfiedRequirements}</span>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Unmet Requirements</span>
            <span className="font-bold text-amber-400">{coverage.unmetRequirements}</span>
          </div>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Graph Links</span>
            <span className="font-bold text-cyan-300">{project.traceabilityLinks.length}</span>
          </div>
        </div>
      </div>

      {/* Interactive Entity Relationship Explorer */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Traceability Chain Explorer
          </span>
          <select
            value={selectedEntityId}
            onChange={e => setSelectedEntityId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-600"
          >
            <optgroup label="Requirements">
              {project.requirements.map(r => (
                <option key={r.id} value={r.id}>
                  {r.id}: {r.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Calculations">
              {project.calculations.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id}: {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Components">
              {project.components.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.id}: {comp.refDes} - {comp.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* 3-Column Relationship Map: Upstream -> Current Entity -> Downstream */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Upstream Column */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upstream Drivers ({upstreamLinks.length})</span>
            </div>

            {upstreamLinks.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs font-mono">
                No upstream dependencies. Root entity.
              </div>
            ) : (
              upstreamLinks.map(link => (
                <div
                  key={link.id}
                  onClick={() => setSelectedEntityId(link.sourceId)}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-800/60 transition cursor-pointer text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{link.sourceId}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{link.sourceType}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Relation: {link.relationship}</div>
                  {link.rationale && <div className="text-[10px] text-slate-500 italic">{link.rationale}</div>}
                </div>
              ))
            )}
          </div>

          {/* Current Selected Entity */}
          <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/80 ring-1 ring-cyan-500/40 space-y-3">
            <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider pb-2 border-b border-slate-800 text-center">
              Selected Target Focus
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <div className="text-xs font-mono font-bold text-cyan-400">{selectedEntityId}</div>
              <div className="text-xs text-slate-300">
                {project.requirements.find(r => r.id === selectedEntityId)?.name ||
                 project.calculations.find(c => c.id === selectedEntityId)?.name ||
                 project.components.find(c => c.id === selectedEntityId)?.name ||
                 selectedEntityId}
              </div>
              <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                Transitive Impact Radius: {impactRadius.length} downstream entities
              </div>
            </div>
          </div>

          {/* Downstream Column */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span>Downstream Impact ({downstreamLinks.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {downstreamLinks.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs font-mono">
                No registered downstream impacts.
              </div>
            ) : (
              downstreamLinks.map(link => (
                <div
                  key={link.id}
                  onClick={() => setSelectedEntityId(link.targetId)}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-800/60 transition cursor-pointer text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">{link.targetId}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{link.targetType}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Relation: {link.relationship}</div>
                  {link.rationale && <div className="text-[10px] text-slate-500 italic">{link.rationale}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
