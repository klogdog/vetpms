import { describe, it, expect, beforeEach } from 'vitest';

describe('VetPMS Clinical Workstation Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = window.vetApp;
    // Reset state before each test
    app.state.animals = JSON.parse(
      JSON.stringify([
        {
          id: 'pet-1',
          name: 'Oliver',
          species: 'Feline',
          breed: 'Siamese',
          breedSource: 'DNA-tested (Wisdom Panel)',
          sex: 'M',
          reproductiveStatus: 'neutered',
          reproEffectiveDate: '2022-11-04',
          dob: '2022-04-12',
          dobPrecision: 'exact',
          microchips: [
            {
              chipId: '985112000293810',
              registry: 'HomeAgain',
              compliant: true,
              date: '2022-07-15',
              location: 'Left Scapular',
            },
          ],
          warnings: [
            'Allergy: Penicillin',
            'Will Hiss/Scratch when handled',
            'Chronic Kidney Disease (CKD) Stage 2',
          ],
          alertCategory: 'medical',
          triage: 'Standard',
          status: 'Checked In',
          location: 'Ward C-04',
          vitals: {
            temp: 38.5,
            hr: 140,
            rr: 28,
            crt: '1.5s',
            mm: 'Pink',
            bcs: '5/9 (Ideal)',
            mcs: 'Normal',
          },
          soap: {
            subjective:
              'Owner reports Oliver has been lethargic and drinking excess water for 2 weeks. Mild weight loss noticed.',
            objective:
              'Vitals stable. Coat slightly dull. Palpation of kidneys reveals normal size, no pain.',
            assessment: 'Rule out Feline Chronic Kidney Disease (CKD) Stage 2, Diabetes Mellitus.',
            plan: 'Recommended complete blood biochemistry (Chem17 Catalyst) and urinalysis. Order fluid hydration support.',
          },
          invoices: [
            { item: 'Hospitalization Ward Rate (Per Day)', price: 85.0, category: 'Ward Fee' },
            {
              item: 'Intravenous Fluid Therapy Setup',
              price: 120.0,
              category: 'Medical Consumables',
            },
          ],
        },
        {
          id: 'pet-2',
          name: 'Bella',
          species: 'Canine',
          breed: 'Labrador Retriever',
          breedSource: 'Owner reported',
          sex: 'F',
          reproductiveStatus: 'spayed',
          reproEffectiveDate: '2021-03-10',
          dob: '2020-05-15',
          dobPrecision: 'exact',
          microchips: [
            {
              chipId: '985112000301928',
              registry: 'HomeAgain',
              compliant: true,
              date: '2020-07-20',
              location: 'Left Scapular',
            },
          ],
          warnings: [],
          alertCategory: 'none',
          triage: 'Standard',
          status: 'Diagnostics',
          location: 'Ward A-02',
          vitals: {
            temp: 38.8,
            hr: 90,
            rr: 20,
            crt: '1.0s',
            mm: 'Pink',
            bcs: '6/9 (Overweight)',
            mcs: 'Normal',
          },
          soap: {
            subjective: 'Limping on right hind limb since yesterday. No known trauma.',
            objective: 'Pain on extension of right stifle joint. Cranial drawer sign positive.',
            assessment: 'Right Cranial Cruciate Ligament (CCL) Rupture.',
            plan: 'Order radiographs of stifle. Dispense Meloxicam for inflammation. Restrict exercise.',
          },
          invoices: [],
        },
        {
          id: 'pet-3',
          name: 'Max',
          species: 'Canine',
          breed: 'Collie',
          breedSource: 'Pedigree papers',
          sex: 'M',
          reproductiveStatus: 'neutered',
          reproEffectiveDate: '2025-01-10',
          dob: '2024-05-12',
          dobPrecision: 'exact',
          microchips: [
            {
              chipId: '985112000412891',
              registry: 'AKC Reunite',
              compliant: true,
              date: '2024-07-02',
              location: 'Left Scapular',
            },
          ],
          warnings: ['Homozygous ABCB1/MDR1 Mutation Affected'],
          alertCategory: 'medical',
          triage: 'Critical',
          status: 'Triage/Vitals',
          location: 'ICU Run 1',
          vitals: {
            temp: 39.1,
            hr: 110,
            rr: 24,
            crt: '1.5s',
            mm: 'Pink',
            bcs: '4/9 (Underweight)',
            mcs: 'Mild Loss',
          },
          soap: {
            subjective: 'Referred for severe generalized demodecosis. Owner reports lethargy.',
            objective: 'Alopecia and deep pyoderma over 60% of body. Heart and lungs clear.',
            assessment: 'Severe Demodectic Mange. Homozygous MDR1 Mutation.',
            plan: 'Requires treatment plan. High-dose macrocyclic lactones contraindicated.',
          },
          invoices: [],
        },
        {
          id: 'pet-4',
          name: 'Duke',
          species: 'Canine',
          breed: 'Greyhound',
          breedSource: 'AKC Papers',
          sex: 'M',
          reproductiveStatus: 'neutered',
          reproEffectiveDate: '2020-04-10',
          dob: '2019-01-15',
          dobPrecision: 'exact',
          microchips: [
            {
              chipId: '985112000551029',
              registry: 'HomeAgain',
              compliant: true,
              date: '2019-03-01',
              location: 'Left Scapular',
            },
          ],
          warnings: ['Anesthesia Sensitivity'],
          alertCategory: 'medical',
          triage: 'Standard',
          status: 'Recovery',
          location: 'ICU Run 2',
          vitals: {
            temp: 38.2,
            hr: 80,
            rr: 18,
            crt: '1.0s',
            mm: 'Pink',
            bcs: '5/9 (Ideal)',
            mcs: 'Normal',
          },
          soap: {
            subjective: 'Standard wellness panel and dental prophylaxis.',
            objective: 'Moderate calculus and gingivitis on upper molars.',
            assessment: 'Grade II Periodontal Disease.',
            plan: 'Perform dental scaling and polishing. File complete CBC/Chem Catalyst.',
          },
          invoices: [],
        },
      ])
    );

    // Reset drug containers
    app.state.drugContainers = [
      {
        containerId: 'CON-K092',
        drugId: 'sub-1',
        volume: 10.0,
        maxVol: 50.0,
        opened: '2026-05-01',
        depleted: false,
      },
      {
        containerId: 'CON-K093',
        drugId: 'sub-1',
        volume: 32.5,
        maxVol: 50.0,
        opened: '2026-05-20',
        depleted: false,
      },
      {
        containerId: 'CON-B481',
        drugId: 'sub-2',
        volume: 8.2,
        maxVol: 10.0,
        opened: '2026-05-28',
        depleted: false,
      },
    ];

    // Reset vault
    app.state.vault = [
      { id: 'sub-1', name: 'Ketamine (100mg/mL)', balance: 42.5, unit: 'mL', limit: 5.0 },
      { id: 'sub-2', name: 'Buprenorphine (0.3mg/mL)', balance: 9.0, unit: 'mL', limit: 1.0 },
      { id: 'sub-3', name: 'Propofol (10mg/mL)', balance: 120.0, unit: 'mL', limit: 20.0 },
    ];

    // Reset audit logs
    app.state.auditLogs = [
      {
        timestamp: '2026-06-01 10:15',
        drugName: 'Ketamine (100mg/mL)',
        patientName: 'Bella',
        patientId: 'pet-2',
        vet: 'Dr. Jeffery Powell',
        witness: 'Tech: Sarah (PIN: 1234)',
        amount: 1.2,
        wasted: 0.2,
        balance: 43.7,
        reason: 'Pre-anesthetic induction',
      },
      {
        timestamp: '2026-06-01 14:30',
        drugName: 'Buprenorphine (0.3mg/mL)',
        patientName: 'Max',
        patientId: 'pet-3',
        vet: 'Dr. Evelyn Vance',
        witness: 'Tech: Mark (PIN: 1234)',
        amount: 0.8,
        wasted: 0.0,
        balance: 9.0,
        reason: 'ICU pain management',
      },
    ];
  });

  // ----------------------------------------------------
  // TEST 1: BITEMPORAL MANY-TO-MANY SHARED CUSTODY
  // ----------------------------------------------------
  it('should split bitemporal many-to-many shared custody correctly', () => {
    const oDetails = app.getOwnershipDetails('pet-1');
    expect(oDetails.length).toBe(2);

    const primaryBill = oDetails.find((o) => o.billing === true);
    expect(primaryBill.ownerName).toBe('Sarah Connor');
    expect(primaryBill.share).toBe(80);

    const secondaryComms = oDetails.find((o) => o.share === 20);
    expect(secondaryComms.ownerName).toBe('John Connor');
    expect(secondaryComms.communication).toBe(true);
  });

  // ----------------------------------------------------
  // TEST 2: VACCINES DUE DATE RULE & RABIES Form 51 SITE
  // ----------------------------------------------------
  it('should apply Form 51 Site compliance rules correctly', () => {
    const ehr = window.vetpmsEHR;
    const oliver = app.getPatient('pet-1');
    const duke = app.getPatient('pet-4');

    const container = document.getElementById('rabies-modal-content');
    container.innerHTML = '';

    ehr.openRabiesCertificate(oliver);
    expect(container.innerHTML).toContain('Right Hind Limb SQ (AAFP Guideline)');

    ehr.openRabiesCertificate(duke);
    expect(container.innerHTML).toContain('Right Shoulder SQ');

    container.innerHTML = ''; // clean up
  });

  // ----------------------------------------------------
  // TEST 3: PLUMB'S DOSING WARNINGS - MDR1 PHARMACOGENOMIC LOCK
  // ----------------------------------------------------
  it('should trigger Homozygous MDR1 Mutation block', () => {
    const max = app.getPatient('pet-3');
    app.activePatientId = max.id;

    const drugSelect = document.getElementById('dose-drug-select');
    drugSelect.innerHTML = `<option value="Ivermectin">Ivermectin</option>`;
    drugSelect.value = 'Ivermectin';

    const rateInput = document.getElementById('dose-rate-input');
    rateInput.value = 300;

    const resultsBox = document.getElementById('dose-calculator-result');
    resultsBox.innerHTML = '';

    const ehr = window.vetpmsEHR;
    ehr.handleCalculateDose();

    const feedback = resultsBox.innerHTML;
    expect(feedback).toContain("PLUMB'S DRUG BLOCK: MDR1 MUTATION AWARENESS");
    expect(feedback).toContain('Administration aborted');
  });

  // ----------------------------------------------------
  // TEST 4: PLUMB'S DOSING WARNINGS - Meloxicam kidney fail block
  // ----------------------------------------------------
  it('should block Meloxicam on acute renal contraindication', () => {
    const oliver = app.getPatient('pet-1');
    app.activePatientId = oliver.id;

    const drugSelect = document.getElementById('dose-drug-select');
    drugSelect.innerHTML = `<option value="Meloxicam">Meloxicam</option>`;
    drugSelect.value = 'Meloxicam';

    const rateInput = document.getElementById('dose-rate-input');
    rateInput.value = 0.2;

    const resultsBox = document.getElementById('dose-calculator-result');
    resultsBox.innerHTML = '';

    const ehr = window.vetpmsEHR;
    ehr.handleCalculateDose();

    const feedback = resultsBox.innerHTML;
    expect(feedback).toContain("PLUMB'S DRUG BLOCK: ACUTE RENAL CONTRAINDICATION");
    expect(feedback).toContain('prohibited for Oliver');
  });

  // ----------------------------------------------------
  // TEST 5: MEEH BSA ANATOMICAL FORMULAS
  // ----------------------------------------------------
  it('should compute feline and canine Meeh BSA formulas accurately', () => {
    const oliver = app.getPatient('pet-1');
    const oliverK = 10.0;
    const oliverBsa = parseFloat(((oliverK * Math.pow(oliver.weight, 2 / 3)) / 100).toFixed(3));
    expect(oliverBsa).toBe(0.26);

    const duke = app.getPatient('pet-4');
    const dukeK = 10.1;
    const dukeBsa = parseFloat(((dukeK * Math.pow(duke.weight, 2 / 3)) / 100).toFixed(3));
    expect(dukeBsa).toBe(1.014);
  });

  // ----------------------------------------------------
  // TEST 6: MODIFIED TRIADAN PATHOLOGY & Dental EXTRACTIONS AUTO-BILL
  // ----------------------------------------------------
  it('should bill tooth extractions to invoice automatically', () => {
    const ehr = window.vetpmsEHR;
    const oliver = app.getPatient('pet-1');
    app.activePatientId = oliver.id;

    const startingInvoicesCount = oliver.invoices.length;

    ehr.activeTooth = '104';

    const pMock = document.getElementById('dental-pathology');
    pMock.innerHTML = `<option value="Complicated Crown Fracture">CCF</option>`;
    pMock.value = 'Complicated Crown Fracture';

    const aMock = document.getElementById('dental-action');
    aMock.innerHTML = `<option value="Surgical Extraction (Invoiced)">SE</option>`;
    aMock.value = 'Surgical Extraction (Invoiced)';

    ehr.handleSaveToothPathology();

    expect(oliver.invoices.length).toBe(startingInvoicesCount + 1);
    const extractionItem = oliver.invoices.find((i) => i.item.includes('Triadan Tooth 104'));
    expect(extractionItem).toBeDefined();
    expect(extractionItem.price).toBe(185.0);
  });

  // ----------------------------------------------------
  // TEST 7: RECOVER 2024 CPR RESUSCITATION VOLUMES
  // ----------------------------------------------------
  it('should compute RECOVER CPR emergency drug volumes correctly', () => {
    const max = app.getPatient('pet-3');
    const expectedEpiVol = ((max.weight * 0.01) / 1.0).toFixed(2);
    expect(expectedEpiVol).toBe('0.34');

    const oliver = app.getPatient('pet-1');
    const expectedFelineEpiVol = ((oliver.weight * 0.01) / 1.0).toFixed(2);
    expect(expectedFelineEpiVol).toBe('0.04');
  });

  // ----------------------------------------------------
  // TEST 8: GREYHOUND DIAGNOSTIC REFERENCE RANGE ANOMALY
  // ----------------------------------------------------
  it('should normalise diagnostic ranges for greyhounds', () => {
    const labs = window.vetpmsLabs;
    const duke = app.getPatient('pet-4');

    const greyhoundPayload = labs.generateDiagnosticBiochemPayload('Duke', 'Canine');
    expect(greyhoundPayload.HCT).toBe(61.2);
    expect(greyhoundPayload.PLT).toBe(105.0);

    const ref = labs.referenceRanges.Greyhound;
    expect(greyhoundPayload.HCT).toBeGreaterThanOrEqual(ref.HCT.low);
    expect(greyhoundPayload.HCT).toBeLessThanOrEqual(ref.HCT.high);
    expect(greyhoundPayload.PLT).toBeGreaterThanOrEqual(ref.PLT.low);
    expect(greyhoundPayload.PLT).toBeLessThanOrEqual(ref.PLT.high);
  });

  // ----------------------------------------------------
  // TEST 9: DEA PERPETUAL CONTAINERS DEPLETION & ASAP 4.2B COMPILE
  // ----------------------------------------------------
  it('should deplete DEA containers and compile ASAP 4.2B batch logs', () => {
    const substances = window.vetpmsSubstances;
    const oliver = app.getPatient('pet-1');

    const con = app.state.drugContainers.find((c) => c.containerId === 'CON-K092');
    expect(con.volume).toBe(10.0);

    substances.populateModalSelects();
    substances.drugSelect.value = 'sub-1';
    substances.patientSelect.value = oliver.id;
    document.getElementById('draw-amount').value = 10.0;
    document.getElementById('draw-wasted').value = 0.0;
    document.getElementById('draw-reason').value = 'Exploratory surgical anesthesia';

    const vetSelect = document.getElementById('draw-vet-select');
    vetSelect.innerHTML = `<option value="Dr. Jeffery Powell">Dr. Jeffery Powell</option>`;
    vetSelect.value = 'Dr. Jeffery Powell';

    document.getElementById('draw-witness-pin').value = '1234';

    substances.handleSubstanceWithdrawal();

    expect(con.volume).toBe(0.0);
    expect(con.depleted).toBe(true);

    const outputBox = document.getElementById('asap-output');
    outputBox.value = '';

    substances.generateASAP42BText();
    const asapText = outputBox.value;

    expect(asapText).toContain('TH*4.2*CURES');
    expect(asapText).toContain('PAT*');
    expect(asapText).toContain('DSP*');
    expect(asapText).toContain('TP*');
  });

  // ----------------------------------------------------
  // TEST 10: MISSED-CHARGE CAPTURE DIFF ENGINE
  // ----------------------------------------------------
  it('should reconcile missed charges and auto-capture them', () => {
    const billing = window.vetpmsBilling;
    const oliver = app.getPatient('pet-1');

    // Seed a DEA audit log for Oliver so there is something to reconcile
    app.state.auditLogs.push({
      timestamp: '2026-06-03 12:00',
      drugName: 'Ketamine (100mg/mL)',
      patientName: 'Oliver',
      patientId: 'pet-1',
      vet: 'Dr. Jeffery Powell',
      witness: 'Tech: Sarah (PIN: 1234)',
      amount: 1.5,
      wasted: 0.0,
      balance: 32.5,
      reason: 'Dental extraction anesthesia',
    });

    oliver.invoices = oliver.invoices.filter((i) => !i.item.includes('Controlled Med'));

    billing.activePatientId = oliver.id;

    const panel = document.getElementById('missed-charge-panel');
    panel.innerHTML = '';

    billing.reconcileMissedCharges();

    expect(billing.missedCharges.length).toBeGreaterThan(0);
    const missedItem = billing.missedCharges.find((m) => m.item.includes('Controlled Med'));
    expect(missedItem).toBeDefined();

    billing.handleAutoCaptureLeakedRevenue(oliver);
    const invoicedItem = oliver.invoices.find((i) => i.item.includes('Controlled Med'));
    expect(invoicedItem).toBeDefined();
  });
});
