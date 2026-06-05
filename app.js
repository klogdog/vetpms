// VetPMS Principal-Grade Global Orchestrator & State Management
// Implementing bitemporal semantics, many-to-many ownership, and clinical database layers.

class VetPMSApplication {
  constructor() {
    window.vetApp = this;
    this.state = {
      // 1. DEDUPLICATED PARTY RELATION MODEL (Many-to-Many Shared Custody)
      parties: [
        { id: "party-1", name: "Sarah Connor", phone: "555-0192", email: "sarah@resistance.org", address: "101 Bunker Hill, LA" },
        { id: "party-2", name: "Marcus Wright", phone: "555-2018", email: "marcus@cyberdyne.com", address: "404 Skynet Blvd, LA" },
        { id: "party-3", name: "John Connor", phone: "555-1997", email: "john.connor@hqpms.org", address: "202 Sector Seven, LA" }
      ],

      // 2. CONTROLLED VOCABULARY ANIMAL MODEL (Separated Sex & Repro Status)
      animals: [
        {
          id: "pet-1",
          name: "Oliver",
          species: "Feline",
          breed: "Siamese",
          breedSource: "DNA-tested (Wisdom Panel)",
          sex: "M", 
          reproductiveStatus: "neutered",
          reproEffectiveDate: "2022-11-04",
          dob: "2022-04-12",
          dobPrecision: "exact",
          microchips: [
            { chipId: "985112000293810", registry: "HomeAgain", compliant: true, date: "2022-07-15", location: "Left Scapular" }
          ],
          warnings: ["Allergy: Penicillin", "Will Hiss/Scratch when handled", "Chronic Kidney Disease (CKD) Stage 2"],
          alertCategory: "medical",
          triage: "Standard",
          status: "Checked In",
          location: "Ward C-04",
          vitals: { temp: 38.5, hr: 140, rr: 28, crt: "1.5s", mm: "Pink", bcs: "5/9 (Ideal)", mcs: "Normal" },
          soap: {
            subjective: "Owner reports Oliver has been lethargic and drinking excess water for 2 weeks. Mild weight loss noticed.",
            objective: "Vitals stable. Coat slightly dull. Palpation of kidneys reveals normal size, no pain.",
            assessment: "Rule out Feline Chronic Kidney Disease (CKD) Stage 2, Diabetes Mellitus.",
            plan: "Recommended complete blood biochemistry (Chem17 Catalyst) and urinalysis. Order fluid hydration support."
          },
          invoices: [
            { item: "Hospitalization Ward Rate (Per Day)", price: 85.00, category: "Ward Fee" },
            { item: "Intravenous Fluid Therapy Setup", price: 120.00, category: "Medical Consumables" }
          ]
        },
        {
          id: "pet-2",
          name: "Bella",
          species: "Canine",
          breed: "Golden Retriever",
          breedSource: "Breeder-attested",
          sex: "F",
          reproductiveStatus: "spayed",
          reproEffectiveDate: "2024-03-10",
          dob: "2023-11-20",
          dobPrecision: "exact",
          microchips: [
            { chipId: "981023901928302", registry: "AKC Reunite", compliant: true, date: "2024-02-05", location: "Left Scapular" }
          ],
          warnings: ["Extremely Friendly", "Food Aggression"],
          alertCategory: "behavioral",
          triage: "Urgent",
          status: "Triage/Vitals",
          location: "Run 12",
          vitals: { temp: 39.1, hr: 110, rr: 36, crt: "2.0s", mm: "Pink", bcs: "7/9 (Overweight)", mcs: "Normal" },
          soap: {
            subjective: "Presented for vomiting since yesterday. Suspected ingestion of a rubber dog toy 36h ago.",
            objective: "Abdomen tense and painful on palpation. Triage vitals show mild fever.",
            assessment: "Gastrointestinal Foreign Body / Obstructive Abdomen.",
            plan: "Order emergency abdominal radiographs (3 views). Establish IV access, prepare for surgical exploratory lap."
          },
          invoices: [
            { item: "Emergency Triage Assessment Fee", price: 150.00, category: "Professional Service" },
            { item: "Intravenous Catheter & Fluids", price: 145.00, category: "Medical Consumables" }
          ]
        },
        {
          id: "pet-3",
          name: "Max",
          species: "Canine",
          breed: "Collie Cross",
          breedSource: "Owner-attested",
          sex: "M",
          reproductiveStatus: "intact",
          reproEffectiveDate: null,
          dob: "2018-05-10",
          dobPrecision: "age_estimate",
          microchips: [],
          warnings: ["MDR1 / ABCB1 Mutation (Homozygous Affected)", "Allergy: Carprofen"],
          alertCategory: "medical",
          triage: "Critical",
          status: "Ward / Hospitalized",
          location: "ICU Oxygen Cage B",
          vitals: { temp: 37.8, hr: 165, rr: 44, crt: "2.5s", mm: "Pale Pink", bcs: "3/9 (Underweight)", mcs: "Mild Sarcopenia" },
          soap: {
            subjective: "Acute collapse at park today. History of mitral valve disease. Heavy coughing.",
            objective: "Tachycardic (HR 165), murmur Grade V/VI heard bilaterally. Respiration rapid and labored with crackles.",
            assessment: "Congestive Heart Failure (CHF) crisis / Pulmonary Edema.",
            plan: "Aggressive loop diuretics (Furosemide). Administer oxygen. Note: Dog is MDR1 mutation homozygous - avoid high-dose macrocyclic lactones."
          },
          invoices: [
            { item: "Critical Care ICU Boarding (First Day)", price: 290.00, category: "Ward Fee" },
            { item: "Continuous Oxygen Chamber Administration", price: 240.00, category: "Professional Service" }
          ]
        },
        {
          id: "pet-4",
          name: "Duke",
          species: "Canine",
          breed: "Greyhound",
          breedSource: "Rescue-attested",
          sex: "M",
          reproductiveStatus: "neutered",
          reproEffectiveDate: "2020-05-12",
          dob: "2019-01-01",
          dobPrecision: "estimated",
          microchips: [
            { chipId: "900012300088192", registry: "PetLink", compliant: true, date: "2020-06-01", location: "Left Neck" }
          ],
          warnings: ["Greyhound CBC Reference Range Anomaly"],
          alertCategory: "medical",
          triage: "Standard",
          status: "Checked In",
          location: "Ward C-01",
          vitals: { temp: 38.3, hr: 90, rr: 20, crt: "1.0s", mm: "Pink", bcs: "4/9 (Lean)", mcs: "Normal" },
          soap: {
            subjective: "Annual wellness check. Retired racer. Eating well, stable energy.",
            objective: "Physical exam normal. Teeth show mild calculus.",
            assessment: "Healthy retired racing greyhound.",
            plan: "Recommend routing blood panel to establish baseline. Ensure breed-specific CBC parameters are reviewed."
          },
          invoices: [
            { item: "Senior Canine Wellness Wellness Exam", price: 75.00, category: "Professional Service" }
          ]
        }
      ],

      // 3. MANY-TO-MANY OWNERSHIP RESOLUTION (Bitemporal Semantics)
      ownerships: [
        { animalId: "pet-1", partyId: "party-1", share: 80, role: "Primary Caregiver", billing: true, communication: true, consent: true, since: "2022-06-01" },
        { animalId: "pet-1", partyId: "party-3", share: 20, role: "Co-Owner (Shared Custody)", billing: false, communication: true, consent: true, since: "2022-06-01" },
        { animalId: "pet-2", partyId: "party-2", share: 100, role: "Sole Owner", billing: true, communication: true, consent: true, since: "2023-12-15" },
        { animalId: "pet-3", partyId: "party-3", share: 100, role: "Sole Owner", billing: true, communication: true, consent: true, since: "2018-08-20" },
        { animalId: "pet-4", partyId: "party-1", share: 100, role: "Sole Owner", billing: true, communication: true, consent: true, since: "2025-02-10" }
      ],

      // 4. WEIGHTS FIRST-CLASS TIME SERIES
      weightHistory: [
        { animalId: "pet-1", date: "2026-04-10", kg: 3.9, method: "scale", user: "Sarah (Tech)" },
        { animalId: "pet-1", date: "2026-05-15", kg: 4.1, method: "scale", user: "Sarah (Tech)" },
        { animalId: "pet-1", date: "2026-06-01", kg: 4.2, method: "scale", user: "Sarah (Tech)" },
        
        { animalId: "pet-2", date: "2026-05-20", kg: 28.0, method: "scale", user: "Mark (Tech)" },
        { animalId: "pet-2", date: "2026-06-01", kg: 28.5, method: "scale", user: "Mark (Tech)" },
        
        { animalId: "pet-3", date: "2026-03-01", kg: 35.2, method: "scale", user: "Sarah (Tech)" },
        { animalId: "pet-3", date: "2026-05-12", kg: 34.1, method: "scale", user: "Mark (Tech)" }, // >30 days old flag trigger!
        
        { animalId: "pet-4", date: "2026-06-01", kg: 31.8, method: "scale", user: "Sarah (Tech)" }
      ],
      
      vault: [
        { id: "sub-1", name: "Ketamine (100mg/mL)", balance: 42.5, unit: "mL", limit: 5.0 },
        { id: "sub-2", name: "Buprenorphine (0.3mg/mL)", balance: 8.2, unit: "mL", limit: 2.0 },
        { id: "sub-3", name: "Propofol (10mg/mL)", balance: 85.0, unit: "mL", limit: 15.0 },
        { id: "sub-4", name: "Alfaxan (10mg/mL)", balance: 18.0, unit: "mL", limit: 4.0 }
      ],

      // Container-level Drug Balance Logs for strict compliance
      drugContainers: [
        { containerId: "CON-K092", drugId: "sub-1", volume: 10.0, maxVol: 50.0, opened: "2026-05-01", depleted: false },
        { containerId: "CON-K093", drugId: "sub-1", volume: 32.5, maxVol: 50.0, opened: "2026-05-20", depleted: false },
        { containerId: "CON-B481", drugId: "sub-2", volume: 8.2, maxVol: 10.0, opened: "2026-05-28", depleted: false }
      ],
      
      auditLogs: [
        { timestamp: "2026-06-01 10:15", drugName: "Ketamine (100mg/mL)", patientName: "Bella", patientId: "pet-2", vet: "Dr. Jeffery Powell", witness: "Tech: Sarah (PIN: 1234)", amount: 1.2, wasted: 0.2, balance: 43.7, reason: "Pre-anesthetic induction" },
        { timestamp: "2026-06-01 14:30", drugName: "Buprenorphine (0.3mg/mL)", patientName: "Max", patientId: "pet-3", vet: "Dr. Evelyn Vance", witness: "Tech: Mark (PIN: 1234)", amount: 0.8, wasted: 0.0, balance: 9.0, reason: "ICU pain management" }
      ],
      
      imagingOrders: [],
      labOrders: [],
      claims: []
    };

    this.activePatientId = "pet-1";
    this.currentView = "whiteboard";
    
    this.initElements();
    this.initEventListeners();
    this.switchView("whiteboard");
  }

  initElements() {
    this.views = {
      whiteboard: document.getElementById("view-whiteboard"),
      ehr: document.getElementById("view-ehr"),
      imaging: document.getElementById("view-imaging"),
      labs: document.getElementById("view-labs"),
      substances: document.getElementById("view-substances"),
      billing: document.getElementById("view-billing")
    };

    this.navItems = {
      whiteboard: document.getElementById("nav-whiteboard"),
      ehr: document.getElementById("nav-ehr"),
      imaging: document.getElementById("nav-imaging"),
      labs: document.getElementById("nav-labs"),
      substances: document.getElementById("nav-substances"),
      billing: document.getElementById("nav-billing")
    };

    this.viewTitle = document.getElementById("current-view-title");
    this.toastStack = document.getElementById("toast-stack");
    this.checkinModal = document.getElementById("modal-checkin");
    this.substanceModal = document.getElementById("modal-substance-draw");
  }

  initEventListeners() {
    // Nav bar clicks
    Object.keys(this.navItems).forEach(viewName => {
      this.navItems[viewName].addEventListener("click", () => this.switchView(viewName));
    });

    // Check-in modal triggers
    document.getElementById("btn-quick-checkin").addEventListener("click", () => this.openModal(this.checkinModal));
    document.getElementById("btn-close-checkin-modal").addEventListener("click", () => this.closeModal(this.checkinModal));
    
    // Quick patient checkin submission
    document.getElementById("form-patient-checkin").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handlePatientCheckinSubmit();
    });

    // Substance Modal close
    document.getElementById("btn-close-substance-modal").addEventListener("click", () => this.closeModal(this.substanceModal));
  }

  // Toast Notification triggers
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast glass`;
    
    let color = "var(--primary)";
    let svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px;height:20px;color:var(--primary);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    
    if (type === "success") {
      color = "var(--success)";
      toast.style.borderColor = "rgba(16, 185, 129, 0.4)";
      svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px;height:20px;color:var(--success);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else if (type === "warning") {
      color = "var(--warning)";
      toast.style.borderColor = "rgba(245, 158, 11, 0.4)";
      svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px;height:20px;color:var(--warning);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
    } else if (type === "danger") {
      color = "var(--danger)";
      toast.style.borderColor = "rgba(239, 68, 68, 0.4)";
      svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px;height:20px;color:var(--danger);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
    } else if (type === "imaging") {
      color = "var(--purple)";
      toast.style.borderColor = "rgba(139, 92, 246, 0.4)";
      svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px;height:20px;color:var(--purple);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
    } else if (type === "lab") {
      color = "var(--info)";
      toast.style.borderColor = "rgba(6, 182, 212, 0.4)";
      svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px;height:20px;color:var(--info);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>`;
    }

    toast.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;">
        ${svgIcon}
      </div>
      <div style="flex-grow:1;font-size:13px;color:var(--text-primary);">${message}</div>
    `;

    this.toastStack.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "fadeOut 0.3s forwards";
      setTimeout(() => toast.remove(), 300);
    }, 5500);
  }

  // Modals management
  openModal(modal) {
    modal.style.display = "flex";
  }

  closeModal(modal) {
    modal.style.display = "none";
  }

  // View routing switcher
  switchView(viewName) {
    this.currentView = viewName;
    
    Object.keys(this.views).forEach(key => {
      if (key === viewName) {
        this.views[key].classList.add("active");
        this.navItems[key].classList.add("active");
      } else {
        this.views[key].classList.remove("active");
        this.navItems[key].classList.remove("active");
      }
    });

    const viewTitles = {
      whiteboard: "Smart Hospital Tracker & Whiteboard",
      ehr: "Electronic Medical Records (SOAP EHR)",
      imaging: "PACS Imaging (DICOM Viewport Simulator)",
      labs: "Laboratory Diagnostic Analyzers",
      substances: "Controlled Substances Regulatory Vault",
      billing: "Payment Terminals & Insurance Claims"
    };
    this.viewTitle.innerText = viewTitles[viewName];

    this.renderView(viewName);
  }

  renderView(viewName) {
    if (viewName === "whiteboard" && window.vetpmsWhiteboard) {
      window.vetpmsWhiteboard.render();
    } else if (viewName === "ehr" && window.vetpmsEHR) {
      window.vetpmsEHR.render();
    } else if (viewName === "imaging" && window.vetpmsImaging) {
      window.vetpmsImaging.render();
    } else if (viewName === "labs" && window.vetpmsLabs) {
      window.vetpmsLabs.render();
    } else if (viewName === "substances" && window.vetpmsSubstances) {
      window.vetpmsSubstances.render();
    } else if (viewName === "billing" && window.vetpmsBilling) {
      window.vetpmsBilling.render();
    }
  }

  // Handle patient check-in admission form
  handlePatientCheckinSubmit() {
    const name = document.getElementById("checkin-pet-name").value;
    const species = document.getElementById("checkin-pet-species").value;
    const breed = document.getElementById("checkin-pet-breed").value || "Mixed Breed";
    const triage = document.getElementById("checkin-triage").value;
    const ownerName = document.getElementById("checkin-owner").value;
    const weight = parseFloat(document.getElementById("checkin-weight").value) || 0.0;
    const warningString = document.getElementById("checkin-warnings").value;
    
    const warnings = warningString ? warningString.split(";").map(s => s.trim()) : [];
    
    // Create new deduplicated party if not existing
    let party = this.state.parties.find(p => p.name.toLowerCase() === ownerName.toLowerCase());
    if (!party) {
      party = {
        id: `party-${Date.now()}`,
        name: ownerName,
        phone: "555-0000",
        email: `${ownerName.toLowerCase().replace(/\s+/g,"")}@gmail.com`,
        address: "Unknown Address"
      };
      this.state.parties.push(party);
    }

    const animalId = `pet-${Date.now()}`;
    const timestampStr = new Date().toISOString().split("T")[0];

    // Create bitemporal ownership
    const newOwnership = {
      animalId,
      partyId: party.id,
      share: 100,
      role: "Sole Owner",
      billing: true,
      communication: true,
      consent: true,
      since: timestampStr
    };
    this.state.ownerships.push(newOwnership);

    // Create weight observation
    this.state.weightHistory.push({
      animalId,
      date: timestampStr,
      kg: weight,
      method: "scale",
      user: "Staff (Reception)"
    });
    
    // Create new patient animal
    const newAnimal = {
      id: animalId,
      name,
      species,
      breed,
      breedSource: "Owner-attested",
      sex: "M", 
      reproductiveStatus: "intact",
      reproEffectiveDate: null,
      dob: timestampStr,
      dobPrecision: "estimated",
      microchips: [],
      warnings,
      triage,
      status: "Checked In",
      location: "Ward C-09",
      vitals: { temp: 38.2, hr: 120, rr: 24, crt: "1.5s", mm: "Pink", bcs: "5/9 (Ideal)", mcs: "Normal" },
      soap: { subjective: "", objective: "", assessment: "", plan: "" },
      invoices: [
        { item: "Standard Client Admission Outpatient Fee", price: 65.00, category: "Professional Service" }
      ]
    };

    this.state.animals.push(newAnimal);
    this.closeModal(this.checkinModal);
    document.getElementById("form-patient-checkin").reset();

    this.showToast(`Patient <b>${name}</b> (${species}) admitted. Client: <b>${ownerName}</b>!`, "success");
    
    this.renderView(this.currentView);
  }

  // Get active patients array with dynamic property resolution applied
  get patients() {
    this.state.animals.forEach(p => this.applyGetters(p));
    return this.state.animals;
  }

  getPatient(id) {
    const patient = this.state.animals.find(p => p.id === id);
    if (patient) this.applyGetters(patient);
    return patient;
  }

  getActivePatient() {
    return this.getPatient(this.activePatientId);
  }

  // Apply dynamic getters for compliance with stringify-clones
  applyGetters(p) {
    const desc = Object.getOwnPropertyDescriptor(p, 'weight');
    if (desc && desc.get) return; // already applied
    
    delete p.weight;
    delete p.owner;
    delete p.age;
    
    Object.defineProperties(p, {
      weight: {
        get: () => {
          const history = this.getWeightHistory(p.id);
          return history.length > 0 ? history[history.length - 1].kg : 0.0;
        },
        configurable: true,
        enumerable: true
      },
      owner: {
        get: () => {
          const owners = this.getOwnershipDetails(p.id);
          return owners.length > 0 ? owners.map(o => o.ownerName).join(", ") : "Unknown";
        },
        configurable: true,
        enumerable: true
      },
      age: {
        get: () => {
          if (!p.dob) return "N/A";
          const birth = new Date(p.dob);
          const today = new Date("2026-06-03");
          let years = today.getFullYear() - birth.getFullYear();
          let months = today.getMonth() - birth.getMonth();
          if (months < 0) { years--; months += 12; }
          return years > 0 ? `${years}y ${months}m` : `${months}m`;
        },
        configurable: true,
        enumerable: true
      }
    });
  }

  // Get the weight history of a specific patient
  getWeightHistory(animalId) {
    return this.state.weightHistory
      .filter(w => w.animalId === animalId)
      .sort((a,b) => new Date(a.date) - new Date(b.date));
  }

  getLatestWeight(animalId) {
    const history = this.getWeightHistory(animalId);
    return history.length > 0 ? history[history.length - 1] : { kg: 0, date: null };
  }

  // Resolve many-to-many ownership details for active billing / communications
  getOwnershipDetails(animalId) {
    const list = this.state.ownerships.filter(o => o.animalId === animalId);
    return list.map(o => {
      const p = this.state.parties.find(party => party.id === o.partyId);
      return {
        ...o,
        ownerName: p ? p.name : "Unknown",
        phone: p ? p.phone : "N/A"
      };
    });
  }

  updatePatient(id, updates) {
    const index = this.state.animals.findIndex(p => p.id === id);
    if (index !== -1) {
      this.state.animals[index] = { ...this.state.animals[index], ...updates };
      this.renderView(this.currentView);
      return true;
    }
    return false;
  }
}

// Instantiate globally when DOM loaded
window.addEventListener("DOMContentLoaded", () => {
  window.vetApp = new VetPMSApplication();
});
