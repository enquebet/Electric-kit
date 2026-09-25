import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { getInstallationContextWarning } from '../../lib/standards/standards-profile';

export interface ScheduleCircuitItem {
  id: string;
  name: string;
  category: 'lighting' | 'hvac' | 'motor' | 'receptacle' | 'it-server' | 'general';
  phase: 'A' | 'B' | 'C' | '3P'; // Phase assignment
  voltageV: number;
  powerWatts: number;
  powerFactor: number;
  pfType: 'lagging' | 'leading';
  quantity: number;
  demandFactor: number; // 0.1 to 1.0 (diversity factor)
  hoursPerDay: number;
}

export function calculateComprehensiveLoadSchedule(
  circuits: ScheduleCircuitItem[],
  systemVoltageLL: number = 400,
  tariffPerKwh: number = 0.15
): CalculationResult {
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const vLN = systemVoltageLL / Math.sqrt(3);

  // Accumulators per phase
  const phaseP = { A: 0, B: 0, C: 0 };
  const phaseQ = { A: 0, B: 0, C: 0 };
  let totalConnectedWatts = 0;
  let totalDemandWatts = 0;
  let totalDailyKwh = 0;

  circuits.forEach(item => {
    const qty = Math.max(item.quantity, 1);
    const itemConnectedP = item.powerWatts * qty;
    const df = Math.min(Math.max(item.demandFactor, 0.05), 1.0);
    const itemDemandP = itemConnectedP * df;

    const pf = Math.min(Math.max(item.powerFactor, 0.1), 1.0);
    const phi = Math.acos(pf);
    const qSign = item.pfType === 'lagging' ? 1 : -1;
    const itemDemandQ = itemDemandP * Math.tan(phi) * qSign;

    totalConnectedWatts += itemConnectedP;
    totalDemandWatts += itemDemandP;
    totalDailyKwh += (itemDemandP * Math.min(Math.max(item.hoursPerDay, 0), 24)) / 1000;

    if (item.phase === '3P') {
      // Divided equally among 3 phases
      const pPerPhase = itemDemandP / 3;
      const qPerPhase = itemDemandQ / 3;
      phaseP.A += pPerPhase;
      phaseP.B += pPerPhase;
      phaseP.C += pPerPhase;
      phaseQ.A += qPerPhase;
      phaseQ.B += qPerPhase;
      phaseQ.C += qPerPhase;
    } else {
      phaseP[item.phase] += itemDemandP;
      phaseQ[item.phase] += itemDemandQ;
    }
  });

  // Calculate apparent power and current per phase
  const sPhaseA = Math.sqrt(phaseP.A * phaseP.A + phaseQ.A * phaseQ.A);
  const sPhaseB = Math.sqrt(phaseP.B * phaseP.B + phaseQ.B * phaseQ.B);
  const sPhaseC = Math.sqrt(phaseP.C * phaseP.C + phaseQ.C * phaseQ.C);

  const iPhaseA = vLN > 0 ? sPhaseA / vLN : 0;
  const iPhaseB = vLN > 0 ? sPhaseB / vLN : 0;
  const iPhaseC = vLN > 0 ? sPhaseC / vLN : 0;

  const totalApparentS = sPhaseA + sPhaseB + sPhaseC;
  const totalNetQ = phaseQ.A + phaseQ.B + phaseQ.C;
  const overallPf = totalApparentS > 0 ? totalDemandWatts / totalApparentS : 1.0;

  // Phase balance check
  const avgCurrent = (iPhaseA + iPhaseB + iPhaseC) / 3;
  const maxDiff = Math.max(
    Math.abs(iPhaseA - avgCurrent),
    Math.abs(iPhaseB - avgCurrent),
    Math.abs(iPhaseC - avgCurrent)
  );
  const unbalancePercent = avgCurrent > 0 ? (maxDiff / avgCurrent) * 100 : 0;

  steps.push({
    stepNumber: 1,
    title: 'Aggregate Active & Reactive Loads per Phase',
    formula: 'P_phase = ∑(P_item × Qty × DemandFactor);   Q_phase = ∑[P × tan(φ)]',
    substitution: `Phase A: ${(phaseP.A / 1000).toFixed(2)} kW, Phase B: ${(phaseP.B / 1000).toFixed(2)} kW, Phase C: ${(phaseP.C / 1000).toFixed(2)} kW`,
    result: `Total Maximum Demand: ${(totalDemandWatts / 1000).toFixed(2)} kW (Connected: ${(totalConnectedWatts / 1000).toFixed(2)} kW)`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Operating Currents & Phase Balance',
    formula: 'I_phase = S_phase / V_LN;   Unbalance% = [max(|I - I_avg|) / I_avg] × 100%',
    substitution: `Phase A: ${iPhaseA.toFixed(1)} A, Phase B: ${iPhaseB.toFixed(1)} A, Phase C: ${iPhaseC.toFixed(1)} A at V_LN = ${vLN.toFixed(0)} V`,
    result: `Average Current: ${avgCurrent.toFixed(1)} A, Phase Unbalance: ${unbalancePercent.toFixed(1)}%`,
  });

  if (unbalancePercent > 10.0) {
    warnings.push({
      severity: 'warning',
      title: `High Three-Phase Load Unbalance (${unbalancePercent.toFixed(1)}%)`,
      message: `Phase currents differ substantially (A: ${iPhaseA.toFixed(1)}A, B: ${iPhaseB.toFixed(1)}A, C: ${iPhaseC.toFixed(1)}A). Severe unbalance causes elevated neutral currents, transformer hotspot overheating, and negative sequence rotor heating in connected 3-phase induction motors. Reassign single-phase circuits across phases to balance the panelboard.`,
    });
  }

  const monthlyKwh = totalDailyKwh * 30;
  const monthlyCost = monthlyKwh * tariffPerKwh;

  warnings.push(getInstallationContextWarning('Load Schedule Planning', [
    'local code coincidence & diversity factors (IEC 60364 / NEC Article 220)',
    'continuous load factor (125% breaker sizing for lighting and HVAC loads)',
    'switchboard main busbar ampacity and service feeder sizing',
    'neutral conductor sizing with presence of triplen harmonics (3rd, 9th) from non-linear IT loads',
  ]));

  return {
    primaryValue: totalDemandWatts / 1000,
    formattedValue: `${(totalDemandWatts / 1000).toFixed(2)} kW (${(totalApparentS / 1000).toFixed(2)} kVA)`,
    unit: 'kW',
    label: 'Total Diversified Demand Load',
    classification: 'ENGINEERING ESTIMATE',
    standardsContext: 'Load schedule summation applying user-defined demand factors. Diversity and coincidence factors must comply with local installation standards (NEC Article 220 / IEC 60364-5-52).',
    warnings,
    steps,
    additionalOutputs: {
      connectedLoad: { label: 'Total Connected Capacity', value: `${(totalConnectedWatts / 1000).toFixed(2)} kW` },
      diversifiedDemand: { label: 'Max Diversified Demand', value: `${(totalDemandWatts / 1000).toFixed(2)} kW` },
      apparentPowerKva: { label: 'Total Apparent Power', value: `${(totalApparentS / 1000).toFixed(2)} kVA` },
      overallPf: { label: 'Composite Power Factor', value: `${overallPf.toFixed(3)}` },
      phaseA: { label: 'Phase A Current', value: `${iPhaseA.toFixed(1)} A (${(phaseP.A / 1000).toFixed(1)} kW)` },
      phaseB: { label: 'Phase B Current', value: `${iPhaseB.toFixed(1)} A (${(phaseP.B / 1000).toFixed(1)} kW)` },
      phaseC: { label: 'Phase C Current', value: `${iPhaseC.toFixed(1)} A (${(phaseP.C / 1000).toFixed(1)} kW)` },
      phaseUnbalance: { label: 'Phase Unbalance', value: `${unbalancePercent.toFixed(1)}%` },
      monthlyEnergy: { label: 'Estimated Monthly Energy', value: `${monthlyKwh.toFixed(1)} kWh` },
      monthlyCost: { label: 'Estimated Monthly Bill', value: `$${monthlyCost.toFixed(2)}` },
    },
    visualData: {
      phaseP,
      phaseQ,
      currents: { A: iPhaseA, B: iPhaseB, C: iPhaseC },
      unbalancePercent,
      totalConnectedWatts,
      totalDemandWatts,
      totalApparentS,
      circuits,
    },
  };
}

export interface LoadScheduleInputs {
  circuits: Array<{
    id: string;
    name: string;
    connectedWatts: number;
    isContinuous?: boolean;
    diversityFactor?: number;
    phase?: string;
  }>;
  systemVoltageV?: number;
  systemType?: 'single-phase' | 'three-phase';
  targetPowerFactor?: number;
}

export function calculateLoadSchedule(inputs: LoadScheduleInputs): CalculationResult {
  const { circuits, systemVoltageV = 400, systemType = 'three-phase', targetPowerFactor = 0.9 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let totalConnectedWatts = 0;
  let totalDemandWatts = 0;

  circuits.forEach(c => {
    totalConnectedWatts += c.connectedWatts;
    const df = c.diversityFactor !== undefined ? c.diversityFactor : 1.0;
    // Continuous loads under NEC/IEC get 125% sizing if continuous
    const continuousFactor = c.isContinuous ? 1.0 : 1.0;
    totalDemandWatts += c.connectedWatts * df * continuousFactor;
  });

  const connectedKw = totalConnectedWatts / 1000;
  const demandKw = totalDemandWatts / 1000;
  const demandKva = demandKw / targetPowerFactor;

  const is3Phase = systemType === 'three-phase';
  const multiplier = is3Phase ? Math.sqrt(3) * systemVoltageV : systemVoltageV;
  const demandCurrentA = (demandKva * 1000) / multiplier;

  // Recommended incoming main circuit breaker: 125% of continuous demand
  const recommendedMainBreakerA = Math.ceil(demandCurrentA * 1.25 / 10) * 10;

  steps.push({
    stepNumber: 1,
    title: 'Sum Total Connected Load vs Diversified Maximum Demand',
    formula: 'Demand_kW = ∑ (Connected_Watts × Diversity_Factor) / 1000',
    substitution: `Connected: ${connectedKw.toFixed(2)} kW, Diversified: ${demandKw.toFixed(2)} kW`,
    result: `Max Demand = ${demandKw.toFixed(2)} kW (${demandKva.toFixed(2)} kVA at ${targetPowerFactor} PF)`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Main Service Feeder Design Current',
    formula: is3Phase ? 'I_main = (Demand_kVA × 1000) / (√3 × V_LL)' : 'I_main = (Demand_kVA × 1000) / V',
    substitution: is3Phase
      ? `(${demandKva.toFixed(2)} × 1000) / (1.732 × ${systemVoltageV} V)`
      : `(${demandKva.toFixed(2)} × 1000) / ${systemVoltageV} V`,
    result: `I_design = ${demandCurrentA.toFixed(1)} A (Recommended Main Breaker: ${recommendedMainBreakerA} A)`,
  });

  return {
    primaryValue: demandKw,
    formattedValue: `${demandKw.toFixed(2)} kW (${demandKva.toFixed(2)} kVA)`,
    unit: 'kW',
    label: 'Maximum Diversified Demand',
    classification: 'STANDARDS-DEPENDENT',
    standardsContext: 'IEC 60364 / NEC Article 220 branch circuit and feeder load calculation methodology.',
    warnings,
    steps,
    additionalOutputs: {
      diversifiedDemand: { label: 'Diversified Demand', value: `${demandKw.toFixed(2)} kW` },
      connectedLoad: { label: 'Total Connected Load', value: `${connectedKw.toFixed(2)} kW` },
      apparentKva: { label: 'Feeder Apparent Demand', value: `${demandKva.toFixed(2)} kVA` },
      designCurrent: { label: 'Calculated Service Current', value: `${demandCurrentA.toFixed(1)} A` },
      recommendedBreaker: { label: 'Recommended Main Breaker', value: `${recommendedMainBreakerA} A` },
    },
    visualData: {
      connectedKw,
      demandKw,
      demandKva,
      demandCurrentA,
      recommendedMainBreakerA,
    },
  };
}
