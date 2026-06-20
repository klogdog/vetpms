# Review Agent Instructions - VetPMS Workstation

Welcome, Review Agent! This document contains the principal-grade **verification checklist, architecture map, and testing protocols** to audit the Veterinary Practice Management System (VetPMS) implementation.

VetPMS is written as a modern, high-fidelity, standalone client-side SPA (Single Page Application) using vanilla HTML5 APIs, ES6 JS, and modern glassmorphic CSS tokens. There are no heavy dependencies or compile steps required; the entire clinical workstation and integration simulator runs directly in the browser via `file://` or local server protocols.

---

## 1. System Architecture Map

As a review agent, you can inspect the file boundaries in the workspace:

- [index.html](file:///Users/jefferypowell/Desktop/vetpms/index.html): Central layout structuring sidebars, whiteboards, EHRs, PACS viewports, lab chemistry panels, DEA drug logs, and Stripe payment terminals.
- [index.css](file:///Users/jefferypowell/Desktop/vetpms/index.css): Design system variables, responsive dashboard grids, custom scrolls, and micro-animations.
- [app.js](file:///Users/jefferypowell/Desktop/vetpms/app.js): Global state engine, bitemporal custody structures, time-series weight histories, and toast alerts layer.
- [modules/whiteboard.js](file:///Users/jefferypowell/Desktop/vetpms/modules/whiteboard.js): Cage numbers location allocations, drag-and-drop flow whiteboards, and printable RECOVER CPR dosing calculators.
- [modules/medicalRecords.js](file:///Users/jefferypowell/Desktop/vetpms/modules/medicalRecords.js): Weight age flags, BCS WSAVA drop-downs, Meeh BSA math, Plumb's safety locks (MDR1, kidney failure blocks), Triadan dental chart maps, and Form 51 Rabies certificate compilers.
- [modules/imaging.js](file:///Users/jefferypowell/Desktop/vetpms/modules/imaging.js): PACS Modality Worklist queues, C-STORE simulated generators, window contrast levels, and interactive heart-scale calipers.
- [modules/laboratories.js](file:///Users/jefferypowell/Desktop/vetpms/modules/laboratories.js): Analyzer centrifuge progress bars, standard biochemistry panels, and breed-specific Greyhound HCT/PLT baseline reference range shifts.
- [modules/substances.js](file:///Users/jefferypowell/Desktop/vetpms/modules/substances.js): DEA vault container vials depletion ledgers, double-PIN EPCS locks, and ASAP 4.2B state PMP batch compiler segments.
- [modules/billing.js](file:///Users/jefferypowell/Desktop/vetpms/modules/billing.js): VMGA Standard Chart aggregates, ProSal production percentages splits, Trupanion claims calculators, card terminal mocks, and automated Missed-Charge Capture Diff panels.

---

## 2. Automated Test Verification

A complete graphical, automated assertion suite is available at [test.html](file:///Users/jefferypowell/Desktop/vetpms/test.html).

### Verification Steps for Review Agents:

1.  **Launch the Test Runner**:
    Open the [test.html](file:///Users/jefferypowell/Desktop/vetpms/test.html) file directly in your Chrome or Safari browser:
    ```bash
    # Command line shortcut to launch in default mac browser:
    open /Users/jefferypowell/Desktop/vetpms/test.html
    ```
2.  **Inspect Assertions results**:
    Verify that all **10 clinical integration test cases** show green `✓ PASS` status results.
3.  **Confirm Test Scope Coverage**:
    - **Test 1 (Bitemporal Custody)**: Asserts Sarah Connor holds 80% billing share and co-owner John Connor holds 20% communications share.
    - **Test 2 (Sarcoma Risk Compliance)**: Asserts Rabies vaccine localized to Right Hind Limb SQ in Felines versus Right Shoulder SQ in Canines.
    - **Test 3 (MDR1 Mutation Block)**: Asserts Plumb's dosing lock blocks high-dose Ivermectin on Max.
    - **Test 4 (Kidney NSAID Block)**: Asserts Plumb's dosing lock blocks Meloxicam on Oliver due to chronic azotemia.
    - **Test 5 (Meeh BSA Calculation)**: Asserts Oliver feline computes exactly $0.260\text{ m}^2$ and Duke canine computes exactly $1.014\text{ m}^2$.
    - **Test 6 (Triadan Extraction Auto-Bill)**: Asserts tooth extraction logs apply correct pathology and add a standard $185.00 fee to active invoices.
    - **Test 7 (RECOVER CPR Volumes)**: Asserts 34.1kg dog calculates exactly 0.34mL of Epinephrine.
    - **Test 8 (Greyhound Anomalies)**: Asserts Duke's high RBC HCT (61.2%) and low PLT (105) fall inside shifted breed references as normal greyhound baselines.
    - **Test 9 (DEA Perpetual Container Depletion)**: Asserts drawing drug decrements from active vial `CON-K092` and marks it `depleted = true` when empty. Verifies ASAP 4.2B text structures (`TH*`, `PAT*`, `DSP*`, `PRE*`, `TP*`).
    - **Test 10 (Missed-Charge Capture)**: Asserts unbilled DEA draws are caught by the billing diff compiler and auto-billed to invoice in 1 click.

---

## 3. Human & AI Review Checklist

When auditing the code for correctness, double-check that these key logical structures remain intact and conform to principal-grade compliance:

### 1. The Bitemporal Data Invariant

- **Rules**: All clinical events (SOAP plans, lab results, drug draws) must foreign-key directly to the `Animal` ID (`pet-1`), **never** to the owner or ownership block. Owners may shift or divorce, but the animal's medical chart remains a singular, cohesive ledger.
- **Check**: Inspect [app.js](file:///Users/jefferypowell/Desktop/vetpms/app.js) to confirm that the `ownerships` array splits party associations independently, and billing queries active ownerships at checkout.

### 2. The Weight-to-Dosing Check

- **Rules**: Weightobservations must have explicit date timestamps. Dosing math must read this time-series history and warn the practitioner if a weight is stale.
- **Check**: Inspect [modules/medicalRecords.js](file:///Users/jefferypowell/Desktop/vetpms/modules/medicalRecords.js) to confirm that the weight age checker computes day diffs and shifts styles dynamically if weight observations are > 30 days old.

### 3. Plumb's Safety Guardrails

- **Rules**: Enforce secure blocks at dose calculation time. MDR1 Collie mutations must block macrocyclic lactones. Azotemic kidney states must block NSAID Meloxicam.
- **Check**: Confirm in [modules/medicalRecords.js](file:///Users/jefferypowell/Desktop/vetpms/modules/medicalRecords.js) `handleCalculateDose()` that the calculator checks warnings and renal labs profiles before approving drug formulas.

### 4. DEA Perpetual Log Integrity

- **Rules**: Inventories must track specific commercial container vials with unique IDs. Waste and drawn volumes must be recorded independently. Depleted vials must close and archive.
- **Check**: Confirm in [modules/substances.js](file:///Users/jefferypowell/Desktop/vetpms/modules/substances.js) that drawing decrements from active vials in `drugContainers` and updates PMP compilation blocks.

### 5. Automated Revenue Diff Capturing

- **Rules**: Scans documented medical files against checkout registers to spot revenue leakages.
- **Check**: Confirm in [modules/billing.js](file:///Users/jefferypowell/Desktop/vetpms/modules/billing.js) `reconcileMissedCharges()` that the engine matches entries and performs secure invoice merges without double-taxing or duplicating items.
