# ElectroKit Engineering Calculation Standards & Mathematical Protocols

## 1. Scope & Philosophy
ElectroKit is a high-precision, 100% client-side engineering toolbox. Calculations must be mathematically rigorous, physically faithful to circuit theory, and defensively coded against numerical instability, floating-point round-off, and edge-case anomalies.

---

## 2. Unit System & Normalization
1. **Base SI Internal Representations**:
   - All engines receive inputs and execute all intermediate arithmetic exclusively in **Base SI units** (Volts, Amperes, Ohms, Watts, Hertz, Farads, Henries, Meters, Seconds).
   - Prefix multipliers (kilo, mega, micro, nano, pico) must be converted to base SI before entry into calculation logic.
   - Any numerical value returned in `primaryValue` is strictly in the base unit.

2. **Formatter & Significant Figures**:
   - Numerical formatting must never truncate significant engineering precision.
   - Standard display: 4 significant figures for continuous engineering quantities (`formatSignificantFigures(val, 4)`).
   - SI Engineering Notation: Powers of ten must align with multiples of 3 ($10^{-12}$ to $10^{12}$: p, n, µ, m, base, k, M, G, T) with standard space between number and SI symbol (e.g., `4.7 kΩ`, `100 nF`, `3.3 V`).

---

## 3. Numerical Integrity & Edge-Case Boundaries

### 3.1 Zero and Open/Short Circuit Conditions
- **Infinite Current ($R = 0$, $V > 0$)**:
  - Must return `primaryValue = Infinity`.
  - Must immediately append an `EngineeringWarning` with `severity: 'danger'` and `title: 'Zero Resistance Short Circuit'`.
- **Infinite Resistance ($I = 0$, $V > 0$)**:
  - Must return `primaryValue = Infinity`.
  - Must append `severity: 'info'` with `title: 'Open Circuit Detected'`.
- **Zero Load Current / Power ($I = 0$ or $P = 0$) on Batteries**:
  - Must return `runtimeHours = Infinity` rather than dividing by zero or producing `NaN`.
- **Frequency / Wavelength ($f = 0$ or $\lambda = 0$)**:
  - Static DC ($f = 0$): $\lambda = \infty$. Must return `Infinity` with an explanatory note.

### 3.2 Negative Quantities in Passive Circuits
- When passive components (resistors, LED ballast) receive negative voltages or currents, the engine must:
  - Take the absolute magnitude for physical resistance sizing.
  - Append an `EngineeringWarning` with `severity: 'warning'` informing the user that polarity is reversed.

---

## 4. Component Standards & Derating Guidelines

### 4.1 Resistor Standard Values (IEC 60063)
- **E12 Series (10% Tolerance)**: 12 steps per decade.
- **E24 Series (5% Tolerance)**: 24 steps per decade.
- **E96 Series (1% Precision)**: 96 steps per decade.
- Matching algorithm computes decade boundaries and identifies:
  - Exact nominal value.
  - Lower standard value ($R_{\text{lower}}$).
  - Upper standard value ($R_{\text{upper}}$).
  - Recommended closest standard value ($R_{\text{rec}}$) with signed deviation percentage:
    $$\Delta\% = \frac{R_{\text{rec}} - R_{\text{calc}}}{R_{\text{calc}}} \times 100$$

### 4.2 Thermal Derating & Resistor Power Ratings
- Passive components must incorporate realistic thermal headroom.
- **2.0× Engineering Safety Rule**: Standard design practice requires standard rated resistor wattage to be at least $2.0 \times P_{\text{dissipated}}$.
  - E.g., for $P = 180\text{ mW}$, standard recommended rating is $\ge 0.5\text{ W}$ (1/2 W) rather than 1/4 W ($250\text{ mW}$) to prevent excessive surface temperatures ($\Delta T > 70^\circ\text{C}$).
- Power ratings hierarchy: $1/8\text{ W}$ ($0.125\text{ W}$), $1/4\text{ W}$ ($0.25\text{ W}$), $1/2\text{ W}$ ($0.5\text{ W}$), $1\text{ W}$, $2\text{ W}$, $5\text{ W}$, $10\text{ W}$, $25\text{ W}+$.

---

## 5. Electrical Safety & Hazard Warning Taxonomy

All engines must run safety audits across their inputs and outputs using the centralized safety system (`src/lib/safety/disclaimers.ts`):

1. **High Voltage Hazard (SELV / PELV thresholds)**:
   - $V > 50\text{ V}_{\text{RMS}}$ (AC) or $V > 120\text{ V}$ (DC ripple-free) per IEC 61140:
     - Level: `severity: 'danger'`
     - Code: `HV_DANGER`
     - Requires protective insulating barrier warnings.
2. **Thermal & High Current Fire Hazard**:
   - $I > 10\text{ A}$ or current density exceeding breadboard/prototyping trace limits ($> 1\text{ A}$ on breadboards).
   - $P > 5\text{ W}$ dissipated on discrete components without heatsinking:
     - Level: `severity: 'warning'` or `severity: 'danger'`.
3. **Electrochemical Battery Hazards**:
   - Lithium-ion cells over-discharge ($< 2.8\text{ V}$), thermal runaway, short-circuit current (> 20C).
   - Lead-acid deep sulfurization (> 50% DoD).

---

## 6. Audit & Verification Standards
- Every calculation engine in `src/engines/` must have automated unit verification in `tests/engineering-audit.ts`.
- Tests must verify:
  1. Standard operating point against IEEE/IEC reference solutions.
  2. Edge cases (zeros, boundary limits, negative inputs).
  3. Warning emissions (shock hazard, short-circuit danger, derating suggestions).
  4. Standard value snapping accuracy.
