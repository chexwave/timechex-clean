# TimeChex Clean

Refined punch-to-timesheet app for American Outboard Motors.

**Status:** Public repo started. Client-first. Mock data only.

## Locked contracts
- Punch ID: food + animal + MMDD (e.g. `nachoparrot1126`) — attachment key to CRM jobs
- Labor rates: Tech $125/hr, Bench $100/hr, Sea Trial $150/hr, Travel $2.50/one-way mile
- Arcade punch buttons stay exactly as-is (Start Job / Stop Job / Start Break / End Break)

## Mock data
See `src/mock-data.js` — customers (Rivera/Scout, Hale/Sea Ray, etc.), jobs, parts, rates, sample punches.

## Current demo
`index.html` is a static punch demo that generates punch IDs and stores them in localStorage. Open it locally or via GitHub Pages once enabled.

## Next
1. Refine punch-to-timesheet flow (attach, ranges, clean export)
2. Enable GitHub Pages
3. Capacitor Android wrap
4. Wire to https://chexwave.github.io/aom-crm-clean/ by punch ID / job number

Based on the private `timechex-v2` lineage. Nothing is done until the punch flow feels finished.
