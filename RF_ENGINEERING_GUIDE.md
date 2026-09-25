# Radio Frequency (RF) Engineering Guide

## 1. Architectural Philosophy
All Phase 07 RF calculation engines adhere strictly to ElectroKit's functional stateless paradigm:
```typescript
Inputs Interface -> calculateFunction(inputs) -> CalculationResult
```
RF calculations carry inherent physical assumptions. Misunderstanding assumptions in free-space path loss, antenna beamwidth, or receiver noise floor leads to failed RF links in physical hardware. This guide details every mathematical formulation, baseline constant, and operational boundary condition implemented across the RF suite.

---

## 2. Directory Structure & Module Index

```text
src/engines/rf/
├── freq-wavelength.ts     # Frequency, wavelength, optical band limits, propagation velocity
├── signals-waveforms.ts   # Waveform analysis, True RMS, crest/form factor, phase shift delay
├── phasor-signals.ts      # Complex phasor arithmetic, rectangular ↔ polar conversions
├── decibels-power.ts      # dB power/voltage ratios, dBm/dBW/uW/mW conversions, gain chains
├── antennas.ts            # Geometry sizing (dipole, monopole), gain, aperture, dish beamwidth, polarization
├── rf-noise.ts            # Johnson-Nyquist thermal noise, noise figure, Friis cascade, sensitivity, ADC SNR
├── link-budget.ts         # Free-Space Path Loss (FSPL), EIRP/ERP, link margin, complete budget matrix
└── index.ts               # Unified barrel export
```

---

## 3. Centralized Physical Constants

All physical constants used throughout the RF modules are centralized in `src/lib/constants.ts` to prevent inconsistent rounding across engines:

| Constant | Symbol | Value | SI Unit | Reference / Origin |
|---|---|---|---|---|
| **Speed of Light in Vacuum** | $c$ | $299,792,458$ | $\text{m/s}$ | Exact (SI definition, 17th CGPM) |
| **Boltzmann Constant** | $k_B$ | $1.380649 \times 10^{-23}$ | $\text{J/K}$ | Exact (SI definition, 26th CGPM) |
| **Standard Noise Temperature** | $T_0$ | $290.0$ | $\text{K}$ | IEEE Standard 100 / ITU-R ($16.85^\circ\text{C}$) |
| **Permeability of Free Space** | $\mu_0$ | $1.25663706212 \times 10^{-6}$ | $\text{H/m}$ | Exact $\approx 4\pi \times 10^{-7}$ |
| **Permittivity of Free Space** | $\varepsilon_0$ | $8.8541878128 \times 10^{-12}$ | $\text{F/m}$ | $\varepsilon_0 = 1 / (\mu_0 c^2)$ |
| **Intrinsic Impedance of Free Space** | $\eta_0$ | $376.730313668$ | $\Omega$ | $\eta_0 = \sqrt{\mu_0 / \varepsilon_0} \approx 120\pi\,\Omega$ |
| **Half-Wave Dipole Directivity** | $D_{\text{dipole}}$ | $2.15$ | $\text{dBi}$ | Analytical solution ($1.641$ linear) |

---

## 4. Wave Propagation & Free-Space Path Loss (FSPL)

### Mathematical Formulation
The Free-Space Path Loss (FSPL) is derived directly from the geometric spreading of electromagnetic power over a spherical surface of radius $d$:
$$\text{FSPL} = \left(\frac{4 \pi d}{\lambda}\right)^2 = \left(\frac{4 \pi d f}{c}\right)^2$$
In logarithmic decibels:
$$\text{FSPL (dB)} = 20 \log_{10}(d) + 20 \log_{10}(f) + 20 \log_{10}\left(\frac{4\pi}{c}\right)$$
Using $d$ in kilometers ($\text{km}$) and $f$ in megahertz ($\text{MHz}$):
$$\text{FSPL (dB)} = 32.44 + 20 \log_{10}(d_{\text{km}}) + 20 \log_{10}(f_{\text{MHz}})$$

### Mandatory Assumptions & Operational Boundary Conditions
Every link calculation in ElectroKit displays the following required assumptions:
1. **Unobstructed Line-of-Sight (LOS)**: The 1st Fresnel zone ($r_1 = \sqrt{\lambda d_1 d_2 / d}$) is at least $60\%$ to $80\%$ clear of terrain, buildings, and vegetation.
2. **Far-Field Condition (Fraunhofer Distance)**:
   $$d \ge \frac{2 D^2}{\lambda}$$
   where $D$ is the largest physical aperture dimension. Calculations are invalid in the reactive near-field or Fresnel radiative regions.
3. **Ideal Homogeneous Medium**: Assumes free-space vacuum or standard dry air with refractive index $n = 1.000$.
4. **No Multipath or Ground Reflections**: Does not account for constructive or destructive ground bounce (two-ray ground reflection model).
5. **No Atmospheric Absorption or Rain Fade**: Frequencies above $10\text{ GHz}$ incur significant attenuation due to atmospheric water vapor, oxygen absorption (e.g. $60\text{ GHz}$ peak), and hydrometeor scattering.

---

## 5. Radiated Power: EIRP vs. ERP

- **EIRP (Equivalent Isotropically Radiated Power)**:
  Power radiated relative to a theoretical isotropic point source with $0\text{ dBi}$ gain:
  $$\text{EIRP (dBm)} = P_{tx\text{ (dBm)}} - L_{cable\text{ (dB)}} + G_{tx\text{ (dBi)}}$$
- **ERP (Effective Radiated Power)**:
  Power radiated relative to an ideal half-wave dipole ($2.15\text{ dBi}$):
  $$\text{ERP (dBm)} = \text{EIRP (dBm)} - 2.15\text{ dB}$$
  $$\text{ERP (Watts)} = \frac{\text{EIRP (Watts)}}{1.641}$$

---

## 6. Antenna Engineering

### A. Resonant Length Sizing
- **Quarter-Wave Monopole ($\lambda/4$)**:
  $$L = \frac{c}{4 f} \times VF$$
  where $VF$ is the velocity factor of the conductor (typically $0.95$ for bare wire).
- **Half-Wave Dipole ($\lambda/2$)**:
  $$L = \frac{c}{2 f} \times VF \times 0.95$$
  (incorporates standard $5\%$ end-effect capacitance shortening).

### B. Effective Aperture
The maximum effective collecting aperture of an antenna in receiving mode:
$$A_{eff} = \frac{\lambda^2}{4\pi} \cdot G_{\text{linear}} = \frac{\lambda^2}{4\pi} \cdot 10^{\frac{G_{\text{dBi}}}{10}}$$

### C. Parabolic Aperture Beamwidth (Dish)
For circular aperture reflectors with uniform or moderate tapered illumination:
$$\theta_{3\text{dB}} \approx 70^\circ \times \frac{\lambda}{D}$$
> **Engineering Notice**: This formula is specific to high-gain aperture antennas (parabolic reflectors, horns). It is **not** universally applicable to wire antennas, patch arrays, or collinear stacks, whose beamwidths depend heavily on element geometry and phase distribution.

### D. Polarization Mismatch Loss
When linearly polarized transmitter and receiver antennas are rotated by spatial angle $\theta$:
$$L_{pol} = -10 \log_{10}(\cos^2 \theta) = -20 \log_{10}(\cos \theta)$$
- $\theta = 0^\circ \implies L_{pol} = 0\text{ dB}$ (perfect alignment)
- $\theta = 45^\circ \implies L_{pol} \approx 3.01\text{ dB}$ (half power transferred)
- $\theta = 90^\circ \implies L_{pol} \to \infty$ (theoretical cross-polarization null; typically $-20\text{ dB}$ to $-30\text{ dB}$ in practice due to cross-pol leakage).

---

## 7. RF Noise, Sensitivity & Friis Cascade

### A. Johnson-Nyquist Thermal Noise Floor
The available thermal noise power in bandwidth $B$ at standard reference temperature $T_0 = 290\text{ K}$:
$$P_n = k_B \cdot T_0 \cdot B$$
Expressed in $\text{dBm}$:
$$P_n\text{ (dBm)} = 10 \log_{10}(k_B T_0 \times 1000) + 10 \log_{10}(B) = -173.975 + 10 \log_{10}(B)$$
- In a $1\text{ Hz}$ bandwidth: $P_n \approx -174\text{ dBm/Hz}$
- In a $1\text{ MHz}$ bandwidth: $P_n \approx -174 + 60 = -114\text{ dBm}$

### B. Noise Figure and Noise Temperature
The Noise Factor $F$ and Noise Figure $NF$:
$$F = 1 + \frac{T_e}{T_0} \iff NF = 10 \log_{10}(F)$$
$$T_e = T_0 (F - 1) = 290 \cdot (10^{\frac{NF}{10}} - 1)$$

### C. Friis Cascade Formula for Noise Figure
For a multi-stage RF front-end receiver chain (e.g. Bandpass Filter $\to$ LNA $\to$ Mixer $\to$ IF Amplifier):
$$F_{total} = F_1 + \frac{F_2 - 1}{G_1} + \frac{F_3 - 1}{G_1 G_2} + \dots + \frac{F_n - 1}{\prod_{i=1}^{n-1} G_i}$$
where $F_i$ and $G_i$ are in linear power ratios (not decibels).
> **Key Principle**: The first stage dominates the overall system noise figure. High gain ($G_1$) in the first stage suppresses the noise contributions of all subsequent stages. A passive pre-selector filter placed *before* the LNA introduces loss ($F = L$) that directly adds $\text{dB}$-for-$\text{dB}$ to the system noise figure.

### D. Receiver Sensitivity
Minimum receivable input power required to achieve a specified signal-to-noise ratio ($SNR_{req}$):
$$S_{\text{rx (dBm)}} = P_n\text{ (dBm)} + NF\text{ (dB)} + SNR_{req\text{ (dB)}}$$

### E. ADC Quantization Noise Floor
For an ideal $N$-bit analog-to-digital converter over the Nyquist bandwidth:
$$\text{SNR}_{\text{ideal}} = 6.02 \times N + 1.76\text{ dB}$$
With oversampling ratio $OSR = f_s / (2 \cdot f_{signal})$:
$$\text{SNR}_{\text{oversampled}} = 6.02 N + 1.76 + 10 \log_{10}(OSR)\text{ dB}$$

---

## 8. Complete RF Link Budget & Fade Margin

The total received power $P_{rx}$ at the detector:
$$P_{rx\text{ (dBm)}} = \text{EIRP}_{\text{dBm}} - \text{FSPL}_{\text{dB}} - L_{misc\text{ (dB)}} + G_{rx\text{ (dBi)}} - L_{rx\_cable\text{ (dB)}}$$

The **Fade Margin** is defined as:
$$\text{Fade Margin (dB)} = P_{rx\text{ (dBm)}} - S_{rx\text{ (dBm)}}$$

### Margin Classification Guidance
- **$> 20\text{ dB}$ (Strong Link)**: Robust against typical weather variations, multipath fading, and minor alignment drift.
- **$10\text{ dB}$ to $20\text{ dB}$ (Acceptable)**: Standard commercial engineering target for terrestrial point-to-point links.
- **$0\text{ dB}$ to $10\text{ dB}$ (Marginal)**: High vulnerability to rain fade, vegetation foliage growth, and temperature inversions.
- **$< 0\text{ dB}$ (Unviable)**: Received power is below the demodulator's thermal threshold.

> **Engineering Disclaimer**: A positive calculated fade margin does not guarantee link uptime. Real-world systems require statistical modeling (e.g. ITU-R P.530 for rain fade, Rayleigh/Rician multipath fading models, and Fresnel diffraction over obstacles).
