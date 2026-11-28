# TimeChex Clean

Interactive Punch screen with core timesheet engine ported from TimeChex-v2.

**What’s live (v0.30)**
- Vertical timeline of timestamp dots
- Current Punch / Selected Punch cards
- Full edit modal (time, type, job, parts, notes, distance)
- Toggle buttons: Start/Stop Job, Start/Stop Break, Start/Stop Drive, Oops Punch
- Drive distance capture
- Undo stack
- **Ticket view**: editable ranges (start/end time inputs, delete, notes), day pills, big hours total, CSV + JSON export
- **Month view**: calendar grid with hours badges, punch counts, work-day navigation, selected day sheet list
- **Summary view**: date range filter, customer/work filters, totals, sheet list, Export CSV
- Core store (`src/store.js`): punches, sheets, range rebuild, undo stack, localStorage
- Punch IDs (food+animal+MMDD), mock jobs/customers, labor rates
- Bottom nav switches Punch / Ticket / Month / Summary

**How it works**
Punches are the atoms. The store rebuilds daily sheets and time ranges (main / break / drive) from the sequence of Start/Stop punches. Selected punches open a full edit menu. Undo restores the previous state. Ticket, Month, and Summary all consume the sheets. Editing a range time updates the underlying punch.

Open `index.html` or enable GitHub Pages.

https://chexwave.github.io/timechex-clean/

Next: rates on Summary, work-day navigation polish, parts catalog picker, Android wrap.
