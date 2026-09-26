import React, { useState } from 'react';
import { ElectroKitProject } from '../types';
import {
  generateMarkdownReport,
  generateReportSummary,
  generateHtmlPrintableReport,
} from '../report-generator';
import { exportProjectToJson } from '../storage';
import {
  FileText,
  Copy,
  Check,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface ReportTabProps {
  project: ElectroKitProject;
}

export const ReportTab: React.FC<ReportTabProps> = ({ project }) => {
  const [copied, setCopied] = useState(false);
  const stats = generateReportSummary(project);
  const markdownContent = generateMarkdownReport(project);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const html = generateHtmlPrintableReport(project);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-engineering-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const json = exportProjectToJson(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-electrokit-project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Report Header & Action Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-slate-100">
                System Engineering Design Review Report
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  stats.readinessVerdict === 'PASS_SATISFIED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : stats.readinessVerdict === 'MARGINAL_HEADROOM'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {stats.readinessVerdict.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Deterministic synthesis of requirements, calculation margins, assumptions, and hardware validation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold transition-all cursor-pointer shadow-sm shadow-cyan-950"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Executive Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Requirements</span>
            <span className="text-slate-200 font-bold">{stats.totalRequirements} Specified</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Margins Satisfied</span>
            <span
              className={`font-bold ${
                stats.violatedMargins === 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.satisfiedMargins} / {stats.satisfiedMargins + stats.violatedMargins} Pass
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Snapshots Evaluated</span>
            <span className="text-cyan-400 font-bold">{stats.totalSnapshots} Calculations</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Hardware Validation</span>
            <span className="text-teal-400 font-bold">{stats.validationPercent}% Verified</span>
          </div>
        </div>
      </div>

      {/* Live Markdown Render Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="prose prose-invert max-w-none text-xs font-mono leading-relaxed space-y-4">
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap selection:bg-cyan-500/30">
            {markdownContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
