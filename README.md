# ⚡ ElectroKit — The Electronics & Electrical Engineer's Toolbox

> **100% Client-Side Precision Calculators, Multi-Domain System Design Workflows, Standards-Aware Engineering Primers, and Comprehensive Formula References.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Tests](https://img.shields.io/badge/Tests-574%20Passing-emerald?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-amber?style=flat-square)

---

## 📖 Overview

**ElectroKit** is a professional-grade engineering computation suite built for electrical engineers, hardware designers, embedded systems developers, and students. Every calculator executes client-side with zero telemetry, zero latency, and analytical precision.

ElectroKit bridges the gap between quick scratchpad calculations and heavy SPICE / CAD simulations by providing auditable formulas, step-by-step substitutions, boundary condition checking, physical unit awareness, and formal system engineering review workflows.

---

## 🚀 Key Modules & Capabilities

ElectroKit organizes over **80+ specialized engineering calculators and workflows** across 15 distinct categories:

### 1. 🔌 Circuit Calculators
- **Ohm's Law Solver** — DC voltage, current, resistance, power with E24 standard matching.
- **Voltage Divider** — Loaded vs unloaded output, Thévenin equivalent impedance.
- **Series & Parallel Networks** — Resistors, capacitors, and inductors with equivalent tolerances.
- **RC & RL Time Constants** — Charge/discharge exponential curves and bandwidth.
- **RLC Resonance** — Undamped and damped natural frequencies, Q factor, and bandwidth.
- **Complex Impedance** — Phasor representation, polar $\leftrightarrow$ rectangular forms.
- **Passive Filters** — 1st-order RC/RL low-pass and high-pass frequency response.

### 2. ⚡ Electrical Engineering
- **AC Single-Phase & Three-Phase Power** — Real ($P$), reactive ($Q$), and apparent ($S$) power.
- **Power Factor Correction (PFC)** — Sizing capacitor banks for target displacement power factor.
- **Conductor Sizing & Voltage Drop** — Conductor ampacity, cross-sectional area, NEC/IEC tables.
- **Transformer Engineering** — Turns ratio, regulation, copper and core loss models.
- **Motor Fundamentals** — Full load amps (FLA), slip, locked-rotor torque, starting currents.
- **Electrical Protection** — MCB tripping curves, prospective short circuit (PSCC), RCD sensitivity.
- **Load Schedule Analysis** — Diversity factors, continuous and non-continuous feeder demand.

### 3. 🔋 Power Electronics
- **Buck, Boost & Buck-Boost Converters** — Inductance sizing, CCM/DCM boundary conditions.
- **Flyback Transformer Design** — Turns ratio, magnetizing inductance, snubber networks.
- **Diode & Bridge Rectifiers** — Half-wave, full-wave, ripple factor, peak inverse voltage (PIV).
- **Semiconductor Losses** — Conduction and switching loss breakdown in power MOSFETs and diodes.

### 4. 🎛️ Components & Actives
- **LED Ballast Resistors** — Forward drop compensation and standard E-series selection.
- **BJT Biasing** — Fixed bias, collector feedback, voltage divider bias Q-point stabilization.
- **MOSFET Gate Drivers** — Gate charge ($Q_g$), peak driver current, switching rise/fall times.
- **Op-Amp Topologies** — Inverting, non-inverting, differential, summing, and active filters.
- **Zener Diode Regulators** — Minimum load current, knee regulation, and power dissipation.

### 5. 🔋 Batteries & Energy Storage
- **Battery-to-Load Sizing** — Multi-day autonomy, usable DoD, cold-temperature derating, EOL aging.
- **Pack Architecture** — Automatic Series/Parallel ($N_s / N_p$) cell matrix solver from cell presets.
- **Peukert Law Discharging** — Rate-dependent capacity reduction and runtime estimation.
- **Constant Current & Constant Power Discharge** — Monotonic runtime curves.
- **Battery Thermal Losses** — Joule $I^2 R$ heat and reversible entropic potential coefficients.

### 6. 🖧 PCB Engineering
- **IPC-2152 Trace Ampacity** — External and internal copper trace temperature rise.
- **Controlled Impedance** — Microstrip, embedded microstrip, and stripline $Z_0$ models.
- **Differential Pairs** — Edge-coupled microstrip differential impedance ($Z_{\text{diff}}$).
- **Via Ampacity & Thermal Vias** — Plated barrel resistance, mutual heating array derating.
- **Power Integrity (PDN)** — Target impedance ($Z_{\text{target}}$) and bulk decoupling capacitance.
- **Signal Integrity** — Knee frequency ($F_{\text{knee}} = 0.35 / t_r$), critical length ($l_{\text{crit}}$), reflection coefficients.
- **IPC-2221B Clearances** — Voltage creepage and clearance spacing with altitude breakdown correction.

### 7. 📡 RF & Communications
- **Frequency $\leftrightarrow$ Wavelength** — Free-space and dielectric velocity propagation.
- **Decibels, dBm & dBW** — Logarithmic conversions and cascaded RF gain chains.
- **Antenna Fundamentals** — Dipole, monopole, patch dimensions, and beamwidth.
- **Noise Figure & Sensitivity** — Friis cascaded noise figure and thermal noise floor ($k T B$).
- **Free Space Path Loss (FSPL) & Link Budget** — Link margins across transmit power and antenna gains.

### 8. 💻 Digital & Embedded Systems
- **Radix Conversion** — Binary, octal, decimal, hexadecimal, Two's complement.
- **Logic Minimization** — Boolean algebra and Karnaugh mapping.
- **Microcontroller Timers & PWM** — Prescaler, period registers, duty cycle, frequency resolution.
- **ADC & DAC Resolution** — Quantization error, LSB voltage, SNR, ENOB.
- **Serial Bus Timing** — I2C pullup resistor sizing, SPI clock divisors, UART baud rate error.

### 9. 🌡️ Thermal Management
- **Thermal Resistance Chains** — $R_{\theta\text{JA}} = R_{\theta\text{JC}} + R_{\theta\text{CS}} + R_{\theta\text{SA}}$ 1D network.
- **Node Temperature Profiling** — Junction ($T_j$), case ($T_c$), and heatsink ($T_s$) temperatures.
- **Heatsink Sizing** — Required convection resistance to satisfy maximum silicon limits.
- **Sealed Enclosures** — Internal air temperature rise from surface area and $U$-value.
- **PCB Heat Flux** — Heat spreading density ($W/\text{cm}^2$) classification.

### 10. 📐 Engineering Mathematics
- **Phasor Operations** — Polar $\leftrightarrow$ Cartesian arithmetic.
- **Numerical Calculus** — Central difference differentiation and Simpson's quadrature integration.
- **Root Finding Solvers** — Bisection, Newton-Raphson, and Secant transcendental methods.
- **Uncertainty Propagation** — ISO GUM standard quadrature error propagation.
- **Engineering Statistics** — Mean, sample standard deviation, SEM, and moving averages.

### 11. 📋 Engineering Design Workflows (Phase 12 Unified Architecture)
- **Requirements Specification** — Multi-domain input capture (electrical, power, environmental, thermal, mechanical) with consistency validation.
- **Power Architecture & Cascaded Losses** — Multi-rail DC power tree distribution and cascaded converter efficiency chains.
- **System Thermal Budgeting** — Active/passive heat aggregation and worst-case thermal margin checking.
- **Battery System Integration** — Full-chain mission sizing, voltage/current compatibility, and degraded EOL scenarios.
- **PCB System Integration** — Combined power integrity, trace ampacity, impedance match, and DRC layout readiness.
- **Design Review & Report Synthesizer** — Formal Engineering Design Review with active assumption registers, centralized warnings, and auditable traceability matrices.

---

## 🛠️ Technology Stack

- **Framework**: React 19 (Hooks, Functional Architecture)
- **Language**: TypeScript 5.x (Strict type safety, zero `any` policy)
- **Build Tool**: Vite 8.x
- **Styling**: Tailwind CSS v4 (Pure utility classes, modern typography)
- **Icons**: Lucide React
- **Animations**: Motion
- **Runtime**: 100% Client-side browser execution (zero backend dependencies for calculation engines)

---

## 🧪 Verification & Audit Suite

ElectroKit includes an extensive automated verification test suite containing **574 analytical assertions**:

```bash
# Run the complete engineering verification test suite
npm test

# Run TypeScript typecheck
npm run lint

# Build the production bundle
npm run build
```

Every test validates real analytical invariants, monotonicity, conservation of energy, dimensional balance, and edge cases (e.g. sub-zero temperatures, inverted voltage rails, and zero loads).

---

## 📦 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm** or **bun**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/electrokit.git

# Navigate to project directory
cd electrokit

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the local development server on http://localhost:3000
npm run dev
```

### Building for Production

```bash
# Generate the optimized production build in /dist
npm run build

# Preview the production build locally
npm run preview
```

---

## 📁 Project Structure

```
electrokit/
├── public/                 # Static assets and icons
├── src/
│   ├── components/         # React UI components
│   │   ├── common/         # ResultCard, CalculationStepViewer, Header, Sidebar
│   │   ├── formulas/       # Formula Book modal and searchable viewer
│   │   ├── layout/         # Navigation and responsive shells
│   │   └── tools/          # Interactive calculator and workflow views
│   ├── data/               # Static catalogs, formulas, and tool registries
│   │   ├── formulas.ts     # Formula Book definitions with worked examples
│   │   ├── registry.ts     # Complete tools metadata and SEO entries
│   │   └── taxonomy.ts     # Categorized directory hierarchy
│   ├── engines/            # Deterministic calculation engines (by discipline)
│   │   ├── circuit/        # Circuit fundamentals, filters, impedance
│   │   ├── electrical/     # Three-phase power, transformers, conductors
│   │   ├── power/          # Switched-mode converters, inductors, rectifiers
│   │   ├── components/     # Diodes, BJTs, MOSFETs, Op-amps
│   │   ├── batteries/      # Aging, discharge curves, battery packs
│   │   ├── pcb/            # Trace ampacity, microstrip, vias, DRC clearance
│   │   ├── rf/             # Antennas, link budgets, noise figure, decibels
│   │   ├── digital/        # Radix, logic minimization
│   │   ├── embedded/       # Timers, PWM, ADC/DAC, pullup sizing
│   │   ├── thermal/        # Junction temperatures, heatsinks, enclosures
│   │   ├── signals/        # Waveforms, Fourier harmonics, sampling
│   │   ├── math/           # Phasors, numerical calculus, uncertainty
│   │   └── design/         # Phase 12 multi-domain workflows & design review
│   ├── types/              # TypeScript interface definitions
│   ├── App.tsx             # Root application component
│   └── main.tsx            # Vite entry point
├── tests/
│   └── engineering-audit.ts # Master 574-assertion forensic verification suite
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ⚖️ Standards & Disclaimer

ElectroKit calculations are grounded in published industry standards including **IPC-2152** (trace and via ampacity), **IPC-2221B** (electrical clearance and creepage), **IPC-2141** (controlled impedance), **IEC 60062** (resistor color codes), and **IEC 60664-1** (insulation coordination).

> **Engineering Disclaimer**: ElectroKit provides modeled calculations and design margin estimates for engineering analysis. Modeled results do not replace formal physical bench testing, manufacturer datasheet reviews, or regulatory laboratory certifications (e.g. UL, CE, FCC, ISO).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
