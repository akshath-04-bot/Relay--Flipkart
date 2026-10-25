# Relay prototype (Obsidian Kinetic)

Relay is a coordination layer for broken supply chains on the day after the Snap (2018). It helps a surviving mid-chain operator see who in their chain is still operating, re-link around the gaps, and move food and medicine first.

This folder is the interactive prototype for the Flipkart APM case, in the *Obsidian Kinetic* visual system: dark surfaces with glowing status telemetry. It is a simulation, not a live service.

## How to run

1. Extract the ZIP.
2. Open `index.html` in Chrome, Edge or Firefox (double-click works).

You don't need a build step, server or installation.
- **Fonts:** Plus Jakarta Sans, Inter and JetBrains Mono load from Google Fonts when you are online.
- **Offline:** everything works without a connection. Only the fonts fall back to system fonts.

## Guided demo (tour.html)

Open `tour.html` for a guided walkthrough of the whole demo. It runs the same app, and you choose from three modes:
- **Guided:** the next thing to click is spotlighted and a coach card says what to do and what to notice. You click the real button; the tour moves on once the app has actually changed. Codes such as 482913 and 4821 have a **Fill it for me** button. If you wander off, **Take me there** brings you back.
- **Auto-play:** a pointer clicks for you. Key screens stay up for 7 seconds, with a countdown bar. Use Pause, Back, Skip and the speed control (0.5× to 2×). The full run takes about 4 minutes at 1×.
- **Free play:** the overlay switches off and you can explore. Switch back to Guided or Auto-play at any time and the tour continues from its step.

The tour keeps its own saved progress, separate from `index.html`. **Restart** starts it again from Day 1, 14:20.

A recording of the Auto-play run, `Relay-demo-autoplay.webm` (1280 × 900, about 4 minutes), sits next to the ZIP. It plays in Chrome, Edge, Firefox and VLC.

## Using it

- **Top bar:** jumps to the main moments in the live state: 1. Today, 2. Constellation, 3. Task T214, 4. Handoff, 5. Custody/Ledger, and the SMS simulator. **Console** opens the authority console. **Reset demo** restores Day 1, 14:20.
- **Inside the phone:**
  - **Bottom nav:** Today, Chain, Tasks (the raised centre button), Handoff and Ledger.
  - **Capacity chip:** the "50% ACTIVE" chip in the header opens the check-in.
  - **Settings, language and help:** at the bottom of Today.
- **Simulation panel:** beside the phone on wide screens, behind **Simulation** below 880 px. You play everyone who isn't Joshi: the substitute accepting the link, the leg 1 driver, attestors and Kaveri's phone. It also holds the demo checklist and clock. These controls are not part of the product.
- **Saving:** progress is saved in the browser and survives a reload.

## What is simulated

| Item | In this prototype |
|---|---|
| SMS and OTP | Shown on screen only (OTP 482913, shortcode 54040). Nothing is sent |
| GPS | Fixed coordinates |
| Photos | Your own image file (it stays in the browser) or a drawn demo photo |
| Payments | None. IOUs are records only |
| Authority, anchors, approvals | Fictional. Ravi Agencies acts as the anchor |
| Custody | A demonstration permit. It creates no ownership, and the owner's claim is always kept |
| Organisations and figures | Fictional, taken from the approved mockup |

## Files

| File | Purpose |
|---|---|
| `index.html` | Shell and step bar |
| `styles.css` | Obsidian Kinetic tokens and components |
| `data.js` | Scenario: Day 1, 14:20, East Pune Corridor |
| `logic.js` | All rules: node states, matching, priority, tasks and legs, handoffs, custody, ledger, SMS parser. The app, console and SMS share it |
| `ui.js` | Icons, chips, the constellation, the continuity strip, the dark map |
| `operator.js` | Operator app screens |
| `console.js` | Authority console: map and coverage, orphans and custody, audit log |
| `sms.js` | SMS simulator |
| `main.js` | Boot, persistence, events, step bar, Simulation panel |
| `tour.html`, `tour.js`, `tour.css` | Guided demo: Guided, Auto-play and Free play modes over the unchanged app |
| `DEMO.md` | Three-minute walkthrough |
| `TEST_RESULTS.md` | Checks run and their results |
| `design/` | The approved Stitch mockup (`code.html`, `DESIGN.md`, screenshots) |

## Rules the prototype enforces

The rules are unchanged from the earlier build.

- **No reply is not gone.** A node becomes "probably gone" only after 6 hours of silence and 2 partners reporting they cannot reach it. Any check-in reactivates the node.
- **Matching:**
  - Only operating nodes with the right vehicle, a free vehicle and spare capacity within range are ranked.
  - The score is role 25, distance 25, capacity 20, shared trade partners 15, trust 15, and every score is explained.
  - Buyers are replaced only by buyers.
- **Proposals:** a proposal stays provisional until the counterpart accepts. Capacity is reserved on acceptance.
- **Tiers:** Tier 0 and Tier 1 claims need an anchor or two other nodes to verify them. Until then they count as Tier 2.
- **Vehicles:** tasks use only declared, free vehicles. Capacity can't drop below what active tasks need. A closed window can't be accepted. Only the assigned carrier can accept or decline.
- **Handoffs:** a relay handoff needs the other carrier's code. The final handoff can use a photo plus the attestation of an independent neighbour within 3 km.
- **Custody:**
  - The owner must be unreachable.
  - Two independent neighbours within 5 km must say yes, or one anchor. The requester, the owner and whoever receives the goods can't attest.
  - Each release records an IOU to the owner.
- **IOUs:** created only on delivery or release.
