/**
 * ElectroKit — Phase 13 Engineering Workspace
 * LocalStorage Persistence & Project Management
 */

import { ElectroKitProject, AiConfig } from './types';

const PROJECTS_STORAGE_KEY = 'electrokit_projects_v1';
const ACTIVE_PROJECT_KEY = 'electrokit_active_project_id_v1';
const AI_CONFIG_KEY = 'electrokit_ai_config_v1';

export function createDefaultProject(templateKey?: 'dcdc-converter' | 'iot-node' | 'blank'): ElectroKitProject {
  const timestamp = new Date().toISOString();
  const projectId = 'proj_' + Math.random().toString(36).substring(2, 10);
  const baselineCaseId = 'case_baseline_' + Math.random().toString(36).substring(2, 8);

  if (templateKey === 'iot-node') {
    return {
      schemaVersion: '1.0.0',
      metadata: {
        id: projectId,
        name: 'IoT Wireless Sensor Node',
        description: 'Low-power environmental sensor node running on 18650 Li-ion with BLE/LoRa telemetry.',
        projectType: 'IoT Device',
        domain: 'Embedded',
        author: 'Lead Hardware Engineer',
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'Draft',
        engineeringObjective: 'Achieve > 1 year battery autonomy with 10-minute periodic reporting cycle.',
        designTarget: 'Average power < 250 µW, peak transmit current < 80 mA at 3.3V.',
        tags: ['IoT', 'Ultra-Low-Power', 'Li-Ion', 'Sensors'],
        notes: 'Target enclosure: IP65 outdoor casing with passive potting.',
      },
      requirements: [
        {
          id: 'req_elec_01',
          name: 'Supply Rail Voltage',
          category: 'electrical',
          nominalValue: 3.3,
          minValue: 3.0,
          maxValue: 3.6,
          unit: 'V',
          description: 'Microcontroller and sensor operating window',
          source: 'user',
        },
        {
          id: 'req_batt_01',
          name: 'Battery Autonomy',
          category: 'power',
          nominalValue: 365,
          minValue: 270,
          maxValue: 730,
          unit: 'days',
          description: 'Field servicing interval constraint',
          source: 'user',
        },
      ],
      constraints: [
        {
          id: 'con_01',
          category: 'environmental',
          name: 'Operating Ambient Temperature',
          value: 60,
          unit: '°C',
          limitType: 'max',
          notes: 'Outdoor solar heating direct exposure',
        },
        {
          id: 'con_02',
          category: 'battery',
          name: 'Minimum Operating Cell Cutoff',
          value: 3.0,
          unit: 'V',
          limitType: 'min',
          notes: 'Protect cell from over-discharge degradation',
        },
      ],
      assumptions: [
        {
          id: 'asm_01',
          parameter: 'Sleep Duty Cycle',
          value: 99.2,
          unit: '%',
          classification: 'User-defined assumption',
          description: 'Deep sleep duty cycle exceeds 99.2% of total runtime',
          isUserConfigurable: true,
          applicableWorkflow: 'battery-autonomy',
        },
      ],
      targets: [
        {
          id: 'tgt_01',
          parameter: 'Deep Sleep Current',
          targetValue: 15,
          unit: 'µA',
          priority: 'critical',
          notes: 'Including buck quiescent current and sensor standby',
        },
      ],
      designCases: [
        {
          id: baselineCaseId,
          name: 'Baseline Design (18650 2600mAh)',
          description: 'Single-cell INR18650-26E with synchronous nano-quiescent buck converter',
          isBaseline: true,
          inputs: {
            cellCapacityAh: 2.6,
            nominalVoltageV: 3.7,
            sleepCurrentUa: 12,
            activeCurrentMa: 45,
            activeDurationMs: 80,
            intervalSec: 600,
          },
          calculationSnapshots: [],
          assumptionOverrides: [],
          warnings: [],
          revisionNumber: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      scenarios: [
        {
          id: 'scen_hot',
          caseId: baselineCaseId,
          name: 'High Ambient (+55°C)',
          type: 'temperature',
          parameterOverrides: { ambientTempC: 55, batterySelfDischargePctPerMonth: 3.0 },
          createdAt: timestamp,
        },
        {
          id: 'scen_eol',
          caseId: baselineCaseId,
          name: 'EOL Battery (80% SOH)',
          type: 'battery-eol',
          parameterOverrides: { cellCapacityAh: 2.08, cellEsrMilliohms: 90 },
          createdAt: timestamp,
        },
      ],
      validationItems: [
        {
          id: 'val_01',
          title: 'Deep sleep current verification with sub-microamp meter',
          category: 'prototype',
          status: 'Calculated',
          hardwareValidationRequired: true,
        },
      ],
      manufacturerData: [
        {
          id: 'mfr_01',
          componentRef: 'BT1',
          parameter: 'Nominal Capacity',
          value: 2.6,
          unit: 'Ah',
          manufacturer: 'Samsung SDI',
          partNumber: 'INR18650-26E',
          verified: true,
        },
      ],
      measurements: [],
      notes: [],
      revisions: [
        {
          revisionNumber: 1,
          timestamp,
          author: 'Lead Hardware Engineer',
          summary: 'Initial project setup from IoT Sensor Node template',
          snapshotDigest: 'init_v1',
        },
      ],
      iterations: [],
      activeCaseId: baselineCaseId,
    };
  }

  // Default: 5V/3A Synchronous DC-DC Converter & PDN
  return {
    schemaVersion: '1.0.0',
    metadata: {
      id: projectId,
      name: '5V / 3A Synchronous DC-DC Converter',
      description: 'Point-of-load step-down regulator board with high-density power delivery and thermal optimization.',
      projectType: 'Power Supply',
      domain: 'Power',
      author: 'Hardware System Architect',
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'Draft',
      engineeringObjective: 'Generate regulated 5.0V at 3.0A continuous output from 12V automotive/industrial bus.',
      designTarget: 'Efficiency > 91%, output ripple < 35 mVpp, peak junction temp < 105°C.',
      tags: ['Power', 'Buck-Converter', 'PDN', 'Thermal', 'IPC-2152'],
      notes: 'Compact 4-layer FR-4 design with inner solid ground plane.',
    },
    requirements: [
      {
        id: 'req_01',
        name: 'Input Voltage Range',
        category: 'electrical',
        nominalValue: 12.0,
        minValue: 9.0,
        maxValue: 16.0,
        unit: 'V',
        description: 'Industrial 12V bus with ±25% line variations',
        source: 'user',
      },
      {
        id: 'req_02',
        name: 'Output Current Capacity',
        category: 'power',
        nominalValue: 3.0,
        minValue: 0.1,
        maxValue: 4.0,
        unit: 'A',
        description: 'Downstream compute core and high-speed telemetry',
        source: 'user',
      },
      {
        id: 'req_03',
        name: 'Thermal Junction Headroom',
        category: 'thermal',
        nominalValue: 95.0,
        minValue: 25.0,
        maxValue: 110.0,
        unit: '°C',
        description: 'Keep junction <= 110°C at max ambient 50°C',
        source: 'user',
      },
    ],
    constraints: [
      {
        id: 'con_01',
        category: 'electrical',
        name: 'Maximum Output Voltage Ripple',
        value: 35,
        unit: 'mVpp',
        limitType: 'max',
        notes: 'Sensitive mixed-signal ADC downstream requires low ripple',
      },
      {
        id: 'con_02',
        category: 'pcb',
        name: 'PCB Trace Temperature Rise',
        value: 20,
        unit: '°C',
        limitType: 'max',
        notes: 'IPC-2152 standard conservative temperature rise limit',
      },
    ],
    assumptions: [
      {
        id: 'asm_01',
        parameter: 'Component Parasitics',
        value: 'DCR 25mΩ, Rds 18mΩ',
        classification: 'User-defined assumption',
        description: 'Inductor DCR losses estimated at 25 mΩ and MOSFET Rds(on) = 18 mΩ at 25°C',
        isUserConfigurable: true,
        applicableWorkflow: 'power-converter',
      },
      {
        id: 'asm_02',
        parameter: 'Air Convection',
        value: 'Natural convection 0.1 m/s',
        classification: 'Idealized model',
        description: 'Natural air convection inside enclosure with minimal air velocity (0.1 m/s)',
        isUserConfigurable: false,
        applicableWorkflow: 'thermal-enclosure',
      },
    ],
    targets: [
      {
        id: 'tgt_01',
        parameter: 'Conversion Efficiency at 3A',
        targetValue: 92,
        unit: '%',
        tolerancePercent: 2,
        priority: 'high',
        notes: 'Reduces heat dissipation to under 1.5W',
      },
      {
        id: 'tgt_02',
        parameter: 'PDN Target Impedance',
        targetValue: 35,
        unit: 'mΩ',
        priority: 'critical',
        notes: 'Prevents rail droop during 1.5A transient step',
      },
    ],
    designCases: [
      {
        id: baselineCaseId,
        name: 'Baseline Design (4-Layer 1oz)',
        description: 'Synchronous buck with 3.3µH shielded inductor and solid GND inner layer',
        isBaseline: true,
        inputs: {
          inputVoltageV: 12,
          outputVoltageV: 5,
          outputCurrentA: 3,
          switchingFreqKhz: 500,
          inductorDcrMilliOhms: 22,
          ambientTempC: 35,
        },
        calculationSnapshots: [],
        assumptionOverrides: [],
        warnings: [],
        revisionNumber: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    scenarios: [
      {
        id: 'scen_worst_hot',
        caseId: baselineCaseId,
        name: 'Worst-Case Hot (+50°C Ambient, 3.5A)',
        type: 'worst-case',
        parameterOverrides: { ambientTempC: 50, outputCurrentA: 3.5, inputVoltageV: 16 },
        createdAt: timestamp,
      },
      {
        id: 'scen_min_vin',
        caseId: baselineCaseId,
        name: 'Low Input Rail (9.0V Vin)',
        type: 'supply-variation',
        parameterOverrides: { inputVoltageV: 9.0 },
        createdAt: timestamp,
      },
    ],
    validationItems: [
      {
        id: 'val_01',
        title: 'Measure switching node peak overshoot & ringing with 500MHz probe',
        category: 'prototype',
        status: 'Calculated',
        hardwareValidationRequired: true,
      },
      {
        id: 'val_02',
        title: 'Thermal rise measurement on IC package at 3A continuous',
        category: 'thermal',
        status: 'Calculated',
        hardwareValidationRequired: true,
      },
      {
        id: 'val_03',
        title: 'Verify inductor saturation current vs temperature curve',
        category: 'datasheet',
        status: 'Manufacturer Data Verified',
        hardwareValidationRequired: false,
      },
    ],
    manufacturerData: [
      {
        id: 'mfr_01',
        componentRef: 'L1',
        parameter: 'Saturation Current (Isat)',
        value: 5.2,
        unit: 'A',
        manufacturer: 'Coilcraft',
        partNumber: 'XAL5030-332MEC',
        datasheetUrl: 'https://www.coilcraft.com',
        verified: true,
      },
      {
        id: 'mfr_02',
        componentRef: 'Cout',
        parameter: 'Capacitance & DC Bias Derating',
        value: '47 µF (28 µF at 5V bias)',
        unit: 'µF',
        manufacturer: 'Murata',
        partNumber: 'GRM31CR61A476ME15L',
        verified: true,
      },
    ],
    measurements: [
      {
        id: 'meas_01',
        testPoint: 'TP_VOUT',
        parameter: 'Output Voltage DC',
        measuredValue: 5.02,
        unit: 'V',
        measurementMethod: '6.5 digit DMM at sense resistor',
        instrument: 'Keysight 34465A',
        timestamp,
        tolerance: '±0.05 V',
      },
    ],
    notes: [
      {
        id: 'note_01',
        title: 'Layout Guideline for Current Loop',
        body: 'Keep high di/dt input capacitor loop area minimal on top layer directly adjacent to IC pins 2 & 5.',
        timestamp,
        tag: 'Layout',
      },
    ],
    revisions: [
      {
        revisionNumber: 1,
        timestamp,
        author: 'Hardware System Architect',
        summary: 'Created baseline project architecture from Power Supply template.',
        snapshotDigest: 'rev1_digest',
      },
    ],
    iterations: [],
    activeCaseId: baselineCaseId,
  };
}

export function getAllProjects(): ElectroKitProject[] {
  if (typeof window === 'undefined') return [createDefaultProject()];
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      const defaultProj = createDefaultProject();
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([defaultProj]));
      localStorage.setItem(ACTIVE_PROJECT_KEY, defaultProj.metadata.id);
      return [defaultProj];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaultProj = createDefaultProject();
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([defaultProj]));
      localStorage.setItem(ACTIVE_PROJECT_KEY, defaultProj.metadata.id);
      return [defaultProj];
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return [createDefaultProject()];
  }
}

export function getProject(id: string): ElectroKitProject | null {
  const all = getAllProjects();
  return all.find((p) => p.metadata.id === id) || null;
}

export function saveProject(project: ElectroKitProject): void {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllProjects();
    project.metadata.updatedAt = new Date().toISOString();
    const idx = all.findIndex((p) => p.metadata.id === project.metadata.id);
    if (idx >= 0) {
      all[idx] = project;
    } else {
      all.push(project);
    }
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save project:', err);
  }
}

export function deleteProject(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    let all = getAllProjects();
    all = all.filter((p) => p.metadata.id !== id);
    if (all.length === 0) {
      all = [createDefaultProject()];
    }
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(all));
    const activeId = getActiveProjectId();
    if (activeId === id) {
      setActiveProjectId(all[0].metadata.id);
    }
  } catch (err) {
    console.error('Failed to delete project:', err);
  }
}

export function getActiveProjectId(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(ACTIVE_PROJECT_KEY);
  if (stored) return stored;
  const all = getAllProjects();
  if (all.length > 0) {
    const firstId = all[0].metadata.id;
    localStorage.setItem(ACTIVE_PROJECT_KEY, firstId);
    return firstId;
  }
  return '';
}

export function setActiveProjectId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function getActiveProject(): ElectroKitProject {
  const activeId = getActiveProjectId();
  const found = getProject(activeId);
  if (found) return found;
  const all = getAllProjects();
  if (all.length > 0) return all[0];
  const newProj = createDefaultProject();
  saveProject(newProj);
  setActiveProjectId(newProj.metadata.id);
  return newProj;
}

export function exportProjectToJson(project: ElectroKitProject): string {
  // Deep clone and recursively sanitize to guarantee zero credential leakage
  const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (/api[-_]?key|secret|token|password|credential/i.test(k)) {
        continue;
      }
      cleaned[k] = sanitize(v);
    }
    return cleaned;
  };
  const sanitized = sanitize(project);
  return JSON.stringify(sanitized, null, 2);
}

export function importProjectFromJson(jsonString: string): { success: boolean; project?: ElectroKitProject; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { success: false, error: 'Invalid JSON: Expected an object' };
    }
    if (!data.metadata || typeof data.metadata !== 'object' || !data.metadata.name) {
      return { success: false, error: 'Missing metadata.name in project JSON' };
    }

    // Sanitize to prevent prototype pollution and credential leakage
    const sanitize = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitize);
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        if (/api[-_]?key|secret|token|password|credential/i.test(k)) continue;
        cleaned[k] = sanitize(v);
      }
      return cleaned;
    };

    const sanitizedData = sanitize(data);

    // Ensure unique ID on import to prevent collision
    const importedId = 'proj_' + Math.random().toString(36).substring(2, 10);
    const imported: ElectroKitProject = {
      schemaVersion: '1.0.0',
      metadata: {
        ...sanitizedData.metadata,
        id: importedId,
        name: String(sanitizedData.metadata.name).trim() + ' (Imported)',
        updatedAt: new Date().toISOString(),
        tags: Array.isArray(sanitizedData.metadata.tags) ? sanitizedData.metadata.tags.map(String) : [],
      },
      requirements: Array.isArray(sanitizedData.requirements) ? sanitizedData.requirements : [],
      constraints: Array.isArray(sanitizedData.constraints) ? sanitizedData.constraints : [],
      assumptions: Array.isArray(sanitizedData.assumptions) ? sanitizedData.assumptions : [],
      targets: Array.isArray(sanitizedData.targets) ? sanitizedData.targets : [],
      designCases: Array.isArray(sanitizedData.designCases) && sanitizedData.designCases.length > 0
        ? sanitizedData.designCases
        : createDefaultProject().designCases,
      scenarios: Array.isArray(sanitizedData.scenarios) ? sanitizedData.scenarios : [],
      validationItems: Array.isArray(sanitizedData.validationItems) ? sanitizedData.validationItems : [],
      manufacturerData: Array.isArray(sanitizedData.manufacturerData) ? sanitizedData.manufacturerData : [],
      measurements: Array.isArray(sanitizedData.measurements) ? sanitizedData.measurements : [],
      notes: Array.isArray(sanitizedData.notes) ? sanitizedData.notes : [],
      revisions: Array.isArray(sanitizedData.revisions) ? sanitizedData.revisions : [],
      iterations: Array.isArray(sanitizedData.iterations) ? sanitizedData.iterations : [],
      activeCaseId: sanitizedData.activeCaseId,
    };
    saveProject(imported);
    setActiveProjectId(importedId);
    return { success: true, project: imported };
  } catch (err: any) {
    return { success: false, error: err.message || 'JSON parse error' };
  }
}

export function loadAiConfig(): AiConfig {
  const defaultConf: AiConfig = {
    provider: 'offline',
    isEnabled: false,
  };
  if (typeof window === 'undefined') return defaultConf;
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return defaultConf;
    return JSON.parse(raw);
  } catch {
    return defaultConf;
  }
}

export function saveAiConfig(config: AiConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save AI config:', err);
  }
}

export function removeAiCredentials(): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadAiConfig();
    delete current.apiKey;
    current.isEnabled = false;
    current.provider = 'offline';
    saveAiConfig(current);
  } catch (err) {
    console.error('Failed to remove AI credentials:', err);
  }
}
