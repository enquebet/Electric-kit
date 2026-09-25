import { CalculationResult, CalculationStep, EngineeringWarning } from '../../types/tool';
import { formatQuantity } from '../../lib/units/formatter';

export interface RlcResonanceInputs {
  resistance: number;   // Base Ohms
  inductance: number;   // Base Henries
  capacitance: number;  // Base Farads
  topology?: 'series' | 'parallel';
}

export function calculateRlcResonance(inputs: RlcResonanceInputs): CalculationResult {
  const { resistance, inductance, capacitance, topology = 'series' } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const R = Number.isFinite(resistance) && resistance > 0 ? resistance : 10;
  const L = Number.isFinite(inductance) && inductance > 0 ? inductance : 1e-3;
  const C = Number.isFinite(capacitance) && capacitance > 0 ? capacitance : 1e-7;

  // omega_0 = 1 / sqrt(L * C)
  const omega0 = 1 / Math.sqrt(L * C); // rad/s
  // f_0 = omega_0 / (2 * pi)
  const f0 = omega0 / (2 * Math.PI); // Hz
  // Characteristic impedance Z_0 = sqrt(L / C)
  const z0 = Math.sqrt(L / C); // Ohms

  steps.push({
    stepNumber: 1,
    title: 'Calculate Resonant Frequency (f₀)',
    formula: 'f₀ = 1 / [ 2π × √(L × C) ] ;   ω₀ = 1 / √(L × C)',
    substitution: `f₀ = 1 / [ 2π × √(${formatQuantity(L, 'inductance')} × ${formatQuantity(C, 'capacitance')}) ]`,
    result: `${formatQuantity(f0, 'frequency')} (ω₀ = ${omega0.toExponential(4)} rad/s)`,
    annotation: 'At resonance, inductive reactance XL equals capacitive reactance XC, canceling the net reactive component.',
  });

  let Q = 0;
  let bandwidth = 0;
  let zResonance = 0;

  if (topology === 'series') {
    // Series RLC: Q = (omega0 * L) / R = (1/R) * sqrt(L/C)
    Q = (omega0 * L) / R;
    bandwidth = f0 / Q;
    zResonance = R; // Purely resistive minimum impedance

    steps.push({
      stepNumber: 2,
      title: 'Calculate Series Quality Factor (Q) & Bandwidth',
      formula: 'Q = (ω₀ × L) / R = (1 / R) × √(L / C) ;   BW = f₀ / Q',
      substitution: `Q = (${omega0.toFixed(1)} × ${formatQuantity(L, 'inductance')}) / ${formatQuantity(R, 'resistance')}`,
      result: `Q = ${Q.toFixed(2)} ;   BW = ${formatQuantity(bandwidth, 'frequency')}`,
      annotation: 'Series RLC resonance exhibits minimum impedance (Z = R) and maximum loop current.',
    });
  } else {
    // Parallel RLC: Q = R / (omega0 * L) = R * sqrt(C/L)
    Q = R / (omega0 * L);
    bandwidth = f0 / Q;
    zResonance = R; // Maximum impedance at resonance

    steps.push({
      stepNumber: 2,
      title: 'Calculate Parallel Quality Factor (Q) & Bandwidth',
      formula: 'Q = R / (ω₀ × L) = R × √(C / L) ;   BW = f₀ / Q',
      substitution: `Q = ${formatQuantity(R, 'resistance')} / (${omega0.toFixed(1)} × ${formatQuantity(L, 'inductance')})`,
      result: `Q = ${Q.toFixed(2)} ;   BW = ${formatQuantity(bandwidth, 'frequency')}`,
      annotation: 'Parallel RLC tank exhibits maximum impedance (Z = R) and minimum line current at resonance.',
    });
  }

  const f1 = Math.max(0, f0 - bandwidth / 2);
  const f2 = f0 + bandwidth / 2;
  const reactanceAtResonance = omega0 * L;

  if (Q < 0.5) {
    warnings.push({
      severity: 'info',
      title: 'Overdamped System (Q < 0.5)',
      message: 'System is heavily damped; transient response has no oscillatory overshoot and bandwidth is very wide.',
    });
  } else if (Q > 50) {
    warnings.push({
      severity: 'warning',
      title: 'High Q Resonance Hazard',
      message: `High Q (${Q.toFixed(1)}) causes reactive component voltages in series (V_L = Q × V_in) or currents in parallel to multiply by ${Q.toFixed(0)}×, potentially exceeding component dielectric or saturation limits.`,
    });
  }

  return {
    primaryValue: f0,
    formattedValue: formatQuantity(f0, 'frequency'),
    unit: 'Hz',
    label: 'Resonant Frequency (f₀)',
    warnings,
    steps,
    additionalOutputs: {
      angularFrequency: {
        label: 'Angular Frequency (ω₀)',
        value: `${omega0.toFixed(2)} rad/s`,
        unit: 'rad/s',
      },
      qFactor: {
        label: 'Quality Factor (Q)',
        value: Q.toFixed(3),
      },
      bandwidth: {
        label: '-3dB Bandwidth (Δf)',
        value: formatQuantity(bandwidth, 'frequency'),
        unit: 'Hz',
      },
      f1Cutoff: {
        label: 'Lower -3dB Frequency (f₁)',
        value: formatQuantity(f1, 'frequency'),
        unit: 'Hz',
      },
      f2Cutoff: {
        label: 'Upper -3dB Frequency (f₂)',
        value: formatQuantity(f2, 'frequency'),
        unit: 'Hz',
      },
      charImpedance: {
        label: 'Characteristic Impedance (Z₀)',
        value: formatQuantity(z0, 'resistance'),
        unit: 'Ω',
      },
      zAtResonance: {
        label: `Resonant Impedance (${topology})`,
        value: formatQuantity(zResonance, 'resistance'),
        unit: 'Ω',
      },
      reactanceAtRes: {
        label: 'Reactance magnitude (|XL| = |XC|)',
        value: formatQuantity(reactanceAtResonance, 'resistance'),
        unit: 'Ω',
      },
    },
    visualData: {
      f0,
      omega0,
      Q,
      bandwidth,
      f1,
      f2,
      topology,
      z0,
      R,
      L,
      C,
    },
  };
}

export interface LcResonanceInputs {
  inductance: number;  // Base Henries
  capacitance: number; // Base Farads
  voltage?: number;    // Peak or RMS voltage (V)
}

export function calculateLcResonance(inputs: LcResonanceInputs): CalculationResult {
  const { inductance, capacitance, voltage = 1.0 } = inputs;
  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  const L = Number.isFinite(inductance) && inductance > 0 ? inductance : 10e-6;
  const C = Number.isFinite(capacitance) && capacitance > 0 ? capacitance : 100e-12;
  const V = Number.isFinite(voltage) && voltage >= 0 ? voltage : 1.0;

  const omega0 = 1 / Math.sqrt(L * C);
  const f0 = omega0 / (2 * Math.PI);
  const z0 = Math.sqrt(L / C); // Characteristic surge impedance
  const xl = omega0 * L;

  steps.push({
    stepNumber: 1,
    title: 'Calculate Natural Resonant Frequency',
    formula: 'f₀ = 1 / [ 2π × √(L × C) ]',
    substitution: `f₀ = 1 / [ 2π × √(${formatQuantity(L, 'inductance')} × ${formatQuantity(C, 'capacitance')}) ]`,
    result: formatQuantity(f0, 'frequency'),
    annotation: 'Ideal undamped LC tank frequency where magnetic and electric energies exchange continuously.',
  });

  const storedEnergyCap = 0.5 * C * V * V;
  // At peak capacitor voltage, inductor current is 0.
  // Maximum inductor current I_peak = V / Z0
  const iPeak = z0 > 0 ? V / z0 : 0;
  const storedEnergyInd = 0.5 * L * iPeak * iPeak; // Exactly equals storedEnergyCap by conservation of energy!

  steps.push({
    stepNumber: 2,
    title: 'Calculate Characteristic Surge Impedance & Energy Exchange',
    formula: 'Z₀ = √(L / C) ;   E = ½ C V² = ½ L I_peak²',
    substitution: `Z₀ = √(${formatQuantity(L, 'inductance')} / ${formatQuantity(C, 'capacitance')})`,
    result: `Z₀ = ${formatQuantity(z0, 'resistance')} ;   E = ${storedEnergyCap >= 1 ? storedEnergyCap.toFixed(3) + ' J' : (storedEnergyCap * 1e6).toFixed(3) + ' µJ'}`,
  });

  return {
    primaryValue: f0,
    formattedValue: formatQuantity(f0, 'frequency'),
    unit: 'Hz',
    label: 'LC Resonant Frequency (f₀)',
    warnings,
    steps,
    additionalOutputs: {
      angularFrequency: {
        label: 'Angular Velocity (ω₀)',
        value: `${omega0.toFixed(1)} rad/s`,
        unit: 'rad/s',
      },
      characteristicImpedance: {
        label: 'Characteristic Impedance (Z₀)',
        value: formatQuantity(z0, 'resistance'),
        unit: 'Ω',
      },
      componentReactance: {
        label: 'Branch Reactance (|XL| = |XC|)',
        value: formatQuantity(xl, 'resistance'),
        unit: 'Ω',
      },
      maxInductorCurrent: {
        label: 'Peak Circulating Tank Current',
        value: formatQuantity(iPeak, 'current'),
        unit: 'A',
      },
      storedEnergy: {
        label: 'Peak Stored Energy (E)',
        value: storedEnergyCap >= 1 ? `${storedEnergyCap.toFixed(3)} J` : `${(storedEnergyCap * 1e6).toFixed(3)} µJ`,
        unit: 'J',
      },
    },
    visualData: {
      f0,
      omega0,
      z0,
      xl,
      L,
      C,
      voltage: V,
      iPeak,
      storedEnergy: storedEnergyCap,
    },
  };
}
