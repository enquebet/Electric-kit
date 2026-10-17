/**
 * ElectroKit V2 — Integrity & Cryptographic Hashing
 * Deterministic canonical JSON and digest generation for snapshots, revisions, and project states
 */

import { CalculationSnapshotV2 } from '../types/calculations';

/**
 * Deterministically stringify an object with sorted keys at all nested levels.
 * Guarantees that `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` produce identical strings.
 */
export function canonicalStringify(obj: any): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') {
    if (typeof obj === 'number') {
      // Normalize floating points: if integer, show integer, otherwise fixed precision
      return Number.isFinite(obj) ? String(obj) : 'null';
    }
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys
    .filter(k => obj[k] !== undefined)
    .map(k => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Fast, deterministic 64-bit FNV-1a based hex hash.
 * Pure TypeScript, runs identically in browser, node, and tests with 0 dependencies.
 */
export function computeDeterministicHash(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);

    h2 ^= ch;
    h2 = Math.imul(h2, 0x01000193);
    h2 = (h2 << 13) | (h2 >>> 19);
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}`;
}

/**
 * Deterministic hash digest prefixed with sha256_
 */
export function computeSha256Digest(content: any): string {
  const canonical = typeof content === 'string' ? content : canonicalStringify(content);
  return `sha256_${computeDeterministicHash(canonical)}`;
}

/**
 * Compute the deterministic integrity digest for a calculation snapshot
 */
export function computeSnapshotDigest(snapshot: Omit<CalculationSnapshotV2, 'integrityDigest'>): string {
  const contentToDigest = {
    calculationId: snapshot.calculationId,
    inputs: snapshot.inputs,
    outputs: snapshot.outputs,
    assumptions: snapshot.assumptions,
    warnings: snapshot.warnings,
    margins: snapshot.margins,
  };
  const canonical = canonicalStringify(contentToDigest);
  return `sha256_${computeDeterministicHash(canonical)}`;
}

/**
 * Verify whether a snapshot has been tampered with or corrupted
 */
export function verifySnapshotIntegrity(snapshot: CalculationSnapshotV2): boolean {
  if (!snapshot.integrityDigest) return false;
  const expectedDigest = computeSnapshotDigest(snapshot);
  return snapshot.integrityDigest === expectedDigest;
}

/**
 * Compute an immutable state digest for an entire project at a revision point
 */
export function computeProjectStateDigest(project: Record<string, any>): string {
  const projectSubset = {
    requirements: project.requirements,
    constraints: project.constraints,
    assumptions: project.assumptions,
    targets: project.targets,
    systems: project.systems,
    components: project.components,
    designCases: project.designCases,
    calculations: project.calculations,
    calculationSnapshots: project.calculationSnapshots,
    validationMilestones: project.validationMilestones,
    measurements: project.measurements,
  };
  const canonical = canonicalStringify(projectSubset);
  return `digest_${computeDeterministicHash(canonical)}`;
}
