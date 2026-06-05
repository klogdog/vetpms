// VetPMS Billing, Trupanion Insurance, and Clover Terminal Integration Module
// Implementing Missed-Charge Capture Diff Engines, VMGA standard chart mappings, and ProSal production divisions.

class VetPMSBilling {
  constructor() {
    this.patientMeta = document.getElementById("billing-patient-meta");
    this.invoiceBox = document.getElementById("billing-invoice-box");
    
    // Actions
    this.claimBtn = document.getElementById("btn-submit-insurance-claim");
    this.payBtn = document.getElementById("btn-trigger-payment-terminal");
    this.actionButtons = document.getElementById("billing-action-buttons");

    // Integrations UI
    this.terminalDisplay = document.getElementById("billing-terminal-display");
    this.terminalLight = document.getElementById("terminal-light");
    this.terminalStatusText = document.getElementById("terminal-status-text");
    this.terminalSubText = document.getElementById("terminal-sub-text");
    this.claimsRegistryList = document.getElementById("billing-claims-list");

    this.activePatientId = null;
    this.totalBalanceDue = 0.0;
    this.invoiceItems = [];
    this.isClaimSubmitted = false;

    this.missedCharges = [];

    this.injectMissedChargePanel();
    this.initEventListeners();
  }

  // Inject a secure Missed-Charge Capture reconciliation panel above the active checkout invoice
  injectMissedChargePanel() {
    const parent = this.invoiceBox;
    if (!parent || document.getElementById("missed-charge-panel")) return;

    const panel = document.createElement("div");
    panel.id = "missed-charge-panel";
    panel.style = "display:none; margin-bottom: 16px;";
    parent.parentNode.insertBefore(panel, parent);
  }

  initEventListeners() {
    this.claimBtn.addEventListener("click", () => this.submitInsuranceClaim());
    this.payBtn.addEventListener("click", () => this.processTerminalPayment());
  }

  render() {
    this.activePatientId = window.vetApp.activePatientId;
    this.reconcileMissedCharges();
    this.renderInvoice();
    this.renderClaimsList();
  }

  // Automated Missed-Charge Capture Diff Engine
  // Compares documented clinical care (SOAP notes, DEA logs, dental) against the current invoice
  reconcileMissedCharges() {
    const p = window.vetApp.getPatient(this.activePatientId);
    const panel = document.getElementById("missed-charge-panel");
    
    if (!p || !panel) {
      if (panel) panel.style.display = "none";
      return;
    }

    this.missedCharges = [];

    // Check 1: Did we draw a DEA drug in substances.js but omit it from invoices?
    const deaLogs = window.vetApp.state.auditLogs.filter(l => l.patientId === p.id || (l.patientId === undefined && l.patientName.toLowerCase() === p.name.toLowerCase()));
    deaLogs.forEach(log => {
      const drugBase = log.drugName.split(" ")[0];
      const isInvoiced = p.invoices.some(inv => inv.item.includes(drugBase));
      if (!isInvoiced) {
        this.missedCharges.push({
          item: `Controlled Med: ${drugBase} Injection (${log.amount}mL)`,
          price: parseFloat((log.amount * 18.0 + 15.0).toFixed(2)),
          category: "Pharmacy Fee",
          reason: "Documented in DEA vault ledger but omitted from invoice"
        });
      }
    });

    // Check 2: Did we write an X-Ray study plan in SOAP but omit it from invoices?
    const hasXrayInSOAP = p.soap.plan.toLowerCase().includes("radiograph") || p.soap.plan.toLowerCase().includes("x-ray");
    const isXrayInvoiced = p.invoices.some(inv => inv.item.includes("Imaging") || inv.item.includes("Radiograph"));
    if (hasXrayInSOAP && !isXrayInvoiced) {
      this.missedCharges.push({
        item: `Diagnostic Imaging: Thoracic/Abdominal Radiographs`,
        price: 195.00,
        category: "Diagnostic Fee",
        reason: "Ordered in SOAP Medical Plan notes but unbilled"
      });
    }

    // Render alert panel if leakage detected
    if (this.missedCharges.length > 0) {
      panel.style.display = "block";
      panel.innerHTML = `
        <div class="glass-card" style="border-color: var(--danger); background: rgba(239, 68, 68, 0.08); padding: 12px; display:flex; flex-direction:column; gap:8px;">
          <span style="font-weight:800; color:var(--danger); font-size:12px; display:flex; align-items:center; gap:6px;">
            ⚠️ MISSED REVENUE DETECTED: UNINVOICED CLINICAL CHARGES (${this.missedCharges.length})
          </span>
          <div style="font-size:11px; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px;">
            ${this.missedCharges.map(m => `
              <div style="display:flex; justify-content:between; border-bottom:1px solid rgba(255,255,255,0.02); padding-bottom:4px;">
                <span>• <b>${m.item}</b> ($${m.price.toFixed(2)})<br><span style="color:var(--text-muted); font-size:10px;">Reason: ${m.reason}</span></span>
              </div>
            `).join("")}
          </div>
          <button class="btn" style="background:var(--danger); font-size:11px; padding:6px 12px; justify-content:center; margin-top:4px;" id="btn-auto-capture">
            ✓ Auto-Capture Leaked Charges ($${this.missedCharges.reduce((acc, c) => acc + c.price, 0).toFixed(2)})
          </button>
        </div>
      `;

      document.getElementById("btn-auto-capture").onclick = () => this.handleAutoCaptureLeakedRevenue(p);
    } else {
      panel.style.display = "none";
    }
  }

  handleAutoCaptureLeakedRevenue(patient) {
    this.missedCharges.forEach(c => {
      patient.invoices.push({
        item: c.item,
        price: c.price,
        category: c.category
      });
    });

    window.vetApp.showToast(`Revenue Secured! ${this.missedCharges.length} charges captured to active invoice.`, "success");
    this.missedCharges = [];
    this.render();
  }

  renderInvoice() {
    if (!this.invoiceBox) return;

    const p = window.vetApp.getPatient(this.activePatientId);
    if (!p) {
      this.invoiceBox.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:20px;">No patient invoice loaded.</div>`;
      this.claimBtn.style.display = "none";
      this.payBtn.style.display = "none";
      return;
    }

    this.patientMeta.innerHTML = `
      Patient: <b>${p.name}</b> (${p.species}) • Owner: <b>${p.owner}</b> • Whiteboard Lane: <b>${p.status}</b>
    `;

    this.invoiceItems = [...p.invoices];
    
    if (this.invoiceItems.length === 0) {
      this.invoiceBox.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:20px;">No charges recorded on ${p.name}'s clinical record.</div>`;
      this.claimBtn.style.display = "none";
      this.payBtn.style.display = "none";
      return;
    }

    let subtotal = 0.0;
    let itemsHTML = "";

    // VMGA Chart of Accounts Category aggregates
    const vmgaSummary = {};

    this.invoiceItems.forEach(item => {
      subtotal += item.price;
      const cat = item.category || "Professional Service";
      vmgaSummary[cat] = (vmgaSummary[cat] || 0) + item.price;

      let categoryBadge = `<span style="font-size:9px; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:var(--text-muted);">${cat}</span>`;

      itemsHTML += `
        <div class="invoice-item" style="border-bottom:1px solid rgba(255,255,255,0.02); padding-bottom:6px;">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <span>${item.item}</span>
            ${categoryBadge}
          </div>
          <span style="font-family:monospace; font-weight:600;">$${item.price.toFixed(2)}</span>
        </div>
      `;
    });

    const tax = subtotal * 0.08; // 8% sales tax on tangible goods/meds
    this.totalBalanceDue = subtotal + tax;

    // ProSal split calculation: DVM gets 20% production of Professional services, diagnostics, and surgical dental fees
    let proSalEligible = 0.0;
    this.invoiceItems.forEach(item => {
      if (item.category === "Professional Service" || item.category === "Diagnostic Fee" || item.category === "Dental Fee") {
        proSalEligible += item.price;
      }
    });
    const dvmProduction = proSalEligible * 0.20;

    // Render invoice summary including VMGA Chart mappings and ProSal dividends
    this.invoiceBox.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; max-height:220px; overflow-y:auto; padding-right:6px; margin-bottom:12px;">
        ${itemsHTML}
      </div>

      <!-- VMGA Standard Chart of Accounts Division mapping -->
      <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; font-size:11px; margin-bottom:12px; border:1px solid var(--glass-border);">
        <span style="font-weight:700; color:var(--info); display:block; margin-bottom:4px;">AAHA / VMGA Chart of Accounts Mapping</span>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; color:var(--text-secondary);">
          ${Object.keys(vmgaSummary).map(k => `
            <span>${k}: <b>$${vmgaSummary[k].toFixed(2)}</b></span>
          `).join("")}
        </div>
      </div>

      <!-- Associate ProSal Compensation calculation -->
      <div style="font-size:11px; color:var(--text-muted); display:flex; justify-content:between; margin-bottom:12px; border-bottom:1px dashed var(--glass-border); padding-bottom:8px;">
        <span>Provider: <b>Dr. Jeffery Powell</b></span>
        <span>ProSal DVM Production (20% Eligible): <b style="color:var(--success);">$${dvmProduction.toFixed(2)}</b></span>
      </div>

      <div style="border-top:1px solid var(--glass-border); padding-top:10px; display:flex; flex-direction:column; gap:6px; font-size:12px; color:var(--text-secondary);">
        <div style="display:flex; justify-content:between;">
          <span>Subtotal</span>
          <span style="font-family:monospace;">$${subtotal.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:between;">
          <span>Sales Tax (8%)</span>
          <span style="font-family:monospace;">$${tax.toFixed(2)}</span>
        </div>
        <div class="invoice-total">
          <span>TOTAL CHARGES</span>
          <span style="font-family:monospace; color:var(--info); font-size:18px;">$${this.totalBalanceDue.toFixed(2)}</span>
        </div>
      </div>
    `;

    this.claimBtn.style.display = "block";
    this.payBtn.style.display = "block";
    
    if (this.isClaimSubmitted) {
      this.claimBtn.innerText = "Trupanion Claim Processed";
      this.claimBtn.disabled = true;
      this.claimBtn.classList.add("btn-secondary");
    } else {
      this.claimBtn.innerText = "Submit Direct Trupanion Claim";
      this.claimBtn.disabled = false;
      this.claimBtn.classList.remove("btn-secondary");
    }
  }

  submitInsuranceClaim() {
    const p = window.vetApp.getPatient(this.activePatientId);
    if (!p) return;

    this.claimBtn.innerText = "Processing Claim...";
    this.claimBtn.disabled = true;

    window.vetApp.showToast("Contacting Trupanion Direct Pay Gateway...", "info");

    setTimeout(() => {
      let eligibleSubtotal = 0.0;
      this.invoiceItems.forEach(item => {
        if (item.category === "Diagnostic Fee" || item.category === "Dental Fee") {
          eligibleSubtotal += item.price;
        }
      });

      const deductible = p.name === "Oliver" ? 50.00 : 0.00;
      const eligibleAfterDeductible = Math.max(0, eligibleSubtotal - deductible);
      
      const insurancePayout = eligibleAfterDeductible * 0.90;
      const clientCopay = (eligibleAfterDeductible * 0.10) + deductible + (this.totalBalanceDue - eligibleSubtotal);

      const claimsPayload = {
        claimId: `clm-${Date.now().toString().substring(8)}`,
        patientName: p.name,
        totalCharges: this.totalBalanceDue,
        insurancePaid: insurancePayout,
        clientOwes: clientCopay,
        status: "APPROVED",
        timestamp: new Date().toLocaleTimeString()
      };

      window.vetApp.state.claims.push(claimsPayload);
      this.isClaimSubmitted = true;

      p.invoices.push({
        item: `➖ Trupanion Direct Pay Cover (90% Eligible)`,
        price: -insurancePayout,
        category: "Insurance Credit"
      });
      
      window.vetApp.showToast(`Trupanion claim approved! <b>$${insurancePayout.toFixed(2)}</b> sent directly to clinic.`, "success");
      this.render();
    }, 2000);
  }

  processTerminalPayment() {
    const p = window.vetApp.getPatient(this.activePatientId);
    if (!p) return;

    this.payBtn.innerText = "Awaiting Terminal Tap...";
    this.payBtn.disabled = true;

    this.terminalLight.style.backgroundColor = "var(--warning)";
    this.terminalLight.style.animation = "blink 0.5s infinite alternate";
    this.terminalStatusText.innerText = "SWIPE / TAP CARD";
    this.terminalStatusText.style.color = "var(--warning)";
    this.terminalSubText.innerHTML = `
      Amount Due: <b style="font-size:16px; color:#fff;">$${this.totalBalanceDue.toFixed(2)}</b><br><br>
      <button class="btn" style="padding:4px 10px; font-size:11px;" id="btn-simulate-card-tap">Simulate Card Tap</button>
    `;

    document.getElementById("btn-simulate-card-tap").addEventListener("click", () => {
      this.completeTerminalTransaction(p);
    });
  }

  completeTerminalTransaction(patient) {
    this.terminalLight.style.backgroundColor = "var(--success)";
    this.terminalLight.style.animation = "none";
    this.terminalStatusText.innerText = "TRANSACTION APPROVED";
    this.terminalStatusText.style.color = "var(--success)";
    
    const txnId = `txn_${Math.floor(Math.random()*100000000)}`;
    this.terminalSubText.innerHTML = `
      Auth Code: <b>992110</b><br>
      Ref ID: <b>${txnId}</b><br>
      Status: <b>SUCCESS</b><br>
      <span style="font-size:10px; color:var(--text-secondary);">Receipt printed.</span>
    `;

    patient.invoices = [];
    patient.status = "Checked Out";

    window.vetApp.showToast(`Invoice cleared. Patient <b>${patient.name}</b> successfully discharged.`, "success");

    this.payBtn.innerText = "Process Card Payment";
    this.payBtn.disabled = false;
    this.isClaimSubmitted = false;

    this.render();
  }

  renderClaimsList() {
    if (!this.claimsRegistryList) return;
    this.claimsRegistryList.innerHTML = "";

    const claims = window.vetApp.state.claims;

    if (claims.length === 0) {
      this.claimsRegistryList.innerHTML = `<div style="text-align: center; font-size:12px; color: var(--text-muted); padding: 12px;">No claims submitted today.</div>`;
      return;
    }

    const sortedClaims = [...claims].reverse();

    sortedClaims.forEach(c => {
      this.claimsRegistryList.innerHTML += `
        <div class="claim-item">
          <div style="display:flex; flex-direction:column; gap:2px;">
            <span style="font-weight:700; font-size:12px; color:#fff;">Claim ID: ${c.claimId}</span>
            <span style="font-size:10px; color:var(--text-secondary);">Patient: <b>${c.patientName}</b> • Time: ${c.timestamp}</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
            <span style="font-size:12px; font-weight:700; color:var(--success);">+$${c.insurancePaid.toFixed(2)}</span>
            <span style="font-size:9px; background:var(--success); color:#000; padding:1px 6px; border-radius:4px; font-weight:700;">${c.status}</span>
          </div>
        </div>
      `;
    });
  }
}

// Register on window
window.vetpmsBilling = new VetPMSBilling();
