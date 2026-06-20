// VetPMS Electronic Health Records & SOAP Notes Module
// Implementing bitemporal custody, 9-point BCS, Meeh BSA, Plumb's Dose Calculators, Triadan Dental grids, and Rabies Certificate Form 51.

class VetPMSMedicalRecords {
  constructor() {
    this.patientSearch = document.getElementById('patient-search');
    this.patientListContainer = document.getElementById('ehr-patient-list');
    this.activeRecordContainer = document.getElementById('ehr-active-record');

    this.activeTooth = null;
    this.toothPathologies = {};

    this.injectRabiesModalToDOM();
    this.initEventListeners();
  }

  // Inject printable Rabies certificate modal
  injectRabiesModalToDOM() {
    if (document.getElementById('modal-rabies-certificate')) return;

    const modal = document.createElement('dialog');
    modal.className = 'modal-overlay';
    modal.id = 'modal-rabies-certificate';
    modal.innerHTML = `
      <div class="modal-card glass-card" style="max-width: 650px; background:#fff; color:#000; border-color:#d1d5db; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
        <header class="modal-header" style="border-bottom: 2px solid #000; padding-bottom:8px; margin-bottom:12px;">
          <h3 class="modal-title" style="color:#000; font-weight:800; font-family:serif; font-size:18px;">
            NASPHV FORM 51 - RABIES VACCINATION CERTIFICATE
          </h3>
          <button class="modal-close" id="btn-close-rabies-modal" style="color:#000; font-weight:800; font-size:18px;">✕</button>
        </header>
        <div class="modal-body" id="rabies-modal-content" style="color:#000; font-family:serif; line-height:1.4;">
          <!-- Loaded on trigger -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-close-rabies-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  initEventListeners() {
    if (this.patientSearch) {
      this.patientSearch.addEventListener('input', () => this.renderPatientList());
    }
  }

  render() {
    this.renderPatientList();
    this.renderActivePatientDetails();
  }

  renderPatientList() {
    if (!this.patientListContainer) return;
    this.patientListContainer.innerHTML = '';

    const query = this.patientSearch ? this.patientSearch.value.toLowerCase() : '';
    const patients = window.vetApp.state.animals;

    const filtered = patients.filter(
      (p) => p.name.toLowerCase().includes(query) || p.breed.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      this.patientListContainer.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--text-muted); padding:16px;">No matches found</div>`;
      return;
    }

    filtered.forEach((p) => {
      const item = document.createElement('div');
      item.className = `patient-selector-item ${p.id === window.vetApp.activePatientId ? 'active' : ''}`;

      let speciesEmoji = p.species === 'Feline' ? '🐱' : '🐶';

      item.innerHTML = `
        <div class="avatar-species">${speciesEmoji}</div>
        <div style="flex-grow:1; display:flex; flex-direction:column; gap:2px;">
          <div style="font-weight:700; font-size:13px; color:#fff;">${p.name}</div>
          <div style="font-size:11px; color:var(--text-secondary);">${p.breed} • ${p.status}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        window.vetApp.activePatientId = p.id;
        this.render();
      });

      this.patientListContainer.appendChild(item);
    });
  }

  renderActivePatientDetails() {
    if (!this.activeRecordContainer) return;
    const p = window.vetApp.getActivePatient();
    if (!p) {
      this.activeRecordContainer.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">Select a patient from the list</div>`;
      return;
    }

    // Resolve Shared Custody percentages
    const ownerships = window.vetApp.getOwnershipDetails(p.id);
    let ownershipHTML = ownerships
      .map(
        (o) => `
      <div style="font-size:11px; color:var(--text-secondary); display:flex; justify-content:between; background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); padding:6px 12px; border-radius:6px;">
        <span>👤 <b>${o.ownerName}</b> (${o.role})</span>
        <span>Custody: <b>${o.share}%</b> • Bill: <b>${o.billing ? 'Yes' : 'No'}</b> • Comms: <b>${o.communication ? 'Yes' : 'No'}</b> • Consent: <b>${o.consent ? 'Yes' : 'No'}</b></span>
      </div>
    `
      )
      .join('');

    // Resolve weights time-series & Age alert (>30 days)
    const weights = window.vetApp.getWeightHistory(p.id);
    const latestWeightObs = window.vetApp.getLatestWeight(p.id);

    let weightWarningClass = '';
    let weightWarningText = '';
    if (latestWeightObs.date) {
      const diffTime = Math.abs(new Date() - new Date(latestWeightObs.date));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        weightWarningClass = 'border-color: var(--danger); background: rgba(239, 68, 68, 0.08);';
        weightWarningText = `<span style="color:var(--danger); font-size:10px; font-weight:700; display:block; margin-top:4px;">⚠️ WEIGHT OBSERVATION OLDER THAN 30 DAYS (${diffDays}d)</span>`;
      }
    }

    // Meeh Formula BSA
    const kFactor = p.species === 'Feline' ? 10.0 : 10.1;
    const bsa =
      latestWeightObs.kg > 0
        ? ((kFactor * Math.pow(latestWeightObs.kg, 2 / 3)) / 100).toFixed(3)
        : 0.0;

    // Warning flags list
    let warningHTML = '';
    if (p.warnings && p.warnings.length > 0) {
      warningHTML = `
        <div class="warning-banner-stack" style="display:flex; flex-direction:column; gap:6px;">
          ${p.warnings
            .map(
              (w) => `
            <div class="warning-badge" style="width:100%; display:flex; align-items:center; gap:8px; padding:10px 14px; font-size:12px; border-radius:8px;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ${w}
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    // Active diagnostic orders block
    let ordersListHTML = '';
    const activeImaging = window.vetApp.state.imagingOrders.filter((io) => io.patientId === p.id);
    const activeLabs = window.vetApp.state.labOrders.filter((lo) => lo.patientId === p.id);

    if (activeImaging.length > 0 || activeLabs.length > 0) {
      ordersListHTML = `
        <div class="glass-card" style="padding:16px;">
          <h4 style="font-size:13px; font-weight:700; margin-bottom:10px; color:var(--primary);">Active Diagnostic Orders</h4>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${activeImaging
              .map(
                (o) => `
              <div style="display:flex; justify-content:between; align-items:center; font-size:12px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom:6px;">
                <span>📷 Radiograph: <b>${o.studyType}</b></span>
                <span class="btn btn-secondary" style="padding:2px 8px; font-size:10px; border-radius:4px;" onclick="window.vetApp.switchView('imaging')">${o.status}</span>
              </div>
            `
              )
              .join('')}
            ${activeLabs
              .map(
                (o) => `
              <div style="display:flex; justify-content:between; align-items:center; font-size:12px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom:6px;">
                <span>🧪 Lab Panel: <b>${o.panelName}</b></span>
                <span class="btn btn-secondary" style="padding:2px 8px; font-size:10px; border-radius:4px;" onclick="window.vetApp.switchView('labs')">${o.status}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    // Dental Chart HTML
    let toothGridHTML = this.buildDentalTriadanChartHTML();

    this.activeRecordContainer.innerHTML = `
      <header class="ehr-header">
        <div class="patient-profile-card">
          <div class="patient-large-avatar">${p.species === 'Feline' ? '🐱' : '🐶'}</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <h3 style="font-size:20px; font-weight:800; color:#fff;">${p.name}</h3>
              <span class="status-pill" style="font-size:10px; padding:3px 10px;">${p.status}</span>
            </div>
            <div style="font-size:11px; color:var(--text-secondary);">
              Breed: <b>${p.breed}</b> (${p.breedSource}) • Sex: <b>${p.sex} (${p.reproductiveStatus})</b> • Age: <b>${p.age}</b>
            </div>
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-secondary" id="btn-save-soap">Save SOAP Note</button>
        </div>
      </header>

      ${ownershipHTML}
      ${warningHTML}

      <!-- Interactive Vitals Form Card + Meeh BSA -->
      <div class="glass-card" style="display:grid; grid-template-columns:repeat(5, 1fr); gap:16px; ${weightWarningClass}">
        <div class="slider-group">
          <label>Temperature (°C)</label>
          <input type="number" step="0.1" class="search-input" id="vitals-temp" value="${p.vitals.temp}">
        </div>
        <div class="slider-group">
          <label>Heart Rate (BPM)</label>
          <input type="number" class="search-input" id="vitals-hr" value="${p.vitals.hr}">
        </div>
        <div class="slider-group">
          <label>Resp Rate (BRM)</label>
          <input type="number" class="search-input" id="vitals-rr" value="${p.vitals.rr}">
        </div>
        <div class="slider-group">
          <label>9-pt BCS / MCS</label>
          <select class="search-input" id="vitals-bcs" style="background: rgba(0,0,0,0.5); font-size:11px;">
            <option value="5/9" ${p.vitals.bcs.includes('5/9') ? 'selected' : ''}>5/9 Ideal</option>
            <option value="3/9" ${p.vitals.bcs.includes('3/9') ? 'selected' : ''}>3/9 Underweight</option>
            <option value="7/9" ${p.vitals.bcs.includes('7/9') ? 'selected' : ''}>7/9 Overweight</option>
            <option value="9/9" ${p.vitals.bcs.includes('9/9') ? 'selected' : ''}>9/9 Obese</option>
          </select>
        </div>
        <div class="slider-group">
          <label>Meeh BSA Scale</label>
          <div class="search-input" style="background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.04); line-height: 20px; font-weight:700; color:var(--primary); font-family:monospace;">
            ${bsa} m²
          </div>
        </div>
      </div>
      ${weightWarningText}

      <!-- Interactive Weight-Based Plumb's Dosing Calculator -->
      <div class="glass-card" style="display:flex; flex-direction:column; gap:12px;">
        <h4 style="font-size:13px; font-weight:700; color:var(--warning);">Plumb's Weight-Based Dosing Engine</h4>
        <div style="display:grid; grid-template-columns:2fr 1fr 1fr 1.5fr; gap:16px;">
          <div class="slider-group">
            <label>Select Drug</label>
            <select class="search-input" id="dose-drug-select" style="background: rgba(0,0,0,0.5); font-size:11px;">
              <option value="Amoxicillin">Amoxicillin (Liquid 50mg/mL) - wellness/infection</option>
              <option value="Meloxicam">Meloxicam (NSAID Injection 5mg/mL) - renal caution</option>
              <option value="Ivermectin">Ivermectin (High-Dose Parasite Mange - 300mcg/kg)</option>
              <option value="Buprenorphine">Buprenorphine (Opioid Injection 0.3mg/mL)</option>
            </select>
          </div>
          <div class="slider-group">
            <label>Weight (kg)</label>
            <input type="number" class="search-input" id="dose-weight-input" value="${latestWeightObs.kg}" disabled style="background: rgba(0,0,0,0.2);">
          </div>
          <div class="slider-group">
            <label>Target Dose (mg/kg)</label>
            <input type="number" step="0.1" class="search-input" id="dose-rate-input" value="10.0">
          </div>
          <div class="slider-group" style="justify-content:end; display:flex; align-items:end;">
            <button class="btn btn-secondary" style="width:100%; justify-content:center;" id="btn-calc-dose">Calculate Volume</button>
          </div>
        </div>
        <div id="dose-calculator-result" style="display:none; font-family:monospace; background:rgba(0,0,0,0.25); padding:10px; border-radius:8px; border:1px dashed var(--glass-border); font-size:12px;"></div>
      </div>

      <!-- SOAP Chart Note Drafts -->
      <div class="soap-tabs">
        <div class="soap-tab">
          <div class="soap-tab-title">Subjective (S)</div>
          <textarea class="soap-tab-textarea" id="soap-s" placeholder="e.g. lethargy, polyuria...">${p.soap.subjective}</textarea>
        </div>
        <div class="soap-tab">
          <div class="soap-tab-title">Objective (O)</div>
          <textarea class="soap-tab-textarea" id="soap-o" placeholder="e.g. vitals normal, coat dull...">${p.soap.objective}</textarea>
        </div>
        <div class="soap-tab">
          <div class="soap-tab-title">Assessment (A)</div>
          <textarea class="soap-tab-textarea" id="soap-a" placeholder="e.g. early stage CKD suspected...">${p.soap.assessment}</textarea>
        </div>
        <div class="soap-tab">
          <div class="soap-tab-title">Plan (P)</div>
          <textarea class="soap-tab-textarea" id="soap-p" placeholder="e.g. order blood chem, dispense fluids...">${p.soap.plan}</textarea>
        </div>
      </div>

      <!-- Interactive Multi-Axial Modified Triadan Dental Chart -->
      <div class="glass-card" style="display:flex; flex-direction:column; gap:16px;">
        <h4 style="font-size:13px; font-weight:700; color:var(--info);">Modified Triadan Dental Chart Map</h4>
        ${toothGridHTML}
        <div id="dental-details-panel" style="display:none; background:rgba(0,0,0,0.25); border:1px solid var(--glass-border); padding:12px; border-radius:8px; font-size:12px;">
          <div style="display:flex; justify-content:between; align-items:center; margin-bottom:8px;">
            <span style="font-weight:700; color:#fff;" id="dental-tooth-label">Tooth 104</span>
            <button class="btn btn-secondary" style="padding:2px 8px; font-size:10px;" id="btn-save-pathology">Apply</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="slider-group">
              <label>Select Pathology Grade</label>
              <select class="search-input" id="dental-pathology" style="background: rgba(0,0,0,0.5); font-size:11px;">
                <option value="Normal">Normal Dentition</option>
                <option value="Gingivitis Grade 2">Gingivitis Grade 2</option>
                <option value="Periodontal Pocket > 3mm">Periodontal Pocket > 3mm</option>
                <option value="Tooth Resorption Type 2">Tooth Resorption Type 2</option>
                <option value="Complicated Crown Fracture">Complicated Crown Fracture</option>
              </select>
            </div>
            <div class="slider-group">
              <label>Action Plan</label>
              <select class="search-input" id="dental-action" style="background: rgba(0,0,0,0.5); font-size:11px;">
                <option value="None">None</option>
                <option value="Dental Prophylaxis Polish">Dental Prophylaxis Polish</option>
                <option value="Surgical Extraction (Invoiced)">Surgical Extraction (Invoiced)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Active orders checklist -->
      ${ordersListHTML}

      <!-- Operations / Certificates panel -->
      <div class="glass-card" style="display:flex; flex-direction:column; gap:12px;">
        <h4 style="font-size:13px; font-weight:700; color:var(--text-secondary);">Clinic Operations & Regulatory Documents</h4>
        <div class="diagnostic-triggers">
          <button class="btn btn-purple" id="btn-order-xray">
            📷 Order X-Ray Study
          </button>
          <button class="btn" style="background:var(--info);" id="btn-order-labs">
            🧪 Order Lab Panel
          </button>
          <button class="btn btn-purple" style="background:var(--danger);" id="btn-administer-drug">
            💉 Draw Anesthetic / Sedative
          </button>
          <button class="btn btn-secondary" style="background:rgba(255,255,255,0.06);" id="btn-print-rabies-cert">
            📜 Rabies Certificate (Form 51)
          </button>
        </div>
      </div>
    `;

    // Rebind Dosing calculator default dose rate triggers
    const drugSelect = document.getElementById('dose-drug-select');
    const rateInput = document.getElementById('dose-rate-input');

    drugSelect.addEventListener('change', () => {
      const rates = {
        Amoxicillin: 10.0,
        Meloxicam: 0.2,
        Ivermectin: 300, // mcg/kg
        Buprenorphine: 0.02,
      };
      rateInput.value = rates[drugSelect.value] || 1.0;
    });

    // Hook listeners
    document
      .getElementById('btn-calc-dose')
      .addEventListener('click', () => this.handleCalculateDose());
    document.getElementById('btn-save-soap').addEventListener('click', () => this.handleSaveSOAP());
    document
      .getElementById('btn-order-xray')
      .addEventListener('click', () => this.handleOrderXRay());
    document
      .getElementById('btn-order-labs')
      .addEventListener('click', () => this.handleOrderLabs());
    document
      .getElementById('btn-administer-drug')
      .addEventListener('click', () => this.handleDrawSubstance());
    document
      .getElementById('btn-print-rabies-cert')
      .addEventListener('click', () => this.openRabiesCertificate(p));

    // Bind tooth map clicks
    const teethButtons = this.activeRecordContainer.querySelectorAll('.triadan-tooth-btn');
    teethButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.openDentalEditor(btn.getAttribute('data-tooth')));
    });
  }

  // Double Dosing Warnings Engine: Enforcing MDR1 Mutation check and Kidney/NSAID conflict checks
  handleCalculateDose() {
    const p = window.vetApp.getActivePatient();
    if (!p) return;

    const drug = document.getElementById('dose-drug-select').value;
    const rate = parseFloat(document.getElementById('dose-rate-input').value);
    const weight = window.vetApp.getLatestWeight(p.id).kg;

    const resultsBox = document.getElementById('dose-calculator-result');
    resultsBox.style.display = 'block';

    // Check Stale Weight Warning
    const latestWeightObs = window.vetApp.getLatestWeight(p.id);
    let staleWeightWarning = '';
    if (latestWeightObs.date) {
      const diffTime = Math.abs(new Date() - new Date(latestWeightObs.date));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        staleWeightWarning = `
          <div style="color:var(--danger); border:1px solid rgba(239, 68, 68, 0.3); background:rgba(239, 68, 68, 0.08); padding:8px; border-radius:6px; margin-bottom:8px; font-weight:700; font-size:11px;">
            ⚠️ CLINICAL ALERT: Weight observation is ${diffDays} days old (&gt;30d stale limit). Rounding errors may occur. Re-weigh animal!
          </div>
        `;
        window.vetApp.showToast('Dosing warning: Weight is stale!', 'warning');
      }
    }

    // Check 1: MDR1 Mutation Check
    if (drug === 'Ivermectin' && rate >= 150 && p.warnings.join(' ').includes('MDR1')) {
      resultsBox.innerHTML =
        staleWeightWarning +
        `
        <span style="color:var(--danger); font-weight:700;">🚨 PLUMB'S DRUG BLOCK: MDR1 MUTATION AWARENESS</span><br>
        Patient <b>${p.name}</b> is homozygous affected for ABCB1/MDR1 mutation.<br>
        High-dose ivermectin (${rate}mcg/kg) violates secure barriers due to blood-brain barrier neurotoxicity limits.<br>
        <span style="color:var(--warning);">Max Safe Mange Dose: &lt; 50mcg/kg</span>. Administration aborted.
      `;
      window.vetApp.showToast('MDR1 Pharmacogenomic contraindication fired!', 'danger');
      return;
    }

    // Check 2: Meloxicam NSAID Kidney Failure check
    const activeLabs = window.vetApp.state.labOrders.find(
      (o) => o.patientId === p.id && o.status === 'COMPLETED'
    );
    let hasAzotemia =
      p.warnings.join(' ').toLowerCase().includes('kidney') ||
      p.warnings.join(' ').toLowerCase().includes('azotem') ||
      p.soap.assessment.toLowerCase().includes('kidney') ||
      p.soap.assessment.toLowerCase().includes('ckd');
    if (activeLabs && activeLabs.results && activeLabs.results.CREA > 2.4) {
      hasAzotemia = true;
    }

    if (drug === 'Meloxicam' && hasAzotemia) {
      resultsBox.innerHTML =
        staleWeightWarning +
        `
        <span style="color:var(--danger); font-weight:700;">🚨 PLUMB'S DRUG BLOCK: ACUTE RENAL CONTRAINDICATION</span><br>
        NSAID (Meloxicam) prohibited for ${p.name} due to documented **Azotemia / Renal Failure**.<br>
        CREA values violate safe glomerular perfusion margins. NSAID administration would accelerate nephrotoxicity.<br>
        <span style="color:var(--info);">Recommended alternative: Opioid pain relief (Buprenorphine)</span>.
      `;
      window.vetApp.showToast('NSAID Kidney Failure block triggered!', 'danger');
      return;
    }

    // Calculation calculations
    let volumeCalculated = 0.0;

    if (drug === 'Amoxicillin') {
      const mgNeeded = weight * rate;
      volumeCalculated = mgNeeded / 50.0;
      resultsBox.innerHTML =
        staleWeightWarning +
        `
        <span style="color:var(--success); font-weight:700;">✓ Amoxicillin Dosing Approved</span><br>
        Dose: <b>${mgNeeded.toFixed(1)} mg</b> at ${rate} mg/kg.<br>
        Volume to administer: <b style="font-size:14px; color:#fff;">${volumeCalculated.toFixed(2)} mL</b> (50mg/mL liquid suspension).
      `;
    } else if (drug === 'Meloxicam') {
      const mgNeeded = weight * rate;
      volumeCalculated = mgNeeded / 5.0;
      resultsBox.innerHTML =
        staleWeightWarning +
        `
        <span style="color:var(--success); font-weight:700;">✓ Meloxicam Dosing Approved</span><br>
        Dose: <b>${mgNeeded.toFixed(2)} mg</b> at ${rate} mg/kg.<br>
        Volume: <b style="font-size:14px; color:#fff;">${volumeCalculated.toFixed(2)} mL</b> (5mg/mL injectable).
      `;
    } else if (drug === 'Ivermectin') {
      resultsBox.innerHTML =
        staleWeightWarning +
        `
        <span style="color:var(--success); font-weight:700;">✓ Standard Ivermectin Heartworm Dose</span><br>
        Heartworm prophylaxis: 6 mcg/kg is safe. Administer 1 Standard monthly beef chew.
      `;
    } else if (drug === 'Buprenorphine') {
      const mgNeeded = weight * rate;
      volumeCalculated = mgNeeded / 0.3;
      resultsBox.innerHTML = `
        <span style="color:var(--success); font-weight:700;">✓ Buprenorphine Opioid Dose Approved</span><br>
        Dose: <b>${mgNeeded.toFixed(3)} mg</b> at ${rate} mg/kg.<br>
        Volume: <b style="font-size:14px; color:#fff;">${volumeCalculated.toFixed(2)} mL</b> (0.3mg/mL injectable).
      `;
    }
  }

  buildDentalTriadanChartHTML() {
    const renderQuad = (quadPrefix, range) => {
      return range
        .map((t) => {
          const id = `${quadPrefix}${t.toString().padStart(2, '0')}`;
          const hasPathology = this.toothPathologies[id];
          let colorStyle = 'background: rgba(255,255,255,0.04);';
          if (hasPathology && hasPathology.pathology !== 'Normal') {
            colorStyle =
              'background: var(--danger); border-color: rgba(239,68,68,0.4); color: #000; font-weight:bold;';
          }
          return `
          <button class="btn btn-secondary triadan-tooth-btn" data-tooth="${id}" style="padding:4px 6px; font-size:10px; min-width:32px; ${colorStyle}">
            ${id}
          </button>
        `;
        })
        .join('');
    };

    return `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:center; gap:4px; border-bottom:1px dashed var(--glass-border); padding-bottom:8px;">
          <div style="display:flex; gap:2px; flex-direction:row-reverse; align-items:center;">
            <span style="font-size:10px; color:var(--text-muted); margin-right:8px;">Upper Right (100)</span>
            ${renderQuad(1, [1, 2, 3, 4, 6, 7, 8, 9, 10])}
          </div>
          <div style="width:20px; border-left:1px solid var(--glass-border);"></div>
          <div style="display:flex; gap:2px; align-items:center;">
            ${renderQuad(2, [1, 2, 3, 4, 6, 7, 8, 9, 10])}
            <span style="font-size:10px; color:var(--text-muted); margin-left:8px;">Upper Left (200)</span>
          </div>
        </div>
        <div style="display:flex; justify-content:center; gap:4px; padding-top:4px;">
          <div style="display:flex; gap:2px; flex-direction:row-reverse; align-items:center;">
            <span style="font-size:10px; color:var(--text-muted); margin-right:8px;">Lower Right (400)</span>
            ${renderQuad(4, [1, 2, 3, 4, 7, 8, 9, 10])}
          </div>
          <div style="width:20px; border-left:1px solid var(--glass-border);"></div>
          <div style="display:flex; gap:2px; align-items:center;">
            ${renderQuad(3, [1, 2, 3, 4, 7, 8, 9, 10])}
            <span style="font-size:10px; color:var(--text-muted); margin-left:8px;">Lower Left (300)</span>
          </div>
        </div>
      </div>
      <div style="font-size:10px; color:var(--text-muted); text-align:center;">* Triadan system rule-of-4-and-9 applies: 04 is always Canine, 09 is always Mandibular First Molar. Click on any tooth to log pathology.</div>
    `;
  }

  openDentalEditor(toothId) {
    this.activeTooth = toothId;

    const panel = document.getElementById('dental-details-panel');
    panel.style.display = 'block';

    const label = document.getElementById('dental-tooth-label');
    label.innerText = `Modified Triadan: Tooth ${toothId}`;

    const pathSelect = document.getElementById('dental-pathology');
    const actionSelect = document.getElementById('dental-action');

    if (this.toothPathologies[toothId]) {
      pathSelect.value = this.toothPathologies[toothId].pathology;
      actionSelect.value = this.toothPathologies[toothId].action;
    } else {
      pathSelect.value = 'Normal';
      actionSelect.value = 'None';
    }

    document.getElementById('btn-save-pathology').onclick = () => this.handleSaveToothPathology();
  }

  handleSaveToothPathology() {
    const toothId = this.activeTooth;
    const pathSelect = document.getElementById('dental-pathology');
    const actionSelect = document.getElementById('dental-action');

    this.toothPathologies[toothId] = {
      pathology: pathSelect.value,
      action: actionSelect.value,
    };

    const p = window.vetApp.getActivePatient();

    if (actionSelect.value === 'Surgical Extraction (Invoiced)') {
      p.invoices.push({
        item: `Surgical Extraction: Triadan Tooth ${toothId} (Root Elevate)`,
        price: 185.0,
        category: 'Dental Fee',
      });
      window.vetApp.showToast(`Tooth ${toothId} extraction charge added to invoice.`, 'success');
    }

    window.vetApp.showToast(
      `Tooth ${toothId} records updated: <b>${pathSelect.value}</b>`,
      'success'
    );
    document.getElementById('dental-details-panel').style.display = 'none';
    this.render();
  }

  handleSaveSOAP() {
    const p = window.vetApp.getActivePatient();
    if (!p) return;

    p.soap.subjective = document.getElementById('soap-s').value;
    p.soap.objective = document.getElementById('soap-o').value;
    p.soap.assessment = document.getElementById('soap-a').value;
    p.soap.plan = document.getElementById('soap-p').value;

    p.vitals.temp = parseFloat(document.getElementById('vitals-temp').value) || p.vitals.temp;
    p.vitals.hr = parseInt(document.getElementById('vitals-hr').value) || p.vitals.hr;
    p.vitals.rr = parseInt(document.getElementById('vitals-rr').value) || p.vitals.rr;
    p.vitals.bcs = document.getElementById('vitals-bcs').value + ' (AAHA/WSAVA 9-pt)';

    window.vetApp.showToast(`Medical chart note saved for patient <b>${p.name}</b>`, 'success');
    this.render();
  }

  handleOrderXRay() {
    const p = window.vetApp.getActivePatient();
    if (!p) return;

    const studyType =
      p.species === 'Canine' ? 'Thoracic Radiograph (3 Views)' : 'Abdominal Radiograph (2 Views)';
    const orderUID = `uid-${Date.now()}`;

    const newOrder = {
      orderId: orderUID,
      patientId: p.id,
      patientName: p.name,
      patientSpecies: p.species,
      patientBreed: p.breed,
      studyType,
      status: 'ORDERED',
      dicomImageURL: p.species === 'Canine' ? 'canine_thorax' : 'feline_abdomen',
      timestamp: new Date().toLocaleString(),
    };

    window.vetApp.state.imagingOrders.push(newOrder);
    p.invoices.push({
      item: `Diagnostic Imaging: ${studyType}`,
      price: 195.0,
      category: 'Diagnostic Fee',
    });

    window.vetApp.showToast(
      `X-Ray Study order (C-FIND MWL) issued for <b>${p.name}</b>`,
      'imaging'
    );
    p.status = 'Diagnostics';
    this.render();
  }

  handleOrderLabs() {
    const p = window.vetApp.getActivePatient();
    if (!p) return;

    const panelName = 'IDEXX VetTest Chemistry Panel (Chem17)';
    const orderUID = `lab-${Date.now()}`;

    const newOrder = {
      orderId: orderUID,
      patientId: p.id,
      patientName: p.name,
      patientSpecies: p.species,
      panelName,
      status: 'ORDERED',
      timestamp: new Date().toLocaleString(),
    };

    window.vetApp.state.labOrders.push(newOrder);
    p.invoices.push({
      item: `Laboratory panel: ${panelName}`,
      price: 165.0,
      category: 'Diagnostic Fee',
    });

    window.vetApp.showToast(
      `Biochemical laboratory order sent to IDEXX analyzer for <b>${p.name}</b>`,
      'lab'
    );
    p.status = 'Diagnostics';
    this.render();
  }

  handleDrawSubstance() {
    const p = window.vetApp.getActivePatient();
    if (!p) return;

    if (window.vetpmsSubstances) {
      window.vetpmsSubstances.openDrawModalForPatient(p.id);
    }
  }

  // Opens Rabies Certificate Modal visualizer
  openRabiesCertificate(patient) {
    const modal = document.getElementById('modal-rabies-certificate');
    const container = document.getElementById('rabies-modal-content');

    const w = window.vetApp.getLatestWeight(patient.id).kg;
    const certNum = `RAB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const site =
      patient.species === 'Feline' ? 'Right Hind Limb SQ (AAFP Guideline)' : 'Right Shoulder SQ';

    // HTML5 standard Rabies visual mapping (Form 51 printable)
    container.innerHTML = `
      <div style="border:4px double #000; padding:20px; background:#fff; font-family:serif;">
        <div style="text-align:center; font-weight:bold; margin-bottom:15px; border-bottom:1px solid #000; padding-bottom:6px;">
          <span style="font-size:16px;">COOPERATIVE STATE-FEDERAL RABIES VACCINATION CERTIFICATE</span><br>
          <span style="font-size:12px; font-weight:normal;">National Association of State Public Health Veterinarians (NASPHV) Form 51</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:11px; margin-bottom:12px;">
          <div>
            <b>1. OWNER DETAILS</b><br>
            Name: <u>${patient.owner}</u><br>
            Address: <u>101 Bunker Hill Road, Los Angeles, CA</u><br>
            Phone: <u>555-0192</u>
          </div>
          <div>
            <b>2. ANIMAL DETAILS</b><br>
            Name: <u>${patient.name}</u> &nbsp;&nbsp; Species: <u>${patient.species}</u><br>
            Breed: <u>${patient.breed}</u> &nbsp;&nbsp; Sex: <u>${patient.sex} (${patient.reproductiveStatus})</u><br>
            Weight: <u>${w} kg</u> &nbsp;&nbsp; Age: <u>${patient.age}</u>
          </div>
        </div>

        <div style="border:1px solid #000; padding:10px; font-size:11px; margin-bottom:12px; background:#f9fafb;">
          <b>3. VACCINATION TIMELINE & COMPLIANCE</b><br>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:4px;">
            <span>Vaccination Date: <b>${new Date().toLocaleDateString()}</b></span>
            <span>Next Due Date: <b>${new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toLocaleDateString()} (3-Year Booster)</b></span>
            <span>Vaccine Brand: <b>Zoetis Defensor 3</b></span>
            <span>Lot / Serial Number: <b>22-RAB-99211 (Exp: 2027-12-01)</b></span>
            <span>Admin Site & Route: <b style="color:red;">${site}</b></span>
            <span>Certificate Registry Code: <b>${certNum}</b></span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:16px; font-size:11px; align-items:end; margin-top:20px;">
          <div>
            <b>4. VETERINARIAN SIGNATURE BLOCK</b><br>
            Veterinarian: <u>Dr. Jeffery Powell (Lead Clinician)</u><br>
            DEA License ID: <u>DEAP55912</u> &nbsp;&nbsp; License Number: <u>CA-DVM-99120</u><br>
            Clinic: <u>VetPMS Medical Associates, Los Angeles CA</u>
          </div>
          <div style="text-align:center;">
            <div style="font-family:'Courier New', monospace; font-style:italic; border-bottom:1px solid #000; padding-bottom:4px; font-size:13px; font-weight:bold;">
              Jeffery Powell DVM
            </div>
            <span style="font-size:9px; color:#4b5563;">Digital Authorized Signature (ESIGN compliant)</span>
          </div>
        </div>

        <div style="display:flex; justify-content:between; align-items:center; border-top:1px solid #000; margin-top:16px; padding-top:10px; font-size:9px; color:#4b5563;">
          <span>* Implanted Microchip Verification Code: ${patient.microchips.length > 0 ? patient.microchips[0].chipId : 'NONE DETECTED (Implant Required)'}</span>
          <span style="font-weight:bold;">QR AUTHENTICITY CODE: SECURE_FORM51_${certNum}</span>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }
}

// Register on window
window.vetpmsEHR = new VetPMSMedicalRecords();
