import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';
import { snapToStandardE24 } from '../../lib/standards/e-series';

export interface BjtBaseResistorInputs {
  vin: number;           // Logic HIGH drive voltage (V)
  vbe?: number;          // Base-emitter drop (V, default 0.7V)
  collectorCurrent: number; // Required load / collector current Ic (A)
  transistorBeta: number;   // Linear hFE (e.g. 100)
  forcedBeta?: number;      // Overdrive forced beta (default 10 for deep switching saturation)
}

export function calculateBjtBaseResistor(inputs: BjtBaseResistorInputs): CalculationResult {
  const { vin, vbe = 0.7, collectorCurrent, transistorBeta, forcedBeta = 10 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Vin = Number.isFinite(vin) ? vin : 3.3;
  const Vbe = Number.isFinite(vbe) && vbe > 0 ? vbe : 0.7;
  const Ic = Number.isFinite(collectorCurrent) && collectorCurrent > 0 ? collectorCurrent : 0.1;
  const hfe = Number.isFinite(transistorBeta) && transistorBeta > 0 ? transistorBeta : 100;
  const betaForced = Number.isFinite(forcedBeta) && forcedBeta > 0 ? forcedBeta : 10;

  if (Vin <= Vbe) {
    warnings.push({
      severity: 'danger',
      title: 'Control Voltage Below V_be Threshold',
      message: `Drive voltage (${formatQuantity(Vin, 'voltage')}) is less than or equal to V_be (${formatQuantity(Vbe, 'voltage')}). Transistor will remain firmly in cutoff (OFF).`,
    });

    return {
      primaryValue: 0,
      formattedValue: '0 Ω (Vin ≤ Vbe)',
      unit: 'Ω',
      label: 'Base Resistor (R_b)',
      warnings,
      steps,
      additionalOutputs: { state: { label: 'Transistor State', value: 'Cutoff / Unbiased' } },
      visualData: { Vin, Vbe, Ic, hfe, betaForced, Rb: 0 },
    };
  }

  // Deep saturation rule: In switching applications, datasheet linear hFE cannot be used because
  // Vce drops below Vbe and collector-base junction becomes forward-biased, severely degrading effective beta.
  // Standard IEEE / JEDEC rule of thumb is forced beta beta_sat = 10 (or overdrive factor 2-5).
  const Ib_min = Ic / hfe;
  const Ib_forced = Ic / betaForced;
  const Rb = (Vin - Vbe) / Ib_forced;
  const pRb = Ib_forced * Ib_forced * Rb;

  steps.push({
    stepNumber: 1,
    title: 'Determine Base Current for Deep Saturation',
    formula: 'I_b = I_c / β_forced   (Recommended β_forced = 10 for switching saturation)',
    substitution: `I_b = ${formatQuantity(Ic, 'current')} / ${betaForced} = ${formatQuantity(Ib_forced, 'current')}`,
    result: formatQuantity(Ib_forced, 'current'),
    annotation: `Linear active Ib would only be ${formatQuantity(Ib_min, 'current')}. Using forced beta = ${betaForced} ensures minimum Vce(sat) across temperature and unit-to-unit beta variation.`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Base Resistor Value',
    formula: 'R_b = (V_in - V_be) / I_b',
    substitution: `R_b = (${formatQuantity(Vin, 'voltage')} - ${formatQuantity(Vbe, 'voltage')}) / ${formatQuantity(Ib_forced, 'current')}`,
    result: formatQuantity(Rb, 'resistance'),
  });

  const e24 = snapToStandardE24(Rb);

  // Saturation loss in BJT: P ≈ Vce(sat) * Ic + Vbe * Ib
  const vceSat = 0.2; // typical 200mV for saturated silicon BJT
  const pBjt = (vceSat * Ic) + (Vbe * Ib_forced);

  return {
    primaryValue: Rb,
    formattedValue: formatQuantity(Rb, 'resistance'),
    unit: 'Ω',
    label: 'Calculated Base Resistor (R_b)',
    standardValue: e24,
    powerDissipation: {
      watts: pRb,
      formatted: formatQuantity(pRb, 'power'),
      suggestedRating: `${formatQuantity(pRb * 2, 'power')} (2.0× safety headroom)`,
    },
    warnings,
    steps,
    additionalOutputs: {
      baseCurrent: {
        label: 'Saturation Base Current (I_b)',
        value: formatQuantity(Ib_forced, 'current'),
        unit: 'A',
      },
      linearMinCurrent: {
        label: 'Marginal Linear I_b (at linear hFE)',
        value: formatQuantity(Ib_min, 'current'),
        unit: 'A',
      },
      overdriveFactor: {
        label: 'Overdrive Factor',
        value: `${(hfe / betaForced).toFixed(1)}× (Forced β = ${betaForced})`,
      },
      bjtSaturationPower: {
        label: 'Approx. Transistor On-State Power',
        value: formatQuantity(pBjt, 'power'),
        unit: 'W',
      },
    },
    visualData: {
      Vin,
      Vbe,
      Ic,
      hfe,
      betaForced,
      Ib_forced,
      Rb,
      pRb,
      pBjt,
    },
  };
}

export interface BjtBiasInputs {
  vcc: number;       // Collector supply voltage (V)
  r1: number;        // Upper divider resistor (Ohms)
  r2: number;        // Lower divider resistor (Ohms)
  rc: number;        // Collector resistor (Ohms)
  re: number;        // Emitter degeneration resistor (Ohms)
  beta: number;      // Transistor current gain hFE
  vbe?: number;      // Base-emitter drop (V, default 0.7V)
}

export function calculateBjtBias(inputs: BjtBiasInputs): CalculationResult {
  const { vcc, r1, r2, rc, re, beta, vbe = 0.7 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Vcc = Number.isFinite(vcc) ? vcc : 12.0;
  const R1 = Number.isFinite(r1) && r1 > 0 ? r1 : 33000;
  const R2 = Number.isFinite(r2) && r2 > 0 ? r2 : 10000;
  const Rc = Number.isFinite(rc) && rc >= 0 ? rc : 2200;
  const Re = Number.isFinite(re) && re >= 0 ? re : 1000;
  const hfe = Number.isFinite(beta) && beta > 0 ? beta : 100;
  const Vbe = Number.isFinite(vbe) && vbe > 0 ? vbe : 0.7;

  // Thévenin equivalent of base voltage divider
  const Vth = (Vcc * R2) / (R1 + R2);
  const Rth = (R1 * R2) / (R1 + R2);

  steps.push({
    stepNumber: 1,
    title: 'Thévenin Equivalent of Base Divider Network',
    formula: 'V_th = V_cc × [ R₂ / (R₁ + R₂) ] ;   R_th = R₁ || R₂',
    substitution: `V_th = ${formatQuantity(Vcc, 'voltage')} × [${formatQuantity(R2, 'resistance')} / (${formatQuantity(R1, 'resistance')} + ${formatQuantity(R2, 'resistance')})]`,
    result: `V_th = ${formatQuantity(Vth, 'voltage')} ;   R_th = ${formatQuantity(Rth, 'resistance')}`,
  });

  // Base current check
  let region: 'Active' | 'Saturation' | 'Cutoff' = 'Active';
  let Ib = 0;
  let Ie = 0;
  let Ic = 0;
  let Vb = 0;
  let Ve = 0;
  let Vc = 0;
  let Vce = 0;

  if (Vth < Vbe) {
    region = 'Cutoff';
    warnings.push({
      severity: 'warning',
      title: 'Transistor in Cutoff Region',
      message: `Thévenin base voltage (${formatQuantity(Vth, 'voltage')}) is below V_be conduction threshold (${formatQuantity(Vbe, 'voltage')}). Zero collector current flows.`,
    });
    Vc = Vcc;
    Vce = Vcc;
  } else {
    // Active region theoretical equations:
    // Ib = (Vth - Vbe) / [ Rth + (beta + 1) * Re ]
    const denominator = Rth + (hfe + 1) * Re;
    Ib = (Vth - Vbe) / denominator;
    Ie = (hfe + 1) * Ib;
    Ic = hfe * Ib;

    Ve = Ie * Re;
    Vb = Ve + Vbe;
    Vc = Vcc - (Ic * Rc);
    Vce = Vc - Ve;

    // Check for saturation: if Vce <= 0.2V, active model is invalid
    if (Vce < 0.2) {
      region = 'Saturation';
      warnings.push({
        severity: 'danger',
        title: 'Transistor in Saturation (Active Model Invalid)',
        message: `Calculated Vce dropped to ${formatQuantity(Vce, 'voltage')}. The base-collector junction has forward biased. The linear active equation Ic = β × Ib is no longer valid.`,
      });
      // Clamp to physical saturation values
      Vce = 0.2;
      Ve = (Vcc - Vce) * (Re / (Rc + Re));
      Vc = Ve + Vce;
      Ic = (Vcc - Vc) / Math.max(1, Rc);
      Vb = Ve + Vbe;
    }
  }

  steps.push({
    stepNumber: 2,
    title: 'Calculate Operating Currents & Node Voltages',
    formula: 'I_b = (V_th - V_be) / [ R_th + (β+1)R_e ] ;   I_c = β I_b ;   V_c = V_cc - I_c R_c',
    substitution: `I_b = (${formatQuantity(Vth, 'voltage')} - ${formatQuantity(Vbe, 'voltage')}) / [${formatQuantity(Rth, 'resistance')} + ${(hfe + 1)}×${formatQuantity(Re, 'resistance')}]`,
    result: `I_c = ${formatQuantity(Ic, 'current')} ;   V_ce = ${formatQuantity(Vce, 'voltage')} [Region: ${region}]`,
  });

  const pBjt = Math.max(0, Vce * Ic);

  // Beta stability factor: Stability requires Rth << beta * Re (ideally Rth < 0.1 * beta * Re)
  const stabilityRatio = (hfe * Re) > 0 ? Rth / (hfe * Re) : 0;
  if (stabilityRatio > 0.1) {
    warnings.push({
      severity: 'info',
      title: 'Q-Point Moderately Sensitive to Beta',
      message: `R_th / (β × R_e) = ${stabilityRatio.toFixed(2)} (Rule of thumb is < 0.10). Bias point will drift with transistor temperature and manufacturing variations.`,
    });
  }

  return {
    primaryValue: Vce,
    formattedValue: formatQuantity(Vce, 'voltage'),
    unit: 'V',
    label: 'Collector-Emitter Voltage (V_ce)',
    warnings,
    steps,
    additionalOutputs: {
      operatingRegion: {
        label: 'Operating Region',
        value: region,
      },
      collectorCurrent: {
        label: 'Collector Current (I_c)',
        value: formatQuantity(Ic, 'current'),
        unit: 'A',
      },
      baseCurrent: {
        label: 'Base Current (I_b)',
        value: formatQuantity(Ib, 'current'),
        unit: 'A',
      },
      collectorVoltage: {
        label: 'Collector Node Voltage (V_c)',
        value: formatQuantity(Vc, 'voltage'),
        unit: 'V',
      },
      emitterVoltage: {
        label: 'Emitter Node Voltage (V_e)',
        value: formatQuantity(Ve, 'voltage'),
        unit: 'V',
      },
      baseVoltage: {
        label: 'Base Node Voltage (V_b)',
        value: formatQuantity(Vb, 'voltage'),
        unit: 'V',
      },
      quiescentPower: {
        label: 'BJT Quiescent Dissipation',
        value: formatQuantity(pBjt, 'power'),
        unit: 'W',
      },
    },
    visualData: {
      Vcc,
      R1,
      R2,
      Rc,
      Re,
      hfe,
      Vth,
      Rth,
      Ib,
      Ic,
      Ie,
      Vb,
      Ve,
      Vc,
      Vce,
      region,
      pBjt,
    },
  };
}

export interface BjtPowerInputs {
  vce: number;           // Collector-emitter voltage (V)
  ic: number;            // Collector current (A)
  vbe?: number;          // Base-emitter drop (V, default 0.7V)
  ib?: number;           // Base current (A, optional)
  rThetaJa?: number;     // Thermal resistance Junction-to-Ambient (°C/W, default 200 for TO-92, 62.5 for TO-220)
  ambientTemp?: number;  // Ambient temperature (°C, default 25°C)
}

export function calculateBjtPower(inputs: BjtPowerInputs): CalculationResult {
  const { vce, ic, vbe = 0.7, ib = 0, rThetaJa = 200, ambientTemp = 25 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const Vce = Number.isFinite(vce) && vce >= 0 ? vce : 5.0;
  const Ic = Number.isFinite(ic) && ic >= 0 ? ic : 0.05;
  const Vbe = Number.isFinite(vbe) && vbe >= 0 ? vbe : 0.7;
  const Ib = Number.isFinite(ib) && ib >= 0 ? ib : 0;
  const Rja = Number.isFinite(rThetaJa) && rThetaJa > 0 ? rThetaJa : 200;
  const Ta = Number.isFinite(ambientTemp) ? ambientTemp : 25;

  // P_tot = (Vce * Ic) + (Vbe * Ib)
  const pCollector = Vce * Ic;
  const pBase = Vbe * Ib;
  const pTotal = pCollector + pBase;

  // Estimated silicon junction temperature:
  // Tj = Ta + P_tot * R_theta_ja
  const deltaT = pTotal * Rja;
  const tj = Ta + deltaT;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Transistor Active Power Dissipation',
    formula: 'P_tot = (V_ce × I_c) + (V_be × I_b)',
    substitution: `P_tot = (${formatQuantity(Vce, 'voltage')} × ${formatQuantity(Ic, 'current')}) + (${formatQuantity(Vbe, 'voltage')} × ${formatQuantity(Ib, 'current')})`,
    result: formatQuantity(pTotal, 'power'),
  });

  steps.push({
    stepNumber: 2,
    title: 'Thermal Junction Temperature Estimation',
    formula: 'T_j = T_ambient + (P_tot × R_θJA)',
    substitution: `T_j = ${Ta.toFixed(1)}°C + (${formatQuantity(pTotal, 'power')} × ${Rja.toFixed(1)} °C/W)`,
    result: `T_j = ${tj.toFixed(1)}°C (Temperature Rise ΔT = +${deltaT.toFixed(1)}°C)`,
  });

  if (tj > 150) {
    warnings.push({
      severity: 'danger',
      title: 'Maximum Junction Temperature Exceeded (Tj > 150°C)',
      message: `Silicon junction temperature (${tj.toFixed(0)}°C) exceeds typical semiconductor absolute maximum (150°C). Device will suffer catastrophic thermal runaway or package destruction. A heatsink is mandatory.`,
    });
  } else if (tj > 105) {
    warnings.push({
      severity: 'warning',
      title: 'Elevated Operating Temperature',
      message: `Junction temperature (${tj.toFixed(0)}°C) is elevated. Long-term MTBF reliability will degrade significantly; add thermal copper planes or heatsinking.`,
    });
  } else {
    warnings.push({
      severity: 'info',
      title: 'Safe Thermal Range',
      message: `Junction temperature is well within standard operating limits (ΔT = +${deltaT.toFixed(1)}°C).`,
    });
  }

  return {
    primaryValue: pTotal,
    formattedValue: formatQuantity(pTotal, 'power'),
    unit: 'W',
    label: 'Total Transistor Dissipation (P_tot)',
    warnings,
    steps,
    additionalOutputs: {
      junctionTemp: {
        label: 'Estimated Junction Temp (T_j)',
        value: `${tj.toFixed(1)} °C`,
      },
      tempRise: {
        label: 'Temperature Rise (ΔT)',
        value: `+${deltaT.toFixed(1)} °C above ${Ta.toFixed(0)}°C`,
      },
      thermalResistance: {
        label: 'Thermal Resistance (R_θJA)',
        value: `${Rja.toFixed(1)} °C/W`,
      },
      collectorPower: {
        label: 'Collector Channel Loss',
        value: formatQuantity(pCollector, 'power'),
        unit: 'W',
      },
    },
    visualData: {
      Vce,
      Ic,
      Vbe,
      Ib,
      pTotal,
      pCollector,
      pBase,
      Rja,
      Ta,
      deltaT,
      tj,
    },
  };
}
