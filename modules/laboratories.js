// VetPMS Laboratories Integration Module (IDEXX/Antech Analyzer Simulator)
// Implementing species reference ranges and Greyhound breed-specific hematology anomalies.

class VetPMSLaboratories {
  constructor() {
    this.orderList = document.getElementById("labs-order-list");
    this.resultsView = document.getElementById("labs-results-view");
    this.waitingScreen = document.getElementById("labs-waiting-screen");
    this.simStatus = document.getElementById("labs-sim-status");
    
    this.activeOrderId = null;

    // Species reference ranges dictionary
    this.referenceRanges = {
      Canine: {
        CREA: { low: 0.5, high: 1.8, unit: "mg/dL", fullName: "Creatinine (Kidney)" },
        BUN: { low: 7.0, high: 27.0, unit: "mg/dL", fullName: "Blood Urea Nitrogen (Kidney)" },
        ALT: { low: 10.0, high: 125.0, unit: "U/L", fullName: "Alanine Aminotransferase (Liver)" },
        ALKP: { low: 23.0, high: 212.0, unit: "U/L", fullName: "Alkaline Phosphatase (Liver)" },
        TP: { low: 5.2, high: 8.2, unit: "g/dL", fullName: "Total Protein (Hydration)" },
        GLU: { low: 70.0, high: 143.0, unit: "mg/dL", fullName: "Glucose (Pancreas/Stress)" },
        HCT: { low: 37.0, high: 55.0, unit: "%", fullName: "Hematocrit (RBC Count)" },
        PLT: { low: 150.0, high: 500.0, unit: "x10^9/L", fullName: "Platelets (Clotting)" }
      },
      Feline: {
        CREA: { low: 0.6, high: 2.4, unit: "mg/dL", fullName: "Creatinine (Kidney)" },
        BUN: { low: 16.0, high: 36.0, unit: "mg/dL", fullName: "Blood Urea Nitrogen (Kidney)" },
        ALT: { low: 12.0, high: 130.0, unit: "U/L", fullName: "Alanine Aminotransferase (Liver)" },
        ALKP: { low: 14.0, high: 111.0, unit: "U/L", fullName: "Alkaline Phosphatase (Liver)" },
        TP: { low: 5.7, high: 8.9, unit: "g/dL", fullName: "Total Protein (Hydration)" },
        GLU: { low: 71.0, high: 159.0, unit: "mg/dL", fullName: "Glucose (Pancreas/Stress)" },
        HCT: { low: 24.0, high: 45.0, unit: "%", fullName: "Hematocrit (RBC Count)" },
        PLT: { low: 150.0, high: 550.0, unit: "x10^9/L", fullName: "Platelets (Clotting)" }
      },
      // GREYHOUND BREED-SPECIFIC CLINICAL ANOMALIES (High HCT, Low Platelets, High CREA)
      Greyhound: {
        CREA: { low: 0.8, high: 2.1, unit: "mg/dL", fullName: "Creatinine (Kidney - Greyhound Normal)" },
        BUN: { low: 7.0, high: 27.0, unit: "mg/dL", fullName: "Blood Urea Nitrogen (Kidney)" },
        ALT: { low: 10.0, high: 125.0, unit: "U/L", fullName: "Alanine Aminotransferase (Liver)" },
        ALKP: { low: 23.0, high: 212.0, unit: "U/L", fullName: "Alkaline Phosphatase (Liver)" },
        TP: { low: 5.2, high: 8.2, unit: "g/dL", fullName: "Total Protein (Hydration)" },
        GLU: { low: 70.0, high: 143.0, unit: "mg/dL", fullName: "Glucose (Pancreas/Stress)" },
        HCT: { low: 50.0, high: 65.0, unit: "%", fullName: "Hematocrit (Greyhound Normal RBC)" },
        PLT: { low: 80.0, high: 200.0, unit: "x10^9/L", fullName: "Platelets (Greyhound Normal Clot)" }
      }
    };
  }

  render() {
    this.renderOrders();
    this.renderResults();
  }

  renderOrders() {
    if (!this.orderList) return;
    this.orderList.innerHTML = "";

    const orders = window.vetApp.state.labOrders;

    if (orders.length === 0) {
      this.orderList.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--text-muted); padding:16px;">No laboratory orders in queue</div>`;
      return;
    }

    orders.forEach(o => {
      const item = document.createElement("div");
      item.className = `mwl-item ${o.orderId === this.activeOrderId ? "active" : ""}`;
      
      let badgeBg = "var(--warning)";
      if (o.status === "COMPLETED") badgeBg = "var(--success)";

      item.innerHTML = `
        <div style="display:flex; justify-content:between; align-items:center; margin-bottom:4px;">
          <span style="font-weight:700; font-size:12px; color:#fff;">${o.patientName}</span>
          <span style="font-size:10px; background:${badgeBg}; padding:1px 6px; border-radius:10px; color:#000; font-weight:600;">${o.status}</span>
        </div>
        <div style="font-size:11px; color:var(--text-secondary);">${o.panelName}</div>
      `;

      item.addEventListener("click", () => {
        this.activeOrderId = o.orderId;
        this.render();
      });

      this.orderList.appendChild(item);
    });
  }

  renderResults() {
    const reportPanel = document.getElementById("labs-report-panel");

    if (!this.activeOrderId) {
      this.waitingScreen.style.display = "flex";
      reportPanel.style.display = "none";
      this.simStatus.innerText = "Diagnostics Engine: Idle";
      return;
    }

    const o = window.vetApp.state.labOrders.find(ord => ord.orderId === this.activeOrderId);
    if (!o) return;

    if (o.status === "ORDERED") {
      this.waitingScreen.style.display = "flex";
      reportPanel.style.display = "none";
      this.simStatus.innerHTML = `
        <div style="color:var(--info); font-weight:700; margin-bottom:12px;">SAMPLE DELIVERED TO ANALYZER</div>
        <div style="font-size:11px; color:var(--text-secondary); margin-bottom:16px;">Centrifuge balanced. Catalyst One biochemistry laser aligned.</div>
        <button class="btn btn-purple" id="btn-trigger-analyzer-run" style="background:var(--info);">Simulate Sample Analysis (2.5s)</button>
      `;

      document.getElementById("btn-trigger-analyzer-run").addEventListener("click", () => this.simulateAnalysis());
    } else {
      this.waitingScreen.style.display = "none";
      reportPanel.style.display = "block";
      
      const p = window.vetApp.getPatient(o.patientId);
      this.generateAndRenderReportTable(o, p);
    }
  }

  simulateAnalysis() {
    const o = window.vetApp.state.labOrders.find(ord => ord.orderId === this.activeOrderId);
    if (!o) return;

    this.simStatus.innerHTML = `
      <div style="animation:pulse 1s infinite alternate; color:var(--info);">
        🧪 CENTRIFUGING BLOOD SAMPLE...
      </div>
      <div class="terminal-sub" style="margin-top:12px;">Reading biochemical serum colorimetry. Optic grids loading.</div>
    `;

    setTimeout(() => {
      o.status = "COMPLETED";
      o.results = this.generateDiagnosticBiochemPayload(o.patientName, o.patientSpecies);

      const p = window.vetApp.getPatient(o.patientId);
      if (p) {
        p.status = "Recovery";
        window.vetApp.showToast(`Biochemical Chemistry report transmitted to EHR for <b>${p.name}</b>`, "success");
      }

      this.render();
    }, 2500);
  }

  generateDiagnosticBiochemPayload(name, species) {
    const defaultVals = {};
    
    // Check if patient is a Greyhound to load specific baseline shifts
    const p = window.vetApp.state.animals.find(a => a.name.toLowerCase() === name.toLowerCase());
    const refKey = (p && p.breed === "Greyhound") ? "Greyhound" : (species === "Feline" ? "Feline" : "Canine");
    
    const ref = this.referenceRanges[refKey];

    Object.keys(ref).forEach(k => {
      const mid = (ref[k].low + ref[k].high) / 2;
      defaultVals[k] = parseFloat((mid + (Math.random() - 0.5) * (ref[k].high - ref[k].low) * 0.4).toFixed(2));
    });

    if (name === "Oliver") {
      defaultVals.CREA = 4.8;
      defaultVals.BUN = 78.2;
      defaultVals.TP = 9.2;
      defaultVals.GLU = 185.0;
    }

    if (name === "Bella") {
      defaultVals.TP = 8.9;
      defaultVals.ALT = 135.0;
    }

    // Greyhound CBC specific baseline testing:
    // HCT is high (61.0% - normal for greyhounds, high for other dogs)
    // Platelet is low (105 x10^9/L - normal for greyhounds, low for other dogs)
    if (p && p.breed === "Greyhound") {
      defaultVals.HCT = 61.2;
      defaultVals.PLT = 105.0;
      defaultVals.CREA = 1.95; // High creatinine is standard for greyhounds due to large muscle mass!
    }

    return defaultVals;
  }

  generateAndRenderReportTable(order, patient) {
    const reportPanel = document.getElementById("labs-report-panel");
    
    // Check Greyhound breed baseline shifts
    const refKey = (patient.breed === "Greyhound") ? "Greyhound" : (patient.species === "Feline" ? "Feline" : "Canine");
    const ref = this.referenceRanges[refKey];
    
    const results = order.results || {};
    let rowsHTML = "";

    Object.keys(ref).forEach(k => {
      const val = results[k] || 0;
      const limits = ref[k];
      
      let isHigh = val > limits.high;
      let isLow = val < limits.low;
      
      let alertHTML = "";
      let rowClass = "";
      
      if (isHigh) {
        alertHTML = `<span class="alert-badge triage-critical">HIGH</span>`;
        rowClass = "lab-row-alert";
      } else if (isLow) {
        alertHTML = `<span class="alert-badge triage-urgent">LOW</span>`;
        rowClass = "lab-row-alert";
      }

      rowsHTML += `
        <tr class="${rowClass}">
          <td style="font-weight:600;">${k}</td>
          <td style="color:var(--text-secondary); font-size:12px;">${limits.fullName}</td>
          <td style="font-size:14px; font-weight:700;">${val} ${alertHTML}</td>
          <td>${limits.low} - ${limits.high}</td>
          <td style="color:var(--text-muted); font-size:11px;">${limits.unit}</td>
        </tr>
      `;
    });

    // Diagnostic notes summary explaining Greyhound adaptations
    let diagnosticSummaryText = `Diagnostic biochemistry profile completed successfully.`;
    if (patient.breed === "Greyhound") {
      diagnosticSummaryText = `
        <b>Greyhound Breed Anomaly Rule Active:</b> Hematocrit is 61.2% (Standard dog high is 55.0%) and Platelets are 105.0 x10^9/L (Standard dog low is 150.0%). 
        These values are completely **Normal** for retired racing greyhounds due to physiological elevations in RBC volume and lower baseline platelet parameters. 
        Creatinine is 1.95 mg/dL (Normal standard dog limit 1.8), consistent with typical high muscle mass parameters. 
        <span style="color:var(--success); font-weight:700;">No diagnostic interventions or invasive marrow biopsy required.</span>
      `;
    } else if (patient.name === "Oliver") {
      diagnosticSummaryText = `<b>Pathology Alert:</b> Severe Azotemia (elevated CREA/BUN) detected in feline patient. Suggests severe primary renal insufficiency or high-degree pre-renal dehydration. File results immediately and begin fluid therapy titration.`;
    }

    reportPanel.innerHTML = `
      <div style="display:flex; justify-content:between; align-items:center; border-bottom:1px solid var(--glass-border); padding-bottom:12px; margin-bottom:16px;">
        <div>
          <h3 style="font-size:16px; font-weight:800; color:#fff;">Biochemistry & Hematology Report</h3>
          <p style="font-size:11px; color:var(--text-secondary);">Analyzer: <b>IDEXX Catalyst One (Serial #CAT-99211)</b> • Reference system applied: <b>${refKey}</b></p>
        </div>
        <button class="btn btn-secondary" id="btn-labs-write-ehr">✓ File to SOAP Assessment</button>
      </div>

      <table class="lab-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Description</th>
            <th>Measured Value</th>
            <th>Reference Range</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <div class="glass-card" style="margin-top: 20px; padding: 12px; background: rgba(6,182,212,0.04); border-color: rgba(6,182,212,0.15);">
        <span style="font-weight:700; color:var(--info); font-size:12px;">Clinical Diagnostic Summary</span><br>
        <span style="font-size:12px; color:var(--text-secondary);" id="lab-clinical-summary-text">
          ${diagnosticSummaryText}
        </span>
      </div>
    `;

    document.getElementById("btn-labs-write-ehr").addEventListener("click", () => {
      this.writeLabResultToSOAP(order, patient);
    });
  }

  writeLabResultToSOAP(order, patient) {
    const refKey = (patient.breed === "Greyhound") ? "Greyhound" : (patient.species === "Feline" ? "Feline" : "Canine");
    const ref = this.referenceRanges[refKey];
    const results = order.results || {};

    let txt = `[LAB Catalyst One Diagnostic Report - ${order.timestamp}]\n`;
    Object.keys(results).forEach(k => {
      const val = results[k];
      const limits = ref[k];
      let alert = "";
      if (val > limits.high) alert = " (HIGH)";
      if (val < limits.low) alert = " (LOW)";
      txt += `- ${k}: ${val} ${limits.unit} [Normal: ${limits.low}-${limits.high}]${alert}\n`;
    });

    patient.soap.assessment += `\nDiagnostics filed. Lab biochemistry confirmed on IDEXX panel.`;
    patient.soap.plan += `\nReference range rules applied: ${refKey} protocol.`;

    window.vetApp.showToast(`Biochemistry diagnostics successfully filed to <b>${patient.name}</b>'s SOAP chart notes!`, "success");
  }
}

// Register on window
window.vetpmsLabs = new VetPMSLaboratories();
