/**
 * ElectroKit V2 — Unified Test Runner & Verification Suite
 * Executes:
 * 1. Engineering Audit (V1 Master Baseline: 594 assertions)
 * 2. Forensic Audit Phase 13 (29 assertions)
 * 3. Release Hardening Audit (18 assertions)
 * 4. V2 Wave 01 Architecture & Data Model (122 assertions)
 * 5. V2 Wave 02 Deep Engineering Workspace (93 assertions)
 * 6. V2 Wave 03 Engineering Object Model (92 assertions)
 * 7. V2 Wave 04 System Power Architecture (38 assertions)
 * 8. V2 Wave 05 Deep PCB Workspace (84 assertions)
 * Total: 1070 assertions
 */

import { execSync } from 'child_process';

const suites = [
  { name: 'V1 Master Engineering Audit', file: 'tests/engineering-audit.ts' },
  { name: 'Phase 13 Forensic Audit', file: 'tests/forensic-audit-phase13.ts' },
  { name: 'Release Hardening Verification', file: 'tests/release-hardening-verification.ts' },
  { name: 'V2 Wave 01 Architecture Verification', file: 'tests/v2-wave01-architecture-verification.ts' },
  { name: 'V2 Wave 02 Workspace Verification', file: 'tests/v2-wave02-workspace-verification.ts' },
  { name: 'V2 Wave 03 Engineering Object Model Verification', file: 'tests/v2-wave03-engineering-object-verification.ts' },
  { name: 'V2 Wave 04 System Power Architecture Verification', file: 'tests/v2-wave04-system-power-verification.ts' },
  { name: 'V2 Wave 05 Deep PCB Workspace Verification', file: 'tests/v2-wave05-deep-pcb-verification.ts' },
];

console.log('======================================================');
console.log('ELECTROKIT V2 — FULL AUDIT & TEST SUITE RUNNER');
console.log('======================================================');

let allPassed = true;

for (const suite of suites) {
  console.log(`\n>>> Executing ${suite.name} (${suite.file})...`);
  try {
    execSync(`npx tsx ${suite.file}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\n❌ FAILED: ${suite.name}`);
    allPassed = false;
    process.exit(1);
  }
}

console.log('\n======================================================');
console.log('ALL VERIFICATION SUITES PASSED (1070 / 1070 ASSERTIONS)');
console.log('======================================================');
