/**
 * ElectroKit V2 — Engineering Object Model
 * Comprehensive object lifecycle, deep cloning, dependency safety, graph navigation, and validation
 */

import { ElectroKitProjectV2 } from '../types/project';
import {
  EngineeringComponentV2,
  ComponentPinV2,
  ComponentRatingV2,
  EngineeringConnectionV2,
  EngineeringNetV2,
} from '../types/components';
import {
  PowerPathV2,
  SignalPathV2,
  ThermalPathV2,
  EngineeringReferenceV2,
  OperatingConditionV2,
} from '../types/paths';
import { PowerRailV2 } from '../types/systems';
import { EntityIds } from '../identity/id-generator';

export interface DependentEntityRef {
  id: string;
  type: string;
  name: string;
}

export interface DependencyCheckResult {
  safe: boolean;
  reasons: string[];
  dependentEntities: DependentEntityRef[];
}

/**
 * Deep clone an engineering component with brand new stable IDs for component, pins, and ratings.
 * Avoids accidental shared mutable state while preserving all ratings, properties, and configurations.
 */
export function cloneComponent(
  component: EngineeringComponentV2,
  newRefDes?: string
): EngineeringComponentV2 {
  const now = new Date().toISOString();
  const newCompId = EntityIds.component();

  // Clone pins with fresh IDs
  const clonedPins: ComponentPinV2[] = (component.pins || []).map(pin => ({
    ...pin,
    id: EntityIds.pin(),
    metadata: pin.metadata ? JSON.parse(JSON.stringify(pin.metadata)) : undefined,
  }));

  // Clone ratings with fresh IDs
  const clonedRatings: ComponentRatingV2[] | undefined = component.ratings
    ? component.ratings.map(rat => ({
        ...rat,
        id: EntityIds.rating(),
      }))
    : undefined;

  // Deep clone property groups
  const clonedPropertyGroups = component.propertyGroups
    ? JSON.parse(JSON.stringify(component.propertyGroups))
    : undefined;

  // Deep clone parametric ratings
  const clonedParametricRatings = component.parametricRatings
    ? JSON.parse(JSON.stringify(component.parametricRatings))
    : {};

  // Deep clone thermal properties
  const clonedThermalProperties = component.thermalProperties
    ? JSON.parse(JSON.stringify(component.thermalProperties))
    : undefined;

  // Deep clone metadata
  const clonedMetadata = component.metadata
    ? JSON.parse(JSON.stringify(component.metadata))
    : undefined;

  return {
    ...component,
    id: newCompId,
    refDes: newRefDes ? newRefDes.trim().toUpperCase() : `${component.refDes}_COPY`,
    name: newRefDes ? component.name : `${component.name} (Copy)`,
    pins: clonedPins,
    ratings: clonedRatings,
    propertyGroups: clonedPropertyGroups,
    parametricRatings: clonedParametricRatings,
    thermalProperties: clonedThermalProperties,
    references: component.references ? [...component.references] : [],
    metadata: clonedMetadata,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Check whether a component can be safely deleted or if other engineering objects depend on it.
 */
export function canDeleteComponent(
  project: ElectroKitProjectV2,
  componentId: string
): DependencyCheckResult {
  const dependentEntities: DependentEntityRef[] = [];
  const reasons: string[] = [];

  const targetComp = project.components.find(c => c.id === componentId);
  const compLabel = targetComp ? `${targetComp.refDes} (${targetComp.name})` : componentId;

  // 1. Check Connections
  for (const conn of project.connections) {
    if (conn.sourceComponentId === componentId || conn.targetComponentId === componentId) {
      dependentEntities.push({
        id: conn.id,
        type: 'Connection',
        name: conn.name || `Connection on net ${conn.netId}`,
      });
      reasons.push(`Referenced in physical/schematic connection ${conn.id}`);
    }
  }

  // 2. Check Subsystems
  for (const sys of project.systems) {
    for (const subsys of sys.subsystems) {
      if (subsys.componentIds && subsys.componentIds.includes(componentId)) {
        dependentEntities.push({
          id: subsys.id,
          type: 'Subsystem',
          name: `${subsys.name} (under ${sys.name})`,
        });
        reasons.push(`Allocated to subsystem ${subsys.name}`);
      }
    }
  }

  // 3. Check Power Paths
  if (project.powerPaths) {
    for (const ppath of project.powerPaths) {
      if (
        ppath.sourceComponentId === componentId ||
        ppath.destinationComponentId === componentId ||
        ppath.stageComponentIds.includes(componentId)
      ) {
        dependentEntities.push({
          id: ppath.id,
          type: 'PowerPath',
          name: ppath.name,
        });
        reasons.push(`Used in power path ${ppath.name}`);
      }
    }
  }

  // 4. Check Signal Paths
  if (project.signalPaths) {
    for (const spath of project.signalPaths) {
      if (
        spath.sourceComponentId === componentId ||
        spath.destinationComponentId === componentId ||
        spath.stageComponentIds.includes(componentId)
      ) {
        dependentEntities.push({
          id: spath.id,
          type: 'SignalPath',
          name: spath.name,
        });
        reasons.push(`Used in signal path ${spath.name}`);
      }
    }
  }

  // 5. Check Thermal Paths
  if (project.thermalPaths) {
    for (const tpath of project.thermalPaths) {
      if (
        tpath.sourceNodeOrComponentId === componentId ||
        tpath.destinationNodeOrComponentId === componentId ||
        tpath.relatedComponentIds?.includes(componentId)
      ) {
        dependentEntities.push({
          id: tpath.id,
          type: 'ThermalPath',
          name: tpath.name,
        });
        reasons.push(`Used in thermal path ${tpath.name}`);
      }
    }
  }

  // 6. Check Calculation Instances
  for (const calc of project.calculations) {
    if (calc.boundComponentIds && calc.boundComponentIds.includes(componentId)) {
      dependentEntities.push({
        id: calc.id,
        type: 'Calculation',
        name: calc.engineId,
      });
      reasons.push(`Referenced in engineering calculation ${calc.engineId}`);
    }
  }

  // 7. Check Power Rails
  for (const rail of project.powerRails) {
    if (rail.loadIds && rail.loadIds.includes(componentId)) {
      dependentEntities.push({
        id: rail.id,
        type: 'PowerRail',
        name: rail.name,
      });
      reasons.push(`Assigned as load on power rail ${rail.name}`);
    }
  }

  // 8. Check Traceability Links
  for (const link of project.traceabilityLinks) {
    if (link.sourceId === componentId || link.targetId === componentId) {
      dependentEntities.push({
        id: link.id,
        type: 'TraceabilityLink',
        name: `${link.relationship} relationship`,
      });
      reasons.push(`Connected in traceability link ${link.id}`);
    }
  }

  // 9. Check Issues
  for (const issue of project.issues) {
    if (issue.impactedEntityIds && issue.impactedEntityIds.includes(componentId)) {
      dependentEntities.push({
        id: issue.id,
        type: 'Issue',
        name: issue.title,
      });
      reasons.push(`Tagged in open engineering issue: ${issue.title}`);
    }
  }

  return {
    safe: dependentEntities.length === 0,
    reasons,
    dependentEntities,
  };
}

/**
 * Delete a component safely.
 * If force=false and dependent entities exist, operation aborts with error details.
 * If force=true, cascades cleanup of references to maintain valid graph relations.
 * Crucially, historical calculation snapshots remain immutable and untouched.
 */
export function deleteComponentSafely(
  project: ElectroKitProjectV2,
  componentId: string,
  force: boolean = false
): { success: boolean; project: ElectroKitProjectV2; error?: string } {
  const check = canDeleteComponent(project, componentId);
  if (!check.safe && !force) {
    return {
      success: false,
      project,
      error: `Cannot delete component: ${check.reasons.join('; ')}`,
    };
  }

  // Filter out the component
  const updatedComponents = project.components.filter(c => c.id !== componentId);

  // If force=true, cascade cleanups
  let updatedConnections = project.connections;
  let updatedPowerPaths = project.powerPaths;
  let updatedSignalPaths = project.signalPaths;
  let updatedThermalPaths = project.thermalPaths;
  let updatedSystems = project.systems;
  let updatedRails = project.powerRails;
  let updatedTraceability = project.traceabilityLinks;

  if (force) {
    // Remove connections tied to this component
    updatedConnections = project.connections.filter(
      conn => conn.sourceComponentId !== componentId && conn.targetComponentId !== componentId
    );

    // Clean power paths
    if (project.powerPaths) {
      updatedPowerPaths = project.powerPaths.map(pp => ({
        ...pp,
        stageComponentIds: pp.stageComponentIds.filter(id => id !== componentId),
      })).filter(pp => pp.sourceComponentId !== componentId && pp.destinationComponentId !== componentId);
    }

    // Clean signal paths
    if (project.signalPaths) {
      updatedSignalPaths = project.signalPaths.map(sp => ({
        ...sp,
        stageComponentIds: sp.stageComponentIds.filter(id => id !== componentId),
      })).filter(sp => sp.sourceComponentId !== componentId && sp.destinationComponentId !== componentId);
    }

    // Clean thermal paths
    if (project.thermalPaths) {
      updatedThermalPaths = project.thermalPaths.map(tp => ({
        ...tp,
        relatedComponentIds: tp.relatedComponentIds?.filter(id => id !== componentId),
      })).filter(tp => tp.sourceNodeOrComponentId !== componentId && tp.destinationNodeOrComponentId !== componentId);
    }

    // Clean subsystem allocations
    updatedSystems = project.systems.map(sys => ({
      ...sys,
      subsystems: sys.subsystems.map(sub => ({
        ...sub,
        componentIds: sub.componentIds.filter(id => id !== componentId),
      })),
    }));

    // Clean rail load allocations
    updatedRails = project.powerRails.map(rail => ({
      ...rail,
      loadIds: rail.loadIds?.filter(id => id !== componentId),
    }));

    // Clean traceability links
    updatedTraceability = project.traceabilityLinks.filter(
      link => link.sourceId !== componentId && link.targetId !== componentId
    );
  }

  const updatedProject: ElectroKitProjectV2 = {
    ...project,
    components: updatedComponents,
    connections: updatedConnections,
    powerPaths: updatedPowerPaths,
    signalPaths: updatedSignalPaths,
    thermalPaths: updatedThermalPaths,
    systems: updatedSystems,
    powerRails: updatedRails,
    traceabilityLinks: updatedTraceability,
  };

  return {
    success: true,
    project: updatedProject,
  };
}

/**
 * Get all pins of a component
 */
export function getComponentPins(
  project: ElectroKitProjectV2,
  componentId: string
): ComponentPinV2[] {
  const comp = project.components.find(c => c.id === componentId);
  return comp?.pins || [];
}

/**
 * Get all pins across components associated with a specific net
 */
export function getNetPins(
  project: ElectroKitProjectV2,
  netId: string
): { component: EngineeringComponentV2; pin: ComponentPinV2 }[] {
  const results: { component: EngineeringComponentV2; pin: ComponentPinV2 }[] = [];
  for (const comp of project.components) {
    for (const pin of comp.pins || []) {
      if (pin.netId === netId) {
        results.push({ component: comp, pin });
      }
    }
  }
  return results;
}

/**
 * Get all nets associated with a power rail
 */
export function getRailNets(
  project: ElectroKitProjectV2,
  railId: string
): EngineeringNetV2[] {
  return project.nets.filter(n => n.railId === railId);
}

/**
 * Get all other components connected directly to a component via any connection
 */
export function getComponentConnectedComponents(
  project: ElectroKitProjectV2,
  componentId: string
): { component: EngineeringComponentV2; viaNet: string; connectionType: string }[] {
  const connectedIds = new Map<string, { viaNet: string; connectionType: string }>();

  for (const conn of project.connections) {
    if (conn.sourceComponentId === componentId) {
      connectedIds.set(conn.targetComponentId, {
        viaNet: conn.netId,
        connectionType: conn.connectionType,
      });
    } else if (conn.targetComponentId === componentId) {
      connectedIds.set(conn.sourceComponentId, {
        viaNet: conn.netId,
        connectionType: conn.connectionType,
      });
    }
  }

  const results: { component: EngineeringComponentV2; viaNet: string; connectionType: string }[] = [];
  for (const [id, meta] of connectedIds.entries()) {
    const comp = project.components.find(c => c.id === id);
    if (comp) {
      results.push({
        component: comp,
        viaNet: meta.viaNet,
        connectionType: meta.connectionType,
      });
    }
  }

  return results;
}

/**
 * Retrieve upstream objects (what this entity depends on / is driven by)
 */
export function getUpstreamObjects(
  project: ElectroKitProjectV2,
  entityId: string
): { id: string; type: string; name: string; relationship: string }[] {
  const results: { id: string; type: string; name: string; relationship: string }[] = [];

  for (const link of project.traceabilityLinks) {
    if (link.targetId === entityId) {
      const sourceName = findEntityName(project, link.sourceId, link.sourceType);
      results.push({
        id: link.sourceId,
        type: link.sourceType,
        name: sourceName,
        relationship: link.relationship,
      });
    }
  }

  return results;
}

/**
 * Retrieve downstream objects (what depends on / is driven by this entity)
 */
export function getDownstreamObjects(
  project: ElectroKitProjectV2,
  entityId: string
): { id: string; type: string; name: string; relationship: string }[] {
  const results: { id: string; type: string; name: string; relationship: string }[] = [];

  for (const link of project.traceabilityLinks) {
    if (link.sourceId === entityId) {
      const targetName = findEntityName(project, link.targetId, link.targetType);
      results.push({
        id: link.targetId,
        type: link.targetType,
        name: targetName,
        relationship: link.relationship,
      });
    }
  }

  return results;
}

function findEntityName(project: ElectroKitProjectV2, id: string, type: string): string {
  if (type === 'component') {
    const c = project.components.find(x => x.id === id);
    return c ? `${c.refDes} - ${c.name}` : id;
  }
  if (type === 'rail') {
    const r = project.powerRails.find(x => x.id === id);
    return r ? r.name : id;
  }
  if (type === 'requirement') {
    const req = project.requirements.find(x => x.id === id);
    return req ? `${req.id}: ${req.name}` : id;
  }
  if (type === 'calculation') {
    const calc = project.calculations.find(x => x.id === id);
    return calc ? calc.engineId : id;
  }
  if (type === 'snapshot') {
    const snap = project.calculationSnapshots.find(x => x.id === id);
    return snap ? `Snapshot ${snap.id.substring(0, 10)}` : id;
  }
  return id;
}

/**
 * Validate component data ensuring no silent mathematical or unit coercion
 */
export function validateComponent(
  component: Partial<EngineeringComponentV2>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!component.refDes || !component.refDes.trim()) {
    errors.push('Reference designator (refDes) is required');
  } else if (!/^[A-Z][A-Z0-9_-]*$/i.test(component.refDes.trim())) {
    errors.push('Reference designator must start with a letter and contain valid alphanumeric characters');
  }

  if (!component.name || !component.name.trim()) {
    errors.push('Component name is required');
  }

  if (!component.category) {
    errors.push('Component category is required');
  }

  if (component.ratings) {
    for (const r of component.ratings) {
      const rVal = validateRating(r);
      if (!rVal.valid) {
        errors.push(...rVal.errors.map(e => `Rating '${r.parameter}': ${e}`));
      }
    }
  }

  if (component.pins) {
    const pinNumbers = new Set<string | number>();
    for (const p of component.pins) {
      if (pinNumbers.has(p.pinNumber)) {
        errors.push(`Duplicate pin number: ${p.pinNumber}`);
      }
      pinNumbers.add(p.pinNumber);
      const pVal = validatePin(p);
      if (!pVal.valid) {
        errors.push(...pVal.errors.map(e => `Pin '${p.name || p.pinNumber}': ${e}`));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate structured rating
 */
export function validateRating(
  rating: Partial<ComponentRatingV2>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rating.parameter || !rating.parameter.trim()) {
    errors.push('Rating parameter name is required');
  }

  if (rating.value === undefined || rating.value === null || typeof rating.value !== 'number' || isNaN(rating.value)) {
    errors.push('Rating numerical value must be a valid finite number');
  }

  if (!rating.unit || !rating.unit.trim()) {
    errors.push('Rating unit is required');
  }

  if (!rating.ratingType) {
    errors.push('Rating type (absolute_maximum, recommended_operating, typical, etc.) is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate pin
 */
export function validatePin(
  pin: Partial<ComponentPinV2>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (pin.pinNumber === undefined || pin.pinNumber === null || String(pin.pinNumber).trim() === '') {
    errors.push('Pin number is required');
  }

  if (!pin.name || !pin.name.trim()) {
    errors.push('Pin name is required');
  }

  if (!pin.type) {
    errors.push('Pin type is required');
  }

  if (pin.voltageRatingV !== undefined && (typeof pin.voltageRatingV !== 'number' || isNaN(pin.voltageRatingV))) {
    errors.push('Pin voltage rating must be a valid number');
  }

  if (pin.currentRatingA !== undefined && (typeof pin.currentRatingA !== 'number' || isNaN(pin.currentRatingA))) {
    errors.push('Pin current rating must be a valid number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate power path
 */
export function validatePowerPath(
  path: Partial<PowerPathV2>,
  project: ElectroKitProjectV2
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!path.name || !path.name.trim()) {
    errors.push('Power path name is required');
  }

  if (!path.sourceComponentId) {
    errors.push('Power path source component is required');
  } else if (!project.components.some(c => c.id === path.sourceComponentId)) {
    errors.push(`Power path source component '${path.sourceComponentId}' not found in project`);
  }

  if (!path.destinationComponentId) {
    errors.push('Power path destination component is required');
  } else if (!project.components.some(c => c.id === path.destinationComponentId)) {
    errors.push(`Power path destination component '${path.destinationComponentId}' not found in project`);
  }

  if (path.stageComponentIds) {
    for (const sid of path.stageComponentIds) {
      if (!project.components.some(c => c.id === sid)) {
        errors.push(`Power path stage component '${sid}' not found in project`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate signal path
 */
export function validateSignalPath(
  path: Partial<SignalPathV2>,
  project: ElectroKitProjectV2
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!path.name || !path.name.trim()) {
    errors.push('Signal path name is required');
  }

  if (!path.sourceComponentId) {
    errors.push('Signal path source component is required');
  } else if (!project.components.some(c => c.id === path.sourceComponentId)) {
    errors.push(`Signal path source component '${path.sourceComponentId}' not found in project`);
  }

  if (!path.destinationComponentId) {
    errors.push('Signal path destination component is required');
  } else if (!project.components.some(c => c.id === path.destinationComponentId)) {
    errors.push(`Signal path destination component '${path.destinationComponentId}' not found in project`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate thermal path
 */
export function validateThermalPath(
  path: Partial<ThermalPathV2>,
  project: ElectroKitProjectV2
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!path.name || !path.name.trim()) {
    errors.push('Thermal path name is required');
  }

  if (!path.sourceNodeOrComponentId) {
    errors.push('Thermal path source node/component is required');
  }

  if (!path.destinationNodeOrComponentId) {
    errors.push('Thermal path destination node/component is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate reference
 */
export function validateReference(
  ref: Partial<EngineeringReferenceV2>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ref.title || !ref.title.trim()) {
    errors.push('Reference title is required');
  }

  if (!ref.type) {
    errors.push('Reference type (datasheet, standard, application_note, etc.) is required');
  }

  if (ref.url) {
    const sanitized = sanitizeReferenceUrl(ref.url);
    if (!sanitized) {
      errors.push('Reference URL contains prohibited scheme or malicious payload (e.g. javascript:, data:, <script>)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Strict sanitization for untrusted reference URLs.
 * Rejects javascript:, data:, vbscript:, script tags, and non-http(s) protocols.
 */
export function sanitizeReferenceUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Check for dangerous scripts or schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.includes('<script') ||
    lower.includes('</script') ||
    lower.includes('eval(') ||
    lower.includes('onload=') ||
    lower.includes('onerror=')
  ) {
    return undefined;
  }

  // Must start with http:// or https:// or be a relative reference
  if (!lower.startsWith('http://') && !lower.startsWith('https://') && !lower.startsWith('/')) {
    return undefined;
  }

  return trimmed;
}
