import React, { useState, useEffect } from 'react';
import { ElectroKitProject, ProjectStatus, CalculationSnapshot } from './types';
import {
  getAllProjects,
  getActiveProject,
  saveProject,
  setActiveProjectId,
  createDefaultProject,
  exportProjectToJson,
  importProjectFromJson,
} from './storage';
import { createProjectRevision } from './case-manager';
import { SpecsTab } from './components/SpecsTab';
import { CasesTab } from './components/CasesTab';
import { SnapshotsTab } from './components/SnapshotsTab';
import { ValidationTab } from './components/ValidationTab';
import { ReportTab } from './components/ReportTab';
import { AiTab } from './components/AiTab';
import {
  Briefcase,
  Layers,
  GitBranch,
  ClipboardCheck,
  FileText,
  Sparkles,
  Plus,
  Download,
  Upload,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  BookmarkPlus,
} from 'lucide-react';

export const WorkspaceView: React.FC = () => {
  const [project, setProject] = useState<ElectroKitProject>(getActiveProject());
  const [allProjects, setAllProjects] = useState<ElectroKitProject[]>(getAllProjects());
  const [activeTab, setActiveTab] = useState<'specs' | 'cases' | 'snapshots' | 'validation' | 'report' | 'ai'>('specs');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionSummary, setRevisionSummary] = useState('');
  const [revisionAuthor, setRevisionAuthor] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedSnapshotForAi, setSelectedSnapshotForAi] = useState<CalculationSnapshot | undefined>();

  useEffect(() => {
    const p = getActiveProject();
    setProject(p);
    setAllProjects(getAllProjects());
  }, []);

  const handleUpdateProject = (updated: ElectroKitProject) => {
    setProject(updated);
    saveProject(updated);
    setAllProjects(getAllProjects());
  };

  const handleSwitchProject = (id: string) => {
    setActiveProjectId(id);
    const p = getActiveProject();
    setProject(p);
  };

  const handleCreateNewProject = (template: 'dcdc-converter' | 'iot-node' | 'blank') => {
    const newProj = createDefaultProject(template);
    saveProject(newProj);
    setActiveProjectId(newProj.metadata.id);
    setProject(newProj);
    setAllProjects(getAllProjects());
    setShowProjectModal(false);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importProjectFromJson(content);
      if (res.success && res.project) {
        setProject(res.project);
        setAllProjects(getAllProjects());
        setImportError(null);
      } else {
        setImportError(res.error || 'Failed to import project JSON. Invalid structure.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOpenRevisionModal = () => {
    setRevisionSummary('Updated margins and design calculations');
    setRevisionAuthor(project.metadata.author || 'Lead Hardware Engineer');
    setShowRevisionModal(true);
  };

  const handleConfirmRevision = () => {
    if (!revisionSummary.trim()) return;
    const clone = JSON.parse(JSON.stringify(project)) as ElectroKitProject;
    createProjectRevision(clone, revisionSummary.trim(), revisionAuthor.trim() || clone.metadata.author);
    handleUpdateProject(clone);
    setShowRevisionModal(false);
  };

  const activeCase =
    project.designCases.find((c) => c.id === project.activeCaseId) || project.designCases[0];

  const totalSnapshots = (activeCase?.calculationSnapshots || []).length;
  const totalReqs = (project.requirements || []).length;
  const activeMargins = (activeCase?.calculationSnapshots || []).flatMap((s) => s.margins || []);
  const satisfiedMarginsCount = activeMargins.filter((m) => m.isSatisfied).length;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Import Error Banner */}
      {importError && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="font-bold">Project Import Error:</span>
            <span>{importError}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-100 text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Workspace Header Bar */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Project Identity & Selector */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-950/50 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-cyan-400" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <div className="relative inline-block">
                  <select
                    value={project.metadata.id}
                    onChange={(e) => handleSwitchProject(e.target.value)}
                    className="appearance-none bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 pr-8 text-sm font-bold text-slate-100 cursor-pointer focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    {allProjects.map((p) => (
                      <option key={p.metadata.id} value={p.metadata.id}>
                        {p.metadata.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                </div>

                <select
                  value={project.metadata.status}
                  onChange={(e) => {
                    const updated = {
                      ...project,
                      metadata: { ...project.metadata, status: e.target.value as ProjectStatus },
                    };
                    handleUpdateProject(updated);
                  }}
                  className="px-2 py-0.5 rounded-lg text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60"
                >
                  <option value="Draft">Draft</option>
                  <option value="Analysis">Analysis</option>
                  <option value="Review">Review</option>
                  <option value="Validation Required">Validation Required</option>
                  <option value="Complete">Complete</option>
                </select>

                <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {project.metadata.projectType}
                </span>

                <button
                  onClick={handleOpenRevisionModal}
                  className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Create Timestamped Revision Snapshot"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  <span>Rev {project.revisions?.length || 1}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 line-clamp-1">
                {project.metadata.description || 'Hardware engineering calculation & validation workspace.'}
              </p>
            </div>
          </div>

          {/* Project Management Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-all cursor-pointer shadow-sm shadow-cyan-950"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer border border-slate-700">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={() => {
                const json = exportProjectToJson(project);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${project.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Workspace Engineering Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Active Case:</span>
            <span className="font-bold text-slate-100">{activeCase?.name || 'Default'}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Requirements:</span>
            <span className="font-bold text-slate-100">{totalReqs} Specified</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>Snapshots:</span>
            <span className="font-bold text-slate-100">{totalSnapshots} Pinned</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Margins Health:</span>
            <span className="font-bold text-emerald-400">
              {activeMargins.length > 0
                ? `${satisfiedMarginsCount} / ${activeMargins.length} Compliant`
                : '100% OK'}
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80 text-xs">
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'specs'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Project &amp; Specs</span>
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cases'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Design Cases &amp; Scenarios</span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'snapshots'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Calculation Snapshots ({totalSnapshots})</span>
        </button>

        <button
          onClick={() => setActiveTab('validation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'validation'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Hardware &amp; Lab Validation</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'report'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Design Review &amp; Report</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ai'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500 shadow-md shadow-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Intelligence (BYO AI)</span>
        </button>
      </div>

      {/* Tab Content Rendering */}
      <div className="pt-2">
        {activeTab === 'specs' && <SpecsTab project={project} onUpdateProject={handleUpdateProject} />}
        {activeTab === 'cases' && <CasesTab project={project} onUpdateProject={handleUpdateProject} />}
        {activeTab === 'snapshots' && (
          <SnapshotsTab
            project={project}
            onUpdateProject={handleUpdateProject}
            onRunAiAction={(action, snap) => {
              setSelectedSnapshotForAi(snap);
              setActiveTab('ai');
            }}
          />
        )}
        {activeTab === 'validation' && (
          <ValidationTab project={project} onUpdateProject={handleUpdateProject} />
        )}
        {activeTab === 'report' && <ReportTab project={project} />}
        {activeTab === 'ai' && (
          <AiTab project={project} activeSnapshot={selectedSnapshotForAi} />
        )}
      </div>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              Create Engineering Project
            </h3>
            <p className="text-xs text-slate-400">
              Select an engineering template to seed requirements, target margins, and design cases:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => handleCreateNewProject('dcdc-converter')}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-semibold text-xs text-cyan-400 group-hover:text-cyan-300">
                  5V / 3A Synchronous DC-DC Converter &amp; PDN
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Includes buck converter power budget, thermal junction chain, and target PDN impedance.
                </div>
              </button>

              <button
                onClick={() => handleCreateNewProject('iot-node')}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-semibold text-xs text-emerald-400 group-hover:text-emerald-300">
                  IoT Wireless Sensor Node (Li-Ion Autonomy)
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  18650 cell sizing, deep sleep profiling, duty cycle analysis, and 1-year mission autonomy.
                </div>
              </button>

              <button
                onClick={() => handleCreateNewProject('blank')}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-left transition-all cursor-pointer group"
              >
                <div className="font-semibold text-xs text-slate-200">
                  Blank Project Architecture
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Clean canvas with empty requirements register and baseline case.
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowProjectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Snapshot Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookmarkPlus className="w-5 h-5 text-cyan-400" />
              Create Project Revision Snapshot
            </h3>
            <p className="text-xs text-slate-400">
              Create an immutable revision record documenting current engineering margins and design inputs.
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Author / Lead Engineer</label>
                <input
                  type="text"
                  value={revisionAuthor}
                  onChange={(e) => setRevisionAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Revision Change Summary</label>
                <textarea
                  rows={3}
                  value={revisionSummary}
                  onChange={(e) => setRevisionSummary(e.target.value)}
                  placeholder="e.g., Optimized inductor DCR and verified 55°C thermal margin"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs cursor-pointer"
              >
                Save Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
