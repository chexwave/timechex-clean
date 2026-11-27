# TimeChex Clean

Interactive Punch screen with core timesheet engine ported from TimeChex-v2.

**What’s live**
- Vertical timeline of timestamp dots
- Current Punch / Selected Punch cards
- Toggle buttons: Start/Stop Job, Start/Stop Break, Start/Stop Drive, Oops Punch
- Core store (`src/store.js`): punches, sheets, range rebuild, undo stack, localStorage
- Punch IDs (food+animal+MMDD), mock jobs/customers, labor rates

**How it works**
Punches are the atoms. The store rebuilds daily sheets and time ranges (main / break / drive) from the sequence of Start/Stop punches. Selected punches can be edited. Undo restores the previous state.

Open `index.html` or enable GitHub Pages.

https://github.com/chexwave/timechex-clean

Next: full edit menu, distance on Drive, timesheet export by punch ID for CRM.
