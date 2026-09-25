import { CalculationResult, CalculationStep, EngineeringWarning } from '../../../types/tool';

export interface PowerThermalInputs {
  powerDissipationWatts: number;
  ambientTemperatureC: number;
  thermalResistanceJaCPerW?: number; // Junction to Ambient (single value)
  rThetaJc?: number;                // Junction to Case
  rThetaCs?: number;                // Case to Sink (interface material)
  rThetaSa?: number;                // Sink to Ambient (heatsink)
  maxJunctionTemperatureC?: number; // e.g. 150°C
}

export function calculatePowerThermalDissipation(inputs: PowerThermalInputs): CalculationResult {
  const {
    powerDissipationWatts: Ploss,
    ambientTemperatureC: Tamb,
    thermalResistanceJaCPerW,
    rThetaJc,
    rThetaCs,
    rThetaSa,
    maxJunctionTemperatureC: TjMax = 150,
  } = inputs;

  const warnings: EngineeringWarning[] = [];
  const steps: CalculationStep[] = [];

  let totalRtheta = 0;
  let calculationMode = '';

  if (rThetaJc !== undefined && rThetaCs !== undefined && rThetaSa !== undefined) {
    totalRtheta = rThetaJc + rThetaCs + rThetaSa;
    calculationMode = 'Series Heatsink Thermal Stack (Rθ_JC + Rθ_CS + Rθ_SA)';
  } else if (thermalResistanceJaCPerW !== undefined && thermalResistanceJaCPerW > 0) {
    totalRtheta = thermalResistanceJaCPerW;
    calculationMode = 'Lumped Junction-to-Ambient (Rθ_JA)';
  } else {
    totalRtheta = 40; // typical SMD DPAK without heatsink
    calculationMode = 'Default SMD Estimate (40 °C/W)';
  }

  const deltaTC = Ploss * totalRtheta;
  const estimatedTjC = Tamb + deltaTC;
  const thermalMarginC = TjMax - estimatedTjC;

  if (estimatedTjC > TjMax) {
    warnings.push({
      severity: 'danger',
      title: 'JUNCTION TEMPERATURE EXCEEDED',
      message: `Estimated junction temperature (${estimatedTjC.toFixed(1)}°C) exceeds maximum silicon rating (${TjMax}°C) by ${Math.abs(thermalMarginC).toFixed(1)}°C. Device will suffer thermal runaway/destruction. A larger heatsink or forced airflow is strictly required.`,
    });
  } else if (thermalMarginC < 25) {
    warnings.push({
      severity: 'warning',
      title: 'Narrow Thermal Safety Margin (<25°C)',
      message: `Operating junction temperature (${estimatedTjC.toFixed(1)}°C) is close to maximum (${TjMax}°C). Ensure reliable thermal interface material (TIM) and heatsink airflow.`,
    });
  }

  steps.push({
    stepNumber: 1,
    title: `Compute Total Thermal Resistance: ${calculationMode}`,
    formula: 'R_θ,total = ∑ R_θ,i',
    substitution: `Total R_θ = ${totalRtheta.toFixed(2)} °C/W`,
    result: `R_θ,total = ${totalRtheta.toFixed(2)} °C/W`,
  });

  steps.push({
    stepNumber: 2,
    title: 'Calculate Steady-State Junction Temperature (T_j)',
    formula: 'T_j = T_amb + (P_loss × R_θ,total)',
    substitution: `${Tamb}°C + (${Ploss.toFixed(2)} W × ${totalRtheta.toFixed(2)} °C/W) = ${Tamb}°C + ${deltaTC.toFixed(1)}°C`,
    result: `T_j = ${estimatedTjC.toFixed(1)} °C`,
  });

  steps.push({
    stepNumber: 3,
    title: 'Evaluate Thermal Margin against Silicon Rating',
    formula: 'Margin = T_j,max - T_j',
    substitution: `${TjMax}°C - ${estimatedTjC.toFixed(1)}°C`,
    result: `Thermal Headroom = ${thermalMarginC.toFixed(1)} °C`,
  });

  return {
    primaryValue: estimatedTjC,
    formattedValue: `${estimatedTjC.toFixed(1)} °C`,
    unit: '°C',
    label: 'Estimated Junction Temperature (T_j)',
    classification: 'ENGINEERING ESTIMATE',
    warnings,
    steps,
    additionalOutputs: {
      junctionTemperature: { label: 'Junction Temp (T_j)', value: `${estimatedTjC.toFixed(1)} °C` },
      temperatureRise: { label: 'Temperature Rise (ΔT)', value: `+${deltaTC.toFixed(1)} °C` },
      thermalHeadroom: { label: 'Thermal Headroom Margin', value: `${thermalMarginC.toFixed(1)} °C` },
      totalThermalResistance: { label: 'Total Thermal Resistance', value: `${totalRtheta.toFixed(2)} °C/W` },
      ambientTemperature: { label: 'Ambient Temperature', value: `${Tamb} °C` },
      powerDissipated: { label: 'Power Dissipated', value: `${Ploss.toFixed(2)} W` },
    },
    visualData: {
      estimatedTjC,
      deltaTC,
      thermalMarginC,
      TjMax,
      Tamb,
      Ploss,
    },
  };
}
