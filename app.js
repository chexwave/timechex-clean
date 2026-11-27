import { generatePunchId, MOCK_JOBS, MOCK_CUSTOMERS } from './src/mock-data.js';

let punches = JSON.parse(localStorage.getItem('timechex-punches') || '[]');
let selectedId = null;
let activeType = null; // 'job' | 'break' | 'drive'

const timelineEl = document.getElementById('timeline');
const cardEl = document.getElementById('punch-card');
const statusEl = document.getElementById('status');
const dateEl = document.getElementById('date');
const modal = document.getElementById('modal');

const btnJob = document.getElementById('btn-job');
const btnBreak = document.getElementById('btn-break');
const btnDrive = document.getElementById('btn-drive');
const btnOops = document.getElementById('btn-oops');

function save() {
  localStorage.setItem('timechex-punches', JSON.stringify(punches));
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getJobLabel(wo) {
  const job = MOCK_JOBS.find(j => j.number === wo);
  if (!job) return wo;
  const cust = MOCK_CUSTOMERS.find(c => c.id === job.customerId);
  return `${wo} · ${cust?.name || ''}`;
}

function updateStatus() {
  if (activeType === 'job') statusEl.textContent = 'On the job · Rivera';
  else if (activeType === 'break') statusEl.textContent = 'On break';
  else if (activeType === 'drive') statusEl.textContent = 'Driving';
  else statusEl.textContent = 'Ready';

  btnJob.textContent = activeType === 'job' ? 'STOP JOB' : 'START JOB';
  btnJob.classList.toggle('active', activeType === 'job');
  btnBreak.textContent = activeType === 'break' ? 'STOP BREAK' : 'START BREAK';
  btnBreak.classList.toggle('active', activeType === 'break');
  btnDrive.textContent = activeType === 'drive' ? 'STOP DRIVE' : 'START DRIVE';
  btnDrive.classList.toggle('active', activeType === 'drive');
}

function addPunch(type, extra = {}) {
  const punch = {
    id: generatePunchId(),
    iso: todayIso(),
    time: nowTime(),
    type,
    wo: 'WO-1001',
    customer: 'Rivera',
    notes: '',
    parts: [],
    distance: type.includes('Drive') ? 0 : undefined,
    ...extra
  };
  punches.push(punch);
  save();
  render();
  return punch;
}

function toggle(type, startLabel, stopLabel) {
  if (activeType === type) {
    addPunch(stopLabel);
    activeType = null;
  } else {
    if (activeType) {
      // stop previous
      const prev = activeType === 'job' ? 'Stop Job' : activeType === 'break' ? 'Stop Break' : 'Stop Drive';
      addPunch(prev);
    }
    addPunch(startLabel);
    activeType = type;
  }
  updateStatus();
  render();
}

btnJob.onclick = () => toggle('job', 'Start Job', 'Stop Job');
btnBreak.onclick = () => toggle('break', 'Start Break', 'Stop Break');
btnDrive.onclick = () => toggle('drive', 'Start Drive', 'Stop Drive');

btnOops.onclick = () => {
  document.getElementById('oops-time').value = nowTime();
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
  addPunch(type, { time, wo, notes, parts });
  modal.classList.add('hidden');
};

function renderTimeline() {
  const todays = punches.filter(p => p.iso === todayIso()).slice().reverse();
  timelineEl.innerHTML = todays.map(p => {
    const cls = p.type.includes('Break') ? 'break' : p.type.includes('Drive') ? 'drive' : 'active';
    return `<div class="dot ${cls} ${selectedId === p.id ? 'selected' : ''}" data-id="${p.id}">
      <span class="time">${p.time}</span>
    </div>`;
  }).join('') || '<p style="font-size:0.7rem;text-align:center;color:#64748b">No punches</p>';

  timelineEl.querySelectorAll('.dot').forEach(dot => {
    dot.onclick = () => {
      selectedId = dot.dataset.id;
      render();
    };
  });
}

function renderCard() {
  const current = punches.filter(p => p.iso === todayIso()).slice(-1)[0];
  const selected = punches.find(p => p.id === selectedId);

  if (selected && selected !== current) {
    cardEl.innerHTML = `
      <h3>Selected Punch</h3>
      <p><strong>${selected.time}</strong> · ${selected.type}</p>
      <p>${getJobLabel(selected.wo)}</p>
      <p>Parts: ${(selected.parts || []).join(', ') || 'none'}</p>
      <p>Notes: ${selected.notes || 'none'}</p>
      <button id="edit-selected">Edit</button>
    `;
    document.getElementById('edit-selected').onclick = () => {
      alert('Edit menu for time, job, parts, notes would open here.');
    };
  } else if (current) {
    cardEl.innerHTML = `
      <h3>Current Punch</h3>
      <p><strong>${current.time}</strong> · ${current.type}</p>
      <p>${getJobLabel(current.wo)}</p>
      <p>Parts: ${(current.parts || []).join(', ') || 'none'} <button id="add-part">+ Part</button></p>
      <p>Notes: ${current.notes || 'none'} <button id="add-note">+ Note</button></p>
    `;
    document.getElementById('add-part').onclick = () => {
      const part = prompt('Part number or name?');
      if (part) {
        current.parts = current.parts || [];
        current.parts.push(part);
        save();
        render();
      }
    };
    document.getElementById('add-note').onclick = () => {
      const note = prompt('Note?');
      if (note) {
        current.notes = (current.notes ? current.notes + '\n' : '') + note;
        save();
        render();
      }
    };
  } else {
    cardEl.innerHTML = '<h3>No active punch</h3><p>Hit a button to start.</p>';
  }
}

function render() {
  dateEl.textContent = todayIso();
  renderTimeline();
  renderCard();
  updateStatus();
}

// seed a couple if empty
if (punches.length === 0) {
  addPunch('Start Job', { time: '09:15' });
  addPunch('Start Break', { time: '12:00' });
  activeType = 'break';
}

render();
