# Power Converter Engine Integration Guide

## 1. Architectural Philosophy
All Phase 05 engines adhere strictly to ElectroKit's functional stateless paradigm:

```typescript
Inputs Interface -> calculateFunction(inputs) -> CalculationResult
```

Engines perform zero side effects, make zero network requests, and execute 100% client-side in sub-millisecond execution time.

---

## 2. Directory Structure & Module Index

```text
src/engines/power/
├── converters/
│   ├── buck.ts          # Ideal Buck, Inductor, Output Capacitor, CCM/DCM boundary
│   ├── boost.ts         # Ideal Boost, Inductor, Output Capacitor, CCM/DCM boundary
│   ├── buck-boost.ts    # Inverting Buck-Boost, Non-Inverting 4-Switch
│   ├── sepic.ts         # SEPIC converter, dual inductors, coupling cap Cs
│   ├── cuk.ts           # Ćuk converter, transfer cap C1, dual chokes
│   └── flyback.ts       # Flyback fundamentals, turns ratio, magnetizing Lm
├── rectifiers/
│   └── rectifiers.ts    # Half-wave, center-tapped, bridge, capacitor filter, diode stress
├── switching/
│   └── switching.ts     # Switching frequency, period, PWM power stage
├── semiconductors/
│   └── semiconductor-stress.ts # MOSFET V/I stress, conduction, switching, diode Qrr
├── magnetics/
│   └── magnetics.ts     # Inductor energy, ripple, peak/RMS current, flux density, core margin
├── capacitors/
│   └── capacitors.ts    # Buck/Boost output caps, ESR drop, RMS ripple, energy
├── losses/
│   └── losses.ts        # Efficiency, bottom-up loss budget distribution
├── thermal/
│   └── thermal.ts       # Thermal stack, junction temperature, thermal margin
├── inverters/
│   └── inverters.ts     # H-bridge states, SPWM modulation, RMS output, AC power
├── design/
│   └── converter-design.ts # Power Converter Design Mode preliminary synthesizer
└── index.ts             # Unified barrel export
```

---

## 3. Mathematical Verification Patterns

### Buck Converter Equations
- Duty Cycle: $D = \frac{V_{out}}{V_{in}}$
- Required Inductor for Ripple $r$:
  $$L = \frac{V_{out} (1 - D)}{f_s \cdot (r \cdot I_{out})}$$
- Critical CCM/DCM Current:
  $$I_{crit} = \frac{V_{out} (1 - D)}{2 \cdot L \cdot f_s}$$

### Boost Converter Equations
- Duty Cycle: $D = 1 - \frac{V_{in}}{V_{out}}$
- Physical Constraint: $V_{out} > V_{in}$ strictly enforced. If $V_{out} \le V_{in}$, an engineering danger warning is generated.
- Critical Load Current:
  $$I_{out,crit} = \frac{V_{in} \cdot D \cdot (1 - D)^2}{2 \cdot L \cdot f_s}$$

### Rectifier Filter Capacitor Equations
- Ripple Frequency:
  - Half-Wave: $f_{ripple} = f_{in}$
  - Full-Wave Bridge: $f_{ripple} = 2 \cdot f_{in}$
- Peak-to-Peak Ripple Voltage:
  $$\Delta V_{ripple} \approx \frac{I_{load}}{f_{ripple} \cdot C}$$

---

## 4. UI Rendering Guidelines
When displaying power converter results:
1. Show the **Classification Badge** prominently (`THEORETICAL`, `ENGINEERING ESTIMATE`, `COMPONENT-DATA DEPENDENT`, `TOPOLOGY / DESIGN DEPENDENT`).
2. Display the **Step-by-Step Derivations** with formulas, substituted parameters, and units.
3. Show **Contextual Safety Warnings** (e.g. Shoot-Through Danger, Thermal Runaway, Core Saturation, ESR Ripple Overrun).
