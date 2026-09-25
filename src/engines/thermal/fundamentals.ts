/**
 * ElectroKit — Thermal Engineering Subsystem
 * Module A: Thermal Fundamentals (Tools 1 - 10)
 *
 * Implements:
 * 1. Heat Energy Calculator (Q = m·c·ΔT)
 * 2. Heat Transfer Rate Calculator (q = Q/t, q = ΔT/Rth, Fourier's law)
 * 3. Temperature Conversion (°C, °F, K, °R)
 * 4. Temperature Difference Calculator (ΔT conversions)
 * 5. Thermal Resistance Calculator (Rth = L/(k·A), Rth = ΔT/P)
 * 6. Thermal Conductance Calculator (Gth = 1/Rth = k·A/L)
 * 7. Thermal Resistance Network (Nodal ladder solver)
 * 8. Series Thermal Resistance (Rth_total = ∑ Rth_i)
 * 9. Parallel Thermal Resistance (1/Rth_total = ∑ 1/Rth_i)
 * 10. Thermal Resistance ↔ Conductance (Bidirectional)
 */

export interface MaterialSpecificHeat {
  name: string;
  category: string;
  c_p: number; // J/(kg·K)
  density: number; // kg/m³
  thermalConductivity: number; // W/(m·K)
}

export const THERMAL_MATERIALS: Record<string, MaterialSpecificHeat> = {
  copper: { name: 'Copper (Pure)', category: 'Metal', c_p: 385, density: 8960, thermalConductivity: 398 },
  aluminum_6061: { name: 'Aluminum 6061-T6', category: 'Metal', c_p: 896, density: 2700, thermalConductivity: 167 },
  aluminum_pure: { name: 'Aluminum (Pure)', category: 'Metal', c_p: 900, density: 2700, thermalConductivity: 237 },
  silicon: { name: 'Silicon (Semiconductor Die)', category: 'Semiconductor', c_p: 705, density: 2330, thermalConductivity: 148 },
  fr4: { name: 'FR4 PCB Substrate', category: 'Composite', c_p: 1100, density: 1850, thermalConductivity: 0.3 },
  air_25c: { name: 'Air (1 atm, 25°C)', category: 'Gas', c_p: 1005, density: 1.184, thermalConductivity: 0.0262 },
  water_25c: { name: 'Water (Liquid, 25°C)', category: 'Liquid', c_p: 4184, density: 997, thermalConductivity: 0.606 },
  iron_steel: { name: 'Carbon Steel', category: 'Metal', c_p: 490, density: 7850, thermalConductivity: 50 },
  solder_sac305: { name: 'SAC305 Solder Alloy', category: 'Alloy', c_p: 220, density: 7400, thermalConductivity: 58 },
  gold: { name: 'Gold (Wire Bonding)', category: 'Metal', c_p: 129, density: 19300, thermalConductivity: 317 },
  silver: { name: 'Silver', category: 'Metal', c_p: 235, density: 10490, thermalConductivity: 429 },
  alumina_al2o3: { name: 'Alumina Ceramic (Al2O3)', category: 'Ceramic', c_p: 880, density: 3900, thermalConductivity: 25 },
};

export interface HeatEnergyInput {
  massKg: number;
  specificHeatJkgK: number;
  deltaTKelvin: number;
}

export interface HeatEnergyResult {
  energyJoules: number;
  energyKiloJoules: number;
  energyWattHours: number;
  energyBtu: number;
  thermalCapacitanceJK: number;
  formula: string;
}

/** 1. Heat Energy Calculator: Q = m · c · ΔT */
export function calculateHeatEnergy(input: HeatEnergyInput): HeatEnergyResult {
  const { massKg, specificHeatJkgK, deltaTKelvin } = input;
  if (massKg < 0 || specificHeatJkgK < 0 || deltaTKelvin < 0) {
    throw new Error('Mass, specific heat capacity, and delta T must be non-negative.');
  }

  const c_th = massKg * specificHeatJkgK;
  const q_joules = c_th * deltaTKelvin;
  const q_kj = q_joules / 1000;
  const q_wh = q_joules / 3600;
  const q_btu = q_joules * 0.000947817;

  return {
    energyJoules: q_joules,
    energyKiloJoules: q_kj,
    energyWattHours: q_wh,
    energyBtu: q_btu,
    thermalCapacitanceJK: c_th,
    formula: 'Q = m · c_p · ΔT = C_th · ΔT',
  };
}

export interface HeatTransferRateInput {
  mode: 'energy_time' | 'resistance_deltaT' | 'conduction_geometry';
  energyJoules?: number;
  timeSeconds?: number;
  deltaTKelvin?: number;
  thermalResistanceKW?: number;
  thermalConductivityWmK?: number;
  areaM2?: number;
  lengthMeters?: number;
}

export interface HeatTransferRateResult {
  heatRateWatts: number;
  heatRateKiloWatts: number;
  heatRateBtuPerHour: number;
  heatRateCaloriesPerSec: number;
  effectiveResistanceKW: number;
  formula: string;
}

/** 2. Heat Transfer Rate Calculator: q = Q/t = ΔT / Rth */
export function calculateHeatTransferRate(input: HeatTransferRateInput): HeatTransferRateResult {
  let q_watts = 0;
  let r_th = 0;
  let formula = '';

  if (input.mode === 'energy_time') {
    const q = input.energyJoules ?? 0;
    const t = input.timeSeconds ?? 1;
    if (t <= 0) throw new Error('Time must be strictly positive.');
    q_watts = q / t;
    formula = 'q = Q / t';
    r_th = input.deltaTKelvin && q_watts > 0 ? input.deltaTKelvin / q_watts : 0;
  } else if (input.mode === 'resistance_deltaT') {
    const dt = input.deltaTKelvin ?? 0;
    r_th = input.thermalResistanceKW ?? 1;
    if (r_th <= 0) throw new Error('Thermal resistance must be strictly positive.');
    q_watts = dt / r_th;
    formula = 'q = ΔT / R_th';
  } else {
    const k = input.thermalConductivityWmK ?? 1;
    const a = input.areaM2 ?? 1;
    const l = input.lengthMeters ?? 1;
    const dt = input.deltaTKelvin ?? 0;
    if (k <= 0 || a <= 0 || l <= 0) throw new Error('Conductivity, area, and length must be strictly positive.');
    r_th = l / (k * a);
    q_watts = dt / r_th;
    formula = 'q = (k · A / L) · ΔT = ΔT / R_th';
  }

  return {
    heatRateWatts: q_watts,
    heatRateKiloWatts: q_watts / 1000,
    heatRateBtuPerHour: q_watts * 3.412142,
    heatRateCaloriesPerSec: q_watts * 0.238846,
    effectiveResistanceKW: r_th,
    formula,
  };
}

export type TemperatureUnit = 'C' | 'F' | 'K' | 'R';

export interface TemperatureConversionResult {
  celsius: number;
  fahrenheit: number;
  kelvin: number;
  rankine: number;
}

/** 3. Temperature Conversion */
export function convertTemperature(value: number, fromUnit: TemperatureUnit): TemperatureConversionResult {
  let c = 0;
  switch (fromUnit) {
    case 'C':
      c = value;
      break;
    case 'F':
      c = (value - 32) * (5 / 9);
      break;
    case 'K':
      c = value - 273.15;
      break;
    case 'R':
      c = (value - 491.67) * (5 / 9);
      break;
  }

  const k = c + 273.15;
  if (k < 0) {
    throw new Error('Temperature cannot be below absolute zero (0 K / -273.15 °C).');
  }

  const f = c * (9 / 5) + 32;
  const r = k * (9 / 5);

  return {
    celsius: Number(c.toFixed(6)),
    fahrenheit: Number(f.toFixed(6)),
    kelvin: Number(k.toFixed(6)),
    rankine: Number(r.toFixed(6)),
  };
}

export interface TemperatureDifferenceResult {
  deltaCelsius: number;
  deltaKelvin: number;
  deltaFahrenheit: number;
  deltaRankine: number;
}

/** 4. Temperature Difference Calculator: 1 °C ΔT = 1 K ΔT = 1.8 °F ΔT = 1.8 °R ΔT */
export function calculateTemperatureDifference(tHot: number, tCold: number, unit: TemperatureUnit): TemperatureDifferenceResult {
  const hot = convertTemperature(tHot, unit);
  const cold = convertTemperature(tCold, unit);
  const deltaC = hot.celsius - cold.celsius;
  const deltaK = deltaC; // 1:1 ratio
  const deltaF = deltaC * 1.8;
  const deltaR = deltaF;

  return {
    deltaCelsius: deltaC,
    deltaKelvin: deltaK,
    deltaFahrenheit: deltaF,
    deltaRankine: deltaR,
  };
}

export interface ThermalResistanceInput {
  mode: 'geometry' | 'power_temp';
  lengthMeters?: number;
  thermalConductivityWmK?: number;
  areaM2?: number;
  deltaTKelvin?: number;
  powerWatts?: number;
}

export interface ThermalResistanceResult {
  resistanceKW: number;
  conductanceWK: number;
  formula: string;
}

/** 5. Thermal Resistance Calculator: Rth = L / (k·A) or ΔT / P */
export function calculateThermalResistance(input: ThermalResistanceInput): ThermalResistanceResult {
  let r_th = 0;
  let formula = '';

  if (input.mode === 'geometry') {
    const l = input.lengthMeters ?? 0;
    const k = input.thermalConductivityWmK ?? 0;
    const a = input.areaM2 ?? 0;
    if (l <= 0 || k <= 0 || a <= 0) {
      throw new Error('Length, thermal conductivity, and area must be positive.');
    }
    r_th = l / (k * a);
    formula = 'R_th = L / (k · A)';
  } else {
    const dt = input.deltaTKelvin ?? 0;
    const p = input.powerWatts ?? 0;
    if (p <= 0) throw new Error('Power dissipation must be strictly positive.');
    r_th = dt / p;
    formula = 'R_th = ΔT / P';
  }

  return {
    resistanceKW: r_th,
    conductanceWK: r_th > 0 ? 1 / r_th : 0,
    formula,
  };
}

/** 6. Thermal Conductance Calculator: Gth = 1/Rth = k·A/L */
export function calculateThermalConductance(k: number, a: number, l: number): { conductanceWK: number; resistanceKW: number } {
  if (k <= 0 || a <= 0 || l <= 0) throw new Error('Conductivity, area, and length must be positive.');
  const g_th = (k * a) / l;
  return {
    conductanceWK: g_th,
    resistanceKW: 1 / g_th,
  };
}

export interface ThermalBranch {
  id: string;
  name: string;
  resistanceKW: number;
}

export interface SeriesThermalResistanceResult {
  totalResistanceKW: number;
  totalConductanceWK: number;
  voltageEquivalentDrops: Array<{ id: string; name: string; resistanceKW: number; deltaTKelvin: number; percentage: number }>;
}

/** 8. Series Thermal Resistance: Rth_total = ∑ Rth_i */
export function calculateSeriesThermalResistance(branches: ThermalBranch[], powerWatts: number): SeriesThermalResistanceResult {
  if (branches.length === 0) throw new Error('At least one thermal resistance branch required.');
  let totalR = 0;
  for (const b of branches) {
    if (b.resistanceKW < 0) throw new Error('Thermal resistance cannot be negative.');
    totalR += b.resistanceKW;
  }

  const drops = branches.map((b) => {
    const dt = powerWatts * b.resistanceKW;
    const pct = totalR > 0 ? (b.resistanceKW / totalR) * 100 : 0;
    return {
      id: b.id,
      name: b.name,
      resistanceKW: b.resistanceKW,
      deltaTKelvin: dt,
      percentage: pct,
    };
  });

  return {
    totalResistanceKW: totalR,
    totalConductanceWK: totalR > 0 ? 1 / totalR : 0,
    voltageEquivalentDrops: drops,
  };
}

export interface ParallelThermalResistanceResult {
  totalResistanceKW: number;
  totalConductanceWK: number;
  branchHeatFlows: Array<{ id: string; name: string; resistanceKW: number; heatFlowWatts: number; percentage: number }>;
}

/** 9. Parallel Thermal Resistance: 1/Rth_total = ∑ 1/Rth_i */
export function calculateParallelThermalResistance(branches: ThermalBranch[], totalPowerWatts: number): ParallelThermalResistanceResult {
  if (branches.length === 0) throw new Error('At least one thermal resistance branch required.');
  let totalG = 0;
  for (const b of branches) {
    if (b.resistanceKW <= 0) throw new Error('Parallel thermal resistance must be strictly positive.');
    totalG += 1 / b.resistanceKW;
  }

  const totalR = 1 / totalG;
  const flows = branches.map((b) => {
    const g = 1 / b.resistanceKW;
    const flow = totalPowerWatts * (g / totalG);
    const pct = (g / totalG) * 100;
    return {
      id: b.id,
      name: b.name,
      resistanceKW: b.resistanceKW,
      heatFlowWatts: flow,
      percentage: pct,
    };
  });

  return {
    totalResistanceKW: totalR,
    totalConductanceWK: totalG,
    branchHeatFlows: flows,
  };
}

/** 10. Thermal Resistance ↔ Conductance Converter */
export function convertResistanceConductance(value: number, from: 'R' | 'G'): { resistanceKW: number; conductanceWK: number } {
  if (value <= 0) throw new Error('Value must be strictly positive.');
  if (from === 'R') {
    return { resistanceKW: value, conductanceWK: 1 / value };
  } else {
    return { resistanceKW: 1 / value, conductanceWK: value };
  }
}

export interface ThermalNetworkNode {
  id: string;
  name: string;
  heatSourceWatts?: number; // Injected heat flow (e.g. semiconductor die)
  fixedTemperatureC?: number; // Boundary temperature (e.g. ambient air Ta = 25°C)
}

export interface ThermalNetworkResistor {
  fromNodeId: string;
  toNodeId: string;
  resistanceKW: number;
}

export interface ThermalNetworkSolution {
  nodeTemperaturesC: Record<string, number>;
  branchHeatFlowsWatts: Array<{ from: string; to: string; heatFlowWatts: number; resistanceKW: number }>;
}

/** 7. Thermal Resistance Network: General nodal thermal solver using Modified Nodal Analysis (MNA) */
export function solveThermalNetwork(
  nodes: ThermalNetworkNode[],
  resistors: ThermalNetworkResistor[]
): ThermalNetworkSolution {
  const n = nodes.length;
  if (n < 2) throw new Error('Thermal network requires at least 2 nodes.');

  // Find fixed nodes and unknown nodes
  const fixedMap = new Map<string, number>();
  const unknownIndices: string[] = [];
  const nodeIndexMap = new Map<string, number>();

  nodes.forEach((node, idx) => {
    nodeIndexMap.set(node.id, idx);
    if (node.fixedTemperatureC !== undefined) {
      fixedMap.set(node.id, node.fixedTemperatureC);
    } else {
      unknownIndices.push(node.id);
    }
  });

  if (fixedMap.size === 0) {
    throw new Error('At least one node must have a fixed reference boundary temperature (e.g., ambient).');
  }

  const uCount = unknownIndices.length;
  if (uCount === 0) {
    // All nodes are fixed
    const temps: Record<string, number> = {};
    nodes.forEach((node) => {
      temps[node.id] = node.fixedTemperatureC!;
    });
    const flows = resistors.map((r) => {
      const t1 = temps[r.fromNodeId];
      const t2 = temps[r.toNodeId];
      return {
        from: r.fromNodeId,
        to: r.toNodeId,
        heatFlowWatts: (t1 - t2) / r.resistanceKW,
        resistanceKW: r.resistanceKW,
      };
    });
    return { nodeTemperaturesC: temps, branchHeatFlowsWatts: flows };
  }

  // Build conductance matrix G and right-hand side vector I for unknown nodes
  const G: number[][] = Array.from({ length: uCount }, () => Array(uCount).fill(0));
  const I: number[] = Array(uCount).fill(0);

  const unknownMap = new Map<string, number>();
  unknownIndices.forEach((id, idx) => unknownMap.set(id, idx));

  // Add nodal heat injections
  nodes.forEach((node) => {
    if (unknownMap.has(node.id)) {
      const uIdx = unknownMap.get(node.id)!;
      I[uIdx] += node.heatSourceWatts || 0;
    }
  });

  // Stamp resistors into G and I
  for (const r of resistors) {
    if (r.resistanceKW <= 0) throw new Error('Thermal branch resistance must be strictly positive.');
    const g = 1 / r.resistanceKW;
    const isFromUnknown = unknownMap.has(r.fromNodeId);
    const isToUnknown = unknownMap.has(r.toNodeId);

    if (isFromUnknown && isToUnknown) {
      const i = unknownMap.get(r.fromNodeId)!;
      const j = unknownMap.get(r.toNodeId)!;
      G[i][i] += g;
      G[j][j] += g;
      G[i][j] -= g;
      G[j][i] -= g;
    } else if (isFromUnknown && !isToUnknown) {
      const i = unknownMap.get(r.fromNodeId)!;
      const tFixed = fixedMap.get(r.toNodeId)!;
      G[i][i] += g;
      I[i] += g * tFixed;
    } else if (!isFromUnknown && isToUnknown) {
      const j = unknownMap.get(r.toNodeId)!;
      const tFixed = fixedMap.get(r.fromNodeId)!;
      G[j][j] += g;
      I[j] += g * tFixed;
    }
  }

  // Gaussian elimination solver
  for (let i = 0; i < uCount; i++) {
    let pivot = i;
    for (let r = i + 1; r < uCount; r++) {
      if (Math.abs(G[r][i]) > Math.abs(G[pivot][i])) pivot = r;
    }
    if (Math.abs(G[pivot][i]) < 1e-12) {
      throw new Error('Thermal network conductance matrix is singular. Ensure all nodes are connected to a reference.');
    }
    // Swap rows
    [G[i], G[pivot]] = [G[pivot], G[i]];
    [I[i], I[pivot]] = [I[pivot], I[i]];

    const diag = G[i][i];
    for (let j = i; j < uCount; j++) G[i][j] /= diag;
    I[i] /= diag;

    for (let r = 0; r < uCount; r++) {
      if (r !== i) {
        const factor = G[r][i];
        for (let j = i; j < uCount; j++) G[r][j] -= factor * G[i][j];
        I[r] -= factor * I[i];
      }
    }
  }

  const resultTemps: Record<string, number> = {};
  nodes.forEach((node) => {
    if (node.fixedTemperatureC !== undefined) {
      resultTemps[node.id] = node.fixedTemperatureC;
    } else {
      const uIdx = unknownMap.get(node.id)!;
      resultTemps[node.id] = Number(I[uIdx].toFixed(4));
    }
  });

  const branchFlows = resistors.map((r) => {
    const t1 = resultTemps[r.fromNodeId];
    const t2 = resultTemps[r.toNodeId];
    return {
      from: r.fromNodeId,
      to: r.toNodeId,
      heatFlowWatts: Number(((t1 - t2) / r.resistanceKW).toFixed(4)),
      resistanceKW: r.resistanceKW,
    };
  });

  return {
    nodeTemperaturesC: resultTemps,
    branchHeatFlowsWatts: branchFlows,
  };
}
