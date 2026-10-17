# ElectroKit V2 — Wave 04: System Power Architecture

## 1. Architectural Philosophy & Principles

ElectroKit V2 Wave 04 introduces **System Power Architecture** as an engineering workspace and graph orchestration layer. Unlike calculator-centric approaches that treat power conversion stages as disconnected standalone tools, Wave 04 models the entire hardware power network as a coherent, bidirectional graph:

```
[Power Sources] ──> [Input Rails] ──> [Conversion Stages] ──> [Regulated Rails] ──> [System Loads]
       │                                     │                        │                    │
  Available P/I                         Loss Chain              Utilization/Margin      Priority/State
```

### Core Architecture Axioms
1. **Workspace Orchestrates, Engines Calculate**: Wave 04 does **not** introduce any new calculation formulas. It orchestrates the locked deterministic engineering engines from Phase 04/05/12 (`estimateInputPower`, `calculateDcPowerBudget`, `calculateConverterLossChain`).
2. **First-Class Engineering Objects**: Power Sources, Conversion Stages, Power Rails, and Power Loads are first-class versioned entities with typed lifecycles and unique prefixes (`psrc_`, `conv_`, `rail_`, `load_`, `seq_`).
3. **Graph-Aware Cascaded Power Flow**: Power demanded by downstream loads back-propagates through conversion stages to calculate real stage input demand and overall input power from sources.
4. **Cryptographic Integrity & Traceability**: System power analyses produce immutable snapshots with deterministic SHA-256 digests (`snap_`) that link to system requirements, design cases, and validation records.

---

## 2. Power Architecture Data Model

The domain model is defined in `src/workspace/v2/types/power-architecture.ts` and extends the V2 Engineering Object Model:

### 2.1 Power Sources (`PowerSourceV2`)
Models bench supplies, AC mains converters, USB-C PD sources, and battery packs:
- `id`: `psrc_...`
- `name`: Human-readable identifier (e.g., "Main 24V DC Bench Supply")
- `sourceType`: `'dc_input' | 'ac_mains' | 'battery' | 'external_adapter' | 'usb_power' | 'internal_generator' | 'solar_pv' | 'other'`
- `nominalVoltage`, `minVoltage`, `maxVoltage`: Operating voltage envelope
- `availableCurrentAmps`, `availablePowerWatts`: Source capabilities
- `sourceImpedanceOhms`: Output impedance for transient and drop modeling
- `outputRailId`: Downstream rail fed by this source
- `status`: `'active' | 'standby' | 'fault' | 'offline'`

### 2.2 Conversion Stages (`PowerConversionStageV2`)
Models DC-DC converters, linear regulators (LDOs), and power conditioning blocks:
- `id`: `conv_...`
- `name`: (e.g., "Synchronous Buck Stage")
- `topology`: `'buck' | 'boost' | 'buck_boost' | 'ldo' | 'flyback' | 'forward' | 'charge_pump'`
- `inputRailId` & `outputRailId`: Inbound and outbound rail topology links
- `expectedEfficiencyPercent`: Nominal conversion efficiency
- `maxOutputCurrentAmps`: Rated current carrying capability
- `switchingFrequencyKhz`: Operating frequency
- `thermalDissipationWatts`: Active loss contribution

### 2.3 Power Rails (`PowerRailV2`)
Deepened model for power distribution busses:
- `id`: `rail_...`
- `name`: (e.g., "VIN_24V", "VOUT_5V")
- `type`: `'raw_dc' | 'regulated_dc' | 'switched_rail' | 'battery_rail' | 'ac_rail'`
- `nominalVoltage`, `minVoltage`, `maxVoltage`: Voltage regulation window
- `maxCurrentAmps`: Trace/inductor current rating
- `powerLimitWatts`: Optional power budget cap

### 2.4 Power Loads (`PowerLoadV2`)
Models electronic payload components:
- `id`: `load_...`
- `name`: (e.g., "5V Active System Payload", "RF Power Amplifier")
- `railId`: Supplying power rail
- `nominalCurrentAmps`, `peakCurrentAmps`, `startupCurrentAmps`
- `dutyCycleFraction`: Operating duty cycle (0.0 to 1.0)
- `nominalPowerWatts`, `peakPowerWatts`
- `priority`: `'critical' | 'essential' | 'standard' | 'non_essential' | 'sheddable'`
- `operatingState`: `'sleep' | 'idle' | 'nominal' | 'peak' | 'active'`

### 2.5 Sequencing Rules (`PowerSequencingRuleV2`)
Models timing and prerequisite constraints between rails:
- `id`: `seq_...`
- `name`: (e.g., "VIN Good before VOUT Enable")
- `predecessorRailId`, `successorRailId`: Rail ordering pair
- `dependencyType`: `'power_good' | 'enable' | 'delay' | 'reset_release'`
- `delayMilliSeconds`: Timing delay
- `requiredPredecessorVoltagePercent`: Voltage threshold (e.g., 90%)

---

## 3. Engineering Engine Orchestration (`src/workspace/v2/power/power-architecture-engine.ts`)

The power architecture engine provides deterministic graph computation:

### 3.1 Flow Analysis & Cascaded Losses
1. Maps direct loads to rails and calculates nominal power contributions.
2. Back-propagates load demand from output rails through conversion stages to their feeding input rails using `estimateInputPower(outP, eff)`.
3. Sums stage dissipation losses:
   $$\text{Input Power} = \frac{\text{Delivered Power}}{\eta}$$
   $$\text{Dissipated Loss} = \text{Input Power} - \text{Delivered Power}$$
4. Computes cascaded system efficiency across all stages:
   $$\eta_{\text{cascaded}} = \frac{\sum P_{\text{payload}}}{\sum P_{\text{system,in}}} \times 100$$

### 3.2 Rail Limit Auditing
Each rail is evaluated across three dimensions:
- **Voltage Bounds**: Verifies rail nominal voltage conforms to load min/max requirements.
- **Current Margin**: Evaluates utilization percentage and headroom against `maxCurrentAmps`.
  - $\le 80\%$: `PASS`
  - $80\% - 100\%$: `MARGINAL`
  - $> 100\%$: `FAIL`
- **Power Limit**: Verifies total demanded power against rail budget.

### 3.3 Power Tree Construction
`buildPowerTree()` constructs a tree representation starting from primary power sources down through input rails, converters, regulated rails, and loads. Disconnected loads and unfed rails are reported.

### 3.4 Cycle & Topological Integrity Detection
- `detectPowerFlowCycles()`: Detects feedback loops in converter rail routings (e.g., Rail A $\to$ Conv 1 $\to$ Rail B $\to$ Conv 2 $\to$ Rail A) using depth-first search cycle detection.
- `detectSequencingCycles()`: Catches circular sequencing rules before hardware damage can occur.

### 3.5 System Bottleneck Analyzer
Automatically detects and ranks system-level bottlenecks:
- Source capacity over-utilization
- Converter stage current limits
- Rail ampacity bottlenecks
- Voltage range violations

### 3.6 Cryptographic Snapshots
`createPowerAnalysisSnapshot()` packages power flow results into a `CalculationSnapshotV2` with:
- Deterministic canonical JSON serialization
- Cryptographic SHA-256 digest (`computeSnapshotDigest`)
- Traceability links to design cases and requirements
- Immutability enforcement (tamper attempts fail `verifySnapshotIntegrity`)

---

## 4. Verification & Audit Results

The dedicated verification suite `tests/v2-wave04-system-power-verification.ts` executes **38 forensic assertions** with zero failures:

| Test Section | Assertions | Status |
| :--- | :---: | :---: |
| 1. Power Domain Model (Sources, Converters, Rails, Loads) | 5 | PASS |
| 2. Cascaded Calculations & Loss Chains | 2 | PASS |
| 3. System Power Flow & Rail Limit Auditing | 5 | PASS |
| 4. Power Tree Hierarchy & Traversal | 3 | PASS |
| 5. Dependency & Power Sequencing Rules | 3 | PASS |
| 6. System Bottleneck Identification | 2 | PASS |
| 7. Design Cases & Scenario Isolation | 1 | PASS |
| 8. Cryptographic Snapshots & Tamper Resistance | 2 | PASS |
| 9. End-to-End System Traceability | 1 | PASS |
| 10. Persistence, Serialization & Migration | 4 | PASS |
| 11. Global Search Across Power Objects | 3 | PASS |
| 12. Enterprise Performance Stress Test | 6 | PASS |
| 13. Zero Regression on V1 Baseline | 1 | PASS |
| **Wave 04 Dedicated Total** | **38 / 38** | **100% PASS** |

### Enterprise Scale Performance Benchmarks
Tested on a massive architecture containing:
- 1,000 components & 2,000 pins
- 500 nets & 200 power rails
- 100 power conversion stages
- 500 loads & 500 pin connections
- 200 power distribution paths
- 100 corner scenarios

**Results**:
- Architecture Creation: **4ms** (< 300ms budget)
- Full Power Flow Analysis (500 loads, 100 converters): **10ms** (< 100ms budget)
- Multi-Root Power Tree Construction: **3ms** (< 50ms budget)
- Global Search across 2,500+ entities: **4ms** (< 50ms budget)
- Full Sanitized JSON Export (953 KB): **28ms** (< 150ms budget)
- Cryptographic Snapshot Digest Generation: **7ms** (< 100ms budget)

---

## 5. Unified Verification Accounting

```
Existing Locked Baseline:
  V1 Master Engineering Audit:       594 / 594
  Phase 13 Forensic Audit:            29 / 29
  Release Hardening Verification:     18 / 18
  V2 Wave 01 Architecture:           122 / 122
  V2 Wave 02 Workspace:               93 / 93
  V2 Wave 03 Engineering Objects:     92 / 92
  ──────────────────────────────────────────
  Baseline Subtotal:                 948 / 948

Wave 04 Dedicated Suite:
  V2 Wave 04 System Power:            38 / 38

────────────────────────────────────────────
COMBINED VERIFIED TOTAL:             986 / 986
TypeScript Strict Checks:            0 errors
Production Build:                    PASS
```
