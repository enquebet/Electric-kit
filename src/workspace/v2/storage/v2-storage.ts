/**
 * ElectroKit V2 — Workspace Persistence & Project Management
 * LocalStorage adapter, active project state, and multi-project lifecycle
 */

import { ElectroKitProjectV2 } from '../types/project';
import { createDefaultProjectV2 } from '../project/factory';
import { sanitizeProjectData, exportV2ProjectToJson } from '../project/serializer';
import { isV2Project, migrateV1toV2 } from '../migration/v1-to-v2';
import { getActiveProject as getActiveV1Project } from '../../storage';
import { EntityIds } from '../identity/id-generator';

const V2_PROJECTS_KEY = 'electrokit_projects_v2';
const V2_ACTIVE_ID_KEY = 'electrokit_active_project_id_v2';

/**
 * Retrieve all V2 projects from local storage.
 * If none exist, initializes from active V1 project or default V2 template.
 */
export function getAllV2Projects(): ElectroKitProjectV2[] {
  if (typeof window === 'undefined') {
    return [createDefaultProjectV2('dcdc-buck-converter')];
  }

  try {
    const raw = localStorage.getItem(V2_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(isV2Project);
      }
    }
  } catch (err) {
    console.error('Failed to parse V2 projects from storage:', err);
  }

  // Attempt migration from V1 active project if available
  try {
    const v1Proj = getActiveV1Project();
    if (v1Proj && v1Proj.metadata?.name) {
      const migrated = migrateV1toV2(v1Proj);
      saveV2Project(migrated);
      setV2ActiveProjectId(migrated.metadata.id);
      return [migrated];
    }
  } catch (err) {
    console.warn('Could not migrate active V1 project to V2:', err);
  }

  // Fallback to default V2 project
  const initial = createDefaultProjectV2('dcdc-buck-converter');
  saveV2Project(initial);
  setV2ActiveProjectId(initial.metadata.id);
  return [initial];
}

/**
 * Get active V2 project
 */
export function getActiveV2Project(): ElectroKitProjectV2 {
  const all = getAllV2Projects();
  if (typeof window === 'undefined') {
    return all[0] || createDefaultProjectV2('dcdc-buck-converter');
  }

  try {
    const activeId = localStorage.getItem(V2_ACTIVE_ID_KEY);
    if (activeId) {
      const found = all.find(p => p.metadata.id === activeId);
      if (found) return found;
    }
  } catch {
    // ignore
  }

  const fallback = all[0] || createDefaultProjectV2('dcdc-buck-converter');
  setV2ActiveProjectId(fallback.metadata.id);
  return fallback;
}

/**
 * Save or update a V2 project in storage
 */
export function saveV2Project(project: ElectroKitProjectV2): void {
  if (typeof window === 'undefined') return;

  try {
    const sanitized = sanitizeProjectData<ElectroKitProjectV2>(project);
    sanitized.metadata.updatedAt = new Date().toISOString();

    const all = getAllV2Projects();
    const idx = all.findIndex(p => p.metadata.id === sanitized.metadata.id);
    if (idx >= 0) {
      all[idx] = sanitized;
    } else {
      all.push(sanitized);
    }

    localStorage.setItem(V2_PROJECTS_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save V2 project:', err);
  }
}

/**
 * Set active V2 project ID
 */
export function setV2ActiveProjectId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(V2_ACTIVE_ID_KEY, id);
  } catch {
    // ignore
  }
}

/**
 * Create a new V2 project from template and set as active
 */
export function createAndSaveDefaultV2Project(
  template: 'blank' | 'dcdc-buck-converter' | 'iot-wireless-sensor' = 'dcdc-buck-converter'
): ElectroKitProjectV2 {
  const newProj = createDefaultProjectV2(template);
  saveV2Project(newProj);
  setV2ActiveProjectId(newProj.metadata.id);
  return newProj;
}

/**
 * Duplicate an existing V2 project
 */
export function duplicateV2Project(sourceProjectId: string): ElectroKitProjectV2 | null {
  const all = getAllV2Projects();
  const source = all.find(p => p.metadata.id === sourceProjectId);
  if (!source) return null;

  const clone: ElectroKitProjectV2 = JSON.parse(JSON.stringify(source));
  const newId = EntityIds.project();
  clone.metadata.id = newId;
  clone.metadata.name = `${source.metadata.name} (Copy)`;
  clone.metadata.createdAt = new Date().toISOString();
  clone.metadata.updatedAt = new Date().toISOString();

  saveV2Project(clone);
  setV2ActiveProjectId(newId);
  return clone;
}

/**
 * Delete a V2 project
 */
export function deleteV2Project(projectId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const all = getAllV2Projects();
    const remaining = all.filter(p => p.metadata.id !== projectId);
    if (remaining.length === 0) {
      // Create fresh default project if last one deleted
      const fresh = createDefaultProjectV2('dcdc-buck-converter');
      remaining.push(fresh);
    }
    localStorage.setItem(V2_PROJECTS_KEY, JSON.stringify(remaining));

    const activeId = localStorage.getItem(V2_ACTIVE_ID_KEY);
    if (activeId === projectId) {
      setV2ActiveProjectId(remaining[0].metadata.id);
    }
    return true;
  } catch (err) {
    console.error('Failed to delete V2 project:', err);
    return false;
  }
}
