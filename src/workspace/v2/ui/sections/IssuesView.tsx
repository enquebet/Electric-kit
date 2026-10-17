import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import {
  EngineeringIssueV2,
  IssueSeverity,
  IssueStatus,
} from '../../types/governance';
import { EntityIds } from '../../identity/id-generator';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  Filter,
} from 'lucide-react';

interface IssuesViewProps {
  project: ElectroKitProjectV2;
  onUpdateIssues: (issues: EngineeringIssueV2[]) => void;
}

export const IssuesView: React.FC<IssuesViewProps> = ({
  project,
  onUpdateIssues,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('critical');
  const [category, setCategory] = useState<'electrical' | 'thermal' | 'power' | 'battery' | 'emc'>('power');

  const openCreateModal = () => {
    setTitle('');
    setDescription('');
    setSeverity('critical');
    setCategory('power');
    setIsModalOpen(true);
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();

    const newIssue: EngineeringIssueV2 = {
      id: EntityIds.issue(),
      title: title.trim(),
      description: description.trim(),
      severity,
      category,
      status: 'open',
      discoveredAt: now,
      discoveredBy: project.metadata.author || 'Lead Hardware Engineer',
      impactedEntityIds: [],
    };

    onUpdateIssues([newIssue, ...project.issues]);
    setIsModalOpen(false);
  };

  const handleStatusChange = (id: string, newStatus: IssueStatus) => {
    const updated = project.issues.map(i =>
      i.id === id
        ? {
            ...i,
            status: newStatus,
            resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : undefined,
          }
        : i
    );
    onUpdateIssues(updated);
  };

  const handleDelete = (id: string) => {
    onUpdateIssues(project.issues.filter(i => i.id !== id));
  };

  const filteredIssues = project.issues.filter(i => {
    const matchesSeverity = selectedSeverity === 'all' || i.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || i.status === selectedStatus;
    return matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (s: IssueSeverity) => {
    switch (s) {
      case 'blocker':
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/60 uppercase">{s}</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/60 uppercase">{s}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 uppercase">{s}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Engineering Issues & Risk Register
          </h2>
          <p className="text-xs text-slate-400">
            Track hardware defects, margin violations, layout risks, and thermal bottlenecks.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Engineering Issue</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={selectedSeverity}
          onChange={e => setSelectedSeverity(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-600"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical / Blocker</option>
          <option value="moderate">Moderate</option>
          <option value="minor">Minor</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-600"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="mitigated">Mitigated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Issues List */}
      <div className="space-y-2.5">
        {filteredIssues.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No issues matching the filter criteria. Zero blockers detected.
          </div>
        ) : (
          filteredIssues.map(issue => (
            <div
              key={issue.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/40">
                    {issue.id}
                  </span>
                  {getSeverityBadge(issue.severity)}
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 uppercase">
                    {issue.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{issue.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{issue.description}</p>

                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Discovered {new Date(issue.discoveredAt).toLocaleDateString()} by {issue.discoveredBy}
                </div>
              </div>

              {/* Status Switcher & Delete */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <select
                  value={issue.status}
                  onChange={e => handleStatusChange(issue.id, e.target.value as IssueStatus)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="mitigated">Mitigated</option>
                  <option value="resolved">Resolved</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleDelete(issue.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  title="Delete issue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Log Engineering Issue</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Switch-node ringing exceeds 22Vpk"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as IssueSeverity)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="critical">Critical</option>
                    <option value="blocker">Blocker</option>
                    <option value="moderate">Moderate</option>
                    <option value="minor">Minor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <option value="power">Power</option>
                    <option value="thermal">Thermal</option>
                    <option value="electrical">Electrical</option>
                    <option value="battery">Battery</option>
                    <option value="emc">EMC / Noise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description & Root Cause</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe failure mechanism and observed behavior..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Log Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
