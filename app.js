import { store } from './src/store.js';
import { MOCK_JOBS, MOCK_CUSTOMERS, LABOR_RATES } from './src/mock-data.js';

let selectedId = null;
let currentView = 'punch';
let timerStart = null;
let timerInterval = null;
let editingPunch = null;
let monthYear = new Date().getFullYear();
let monthIndex = new Date().getMonth();
let selectedIso = new Date().toISOString().slice(0, 10);
let summaryFrom = new Date(Date.now() - 7*86400000).toISOString().slice(0, 10);
let summaryTo = new Date().toISOString().slice(0, 10);
let summaryCustomer = 'all';
let summaryWork = 'all';

const timelineEl = document.getElementById('timeline');
const cardEl = document.getElementById('punch-card');
const statusText = document.getElementById('status-text');
const timerEl = document.getElementById('timer');
const dateEl = document.getElementById('date');
const clockEl = document.getElementById('clock');
const jobSub = document.getElementById('job-sub');
const modal = document.getElementById('modal');
const editModal = document.getElementById('edit-modal');
const ticketContent = document.getElementById('ticket-content');
const todayLog = document.getElementById('today-log');
const toastEl = document.getElementById('toast');
const monthContent = document.getElementById('month-content');
const summaryContent = document.getElementById('summary-content');

const btnJob = document.getElementById('btn-job');
const btnBreak = document.getElementById('btn-break');
const btnDrive = document.getElementById('btn-drive');
const btnOops = document.getElementById('btn-oops');
const btnExport = document.getElementById('btn-export');
const btnAddPart = document.getElementById('btn-add-part');
const btnAddNote = document.getElementById('btn-add-note');

const helperJob = document.getElementById('helper-job');
const helperBreak = document.getElementById('helper-break');
const helperDrive = document.getElementById('helper-drive');

function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), 2500);
}

function getJobLabel(wo) {
  const job = MOCK_JOBS.find(j => j.number === wo);
  if (!job) return wo;
  const cust = MOCK_CUSTOMERS.find(c => c.id === job.customerId);
  return `${wo} · ${cust?.name || ''}`;
}

function updateClock() {
  const now = new Date();
  if (clockEl) clockEl.textContent = now.toTimeString().slice(0, 5);
  if (dateEl) dateEl.textContent = now.toISOString().slice(0, 10);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerStart = Date.now();
  timerInterval = setInterval(() => {
    const secs = Math.floor((Date.now() - timerStart) / 1000);
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  if (timerEl) timerEl.textContent = '00:00:00';
}

function updateStatus() {
  const t = store.state.activeType;
  if (t === 'job') {
    statusText.textContent = 'On the job';
    if (jobSub) jobSub.textContent = 'On the job · Rivera';
    startTimer();
  } else if (t === 'break') {
    statusText.textContent = 'On break';
    if (jobSub) jobSub.textContent = 'On break';
    startTimer();
  } else if (t === 'drive') {
    statusText.textContent = 'Driving';
    if (jobSub) jobSub.textContent = 'Driving';
    startTimer();
  } else {
    statusText.textContent = 'Ready';
    if (jobSub) jobSub.textContent = 'No active job';
    stopTimer();
  }
}