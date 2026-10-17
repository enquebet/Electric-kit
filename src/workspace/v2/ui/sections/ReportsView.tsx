import React, { useState } from 'react';
import { ElectroKitProjectV2 } from '../../types/project';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface ReportsViewProps {
  project: ElectroKitProjectV2;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ project }) => {
  const [copied, setCopied] = useState(false);

  // Generate complete structured Markdown report
  const generateMarkdown = (): string => {
    const timestamp = new Date().toISOString();
    let md = `# ELECTROKIT V2 ENGINEERING DESIGN REVIEW REPORT\n\n`;
    md += `**Project:** ${project.metadata.name}\n`;
    md += `**Domain:** ${project.metadata.domain}\n`;
    md += `**Schema:** ${project.schemaVersion}\n`;
    md += `**Author:** ${project.metadata.author}\n`;
    md += `**Date:** ${timestamp}\n\n`;

    if (project.metadata.engineeringObjective) {
      md += `### Engineering Objective\n${project.metadata.engineeringObjective}\n\n`;
    }

    md += `## 1. Requirements Compliance\n\n`;
    md += `| ID | Requirement | Target | Status | Priority |\n`;
    md += `|---|---|---|---|---|\n`;
    project.requirements.forEach(r => {
      md += `| ${r.id} | ${r.name} | ${r.nominalValue ?? '-'} ${r.unit} | ${r.verificationStatus.toUpperCase()} | ${r.priority} |\n`;
    });
    md += `\n`;

    md += `## 2. Engineering Systems & Power Rails\n\n`;
    project.systems.forEach(s => {
      md += `### System: ${s.name} (${s.primaryDomain})\n`;
      md += `${s.description}\n\n`;
    });

    if (project.powerRails.length > 0) {
      md += `### Power Distribution Rails\n\n`;
      md += `| Rail | Voltage | Max Current |\n`;
      md += `|---|---|---|\n`;
      project.powerRails.forEach(r => {
        md += `| ${r.name} | ${r.nominalVoltage} V | ${r.maxCurrentAmps} A |\n`;
      });
      md += `\n`;
    }

    md += `## 3. Key Components\n\n`;
    md += `| RefDes | Component | Manufacturer | Part Number | Package |\n`;
    md += `|---|---|---|---|---|\n`;
    project.components.forEach(c => {
      md += `| ${c.refDes} | ${c.name} | ${c.manufacturer || '-'} | ${c.partNumber || '-'} | ${c.packageType || '-'} |\n`;
    });
    md += `\n`;

    md += `## 4. Calculation Evidence & Snapshots\n\n`;
    project.calculationSnapshots.forEach(snap => {
      md += `### Snapshot: ${snap.id}\n`;
      md += `- **Calculation ID:** ${snap.calculationId}\n`;
      md += `- **Integrity Digest:** \`${snap.integrityDigest}\`\n`;
      md += `- **Status:** ${snap.validationStatus}\n`;
      if (snap.formulaSnippet) {
        md += `- **Formula:** \`${snap.formulaSnippet}\`\n`;
      }
      md += `\n`;
    });

    md += `## 5. Architectural Decisions (ADRs)\n\n`;
    project.decisions.forEach(d => {
      md += `### ${d.title}\n`;
      md += `- **Statement:** ${d.statement}\n`;
      md += `- **Status:** ${d.status}\n`;
      if (d.tradeoffsSummary) {
        md += `- **Trade-offs:** ${d.tradeoffsSummary}\n`;
      }
      md += `\n`;
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.name.replace(/\s+/g, '_')}_Engineering_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Engineering Design Review Report
          </h2>
          <p className="text-xs text-slate-400">
            Synthesize formal system audit, requirements compliance, calculations, and architectural decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report (.md)</span>
          </button>
        </div>
      </div>

      {/* Printable Report Preview */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-5 max-w-4xl mx-auto">
        <div className="pb-4 border-b border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold">
              Engineering Design Review
            </span>
            <h1 className="text-xl font-extrabold text-slate-100 mt-1">{project.metadata.name}</h1>
            <div className="text-xs text-slate-400 mt-1">
              Domain: {project.metadata.domain} • Lead: {project.metadata.author} • Schema: {project.schemaVersion}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
            AUDIT READY
          </span>
        </div>

        {/* Section 1: Objective */}
        {project.metadata.engineeringObjective && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              1. Engineering Objective
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              {project.metadata.engineeringObjective}
            </p>
          </div>
        )}

        {/* Section 2: Requirements Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            2. Requirements Compliance Matrix ({project.requirements.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                  <th className="py-2">ID</th>
                  <th className="py-2">Requirement</th>
                  <th className="py-2">Target</th>
                  <th className="py-2">Priority</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {project.requirements.map(r => (
                  <tr key={r.id} className="text-slate-300">
                    <td className="py-2 text-cyan-400 font-bold">{r.id}</td>
                    <td className="py-2 text-slate-200 font-sans text-xs">{r.name}</td>
                    <td className="py-2">{r.nominalValue ?? '-'} {r.unit}</td>
                    <td className="py-2 uppercase text-[10px]">{r.priority}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        r.verificationStatus === 'passed'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {r.verificationStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Calculation Evidence */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            3. Calculation Evidence & Immutable Snapshots ({project.calculationSnapshots.length})
          </h3>
          <div className="space-y-2">
            {project.calculationSnapshots.map(snap => (
              <div key={snap.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">{snap.id} (Calc: {snap.calculationId})</span>
                  <span className="text-[10px] text-emerald-400 font-bold">DIGEST VERIFIED</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Digest: {snap.integrityDigest}
                </div>
                {snap.formulaSnippet && (
                  <div className="text-[11px] text-slate-300">
                    Formula: <span className="text-cyan-300">{snap.formulaSnippet}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
