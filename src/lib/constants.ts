/**
 * Centralized Physical and RF Engineering Constants
 * 
 * Sources:
 * - CODATA 2018 Recommended Values of the Fundamental Physical Constants
 * - IEEE Standard 145-2013 / IEEE Standard 211-1997
 * - ITU-R Recommendations (ITU-R P.525-4)
 */

/** Speed of light in vacuum (c): exactly 299,792,458 m/s (CODATA 2018) */
export const SPEED_OF_LIGHT = 299792458; // m/s

/** Boltzmann constant (k_B): exactly 1.380649 × 10^-23 J/K (CODATA 2018) */
export const BOLTZMANN_CONSTANT = 1.380649e-23; // J/K

/** 
 * Standard reference noise temperature (T0): 290 K (16.85 °C).
 * IEEE standard convention used for receiver noise figure and noise temperature definitions.
 * At T0 = 290 K: k * T0 = 4.003882 × 10^-21 W/Hz = -173.977 dBm/Hz (conventionally rounded to -174 dBm/Hz).
 */
export const STANDARD_NOISE_TEMPERATURE_KELVIN = 290.0; // K

/** Standard room temperature (T_room): 293.15 K (20.0 °C) */
export const ROOM_TEMPERATURE_KELVIN = 293.15; // K

/** Vacuum electric permittivity (ε0): 8.8541878128 × 10^-12 F/m (CODATA 2018) */
export const VACUUM_PERMITTIVITY = 8.8541878128e-12; // F/m

/** Vacuum magnetic permeability (μ0): 1.25663706212 × 10^-6 H/m (CODATA 2018) */
export const VACUUM_PERMEABILITY = 1.25663706212e-6; // H/m

/** 
 * Intrinsic characteristic impedance of free space (η0 = √(μ0/ε0)): 
 * approximately 376.730313668 Ω (often approximated as 120π ≈ 376.991 Ω).
 */
export const FREE_SPACE_IMPEDANCE = 376.730313668; // Ω

/** Elementary charge (e): exactly 1.602176634 × 10^-19 C (CODATA 2018) */
export const ELEMENTARY_CHARGE = 1.602176634e-19; // C

/** Planck constant (h): exactly 6.62607015 × 10^-34 J·s (CODATA 2018) */
export const PLANCK_CONSTANT = 6.62607015e-34; // J·s

/** Thermal noise density at standard reference temperature T0 (290 K) in dBm/Hz */
export const THERMAL_NOISE_FLOOR_1HZ_DBM = -173.977; // dBm/Hz (-174 dBm/Hz approx)

/** Gain of an ideal half-wave dipole antenna over an isotropic radiator in dBi */
export const DIPOLE_GAIN_DBI = 2.15; // dBi (ERP = EIRP - 2.15 dB)

/**
 * PCB & Metallurgy Engineering Constants
 * Sources:
 * - IPC-2221B / IPC-2152 Generic Standard on Printed Board Design
 * - IACS (International Annealed Copper Standard) 100% conductivity at 20°C
 * - CRC Handbook of Chemistry and Physics
 */

/** Resistivity of pure annealed electrolytic copper at 20°C (ρ20): 1.7241 × 10^-8 Ω·m (IACS 100%) */
export const COPPER_RESISTIVITY_20C = 1.7241e-8; // Ω·m

/** Temperature coefficient of resistance for copper at 20°C (α20): 0.00393 / °C */
export const COPPER_TEMP_COEFF_20C = 0.00393; // 1/°C

/** Thermal conductivity of electrolytic copper at 20°C: 398 W/(m·K) */
export const COPPER_THERMAL_CONDUCTIVITY = 398; // W/(m·K)

/** Standard density of copper: 8,940 kg/m³ (8.94 g/cm³) */
export const COPPER_DENSITY_KG_M3 = 8940; // kg/m³

/** Nominal thickness of 1 oz/ft² copper foil: 34.8 µm (1.37 mil) */
export const COPPER_THICKNESS_1OZ_METERS = 3.4798e-5; // ~34.8 µm

/** Typical thermal conductivity of standard FR-4 dielectric substrate: 0.25 W/(m·K) */
export const FR4_THERMAL_CONDUCTIVITY = 0.25; // W/(m·K)

/** Relative dielectric permittivity of standard FR-4 at 1 GHz (nominal): 4.20 */
export const FR4_RELATIVE_PERMITTIVITY_NOMINAL = 4.20;

/** Typical loss tangent (dissipation factor tan δ) of standard FR-4 at 1 GHz: 0.020 */
export const FR4_LOSS_TANGENT_NOMINAL = 0.020;
