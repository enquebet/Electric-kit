/**
 * ElectroKit V2 — Engineering Project Factory
 * Pristine engineering project templates for V2 Architecture
 */

import { ElectroKitProjectV2 } from '../types/project';
import { EntityIds } from '../identity/id-generator';
import { computeSnapshotDigest } from '../integrity/hasher';
import { CalculationSnapshotV2 } from '../types/calculations';
import { PcbBoardV2 } from '../types/pcb';

export type V2ProjectTemplateKey =
  | 'blank'
  | 'dcdc-buck-converter'
  | 'iot-wireless-sensor'
  | 'bms-battery-pack'
  | 'rf-transceiver-frontend';

export function createDefaultProjectV2(templateKey: V2ProjectTemplateKey = 'dcdc-buck-converter'): ElectroKitProjectV2 {
  const timestamp = new Date().toISOString();
  const projectId = EntityIds.project();
  const baselineCaseId = EntityIds.case();

  if (templateKey === 'blank') {
    const sysId = EntityIds.system();
    return {
      schemaVersion: '2.0.0',
      metadata: {
        id: projectId,
        name: 'New Hardware Design',
        description: 'Empty ElectroKit V2 engineering design workbench project.',
        projectType: 'Custom Hardware',
        domain: 'general_electrical',
        author: 'Hardware Engineer',
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'requirements_definition',
        tags: ['Hardware', 'ElectroKit-V2'],
      },
      requirements: [],
      constraints: [],
      assumptions: [],
      targets: [],
      systems: [
        {
          id: sysId,
          name: 'Primary System',
          description: 'Top-level system architecture',
          primaryDomain: 'multi_domain',
          subsystems: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      components: [],
      connections: [],
      nets: [],
      powerRails: [],
      designCases: [
        {
          id: baselineCaseId,
          name: 'Baseline Case',
          description: 'Nominal baseline design parameters',
          isBaseline: true,
          revisionNumber: 1,
          inputs: {},
          assumptionOverrides: [],
          scenarios: [],
          associatedCalculationIds: [],
          associatedSnapshotIds: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      calculations: [],
      calculationSnapshots: [],
      validationMilestones: [],
      measurements: [],
      datasheetVerifications: [],
      revisions: [
        {
          id: EntityIds.revision(),
          revisionNumber: 1,
          tag: 'Rev 0.1 Initial Draft',
          timestamp,
          author: 'Hardware Engineer',
          summary: 'Project initialized in ElectroKit V2 Workbench',
          changes: [],
          snapshotDigest: 'init_digest',
          signoffStatus: 'draft',
        },
      ],
      issues: [],
      decisions: [],
      traceabilityLinks: [],
      powerPaths: [],
      signalPaths: [],
      thermalPaths: [],
      references: [],
      operatingConditions: [],
      powerSources: [],
      powerLoads: [],
      powerSequencingRules: [],
      pcbBoards: [],
      reports: [],
      notes: [],
      activeCaseId: baselineCaseId,
    };
  }

  // DCDC Buck Converter Template (flagship power design)
  if (templateKey === 'dcdc-buck-converter') {
    const sysId = EntityIds.system();
    const subsysPowerId = EntityIds.subsystem();
    const subsysThermalId = EntityIds.subsystem();

    const railVinId = EntityIds.rail();
    const railVoutId = EntityIds.rail();
    const railGndId = EntityIds.rail();

    const compU1 = EntityIds.component(); // Controller IC
    const compQ1 = EntityIds.component(); // High-side GaN FET
    const compQ2 = EntityIds.component(); // Low-side GaN FET
    const compL1 = EntityIds.component(); // Power Inductor
    const compCout = EntityIds.component(); // Output MLCC array

    const reqVin = EntityIds.requirement();
    const reqVout = EntityIds.requirement();
    const reqIout = EntityIds.requirement();
    const reqEff = EntityIds.requirement();
    const reqRipple = EntityIds.requirement();

    const conTj = EntityIds.constraint();
    const conVinMax = EntityIds.constraint();

    const asmFsw = EntityIds.assumption();
    const asmTamb = EntityIds.assumption();

    const calcBuckId = EntityIds.calculation();
    const calcThermalId = EntityIds.calculation();

    const snapBuckBase: Omit<CalculationSnapshotV2, 'integrityDigest'> = {
      id: EntityIds.snapshot(),
      calculationId: calcBuckId,
      timestamp,
      inputs: { vinVolts: 24, voutVolts: 5.0, ioutAmps: 6.0, switchingFrequencyKhz: 500, targetRippleRatio: 0.3 },
      outputs: { requiredInductanceMicroHenries: 4.25, peakInductorCurrentAmps: 6.9, dutyCyclePercent: 20.83, outputPowerWatts: 30.0 },
      assumptions: [
        {
          id: asmFsw,
          parameter: 'Switching Frequency',
          value: 500,
          unit: 'kHz',
          classification: 'user_assumption',
          sensitivity: 'high',
          description: 'Optimized for high power density and GaN fast switching speed',
          isUserConfigurable: true,
        },
      ],
      warnings: [],
      margins: [
        {
          name: 'Inductor Saturation Headroom',
          nominalValue: 6.9,
          limitValue: 10.0,
          unit: 'A',
          marginHeadroom: 3.1,
          percentageHeadroom: 31.0,
          status: 'safe',
        },
      ],
      validationStatus: 'calculated',
      formulaSnippet: 'L_min = (V_out * (1 - D)) / (f_sw * Delta_I)',
    };
    const snapBuck: CalculationSnapshotV2 = {
      ...snapBuckBase,
      integrityDigest: computeSnapshotDigest(snapBuckBase),
    };

    const linkReqToCalc = EntityIds.traceabilityLink();
    const linkCompToRail = EntityIds.traceabilityLink();

    const boardId = EntityIds.board();
    const layerTopId = EntityIds.layer();
    const layerGndId = EntityIds.layer();
    const layerPwrId = EntityIds.layer();
    const layerBotId = EntityIds.layer();

    const fpU1Id = EntityIds.footprint();
    const fpQ1Id = EntityIds.footprint();
    const fpL1Id = EntityIds.footprint();

    const traceVinId = EntityIds.trace();
    const traceSwId = EntityIds.trace();
    const traceVoutId = EntityIds.trace();

    const via1Id = EntityIds.via();
    const via2Id = EntityIds.via();
    const via3Id = EntityIds.via();
    const via4Id = EntityIds.via();

    const buckBoard: PcbBoardV2 = {
      id: boardId,
      name: '24V-to-5V GaN Power Stage Evaluation Board',
      revision: 'Rev 1.0',
      unit: 'mm',
      outline: {
        type: 'rounded_rectangle',
        widthMm: 60.0,
        heightMm: 40.0,
        cornerRadiusMm: 3.0,
        thicknessMm: 1.6,
        cutouts: [
          { id: EntityIds.cutout(), name: 'Mounting Hole Top-Left (M2.5)', type: 'hole', center: { x: 3.0, y: 3.0 }, radiusMm: 1.3, plated: true },
          { id: EntityIds.cutout(), name: 'Mounting Hole Top-Right (M2.5)', type: 'hole', center: { x: 57.0, y: 3.0 }, radiusMm: 1.3, plated: true },
          { id: EntityIds.cutout(), name: 'Mounting Hole Bottom-Left (M2.5)', type: 'hole', center: { x: 3.0, y: 37.0 }, radiusMm: 1.3, plated: true },
          { id: EntityIds.cutout(), name: 'Mounting Hole Bottom-Right (M2.5)', type: 'hole', center: { x: 57.0, y: 37.0 }, radiusMm: 1.3, plated: true },
        ],
      },
      stackup: {
        id: EntityIds.stackup(),
        name: 'Standard 4-Layer 1.6mm FR-4 Power Stackup',
        layerCount: 4,
        copperLayers: [
          { id: layerTopId, index: 1, name: 'L1_TOP_SIGNAL', layerClass: 'electrical', electricalType: 'signal', side: 'top', copperThicknessOz: 1.0, copperThicknessMm: 0.035, isRoutable: true, allowsPlanes: true },
          { id: layerGndId, index: 2, name: 'L2_GND_PLANE', layerClass: 'electrical', electricalType: 'ground_plane', side: 'inner', copperThicknessOz: 1.0, copperThicknessMm: 0.035, isRoutable: false, allowsPlanes: true },
          { id: layerPwrId, index: 3, name: 'L3_POWER_PLANE', layerClass: 'electrical', electricalType: 'power_plane', side: 'inner', copperThicknessOz: 1.0, copperThicknessMm: 0.035, isRoutable: false, allowsPlanes: true },
          { id: layerBotId, index: 4, name: 'L4_BOT_SIGNAL', layerClass: 'electrical', electricalType: 'signal', side: 'bottom', copperThicknessOz: 1.0, copperThicknessMm: 0.035, isRoutable: true, allowsPlanes: true },
        ],
        dielectricLayers: [
          { id: 'diel_1', name: 'Prepreg 2116', type: 'prepreg', materialName: 'FR-4 High-Tg', dielectricConstantEr: 4.3, lossTangent: 0.02, thicknessMm: 0.2 },
          { id: 'diel_2', name: 'FR-4 Core', type: 'core', materialName: 'FR-4 Standard', dielectricConstantEr: 4.4, lossTangent: 0.02, thicknessMm: 1.06 },
          { id: 'diel_3', name: 'Prepreg 2116', type: 'prepreg', materialName: 'FR-4 High-Tg', dielectricConstantEr: 4.3, lossTangent: 0.02, thicknessMm: 0.2 },
        ],
        totalNominalThicknessMm: 1.6,
        symmetrical: true,
      },
      fabricationProfile: {
        id: 'fab_profile_6_6',
        name: 'Standard 6/6 mil FR-4 Manufacturing Profile',
        source: 'manufacturer_reference',
        minTraceWidthMm: 0.152,
        minTraceSpacingMm: 0.152,
        minDrillDiameterMm: 0.3,
        minViaPadDiameterMm: 0.6,
        minAnnularRingMm: 0.127,
        minCopperToEdgeMm: 0.254,
        minSolderMaskBridgeMm: 0.1,
        maxLayerCount: 8,
      },
      footprints: [
        {
          id: fpU1Id,
          name: 'VQFN-40_6x6mm_P0.5mm',
          packageType: 'VQFN-40',
          bodyWidthMm: 6.0,
          bodyLengthMm: 6.0,
          courtyardWidthMm: 7.2,
          courtyardLengthMm: 7.2,
          pads: Array.from({ length: 40 }, (_, i) => ({
            id: `pad_u1_${i + 1}`,
            padNumber: String(i + 1),
            type: 'smd' as const,
            shape: 'rectangular' as const,
            layerId: layerTopId,
            offsetXFromCenterMm: (i < 10 ? -2.9 : i < 20 ? -2.25 + (i - 10) * 0.5 : i < 30 ? 2.9 : 2.25 - (i - 30) * 0.5),
            offsetYFromCenterMm: (i < 10 ? -2.25 + i * 0.5 : i < 20 ? 2.9 : i < 30 ? 2.25 - (i - 20) * 0.5 : -2.9),
            widthMm: 0.25,
            heightMm: 0.8,
            thermalRelief: false,
          })),
        },
        {
          id: fpQ1Id,
          name: 'EPC2045_LGA-12',
          packageType: 'LGA-12',
          bodyWidthMm: 2.6,
          bodyLengthMm: 1.5,
          courtyardWidthMm: 3.2,
          courtyardLengthMm: 2.1,
          pads: [
            { id: 'pad_q1_d1', padNumber: 'D1', type: 'smd' as const, shape: 'rectangular' as const, layerId: layerTopId, offsetXFromCenterMm: -0.8, offsetYFromCenterMm: 0, widthMm: 0.4, heightMm: 1.2, thermalRelief: true },
            { id: 'pad_q1_s1', padNumber: 'S1', type: 'smd' as const, shape: 'rectangular' as const, layerId: layerTopId, offsetXFromCenterMm: 0.8, offsetYFromCenterMm: 0, widthMm: 0.4, heightMm: 1.2, thermalRelief: true },
            { id: 'pad_q1_g', padNumber: 'G', type: 'smd' as const, shape: 'rectangular' as const, layerId: layerTopId, offsetXFromCenterMm: 0, offsetYFromCenterMm: 0.5, widthMm: 0.3, heightMm: 0.3, thermalRelief: false },
          ],
        },
        {
          id: fpL1Id,
          name: 'Coilcraft_XGL6060_PowerInductor',
          packageType: 'IND-6060',
          bodyWidthMm: 6.5,
          bodyLengthMm: 6.5,
          courtyardWidthMm: 7.5,
          courtyardLengthMm: 7.5,
          pads: [
            { id: 'pad_l1_1', padNumber: '1', type: 'smd' as const, shape: 'rectangular' as const, layerId: layerTopId, offsetXFromCenterMm: -2.5, offsetYFromCenterMm: 0, widthMm: 1.8, heightMm: 4.0, thermalRelief: true },
            { id: 'pad_l1_2', padNumber: '2', type: 'smd' as const, shape: 'rectangular' as const, layerId: layerTopId, offsetXFromCenterMm: 2.5, offsetYFromCenterMm: 0, widthMm: 1.8, heightMm: 4.0, thermalRelief: true },
          ],
        },
      ],
      placements: [
        { id: EntityIds.placement(), componentId: compU1, footprintId: fpU1Id, refDes: 'U1', xMm: 18.0, yMm: 20.0, rotationDeg: 0, side: 'top', placementStatus: 'fixed' },
        { id: EntityIds.placement(), componentId: compQ1, footprintId: fpQ1Id, refDes: 'Q1', xMm: 28.0, yMm: 25.0, rotationDeg: 0, side: 'top', placementStatus: 'fixed' },
        { id: EntityIds.placement(), componentId: compQ2, footprintId: fpQ1Id, refDes: 'Q2', xMm: 28.0, yMm: 15.0, rotationDeg: 0, side: 'top', placementStatus: 'fixed' },
        { id: EntityIds.placement(), componentId: compL1, footprintId: fpL1Id, refDes: 'L1', xMm: 42.0, yMm: 20.0, rotationDeg: 0, side: 'top', placementStatus: 'fixed' },
      ],
      traces: [
        {
          id: traceVinId,
          netId: railVinId,
          name: 'VIN_24V_POWER_TRUNK',
          segments: [
            { id: EntityIds.traceSegment(), layerId: layerTopId, startX: 5.0, startY: 25.0, endX: 26.0, endY: 25.0, widthMm: 2.0, lengthMm: 21.0 },
          ],
          totalLengthMm: 21.0,
          averageWidthMm: 2.0,
          viaIds: [],
          impedanceClass: 'high_current',
          calculatedCurrentCapacityAmps: 5.0,
          status: 'routed',
        },
        {
          id: traceSwId,
          netId: 'net_sw_node',
          name: 'SW_NODE_HIGH_CURRENT',
          segments: [
            { id: EntityIds.traceSegment(), layerId: layerTopId, startX: 30.0, startY: 20.0, endX: 39.5, endY: 20.0, widthMm: 3.0, lengthMm: 9.5 },
          ],
          totalLengthMm: 9.5,
          averageWidthMm: 3.0,
          viaIds: [],
          impedanceClass: 'high_current',
          calculatedCurrentCapacityAmps: 7.0,
          status: 'routed',
        },
        {
          id: traceVoutId,
          netId: railVoutId,
          name: 'VOUT_5V_OUTPUT_BUS',
          segments: [
            { id: EntityIds.traceSegment(), layerId: layerTopId, startX: 44.5, startY: 20.0, endX: 56.0, endY: 20.0, widthMm: 2.5, lengthMm: 11.5 },
          ],
          totalLengthMm: 11.5,
          averageWidthMm: 2.5,
          viaIds: [],
          impedanceClass: 'high_current',
          calculatedCurrentCapacityAmps: 6.0,
          status: 'routed',
        },
      ],
      vias: [
        { id: via1Id, netId: railGndId, type: 'through', xMm: 28.0, yMm: 13.0, startLayerId: layerTopId, endLayerId: layerBotId, drillDiameterMm: 0.3, padDiameterMm: 0.6, annularRingMm: 0.15 },
        { id: via2Id, netId: railGndId, type: 'through', xMm: 29.0, yMm: 13.0, startLayerId: layerTopId, endLayerId: layerBotId, drillDiameterMm: 0.3, padDiameterMm: 0.6, annularRingMm: 0.15 },
        { id: via3Id, netId: railGndId, type: 'through', xMm: 28.0, yMm: 12.0, startLayerId: layerTopId, endLayerId: layerBotId, drillDiameterMm: 0.3, padDiameterMm: 0.6, annularRingMm: 0.15 },
        { id: via4Id, netId: railGndId, type: 'through', xMm: 29.0, yMm: 12.0, startLayerId: layerTopId, endLayerId: layerBotId, drillDiameterMm: 0.3, padDiameterMm: 0.6, annularRingMm: 0.15 },
      ],
      viaArrays: [
        {
          id: EntityIds.viaArray(),
          name: 'Q2 Low-Side GaN Thermal Via Matrix',
          purpose: 'thermal_dissipation',
          netId: railGndId,
          viaIds: [via1Id, via2Id, via3Id, via4Id],
          count: 4,
          pitchMm: 1.0,
          rows: 2,
          columns: 2,
        },
      ],
      copperZones: [
        {
          id: EntityIds.copperZone(),
          name: 'L2_GND_SOLID_PLANE',
          netId: railGndId,
          layerId: layerGndId,
          polygonPoints: [{ x: 1.0, y: 1.0 }, { x: 59.0, y: 1.0 }, { x: 59.0, y: 39.0 }, { x: 1.0, y: 39.0 }],
          clearanceMm: 0.254,
          priority: 1,
          connectionType: 'solid',
          areaSquareMm: 2204.0,
        },
        {
          id: EntityIds.copperZone(),
          name: 'L3_VOUT_POWER_ISLAND',
          netId: railVoutId,
          layerId: layerPwrId,
          polygonPoints: [{ x: 40.0, y: 10.0 }, { x: 58.0, y: 10.0 }, { x: 58.0, y: 30.0 }, { x: 40.0, y: 30.0 }],
          clearanceMm: 0.254,
          priority: 2,
          connectionType: 'thermal_relief',
          areaSquareMm: 360.0,
        },
      ],
      differentialPairs: [
        {
          id: EntityIds.differentialPair(),
          name: 'DIFF_ISENSE_PAIR',
          positiveNetId: 'net_csp',
          negativeNetId: 'net_csn',
          targetDifferentialImpedanceOhms: 100.0,
          tolerancePercent: 10.0,
          layerId: layerTopId,
          traceWidthMm: 0.2,
          traceSpacingMm: 0.2,
          totalLengthPositiveMm: 14.5,
          totalLengthNegativeMm: 14.52,
          skewLengthMm: 0.02,
          skewDelayPicoseconds: 0.13,
          maxAllowableSkewMm: 0.25,
          calculatedDifferentialImpedanceOhms: 98.4,
          status: 'PASS',
        },
      ],
      lengthConstraints: [
        {
          id: EntityIds.lengthConstraint(),
          name: 'Gate Drive Loop Length Constraint',
          minLengthMm: 1.0,
          maxLengthMm: 10.0,
          actualLengthMm: 5.2,
          deltaMm: 0,
          status: 'PASS',
        },
      ],
      impedanceConstraints: [
        {
          id: EntityIds.impedanceConstraint(),
          name: '50-Ohm Analog Clock / Trigger Line',
          netId: 'net_sync_clk',
          layerId: layerTopId,
          targetImpedanceOhms: 50.0,
          tolerancePercent: 10.0,
          geometryType: 'microstrip',
          traceWidthMm: 0.35,
          calculatedImpedanceOhms: 50.8,
          status: 'PASS',
        },
      ],
      keepouts: [
        {
          id: EntityIds.keepout(),
          name: 'High-Voltage Creepage Isolation Boundary',
          type: 'all',
          layerId: 'all_layers',
          polygonPoints: [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 1.0 }, { x: 0, y: 1.0 }],
        },
      ],
      testPoints: [
        { id: EntityIds.pad(), name: 'TP_VOUT_5V', netId: railVoutId, padId: 'pad_tp_vout', xMm: 55.0, yMm: 20.0, layer: 'top' },
        { id: EntityIds.pad(), name: 'TP_SW_NODE', netId: 'net_sw_node', padId: 'pad_tp_sw', xMm: 35.0, yMm: 20.0, layer: 'top' },
      ],
      drcFindings: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return {
      schemaVersion: '2.0.0',
      metadata: {
        id: projectId,
        name: 'High-Efficiency Synchronous Buck Converter (24V to 5V 6A)',
        description: 'Multi-rail GaN-based power supply stage for industrial instrumentation, featuring low switching losses and compact magnetic footprint.',
        projectType: 'Power Supply',
        domain: 'power_electronics',
        author: 'Lead Power Electronics Engineer',
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'architecture_sizing',
        engineeringObjective: 'Deliver 30W regulated 5.0V with >94% peak efficiency and Tj < 95°C at 50°C ambient.',
        designTarget: 'Ripple < 25 mVpp, peak inductor current saturation margin > 30%.',
        targetEnclosure: 'Molded aluminum enclosure with conduction cooling to chassis',
        operatingEnvironment: 'Industrial IP40, -20°C to +50°C ambient',
        targetStandardCertifications: ['IEC 61000-4-5', 'CISPR 32 Class B'],
        tags: ['Power', 'GaN', 'Synchronous Buck', 'High-Efficiency', 'SMPS'],
      },
      requirements: [
        {
          id: reqVout,
          name: 'Regulated Output Voltage',
          category: 'electrical',
          description: 'Stable output voltage across 10% to 100% rated load',
          nominalValue: 5.0,
          minValue: 4.9,
          maxValue: 5.1,
          unit: 'V',
          tolerancePercent: 2.0,
          priority: 'critical',
          verificationMethod: 'calculation',
          verificationStatus: 'passed',
          satisfiedByCalculationIds: [calcBuckId],
          satisfiedByMeasurementIds: [],
          source: 'customer',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: reqVin,
          name: 'DC Input Voltage Range',
          category: 'electrical',
          description: 'Nominal 24V supply with 18V-30V operating range',
          nominalValue: 24.0,
          minValue: 18.0,
          maxValue: 30.0,
          unit: 'V',
          tolerancePercent: 5.0,
          priority: 'critical',
          verificationMethod: 'calculation',
          verificationStatus: 'passed',
          satisfiedByCalculationIds: [calcBuckId],
          satisfiedByMeasurementIds: [],
          source: 'customer',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: reqIout,
          name: 'Maximum Continuous Output Current',
          category: 'power',
          description: 'Maximum sustained continuous current capability',
          nominalValue: 6.0,
          minValue: 0,
          maxValue: 6.0,
          unit: 'A',
          priority: 'critical',
          verificationMethod: 'calculation',
          verificationStatus: 'passed',
          satisfiedByCalculationIds: [calcBuckId],
          satisfiedByMeasurementIds: [],
          source: 'customer',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: reqEff,
          name: 'Full-Load Conversion Efficiency',
          category: 'power',
          description: 'Minimum full load efficiency at 24V nominal input',
          nominalValue: 94.0,
          minValue: 92.5,
          unit: '%',
          priority: 'high',
          verificationMethod: 'calculation',
          verificationStatus: 'passed',
          satisfiedByCalculationIds: [calcBuckId],
          satisfiedByMeasurementIds: [],
          source: 'standard',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: reqRipple,
          name: 'Output Voltage Ripple (Peak-to-Peak)',
          category: 'electrical',
          description: 'Maximum permissible high-frequency switching ripple',
          nominalValue: 25.0,
          maxValue: 35.0,
          unit: 'mV',
          priority: 'medium',
          verificationMethod: 'simulation',
          verificationStatus: 'in_progress',
          satisfiedByCalculationIds: [],
          satisfiedByMeasurementIds: [],
          source: 'user',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      constraints: [
        {
          id: conTj,
          name: 'Maximum Semiconductor Junction Temperature',
          category: 'thermal',
          value: 110,
          unit: '°C',
          limitType: 'max',
          marginThresholdPercent: 15,
          governingStandard: 'IPC-9592B Class II Power Conversion',
          notes: 'Safe derating for long MTTF',
        },
        {
          id: conVinMax,
          name: 'Maximum Sustained Input Voltage',
          category: 'electrical',
          value: 36,
          unit: 'V',
          limitType: 'max',
          notes: 'Tolerate 24V bus load dump transients up to 36V',
        },
      ],
      assumptions: [
        {
          id: asmFsw,
          parameter: 'Switching Frequency',
          value: 500,
          unit: 'kHz',
          classification: 'user_assumption',
          sensitivity: 'high',
          description: 'Optimized for high power density and GaN fast switching speed',
          isUserConfigurable: true,
          applicableWorkflow: 'dcdc-buck-sizing',
        },
        {
          id: asmTamb,
          parameter: 'Maximum Ambient Operating Temperature',
          value: 50,
          unit: '°C',
          classification: 'environmental_boundary',
          sensitivity: 'high',
          description: 'Conservative worst-case industrial ambient inside enclosed chassis',
          isUserConfigurable: true,
          applicableWorkflow: 'thermal-system-budget',
        },
      ],
      targets: [
        {
          id: EntityIds.target(),
          parameter: 'Board Footprint Area',
          targetValue: 2400,
          unit: 'mm²',
          tolerancePercent: 10,
          priority: 'medium',
          notes: 'Target 40mm x 60mm power subsystem section',
        },
      ],
      systems: [
        {
          id: sysId,
          name: 'Synchronous Buck Regulator Architecture',
          description: 'Complete 24V->5V GaN power conversion system with integrated thermal conduction network',
          primaryDomain: 'power',
          subsystems: [
            {
              id: subsysPowerId,
              parentSystemId: sysId,
              name: 'Power Conversion Stage',
              description: 'Half-bridge GaN FET stage, power inductor, and decoupling capacitor network',
              domain: 'power',
              componentIds: [compU1, compQ1, compQ2, compL1, compCout],
            },
            {
              id: subsysThermalId,
              parentSystemId: sysId,
              name: 'Thermal Dissipation Network',
              description: 'PCB copper heatsink pads, thermal vias, and chassis conduction plane',
              domain: 'thermal',
              componentIds: [compQ1, compQ2, compL1],
            },
          ],
          powerArchitecture: {
            rails: [],
            conversionStages: [
              {
                id: EntityIds.converter(),
                name: 'Synchronous Buck Stage',
                topology: 'buck',
                inputRailId: railVinId,
                outputRailId: railVoutId,
                expectedEfficiencyPercent: 94.5,
                maxOutputCurrentAmps: 6.0,
                switchingFrequencyKhz: 500,
                thermalDissipationWatts: 1.74,
                associatedComponentIds: [compQ1, compQ2, compL1],
                associatedCalculationId: calcBuckId,
              },
            ],
            totalPayloadPowerWatts: 30.0,
            totalInputPowerWatts: 31.74,
            cascadedEfficiencyPercent: 94.5,
          },
          thermalSystem: {
            nodes: [
              {
                id: EntityIds.thermalNode(),
                name: 'Q1 GaN Switch Junction',
                classification: 'junction',
                heatDissipationWatts: 0.95,
                maxAllowedTemperatureC: 125,
                calculatedTemperatureC: 78.5,
                thermalMarginC: 46.5,
                associatedComponentId: compQ1,
              },
              {
                id: EntityIds.thermalNode(),
                name: 'Enclosure Internal Air',
                classification: 'internal_air',
                heatDissipationWatts: 1.74,
                maxAllowedTemperatureC: 70,
                calculatedTemperatureC: 56.2,
                thermalMarginC: 13.8,
              },
            ],
            resistancePaths: [
              {
                id: EntityIds.thermalPath(),
                fromNodeId: 'node_q1',
                toNodeId: 'node_case',
                resistanceCPerW: 4.5,
                interfaceMaterial: 'Thermal Interface Pad (3.0 W/m-K)',
              },
            ],
            ambientTemperatureC: 50,
            maxEnclosureRiseC: 10,
            status: 'conservative',
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      components: [
        {
          id: compU1,
          refDes: 'U1',
          name: 'Synchronous Buck PWM Controller',
          category: 'power_management',
          description: 'High frequency synchronous PWM controller with integrated GaN gate drivers',
          manufacturer: 'Texas Instruments',
          partNumber: 'LM5143-Q1',
          packageType: 'VQFN-40',
          status: 'selected',
          parametricRatings: {
            vinMax: { parameter: 'Max Input Voltage', value: 65, unit: 'V' },
            fswMax: { parameter: 'Max Fsw', value: 1000, unit: 'kHz' },
          },
          pins: [],
          subsystemId: subsysPowerId,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: compQ1,
          refDes: 'Q1',
          name: 'High-Side GaN Power FET',
          category: 'semiconductor_transistor',
          description: '100V 30A Enhancement-mode Gallium Nitride Transistor',
          manufacturer: 'EPC',
          partNumber: 'EPC2045',
          packageType: 'LGA-12',
          status: 'selected',
          parametricRatings: {
            rdsOn: { parameter: 'RDS(on) typical', value: 5.6, unit: 'mΩ' },
            vdsMax: { parameter: 'VDS Breakdown', value: 100, unit: 'V' },
          },
          pins: [],
          thermalProperties: { rThetaJC: 0.8, rThetaJA: 32, maxJunctionTempC: 150, typicalPowerDissipationWatts: 0.95 },
          subsystemId: subsysPowerId,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: compL1,
          refDes: 'L1',
          name: 'Power Choke Inductor',
          category: 'passive_inductor',
          description: 'Shielded composite metal alloy power inductor 4.7µH 11A',
          manufacturer: 'Coilcraft',
          partNumber: 'XAL7030-472MEC',
          packageType: 'SMD-7030',
          status: 'selected',
          parametricRatings: {
            inductance: { parameter: 'Inductance nominal', value: 4.7, unit: 'µH' },
            isat: { parameter: 'Saturation Current', value: 11.2, unit: 'A' },
            dcr: { parameter: 'DC Resistance Max', value: 18.5, unit: 'mΩ' },
          },
          pins: [],
          subsystemId: subsysPowerId,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      connections: [],
      nets: [
        {
          id: EntityIds.net(),
          name: 'VIN_24V',
          netClass: 'power_rail',
          nominalVoltage: 24.0,
          maxCurrentAmps: 2.0,
          railId: railVinId,
        },
        {
          id: EntityIds.net(),
          name: 'VOUT_5V',
          netClass: 'power_rail',
          nominalVoltage: 5.0,
          maxCurrentAmps: 6.0,
          railId: railVoutId,
        },
        {
          id: EntityIds.net(),
          name: 'GND',
          netClass: 'ground',
          nominalVoltage: 0.0,
          maxCurrentAmps: 8.0,
          railId: railGndId,
        },
      ],
      powerRails: [
        {
          id: railVinId,
          name: 'VIN_24V',
          type: 'regulated_dc',
          nominalVoltage: 24.0,
          minVoltage: 18.0,
          maxVoltage: 32.0,
          maxCurrentAmps: 2.0,
          notes: 'Main system DC bus input',
        },
        {
          id: railVoutId,
          name: 'VOUT_5V',
          type: 'regulated_dc',
          nominalVoltage: 5.0,
          minVoltage: 4.9,
          maxVoltage: 5.1,
          maxCurrentAmps: 6.0,
          targetRippleMilliVolts: 25,
          notes: 'Regulated payload supply rail',
        },
        {
          id: railGndId,
          name: 'GND',
          type: 'regulated_dc',
          nominalVoltage: 0.0,
          minVoltage: 0.0,
          maxVoltage: 0.0,
          maxCurrentAmps: 8.0,
        },
      ],
      designCases: [
        {
          id: baselineCaseId,
          name: 'Baseline: 24V to 5V Synchronous Buck',
          description: 'Nominal operating point at 500 kHz with EPC2045 GaN FETs and 4.7µH inductor',
          isBaseline: true,
          revisionNumber: 1,
          inputs: { vin: 24, vout: 5, iout: 6, fsw: 500 },
          assumptionOverrides: [],
          scenarios: [
            {
              id: EntityIds.scenario(),
              caseId: baselineCaseId,
              name: 'Nominal Operating Point (24V in, 6A out, 25°C)',
              type: 'nominal',
              description: 'Standard bench test condition',
              environmentalOverrides: { ambientTemperatureC: 25, inputVoltageV: 24, loadCurrentA: 6 },
              parameterOverrides: {},
              resultsSummary: { overallVerdict: 'pass', worstMarginHeadroom: 31.0, limitingFactor: 'Inductor Saturation' },
              createdAt: timestamp,
            },
            {
              id: EntityIds.scenario(),
              caseId: baselineCaseId,
              name: 'Worst-Case Thermal & High-Line (32V in, 6A out, 50°C)',
              type: 'worst_case_max',
              description: 'Maximum stress test under high line and maximum ambient enclosure temperature',
              environmentalOverrides: { ambientTemperatureC: 50, inputVoltageV: 32, loadCurrentA: 6 },
              parameterOverrides: {},
              resultsSummary: { overallVerdict: 'pass', worstMarginHeadroom: 22.4, limitingFactor: 'Q1 GaN Switch Temp' },
              createdAt: timestamp,
            },
          ],
          associatedCalculationIds: [calcBuckId],
          associatedSnapshotIds: [snapBuck.id],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      calculations: [
        {
          id: calcBuckId,
          toolSlug: 'dcdc-buck-converter',
          engineId: 'buck-converter-sizing',
          name: 'Inductor & Capacitor Sizing Calculation',
          category: 'power',
          status: 'clean',
          inputs: snapBuck.inputs,
          outputs: snapBuck.outputs,
          assumptions: snapBuck.assumptions,
          margins: snapBuck.margins,
          warnings: [],
          formulaReferences: ['L = (Vout * (Vin - Vout)) / (Vin * fsw * Delta_IL)', 'Cout = Delta_IL / (8 * fsw * Delta_Vout)'],
          boundRequirementIds: [reqVout, reqIout, reqEff],
          boundComponentIds: [compQ1, compL1],
          boundRailIds: [railVinId, railVoutId],
          latestSnapshotId: snapBuck.id,
          lastCalculatedAt: timestamp,
        },
      ],
      calculationSnapshots: [snapBuck],
      validationMilestones: [
        {
          id: EntityIds.validation(),
          title: 'Bench Efficiency & Thermal Measurement',
          category: 'power_efficiency',
          status: 'unvalidated',
          hardwareValidationRequired: true,
          assignedEngineer: 'Hardware Lab Tech',
          associatedRequirementIds: [reqEff],
          associatedMeasurementIds: [],
        },
      ],
      measurements: [],
      datasheetVerifications: [
        {
          id: EntityIds.datasheetVer(),
          componentId: compQ1,
          componentRef: 'Q1',
          parameter: 'RDS(on) max at 25°C',
          datasheetTyp: 5.6,
          datasheetMax: 7.0,
          unit: 'mΩ',
          manufacturer: 'EPC',
          partNumber: 'EPC2045',
          datasheetUrl: 'https://epc-co.com/epc/products/gan-fets-and-ics/epc2045',
          verifiedBy: 'Senior Engineer',
          verifiedAt: timestamp,
          status: 'verified',
        },
      ],
      revisions: [
        {
          id: EntityIds.revision(),
          revisionNumber: 1,
          tag: 'Rev A.0 Architecture Freeze',
          timestamp,
          author: 'Lead Power Electronics Engineer',
          summary: 'Baseline architecture established with GaN half-bridge and 500 kHz magnetic sizing',
          changes: [],
          snapshotDigest: snapBuck.integrityDigest,
          signoffStatus: 'approved',
        },
      ],
      issues: [],
      decisions: [
        {
          id: EntityIds.decision(),
          title: 'Select GaN FET over Silicon MOSFET for Synchronous Stage',
          statement: 'Use EPC2045 GaN transistor in place of conventional Si-MOSFET to minimize gate charge and reverse recovery losses.',
          context: 'At 500 kHz switching frequency, Silicon body-diode Qrr causes unacceptable 2.1W switching loss penalty.',
          optionsConsidered: [
            { id: 'opt_1', title: 'Silicon MOSFET (Infineon BSC0902NS)', description: 'Low cost but high Qrr', pros: ['Cheap', 'Mature supply chain'], cons: ['Excessive switching losses at 500 kHz'] },
            { id: 'opt_2', title: 'EPC2045 GaN FET', description: 'Zero reverse recovery and ultra-low Qg', pros: ['Near zero Qrr', '94.5% efficiency achievable', 'Small footprint'], cons: ['Sensitive gate drive layout requirements'] },
          ],
          chosenOptionId: 'opt_2',
          tradeoffsSummary: 'GaN requires strict gate loop DRC, but eliminates 1.6W of thermal dissipation, allowing a 50% smaller heatsink.',
          evidenceSnapshotIds: [snapBuck.id],
          decisionMaker: 'Lead Power Electronics Engineer',
          decidedAt: timestamp,
          status: 'approved',
        },
      ],
      traceabilityLinks: [
        {
          id: linkReqToCalc,
          sourceId: calcBuckId,
          sourceType: 'calculation',
          targetId: reqVout,
          targetType: 'requirement',
          relationship: 'satisfies',
          rationale: 'Calculation proves Vout satisfies 5.0V +/- 2% requirement with designated inductor sizing',
          createdAt: timestamp,
        },
        {
          id: linkCompToRail,
          sourceId: railVoutId,
          sourceType: 'rail',
          targetId: compL1,
          targetType: 'component',
          relationship: 'connects_to',
          rationale: 'Power inductor connects switch node to VOUT rail filter',
          createdAt: timestamp,
        },
      ],
      powerPaths: [
        {
          id: EntityIds.powerPath(),
          name: '24V to 5V Main Power Conversion Path',
          description: 'Power flow from VIN 24V supply through synchronous GaN buck stage to 5V load',
          sourceComponentId: compU1,
          stageComponentIds: [compQ1, compL1],
          destinationComponentId: compL1,
          associatedRailId: railVoutId,
          requirements: [reqVout, reqEff],
          calculationIds: [calcBuckId],
          snapshotIds: [snapBuck.id],
          expectedEfficiencyPercent: 94.5,
          maxCurrentAmps: 6.0,
        },
      ],
      signalPaths: [],
      thermalPaths: [
        {
          id: EntityIds.thermalPath(),
          name: 'Q1 GaN Junction to Ambient Thermal Path',
          description: 'Heat dissipation path from GaN FET junction through thermal vias and PCB copper plane to ambient',
          sourceNodeOrComponentId: compQ1,
          stageIds: ['thnode_pcb_plane'],
          destinationNodeOrComponentId: 'thnode_ambient',
          thermalInterfaceMaterial: 'Direct Soldered LGA Pad with 1oz FR4 Copper',
          totalResistanceCPerW: 32.8,
          relatedComponentIds: [compQ1],
        },
      ],
      references: [
        {
          id: EntityIds.reference(),
          type: 'datasheet',
          title: 'EPC2045 100V GaN FET Datasheet',
          publisher: 'Efficient Power Conversion (EPC)',
          identifier: 'EPC2045-DS',
          url: 'https://epc-co.com/epc/products/gan-fets-and-ics/epc2045',
          revision: 'Rev 3.0',
          date: '2023-01-15',
          manufacturerPartNumber: 'EPC2045',
          notes: 'Primary switching device specifications',
        },
        {
          id: EntityIds.reference(),
          type: 'datasheet',
          title: 'LM5143-Q1 Synchronous Buck Controller Datasheet',
          publisher: 'Texas Instruments',
          identifier: 'SNVSB63A',
          url: 'https://www.ti.com/lit/ds/symlink/lm5143-q1.pdf',
          revision: 'Rev A',
          date: '2022-08-10',
          manufacturerPartNumber: 'LM5143-Q1',
          notes: 'Wide Vin dual synchronous buck controller',
        },
      ],
      operatingConditions: [
        {
          id: EntityIds.operatingCondition(),
          name: 'Nominal Lab Bench Conditions',
          ambientTemperatureC: 25.0,
          inputVoltageV: 24.0,
          loadCurrentA: 6.0,
          frequencyHz: 500000,
          airflowLfm: 0,
        },
      ],
      powerSources: [
        {
          id: EntityIds.powerSource(),
          name: 'Main 24V DC Bench Supply',
          sourceType: 'dc_input',
          nominalVoltage: 24.0,
          minVoltage: 18.0,
          maxVoltage: 30.0,
          availableCurrentAmps: 5.0,
          availablePowerWatts: 120.0,
          sourceImpedanceOhms: 0.05,
          outputRailId: railVinId,
          status: 'active',
          requirements: [reqVin],
          notes: 'Standard lab DC power supply providing 24V nominal bus',
        },
      ],
      powerLoads: [
        {
          id: EntityIds.powerLoad(),
          name: '5V Active System Payload',
          componentId: compL1,
          railId: railVoutId,
          nominalVoltage: 5.0,
          minVoltage: 4.85,
          maxVoltage: 5.15,
          nominalCurrentAmps: 6.0,
          peakCurrentAmps: 7.5,
          dutyCycleFraction: 1.0,
          nominalPowerWatts: 30.0,
          peakPowerWatts: 37.5,
          operatingState: 'active',
          priority: 'critical',
          notes: 'Primary 5V load absorbing 30W nominal power',
        },
      ],
      powerSequencingRules: [
        {
          id: EntityIds.sequencingRule(),
          name: 'VIN Good before VOUT Enable',
          predecessorRailId: railVinId,
          successorRailId: railVoutId,
          dependencyType: 'power_good',
          requiredPredecessorVoltagePercent: 90.0,
          delayMilliSeconds: 5.0,
          notes: 'Ensures controller input UVLO threshold is passed before switching gate drive is enabled',
        },
      ],
      reports: [
        {
          id: EntityIds.report(),
          title: '24V to 5V Synchronous Buck Engineering Verification Report',
          scope: 'full_system',
          includeRequirements: true,
          includeCalculations: true,
          includeMeasurements: true,
          includeDecisions: true,
          includeTraceabilityMatrix: true,
          targetCaseIds: [baselineCaseId],
          signoffStatus: 'draft',
        },
      ],
      notes: [
        {
          id: EntityIds.note(),
          title: 'Gate Drive Layout Guideline',
          body: 'Ensure high-side bootstrap loop trace length < 3mm to prevent high dV/dt inductive overshoot on GaN gate.',
          timestamp,
          tag: 'layout',
        },
      ],
      pcbBoards: [buckBoard],
      activeBoardId: buckBoard.id,
      activeCaseId: baselineCaseId,
    };
  }

  // Fallback to blank if unknown
  return createDefaultProjectV2('blank');
}
