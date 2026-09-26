# ElectroKit v1.0.0 Release Notes

**Release Date:** September 26, 2026  
**Version:** v1.0.0 (Production Release)  
**License:** MIT  
**Platform:** 100% Client-Side Web Application (Vite / React 19 / TypeScript)

---

### What is ElectroKit?

**ElectroKit** is a professional-grade engineering computation suite and hardware design workspace built for electrical engineers, hardware designers, power electronics specialists, and embedded developers.

Every engineering calculator and design workflow runs **100% in the user's browser** with zero mandatory backend services, zero telemetry, zero latency, and analytical precision.

---

### Major Capabilities

1. **86 Specialized Engineering Tools:**
   - **Circuits & Actives:** Ohm's law, voltage dividers, R/C/L time constants, filters, RLC resonance, diodes, BJTs, MOSFETs, and op-amps.
   - **Power Electronics:** 47 topologies covering Buck, Boost, Buck-Boost, SEPIC, Ćuk, Flyback, rectifiers, and switching losses.
   - **High-Power Electrical:** Single-phase and three-phase AC systems, power factor correction, transformer modeling, and cable ampacity.
   - **PCB Design & Layout:** IPC-2152 trace and via ampacity, IPC-2141 controlled impedance, differential pairs, PDN target impedance, and IPC-2221B creepage/clearance.
   - **RF & Communications:** Free-space path loss (FSPL), Friis link budgets, antenna dimensions, and cascaded noise figures.
   - **Batteries & Energy:** Sizing, Peukert discharge curves, pack matrices ($N_s / N_p$), thermal Joule heating, and EOL degradation.
   - **Digital & Embedded:** Radix converters, Boolean logic, ADC/DAC resolution, Nyquist sampling, and UART/SPI/I²C/CAN bus timing.
   - **Engineering Mathematics:** Complex phasors, numerical calculus, root finding, and ISO GUM uncertainty propagation.

2. **Interactive Formula Book:**
   - 60 equations with mathematical formulations, variable definitions, SI units, and worked numerical examples.

3. **Hardware Engineering Workspace:**
   - Manage multi-domain requirements, constraints, assumptions, and design targets.
   - Multi-case branch comparison (Baseline vs Rev B) with environmental corner scenarios (Hot, Cold, Low Voltage, EOL).
   - Pin deterministic calculation snapshots and track physical bench measurements against modeled values.
   - One-click export of structured JSON, formatted Markdown reports, and styled printable HTML reviews.

4. **Optional Bring-Your-Own-AI (BYO AI):**
   - Connect optional API keys directly from the browser for Google Gemini, OpenAI, Anthropic Claude, or local Ollama instances.
   - AI acts strictly as an analytical peer reviewer explaining physical principles and recommending bench tests; deterministic engineering calculation engines remain the sole source of numerical truth.
   - Full deterministic offline review available without API keys or internet access.

---

### Security & Privacy Considerations

- **No Remote Calculation Dependency:** Deterministic calculations run locally in the browser with zero network transmission.
- **Client-Side Project Storage:** Projects are stored locally in the user's browser (`localStorage`) and can be exported as `.json` files.
- **Strict Credential Isolation:** AI credentials are stored separately from project data and are automatically stripped from project export files and generated reports.
- **Zero Telemetry:** ElectroKit contains no analytics, tracking pixels, or remote telemetry scripts.

---

### Known Architecture Tradeoff

- **Single JS Bundle for Offline Reliability:**
  The production JavaScript bundle is approximately 640 kB (gzip). This is an intentional architectural design choice to ensure that all 86 engineering calculators, Formula Book references, and offline review rulesets remain fully operational when working offline or in air-gapped lab environments without requiring asynchronous network chunk fetching.
