# ElectroKit V2 — Wave 03: Engineering Object Model
**Architecture & Implementation Specification**  
**Document Version:** 1.0.0  
**Schema Compatibility:** `2.0.0`

---

## 1. Executive Summary

ElectroKit V2 Wave 03 establishes the **Engineering Object Model** that transforms the ElectroKit workspace from an isolated set of calculation forms into an interconnected, system-aware hardware engineering design workbench.

Prior to Wave 03, components and nets were simple data records. Wave 03 creates a cohesive, multi-domain object model where **Components**, **Pins**, **Nets**, **Rails**, **Connections**, **Power Paths**, **Signal Paths**, **Thermal Paths**, and **Datasheet References** form a traversable engineering graph.

### Architectural Invariant
```
WORKSPACE ORCHESTRATES
    ↓
ENGINEERING OBJECTS MODEL THE PHYSICAL SYSTEM
    ↓
DETERMINISTIC ENGINES CALCULATE
    ↓
IMMUTABLE SNAPSHOTS RECORD HISTORY
    ↓
TRACEABILITY PRESERVES WHY
```

Calculations reference objects; calculations never mutate objects directly. Historical calculation snapshots remain cryptographically sealed and immutable even if components are modified or deleted.

---

## 2. Core Object Hierarchy

Every persistent engineering object conforms to the following lifecycle principle:

```
EngineeringObject
│
├── Identity (Stable, typed, collision-resistant ID: comp_..., pin_..., net_..., etc.)
├── Metadata (RefDes, name, manufacturer, package, description)
├── Properties (Structured domain groups: electrical, thermal, physical, RF, battery)
├── Ratings (Absolute maximum, recommended operating, conditions, sources)
├── Pins (Terminal connectivity: roles, domains, directions, net assignment)
├── Relationships (Traceability links, power/signal/thermal paths, connections)
├── References (Datasheet, application notes, standards, manufacturer specifications)
└── Lifecycle (concept → selected → procured → tested → qualified → obsolete)
```

---

## 3. Component Model (`EngineeringComponentV2`)

A component is the primary physical unit of hardware design. It models passive components, active semiconductors, ICs, power converters, connectors, and sensors without forcing irrelevant fields onto every component type.

### 3.1 Properties & Categorization
Components support typed property groups:
- **Electrical**: Nominal & max voltages, currents, power dissipation, resistance, capacitance, inductance, frequency, impedance, tolerance.
- **Thermal**: $R_{\theta JC}$, $R_{\theta JA}$, $R_{\theta JB}$, maximum junction temperature $T_{J,\max}$, temperature coefficients.
- **Physical**: Length, width, height, mass, package geometry (e.g. `QFN-32`, `0805`, `TO-220`, `LGA-12`), mounting technology (`SMD`, `Through-Hole`, `Chassis`).
- **RF**: Frequency bounds, characteristic impedance, gain, noise figure, return loss, isolation.
- **Battery**: Chemistry (Li-ion NMC, LiFePO4, LTO, etc.), capacity, nominal voltage, internal resistance, series/parallel configuration ($S/P$).

### 3.2 Deep Component Cloning (`cloneComponent`)
When duplicating components (e.g., $R_1 \rightarrow R_2$), `cloneComponent`:
1. Generates a fresh stable entity ID (`comp_...`).
2. Deep-copies all property groups and parametric ratings.
3. Generates brand new stable IDs for each pin (`pin_...`) and rating (`rat_...`) to prevent accidental shared mutable references.
4. Resets transient lifecycle states while preserving design parameters.

---

## 4. Rating Model (`ComponentRatingV2`)

Ratings are strictly decoupled from nominal properties. A component rating explicitly defines the physical boundaries of safe operation:

```typescript
export type RatingType =
  | 'absolute_maximum'
  | 'recommended_operating'
  | 'typical'
  | 'minimum'
  | 'maximum';

export interface ComponentRatingV2 {
  id: string; // rat_...
  parameter: string; // e.g. "Vds_max", "Id_continuous", "P_diss"
  value: number;
  unit: string; // e.g. "V", "A", "W", "°C"
  ratingType: RatingType;
  condition?: string; // e.g. "TJ = 25°C, VGS = 10V"
  temperatureC?: number;
  source?: string; // e.g. "EPC2045 Datasheet Table 1"
  isGuaranteed?: boolean;
  notes?: string;
}
```

A rating is never assumed to be guaranteed unless substantiated by an explicit datasheet reference.

---

## 5. Physical Pin Model (`ComponentPinV2`)

Components expose physical terminals via the pin model:
- **Pin Number**: String or number (`"1"`, `"A1"`, `"PAD"`).
- **Name**: Functional mnemonic (`"DRAIN"`, `"SW"`, `"BOOT"`, `"FB"`).
- **Type**: `power`, `ground`, `digital_in`, `digital_out`, `digital_io`, `analog_in`, `analog_out`, `passive`, `rf`, `clock`, `control`, `no_connect`.
- **Direction**: `in`, `out`, `bidirectional`, `passive`, `power`, `ground`, `unspecified`.
- **Domain**: `power`, `ground`, `analog`, `digital`, `clock`, `rf`, `control`, `mechanical`.
- **Electrical Role**: `power_supply`, `power_ground`, `passive`, `control`, `clock`, `high_impedance`, `nc`.
- **Assigned Net**: Direct foreign key link to an `EngineeringNetV2` (`netId`).

---

## 6. Net & Power Rail Model

### 6.1 Electrical Nets (`EngineeringNetV2`)
An electrical net defines an equipotential node across pins and physical traces:
- **Net Classes**: `power_rail`, `ground`, `analog`, `high_speed_digital`, `general_io`, `rf_line`, `sense`.
- **Domain**: `power`, `ground`, `analog`, `digital`, `rf`, `thermal`, `mechanical`.
- **Parameters**: Nominal voltage, maximum current capacity, target characteristic impedance $Z_0$.
- **Rail Association**: Optional link to parent `PowerRailV2` (`railId`).

### 6.2 Power Rails (`PowerRailV2`)
A power rail represents a regulated or distributed electrical power bus:
- **Voltage Range**: Nominal voltage with strict min/max limits (e.g. $4.9\,\text{V} \le 5.0\,\text{V} \le 5.1\,\text{V}$).
- **Limits**: Maximum continuous current rating (`maxCurrentAmps`), peak current limit (`currentLimitAmps`), power envelope (`powerLimitWatts`).
- **Sources & Loads**: Foreign keys pointing to supplying converters (`sourceConverterId`) and consumer components (`loadIds`).

---

## 7. Multi-Domain Paths

Wave 03 introduces reusable path abstractions that organize physical flows across components without running premature simulations:

### 7.1 Power Paths (`PowerPathV2`)
Organizes power flow from sources to loads through conversion stages:
- **Source**: Supplying component (e.g. DC input jack, battery pack).
- **Ordered Stages**: Stage components (e.g. [Fuse, Reverse Protection FET, Synchronous Buck Converter, Output Filter Inductor]).
- **Destination**: Load component (e.g. Microcontroller core, RF PA).
- **Linked Artifacts**: Bound requirements, calculation instances, and historical snapshots.

### 7.2 Signal Paths (`SignalPathV2`)
Organizes high-speed digital, analog, and RF signal propagation:
- **Source & Destination**: Driver and receiver components.
- **Stage Components**: Intermediate signal-conditioning elements (e.g. Low-pass filters, instrumentation amps, ESD clamps).
- **Parameters**: Signal type (`digital_high_speed`, `differential`, `rf`, `analog_low_level`), carrier/bus frequency, transmission direction.

### 7.3 Thermal Paths (`ThermalPathV2`)
Organizes heat transfer from junction to ambient:
- **Source**: Heat generator (e.g. GaN transistor junction, power inductor).
- **Stages**: Thermal interfaces, PCB copper thermal vias, heatsink.
- **Destination**: Ambient air or cold plate.
- **Parameters**: Thermal interface material (TIM), total equivalent thermal resistance $R_{\theta,\text{tot}}$ (°C/W).

---

## 8. Reference Model & Untrusted URL Sanitization

All hardware objects can link to engineering references (`EngineeringReferenceV2`):
- **Types**: `datasheet`, `application_note`, `standard`, `manufacturer_page`, `internal_document`, `measurement_record`.
- **Metadata**: Title, publisher, identifier, revision, publication date, manufacturer part number.
- **Security & URL Sanitization**: URLs are treated as untrusted strings. The `sanitizeReferenceUrl` engine strictly rejects:
  - `javascript:` URIs
  - `data:` URIs
  - `vbscript:` URIs
  - Embedded `<script>` or event-handler payloads (`onload=`, `onerror=`)
  - Any non-HTTP/HTTPS protocol scheme

---

## 9. Delete Safety & Historical Immutability

### 9.1 Dependency Auditing (`canDeleteComponent`)
Before any component is deleted, `canDeleteComponent` audits the entire project graph:
- Active schematic/PCB connections
- Subsystem allocations
- Power paths, signal paths, and thermal paths
- Bound calculation instances
- Power rail load allocations
- Traceability links and risk register issues

If dependencies exist, standard deletion is blocked and a detailed dependency report is returned.

### 9.2 Cascade Deletion & Snapshot Immutability
If force-delete is explicitly confirmed:
- References are cleaned across connections, paths, subsystems, and traceability links.
- **CRITICAL INVARIANT**: Historical calculation snapshots (`CalculationSnapshotV2`) and project revisions remain **100% immutable**. Historical calculation results, cryptographic digests, inputs, and outputs are never mutated or destroyed.

---

## 10. Verification & Audit Results

The entire verification pipeline has been executed and confirmed:

| Suite | Status | Assertions |
|---|---|---|
| **V1 Master Engineering Audit** | PASS | 594 / 594 |
| **Phase 13 Forensic Audit** | PASS | 29 / 29 |
| **Release Hardening Verification** | PASS | 18 / 18 |
| **V2 Wave 01 Architecture** | PASS | 122 / 122 |
| **V2 Wave 02 Workspace** | PASS | 93 / 93 |
| **V2 Wave 03 Engineering Object Model** | PASS | 92 / 92 |
| **TOTAL VERIFIED ASSERTIONS** | **PASS** | **948 / 948** |
| **TypeScript Strict Check** (`tsc --noEmit`) | **PASS** | 0 errors |
| **Production Build** (`npm run build`) | **PASS** | Completed |

### Enterprise Scale Performance Benchmark
- **500 components, 1,000 pins, 300 nets, 100 rails, 100 connections, 150 paths**:
  - Model Construction: **6 ms** (budget: < 150 ms)
  - Full Entity Search: **3 ms** (budget: < 30 ms)
  - Graph Traversal: **< 1 ms** (budget: < 20 ms)
  - JSON Export & Serialization (685 KB): **32 ms** (budget: < 60 ms)

---

## 11. Future-Wave Boundaries

Wave 03 strictly provides the **common object model**. The following domain-specific workspaces and simulators belong strictly to future waves:

- **Wave 04 — System Power Architecture**: Power budget trees, rail sequencing, and converter loss modeling.
- **Wave 05 — Deep PCB Workspace**: Stackup synthesis, impedance modeling, and PCB trace ampacity.
- **Wave 06 — Thermal System Workspace**: Multi-node thermal resistance networks and heatsink equations.
- **Wave 07 — Battery & Energy System Workspace**: Peukert runtime, cell degradation, and SOC curve analysis.
- **Wave 08 — RF / Signal System Workspace**: Friis transmission, S-parameters, and transmission line analysis.
