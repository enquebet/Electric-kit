import { Category } from '../types/tool';

export const CATEGORIES: Category[] = [
  {
    id: 'circuit',
    letter: 'A',
    name: 'Circuit Calculators',
    description: 'Fundamental circuit theorems, resistive networks, AC/DC analysis, and transient response.',
    iconName: 'Zap',
    toolCount: 18,
  },
  {
    id: 'electrical',
    letter: 'B',
    name: 'Electrical Engineering',
    description: 'High-power AC/DC systems, three-phase star/delta, transformers, cable sizing, and power factor.',
    iconName: 'Cpu',
    toolCount: 14,
  },
  {
    id: 'power',
    letter: 'C',
    name: 'Power Electronics',
    description: 'Switched-mode power supplies (Buck, Boost, Buck-Boost, Flyback), inductors, MOSFETs, and rectifiers.',
    iconName: 'Activity',
    toolCount: 15,
  },
  {
    id: 'components',
    letter: 'D',
    name: 'Components & Actives',
    description: 'Semiconductor characteristics, BJT bias, MOSFET switching, diodes, Zeners, and op-amp topologies.',
    iconName: 'Layers',
    toolCount: 16,
  },
  {
    id: 'batteries',
    letter: 'E',
    name: 'Batteries & Energy',
    description: 'Battery pack sizing, Peukert runtime, C-rate, chemistry derating, charging circuits, and solar power.',
    iconName: 'BatteryCharging',
    toolCount: 12,
  },
  {
    id: 'pcb',
    letter: 'F',
    name: 'PCB Engineering',
    description: 'IPC-2152 trace width, via thermal ampacity, microstrip impedance, and copper resistance.',
    iconName: 'Box',
    toolCount: 12,
  },
  {
    id: 'rf',
    letter: 'G',
    name: 'RF & Communications',
    description: 'Electromagnetic propagation, dB/dBm/dBW, antenna lengths, link budget, and transmission lines.',
    iconName: 'Radio',
    toolCount: 14,
  },
  {
    id: 'digital',
    letter: 'H',
    name: 'Digital Electronics',
    description: 'Radix converters, two\'s complement, logic gates, Boolean minimization, and Karnaugh maps.',
    iconName: 'Binary',
    toolCount: 12,
  },
  {
    id: 'embedded',
    letter: 'I',
    name: 'Embedded Systems',
    description: 'Baud rate generators, timer prescalers, PWM registers, ADC/DAC resolution, I2C/SPI bus pullups.',
    iconName: 'Terminal',
    toolCount: 14,
  },
  {
    id: 'thermal',
    letter: 'J',
    name: 'Thermal Engineering',
    description: 'Thermal fundamentals, semiconductor junction/case (Tj/Tc), heatsink sizing, TIM interface, PCB spreading, and transient reliability.',
    iconName: 'Flame',
    toolCount: 60,
  },
  {
    id: 'signals',
    letter: 'K',
    name: 'Signals & Systems',
    description: 'RMS, crest factor, Fourier harmonics, sampling rate, Nyquist frequency, and filter attenuation.',
    iconName: 'BarChart2',
    toolCount: 12,
  },
  {
    id: 'math',
    letter: 'L',
    name: 'Engineering Mathematics',
    description: 'Complex phasor conversions, matrix operations, scientific & engineering prefixes, and decibels.',
    iconName: 'Sigma',
    toolCount: 11,
  },
  {
    id: 'reference',
    letter: 'M',
    name: 'Component Reference',
    description: 'Resistor color bands, SMD codes, ceramic capacitor codes, EIA standard series tables, and symbols.',
    iconName: 'BookOpen',
    toolCount: 15,
  },
  {
    id: 'formulas',
    letter: 'N',
    name: 'Formula Book',
    description: 'Searchable engineering formula repository with variables, SI units, and interactive derivations.',
    iconName: 'BookMarked',
    toolCount: 25,
  },
  {
    id: 'design',
    letter: 'O',
    name: 'Engineering Design & Workflows',
    description: 'Multi-domain engineering workflows: requirements capture, cascaded power budgets, system thermal networks, battery-to-load sizing, PCB integration, and design reviews.',
    iconName: 'Workflow',
    toolCount: 6,
  },
];

export interface PlannedToolEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  implemented: boolean;
}

export const COMPLETE_TAXONOMY_TOOLS: PlannedToolEntry[] = [
  // A. Circuit Calculators
  { id: 'ohms-law', name: "Ohm's Law", category: 'circuit', description: 'Calculate V, I, R, and P with standard resistor matching', implemented: true },
  { id: 'electrical-power', name: 'Electrical Power', category: 'circuit', description: 'Active power, Joule heating I²R, and energy consumption', implemented: true },
  { id: 'voltage-divider', name: 'Voltage Divider', category: 'circuit', description: 'Loaded & unloaded output voltage and Thévenin impedance', implemented: true },
  { id: 'current-divider', name: 'Current Divider', category: 'circuit', description: 'Parallel current distribution and conductance branches', implemented: false },
  { id: 'series-parallel-resistors', name: 'Series & Parallel Resistors', category: 'circuit', description: 'Equivalent resistance of complex network combinations', implemented: false },
  { id: 'series-parallel-capacitors', name: 'Series & Parallel Capacitors', category: 'circuit', description: 'Equivalent capacitance and breakdown voltage ratings', implemented: false },
  { id: 'series-parallel-inductors', name: 'Series & Parallel Inductors', category: 'circuit', description: 'Equivalent inductance and mutual coupling', implemented: false },
  { id: 'rc-circuit', name: 'RC Circuit Transient', category: 'circuit', description: 'Time constant τ, charging/discharging curves and cutoff frequency', implemented: false },
  { id: 'rl-circuit', name: 'RL Circuit Transient', category: 'circuit', description: 'Inductive time constant L/R and flyback voltage spike', implemented: false },
  { id: 'rlc-resonant', name: 'RLC Resonance Calculator', category: 'circuit', description: 'Resonant frequency, Q factor, bandwidth, and damping ratio', implemented: false },
  { id: 'kirchhoffs-laws', name: "Kirchhoff's Node & Mesh Solver", category: 'circuit', description: 'Simultaneous KCL and KVL linear system solver', implemented: false },
  { id: 'thevenin-norton', name: 'Thévenin & Norton Equivalent', category: 'circuit', description: 'Two-terminal active network equivalent generator', implemented: false },

  // B. Electrical Engineering
  { id: 'ac-power', name: 'AC Power (Single & 3-Phase)', category: 'electrical', description: 'Active, reactive, apparent power and power factor correction', implemented: true },
  { id: 'star-delta', name: 'Star-Delta (Wye-Delta) Converter', category: 'electrical', description: '3-phase network impedance transformation', implemented: false },
  { id: 'transformer-calculator', name: 'Transformer Sizing', category: 'electrical', description: 'Turns ratio, voltage, current, and core flux density', implemented: false },
  { id: 'cable-sizing', name: 'Electrical Cable Sizing & Ampacity', category: 'electrical', description: 'Conductor cross-section according to NEC/IEC standards', implemented: false },
  { id: 'voltage-drop-feeder', name: 'Long Line Voltage Drop', category: 'electrical', description: 'Feeder percentage drop, resistance, and wire gauge', implemented: false },

  // C. Power Electronics
  { id: 'buck-converter', name: 'Buck Converter Designer', category: 'power', description: 'Step-down inductor ripple, output capacitor ESR, and duty cycle', implemented: false },
  { id: 'boost-converter', name: 'Boost Converter Designer', category: 'power', description: 'Step-up switch sizing, diode peak current, and CCM/DCM boundary', implemented: false },
  { id: 'buck-boost', name: 'Inverting Buck-Boost Calculator', category: 'power', description: 'Polarity-inverting DC-DC switching regulator equations', implemented: false },
  { id: 'flyback-transformer', name: 'Flyback Transformer Sizing', category: 'power', description: 'Primary magnetizing inductance and air-gap energy storage', implemented: false },

  // D. Components
  { id: 'resistor-color-code', name: 'Resistor Color Code', category: 'components', description: '4, 5, and 6-band IEC 60062 visual decoder and reverse lookup', implemented: true },
  { id: 'led-resistor', name: 'LED Resistor Calculator', category: 'components', description: 'Ballast resistor, E24 standard matching, wattage, and efficiency', implemented: true },
  { id: 'zener-regulator', name: 'Zener Diode Regulator', category: 'components', description: 'Series resistor and regulation range against load variation', implemented: false },
  { id: 'bjt-transistor-bias', name: 'BJT Transistor Bias Sizing', category: 'components', description: 'Common emitter voltage divider bias Q-point stability', implemented: false },
  { id: 'opamp-inverting-noninverting', name: 'Op-Amp Gain Calculator', category: 'components', description: 'Inverting, non-inverting, summing, and difference amplifier gain', implemented: false },

  // E. Batteries & Energy Storage
  { id: 'battery-fundamentals', name: 'Battery Fundamentals & Capacity / Energy', category: 'batteries', description: 'Capacity in Ah/mAh/Coulombs, stored energy in Wh/kWh, C-rates, and efficiency', implemented: true },
  { id: 'battery-pack', name: 'Battery Pack Configuration & S-P Designer', category: 'batteries', description: 'Series/parallel S-P scaling, pack voltage, capacity, limits, and cell-to-pack density', implemented: true },
  { id: 'battery-discharge', name: 'Discharge, Load Profiles & Voltage Sag', category: 'batteries', description: 'Constant-current/power runtime, multi-step load profiles, R_int, and sag', implemented: true },
  { id: 'battery-soc', name: 'State Estimation: SOC, SOH & Tracking', category: 'batteries', description: 'State of charge, reference OCV curves, SOH fade, EFC cycles, and Coulomb counting', implemented: true },
  { id: 'battery-charging', name: 'Battery Charging & Efficiency Models', category: 'batteries', description: 'CC/CV charge duration, taper decay, Coulombic efficiency, and Joule heat', implemented: true },
  { id: 'battery-aging', name: 'Battery Aging, Lifetime & ESS Sizing', category: 'batteries', description: 'Peukert law, cycle/calendar degradation, temperature derating, and ESS sizing', implemented: true },
  { id: 'battery-runtime', name: 'Battery Runtime & Capacity', category: 'batteries', description: 'Peukert derated discharge duration, C-rate, and stored energy', implemented: true },

  // F. PCB Engineering
  { id: 'pcb-trace-width', name: 'PCB Trace Width & Resistance (IPC-2152)', category: 'pcb', description: 'Internal and external copper trace width, temperature rise, DC resistance, and I²R loss', implemented: true },
  { id: 'via-ampacity', name: 'PCB Via Geometry & Thermal Ampacity', category: 'pcb', description: 'Plated through-hole resistance, parasitic inductance, thermal resistance, and array sizing', implemented: true },
  { id: 'pcb-stackup', name: 'PCB Stackup & Dielectric Substrates', category: 'pcb', description: 'Multi-layer stackup visualizer, substrate dielectric database, and signal propagation delay', implemented: true },
  { id: 'controlled-impedance', name: 'Controlled Impedance (Microstrip, Stripline, GCPW)', category: 'pcb', description: 'Quasi-static transmission line models, characteristic impedance Z0, and width synthesis', implemented: true },
  { id: 'differential-pairs', name: 'Differential Pairs & Intra-Pair Skew', category: 'pcb', description: 'Edge-coupled microstrip/stripline differential impedance Z_diff and delay matching', implemented: true },
  { id: 'signal-integrity', name: 'Signal Integrity & Transmission Lines', category: 'pcb', description: 'Rise time knee frequency, critical length, reflection coefficient, return loss, and VSWR', implemented: true },
  { id: 'power-integrity', name: 'Power Integrity & Decoupling Sizing', category: 'pcb', description: 'Decoupling capacitor charge sizing, ESR droop, PDN target impedance, and power planes', implemented: true },
  { id: 'pcb-drc-clearance', name: 'PCB Clearance, Creepage & DRC Rules', category: 'pcb', description: 'IPC-2221B / IEC 60664-1 clearance and creepage, annular rings, and manufacturing DRC', implemented: true },
  { id: 'pcb-reference', name: 'PCB Design & Hardware References', category: 'pcb', description: 'Copper foil weights, IPC-7351 SMD land patterns, and fabrication capability tiers', implemented: true },

  // G. RF & Communication
  { id: 'freq-wavelength', name: 'Frequency ↔ Wavelength', category: 'rf', description: 'Propagation speed in media, quarter-wave and dipole antenna lengths', implemented: true },
  { id: 'db-dbm-dbw', name: 'Decibel (dB, dBm, dBW) Converter', category: 'rf', description: 'Logarithmic power and voltage ratio transformations', implemented: false },
  { id: 'link-budget', name: 'RF Friis Link Budget', category: 'rf', description: 'Free space path loss (FSPL), antenna gain, and receiver sensitivity', implemented: false },

  // H. Digital Electronics
  { id: 'number-converter', name: 'Binary / Dec / Hex / Oct Converter', category: 'digital', description: 'Radix converter with signed two\'s complement and interactive bitfield', implemented: true },
  { id: 'logic-gates-truth-table', name: 'Logic Gate & Truth Table Builder', category: 'digital', description: 'AND, OR, NOT, NAND, NOR, XOR, XNOR combinational evaluation', implemented: false },
  { id: 'karnaugh-map', name: 'Karnaugh Map Minimizer', category: 'digital', description: '2, 3, and 4-variable SOP and POS Boolean reduction', implemented: false },

  // I. Embedded Systems
  { id: 'pwm-calculator', name: 'PWM Frequency & Duty Cycle', category: 'embedded', description: 'Pulse widths, timer ARR/CCR registers, and average voltage', implemented: true },
  { id: 'uart-baud-rate', name: 'UART Baud Rate Generator', category: 'embedded', description: 'Clock divisors, sampling error percentage, and UBRR registers', implemented: false },
  { id: 'adc-dac-calculator', name: 'ADC / DAC Resolution & Voltage', category: 'embedded', description: 'Quantization step size (LSB), SNR, and ENOB', implemented: false },

  // J. Thermal Engineering
  { id: 'thermal-fundamentals', name: 'Thermal Fundamentals & Resistance Networks', category: 'thermal', description: 'Heat energy, heat transfer rates, 1D resistance and multi-node ladder solvers', implemented: true },
  { id: 'semiconductor-thermal', name: 'Semiconductor Junction & Case Thermal (Tj)', category: 'thermal', description: 'Thermal resistance chain RθJA, RθJC, RθCS, and maximum ambient', implemented: true },
  { id: 'heatsink-convection', name: 'Heatsink Thermal Sizing & Airflow CFM', category: 'thermal', description: 'Required thermal resistance °C/W for natural and forced convection', implemented: true },
  { id: 'thermal-interfaces', name: 'Thermal Interface Materials (TIM) & Contact', category: 'thermal', description: 'BLT compression, thermal grease vs pad, phase change, and stackups', implemented: true },
  { id: 'pcb-enclosure-thermal', name: 'PCB Spreading, Vias & Enclosure Dissipation', category: 'thermal', description: 'Spreading resistance, via arrays, and sealed/vented enclosure cooling', implemented: true },
  { id: 'transient-reliability', name: 'Transient Thermal Impedance & Reliability', category: 'thermal', description: 'Thermal time constant, Foster Zth(t), Arrhenius, and Coffin-Manson', implemented: true },

  // K. Signals & Systems
  { id: 'rms-crest-factor', name: 'RMS & Peak-to-Peak Waveform', category: 'signals', description: 'Sine, square, triangle, and sawtooth crest factor and true RMS', implemented: false },
  { id: 'nyquist-sampling', name: 'Nyquist Sampling & Aliasing', category: 'signals', description: 'Nyquist rate, anti-aliasing filter cutoff, and spectral foldover', implemented: false },

  // L. Engineering Mathematics
  { id: 'phasor-calculator', name: 'Phasor & Complex Arithmetic', category: 'math', description: 'Magnitude/phase to real/imaginary conversion, arithmetic, and Euler forms', implemented: true },
  { id: 'scientific-prefixes', name: 'Engineering Precision & Prefixes', category: 'math', description: 'Scientific & engineering notation, sig figs, ratios, and rounding', implemented: true },
  { id: 'vector-matrix-math', name: 'Vector & Matrix Linear Algebra', category: 'math', description: 'Vector dot/cross/projection, matrix determinants, inverses, and Cramer solvers', implemented: true },
  { id: 'calculus-numerical', name: 'Numerical Calculus & Quadrature', category: 'math', description: 'Forward/backward/central finite differences and Simpson/trapezoidal integration', implemented: true },
  { id: 'root-finding', name: 'Root Finding & Numerical Solvers', category: 'math', description: 'Bisection, Newton-Raphson, and Secant methods with convergence iteration logs', implemented: true },
  { id: 'curve-fitting', name: 'Data Fitting & Interpolation', category: 'math', description: 'Linear OLS regression, Pearson r, Lagrange polynomial interpolation, and SMA/EMA', implemented: true },
  { id: 'engineering-statistics', name: 'Engineering Statistics & Uncertainty', category: 'math', description: 'Sample moments, RMS, percentiles, and ISO GUM uncertainty propagation', implemented: true },
  { id: 'engineering-geometry', name: 'Engineering Geometry & Trigonometry', category: 'math', description: 'Triangle SSS/SAS/ASA solver, polygons, 3D volumes, and coordinate transforms', implemented: true },

  // M. Component Reference
  { id: 'smd-resistor-code', name: 'SMD Resistor Codes (3-digit, 4-digit, EIA-96)', category: 'reference', description: 'Surface-mount chip resistor marking lookup', implemented: false },
  { id: 'capacitor-code-decoder', name: 'Capacitor 3-Digit Code Decoder', category: 'reference', description: 'EIA 3-digit marking (e.g. 104 = 100 nF) and dielectric types', implemented: false },

  // N. Formula Book
  { id: 'formula-book', name: 'Interactive Formula Book', category: 'formulas', description: 'Searchable directory of electrical equations with interactive variables', implemented: true },

  // O. Engineering Design & Workflows
  { id: 'requirements-specification', name: 'Requirements & Design Inputs', category: 'design', description: 'System electrical, power, environmental, thermal, and mechanical requirements specification and consistency checks', implemented: true },
  { id: 'power-system-design', name: 'Power Architecture & Cascaded Loss', category: 'design', description: 'Multi-rail power budgets, converter loss chains, battery-to-load energy chains, and power margins', implemented: true },
  { id: 'thermal-system-design', name: 'System Thermal Budget & Resistance', category: 'design', description: 'Heat-source aggregation, junction-to-ambient chains, heatsink sizing, and enclosure thermal budgets', implemented: true },
  { id: 'battery-system-design', name: 'Battery-to-Load Sizing & Autonomy', category: 'design', description: 'Battery pack requirements, runtime vs load, voltage/current compatibility, and worst-case scenario analysis', implemented: true },
  { id: 'pcb-system-design', name: 'PCB Integration, Impedance & Thermal', category: 'design', description: 'PCB power integrity, trace ampacity/temperature rise, microstrip impedance, and creepage/clearance', implemented: true },
  { id: 'system-design-review', name: 'Design Review & Report Synthesizer', category: 'design', description: 'Unified multi-domain engineering design review, assumptions audit, traceability matrix, and system report synthesis', implemented: true },
];
