// VetPMS Whiteboard Flow Sheet Module
// Implementing Ward locations, treatment progress counters, and RECOVER 2024 CPR Resuscitation Crash Cart engines.

class VetPMSWhiteboard {
  constructor() {
    this.columns = [
      { id: 'Checked In', label: 'Checked In', color: 'var(--success)' },
      { id: 'Triage/Vitals', label: 'Triage / Vitals', color: 'var(--warning)' },
      { id: 'Ward / Hospitalized', label: 'Ward / Hospitalized', color: 'var(--primary)' },
      { id: 'Diagnostics', label: 'Diagnostics (Labs/PACS)', color: 'var(--purple)' },
      { id: 'Surgery', label: 'Surgery & Anesthesia', color: 'var(--danger)' },
      { id: 'Recovery', label: 'Recovery / ICU', color: 'var(--info)' },
      { id: 'Discharge Ready', label: 'Discharge Ready', color: 'var(--success)' },
    ];

    this.gridContainer = document.getElementById('whiteboard-grid');
    this.injectCPRModalToDOM();
  }

  // Inject a secure CPR modal to avoid modifying index.html structures directly
  injectCPRModalToDOM() {
    if (document.getElementById('modal-cpr-dosing')) return;

    const modal = document.createElement('dialog');
    modal.className = 'modal-overlay';
    modal.id = 'modal-cpr-dosing';
    modal.innerHTML = `
      <div class="modal-card glass-card" style="max-width: 600px; border-color: var(--danger);">
        <header class="modal-header" style="border-bottom-color: rgba(239, 68, 68, 0.3);">
          <h3 class="modal-title" style="color: var(--danger); display:flex; align-items:center; gap:8px;">
            🚨 RECOVER 2024 Emergency CPR Dosing Chart
          </h3>
          <button class="modal-close" id="btn-close-cpr-modal">✕</button>
        </header>
        <div class="modal-body" id="cpr-modal-content" style="font-family:monospace; font-size:12px;">
          <!-- Loaded on trigger -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-close-cpr-modal').addEventListener('click', () => {
      modal.style.display = 'none';
      if (this.metronomeInterval) clearInterval(this.metronomeInterval);
    });
  }

  render() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    const patients = window.vetApp.patients;

    this.columns.forEach((col) => {
      const colEl = document.createElement('div');
      colEl.className = 'flow-column glass';
      colEl.id = `col-${col.id.replace(/\s+/g, '')}`;

      const colPatients = patients.filter((p) => p.status === col.id);

      colEl.innerHTML = `
        <div class="column-header">
          <span class="column-title" style="border-bottom: 2px solid ${col.color}; padding-bottom: 4px;">${col.label}</span>
          <span class="patient-count">${colPatients.length}</span>
        </div>
        <div class="column-cards-container" style="flex-grow:1; display:flex; flex-direction:column; gap:12px; min-height:450px;" data-column-id="${col.id}">
          <!-- Cards -->
        </div>
      `;

      const cardsContainer = colEl.querySelector('.column-cards-container');

      colPatients.forEach((patient) => {
        const card = document.createElement('div');
        card.className = 'glass-card patient-card';
        card.draggable = true;
        card.id = `card-${patient.id}`;

        let triageClass = 'triage-standard';
        if (patient.triage === 'Urgent') triageClass = 'triage-urgent';
        if (patient.triage === 'Critical') triageClass = 'triage-critical';

        // Vitals details
        const v = patient.vitals;

        // Warnings badge
        let warningsHTML = '';
        if (patient.warnings && patient.warnings.length > 0) {
          warningsHTML = `<span class="warning-badge" style="font-size:9px;">${patient.warnings[0]}</span>`;
        }

        // Location & CPR Quick Actions
        let cprActionHTML = '';
        if (patient.triage === 'Critical') {
          cprActionHTML = `
            <button class="btn btn-purple" class="btn-cpr-trigger" style="background:var(--danger); font-size:10px; padding:4px 8px; margin-top:4px; font-weight:700; width:100%; justify-content:center;" data-patient-id="${patient.id}">
              🚨 RECOVER CPR Crash Chart
            </button>
          `;
        }

        card.innerHTML = `
          <div class="patient-header">
            <div class="patient-name">
              <span class="triage-indicator ${triageClass}"></span>
              ${patient.name}
            </div>
            <span style="font-size: 10px; color: var(--text-secondary); font-weight:600;">${patient.breed}</span>
          </div>
          <div class="patient-details" style="display:flex; justify-content:between; font-size:10px;">
            <span>Loc: <b style="color:var(--info);">${patient.location}</b></span>
            <span>Owner: <b>${patient.owner}</b></span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${warningsHTML}
            <span style="font-size:10px; color:var(--text-muted);">Wt: <b>${patient.weight}kg</b></span>
          </div>
          <div class="card-vital-row" style="margin-top:4px;">
            <div class="vital-tag">T: <span class="vital-value">${v.temp}°C</span></div>
            <div class="vital-tag">HR: <span class="vital-value">${v.hr}</span></div>
            <div class="vital-tag">BCS: <span class="vital-value">${v.bcs.split(' ')[0]}</span></div>
          </div>
          ${cprActionHTML}
        `;

        // Click routing card (bypass if clicking the CPR button or dragging)
        card.addEventListener('click', (e) => {
          if (e.target.closest('button')) {
            e.stopPropagation();
            this.openCPRModal(patient.id);
            return;
          }
          window.vetApp.activePatientId = patient.id;
          window.vetApp.switchView('ehr');
        });

        // HTML5 drag start
        card.addEventListener('dragstart', (e) => {
          card.classList.add('dragging');
          e.dataTransfer.setData('text/plain', patient.id);
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
        });

        cardsContainer.appendChild(card);
      });

      // Whiteboard Column drag events
      cardsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        colEl.classList.add('drag-over');
      });

      cardsContainer.addEventListener('dragleave', () => {
        colEl.classList.remove('drag-over');
      });

      cardsContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.classList.remove('drag-over');
        const patientId = e.dataTransfer.getData('text/plain');
        const newStatus = cardsContainer.getAttribute('data-column-id');

        const p = window.vetApp.getPatient(patientId);
        if (p && p.status !== newStatus) {
          p.status = newStatus;

          window.vetApp.showToast(
            `Patient <b>${p.name}</b> moved to <b>${newStatus}</b>`,
            newStatus === 'Surgery' ? 'danger' : newStatus === 'Diagnostics' ? 'imaging' : 'success'
          );
          this.render();
        }
      });

      this.gridContainer.appendChild(colEl);
    });
  }

  // Opens secure RECOVER 2024 CPR Resuscitation Dosing modal
  openCPRModal(patientId) {
    const p = window.vetApp.getPatient(patientId);
    if (!p) return;

    const modal = document.getElementById('modal-cpr-dosing');
    const container = document.getElementById('cpr-modal-content');

    // Dynamic weight pull
    const weight = window.vetApp.getLatestWeight(p.id).kg;

    // Epinephrine standard dose (0.01 mg/kg) - Concentration 1mg/mL (1:1000)
    const epiVol = (weight * 0.01) / 1.0;
    // Atropine standard dose (0.04 mg/kg) - Concentration 0.54mg/mL
    const atroVol = (weight * 0.04) / 0.54;
    // Vasopressin standard dose (0.8 U/kg) - Concentration 20 U/mL
    const vasoVol = (weight * 0.8) / 20.0;
    // Reversal Naloxone (0.04 mg/kg) - Concentration 0.4mg/mL
    const naloxVol = (weight * 0.04) / 0.4;

    container.innerHTML = `
      <div style="background:rgba(239, 68, 68, 0.05); padding:12px; border-radius:8px; border:1px solid rgba(239, 68, 68, 0.2); margin-bottom:16px;">
        <span style="font-weight:800; color:var(--danger);">EMERGENCY RESUSCITATION DRUGS FOR: ${p.name.toUpperCase()} (${weight} kg)</span><br>
        Doses calculated per <b>RECOVER 2024 Cardiopulmonary Resuscitation Guidelines</b>.
      </div>
      
      <table style="width:100%; border-collapse:collapse; text-align:left; margin-bottom:16px;">
        <thead>
          <tr style="border-bottom:1px solid var(--glass-border); color:var(--text-muted);">
            <th style="padding:6px 0;">Emergency Drug</th>
            <th>Clinical Indication</th>
            <th>Calculated Volume (mL)</th>
            <th>Concentration</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
            <td style="padding:10px 0; font-weight:700; color:#fff;">Epinephrine 1:1000</td>
            <td>Asystole / PEA (Repeat 3-5m)</td>
            <td style="color:var(--danger); font-size:14px; font-weight:800;">${epiVol.toFixed(2)} mL</td>
            <td>1.0 mg/mL</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
            <td style="padding:10px 0; font-weight:700; color:#fff;">Atropine Sulfate</td>
            <td>Bradycardia / High Vagal Tone</td>
            <td style="color:var(--danger); font-size:14px; font-weight:800;">${atroVol.toFixed(2)} mL</td>
            <td>0.54 mg/mL</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
            <td style="padding:10px 0; font-weight:700; color:#fff;">Vasopressin</td>
            <td>Epinephrine Alternative</td>
            <td style="color:var(--danger); font-size:14px; font-weight:800;">${vasoVol.toFixed(2)} mL</td>
            <td>20 U/mL</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
            <td style="padding:10px 0; font-weight:700; color:#fff;">Naloxone Reversal</td>
            <td>Opioid Sedative Override</td>
            <td style="color:var(--danger); font-size:14px; font-weight:800;">${naloxVol.toFixed(2)} mL</td>
            <td>0.4 mg/mL</td>
          </tr>
        </tbody>
      </table>

      <!-- Active CPR Metronome visual tool (100-120 Compressions/Min) -->
      <div class="glass-card" style="display:flex; align-items:center; justify-content:between; padding:12px; background:rgba(0,0,0,0.3);">
        <div>
          <span style="font-weight:700; color:#fff;">CPR Chest Compression Metronome</span><br>
          Target: 100 - 120 compressions per minute (visual guide).
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div id="cpr-metronome-light" style="width:16px; height:16px; border-radius:50%; background:var(--text-muted); transition:background 0.05s ease;"></div>
          <button class="btn btn-purple" id="btn-toggle-metronome" style="background:var(--danger); padding:4px 10px; font-size:11px;">START BEAT</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    // Setup live visual metronome interval
    const light = document.getElementById('cpr-metronome-light');
    const mBtn = document.getElementById('btn-toggle-metronome');
    let active = false;

    mBtn.addEventListener('click', () => {
      active = !active;
      if (active) {
        mBtn.innerText = 'STOP BEAT';
        mBtn.style.background = 'var(--primary)';
        // 110 beats per minute -> 545ms interval
        this.metronomeInterval = setInterval(() => {
          light.style.backgroundColor = 'var(--danger)';
          light.style.boxShadow = '0 0 10px var(--danger)';
          setTimeout(() => {
            light.style.backgroundColor = 'rgba(0,0,0,0.3)';
            light.style.boxShadow = 'none';
          }, 80);
        }, 545);
      } else {
        mBtn.innerText = 'START BEAT';
        mBtn.style.background = 'var(--danger)';
        if (this.metronomeInterval) clearInterval(this.metronomeInterval);
        light.style.backgroundColor = 'var(--text-muted)';
      }
    });
  }
}

// Register on window
window.vetpmsWhiteboard = new VetPMSWhiteboard();
