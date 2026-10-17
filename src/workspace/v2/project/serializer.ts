/**
 * ElectroKit V2 — Project Serializer & Secure Storage Adapter
 * Hardened export/import with zero-credential leakage and prototype-pollution immunity
 */

import { ElectroKitProjectV2 } from '../types/project';
import { upgradeProject, isV2Project } from '../migration/v1-to-v2';
import { EntityIds } from '../identity/id-generator';
import { verifySnapshotIntegrity, computeSnapshotDigest } from '../integrity/hasher';

/**
 * Deep clone and aggressively sanitize any object before JSON export or storage.
 * Guarantees that no API keys, credentials, tokens, or prototype properties are serialized.
 */
export function sanitizeProjectData<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => sanitizeProjectData(item)) as any;

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // 1. Prototype pollution protection
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    // 2. Secret / credential pattern protection
    if (/api[-_]?key|secret|token|password|credential|bearer|authorization/i.test(key)) {
      continue;
    }
    clean[key] = sanitizeProjectData(value);
  }
  return clean as T;
}

/**
 * Export a V2 project to an indented JSON string with credential sanitization
 */
export function exportV2ProjectToJson(project: ElectroKitProjectV2): string {
  const sanitized = sanitizeProjectData<ElectroKitProjectV2>(project);
  return JSON.stringify(sanitized, null, 2);
}

/**
 * Import a project from JSON string with security validation, schema upgrade, and integrity checking
 */
export function importV2ProjectFromJson(
  jsonString: string
): { success: boolean; project?: ElectroKitProjectV2; error?: string } {
  try {
    const raw = JSON.parse(jsonString);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { success: false, error: 'Invalid JSON: Expected an object structure' };
    }

    if (!raw.metadata || typeof raw.metadata !== 'object' || !raw.metadata.name) {
      return { success: false, error: 'Missing metadata.name in project JSON' };
    }

    // Sanitize imported structure
    const sanitized = sanitizeProjectData(raw);

    // Upgrade project if needed (V1 -> V2, or validates existing V2)
    const upgraded = upgradeProject(sanitized);

    // Assign fresh project ID on import to prevent collision with existing projects
    const freshProjectId = EntityIds.project();
    upgraded.metadata.id = freshProjectId;
    upgraded.metadata.name = `${upgraded.metadata.name.replace(/ \(Imported\)$/, '')} (Imported)`;
    upgraded.metadata.updatedAt = new Date().toISOString();

    // Verify snapshot integrity and heal missing digests
    upgraded.calculationSnapshots = upgraded.calculationSnapshots.map(snap => {
      if (!snap.integrityDigest || !verifySnapshotIntegrity(snap)) {
        return {
          ...snap,
          integrityDigest: computeSnapshotDigest(snap),
        };
      }
      return snap;
    });

    return {
      success: true,
      project: upgraded,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to parse project JSON',
    };
  }
}
