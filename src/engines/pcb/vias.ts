/**
 * PCB Via Engineering Engine
 * 
 * Implements:
 * - Via geometry (drill hole, plated barrel, pad diameter, annular ring)
 * - Cylindrical-shell via DC resistance R_via = ρ(T)·h / A_barrel
 * - Via current ampacity & voltage drop V = I·R_via
 * - Thermal via conduction resistance R_theta = h / (k_cu · A_barrel)
 * - Parallel via array calculator (electrical & thermal impedance reduction)
 * - Parasitic via inductance approximation
 * 
 * Engineering Classification:
 * - Geometry & Resistance: THEORETICAL / GEOMETRIC CALCULATION
 * - Current Capacity & Thermal Spreading: ENGINEERING ESTIMATE
 */

import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { COPPER_RESISTIVITY_20C, COPPER_TEMP_COEFF_20C, COPPER_THERMAL_CONDUCTIVITY } from '../../lib/constants';

export interface ViaGeometryInputs {
  drillDiameterMeters: number;      // e.g. 0.3 mm = 0.0003 m
  padDiameterMeters: number;        // e.g. 0.6 mm = 0.0006 m
  boardThicknessMeters: number;     // e.g. 1.6 mm = 0.0016 m
  platingThicknessMeters?: number;  // e.g. 25 µm = 0.000025 m (typical 1 mil)
  antipadDiameterMeters?: number;   // e.g. 0.8 mm (plane antipad opening)
  relativePermittivityEr?: number;  // substrate Er, default 4.2
  temperatureC?: number;
  currentAmps?: number;
}

export interface ViaGeometryOutputs {
  finishedHoleMeters: number;
  annularRingMeters: number;
  annularRingMils: number;
  barrelAreaM2: number;
  barrelAreaMil2: number;
  resistanceOhms: number;
  inductanceHenries: number;
  capacitanceFarads?: number;
  thermalResistanceKPerW: number;
  voltageDropVolts?: number;
  powerLossWatts?: number;
  estimatedAmpacityAmps: number;
}

/**
 * Calculates geometric annular ring, barrel cross-sectional area,
 * DC resistance, parasitic inductance, and thermal resistance of a PCB plated via.
 */
export function calculateViaProperties(inputs: ViaGeometryInputs): CalculationResult & { outputs: ViaGeometryOutputs } {
  const {
    drillDiameterMeters: Ddrill,
    padDiameterMeters: Dpad,
    boardThicknessMeters: h,
    platingThicknessMeters: tPlate = 25e-6, // standard 25 µm / 1 mil plating
    temperatureC = 25,
    currentAmps: I,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const safeDrill = Math.max(0.0001, Ddrill);
  const safePad = Math.max(safeDrill, Dpad);
  const safeH = Math.max(0.0002, h);
  const safePlate = Math.min(safeDrill / 3, Math.max(10e-6, tPlate));

  // 1. Finished hole diameter
  const finishedHole = safeDrill - 2 * safePlate;

  // 2. Annular ring: AR = (Pad - Drill) / 2
  const annularRing = (safePad - safeDrill) / 2;
  const annularRingMils = annularRing / 0.0000254;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Annular Ring & Finished Hole Geometry',
    formula: 'AR = (D_pad − D_drill) / 2 | D_finished = D_drill − 2 × t_plating',
    substitution: `AR = (${(safePad * 1e3).toFixed(2)} mm − ${(safeDrill * 1e3).toFixed(2)} mm) / 2 | D_fin = ${(safeDrill * 1e3).toFixed(2)} mm − 2 × ${(safePlate * 1e6).toFixed(1)} µm`,
    result: `Annular Ring = ${(annularRing * 1e3).toFixed(3)} mm (${annularRingMils.toFixed(1)} mil) | Finished Hole = ${(finishedHole * 1e3).toFixed(3)} mm`,
    annotation: annularRingMils < 4.0 ? 'Warning: Annular ring is below standard IPC Class 2 minimum (4–5 mil).' : 'Meets standard IPC Class 2 requirement.',
  });

  if (annularRingMils < 4.0) {
    warnings.push({
      severity: 'warning',
      title: 'Sub-Standard Annular Ring',
      message: `Annular ring (${annularRingMils.toFixed(1)} mil / ${(annularRing * 1e3).toFixed(2)} mm) is below standard IPC-A-600 / IPC-2221 Class 2 minimum (typically 4.0–5.0 mil). Risk of drill breakout during mechanical registration.`,
    });
  }

  // 3. Barrel Copper Cross-Section Area (Hollow Cylinder):
  // A_barrel = pi * t_plate * (D_drill - t_plate)
  const barrelAreaM2 = Math.PI * safePlate * (safeDrill - safePlate);
  const barrelAreaMil2 = barrelAreaM2 / (0.0000254 * 0.0000254);
  const barrelAreaMm2 = barrelAreaM2 * 1e6;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Plated Barrel Cross-Sectional Area (Cylindrical Shell)',
    formula: 'A_barrel = π × t_plating × (D_drill − t_plating)',
    substitution: `A = π × ${(safePlate * 1e6).toFixed(1)} µm × (${(safeDrill * 1e3).toFixed(3)} mm − ${(safePlate * 1e3).toFixed(3)} mm)`,
    result: `${barrelAreaMm2.toFixed(4)} mm² (${barrelAreaMil2.toFixed(1)} mil²)`,
  });

  // 4. DC Resistance
  const rhoT = COPPER_RESISTIVITY_20C * (1 + COPPER_TEMP_COEFF_20C * (temperatureC - 20));
  const rVia = (rhoT * safeH) / barrelAreaM2;

  steps.push({
    stepNumber: 3,
    title: 'Calculate Via DC Barrel Resistance',
    formula: 'R_via = ρ(T) × h_board / A_barrel',
    substitution: `R = (${rhoT.toExponential(4)} Ω·m × ${(safeH * 1e3).toFixed(2)} mm) / ${barrelAreaM2.toExponential(4)} m²`,
    result: `${(rVia * 1e3).toFixed(3)} mΩ (${rVia.toFixed(5)} Ω)`,
  });

  // 5. Parasitic Inductance approximation: L ≈ (μ0*h / 2pi) * [ ln(4h/d) + 1 ]
  // For standard PCB via: ~0.8 to 1.5 nH
  const mu0 = 4 * Math.PI * 1e-7;
  const lVia = (mu0 * safeH / (2 * Math.PI)) * (Math.log((4 * safeH) / safeDrill) + 1);

  // 5. Parasitic Self-Capacitance (Johnson / Howard approximation for pad over ground plane antipad)
  // C_via ≈ 1.41 * ε_r * h * D_pad / (D_antipad - D_pad) in metric
  const er = inputs.relativePermittivityEr ?? 4.2;
  const dAntipad = inputs.antipadDiameterMeters ?? (safePad + 0.4e-3); // default +0.4 mm antipad clearance
  const dClearance = Math.max(0.05e-3, dAntipad - safePad);
  const eps0 = 8.854e-12;
  // C_via = (1.41 * eps0 * er * safeH * safePad) / dClearance
  const cVia = (1.41 * eps0 * er * safeH * safePad) / dClearance;

  steps.push({
    stepNumber: 4,
    title: 'Estimate Parasitic Via Loop Inductance & Self-Capacitance',
    formula: 'L_via ≈ (μ₀ × h / 2π) × [ ln(4h / D_drill) + 1 ] | C_via ≈ 1.41·ε_r·ε₀·h·D_pad / (D_antipad − D_pad)',
    substitution: `L ≈ (4π×10⁻⁷ × ${(safeH * 1e3).toFixed(2)} mm / 2π) × [ ln(4 × ${safeH} / ${safeDrill}) + 1 ] | C ≈ ${(cVia * 1e12).toFixed(2)} pF`,
    result: `L_via = ${(lVia * 1e9).toFixed(2)} nH | C_via = ${(cVia * 1e12).toFixed(2)} pF`,
    annotation: 'Parasitic via inductance and capacitance form a localized low-pass Pi filter causing impedance dip on high-speed edges.',
  });

  // 6. Thermal Resistance of Copper Barrel
  // R_theta = h / (k_cu * A_barrel)
  const rTheta = safeH / (COPPER_THERMAL_CONDUCTIVITY * barrelAreaM2);

  steps.push({
    stepNumber: 5,
    title: 'Calculate Thermal Conduction Resistance (R_θ)',
    formula: 'R_θ = h_board / (k_Cu × A_barrel)',
    substitution: `R_θ = ${(safeH * 1e3).toFixed(2)} mm / (398 W/(m·K) × ${barrelAreaM2.toExponential(4)} m²)`,
    result: `${rTheta.toFixed(1)} °C/W (K/W)`,
    annotation: 'Conductive heat path from top copper pad to bottom copper plane or thermal relief.',
  });

  // 7. Ampacity Estimate (IPC-2152 based for equivalent cross section, ~30 A/mm² safe limit)
  const estimatedAmpacity = barrelAreaMm2 * 30; // 30 A/mm² rule of thumb for 10°C rise

  let vDrop: number | undefined;
  let pLoss: number | undefined;

  if (I !== undefined && I > 0) {
    vDrop = I * rVia;
    pLoss = I * I * rVia;

    steps.push({
      stepNumber: 6,
      title: 'Calculate Operating Voltage Drop & Thermal Dissipation at Load Current',
      formula: 'V_drop = I × R_via | P = I² × R_via',
      substitution: `V = ${I} A × ${(rVia * 1e3).toFixed(2)} mΩ | P = (${I} A)² × ${(rVia * 1e3).toFixed(2)} mΩ`,
      result: `V_drop = ${(vDrop * 1e3).toFixed(2)} mV | P = ${(pLoss * 1e3).toFixed(3)} mW`,
    });

    if (I > estimatedAmpacity * 1.5) {
      warnings.push({
        severity: 'danger',
        title: 'Via Current Exceeds Safe Ampacity',
        message: `Current (${I} A) exceeds single via estimated safe capacity (${estimatedAmpacity.toFixed(2)} A for ~10°C rise). Add parallel vias to prevent barrel thermal fatigue and cracking.`,
      });
    }
  }

  // Board Aspect Ratio Check
  const aspectRatio = safeH / safeDrill;
  if (aspectRatio > 8.0) {
    warnings.push({
      severity: 'warning',
      title: 'High Aspect Ratio Drill (>8:1)',
      message: `Aspect ratio (${aspectRatio.toFixed(1)}:1) is challenging for standard through-hole copper plating. Most standard fabs prefer aspect ratios ≤8:1 to avoid thin barrel plating at the board center.`,
    });
  }

  const formatted = `${(rVia * 1e3).toFixed(3)} mΩ`;

  return {
    label: 'Via DC Resistance',
    primaryValue: rVia,
    primaryUnit: 'Ω',
    formattedValue: formatted,
    formattedResult: formatted,
    steps,
    warnings,
    equationUsed: 'R_via = ρ·h / A_barrel | R_θ = h / (k_Cu·A_barrel) | AR = (D_pad − D_drill)/2',
    engineeringModel: 'THEORETICAL',
    standardsContext: 'IPC-2221B / IPC-A-600 Class 2 & 3 Annular Ring and Barrel Plating Specifications.',
    additionalOutputs: {
      resistanceMilliOhms: { label: 'DC Resistance', value: `${(rVia * 1e3).toFixed(3)} mΩ` },
      annularRing: { label: 'Annular Ring', value: `${(annularRing * 1e3).toFixed(3)} mm (${annularRingMils.toFixed(1)} mil)` },
      finishedHole: { label: 'Finished Hole Size', value: `${(finishedHole * 1e3).toFixed(3)} mm (${(finishedHole / 0.0000254).toFixed(1)} mil)` },
      parasiticInductance: { label: 'Parasitic Inductance', value: `${(lVia * 1e9).toFixed(2)} nH` },
      parasiticCapacitance: { label: 'Parasitic Capacitance', value: `${(cVia * 1e12).toFixed(2)} pF` },
      thermalResistance: { label: 'Thermal Resistance', value: `${rTheta.toFixed(1)} °C/W` },
      estimatedAmpacity: { label: 'Estimated Ampacity (~10°C rise)', value: `${estimatedAmpacity.toFixed(2)} A` },
      ...(vDrop ? { voltageDrop: { label: 'Voltage Drop at Current', value: `${(vDrop * 1e3).toFixed(2)} mV` } } : {}),
      ...(pLoss ? { powerDissipation: { label: 'Power Dissipation', value: `${(pLoss * 1e3).toFixed(3)} mW` } } : {}),
    },
    outputs: {
      finishedHoleMeters: finishedHole,
      annularRingMeters: annularRing,
      annularRingMils,
      barrelAreaM2,
      barrelAreaMil2,
      resistanceOhms: rVia,
      inductanceHenries: lVia,
      capacitanceFarads: cVia,
      thermalResistanceKPerW: rTheta,
      voltageDropVolts: vDrop,
      powerLossWatts: pLoss,
      estimatedAmpacityAmps: estimatedAmpacity,
    },
  };
}

export interface ViaArrayInputs {
  targetCurrentAmps?: number;
  targetThermalResistanceKPerW?: number;
  singleViaProperties: {
    resistanceOhms: number;
    thermalResistanceKPerW: number;
    estimatedAmpacityAmps: number;
    drillDiameterMeters: number;
  };
  gridPitchMeters?: number; // e.g. 1.0 mm = 0.001 m
}

export interface ViaArrayOutputs {
  recommendedCount: number;
  arrayResistanceOhms: number;
  arrayThermalResistanceKPerW: number;
  arrayAmpacityAmps: number;
  gridRows: number;
  gridCols: number;
  arrayWidthMeters: number;
  arrayHeightMeters: number;
}

/**
 * Sizes parallel via arrays for high-current power planes or thermal pads (e.g. QFN thermal slugs).
 */
export function calculateViaArray(inputs: ViaArrayInputs): CalculationResult & { outputs: ViaArrayOutputs } {
  const {
    targetCurrentAmps,
    targetThermalResistanceKPerW,
    singleViaProperties: sv,
    gridPitchMeters = 0.001, // 1 mm pitch
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let countForCurrent = 1;
  if (targetCurrentAmps && targetCurrentAmps > 0) {
    countForCurrent = Math.ceil(targetCurrentAmps / Math.max(0.1, sv.estimatedAmpacityAmps));
  }

  let countForThermal = 1;
  if (targetThermalResistanceKPerW && targetThermalResistanceKPerW > 0) {
    countForThermal = Math.ceil(sv.thermalResistanceKPerW / targetThermalResistanceKPerW);
  }

  const recommendedCount = Math.max(1, Math.max(countForCurrent, countForThermal));
  const arrayResistance = sv.resistanceOhms / recommendedCount;
  const arrayThermal = sv.thermalResistanceKPerW / recommendedCount;
  const arrayAmpacity = sv.estimatedAmpacityAmps * recommendedCount;

  // Grid sizing: arrange into roughly square NxM matrix
  const cols = Math.ceil(Math.sqrt(recommendedCount));
  const rows = Math.ceil(recommendedCount / cols);
  const arrayWidth = (cols - 1) * gridPitchMeters;
  const arrayHeight = (rows - 1) * gridPitchMeters;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Required Number of Parallel Vias',
    formula: 'N_current = ⌈ I_target / I_via ⌉ | N_thermal = ⌈ R_θ,via / R_θ,target ⌉',
    substitution: `N = max(⌈${targetCurrentAmps ?? 0} A / ${sv.estimatedAmpacityAmps.toFixed(2)} A⌉, ⌈${sv.thermalResistanceKPerW.toFixed(1)} / ${targetThermalResistanceKPerW ?? 'N/A'}⌉)`,
    result: `${recommendedCount} vias (${rows} × ${cols} grid)`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Combined Array Impedances',
    formula: 'R_array = R_via / N | R_θ,array = R_θ,via / N',
    substitution: `R = ${(sv.resistanceOhms * 1e3).toFixed(2)} mΩ / ${recommendedCount} | R_θ = ${sv.thermalResistanceKPerW.toFixed(1)} / ${recommendedCount}`,
    result: `R_array = ${(arrayResistance * 1e3).toFixed(3)} mΩ | R_θ,array = ${arrayThermal.toFixed(2)} °C/W`,
  });

  if (recommendedCount > 9) {
    warnings.push({
      severity: 'info',
      title: 'Mutual Thermal Heating in Dense Via Matrix',
      message: `Array contains ${recommendedCount} vias. Ideal 1D parallel thermal conduction assumes uniform plane temperature. Mutual thermal heating and spreading resistance in outer copper planes limit incremental gains beyond ~9-16 vias. Spacing vias at ~1.0–1.2 mm pitch optimizes convective/conductive flux.`,
    });
  }

  const formatted = `${recommendedCount} vias (${rows} × ${cols} array)`;

  return {
    label: 'Via Array Sizing',
    primaryValue: recommendedCount,
    primaryUnit: 'vias',
    formattedValue: formatted,
    formattedResult: formatted,
    steps,
    warnings,
    equationUsed: 'R_array = R_via / N | R_θ,array = R_θ,via / N',
    engineeringModel: 'ENGINEERING ESTIMATE',
    standardsContext: 'Thermal slug heat-sinking design guidelines for exposed QFN / DFN power packages.',
    additionalOutputs: {
      arrayCount: { label: 'Total Vias', value: `${recommendedCount}` },
      gridLayout: { label: 'Suggested Matrix', value: `${rows} rows × ${cols} columns` },
      combinedResistance: { label: 'Combined DC Resistance', value: `${(arrayResistance * 1e3).toFixed(3)} mΩ` },
      combinedThermalResistance: { label: 'Combined Thermal Resistance', value: `${arrayThermal.toFixed(2)} °C/W` },
      totalAmpacity: { label: 'Total Array Ampacity', value: `${arrayAmpacity.toFixed(2)} A` },
      footprintArea: { label: 'Array Span', value: `${(arrayWidth * 1e3).toFixed(1)} × ${(arrayHeight * 1e3).toFixed(1)} mm` },
    },
    outputs: {
      recommendedCount,
      arrayResistanceOhms: arrayResistance,
      arrayThermalResistanceKPerW: arrayThermal,
      arrayAmpacityAmps: arrayAmpacity,
      gridRows: rows,
      gridCols: cols,
      arrayWidthMeters: arrayWidth,
      arrayHeightMeters: arrayHeight,
    },
  };
}
