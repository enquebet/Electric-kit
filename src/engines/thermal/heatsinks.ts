/**
 * ElectroKit — Thermal Engineering Subsystem
 * Module C: Heat Sinks & Convective Heat Transfer (Tools 21 - 30)
 *
 * Implements:
 * 21. Heat Sink Required Thermal Resistance (Rθsa,req)
 * 22. Natural Convection Heat Sink Sizing
 * 23. Forced Air Convection Heat Sink Sizing
 * 24. Air Flow Requirement (CFM / m³/s)
 * 25. Air Velocity & Heat Transfer Coefficient (h)
 * 26. Heat Sink Extrusion Sizing (Volumetric thermal resistance)
 * 27. Fin Efficiency & Surface Area (η_fin, total effective area)
 * 28. Pressure Drop vs Airflow (Darcy-Weisbach duct model)
 * 29. Heat Sink Temperature Profile (Base-to-fin tip gradient)
 * 30. Altitude Derating for Cooling (Barometric density derating)
 */

export interface HeatsinkReqInput {
  maxJunctionTempC: number;
  ambientTempC: number;
  powerWatts: number;
  rthJcKW: number;
  rthCsKW: number;
  safetyMarginPct?: number; // e.g. 15% safety margin on Rth
}

export interface HeatsinkReqResult {
  maxAllowableTotalRthJaKW: number;
  requiredRthSaKW: number;
  requiredRthSaWithMarginKW: number;
  isHeatsinkRequired: number;
  formula: string;
}

/** 21. Heat Sink Required Thermal Resistance */
export function calculateRequiredHeatsinkRth(input: HeatsinkReqInput): HeatsinkReqResult {
  const { maxJunctionTempC, ambientTempC, powerWatts, rthJcKW, rthCsKW } = input;
  const marginPct = input.safetyMarginPct ?? 10;

  if (powerWatts <= 0) throw new Error('Power must be strictly positive.');
  const deltaT = maxJunctionTempC - ambientTempC;
  if (deltaT <= 0) throw new Error('Ambient temperature equals or exceeds maximum junction temperature.');

  const rja_max = deltaT / powerWatts;
  const rsa_raw = rja_max - (rthJcKW + rthCsKW);

  if (rsa_raw <= 0) {
    throw new Error(
      `Internal package resistances (${(rthJcKW + rthCsKW).toFixed(2)} °C/W) already exceed maximum allowable Rja (${rja_max.toFixed(2)} °C/W). Lower power, lower ambient, or use liquid cooling.`
    );
  }

  // Apply safety margin (requires smaller Rth)
  const rsa_safe = rsa_raw * (1 - marginPct / 100);

  return {
    maxAllowableTotalRthJaKW: Number(rja_max.toFixed(4)),
    requiredRthSaKW: Number(rsa_raw.toFixed(4)),
    requiredRthSaWithMarginKW: Number(rsa_safe.toFixed(4)),
    isHeatsinkRequired: 1,
    formula: 'R_{θsa,req} = (T_{j,max} - T_a) / P_d - R_{θjc} - R_{θcs}',
  };
}

export interface NaturalConvectionSizingInput {
  powerWatts: number;
  targetDeltaTKelvin: number;
  ambientTempC?: number;
  finOrientation?: 'vertical' | 'horizontal';
}

export interface NaturalConvectionSizingResult {
  requiredSurfaceAreaM2: number;
  requiredSurfaceAreaCm2: number;
  heatTransferCoefficientWm2K: number;
  volumetricEstimateCm3: number;
  recommendedExtrusionSizeMm: { width: number; height: number; length: number };
  formula: string;
}

/** 22. Natural Convection Heat Sink Sizing */
export function calculateNaturalConvectionSizing(input: NaturalConvectionSizingInput): NaturalConvectionSizingResult {
  const { powerWatts, targetDeltaTKelvin } = input;
  const orientation = input.finOrientation ?? 'vertical';
  if (powerWatts <= 0 || targetDeltaTKelvin <= 0) throw new Error('Power and target delta T must be strictly positive.');

  // For natural convection in air, h_conv is typically 4 to 10 W/(m²·K), radiation contributes ~3 to 5 W/(m²·K)
  // Vertical fins perform ~25% better than horizontal
  const orientationFactor = orientation === 'vertical' ? 1.0 : 0.75;
  const h_nat = (6.5 + 0.05 * targetDeltaTKelvin) * orientationFactor;

  // Surface area required: A = P / (h * ΔT)
  const a_m2 = powerWatts / (h_nat * targetDeltaTKelvin);
  const a_cm2 = a_m2 * 10000;

  // Volumetric estimate using empirical volumetric resistance Rv ≈ 250 cm³·K/W for natural convection
  const rthTarget = targetDeltaTKelvin / powerWatts;
  const vol_cm3 = 250 / rthTarget;

  // Representative standard rectangular extrusion envelope
  const aspectW = Math.cbrt(vol_cm3 * 1.5) * 10;
  const aspectL = Math.cbrt(vol_cm3 * 1.5) * 10;
  const aspectH = (vol_cm3 * 1000) / (aspectW * aspectL);

  return {
    requiredSurfaceAreaM2: Number(a_m2.toFixed(4)),
    requiredSurfaceAreaCm2: Number(a_cm2.toFixed(1)),
    heatTransferCoefficientWm2K: Number(h_nat.toFixed(2)),
    volumetricEstimateCm3: Number(vol_cm3.toFixed(1)),
    recommendedExtrusionSizeMm: {
      width: Math.round(aspectW),
      length: Math.round(aspectL),
      height: Math.round(aspectH),
    },
    formula: 'A_{req} = P / (h_{nat} · ΔT),  h_{nat} ≈ 5 - 12 W/(m²·K)',
  };
}

export interface ForcedAirSizingInput {
  powerWatts: number;
  targetDeltaTKelvin: number;
  airVelocityMps: number; // e.g. 1.0 to 5.0 m/s (200 to 1000 LFM)
  finMaterialConductivityWmK?: number; // Aluminum 6061 = 167
}

export interface ForcedAirSizingResult {
  heatTransferCoefficientWm2K: number;
  requiredEffectiveAreaM2: number;
  requiredEffectiveAreaCm2: number;
  linearFeetPerMinuteLFM: number;
  volumetricEstimateCm3: number;
  formula: string;
}

/** 23. Forced Air Convection Heat Sink Sizing */
export function calculateForcedAirSizing(input: ForcedAirSizingInput): ForcedAirSizingResult {
  const { powerWatts, targetDeltaTKelvin, airVelocityMps } = input;
  if (powerWatts <= 0 || targetDeltaTKelvin <= 0 || airVelocityMps <= 0) {
    throw new Error('Power, delta T, and air velocity must be positive.');
  }

  // Empirical correlation for laminar/mild turbulent airflow between fins:
  // h_forced ≈ 10.45 - v + 10 * sqrt(v) or h ≈ 12 * v^0.75
  const h_forced = 11.5 * Math.pow(airVelocityMps, 0.78) + 5.0;
  const a_m2 = powerWatts / (h_forced * targetDeltaTKelvin);
  const a_cm2 = a_m2 * 10000;
  const lfm = airVelocityMps * 196.85;

  // Volumetric resistance for forced air is typically 50 to 90 cm³·K/W
  const rthTarget = targetDeltaTKelvin / powerWatts;
  const vol_cm3 = (75 / Math.sqrt(airVelocityMps)) / rthTarget;

  return {
    heatTransferCoefficientWm2K: Number(h_forced.toFixed(2)),
    requiredEffectiveAreaM2: Number(a_m2.toFixed(4)),
    requiredEffectiveAreaCm2: Number(a_cm2.toFixed(1)),
    linearFeetPerMinuteLFM: Number(lfm.toFixed(1)),
    volumetricEstimateCm3: Number(vol_cm3.toFixed(1)),
    formula: 'h_{forced} ≈ 11.5 · v^{0.78} + 5.0 W/(m²·K),  A_{req} = P / (h · ΔT)',
  };
}

export interface AirflowReqInput {
  powerWatts: number;
  allowedAirTempRiseC: number; // e.g. 10°C to 15°C
  airDensityKgM3?: number; // 1.2 kg/m³ standard at sea level
  airSpecificHeatJkgK?: number; // 1005 J/(kg·K)
}

export interface AirflowReqResult {
  airflowCfm: number;
  airflowM3s: number;
  airflowM3h: number;
  airflowLitersPerSec: number;
  massFlowKgPerSec: number;
  formula: string;
}

/** 24. Air Flow Requirement (CFM / m³/s) */
export function calculateAirflowRequirement(input: AirflowReqInput): AirflowReqResult {
  const { powerWatts, allowedAirTempRiseC } = input;
  const rho = input.airDensityKgM3 ?? 1.2;
  const cp = input.airSpecificHeatJkgK ?? 1005;

  if (powerWatts <= 0 || allowedAirTempRiseC <= 0 || rho <= 0 || cp <= 0) {
    throw new Error('Power, allowed air temperature rise, and density must be positive.');
  }

  // P = m_dot · cp · ΔT = ρ · V_dot · cp · ΔT
  // V_dot (m³/s) = P / (ρ · cp · ΔT)
  const m3s = powerWatts / (rho * cp * allowedAirTempRiseC);
  const cfm = m3s * 2118.88;
  const m3h = m3s * 3600;
  const lps = m3s * 1000;
  const m_dot = rho * m3s;

  return {
    airflowCfm: Number(cfm.toFixed(2)),
    airflowM3s: Number(m3s.toFixed(6)),
    airflowM3h: Number(m3h.toFixed(2)),
    airflowLitersPerSec: Number(lps.toFixed(2)),
    massFlowKgPerSec: Number(m_dot.toFixed(5)),
    formula: 'CFM = 1.76 · P / ΔT_{air} (°C) | V̇ (m³/s) = P / (ρ · c_p · ΔT)',
  };
}

export interface VelocityHResult {
  velocityMps: number;
  velocityLfm: number;
  reynoldsNumber: number;
  flowRegime: 'Laminar' | 'Transition' | 'Turbulent';
  heatTransferCoefficientWm2K: number;
}

/** 25. Air Velocity & Heat Transfer Coefficient */
export function calculateVelocityAndH(
  flowCfm: number,
  flowCrossSectionM2: number,
  hydraulicDiameterM: number = 0.015
): VelocityHResult {
  if (flowCfm <= 0 || flowCrossSectionM2 <= 0) throw new Error('Flow and cross-sectional area must be positive.');
  const m3s = flowCfm / 2118.88;
  const v = m3s / flowCrossSectionM2;
  const lfm = v * 196.85;

  // Air kinematic viscosity at 25°C ν ≈ 1.56e-5 m²/s
  const nu = 1.56e-5;
  const re = (v * hydraulicDiameterM) / nu;

  let regime: 'Laminar' | 'Transition' | 'Turbulent' = 'Laminar';
  if (re > 4000) regime = 'Turbulent';
  else if (re > 2300) regime = 'Transition';

  // Heat transfer coefficient h
  // For duct flow: Nu = 0.023 * Re^0.8 * Pr^0.4 (Dittus-Boelter) or laminar Nu = 7.54
  const pr = 0.71;
  const k_air = 0.0262; // W/mK
  let nu_num = 7.54;
  if (re >= 2300) {
    nu_num = 0.023 * Math.pow(re, 0.8) * Math.pow(pr, 0.4);
  } else {
    nu_num = Math.max(3.66, 1.86 * Math.pow((re * pr * hydraulicDiameterM) / 0.1, 1 / 3));
  }
  const h = (nu_num * k_air) / hydraulicDiameterM;

  return {
    velocityMps: Number(v.toFixed(3)),
    velocityLfm: Number(lfm.toFixed(1)),
    reynoldsNumber: Math.round(re),
    flowRegime: regime,
    heatTransferCoefficientWm2K: Number(h.toFixed(2)),
  };
}

/** 26. Heat Sink Extrusion Sizing: Volumetric resistance Rv */
export function calculateExtrusionSizing(
  targetRthSaKW: number,
  coolingType: 'natural' | 'forced_low' | 'forced_high'
): { volumeCm3: number; lengthMm: number; widthMm: number; heightMm: number; volumetricRv: number } {
  if (targetRthSaKW <= 0) throw new Error('Target thermal resistance must be positive.');
  let rv = 250; // cm³·K/W for natural
  if (coolingType === 'forced_low') rv = 80;
  if (coolingType === 'forced_high') rv = 45;

  const vol = rv / targetRthSaKW;
  const w = Math.round(Math.pow(vol * 1.5, 1 / 3) * 10);
  const l = w;
  const h = Math.round((vol * 1000) / (w * l));

  return {
    volumeCm3: Number(vol.toFixed(1)),
    lengthMm: l,
    widthMm: w,
    heightMm: h,
    volumetricRv: rv,
  };
}

export interface FinEfficiencyInput {
  finLengthM: number; // Length along airflow
  finHeightM: number; // Fin extension height
  finThicknessM: number; // Fin width
  numberOfFins: number;
  baseWidthM: number;
  baseLengthM: number;
  heatTransferCoefficientWm2K: number;
  finThermalConductivityWmK: number; // Aluminum = 167 - 205
}

export interface FinEfficiencyResult {
  finEfficiency: number; // η_fin (0 to 1)
  overallEfficiency: number; // η_o (0 to 1)
  singleFinAreaM2: number;
  totalFinAreaM2: number;
  totalBaseAreaM2: number;
  totalSurfaceAreaM2: number;
  effectiveAreaM2: number;
}

/** 27. Fin Efficiency & Surface Area: η_fin = tanh(m·H)/(m·H) */
export function calculateFinEfficiency(input: FinEfficiencyInput): FinEfficiencyResult {
  const { finLengthM, finHeightM, finThicknessM, numberOfFins, baseWidthM, baseLengthM, heatTransferCoefficientWm2K: h, finThermalConductivityWmK: k } = input;

  if (finHeightM <= 0 || finThicknessM <= 0 || k <= 0 || h <= 0 || numberOfFins <= 0) {
    throw new Error('Fin dimensions, counts, and thermal properties must be positive.');
  }

  // Fin parameter m = sqrt( 2·h / (k·t) )
  const m = Math.sqrt((2 * h) / (k * finThicknessM));
  const mH = m * finHeightM;
  const eta_f = mH > 1e-4 ? Math.tanh(mH) / mH : 1.0;

  // Surface areas
  const a_single_fin = 2 * finLengthM * finHeightM + finThicknessM * finLengthM;
  const a_fins_total = a_single_fin * numberOfFins;
  const a_base_exposed = Math.max(0, baseWidthM * baseLengthM - numberOfFins * finThicknessM * finLengthM);
  const a_total = a_fins_total + a_base_exposed;

  // Overall surface efficiency: η_o = 1 - (A_fins / A_total) * (1 - η_f)
  const eta_o = a_total > 0 ? 1 - (a_fins_total / a_total) * (1 - eta_f) : eta_f;
  const a_eff = eta_o * a_total;

  return {
    finEfficiency: Number(eta_f.toFixed(4)),
    overallEfficiency: Number(eta_o.toFixed(4)),
    singleFinAreaM2: Number(a_single_fin.toFixed(6)),
    totalFinAreaM2: Number(a_fins_total.toFixed(4)),
    totalBaseAreaM2: Number((baseWidthM * baseLengthM).toFixed(4)),
    totalSurfaceAreaM2: Number(a_total.toFixed(4)),
    effectiveAreaM2: Number(a_eff.toFixed(4)),
  };
}

/** 28. Pressure Drop vs Airflow (Darcy-Weisbach duct model) */
export function calculateHeatsinkPressureDrop(
  airflowM3s: number,
  flowAreaM2: number,
  channelLengthM: number,
  hydraulicDiameterM: number,
  airDensityKgM3: number = 1.2
): { deltaPressurePa: number; deltaPressureInH2O: number; velocityMps: number; reynoldsNumber: number } {
  if (airflowM3s <= 0 || flowAreaM2 <= 0 || hydraulicDiameterM <= 0) {
    throw new Error('Airflow, channel area, and hydraulic diameter must be positive.');
  }
  const v = airflowM3s / flowAreaM2;
  const nu = 1.56e-5;
  const re = (v * hydraulicDiameterM) / nu;

  // Friction factor f
  let f = 0.05;
  if (re < 2300) {
    f = 64 / Math.max(re, 1);
  } else {
    f = 0.3164 * Math.pow(re, -0.25); // Blasius
  }

  // Entrance loss Kin ≈ 0.5, exit loss Kout ≈ 1.0
  const k_in = 0.4;
  const k_out = 1.0;
  const lossCoeff = k_in + f * (channelLengthM / hydraulicDiameterM) + k_out;
  const dp_pa = lossCoeff * 0.5 * airDensityKgM3 * v * v;
  const dp_inh2o = dp_pa / 249.0889;

  return {
    deltaPressurePa: Number(dp_pa.toFixed(2)),
    deltaPressureInH2O: Number(dp_inh2o.toFixed(4)),
    velocityMps: Number(v.toFixed(2)),
    reynoldsNumber: Math.round(re),
  };
}

/** 29. Heat Sink Temperature Profile: Base-to-Fin Tip */
export function calculateFinTemperatureProfile(
  baseTempC: number,
  ambientTempC: number,
  finHeightM: number,
  mParameter: number, // m = sqrt(2h/(k·t))
  steps: number = 10
): Array<{ normalizedHeight: number; distanceMm: number; temperatureC: number; deltaT: number }> {
  const dtBase = baseTempC - ambientTempC;
  const mH = mParameter * finHeightM;
  const cosh_mH = Math.cosh(mH);

  const profile = [];
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const y = frac * finHeightM;
    // T(y) - Ta = (T_base - Ta) * cosh(m * (H - y)) / cosh(m * H)
    const dt_y = (dtBase * Math.cosh(mParameter * (finHeightM - y))) / cosh_mH;
    profile.push({
      normalizedHeight: Number(frac.toFixed(2)),
      distanceMm: Number((y * 1000).toFixed(2)),
      temperatureC: Number((ambientTempC + dt_y).toFixed(2)),
      deltaT: Number(dt_y.toFixed(2)),
    });
  }
  return profile;
}

/** 30. Altitude Derating for Cooling */
export function calculateAltitudeDerating(
  altitudeMeters: number,
  seaLevelRthKW: number,
  coolingType: 'natural' | 'forced'
): {
  altitudeMeters: number;
  altitudeFeet: number;
  densityRatio: number;
  deratingFactor: number;
  deratedRthKW: number;
  airDensityKgM3: number;
} {
  if (altitudeMeters < 0) throw new Error('Altitude must be non-negative.');
  // Barometric formula: ρ/ρ0 = (1 - L·h / T0)^(g·M / (R·L))
  // L = 0.0065 K/m, T0 = 288.15 K, exponent ≈ 4.256
  const ratio = Math.pow(Math.max(0.1, 1 - (0.0065 * altitudeMeters) / 288.15), 4.256);
  const rho = 1.225 * ratio;

  // Empirical cooling derating: Rth increases as density drops
  // Natural convection n ≈ 0.8; Forced convection n ≈ 0.6
  const exponent = coolingType === 'natural' ? 0.8 : 0.6;
  const deratingFactor = Math.pow(1 / ratio, exponent);
  const deratedRth = seaLevelRthKW * deratingFactor;

  return {
    altitudeMeters,
    altitudeFeet: Math.round(altitudeMeters * 3.28084),
    densityRatio: Number(ratio.toFixed(4)),
    deratingFactor: Number(deratingFactor.toFixed(3)),
    deratedRthKW: Number(deratedRth.toFixed(4)),
    airDensityKgM3: Number(rho.toFixed(3)),
  };
}
