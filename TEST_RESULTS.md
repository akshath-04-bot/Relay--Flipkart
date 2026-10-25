# Test results: Relay (Obsidian Kinetic)

Run on 24 October 2026 on Windows 11 with Node 22.18 and Google Chrome, driven headless by Playwright. The test scripts are development tools kept outside this folder.

## 1. Business logic: `tests/kinetic-scenario.test.js`, 13 checks, all pass

These are the same 12 checks as the previous build, re-pointed at this folder's data, plus one for the new SMS shortcuts.

- **Initial state:** Day 1, 14:20. Kaveri shows "No reply for 6 hours" and is not marked gone.
- **Canonical journey:**
  - Ranking: Baramati Agri Chilling, then Deccan Milk Distributors, then Om Sai Pharma Logistics.
  - Nodes left out, each with a reason: Kale (no refrigerated vehicle), Sahyadri (no spare capacity), Mahalaxmi (no reply).
  - A proposal is not acceptance, and 350 kg is reserved when the substitute accepts.
  - T214 is blocked until a refrigerated carrier exists.
  - A wrong code is refused at the code handoff. The photo fallback stays pending until the attestor confirms.
  - On delivery, Gandhi Pharmacy's stock goes from 12 kg to 412 kg. The ledger shows ₹4,200 owed to you and ₹1,800 you owe.
- **Custody:**
  - Meena Stores and the Hadapsar Mandi Association are asked to attest. One yes is not enough, and repeat votes are refused.
  - The permit runs for exactly 48 hours. Over-release is refused.
  - Each release creates an IOU of ₹16,000 to Raju Provisions.
- **SMS:** TASK then 1 accepts T215, and T216 is blocked for lack of vehicles.
- **Adverse cases:**
  - All three proposals declined leaves no candidates.
  - A "no" refuses custody, and an anchor review can override it (the override is logged).
  - Custody is refused while the owner is operating.
  - An unverified Tier 0 claim is treated as Tier 2.
  - A node that is not operating cannot accept tasks.
  - "Probably gone" needs 6 hours of silence and 2 reports.
  - Kaveri can reactivate itself by SMS.
- **Earlier Red Team regressions:**
  - A carrier with no free vehicle is never matched.
  - Other phones cannot accept or decline Joshi's tasks.
  - Declining a task keeps the need open.
  - Capacity cannot drop below what active tasks use, and a closed window cannot be accepted.
  - A custody beneficiary cannot attest, and a fallback attestor must be independent and within 3 km.
  - Buyers are only replaced by buyers.
  - An anchor cannot verify its own tier claim.
- **New SMS shortcuts:** ACCEPT accepts the top task this phone can actually take. "DONE 4821" confirms the matching handoff; a wrong code is refused.

## 2. Browser journey: `tests/kinetic-e2e.js`, 35 checks per run

Each run opens `index.html` over `file://` with every non-file request blocked, then completes demo Parts A to F through real clicks.

| Run | Result |
|---|---|
| 1280 x 900, Google Fonts allowed | 35 of 35 pass |
| 390 x 844, Google Fonts allowed | 35 of 35 pass |
| 360 x 780, Google Fonts allowed | 35 of 35 pass |
| 1280 x 900 and 390 x 844, fully offline (fonts blocked) | 35 of 35 pass |

Covered in every run:
- **Onboarding and Today:**
  - A wrong OTP is refused, and the claim screen shows 9 partners.
  - The first result appears before Today.
  - Today shows "50% active", "2 / 4" vans, a 65-litre diesel credit and the Tier 0 card "Gandhi Pharmacy · 400 kg Insulin".
- **Constellation:**
  - Kaveri is labelled "no reply".
  - A node can be selected with the keyboard.
  - The inspector offers Baramati.
  - The substitute list shows 3 candidates and the "Why this order" sheet.
  - A proposal appears as a provisional "(alt)" node, and T214 stays blocked while the link is provisional.
  - On the counterpart's acceptance, the new link redraws.
- **Task and handoffs:**
  - The reason text shows and the leg indicator reads "Leg 2 of 2".
  - A wrong token code is refused. The code handoff works, the NO_CELL fallback waits for attestation, and the task is then delivered.
- **Orphan, custody and ledger:**
  - The orphan report works.
  - Custody waits for 0 of 2, then 1 of 2 confirmations, then issues with "Sona Masoori rice (2,000 kg)".
  - A release is logged.
  - The ledger shows ₹4,200 and ₹1,800 and the permit CUST-883.
- **Console:** no horizontal scroll, the coverage meter, the repaired link, and the orphan's attestations.
- **SMS and other states:**
  - TASK then 1 accepts T215, and the app shows "Accepted by SMS".
  - T216 is blocked on capacity.
  - The offline banner shows, and Reset returns to the invite.
- **Network and errors:**
  - The only network requests are the Google Fonts.
  - There were no console errors.

## 3. Targeted checks after the Red Team fixes

| Check | Result |
|---|---|
| Phone frame position at 360 and 390 | 0 to 360 and 0 to 390, so no clipping (it was clipped by 14 px) |
| Smallest rendered text on Today and Chain, SVG labels included | 12 px at 360, 390 and 1280 |
| Focus after choosing a constellation node with Enter | Stays on the node |
| SMS "DONE 4821" with no active task | "You have no active task. Reply TASK to see offers." |
| SMS ACCEPT while T214 is blocked | Accepts T215 instead and says so |
| Text contrast | Muted text is at least 7.5:1 on every surface. White on the solid red Tier 0 fill is 4.8:1 (fill darkened to #DC2626) |

## 4. Red Team review

An independent reviewer reported 17 findings with reproductions: 4 high, 7 medium and 6 low. All were fixed, then checked by the reruns above.

- **High:**
  - The phone was clipped at phone widths.
  - Text was below 12 px: SVG labels, small chips and the nav labels.
  - Keyboard focus was lost after re-renders.
  - "1/2 vouched" showed when an anchor approved custody.
- **Medium:**
  - The continuity strip overflowed when there was no Tier 0 task.
  - The simulation disclaimer was hidden on phones.
  - Leg text contrast was too low.
  - The step bar was active before onboarding.
  - Console map labels collided.
  - The Score column in "Why this order" was off-screen.
  - Several touch targets were under 44 px.
- **Low:**
  - The Handoff badge had no text equivalent.
  - The "vans ready" count was wrong.
  - Three SMS shortcut edge cases misbehaved.
  - The toast covered content.
  - Assorted copy fixes.
  - The custody permit expiry was rounded up to the hour. That rounding was removed, so expiry is exact again.

What the reviewer found held up:
- It works offline.
- It respects reduced motion.
- Counts agree across screens: the ring, "broken links" and "disconnected".
- The ledger and IDs match across Today, Ledger and Console.
- The inspector shortcut and the provisional and replaced states are correct.
- Step jumps after onboarding go to the right screens.
- The Handoff tab's states work, and the SMS happy paths work.

## 5. Guided demo (`tour.html`): `tests/tour-e2e.js`

| Run | Result |
|---|---|
| Auto-play, 1280 x 900, 2× | All 61 steps complete in 124 s. Final state: corridor re-linked, T214 delivered, custody active, a task accepted by SMS. No console errors |
| Auto-play, 390 x 844, 2× | Passes in 130 s, including opening and closing the Simulation drawer on a phone |
| Guided, 1280 x 900 | Passes. The test clicked only what the tour highlighted, with real mouse clicks through the overlay |
| Guided, 390 x 844 | Passes |
| Saved state | The tour stores only `relay-tour:` keys, so `index.html` progress is untouched |
| App files | Checksums of index.html, styles.css and every app script are identical before and after the tour work |
| Video | `Relay-demo-autoplay.webm`, 232 s at 1280 x 900. Sampled frames show the pointer, spotlight and coach card |

## 6. Not verified, or simulated

- **Browsers:** only Chrome was tested, not Firefox or Safari.
- **Read-aloud:** voices depend on the system; it was not tested by ear.
- **"Take photo":** tested with the demo photo, not a real camera.
- **Fonts:** need an internet connection. Offline, system fonts are used and the look is slightly less faithful.
- **Simulated by design:** SMS, OTP, GPS, payments, authority approvals and every counterpart's action.
