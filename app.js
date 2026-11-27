import { store } from './src/store.js';
import { MOCK_JOBS, MOCK_CUSTOMERS } from './src/mock-data.js';

let selectedId = null;
let currentView = 'punch';
let timerStart = null;
let timerInterval = null;
let editingPunch = null;

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

const btnJob = document.getElementById('btn-job');
const btnBreak = document.getElementById('btn-break');
const btnDrive = document.getElementById('btn-drive');
const btnOops = document.getElementById('btn-oops');
const btnExport = document.getElementById('btn-export');

const helperJob = document.getElementById('helper-job');
const helperBreak = document.getElementById('helper-break');
const helperDrive = document.getElementById('helper-drive');

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

  if (btnJob) {
    btnJob.innerHTML = t === 'job' ? 'STOP<br>JOB' : 'START<br>JOB';
    btnJob.classList.toggle('active', t === 'job');
  }
  if (btnBreak) {
    btnBreak.innerHTML = t === 'break' ? 'STOP<br>BREAK' : 'START<br>BREAK';
    btnBreak.classList.toggle('active', t === 'break');
  }
  if (btnDrive) {
    btnDrive.innerHTML = t === 'drive' ? 'STOP<br>DRIVE' : 'START<br>DRIVE';
    btnDrive.classList.toggle('active', t === 'drive');
  }

  if (helperJob) helperJob.textContent = t === 'job' ? 'Stop the current job first.' : (t ? 'End the current activity first.' : 'Nothing is running.');
  if (helperBreak) helperBreak.textContent = t === 'break' ? 'You\'re already on a break.' : (t ? 'End the current activity first.' : 'Start a job first.');
  if (helperDrive) helperDrive.textContent = t === 'drive' ? 'Stop the drive first.' : (t ? 'End the current activity first.' : 'Nothing is running.');
}

function toggle(type, startLabel, stopLabel) {
  if (store.state.activeType === type) {
    let extra = {};
    if (type === 'drive') {
      const miles = prompt('Distance (miles) for this drive?', '0');
      extra.distance = parseFloat(miles) || 0;
    }
    store.addPunch(stopLabel, extra);
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

if (btnJob) btnJob.onclick = () => toggle('job', 'Start Job', 'Stop Job');
if (btnBreak) btnBreak.onclick = () => toggle('break', 'Start Break', 'Stop Break');
if (btnDrive) btnDrive.onclick = () => toggle('drive', 'Start Drive', 'Stop Drive');

if (btnOops) btnOops.onclick = () => {
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
  const distance = parseFloat(document.getElementById('oops-distance').value) || 0;
  store.addPunch(type, { time, wo, notes, parts, distance });
  modal.classList.add('hidden');
  render();
};

function openEdit(punch) {
  editingPunch = punch;
  document.getElementById('edit-time').value = punch.time;
  document.getElementById('edit-type').value = punch.type;
  const jobSelect = document.getElementById('edit-job');
  jobSelect.innerHTML = MOCK_JOBS.map(j => `<option value="${j.number}" ${j.number === punch.wo ? 'selected' : ''}>${getJobLabel(j.number)}</option>`).join('');
  document.getElementById('edit-notes').value = punch.notes || '';
  document.getElementById('edit-parts').value = (punch.parts || []).join(', ');
  document.getElementById('edit-distance').value = punch.distance || 0;
  editModal.classList.remove('hidden');
}

document.getElementById('edit-cancel').onclick = () => editModal.classList.add('hidden');
document.getElementById('edit-save').onclick = () => {
  if (!editingPunch) return;
  editingPunch.time = document.getElementById('edit-time').value;
  editingPunch.type = document.getElementById('edit-type').value;
  editingPunch.wo = document.getElementById('edit-job').value;
  editingPunch.notes = document.getElementById('edit-notes').value;
  editingPunch.parts = document.getElementById('edit-parts').value.split(',').map(p => p.trim()).filter(Boolean);
  editingPunch.distance = parseFloat(document.getElementById('edit-distance').value) || 0;
  store.rebuildSheets();
  store.persist();
  editModal.classList.add('hidden');
  render();
};

function renderTimeline() {
  if (!timelineEl) return;
  const todays = store.getTodayPunches().slice();
  const current = todays[todays.length - 1];
  const legend = `<div class="legend">
    <span class="lg job">Job</span>
    <span class="lg break">Break</span>
    <span class="lg drive">Drive</span>
  </div>`;
  const dots = todays.map(p => {
    let cls = 'job';
    if (p.type.includes('Break')) cls = 'break';
    else if (p.type.includes('Drive')) cls = 'drive';
    const isCurrent = current && p.id === current.id;
    const isSelected = selectedId === p.id;
    return `<div class="dot ${cls} ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}" data-id="${p.id}">
      <span class="time">${p.time}</span>
    </div>`;
  }).join('') || '<p style="font-size:0.65rem;color:#64748b;text-align:center;padding:0.5rem">No punches</p>';

  timelineEl.innerHTML = legend + dots;

  timelineEl.querySelectorAll('.dot').forEach(dot => {
    dot.onclick = () => {
      selectedId = dot.dataset.id;
      render();
    };
  });
}

function renderLog() {
  if (!todayLog) return;
  const todays = store.getTodayPunches().slice().reverse().slice(0, 6);
  todayLog.innerHTML = todays.map(p =>
    `<div class="log-row"><span>${p.time} · ${p.type}</span><span class="log-meta">${p.wo || ''} · ${p.customer || ''}</span></div>`
  ).join('') || '<div class="log-row">No punches yet</div>';
}

function calcDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

function renderTicket() {
  if (!ticketContent) return;
  const today = new Date().toISOString().slice(0, 10);
  const sheet = store.state.sheets.find(s => s.iso === today);
  if (!sheet || !sheet.ranges.length) {
    ticketContent.innerHTML = '<p>No closed ranges yet. Punch a full Start/Stop cycle on the Punch screen.</p>';
    return;
  }
  let totalMain = 0, totalBreak = 0, totalDrive = 0;
  const rows = sheet.ranges.map(r => {
    const hrs = calcDuration(r.start, r.end).toFixed(2);
    if (r.type === 'main') totalMain += parseFloat(hrs);
    else if (r.type === 'break') totalBreak += parseFloat(hrs);
    else if (r.type === 'drive') totalDrive += parseFloat(hrs);
    return `<div class="range-row"><strong>${r.start}–${r.end}</strong> · ${r.type} · ${hrs}h · ${r.wo || ''} ${r.note ? ' · ' + r.note : ''}</div>`;
  }).join('');
  ticketContent.innerHTML = `
    <h3>Ranges for ${today}</h3>
    ${rows}
    <div class="totals">Main: ${totalMain.toFixed(2)}h · Break: ${totalBreak.toFixed(2)}h · Drive: ${totalDrive.toFixed(2)}h</div>
    <p style="font-size:0.8rem;color:#94a3b8;margin-top:0.5rem">Export includes punch IDs for CRM attach later.</p>
  `;
}

if (btnExport) btnExport.onclick = () => {
  const today = new Date().toISOString().slice(0, 10);
  const punches = store.getTodayPunches();
  const sheet = store.state.sheets.find(s => s.iso === today);
  const exportData = {
    date: today,
    punches: punches.map(p => ({ id: p.id, time: p.time, type: p.type, wo: p.wo, notes: p.notes, parts: p.parts, distance: p.distance })),
    ranges: sheet?.ranges || [],
    note: 'Clean timesheet for CRM attach by punch ID or WO'
  };
  const text = JSON.stringify(exportData, null, 2);
  navigator.clipboard.writeText(text).then(() => alert('Timesheet JSON copied to clipboard!')).catch(() => alert(text));
};

function renderCard() {
  if (!cardEl) return;
  const todays = store.getTodayPunches();
  const current = todays.slice(-1)[0];
  const selected = store.state.punches.find(p => p.id === selectedId);

  if (selected && selected.id !== current?.id) {
    cardEl.innerHTML = `
      <h3>Selected Punch</h3>
      <div class="punch-time">${selected.time}<span class="punch-type">${selected.type}</span></div>
      <div class="punch-meta">${getJobLabel(selected.wo)}</div>
      <div class="punch-row">Parts: ${(selected.parts || []).join(', ') || 'none'}</div>
      <div class="punch-row">Notes: ${selected.notes || 'none'}</div>
      ${selected.distance ? `<div class="punch-row">Distance: ${selected.distance} mi</div>` : ''}
      <button id="edit-selected" style="margin-top:0.5rem;padding:0.4rem 0.8rem;border-radius:8px;border:none;background:#334155;color:#fff">Edit</button>
    `;
    document.getElementById('edit-selected').onclick = () => openEdit(selected);
  } else if (current) {
    cardEl.innerHTML = `
      <h3>Current Punch</h3>
      <div class="punch-time">${current.time}<span class="punch-type">${current.type}</span></div>
      <div class="punch-meta">${getJobLabel(current.wo)}</div>
      <div class="punch-row">Parts: ${(current.parts || []).join(', ') || 'none'} <button id="add-part">+ Part</button></div>
      <div class="punch-row">Notes: ${current.notes || 'none'} <button id="add-note">+ Note</button></div>
      ${current.distance ? `<div class="punch-row">Distance: ${current.distance} mi</div>` : ''}
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

function switchView(view) {
  currentView = view;
  document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.remove('hidden');
  document.querySelectorAll('nav span').forEach(s => s.classList.toggle('active', s.dataset.view === view));
  render();
}

document.querySelectorAll('nav span').forEach(span => {
  span.onclick = () => switchView(span.dataset.view);
});

function render() {
  updateClock();
  if (currentView === 'punch') {
    renderTimeline();
    renderCard();
    renderLog();
    updateStatus();
  } else if (currentView === 'ticket') {
    renderTicket();
  }
}

if (store.state.punches.length === 0) {
  store.addPunch('Start Job', { time: '08:15' });
  store.addPunch('Stop Job', { time: '09:30' });
  store.addPunch('Start Break', { time: '09:35' });
  store.addPunch('Stop Break', { time: '09:50' });
  store.addPunch('Start Job', { time: '09:52' });
  store.state.activeType = 'job';
  store.persist();
}

setInterval(updateClock, 10000);
switchView('punch');
render();
