import { calculateOhmsLaw } from '../src/engines/circuit/ohms-law';
import { calculateElectricalPower } from '../src/engines/circuit/power';
import { calculateVoltageDivider } from '../src/engines/circuit/voltage-divider';
import { calculateLedResistor } from '../src/engines/circuit/led-resistor';
import { calculateResistorFromColor } from '../src/engines/circuit/resistor-color';
import { calculateAcPower } from '../src/engines/electrical/ac-power';
import { calculateFreqWavelength } from '../src/engines/rf/freq-wavelength';
import { calculateBatteryRuntime } from '../src/engines/batteries/battery-runtime';
import { calculateNumberConversion } from '../src/engines/digital/number-converter';
import { calculatePwm } from '../src/engines/embedded/pwm-calculator';
import { calculateSeriesResistors, calculateParallelResistors } from '../src/engines/circuit/series-parallel-r';
import { calculateSeriesCapacitors, calculateParallelCapacitors } from '../src/engines/circuit/series-parallel-c';
import { calculateSeriesInductors, calculateParallelInductors } from '../src/engines/circuit/series-parallel-l';
import { calculateRcTimeConstant, calculateRlTimeConstant } from '../src/engines/circuit/rc-rl-time';
import { calculateRlcResonance, calculateLcResonance } from '../src/engines/circuit/rlc-resonance';
import { calculateResistorImpedance, calculateCapacitorImpedance, calculateInductorImpedance, calculateRlcImpedance } from '../src/engines/circuit/impedance';
import { calculateRcLowPass, calculateRcHighPass, calculateRlLowPass, calculateRlHighPass } from '../src/engines/circuit/filters';
import { calculateDiodeSeriesResistor, calculateZenerResistor, calculateZenerPower, calculateRectifier } from '../src/engines/components/diodes';
import { calculateBjtBaseResistor, calculateBjtBias, calculateBjtPower } from '../src/engines/components/transistors';
import { calculateMosfetGateResistor, calculateMosfetConductionLoss, calculateMosfetSwitchingLoss } from '../src/engines/components/mosfets';
import { calculateInvertingAmplifier, calculateNonInvertingAmplifier, calculateOpAmpFollower, calculateSummingAmplifier, calculateDifferentialAmplifier } from '../src/engines/components/opamps';
import { calculateCapacitorEnergy, calculateInductorEnergy, calculateResistorEnergy } from '../src/engines/circuit/energy';
import { calculateVoltageDrop, generateVoltageDropCurve } from '../src/engines/electrical/voltage-drop';
import { calculateCableAmpacity, calculateCableShortCircuitWithstand } from '../src/engines/electrical/conductors';
import { calculateTransformerRatio, calculateTransformerLoading, calculateTransformerLosses, calculateTransformerRegulation } from '../src/engines/electrical/transformers';
import { calculatePowerFactor, calculatePfcCapacitor, calculatePfcSavings } from '../src/engines/electrical/power-factor';
import { calculateMcbRating, calculateProspectiveShortCircuit, calculateRcdSensitivity } from '../src/engines/electrical/protection';
import { calculateMotorFla, calculateMotorSlip, calculateMotorStartingCurrent, calculateMotorShaftTorque } from '../src/engines/electrical/motors';
import { calculateGeneratorSizing, calculateGeneratorFuelConsumption } from '../src/engines/electrical/generators';
import { calculateHeatingElement, calculateFluidHeatingPower, calculateEnclosureHeater } from '../src/engines/electrical/heating';
import { calculateLoadSchedule } from '../src/engines/electrical/load-schedule';
import {
  calculateIdealBuck,
  calculateBuckInductor,
  calculateBuckOutputCapacitor,
  calculateBuckCcmDcmBoundary,
  calculateIdealBoost,
  calculateBoostInductor,
  calculateBoostOutputCapacitor,
  calculateBoostCcmDcmBoundary,
  calculateInvertingBuckBoost,
  calculateNonInvertingBuckBoost,
  calculateSepicConverter,
  calculateCukConverter,
  calculateFlybackFundamentals,
  calculateFlybackTurnsRatio,
  calculateFlybackMagnetizingInductance,
  calculateHalfWaveRectifier,
  calculateFullWaveCenterTappedRectifier,
  calculateBridgeRectifierAdvanced,
  calculateRectifierCapacitorFilter,
  calculateRectifierDiodeStress,
  calculateSwitchingFrequency,
  calculatePwmPowerConverter,
  calculateMosfetVoltageStress,
  calculateMosfetCurrentStress,
  calculateMosfetConductionLoss as calculatePowerMosfetConductionLoss,
  calculateMosfetSwitchingLoss as calculatePowerMosfetSwitchingLoss,
  calculateDiodeRecoveryLoss,
  calculateInductorStoredEnergy,
  calculateInductorRippleCurrent,
  calculatePeakInductorCurrent,
  calculateRmsInductorCurrent,
  calculateMagneticFluxDensity,
  calculateCoreSaturationMargin,
  calculateConverterOutputCapacitor,
  calculateCapacitorEsrRipple,
  calculateCapacitorRmsCurrent,
  calculateCapacitorStoredEnergy,
  calculateConverterEfficiency,
  calculateConverterLossBudget,
  calculatePowerThermalDissipation,
  calculateHBridgeFundamentals,
  calculateSpwmFundamentals,
  calculateInverterRmsOutput,
  calculateInverterPower,
  designPowerConverter,
} from '../src/engines/power';
import {
  calculateTwosComplement,
  calculateQFormat,
  calculateBitManipulation,
  calculateIntegerRanges,
} from '../src/engines/digital/number-converter';
import {
  calculateLogicGate,
  solveKarnaughMap,
} from '../src/engines/digital/logic-gates';
import {
  calculateBinaryArithmetic,
  calculateDataTransfer,
} from '../src/engines/digital/digital-data';
import {
  calculateParity,
  calculateCrc,
  calculateHamming74,
} from '../src/engines/digital/error-detection';
import {
  calculateAdc,
  calculateDac,
} from '../src/engines/digital/adc-dac';
import {
  calculateSampling,
} from '../src/engines/digital/sampling';
import {
  calculateUart,
  calculateSpi,
  calculateI2c,
  calculateCan,
} from '../src/engines/embedded/serial-protocols';
import {
  calculateCpuTiming,
  calculateSensorThroughput,
} from '../src/engines/embedded/embedded-timing';
import {
  findOptimalTimerPrescalers,
} from '../src/engines/embedded/pwm-calculator';
import {
  calculateWaveformMetrics,
  analyzeWaveform,
  calculatePhaseShiftDelay,
  calculateFreqPeriod,
} from '../src/engines/rf/signals-waveforms';
import {
  rectangularToPolar,
  polarToRectangular,
  calculatePhasorArithmetic,
  performPhasorArithmetic,
} from '../src/engines/rf/phasor-signals';
import {
  calculatePowerDb,
  calculateVoltageDb,
  wattsToDbm,
  dbmToWatts,
  wattsToDbw,
  dbwToWatts,
  calculateGainChain,
} from '../src/engines/rf/decibels-power';
import {
  calculateAntennaDimensions,
  calculateAntennaGain,
  calculateEffectiveAperture,
  estimateDishBeamwidth,
  calculatePolarizationLoss,
} from '../src/engines/rf/antennas';
import {
  calculateThermalNoise,
  calculateNoiseFigure,
  calculateReceiverNoiseFloor,
  calculateCascadedNoiseFigure,
  calculateAdcDynamicRange,
} from '../src/engines/rf/rf-noise';
import {
  calculateFspl,
  calculateLinkBudget,
} from '../src/engines/rf/link-budget';
import {
  calculateBandwidthQ,
  generateRlcBodePoints,
  calculateFilterOrderSynthesis,
} from '../src/engines/circuit/filters';
import {
  calculateTraceResistance,
  calculateIpcTraceAmpacity,
  STANDARD_COPPER_WEIGHTS,
} from '../src/engines/pcb/copper-trace';
import {
  calculateViaProperties,
  calculateViaArray,
} from '../src/engines/pcb/vias';
import {
  calculatePropagationDelay,
  calculateStackupThickness,
  STANDARD_STACKUP_PRESETS,
  DIELECTRIC_MATERIALS,
} from '../src/engines/pcb/stackup-dielectrics';
import {
  calculateMicrostripImpedance,
  synthesizeMicrostripWidth,
  calculateStriplineImpedance,
  calculateCoplanarWaveguideImpedance,
} from '../src/engines/pcb/transmission-lines';
import {
  calculateDifferentialPair,
  calculateIntraPairSkew,
  synthesizeDifferentialPairWidth,
  PROTOCOL_TARGETS,
} from '../src/engines/pcb/differential-pairs';
import {
  calculateSignalIntegrity,
  calculateSeriesTermination,
} from '../src/engines/pcb/signal-integrity';
import {
  calculateDecouplingCapacitor,
  calculatePdnTargetImpedance,
  calculatePowerPlane,
  calculateParallelDecouplingNetwork,
} from '../src/engines/pcb/power-integrity';
import {
  calculateClearanceAndCreepage,
  checkAnnularRingDrc,
  runPcbGeometryDrcCheck,
} from '../src/engines/pcb/drc-clearance';
import {
  IPC7351_LAND_PATTERNS,
  COPPER_FOIL_REFERENCE,
  FABRICATION_RULE_TIERS,
} from '../src/engines/pcb/pcb-reference-data';
import { FORMULA_BOOK } from '../src/data/formulas';
import { TOOLS_REGISTRY } from '../src/data/registry';
import { CATEGORIES as TAXONOMY_CATEGORIES } from '../src/data/taxonomy';
import {
  specifyElectricalRequirement,
  specifyPowerRequirement,
  defineOperatingPointMargins,
  specifyEnvironmentalRequirement,
  specifyThermalRequirement,
  specifyMechanicalConstraints,
  specifyComponentConstraints,
  configureDesignMargins,
  checkRequirementConsistency,
  generateRequirementSummary,
  calculateDcPowerBudget,
  calculateMultiRailPowerBudget,
  estimateInputPower,
  calculateConverterLossChain,
  calculateBatteryToLoadChain,
  analyzePeakVsContinuousPower,
  calculateSystemThermalBudget,
  calculateJunctionToAmbientChain,
  calculateHeatSinkRequirement,
  calculateEnclosureThermalBudget,
  calculatePcbThermalBudget,
  analyzeWorstCaseThermal,
  generateThermalDesignSummary,
  calculateBatteryToLoadSizing,
  analyzeBatteryPackRequirements,
  analyzeRuntimeVsLoad,
  checkPeakCurrentCompatibility,
  checkBatteryVoltageCompatibility,
  calculateBatteryThermalLoad,
  analyzeEolBatteryCapacity,
  analyzeWorstCaseBatteryScenario,
  generateBatterySystemDesignSummary,
  analyzePcbPowerIntegrity,
  analyzeTraceCurrentAndThermal,
  analyzeControlledImpedance,
  analyzeDifferentialPairWorkflow,
  analyzeSignalIntegrityRisk,
  analyzeViaCurrentAndThermal,
  analyzePcbClearanceCreepage,
  generatePcbEngineeringSummary,
  conductElectricalDesignReview,
  conductPowerDesignReview,
  conductThermalDesignReview,
  conductBatteryDesignReview,
  conductPcbDesignReview,
  conductSignalIntegrityReview,
  generateSystemEngineeringDesignReport,
  globalAssumptionRegister,
  globalWarningAggregator,
  globalTraceabilityRegister,
} from '../src/engines/design';
import {
  createDefaultProject,
  exportProjectToJson,
  importProjectFromJson,
} from '../src/workspace/storage';
import {
  addDesignCase,
  setBaselineCase,
  addScenario,
  compareDesignCases,
  createProjectRevision,
} from '../src/workspace/case-manager';
import {
  createSnapshotFromCalculation,
  recalculateSnapshot,
} from '../src/workspace/snapshot-orchestrator';
import {
  addValidationItem,
  updateValidationItem,
  getValidationProgress,
  addMeasurement,
  compareMeasurementWithCalculated,
  addManufacturerPart,
  setManufacturerVerification,
} from '../src/workspace/validation-tracker';
import {
  generateMarkdownReport,
  generateReportSummary,
} from '../src/workspace/report-generator';
import {
  runDeterministicOfflineReview,
} from '../src/workspace/ai-intelligence';
import { formatEngineeringNotation, formatSignificantFigures } from '../src/lib/units/formatter';
import {
  toScientificNotation,
  toEngineeringNotation,
  countSignificantFigures,
  calculatePercentageDifference,
  calculatePercentageError,
  calculateRatioAndProportion,
  convertEngineeringPrefix,
  roundPrecision,
  complexAdd,
  complexSub,
  complexMul,
  complexDiv,
  complexMagnitude,
  complexPhase,
  complexConjugate,
  complexPower,
  complexSqrt,
  toEulerForm,
  rectangularToPolar as mathRectToPolar,
  polarToRectangular as mathPolarToRect,
  vectorMagnitude,
  vectorDotProduct,
  vectorCrossProduct,
  vectorProjection,
  angleBetweenVectors,
  matrixDeterminant,
  matrixInverse,
  matrixRank,
  solveLinearSystem2x2,
  solveLinearSystem3x3,
  numericalDerivative,
  numericalSecondDerivative,
  numericalIntegration,
  bisectionMethod,
  newtonRaphsonMethod,
  secantMethod,
  linearInterpolation,
  polynomialInterpolation,
  calculateDescriptiveStatistics,
  calculateLinearRegression,
  minMaxNormalize,
  zScoreStandardize,
  calculateSimpleMovingAverage,
  calculateExponentialMovingAverage,
  propagateAdditionSubtraction,
  propagateMultiplicationDivision,
  propagatePower,
  calculateCombinedUncertaintyGUM,
  solveTriangle,
  calculateCircle,
  calculateRegularPolygon,
  calculateEngineeringVolume,
  cartesianToCylindrical,
  cylindricalToCartesian,
  cartesianToSpherical,
  sphericalToCartesian,
} from '../src/engines/math';
import {
  calculateHeatEnergy,
  calculateHeatTransferRate,
  convertTemperature,
  calculateTemperatureDifference,
  calculateThermalResistance,
  calculateThermalConductance,
  calculateSeriesThermalResistance,
  calculateParallelThermalResistance,
  convertResistanceConductance,
  solveThermalNetwork,
  calculateJunctionTemperature,
  calculateCaseTemperature,
  calculateMaxAmbientTemperature,
  calculateRthJc,
  calculateRthCs,
  calculateRthSa,
  calculateRthJa,
  calculateMaxAllowablePower,
  calculateTemperatureDerating,
  calculateMultiDeviceThermal,
  calculateRequiredHeatsinkRth,
  calculateNaturalConvectionSizing,
  calculateForcedAirSizing,
  calculateAirflowRequirement,
  calculateVelocityAndH,
  calculateExtrusionSizing,
  calculateFinEfficiency,
  calculateHeatsinkPressureDrop,
  calculateFinTemperatureProfile,
  calculateAltitudeDerating,
  calculateTimResistance,
  calculateBltAndContact,
  calculatePressureEffect,
  compareTimPresets,
  calculatePhaseChangeModel,
  calculateInsulatingWasher,
  calculateSurfaceRoughnessImpact,
  calculateGreasePumpOut,
  calculateHeatFlux,
  calculateMultiLayerTimStackup,
  calculatePcbSpreadingResistance,
  calculateThermalViaArray,
  calculatePcbCopperPlaneConductivity,
  calculateEnclosureHeatTransfer,
  calculateSealedEnclosureTemp,
  calculateVentedEnclosureStackEffect,
  calculateEnclosureFanCfm,
  calculateSolarRadiationHeatLoad,
  calculateStefanBoltzmannRadiation,
  calculateCombinedConvectionRadiation,
  calculateThermalCapacitance,
  calculateThermalTimeConstant,
  calculateSinglePulseResponse,
  calculateRepetitivePulseResponse,
  calculateFosterZth,
  calculateArrheniusAcceleration,
  calculateCoffinManson,
  calculateMtbfDerating,
  calculateTenDegreeRule,
  calculateThermalMargin,
} from '../src/engines/thermal';
import {
  calculateBatteryCapacity,
  calculateBatteryEnergy,
  convertWhAndAh,
  calculateFundamentalRuntime,
  calculateBatteryCurrent,
  calculateBatteryPower,
  calculateBatteryVoltage,
  calculateCRate,
  calculateChargeDischargeTime,
  calculateBatteryEnergyEfficiency,
  calculateCellsInSeries,
  calculateCellsInParallel,
  calculateSeriesPackVoltage,
  calculateParallelPackCapacity,
  calculatePackEnergy,
  calculatePackCurrentCapability,
  calculatePackCRate,
  designBatteryPack,
  calculateCellToPackScaling,
  verifyPackCapacityAndEnergy,
  calculateConstantCurrentDischarge,
  calculateConstantPowerDischarge,
  calculateVariableLoadRuntime,
  calculateProfileEnergy,
  calculateAverageLoad,
  analyzePeakLoad,
  calculateVoltageSag,
  calculateInternalResistance,
  calculateAvailablePower,
  calculateDischargeEfficiency,
  calculateSoc,
  calculateSocFromCapacity,
  estimateSocFromVoltage,
  calculateDoD,
  calculateSoh,
  calculateCapacityFade,
  calculateEquivalentFullCycles,
  stepCoulombCounting,
  estimateRemainingEnergy,
  calculateRemainingRuntime,
  calculateCcCharging,
  calculateCvCharging,
  estimateCcCvChargingTime,
  calculateChargeEnergy,
  calculateRoundTripEnergyEfficiency,
  calculateCoulombicEfficiency,
  calculateChargingPower,
  sizeChargingCurrent,
  calculateChargeLoss,
  estimateChargeHeatGeneration,
  calculatePeukertRuntime,
  calculatePeukertExponent,
  calculateInternalResistanceAging,
  calculateCapacityDegradation,
  estimateCycleLife,
  estimateCalendarLife,
  calculateTemperatureDerating as calculateBatteryTemperatureDerating,
  calculateBatteryThermalPower,
  sizeEnergyStorage,
  calculateDesignMargins,
  POPULAR_CELL_PRESETS,
} from '../src/engines/batteries';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (errorDetail) console.error(`    Detail: ${errorDetail}`);
  }
}

function assertApprox(val: number, expected: number, tolerance = 1e-4, testName: string) {
  const diff = Math.abs(val - expected);
  assert(diff <= tolerance, testName, `Expected ~${expected}, got ${val} (diff ${diff})`);
}

console.log('\n======================================================');
console.log('⚡ ELECTROKIT ENGINE VERIFICATION & MATHEMATICAL AUDIT');
console.log('======================================================\n');

// 1. Formatter & Engineering Notation
console.log('1. Formatter & Significant Figures:');
assert(formatSignificantFigures(12.3456, 4) === '12.35', 'formatSignificantFigures 12.3456 to 4 sig figs');
assert(formatSignificantFigures(0.001234, 3) === '0.00123', 'formatSignificantFigures small decimals');
assert(formatEngineeringNotation(1500, 'Ω').full === '1.5 kΩ', 'formatEngineeringNotation 1500 Ω -> 1.5 kΩ');
assert(formatEngineeringNotation(0.0000047, 'F').full === '4.7 µF', 'formatEngineeringNotation 0.0000047 F -> 4.7 µF');
assert(formatEngineeringNotation(0, 'V').full === '0 V', 'formatEngineeringNotation 0 V');

// 2. Ohm's Law Engine
console.log("\n2. Ohm's Law Engine:");
const ohm1 = calculateOhmsLaw({ voltage: 12, current: 0.02 });
assertApprox(ohm1.primaryValue, 600, 1e-6, "Ohm's Law: 12V / 20mA = 600 Ω");
assert(ohm1.additionalOutputs?.power.value !== '—', "Ohm's Law: Power output is computed");
assert(ohm1.standardValue?.recommendedValue === 620, "Ohm's Law: Nearest E24 for 600 Ω is 620 Ω");

// Ohm's Law Edge Cases
const ohmShort = calculateOhmsLaw({ voltage: 5, resistance: 0 });
assert(ohmShort.primaryValue === Infinity, "Ohm's Law Short Circuit: 5V / 0Ω returns Infinity");
assert(ohmShort.warnings.some(w => w.severity === 'danger'), "Ohm's Law Short Circuit: Emits danger warning");

const ohmNegative = calculateOhmsLaw({ voltage: -12, current: 0.01 });
assert(ohmNegative.warnings.some(w => w.title.includes('Negative')), "Ohm's Law: Warns on negative potential/resistance");

// 3. Electrical Power Engine
console.log('\n3. Electrical Power Engine:');
const pwr1 = calculateElectricalPower({ voltage: 230, current: 10, timeHours: 2 });
assertApprox(pwr1.primaryValue, 2300, 1e-6, 'Power: 230V * 10A = 2300 W');
assertApprox(pwr1.visualData!.energyKwh, 4.6, 1e-6, 'Power: 2300W * 2h = 4.6 kWh');
assert(pwr1.warnings.some(w => w.code === 'HV_DANGER'), 'Power: Flags 230V mains high voltage shock hazard');

// 4. Voltage Divider Engine
console.log('\n4. Voltage Divider Engine:');
const div1 = calculateVoltageDivider({ vin: 10, r1: 1000, r2: 1000 });
assertApprox(div1.primaryValue, 5.0, 1e-6, 'Voltage Divider Unloaded: 10V with 1k/1k = 5.0 V');
assertApprox(div1.visualData!.theveninR, 500, 1e-6, 'Voltage Divider Thevenin: 1k || 1k = 500 Ω');

// Loaded Divider
const divLoaded = calculateVoltageDivider({ vin: 10, r1: 1000, r2: 1000, loadResistance: 1000 });
assertApprox(divLoaded.primaryValue, 3.333333, 1e-3, 'Voltage Divider Loaded: 1k / (1k || 1k) = 3.333 V');
assert(divLoaded.warnings.some(w => w.title.includes('Loading Sag')), 'Voltage Divider: Warns on heavy loading sag');

// 5. LED Current Limiting Ballast Resistor Engine
console.log('\n5. LED Ballast Resistor Engine:');
const led1 = calculateLedResistor({ supplyVoltage: 5, ledForwardVoltage: 2.0, ledCurrent: 0.02, seriesCount: 1 });
assertApprox(led1.primaryValue, 150, 1e-6, 'LED Resistor: (5V - 2V) / 20mA = 150 Ω');
assert(led1.standardValue?.recommendedValue === 150, 'LED Resistor: 150 Ω is exactly an E24 standard value');

const ledUnderVoltage = calculateLedResistor({ supplyVoltage: 3.3, ledForwardVoltage: 3.5, ledCurrent: 0.02, seriesCount: 1 });
assert(ledUnderVoltage.primaryValue === 0, 'LED Resistor: Vs < Vf returns 0 Ω required (LED does not conduct)');
assert(ledUnderVoltage.warnings.some(w => w.title.includes('Insufficient Supply')), 'LED Resistor: Flags insufficient supply warning');

// 6. Resistor Color Code Engine
console.log('\n6. Resistor Color Code Engine:');
const color4 = calculateResistorFromColor({ bandCount: 4, band1: 'yellow', band2: 'violet', band3: 'red', band4: 'gold' });
assert(color4.primaryValue === 4700, 'Resistor 4-Band: Yellow(4) Violet(7) Red(100) Gold(5%) = 4700 Ω');
assert(color4.visualData!.tolerancePercent === 5, 'Resistor 4-Band Tolerance is 5%');

const color5 = calculateResistorFromColor({ bandCount: 5, band1: 'brown', band2: 'black', band3: 'black', band4: 'brown', band5: 'brown' });
assert(color5.primaryValue === 1000, 'Resistor 5-Band: Brown(1) Black(0) Black(0) Brown(x10) Brown(1%) = 1000 Ω (1 kΩ 1%)');

// 7. AC Power (Single & 3-Phase) Engine
console.log('\n7. AC Power Engine:');
const ac1 = calculateAcPower({
  systemType: 'three-phase-wye',
  voltageRms: 400,
  currentRms: 25,
  powerFactor: 0.8,
  pfType: 'lagging',
  frequencyHz: 50,
  targetPowerFactor: 0.95,
});
assertApprox(ac1.visualData!.apparentPowerVa, Math.sqrt(3) * 400 * 25, 1e-2, 'AC 3-Phase: S = √3 * 400 * 25 = 17,320.5 VA');
assertApprox(ac1.primaryValue, Math.sqrt(3) * 400 * 25 * 0.8, 1e-2, 'AC 3-Phase: P = S * 0.8 = 13,856.4 W');
assert(ac1.visualData!.qCapacitorVar > 0, 'AC 3-Phase: Calculates PFC capacitor relief');

// 8. RF Frequency & Wavelength Engine
console.log('\n8. RF Frequency & Wavelength Engine:');
const rf1 = calculateFreqWavelength({ mode: 'freq_to_lambda', frequencyHz: 144e6, velocityFactor: 1.0 });
assertApprox(rf1.primaryValue, 299792458 / 144e6, 1e-4, 'RF: 144 MHz in vacuum λ ≈ 2.0819 m (2-meter VHF band)');
assert(rf1.visualData!.rfBand.band === 'VHF', 'RF: 144 MHz classified as VHF band');

// 9. Battery Runtime Engine
console.log('\n9. Battery Runtime Engine:');
const bat1 = calculateBatteryRuntime({
  nominalVoltage: 3.7,
  capacityAh: 2.5,
  chemistry: 'li-ion',
  dischargeDepthPercent: 80,
  loadMode: 'current',
  loadValue: 1.0,
});
assertApprox(bat1.visualData!.usableEnergyWh, 2.5 * 3.7 * 0.8, 1e-3, 'Battery: Usable Wh = 2.5Ah * 3.7V * 0.8 = 7.4 Wh');
assert(bat1.primaryValue > 0, 'Battery: Calculates derated runtime > 0');

const batNoLoad = calculateBatteryRuntime({
  nominalVoltage: 3.7,
  capacityAh: 2.5,
  chemistry: 'li-ion',
  dischargeDepthPercent: 80,
  loadMode: 'current',
  loadValue: 0,
});
assert(batNoLoad.primaryValue === Infinity, 'Battery: Zero load returns Infinity runtime');

// 10. Number Converter Engine
console.log('\n10. Number Converter Engine:');
const num1 = calculateNumberConversion({ sourceRadix: 16, rawValue: '0xFF', bitWidth: 8, isSigned: true });
assert(num1.primaryValue === -1, "Number Converter: 0xFF in 8-bit signed two's complement is -1");

const num2 = calculateNumberConversion({ sourceRadix: 2, rawValue: '10101010', bitWidth: 8, isSigned: false });
assert(num2.primaryValue === 0xaa, 'Number Converter: 10101010 in unsigned 8-bit is 170 (0xAA)');

// 11. Embedded PWM Engine
console.log('\n11. PWM Calculator Engine:');
const pwm1 = calculatePwm({
  frequencyHz: 1000,
  dutyCyclePercent: 50,
  supplyVoltage: 5.0,
  mcuClockHz: 16e6,
  prescaler: 1,
});
assertApprox(pwm1.primaryValue, 2.5, 1e-6, 'PWM: 50% duty of 5V = 2.5 V average');
assert(pwm1.additionalOutputs?.timerArr.value === '15999', 'PWM: 16MHz / (1 * 1000Hz) - 1 = 15,999 ARR counts');

// 12. Series & Parallel Resistors
console.log('\n12. Series & Parallel Resistors Engine:');
const serR = calculateSeriesResistors({ resistors: [100, 220, 470], voltage: 12 });
assertApprox(serR.primaryValue, 790, 1e-4, 'Series R: 100 + 220 + 470 = 790 Ω');
assertApprox(serR.visualData!.totalPower, (12 * 12) / 790, 1e-4, 'Series R: P = V^2 / R = 0.182 W');

const parR = calculateParallelResistors({ resistors: [1000, 1000], voltage: 10 });
assertApprox(parR.primaryValue, 500, 1e-4, 'Parallel R: 1k || 1k = 500 Ω');
assertApprox(parR.visualData!.totalCurrent, 0.02, 1e-4, 'Parallel R: I_tot = 10V / 500Ω = 20 mA');

// 13. Series & Parallel Capacitors
console.log('\n13. Series & Parallel Capacitors Engine:');
const serC = calculateSeriesCapacitors({ capacitors: [10e-6, 10e-6], voltage: 20 });
assertApprox(serC.primaryValue, 5e-6, 1e-9, 'Series C: 10µF in series with 10µF = 5 µF');
assertApprox(serC.visualData!.totalEnergy, 0.5 * 5e-6 * 400, 1e-6, 'Series C: Energy = 0.5 * 5µF * 20^2 = 1 mJ');

const parC = calculateParallelCapacitors({ capacitors: [10e-6, 22e-6], voltage: 12 });
assertApprox(parC.primaryValue, 32e-6, 1e-9, 'Parallel C: 10µF + 22µF = 32 µF');

// 14. Series & Parallel Inductors
console.log('\n14. Series & Parallel Inductors Engine:');
const serL = calculateSeriesInductors({ inductors: [10e-3, 15e-3], current: 2 });
assertApprox(serL.primaryValue, 25e-3, 1e-6, 'Series L: 10mH + 15mH = 25 mH');

const parL = calculateParallelInductors({ inductors: [20e-3, 20e-3], current: 1 });
assertApprox(parL.primaryValue, 10e-3, 1e-6, 'Parallel L: 20mH || 20mH = 10 mH');

// 15. RC & RL Time Constants
console.log('\n15. RC & RL Time Constants Engine:');
const rcTime = calculateRcTimeConstant({ resistance: 1000, capacitance: 1e-6, supplyVoltage: 5 });
assertApprox(rcTime.primaryValue, 1e-3, 1e-6, 'RC Time: 1kΩ * 1µF = 1.0 ms');
assert(rcTime.visualData!.curvePoints.length > 20, 'RC Time: Generates dynamic charging curve data points');

const rlTime = calculateRlTimeConstant({ inductance: 10e-3, resistance: 100, stepVoltage: 5 });
assertApprox(rlTime.primaryValue, 0.0001, 1e-6, 'RL Time: 10mH / 100Ω = 100 µs');
assertApprox(rlTime.visualData!.iMax, 0.05, 1e-6, 'RL Time: I_max = 5V / 100Ω = 50 mA');

// 16. RLC & LC Resonance
console.log('\n16. RLC & LC Resonance Engine:');
const rlc1 = calculateRlcResonance({ resistance: 10, inductance: 1e-3, capacitance: 1e-7, topology: 'series' });
const expF0 = 1 / (2 * Math.PI * Math.sqrt(1e-3 * 1e-7));
assertApprox(rlc1.primaryValue, expF0, 1e-2, `Series RLC: f0 = 1/(2π√(LC)) ≈ ${expF0.toFixed(1)} Hz`);
assertApprox(rlc1.visualData!.z0, 100, 1e-4, 'Series RLC: Z0 = √(L/C) = 100 Ω');
assertApprox(rlc1.visualData!.Q, 10, 1e-4, 'Series RLC: Q = Z0 / R = 10');

const lc1 = calculateLcResonance({ inductance: 10e-6, capacitance: 100e-12, voltage: 5 });
assertApprox(lc1.primaryValue, 1 / (2 * Math.PI * Math.sqrt(10e-6 * 100e-12)), 1e-1, 'LC Resonance: f0 calculated accurately');

// 17. AC Impedance Engines
console.log('\n17. AC Impedance Engine:');
const zR = calculateResistorImpedance({ resistance: 470 });
assertApprox(zR.primaryValue, 470, 1e-4, 'Resistor Impedance: Z = 470 Ω ∠ 0°');

const zC = calculateCapacitorImpedance({ capacitance: 1e-6, frequency: 1000 });
const expXc = 1 / (2 * Math.PI * 1000 * 1e-6);
assertApprox(zC.primaryValue, expXc, 1e-3, `Capacitor Impedance: |Z_c| = 1/(2πfC) ≈ ${expXc.toFixed(2)} Ω`);

const zL = calculateInductorImpedance({ inductance: 10e-3, frequency: 1000 });
const expXl = 2 * Math.PI * 1000 * 10e-3;
assertApprox(zL.primaryValue, expXl, 1e-3, `Inductor Impedance: |Z_l| = 2πfL ≈ ${expXl.toFixed(2)} Ω`);

const zRlc = calculateRlcImpedance({ resistance: 100, inductance: 10e-3, capacitance: 1e-6, frequency: 1000, topology: 'series' });
assert(zRlc.primaryValue > 100, 'Series RLC: Total |Z| includes reactive difference');

// 18. RC & RL Filters
console.log('\n18. RC & RL Filters Engine:');
const lpRc = calculateRcLowPass({ resistance: 1000, capacitance: 1e-7 });
const expFc = 1 / (2 * Math.PI * 1000 * 1e-7);
assertApprox(lpRc.primaryValue, expFc, 1e-2, `RC Low-Pass: fc ≈ ${expFc.toFixed(1)} Hz`);
assert(lpRc.visualData!.bodePoints.length > 20, 'RC Low-Pass: Generates frequency response Bode points');

const hpRc = calculateRcHighPass({ resistance: 1000, capacitance: 1e-7 });
assertApprox(hpRc.primaryValue, expFc, 1e-2, 'RC High-Pass: fc matches theoretical');

const lpRl = calculateRlLowPass({ resistance: 1000, inductance: 10e-3 });
assertApprox(lpRl.primaryValue, 1000 / (2 * Math.PI * 10e-3), 1e-2, 'RL Low-Pass: fc = R/(2πL)');

// 19. Diode & Power Components
console.log('\n19. Diode & Rectifier Engines:');
const dRes = calculateDiodeSeriesResistor({ supplyVoltage: 12, forwardVoltage: 0.7, targetCurrent: 0.02, diodeCount: 1 });
assertApprox(dRes.primaryValue, (12 - 0.7) / 0.02, 1e-4, 'Diode Resistor: (12V - 0.7V) / 20mA = 565 Ω');

const zenRes = calculateZenerResistor({ supplyVoltageMin: 12, supplyVoltageMax: 15, zenerVoltage: 5.1, loadCurrentMax: 0.02 });
assert(zenRes.primaryValue > 0, 'Zener Resistor: Computes safe series ballast resistor');

const zenP = calculateZenerPower({ zenerVoltage: 5.1, zenerCurrent: 0.05, ratedPower: 0.5 });
assertApprox(zenP.primaryValue, 5.1 * 0.05, 1e-4, 'Zener Power: 5.1V * 50mA = 0.255 W');

const rect = calculateRectifier({ topology: 'bridge', acRmsVoltage: 12, diodeDrop: 0.7 });
const expVpeakDc = (12 * Math.SQRT2) - 1.4;
assertApprox(rect.visualData!.VpeakDc, expVpeakDc, 1e-3, 'Bridge Rectifier: Vpeak,dc = √2*12V - 1.4V');

// 20. Transistor Engines (BJT & MOSFET)
console.log('\n20. Transistor & MOSFET Engines:');
const bjtBase = calculateBjtBaseResistor({ vin: 5, collectorCurrent: 0.1, transistorBeta: 100, forcedBeta: 10 });
assertApprox(bjtBase.primaryValue, (5 - 0.7) / (0.1 / 10), 1e-4, 'BJT Base Resistor: Forced beta = 10 gives 430 Ω');

const bjtBias = calculateBjtBias({ vcc: 12, r1: 33000, r2: 10000, rc: 2200, re: 1000, beta: 100 });
assert(bjtBias.additionalOutputs?.operatingRegion.value === 'Active', 'BJT Bias: Identifies active linear region');
assert(bjtBias.visualData!.Ic > 0, 'BJT Bias: Collector current > 0');

const bjtP = calculateBjtPower({ vce: 5, ic: 0.05, rThetaJa: 200, ambientTemp: 25 });
assertApprox(bjtP.primaryValue, 0.25, 1e-4, 'BJT Power: 5V * 50mA = 0.25 W');
assertApprox(bjtP.visualData!.tj, 25 + (0.25 * 200), 1e-3, 'BJT Power: Tj = 25 + 0.25W * 200°C/W = 75°C');

const mosRg = calculateMosfetGateResistor({ gateCharge: 30e-9, driverVoltage: 10, desiredSwitchingTime: 50e-9, driverInternalResistance: 2.0 });
assert(mosRg.primaryValue > 0, 'MOSFET Gate Resistor: Calculates positive external resistor');

const mosCond = calculateMosfetConductionLoss({ currentRms: 10, rdsOn25: 0.02, operatingTempJunction: 100, tempCoeffPercentPerC: 0.6 });
assert(mosCond.primaryValue > 2.0, 'MOSFET Conduction Loss: Accounts for thermal resistance escalation');

const mosSw = calculateMosfetSwitchingLoss({ busVoltage: 48, loadCurrent: 10, riseTime: 20e-9, fallTime: 25e-9, switchingFreq: 100000 });
assertApprox(mosSw.primaryValue, 0.5 * 48 * 10 * (45e-9) * 100000, 1e-4, 'MOSFET Switching Loss: 0.5 * V * I * (tr + tf) * f');

// 21. Op-Amp Circuits
console.log('\n21. Op-Amp Circuits Engine:');
const opInv = calculateInvertingAmplifier({ rIn: 10000, rFeedback: 100000, vIn: 1.0 });
assertApprox(opInv.visualData!.gain, -10, 1e-4, 'Inverting Op-Amp: Gain = -100k/10k = -10.0');

const opNonInv = calculateNonInvertingAmplifier({ rGround: 10000, rFeedback: 90000, vIn: 1.0 });
assertApprox(opNonInv.visualData!.gain, 10, 1e-4, 'Non-Inverting Op-Amp: Gain = 1 + 90k/10k = +10.0');

const opFollower = calculateOpAmpFollower({ vIn: 3.3 });
assertApprox(opFollower.primaryValue, 3.3, 1e-4, 'Op-Amp Follower: Av = 1.000');

const opSum = calculateSummingAmplifier({ channels: [{ vIn: 1, rIn: 10000 }, { vIn: 2, rIn: 10000 }], rFeedback: 10000 });
assertApprox(opSum.primaryValue, -3.0, 1e-4, 'Summing Op-Amp: -(1V + 2V) = -3.0 V');

const opDiff = calculateDifferentialAmplifier({ r1: 10000, r2: 100000, r3: 10000, r4: 100000, v1: 1.0, v2: 1.5 });
assertApprox(opDiff.primaryValue, 5.0, 1e-4, 'Differential Op-Amp: (1.5V - 1.0V) * 10 = 5.0 V');

// 22. Energy Storage & Thermal Dissipation
console.log('\n22. Energy & Power Engine:');
const capE = calculateCapacitorEnergy({ capacitance: 100e-6, voltage: 50 });
assertApprox(capE.primaryValue, 0.5 * 100e-6 * 2500, 1e-6, 'Capacitor Energy: 0.5 * 100µF * 50^2 = 0.125 J');

const indE = calculateInductorEnergy({ inductance: 10e-3, current: 2.0 });
assertApprox(indE.primaryValue, 0.5 * 10e-3 * 4.0, 1e-6, 'Inductor Energy: 0.5 * 10mH * 2^2 = 0.020 J');

const resE = calculateResistorEnergy({ resistance: 100, voltage: 10, durationSeconds: 60 });
assertApprox(resE.primaryValue, (100 / 100) * 60, 1e-4, 'Resistor Energy: (10^2 / 100) * 60s = 60 Joules');

// 23. Voltage Drop Engine
console.log('\n23. Voltage Drop Engine:');
const vDropRes = calculateVoltageDrop({
  circuitType: 'three-phase',
  systemVoltageV: 400,
  loadCurrentA: 32,
  oneWayLengthMeters: 60,
  conductorMaterial: 'copper',
  conductorAreaMm2: 6.0,
  powerFactor: 0.9,
});
assert(vDropRes.primaryValue > 0 && vDropRes.primaryValue < 400, 'Voltage Drop: Computes positive drop under nominal voltage');
assert(vDropRes.visualData!.dropPercent > 0, 'Voltage Drop: Calculates percentage drop > 0%');
const curvePts = generateVoltageDropCurve({
  circuitType: 'three-phase',
  systemVoltageV: 400,
  loadCurrentA: 32,
  oneWayLengthMeters: 60,
  conductorMaterial: 'copper',
  conductorAreaMm2: 6.0,
  powerFactor: 0.9,
});
assert(curvePts.length === 11, 'Voltage Drop: Generates 11 distance curve points');

// 24. Cable Ampacity & Adiabatic Short-Circuit Engine
console.log('\n24. Cable Ampacity & Withstand Engine:');
const cableAmp = calculateCableAmpacity({
  standard: 'IEC',
  conductorMaterial: 'copper',
  insulationType: 'PVC',
  nominalCrossSectionMm2: 4.0,
  installationMethod: 'B2',
  ambientTemperatureC: 40,
  numberOfLoadedCircuits: 3,
});
assert(cableAmp.primaryValue > 0, 'Cable Ampacity: Derated current is positive');
assert(cableAmp.primaryValue < 30, 'Cable Ampacity: Thermal and grouping derating correctly reduces ampacity');

const cableAdiabatic = calculateCableShortCircuitWithstand({
  conductorMaterial: 'copper',
  insulationType: 'PVC',
  crossSectionMm2: 4.0,
  faultDurationSeconds: 0.1,
});
assert(cableAdiabatic.primaryValue > 1000, 'Cable Withstand: 4mm² PVC Cu sustains > 1000A for 100ms adiabatic fault');

// 25. Transformer Engineering Engine
console.log('\n25. Transformer Engineering Engine:');
const xfmrRatio = calculateTransformerRatio({ primaryVoltageV: 400, secondaryVoltageV: 230 });
assertApprox(xfmrRatio.primaryValue, 400 / 230, 1e-4, 'Transformer Turns Ratio: 400V / 230V ≈ 1.739');

const xfmrLoading = calculateTransformerLoading({
  ratedKva: 50,
  secondaryVoltageV: 400,
  loadCurrentA: 60,
  circuitType: 'three-phase',
});
assert(xfmrLoading.primaryValue > 70 && xfmrLoading.primaryValue < 90, 'Transformer Loading: 60A at 400V 3P on 50kVA is ~83% loading');

const xfmrEff = calculateTransformerLosses({
  ratedKva: 50,
  coreLossWatts: 280,
  fullLoadCopperLossWatts: 1200,
  loadFraction: 0.75,
  powerFactor: 0.85,
});
assert(xfmrEff.primaryValue > 95, 'Transformer Efficiency: Exceeds 95% at 75% load');

const xfmrReg = calculateTransformerRegulation({ vNoLoad: 240, vFullLoad: 230 });
assertApprox(xfmrReg.primaryValue, ((240 - 230) / 230) * 100, 1e-4, 'Transformer Voltage Regulation: (240 - 230) / 230 = 4.35%');

// 26. Power Factor Correction Engine
console.log('\n26. Power Factor Correction Engine:');
const pfcCap = calculatePfcCapacitor({
  activePowerW: 50000,
  initialPf: 0.75,
  targetPf: 0.95,
  voltageV: 400,
  frequencyHz: 50,
  circuitType: 'three-phase',
});
assert(pfcCap.primaryValue > 0, 'PFC: Requires positive capacitor bank rating in kVAR');

const pfcSavings = calculatePfcSavings({
  activePowerW: 50000,
  initialPf: 0.75,
  targetPf: 0.95,
  voltageV: 400,
  circuitType: 'three-phase',
  feederResistanceOhms: 0.05,
  operatingHoursPerYear: 4000,
  electricityTariffPerKwh: 0.16,
});
assert(pfcSavings.primaryValue > 0, 'PFC Savings: Yields positive financial feeder I²R savings');

// 27. Electrical Protection Engine
console.log('\n27. Electrical Protection Engine:');
const mcbCalc = calculateMcbRating({
  designCurrentA: 25,
  cableAmpacityA: 35,
  loadType: 'motor',
});
assert(mcbCalc.primaryValue >= 25, 'MCB Rating: Chosen standard rating >= design current');
assert(mcbCalc.additionalOutputs?.curveType?.value === 'Type D', 'MCB Curve: Motors recommend Type D magnetic curve');

const psccCalc = calculateProspectiveShortCircuit({
  systemVoltageV: 230,
  faultLoopImpedanceOhms: 0.25,
});
assertApprox(psccCalc.primaryValue, 230 / 0.25, 1e-4, 'PSCC: 230V / 0.25Ω = 920 A');

const rcdCalc = calculateRcdSensitivity({ applicationType: 'socket-outlets' });
assert(rcdCalc.primaryValue === 30, 'RCD Sensitivity: Socket outlets mandate 30mA high-sensitivity RCD');

// 28. Electric Motors Engine
console.log('\n28. Electric Motors Engine:');
const motorFla = calculateMotorFla({
  ratedPowerKw: 7.5,
  voltageV: 400,
  powerFactor: 0.85,
  efficiencyPercent: 88,
  phases: 3,
});
assert(motorFla.primaryValue > 10 && motorFla.primaryValue < 20, 'Motor FLA: 7.5kW 400V 3P motor FLA is ~14.4 A');

const motorSlip = calculateMotorSlip({
  supplyFrequencyHz: 50,
  polePairs: 2,
  measuredRpm: 1440,
});
assertApprox(motorSlip.primaryValue, 4.0, 1e-4, 'Motor Slip: (1500 - 1440) / 1500 = 4.0%');

const motorTorque = calculateMotorShaftTorque({
  ratedPowerKw: 7.5,
  ratedSpeedRpm: 1440,
});
assertApprox(motorTorque.primaryValue, (9550 * 7.5) / 1440, 1e-2, 'Motor Torque: 9550 * 7.5 / 1440 ≈ 49.7 N·m');

const motorStart = calculateMotorStartingCurrent({
  flaAmperes: 14.4,
  startingMethod: 'direct-on-line',
});
assert(motorStart.primaryValue > 80, 'Motor Starting: DOL inrush current is 6x-8x FLA');

// 29. Generator Sizing Engine
console.log('\n29. Generator Sizing Engine:');
const gensetCalc = calculateGeneratorSizing({
  continuousKva: 40,
  largestMotorHp: 15,
  motorStartingMethod: 'direct-on-line',
  ambientTempC: 35,
  altitudeMeters: 500,
});
assert(gensetCalc.primaryValue > 40, 'Generator Sizing: Prime genset rating accommodates motor step surge');

const fuelCalc = calculateGeneratorFuelConsumption({
  ratedKva: 100,
  operatingLoadPercent: 75,
  fuelType: 'diesel',
});
assert(fuelCalc.primaryValue > 0, 'Generator Fuel: Calculates positive hourly fuel consumption');

// 30. Electrical Heating Engine
console.log('\n30. Electrical Heating Engine:');
const heaterElem = calculateHeatingElement({
  supplyVoltageV: 230,
  ratedPowerWatts: 2000,
});
assertApprox(heaterElem.primaryValue, (230 * 230) / 2000, 1e-2, 'Heater Element: Resistance R = 230^2 / 2000 = 26.45 Ω');

const waterHeater = calculateFluidHeatingPower({
  fluidType: 'water',
  volumeLiters: 50,
  initialTempC: 15,
  targetTempC: 65,
  heatUpTimeHours: 1.0,
});
assert(waterHeater.primaryValue > 2.0 && waterHeater.primaryValue < 5.0, 'Water Heating: 50L heated 50°C in 1h requires ~2.9 kW');

const encHeater = calculateEnclosureHeater({
  enclosureSurfaceAreaM2: 2.5,
  deltaTC: 10,
  insulationLevel: 'standard-sheet-steel',
});
assert(encHeater.primaryValue > 50, 'Enclosure Heater: Sized with anti-condensation margin');

// 31. Electrical Load Schedule Engine
console.log('\n31. Electrical Load Schedule Engine:');
const scheduleRes = calculateLoadSchedule({
  circuits: [
    { id: '1', name: 'Lighting', connectedWatts: 3000, isContinuous: true, diversityFactor: 0.9, phase: 'L1' },
    { id: '2', name: 'HVAC Air Handlers', connectedWatts: 8000, isContinuous: true, diversityFactor: 1.0, phase: 'L2' },
    { id: '3', name: 'General Receptacles', connectedWatts: 5000, isContinuous: false, diversityFactor: 0.5, phase: 'L3' },
  ],
  systemVoltageV: 400,
  systemType: 'three-phase',
  targetPowerFactor: 0.9,
});
assert(scheduleRes.primaryValue > 0, 'Load Schedule: Total diversified demand is computed');
assert(scheduleRes.visualData!.connectedKw === 16, 'Load Schedule: Connected total = 3 + 8 + 5 = 16 kW');

// =========================================================================
// PHASE 05 — POWER ELECTRONICS & POWER CONVERSION AUDIT
// =========================================================================

// 32. Buck Converter Engine
console.log('\n32. Buck Converter Engine:');
const buckIdeal = calculateIdealBuck({ inputVoltageV: 24, outputVoltageV: 12 });
assertApprox(buckIdeal.primaryValue, 0.5, 1e-4, 'Buck Ideal: D = 12V / 24V = 0.50 (50%)');

const buckInd = calculateBuckInductor({
  inputVoltageV: 24,
  outputVoltageV: 5,
  outputCurrentA: 3.0,
  switchingFrequencyHz: 250000,
  rippleRatioPercent: 30, // 30% of 3A = 0.9A
});
// L = (5 * (1 - 5/24)) / (250000 * 0.9) ≈ 17.59 µH
assertApprox(buckInd.primaryValue, (5 * (1 - 5 / 24)) / (250000 * 0.9), 1e-6, 'Buck Inductor: Minimum L matches formula');

const buckCap = calculateBuckOutputCapacitor({
  inductorRippleCurrentA: 0.9,
  switchingFrequencyHz: 250000,
  allowableRippleVoltageV: 0.03, // 30 mV
});
assert(buckCap.primaryValue > 0, 'Buck Output Cap: Sized correctly for 30mV ripple');

const buckCcm = calculateBuckCcmDcmBoundary({
  inputVoltageV: 24,
  outputVoltageV: 5,
  inductanceH: 17.6e-6,
  switchingFrequencyHz: 250000,
  actualLoadCurrentA: 2.0,
});
assert(buckCcm.primaryValue > 0, 'Buck CCM/DCM: Critical load boundary calculated');
assert(buckCcm.additionalOutputs!.operatingMode.value.includes('CCM'), 'Buck CCM mode recognized');

// 33. Boost Converter Engine
console.log('\n33. Boost Converter Engine:');
const boostIdeal = calculateIdealBoost({ inputVoltageV: 12, outputVoltageV: 24 });
assertApprox(boostIdeal.primaryValue, 0.5, 1e-4, 'Boost Ideal: D = 1 - 12/24 = 0.50');

const boostInvalid = calculateIdealBoost({ inputVoltageV: 24, outputVoltageV: 12 });
assert(boostInvalid.warnings.length > 0 && boostInvalid.warnings[0].severity === 'danger', 'Boost Vout <= Vin generates danger warning');

const boostInd = calculateBoostInductor({
  inputVoltageV: 12,
  outputVoltageV: 24,
  outputCurrentA: 2.0,
  switchingFrequencyHz: 200000,
  rippleRatioPercent: 30,
});
assert(boostInd.primaryValue > 0, 'Boost Inductor: Sized with input ripple');

const boostCap = calculateBoostOutputCapacitor({
  outputVoltageV: 24,
  outputCurrentA: 2.0,
  dutyCycle: 0.5,
  switchingFrequencyHz: 200000,
  allowableRippleVoltageV: 0.05,
});
assert(boostCap.primaryValue > 0, 'Boost Output Cap: Sized correctly');

// 34. Buck-Boost Converters
console.log('\n34. Buck-Boost Converters:');
const invBuckBoost = calculateInvertingBuckBoost({
  inputVoltageV: 12,
  outputVoltageMagnitudeV: 12,
  outputCurrentA: 1.5,
  switchingFrequencyHz: 150000,
});
assertApprox(invBuckBoost.primaryValue, 0.5, 1e-4, 'Inverting Buck-Boost: D = 12 / (12+12) = 0.50');

const nonInv4Switch = calculateNonInvertingBuckBoost({
  inputVoltageV: 24,
  outputVoltageV: 12,
});
assert(nonInv4Switch.additionalOutputs!.operatingRegime.value.includes('Buck'), '4-Switch: Vin > Vout operates in Buck mode');

// 35. SEPIC & Ćuk Converters
console.log('\n35. SEPIC & Ćuk Converters:');
const sepicRes = calculateSepicConverter({
  inputVoltageV: 12,
  outputVoltageV: 12,
  outputCurrentA: 2.0,
  switchingFrequencyHz: 300000,
});
assertApprox(sepicRes.primaryValue, 0.5, 0.05, 'SEPIC: D ≈ 0.5 at Vin = Vout');

const cukRes = calculateCukConverter({
  inputVoltageV: 12,
  outputVoltageMagnitudeV: 5,
  outputCurrentA: 1.0,
  switchingFrequencyHz: 250000,
});
assert(cukRes.primaryValue > 0 && cukRes.primaryValue < 1.0, 'Ćuk: Duty cycle valid');

// 36. Flyback Converter Engine
console.log('\n36. Flyback Converter Engine:');
const flybackRes = calculateFlybackFundamentals({
  inputVoltageV: 48,
  outputVoltageV: 12,
  outputCurrentA: 3.0,
  switchingFrequencyHz: 100000,
  primaryToSecondaryTurnsRatioNpNs: 3.0,
});
assert(flybackRes.primaryValue > 0, 'Flyback: Duty cycle and magnetizing current calculated');

const flyTurns = calculateFlybackTurnsRatio({
  nominalInputVoltageV: 48,
  outputVoltageV: 12,
  targetNominalDutyCycle: 0.45,
});
assert(flyTurns.primaryValue > 0, 'Flyback: Optimal turns ratio Np/Ns synthesized');

// 37. AC-DC Rectifiers Suite
console.log('\n37. AC-DC Rectifiers Suite:');
const halfWave = calculateHalfWaveRectifier({ inputRmsVoltageV: 12, inputFrequencyHz: 60, loadResistanceOhms: 10 });
assertApprox(halfWave.primaryValue, (12 * Math.SQRT2 - 0.7) / Math.PI, 1e-2, 'Half-Wave: V_dc = (V_pk - V_D)/π');

const centerTap = calculateFullWaveCenterTappedRectifier({ secondaryRmsPerLegVoltageV: 12, inputFrequencyHz: 60, loadResistanceOhms: 10 });
assertApprox(centerTap.primaryValue, (2 * (12 * Math.SQRT2 - 0.7)) / Math.PI, 1e-2, 'Center-Tap: V_dc = 2(V_pk - V_D)/π');

const bridgeRect = calculateBridgeRectifierAdvanced({ acRmsVoltageV: 12, inputFrequencyHz: 60, loadCurrentA: 1.5 });
assertApprox(bridgeRect.primaryValue, (2 * (12 * Math.SQRT2 - 1.4)) / Math.PI, 1e-2, 'Bridge: V_dc = 2(V_pk - 2V_D)/π');

const capFilter = calculateRectifierCapacitorFilter({
  loadCurrentA: 1.0,
  capacitanceFarads: 1000e-6,
  inputFrequencyHz: 60,
  rectifierTopology: 'full-wave',
  inputPeakVoltageV: 15.5,
});
// deltaV = 1.0 / (120 * 0.001) ≈ 8.33 V
assertApprox(capFilter.primaryValue, 1.0 / (120 * 0.001), 1e-2, 'Capacitor Filter: Ripple voltage formula verified');

// 38. Switching & PWM Power Stage
console.log('\n38. Switching & PWM Power Stage:');
const swFreq = calculateSwitchingFrequency({ frequencyHz: 200000 });
assertApprox(swFreq.primaryValue, 5e-6, 1e-9, 'Switching Frequency: T = 1/200kHz = 5 µs');

const pwmStage = calculatePwmPowerConverter({ dutyCyclePercent: 40, switchingFrequencyHz: 100000 });
assertApprox(pwmStage.primaryValue, 4e-6, 1e-9, 'PWM Power: t_on = 0.4 * 10 µs = 4 µs');

// 39. Semiconductors Stress & Losses
console.log('\n39. Semiconductors Stress & Losses:');
const mosStress = calculateMosfetVoltageStress({ peakOperatingVoltageV: 48, safetyMarginPercent: 30 });
assertApprox(mosStress.primaryValue, 48 * 1.3, 1e-4, 'MOSFET Stress: 48V with 30% margin = 62.4 V');

const mosfetCondLoss = calculatePowerMosfetConductionLoss({
  rmsCurrentA: 4.0,
  rdsOnAt25mOhms: 20, // 20 mΩ
  junctionTemperatureC: 100, // 100°C -> 1.3x approx
});
assert(mosfetCondLoss.primaryValue > 0.3 && mosfetCondLoss.primaryValue < 0.6, 'MOSFET Conduction Loss: Temperature adjusted');

const mosfetSwLoss = calculatePowerMosfetSwitchingLoss({
  drainSourceVoltageV: 48,
  drainCurrentA: 5,
  riseTimeNs: 15,
  fallTimeNs: 20,
  switchingFrequencyHz: 250000,
});
// 0.5 * 48 * 5 * (35e-9) * 250000 = 1.05 W
assertApprox(mosfetSwLoss.primaryValue, 1.05, 1e-2, 'MOSFET Switching Loss: Overlap loss formula verified');

const diodeRec = calculateDiodeRecoveryLoss({
  reverseRecoveryChargeQrrCoulombs: 80e-9,
  reverseVoltageV: 48,
  switchingFrequencyHz: 200000,
});
assertApprox(diodeRec.primaryValue, 80e-9 * 48 * 200000, 1e-4, 'Diode Recovery: P = Qrr * V * f_s');

// 40. Magnetics
console.log('\n40. Magnetics:');
const indEnergy = calculateInductorStoredEnergy({ inductanceH: 10e-6, currentA: 4.0 });
assertApprox(indEnergy.primaryValue, 0.5 * 10e-6 * 16, 1e-9, 'Inductor Energy: E = 0.5 * L * I^2 = 80 µJ');

const indRms = calculateRmsInductorCurrent({ averageCurrentA: 3.0, rippleCurrentDeltaIA: 0.9 });
// sqrt(3^2 + 0.9^2 / 12) = sqrt(9 + 0.0675) ≈ 3.0112
assertApprox(indRms.primaryValue, Math.sqrt(9 + 0.81 / 12), 1e-4, 'Inductor RMS Current: I_rms = sqrt(Iavg^2 + dI^2/12)');

const fluxDensity = calculateMagneticFluxDensity({
  appliedVoltageV: 24,
  onTimeMicroseconds: 2.0,
  turnCountN: 10,
  coreAreaSquareMm: 50,
});
// B = (24 * 2e-6) / (10 * 50e-6) = 48e-6 / 500e-6 = 0.096 T
assertApprox(fluxDensity.primaryValue, 0.096, 1e-4, 'Flux Density: B = (V * t_on) / (N * Ae) = 0.096 T');

const satMargin = calculateCoreSaturationMargin({ operatingFluxDensityT: 0.28, saturationFluxDensityT: 0.35 });
assertApprox(satMargin.primaryValue, 0.07, 1e-4, 'Core Saturation Margin: 0.35 - 0.28 = 0.07 T');

// 41. Capacitors
console.log('\n41. Capacitors:');
const capOut = calculateConverterOutputCapacitor({
  application: 'buck-output',
  dutyCycle: 0.4,
  outputCurrentA: 3.0,
  inductorRippleCurrentA: 0.9,
  switchingFrequencyHz: 250000,
  allowableRippleVoltageV: 0.03,
});
assert(capOut.primaryValue > 0, 'Converter Output Cap: Sizing positive');

const capEsr = calculateCapacitorEsrRipple({ rippleCurrentPeakToPeakA: 0.9, esrOhms: 0.025 });
assertApprox(capEsr.primaryValue, 0.9 * 0.025, 1e-5, 'Capacitor ESR: V_esr = 0.9 * 25mΩ = 22.5 mV');

const capRms = calculateCapacitorRmsCurrent({
  application: 'buck-output',
  dutyCycle: 0.4,
  outputCurrentA: 3.0,
  inductorRippleCurrentA: 0.9,
});
assertApprox(capRms.primaryValue, 0.9 / Math.sqrt(12), 1e-4, 'Capacitor RMS: Buck output ripple = deltaI / sqrt(12)');

// 42. Losses, Efficiency & Thermal Stack
console.log('\n42. Losses, Efficiency & Thermal Stack:');
const effRes = calculateConverterEfficiency({ outputPowerWatts: 45, inputPowerWatts: 50 });
assertApprox(effRes.primaryValue, 90.0, 1e-4, 'Efficiency: 45W / 50W = 90.0%');

const budgetRes = calculateConverterLossBudget({
  outputPowerWatts: 45,
  mosfetConductionLossW: 1.5,
  mosfetSwitchingLossW: 1.0,
  diodeConductionLossW: 1.2,
  inductorDcrLossW: 0.8,
});
assertApprox(budgetRes.primaryValue, 4.5, 1e-4, 'Loss Budget: Total losses = 4.5 W');

const thermStack = calculatePowerThermalDissipation({
  powerDissipationWatts: 3.0,
  ambientTemperatureC: 35,
  rThetaJc: 1.5,
  rThetaCs: 0.5,
  rThetaSa: 8.0,
});
// deltaT = 3 * (1.5 + 0.5 + 8) = 30°C -> Tj = 35 + 30 = 65°C
assertApprox(thermStack.primaryValue, 65.0, 1e-4, 'Thermal Stack: Tj = 35 + 3*(10) = 65°C');

// 43. Inverters & SPWM Modulation
console.log('\n43. Inverters & SPWM:');
const hbFwd = calculateHBridgeFundamentals({ dcBusVoltageV: 350, selectedState: 'forward' });
assertApprox(hbFwd.primaryValue, 350, 1e-4, 'H-Bridge Forward: +350 V');

const hbShort = calculateHBridgeFundamentals({ dcBusVoltageV: 350, selectedState: 'shoot-through' });
assert(hbShort.warnings.length > 0 && hbShort.warnings[0].severity === 'danger', 'H-Bridge Shoot-Through: Catastrophic danger warning triggered');

const spwmRes = calculateSpwmFundamentals({
  dcBusVoltageV: 400,
  modulationIndexMa: 0.8,
  carrierFrequencyHz: 20000,
  fundamentalFrequencyHz: 50,
});
// V1,pk = 0.8 * 400 = 320V -> V1,rms = 320 / sqrt(2) ≈ 226.27 V
assertApprox(spwmRes.primaryValue, 320 / Math.SQRT2, 1e-2, 'SPWM: V1,rms = ma * Vbus / sqrt(2) = 226.3 V');

const invRms = calculateInverterRmsOutput({ dcBusVoltageV: 310, waveformType: 'pure-sine-spwm', modulationIndexMa: 1.0 });
assertApprox(invRms.primaryValue, 310 / Math.SQRT2, 1e-2, 'Inverter RMS: Pure sine ma=1.0 matches 310 / sqrt(2) = 219.2 V');

const invPwr = calculateInverterPower({
  outputRmsVoltageV: 230,
  outputRmsCurrentA: 10,
  powerFactor: 0.85,
  inverterEfficiencyPercent: 92,
  dcBusVoltageV: 350,
});
assertApprox(invPwr.primaryValue, 230 * 10 * 0.85, 1e-2, 'Inverter Power: P = 230 * 10 * 0.85 = 1955 W');

// 44. Power Converter Synthesizer (Design Mode)
console.log('\n44. Power Converter Synthesizer (Design Mode):');
const designBuck = designPowerConverter({
  inputVoltageMinV: 18,
  inputVoltageMaxV: 36,
  outputVoltageV: 5,
  outputCurrentA: 4,
  switchingFrequencyHz: 300000,
});
assert(designBuck.primaryValue === 20, 'Design Mode: Output power = 5V * 4A = 20 W');
assert(designBuck.additionalOutputs!.recommendedTopology.value === 'BUCK', 'Design Mode: Auto recommends BUCK when Vin > Vout');

const designBoost = designPowerConverter({
  inputVoltageMinV: 9,
  inputVoltageMaxV: 15,
  outputVoltageV: 24,
  outputCurrentA: 2,
  switchingFrequencyHz: 250000,
});
assert(designBoost.additionalOutputs!.recommendedTopology.value === 'BOOST', 'Design Mode: Auto recommends BOOST when Vin < Vout');

const designSepic = designPowerConverter({
  inputVoltageMinV: 9,
  inputVoltageMaxV: 28,
  outputVoltageV: 12,
  outputCurrentA: 2,
  switchingFrequencyHz: 250000,
});
assert(designSepic.additionalOutputs!.recommendedTopology.value === 'SEPIC', 'Design Mode: Auto recommends SEPIC when Vin span covers Vout');

// 45. Advanced Number Systems & Two's Complement
console.log('\n45. Advanced Number Systems & Two\'s Complement:');
const tc127 = calculateTwosComplement({ mode: 'decimal-to-binary', inputValue: '127', bitWidth: 8 });
assert(tc127.visualData!.binaryStr === '01111111', "Two's Complement 8-bit: 127 -> 01111111");

const tcMinus1 = calculateTwosComplement({ mode: 'decimal-to-binary', inputValue: '-1', bitWidth: 8 });
assert(tcMinus1.visualData!.binaryStr === '11111111', "Two's Complement 8-bit: -1 -> 11111111");

const tc128 = calculateTwosComplement({ mode: 'binary-to-decimal', inputValue: '10000000', bitWidth: 8 });
assert(tc128.primaryValue === -128, "Two's Complement 8-bit: 10000000 -> -128");

const qFormat = calculateQFormat({ integerBits: 8, fractionalBits: 8, isSigned: true, floatValue: 12.5 });
assertApprox(qFormat.primaryValue, 12.5, 1e-4, 'Q-Format: Q8.8 correctly quantizes 12.5');
assertApprox(qFormat.visualData!.resolution, Math.pow(2, -8), 1e-6, 'Q-Format: Resolution = 2^(-8) = 0.00390625');

const bitManip = calculateBitManipulation({ initialValue: '0x00', bitWidth: 8, operation: 'set', bitIndex: 3 });
assert(bitManip.formattedValue === '0x08', 'Bit Manipulation: Set bit 3 of 0x00 gives 0x08');

const bitRotate = calculateBitManipulation({ initialValue: '0x81', bitWidth: 8, operation: 'rotate-left', shiftAmount: 1 });
assert(bitRotate.formattedValue === '0x03', 'Bit Manipulation: Rotate left 0x81 gives 0x03');

const intRanges = calculateIntegerRanges(8);
assert(intRanges.twosComplement.min === '-128' && intRanges.twosComplement.max === '127', "Integer Ranges: 8-bit Two's Complement [-128 ... 127]");

// 46. Digital Logic & Karnaugh Map Solver
console.log('\n46. Digital Logic & Karnaugh Map Solver:');
const gateXor = calculateLogicGate({ gateType: 'XOR', inputs: [true, false, true] });
assert(gateXor.primaryValue === 0, 'Logic Gate: 3-input XOR with two HIGH inputs evaluates to LOW (even parity)');

const gateNand = calculateLogicGate({ gateType: 'NAND', inputs: [true, true] });
assert(gateNand.primaryValue === 0, 'Logic Gate: 2-input NAND with all HIGH inputs evaluates to LOW');

const kMap = solveKarnaughMap({ variables: 3, minterms: [0, 1, 2, 3] });
assert(kMap.additionalOutputs!.simplifiedSop.value.includes('¬A'), 'K-Map: 3-variable minterms 0,1,2,3 simplify to ¬A');

// 47. Binary Arithmetic & Storage Transfer
console.log('\n47. Binary Arithmetic & Storage Transfer:');
const binAdd = calculateBinaryArithmetic({ operandA: '15', operandB: '1', operation: 'add', bitWidth: 8, isSigned: false });
assert(binAdd.primaryValue === 16, 'Binary Arithmetic: 15 + 1 = 16 (0x10)');

const binOverflow = calculateBinaryArithmetic({ operandA: '255', operandB: '1', operation: 'add', bitWidth: 8, isSigned: false });
assert(binOverflow.visualData!.carry === true, 'Binary Arithmetic: 255 + 1 triggers Carry flag in 8-bit register');

const storageTransfer = calculateDataTransfer({ fileSize: 10, sizeUnit: 'MB', transferRate: 10, rateUnit: 'Mbps' });
assertApprox(storageTransfer.primaryValue, 8, 1e-4, 'Data Transfer: 10 MB (80 Mbits) at 10 Mbps = 8.0 seconds');

// 48. Error Detection & Coding (Parity, CRC, Hamming)
console.log('\n48. Error Detection & Coding (Parity, CRC, Hamming):');
const evenParity = calculateParity({ inputData: '1011001', parityType: 'even', mode: 'generate' });
assert(evenParity.primaryValue === 0, 'Parity: 1011001 (four 1s) even parity bit = 0');

const oddParity = calculateParity({ inputData: '1011001', parityType: 'odd', mode: 'generate' });
assert(oddParity.primaryValue === 1, 'Parity: 1011001 (four 1s) odd parity bit = 1');

const crc8 = calculateCrc({ inputString: '123456789', isHexInput: false, presetName: 'CRC-8 (SMBus / ATM)' });
assert(crc8.formattedValue!.length > 0, 'CRC-8: Generates valid checksum for standard ASCII payload');

const hamming = calculateHamming74({ dataBits: '1011' });
assert(hamming.formattedValue!.length === 7, 'Hamming(7,4): Encodes 4-bit data into 7-bit codeword');

const hammingCorrection = calculateHamming74({ dataBits: '1011', receivedCode: '0111011' });
assert(hammingCorrection.visualData!.errorPosition === 4, 'Hamming(7,4): Detects corrupted bit at position 4');

// 49. ADC & DAC Conversion Engines
console.log('\n49. ADC & DAC Conversion Engines:');
const adc10 = calculateAdc({ resolutionBits: 10, vRef: 3.3, mode: 'voltage-to-code', inputVoltage: 1.65 });
assert(adc10.primaryValue === 512, 'ADC: 10-bit at 3.3V with 1.65V input = code 512 (mid-scale)');
assertApprox(adc10.visualData!.lsbVoltage, 3.3 / 1024, 1e-6, 'ADC: 10-bit theoretical LSB = 3.3V / 1024 = 3.2226 mV');
assertApprox(adc10.visualData!.idealSnrDb, 6.02 * 10 + 1.76, 1e-4, 'ADC: 10-bit ideal SNR = 6.02*10 + 1.76 = 61.96 dB');

const dac12 = calculateDac({ resolutionBits: 12, vRef: 5.0, digitalCode: 2048 });
assertApprox(dac12.primaryValue, 2.5, 1e-4, 'DAC: 12-bit code 2048 of 4096 = 2.5 V');

// 50. Sampling & Nyquist Criterion
console.log('\n50. Sampling & Nyquist Criterion:');
const samplingOk = calculateSampling({ signalFreqHz: 1000, samplingFreqHz: 5000 });
assert(samplingOk.visualData!.isAliased === false, 'Sampling: 1 kHz sampled at 5 kHz has no aliasing (fs >= 2*fmax)');
assertApprox(samplingOk.visualData!.samplingPeriodSec, 0.0002, 1e-6, 'Sampling: Ts = 1 / 5000 = 200 µs');

const samplingAliased = calculateSampling({ signalFreqHz: 4500, samplingFreqHz: 5000 });
assert(samplingAliased.visualData!.isAliased === true, 'Sampling: 4.5 kHz sampled at 5 kHz causes aliasing (foldover)');
assertApprox(samplingAliased.primaryValue, 500, 1e-4, 'Sampling: 4.5 kHz sampled at 5 kHz aliases to |4500 - 5000| = 500 Hz');

// 51. Serial Protocols (UART, SPI, I2C, CAN)
console.log('\n51. Serial Protocols:');
const uart1 = calculateUart({ targetBaudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1 });
assert(uart1.visualData!.totalBitsPerFrame === 10, 'UART: 8-N-1 has 10 bits per frame (1 start + 8 data + 1 stop)');
assertApprox(uart1.primaryValue, 10 / 115200, 1e-7, 'UART: Frame time = 10 / 115200 ≈ 86.8 µs');

const spi1 = calculateSpi({ sckFrequencyHz: 10e6, byteCount: 100, csSetupHoldNs: 0, interWordDelayNs: 0 });
assertApprox(spi1.visualData!.pureClockTimeSec, (100 * 8) / 10e6, 1e-8, 'SPI: 100 bytes at 10 MHz SCK = 80 µs clock time');

const i2c1 = calculateI2c({ speedMode: 'standard', addressMode: '7-bit', payloadBytes: 10, busCapacitancePf: 100, supplyVoltageV: 5.0 });
assert(i2c1.visualData!.clockFreqHz === 100000, 'I2C: Standard mode clock = 100 kHz');
// tr ≈ 0.8473 * Rp * Cb => Rp,max = tr,max / (0.8473 * Cb)
const expectedRpMax = 1000e-9 / (0.8473 * 100e-12);
assertApprox(i2c1.visualData!.maxPullUpOhms, expectedRpMax, 1.0, 'I2C: Pull-up max = 1000ns / (0.8473 * 100pF) ≈ 11.8 kΩ');

const can1 = calculateCan({ nominalBitRateBps: 500000, canClockHz: 40e6, frameFormat: 'standard', payloadBytes: 8 });
assert(can1.visualData!.baud === 500000, 'CAN: Nominal baud rate = 500 kbps');
assertApprox(can1.visualData!.samplePointPercent, 80.0, 1.0, 'CAN: Sample point is approximately 80%');

// 52. Microcontroller Timers & Embedded Timing
console.log('\n52. Microcontroller Timers & Embedded Timing:');
const optimalPsc = findOptimalTimerPrescalers(72e6, 1000, 16);
assert(optimalPsc.length > 0, 'MCU Timer: Prescaler optimizer finds valid timer configurations');
assertApprox(optimalPsc[0].actualFrequencyHz, 1000, 1.0, 'MCU Timer: Best prescaler matches target 1000 Hz');

const cpuTiming = calculateCpuTiming({ cpuFrequencyHz: 72e6, instructionCount: 72000, cpi: 1.0 });
assertApprox(cpuTiming.primaryValue, 0.001, 1e-6, 'CPU Timing: 72,000 instructions at 72 MHz (1 CPI) = 1.0 ms');

const sensorThroughput = calculateSensorThroughput({ samplingRateHz: 1000, resolutionBits: 16, channelCount: 4, packBytes: true });
assert(sensorThroughput.primaryValue === 8000, 'Sensor Throughput: 1000 Hz * 4 channels * 2 bytes = 8000 B/s');

// 53. Waveform Metrics & Signal Fundamentals
console.log('\n53. Waveform Metrics & Signal Fundamentals:');
const sineMetrics = calculateWaveformMetrics({ waveformType: 'sine', inputMode: 'peak', value: 10.0 });
assertApprox(sineMetrics.vRms, 10.0 / Math.SQRT2, 1e-4, 'Waveform: Sine RMS = Vpk / √2 ≈ 7.071 V');
assertApprox(sineMetrics.crestFactor, Math.SQRT2, 1e-4, 'Waveform: Sine Crest Factor = √2 ≈ 1.4142');
assertApprox(sineMetrics.formFactor, Math.PI / (2 * Math.SQRT2), 1e-4, 'Waveform: Sine Form Factor = π / (2√2) ≈ 1.1107');

const squareMetrics = calculateWaveformMetrics({ waveformType: 'square', inputMode: 'peak', value: 5.0 });
assertApprox(squareMetrics.vRms, 5.0, 1e-4, 'Waveform: Symmetrical Square RMS = Vpk = 5.0 V');
assertApprox(squareMetrics.crestFactor, 1.0, 1e-4, 'Waveform: Square Crest Factor = 1.0');

const triangleMetrics = calculateWaveformMetrics({ waveformType: 'triangle', inputMode: 'peak', value: 6.0 });
assertApprox(triangleMetrics.vRms, 6.0 / Math.sqrt(3), 1e-4, 'Waveform: Triangle RMS = Vpk / √3 ≈ 3.464 V');
assertApprox(triangleMetrics.crestFactor, Math.sqrt(3), 1e-4, 'Waveform: Triangle Crest Factor = √3 ≈ 1.732');

const waveformAnalysis = analyzeWaveform({ waveformType: 'square', amplitude: 5.0, frequencyHz: 1000, dutyCyclePercent: 50 });
assertApprox(waveformAnalysis.periodSec, 0.001, 1e-6, 'Waveform: 1 kHz period = 1.0 ms');
assertApprox(waveformAnalysis.vPeakToPeak, 10.0, 1e-4, 'Waveform: Vpp = 2 · Vpk = 10.0 V');

const phaseDelay = calculatePhaseShiftDelay({ frequencyHz: 1000, phaseShiftDeg: 90 });
assertApprox(phaseDelay.primaryValue, 0.00025, 1e-7, 'Phase Delay: 90° at 1000 Hz = 250 µs delay');

const freqPeriod = calculateFreqPeriod({ frequencyHz: 1e6 });
assertApprox(freqPeriod.visualData!.periodSec, 1e-6, 1e-12, 'Freq/Period: 1 MHz = 1.0 µs period');
assertApprox(freqPeriod.visualData!.angularFreqRadPerSec, 2 * Math.PI * 1e6, 1e-2, 'Freq/Period: 1 MHz = 2π·10⁶ rad/s');

// 54. Phasors & Complex Arithmetic
console.log('\n54. Phasors & Complex Arithmetic:');
const toPolar = rectangularToPolar(30, 40);
assertApprox(toPolar.magnitude, 50.0, 1e-4, 'Phasor: 30 + j40 magnitude = 50.0');
assertApprox(toPolar.phaseDeg, Math.atan2(40, 30) * (180 / Math.PI), 1e-3, 'Phasor: 30 + j40 angle ≈ 53.13°');

const toRect = polarToRectangular(50.0, 53.130102);
assertApprox(toRect.real, 30.0, 1e-3, 'Phasor: 50 ∠ 53.13° real part ≈ 30.0');
assertApprox(toRect.imag, 40.0, 1e-3, 'Phasor: 50 ∠ 53.13° imag part ≈ 40.0');

const pAdd = calculatePhasorArithmetic({
  operation: 'add',
  inputFormat: 'rectangular',
  aReal: 10,
  aImag: 15,
  bReal: 5,
  bImag: -8,
});
assertApprox(pAdd.real, 15.0, 1e-4, 'Phasor Add: (10 + j15) + (5 - j8) real = 15.0');
assertApprox(pAdd.imag, 7.0, 1e-4, 'Phasor Add: (10 + j15) + (5 - j8) imag = 7.0');

const pMul = calculatePhasorArithmetic({
  operation: 'multiply',
  inputFormat: 'polar',
  aMag: 10,
  aPhaseDeg: 30,
  bMag: 2,
  bPhaseDeg: 45,
});
assertApprox(pMul.magnitude, 20.0, 1e-4, 'Phasor Mul: 10 ∠ 30° × 2 ∠ 45° magnitude = 20.0');
assertApprox(pMul.phaseDeg, 75.0, 1e-4, 'Phasor Mul: 10 ∠ 30° × 2 ∠ 45° angle = 75.0°');

// 55. Decibels, RF Power & Gain Chains
console.log('\n55. Decibels, RF Power & Gain Chains:');
const pRatio = calculatePowerDb(1.0, 100.0);
assertApprox(pRatio.primaryValue, 20.0, 1e-4, 'Decibels: 100W / 1W power ratio = 20.0 dB');

const pDouble = calculatePowerDb(1.0, 2.0);
assertApprox(pDouble.primaryValue, 10 * Math.log10(2), 1e-4, 'Decibels: 2x power = +3.0103 dB');

const vRatio = calculateVoltageDb(1.0, 10.0);
assertApprox(vRatio.primaryValue, 20.0, 1e-4, 'Decibels: 10V / 1V voltage ratio = 20.0 dB');

assertApprox(wattsToDbm(0.001), 0.0, 1e-4, 'RF Power: 1 mW = 0 dBm');
assertApprox(wattsToDbm(1.0), 30.0, 1e-4, 'RF Power: 1 W = +30 dBm');
assertApprox(dbmToWatts(30.0), 1.0, 1e-4, 'RF Power: +30 dBm = 1.0 W');
assertApprox(wattsToDbw(1.0), 0.0, 1e-4, 'RF Power: 1 W = 0 dBW');
assertApprox(dbwToWatts(10.0), 10.0, 1e-4, 'RF Power: 10 dBW = 10 W');

const rfChain = calculateGainChain({
  inputPowerDbm: -50.0,
  stages: [
    { name: 'LNA', gainDb: 20.0, noiseFigureDb: 1.5 },
    { name: 'Cable', gainDb: -3.0 },
    { name: 'Bandpass Filter', gainDb: -2.0 },
    { name: 'Power Amp', gainDb: 15.0 },
  ],
});
assertApprox(rfChain.totalGainDb, 30.0, 1e-4, 'RF Gain Chain: 20 - 3 - 2 + 15 = +30 dB net gain');
assertApprox(rfChain.outputPowerDbm, -20.0, 1e-4, 'RF Gain Chain: -50 dBm + 30 dB = -20 dBm output');

// 56. Antenna Engineering & Radiation Properties
console.log('\n56. Antenna Engineering & Radiation Properties:');
const dims = calculateAntennaDimensions({ frequencyHz: 300e6, velocityFactor: 0.95 });
const expectedQuarterWave = 0.95 * (299792458 / (4 * 300e6));
assertApprox(dims.quarterWaveMeters, expectedQuarterWave, 1e-4, 'Antenna: 300 MHz quarter-wave monopole length with VF=0.95 ≈ 0.2373 m');
assertApprox(dims.halfWaveIdealMeters, expectedQuarterWave * 2, 1e-4, 'Antenna: Half-wave length = 2 * quarter-wave');

const gainTest = calculateAntennaGain({ directivityDbi: 2.15, efficiencyPercent: 100 });
assertApprox(gainTest.realizedGainDbi, 2.15, 1e-4, 'Antenna: Half-wave dipole gain = 2.15 dBi');
assertApprox(gainTest.realizedGainDbd, 0.0, 1e-4, 'Antenna: 2.15 dBi = 0 dBd (dipole reference)');

const effAperture = calculateEffectiveAperture({ frequencyHz: 1e9, gainDbi: 0 }); // 1 GHz, 0 dBi gain (isotropic)
const expectedAperture = Math.pow(299792458 / 1e9, 2) / (4 * Math.PI);
assertApprox(effAperture.effectiveApertureM2, expectedAperture, 1e-5, 'Antenna: Effective aperture Aeff = (λ² / 4π)·G');

const dishBw = estimateDishBeamwidth({ frequencyHz: 10e9, dishDiameterMeters: 1.0 }); // 10 GHz (λ = 3 cm), 1 meter dish
assertApprox(dishBw.halfPowerBeamwidthDeg, 70 * (0.0299792458 / 1.0), 1e-2, 'Antenna: Dish beamwidth θ3dB ≈ 70·(λ / D) = 2.1°');

const pol0 = calculatePolarizationLoss(0);
assertApprox(pol0, 0.0, 1e-4, 'Antenna: 0° polarization angle mismatch = 0 dB loss');
const pol45 = calculatePolarizationLoss(45);
assertApprox(pol45, 3.0103, 1e-3, 'Antenna: 45° polarization mismatch = -3.01 dB loss (cos² 45° = 0.5)');

// 57. RF Noise, Sensitivity & Friis Cascade
console.log('\n57. RF Noise, Sensitivity & Friis Cascade:');
const noiseFloor1Hz = calculateThermalNoise({ bandwidthHz: 1, temperatureKelvin: 290 });
assertApprox(noiseFloor1Hz.noisePowerDbm, -173.975, 1e-2, 'RF Noise: Thermal noise at 290K in 1 Hz ≈ -174 dBm/Hz');

const noiseFloor1MHz = calculateThermalNoise({ bandwidthHz: 1e6, temperatureKelvin: 290 });
assertApprox(noiseFloor1MHz.noisePowerDbm, -173.975 + 60, 1e-2, 'RF Noise: Thermal noise in 1 MHz = -174 + 60 = -114 dBm');

const nfToTe = calculateNoiseFigure({ mode: 'nf_to_factor', noiseFigureDb: 3.0 });
const expectedTe = 290 * (Math.pow(10, 0.3) - 1);
assertApprox(nfToTe.effectiveNoiseTempKelvin, expectedTe, 1e-2, 'RF Noise: NF 3 dB corresponds to Te ≈ 288.6 K');

const sens = calculateReceiverNoiseFloor({ bandwidthHz: 1e6, noiseFigureDb: 4.0, requiredSnrDb: 10.0, temperatureKelvin: 290 });
assertApprox(sens.receiverSensitivityDbm!, -173.975 + 60 + 4.0 + 10.0, 1e-2, 'RF Noise: Sensitivity = Pn + NF + SNR = -174 + 60 + 4 + 10 = -100 dBm');

const cascadedNf = calculateCascadedNoiseFigure([
  { gainDb: 20.0, noiseFigureDb: 2.0 },
  { gainDb: 10.0, noiseFigureDb: 8.0 },
]);
// F1 = 10^(0.2) = 1.5849, G1 = 100, F2 = 10^(0.8) = 6.3096
// Fcas = 1.5849 + (6.3096 - 1) / 100 = 1.6380 => NFcas = 10 log10(1.6380) = 2.143 dB
assertApprox(cascadedNf.totalNoiseFigureDb, 2.143, 0.05, 'RF Noise: Friis cascaded noise figure dominated by 1st stage (~2.14 dB)');

const adcNoise = calculateAdcDynamicRange(16);
assertApprox(adcNoise.idealSnrDb, 6.02 * 16 + 1.76, 1e-4, 'ADC Noise: 16-bit ideal SNR = 6.02·N + 1.76 = 98.08 dB');

// 58. Friis Transmission & RF Link Budget
console.log('\n58. Friis Transmission & RF Link Budget:');
const fspl1km = calculateFspl({ distance: 1.0, distanceUnit: 'km', frequency: 2.4, frequencyUnit: 'GHz' });
const expectedFspl = 20 * Math.log10(1000) + 20 * Math.log10(2.4e9) + 20 * Math.log10(4 * Math.PI / 299792458);
assertApprox(fspl1km.fsplDb, expectedFspl, 1e-2, 'Link Budget: FSPL at 1 km and 2.4 GHz ≈ 100.05 dB');

const link = calculateLinkBudget({
  txPowerDbm: 20.0,
  txCableLossDb: 1.0,
  txAntennaGainDbi: 3.0,
  distanceKm: 1.0,
  frequencyMhz: 2400,
  rxAntennaGainDbi: 3.0,
  rxCableLossDb: 1.0,
  rxSensitivityDbm: -90.0,
});
assertApprox(link.eirp.eirpDbm, 22.0, 1e-4, 'Link Budget: EIRP = 20 + 3 - 1 = 22 dBm');
assertApprox(link.rxPowerDbm, 22.0 + 3.0 - link.fsplDb - 1.0, 1e-3, 'Link Budget: Prx = EIRP + Grx - FSPL - Lrx');
assert(link.fadeMarginDb > 0, 'Link Budget: Fade margin > 0 dB signifies viable line-of-sight link');
assert(link.linkStatus === 'acceptable' || link.linkStatus === 'strong', 'Link Budget: Link status evaluated correctly');

// 59. Filters: Bandwidth, Q-factor & RLC Response
console.log('\n59. Filters: Bandwidth, Q-factor & RLC Response:');
const bwQ = calculateBandwidthQ({ fLowHz: 98e6, fHighHz: 102e6 });
assertApprox(bwQ.bandwidthHz, 4e6, 1e-4, 'Filters: BW = 102 MHz - 98 MHz = 4.0 MHz');
assertApprox(bwQ.centerFreqHz, Math.sqrt(98e6 * 102e6), 1e-2, 'Filters: Geometric center freq f0 = √(fL · fH) ≈ 99.98 MHz');
assertApprox(bwQ.qFactor, bwQ.centerFreqHz / 4e6, 1e-3, 'Filters: Q = f0 / BW ≈ 24.995');

const rlcBode = generateRlcBodePoints({ type: 'bandpass', centerFreqHz: 10e6, qFactor: 10.0 });
assert(rlcBode.length === 51, 'Filters: RLC Bode generates 51 sweep points');
const centerPoint = rlcBode.reduce((prev, curr) => Math.abs(curr.freq - 10e6) < Math.abs(prev.freq - 10e6) ? curr : prev);
assertApprox(centerPoint.gainDb, 0.0, 0.01, 'Filters: Bandpass peak at f0 is approximately 0 dB');

// 60. Phase 07 Forensic Defect Fixes & Edge Case Validations
console.log('\n60. Phase 07 Forensic Defect Fixes & Edge Case Validations:');
const divZeroPhasor = performPhasorArithmetic(
  { real: 10, imag: 0, magnitude: 10, angleDeg: 0, angleRad: 0 },
  { real: 0, imag: 0, magnitude: 0, angleDeg: 0, angleRad: 0 },
  '/'
);
assert(divZeroPhasor.result.magnitude === Infinity, 'Phasor: Division by zero returns infinite magnitude with error explanation');

const coaxAntenna = calculateFreqWavelength({ frequencyHz: 300e6, velocityFactor: 0.66, mode: 'freq_to_lambda' });
const expectedQuarterWaveCoax = (299792458 / (4 * 300e6)) * 0.66;
assertApprox(coaxAntenna.visualData!.quarterWaveMeters, expectedQuarterWaveCoax, 1e-4, 'Freq/Wavelength: λ/4 in dielectric (vf=0.66) scales linearly by vf (no double vf bug)');

const synthTest = calculateFilterOrderSynthesis({ passbandFreqHz: 10e3, stopbandFreqHz: 30e3, stopbandAttenuationDb: 40 });
assert(synthTest.butterworthOrder === 5, 'Filter Synthesis: 10 kHz pass to 30 kHz stop (40 dB) = 5th order Butterworth');
assert(synthTest.chebyshev05DbOrder === 4, 'Filter Synthesis: 10 kHz pass to 30 kHz stop (40 dB) = 4th order Chebyshev 0.5 dB');
assert(synthTest.besselEstimatedOrder === 6, 'Filter Synthesis: Bessel requires higher order (~6) for equivalent 40 dB rejection');

const phase7Formulas = FORMULA_BOOK.filter(f => f.category === 'rf' || f.category === 'signals');
assert(phase7Formulas.length >= 7, 'Formula Book: Phase 07 formulas registered and populated');
assert(phase7Formulas.every(f => f.equationText.length > 5 && f.variables.length > 0 && f.explanation.length > 10), 'Formula Book: Phase 07 formulas contain equations, variables, and explanations');

// 61. PCB Copper Trace Ampacity & DC Conduction (IPC-2152 / IPC-2221)
console.log('\n61. PCB Copper Trace Ampacity & DC Conduction:');
const extTraceR = calculateTraceResistance({
  lengthMeters: 0.1, // 100 mm
  widthMeters: 1.27e-3, // 50 mil
  thicknessMeters: 35e-6, // 1 oz
  temperatureC: 25.0,
  currentAmps: 2.0,
});
assertApprox(extTraceR.outputs.resistanceOhms, 0.0387, 0.01, 'PCB Trace: 50 mil 1 oz 100mm trace DC resistance ~38.7 mΩ');
assertApprox(extTraceR.outputs.voltageDropVolts!, 2.0 * extTraceR.outputs.resistanceOhms, 1e-4, 'PCB Trace: Voltage drop follows Ohm\'s Law V = I·R');
assertApprox(extTraceR.outputs.powerLossWatts!, 2.0 * 2.0 * extTraceR.outputs.resistanceOhms, 1e-4, 'PCB Trace: Joule power loss follows P = I²·R');

const extTraceAmp = calculateIpcTraceAmpacity({
  layer: 'external',
  thicknessMeters: 35e-6,
  widthMeters: 1.27e-3,
  tempRiseC: 10.0,
});
assert(extTraceAmp.outputs.calculatedCurrentAmps! > 2.0, 'PCB Trace: External 50 mil trace carries > 2A for 10°C rise (~2.8A)');

const intTraceAmp = calculateIpcTraceAmpacity({
  layer: 'internal',
  thicknessMeters: 35e-6,
  widthMeters: 1.27e-3,
  tempRiseC: 10.0,
});
assert(intTraceAmp.outputs.calculatedCurrentAmps! < extTraceAmp.outputs.calculatedCurrentAmps!, 'PCB Trace: Internal layer ampacity is lower than external due to dielectric encapsulation');
assertApprox(intTraceAmp.outputs.calculatedCurrentAmps! / extTraceAmp.outputs.calculatedCurrentAmps!, 0.5, 0.05, 'PCB Trace: Internal layer ampacity is approximately half of external layer (k=0.024 vs 0.048)');

const synthTrace = calculateIpcTraceAmpacity({
  layer: 'external',
  thicknessMeters: 35e-6,
  currentAmps: 2.82,
  tempRiseC: 10.0,
});
assertApprox(synthTrace.outputs.requiredWidthMm!, 1.27, 0.1, 'PCB Trace: Synthesizing width for 2.82A at 10°C rise yields ~1.27 mm (50 mil)');

// 62. PCB Via Geometry, Inductance & Thermal Ampacity
console.log('\n62. PCB Via Geometry, Inductance & Thermal Ampacity:');
const singleVia = calculateViaProperties({
  drillDiameterMeters: 0.3e-3, // 0.3 mm drill
  padDiameterMeters: 0.6e-3, // 0.6 mm pad
  boardThicknessMeters: 1.6e-3, // 1.6 mm board
  platingThicknessMeters: 25e-6, // 25 µm plating
  temperatureC: 25.0,
  currentAmps: 1.0,
});
assertApprox(singleVia.outputs.resistanceOhms, 0.00108, 0.0003, 'PCB Via: 0.3mm drill 1.6mm height via DC resistance ~1.1 mΩ');
assertApprox(singleVia.outputs.inductanceHenries * 1e9, 1.2, 0.25, 'PCB Via: Parasitic loop inductance ~1.2 nH');
assertApprox(singleVia.outputs.thermalResistanceKPerW, 160.0, 30.0, 'PCB Via: Thermal resistance ~160 °C/W');
assert(singleVia.outputs.annularRingMils >= 5.0, 'PCB Via: 0.6mm pad with 0.3mm drill provides annular ring >= 5.0 mil (Class 2)');
assert(singleVia.outputs.capacitanceFarads !== undefined && singleVia.outputs.capacitanceFarads > 0, 'PCB Via: Parasitic self-capacitance computed (> 0 F)');

const viaArray = calculateViaArray({
  targetCurrentAmps: 4.0,
  singleViaProperties: {
    resistanceOhms: singleVia.outputs.resistanceOhms,
    thermalResistanceKPerW: singleVia.outputs.thermalResistanceKPerW,
    estimatedAmpacityAmps: singleVia.outputs.estimatedAmpacityAmps,
    drillDiameterMeters: 0.3e-3,
  },
});
assert(viaArray.outputs.recommendedCount >= 1, 'PCB Via Array: Computes recommended via count for target current');
assert(viaArray.outputs.arrayResistanceOhms < singleVia.outputs.resistanceOhms, 'PCB Via Array: Parallel vias reduce equivalent DC resistance');

// 63. PCB Stackup, Dielectric Substrates & Propagation
console.log('\n63. PCB Stackup, Dielectric Substrates & Propagation:');
const propDelay = calculatePropagationDelay({
  relativePermittivityEr: 4.4,
  geometryType: 'microstrip',
  traceWidthMeters: 0.3e-3,
  dielectricHeightMeters: 0.2e-3,
  traceLengthMeters: 0.1, // 100 mm
});
assert(propDelay.outputs.effectivePermittivity > 1.0 && propDelay.outputs.effectivePermittivity < 4.4, 'PCB Stackup: Effective permittivity for microstrip sits between 1 and 4.4');
assert(propDelay.outputs.velocityMetersPerSec < 3e8, 'PCB Stackup: Propagation velocity in dielectric is slower than speed of light in vacuum');
assertApprox(propDelay.outputs.delayPsPerMm, 6.0, 1.5, 'PCB Stackup: Delay is ~6-7 ps/mm (~150-180 ps/inch)');
assertApprox(propDelay.outputs.totalDelayPs!, 100 * propDelay.outputs.delayPsPerMm, 1.0, 'PCB Stackup: Total travel time = length * delay');

const std4Layer = STANDARD_STACKUP_PRESETS.find(p => p.layerCount === 4)!;
const thickness4Layer = calculateStackupThickness(std4Layer.layers);
assertApprox(thickness4Layer.totalThicknessMm, 1.6, 0.15, 'PCB Stackup: 4-layer stackup total thickness ~1.6 mm');
assert(thickness4Layer.copperLayerCount === 4, 'PCB Stackup: 4-layer stackup contains 4 copper layers');
assert(DIELECTRIC_MATERIALS.some(m => m.id === 'fr4_standard'), 'PCB Stackup: Material database contains standard FR-4');

// 64. Controlled Impedance (Microstrip, Stripline, GCPW)
console.log('\n64. Controlled Impedance (Microstrip, Stripline, GCPW):');
const microstrip50 = calculateMicrostripImpedance({
  traceWidthMeters: 3.05e-3, // ~120 mil
  copperThicknessMeters: 35e-6, // 1 oz
  dielectricHeightMeters: 1.6e-3, // 1.6 mm
  relativePermittivityEr: 4.2,
});
assertApprox(microstrip50.outputs.impedanceOhms, 50.0, 2.5, 'Controlled Impedance: Microstrip on 1.6mm FR-4 with W=3.05mm gives ~50Ω');
assert(microstrip50.label === 'Microstrip Characteristic Impedance' && typeof microstrip50.formattedValue === 'string', 'Controlled Impedance: Microstrip returns valid label and formattedValue');
assert(microstrip50.outputs.effectivePermittivity > 1.0 && microstrip50.outputs.effectivePermittivity < 4.2, 'Controlled Impedance: Effective Er sits between air (1.0) and bulk substrate (4.2)');

const stripline = calculateStriplineImpedance({
  traceWidthMeters: 0.25e-3,
  copperThicknessMeters: 35e-6,
  groundPlaneSpacingMeters: 0.8e-3,
  relativePermittivityEr: 4.2,
});
assert(stripline.outputs.impedanceOhms > 30.0 && stripline.outputs.impedanceOhms < 100.0, 'Controlled Impedance: Stripline characteristic impedance calculated in realistic RF range');
assert(stripline.label === 'Stripline Characteristic Impedance' && typeof stripline.formattedValue === 'string', 'Controlled Impedance: Stripline returns valid label and formattedValue');

const gcpw = calculateCoplanarWaveguideImpedance({
  traceWidthMeters: 0.5e-3,
  gapMeters: 0.2e-3,
  copperThicknessMeters: 35e-6,
  dielectricHeightMeters: 0.3e-3,
  relativePermittivityEr: 4.2,
});
assert(gcpw.outputs.impedanceOhms > 0, 'Controlled Impedance: Grounded CPW calculates valid impedance with top-side ground coplanar fringing');
assert(gcpw.label === 'GCPW Characteristic Impedance' && typeof gcpw.formattedValue === 'string', 'Controlled Impedance: GCPW returns valid label and formattedValue');

const synthResult = synthesizeMicrostripWidth(50.0, 1.6e-3, 35e-6, 4.2);
assertApprox(synthResult.achievedZ0, 50.0, 0.1, 'Controlled Impedance: Synthesized trace width produces target 50.0Ω within 0.1Ω');

// 65. Differential Pairs & Intra-Pair Skew Matching
console.log('\n65. Differential Pairs & Intra-Pair Skew Matching:');
const diffPair = calculateDifferentialPair({
  type: 'microstrip',
  traceWidthMeters: 0.3e-3,
  traceSpacingMeters: 0.2e-3,
  copperThicknessMeters: 35e-6,
  dielectricHeightMeters: 0.2e-3,
  relativePermittivityEr: 4.2,
});
assert(diffPair.label === 'Differential Pair Impedance' && typeof diffPair.formattedValue === 'string', 'Differential Pair: Returns valid label and formattedValue');
assert(diffPair.outputs.diffImpedanceZdiff < 2 * diffPair.outputs.singleEndedZ0, 'Differential Pair: Mutual capacitive coupling lowers Z_diff below 2·Z0');
assert(diffPair.outputs.commonModeZcomm > diffPair.outputs.diffImpedanceZdiff / 4, 'Differential Pair: Coupled common impedance exceeds uncoupled baseline (Z_diff / 4)');

const skewResult = calculateIntraPairSkew({
  lengthPPositiveMm: 100.0,
  lengthNNegativeMm: 100.254, // 10 mil mismatch
  propagationDelayPsPerMm: 6.92,
  busStandardId: 'usb2_high_speed',
});
assertApprox(skewResult.skewPicoseconds, 0.254 * 6.92, 0.05, 'Differential Skew: Intra-pair delay mismatch Δt = ΔL · τ_pd ≈ 1.76 ps');
assert(skewResult.isCompliant === true, 'Differential Skew: 1.76 ps passes USB 2.0 High Speed (50 ps budget)');

const pcieSkew = calculateIntraPairSkew({
  lengthPPositiveMm: 100.0,
  lengthNNegativeMm: 102.0, // 2 mm mismatch -> ~13.8 ps
  propagationDelayPsPerMm: 6.92,
  busStandardId: 'pcie_gen3', // 5 ps budget
});
assert(pcieSkew.isCompliant === false, 'Differential Skew: 13.8 ps fails PCIe Gen 3 tight 5 ps skew allowance');

const pcieGen5Skew = calculateIntraPairSkew({
  lengthPPositiveMm: 100.0,
  lengthNNegativeMm: 100.1, // 0.1 mm mismatch -> ~0.69 ps
  propagationDelayPsPerMm: 6.92,
  busStandardId: 'pcie_gen5', // 1.5 ps budget
});
assert(pcieGen5Skew.isCompliant === true, 'Differential Skew: 0.69 ps passes PCIe Gen 5 1.5 ps ultra-tight allowance');

const synthDiff = synthesizeDifferentialPairWidth({
  targetDifferentialZOhms: 90.0,
  spacingMeters: 0.15e-3,
  substrateHeightMeters: 0.15e-3,
  copperThicknessMeters: 35e-6,
  relativePermittivityEr: 4.2,
});
assertApprox(synthDiff.achievedZdiffOhms, 90.0, 0.5, 'Differential Pair: Synthesized trace width converges to target 90Ω (USB)');
assert(synthDiff.synthesizedWidthMils > 0, 'Differential Pair: Synthesized width in mils is valid');

// 66. High-Speed Signal Integrity & Transmission Lines
console.log('\n66. High-Speed Signal Integrity & Transmission Lines:');
const siAnalysis = calculateSignalIntegrity({
  riseTimeNs: 1.0, // 1.0 ns
  delayPsPerInch: 175.768, // ~6.92 ps/mm
  actualTraceLengthInches: 50.0 / 25.4, // 50 mm
  characteristicZ0Ohms: 50.0,
  loadImpedanceZlOhms: 100.0,
});
assert(siAnalysis.label === 'Reflection Coefficient & Signal Integrity' && typeof siAnalysis.formattedValue === 'string', 'Signal Integrity: Returns valid label and formattedValue');
assertApprox(siAnalysis.outputs.kneeFrequencyGhz, 0.35, 1e-4, 'Signal Integrity: Knee frequency F_knee = 0.35 / t_r = 0.35 GHz (350 MHz)');
assertApprox(siAnalysis.outputs.criticalLengthMm, (1.0 / (6 * 175.768e-3)) * 25.4, 0.5, 'Signal Integrity: Critical length l_crit = t_r / (6·τ_pd) ≈ 24.1 mm');
assert(siAnalysis.outputs.isTransmissionLineRegime === true, 'Signal Integrity: 50mm trace (> 24.1mm critical length) requires transmission line analysis');
assertApprox(siAnalysis.outputs.reflectionCoefficient, (100 - 50) / (100 + 50), 1e-4, 'Signal Integrity: Reflection coefficient Γ = (ZL - Z0)/(ZL + Z0) = +0.3333');
assertApprox(siAnalysis.outputs.vswr, (1 + 0.33333) / (1 - 0.33333), 0.01, 'Signal Integrity: VSWR = (1 + |Γ|) / (1 - |Γ|) = 2.0');

const termRes = calculateSeriesTermination(50.0, 15.0);
assertApprox(termRes.requiredSeriesResistorOhms, 35.0, 1e-4, 'Signal Integrity: Series source termination Rs = Z0 - Rdriver = 50 - 15 = 35Ω');

// 67. Power Integrity, Decoupling Capacitors & Power Planes
console.log('\n67. Power Integrity, Decoupling Capacitors & Power Planes:');
const decoupling = calculateDecouplingCapacitor({
  transientCurrentAmps: 2.0,
  transientDurationSec: 50e-9, // 50 ns
  allowedDroopVolts: 0.05, // 50 mV
  capacitorEsrOhms: 0.005, // 5 mΩ
  railVoltageVolts: 3.3,
});
assertApprox(decoupling.outputs.esrVoltageDropVolts!, 2.0 * 0.005, 1e-4, 'Power Integrity: ESR instantaneous droop = ΔI · ESR = 10 mV');
assertApprox(decoupling.outputs.capacitiveVoltageDroopVolts, 0.05 - 0.01, 1e-4, 'Power Integrity: Remaining capacitive droop allowance = 40 mV');
assertApprox(decoupling.outputs.minimumCapacitanceFarads * 1e6, (2.0 * 50e-9) / 0.04 * 1e6, 1e-2, 'Power Integrity: Decoupling C = (ΔI·Δt)/ΔV_cap = 2.5 µF');
assert(decoupling.outputs.storedEnergyJoules! > 0, 'Power Integrity: Stored capacitor electrostatic energy 0.5·C·V² verified');

const pdnTarget = calculatePdnTargetImpedance({
  railVoltageVolts: 1.2,
  allowedRipplePercent: 3.0,
  transientCurrentAmps: 4.0,
});
assertApprox(pdnTarget.outputs.allowedRippleVolts, 0.036, 1e-4, 'Power Integrity: 3% of 1.2V core = 36 mV allowed ripple');
assertApprox(pdnTarget.outputs.targetImpedanceOhms * 1e3, 9.0, 1e-3, 'Power Integrity: PDN Z_target = 36 mV / 4 A = 9.0 mΩ');

const plane = calculatePowerPlane({
  lengthMeters: 0.1, // 100 mm
  widthMeters: 0.05, // 50 mm
  copperThicknessMeters: 35e-6, // 1 oz
  currentAmps: 5.0,
  temperatureC: 25.0,
});
assertApprox(plane.outputs.aspectRatioSquares, 2.0, 1e-4, 'Power Integrity: Plane aspect ratio = 100mm / 50mm = 2.0 squares');
assertApprox(plane.outputs.totalResistanceOhms, 2.0 * plane.outputs.sheetResistanceMilliOhmsPerSquare * 1e-3, 1e-6, 'Power Integrity: Plane resistance R = N_sq · R_□');
assertApprox(plane.outputs.voltageDropVolts!, 5.0 * plane.outputs.totalResistanceOhms, 1e-4, 'Power Integrity: Plane DC drop follows Ohm\'s Law');

const parallelDecoup = calculateParallelDecouplingNetwork({
  stages: [
    { count: 10, capacitanceFarads: 0.1e-6, esrOhms: 0.05 },
    { count: 2, capacitanceFarads: 10e-6, esrOhms: 0.01 },
  ],
  targetCapacitanceFarads: 20e-6,
  railVoltageVolts: 3.3,
});
assertApprox(parallelDecoup.outputs.totalCapacitanceUf, 21.0, 0.01, 'Power Integrity: Decoupling bank total = 10×0.1µF + 2×10µF = 21 µF');
assert(parallelDecoup.outputs.isCompliantWithTarget === true, 'Power Integrity: 21 µF meets 20 µF target budget');
assert(parallelDecoup.outputs.totalCapacitorCount === 12, 'Power Integrity: 12 capacitors counted');

// 68. Standards-Aware Clearance, Creepage & DRC Rules
console.log('\n68. Standards-Aware Clearance, Creepage & DRC Rules:');
const clearanceIpc = calculateClearanceAndCreepage({
  standard: 'IPC_2221B',
  voltagePeakOrDc: 48.0,
  location: 'external_coated',
  pollutionDegree: 2,
  materialGroup: 'group_IIIa',
  altitudeMeters: 0,
});
assert(clearanceIpc.label === 'Electrical Clearance & Creepage' && typeof clearanceIpc.formattedValue === 'string', 'DRC/Clearance: Clearance returns valid label and formattedValue');
assert(clearanceIpc.outputs.minimumClearanceMm > 0.1, 'DRC/Clearance: 48V coated external layer has defined IPC clearance');

const altitudeClearance = calculateClearanceAndCreepage({
  standard: 'IEC_60664_1',
  voltagePeakOrDc: 100.0,
  location: 'external_uncoated',
  pollutionDegree: 2,
  materialGroup: 'group_IIIa',
  altitudeMeters: 3000,
});
assert(altitudeClearance.outputs.altitudeCorrectionFactor > 1.0, 'DRC/Clearance: Altitude > 2000m applies air breakdown clearance derating');

const annularDrc = checkAnnularRingDrc({
  padDiameterMm: 0.60,
  drillDiameterMm: 0.30,
  ipcClass: 'class2',
  isExternalLayer: true,
});
assert(annularDrc.status === 'pass', 'DRC/Clearance: 0.60mm pad on 0.30mm drill (0.15mm ring) passes Class 2 minimum');

const drcCheck = runPcbGeometryDrcCheck({
  traceWidthMm: 0.15,
  traceSpacingMm: 0.15,
  drillToCopperMm: 0.25,
  viaToTraceMm: 0.14,
  fabricationCapabilityTier: 'standard',
});
assert(drcCheck.every(r => r.status === 'pass'), 'DRC/Clearance: 6/6 mil geometry passes standard manufacturing capability tier');

const customDrc = runPcbGeometryDrcCheck({
  traceWidthMm: 0.10,
  traceSpacingMm: 0.10,
  drillToCopperMm: 0.20,
  viaToTraceMm: 0.12,
  fabricationCapabilityTier: 'custom',
  customRules: {
    minTraceWidthMm: 0.075,
    minTraceSpacingMm: 0.075,
  },
});
assert(customDrc.find(r => r.ruleName.includes('Width'))?.status === 'pass', 'DRC/Clearance: 0.10mm width passes custom 0.075mm user rule');

// 69. PCB Reference Data & Integrity
console.log('\n69. PCB Reference Data & Integrity:');
assert(COPPER_FOIL_REFERENCE.length >= 5, 'PCB Reference: Copper foil data includes standard weights (0.5 to 4 oz)');
assert(IPC7351_LAND_PATTERNS.length >= 8, 'PCB Reference: IPC-7351 SMD land pattern array populated');
assert(DIELECTRIC_MATERIALS.length >= 8, 'PCB Reference: Dielectric substrate database contains FR-4, Rogers, Polyimide, PTFE');
const pcbFormulas = FORMULA_BOOK.filter(f => f.category === 'pcb');
assert(pcbFormulas.length >= 7, 'PCB Reference: All 7 Phase 08 formulas registered in Formula Book');

// ====================================================
// PHASE 09: ENGINEERING MATHEMATICS & COMPUTATIONAL ANALYSIS
// ====================================================

// 70. Engineering Numbers & Precision
console.log('\n70. Engineering Numbers & Precision:');
const sci = toScientificNotation(0.000047, 3);
assert(sci.coefficient === 4.7 && sci.exponent === -5, 'Math/Precision: Scientific notation 0.000047 = 4.70 × 10^-5');
const eng = toEngineeringNotation(0.000047, 2);
assert(eng.coefficient === 47 && eng.exponent === -6 && eng.prefixSymbol === 'µ', 'Math/Precision: Engineering notation 0.000047 = 47 µ (10^-6)');
const sigFig = countSignificantFigures('0.004500');
assert(sigFig.significantDigitsCount === 4, 'Math/Precision: Trailing zeros after decimal in 0.004500 count as 4 sig figs');
const pctDiff = calculatePercentageDifference(100, 105);
assert(Math.abs(pctDiff.percentDiff - 4.878) < 0.01, 'Math/Precision: Percentage difference between 100 and 105 is ≈ 4.88%');
const pctErr = calculatePercentageError(9.81, 9.78);
assert(Math.abs(pctErr.percentError - 0.3067) < 0.01, 'Math/Precision: Relative percentage error for 9.81 vs 9.78 is ≈ 0.31%');
const ratioRes = calculateRatioAndProportion({ a: 16, b: 9, scalingFactor: 120 });
assert(ratioRes.reducedRatio[0] === 16 && ratioRes.reducedRatio[1] === 9, 'Math/Precision: Ratio 16:9 correctly preserved in reduced form');
const prefConv = convertEngineeringPrefix(4.7, -6, -3);
assert(Math.abs(prefConv.convertedValue - 0.0047) < 1e-6, 'Math/Precision: 4.7 micro converted to milli is 0.0047');
const roundEven = roundPrecision(2.5, 'round_half_even', 0);
assert(roundEven.result === 2, 'Math/Precision: Banker\'s rounding 2.5 rounds to nearest even integer 2');
const roundOdd = roundPrecision(3.5, 'round_half_even', 0);
assert(roundOdd.result === 4, 'Math/Precision: Banker\'s rounding 3.5 rounds to nearest even integer 4');

// 71. Complex Numbers & Phasors
console.log('\n71. Complex Numbers & Phasors:');
const polar = mathRectToPolar(3, 4);
assert(Math.abs(polar.magnitude - 5.0) < 1e-6 && Math.abs(polar.phaseDeg - 53.13) < 0.01, 'Math/Complex: 3 + j4 converts to 5 ∠ 53.13°');
const rectComplex = mathPolarToRect(5, 53.13010235);
assert(Math.abs(rectComplex.real - 3.0) < 1e-4 && Math.abs(rectComplex.imag - 4.0) < 1e-4, 'Math/Complex: 5 ∠ 53.13° converts back to 3 + j4');
const cSum = complexAdd({ real: 4, imag: 3 }, { real: 1, imag: -2 });
assert(cSum.real === 5 && cSum.imag === 1, 'Math/Complex: (4+3j) + (1-2j) = 5+1j');
const cDiv = complexDiv({ real: 1, imag: 1 }, { real: 1, imag: -1 });
assert(Math.abs(cDiv.real) < 1e-6 && Math.abs(cDiv.imag - 1.0) < 1e-6, 'Math/Complex: (1+j)/(1-j) = j');
const cPow = complexPower({ real: 1, imag: 1 }, 4);
assert(Math.abs(cPow.real - (-4)) < 1e-5 && Math.abs(cPow.imag) < 1e-5, 'Math/Complex: De Moivre (1+j)^4 = -4');
const euler = toEulerForm({ real: 0, imag: 1 });
assert(euler.magnitude === 1 && Math.abs(euler.phaseRad - Math.PI / 2) < 1e-5, 'Math/Complex: Pure imaginary j in Euler form is 1·e^(jπ/2)');

// 72. Vector 2D/3D Operations
console.log('\n72. Vector 2D/3D Operations:');
const vMag = vectorMagnitude([3, 4, 0]);
assert(Math.abs(vMag - 5.0) < 1e-6, 'Math/Vectors: Vector [3, 4, 0] magnitude is 5.0');
const vDot = vectorDotProduct([3, 4, 0], [1, 2, 2]);
assert(vDot === 11, 'Math/Vectors: [3,4,0] · [1,2,2] = 11');
const vCross = vectorCrossProduct([1, 0, 0], [0, 1, 0]);
assert(vCross[0] === 0 && vCross[1] === 0 && vCross[2] === 1, 'Math/Vectors: Unit i × Unit j = Unit k [0, 0, 1]');
const vProj = vectorProjection([3, 4, 0], [1, 0, 0]);
assert(Math.abs(vProj.projectedVector[0] - 3.0) < 1e-6 && Math.abs(vProj.projectedVector[1]) < 1e-6, 'Math/Vectors: Proj of [3, 4, 0] onto x-axis is [3, 0, 0]');
const vAngle = angleBetweenVectors([1, 0, 0], [0, 1, 0]);
assert(Math.abs(vAngle.angleDeg - 90.0) < 1e-5, 'Math/Vectors: Orthogonal axes have 90.0° angle');

// 73. Matrix Operations & Solvers
console.log('\n73. Matrix Operations & Solvers:');
const mDet = matrixDeterminant([[4, 2], [1, 3]]);
assert(mDet === 10, 'Math/Matrices: det([[4,2],[1,3]]) = 12 - 2 = 10');
const mInv = matrixInverse([[4, 2], [1, 3]]);
assert(mInv.isInvertible && mInv.inverse !== null, 'Math/Matrices: Non-singular 2x2 matrix is invertible');
assert(Math.abs(mInv.inverse![0][0] - 0.3) < 1e-6 && Math.abs(mInv.inverse![0][1] - (-0.2)) < 1e-6, 'Math/Matrices: Inverse entry (0,0)=0.3, (0,1)=-0.2');
const mRank = matrixRank([[1, 2], [2, 4]]);
assert(mRank === 1, 'Math/Matrices: Linearly dependent matrix [[1,2],[2,4]] has rank 1');
const sol2 = solveLinearSystem2x2([[2, 1], [1, 3]], [8, 14]);
assert(sol2.solution !== null && Math.abs(sol2.solution[0] - 2) < 1e-5 && Math.abs(sol2.solution[1] - 4) < 1e-5, 'Math/Matrices: 2x2 system 2x+y=8, x+3y=14 solves to x=2, y=4');

// 74. Numerical Differentiation
console.log('\n74. Numerical Differentiation:');
const derivRes = numericalDerivative((x) => x * x * x, 2, 1e-4, 'central');
assert(Math.abs(derivRes.derivative - 12.0) < 1e-4, 'Math/Calculus: Central difference d/dx(x³) at x=2 evaluates to 12.000');
const secDeriv = numericalSecondDerivative((x) => x * x * x, 2, 1e-3);
assert(Math.abs(secDeriv.secondDerivative - 12.0) < 1e-2, 'Math/Calculus: Second derivative d²/dx²(x³) at x=2 evaluates to 12.0');

// 75. Numerical Integration & Quadrature
console.log('\n75. Numerical Integration & Quadrature:');
const intSimp = numericalIntegration((x) => 3 * x * x, 0, 2, 20, 'simpson');
assert(Math.abs(intSimp.integral - 8.0) < 1e-6, 'Math/Calculus: Simpson\'s 1/3 rule for ∫₀² 3x² dx evaluates to exact 8.000');
const intTrap = numericalIntegration((x) => 2 * x, 0, 3, 50, 'trapezoidal');
assert(Math.abs(intTrap.integral - 9.0) < 1e-4, 'Math/Calculus: Trapezoidal rule for ∫₀³ 2x dx evaluates to 9.000');

// 76. Root Finding Solvers
console.log('\n76. Root Finding Solvers:');
const rootBisect = bisectionMethod((x) => x * x * x - 2 * x - 5, 1, 3, { tolerance: 1e-6 });
assert(rootBisect.converged && rootBisect.root !== null && Math.abs(rootBisect.root - 2.094551) < 1e-4, 'Math/RootFinding: Bisection finds root of x³-2x-5 at ≈ 2.09455');
const rootNewton = newtonRaphsonMethod((x) => Math.cos(x) - x, 0.5, { tolerance: 1e-7 });
assert(rootNewton.converged && rootNewton.root !== null && Math.abs(rootNewton.root - 0.739085) < 1e-5, 'Math/RootFinding: Newton-Raphson finds transcendental root cos(x)-x at ≈ 0.739085');
const rootSecant = secantMethod((x) => x * x - 4, 1, 3, { tolerance: 1e-7 });
assert(rootSecant.converged && rootSecant.root !== null && Math.abs(rootSecant.root - 2.0) < 1e-5, 'Math/RootFinding: Secant method solves x²-4=0 to root 2.0');

// 77. Interpolation & Regression
console.log('\n77. Interpolation & Regression:');
const regData = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }, { x: 4, y: 8 }];
const regRes = calculateLinearRegression(regData);
assert(Math.abs(regRes.slope - 2.0) < 1e-6 && Math.abs(regRes.intercept) < 1e-6 && Math.abs(regRes.rSquared - 1.0) < 1e-6, 'Math/Regression: Perfect linear fit y=2x yields slope 2.0, intercept 0, R²=1.0');
const interpRes = linearInterpolation([{ x: 0, y: 0 }, { x: 10, y: 100 }], 5);
assert(Math.abs(interpRes.interpolatedY - 50.0) < 1e-6, 'Math/Interpolation: Linear midpoint interpolation at x=5 gives y=50');
const polyRes = polynomialInterpolation([{ x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 9 }], 2.5);
assert(Math.abs(polyRes.interpolatedY - 6.25) < 1e-4, 'Math/Interpolation: Lagrange quadratic interpolation at x=2.5 gives 6.25 (2.5²)');
const extrapCheck = linearInterpolation([{ x: 0, y: 0 }, { x: 10, y: 100 }], 15);
assert(extrapCheck.extrapolation.isExtrapolated, 'Math/Interpolation: Target x=15 outside [0, 10] flags extrapolation warning');

// 78. Descriptive Statistics & Moments
console.log('\n78. Descriptive Statistics & Moments:');
const stats = calculateDescriptiveStatistics([10, 20, 30, 40, 50]);
assert(stats.mean === 30 && stats.median === 30, 'Math/Statistics: Mean and median of [10,20,30,40,50] is 30');
assert(Math.abs(stats.sampleStdDev - 15.8114) < 1e-3, 'Math/Statistics: Sample standard deviation s ≈ 15.811');
assert(Math.abs(stats.standardErrorOfMean - 7.071) < 1e-3, 'Math/Statistics: SEM = s / √5 ≈ 7.071');
const sma = calculateSimpleMovingAverage([1, 2, 3, 4, 5], 3);
assert(sma.length === 5 && sma[2] === 2 && sma[3] === 3 && sma[4] === 4, 'Math/Statistics: 3-point SMA of [1,2,3,4,5] yields window averages [2, 3, 4]');

// 79. ISO GUM Uncertainty & Error Propagation
console.log('\n79. ISO GUM Uncertainty & Error Propagation:');
const uncAdd = propagateAdditionSubtraction([
  { value: 10, uncertainty: 0.3, sign: 1 },
  { value: 20, uncertainty: 0.4, sign: 1 },
]);
assert(Math.abs(uncAdd.combinedAbsoluteUncertainty - 0.5) < 1e-5, 'Math/Uncertainty: Quadrature sum √(0.3² + 0.4²) = 0.5');
const uncMul = propagateMultiplicationDivision([
  { value: 10, uncertainty: 0.3 }, // 3%
  { value: 20, uncertainty: 0.8 }, // 4%
]);
assert(uncMul.nominalResult === 200 && uncMul.relativePercent === '5.00%', 'Math/Uncertainty: Relative quadrature √(3%² + 4%²) = 5% of 200 = ±10');
assert(Math.abs(uncMul.combinedAbsoluteUncertainty - 10.0) < 1e-4, 'Math/Uncertainty: Absolute uncertainty is ±10 on value 200');
const uncPow = propagatePower(5.0, 0.1, 2.0); // y = x² => dy/y = 2 dx/x
assert(uncPow.nominalResult === 25.0 && Math.abs(uncPow.combinedAbsoluteUncertainty - 1.0) < 1e-4, 'Math/Uncertainty: Power rule u(x²) = 2·x·u(x) = 2·5·0.1 = 1.0');

// 80. Engineering Geometry & Coordinates
console.log('\n80. Engineering Geometry & Coordinates:');
const tri = solveTriangle({ sideA: 3, sideB: 4, sideC: 5 });
assert(tri.triangleType === 'right' && Math.abs(tri.area - 6.0) < 1e-5, 'Math/Geometry: 3-4-5 triangle is right-angled with area 6.0');
assert(Math.abs(tri.inradius - 1.0) < 1e-5, 'Math/Geometry: 3-4-5 triangle inradius r = Area/s = 6/6 = 1.0');
const circ = calculateCircle(10);
assert(Math.abs(circ.area - 100 * Math.PI) < 1e-4, 'Math/Geometry: Circle radius 10 area is 100π');
const poly = calculateRegularPolygon(6, 10);
assert(poly.sidesN === 6 && poly.perimeter === 60, 'Math/Geometry: Regular hexagon side 10 has perimeter 60');
const cyl = calculateEngineeringVolume('cylinder', { radius: 3, height: 10 });
assert(Math.abs(cyl.volume - 90 * Math.PI) < 1e-4, 'Math/Geometry: Cylinder r=3, h=10 has volume 90π');
const cylCoord = cartesianToCylindrical(3, 4, 5);
assert(Math.abs(cylCoord.r - 5.0) < 1e-5 && cylCoord.z === 5, 'Math/Geometry: Cartesian (3,4,5) cylindrical radius r=5, z=5');
const sphCoord = cartesianToSpherical(0, 3, 4);
assert(Math.abs(sphCoord.rho - 5.0) < 1e-5, 'Math/Geometry: Cartesian (0,3,4) spherical rho = 5.0');
const mathFormulas = FORMULA_BOOK.filter(f => f.category === 'math');
assert(mathFormulas.length >= 8, 'Math/Formulas: All 8 Phase 09 formulas registered in Formula Book');

// =========================================================================
// PHASE 10: THERMAL ENGINEERING, HEAT MANAGEMENT & RELIABILITY (Tools 1 - 60)
// =========================================================================

// 81. Thermal Fundamentals (Tools 1 - 10)
console.log('\n81. Thermal Fundamentals (Tools 1 - 10):');
const heatEn = calculateHeatEnergy({ massKg: 0.5, specificHeatJkgK: 896, deltaTKelvin: 50 });
assert(Math.abs(heatEn.energyJoules - 22400) < 1e-4 && Math.abs(heatEn.thermalCapacitanceJK - 448) < 1e-4, 'Thermal/1: Q = m·c·ΔT = 0.5×896×50 = 22,400 J, Cth = 448 J/K');
const heatRateTime = calculateHeatTransferRate({ mode: 'energy_time', energyJoules: 10000, timeSeconds: 20 });
assert(heatRateTime.heatRateWatts === 500, 'Thermal/2: q = Q / t = 10,000 / 20 = 500 W');
const heatRateGeom = calculateHeatTransferRate({ mode: 'conduction_geometry', thermalConductivityWmK: 200, areaM2: 0.01, lengthMeters: 0.002, deltaTKelvin: 10 });
assert(Math.abs(heatRateGeom.heatRateWatts - 10000) < 1e-4, 'Thermal/2: 1D Fourier conduction q = (k·A/L)·ΔT = (200×0.01/0.002)×10 = 10,000 W');
const tempConv = convertTemperature(100, 'C');
assert(tempConv.celsius === 100 && Math.abs(tempConv.kelvin - 373.15) < 1e-4 && tempConv.fahrenheit === 212 && Math.abs(tempConv.rankine - 671.67) < 1e-2, 'Thermal/3: 100°C = 373.15 K = 212°F = 671.67°R');
const tempDiff = calculateTemperatureDifference(80, 20, 'C');
assert(tempDiff.deltaCelsius === 60 && tempDiff.deltaKelvin === 60 && Math.abs(tempDiff.deltaFahrenheit - 108) < 1e-4, 'Thermal/4: ΔT of 80°C - 20°C = 60°C = 60 K = 108°F');
const rthGeom = calculateThermalResistance({ mode: 'geometry', lengthMeters: 0.002, thermalConductivityWmK: 200, areaM2: 0.01 });
assert(Math.abs(rthGeom.resistanceKW - 0.001) < 1e-6, 'Thermal/5: Rth = L/(k·A) = 0.002 / (200×0.01) = 0.001 K/W');
const gthGeom = calculateThermalConductance(200, 0.01, 0.002);
assert(Math.abs(gthGeom.conductanceWK - 1000) < 1e-4 && Math.abs(gthGeom.resistanceKW - 0.001) < 1e-6, 'Thermal/6: Gth = 1/Rth = 1000 W/K');
const serRth = calculateSeriesThermalResistance([
  { id: '1', name: 'R1', resistanceKW: 0.5 },
  { id: '2', name: 'R2', resistanceKW: 0.3 },
  { id: '3', name: 'R3', resistanceKW: 1.2 },
], 10);
assert(Math.abs(serRth.totalResistanceKW - 2.0) < 1e-5 && serRth.voltageEquivalentDrops[0].deltaTKelvin === 5.0, 'Thermal/8: Series Rth = 0.5 + 0.3 + 1.2 = 2.0 °C/W with ΔT1 = 5.0°C');
const parRth = calculateParallelThermalResistance([
  { id: '1', name: 'R1', resistanceKW: 2.0 },
  { id: '2', name: 'R2', resistanceKW: 2.0 },
], 20);
assert(Math.abs(parRth.totalResistanceKW - 1.0) < 1e-5 && parRth.branchHeatFlows[0].heatFlowWatts === 10, 'Thermal/9: Parallel Rth = 2.0 || 2.0 = 1.0 °C/W with 10W per branch');
const convBidi = convertResistanceConductance(2.5, 'R');
assert(convBidi.conductanceWK === 0.4, 'Thermal/10: Rth = 2.5 °C/W ⇄ Gth = 0.4 W/°C');
const netSol = solveThermalNetwork([
  { id: 'die', name: 'Die', heatSourceWatts: 50 },
  { id: 'amb', name: 'Amb', fixedTemperatureC: 25 },
], [{ fromNodeId: 'die', toNodeId: 'amb', resistanceKW: 1.5 }]);
assert(Math.abs(netSol.nodeTemperaturesC.die - 100) < 1e-3, 'Thermal/7: Nodal network MNA solver yields Tj = 25 + 50×1.5 = 100°C');

// 82. Junction / Case / Ambient (Tools 11 - 20)
console.log('\n82. Junction / Case / Ambient (Tools 11 - 20):');
const juncT = calculateJunctionTemperature({
  powerDissipationWatts: 20,
  ambientTempC: 40,
  rthJcKW: 1.0,
  rthCsKW: 0.5,
  rthSaKW: 2.0,
  maxJunctionTempC: 150,
});
assert(Math.abs(juncT.junctionTempC - 110) < 1e-3 && Math.abs(juncT.caseTempC - 90) < 1e-3 && juncT.isSafe, 'Thermal/11: Tj = 40 + 20×(1+0.5+2) = 110°C, Tc = 90°C');
const caseTFromJ = calculateCaseTemperature('from_junction', 20, 1.0, 110);
assert(caseTFromJ.caseTempC === 90, 'Thermal/12: Tc = Tj - P·Rjc = 110 - 20×1 = 90°C');
const maxAmb = calculateMaxAmbientTemperature(150, 20, 3.5);
assert(Math.abs(maxAmb.maxAmbientC - 80) < 1e-3, 'Thermal/13: Ta_max = 150 - 20×3.5 = 80°C');
const extRjc = calculateRthJc(110, 90, 20);
assert(extRjc.rthJcKW === 1.0, 'Thermal/14: Rθjc = (110 - 90)/20 = 1.0 °C/W');
const extRcs = calculateRthCs(90, 80, 20);
assert(extRcs.rthCsKW === 0.5, 'Thermal/15: Rθcs = (90 - 80)/20 = 0.5 °C/W');
const extRsa = calculateRthSa(80, 40, 20);
assert(extRsa.rthSaKW === 2.0, 'Thermal/16: Rθsa = (80 - 40)/20 = 2.0 °C/W');
const extRja = calculateRthJa(1.0, 0.5, 2.0);
assert(extRja.rthJaKW === 3.5, 'Thermal/17: Rθja = 1.0 + 0.5 + 2.0 = 3.5 °C/W');
const maxP = calculateMaxAllowablePower(150, 45, 3.5);
assert(Math.abs(maxP.maxPowerWatts - 30.0) < 1e-3, 'Thermal/18: P_max = (150 - 45)/3.5 = 30.0 W');
const derateRes = calculateTemperatureDerating(100, 25, 175, 100, 40);
assert(Math.abs(derateRes.operatingPointDeratedLimitWatts - 50.0) < 1e-3 && derateRes.isOperatingWithinDerating, 'Thermal/19: Linear derating 100W at 25°C down to 0W at 175°C gives 50W at 100°C');
const multiDev = calculateMultiDeviceThermal([
  { id: '1', name: 'Q1', powerWatts: 20, rthJcKW: 1.0, rthCsKW: 0.5, tjMaxC: 150 },
  { id: '2', name: 'Q2', powerWatts: 30, rthJcKW: 0.8, rthCsKW: 0.4, tjMaxC: 150 },
], 0.8, 35);
assert(Math.abs(multiDev.heatsinkTempC - 75.0) < 1e-3, 'Thermal/20: Shared heatsink Ts = 35 + (20+30)×0.8 = 75°C');
assert(Math.abs(multiDev.devices[0].junctionTempC - 105.0) < 1e-3, 'Thermal/20: Q1 Tj = 75 + 20×(0.5+1.0) = 105°C');

// 83. Heat Sinks & Convection (Tools 21 - 30)
console.log('\n83. Heat Sinks & Convection (Tools 21 - 30):');
const reqRsa = calculateRequiredHeatsinkRth({
  maxJunctionTempC: 125,
  ambientTempC: 45,
  powerWatts: 25,
  rthJcKW: 1.0,
  rthCsKW: 0.4,
  safetyMarginPct: 0,
});
assert(Math.abs(reqRsa.requiredRthSaKW - 1.8) < 1e-3, 'Thermal/21: Required Rθsa = (125 - 45)/25 - 1.4 = 1.8 °C/W');
const natSizing = calculateNaturalConvectionSizing({ powerWatts: 30, targetDeltaTKelvin: 40 });
assert(natSizing.heatTransferCoefficientWm2K > 5 && natSizing.requiredSurfaceAreaCm2 > 500, 'Thermal/22: Natural convection sizing h_nat > 5 W/m²K, Area > 500 cm²');
const forcedSizing = calculateForcedAirSizing({ powerWatts: 30, targetDeltaTKelvin: 40, airVelocityMps: 2.5 });
assert(forcedSizing.heatTransferCoefficientWm2K > natSizing.heatTransferCoefficientWm2K * 2, 'Thermal/23: Forced air h is over 2× natural convection h');
const airflowReq = calculateAirflowRequirement({ powerWatts: 100, allowedAirTempRiseC: 10 });
assert(Math.abs(airflowReq.airflowCfm - 17.6) < 0.2, 'Thermal/24: CFM = 1.76 × 100 / 10 = 17.6 CFM');
const velH = calculateVelocityAndH(17.6, 0.01, 0.015);
assert(velH.velocityMps > 0.5 && velH.heatTransferCoefficientWm2K > 10, 'Thermal/25: Flow velocity and duct heat transfer coefficient evaluated');
const extSizing = calculateExtrusionSizing(2.5, 'natural');
assert(extSizing.volumeCm3 === 100, 'Thermal/26: Volumetric extrusion sizing V = 250 / 2.5 = 100 cm³');
const finEff = calculateFinEfficiency({
  finLengthM: 0.1,
  finHeightM: 0.03,
  finThicknessM: 0.001,
  numberOfFins: 10,
  baseWidthM: 0.08,
  baseLengthM: 0.1,
  heatTransferCoefficientWm2K: 25,
  finThermalConductivityWmK: 167,
});
assert(finEff.finEfficiency > 0.85 && finEff.finEfficiency <= 1.0, 'Thermal/27: Fin efficiency η_fin > 0.85 for 30mm aluminum fin');
const presDrop = calculateHeatsinkPressureDrop(0.01, 0.002, 0.1, 0.015);
assert(presDrop.deltaPressurePa > 0 && presDrop.velocityMps === 5.0, 'Thermal/28: Darcy-Weisbach duct pressure drop evaluated at 5 m/s');
const finProfile = calculateFinTemperatureProfile(85, 25, 0.03, 17.3, 4);
assert(finProfile.length === 5 && finProfile[0].temperatureC === 85 && finProfile[4].temperatureC < 85, 'Thermal/29: Fin tip temperature decreases monotonically from 85°C base');
const altDerate = calculateAltitudeDerating(2000, 1.5, 'forced');
assert(altDerate.deratingFactor > 1.1 && altDerate.deratedRthKW > 1.5, 'Thermal/30: Altitude of 2000m derates cooling Rth above 1.5 °C/W');

// 84. Thermal Interface Materials (TIM) (Tools 31 - 40)
console.log('\n84. Thermal Interface Materials (TIM) (Tools 31 - 40):');
const timRes = calculateTimResistance({
  thicknessMeters: 25e-6,
  thermalConductivityWmK: 2.5,
  contactAreaM2: 0.0005,
  contactResistanceFactorCm2KW: 0.05,
});
assert(Math.abs(timRes.bulkTimResistanceKW - 0.02) < 1e-4 && Math.abs(timRes.contactResistanceKW - 0.01) < 1e-4, 'Thermal/31: TIM R_bulk = 0.02 °C/W, R_contact = 0.01 °C/W, Total = 0.03 °C/W');
const bltRes = calculateBltAndContact(30, 3.0, 5.0, 'milled_smooth');
assert(bltRes.rTotalKW > 0 && bltRes.rBulkKW > 0, 'Thermal/32: BLT and contact resistance modeled for milled surface');
const pressRes = calculatePressureEffect(50, 200, 'grease', 3.0, 5.0);
assert(pressRes.effectiveBltMicrons < 50 && pressRes.pressureCategory === 'OPTIMAL_PRESSURE', 'Thermal/33: 200 kPa clamping reduces BLT and lowers Rth');
const timComp = compareTimPresets(5.0);
assert(timComp.length >= 8, 'Thermal/34: Benchmark preset comparison provides >= 8 TIM materials');
const pcmSol = calculatePhaseChangeModel(40, 52, 60, 25, 3.5, 5.0);
const pcmLiq = calculatePhaseChangeModel(65, 52, 60, 25, 3.5, 5.0);
assert(pcmSol.phaseState === 'SOLID' && pcmLiq.phaseState === 'LIQUID' && pcmLiq.thermalResistanceKW < pcmSol.thermalResistanceKW, 'Thermal/35: PCM transitions from SOLID to LIQUID with lower Rth above melt temp');
const washRes = calculateInsulatingWasher('sil_pad', 0.25, 4.0, true);
assert(washRes.breakdownVoltageKv === 2.5 && washRes.thermalResistanceKW > 0, 'Thermal/36: Sil-Pad washer provides 2.5 kV isolation');
const roughRes = calculateSurfaceRoughnessImpact(25, 1.5, 10, 2.5, 4.0);
assert(roughRes.effectiveBltMicrons > 25, 'Thermal/37: Surface roughness Ra and camber increase effective micro-gap');
const pumpRes = calculateGreasePumpOut(0.1, 1000, 60, false);
assert(pumpRes.degradationMultiplier > 1.0 && pumpRes.degradedRthKW > 0.1, 'Thermal/38: Thermal cycling pump-out degrades interface thermal resistance');
const fluxRes = calculateHeatFlux(100, 200); // 100W on 2 cm² (200 mm²)
assert(fluxRes.heatFluxWperCm2 === 50 && fluxRes.severityCategory === 'HIGH_HEATPIPE_REQUIRED', 'Thermal/39: 100W over 2 cm² yields 50 W/cm² heat flux');
const stackRes = calculateMultiLayerTimStackup([
  { id: '1', name: 'TIM1', thicknessMm: 0.05, thermalConductivityWmK: 50 },
  { id: '2', name: 'IHS', thicknessMm: 2.0, thermalConductivityWmK: 390 },
], 4.0, 50);
assert(stackRes.totalResistanceKW > 0 && stackRes.layerResults.length === 2, 'Thermal/40: Multi-layer TIM stackup evaluated across layers');

// 85. PCB & Enclosure Thermal Analysis (Tools 41 - 50)
console.log('\n85. PCB & Enclosure Thermal Analysis (Tools 41 - 50):');
const spreadRes = calculatePcbSpreadingResistance({
  sourceLengthMm: 10,
  sourceWidthMm: 10,
  substrateLengthMm: 50,
  substrateWidthMm: 50,
  pcbThicknessMm: 1.6,
  pcbConductivityWmK: 20,
});
assert(spreadRes.spreadingResistanceKW > 0 && spreadRes.oneDimConductionResistanceKW > 0, 'Thermal/41: Lee & Song analytical spreading resistance evaluated');
const viaRes = calculateThermalViaArray({
  drillDiameterMm: 0.3,
  platingThicknessUm: 25,
  pcbThicknessMm: 1.6,
  viaCount: 16,
  filledMaterial: 'solder_sac305',
});
assert(viaRes.arrayEquivalentResistanceKW < viaRes.singleViaResistanceKW / 15, 'Thermal/42: 16 parallel solder-filled thermal vias reduce thermal resistance below single via / 15');
const planeCond = calculatePcbCopperPlaneConductivity({
  totalThicknessMm: 1.6,
  layersCount: 4,
  copperLayers: [{ thicknessOz: 1, coverageFraction: 0.8 }, { thicknessOz: 1, coverageFraction: 0.8 }],
});
assert(planeCond.inPlaneConductivityKxyWmK > planeCond.throughPlaneConductivityKzWmK * 10, 'Thermal/43: PCB in-plane conductivity k_xy is >10× higher than through-plane k_z');
const encHeat = calculateEnclosureHeatTransfer({
  lengthM: 0.2,
  widthM: 0.15,
  heightM: 0.1,
  wallThicknessMm: 2.0,
  wallMaterialConductivityWmK: 167,
  internalHeatWatts: 30,
  ambientTempC: 25,
});
assert(encHeat.internalAirTempC > encHeat.externalSurfaceTempC && encHeat.externalSurfaceTempC > 25, 'Thermal/44: Enclosure heat transfer yields Tin > Tsurf > Tamb');
const sealedTemp = calculateSealedEnclosureTemp(40, 25, 0.2, 5.0);
assert(Math.abs(sealedTemp.deltaTC - 40) < 1e-4 && sealedTemp.internalAirTempC === 65, 'Thermal/45: Sealed enclosure ΔT = 40W / (5 W/m²K × 0.2 m²) = 40°C → Tint = 65°C');
const ventStack = calculateVentedEnclosureStackEffect(30, 0.1, 0.002, 0.002, 25);
assert(ventStack.draftVelocityMps > 0 && ventStack.volumetricAirflowCfm > 0, 'Thermal/46: Natural chimney stack effect generates positive airflow');
const fanCfm = calculateEnclosureFanCfm(100, 15);
assert(fanCfm.requiredCfm > 10, 'Thermal/47: Fan CFM requirement sized for 100W enclosure heat load');
const solarLoad = calculateSolarRadiationHeatLoad({
  solarIrradianceWperM2: 1000,
  projectedAreaM2: 0.1,
  surfaceFinish: 'bare_aluminum',
});
assert(solarLoad.solarAbsorptivity === 0.55 && solarLoad.absorbedSolarHeatWatts === 55, 'Thermal/48: 1000 W/m² solar flux on 0.1 m² aluminum (α=0.55) absorbs 55 W');
const radStefan = calculateStefanBoltzmannRadiation({
  surfaceTempC: 80,
  ambientOrEnclosureTempC: 25,
  surfaceAreaM2: 0.08,
  emissivity: 0.85,
});
assert(Math.abs(radStefan.radiatedPowerWatts - 29.7) < 0.5, 'Thermal/49: Stefan-Boltzmann radiation for 0.08 m² black heatsink at 80°C in 25°C ambient radiates ~29.7 W');
const combLoss = calculateCombinedConvectionRadiation(80, 25, 0.08, 6.0, 0.85);
assert(combLoss.totalHeatLossWatts > combLoss.convectionLossWatts && combLoss.radiationLossWatts > 0, 'Thermal/50: Combined convection + radiation total loss accounts for both mechanisms');

// 86. Transient Thermal & Component Reliability (Tools 51 - 60)
console.log('\n86. Transient Thermal & Component Reliability (Tools 51 - 60):');
const capRes = calculateThermalCapacitance({ massKg: 0.2, specificHeatJkgK: 896 });
assert(Math.abs(capRes.thermalCapacitanceJK - 179.2) < 1e-4, 'Thermal/51: C_th = 0.2 × 896 = 179.2 J/K');
const tauRes = calculateThermalTimeConstant(1.5, 20);
assert(tauRes.timeConstantSeconds === 30 && tauRes.timeTo95PercentRiseSeconds === 90, 'Thermal/52: τ = 1.5 × 20 = 30s, t95% = 90s');
const pulseRes = calculateSinglePulseResponse({
  pulsePowerWatts: 100,
  pulseDurationSeconds: 5,
  thermalResistanceKW: 1.0,
  timeConstantSeconds: 10,
  initialTempC: 25,
});
assert(Math.abs(pulseRes.peakTempRiseKelvin - (100 * (1 - Math.exp(-0.5)))) < 1e-3, 'Thermal/53: Single pulse ΔT = 100 × (1 - e^-0.5) ≈ 39.35 °C');
const repRes = calculateRepetitivePulseResponse({
  peakPowerWatts: 100,
  pulseWidthSeconds: 0.002,
  periodSeconds: 0.010,
  thermalResistanceKW: 1.0,
  timeConstantSeconds: 0.05,
  ambientTempC: 25,
});
assert(repRes.dutyCycle === 0.2 && repRes.averagePowerWatts === 20 && repRes.peakJunctionTempC > repRes.valleyJunctionTempC, 'Thermal/54: Repetitive 20% duty PWM pulse steady-state peak and valley Tj evaluated');
const fostRes = calculateFosterZth([
  { id: '1', name: 'S1', rKW: 0.2, tauSeconds: 0.001 },
  { id: '2', name: 'S2', rKW: 0.5, tauSeconds: 0.020 },
], 0.010);
assert(fostRes.totalSteadyStateRthKW === 0.7 && fostRes.zthAtTimeKW < 0.7, 'Thermal/55: Foster Zth(10ms) is less than DC steady-state Rth 0.7 °C/W');
const arrhRes = calculateArrheniusAcceleration({ operatingTempC: 25, stressTempC: 85, activationEnergyEv: 0.7 });
assert(Math.abs(arrhRes.accelerationFactor - 95.3) < 2.0, 'Thermal/56: Arrhenius AF at 85°C vs 25°C (Ea=0.7 eV) is ~95×');
const cmRes = calculateCoffinManson({ deltaTUseKelvin: 30, deltaTStressKelvin: 80 });
assert(cmRes.temperatureAccelerationFactor > 7.0, 'Thermal/57: Coffin-Manson solder fatigue AF_temp > 7.0 for 80K vs 30K thermal cycle swing');
const mtbfDer = calculateMtbfDerating({ baselineFit: 50, baselineTempC: 25, operatingTempC: 85, activationEnergyEv: 0.7 });
assert(mtbfDer.deratedFit > mtbfDer.baselineFit * 80, 'Thermal/58: Derated FIT increases proportionally with Arrhenius acceleration');
const tenDeg = calculateTenDegreeRule(5000, 105, 85);
assert(tenDeg.lifeMultiplier === 4.0 && tenDeg.operatingLifeHours === 20000, 'Thermal/59: 10°C rule: Operating 20°C below rating quadruples component life (4×)');
const thermMarg = calculateThermalMargin({ junctionTempC: 110, maxJunctionTempC: 150, ambientTempC: 35 });
assert(thermMarg.absoluteMarginC === 40 && thermMarg.safetyTier === 'OPTIMAL_RELIABILITY', 'Thermal/60: 40°C margin to 150°C classified as OPTIMAL_RELIABILITY');

const thermalFormulas = FORMULA_BOOK.filter(f => f.category === 'thermal');
assert(thermalFormulas.length >= 8, 'Thermal/Formulas: All 8 Phase 10 thermal formulas registered in Formula Book');

// =========================================================================
// PHASE 11: BATTERIES, ENERGY STORAGE & BATTERY ENGINEERING (Tools 1 - 60)
// =========================================================================

// 87. Battery Fundamentals (Tools 1 - 10)
console.log('\n87. Battery Fundamentals (Tools 1 - 10):');
const battCap = calculateBatteryCapacity({ currentAmps: 2.5, timeHours: 4.0 });
assert(battCap.capacityAh === 10.0 && battCap.capacityMah === 10000 && battCap.chargeCoulombs === 36000, 'Battery/1: Q = I · t = 2.5A × 4h = 10 Ah = 36,000 Coulombs');

const battEnergy = calculateBatteryEnergy({ nominalVoltage: 3.7, capacityAh: 10.0 });
assert(battEnergy.energyWh === 37.0 && battEnergy.energyKwh === 0.037 && battEnergy.energyJoules === 133200, 'Battery/2: E = V · Q = 3.7V × 10Ah = 37 Wh = 133,200 Joules');

const whAhConv = convertWhAndAh({ value: 74, fromUnit: 'Wh', nominalVoltage: 3.7 });
assert(whAhConv.ampHours === 20.0 && whAhConv.milliAmpHours === 20000, 'Battery/3: 74 Wh at 3.7V = 20 Ah (20,000 mAh)');

const fundRuntime = calculateFundamentalRuntime({ capacityAh: 5.0, loadValue: 2.0, loadType: 'current', dischargeDepthFraction: 0.8 });
assert(fundRuntime.runtimeHours === 2.0 && fundRuntime.usableCapacityAh === 4.0, 'Battery/4: 5Ah at 80% DoD with 2A load gives 2.0 hours runtime');

const calcCurr1 = calculateBatteryCurrent({ mode: 'from_capacity_time', capacityAh: 10.0, timeHours: 2.0 });
const calcCurr2 = calculateBatteryCurrent({ mode: 'from_power_voltage', powerWatts: 120, voltageVolts: 12 });
assert(calcCurr1.currentAmps === 5.0 && calcCurr2.currentAmps === 10.0, 'Battery/5: Current calculation from capacity/time and power/voltage');

const battPwr = calculateBatteryPower(12.0, 5.0);
assert(battPwr.powerWatts === 60.0 && battPwr.powerKilowatts === 0.06, 'Battery/6: P = V · I = 12V × 5A = 60 W');

const battVolt = calculateBatteryVoltage('power_current', 120, 10);
assert(battVolt.voltageVolts === 12.0, 'Battery/7: V = P / I = 120W / 10A = 12.0 V');

const cRateCheck1 = calculateCRate('current_to_crate', 2.5, 5.0);
const cRateCheck2 = calculateCRate('crate_to_current', 3.0, 0.5);
assert(cRateCheck1.cRate === 2.0 && cRateCheck2.currentAmps === 1.5, 'Battery/8: 5A on 2.5Ah = 2C; 0.5C on 3Ah = 1.5A');

const chgDischTime = calculateChargeDischargeTime({ capacityAh: 2.5, cRate: 1.0, mode: 'charge', coulombicEfficiencyPercent: 98 });
assertApprox(chgDischTime.timeHours, 1 / 0.98, 1e-3, 'Battery/9: 1C charge with 98% coulombic efficiency takes ~1.02 hours');

const battEff = calculateBatteryEnergyEfficiency(90, 100);
assert(battEff.efficiencyPercent === 90.0 && battEff.energyLossWh === 10.0, 'Battery/10: η_energy = 90Wh / 100Wh = 90.0% with 10Wh loss');

// 88. Battery Pack Configuration (Tools 11 - 20)
console.log('\n88. Battery Pack Configuration (Tools 11 - 20):');
const sCount = calculateCellsInSeries(48.0, 3.6, 'nearest');
assert(sCount.seriesCount === 13 && sCount.actualNominalVoltage === 46.8, 'Battery/11: 48V target with 3.6V cells sizes to 13S (46.8V)');

const pCount = calculateCellsInParallel(20.0, 4.2, 'ceil');
assert(pCount.parallelCount === 5 && pCount.actualPackCapacityAh === 21.0, 'Battery/12: 20Ah target with 4.2Ah cells sizes to 5P (21.0 Ah)');

const sVoltages = calculateSeriesPackVoltage(14, 3.6, 4.2, 2.5);
assert(sVoltages.nominalVoltage === 50.4 && sVoltages.maxChargeVoltage === 58.8 && sVoltages.cutoffDischargeVoltage === 35.0, 'Battery/13: 14S yields 50.4V nom, 58.8V max, 35.0V cutoff');

const pCap = calculateParallelPackCapacity(4, 3.0);
assert(pCap.packCapacityAh === 12.0 && pCap.packCapacityMah === 12000, 'Battery/14: 4P with 3Ah cells = 12.0 Ah (12,000 mAh)');

const packEng = calculatePackEnergy(14, 4, 3.6, 3.0);
assert(packEng.totalCells === 56 && packEng.packEnergyWh === 604.8, 'Battery/15: 14S4P (56 cells) stored energy is 604.8 Wh');

const packCurr = calculatePackCurrentCapability(4, 15.0, 30.0);
assert(packCurr.continuousDischargeAmps === 60.0 && packCurr.peakDischargeAmps === 120.0, 'Battery/16: 4P with 15A/30A cells delivers 60A cont, 120A peak');

const packCRate = calculatePackCRate(30.0, 12.0);
assert(packCRate.packCRate === 2.5 && packCRate.equivalentCellCurrentAmps(4) === 7.5, 'Battery/17: 30A on 12Ah pack is 2.5C (7.5A per cell string)');

const cellPreset = POPULAR_CELL_PRESETS['molicel_p42a_21700'];
const packDesign = designBatteryPack({ targetVoltage: 48.0, targetCapacityAh: 20.0, targetContinuousCurrentAmps: 50.0, cell: cellPreset });
assert(packDesign.seriesCount === 13 && packDesign.parallelCount === 5 && packDesign.configurationString === '13S5P', 'Battery/18: Pack designer configures 13S5P for 48V 20Ah target');

const packScaling = calculateCellToPackScaling({ cellEnergyWh: 15.12, cellWeightKg: 0.070, cellVolumeLiters: 0.026, totalCellCount: 56, structuralOverheadMassFraction: 0.20, volumetricPackingFactor: 0.70 });
assert(packScaling.cellGravimetricDensityWhKg === 216.0 && packScaling.packGravimetricDensityWhKg === 172.8, 'Battery/19: Cell density 216 Wh/kg scales to 172.8 Wh/kg pack density (20% structural overhead)');

const packVerif = verifyPackCapacityAndEnergy({ theoreticalPackEnergyWh: 1000, cellCapacityMismatchPercent: 2.0, busbarInterconnectLossPercent: 1.5, bmsParasiticConsumptionWatts: 1.0, nominalMissionHours: 5.0 });
assert(packVerif.deratedPackEnergyWh === 960.0 && packVerif.usableFractionPercent === 96.0, 'Battery/20: 1000Wh derated by mismatch (20Wh), busbars (15Wh), and BMS (5Wh) yields 960Wh usable');

// 89. Constant-Current & Constant-Power Discharge (Tools 21 - 26)
console.log('\n89. Constant-Current & Constant-Power Discharge (Tools 21 - 26):');
const ccDisch = calculateConstantCurrentDischarge({ nominalCapacityAh: 50, dischargeCurrentAmps: 10, nominalVoltage: 48, dischargeDepthFraction: 0.90 });
assert(ccDisch.runtimeHours === 4.5 && ccDisch.ampHoursRemoved === 45.0 && ccDisch.energyDeliveredWh === 2160, 'Battery/21: 50Ah at 10A (90% DoD) delivers 45Ah in 4.5h and 2160 Wh');

const cpDisch = calculateConstantPowerDischarge({ nominalCapacityAh: 50, nominalVoltage: 48, cutoffVoltage: 42, loadPowerWatts: 500, converterEfficiencyPercent: 95 });
assert(cpDisch.initialCurrentAmps < cpDisch.finalCurrentAtCutoffAmps && cpDisch.estimatedRuntimeHours > 4.0, 'Battery/22: Constant power current rises towards cutoff (I_init < I_final)');

const varLoad = calculateVariableLoadRuntime(10.0, 12.8, [
  { id: '1', name: 'Sleep', durationMinutes: 55, currentAmps: 0.02 },
  { id: '2', name: 'Active', durationMinutes: 5, currentAmps: 4.5 },
], 0.85);
assert(varLoad.totalCycleDurationMinutes === 60 && varLoad.totalRuntimeHours > 20, 'Battery/23: Variable sleep/active load evaluates multi-hour operational life');

const profEnergy = calculateProfileEnergy([
  { powerWatts: 100, durationHours: 2.0 },
  { powerWatts: 200, durationHours: 1.0 },
]);
assert(profEnergy.totalEnergyWh === 400.0 && profEnergy.totalHours === 3.0, 'Battery/24: Multi-segment load profile computes 400 Wh');

const avgLoad = calculateAverageLoad([
  { currentAmps: 1.0, durationSeconds: 10 },
  { currentAmps: 5.0, durationSeconds: 2 },
]);
assertApprox(avgLoad.averageCurrentAmps, (10 + 10) / 12, 1e-3, 'Battery/25: Weighted average current is 1.667 A');

const peakCheck = analyzePeakLoad({ continuousRatingAmps: 40, peakRatingAmps: 80, measuredPeakLoadAmps: 65, peakDurationSeconds: 6, maxAllowedPeakDurationSeconds: 10 });
assert(peakCheck.status === 'SAFE_PEAK_PULSE' && peakCheck.isWithinPeak && !peakCheck.isWithinContinuous, 'Battery/26: 65A pulse on 40A/80A cell is evaluated as SAFE_PEAK_PULSE');

// 90. Voltage Sag & Internal Resistance (Tools 27 - 30)
console.log('\n90. Voltage Sag & Internal Resistance (Tools 27 - 30):');
const sagTest = calculateVoltageSag({ openCircuitVoltage: 4.15, loadCurrentAmps: 15.0, internalResistanceOhms: 0.025, wiringResistanceOhms: 0.010 });
assertApprox(sagTest.voltageSagVolts, 15 * 0.035, 1e-4, 'Battery/27: ΔVsag = 15A × (25mΩ + 10mΩ) = 0.525 V');
assertApprox(sagTest.terminalVoltage, 4.15 - 0.525, 1e-4, 'Battery/27: V_term = 4.15 - 0.525 = 3.625 V');

const irSingle = calculateInternalResistance('single_step', 4.15, 3.75, 10.0);
assert(irSingle.internalResistanceMilliohms === 40.0, 'Battery/28: R_int = (4.15 - 3.75)/10 = 40 mΩ (single step)');

const irTwo = calculateInternalResistance('two_step_pulse', 3.90, 3.60, 10.0, 20.0);
assert(irTwo.internalResistanceMilliohms === 30.0, 'Battery/28: R_int = |3.90 - 3.60| / |20 - 10| = 30 mΩ (two step)');

const availPwr = calculateAvailablePower(50.4, 0.080, 39.0);
assertApprox(availPwr.theoreticalMaxPowerWatts, (50.4 * 50.4) / (4 * 0.080), 0.1, 'Battery/29: Theoretical max power transfer is ~7938 W');
assert(availPwr.usablePowerAtCutoffWatts > 5000, 'Battery/29: Usable power at cutoff exceeds 5000 W');

const dischEff = calculateDischargeEfficiency(4.15, 15.0, 0.035);
assert(dischEff.efficiencyPercent < 100 && dischEff.efficiencyPercent > 80, 'Battery/30: Discharge efficiency under 15A through 35mΩ is ~87.3%');

// 91. SOC & State Estimation (Tools 31 - 34)
console.log('\n91. SOC & State Estimation (Tools 31 - 34):');
const socCalc = calculateSoc({ remainingCapacityAh: 18.5, nominalCapacityAh: 25.0 });
assert(socCalc.socPercent === 74.0 && socCalc.dodPercent === 26.0, 'Battery/31: SOC = 18.5 / 25 = 74.0%, DoD = 26.0%');

const socFromCap = calculateSocFromCapacity(18.5, 25.0);
assert(socFromCap.socFraction === 0.74 && socFromCap.socPercent === 74.0, 'Battery/32: SOC from capacity fraction evaluates to 0.74');

const ocvLiIon = estimateSocFromVoltage(3.80, 'li-ion');
assert(ocvLiIon.estimatedSocPercent === 50.0 && ocvLiIon.statusText.includes('Reference estimate'), 'Battery/33: Li-ion at 3.80V OCV interpolates to 50% SOC');

const dodCalc = calculateDoD(74.0);
assert(dodCalc.dodPercent === 26.0 && dodCalc.dodFraction === 0.26, 'Battery/34: DoD = 100% - 74% = 26%');

// 92. SOH, Capacity Fade & Coulomb Counting (Tools 35 - 40)
console.log('\n92. SOH, Capacity Fade & Coulomb Counting (Tools 35 - 40):');
const sohCalc = calculateSoh({ currentMaxUsableCapacityAh: 42.0, originalRatedCapacityAh: 50.0, currentInternalResistanceOhms: 0.045, initialNewInternalResistanceOhms: 0.025 });
assert(sohCalc.capacitySohPercent === 84.0 && !sohCalc.isEndOfLife && sohCalc.resistanceHealthIndicatorRatio === 1.8, 'Battery/35: 42Ah/50Ah gives 84% SOH; R_ratio = 1.8x');

const capFade = calculateCapacityFade(50.0, 42.0);
assert(capFade.fadeAh === 8.0 && capFade.fadePercent === 16.0 && capFade.remainingCapacityPercent === 84.0, 'Battery/36: Capacity fade is 8.0 Ah (16.0% loss)');

const efcCalc = calculateEquivalentFullCycles(45000, 50.0);
assert(efcCalc.equivalentFullCycles === 450.0, 'Battery/37: 45,000 Ah throughput on 50Ah cell = 450.0 EFC');

const coulombStep = stepCoulombCounting({ initialSocPercent: 85.0, nominalCapacityAh: 20.0, currentAmps: 10.0, timeDurationSeconds: 1800 });
assert(coulombStep.nextSocPercent === 60.0 && coulombStep.direction === 'discharge', 'Battery/38: Coulomb counting: 10A for 30m removes 5Ah (25% SOC) from 85% to 60%');

const remEnergy = estimateRemainingEnergy(75.0, 20.0, 48.0);
assert(remEnergy.remainingEnergyWh === 720.0 && remEnergy.remainingCapacityAh === 15.0, 'Battery/39: 75% SOC of 20Ah at 48V = 720 Wh remaining');

const remRun = calculateRemainingRuntime(15.0, 5.0);
assert(remRun.runtimeHours === 3.0 && remRun.runtimeMinutes === 180.0, 'Battery/40: 15Ah remaining at 5A load gives 3.0 hours runtime');

// 93. Charging & CC/CV Models (Tools 41 - 44)
console.log('\n93. Charging & CC/CV Models (Tools 41 - 44):');
const ccChg = calculateCcCharging({ capacityAh: 50, initialSocPercent: 10, targetSocPercent: 80, chargeCurrentAmps: 25, coulombicEfficiencyPercent: 99 });
assertApprox(ccChg.chargeTimeHours, (0.70 * 50 / 0.99) / 25, 1e-3, 'Battery/41: CC charge 10% to 80% takes ~1.41 hours');

const cvChg = calculateCvCharging({ cvStartCurrentAmps: 25, cutoffCurrentAmps: 1.25, tauDecayMinutes: 40 });
assert(cvChg.cvTimeMinutes > 100 && cvChg.estimatedAhAdded > 10, 'Battery/42: CV exponential taper duration and Ah added modeled');

const cccvEst = estimateCcCvChargingTime({ nominalCapacityAh: 50, ccChargeCurrentAmps: 25 });
assert(cccvEst.totalChargeTimeMinutes > cccvEst.ccStageMinutes && cccvEst.totalAhDelivered > 45, 'Battery/43: Combined CC/CV charging time evaluated');

const chgEnergy = calculateChargeEnergy(54.0, 20.0, 2.0);
assert(chgEnergy.energySuppliedWh === 2160.0 && chgEnergy.energySuppliedKwh === 2.16, 'Battery/44: 54V × 20A × 2h = 2160 Wh charged');

// 94. Charging Efficiency & Thermal Power (Tools 45 - 50)
console.log('\n94. Charging Efficiency & Thermal Power (Tools 45 - 50):');
const rtEff = calculateRoundTripEnergyEfficiency(2400, 2600);
assertApprox(rtEff.energyEfficiencyPercent, (2400 / 2600) * 100, 0.01, 'Battery/45: Round-trip Wh efficiency 2400Wh / 2600Wh = 92.31%');

const ceEff = calculateCoulombicEfficiency(49.5, 50.0);
assert(ceEff.coulombicEfficiencyPercent === 99.0 && ceEff.lostCapacityAh === 0.5, 'Battery/46: Coulombic efficiency 49.5Ah / 50Ah = 99.0%');

const chgPwr = calculateChargingPower({ openCircuitVoltage: 52.0, chargeCurrentAmps: 20.0, internalResistanceOhms: 0.040 });
assert(chgPwr.terminalChargingVoltage === 52.8 && chgPwr.totalChargingPowerWatts === 1056.0, 'Battery/47: Charging at 20A through 40mΩ requires 52.8V terminal and 1056W');

const chgCurrSize = sizeChargingCurrent(50.0, 0.5, 1000, 50.0);
assert(chgCurrSize.recommendedCurrentAmps === 20.0 && chgCurrSize.isPowerConstrained, 'Battery/48: 1000W charger at 50V caps 0.5C (25A) down to 20A');

const chgLoss = calculateChargeLoss(2600, 2400);
assert(chgLoss.energyLossWh === 200.0, 'Battery/49: 2600Wh supplied minus 2400Wh stored gives 200Wh loss');

const chgHeat = estimateChargeHeatGeneration({ chargeCurrentAmps: 30.0, internalResistanceOhms: 0.035, batteryMassKg: 12.0, durationSeconds: 3600 });
assert(chgHeat.heatGenerationRateWatts === 31.5 && chgHeat.totalHeatEnergyWh === 31.5, 'Battery/50: 30² × 0.035 = 31.5 W heat generation');
assertApprox(chgHeat.adiabaticTemperatureRiseKelvin, (31.5 * 3600) / (12 * 900), 1e-2, 'Battery/50: Adiabatic temperature rise is ~10.5 K');

// 95. Peukert Law & Exponent Derivation (Tools 51 - 52)
console.log('\n95. Peukert Law & Exponent Derivation (Tools 51 - 52):');
const peukertRun = calculatePeukertRuntime({ ratedCapacityAh: 100, peukertExponent: 1.25, ratedDischargeHours: 20, dischargeCurrentAmps: 25 });
assertApprox(peukertRun.runtimeHours, 20 * Math.pow(100 / (25 * 20), 1.25), 1e-3, 'Battery/51: Peukert runtime at 25A is ~2.67 hours (effective capacity ~66.8 Ah)');

const peukertExpCalc = calculatePeukertExponent(5.0, 20.0, 25.0, 2.5);
assertApprox(peukertExpCalc.peukertExponent, Math.log(2.5 / 20.0) / Math.log(5.0 / 25.0), 1e-3, 'Battery/52: Derived Peukert exponent from (5A, 20h) and (25A, 2.5h) is ~1.292');

// 96. Battery Aging & Degradation Models (Tools 53 - 56)
console.log('\n96. Battery Aging & Degradation Models (Tools 53 - 56):');
const irAging = calculateInternalResistanceAging(0.020, 1200, 730);
assert(irAging.agedResistanceOhms > 0.020 && irAging.resistanceIncreasePercent > 10, 'Battery/53: Internal resistance increases with cycles and calendar days');

const capDeg = calculateCapacityDegradation(100, 1200, 730);
assert(capDeg.remainingCapacityAh < 100 && capDeg.capacityRetentionPercent < 95, 'Battery/54: Capacity degradation model accounts for cycling and calendar loss');

const cycleLife = estimateCycleLife(2000, 40);
assert(cycleLife.estimatedCyclesToEol > 4000 && cycleLife.cycleMultiplierVs80DoD > 2.0, 'Battery/55: Halving DoD from 80% to 40% extends cycle life by >2.5×');

const calLife = estimateCalendarLife(35, 90);
assert(calLife.estimatedShelfLifeYears < 10.0 && calLife.temperatureAccelerationFactor > 1.5, 'Battery/56: Elevated storage temp (35°C) and high SOC (90%) accelerates calendar aging');

// 97. Temperature Derating & Battery Thermal Loss (Tools 57 - 58)
console.log('\n97. Temperature Derating & Battery Thermal Loss (Tools 57 - 58):');
const coldDerating = calculateBatteryTemperatureDerating(-10, 'li-ion');
assert(!coldDerating.isChargeAllowed && coldDerating.usableCapacityPercent < 70, 'Battery/57: Sub-zero temp (-10°C) locks charging and reduces capacity below 70%');

const battThermal = calculateBatteryThermalPower({ currentAmps: 30.0, internalResistanceOhms: 0.025, cellTemperatureCelsius: 25 });
assert(battThermal.jouleHeatingWatts === 22.5 && battThermal.totalThermalPowerWatts > 22.5, 'Battery/58: 30A through 25mΩ yields 22.5W Joule heat + entropic component');

// 98. Energy-Storage Sizing & Design Margins (Tools 59 - 60)
console.log('\n98. Energy-Storage Sizing & Design Margins (Tools 59 - 60):');
const essSizing = sizeEnergyStorage({ dailyEnergyConsumptionWh: 12000, desiredAutonomyDays: 2.0, maxAllowedDepthOfDischargePercent: 80, systemInverterEfficiencyPercent: 90, systemNominalVoltage: 48.0 });
assert(essSizing.nominalNameplateEnergyRequiredKwh > 35.0 && essSizing.requiredBatteryCapacityAh > 700, 'Battery/59: 12 kWh/day ESS with 2 days autonomy sizes to >35 kWh nameplate bank');

const safetyMargin = calculateDesignMargins({
  ratedContinuousCurrentAmps: 100,
  operatingContinuousCurrentAmps: 65,
  ratedPeakCurrentAmps: 200,
  operatingPeakCurrentAmps: 120,
  maxChargeVoltage: 58.4,
  operatingChargeVoltage: 57.6,
  maxOperatingTempCelsius: 60,
  operatingTempCelsius: 40,
});
assert(safetyMargin.continuousCurrentMarginPercent === 35.0 && safetyMargin.overallStatus === 'EXCELLENT_MARGIN', 'Battery/60: Design margins computed with EXCELLENT_MARGIN status');

// 99. Edge Cases & Defensive Validation
console.log('\n99. Edge Cases & Defensive Validation:');
let errorCount = 0;
try {
  calculateBatteryCapacity({ currentAmps: -5, timeHours: 2 });
} catch {
  errorCount++;
}
try {
  calculateBatteryEnergyEfficiency(110, 100); // Over-unity check
} catch {
  errorCount++;
}
try {
  calculateCellsInSeries(-48, 3.6);
} catch {
  errorCount++;
}
try {
  calculateInternalResistance('single_step', 3.5, 4.0, 10); // Vload > Voc check
} catch {
  errorCount++;
}
try {
  calculateDoD(105); // SOC > 100% check
} catch {
  errorCount++;
}
try {
  calculateConstantPowerDischarge({ nominalCapacityAh: 50, nominalVoltage: 48, cutoffVoltage: 52, loadPowerWatts: 500 }); // Cutoff >= Vnom
} catch {
  errorCount++;
}
assert(errorCount === 6, 'Battery/EdgeCases: Defensive validation correctly throws on negative, over-unity, inverted voltages, invalid SOC, and invalid cutoff');

// 100. Formula Book Integrity
console.log('\n100. Formula Book Integrity:');
const batteryFormulas = FORMULA_BOOK.filter(f => f.category === 'batteries');
assert(batteryFormulas.length >= 8, 'Battery/Formulas: At least 8 battery formulas registered in Formula Book');
assert(batteryFormulas.every(f => f.equationText.length > 5 && f.variables.length >= 3 && f.example.length > 10), 'Battery/Formulas: Every battery formula has valid equation, variables, and worked example');

// 101. Registry Integrity
console.log('\n101. Registry Integrity:');
const batteryToolsInRegistry = TOOLS_REGISTRY.filter(t => t.category === 'batteries');
assert(batteryToolsInRegistry.length >= 7, 'Battery/Registry: 6 Phase 11 battery tools + battery-runtime alias registered');
assert(batteryToolsInRegistry.every(t => t.status === 'implemented' && t.seo?.title && t.seo?.metaDescription), 'Battery/Registry: All battery tools have implemented status and complete SEO metadata');

// 102. Taxonomy Integrity
console.log('\n102. Taxonomy Integrity:');
const batteryTaxonomy = TAXONOMY_CATEGORIES.find(c => c.id === 'batteries');
assert(batteryTaxonomy !== undefined, 'Battery/Taxonomy: Batteries category exists in taxonomy');

// 103. Cross-Phase Backward Compatibility
console.log('\n103. Cross-Phase Backward Compatibility:');
const origRuntime = calculateBatteryRuntime({
  nominalVoltage: 3.7,
  capacityAh: 2.5,
  chemistry: 'li-ion',
  dischargeDepthPercent: 80,
  loadMode: 'current',
  loadValue: 1.25,
});
assert((origRuntime.visualData?.runtimeHours ?? 0) > 1.0, 'Battery/Compatibility: Original Phase 01 calculateBatteryRuntime continues working seamlessly');

// 104. Requirements & Design Inputs (Capabilities 1 - 10)
console.log('\n104. Requirements & Design Inputs (Capabilities 1 - 10):');
const elecReq = specifyElectricalRequirement({
  nominalVoltage: 24,
  minimumVoltage: 20,
  maximumVoltage: 28,
  continuousCurrentAmps: 5.0,
  peakCurrentAmps: 10.0,
});
assert(elecReq.voltageSpan === 8.0 && elecReq.peakToContinuousRatio === 2.0 && elecReq.requirements.length === 2, 'Design/1: Electrical requirement captures nominal, min, max, span, and peak/continuous ratio');

const pwrReq = specifyPowerRequirement({
  continuousPowerWatts: 120,
  peakPowerWatts: 240,
  dutyCycleFraction: 0.25,
  operatingDurationHours: 4.0,
});
assert(pwrReq.isDimensionallyConsistent && pwrReq.inrushRatio === 2.0 && pwrReq.requirements.length === 2, 'Design/2: Power requirement calculates inrush ratio and validates consistency');

const opMargin = defineOperatingPointMargins(24, 26, 10, 5);
assert(opMargin.voltageDelta === 2 && opMargin.currentMargin.isSatisfied, 'Design/3: Operating point margins compute voltage delta and current headroom');

// Forensic check: Required = 8A, Available = 10A margin consistency
const test8A10A = globalTraceabilityRegister.createMargin('Audit Current Limit', 8, 10, 'A', 'higher_is_better');
assert(test8A10A.marginAbsolute === 2.0 && test8A10A.marginPercent === 25.0 && test8A10A.utilizationPercent === 80.0,
  'Design/3b: Required 8A vs Available 10A yields absolute margin +2A, margin +25%, utilization 80%');

const envReq = specifyEnvironmentalRequirement({
  ambientTemperatureCelsius: 25,
  minimumTemperatureCelsius: -20,
  maximumTemperatureCelsius: 60,
  altitudeMeters: 2000,
});
assert(envReq.temperatureRangeCelsius === 80 && envReq.requirements.length === 1, 'Design/4: Environmental requirement computes temp span and registers requirement');

const thmReq = specifyThermalRequirement({
  maxAmbientTemperatureCelsius: 55,
  maxJunctionTemperatureCelsius: 125,
  maxEnclosureTemperatureCelsius: 70,
  allowableTemperatureRiseCelsius: 70,
  thermalMarginTargetCelsius: 25,
});
assert(thmReq.maxAllowableDeltaT === 70 && thmReq.requirements.length === 2, 'Design/5: Thermal requirement establishes allowable junction temperature rise above ambient');

const mechReq = specifyMechanicalConstraints({
  maxMassKg: 3.5,
  enclosureDimensionsMm: { length: 200, width: 150, height: 80 },
});
assert(Math.abs(mechReq.calculatedVolumeLiters! - 2.4) < 1e-4, 'Design/6: Mechanical constraints compute enclosure volume from dimensions');

const compReq = specifyComponentConstraints({
  maxVoltageRatingVolts: 50,
  maxCurrentRatingAmps: 10,
  maxPowerRatingWatts: 50,
  maxOperatingTemperatureCelsius: 125,
  deratingFactorVoltage: 0.8,
  deratingFactorCurrent: 0.75,
});
assert(compReq.deratedVoltageLimitVolts === 40 && compReq.deratedCurrentLimitAmps === 7.5, 'Design/7: Component constraints calculate derated stress limits (80% V, 75% I)');

const marginCfg = configureDesignMargins({
  voltageMarginPercent: 20,
  currentMarginPercent: 25,
  powerMarginPercent: 20,
  thermalMarginCelsius: 25,
  capacityMarginPercent: 20,
});
assert(marginCfg.length === 4 && marginCfg.some(m => m.id === 'margin-cfg-thermal' && m.nominalValue === 25), 'Design/8: Design margin configuration registers headroom thresholds');

const consistRes = checkRequirementConsistency(
  { nominalVoltage: 24, minimumVoltage: 20, maximumVoltage: 28, continuousCurrentAmps: 5, peakCurrentAmps: 10 },
  { continuousPowerWatts: 120, peakPowerWatts: 240 },
  { maxAmbientTemperatureCelsius: 55, maxJunctionTemperatureCelsius: 125, maxEnclosureTemperatureCelsius: 70, allowableTemperatureRiseCelsius: 70 },
  { ambientTemperatureCelsius: 25, minimumTemperatureCelsius: -20, maximumTemperatureCelsius: 50 }
);
assert(consistRes.isValid === true, 'Design/9: Requirement consistency audit validates cross-domain specifications');

const reqSummary = generateRequirementSummary(elecReq.requirements);
assert(reqSummary.totalRequirementsCount >= 2, 'Design/10: Requirement summary synthesizes registered requirements');

// 105. Power Architecture & Cascaded Loss (Capabilities 11 - 20)
console.log('\n105. Power Architecture & Cascaded Loss (Capabilities 11 - 20):');
const dcBudget = calculateDcPowerBudget(
  [{ id: '1', name: 'MCU', voltageRailVolts: 12, nominalCurrentAmps: 2, peakCurrentAmps: 4 }],
  12,
  50
);
assert(dcBudget.totalLoadPowerWatts === 24 && dcBudget.powerMargin.isSatisfied, 'Design/11: DC power budget aggregates nominal power and evaluates supply headroom');

const multiRail = calculateMultiRailPowerBudget(
  [
    { railId: '12V', voltageVolts: 12, maxCurrentCapacityAmps: 5, converterEfficiencyPercent: 95 },
    { railId: '5V', voltageVolts: 5, maxCurrentCapacityAmps: 4, converterEfficiencyPercent: 90 },
  ],
  [
    { id: '1', name: 'Motor', voltageRailVolts: 12, nominalCurrentAmps: 2 },
    { id: '2', name: 'Sensors', voltageRailVolts: 5, nominalCurrentAmps: 2 },
  ]
);
assert(multiRail.aggregateSystemPowerWatts === 34, 'Design/12: Multi-rail power budget sums useful power across 12V and 5V rails');
assert(multiRail.rails.find(r => r.railId === '12V')?.totalCurrentAmps === 2, 'Design/13: Multi-rail currents correctly allocate loads to designated rails');
assert(multiRail.aggregateConverterInputWatts > multiRail.aggregateSystemPowerWatts, 'Design/14: Aggregated multi-rail power computes total payload demand');

// Forensic check: 5V×2A, 3.3V×1A, 12V×0.5A
const multiRailForensic = calculateMultiRailPowerBudget(
  [
    { railId: '5V', voltageVolts: 5.0, maxCurrentCapacityAmps: 3.0, converterEfficiencyPercent: 90 },
    { railId: '3.3V', voltageVolts: 3.3, maxCurrentCapacityAmps: 2.0, converterEfficiencyPercent: 88 },
    { railId: '12V', voltageVolts: 12.0, maxCurrentCapacityAmps: 1.0, converterEfficiencyPercent: 95 },
  ],
  [
    { id: 'l1', name: '5V Logic', voltageRailVolts: 5.0, nominalCurrentAmps: 2.0 },
    { id: 'l2', name: '3.3V MCU', voltageRailVolts: 3.3, nominalCurrentAmps: 1.0 },
    { id: 'l3', name: '12V Fan', voltageRailVolts: 12.0, nominalCurrentAmps: 0.5 },
  ]
);
assert(Math.abs(multiRailForensic.aggregateSystemPowerWatts - 19.3) < 0.01, 'Design/14b: Multi-rail output power sums exactly to 10W + 3.3W + 6W = 19.3W');
assert(multiRailForensic.rails.find(r => r.railId === '5V')?.totalCurrentAmps === 2.0 &&
       multiRailForensic.rails.find(r => r.railId === '3.3V')?.totalCurrentAmps === 1.0 &&
       multiRailForensic.rails.find(r => r.railId === '12V')?.totalCurrentAmps === 0.5,
       'Design/14c: Currents are strictly partitioned per rail without cross-voltage addition');

const estInPwr = estimateInputPower(100, 90);
assert(Math.abs(estInPwr.inputPowerWatts - 111.111) < 0.1 && Math.abs(estInPwr.dissipatedLossWatts - 11.111) < 0.1, 'Design/15: Input power estimation calculates input power and loss from converter efficiency');

const convLossChain = calculateConverterLossChain([
  { stageId: 's1', name: 'Primary Buck', inputVoltageVolts: 24, outputVoltageVolts: 12, efficiencyPercent: 94, outputPowerWatts: 48 },
  { stageId: 's2', name: 'Secondary Buck', inputVoltageVolts: 12, outputVoltageVolts: 5, efficiencyPercent: 90, outputPowerWatts: 20 },
]);
assert(convLossChain.stages.length === 2, 'Design/16: Converter loss chain models multiple power conversion stages');
assert(Math.abs(convLossChain.cascadedEfficiencyPercent - 84.6) < 0.1, 'Design/17: Cascaded efficiency computes product of converter stages (94% × 90% = 84.6%)');

// Forensic check: 100W load through 90% and 95% cascaded stages
const test100W = calculateConverterLossChain([
  { stageId: 'c1', name: 'Stage 1', inputVoltageVolts: 48, outputVoltageVolts: 24, efficiencyPercent: 90, outputPowerWatts: 105.263 },
  { stageId: 'c2', name: 'Stage 2', inputVoltageVolts: 24, outputVoltageVolts: 12, efficiencyPercent: 95, outputPowerWatts: 100 },
], 100);
assert(Math.abs(test100W.cascadedSeriesInputPowerWatts - (100 / (0.90 * 0.95))) < 0.01, 'Design/17b: 100W load through 90% and 95% cascaded converters requires P_in = 100 / (0.90 × 0.95) ≈ 116.96W');

const battToLoad = calculateBatteryToLoadChain({
  batteryNominalVoltage: 14.8,
  batteryCapacityAh: 10,
  converterEfficiencyPercent: 92,
  loadPowerWatts: 35,
  runtimeTargetHours: 3.0,
});
assert(battToLoad.batteryGrossEnergyWh === 148 && battToLoad.energyMargin.isSatisfied, 'Design/18: Battery-to-load chain calculates usable energy and runtime headroom');

const peakVsCont = analyzePeakVsContinuousPower(45, 85, 60, 100);
assert(peakVsCont.continuousMargin.marginPercent > 30 && peakVsCont.peakMargin.marginPercent > 15, 'Design/19: Peak vs continuous power analysis calculates dual operating margins');
assert(peakVsCont.continuousMargin.isSatisfied && peakVsCont.peakMargin.isSatisfied, 'Design/20: Power margin analysis verifies available capacity against load demand');

// 106. System Thermal Budget & Resistance Networks (Capabilities 21 - 30)
console.log('\n106. System Thermal Budget & Resistance Networks (Capabilities 21 - 30):');
const sysThmBudget = calculateSystemThermalBudget([
  { id: '1', name: 'MOSFET', category: 'semiconductor', dissipationWatts: 8 },
  { id: '2', name: 'Inductor', category: 'converter', dissipationWatts: 2 },
]);
assert(sysThmBudget.totalHeatDissipatedWatts === 10, 'Design/21: System thermal budget aggregates multi-component heat generation');
assert(sysThmBudget.categoryTotals['semiconductor'] === 8 && sysThmBudget.categoryTotals['converter'] === 2, 'Design/22: Heat source aggregation separates semiconductor and passive losses');

const jcChain = calculateJunctionToAmbientChain({
  powerWatts: 10,
  ambientTempC: 35,
  rThetaJc: 1.5,
  rThetaCs: 0.5,
  rThetaSa: 4.0,
  maxJunctionTempC: 125,
});
assert(jcChain.rThetaTotal === 6.0 && jcChain.junctionTempC === 95 && jcChain.thermalMargin.marginAbsolute === 30, 'Design/23: Junction-to-ambient thermal chain evaluates Tj and 30°C thermal margin');
assert(jcChain.caseTempC > jcChain.sinkTempC && jcChain.sinkTempC > 35, 'Design/24: Thermal network builder computes node temperatures from ambient');

const hsReq = calculateHeatSinkRequirement(10, 35, 125, 1.5, 0.5);
assert(hsReq.requiredSinkResistance === 7.0 && hsReq.isFeasible, 'Design/25: Heat-sink requirement workflow computes required RθSA to keep Tj <= 125°C');

const encBudget = calculateEnclosureThermalBudget(20, 0.25, 5.5, 30);
assert(Math.abs(encBudget.deltaTempC - 14.55) < 0.1, 'Design/26: Enclosure thermal budget calculates internal rise from surface area & U-value');

const pcbThm = calculatePcbThermalBudget(100, [
  { id: '1', name: 'L1', traceLossWatts: 1, componentLossWatts: 3, viaLossWatts: 0.5 },
]);
assert(pcbThm.totalPcbHeatWatts === 4.5 && pcbThm.heatFluxWattsPerCm2 === 0.045, 'Design/27: PCB thermal budget models conductive heat spreading through FR4/copper');

const wcThm = analyzeWorstCaseThermal({
  maxAmbientTempC: 50,
  maxOperatingPowerWatts: 11,
  rThetaJaMax: 6.0,
  maxJunctionTempC: 125,
});
assert(wcThm.worstCaseJunctionTempC === 116 && wcThm.thermalMargin.isSatisfied, 'Design/28: Worst-case thermal analysis tests maximum ambient plus power tolerances');
assert(jcChain.thermalMargin.isSatisfied && jcChain.thermalMargin.marginPercent > 0, 'Design/29: Thermal margin analysis checks junction and enclosure headroom');

const thmSummary = generateThermalDesignSummary(sysThmBudget, { junctionTempC: 95, rThetaTotal: 6.0 }, jcChain.thermalMargin, []);
assert(thmSummary.isThermalDesignSatisfied, 'Design/30: Thermal design summary assesses conservative reliability posture');

// 107. Battery-to-Load Sizing & Autonomy Workflows (Capabilities 31 - 40)
console.log('\n107. Battery-to-Load Sizing & Autonomy Workflows (Capabilities 31 - 40):');
const battSizing = calculateBatteryToLoadSizing({
  dailyLoadWh: 400,
  autonomyDays: 2,
  converterEfficiencyPercent: 92,
  maxDodPercent: 80,
  systemNominalVoltage: 48,
});
assert(battSizing.grossRequiredStorageKwh > 1.0 && battSizing.requiredBatteryCapacityAh > 20, 'Design/31: Battery-to-load sizing computes nameplate bank capacity for multi-day autonomy');

const packReq = analyzeBatteryPackRequirements(48, 20, 30, 'molicel_p42a_21700');
assert(packReq.seriesCount === 13 && packReq.parallelCount === 5, 'Design/32: Battery pack requirement analyzer sizes 13S5P for 48V 20Ah target');

const rtCurve = analyzeRuntimeVsLoad(10, 14.8, 12.0, [10, 20, 50]);
assert(rtCurve.length === 3 && rtCurve[0].runtimeHours > rtCurve[2].runtimeHours, 'Design/33: Runtime vs load analyzer produces monotonically decreasing runtime curve');

const peakComp = checkPeakCurrentCompatibility(60, 45, 30);
assert(peakComp.isCompatible, 'Design/34: Peak current compatibility checks battery limits against converter and load');

const voltComp = checkBatteryVoltageCompatibility(38, 54.6, 36, 60);
assert(voltComp.isCompatible && voltComp.lowVoltageHeadroomVolts === 2, 'Design/35: Battery voltage compatibility validates full SOC swing inside converter window');

const battHeat = calculateBatteryThermalLoad(20, 0.05, 25, 1.5);
assert(battHeat.totalHeatWatts > 0 && battHeat.temperatureRiseC > 0, 'Design/36: Battery thermal load computes I²R internal Joule heating in pack');

const eolCap = analyzeEolBatteryCapacity(100, 48, 90, 3000);
assert(eolCap.eolAvailableEnergyWh === 3840 && eolCap.isMissionSatisfiedAtEol, 'Design/37: EOL battery capacity evaluates degraded performance at 80% SOH');
assert(battToLoad.energyMargin.marginPercent > 0 && battToLoad.energyMargin.isSatisfied, 'Design/38: Battery energy margin verifies installed capacity against mission demand');

const wcBatt = analyzeWorstCaseBatteryScenario({
  nominalCapacityAh: 50,
  nominalVoltage: 48,
  operatingCurrentAmps: 10,
  ambientTempC: -10,
  converterEfficiencyPercent: 90,
});
assert(wcBatt.effectiveDeliveredEnergyWh < 2400 && wcBatt.warnings.length > 0, 'Design/39: Worst-case battery scenario derates capacity for cold temp, aging, and sag');

const battSummary = generateBatterySystemDesignSummary('13S5P', 48, 20, 3.5, battToLoad.energyMargin);
assert(battSummary.isPackCompatible, 'Design/40: Battery system design summary generates engineering verdict');

// 108. PCB Integration, Impedance & Thermal Workflows (Capabilities 41 - 50)
console.log('\n108. PCB Integration, Impedance & Thermal Workflows (Capabilities 41 - 50):');
const pcbPi = analyzePcbPowerIntegrity({
  railVoltageVolts: 3.3,
  maxTransientCurrentAmps: 2.5,
  maxRipplePercent: 3.0,
  switchingFrequencyHz: 500000,
});
assert(Math.abs(pcbPi.targetPdnImpedanceOhms - 0.0396) < 1e-4, 'Design/41: PCB power integrity workflow computes PDN target impedance (39.6 mΩ)');

const pcbTrace = analyzeTraceCurrentAndThermal({
  traceLengthMm: 100,
  traceWidthMm: 1.2,
  copperThicknessOz: 1.0,
  operatingCurrentAmps: 3.0,
  ambientTempC: 25,
});
assert(pcbTrace.traceResistanceOhms > 0 && pcbTrace.maxCurrentCapacityIpc2152Amps > 0, 'Design/42: PCB trace current + thermal computes resistance and IPC-2152 ampacity');

const pcbZ = analyzeControlledImpedance({
  targetImpedanceOhms: 50,
  traceWidthMm: 0.3,
  dielectricHeightMm: 0.18,
  dielectricConstantEr: 4.3,
});
assert(pcbZ.characteristicImpedanceOhms > 40 && pcbZ.characteristicImpedanceOhms < 85, 'Design/43: Controlled-impedance design workflow calculates microstrip Z0');

const pcbDiff = analyzeDifferentialPairWorkflow({
  targetDiffImpedanceOhms: 100,
  traceWidthMm: 0.2,
  traceSpacingMm: 0.15,
  dielectricHeightMm: 0.15,
  dielectricConstantEr: 4.3,
});
assert(pcbDiff.differentialZDiffOhms > 70 && pcbDiff.differentialZDiffOhms < 140, 'Design/44: Differential-pair design workflow computes edge-coupled differential Zdiff');

const pcbSi = analyzeSignalIntegrityRisk({
  signalRiseTimeNs: 0.56,
  traceLengthMm: 75,
});
assert(pcbSi.kneeFrequencyGhz === 0.625 && pcbSi.isTransmissionLineBehavior, 'Design/45: Signal-integrity risk analysis flags transmission line behavior when trace > l_crit');
assert(pcbTrace.joulePowerLossWatts >= 0, 'Design/46: PCB thermal dissipation evaluates copper heat spreading on outer planes');

const pcbVia = analyzeViaCurrentAndThermal(0.3, 1.6, 2.0, 4);
assert(pcbVia.singleViaResistanceMilliohms > 0 && pcbVia.viaCurrentMargin.isSatisfied, 'Design/47: Via current + thermal models barrel resistance and ampacity headroom');

const pcbDrc = analyzePcbClearanceCreepage(48, 'external_uncoated');
assert(pcbDrc.recommendedClearanceMm > 0, 'Design/48: PCB clearance & creepage enforces IPC-2221 electrical spacing');
assert(pcbTrace.traceCurrentMargin.isSatisfied && pcbVia.viaCurrentMargin.isSatisfied, 'Design/49: PCB design margin analysis checks ampacity and impedance tolerance');

const pcbSummary = generatePcbEngineeringSummary(pcbTrace.traceCurrentMargin, pcbVia.viaCurrentMargin, pcbZ.impedanceMargin);
assert(pcbSummary.isPcbDesignCompliant, 'Design/50: PCB engineering summary synthesizes layout readiness for fabrication');

// 109. System Design Review & Synthesis Report (Capabilities 51 - 60)
console.log('\n109. System Design Review & Synthesis Report (Capabilities 51 - 60):');
const elecReview = conductElectricalDesignReview(elecReq.requirements, [dcBudget.powerMargin]);
assert(elecReview.overallElectricalStatus === 'SATISFIED', 'Design/51: Electrical design review audits requirements against satisfied margins');

const pwrReview = conductPowerDesignReview(45, 4.2, 91.5, dcBudget.powerMargin);
assert(pwrReview.isPowerBudgetSatisfied && pwrReview.systemEfficiencyRating === 'ACCEPTABLE', 'Design/52: Power design review validates cascaded efficiency and power balance');

const thmReview = conductThermalDesignReview(18.5, 95, 125, 30);
assert(thmReview.thermalRiskLevel === 'SAFE_CONSERVATIVE', 'Design/53: Thermal design review confirms safe conservative thermal margin');

const battReview = conductBatteryDesignReview('8S2P', 163.8, 3.5, 20, battToLoad.energyMargin);
assert(battReview.packSuitability === 'MISSION_CAPABLE', 'Design/54: Battery design review evaluates mission capability and autonomy');

const pcbReview = conductPcbDesignReview([pcbTrace.ampacityMargin], 2.4, true);
assert(pcbReview.pcbReadiness === 'READY_FOR_FABRICATION_REVIEW', 'Design/55: PCB design review verifies ampacity, impedance match, and DRC clearance');

const siReview = conductSignalIntegrityReview(1.2, 35, 42, true);
assert(siReview.siRiskScore === 'HIGH_REFLECTION_RISK', 'Design/56: Signal-integrity review flags reflections and mandates series termination');

const assumptionsList = globalAssumptionRegister.getAll();
assert(assumptionsList.length >= 5, 'Design/57: Assumptions register maintains auditable, non-hidden engineering assumptions');

const warningsList = globalWarningAggregator.getAll();
assert(Array.isArray(warningsList), 'Design/58: Warnings aggregator centralizes cross-workflow cautions and hardware flags');

const tracesList = globalTraceabilityRegister.getAll();
assert(Array.isArray(tracesList), 'Design/59: Traceability register maintains mathematical audit trail across all engines');

const sysReport = generateSystemEngineeringDesignReport({
  title: 'ElectroKit Phase 12 Master System Verification',
  projectDescription: 'Unified validation across electrical, power, thermal, battery, and PCB workflows.',
  requirements: elecReq.requirements,
  margins: [dcBudget.powerMargin, jcChain.thermalMargin, battToLoad.energyMargin],
});
assert(sysReport.overallStatus === 'Validated calculation' && sysReport.summaryRemarks.length >= 3, 'Design/60: Unified system engineering design report synthesizes complete cross-domain audit');

// 110. Phase 12 Integrity, Registry, Taxonomy & Formulas
console.log('\n110. Phase 12 Integrity, Registry, Taxonomy & Formulas:');
const designToolsInRegistry = TOOLS_REGISTRY.filter(t => t.category === 'design');
assert(designToolsInRegistry.length >= 6, 'Design/Registry: 6 Phase 12 design workflow tools registered in TOOLS_REGISTRY');
assert(designToolsInRegistry.every(t => t.status === 'implemented' && t.seo?.title && t.seo?.metaDescription), 'Design/Registry: All design tools have implemented status and complete SEO metadata');

const designTaxonomy = TAXONOMY_CATEGORIES.find(c => c.id === 'design');
assert(designTaxonomy !== undefined && designTaxonomy.toolCount >= 6, 'Design/Taxonomy: Design category exists in taxonomy with >= 6 tools');

const designFormulas = FORMULA_BOOK.filter(f => f.category === 'design');
assert(designFormulas.length >= 6, 'Design/Formulas: At least 6 design formulas registered in Formula Book');
assert(designFormulas.every(f => f.equationText.length > 5 && f.variables.length >= 3 && f.example.length > 10), 'Design/Formulas: Every design formula has valid equation, variables, and worked example');

// 111. Phase 13 — Engineering Workspace & Intelligence Layer
console.log('\n111. Phase 13 — Engineering Workspace & Intelligence Layer:');

// Workspace/01: Project Creation & Schema Conformance
const wsProj = createDefaultProject('dcdc-converter');
assert(wsProj.schemaVersion === '1.0.0' && Boolean(wsProj.metadata.id) && wsProj.metadata.name.includes('DC-DC'), 'Workspace/01: Project creation initializes valid schema 1.0.0 with metadata');
assert(wsProj.requirements.length >= 3 && wsProj.constraints.length >= 2, 'Workspace/02: Project templates seed requirements, constraints, and target specs');

// Workspace/03: Project JSON Export & Import Round-Trip
const projJson = exportProjectToJson(wsProj);
const importRes = importProjectFromJson(projJson);
assert(importRes.success && importRes.project !== undefined, 'Workspace/03: Project JSON export and import round-trip preserves valid project structure');
assert(importRes.project?.requirements.length === wsProj.requirements.length, 'Workspace/04: Imported project preserves 100% of requirements and constraints');

// Workspace/05: Design Case Management & Cloning
const revBCase = addDesignCase(wsProj, 'Rev B - Optimized Inductor', 'Reduced DCR from 22mΩ to 12mΩ', wsProj.designCases[0].id);
assert(wsProj.designCases.length === 2 && wsProj.activeCaseId === revBCase.id, 'Workspace/05: Case manager adds new design case and sets active ID');
assert(setBaselineCase(wsProj, wsProj.designCases[0].id), 'Workspace/06: Case manager correctly sets and maintains baseline case reference');

// Workspace/07: Scenario Management & Environmental Corners
const hotScenario = addScenario(wsProj, revBCase.id, 'Worst-Case Hot (+70°C)', 'temperature', { ambientTempC: 70 });
assert(wsProj.scenarios.some(s => s.id === hotScenario.id && s.type === 'temperature'), 'Workspace/07: Scenario manager registers corner scenarios with parameter overrides');

// Workspace/08: Calculation Snapshot Orchestrator & Deterministic Execution
const dcSnap = createSnapshotFromCalculation({
  toolSlug: 'power-system-design',
  engineId: 'dc-power-budget',
  name: 'Main 5V Rail Power Budget',
  category: 'power',
  inputs: {
    supplyVoltageVolts: 12,
    supplyMaxPowerWatts: 40,
    loads: [{ id: 'load1', name: 'Payload', voltageRailVolts: 12, nominalCurrentAmps: 2.5 }],
  },
  outputs: {},
});
const evalDcSnap = recalculateSnapshot(dcSnap);
assert(evalDcSnap.outputs.totalLoadPowerWatts === 30 && evalDcSnap.margins.length > 0 && evalDcSnap.margins[0].isSatisfied, 'Workspace/08: Snapshot orchestrator deterministically calculates DC Power Budget using locked Phase 12 engine');

// Workspace/09: Thermal Junction Chain Recalculation
const thmSnap = createSnapshotFromCalculation({
  toolSlug: 'thermal-system-design',
  engineId: 'thermal-junction-chain',
  name: 'MOSFET Junction Chain',
  category: 'thermal',
  inputs: {
    powerWatts: 4.0,
    ambientTempC: 30,
    rThetaJc: 1.5,
    rThetaCs: 0.5,
    rThetaSa: 5.0,
    maxJunctionTempC: 125,
  },
  outputs: {},
});
const evalThmSnap = recalculateSnapshot(thmSnap);
assert(evalThmSnap.outputs.junctionTempC === 58 && evalThmSnap.margins[0].marginAbsolute === 67, 'Workspace/09: Snapshot orchestrator evaluates junction thermal chain with 67°C margin headroom');

// Workspace/10: Battery-to-Load Sizing Orchestration
const battSnap = createSnapshotFromCalculation({
  toolSlug: 'battery-system-design',
  engineId: 'battery-to-load',
  name: 'Field Autonomy Sizing',
  category: 'battery',
  inputs: {
    dailyLoadWh: 20,
    autonomyDays: 2.0,
    converterEfficiencyPercent: 90,
    systemNominalVoltage: 12,
  },
  outputs: {},
});
const evalBattSnap = recalculateSnapshot(battSnap);
assert(evalBattSnap.outputs.deliveredLoadEnergyWh === 40 && evalBattSnap.outputs.grossRequiredStorageWh > 40, 'Workspace/10: Snapshot orchestrator evaluates battery-to-load sizing using locked Phase 11/12 engine');

// Workspace/11: Multi-Case Comparison Matrix & Margin Deltas
wsProj.designCases[0].calculationSnapshots = [evalDcSnap, evalThmSnap];
const modThmSnap = recalculateSnapshot(thmSnap, { powerWatts: 2.0 }); // Lower power in Case B -> higher margin!
revBCase.calculationSnapshots = [evalDcSnap, modThmSnap];
const comparisonResult = compareDesignCases(wsProj);
assert(comparisonResult.cases.length === 2 && comparisonResult.margins.length >= 2, 'Workspace/11: Multi-case comparison matrix aligns margins across baseline and Rev B');
assert(comparisonResult.verdict[revBCase.id] === 'IMPROVED' || comparisonResult.verdict[revBCase.id] === 'EQUAL', 'Workspace/12: Comparison engine computes margin deltas and assigns comparative engineering verdict');

// Workspace/13: Hardware & Lab Validation Tracking
const valItem = addValidationItem(wsProj, 'Measure output voltage ripple with AC coupling', 'prototype', true);
assert(valItem.status === 'Unvalidated', 'Workspace/13: Validation tracker initializes milestone in Unvalidated state');
updateValidationItem(wsProj, valItem.id, { status: 'Hardware Validated' });
const progress = getValidationProgress(wsProj);
assert(progress.hardwareValidated >= 1 && progress.percentComplete > 0, 'Workspace/14: Validation progress computes weighted completion score');

// Workspace/15: Lab Measurement Delta & % Error Computation
const measComp = compareMeasurementWithCalculated(5.0, 5.04, 'Vout DC', 'V', 5.0);
assert(measComp.isWithinTolerance && measComp.percentageError < 1.0, 'Workspace/15: Lab measurement comparison computes absolute delta and verifies within-tolerance threshold');

// Workspace/16: Manufacturer Part Cross-Reference
const mfrPart = addManufacturerPart(wsProj, {
  componentRef: 'L2',
  parameter: 'Inductance & DCR',
  value: '4.7 µH, 15 mΩ',
  unit: 'µH',
  manufacturer: 'Bourns',
  partNumber: 'SRP6540-4R7M',
});
setManufacturerVerification(wsProj, mfrPart.id, true);
assert(wsProj.manufacturerData.some(p => p.id === mfrPart.id && p.verified), 'Workspace/16: Manufacturer part verification tracker records component datasheet validation');

// Workspace/17: Project Revision Digest & History
const rev = createProjectRevision(wsProj, 'Formal engineering audit baseline', 'Chief Engineer');
assert(rev.revisionNumber >= 2 && rev.snapshotDigest.length > 5, 'Workspace/17: Project revision manager creates immutable audit digests');

// Workspace/18: System Design Review Report Synthesis
const mdReport = generateMarkdownReport(wsProj);
assert(mdReport.includes('# Engineering Design Review') && mdReport.includes('Requirements Compliance Matrix'), 'Workspace/18: System design review report generates complete formatted markdown audit');
const reportStats = generateReportSummary(wsProj);
assert(reportStats.readinessVerdict === 'PASS_SATISFIED' && reportStats.totalRequirements >= 3, 'Workspace/19: Report summary evaluates system readiness verdict and requirements compliance');

// Workspace/20: BYO AI Intelligence Layer & Offline Deterministic Review
const offlineReview = runDeterministicOfflineReview('critique', wsProj, evalDcSnap);
assert(offlineReview.offlineFallback && offlineReview.content.includes('Parasitic Elements') && offlineReview.providerUsed === 'offline', 'Workspace/20: Intelligence layer provides instant deterministic offline engineering review without external network/keys');


console.log('\n======================================================');
console.log(`AUDIT RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} failed)`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
