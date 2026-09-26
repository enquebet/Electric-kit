# Changelog

All notable changes to **ElectroKit — The Electronics & Electrical Engineer’s Toolbox** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-26

### Initial Production Release (v1.0.0)

ElectroKit v1.0.0 is the first official production release of the 100% client-side precision engineering calculation suite and multi-domain hardware design workspace.

### Key Capabilities & Highlights

#### 1. 86 Analytical Engineering Tools
- **Circuit Fundamentals:** Ohm's law, voltage dividers, loaded Thévenin networks, series/parallel networks (R, C, L), RC/RL exponential time constants, and RLC resonance filters.
- **Electrical & Power Systems:** Single-phase and three-phase AC power ($W, \text{VA}, \text{VAR}$), displacement power factor correction (PFC), transformer loss and regulation modeling, motor full-load ampacity and slip, prospective short circuit (PSCC), and continuous feeder load schedules.
- **Power Electronics (47 Topologies):** Synchronous and asynchronous Switched-Mode Power Supplies (Buck, Boost, Buck-Boost, SEPIC, Ćuk, Flyback), transformer turns ratio, magnetizing inductance, CCM/DCM boundary conditions, power MOSFET conduction and switching losses, diode reverse recovery losses, and H-bridge SPWM inverters.
- **Components & Actives:** Semiconductor biasing, BJT active/saturation Q-point, MOSFET gate driver charging current, diode series ballasts, Zener shunt regulators, and operational amplifier topologies (inverting, non-inverting, differential, summing, active filters).
- **Batteries & Energy Storage:** Automated $N_s / N_p$ pack matrix configuration from chemistry presets (Li-Ion, LiFePO4, LTO, Lead-Acid), Peukert's law rate-dependent discharge capacity, multi-day autonomy modeling, cold-temperature derating, EOL capacity degradation, and internal $I^2 R$ Joule heating.
- **PCB Engineering:** IPC-2152 external and internal trace ampacity with temperature rise, plated via barrel ampacity and thermal resistance, IPC-2141 controlled impedance microstrips and striplines, edge-coupled differential pairs ($Z_{\text{diff}}$), PDN target impedance, and IPC-2221B voltage clearance and creepage spacing.
- **RF & Communications:** Wavelength and propagation velocity, decibel conversions (dB, dBm, dBW, dBV), Friis free-space path loss (FSPL), antenna sizing (dipole, monopole, patch), cascaded Friis noise figure, and link fade margin.
- **Digital & Embedded Systems:** Radix number conversion (Binary, Octal, Decimal, Hexadecimal, Two's complement), Boolean logic minimization, ADC/DAC quantization error and ENOB, Nyquist-Shannon sampling boundaries and foldover aliasing, and embedded serial bus timings (UART, SPI, I²C pullup sizing per NXP UM10204, CAN bit segments).
- **Engineering Mathematics:** Complex phasor arithmetic, numerical differentiation (central difference), Simpson's quadrature numerical integration, Newton-Raphson and bisection root finders, and ISO GUM uncertainty propagation.
- **Thermal Management:** 1D junction-to-ambient resistance networks ($R_{\theta\text{JA}} = R_{\theta\text{JC}} + R_{\theta\text{CS}} + R_{\theta\text{SA}}$), silicon heatsink sizing, convective airflow, and sealed enclosure heat transfer.

#### 2. Interactive Formula Book
- 60 equations with mathematical formulations, variable definitions, SI units, and worked numerical examples.
- Bidirectional navigation linking formula book entries directly to interactive calculation engines.

#### 3. Engineering Workspace & Intelligence Layer
- **Project Specifications:** Structured management of engineering requirements, constraints, assumptions, and target tolerances.
- **Design Cases & Corner Scenarios:** Multi-case branch management (Baseline, Rev B) with environmental corner overrides (Worst-case hot, cold, low voltage, battery EOL).
- **Calculation Snapshots:** Immutable pinned calculation records capturing tool slug, inputs, deterministic outputs, engineering margins, and warnings.
- **Deterministic Recalculation:** Direct re-evaluation through compiled analytical engines without external network access or LLM intervention.
- **Hardware Validation Tracker:** Lifecycle milestones (`Unvalidated` $\to$ `Calculated` $\to$ `Reviewed` $\to$ `Hardware Validated` $\to$ `Manufacturer Data Verified`) with laboratory bench measurement error tracking.
- **System Design Reports:** One-click generation of formatted Markdown reports, printable styled HTML documents, and sanitized JSON exports.

#### 4. Optional Bring-Your-Own-AI (BYO AI) & Offline Guarantees
- **Provider Support:** Direct client-side integration for Google Gemini (`@google/genai`), OpenAI, Anthropic Claude, and Ollama / Local LLMs.
- **Zero-Network Usability:** Deterministic offline review fallback providing physical principle explanations and laboratory test procedures without network access or API credentials.
- **Strict Credential Isolation:** API keys are stored exclusively in dedicated local browser storage and recursively stripped from project exports and report outputs.

#### 5. Quality, Security & Accessibility
- **Test Coverage:** 594 master analytical assertions, 29 dedicated forensic assertions, and 18 release hardening assertions (641 total passing assertions, 0 failures).
- **Security:** Recursive sanitization blocking prototype pollution and preventing credential leakage.
- **Accessibility:** Full keyboard navigation (`Cmd+K`, `/`, `Escape`), semantic landmarks, and dual icon/text status indicators exceeding WCAG AAA contrast ratios.
- **Mobile Experience:** Fully responsive layout with mobile drawer, touch-friendly tap targets, and overflow-safe formula rendering.
