# TimeChex Clean

Interactive Punch screen with core timesheet engine ported from TimeChex-v2.

**What’s live (v0.28)**
- Vertical timeline of timestamp dots
- Current Punch / Selected Punch cards
- Full edit modal (time, type, job, parts, notes, distance)
- Toggle buttons: Start/Stop Job, Start/Stop Break, Start/Stop Drive, Oops Punch
- Drive distance capture
- Undo stack
- Ticket view: day's ranges as clean timesheet + export JSON by punch ID / WO
- **Month view**: calendar grid with hours badges, punch counts, work-day navigation, selected day sheet list
- **Summary view**: date range filter, customer/work filters, totals, sheet list, Export CSV
- Core store (`src/store.js`): punches, sheets, range rebuild, undo stack, localStorage
- Punch IDs (food+animal+MMDD), mock jobs/customers, labor rates
- Bottom nav switches Punch / Ticket / Month / Summary

**How it works**
Punches are the atoms. The store rebuilds daily sheets and time ranges (main / break / drive) from the sequence of Start/Stop punches. Selected punches open a full edit menu. Undo restores the previous state. Ticket, Month, and Summary all consume the sheets.

Open `index.html` or enable GitHub Pages.

https://chexwave.github.io/timechex-clean/

Next: deeper Ticket edit (editable ranges like APK), parts catalog picker, rates on Summary, Android wrap.
