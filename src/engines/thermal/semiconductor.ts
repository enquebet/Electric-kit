/**
 * ElectroKit — Thermal Engineering Subsystem
 * Module B: Junction / Case / Ambient Thermal Analysis (Tools 11 - 20)
 *
 * Implements:
 * 11. Junction Temperature (Tj)
 * 12. Case Temperature (Tc)
 * 13. Ambient Temperature (Ta max limits)
 * 14. Junction-to-Case Thermal Resistance (Rθjc)
 * 15. Case-to-Sink Thermal Resistance (Rθcs)
 * 16. Sink-to-Ambient Thermal Resistance (Rθsa)
 * 17. Junction-to-Ambient Thermal Resistance (Rθja)
 * 18. Maximum Allowable Power Dissipation (P_max)
 * 19. Temperature Derating (Linear derating slope and limits)
 * 20. Multi-Device Case Temperature (Common heatsink sharing)
 */

export interface PackageThermalPreset {
  name: string;
  category: string;
  typicalRthJc: number; // °C/W
  typicalRthJaNoHeatsink: number; // °C/W
  typicalRthCsGreased: number; // °C/W
  maxTjDefault: number; // °C
}

export const SEMICONDUCTOR_PACKAGES: Record<string, PackageThermalPreset> = {
  to220: { name: 'TO-220 (Through-Hole)', category: 'Power', typicalRthJc: 1.5, typicalRthJaNoHeatsink: 65, typicalRthCsGreased: 0.5, maxTjDefault: 150 },
  to247: { name: 'TO-247 (Power Discrete)', category: 'Power', typicalRthJc: 0.8, typicalRthJaNoHeatsink: 40, typicalRthCsGreased: 0.3, maxTjDefault: 175 },
  to264: { name: 'TO-264 (High Power)', category: 'Power', typicalRthJc: 0.4, typicalRthJaNoHeatsink: 30, typicalRthCsGreased: 0.2, maxTjDefault: 175 },
  d2pak: { name: 'D2PAK / TO-263 (SMD Power)', category: 'SMD', typicalRthJc: 1.2, typicalRthJaNoHeatsink: 62, typicalRthCsGreased: 0.8, maxTjDefault: 150 },
  dpack: { name: 'DPAK / TO-252 (SMD Power)', category: 'SMD', typicalRthJc: 2.5, typicalRthJaNoHeatsink: 80, typicalRthCsGreased: 1.0, maxTjDefault: 150 },
  soic8: { name: 'SOIC-8 (Small Outline)', category: 'IC', typicalRthJc: 25, typicalRthJaNoHeatsink: 125, typicalRthCsGreased: 10, maxTjDefault: 150 },
  qfn32: { name: 'QFN-32 (Exposed Pad)', category: 'IC', typicalRthJc: 3.5, typicalRthJaNoHeatsink: 38, typicalRthCsGreased: 2.0, maxTjDefault: 125 },
  sot23: { name: 'SOT-23 (Small Signal)', category: 'Discrete', typicalRthJc: 90, typicalRthJaNoHeatsink: 330, typicalRthCsGreased: 40, maxTjDefault: 150 },
  sot223: { name: 'SOT-223 (Tabbed Discrete)', category: 'Discrete', typicalRthJc: 15, typicalRthJaNoHeatsink: 60, typicalRthCsGreased: 3.0, maxTjDefault: 150 },
  bga_high_perf: { name: 'High-Performance FC-BGA (Lidded)', category: 'Processor', typicalRthJc: 0.25, typicalRthJaNoHeatsink: 25, typicalRthCsGreased: 0.15, maxTjDefault: 105 },
};

export interface JunctionTempInput {
  powerDissipationWatts: number;
  ambientTempC: number;
  rthJcKW: number;
  rthCsKW?: number;
  rthSaKW?: number;
  maxJunctionTempC?: number;
}

export interface JunctionTempResult {
  junctionTempC: number;
  caseTempC: number;
  sinkTempC: number;
  ambientTempC: number;
  totalRthJaKW: number;
  tempMarginC: number;
  isSafe: boolean;
  statusText: string;
  formula: string;
}

/** 11. Junction Temperature Calculator: Tj = Ta + P·Rth_ja */
export function calculateJunctionTemperature(input: JunctionTempInput): JunctionTempResult {
  const { powerDissipationWatts: p, ambientTempC: ta, rthJcKW: rjc } = input;
  const rcs = input.rthCsKW ?? 0;
  const rsa = input.rthSaKW ?? 0;
  const tjMax = input.maxJunctionTempC ?? 150;

  if (p < 0) throw new Error('Power dissipation must be non-negative.');
  if (rjc < 0 || rcs < 0 || rsa < 0) throw new Error('Thermal resistance cannot be negative.');

  const rja = rjc + rcs + rsa;
  const ts = ta + p * rsa;
  const tc = ts + p * rcs;
  const tj = tc + p * rjc;

  const margin = tjMax - tj;
  const isSafe = margin >= 0;
  const statusText = margin > 25 ? 'EXCELLENT_MARGIN' : margin >= 0 ? 'MARGINAL_SAFE' : 'OVER_TEMPERATURE_FAULT';

  return {
    junctionTempC: Number(tj.toFixed(3)),
    caseTempC: Number(tc.toFixed(3)),
    sinkTempC: Number(ts.toFixed(3)),
    ambientTempC: ta,
    totalRthJaKW: Number(rja.toFixed(4)),
    tempMarginC: Number(margin.toFixed(3)),
    isSafe,
    statusText,
    formula: 'T_j = T_a + P_d · (R_θjc + R_θcs + R_θsa)',
  };
}

/** 12. Case Temperature Calculator: Tc = Tj - P·Rth_jc = Ta + P·(Rth_cs + Rth_sa) */
export function calculateCaseTemperature(
  mode: 'from_junction' | 'from_ambient',
  powerWatts: number,
  rthJcKW: number,
  tempC: number, // Tj if 'from_junction', Ta if 'from_ambient'
  rthCsKW: number = 0,
  rthSaKW: number = 0
): { caseTempC: number; formula: string } {
  if (powerWatts < 0) throw new Error('Power must be non-negative.');
  let tc = 0;
  let formula = '';
  if (mode === 'from_junction') {
    tc = tempC - powerWatts * rthJcKW;
    formula = 'T_c = T_j - P_d · R_θjc';
  } else {
    tc = tempC + powerWatts * (rthCsKW + rthSaKW);
    formula = 'T_c = T_a + P_d · (R_θcs + R_θsa)';
  }
  return { caseTempC: Number(tc.toFixed(3)), formula };
}

/** 13. Ambient Temperature Limit: Ta_max = Tj_max - P · Rth_ja */
export function calculateMaxAmbientTemperature(
  tjMaxC: number,
  powerWatts: number,
  rthJaKW: number
): { maxAmbientC: number; formula: string } {
  if (rthJaKW <= 0) throw new Error('Thermal resistance must be strictly positive.');
  if (powerWatts < 0) throw new Error('Power must be non-negative.');
  const taMax = tjMaxC - powerWatts * rthJaKW;
  return {
    maxAmbientC: Number(taMax.toFixed(3)),
    formula: 'T_{a,max} = T_{j,max} - P_d · R_{θ,ja}',
  };
}

/** 14. Junction-to-Case Resistance: Rθjc = (Tj - Tc) / P */
export function calculateRthJc(tjC: number, tcC: number, powerWatts: number): { rthJcKW: number; formula: string } {
  if (powerWatts <= 0) throw new Error('Power must be strictly positive.');
  if (tjC < tcC) throw new Error('Junction temperature must be greater than or equal to case temperature.');
  return {
    rthJcKW: Number(((tjC - tcC) / powerWatts).toFixed(4)),
    formula: 'R_{θ,jc} = (T_j - T_c) / P_d',
  };
}

/** 15. Case-to-Sink Resistance: Rθcs = (Tc - Ts) / P */
export function calculateRthCs(tcC: number, tsC: number, powerWatts: number): { rthCsKW: number; formula: string } {
  if (powerWatts <= 0) throw new Error('Power must be strictly positive.');
  if (tcC < tsC) throw new Error('Case temperature must be greater than or equal to sink temperature.');
  return {
    rthCsKW: Number(((tcC - tsC) / powerWatts).toFixed(4)),
    formula: 'R_{θ,cs} = (T_c - T_s) / P_d',
  };
}

/** 16. Sink-to-Ambient Resistance: Rθsa = (Ts - Ta) / P */
export function calculateRthSa(tsC: number, taC: number, powerWatts: number): { rthSaKW: number; formula: string } {
  if (powerWatts <= 0) throw new Error('Power must be strictly positive.');
  if (tsC < taC) throw new Error('Sink temperature must be greater than or equal to ambient temperature.');
  return {
    rthSaKW: Number(((tsC - taC) / powerWatts).toFixed(4)),
    formula: 'R_{θ,sa} = (T_s - T_a) / P_d',
  };
}

/** 17. Junction-to-Ambient Resistance: Rθja = Rθjc + Rθcs + Rθsa */
export function calculateRthJa(rjc: number, rcs: number, rsa: number): { rthJaKW: number; formula: string } {
  if (rjc < 0 || rcs < 0 || rsa < 0) throw new Error('Thermal resistance components must be non-negative.');
  return {
    rthJaKW: Number((rjc + rcs + rsa).toFixed(4)),
    formula: 'R_{θ,ja} = R_{θ,jc} + R_{θ,cs} + R_{θ,sa}',
  };
}

/** 18. Maximum Allowable Power Dissipation: P_max = (Tj_max - Ta) / Rth_ja */
export function calculateMaxAllowablePower(
  tjMaxC: number,
  ambientTempC: number,
  rthJaKW: number
): { maxPowerWatts: number; formula: string } {
  if (rthJaKW <= 0) throw new Error('Rth_ja must be strictly positive.');
  const deltaT = tjMaxC - ambientTempC;
  if (deltaT <= 0) return { maxPowerWatts: 0, formula: 'P_{max} = 0 W (Ambient exceeds Tj_max)' };
  const pMax = deltaT / rthJaKW;
  return {
    maxPowerWatts: Number(pMax.toFixed(3)),
    formula: 'P_{max} = (T_{j,max} - T_a) / R_{θ,ja}',
  };
}

export interface DeratingCurvePoint {
  temperatureC: number;
  deratedPowerWatts: number;
  deratingFactorPercent: number;
}

export interface DeratingCurveResult {
  pRatedWatts: number;
  tKneeC: number;
  tjMaxC: number;
  slopeDeratingWperC: number;
  points: DeratingCurvePoint[];
  currentOperatingPowerWatts: number;
  currentOperatingTempC: number;
  operatingPointDeratedLimitWatts: number;
  isOperatingWithinDerating: boolean;
  formula: string;
}

/** 19. Temperature Derating Curve */
export function calculateTemperatureDerating(
  pRatedWatts: number,
  tKneeC: number,
  tjMaxC: number,
  operatingTempC: number,
  operatingPowerWatts: number
): DeratingCurveResult {
  if (pRatedWatts <= 0) throw new Error('Rated power must be positive.');
  if (tjMaxC <= tKneeC) throw new Error('Maximum junction temperature must be greater than knee temperature.');

  const slope = pRatedWatts / (tjMaxC - tKneeC); // W/°C
  const points: DeratingCurvePoint[] = [];

  const minT = 0;
  const maxT = tjMaxC + 10;
  const step = 10;

  for (let t = minT; t <= maxT; t += step) {
    let p = 0;
    if (t <= tKneeC) {
      p = pRatedWatts;
    } else if (t < tjMaxC) {
      p = pRatedWatts - slope * (t - tKneeC);
    } else {
      p = 0;
    }
    const pct = (p / pRatedWatts) * 100;
    points.push({
      temperatureC: t,
      deratedPowerWatts: Number(p.toFixed(3)),
      deratingFactorPercent: Number(pct.toFixed(1)),
    });
  }

  let limitAtOp = 0;
  if (operatingTempC <= tKneeC) {
    limitAtOp = pRatedWatts;
  } else if (operatingTempC < tjMaxC) {
    limitAtOp = pRatedWatts - slope * (operatingTempC - tKneeC);
  } else {
    limitAtOp = 0;
  }

  const isWithin = operatingPowerWatts <= limitAtOp;

  return {
    pRatedWatts,
    tKneeC,
    tjMaxC,
    slopeDeratingWperC: Number(slope.toFixed(4)),
    points,
    currentOperatingPowerWatts: operatingPowerWatts,
    currentOperatingTempC: operatingTempC,
    operatingPointDeratedLimitWatts: Number(limitAtOp.toFixed(3)),
    isOperatingWithinDerating: isWithin,
    formula: 'P_{derated}(T) = P_{rated} · [1 - (T - T_{knee}) / (T_{j,max} - T_{knee})] (for T > T_{knee})',
  };
}

export interface SharedHeatsinkDevice {
  id: string;
  name: string;
  powerWatts: number;
  rthJcKW: number;
  rthCsKW: number;
  tjMaxC: number;
}

export interface MultiDeviceThermalResult {
  ambientTempC: number;
  rthSaKW: number;
  totalPowerWatts: number;
  heatsinkTempC: number;
  devices: Array<{
    id: string;
    name: string;
    powerWatts: number;
    caseTempC: number;
    junctionTempC: number;
    marginC: number;
    isSafe: boolean;
  }>;
  overallSafe: boolean;
}

/** 20. Multi-Device Case Temperature on Shared Heatsink */
export function calculateMultiDeviceThermal(
  devices: SharedHeatsinkDevice[],
  rthSaKW: number,
  ambientTempC: number
): MultiDeviceThermalResult {
  if (devices.length === 0) throw new Error('At least one device required.');
  if (rthSaKW < 0) throw new Error('Sink thermal resistance cannot be negative.');

  let totalPower = 0;
  for (const d of devices) {
    if (d.powerWatts < 0) throw new Error('Power must be non-negative.');
    totalPower += d.powerWatts;
  }

  const heatsinkTemp = ambientTempC + totalPower * rthSaKW;
  let overallSafe = true;

  const analyzed = devices.map((d) => {
    const tc = heatsinkTemp + d.powerWatts * d.rthCsKW;
    const tj = tc + d.powerWatts * d.rthJcKW;
    const margin = d.tjMaxC - tj;
    const isSafe = margin >= 0;
    if (!isSafe) overallSafe = false;

    return {
      id: d.id,
      name: d.name,
      powerWatts: d.powerWatts,
      caseTempC: Number(tc.toFixed(3)),
      junctionTempC: Number(tj.toFixed(3)),
      marginC: Number(margin.toFixed(3)),
      isSafe,
    };
  });

  return {
    ambientTempC,
    rthSaKW,
    totalPowerWatts: Number(totalPower.toFixed(3)),
    heatsinkTempC: Number(heatsinkTemp.toFixed(3)),
    devices: analyzed,
    overallSafe,
  };
}
