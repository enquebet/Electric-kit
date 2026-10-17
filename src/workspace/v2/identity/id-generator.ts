/**
 * ElectroKit V2 — Identity Architecture
 * Stable, collision-resistant, typed entity ID generators
 */

export type EntityIdPrefix =
  | 'proj'
  | 'req'
  | 'con'
  | 'asm'
  | 'tgt'
  | 'sys'
  | 'subsys'
  | 'comp'
  | 'pin'
  | 'conn'
  | 'net'
  | 'rail'
  | 'conv'
  | 'thnode'
  | 'thpath'
  | 'rfport'
  | 'case'
  | 'scen'
  | 'calc'
  | 'snap'
  | 'val'
  | 'meas'
  | 'dsver'
  | 'rev'
  | 'issue'
  | 'dec'
  | 'tlink'
  | 'rep'
  | 'note'
  | 'ppath'
  | 'spath'
  | 'ref'
  | 'rat'
  | 'cond'
  | 'psrc'
  | 'load'
  | 'seq'
  | 'board'
  | 'fp'
  | 'pad'
  | 'place'
  | 'trace'
  | 'tseg'
  | 'via'
  | 'varray'
  | 'zone'
  | 'diff'
  | 'lencon'
  | 'impcon'
  | 'drc'
  | 'keep'
  | 'cutout'
  | 'layer'
  | 'stack';

/**
 * Generate a random collision-resistant hex string of specified byte length
 */
function randomEntropy(byteCount: number = 8): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(byteCount);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for non-crypto environments
  let str = '';
  for (let i = 0; i < byteCount; i++) {
    str += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return str;
}

/**
 * Generate a stable, collision-resistant entity ID with the specified domain prefix.
 * e.g. "req_7f9b2c3d4e5f6a7b", "comp_a1b2c3d4e5f6", "proj_908a7b6c5d4e"
 */
export function generateEntityId(prefix: EntityIdPrefix, entropyBytes: number = 6): string {
  return `${prefix}_${randomEntropy(entropyBytes)}`;
}

/**
 * Validate whether a string conforms to the expected entity ID format
 */
export function isValidEntityId(id: string, expectedPrefix?: EntityIdPrefix): boolean {
  if (!id || typeof id !== 'string') return false;
  const parts = id.split('_');
  if (parts.length < 2) return false;
  if (expectedPrefix && parts[0] !== expectedPrefix) return false;
  // Ensure remainder contains valid alphanumeric characters and length >= 4
  const body = parts.slice(1).join('_');
  return /^[a-zA-Z0-9_-]{4,}$/.test(body);
}

/**
 * Convenience typed ID generators
 */
export const EntityIds = {
  project: () => generateEntityId('proj', 6),
  requirement: () => generateEntityId('req', 5),
  constraint: () => generateEntityId('con', 5),
  assumption: () => generateEntityId('asm', 5),
  target: () => generateEntityId('tgt', 5),
  system: () => generateEntityId('sys', 5),
  subsystem: () => generateEntityId('subsys', 5),
  component: () => generateEntityId('comp', 5),
  pin: () => generateEntityId('pin', 4),
  connection: () => generateEntityId('conn', 5),
  net: () => generateEntityId('net', 5),
  rail: () => generateEntityId('rail', 5),
  converter: () => generateEntityId('conv', 5),
  thermalNode: () => generateEntityId('thnode', 5),
  thermalPath: () => generateEntityId('thpath', 5),
  rfPort: () => generateEntityId('rfport', 4),
  case: () => generateEntityId('case', 5),
  scenario: () => generateEntityId('scen', 5),
  calculation: () => generateEntityId('calc', 5),
  snapshot: () => generateEntityId('snap', 6),
  validation: () => generateEntityId('val', 5),
  measurement: () => generateEntityId('meas', 5),
  datasheetVer: () => generateEntityId('dsver', 5),
  revision: () => generateEntityId('rev', 5),
  issue: () => generateEntityId('issue', 5),
  decision: () => generateEntityId('dec', 5),
  traceabilityLink: () => generateEntityId('tlink', 6),
  report: () => generateEntityId('rep', 5),
  note: () => generateEntityId('note', 5),
  powerPath: () => generateEntityId('ppath', 5),
  signalPath: () => generateEntityId('spath', 5),
  reference: () => generateEntityId('ref', 5),
  rating: () => generateEntityId('rat', 5),
  operatingCondition: () => generateEntityId('cond', 5),
  powerSource: () => generateEntityId('psrc', 5),
  powerLoad: () => generateEntityId('load', 5),
  sequencingRule: () => generateEntityId('seq', 5),
  powerSequencingRule: () => generateEntityId('seq', 5),
  board: () => generateEntityId('board', 5),
  footprint: () => generateEntityId('fp', 5),
  pad: () => generateEntityId('pad', 5),
  placement: () => generateEntityId('place', 5),
  trace: () => generateEntityId('trace', 5),
  traceSegment: () => generateEntityId('tseg', 5),
  via: () => generateEntityId('via', 5),
  viaArray: () => generateEntityId('varray', 5),
  copperZone: () => generateEntityId('zone', 5),
  differentialPair: () => generateEntityId('diff', 5),
  lengthConstraint: () => generateEntityId('lencon', 5),
  impedanceConstraint: () => generateEntityId('impcon', 5),
  drcFinding: () => generateEntityId('drc', 5),
  keepout: () => generateEntityId('keep', 5),
  cutout: () => generateEntityId('cutout', 5),
  layer: () => generateEntityId('layer', 4),
  stackup: () => generateEntityId('stack', 5),
};
