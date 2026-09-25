/**
 * ElectroKit — Thermal Engineering Subsystem
 * Module E: PCB & Enclosure Thermal Analysis (Tools 41 - 50)
 *
 * Implements:
 * 41. PCB Conduction & Spreading Resistance (Lee / Song analytical model)
 * 42. Thermal Via Array Sizing & Resistance (Plated copper cylinder model)
 * 43. Copper Plane Heat Dissipation (Orthotropic k_xy vs k_z modeling)
 * 44. Enclosure Heat Transfer (Conduction, convection, radiation envelope)
 * 45. Sealed Enclosure Internal Air Temperature (Overall heat transfer coefficient U)
 * 46. Vented Enclosure Natural Ventilation (Chimney / stack draft effect)
 * 47. Fan-Cooled Enclosure CFM Sizing (Airflow for internal equipment racks)
 * 48. Solar Radiation Heat Load (Direct & diffuse solar absorption)
 * 49. Radiation Heat Transfer (Stefan-Boltzmann law)
 * 50. Combined Convection + Radiation Loss (Linearized total heat transfer coefficient)
 */

export const STEFAN_BOLTZMANN_CONSTANT = 5.670374419e-8; // W/(m²·K⁴)

export interface PcbSpreadingInput {
  sourceLengthMm: number;
  sourceWidthMm: number;
  substrateLengthMm: number;
  substrateWidthMm: number;
  pcbThicknessMm: number;
  pcbConductivityWmK: number; // e.g. 10 to 40 W/mK for multilayer PCB with copper planes
}

export interface PcbSpreadingResult {
  sourceAreaMm2: number;
  substrateAreaMm2: number;
  areaRatio: number;
  spreadingResistanceKW: number;
  oneDimConductionResistanceKW: number;
  totalResistanceKW: number;
  formula: string;
}

/** 41. PCB Conduction & Spreading Resistance (Lee & Song model) */
export function calculatePcbSpreadingResistance(input: PcbSpreadingInput): PcbSpreadingResult {
  const { sourceLengthMm, sourceWidthMm, substrateLengthMm, substrateWidthMm, pcbThicknessMm, pcbConductivityWmK: k } = input;

  if (sourceLengthMm <= 0 || sourceWidthMm <= 0 || substrateLengthMm <= 0 || substrateWidthMm <= 0 || pcbThicknessMm <= 0 || k <= 0) {
    throw new Error('All dimensions and thermal conductivity must be strictly positive.');
  }

  const aSource = (sourceLengthMm * sourceWidthMm) * 1e-6; // m²
  const aSub = (substrateLengthMm * substrateWidthMm) * 1e-6; // m²
  const tM = pcbThicknessMm * 1e-3;

  // Equivalent circular source and substrate radii
  const rSource = Math.sqrt(aSource / Math.PI);
  const rSub = Math.sqrt(aSub / Math.PI);
  const epsilon = Math.min(0.999, rSource / rSub); // Ratio of radii
  const tau = tM / rSub;

  // 1D straight through-plane conduction resistance
  const r1D = tM / (k * aSource);

  // Spreading resistance formula (Song, Lee, Au):
  // R_spread = (1 - 1.41·ε + 0.344·ε³) / (π · k · r_source) · tanh(λ · τ)
  const lambda = Math.PI + 1 / (Math.sqrt(Math.PI) * epsilon);
  const tanhTerm = Math.tanh(lambda * tau);
  const rSpread = ((1 - 1.41 * epsilon + 0.344 * Math.pow(epsilon, 3)) / (Math.PI * k * rSource)) * tanhTerm;

  const rTotal = rSpread + tM / (k * aSub);

  return {
    sourceAreaMm2: sourceLengthMm * sourceWidthMm,
    substrateAreaMm2: substrateLengthMm * substrateWidthMm,
    areaRatio: Number((aSource / aSub).toFixed(4)),
    spreadingResistanceKW: Number(rSpread.toFixed(3)),
    oneDimConductionResistanceKW: Number(r1D.toFixed(3)),
    totalResistanceKW: Number(rTotal.toFixed(3)),
    formula: 'R_{spread} ≈ (1 - 1.41ε + 0.344ε³) / (π · k · r_{source}) · tanh(λ·τ)',
  };
}

export interface ThermalViaArrayInput {
  drillDiameterMm: number; // e.g. 0.3 mm
  platingThicknessUm: number; // e.g. 25 um
  pcbThicknessMm: number; // e.g. 1.6 mm
  viaCount: number; // e.g. 16
  filledMaterial?: 'air' | 'solder_sac305' | 'conductive_epoxy';
}

export interface ThermalViaArrayResult {
  singleViaCopperAreaMm2: number;
  singleViaResistanceKW: number;
  arrayEquivalentResistanceKW: number;
  copperFillingFraction: number;
  totalViasAreaMm2: number;
  formula: string;
}

/** 42. Thermal Via Array Sizing & Resistance */
export function calculateThermalViaArray(input: ThermalViaArrayInput): ThermalViaArrayResult {
  const { drillDiameterMm, platingThicknessUm, pcbThicknessMm, viaCount } = input;
  const fill = input.filledMaterial ?? 'air';

  if (drillDiameterMm <= 0 || platingThicknessUm <= 0 || pcbThicknessMm <= 0 || viaCount <= 0) {
    throw new Error('Via parameters must be positive.');
  }

  const kCu = 398; // W/(m·K)
  let kFill = 0.026; // Air
  if (fill === 'solder_sac305') kFill = 58;
  else if (fill === 'conductive_epoxy') kFill = 8;

  const rOuterM = (drillDiameterMm / 2) * 1e-3;
  const tPlateM = platingThicknessUm * 1e-6;
  const rInnerM = Math.max(0, rOuterM - tPlateM);

  // Annular copper cross-sectional area
  const aCu = Math.PI * (rOuterM * rOuterM - rInnerM * rInnerM);
  const aFill = Math.PI * (rInnerM * rInnerM);
  const aDrill = Math.PI * (rOuterM * rOuterM);
  const lengthM = pcbThicknessMm * 1e-3;

  // Conductance of single via
  const gCu = (kCu * aCu) / lengthM;
  const gFill = (kFill * aFill) / lengthM;
  const gSingle = gCu + gFill;
  const rSingle = 1 / gSingle;

  // Array of N parallel vias
  const rArray = rSingle / viaCount;

  return {
    singleViaCopperAreaMm2: Number((aCu * 1e6).toFixed(5)),
    singleViaResistanceKW: Number(rSingle.toFixed(2)),
    arrayEquivalentResistanceKW: Number(rArray.toFixed(3)),
    copperFillingFraction: Number((aCu / aDrill).toFixed(3)),
    totalViasAreaMm2: Number((aDrill * 1e6 * viaCount).toFixed(3)),
    formula: 'R_{via} = L_{pcb} / [k_{cu} · A_{cu} + k_{fill} · A_{fill}] | R_{array} = R_{via} / N',
  };
}

export interface PcbCopperPlaneInput {
  totalThicknessMm: number;
  layersCount: number;
  copperLayers: Array<{ thicknessOz: number; coverageFraction: number }>; // 1 oz = 35 um
  fr4ConductivityWmK?: number; // typically 0.3 W/(m·K)
}

export interface PcbCopperPlaneResult {
  inPlaneConductivityKxyWmK: number;
  throughPlaneConductivityKzWmK: number;
  anisotropyRatio: number;
  totalCopperThicknessUm: number;
  formula: string;
}

/** 43. Copper Plane Heat Dissipation (Orthotropic k_xy vs k_z) */
export function calculatePcbCopperPlaneConductivity(input: PcbCopperPlaneInput): PcbCopperPlaneResult {
  const { totalThicknessMm, copperLayers } = input;
  const kFr4 = input.fr4ConductivityWmK ?? 0.3;
  const kCu = 398; // W/(m·K)

  if (totalThicknessMm <= 0 || copperLayers.length === 0) {
    throw new Error('Total thickness and copper layers must be valid.');
  }

  let totalCopperM = 0;
  let weightedKxy = 0;
  let sumResistZ = 0;

  copperLayers.forEach((layer) => {
    // 1 oz copper = 35 um (0.035 mm)
    const tCuM = layer.thicknessOz * 35e-6;
    const effTCuM = tCuM * Math.min(1.0, Math.max(0.01, layer.coverageFraction));
    totalCopperM += effTCuM;
    weightedKxy += effTCuM * kCu;
    sumResistZ += effTCuM / kCu;
  });

  const totalThickM = totalThicknessMm * 1e-3;
  const tFr4M = Math.max(0, totalThickM - totalCopperM);
  weightedKxy += tFr4M * kFr4;
  sumResistZ += tFr4M / kFr4;

  // In-plane effective conductivity (parallel conduction)
  const k_xy = weightedKxy / totalThickM;

  // Through-plane effective conductivity (series conduction)
  const k_z = totalThickM / sumResistZ;

  return {
    inPlaneConductivityKxyWmK: Number(k_xy.toFixed(2)),
    throughPlaneConductivityKzWmK: Number(k_z.toFixed(3)),
    anisotropyRatio: Number((k_xy / k_z).toFixed(1)),
    totalCopperThicknessUm: Number((totalCopperM * 1e6).toFixed(1)),
    formula: 'k_{xy} = Σ (t_i · k_i) / t_{total},  k_z = t_{total} / Σ (t_i / k_i)',
  };
}

export interface EnclosureHeatInput {
  lengthM: number;
  widthM: number;
  heightM: number;
  wallThicknessMm: number;
  wallMaterialConductivityWmK: number; // Aluminum = 167, Steel = 50, Plastic ABS = 0.2
  internalHeatWatts: number;
  ambientTempC: number;
  surfaceEmissivity?: number; // Painted = 0.9, Polished Al = 0.05
  externalAirVelocityMps?: number; // 0 = natural, >0 = wind
}

export interface EnclosureHeatResult {
  surfaceAreaM2: number;
  volumeM3: number;
  conductiveUWm2K: number;
  convectiveHWm2K: number;
  radiativeHWm2K: number;
  overallUWm2K: number;
  externalSurfaceTempC: number;
  internalAirTempC: number;
  heatConductedWatts: number;
  heatConvectedWatts: number;
  heatRadiatedWatts: number;
  formula: string;
}

/** 44. Enclosure Heat Transfer (Conduction, Convection, Radiation) */
export function calculateEnclosureHeatTransfer(input: EnclosureHeatInput): EnclosureHeatResult {
  const { lengthM, widthM, heightM, wallThicknessMm, wallMaterialConductivityWmK: kWall, internalHeatWatts: p, ambientTempC: ta } = input;
  const eps = input.surfaceEmissivity ?? 0.85;
  const vWind = input.externalAirVelocityMps ?? 0;

  if (lengthM <= 0 || widthM <= 0 || heightM <= 0 || wallThicknessMm <= 0 || kWall <= 0 || p < 0) {
    throw new Error('Dimensions, thermal conductivity, and wall thickness must be positive.');
  }

  // Enclosure envelope geometry (6 sides)
  const a_total = 2 * (lengthM * widthM + lengthM * heightM + widthM * heightM);
  const vol = lengthM * widthM * heightM;
  const tWallM = wallThicknessMm * 1e-3;

  // External convection coefficient
  let h_conv = 4.5;
  if (vWind > 0) {
    h_conv = 10.0 + 4.0 * Math.pow(vWind, 0.8);
  } else {
    h_conv = 4.5 + 0.05 * Math.pow(p / a_total, 0.33);
  }

  // Radiative coefficient h_rad linearized around Ta
  const taK = ta + 273.15;
  const h_rad = 4 * eps * STEFAN_BOLTZMANN_CONSTANT * Math.pow(taK, 3);

  // Exterior combined coefficient
  const h_ext = h_conv + h_rad;

  // Wall conduction U_wall
  const u_wall = kWall / tWallM;

  // Interior natural convection to enclosure wall (typically ~4 to 7 W/m²K)
  const h_int = 5.0;

  // Overall heat transfer coefficient U: 1/U = 1/h_int + 1/u_wall + 1/h_ext
  const r_overall_unit = 1 / h_int + 1 / u_wall + 1 / h_ext;
  const u_overall = 1 / r_overall_unit;

  // Steady-state internal air rise: ΔT = P / (U · A)
  const deltaT_int = p / (u_overall * a_total);
  const t_int = ta + deltaT_int;

  // Outer surface temperature: T_surf = Ta + P / (h_ext · A)
  const deltaT_surf = p / (h_ext * a_total);
  const t_surf = ta + deltaT_surf;

  const q_conv = h_conv * a_total * deltaT_surf;
  const q_rad = h_rad * a_total * deltaT_surf;

  return {
    surfaceAreaM2: Number(a_total.toFixed(4)),
    volumeM3: Number(vol.toFixed(4)),
    conductiveUWm2K: Number(u_wall.toFixed(2)),
    convectiveHWm2K: Number(h_conv.toFixed(2)),
    radiativeHWm2K: Number(h_rad.toFixed(2)),
    overallUWm2K: Number(u_overall.toFixed(2)),
    externalSurfaceTempC: Number(t_surf.toFixed(2)),
    internalAirTempC: Number(t_int.toFixed(2)),
    heatConductedWatts: Number(p.toFixed(2)),
    heatConvectedWatts: Number(q_conv.toFixed(2)),
    heatRadiatedWatts: Number(q_rad.toFixed(2)),
    formula: '1 / U = 1/h_{int} + t_{wall}/k_{wall} + 1/(h_{conv} + h_{rad}) | T_{int} = T_a + P / (U · A)',
  };
}

/** 45. Sealed Enclosure Internal Air Temperature */
export function calculateSealedEnclosureTemp(
  internalPowerWatts: number,
  ambientTempC: number,
  surfaceAreaM2: number,
  overallUWm2K: number = 5.5
): { internalAirTempC: number; deltaTC: number; requiredAreaM2ForTarget: (targetDeltaTC: number) => number } {
  if (surfaceAreaM2 <= 0 || overallUWm2K <= 0) throw new Error('Surface area and U value must be positive.');
  const dt = internalPowerWatts / (overallUWm2K * surfaceAreaM2);
  const tInt = ambientTempC + dt;
  return {
    internalAirTempC: Number(tInt.toFixed(2)),
    deltaTC: Number(dt.toFixed(2)),
    requiredAreaM2ForTarget: (targetDt: number) => (targetDt > 0 ? Number((internalPowerWatts / (overallUWm2K * targetDt)).toFixed(3)) : 0),
  };
}

/** 46. Vented Enclosure Natural Ventilation (Chimney / Stack Effect) */
export function calculateVentedEnclosureStackEffect(
  internalHeatWatts: number,
  heightBetweenVentsM: number,
  inletVentAreaM2: number,
  outletVentAreaM2: number,
  ambientTempC: number,
  dischargeCoefficientCd: number = 0.62
): {
  draftVelocityMps: number;
  volumetricAirflowM3s: number;
  volumetricAirflowCfm: number;
  internalAirTempC: number;
  airTempRiseC: number;
  coolingCapacityWatts: number;
} {
  if (heightBetweenVentsM <= 0 || inletVentAreaM2 <= 0 || outletVentAreaM2 <= 0) {
    throw new Error('Vent dimensions and vertical distance must be positive.');
  }

  // Effective vent area A_eff: 1/A_eff² = 1/A_in² + 1/A_out²
  const aEff = (inletVentAreaM2 * outletVentAreaM2) / Math.sqrt(inletVentAreaM2 * inletVentAreaM2 + outletVentAreaM2 * outletVentAreaM2);

  // Iterative solution for ΔT:
  // V_dot = Cd · A_eff · sqrt(2 · g · H · ΔT / T_avg)
  // P = ρ · V_dot · cp · ΔT
  const g = 9.80665;
  const tAmbK = ambientTempC + 273.15;
  const rho = 1.2;
  const cp = 1005;

  let deltaT = 15; // Initial guess
  for (let iter = 0; iter < 10; iter++) {
    const v_stack = dischargeCoefficientCd * Math.sqrt(Math.max(0.1, (2 * g * heightBetweenVentsM * deltaT) / (tAmbK + deltaT / 2)));
    const v_dot = v_stack * aEff;
    const newDeltaT = internalHeatWatts / (rho * Math.max(1e-5, v_dot) * cp);
    deltaT = 0.5 * deltaT + 0.5 * newDeltaT;
  }

  const v_stack = dischargeCoefficientCd * Math.sqrt((2 * g * heightBetweenVentsM * deltaT) / (tAmbK + deltaT / 2));
  const v_dot = v_stack * aEff;
  const cfm = v_dot * 2118.88;

  return {
    draftVelocityMps: Number(v_stack.toFixed(3)),
    volumetricAirflowM3s: Number(v_dot.toFixed(5)),
    volumetricAirflowCfm: Number(cfm.toFixed(1)),
    internalAirTempC: Number((ambientTempC + deltaT).toFixed(2)),
    airTempRiseC: Number(deltaT.toFixed(2)),
    coolingCapacityWatts: Number(internalHeatWatts.toFixed(1)),
  };
}

/** 47. Fan-Cooled Enclosure CFM Sizing */
export function calculateEnclosureFanCfm(
  totalInternalPowerWatts: number,
  allowedAirRiseC: number,
  safetyFactor: number = 1.2,
  altitudeMeters: number = 0
): { requiredCfm: number; requiredM3s: number; fanSelectionRecommendation: string } {
  if (totalInternalPowerWatts <= 0 || allowedAirRiseC <= 0) {
    throw new Error('Power and allowed temperature rise must be positive.');
  }
  // Base CFM: CFM = 1.76 · P / ΔT
  let cfm = (1.76 * totalInternalPowerWatts) / allowedAirRiseC;
  // Altitude correction
  const altFactor = Math.pow(Math.max(0.1, 1 - (0.0065 * altitudeMeters) / 288.15), -4.256 * 0.6);
  cfm = cfm * altFactor * safetyFactor;
  const m3s = cfm / 2118.88;

  let rec = 'Single 80mm or 120mm axial chassis fan';
  if (cfm > 250) rec = 'High-static dual blower or redundant fan tray (4x 120mm)';
  else if (cfm > 80) rec = 'Dual 120mm PWM intake/exhaust fans';

  return {
    requiredCfm: Number(cfm.toFixed(1)),
    requiredM3s: Number(m3s.toFixed(4)),
    fanSelectionRecommendation: rec,
  };
}

export interface SolarRadiationInput {
  solarIrradianceWperM2: number; // Standard direct normal solar peak ≈ 1000 W/m²
  projectedAreaM2: number;
  surfaceFinish: 'gloss_white_paint' | 'bare_aluminum' | 'anodized_black' | 'dark_gray_industrial';
}

export interface SolarRadiationResult {
  solarAbsorptivity: number;
  incidentSolarPowerWatts: number;
  absorbedSolarHeatWatts: number;
  equivalentInternalHeatWatts: number;
  formula: string;
}

/** 48. Solar Radiation Heat Load */
export function calculateSolarRadiationHeatLoad(input: SolarRadiationInput): SolarRadiationResult {
  const { solarIrradianceWperM2, projectedAreaM2, surfaceFinish } = input;

  let alpha = 0.25; // Absorptivity
  if (surfaceFinish === 'gloss_white_paint') alpha = 0.22;
  else if (surfaceFinish === 'bare_aluminum') alpha = 0.55;
  else if (surfaceFinish === 'dark_gray_industrial') alpha = 0.80;
  else if (surfaceFinish === 'anodized_black') alpha = 0.94;

  const incident = solarIrradianceWperM2 * projectedAreaM2;
  const absorbed = incident * alpha;

  return {
    solarAbsorptivity: alpha,
    incidentSolarPowerWatts: Number(incident.toFixed(1)),
    absorbedSolarHeatWatts: Number(absorbed.toFixed(1)),
    equivalentInternalHeatWatts: Number(absorbed.toFixed(1)),
    formula: 'q_{solar} = α · I_{solar} · A_{proj}',
  };
}

export interface StefanBoltzmannInput {
  surfaceTempC: number;
  ambientOrEnclosureTempC: number;
  surfaceAreaM2: number;
  emissivity: number; // 0 to 1
}

export interface StefanBoltzmannResult {
  radiatedPowerWatts: number;
  linearizedRadiativeHWm2K: number;
  heatFluxWperM2: number;
  formula: string;
}

/** 49. Radiation Heat Transfer (Stefan-Boltzmann law) */
export function calculateStefanBoltzmannRadiation(input: StefanBoltzmannInput): StefanBoltzmannResult {
  const { surfaceTempC, ambientOrEnclosureTempC, surfaceAreaM2, emissivity: eps } = input;

  if (surfaceAreaM2 <= 0 || eps <= 0 || eps > 1.0) {
    throw new Error('Surface area must be positive and emissivity must be in (0, 1].');
  }

  const t1K = surfaceTempC + 273.15;
  const t2K = ambientOrEnclosureTempC + 273.15;
  if (t1K < 0 || t2K < 0) throw new Error('Temperatures cannot be below absolute zero.');

  // q_rad = ε · σ · A · (T1⁴ - T2⁴)
  const q_rad = eps * STEFAN_BOLTZMANN_CONSTANT * surfaceAreaM2 * (Math.pow(t1K, 4) - Math.pow(t2K, 4));

  // Linearized h_rad = ε · σ · (T1² + T2²) · (T1 + T2)
  const h_rad = eps * STEFAN_BOLTZMANN_CONSTANT * (t1K * t1K + t2K * t2K) * (t1K + t2K);

  return {
    radiatedPowerWatts: Number(q_rad.toFixed(3)),
    linearizedRadiativeHWm2K: Number(h_rad.toFixed(3)),
    heatFluxWperM2: Number((q_rad / surfaceAreaM2).toFixed(2)),
    formula: 'q_{rad} = ε · σ · A · (T_1⁴ - T_2⁴) | h_{rad} = ε · σ · (T_1 + T_2)(T_1² + T_2²)',
  };
}

/** 50. Combined Convection + Radiation Loss */
export function calculateCombinedConvectionRadiation(
  surfaceTempC: number,
  ambientTempC: number,
  surfaceAreaM2: number,
  hConvectionWm2K: number,
  emissivity: number
): {
  convectionLossWatts: number;
  radiationLossWatts: number;
  totalHeatLossWatts: number;
  effectiveTotalHWm2K: number;
  convectionFractionPct: number;
  radiationFractionPct: number;
} {
  const dt = surfaceTempC - ambientTempC;
  const q_conv = hConvectionWm2K * surfaceAreaM2 * dt;
  const radRes = calculateStefanBoltzmannRadiation({
    surfaceTempC,
    ambientOrEnclosureTempC: ambientTempC,
    surfaceAreaM2,
    emissivity,
  });
  const q_rad = radRes.radiatedPowerWatts;
  const q_tot = q_conv + q_rad;
  const h_eff = dt !== 0 ? q_tot / (surfaceAreaM2 * dt) : hConvectionWm2K + radRes.linearizedRadiativeHWm2K;

  return {
    convectionLossWatts: Number(q_conv.toFixed(2)),
    radiationLossWatts: Number(q_rad.toFixed(2)),
    totalHeatLossWatts: Number(q_tot.toFixed(2)),
    effectiveTotalHWm2K: Number(h_eff.toFixed(2)),
    convectionFractionPct: q_tot > 0 ? Number(((q_conv / q_tot) * 100).toFixed(1)) : 50,
    radiationFractionPct: q_tot > 0 ? Number(((q_rad / q_tot) * 100).toFixed(1)) : 50,
  };
}
