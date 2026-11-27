import { store } from './src/store.js';
import { MOCK_JOBS, MOCK_CUSTOMERS } from './src/mock-data.js';

let selectedId = null;
let timerStart = null;
let timerInterval = null;

const timelineEl = document.getElementById('timeline');
const cardEl = document.getElementById('punch-card');
const statusEl = document.getElementById('status');
const statusText = document.getElementById('status-text');
const timerEl = document.getElementById('timer');
const dateEl = document.getElementById('date');
const clockEl = document.getElementById('clock');
const jobSub = document.getElementById('job-sub');
const modal = document.getElementById('modal');

const btnJob = document.getElementById('btn-job');
const btnBreak = document.getElementById('btn-break');
const btnDrive = document.getElementById('btn-drive');
const btnOops = document.getElementById('btn-oops');

function getJobLabel(wo) {
  const job = MOCK_JOBS.find(j => j.number === wo);
  if (!job) return wo;
  const cust = MOCK_CUSTOMERS.find(c => c.id === job.customerId);
  return `${wo} · ${cust?.name || ''}`;
}

function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toTimeString().slice(0, 5);
  dateEl.textContent = now.toISOString().slice(0, 10);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerStart = Date.now();
  timerInterval = setInterval(() => {
    const secs = Math.floor((Date.now() - timerStart) / 1000);
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    timerEl.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerEl.textContent = '00:00:00';
}

function updateStatus() {
  const t = store.state.activeType;
  if (t === 'job') {
    statusEl.textContent = 'On the job';
    statusText.textContent = 'On the job · Rivera';
    jobSub.textContent = 'On the job · Rivera · since now';
    startTimer();
  } else if (t === 'break') {
    statusEl.textContent = 'On break';
    statusText.textContent = 'On break';
    jobSub.textContent = 'On break';
    startTimer();
  } else if (t === 'drive') {
    statusEl.textContent = 'Driving';
    statusText.textContent = 'Driving';
    jobSub.textContent = 'Driving';
    startTimer();
  } else {
    statusEl.textContent = 'Ready';
    statusText.textContent = 'Ready';
    jobSub.textContent = 'No active job';
    stopTimer();
  }

  btnJob.innerHTML = t === 'job' ? 'STOP<br>JOB' : 'START<br>JOB';
  btnJob.classList.toggle('active', t === 'job');
  btnBreak.innerHTML = t === 'break' ? 'STOP<br>BREAK' : 'START<br>BREAK';
  btnBreak.classList.toggle('active', t === 'break');
  btnDrive.innerHTML = t === 'drive' ? 'STOP<br>DRIVE' : 'START<br>DRIVE';
  btnDrive.classList.toggle('active', t === 'drive');
}

function toggle(type, startLabel, stopLabel) {
  if (store.state.activeType === type) {
    store.addPunch(stopLabel);
    store.state.activeType = null;
  } else {
    if (store.state.activeType) {
      const prev = store.state.activeType === 'job' ? 'Stop Job' : store.state.activeType === 'break' ? 'Stop Break' : 'Stop Drive';
      store.addPunch(prev);
    }
    store.addPunch(startLabel);
    store.state.activeType = type;
  }
  store.persist();
  render();
}

btnJob.onclick = () => toggle('job', 'Start Job', 'Stop Job');
btnBreak.onclick = () => toggle('break', 'Start Break', 'Stop Break');
btnDrive.onclick = () => toggle('drive', 'Start Drive', 'Stop Drive');

btnOops.onclick = () => {
  document.getElementById('oops-time').value = new Date().toTimeString().slice(0, 5);
  const jobSelect = document.getElementById('oops-job');
  jobSelect.innerHTML = MOCK_JOBS.map(j => `<option value="${j.number}">${getJobLabel(j.number)}</option>`).join('');
  modal.classList.remove('hidden');
};

document.getElementById('oops-cancel').onclick = () => modal.classList.add('hidden');
document.getElementById('oops-save').onclick = () => {
  const time = document.getElementById('oops-time').value;
  const type = document.getElementById('oops-type').value;
  const wo = document.getElementById('oops-job').value;
  const notes = document.getElementById('oops-notes').value;
  const parts = document.getElementById('oops-parts').value.split(',').map(p => p.trim()).filter(Boolean);
  store.addPunch(type, { time, wo, notes, parts });
  modal.classList.add('hidden');
  render();
};

function renderTimeline() {
  const todays = store.getTodayPunches().slice().reverse();
  timelineEl.innerHTML = todays.map(p => {
    let cls = 'job';
    if (p.type.includes('Break')) cls = 'break';
    else if (p.type.includes('Drive')) cls = 'drive';
    return `<div class="dot ${cls} ${selectedId === p.id ? 'selected' : ''}" data-id="${p.id}">
      <span class="time">${p.time}</span>
    </div>`;
  }).join('') || '<p style="font-size:0.7rem;color:#64748b;text-align:center">No punches</p>';

  timelineEl.querySelectorAll('.dot').forEach(dot => {
    dot.onclick = () => {
      selectedId = dot.dataset.id;
      render();
    };
  });
}

function renderRanges(iso) {
  const sheet = store.state.sheets.find(s => s.iso === iso);
  if (!sheet || !sheet.ranges.length) return '<div class="ranges">No closed ranges yet</div>';
  return `<div class="ranges">${sheet.ranges.map(r =>
    `<div>${r.start}–${r.end} · ${r.type}</div>`
  ).join('')}</div>`;
}

function renderCard() {
  const todays = store.getTodayPunches();
  const current = todays.slice(-1)[0];
  const selected = store.state.punches.find(p => p.id === selectedId);
  const today = new Date().toISOString().slice(0, 10);

  if (selected && selected.id !== current?.id) {
    cardEl.innerHTML = `
      <h3>Selected Punch</h3>
      <p><strong>${selected.time}</strong> · ${selected.type}</p>
      <p>${getJobLabel(selected.wo)}</p>
      <p>Parts: ${(selected.parts || []).join(', ') || 'none'}</p>
      <p>Notes: ${selected.notes || 'none'}</p>
      <button id="edit-selected" style="margin-top:0.5rem;padding:0.4rem 0.8rem;border-radius:8px;border:none;background:#334155;color:#fff">Edit</button>
    `;
    document.getElementById('edit-selected').onclick = () => {
      const newTime = prompt('New time (HH:MM)', selected.time);
      if (newTime) {
        selected.time = newTime;
        store.rebuildSheets();
        store.persist();
        render();
      }
    };
  } else if (current) {
    cardEl.innerHTML = `
      <h3>Current Punch</h3>
      <p><strong>${current.time}</strong> · ${current.type}</p>
      <p>${getJobLabel(current.wo)}</p>
      <p>Parts: ${(current.parts || []).join(', ') || 'none'} <button id="add-part" style="margin-left:0.3rem;padding:0.2rem 0.5rem;border-radius:6px;border:none;background:#334155;color:#fff;font-size:0.75rem">+ Part</button></p>
      <p>Notes: ${current.notes || 'none'} <button id="add-note" style="margin-left:0.3rem;padding:0.2rem 0.5rem;border-radius:6px;border:none;background:#334155;color:#fff;font-size:0.75rem">+ Note</button></p>
      ${renderRanges(today)}
    `;
    document.getElementById('add-part').onclick = () => {
      const part = prompt('Part?');
      if (part) {
        current.parts = current.parts || [];
        current.parts.push(part);
        store.persist();
        render();
      }
    };
    document.getElementById('add-note').onclick = () => {
      const note = prompt('Note?');
      if (note) {
        current.notes = (current.notes ? current.notes + '\n' : '') + note;
        store.persist();
        render();
      }
    };
  } else {
    cardEl.innerHTML = '<h3>No active punch</h3><p>Hit a ring to start.</p>';
  }
}

function render() {
  updateClock();
  renderTimeline();
  renderCard();
  updateStatus();
}

if (store.state.punches.length === 0) {
  store.addPunch('Start Job', { time: '09:15' });
  store.addPunch('Stop Job', { time: '11:30' });
  store.addPunch('Start Break', { time: '12:00' });
  store.state.activeType = 'break';
  store.persist();
}

setInterval(updateClock, 10000);
render();
