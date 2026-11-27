# TimeChex Clean

Interactive Punch screen for American Outboard Motors.

**Live concept:** Vertical timeline of timestamp dots + Current/Selected Punch cards + always-visible toggle action buttons.

## Features built
- Vertical left timeline (dots = timestamps)
- **Current Punch** card (active): timestamp, job, parts (+add), notes (+add)
- **Selected Punch** card (other dots): summary + Edit
- Four always-on buttons that toggle:
  - Start Job ↔ Stop Job
  - Start Break ↔ Stop Break
  - Start Drive ↔ Stop Drive (logged as Service with time + distance)
  - Oops Punch (popup for Time, Type, Job, Notes, Parts)
- Mock data, punch IDs (food+animal+MMDD), localStorage

## Run
Open `index.html` locally or enable GitHub Pages (Settings → Pages → main branch / root).

https://github.com/chexwave/timechex-clean

Next: full edit menu for Selected Punch, distance capture on Drive, timesheet export.
