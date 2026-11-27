import { generatePunchId, MOCK_JOBS, MOCK_CUSTOMERS, LABOR_RATES } from './mock-data.js';

const KEY = 'timechex-clean-v3';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    punches: [],
    sheets: [],
    undo: [],
    activeType: null,
    profile: { name: 'Michael' }
  };
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export const store = {
  state: load(),

  persist() {
    save(this.state);
  },

  pushUndo() {
    this.state.undo = [...(this.state.undo || []), JSON.parse(JSON.stringify({
      punches: this.state.punches,
      sheets: this.state.sheets,
      activeType: this.state.activeType
    }))].slice(-10);
  },

  undo() {
    const prev = this.state.undo?.pop();
    if (!prev) return false;
    this.state.punches = prev.punches;
    this.state.sheets = prev.sheets;
    this.state.activeType = prev.activeType;
    this.persist();
    return true;
  },

  addPunch(type, extra = {}) {
    this.pushUndo();
    const now = new Date();
    const punch = {
      id: generatePunchId(now),
      iso: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      type,
      wo: extra.wo || 'WO-1001',
      customer: extra.customer || 'Rivera',
      notes: extra.notes || '',
      parts: extra.parts || [],
      distance: type.toLowerCase().includes('drive') ? (extra.distance || 0) : undefined,
      attached: false,
      sheetId: null,
      ...extra
    };
    this.state.punches.push(punch);
    this.rebuildSheets();
    this.persist();
    return punch;
  },

  rebuildSheets() {
    const byDay = {};
    for (const p of this.state.punches) {
      if (!byDay[p.iso]) byDay[p.iso] = [];
      byDay[p.iso].push(p);
    }
    this.state.sheets = Object.entries(byDay).map(([iso, list]) => {
      list.sort((a, b) => a.time.localeCompare(b.time));
      const ranges = [];
      let open = null;
      for (const p of list) {
        if (p.type.startsWith('Start')) {
          open = { start: p.time, type: p.type.includes('Break') ? 'break' : p.type.includes('Drive') ? 'drive' : 'main', punchId: p.id, wo: p.wo };
        } else if (p.type.startsWith('Stop') && open) {
          ranges.push({ ...open, end: p.time, note: p.notes || '' });
          open = null;
        }
      }
      return { id: 'sheet-' + iso, iso, ranges, wo: list[0]?.wo || '' };
    });
  },

  getTodayPunches() {
    const today = new Date().toISOString().slice(0, 10);
    return this.state.punches.filter(p => p.iso === today);
  },

  getRates() {
    return LABOR_RATES;
  }
};
