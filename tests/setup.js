import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDOMHtml = `
  <div id="asap-exporter-panel"></div>
  <input id="asap-output">
  <div id="billing-action-buttons"></div>
  <div id="billing-claims-list"></div>
  <div id="billing-invoice-box"></div>
  <div id="billing-patient-meta"></div>
  <div id="billing-terminal-display"></div>
  <button id="btn-administer-drug"></button>
  <button id="btn-auto-capture"></button>
  <button id="btn-calc-dose"></button>
  <button id="btn-close-checkin-modal"></button>
  <button id="btn-close-cpr-modal"></button>
  <button id="btn-close-rabies-modal"></button>
  <button id="btn-close-substance-modal"></button>
  <button id="btn-generate-asap"></button>
  <button id="btn-invert-grayscale"></button>
  <button id="btn-labs-write-ehr"></button>
  <button id="btn-order-labs"></button>
  <button id="btn-order-xray"></button>
  <button id="btn-print-rabies-cert"></button>
  <button id="btn-quick-checkin"></button>
  <button id="btn-record-vault-draw"></button>
  <button id="btn-save-pathology"></button>
  <button id="btn-save-soap"></button>
  <button id="btn-simulate-card-tap"></button>
  <button id="btn-submit-insurance-claim"></button>
  <button id="btn-toggle-caliper"></button>
  <button id="btn-toggle-metronome"></button>
  <button id="btn-trigger-analyzer-run"></button>
  <button id="btn-trigger-payment-terminal"></button>
  <button id="btn-trigger-xray-acquisition"></button>
  <input id="checkin-owner">
  <input id="checkin-pet-breed">
  <input id="checkin-pet-name">
  <input id="checkin-pet-species">
  <input id="checkin-triage">
  <input id="checkin-warnings">
  <input id="checkin-weight">
  <div id="cpr-metronome-light"></div>
  <div id="cpr-modal-content"></div>
  <div id="current-view-title"></div>
  <select id="dental-action"></select>
  <div id="dental-details-panel"></div>
  <select id="dental-pathology"></select>
  <div id="dental-tooth-label"></div>
  <div id="dose-calculator-result"></div>
  <select id="dose-drug-select"></select>
  <input id="dose-rate-input">
  <input id="draw-amount">
  <select id="draw-drug-select"></select>
  <select id="draw-patient-select"></select>
  <input id="draw-reason">
  <select id="draw-vet-select"></select>
  <input id="draw-wasted">
  <input id="draw-witness-pin">
  <div id="ehr-active-record"></div>
  <div id="ehr-patient-list"></div>
  <form id="form-patient-checkin"></form>
  <form id="form-substance-draw"></form>
  <div id="labs-order-list"></div>
  <div id="labs-report-panel"></div>
  <div id="labs-results-view"></div>
  <div id="labs-sim-status"></div>
  <div id="labs-waiting-screen"></div>
  <div id="missed-charge-panel"></div>
  <dialog id="modal-checkin"></dialog>
  <dialog id="modal-cpr-dosing"></dialog>
  <dialog id="modal-rabies-certificate"></dialog>
  <dialog id="modal-substance-draw"></dialog>
  <div id="mwl-sim-status"></div>
  <div id="mwl-sim-sub"></div>
  <div id="nav-billing"></div>
  <div id="nav-ehr"></div>
  <div id="nav-imaging"></div>
  <div id="nav-labs"></div>
  <div id="nav-substances"></div>
  <div id="nav-whiteboard"></div>
  <div id="overlay-clinic-left"></div>
  <div id="overlay-patient-left"></div>
  <div id="overlay-study-right"></div>
  <div id="pacs-mwl-list"></div>
  <div id="pacs-viewport"></div>
  <div id="pacs-waiting-screen"></div>
  <input id="patient-search">
  <div id="rabies-modal-content"></div>
  <input id="slider-pacs-brightness" type="range">
  <input id="slider-pacs-contrast" type="range">
  <input id="soap-a">
  <input id="soap-o">
  <input id="soap-p">
  <input id="soap-s">
  <table><tbody id="substance-vault-ledger-rows" class="audit-table-container"></tbody></table>
  <div id="terminal-light"></div>
  <div id="terminal-status-text"></div>
  <div id="terminal-sub-text"></div>
  <div id="toast-stack"></div>
  <div id="vault-inventory-cards"></div>
  <div id="view-billing"></div>
  <div id="view-ehr"></div>
  <div id="view-imaging"></div>
  <div id="view-labs"></div>
  <div id="view-substances"></div>
  <div id="view-whiteboard"></div>
  <input id="vitals-bcs">
  <input id="vitals-hr">
  <input id="vitals-rr">
  <input id="vitals-temp">
  <div id="whiteboard-grid"></div>
`;

// Setup the mock DOM
document.body.innerHTML = mockDOMHtml;

// Load modules in order using vm
const scriptsToLoad = [
  'app.js',
  'modules/whiteboard.js',
  'modules/medicalRecords.js',
  'modules/imaging.js',
  'modules/laboratories.js',
  'modules/substances.js',
  'modules/billing.js',
];

scriptsToLoad.forEach((src) => {
  const filePath = path.resolve(__dirname, '../', src);
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInThisContext(code, { filename: src });
});

// Trigger DOMContentLoaded manually to instantiate window.vetApp
window.dispatchEvent(new window.Event('DOMContentLoaded'));
