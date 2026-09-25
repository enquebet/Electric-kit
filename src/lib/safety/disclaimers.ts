import { EngineeringWarning } from '../../types/tool';

export function checkVoltageSafety(volts: number, isAC: boolean = false): EngineeringWarning | null {
  const threshold = isAC ? 50 : 60; // Extra Low Voltage (ELV) safety boundary
  const mainsThreshold = isAC ? 100 : 120;

  if (Math.abs(volts) >= mainsThreshold) {
    return {
      severity: 'danger',
      title: 'High Voltage Shock Hazard',
      message: `Operating potential exceeds ${mainsThreshold}V (${isAC ? 'Mains/High AC' : 'High DC'}). Mandatory galvanic isolation, insulated test probes, and touch-proof enclosures required to prevent lethal shock.`,
      code: 'HV_DANGER',
    };
  }

  if (Math.abs(volts) >= threshold) {
    return {
      severity: 'warning',
      title: 'Elevated Voltage Warning',
      message: `Potential exceeds safety extra-low voltage (${threshold}V). Ensure circuit isolation and proper creepage/clearance distances.`,
      code: 'HV_WARN',
    };
  }

  return null;
}

export function checkCurrentSafety(amperes: number): EngineeringWarning | null {
  if (Math.abs(amperes) >= 10) {
    return {
      severity: 'danger',
      title: 'Extreme Current Level',
      message: `Current is ${amperes.toFixed(1)} A. High risk of rapid conductor vaporization, contact arcing, and severe fire hazard if unfused. Verify wire gauge and circuit breaker sizing.`,
      code: 'HI_CURRENT_DANGER',
    };
  }

  if (Math.abs(amperes) >= 2) {
    return {
      severity: 'warning',
      title: 'High Current Conductor Sizing',
      message: `Current exceeds 2 A. Verify PCB trace widths, terminal block ratings, and conductor I²R thermal rise.`,
      code: 'HI_CURRENT_WARN',
    };
  }

  return null;
}

export function checkPowerDissipationSafety(watts: number): EngineeringWarning | null {
  if (watts >= 5) {
    return {
      severity: 'danger',
      title: 'Excessive Power Dissipation',
      message: `Power dissipation is ${watts.toFixed(2)} W. Dedicated heatsinks, active forced-air cooling, and thermal-interface materials are essential to prevent component failure or board charring.`,
      code: 'HIGH_POWER_DANGER',
    };
  }

  if (watts >= 0.5) {
    return {
      severity: 'warning',
      title: 'Thermal Dissipation Notice',
      message: `Dissipating ${watts.toFixed(2)} W will cause substantial temperature rise in standard surface-mount or 1/4W through-hole parts. Check thermal resistance θ_JA.`,
      code: 'THERMAL_WARN',
    };
  }

  return null;
}

export function checkBatterySafety(cRate: number, chemistry: string): EngineeringWarning | null {
  if (chemistry.toLowerCase().includes('lithium') || chemistry.toLowerCase().includes('li-ion') || chemistry.toLowerCase().includes('lipo')) {
    if (cRate > 2.5) {
      return {
        severity: 'danger',
        title: 'High C-Rate Lithium Warning',
        message: `Discharge rate (${cRate.toFixed(1)}C) is high. Ensure battery cell chemistry is rated for high-drain applications. Thermal runaway and internal short circuits can lead to fire or venting.`,
        code: 'LITHIUM_CRATE_DANGER',
      };
    }
  }
  return null;
}
