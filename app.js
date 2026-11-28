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

function calcDuration(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

function sheetMinutes(ranges) {
  let mins = 0;
  for (const r of ranges || []) {
    const d = (calcDuration(r.start, r.end) * 60);
    mins += r.type === 'break' ? -d : d;
  }
  return Math.max(0, mins);
}

function formatHours(mins) {
  return (mins / 60).toFixed(2);
}

function renderTicket() {
  if (!ticketContent) return;
  const days = [...new Set(store.state.sheets.map(s => s.iso))].sort().reverse();
  if (!days.length) {
    ticketContent.innerHTML = '<p>No closed ranges yet. Punch a full Start/Stop cycle on the Punch screen.</p>';
    return;
  }
  const iso = selectedIso && days.includes(selectedIso) ? selectedIso : days[0];
  const sheet = store.state.sheets.find(s => s.iso === iso) || { ranges: [], wo: '' };
  const totalMins = sheetMinutes(sheet.ranges || []);
  const totalHrs = formatHours(totalMins);

  const dayNav = days.map(d => `<button class="day-pill ${d === iso ? 'on' : ''}" data-iso="${d}">${d.slice(5)}</button>`).join('');

  const rangeCards = (sheet.ranges || []).map((r, i) => {
    const hrs = calcDuration(r.start, r.end).toFixed(2);
    const label = r.type === 'main' ? 'MAIN' : r.type === 'break' ? 'BREAK' : 'DRIVE';
    return `<div class="range-card" data-idx="${i}">
      <div class="range-head"><strong>${label}</strong> <span class="hrs">${hrs}h</span>
        <button class="trash" data-idx="${i}" title="Delete range">×</button>
      </div>
      <div class="range-times">
        <label>Start <input type="time" class="start-time" value="${r.start}" data-idx="${i}"></label>
        <label>End <input type="time" class="end-time" value="${r.end}" data-idx="${i}"></label>
      </div>
      ${r.note ? `<div class="note-preview">${r.note}</div>` : ''}
    </div>`;
  }).join('') || '<p class="muted">No ranges this day.</p>';

  ticketContent.innerHTML = `
    <div class="ticket-header">
      <div class="day-nav">${dayNav}</div>
      <h3>${iso}</h3>
      <div class="big-hours">${totalHrs} <span>h</span></div>
      <div class="wo-line">${sheet.wo || 'No WO'}</div>
    </div>
    <div class="ranges">${rangeCards}</div>
    <label class="sheet-note">Note
      <textarea id="sheet-note" rows="2" placeholder="Job notes...">${sheet.ranges?.[0]?.note || ''}</textarea>
    </label>
    <div class="ticket-actions">
      <button id="btn-export-csv" class="primary">Export CSV</button>
      <button id="btn-export-json">Export JSON</button>
    </div>
  `;

  // wire day pills
  ticketContent.querySelectorAll('.day-pill').forEach(btn => {
    btn.onclick = () => { selectedIso = btn.dataset.iso; renderTicket(); };
  });

  // wire time edits
  ticketContent.querySelectorAll('.start-time, .end-time').forEach(inp => {
    inp.onchange = () => {
      const idx = parseInt(inp.dataset.idx);
      const range = sheet.ranges[idx];
      if (!range) return;
      const which = inp.classList.contains('start-time') ? 'start' : 'end';
      const punchId = which === 'start' ? range.punchId : range.endPunchId;
      if (punchId) {
        const punch = store.state.punches.find(p => p.id === punchId);
        if (punch) {
          store.pushUndo();
          punch.time = inp.value;
          store.rebuildSheets();
          store.persist();
          showToast('Range updated');
          renderTicket();
        }
      }
    };
  });

  // wire delete
  ticketContent.querySelectorAll('.trash').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.idx);
      const range = sheet.ranges[idx];
      if (!range) return;
      if (confirm('Delete this range?')) {
        store.pushUndo();
        // remove stop punch primarily
        store.state.punches = store.state.punches.filter(p => p.id !== range.endPunchId);
        store.rebuildSheets();
        store.persist();
        showToast('Range deleted');
        renderTicket();
      }
    };
  });

  // note save
  const noteEl = document.getElementById('sheet-note');
  if (noteEl) {
    noteEl.onchange = () => {
      // attach note to last range's stop punch or first
      const last = sheet.ranges[sheet.ranges.length - 1];
      if (last?.endPunchId) {
        const p = store.state.punches.find(x => x.id === last.endPunchId);
        if (p) {
          p.notes = noteEl.value;
          store.persist();
          showToast('Note saved');
        }
      }
    };
  }

  // exports
  const csvBtn = document.getElementById('btn-export-csv');
  const jsonBtn = document.getElementById('btn-export-json');
  if (csvBtn) csvBtn.onclick = () => exportTicketCSV(iso, sheet);
  if (jsonBtn) jsonBtn.onclick = () => exportTicketJSON(iso, sheet);
}

function exportTicketCSV(iso, sheet) {
  const rows = [['Date','Type','Start','End','Hours','WO','Note']];
  (sheet.ranges || []).forEach(r => {
    const hrs = calcDuration(r.start, r.end).toFixed(2);
    rows.push([iso, r.type, r.start, r.end, hrs, r.wo || '', r.note || '']);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `timechex-${iso}.csv`;
  a.click();
  showToast('CSV downloaded');
}

function exportTicketJSON(iso, sheet) {
  const punches = store.state.punches.filter(p => p.iso === iso);
  const data = { date: iso, ranges: sheet.ranges || [], punches: punches.map(p => ({ id: p.id, time: p.time, type: p.type, wo: p.wo, notes: p.notes })) };
  const text = JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(text).then(() => showToast('JSON copied')).catch(() => alert(text));
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

function getCurrentPunch() {
  const todays = store.getTodayPunches();
  return todays.slice(-1)[0];
}

if (btnAddPart) btnAddPart.onclick = () => {
  const current = getCurrentPunch();
  if (!current) return alert('No active punch');
  const part = prompt('Part?');
  if (part) {
    current.parts = current.parts || [];
    current.parts.push(part);
    store.persist();
    showToast(`${part} added`);
    render();
  }
};

if (btnAddNote) btnAddNote.onclick = () => {
  const current = getCurrentPunch();
  if (!current) return alert('No active punch');
  const note = prompt('Note?');
  if (note) {
    current.notes = note;
    store.persist();
    showToast('Note added');
    render();
  }
};

function render() {
  updateStatus();
  updateClock();
  renderTimeline();
  renderPunchCard();
  renderTodayLog();
  if (currentView === 'ticket') renderTicket();
  else if (currentView === 'month') renderMonth();
  else if (currentView === 'summary') renderSummary();
}

function renderTimeline() {
  if (!timelineEl) return;
  const todays = store.getTodayPunches();
  timelineEl.innerHTML = todays.map(p => `
    <div class="dot ${p.type.includes('Break') ? 'break' : p.type.includes('Drive') ? 'drive' : 'job'}" data-id="${p.id}">
      <div class="stamp">${p.time}</div>
    </div>
  `).join('');
  timelineEl.querySelectorAll('.dot').forEach(dot => {
    dot.onclick = () => {
      selectedId = dot.dataset.id;
      renderPunchCard();
    };
  });
}

function renderPunchCard() {
  if (!cardEl) return;
  const current = getCurrentPunch();
  if (current && store.state.activeType) {
    cardEl.innerHTML = `
      <h3>Current Punch</h3>
      <div class="punch-row">${current.time} · ${current.type}</div>
      <div class="punch-row">${getJobLabel(current.wo)}</div>
      ${current.notes ? `<div class="punch-row">Note: ${current.notes}</div>` : ''}
      ${current.parts?.length ? `<div class="punch-row">Parts: ${current.parts.join(', ')}</div>` : ''}
      ${current.distance ? `<div class="punch-row">Distance: ${current.distance} mi</div>` : ''}
    `;
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

function renderMonth() {
  if (!monthContent) return;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const firstDow = new Date(monthYear, monthIndex, 1).getDay();
  const count = new Date(monthYear, monthIndex + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  let cells = '';
  for (let d = 1; d <= count; d++) {
    const iso = `${monthYear}-${String(monthIndex + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const daySheets = store.state.sheets.filter(s => s.iso === iso);
    const mins = daySheets.reduce((sum, s) => sum + sheetMinutes(s.ranges), 0);
    const punchCount = daySheets.length;
    const on = iso === selectedIso;
    cells += `<button class="cal-day ${on ? 'on' : ''} ${punchCount > 0 && !on ? 'has' : ''}" data-iso="${iso}">
      ${punchCount > 0 ? `<span class="badge">${punchCount}</span>` : ''}
      <span class="daynum">${d}</span>
      ${mins > 0 ? `<span class="hrs">${formatHours(mins)}</span>` : ''}
    </button>`;
  }

  const selectedSheets = store.state.sheets.filter(s => s.iso === selectedIso);
  const dayList = selectedSheets.map(s => {
    const hrs = formatHours(sheetMinutes(s.ranges));
    return `<div class="sheet-row"><strong>${s.wo || 'WO'}</strong> · ${hrs}h</div>`;
  }).join('') || '<p class="muted">No sheets this day.</p>';

  monthContent.innerHTML = `
    <div class="month-header">
      <button id="prev-month">‹</button>
      <h2>${months[monthIndex]} ${monthYear}</h2>
      <button id="next-month">›</button>
    </div>
    <div class="workday-nav">
      <button id="prev-work">Prev work day</button>
      <button id="today-btn">Today</button>
      <button id="next-work">Next work day</button>
    </div>
    <div class="cal-grid">${cells}</div>
    <div class="day-detail">
      <h3>${selectedIso}</h3>
      ${dayList}
    </div>
  `;

  document.getElementById('prev-month').onclick = () => { monthIndex--; if (monthIndex < 0) { monthIndex = 11; monthYear--; } renderMonth(); };
  document.getElementById('next-month').onclick = () => { monthIndex++; if (monthIndex > 11) { monthIndex = 0; monthYear++; } renderMonth(); };
  document.getElementById('prev-work').onclick = () => { /* simple prev */ };
  document.getElementById('today-btn').onclick = () => { selectedIso = today; renderMonth(); };
  document.getElementById('next-work').onclick = () => { /* simple next */ };
  monthContent.querySelectorAll('.cal-day').forEach(btn => {
    btn.onclick = () => { selectedIso = btn.dataset.iso; renderMonth(); };
  });
}

function renderSummary() {
  if (!summaryContent) return;
  const sheets = store.state.sheets.filter(s => s.iso >= summaryFrom && s.iso <= summaryTo);
  const totalMins = sheets.reduce((sum, s) => sum + sheetMinutes(s.ranges), 0);
  summaryContent.innerHTML = `
    <div class="summary-header">
      <div class="big">${formatHours(totalMins)}h</div>
      <div class="sub">${sheets.length} sheets · ${summaryFrom} → ${summaryTo}</div>
    </div>
    <div class="sheet-list">${sheets.map(s => `<div class="sheet-row"><strong>${s.iso} · ${s.wo}</strong> <span>${formatHours(sheetMinutes(s.ranges))}h</span></div>`).join('')}</div>
  `;
}

function renderTodayLog() {
  if (!todayLog) return;
  const todays = store.getTodayPunches();
  todayLog.innerHTML = todays.map(p => `<div>${p.time} ${p.type} ${p.wo}</div>`).join('');
}

// Button wiring
function wireButtons() {
  if (btnJob) btnJob.onclick = () => {
    if (store.state.activeType === 'job') {
      store.addPunch('Stop Job');
      store.state.activeType = null;
    } else {
      store.addPunch('Start Job');
      store.state.activeType = 'job';
    }
    store.persist();
    render();
  };
  if (btnBreak) btnBreak.onclick = () => {
    if (store.state.activeType === 'break') {
      store.addPunch('Stop Break');
      store.state.activeType = 'job';
    } else {
      store.addPunch('Start Break');
      store.state.activeType = 'break';
    }
    store.persist();
    render();
  };
  if (btnDrive) btnDrive.onclick = () => {
    if (store.state.activeType === 'drive') {
      store.addPunch('Stop Drive');
      store.state.activeType = null;
    } else {
      store.addPunch('Start Drive');
      store.state.activeType = 'drive';
    }
    store.persist();
    render();
  };
  if (btnOops) btnOops.onclick = () => {
    modal.classList.remove('hidden');
  };
}

wireButtons();

// Seed some sample data if empty
if (!store.state.punches.length) {
  store.addPunch('Start Job', { time: '09:15' });
  store.addPunch('Start Break', { time: '12:00' });
  store.addPunch('Stop Break', { time: '12:30' });
  store.addPunch('Stop Job', { time: '17:00' });
  store.state.activeType = null;
  store.persist();
}

setInterval(updateClock, 10000);
switchView('punch');
render();
