# Power Electronics & Conversion Standards Architecture

## 1. Overview & Purpose
ElectroKit's **Power Electronics & Power Conversion (Phase 05)** suite delivers mathematically rigorous, client-side engineering calculation engines for switched-mode power supplies (SMPS), static converters, AC rectifiers, and inverters.

In power electronics engineering, oversimplification is hazardous. A formula assuming ideal lossless components can yield disastrous results in hardware if parasitic inductances, diode reverse recovery charge, or inductor core saturation are ignored. Therefore, ElectroKit enforces strict classification metadata across all power calculations.

---

## 2. Engineering Classification Hierarchy

Every tool and output in the Power Electronics domain declares an explicit `EngineeringClassification`:

| Classification | Meaning & Scope | Examples |
|---|---|---|
| `THEORETICAL` | Exact closed-form mathematical equations derived from ideal conservation laws (Volt-Second Balance, Ampere-Second Balance, Faraday's Law). Zero component losses, instantaneous switching. | Buck $D = V_{out} / V_{in}$, Inductor $E = \frac{1}{2} L I^2$, Period $T = 1/f$ |
| `ENGINEERING ESTIMATE` | Widely accepted first-order industry approximations used for initial sizing and boundary exploration. Excludes parasitic harmonics or 3D thermal effects. | Inductor sizing $L = \frac{V_{out}(1-D)}{f_s \Delta I_L}$, Switching loss $P_{sw} \approx \frac{1}{2} V I (t_r + t_f) f_s$ |
| `COMPONENT-DATA DEPENDENT` | Calculations fundamentally governed by empirical non-linear component parameters published in manufacturer datasheets. | MOSFET $R_{ds(on)}(T_j)$, Diode $Q_{rr}$, Core saturation $B_{sat}$, Capacitor ESR |
| `TOPOLOGY / DESIGN DEPENDENT` | Calculations whose mathematical form is dictated by the selected circuit arrangement, switch count, and modulation strategy. | 4-Switch Synchronous Buck-Boost, SEPIC $C_s$ sizing, H-Bridge Shoot-Through |

---

## 3. Topologies Covered

### A. Non-Isolated DC-DC Converters
1. **Buck (Step-Down)**: Ideal conversion $D = V_{out} / V_{in}$, CCM/DCM boundary $I_{crit} = \frac{V_{out}(1-D)}{2 L f_s}$, continuous output current, discontinuous pulsed input current.
2. **Boost (Step-Up)**: Ideal conversion $D = 1 - V_{in}/V_{out}$, strictly $V_{out} > V_{in}$. Output capacitor carries full load during $t_{on}$; high pulsed RMS capacitor current.
3. **Inverting Buck-Boost**: Produces negative rail output ($D = \frac{|V_{out}|}{|V_{out}| + V_{in}}$). Switch and diode stress equals $V_{in} + |V_{out}|$.
4. **4-Switch Synchronous Buck-Boost**: Non-inverting architecture switching between pure Buck mode ($V_{in} > V_{out}$) and pure Boost mode ($V_{in} < V_{out}$).
5. **SEPIC (Single-Ended Primary-Inductor Converter)**: Non-inverting step-up/down with series coupling capacitor $C_s$ providing DC blocking and short-circuit protection.
6. **Ćuk Converter**: Inverting step-up/down using capacitive intermediate energy transfer with continuous ripple current at both input and output.

### B. Isolated DC-DC Converters
- **Flyback Converter**: Buck-boost derivative using coupled inductors (flyback transformer) with primary-to-secondary turns ratio $n = N_p / N_s$. Accounts for reflected output voltage $V_{OR} = n(V_{out} + V_D)$, switch voltage stress $V_{ds} = V_{in,max} + V_{OR} + V_{spike}$, and magnetizing inductance $L_m$.

### C. AC-DC Rectifiers
- **Half-Wave**: Single diode, ripple frequency $f_{in}$, PIV $= V_{peak}$.
- **Full-Wave Center-Tapped**: 2 diodes, ripple frequency $2 f_{in}$, PIV $= 2 \times V_{peak}$.
- **Bridge Rectifier (Graetz)**: 4 diodes, 2 forward drops, ripple frequency $2 f_{in}$, PIV $\approx V_{peak}$.
- **Capacitor Smoothing Filter**: $\Delta V_{pp} \approx \frac{I_{load}}{f_{ripple} \times C}$.

### D. DC-AC Inverters
- **Full H-Bridge**: Complementary switching with mandatory dead-time insertion to prevent shoot-through.
- **Sinusoidal PWM (SPWM)**: Amplitude modulation index $m_a = V_{control} / V_{carrier}$, frequency ratio $m_f = f_{carrier} / f_{fundamental}$, fundamental RMS voltage $V_{1,rms} = \frac{m_a V_{bus}}{\sqrt{2}}$.

---

## 4. Semiconductor Derating & Thermal Rules
1. **Voltage De-rating**: Switch and diode voltage ratings must be de-rated to $\le 75\% - 80\%$ of rated breakdown to withstand inductive switching transients.
2. **Current De-rating**: Continuous RMS current must not exceed $70\%$ of silicon package limits at maximum ambient temperature.
3. **Thermal Stack**: $T_j = T_{amb} + P_{loss} \times (R_{\theta,JC} + R_{\theta,CS} + R_{\theta,SA}) \le T_{j,max}$ (typically $125^\circ\text{C}$ to $150^\circ\text{C}$).
4. **Inductor Saturation**: Peak operating current $I_{peak}$ must maintain at least a $20\% - 30\%$ safety margin below $I_{sat}$ to prevent core inductance collapse.
