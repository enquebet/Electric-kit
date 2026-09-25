# Signals, Systems & Continuous-Time Standards Architecture

## 1. Overview & Scope
ElectroKit's **Signals, Systems & RF Engineering (Phase 07)** suite provides deterministic, client-side calculation engines covering analog and digital signal fundamentals, complex phasor arithmetic, linear and logarithmic power scaling, continuous-time filter synthesis, and radio frequency (RF) propagation.

Signal and RF engineering calculations frequently cross boundaries between theoretical physics, idealized linear system models, and real-world statistical/empirical observations. To preserve engineering integrity, every engine in this domain operates with explicit mathematical boundary constraints, SI unit normalization, and unambiguous classification metadata.

---

## 2. Engineering Classification Hierarchy

Every tool and calculation engine in Phase 07 declares an explicit `EngineeringClassification`:

| Classification | Meaning & Scope | Examples |
|---|---|---|
| `THEORETICAL` | Exact closed-form mathematical equations derived from Maxwell's equations, Fourier transforms, or electromagnetic wave definitions in ideal media. | Free-space wavelength $\lambda = c / f$, Phasor coordinate transformations $a + jb \leftrightarrow r \angle \theta$, Ideal SNR $= 6.02N + 1.76\text{ dB}$ |
| `ENGINEERING ESTIMATE` | Widely accepted first-order industry approximations used for initial sizing, budget modeling, and feasibility analysis under specified conditions. | Parabolic dish beamwidth $\theta_{3\text{dB}} \approx 70 \frac{\lambda}{D}$, Dipole resonant wire end-effect shortening ($\approx 0.95 \times \lambda/2$) |
| `COMPONENT-DATA DEPENDENT` | Calculations fundamentally constrained by empirical device specifications, measured manufacturer figures, or tolerance distributions. | Receiver noise figure $NF$, Low-Noise Amplifier (LNA) gain, Filter capacitor ESR, Demodulator minimum required $SNR_{req}$ |
| `STANDARDS DEFINED` | Parameters and references established by international standardization bodies (IEEE, ITU, BIPM, NIST). | Standard reference temperature $T_0 = 290\text{ K}$ (IEEE std 100), Speed of light $c = 299,792,458\text{ m/s}$ (BIPM/SI) |

---

## 3. Signal Waveforms & Continuous-Time Metrics

### A. Phase and Time Conventions
Signals in ElectroKit are referenced to standard cosine time-domain representations:
$$x(t) = A \cos(2\pi f t + \phi) = A \cos(\omega t + \phi)$$
where $\omega = 2\pi f$ (rad/s), $T = 1/f$ (s), and $\phi$ is the phase shift in radians or degrees. Time delay corresponding to phase angle $\phi$ is:
$$\Delta t = \frac{\phi^\circ}{360^\circ \times f} = \frac{\phi_{\text{rad}}}{\omega}$$

### B. Waveform Metrics & Conversion Factors

| Waveform Type | Peak-to-Peak ($V_{pp}$) | RMS Voltage ($V_{rms}$) | Rectified Average ($V_{avg}$) | Crest Factor ($k_c$) | Form Factor ($k_f$) |
|---|---|---|---|---|---|
| **Sine Wave** | $2 \cdot V_{pk}$ | $\frac{V_{pk}}{\sqrt{2}} \approx 0.7071 V_{pk}$ | $\frac{2}{\pi} V_{pk} \approx 0.6366 V_{pk}$ | $\sqrt{2} \approx 1.4142$ | $\frac{\pi}{2\sqrt{2}} \approx 1.1107$ |
| **Symmetrical Square** | $2 \cdot V_{pk}$ | $V_{pk}$ | $V_{pk}$ | $1.000$ | $1.000$ |
| **Triangle / Sawtooth** | $2 \cdot V_{pk}$ | $\frac{V_{pk}}{\sqrt{3}} \approx 0.5774 V_{pk}$ | $\frac{V_{pk}}{2} = 0.5000 V_{pk}$ | $\sqrt{3} \approx 1.7321$ | $\frac{2}{\sqrt{3}} \approx 1.1547$ |
| **PWM Pulse (0 to $V_{pk}$, duty $D$)** | $V_{pk}$ | $V_{pk} \cdot \sqrt{D}$ | $V_{pk} \cdot D$ | $\frac{1}{\sqrt{D}}$ | $\frac{1}{\sqrt{D}}$ |

#### Critical Engineering Distinction: True RMS vs. Average-Responding
- **True RMS**: Measures equivalent heating power in a resistive load:
  $$V_{rms} = \sqrt{\frac{1}{T} \int_0^T v^2(t) \, dt}$$
- **Average-Responding Meter**: Calibrated to display correct RMS *only* for pure sinusoids by multiplying rectified average by $1.1107$. Non-sinusoidal waveforms (e.g. SCR chops, PWM, noise) measured with average-responding meters suffer significant error.

---

## 4. Complex Phasor Arithmetic

### A. Coordinate Systems
- **Rectangular Form**: $Z = a + jb$, where $a = \text{Re}\{Z\}$ and $b = \text{Im}\{Z\}$.
- **Polar Form**: $Z = r \angle \theta$, where magnitude $r = \sqrt{a^2 + b^2} = \text{hypot}(a, b)$ and phase angle $\theta = \text{atan2}(b, a)$.
- **Euler Relation**: $Z = r e^{j\theta} = r (\cos \theta + j \sin \theta)$.

### B. Computational Principles
1. **Addition & Subtraction**: Evaluated strictly in Cartesian (rectangular) coordinates:
   $$(a_1 + jb_1) \pm (a_2 + jb_2) = (a_1 \pm a_2) + j(b_1 \pm b_2)$$
2. **Multiplication & Division**: Evaluated in polar coordinates for precision and computational stability:
   $$(r_1 \angle \theta_1) \times (r_2 \angle \theta_2) = (r_1 r_2) \angle (\theta_1 + \theta_2)$$
   $$\frac{r_1 \angle \theta_1}{r_2 \angle \theta_2} = \left(\frac{r_1}{r_2}\right) \angle (\theta_1 - \theta_2) \quad (r_2 \ne 0)$$
3. **Impedance Transformations**:
   - Resistor: $Z_R = R \angle 0^\circ = R + j0$
   - Inductor: $Z_L = \omega L \angle +90^\circ = 0 + j\omega L$
   - Capacitor: $Z_C = \frac{1}{\omega C} \angle -90^\circ = 0 - j\frac{1}{\omega C}$

---

## 5. Decibel Scaling & Reference Planes

The decibel is a logarithmic ratio of two physical quantities. ElectroKit distinguishes strictly between power ratios and field/voltage quantities:

### A. Power vs. Field Ratios
- **Power Ratios**: $L_{dB} = 10 \log_{10}\left(\frac{P_1}{P_0}\right)$ (applied to Watts, milliwatts, radiant flux)
- **Voltage / Current / Field Ratios**: $L_{dB} = 20 \log_{10}\left(\frac{V_1}{V_0}\right)$ (assuming equal termination impedances)

### B. Standard Reference Units

| Unit | Reference Level | Domain / Application | Standard Formula |
|---|---|---|---|
| **$\text{dBW}$** | $1.0\text{ Watt}$ | High-power transmitters, radar | $P_{\text{dBW}} = 10 \log_{10}(P / 1\text{ W})$ |
| **$\text{dBm}$** | $1.0\text{ milliwatt}$ ($10^{-3}\text{ W}$) | RF systems, telecommunications, receiver sensitivity | $P_{\text{dBm}} = 10 \log_{10}(P / 1\text{ mW}) = P_{\text{dBW}} + 30$ |
| **$\text{dB}\mu\text{V}$** | $1.0\text{ microvolt}$ ($10^{-6}\text{ V}$) | EMC / EMI testing, broadcast field strength | $V_{\text{dB}\mu\text{V}} = 20 \log_{10}(V / 1\,\mu\text{V})$ |
| **$\text{dBi}$** | Isotropic radiator (ideal point source) | Antenna directivity and gain | $G_{\text{dBi}} = 10 \log_{10}(U_{max} / U_{iso})$ |
| **$\text{dBd}$** | Ideal half-wave dipole ($2.15\text{ dBi}$) | Mobile and land-mobile radio antenna gain | $G_{\text{dBd}} = G_{\text{dBi}} - 2.15\text{ dB}$ |

### C. 50-Ohm System Voltage Relationships
In standard $Z_0 = 50\,\Omega$ RF systems:
$$P = \frac{V_{rms}^2}{Z_0} \implies V_{rms} = \sqrt{P \times 50}$$
$$V_{peak} = V_{rms} \times \sqrt{2} = \sqrt{P \times 100}$$
- $0\text{ dBm} = 1\text{ mW} \implies V_{rms} \approx 0.2236\text{ V} \approx 223.6\text{ mV}$ ($632.5\text{ mV}_{pp}$)
- $+10\text{ dBm} = 10\text{ mW} \implies V_{rms} \approx 0.7071\text{ V}$
- $+13\text{ dBm} = 20\text{ mW} \implies V_{rms} \approx 1.000\text{ V}$

---

## 6. Continuous-Time Filters & Resonance

### A. Bandwidth, Q-Factor, and Shape Factor
- **Bandwidth**: $BW = f_{high} - f_{low}$ (defined at $-3\text{ dB}$ half-power points)
- **Geometric Center Frequency**: $f_0 = \sqrt{f_{low} \times f_{high}}$
- **Quality Factor ($Q$)**:
  $$Q = \frac{f_0}{BW} = \frac{\omega_0 L}{R} = \frac{1}{\omega_0 C R} \quad (\text{for series RLC})$$
- **Fractional Bandwidth ($FBW$)**: $FBW = \frac{BW}{f_0} = \frac{1}{Q}$

### B. Filter Order ($n$) and Stopband Roll-Off Rates
For maximally flat (Butterworth) responses:
- **Roll-off rate per decade**: $20 \times n\text{ dB/decade}$
- **Roll-off rate per octave**: $\approx 6.02 \times n\text{ dB/octave}$
- Attenuation at $2 \times f_c$: $A(2f_c) \approx 6.02 \times n\text{ dB}$
- Attenuation at $10 \times f_c$: $A(10f_c) \approx 20 \times n\text{ dB}$
