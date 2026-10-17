import React from 'react';
import { ElectroKitProjectV2 } from '../types/project';
import {
  Save,
  Copy,
  Download,
  GitCommit,
  FolderOpen,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export type SaveStatus = 'SAVED' | 'CHANGES_PENDING' | 'SAVING' | 'ERROR';

interface ProjectHeaderProps {
  project: ElectroKitProjectV2;
  saveStatus: SaveStatus;
  lastSavedAt?: string;
  onSave: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onNewRevision: () => void;
  onOpenProjectList: () => void;
  onNewProject: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  saveStatus,
  lastSavedAt,
  onSave,
  onDuplicate,
  onExport,
  onNewRevision,
  onOpenProjectList,
  onNewProject,
}) => {
  const latestRevision = project.revisions[project.revisions.length - 1];
  const activeCase = project.designCases.find(c => c.id === project.activeCaseId) || project.designCases[0];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-3 sm:px-6 sm:py-3.5 sticky top-0 z-30 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Project Title & Context Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenProjectList}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer border border-slate-700"
            title="Switch project"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[160px] truncate">{project.metadata.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/40 uppercase">
            {project.metadata.domain.replace('_', ' ')}
          </span>

          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
            {latestRevision ? latestRevision.tag : 'Rev 0.1'}
          </span>

          {activeCase && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
              <span className="text-slate-400">Case:</span>
              <span className="font-bold">{activeCase.name}</span>
            </span>
          )}

          {/* Save Status Pill */}
          <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800">
            {saveStatus === 'SAVED' && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            )}
            {saveStatus === 'CHANGES_PENDING' && (
              <>
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="text-amber-300">Unsaved changes</span>
              </>
            )}
            {saveStatus === 'SAVING' && (
              <>
                <Clock className="w-3 h-3 text-cyan-400 animate-spin" />
                <span className="text-cyan-300">Saving...</span>
              </>
            )}
            {saveStatus === 'ERROR' && (
              <>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span className="text-rose-300">Save Error</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={onSave}
            disabled={saveStatus === 'SAVING'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer disabled:opacity-50"
            title="Save Project"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={onNewRevision}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Create Project Revision Snapshot"
          >
            <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Revision</span>
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Duplicate Project"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Export Sanitized Project JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Create New Project"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
