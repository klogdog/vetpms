// VetPMS DICOM PACS Viewer & Modality Worklist Module

class VetPMSImaging {
  constructor() {
    this.mwlList = document.getElementById("pacs-mwl-list");
    this.waitingScreen = document.getElementById("pacs-waiting-screen");
    this.simStatus = document.getElementById("mwl-sim-status");
    this.simSub = document.getElementById("mwl-sim-sub");
    this.triggerBtn = document.getElementById("btn-trigger-xray-acquisition");
    this.viewportFrame = document.getElementById("pacs-viewport");
    
    // Sliders
    this.brightnessSlider = document.getElementById("slider-pacs-brightness");
    this.contrastSlider = document.getElementById("slider-pacs-contrast");
    this.caliperBtn = document.getElementById("btn-toggle-caliper");
    this.invertBtn = document.getElementById("btn-invert-grayscale");

    this.activeOrderId = null;
    this.brightness = 100;
    this.contrast = 100;
    this.inverted = false;
    this.caliperEnabled = false;

    // Caliper drag state
    this.caliperLines = {
      longAxis: { p1: { x: 220, y: 140 }, p2: { x: 280, y: 260 } },
      shortAxis: { p1: { x: 190, y: 220 }, p2: { x: 300, y: 190 } }
    };
    this.dragTarget = null; // { line: 'longAxis'|'shortAxis', point: 'p1'|'p2' }

    this.initEventListeners();
  }

  initEventListeners() {
    this.triggerBtn.addEventListener("click", () => this.simulateAcquisition());
    
    this.brightnessSlider.addEventListener("input", (e) => {
      this.brightness = e.target.value;
      this.applyFilters();
    });

    this.contrastSlider.addEventListener("input", (e) => {
      this.contrast = e.target.value;
      this.applyFilters();
    });

    this.invertBtn.addEventListener("click", () => {
      this.inverted = !this.inverted;
      this.applyFilters();
      this.invertBtn.classList.toggle("btn-purple", this.inverted);
    });

    this.caliperBtn.addEventListener("click", () => {
      this.caliperEnabled = !this.caliperEnabled;
      this.caliperBtn.classList.toggle("btn-purple", this.caliperEnabled);
      window.vetApp.showToast(
        this.caliperEnabled ? "VHS Caliper Tools enabled. Click & drag handles to align." : "Caliper Tools disabled.", 
        "imaging"
      );
      this.renderViewport();
    });
  }

  render() {
    this.renderMWL();
    this.renderViewport();
  }

  renderMWL() {
    if (!this.mwlList) return;
    this.mwlList.innerHTML = "";

    const orders = window.vetApp.state.imagingOrders;

    if (orders.length === 0) {
      this.mwlList.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--text-muted); padding:16px;">No imaging orders in queue</div>`;
      return;
    }

    orders.forEach(o => {
      const item = document.createElement("div");
      item.className = `mwl-item ${o.orderId === this.activeOrderId ? "active" : ""}`;
      
      let statusBadgeColor = "var(--warning)";
      if (o.status === "COMPLETED") statusBadgeColor = "var(--success)";

      item.innerHTML = `
        <div style="display:flex; justify-content:between; align-items:center; margin-bottom:4px;">
          <span style="font-weight:700; font-size:12px; color:#fff;">${o.patientName}</span>
          <span style="font-size:10px; background:${statusBadgeColor}; padding:1px 6px; border-radius:10px; color:#000; font-weight:600;">${o.status}</span>
        </div>
        <div style="font-size:11px; color:var(--text-secondary);">${o.studyType}</div>
      `;

      item.addEventListener("click", () => {
        this.activeOrderId = o.orderId;
        this.render();
      });

      this.mwlList.appendChild(item);
    });
  }

  renderViewport() {
    // Clear dynamic overlays
    const patientOverlay = document.getElementById("overlay-patient-left");
    const studyOverlay = document.getElementById("overlay-study-right");
    const clinicOverlay = document.getElementById("overlay-clinic-left");

    // Remove existing interactive canvas if any
    const existingCanvas = this.viewportFrame.querySelector("canvas");
    if (existingCanvas) existingCanvas.remove();

    if (!this.activeOrderId) {
      this.waitingScreen.style.display = "flex";
      this.simStatus.innerText = "PACS Status: Idle";
      this.simSub.innerText = "Order a radiograph in SOAP notes or choose a pending MWL order to acquire.";
      this.triggerBtn.style.display = "none";
      
      patientOverlay.innerText = "PATIENT: N/A";
      studyOverlay.innerText = "STUDY UID: N/A";
      return;
    }

    const o = window.vetApp.state.imagingOrders.find(ord => ord.orderId === this.activeOrderId);
    if (!o) return;

    // Set DICOM overlays
    patientOverlay.innerHTML = `PATIENT ID: <b>${o.patientId}</b><br>NAME: <b>${o.patientName}</b><br>SPECIES: <b>${o.patientSpecies}</b>`;
    studyOverlay.innerHTML = `STUDY UID: <b>1.2.826.0.1.368.${o.orderId.replace(/\D/g,"")}</b><br>MODALITY: <b>DX (Digital X-Ray)</b><br>ACQUIRED: <b>${o.timestamp}</b>`;

    if (o.status === "ORDERED") {
      this.waitingScreen.style.display = "flex";
      this.simStatus.innerHTML = `<span style="color:var(--warning);">AWAITING MODALITY LINK</span>`;
      this.simSub.innerHTML = `Modality X-Ray generator linked on Port 104.<br>Worklist ID matched. Ready for C-STORE transmission.`;
      this.triggerBtn.style.display = "block";
    } else {
      // Completed, render interactive canvas!
      this.waitingScreen.style.display = "none";
      this.renderRadiographCanvas(o);
    }
  }

  // Simulates X-Ray scan and stores in DICOM PACS
  simulateAcquisition() {
    const o = window.vetApp.state.imagingOrders.find(ord => ord.orderId === this.activeOrderId);
    if (!o) return;

    this.triggerBtn.style.display = "none";
    this.simStatus.innerHTML = `<span style="color:var(--primary); animation:pulse 1s infinite alternate;">PACS: ACQUIRING dcm CHUNKS...</span>`;
    
    // Simulate acquisition progress
    setTimeout(() => {
      o.status = "COMPLETED";
      
      // Update patient status in main whiteboard
      const p = window.vetApp.getPatient(o.patientId);
      if (p) {
        p.status = "Recovery"; // move to recovery after diagnostic imaging
        window.vetApp.showToast(`DICOM C-STORE successful! Radiograph attached to <b>${p.name}</b>'s chart.`, "success");
      }
      
      this.render();
    }, 2000);
  }

  // Draw the high-fidelity radiograph mockup onto a custom canvas + handle interactive calipers
  renderRadiographCanvas(order) {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.cursor = this.caliperEnabled ? "crosshair" : "default";
    this.viewportFrame.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    this.canvasElement = canvas;
    this.canvasCtx = ctx;

    this.drawBaseRadiograph(ctx, order.patientSpecies);
    this.drawCaliperOverlay(ctx);
    this.applyFilters();

    // Mouse interactive caliper dragging
    if (this.caliperEnabled) {
      canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e, canvas));
      canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e, canvas));
      canvas.addEventListener("mouseup", () => this.handleMouseUp());
    }
  }

  // Procedurally generates a stunning bone chest cavity X-ray on HTML5 Canvas!
  drawBaseRadiograph(ctx, species) {
    // Fill deep charcoal DICOM background
    ctx.fillStyle = "#030303";
    ctx.fillRect(0, 0, 600, 400);

    // Dynamic high-contrast chest anatomical layers
    // Draw lung lobes (darker air-filled zones)
    const lungGrad = ctx.createRadialGradient(260, 200, 40, 260, 200, 160);
    lungGrad.addColorStop(0, "#080b0e");
    lungGrad.addColorStop(1, "#181d24");
    ctx.fillStyle = lungGrad;
    ctx.beginPath();
    ctx.ellipse(260, 200, 140, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw vertebral column (spine bones across the top)
    ctx.fillStyle = "rgba(220, 220, 220, 0.4)";
    for (let x = 60; x < 540; x += 30) {
      ctx.fillRect(x, 70, 24, 12);
      ctx.fillStyle = "rgba(180, 180, 180, 0.35)";
      ctx.fillRect(x + 24, 73, 6, 6); // Disc spaces
    }

    // Draw rib cage (curved thin ribs crossing the lungs)
    ctx.strokeStyle = "rgba(230, 230, 230, 0.18)";
    ctx.lineWidth = 4;
    for (let x = 120; x < 420; x += 40) {
      ctx.beginPath();
      ctx.arc(x, 30, 180, Math.PI * 0.15, Math.PI * 0.45);
      ctx.stroke();
    }

    // Draw heart silhouette (center density overlay)
    const heartX = 260;
    const heartY = 200;
    ctx.fillStyle = "rgba(240, 240, 240, 0.38)";
    ctx.beginPath();
    ctx.ellipse(heartX, heartY, 60, 50, Math.PI * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Draw sternum (bottom breastbone)
    ctx.fillStyle = "rgba(220, 220, 220, 0.3)";
    ctx.fillRect(100, 310, 400, 8);

    // Anatomical orientation letters (R for Right, L for Left)
    ctx.font = "bold 20px monospace";
    ctx.fillStyle = "#ef4444";
    ctx.fillText("R", 40, 340);
  }

  // Renders the draggable Vertebral Heart Scale lines
  drawCaliperOverlay(ctx) {
    if (!this.caliperEnabled) {
      document.getElementById("overlay-clinic-left").innerHTML = "VETPMS MEDICAL PACS<br>CALIPER: OFF";
      return;
    }

    ctx.lineWidth = 2;
    
    // Draw Long Axis (Indicated in Magenta)
    ctx.strokeStyle = "#ec4899";
    ctx.fillStyle = "#ec4899";
    const la = this.caliperLines.longAxis;
    ctx.beginPath();
    ctx.moveTo(la.p1.x, la.p1.y);
    ctx.lineTo(la.p2.x, la.p2.y);
    ctx.stroke();
    // Handles
    ctx.beginPath(); ctx.arc(la.p1.x, la.p1.y, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(la.p2.x, la.p2.y, 6, 0, Math.PI*2); ctx.fill();

    // Draw Short Axis (Indicated in Cyan)
    ctx.strokeStyle = "#06b6d4";
    ctx.fillStyle = "#06b6d4";
    const sa = this.caliperLines.shortAxis;
    ctx.beginPath();
    ctx.moveTo(sa.p1.x, sa.p1.y);
    ctx.lineTo(sa.p2.x, sa.p2.y);
    ctx.stroke();
    // Handles
    ctx.beginPath(); ctx.arc(sa.p1.x, sa.p1.y, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sa.p2.x, sa.p2.y, 6, 0, Math.PI*2); ctx.fill();

    // Calculate Vertebral Heart Size metrics
    const dx_la = la.p2.x - la.p1.x;
    const dy_la = la.p2.y - la.p1.y;
    const la_len = Math.sqrt(dx_la * dx_la + dy_la * dy_la);

    const dx_sa = sa.p2.x - sa.p1.x;
    const dy_sa = sa.p2.y - sa.p1.y;
    const sa_len = Math.sqrt(dx_sa * dx_sa + dy_sa * dy_sa);

    // Map pixel lengths to VHS units (vertebrae count scale)
    const la_vhs = (la_len / 22).toFixed(1);
    const sa_vhs = (sa_len / 22).toFixed(1);
    const total_vhs = (parseFloat(la_vhs) + parseFloat(sa_vhs)).toFixed(1);

    // Diagnostic interpretation
    let diagnosis = "NORMAL SIZE";
    if (total_vhs > 10.5) diagnosis = "CARDIOMEGALY (HIGH RISK)";

    document.getElementById("overlay-clinic-left").innerHTML = `
      VETPMS CLINICAL PACS<br>
      LONG AXIS: <span style="color:#ec4899;">${la_vhs} v</span><br>
      SHORT AXIS: <span style="color:#06b6d4;">${sa_vhs} v</span><br>
      <b>VHS SCALE: ${total_vhs} v (${diagnosis})</b>
    `;
  }

  // Adjust brightness / contrast CSS overlays directly on the canvas DOM element
  applyFilters() {
    if (!this.canvasElement) return;
    let filterString = `brightness(${this.brightness}%) contrast(${this.contrast}%)`;
    if (this.inverted) {
      filterString += ` invert(1)`;
    }
    this.canvasElement.style.filter = filterString;
  }

  // Caliper interaction mechanics
  handleMouseDown(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Detect handle collision
    const threshold = 10;
    
    // Check points
    for (let line of ['longAxis', 'shortAxis']) {
      for (let point of ['p1', 'p2']) {
        const pt = this.caliperLines[line][point];
        const dist = Math.sqrt((pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y));
        if (dist <= threshold) {
          this.dragTarget = { line, point };
          return;
        }
      }
    }
  }

  handleMouseMove(e, canvas) {
    if (!this.dragTarget) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Constraint coordinates
    const boundedX = Math.max(10, Math.min(590, x));
    const boundedY = Math.max(10, Math.min(390, y));

    this.caliperLines[this.dragTarget.line][this.dragTarget.point] = { x: boundedX, y: boundedY };
    
    // Quick re-draw
    const o = window.vetApp.state.imagingOrders.find(ord => ord.orderId === this.activeOrderId);
    this.drawBaseRadiograph(this.canvasCtx, o.patientSpecies);
    this.drawCaliperOverlay(this.canvasCtx);
  }

  handleMouseUp() {
    this.dragTarget = null;
  }
}

// Register on window
window.vetpmsImaging = new VetPMSImaging();
