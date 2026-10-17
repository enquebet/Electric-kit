/**
 * ElectroKit V2 — Traceability Graph & Impact Analysis
 * Bidirectional relationship graph across Requirements, Systems, Components, Calculations, and Validations
 */

import {
  TraceabilityLinkV2,
  TraceableEntityType,
  TraceabilityRelationshipType,
  TraceabilityCoverageReport,
} from '../types/traceability';
import { ElectroKitProjectV2 } from '../types/project';
import { EntityIds } from '../identity/id-generator';

export class TraceabilityGraph {
  private links: Map<string, TraceabilityLinkV2> = new Map();
  private outgoingIndex: Map<string, Set<string>> = new Map(); // sourceId -> Set<linkId>
  private incomingIndex: Map<string, Set<string>> = new Map(); // targetId -> Set<linkId>

  constructor(initialLinks: TraceabilityLinkV2[] = []) {
    for (const link of initialLinks) {
      this.addLink(link);
    }
  }

  /**
   * Add a typed link between two engineering entities
   */
  public addLink(link: TraceabilityLinkV2): void {
    this.links.set(link.id, link);

    if (!this.outgoingIndex.has(link.sourceId)) {
      this.outgoingIndex.set(link.sourceId, new Set());
    }
    this.outgoingIndex.get(link.sourceId)!.add(link.id);

    if (!this.incomingIndex.has(link.targetId)) {
      this.incomingIndex.set(link.targetId, new Set());
    }
    this.incomingIndex.get(link.targetId)!.add(link.id);
  }

  /**
   * Create and add a new link with auto-generated ID
   */
  public createLink(
    sourceId: string,
    sourceType: TraceableEntityType,
    targetId: string,
    targetType: TraceableEntityType,
    relationship: TraceabilityRelationshipType,
    rationale?: string
  ): TraceabilityLinkV2 {
    const link: TraceabilityLinkV2 = {
      id: EntityIds.traceabilityLink(),
      sourceId,
      sourceType,
      targetId,
      targetType,
      relationship,
      rationale,
      createdAt: new Date().toISOString(),
    };
    this.addLink(link);
    return link;
  }

  /**
   * Remove a link by ID
   */
  public removeLink(linkId: string): boolean {
    const link = this.links.get(linkId);
    if (!link) return false;

    this.outgoingIndex.get(link.sourceId)?.delete(linkId);
    this.incomingIndex.get(link.targetId)?.delete(linkId);
    return this.links.delete(linkId);
  }

  /**
   * Get all links where entity is the target (what drives this entity)
   */
  public getUpstream(entityId: string): TraceabilityLinkV2[] {
    const linkIds = this.incomingIndex.get(entityId);
    if (!linkIds) return [];
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }

  /**
   * Get all links where entity is the source (what depends on this entity)
   */
  public getDownstream(entityId: string): TraceabilityLinkV2[] {
    const linkIds = this.outgoingIndex.get(entityId);
    if (!linkIds) return [];
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }

  /**
   * Compute full impact radius (transitive downstream closure).
   * If an assumption or requirement changes, this returns all entities transitively affected.
   */
  public getImpactRadius(rootEntityId: string): string[] {
    const visited = new Set<string>();
    const queue = [rootEntityId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const outgoing = this.getDownstream(current);

      for (const link of outgoing) {
        if (!visited.has(link.targetId)) {
          visited.add(link.targetId);
          queue.push(link.targetId);
        }
      }
    }

    return Array.from(visited);
  }

  /**
   * Get all registered links as an array for serialization
   */
  public getAllLinks(): TraceabilityLinkV2[] {
    return Array.from(this.links.values());
  }

  /**
   * Calculate requirements coverage and identify gaps in the engineering project
   */
  public calculateCoverage(project: ElectroKitProjectV2): TraceabilityCoverageReport {
    const totalRequirements = project.requirements.length;
    let satisfiedRequirements = 0;
    const unmetRequirementsList: string[] = [];

    for (const req of project.requirements) {
      const upstream = this.getUpstream(req.id);
      const isSatisfiedByCalculation = upstream.some(l => l.sourceType === 'calculation' || l.sourceType === 'snapshot');
      const isSatisfiedByMeasurement = upstream.some(l => l.sourceType === 'measurement');

      if (isSatisfiedByCalculation || isSatisfiedByMeasurement || req.verificationStatus === 'passed') {
        satisfiedRequirements++;
      } else {
        unmetRequirementsList.push(req.id);
      }
    }

    // Find unlinked components (components with no net or connection or link)
    const linkedEntityIds = new Set<string>();
    for (const link of this.links.values()) {
      linkedEntityIds.add(link.sourceId);
      linkedEntityIds.add(link.targetId);
    }

    const unlinkedComponents = project.components
      .filter(c => !linkedEntityIds.has(c.id))
      .map(c => c.refDes || c.id);

    // Find unverified calculations
    const unverifiedCalculations = project.calculations
      .filter(calc => calc.status === 'needs_recalculation' || calc.status === 'error')
      .map(calc => calc.id);

    const openIssuesCount = project.issues.filter(i => i.status === 'open' || i.status === 'investigating').length;

    const coveragePercent = totalRequirements > 0
      ? Math.round((satisfiedRequirements / totalRequirements) * 1000) / 10
      : 100;

    return {
      totalRequirements,
      satisfiedRequirements,
      unmetRequirements: unmetRequirementsList.length,
      coveragePercent,
      unlinkedComponents,
      unverifiedCalculations,
      openIssuesCount,
    };
  }
}
