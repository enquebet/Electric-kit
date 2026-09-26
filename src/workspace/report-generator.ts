/**
 * ElectroKit — Phase 13 Engineering Workspace
 * Comprehensive System Engineering Report Generator
 */

import { ElectroKitProject } from './types';
import { getValidationProgress } from './validation-tracker';

export interface ReportSummaryStats {
  totalRequirements: number;
  satisfiedMargins: number;
  violatedMargins: number;
  totalSnapshots: number;
  openWarnings: number;
  validationPercent: number;
  readinessVerdict: 'PASS_SATISFIED' | 'MARGINAL_HEADROOM' | 'NEEDS_REVISION';
}

export function generateReportSummary(
  project: ElectroKitProject,
  caseId?: string
): ReportSummaryStats {
  const targetCase =
    project.designCases.find((c) => c.id === (caseId || project.activeCaseId)) ||
    project.designCases[0];

  let satisfied = 0;
  let violated = 0;
  let warnings = 0;
  let snapshots = 0;

  if (targetCase) {
    snapshots = (targetCase.calculationSnapshots || []).length;
    for (const snap of targetCase.calculationSnapshots || []) {
      for (const m of snap.margins || []) {
        if (m.isSatisfied) satisfied++;
        else violated++;
      }
      warnings += (snap.warnings || []).length;
    }
  }

  const valProg = getValidationProgress(project);

  let verdict: 'PASS_SATISFIED' | 'MARGINAL_HEADROOM' | 'NEEDS_REVISION' = 'PASS_SATISFIED';
  if (violated > 0) {
    verdict = 'NEEDS_REVISION';
  } else if (warnings > 3 || satisfied === 0) {
    verdict = 'MARGINAL_HEADROOM';
  }

  return {
    totalRequirements: (project.requirements || []).length,
    satisfiedMargins: satisfied,
    violatedMargins: violated,
    totalSnapshots: snapshots,
    openWarnings: warnings,
    validationPercent: valProg.percentComplete,
    readinessVerdict: verdict,
  };
}

export function generateMarkdownReport(
  project: ElectroKitProject,
  caseId?: string
): string {
  const targetCase =
    project.designCases.find((c) => c.id === (caseId || project.activeCaseId)) ||
    project.designCases[0];

  const stats = generateReportSummary(project, caseId);
  const now = new Date().toISOString().split('T')[0];

  let md = '';
  md += `# Engineering Design Review & Synthesis Report\n\n`;
  md += `> **Engineering Review Classification:** Modeled design-review status only.\n`;
  md += `> This report reflects deterministic mathematical evaluations based on specified inputs and engineering assumptions.\n`;
  md += `> It does NOT constitute regulatory certification, safety compliance, or hardware production approval.\n\n`;
  md += `**Project Name:** ${project.metadata.name}\n`;
  md += `**Project Type:** ${project.metadata.projectType} | **Domain:** ${project.metadata.domain}\n`;
  md += `**Author / Lead:** ${project.metadata.author} | **Date:** ${now}\n`;
  md += `**Status:** ${project.metadata.status} | **Modeled Verdict:** ${stats.readinessVerdict}\n\n`;

  if (project.metadata.engineeringObjective) {
    md += `### Engineering Objective\n${project.metadata.engineeringObjective}\n\n`;
  }
  if (project.metadata.designTarget) {
    md += `### Design Targets\n${project.metadata.designTarget}\n\n`;
  }

  md += `## 1. Executive Summary\n\n`;
  md += `- **Active Design Case:** ${targetCase?.name || 'N/A'}\n`;
  md += `- **Requirements Specified:** ${stats.totalRequirements}\n`;
  md += `- **Calculation Snapshots Evaluated:** ${stats.totalSnapshots}\n`;
  md += `- **Engineering Margins Satisfied:** ${stats.satisfiedMargins} / ${stats.satisfiedMargins + stats.violatedMargins}\n`;
  md += `- **Active Warnings / Cautions:** ${stats.openWarnings}\n`;
  md += `- **Hardware Validation Progress:** ${stats.validationPercent}%\n\n`;

  md += `## 2. Requirements Compliance Matrix\n\n`;
  if ((project.requirements || []).length === 0) {
    md += `*No formal requirements registered.*\n\n`;
  } else {
    md += `| ID | Name | Category | Nominal | Min | Max | Unit | Description |\n`;
    md += `|:---|:-----|:---------|:--------|:----|:----|:-----|:------------|\n`;
    for (const r of project.requirements) {
      md += `| ${r.id} | ${r.name} | ${r.category} | ${r.nominalValue} | ${r.minValue ?? '-'} | ${r.maxValue ?? '-'} | ${r.unit} | ${r.description || '-'} |\n`;
    }
    md += `\n`;
  }

  md += `## 3. Engineering Margins Audit\n\n`;
  const allMargins = (targetCase?.calculationSnapshots || []).flatMap((s) => s.margins || []);
  if (allMargins.length === 0) {
    md += `*No margins recorded in active case snapshots.*\n\n`;
  } else {
    md += `| Parameter | Required | Calculated | Margin Absolute | Unit | Status | Satisfied? |\n`;
    md += `|:----------|:---------|:-----------|:----------------|:-----|:-------|:-----------|\n`;
    for (const m of allMargins) {
      md += `| ${m.parameter} | ${m.requiredValue} | ${m.availableOrCalculatedValue} | ${m.marginAbsolute > 0 ? '+' : ''}${m.marginAbsolute.toFixed(3)} | ${m.unit} | ${m.statusText} | ${m.isSatisfied ? 'PASS' : 'FAIL'} |\n`;
    }
    md += `\n`;
  }

  md += `## 4. Calculation Snapshots Detail\n\n`;
  if (!targetCase || (targetCase.calculationSnapshots || []).length === 0) {
    md += `*No calculation snapshots pinned to this case.*\n\n`;
  } else {
    for (const snap of targetCase.calculationSnapshots) {
      md += `### ${snap.name} (${snap.category.toUpperCase()})\n`;
      md += `- **Tool / Engine:** \`${snap.toolSlug}\` (\`${snap.engineId}\`)\n`;
      md += `- **Timestamp:** ${snap.timestamp}\n`;
      md += `- **Validation Status:** ${snap.validationStatus}\n\n`;

      md += `**Key Inputs:**\n\`\`\`json\n${JSON.stringify(snap.inputs, null, 2)}\n\`\`\`\n\n`;
      md += `**Deterministic Outputs:**\n\`\`\`json\n${JSON.stringify(snap.outputs, null, 2)}\n\`\`\`\n\n`;
    }
  }

  md += `## 5. Engineering Assumptions Register\n\n`;
  const assumptions = [
    ...(project.assumptions || []),
    ...(targetCase?.calculationSnapshots || []).flatMap((s) => s.assumptions || []),
  ];
  if (assumptions.length === 0) {
    md += `*No assumptions recorded.*\n\n`;
  } else {
    md += `| Parameter | Classification | Description | Applicable Workflow |\n`;
    md += `|:----------|:---------------|:------------|:--------------------|\n`;
    for (const a of assumptions) {
      md += `| ${a.parameter} | ${a.classification} | ${a.description} | ${a.applicableWorkflow} |\n`;
    }
    md += `\n`;
  }

  md += `## 6. Hardware Validation & Lab Measurements\n\n`;
  if ((project.measurements || []).length === 0) {
    md += `*No lab measurements logged yet.*\n\n`;
  } else {
    md += `| Test Point | Parameter | Measured Value | Unit | Instrument | Method |\n`;
    md += `|:-----------|:----------|:---------------|:-----|:-----------|:-------|\n`;
    for (const m of project.measurements) {
      md += `| ${m.testPoint} | ${m.parameter} | ${m.measuredValue} | ${m.unit} | ${m.instrument || '-'} | ${m.measurementMethod} |\n`;
    }
    md += `\n`;
  }

  md += `## 7. Revision History\n\n`;
  if ((project.revisions || []).length === 0) {
    md += `*Rev 1: Initial creation.*\n\n`;
  } else {
    for (const rev of project.revisions) {
      md += `- **Rev ${rev.revisionNumber}** (${rev.timestamp.split('T')[0]}) by ${rev.author}: ${rev.summary}\n`;
    }
    md += `\n`;
  }

  md += `---\n*Generated deterministically by ElectroKit Phase 13 Engineering Workspace.*\n`;
  return md;
}

export function generateHtmlPrintableReport(
  project: ElectroKitProject,
  caseId?: string
): string {
  const md = generateMarkdownReport(project, caseId);
  // Basic styled HTML container for print
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${project.metadata.name} — Engineering Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #0f172a; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
    h2 { color: #0369a1; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 32px; }
    h3 { color: #0f172a; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; color: #334155; }
    tr:nth-child(even) { background: #f1f5f9; }
    code, pre { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; background: #f8fafc; }
    pre { padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; overflow-x: auto; }
    @media print { body { margin: 0; max-width: 100%; } pre { white-space: pre-wrap; } }
  </style>
</head>
<body>
  <div style="font-size: 14px; white-space: pre-wrap;">${md.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body>
</html>`;
}
