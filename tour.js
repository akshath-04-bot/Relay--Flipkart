/* Relay guided demo. Three modes over the unchanged app:
   guided   - the next thing to click is spotlighted; the tour advances when the app has really changed.
   auto     - a pointer clicks for you; each result stays on screen (7 s for key screens) before moving on.
   free     - overlay off; explore freely and resume the tour at any time.
   The tour only reads the app's saved state and clicks the app's own controls; it never changes app code. */
(function () {
  'use strict';
  var KEY = 'tour-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(T)); } catch (e) { /* runs without persistence */ } }
  var T = Object.assign({ mode: 'guided', i: 0, speed: 1, started: false, paused: false, done: false }, load() || {});

  /* ---------- reading the app ---------- */
  function S() { try { return JSON.parse(localStorage.getItem('relay-kinetic-state-v1')); } catch (e) { return null; } }
  function VW() { try { return JSON.parse(localStorage.getItem('relay-kinetic-view-v1')) || {}; } catch (e) { return {}; } }
  function $(sel) { return document.querySelector(sel); }
  function ph(sel) { return document.querySelector('#phone ' + sel); }
  function sim(sel) { return document.querySelector('#sim ' + sel); }
  function byText(sel, re) { return Array.prototype.filter.call(document.querySelectorAll(sel), function (e) { return re.test(e.textContent); })[0]; }
  function task(st, id) { return st && st.tasks.filter(function (t) { return t.id === id; })[0]; }
  function leg(st, n) { var t = task(st, 'T214'); return t ? t.legs[n - 1] : {}; }
  function stage(st) { return st ? st.session.stage : 'invite'; }
  function checked(st) { return !!(st && st.nodes.joshi.checkin); }
  function relinked(st) { return !!(st && st.edges.some(function (e) { return e.replaces; })); }
  function delivered(st) { var t = task(st, 'T214'); return !!(t && t.status === 'delivered'); }
  function custodyActive(st) { return !!(st && st.custody.some(function (c) { return c.status === 'active'; })); }
  function smsAccepted(st) { return !!(st && st.tasks.some(function (t) { return t.acceptedVia === 'SMS'; })); }
  function cardOf(el) { return el ? el.closest('.card') || el : null; }
  function narrow() { return window.innerWidth < 881; }
  function simOpen() { return $('#stage').classList.contains('sim-open'); }

  /* ---------- the walkthrough (DEMO.md) ---------- */
  var PARTS = { A: 'Part A · Sense', B: 'Part B · Re-wire', C: 'Part C · Execute', D: 'Part D · Orphan custody', E: 'Part E · Ledger and console', F: 'Part F · SMS' };
  var STEPS = [
    { p: 'A', act: 'watch', t: function () { return ph('.screen'); }, say: 'Welcome to Relay', note: 'You are Joshi Fleet Services, a transporter in Pune, on Day 1 after the Snap. Ravi Agencies, an anchor distributor, has invited you. The invite opens here.' },
    { p: 'A', act: 'click', t: function () { return ph('[data-a=onbPhone]'); }, say: 'Tap <b>Continue</b>', done: function (st) { return !!ph('form[data-form=verifyPhone]') || stage(st) !== 'invite'; } },
    { p: 'A', act: 'fill', val: '482913', t: function () { return ph('input[name=code]'); }, say: 'Type the code <b>482913</b>', note: 'The code arrives by SMS. In this demo it is shown in the Simulation panel. No password is ever needed.', done: function (st) { var i = ph('input[name=code]'); return (i && i.value === '482913') || stage(st) !== 'invite'; } },
    { p: 'A', act: 'click', t: function () { return ph('form[data-form=verifyPhone] button[type=submit]'); }, say: 'Tap <b>Verify phone</b>', done: function (st) { return stage(st) !== 'invite'; } },
    { p: 'A', act: 'click', t: function () { return ph('[data-a=claim]'); }, say: 'Tap <b>Yes, this is me</b>', note: 'Relay pre-built this node from the anchor\'s partner records, so there is nothing to type: 9 partners are already linked.', done: function (st) { return stage(st) === 'checkin' || stage(st) === 'done'; } },
    { p: 'A', act: 'click', t: function () { return ph('[data-a=ciOperating][data-v="1"]'); }, say: 'Are you operating today? Tap <b>Yes</b>', note: 'Check-in is three taps and also works by SMS.', done: function (st) { return !!ph('[data-a=ciCap]') || checked(st); } },
    { p: 'A', act: 'click', t: function () { return ph('[data-a=ciCap][data-v="0.5"]'); }, say: 'Capacity: tap <b>Half</b>', note: 'Half of 4 vans means 2 vans can be offered tasks.', done: function (st) { var b = ph('[data-a=ciCap][data-v="0.5"]'); return (b && b.classList.contains('sel')) || checked(st); } },
    { p: 'A', act: 'click', t: function () { return ph('[data-a=ciStep][data-step="3"]'); }, say: 'Tap <b>Next</b>', done: function (st) { return !!ph('[data-a=ciQty]') || checked(st); } },
    { p: 'A', act: 'click', t: function () { return ph('[data-a=ciQty][data-i="0"][data-d="1"]'); }, say: 'Add <b>cold boxes</b> with the plus button', note: 'Holdings are optional. Insulated boxes let you carry insulin on a short leg.', done: function (st) { var o = ph('.qrow output'); return (o && o.textContent !== '0') || checked(st); } },
    { p: 'A', act: 'click', t: function () { return ph('[data-a=ciConfirm]:not([data-skip])'); }, say: 'Tap <b>Confirm status</b>', done: function (st) { return checked(st); } },
    { p: 'A', act: 'watch', t: function () { return ph('.card-amber'); }, say: 'Relay gives before it asks', note: 'Right after check-in you get something useful. Kaveri Cold Chain has not replied for 6 hours, and 3 substitutes exist. No reply is not the same as gone.' },
    { p: 'A', act: 'click', t: function () { return ph('.onb [data-a=tab][data-tab=today]'); }, say: 'Tap <b>Go to Today</b>', done: function () { return !!ph('.telemetry'); }, page: 'today' },
    { p: 'A', act: 'watch', t: function () { return cardOf(ph('.telemetry')); }, say: 'Pulse telemetry', note: '6 of 9 links are live, and 2 of 4 vans are running. The strip shows the insulin route: Ravi Agencies, Kaveri (no reply), you, Gandhi Pharmacy.', page: 'today' },
    { p: 'A', act: 'watch', t: function () { return ph('.card-red'); }, say: 'The most urgent job', note: 'Gandhi Pharmacy needs 400 kg of insulin: Tier 0, about 5 hours left. The countdown also runs in the status bar.', page: 'today' },

    { p: 'B', act: 'click', skip: relinked, t: function () { return ph('.bnav [data-tab=chain]'); }, say: 'Open the <b>Chain</b> tab', done: function () { return !!ph('.const-svg'); }, page: 'today' },
    { p: 'B', act: 'click', skip: relinked, t: function () { return ph('[data-a=cnSel][data-edge="E2"]'); }, say: 'Tap the dashed <b>Kaveri</b> node', note: 'This is the chain as a constellation: suppliers above you, buyers below. A dashed ring means no reply, not gone. A node is "probably gone" only after 6 hours of silence and two partners reporting they cannot reach it.', done: function () { var i = ph('.inspector'); return !!(i && /Kaveri/.test(i.textContent)); }, page: 'chain' },
    { p: 'B', act: 'click', skip: relinked, t: function () { return ph('.inspector [data-k=propose]'); }, say: 'Tap <b>Propose substitute</b>', note: 'The top match is Baramati Agri Chilling: 3 refrigerated vans, 4.2 km away, pre-cooled to 4 °C. Every ranking is explained on the substitute screen.', done: function (st) { return !!ph('.sheet [data-a=proposeLink]') || !!(st && st.proposals.length); }, page: 'chain' },
    { p: 'B', act: 'click', skip: relinked, back: true, t: function () { return ph('.sheet [data-a=proposeLink]'); }, say: 'Confirm with <b>Propose link</b>', done: function (st) { return !!(st && st.proposals.length); } },
    { p: 'B', act: 'watch', skip: relinked, t: function () { return ph('.const-box'); }, say: 'A proposal is not a link', note: 'Baramati appears as an "(alt)" node with a dashed blue link. Nothing changes until they accept.', page: 'chain' },
    { p: 'B', act: 'click', sim: true, skip: relinked, t: function () { return sim('[data-a=simProposal]'); }, say: 'Play the other side: <b>Open their screen</b>', note: 'The Simulation panel acts for everyone who is not you, here Baramati Agri Chilling.', done: function (st) { return !!ph('.sheet [data-a=respond][data-accept="1"]') || relinked(st); } },
    { p: 'B', act: 'click', skip: relinked, back: true, t: function () { return ph('.sheet [data-a=respond][data-accept="1"]'); }, say: 'As Baramati, tap <b>Accept link</b>', done: relinked },
    { p: 'B', act: 'watch', t: function () { return ph('.const-box'); }, say: 'The corridor is re-linked', note: 'The new link draws in emerald and starts flowing. Refrigerated capacity is now reserved for this route.', page: 'chain' },

    { p: 'C', act: 'click', skip: delivered, t: function () { return ph('.bnav .bn-center'); }, say: 'Open <b>Tasks</b>, the centre button', note: 'It glows red while a Tier 0 task is waiting.', done: function () { return !!byText('#phone button.item', /T214/); }, page: 'today' },
    { p: 'C', act: 'click', skip: delivered, t: function () { return byText('#phone button.item', /T214/); }, say: 'Open task <b>T214</b>', done: function () { return !!ph('.tiles'); } },
    { p: 'C', act: 'watch', skip: delivered, t: function () { return ph('.card-red'); }, say: 'Why this task comes first', note: 'Live readings: 4.8 °C against an 8 °C spoil threshold, worth ₹4,200. "Why this task" explains the ranking: Tier 0, verified by an anchor, shortest time left.', page: 'task' },
    { p: 'C', act: 'click', skip: delivered, t: function () { return ph('.dock [data-a=acceptTask]'); }, say: 'Tap <b>Accept task</b>', note: 'Before the substitute link existed, this button was blocked: no refrigerated carrier.', done: function (st) { var t = task(st, 'T214'); return !!(t && t.status !== 'offered'); }, page: 'task' },
    { p: 'C', act: 'watch', skip: delivered, t: function () { return cardOf(ph('.legs')); }, say: 'Two relay legs', note: 'Leg 1: Baramati\'s refrigerated van, Chakan to the Swargate safe point. Leg 2: you, Swargate to Gandhi Pharmacy in cold boxes.', page: 'task', dwell: 5 },
    { p: 'C', act: 'click', skip: delivered, t: function () { return ph('.dock [data-step=at_pickup]'); }, say: 'Drive to Swargate, then tap <b>I am at the pickup point</b>', done: function (st) { return leg(st, 2).status && leg(st, 2).status !== 'assigned'; }, page: 'task' },
    { p: 'C', act: 'click', sim: true, skip: delivered, t: function () { return sim('[data-a=simLeg]'); }, say: 'As Baramati\'s driver: <b>Report pickup</b>', note: 'Updates from the other carrier come from the Simulation panel.', done: function (st) { return leg(st, 1).status && leg(st, 1).status !== 'assigned'; } },
    { p: 'C', act: 'click', sim: true, skip: delivered, t: function () { return sim('[data-a=simLeg]'); }, say: 'As the driver: <b>Report arrival at Swargate</b>', done: function (st) { return leg(st, 1).status === 'at_handoff' || leg(st, 1).status === 'handed_over'; } },
    { p: 'C', act: 'click', skip: delivered, t: function () { return ph('.dock [data-a=go][data-screen=handoff]'); }, say: 'Tap <b>Receive goods from leg 1</b>', done: function (st) { return !!ph('.token') || leg(st, 1).status === 'handed_over'; }, page: 'task' },
    { p: 'C', act: 'watch', skip: function (st) { return leg(st, 1).status === 'handed_over' || delivered(st); }, t: function () { return ph('.token-card'); }, say: 'Two-party handoff', note: 'You show your token, and the driver shows theirs. The driver\'s code, 4821, is in the Simulation panel.', page: 'handoff', dwell: 5 },
    { p: 'C', act: 'fill', val: '4821', skip: function (st) { return leg(st, 1).status === 'handed_over' || delivered(st); }, t: function () { return ph('form[data-form=handoffCode] input[name=code]'); }, say: 'Type the driver\'s code <b>4821</b>', done: function (st) { var i = ph('form[data-form=handoffCode] input[name=code]'); return (i && i.value === '4821') || leg(st, 1).status === 'handed_over'; }, page: 'handoff' },
    { p: 'C', act: 'click', skip: delivered, t: function () { return ph('form[data-form=handoffCode] button[type=submit]'); }, say: 'Tap <b>Confirm handoff</b>', done: function (st) { return leg(st, 1).status === 'handed_over'; }, page: 'handoff' },
    { p: 'C', act: 'click', skip: delivered, t: function () { return ph('.subhead [data-a=back]'); }, say: 'Go <b>back</b> to the task', done: function () { return !!ph('.dock [data-step=at_handoff]'); }, page: 'task' },
    { p: 'C', act: 'click', skip: delivered, t: function () { return ph('.dock [data-step=at_handoff]'); }, say: 'Drive to Hadapsar, then tap <b>I am at the handoff point</b>', done: function (st) { return ['at_handoff', 'awaiting_attestation', 'handed_over'].indexOf(leg(st, 2).status) >= 0; }, page: 'task' },
    { p: 'C', act: 'click', skip: delivered, t: function () { return ph('.dock [data-a=go][data-screen=handoff]'); }, say: 'Tap <b>Confirm handoff</b>', done: function (st) { return !!ph('button.fallback') || !!ph('form[data-form=handoffFallback]') || leg(st, 2).status === 'awaiting_attestation'; }, page: 'task' },
    { p: 'C', act: 'click', skip: function (st) { return delivered(st) || leg(st, 2).status === 'awaiting_attestation'; }, t: function () { return ph('button.fallback'); }, say: 'The pharmacist\'s phone is dead: tap <b>NO_CELL</b>', note: 'When the other person cannot be reached, a photo plus an independent neighbour replaces their code.', done: function () { return !!ph('form[data-form=handoffFallback]'); }, page: 'handoff' },
    { p: 'C', act: 'click', skip: function (st) { return delivered(st) || leg(st, 2).status === 'awaiting_attestation'; }, back: true, t: function () { return ph('form[data-form=handoffFallback] [data-a=demoPhoto]'); }, say: 'Take a photo: <b>Use demo photo</b>', done: function () { return !!ph('form[data-form=handoffFallback] .photo img'); } },
    { p: 'C', act: 'click', skip: function (st) { return delivered(st) || leg(st, 2).status === 'awaiting_attestation'; }, back: true, t: function () { return ph('form[data-form=handoffFallback] button[type=submit]'); }, say: 'Tap <b>Confirm handoff</b>', note: 'The photo is geotagged. Meena Stores, a neighbour 1.2 km away with no part in the task, must confirm.', done: function (st) { return leg(st, 2).status === 'awaiting_attestation' || delivered(st); } },
    { p: 'C', act: 'click', sim: true, skip: delivered, t: function () { return sim('[data-a=simHandoffAttest][data-yes="1"]'); }, say: 'As Meena Stores: <b>Confirm handoff</b>', done: delivered },
    { p: 'C', act: 'watch', t: function () { return ph('.app-main'); }, say: 'Delivered', note: 'Stock, the need, both IOUs and the console all updated together, in one record.', page: 'task', dwell: 5 },

    { p: 'D', act: 'click', skip: custodyActive, t: function () { return ph('.bnav [data-tab=chain]'); }, say: 'Open the <b>Chain</b> tab', done: function () { return !!ph('[data-a=chainSeg]'); }, page: 'today' },
    { p: 'D', act: 'click', skip: custodyActive, t: function () { return ph('[data-a=chainSeg][data-v=orphans]'); }, say: 'Tap <b>Orphans nearby</b>', done: function () { return !!ph('[data-screen=orphanReport]'); }, page: 'chain' },
    { p: 'D', act: 'click', skip: function (st) { return custodyActive(st) || !!(st && st.orphans.length > 1); }, t: function () { return ph('[data-a=go][data-screen=orphanReport]'); }, say: 'Tap <b>Report an orphan</b>', note: 'Raju Provisions\' owner is unreachable, and 2 tonnes of rice sit in the locked shop.', done: function () { return !!ph('form[data-form=reportOrphan]'); } },
    { p: 'D', act: 'click', skip: function (st) { return custodyActive(st) || !!(st && st.orphans.length > 1); }, back: true, t: function () { return ph('form[data-form=reportOrphan] [data-a=demoPhoto]'); }, say: 'Photo first: <b>Use demo photo</b>', done: function () { return !!ph('form[data-form=reportOrphan] .photo img'); } },
    { p: 'D', act: 'click', skip: function (st) { return custodyActive(st) || !!(st && st.orphans.length > 1); }, back: true, t: function () { return ph('form[data-form=reportOrphan] button[type=submit]'); }, say: 'Tap <b>Report orphan</b>', note: 'Location, kind, goods and owner are already filled in.', done: function (st) { return !!(st && st.orphans.length > 1); } },
    { p: 'D', act: 'click', skip: function (st) { return !!(st && st.custody.length); }, t: function () { return ph('form[data-form=requestCustody] button[type=submit]'); }, say: 'Tap <b>Request custody</b>', note: 'Custody is a loan, never ownership. Two independent neighbours must confirm the owner is unreachable.', done: function (st) { return !!(st && st.custody.length); } },
    { p: 'D', act: 'click', sim: true, skip: custodyActive, t: function () { return sim('[data-a=simAttest][data-node=meena][data-answer=yes]'); }, say: 'As Meena Stores: <b>Yes, I confirm</b>', done: function (st) { var c = st && st.custody[0]; return !!(c && c.attestors.some(function (a) { return a.node === 'meena' && a.answer; })); } },
    { p: 'D', act: 'click', sim: true, skip: custodyActive, t: function () { return sim('[data-a=simAttest][data-node=mandi][data-answer=yes]'); }, say: 'As the Mandi Association: <b>Yes, I confirm</b>', note: 'One "yes" is not enough. A second, independent neighbour is needed.', done: custodyActive },
    { p: 'D', act: 'watch', t: function () { return ph('.callout') || ph('.app-main'); }, say: 'Custody issued', note: 'Permit CUST-883 runs for 48 hours. The owner\'s claim is kept, and every release records an IOU to them.', dwell: 6 },

    { p: 'E', act: 'click', t: function () { return ph('.bnav [data-tab=ledger]'); }, say: 'Open the <b>Ledger</b>', done: function () { return !!ph('.totals'); }, page: 'today' },
    { p: 'E', act: 'watch', t: function () { return ph('.totals'); }, say: 'A zero-cash ledger', note: 'Gandhi Pharmacy owes you ₹4,200 for the delivery, and you owe Baramati ₹1,800 for van hours. These are records only: no money moves until later.', page: 'ledger' },
    { p: 'E', act: 'click', t: function () { return $('.tb-right [data-view=console]'); }, say: 'Switch to the authority <b>Console</b>', done: function () { return !!$('#console .con'); } },
    { p: 'E', act: 'watch', t: function () { return $('#console .map-box'); }, say: 'The authority sees the same records', note: 'Coverage of pre-Snap links, the repaired link in green, the rice orphan on the map, and every action you took in the activity log.', page: 'console' },

    { p: 'F', act: 'click', skip: smsAccepted, t: function () { return $('.tb-steps [data-to=sms]'); }, say: 'Open the <b>SMS simulator</b>', note: 'When data fails, every core action works by SMS to shortcode 54040.', done: function () { return !!ph('.sms'); } },
    { p: 'F', act: 'click', skip: smsAccepted, t: function () { return ph('[data-a=smsKey][data-v=TASK]'); }, say: 'Send <b>TASK</b>', done: function (st) { var m = st && st.sms.joshi; return !!(m && m.length && /T215/.test(m[m.length - 1].text)); }, page: 'sms' },
    { p: 'F', act: 'click', skip: smsAccepted, t: function () { return ph('[data-a=smsKey][data-v="1"]'); }, say: 'Reply <b>1</b> to accept', done: smsAccepted, page: 'sms' },
    { p: 'F', act: 'click', t: function () { return $('.tb-steps [data-to=today]'); }, say: 'Back to the app: <b>1. Today</b>', done: function () { return VW().view === 'operator' && !!ph('.telemetry'); } },
    { p: 'F', act: 'click', t: function () { return ph('.bnav .bn-center'); }, say: 'Open <b>Tasks</b>', done: function () { return !!byText('#phone .chip', /accepted by sms/i); }, page: 'today' },
    { p: 'F', act: 'watch', t: function () { return byText('#phone button.item', /T215/); }, say: 'Same rules, any channel', note: 'The task accepted by SMS shows "Accepted by SMS" in the app. There is only one record, whichever channel you use.' }
  ];
  var JUMP = { today: '[data-a=jump][data-to=today]', chain: '[data-a=jump][data-to=chain]', task: '[data-a=jump][data-to=task]', handoff: '[data-a=jump][data-to=handoff]', ledger: '[data-a=jump][data-to=ledger]', sms: '[data-a=jump][data-to=sms]', console: '[data-view=console]' };

  /* ---------- overlay ---------- */
  var root = document.getElementById('tour-root');
  root.innerHTML = '<div class="tour-spot" aria-hidden="true"></div><div class="tour-pointer" aria-hidden="true"><span></span></div>' +
    '<section id="tour-card" class="tour-card" aria-label="Guided demo" tabindex="-1"></section>';
  var spot = root.querySelector('.tour-spot'), pointer = root.querySelector('.tour-pointer'), card = root.querySelector('.tour-card');
  var lastKey = '', missingSince = 0, advanceAt = 0, countdown = null, lastEl = null;
  function scrollTo(el) {
    var r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > window.innerHeight - 10 || r.left < 0 || r.right > window.innerWidth) el.scrollIntoView({ block: 'center', inline: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function h(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stepTarget(step) {
    if (step.sim && narrow() && !simOpen()) return { el: $('.sim-toggle'), say: 'Open the <b>Simulation</b> panel' };
    var el = null; try { el = step.t(); } catch (e) { el = null; }
    return { el: el, say: step.say };
  }
  function place(el) {
    if (!el || T.mode === 'free') { spot.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) { spot.style.display = 'none'; return; }
    var pad = 6;
    spot.style.display = 'block';
    spot.style.left = (r.left - pad) + 'px'; spot.style.top = (r.top - pad) + 'px';
    spot.style.width = (r.width + 2 * pad) + 'px'; spot.style.height = (r.height + 2 * pad) + 'px';
    spot.classList.toggle('tour-spot-watch', STEPS[T.i] && STEPS[T.i].act === 'watch');
    if (window.innerWidth < 1260) {
      var mid = r.top + r.height / 2;
      card.classList.toggle('tour-card-top', mid > window.innerHeight * 0.5);
      card.classList.toggle('tour-card-bottom', mid <= window.innerHeight * 0.5);
    } else { card.classList.remove('tour-card-top', 'tour-card-bottom'); }
  }
  function modeBtns() {
    return '<div class="tc-modes" role="group" aria-label="Demo mode">' + [['guided', 'Guided'], ['auto', 'Auto-play'], ['free', 'Free play']].map(function (m) {
      return '<button type="button" data-tour="mode" data-v="' + m[0] + '" class="' + (T.mode === m[0] ? 'on' : '') + '" aria-pressed="' + (T.mode === m[0]) + '">' + m[1] + '</button>';
    }).join('') + '</div>';
  }
  function renderCard(missing) {
    var key = [T.mode, T.i, T.paused, T.done, T.started, missing, T.speed, narrow() && STEPS[T.i] && STEPS[T.i].sim && !simOpen()].join('|');
    if (key === lastKey) return;
    lastKey = key;
    root.classList.toggle('tour-free', T.mode === 'free' || !T.started);
    if (!T.started) { card.className = 'tour-card tour-welcome'; card.innerHTML = welcome(); return; }
    if (T.mode === 'free') {
      card.className = 'tour-card tour-mini';
      card.innerHTML = '<span class="tc-part">Free play</span><span class="tc-mini-t">Explore anything. The tour waits at step ' + (Math.min(T.i, STEPS.length - 1) + 1) + '.</span>' + modeBtns() +
        '<button type="button" class="tc-btn" data-tour="restart">Restart demo</button>';
      return;
    }
    if (T.done || T.i >= STEPS.length) {
      card.className = 'tour-card';
      card.innerHTML = '<div class="tc-top"><span class="tc-part">Demo complete</span></div>' + modeBtns() + '<h2 class="tc-say">That is Relay end to end</h2>' +
        '<p class="tc-note">You sensed a broken chain, re-linked it, moved Tier 0 insulin through a relay with two kinds of handoff, put stranded rice into recorded custody, and saw the ledger, the console and the SMS channel share one record.</p>' +
        '<div class="tc-ctrls"><button type="button" class="tc-btn tc-primary" data-tour="restart">Run it again</button><button type="button" class="tc-btn" data-tour="mode" data-v="free">Explore freely</button></div>';
      return;
    }
    var step = STEPS[T.i], tg = stepTarget(step);
    var partSteps = STEPS.filter(function (s) { return s.p === step.p; }), pi = partSteps.indexOf(step) + 1;
    var auto = T.mode === 'auto';
    var ctrls = '<button type="button" class="tc-btn" data-tour="prev"' + (T.i === 0 ? ' disabled' : '') + '>Back</button>';
    if (auto) ctrls += '<button type="button" class="tc-btn tc-primary" data-tour="pause">' + (T.paused ? 'Resume' : 'Pause') + '</button><button type="button" class="tc-btn" data-tour="next">Skip</button>';
    else if (step.act === 'watch') ctrls += '<button type="button" class="tc-btn tc-primary" data-tour="next">Next</button>';
    else if (step.act === 'fill') ctrls += '<button type="button" class="tc-btn tc-primary" data-tour="fill">Fill it for me</button>';
    else ctrls += '<button type="button" class="tc-btn" data-tour="next">Skip step</button>';
    var miss = missing ? '<div class="tc-missing">You have moved away from this step. ' + (step.back ? '<button type="button" class="tc-btn" data-tour="prev">Back one step</button>' : '') +
      (step.page ? '<button type="button" class="tc-btn tc-primary" data-tour="goto">Take me there</button>' : '') + '</div>' : '';
    card.className = 'tour-card';
    card.innerHTML = '<div class="tc-top"><span class="tc-part">' + h(PARTS[step.p]) + ' · ' + pi + '/' + partSteps.length + '</span><span class="tc-count">' + (T.i + 1) + ' / ' + STEPS.length + '</span></div>' +
      '<div class="tc-progress" aria-hidden="true"><i style="width:' + Math.round(100 * (T.i + 1) / STEPS.length) + '%"></i></div>' + modeBtns() +
      '<h2 class="tc-say" aria-live="polite">' + (step.act === 'watch' ? '' : '<span class="tc-hand" aria-hidden="true"></span>') + '<span>' + tg.say + '</span></h2>' +
      (step.note ? '<p class="tc-note">' + h(step.note) + '</p>' : '') + miss +
      (auto ? '<div class="tc-timer" aria-hidden="true"><i></i></div><label class="tc-speed">Speed <select data-tour="speed">' + [0.5, 1, 1.5, 2].map(function (v) { return '<option value="' + v + '"' + (T.speed === v ? ' selected' : '') + '>' + v + '×</option>'; }).join('') + '</select></label>' : '') +
      '<div class="tc-ctrls">' + ctrls + '<button type="button" class="tc-btn tc-ghost" data-tour="restart">Restart</button></div>';
  }
  function welcome() {
    return '<span class="tc-part">Relay · guided demo</span><h2 class="tc-say">How would you like to see it?</h2>' +
      '<p class="tc-note">A three-minute walkthrough of the full scenario: Day 1 after the Snap, a broken cold chain, insulin that must move now.</p>' +
      '<div class="tc-choices"><button type="button" class="tc-choice" data-tour="start" data-v="guided"><b>Guided</b><span>Each click is highlighted. You click, and the tour explains what changed.</span></button>' +
      '<button type="button" class="tc-choice" data-tour="start" data-v="auto"><b>Auto-play</b><span>Sit back. The demo clicks for you and pauses on each screen.</span></button>' +
      '<button type="button" class="tc-choice" data-tour="start" data-v="free"><b>Free play</b><span>Explore on your own. Switch to the tour at any time.</span></button></div>' +
      '<p class="tc-note tc-small">The tour keeps its own copy of the demo, separate from index.html.</p>';
  }

  /* ---------- guided loop ---------- */
  function tick() {
    if (!T.started || T.mode === 'free') { place(null); pointer.style.display = 'none'; renderCard(false); return; }
    if (T.i >= STEPS.length) { T.done = true; place(null); renderCard(false); return; }
    var step = STEPS[T.i], st = S();
    if (step.skip && step.skip(st) && T.mode === 'guided') { go(T.i + 1); return; }
    if (narrow() && simOpen() && !step.sim) { var c = $('.sim-close'); if (c) c.click(); }
    var tg = stepTarget(step);
    var missing = !tg.el;
    if (missing) { if (!missingSince) missingSince = Date.now(); } else missingSince = 0;
    renderCard(missing && Date.now() - missingSince > 1200);
    if (tg.el && tg.el !== lastEl && T.mode === 'guided') { lastEl = tg.el; scrollTo(tg.el); }
    place(tg.el);
    if (T.mode !== 'guided') return;
    pointer.style.display = 'none';
    if (step.act !== 'watch' && step.done && step.done(st, VW())) {
      if (!advanceAt) { advanceAt = Date.now() + 550; spot.classList.add('tour-spot-done'); }
      else if (Date.now() >= advanceAt) go(T.i + 1);
    }
  }
  function go(i) {
    T.i = Math.max(0, i); T.done = T.i >= STEPS.length; advanceAt = 0; missingSince = 0; spot.classList.remove('tour-spot-done');
    save(); lastKey = ''; tick();
    if (T.mode === 'auto') autoRun();
  }

  /* ---------- auto-play ---------- */
  var token = 0, running = false;
  function sleep(ms, my) {
    return new Promise(function (res) {
      var left = ms, last = Date.now();
      (function wait() {
        if (my !== token) return res(false);
        var now = Date.now(); if (!T.paused) left -= now - last; last = now;
        if (left <= 0) return res(true);
        setTimeout(wait, 50);
      })();
    });
  }
  function waitFor(fn, ms, my) {
    return new Promise(function (res) {
      var end = Date.now() + ms;
      (function poll() { var v = null; try { v = fn(); } catch (e) { v = null; } if (my !== token) return res(null); if (v) return res(v); if (Date.now() > end) return res(null); setTimeout(poll, 100); })();
    });
  }
  function center(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function movePointer(el) { var c = center(el); pointer.style.display = 'block'; pointer.style.left = c.x + 'px'; pointer.style.top = c.y + 'px'; }
  function press(el) {
    pointer.classList.remove('tap'); void pointer.offsetWidth; pointer.classList.add('tap');
    if (typeof el.click === 'function') el.click(); else el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
  }
  function fill(el, v) { el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
  function timer(ms) { countdown = { ms: ms, done: 0 }; }
  async function runStep(step, my) {
    var sp = T.speed || 1, st = S();
    if (step.skip && step.skip(st)) return true;
    if (step.sim && narrow() && !simOpen()) { var tgl = $('.sim-toggle'); movePointer(tgl); await sleep(700 / sp, my); press(tgl); await sleep(500, my); }
    var el = await waitFor(function () { return step.t(); }, 2500, my);
    if (!el && step.page && JUMP[step.page]) { var j = $(JUMP[step.page]); if (j) { press(j); el = await waitFor(function () { return step.t(); }, 2500, my); } }
    if (!el) { if (my === token) { T.mode = 'guided'; T.paused = false; save(); lastKey = ''; } return false; }
    if (el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    await sleep(350, my);
    if (step.act === 'watch') {
      pointer.style.display = 'none';
      var dwell = (step.dwell || 7) * 1000 / sp; timer(dwell); return sleep(dwell, my);
    }
    movePointer(el); timer(2200 / sp);
    if (!(await sleep(1300 / sp, my))) return false;
    el = step.t() || el;
    if (step.act === 'fill') { fill(el, step.val); } else press(el);
    await waitFor(function () { return step.done ? step.done(S(), VW()) : true; }, 3500, my);
    return sleep(900 / sp, my);
  }
  async function autoRun() {
    if (running) return;
    running = true;
    var my = ++token;
    while (T.mode === 'auto' && T.i < STEPS.length && my === token) {
      var ok = await runStep(STEPS[T.i], my);
      if (my !== token || T.mode !== 'auto') break;
      if (!ok) break;
      T.i += 1; save(); lastKey = '';
    }
    if (my === token && T.i >= STEPS.length) { T.done = true; save(); lastKey = ''; window.__tourFinished = true; }
    running = false;
  }
  function stopAuto() { token += 1; running = false; pointer.style.display = 'none'; }

  /* ---------- controls ---------- */
  function restart(mode) {
    stopAuto();
    window.__tourStore.clearApp();
    T = { mode: mode || T.mode || 'guided', i: 0, speed: T.speed || 1, started: true, paused: false, done: false };
    if (T.mode === 'free') T.mode = 'guided';
    save(); location.reload();
  }
  root.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-tour]'); if (!b || b.disabled) return;
    var a = b.getAttribute('data-tour'), v = b.getAttribute('data-v');
    if (a === 'start') { window.__tourStore.clearApp(); T = { mode: v, i: 0, speed: T.speed || 1, started: true, paused: false, done: false }; save(); location.reload(); return; }
    if (a === 'restart') { restart(); return; }
    if (a === 'mode') { stopAuto(); T.mode = v; T.paused = false; if (T.i >= STEPS.length && v !== 'free') T.i = 0; save(); lastKey = ''; tick(); if (v === 'auto') autoRun(); return; }
    if (a === 'prev') { var wasAuto = T.mode === 'auto'; stopAuto(); go(T.i - 1); if (wasAuto) autoRun(); return; }
    if (a === 'next') { var wa = T.mode === 'auto'; stopAuto(); go(T.i + 1); if (wa) autoRun(); return; }
    if (a === 'pause') { T.paused = !T.paused; save(); lastKey = ''; tick(); return; }
    if (a === 'goto') { var st = STEPS[T.i]; var j = st && st.page && $(JUMP[st.page]); if (j) j.click(); return; }
    if (a === 'fill') { var s0 = STEPS[T.i], el = s0 && s0.t(); if (el) { fill(el, s0.val); } return; }
  });
  root.addEventListener('change', function (ev) { if (ev.target.matches('[data-tour=speed]')) { T.speed = Number(ev.target.value); save(); } });
  document.addEventListener('keydown', function (ev) {
    if (!T.started || T.mode === 'free' || /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)) return;
    var step = STEPS[T.i];
    if (ev.key === 'ArrowRight' && step && (step.act === 'watch' || T.mode === 'auto')) { ev.preventDefault(); card.querySelector('[data-tour=next]') && card.querySelector('[data-tour=next]').click(); }
    if (ev.key === 'ArrowLeft') { var p = card.querySelector('[data-tour=prev]'); if (p && !p.disabled) { ev.preventDefault(); p.click(); } }
  });

  // countdown bar for auto-play
  setInterval(function () {
    if (!countdown || T.mode !== 'auto') return;
    var bar = card.querySelector('.tc-timer i'); if (!bar) return;
    if (!T.paused) { countdown.done = (countdown.done || 0) + 100; }
    bar.style.width = Math.min(100, 100 * (countdown.done || 0) / countdown.ms) + '%';
  }, 100);

  setInterval(tick, 200);
  window.addEventListener('resize', function () { lastKey = ''; tick(); });
  window.addEventListener('scroll', function () { tick(); }, true);
  tick();
  if (T.started && T.mode === 'auto' && T.i < STEPS.length) setTimeout(autoRun, 600);

  // For automated checks only: read-only view of the tour.
  window.Tour = { steps: STEPS.length, state: function () { return { mode: T.mode, i: T.i, done: T.done, started: T.started }; }, target: function () { var s = STEPS[T.i]; return s ? stepTarget(s).el : null; }, step: function () { return STEPS[T.i]; } };
})();
