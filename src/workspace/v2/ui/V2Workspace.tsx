import React, { useState, useEffect, useCallback } from 'react';
import { ElectroKitProjectV2 } from '../types/project';
import { WorkspaceSectionKey } from '../search/global-search';
import {
  getAllV2Projects,
  getActiveV2Project,
  saveV2Project,
  setV2ActiveProjectId,
  createAndSaveDefaultV2Project,
  duplicateV2Project,
  deleteV2Project,
} from '../storage/v2-storage';
import { exportV2ProjectToJson, importV2ProjectFromJson } from '../project/serializer';
import { computeProjectStateDigest } from '../integrity/hasher';
import { EntityIds } from '../identity/id-generator';

import { ProjectHeader, SaveStatus } from './ProjectHeader';
import { ContextBar } from './ContextBar';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { GlobalSearchModal } from './GlobalSearchModal';
import { SaveConfirmationDialog } from './SaveConfirmationDialog';

// Section Views
import { OverviewView } from './sections/OverviewView';
import { RequirementsView } from './sections/RequirementsView';
import { ConstraintsView } from './sections/ConstraintsView';
import { AssumptionsView } from './sections/AssumptionsView';
import { SystemsView } from './sections/SystemsView';
import { ComponentsView } from './sections/ComponentsView';
import { PcbView } from './sections/PcbView';
import { CasesView } from './sections/CasesView';
import { ScenariosView } from './sections/ScenariosView';
import { CalculationsView } from './sections/CalculationsView';
import { SnapshotsView } from './sections/SnapshotsView';
import { ValidationView } from './sections/ValidationView';
import { IssuesView } from './sections/IssuesView';
import { DecisionsView } from './sections/DecisionsView';
import { TraceabilityView } from './sections/TraceabilityView';
import { ReportsView } from './sections/ReportsView';

import { Menu, Plus, Upload, Folder, X, Check, GitCommit } from 'lucide-react';

export const V2Workspace: React.FC = () => {
  const [project, setProject] = useState<ElectroKitProjectV2>(getActiveV2Project());
  const [allProjects, setAllProjects] = useState<ElectroKitProjectV2[]>(getAllV2Projects());
  const [activeSection, setActiveSection] = useState<WorkspaceSectionKey>('overview');

  const [activeCaseId, setActiveCaseId] = useState<string>(
    project.activeCaseId || project.designCases[0]?.id || ''
  );
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    project.designCases.find(c => c.id === (project.activeCaseId || project.designCases[0]?.id))?.scenarios[0]?.id || ''
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('SAVED');
  const [lastSavedAt, setLastSavedAt] = useState<string>(new Date().toISOString());

  // Navigation & Modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedSnapshotIdForInspector, setSelectedSnapshotIdForInspector] = useState<string | undefined>();

  // Revision Form State
  const [revisionSummary, setRevisionSummary] = useState('');
  const [revisionAuthor, setRevisionAuthor] = useState('');

  // Keep state in sync with active project
  useEffect(() => {
    const current = getActiveV2Project();
    setProject(current);
    setAllProjects(getAllV2Projects());
    const caseId = current.activeCaseId || current.designCases[0]?.id || '';
    setActiveCaseId(caseId);
    const activeCase = current.designCases.find(c => c.id === caseId) || current.designCases[0];
    setActiveScenarioId(activeCase?.scenarios[0]?.id || '');
  }, []);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K for search, Cmd+S / Ctrl+S for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project]);

  // Update project helper with save status tracking
  const updateProjectState = useCallback((updated: ElectroKitProjectV2) => {
    setProject(updated);
    setSaveStatus('CHANGES_PENDING');
  }, []);

  // Save project to storage
  const handleSave = () => {
    setSaveStatus('SAVING');
    try {
      saveV2Project(project);
      setAllProjects(getAllV2Projects());
      setSaveStatus('SAVED');
      setLastSavedAt(new Date().toISOString());
    } catch {
      setSaveStatus('ERROR');
    }
  };

  // Duplicate Project
  const handleDuplicate = () => {
    const copy = duplicateV2Project(project.metadata.id);
    if (copy) {
      setProject(copy);
      setAllProjects(getAllV2Projects());
      setActiveCaseId(copy.activeCaseId || copy.designCases[0]?.id || '');
      setSaveStatus('SAVED');
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = exportV2ProjectToJson(project);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.name.replace(/\s+/g, '_')}_v2.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = importV2ProjectFromJson(content);
      if (res.success && res.project) {
        saveV2Project(res.project);
        setV2ActiveProjectId(res.project.metadata.id);
        setProject(res.project);
        setAllProjects(getAllV2Projects());
        setActiveCaseId(res.project.activeCaseId || res.project.designCases[0]?.id || '');
        setSaveStatus('SAVED');
        setShowProjectModal(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Switch active project
  const handleSwitchProject = (id: string) => {
    setV2ActiveProjectId(id);
    const target = getAllV2Projects().find(p => p.metadata.id === id);
    if (target) {
      setProject(target);
      setActiveCaseId(target.activeCaseId || target.designCases[0]?.id || '');
      const activeCase = target.designCases.find(c => c.id === target.activeCaseId) || target.designCases[0];
      setActiveScenarioId(activeCase?.scenarios[0]?.id || '');
      setSaveStatus('SAVED');
      setShowProjectModal(false);
    }
  };

  // Create Project from Template
  const handleCreateNewProject = (template: 'dcdc-buck-converter' | 'iot-wireless-sensor' | 'blank') => {
    const newProj = createAndSaveDefaultV2Project(template);
    setProject(newProj);
    setAllProjects(getAllV2Projects());
    setActiveCaseId(newProj.activeCaseId || newProj.designCases[0]?.id || '');
    const activeCase = newProj.designCases[0];
    setActiveScenarioId(activeCase?.scenarios[0]?.id || '');
    setSaveStatus('SAVED');
    setShowProjectModal(false);
  };

  // Revision Modal trigger
  const handleOpenRevisionModal = () => {
    setRevisionSummary('Architecture snapshot and margin verification');
    setRevisionAuthor(project.metadata.author || 'Lead Hardware Engineer');
    setShowRevisionModal(true);
  };

  // Confirm revision creation
  const handleConfirmRevision = () => {
    if (!revisionSummary.trim()) return;
    const now = new Date().toISOString();
    const digest = computeProjectStateDigest(project);
    const nextRevNum = project.revisions.length + 1;

    const newRev = {
      id: EntityIds.revision(),
      revisionNumber: nextRevNum,
      tag: `Rev ${nextRevNum}.0`,
      timestamp: now,
      author: revisionAuthor || project.metadata.author || 'Hardware Engineer',
      summary: revisionSummary.trim(),
      changes: [],
      snapshotDigest: digest,
      signoffStatus: 'approved' as const,
    };

    const updated: ElectroKitProjectV2 = {
      ...project,
      revisions: [...project.revisions, newRev],
    };
    updateProjectState(updated);
    saveV2Project(updated);
    setSaveStatus('SAVED');
    setShowRevisionModal(false);
  };

  return (
    <div className="flex-1 min-h-0 h-full bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Persistent Top Project Header */}
      <ProjectHeader
        project={project}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onSave={handleSave}
        onDuplicate={handleDuplicate}
        onExport={handleExportJson}
        onNewRevision={handleOpenRevisionModal}
        onOpenProjectList={() => setShowProjectModal(true)}
        onNewProject={() => setShowProjectModal(true)}
      />

      {/* 2. Compact Context Strip */}
      <div className="flex items-center">
        {/* Mobile menu trigger button */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden px-3 py-2 bg-slate-950/80 border-b border-r border-slate-800 text-slate-300 hover:text-white"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <ContextBar
            project={project}
            activeCaseId={activeCaseId}
            activeScenarioId={activeScenarioId}
            onSelectCase={cId => {
              setActiveCaseId(cId);
              const targetCase = project.designCases.find(c => c.id === cId);
              setActiveScenarioId(targetCase?.scenarios[0]?.id || '');
              const updated = { ...project, activeCaseId: cId };
              updateProjectState(updated);
            }}
            onSelectScenario={sId => setActiveScenarioId(sId)}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        </div>
      </div>

      {/* 3. Main Workspace Shell: Sidebar + Active Section Canvas */}
      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar
          project={project}
          activeSection={activeSection}
          onSelectSection={s => setActiveSection(s)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Active Section Surface */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {activeSection === 'overview' && (
              <OverviewView
                project={project}
                onNavigate={section => setActiveSection(section)}
              />
            )}

            {activeSection === 'requirements' && (
              <RequirementsView
                project={project}
                onUpdateRequirements={requirements => {
                  updateProjectState({ ...project, requirements });
                }}
                onNavigateToCalculation={calcId => {
                  setActiveSection('calculations');
                }}
              />
            )}

            {activeSection === 'constraints' && (
              <ConstraintsView
                project={project}
                onUpdateConstraints={constraints => {
                  updateProjectState({ ...project, constraints });
                }}
              />
            )}

            {activeSection === 'assumptions' && (
              <AssumptionsView
                project={project}
                onUpdateAssumptions={assumptions => {
                  updateProjectState({ ...project, assumptions });
                }}
              />
            )}

            {activeSection === 'systems' && (
              <SystemsView
                project={project}
                onUpdateSystems={systems => {
                  updateProjectState({ ...project, systems });
                }}
                onUpdatePowerRails={powerRails => {
                  updateProjectState({ ...project, powerRails });
                }}
              />
            )}

            {activeSection === 'components' && (
              <ComponentsView
                project={project}
                onUpdateComponents={components => {
                  updateProjectState({ ...project, components });
                }}
                onUpdateProject={updatedProject => {
                  updateProjectState(updatedProject);
                }}
              />
            )}

            {activeSection === 'pcb' && (
              <PcbView
                project={project}
                onUpdateProject={updatedProject => {
                  updateProjectState(updatedProject);
                }}
              />
            )}

            {activeSection === 'cases' && (
              <CasesView
                project={project}
                activeCaseId={activeCaseId}
                onSelectCase={cId => {
                  setActiveCaseId(cId);
                  const updated = { ...project, activeCaseId: cId };
                  updateProjectState(updated);
                }}
                onUpdateCases={(designCases, newActiveId) => {
                  const updated: ElectroKitProjectV2 = {
                    ...project,
                    designCases,
                    activeCaseId: newActiveId || activeCaseId,
                  };
                  updateProjectState(updated);
                  if (newActiveId) setActiveCaseId(newActiveId);
                }}
              />
            )}

            {activeSection === 'scenarios' && (
              <ScenariosView
                project={project}
                activeCaseId={activeCaseId}
                activeScenarioId={activeScenarioId}
                onSelectScenario={sId => setActiveScenarioId(sId)}
                onUpdateScenarios={(scenarios, caseId) => {
                  const updatedCases = project.designCases.map(c =>
                    c.id === caseId ? { ...c, scenarios } : c
                  );
                  updateProjectState({ ...project, designCases: updatedCases });
                }}
              />
            )}

            {activeSection === 'calculations' && (
              <CalculationsView
                project={project}
                activeCaseId={activeCaseId}
                activeScenarioId={activeScenarioId}
                onUpdateProject={updated => updateProjectState(updated)}
                onNavigateToSnapshot={snapId => {
                  setSelectedSnapshotIdForInspector(snapId);
                  setActiveSection('snapshots');
                }}
              />
            )}

            {activeSection === 'snapshots' && (
              <SnapshotsView
                project={project}
                selectedSnapshotId={selectedSnapshotIdForInspector}
                onSelectSnapshot={id => setSelectedSnapshotIdForInspector(id)}
              />
            )}

            {activeSection === 'validation' && (
              <ValidationView
                project={project}
                onUpdateMeasurements={measurements => {
                  updateProjectState({ ...project, measurements });
                }}
                onUpdateMilestones={validationMilestones => {
                  updateProjectState({ ...project, validationMilestones });
                }}
              />
            )}

            {activeSection === 'issues' && (
              <IssuesView
                project={project}
                onUpdateIssues={issues => {
                  updateProjectState({ ...project, issues });
                }}
              />
            )}

            {activeSection === 'decisions' && (
              <DecisionsView
                project={project}
                onUpdateDecisions={decisions => {
                  updateProjectState({ ...project, decisions });
                }}
                onNavigateToSnapshot={snapId => {
                  setSelectedSnapshotIdForInspector(snapId);
                  setActiveSection('snapshots');
                }}
              />
            )}

            {activeSection === 'traceability' && (
              <TraceabilityView project={project} />
            )}

            {activeSection === 'reports' && (
              <ReportsView project={project} />
            )}
          </div>
        </main>
      </div>

      {/* 4. Global Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        project={project}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(section, entityId) => {
          setActiveSection(section);
          if (section === 'snapshots' && entityId) {
            setSelectedSnapshotIdForInspector(entityId);
          }
        }}
      />

      {/* 5. Project Switcher & Template Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowProjectModal(false)}
          />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Folder className="w-4 h-4 text-cyan-400" />
                Workspace Projects Manager
              </h3>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Projects List */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Saved Projects ({allProjects.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {allProjects.map(p => {
                  const isActive = p.metadata.id === project.metadata.id;
                  return (
                    <div
                      key={p.metadata.id}
                      onClick={() => handleSwitchProject(p.metadata.id)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-cyan-950/60 border-cyan-600 text-slate-100'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{p.metadata.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {p.metadata.domain} • Schema {p.schemaVersion}
                        </div>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create From Template Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                Initialize New Project from Template
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCreateNewProject('dcdc-buck-converter')}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-700 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-200">GaN Buck Converter</div>
                  <div className="text-[10px] text-slate-400">Power supply with thermal network</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateNewProject('blank')}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-700 text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-200">Blank Project</div>
                  <div className="text-[10px] text-slate-400">Clean architecture canvas</div>
                </button>
              </div>
            </div>

            {/* Import JSON button */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import Project JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowRevisionModal(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-indigo-400" />
                Create Project Revision Snapshot
              </h3>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Author Name</label>
                <input
                  type="text"
                  value={revisionAuthor}
                  onChange={e => setRevisionAuthor(e.target.value)}
                  placeholder="Hardware Engineer"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Revision Summary *</label>
                <textarea
                  rows={3}
                  value={revisionSummary}
                  onChange={e => setRevisionSummary(e.target.value)}
                  placeholder="Document modifications, verified margins, and reason for revision..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <span className="font-mono text-cyan-400 font-bold block mb-1">Immutable Digest Guarantee:</span>
                Creates an immutable state hash for Rev {project.revisions.length + 1}.0 capturing all requirements, calculations, and components.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevision}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Seal Revision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
