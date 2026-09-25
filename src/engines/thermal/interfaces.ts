/**
 * ElectroKit — Thermal Engineering Subsystem
 * Module D: Thermal Interface Materials (TIM) & Contact Mechanics (Tools 31 - 40)
 *
 * Implements:
 * 31. TIM Thermal Resistance (Rθtim = BLT / (k·A) + R_contact)
 * 32. TIM Contact Resistance & Thickness (BLT & microscopic asperities)
 * 33. TIM Contact Pressure Effect (Clamping pressure vs BLT)
 * 34. Thermal Grease vs Pad Comparison (Preset library & tradeoff metrics)
 * 35. Phase Change Material Modeling (Solid vs Liquid phase conductivity)
 * 36. Insulating Washer Resistance (Mica, Sil-Pad, Kapton, Al2O3 isolation)
 * 37. Surface Roughness / Flatness Impact (Ra, voids, effective gap)
 * 38. Grease Pump-Out / Aging Derating (Cycling degradation model)
 * 39. Interface Heat Flux (q" = P / A, hotspot threshold analysis)
 * 40. Multi-Layer TIM Stackup (Die → TIM1 → Spreader → TIM2 → Sink)
 */

export interface TimPreset {
  id: string;
  name: string;
  category: 'Grease' | 'PhaseChange' | 'GapPad' | 'Graphite' | 'LiquidMetal' | 'Adhesive';
  thermalConductivityWmK: number;
  typicalBltMicrons: number;
  minPressureKPa: number;
  contactResistanceFactorCm2KW: number;
  dielectricIsolation: boolean;
  dielectricBreakdownKvMm?: number;
}

export const TIM_PRESETS: Record<string, TimPreset> = {
  standard_silicone_grease: {
    id: 'standard_silicone_grease',
    name: 'Standard Silicone Thermal Grease',
    category: 'Grease',
    thermalConductivityWmK: 1.5,
    typicalBltMicrons: 30,
    minPressureKPa: 70,
    contactResistanceFactorCm2KW: 0.05,
    dielectricIsolation: false,
  },
  high_perf_metal_oxide_grease: {
    id: 'high_perf_metal_oxide_grease',
    name: 'High-Performance Non-Silicone Grease',
    category: 'Grease',
    thermalConductivityWmK: 5.0,
    typicalBltMicrons: 25,
    minPressureKPa: 100,
    contactResistanceFactorCm2KW: 0.03,
    dielectricIsolation: false,
  },
  phase_change_pad: {
    id: 'phase_change_pad',
    name: 'Phase Change Material (PCM Pad 50°C Melt)',
    category: 'PhaseChange',
    thermalConductivityWmK: 3.5,
    typicalBltMicrons: 45,
    minPressureKPa: 150,
    contactResistanceFactorCm2KW: 0.04,
    dielectricIsolation: false,
  },
  sil_pad_k10: {
    id: 'sil_pad_k10',
    name: 'Sil-Pad Insulating Elastomer (K-10)',
    category: 'GapPad',
    thermalConductivityWmK: 1.3,
    typicalBltMicrons: 150,
    minPressureKPa: 200,
    contactResistanceFactorCm2KW: 0.20,
    dielectricIsolation: true,
    dielectricBreakdownKvMm: 6.0,
  },
  soft_gap_filler_pad: {
    id: 'soft_gap_filler_pad',
    name: 'Compressible Gap Filler Pad (3.0 W/mK)',
    category: 'GapPad',
    thermalConductivityWmK: 3.0,
    typicalBltMicrons: 500, // 0.5 mm
    minPressureKPa: 50,
    contactResistanceFactorCm2KW: 0.35,
    dielectricIsolation: true,
    dielectricBreakdownKvMm: 5.0,
  },
  graphite_sheet: {
    id: 'graphite_sheet',
    name: 'Pyrolytic Graphite Sheet (PGS In-Plane)',
    category: 'Graphite',
    thermalConductivityWmK: 15.0, // Through-plane (z-axis); in-plane is ~1000
    typicalBltMicrons: 40,
    minPressureKPa: 120,
    contactResistanceFactorCm2KW: 0.06,
    dielectricIsolation: false,
  },
  liquid_metal_gallium: {
    id: 'liquid_metal_gallium',
    name: 'Liquid Metal (Gallium-Indium Eutectic)',
    category: 'LiquidMetal',
    thermalConductivityWmK: 73.0,
    typicalBltMicrons: 15,
    minPressureKPa: 50,
    contactResistanceFactorCm2KW: 0.005,
    dielectricIsolation: false,
  },
  mica_washer: {
    id: 'mica_washer',
    name: 'Mica Washer (Greased Both Sides)',
    category: 'Adhesive',
    thermalConductivityWmK: 0.6,
    typicalBltMicrons: 80,
    minPressureKPa: 250,
    contactResistanceFactorCm2KW: 0.25,
    dielectricIsolation: true,
    dielectricBreakdownKvMm: 40.0,
  },
  ceramic_al2o3_insulator: {
    id: 'ceramic_al2o3_insulator',
    name: 'Alumina Ceramic Wafer (1.0 mm)',
    category: 'GapPad',
    thermalConductivityWmK: 25.0,
    typicalBltMicrons: 1000,
    minPressureKPa: 150,
    contactResistanceFactorCm2KW: 0.15,
    dielectricIsolation: true,
    dielectricBreakdownKvMm: 15.0,
  },
};

export interface TimResistanceInput {
  thicknessMeters: number; // BLT in meters (e.g. 30e-6 m = 30 um)
  thermalConductivityWmK: number;
  contactAreaM2: number;
  contactResistanceFactorCm2KW?: number; // Asperity contact resistance
}

export interface TimResistanceResult {
  bulkTimResistanceKW: number;
  contactResistanceKW: number;
  totalTimResistanceKW: number;
  specificThermalImpedanceCm2KW: number;
  formula: string;
}

/** 31. TIM Thermal Resistance: Rθtim = BLT / (k · A) + R_contact */
export function calculateTimResistance(input: TimResistanceInput): TimResistanceResult {
  const { thicknessMeters, thermalConductivityWmK: k, contactAreaM2: a } = input;
  const rcFactor = input.contactResistanceFactorCm2KW ?? 0.04;

  if (thicknessMeters <= 0 || k <= 0 || a <= 0) {
    throw new Error('TIM thickness, conductivity, and contact area must be positive.');
  }

  const r_bulk = thicknessMeters / (k * a);
  // Area in cm²
  const a_cm2 = a * 10000;
  const r_contact = rcFactor / a_cm2;
  const r_total = r_bulk + r_contact;

  return {
    bulkTimResistanceKW: Number(r_bulk.toFixed(5)),
    contactResistanceKW: Number(r_contact.toFixed(5)),
    totalTimResistanceKW: Number(r_total.toFixed(5)),
    specificThermalImpedanceCm2KW: Number((r_total * a_cm2).toFixed(4)),
    formula: 'R_{θ,tim} = BLT / (k_{tim} · A) + R_{contact}',
  };
}

/** 32. TIM Contact Resistance & Thickness (BLT & micro-asperities) */
export function calculateBltAndContact(
  bondLineThicknessMicrons: number,
  conductivityWmK: number,
  areaCm2: number,
  surfaceFinish: 'lapped_mirror' | 'milled_smooth' | 'as_extruded' | 'rough'
): { bltMeters: number; rBulkKW: number; rContactKW: number; rTotalKW: number } {
  const bltM = bondLineThicknessMicrons * 1e-6;
  const aM2 = areaCm2 * 1e-4;

  let r_c_factor = 0.02; // cm²·K/W
  if (surfaceFinish === 'lapped_mirror') r_c_factor = 0.01;
  else if (surfaceFinish === 'milled_smooth') r_c_factor = 0.03;
  else if (surfaceFinish === 'as_extruded') r_c_factor = 0.06;
  else if (surfaceFinish === 'rough') r_c_factor = 0.12;

  const r_bulk = bltM / (conductivityWmK * aM2);
  const r_contact = r_c_factor / areaCm2;

  return {
    bltMeters: bltM,
    rBulkKW: Number(r_bulk.toFixed(4)),
    rContactKW: Number(r_contact.toFixed(4)),
    rTotalKW: Number((r_bulk + r_contact).toFixed(4)),
  };
}

/** 33. TIM Contact Pressure Effect */
export function calculatePressureEffect(
  nominalBltMicrons: number,
  clampingPressureKPa: number,
  timType: 'grease' | 'pad' | 'pcm',
  conductivityWmK: number,
  areaCm2: number
): { effectiveBltMicrons: number; thermalResistanceKW: number; pressureCategory: string } {
  if (clampingPressureKPa <= 0) throw new Error('Clamping pressure must be strictly positive.');

  // As clamping pressure increases, bond line thickness decreases and contact voids compress
  let alpha = 0.35; // Grease compressibility exponent
  let refP = 100; // kPa
  if (timType === 'pad') {
    alpha = 0.55;
    refP = 70;
  } else if (timType === 'pcm') {
    alpha = 0.45;
    refP = 120;
  }

  // BLT(P) = BLT_0 * (1 + P / P_ref)^(-alpha)
  const factor = Math.pow(1 + clampingPressureKPa / refP, -alpha);
  const effBltUm = Math.max(nominalBltMicrons * 0.25, nominalBltMicrons * factor);
  const effBltM = effBltUm * 1e-6;
  const aM2 = areaCm2 * 1e-4;

  const rBulk = effBltM / (conductivityWmK * aM2);
  const rContact = (0.05 / Math.sqrt(clampingPressureKPa / 100)) / areaCm2;
  const rTotal = rBulk + rContact;

  let category = 'OPTIMAL_PRESSURE';
  if (clampingPressureKPa < 50) category = 'INSUFFICIENT_CLAMPING';
  else if (clampingPressureKPa > 600) category = 'EXCESSIVE_RISK_OF_DIE_CRACKING';

  return {
    effectiveBltMicrons: Number(effBltUm.toFixed(2)),
    thermalResistanceKW: Number(rTotal.toFixed(4)),
    pressureCategory: category,
  };
}

export interface TimComparisonRow {
  presetId: string;
  name: string;
  category: string;
  conductivityWmK: number;
  typicalBltUm: number;
  thermalResistanceKW: number;
  isDielectric: boolean;
}

/** 34. Thermal Grease vs Pad Comparison */
export function compareTimPresets(contactAreaCm2: number): TimComparisonRow[] {
  const areaM2 = contactAreaCm2 * 1e-4;
  return Object.values(TIM_PRESETS).map((p) => {
    const bltM = p.typicalBltMicrons * 1e-6;
    const rBulk = bltM / (p.thermalConductivityWmK * areaM2);
    const rCont = p.contactResistanceFactorCm2KW / contactAreaCm2;
    const rTot = rBulk + rCont;

    return {
      presetId: p.id,
      name: p.name,
      category: p.category,
      conductivityWmK: p.thermalConductivityWmK,
      typicalBltUm: p.typicalBltMicrons,
      thermalResistanceKW: Number(rTot.toFixed(4)),
      isDielectric: p.dielectricIsolation,
    };
  });
}

/** 35. Phase Change Material Modeling (Solid vs Liquid Phase) */
export function calculatePhaseChangeModel(
  operatingTempC: number,
  meltTempC: number = 52,
  solidBltUm: number = 60,
  liquidBltUm: number = 25,
  conductivityWmK: number = 3.5,
  contactAreaCm2: number = 10
): {
  phaseState: 'SOLID' | 'TRANSITION' | 'LIQUID';
  effectiveBltUm: number;
  thermalResistanceKW: number;
  conductanceWK: number;
} {
  const delta = operatingTempC - meltTempC;
  let phase: 'SOLID' | 'TRANSITION' | 'LIQUID' = 'SOLID';
  let bltUm = solidBltUm;

  if (delta < -2) {
    phase = 'SOLID';
    bltUm = solidBltUm;
  } else if (delta > 2) {
    phase = 'LIQUID';
    bltUm = liquidBltUm;
  } else {
    phase = 'TRANSITION';
    const frac = (delta + 2) / 4;
    bltUm = solidBltUm - frac * (solidBltUm - liquidBltUm);
  }

  const bltM = bltUm * 1e-6;
  const aM2 = contactAreaCm2 * 1e-4;
  const rBulk = bltM / (conductivityWmK * aM2);
  const rCont = (phase === 'LIQUID' ? 0.02 : 0.08) / contactAreaCm2;
  const rTotal = rBulk + rCont;

  return {
    phaseState: phase,
    effectiveBltUm: Number(bltUm.toFixed(2)),
    thermalResistanceKW: Number(rTotal.toFixed(4)),
    conductanceWK: Number((1 / rTotal).toFixed(2)),
  };
}

/** 36. Insulating Washer (Mica / Sil-Pad / Kapton / Alumina) Resistance & Isolation */
export function calculateInsulatingWasher(
  material: 'mica' | 'sil_pad' | 'kapton' | 'alumina',
  thicknessMm: number,
  contactAreaCm2: number,
  hasGrease: boolean
): {
  thermalResistanceKW: number;
  breakdownVoltageKv: number;
  dielectricStrengthKvMm: number;
  materialName: string;
} {
  let k = 0.6; // W/mK
  let dielStrength = 40; // kV/mm
  let matName = 'Mica';

  if (material === 'mica') {
    k = 0.6;
    dielStrength = 40;
    matName = 'Mica Sheet';
  } else if (material === 'sil_pad') {
    k = 1.3;
    dielStrength = 10;
    matName = 'Sil-Pad Elastomer';
  } else if (material === 'kapton') {
    k = 0.2;
    dielStrength = 150;
    matName = 'Kapton (Polyimide Film)';
  } else if (material === 'alumina') {
    k = 25.0;
    dielStrength = 15;
    matName = 'Alumina (Al2O3 Ceramic)';
  }

  const thickM = thicknessMm * 1e-3;
  const aM2 = contactAreaCm2 * 1e-4;
  const rBulk = thickM / (k * aM2);
  const rContactFactor = hasGrease ? 0.05 : 0.25;
  const rContact = rContactFactor / contactAreaCm2;
  const rTotal = rBulk + rContact;
  const vBreakdown = dielStrength * thicknessMm;

  return {
    thermalResistanceKW: Number(rTotal.toFixed(4)),
    breakdownVoltageKv: Number(vBreakdown.toFixed(2)),
    dielectricStrengthKvMm: dielStrength,
    materialName: matName,
  };
}

/** 37. Surface Roughness / Flatness Impact */
export function calculateSurfaceRoughnessImpact(
  nominalBltMicrons: number,
  surfaceRaMicrons: number,
  flatnessDeviationMicrons: number,
  conductivityWmK: number,
  areaCm2: number
): { effectiveBltMicrons: number; voidFraction: number; thermalResistanceKW: number } {
  // Microscopic air gaps due to surface asperities
  const effectiveBlt = nominalBltMicrons + 2 * surfaceRaMicrons + 0.5 * flatnessDeviationMicrons;
  const voidFrac = Math.min(0.5, (surfaceRaMicrons * 2) / effectiveBlt);

  // Effective conductivity using Maxwell / Bruggeman void dispersion
  const kEff = conductivityWmK * (1 - 1.5 * voidFrac);
  const bltM = effectiveBlt * 1e-6;
  const aM2 = areaCm2 * 1e-4;
  const rth = bltM / (kEff * aM2) + 0.04 / areaCm2;

  return {
    effectiveBltMicrons: Number(effectiveBlt.toFixed(2)),
    voidFraction: Number(voidFrac.toFixed(3)),
    thermalResistanceKW: Number(rth.toFixed(4)),
  };
}

/** 38. Grease Pump-Out / Aging Derating */
export function calculateGreasePumpOut(
  initialRthKW: number,
  thermalCyclesCount: number,
  deltaTCycleC: number,
  isPhaseChangeOrNonSilicone: boolean
): {
  degradedRthKW: number;
  degradationMultiplier: number;
  cyclesToTwoFoldDegradation: number;
  status: 'STABLE' | 'MODERATE_DRYOUT' | 'CRITICAL_PUMP_OUT';
} {
  // Pump-out coefficient driven by CTE mismatch cycles
  const beta = isPhaseChangeOrNonSilicone ? 0.0015 : 0.005;
  const cycleFactor = Math.pow(deltaTCycleC / 50, 1.5);
  const degFactor = 1 + beta * cycleFactor * Math.sqrt(thermalCyclesCount);
  const degradedR = initialRthKW * degFactor;

  let status: 'STABLE' | 'MODERATE_DRYOUT' | 'CRITICAL_PUMP_OUT' = 'STABLE';
  if (degFactor > 2.0) status = 'CRITICAL_PUMP_OUT';
  else if (degFactor > 1.3) status = 'MODERATE_DRYOUT';

  const n2 = Math.round(Math.pow(1.0 / (beta * cycleFactor), 2));

  return {
    degradedRthKW: Number(degradedR.toFixed(4)),
    degradationMultiplier: Number(degFactor.toFixed(3)),
    cyclesToTwoFoldDegradation: Math.max(100, n2),
    status,
  };
}

/** 39. Interface Heat Flux: q" = P / A */
export function calculateHeatFlux(
  powerWatts: number,
  areaMm2: number
): {
  heatFluxWperCm2: number;
  heatFluxWperM2: number;
  severityCategory: 'LOW_PASSIVE' | 'STANDARD_HEATSINK' | 'HIGH_HEATPIPE_REQUIRED' | 'EXTREME_VAPOR_CHAMBER_LIQUID';
  recommendedCoolingStrategy: string;
} {
  if (powerWatts <= 0 || areaMm2 <= 0) throw new Error('Power and area must be positive.');
  const areaCm2 = areaMm2 / 100;
  const areaM2 = areaMm2 * 1e-6;
  const fluxCm2 = powerWatts / areaCm2;
  const fluxM2 = powerWatts / areaM2;

  let severity: 'LOW_PASSIVE' | 'STANDARD_HEATSINK' | 'HIGH_HEATPIPE_REQUIRED' | 'EXTREME_VAPOR_CHAMBER_LIQUID' = 'LOW_PASSIVE';
  let strategy = 'Natural convection or small aluminum heatsink';

  if (fluxCm2 > 100) {
    severity = 'EXTREME_VAPOR_CHAMBER_LIQUID';
    strategy = 'Direct-to-die liquid cold plate, microchannel cooling, or immersion.';
  } else if (fluxCm2 > 35) {
    severity = 'HIGH_HEATPIPE_REQUIRED';
    strategy = 'Vapor chamber baseplate, sintered copper heat pipes, high CFM forced air.';
  } else if (fluxCm2 > 10) {
    severity = 'STANDARD_HEATSINK';
    strategy = 'Extruded aluminum heatsink with forced convection fan.';
  }

  return {
    heatFluxWperCm2: Number(fluxCm2.toFixed(2)),
    heatFluxWperM2: Math.round(fluxM2),
    severityCategory: severity,
    recommendedCoolingStrategy: strategy,
  };
}

export interface StackupLayer {
  id: string;
  name: string;
  thicknessMm: number;
  thermalConductivityWmK: number;
  contactResistanceFactorCm2KW?: number;
}

export interface MultiLayerTimResult {
  totalResistanceKW: number;
  layerResults: Array<{
    id: string;
    name: string;
    thicknessMm: number;
    bulkResistanceKW: number;
    contactResistanceKW: number;
    totalLayerResistanceKW: number;
    deltaTKelvin: number;
    pctOfTotal: number;
  }>;
}

/** 40. Multi-Layer TIM Stackup (Die → TIM1 → Spreader → TIM2 → Sink) */
export function calculateMultiLayerTimStackup(
  layers: StackupLayer[],
  contactAreaCm2: number,
  powerWatts: number
): MultiLayerTimResult {
  if (layers.length === 0) throw new Error('At least one stackup layer required.');
  const aM2 = contactAreaCm2 * 1e-4;
  let sumR = 0;

  const evaluated = layers.map((l) => {
    const thickM = l.thicknessMm * 1e-3;
    const rBulk = thickM / (l.thermalConductivityWmK * aM2);
    const rCont = (l.contactResistanceFactorCm2KW ?? 0) / contactAreaCm2;
    const rTot = rBulk + rCont;
    sumR += rTot;
    return {
      id: l.id,
      name: l.name,
      thicknessMm: l.thicknessMm,
      bulkResistanceKW: rBulk,
      contactResistanceKW: rCont,
      totalLayerResistanceKW: rTot,
      deltaTKelvin: rTot * powerWatts,
      pctOfTotal: 0,
    };
  });

  evaluated.forEach((item) => {
    item.pctOfTotal = sumR > 0 ? Number(((item.totalLayerResistanceKW / sumR) * 100).toFixed(1)) : 0;
  });

  return {
    totalResistanceKW: Number(sumR.toFixed(5)),
    layerResults: evaluated,
  };
}
