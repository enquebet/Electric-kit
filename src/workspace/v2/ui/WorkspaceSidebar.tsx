import React from 'react';
import { WorkspaceSectionKey } from '../search/global-search';
import { ElectroKitProjectV2 } from '../types/project';
import {
  LayoutDashboard,
  CheckSquare,
  ShieldAlert,
  HelpCircle,
  Network,
  Cpu,
  GitBranch,
  Sliders,
  Calculator,
  Camera,
  CheckCircle,
  AlertTriangle,
  Award,
  GitMerge,
  FileSpreadsheet,
  Layers,
  X,
} from 'lucide-react';

interface WorkspaceSidebarProps {
  project: ElectroKitProjectV2;
  activeSection: WorkspaceSectionKey;
  onSelectSection: (section: WorkspaceSectionKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  key: WorkspaceSectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  highlight?: boolean;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  project,
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
}) => {
  const openIssuesCount = project.issues.filter(i => i.status === 'open' || i.status === 'investigating').length;

  const navItems: NavItem[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'requirements', label: 'Requirements', icon: CheckSquare, count: project.requirements.length },
    { key: 'constraints', label: 'Constraints', icon: ShieldAlert, count: project.constraints.length },
    { key: 'assumptions', label: 'Assumptions', icon: HelpCircle, count: project.assumptions.length },
    { key: 'systems', label: 'Systems & Rails', icon: Network, count: project.systems.length + project.powerRails.length },
    { key: 'components', label: 'Components', icon: Cpu, count: project.components.length },
    { key: 'pcb', label: 'PCB Workspace', icon: Layers, count: project.pcbBoards?.length || 0 },
    { key: 'cases', label: 'Design Cases', icon: GitBranch, count: project.designCases.length },
    {
      key: 'scenarios',
      label: 'Scenarios',
      icon: Sliders,
      count: project.designCases.reduce((acc, c) => acc + (c.scenarios?.length || 0), 0),
    },
    { key: 'calculations', label: 'Calculations', icon: Calculator, count: project.calculations.length },
    { key: 'snapshots', label: 'Snapshots', icon: Camera, count: project.calculationSnapshots.length },
    { key: 'validation', label: 'Validation Lab', icon: CheckCircle, count: project.measurements.length + project.validationMilestones.length },
    { key: 'issues', label: 'Issues & Risks', icon: AlertTriangle, count: openIssuesCount, highlight: openIssuesCount > 0 },
    { key: 'decisions', label: 'Decisions', icon: Award, count: project.decisions.length },
    { key: 'traceability', label: 'Traceability', icon: GitMerge, count: project.traceabilityLinks.length },
    { key: 'reports', label: 'Reports', icon: FileSpreadsheet, count: project.reports.length },
  ];

  const handleSelect = (key: WorkspaceSectionKey) => {
    onSelectSection(key);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800/80 w-64 select-none">
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Workbench Navigator
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5" aria-label="Workbench sections">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleSelect(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                isActive
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                    item.highlight
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/60 font-bold'
                      : isActive
                      ? 'bg-cyan-900 text-cyan-200'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] font-mono text-slate-500 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span>Schema:</span>
          <span className="text-slate-400 font-semibold">{project.schemaVersion}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Domain:</span>
          <span className="text-slate-400">{project.metadata.domain}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:block shrink-0">{content}</aside>

      {/* Mobile drawer with backdrop */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
