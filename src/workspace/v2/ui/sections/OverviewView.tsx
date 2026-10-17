import React from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import { WorkspaceSectionKey } from '../../search/global-search';
import {
  CheckSquare,
  Network,
  Cpu,
  GitBranch,
  Sliders,
  Calculator,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Award,
  GitMerge,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface OverviewViewProps {
  project: ElectroKitProjectV2;
  onNavigate: (section: WorkspaceSectionKey) => void;
}

type HealthState = 'SATISFIED' | 'ATTENTION' | 'FAILED' | 'NOT EVALUATED';

interface HealthCategory {
  title: string;
  state: HealthState;
  reason: string;
  section: WorkspaceSectionKey;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ project, onNavigate }) => {
  const activeCase = project.designCases.find(c => c.id === project.activeCaseId) || project.designCases[0];
  const openIssues = project.issues.filter(i => i.status === 'open' || i.status === 'investigating');
  const criticalIssues = openIssues.filter(i => i.severity === 'blocker' || i.severity === 'critical');

  // Compute requirements stats
  const reqTotal = project.requirements.length;
  const reqPassed = project.requirements.filter(r => r.verificationStatus === 'passed').length;
  const reqFailed = project.requirements.filter(r => r.verificationStatus === 'failed').length;
  const reqPending = reqTotal - reqPassed - reqFailed;

  // Compute deterministic Health Status matrix
  const healthMatrix: HealthCategory[] = [
    {
      title: 'Requirements',
      state: reqTotal === 0 ? 'NOT EVALUATED' : reqFailed > 0 ? 'FAILED' : reqPending > 0 ? 'ATTENTION' : 'SATISFIED',
      reason: reqTotal === 0 ? 'No requirements defined yet' : `${reqPassed}/${reqTotal} verified (${reqPending} pending, ${reqFailed} failed)`,
      section: 'requirements',
    },
    {
      title: 'Power Architecture',
      state: project.powerRails.length === 0 ? 'NOT EVALUATED' : project.powerRails.length > 0 ? 'SATISFIED' : 'ATTENTION',
      reason: project.powerRails.length > 0 ? `${project.powerRails.length} rails configured` : 'No power rails modeled',
      section: 'systems',
    },
    {
      title: 'Thermal System',
      state: project.systems.some(s => s.thermalSystem?.status === 'conservative') ? 'SATISFIED' : project.systems.some(s => s.thermalSystem) ? 'ATTENTION' : 'NOT EVALUATED',
      reason: project.systems.some(s => s.thermalSystem) ? 'Junction & heatsink network modeled' : 'Thermal network not modeled',
      section: 'systems',
    },
    {
      title: 'Validation Lab',
      state: project.measurements.length === 0 ? 'NOT EVALUATED' : project.measurements.some(m => m.verdict === 'fail') ? 'FAILED' : 'SATISFIED',
      reason: project.measurements.length === 0 ? 'No bench measurements registered' : `${project.measurements.filter(m => m.verdict === 'pass').length}/${project.measurements.length} within tolerance`,
      section: 'validation',
    },
    {
      title: 'Traceability',
      state: project.traceabilityLinks.length >= reqTotal && reqTotal > 0 ? 'SATISFIED' : project.traceabilityLinks.length > 0 ? 'ATTENTION' : 'NOT EVALUATED',
      reason: `${project.traceabilityLinks.length} graph links connecting requirements and calculations`,
      section: 'traceability',
    },
    {
      title: 'Engineering Risk',
      state: criticalIssues.length > 0 ? 'FAILED' : openIssues.length > 0 ? 'ATTENTION' : 'SATISFIED',
      reason: criticalIssues.length > 0 ? `${criticalIssues.length} critical issues open` : openIssues.length > 0 ? `${openIssues.length} open issues under investigation` : 'Zero open blockers',
      section: 'issues',
    },
  ];

  const getHealthBadge = (state: HealthState) => {
    switch (state) {
      case 'SATISFIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">SATISFIED</span>;
      case 'ATTENTION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/60">ATTENTION</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/60">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">NOT EVALUATED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Banner & Objective */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/50 uppercase">
                {project.metadata.projectType}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">
                Created {new Date(project.metadata.createdAt).toLocaleDateString()} by {project.metadata.author}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              {project.metadata.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {project.metadata.description || 'No project description provided.'}
            </p>
            {project.metadata.engineeringObjective && (
              <div className="mt-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                <span className="font-mono font-bold text-cyan-400 uppercase tracking-wider text-[10px] block mb-1">
                  Primary Engineering Objective:
                </span>
                <span className="text-slate-200">{project.metadata.engineeringObjective}</span>
              </div>
            )}
          </div>

          {/* Active Case Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 min-w-[240px] flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Active Design Baseline
            </span>
            <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span>{activeCase ? activeCase.name : 'None'}</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              {activeCase?.description || 'Active baseline parameters'}
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Scenarios: {activeCase?.scenarios.length || 0}</span>
              <span>Calculations: {activeCase?.associatedCalculationIds.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('requirements')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-700/60 transition text-left cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Requirements</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold font-mono text-slate-100">{reqTotal}</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1">{reqPassed} verified</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('systems')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-700/60 transition text-left cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Systems & Rails</span>
            <Network className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold font-mono text-slate-100">
            {project.systems.length + project.powerRails.length}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">{project.powerRails.length} rails</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('components')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-700/60 transition text-left cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Components</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl font-bold font-mono text-slate-100">{project.components.length}</span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">{project.nets.length} nets</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('calculations')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-700/60 transition text-left cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Calculations</span>
            <Calculator className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold font-mono text-slate-100">{project.calculations.length}</span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">{project.calculationSnapshots.length} snapshots</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('validation')}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-700/60 transition text-left cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Measurements</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold font-mono text-slate-100">{project.measurements.length}</span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">{project.validationMilestones.length} milestones</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('issues')}
          className={`p-3.5 rounded-xl bg-slate-900 border transition text-left cursor-pointer flex flex-col justify-between ${
            openIssues.length > 0 ? 'border-amber-800/60 hover:border-amber-600' : 'border-slate-800 hover:border-cyan-700/60'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Open Issues</span>
            <AlertTriangle className={`w-4 h-4 ${openIssues.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <span className={`text-xl font-bold font-mono ${openIssues.length > 0 ? 'text-amber-300' : 'text-slate-100'}`}>
            {openIssues.length}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">{project.decisions.length} decisions</span>
        </button>
      </div>

      {/* Project Health Status Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              Engineering Domain Health Matrix
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Real deterministic states (no arbitrary scores)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {healthMatrix.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate(item.section)}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition text-left flex flex-col justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                  {item.title}
                </span>
                {getHealthBadge(item.state)}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">{item.reason}</p>
              <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 pt-1 border-t border-slate-900 group-hover:translate-x-0.5 transition">
                <span>Inspect in {item.title}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
