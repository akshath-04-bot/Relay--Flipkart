/* Boot, persistence, events, step-jump top bar and the Simulation panel (counterparts and devices that are not the user). */
(function () {
  'use strict';
  var R = window.Relay, U = window.UI, h = U.h, icon = U.icon;
  var KEY = 'relay-kinetic-state-v1', VKEY = 'relay-kinetic-view-v1';

  function load(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private window: runs without persistence */ } }

  var saved = load(KEY);
  var store = R.createStore(saved && saved.v === 3 && saved.nodes.baramati ? saved : window.RelayData.seed(), function (s) { save(KEY, s); });
  function freshView() {
    return { view: 'operator', tab: 'today', screen: null, p: {}, stack: [], sheet: null, chainSeg: 'links', lang: 'en', onb: null, ci: { step: 1, stock: [] },
      afterCheckin: false, draft: {}, smsPhone: 'joshi', simOpen: false, seenConsole: false, handoffFallback: false, handoffPhoto: null, cnSel: null,
      orphanDraft: null, custodyDraft: { use: 'Supply Hadapsar Community Kitchen', hours: 48 },
      con: { page: 'map', sel: null, layers: { nodes: true, edges: true, orphans: true, shortages: true, hp: true }, region: 'all', cat: 'all', auditNode: '' } };
  }
  var V = Object.assign(freshView(), load(VKEY) || {});
  V.sheet = null; V.simOpen = false;
  var toastTimer = null, lastScreenKey = '', lastFocus = null;

  function S() { return store.state; }
  function toast(text, bad) {
    var el = document.getElementById('toast');
    el.className = 'toast show' + (bad ? ' toast-bad' : '');
    el.setAttribute('role', bad ? 'alert' : 'status');
    el.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, bad ? 6000 : 3200);
  }
  function result(r, okText) {
    if (!r) return r;
    if (!r.ok) toast(r.msg, true);
    else if (r.viaSms) toast('No data connection. ' + (okText || r.msg) + ', sent by SMS.');
    else if (okText !== false) toast(okText || r.msg);
    return r;
  }
  function run(name, p) { return store.run(name, p); }

  /* ---------- top bar steps (jump to a screen in the live state) ---------- */
  var STEPS = [['today', '1. Today'], ['chain', '2. Constellation'], ['task', '3. Task T214'], ['handoff', '4. Handoff'], ['ledger', '5. Custody/Ledger'], ['sms', 'SMS simulator']];
  function onboarded() { return S().session.stage === 'done'; }
  function stepOn(k) {
    if (V.view === 'sms') return k === 'sms';
    if (!onboarded()) return V.view === 'operator' && k === 'today';
    if (V.view !== 'operator') return false;
    if (k === 'task') return V.screen === 'task' && V.p.id === 'T214';
    if (k === 'handoff') return V.tab === 'handoff' || V.screen === 'handoff';
    if (V.screen) return false;
    return V.tab === k;
  }
  function renderSteps() {
    document.querySelector('.tb-steps').innerHTML = STEPS.map(function (st) {
      var on = stepOn(st[0]);
      return '<button type="button" class="' + (on ? 'on' : '') + (st[0] === 'sms' ? ' dot-sky' : '') + '" data-a="jump" data-to="' + st[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + h(st[1]) + '</button>';
    }).join('');
    var cb = document.querySelector('[data-view="console"]'); cb.classList.toggle('on', V.view === 'console'); cb.setAttribute('aria-pressed', V.view === 'console');
  }

  /* ---------- rendering ---------- */
  function screenKey() { return V.view + '|' + V.tab + '|' + V.screen + '|' + JSON.stringify(V.p) + '|' + V.chainSeg + '|' + V.afterCheckin + '|' + S().session.stage + '|' + V.onb + '|' + V.smsPhone; }
  function render() {
    var s = S();
    renderSteps();
    document.getElementById('stage').className = 'stage stage-' + (V.view === 'console' ? 'console' : 'operator') + (V.simOpen ? ' sim-open' : '');
    var main = document.getElementById('app-main'), keepTop = main ? main.scrollTop : 0;
    var key = screenKey(), same = key === lastScreenKey;
    var sheetWasOpen = !!document.querySelector('.sheet');
    var ae = document.activeElement, keepFocus = ae && ae !== document.body ? (ae.id ? '#' + ae.id : selectorFor(ae)) : null;

    var phone = document.getElementById('phone');
    if (V.view === 'operator') phone.innerHTML = window.Operator.render(s, V);
    else if (V.view === 'sms') phone.innerHTML = '<div class="screen">' + window.Operator.sbar(s) + '<main class="app-main" id="app-main">' + window.SmsView.render(s, V) + '</main><span class="homebar" aria-hidden="true"></span></div>';
    else phone.innerHTML = '';
    document.getElementById('console').innerHTML = V.view === 'console' ? window.Console.render(s, V) : '';
    document.getElementById('sim').innerHTML = V.view === 'console' ? '' : simPanel(s);

    main = document.getElementById('app-main');
    if (main) { main.setAttribute('tabindex', '-1'); if (same) main.scrollTop = keepTop; else { main.scrollTop = 0; if (lastScreenKey) main.focus({ preventScroll: true }); } }
    var msgs = document.getElementById('msgs'); if (msgs) msgs.scrollTop = msgs.scrollHeight;
    var sh = document.getElementById('sheet-title');
    if (sh && !sheetWasOpen) sh.focus();
    if (!sh && sheetWasOpen && lastFocus) { var back = document.querySelector(lastFocus); if (back) back.focus(); }
    if (same && keepFocus && !sh && !sheetWasOpen) { var kf = document.querySelector(keepFocus); if (kf) kf.focus({ preventScroll: true }); }
    scaleLabels();
    lastScreenKey = key;
    if (s.ui.animateEdge) { setTimeout(function () { s.ui.animateEdge = null; save(KEY, s); }, 900); }
    var persist = Object.assign({}, V); delete persist.sheet; delete persist.handoffPhoto; delete persist.orphanDraft;
    save(VKEY, persist);
  }
  // SVG text is drawn in viewBox units; keep it at 12 px or more on screen whatever the map's rendered size.
  function scaleLabels() {
    document.querySelectorAll('svg.map-svg, svg.const-svg').forEach(function (svg) {
      var vb = svg.viewBox && svg.viewBox.baseVal, w = svg.getBoundingClientRect().width;
      if (!vb || !w) return;
      var k = vb.width / w, dense = svg.classList.contains('map-svg') && w / vb.width < 0.45;
      svg.querySelectorAll('.map-label, .cn-label').forEach(function (t) { t.style.fontSize = (12.5 * k) + 'px'; t.style.display = dense && t.classList.contains('map-label') ? 'none' : ''; t.style.strokeWidth = (4 * k) + 'px'; });
      svg.querySelectorAll('.map-area, .map-o').forEach(function (t) { t.style.fontSize = (12 * k) + 'px'; });
    });
  }
  window.addEventListener('resize', scaleLabels);
  store.subscribe(render);

  /* ---------- navigation ---------- */
  function go(d) {
    V.view = 'operator';
    if (d.tab) V.tab = d.tab;
    if (d.screen === undefined || d.screen === '' || d.screen === 'null') { V.screen = null; V.stack = []; }
    else {
      if (V.screen) V.stack.push({ screen: V.screen, p: V.p, tab: V.tab });
      V.screen = d.screen;
    }
    V.p = { id: d.id, edge: d.edge };
    V.sheet = null; V.afterCheckin = false;
    if (d.screen === 'checkin') { var me = S().nodes[S().me]; V.ci = { step: me.checkin ? 0 : 1, operating: null, capacity: null, stock: [] }; }
    if (d.screen === 'orphanReport') V.orphanDraft = { photo: null, place: 'Raju Provisions, Shop 14, Old Market, Hadapsar', type: 'Stock in a closed premises', goods: 'Sona Masoori rice', qty: '40', unit: 'sacks', kgPer: '50', owner: 'raju', condition: 'Sacks sealed, dry, shutter locked' };
    if (d.screen === 'handoff') { V.handoffFallback = false; V.handoffPhoto = null; }
    if (d.screen === 'custody') V.custodyDraft = { use: 'Supply Hadapsar Community Kitchen', hours: 48 };
    render();
  }
  function back() {
    var prev = V.stack.pop();
    if (prev) { V.screen = prev.screen; V.p = prev.p; V.tab = prev.tab; } else V.screen = null;
    V.sheet = null; render();
  }
  function tab(t) { V.view = 'operator'; V.tab = t; V.screen = null; V.stack = []; V.sheet = null; V.afterCheckin = false; V.p = {}; V.handoffFallback = false; render(); }

  /* ---------- action handlers ---------- */
  var on = {
    view: function (d) { V.view = V.view === d.view ? 'operator' : d.view; V.sheet = null; if (V.view === 'console') V.seenConsole = true; render(); },
    jump: function (d) {
      if (d.to === 'sms') { V.view = 'sms'; V.sheet = null; render(); return; }
      if (!onboarded() && d.to !== 'today') { toast('Finish the invite, claim and check-in first. The other steps open after that.', true); V.view = 'operator'; render(); return; }
      if (d.to === 'task') { V.view = 'operator'; V.tab = 'tasks'; V.stack = []; V.screen = null; go({ tab: 'tasks', screen: 'task', id: 'T214' }); return; }
      tab(d.to);
    },
    tab: function (d) { tab(d.tab); },
    go: go, back: back,
    sheet: function (d, el) { lastFocus = selectorFor(el); V.sheet = Object.assign({}, d); render(); },
    closeSheet: function () { V.sheet = null; render(); },
    lang: function (d) { V.lang = d.lang; if (V.sheet && V.sheet.k === 'lang') V.sheet = null; render(); },
    onbPhone: function () { V.onb = 'phone'; render(); },
    claim: function () { if (result(run('claimNode', {}), 'Node claimed').ok) { V.ci = { step: 1, operating: null, capacity: null, stock: [] }; render(); } },
    ciOperating: function (d) { V.ci.operating = d.v === '1'; if (V.ci.operating) V.ci.step = 2; render(); },
    ciCap: function (d) { V.ci.capacity = Number(d.v); render(); },
    ciStep: function (d) { V.ci.step = Number(d.step); render(); },
    ciQty: function (d) { var i = Number(d.i), step = { 0: 2, 1: 20, 2: 5, 3: 1 }[i]; V.ci.stock[i] = Math.max(0, (V.ci.stock[i] || 0) + Number(d.d) * step); render(); },
    ciConfirm: function (d) {
      var stock = d.skip ? [] : window.Operator.QUICK.map(function (q, i) { return { what: q[0], qty: V.ci.stock[i] || 0, unit: q[1] }; });
      var r = result(run('checkIn', { operating: V.ci.operating !== false, capacity: V.ci.operating === false ? 0 : V.ci.capacity, stock: stock }), 'Status confirmed');
      if (r.ok) { V.screen = null; V.stack = []; V.afterCheckin = true; render(); }
    },
    sameAsYesterday: function () { if (result(run('sameAsYesterday', {}), 'Status confirmed').ok) { V.screen = null; render(); } },
    openLink: function (d, el) { lastFocus = selectorFor(el); V.sheet = { k: 'openLink', edge: d.edge }; render(); },
    cnSel: function (d) { V.cnSel = d.edge; render(); var el = document.querySelector('.inspector'); if (el) el.scrollIntoView({ block: 'nearest' }); },
    proposeLink: function (d) { if (result(run('proposeLink', { edgeId: d.edge, to: d.to }), 'Link proposed').ok) { V.sheet = null; V.screen = null; V.stack = []; V.tab = 'chain'; V.chainSeg = 'links'; V.cnSel = d.edge; render(); } },
    respond: function (d) {
      var pr = S().proposals.filter(function (x) { return x.id === d.id; })[0];
      var r = result(run('respondProposal', { id: d.id, accept: d.accept === '1' }), d.accept === '1' ? 'Link accepted. Corridor re-linked.' : 'Link declined');
      if (r.ok) { V.view = 'operator'; V.sheet = null; V.screen = null; V.stack = []; V.tab = 'chain'; V.chainSeg = 'links'; V.cnSel = pr ? pr.replaces : null; render(); }
    },
    cantReach: function (d) { if (result(run('reportCantReach', { node: d.node }), 'Report recorded').ok) render(); },
    acceptTask: function (d) { result(run('acceptTask', { id: d.id })); },
    declineTask: function (d) { if (result(run('declineTask', { id: d.id, reason: d.reason })).ok) { V.sheet = null; back(); } },
    legStep: function (d) { result(run('legStep', { id: d.id, step: d.step })); },
    fallback: function (d) { V.handoffFallback = d.on === '1'; render(); },
    demoPhoto: function (d) {
      var src = U.demoPhoto('Geotagged ' + R.clock(S().now));
      if (d.key === 'orphan') { captureOrphanForm(); V.orphanDraft.photo = src; } else V.handoffPhoto = src;
      render();
    },
    askAnchor: function (d) { result(run('askAnchor', { id: d.id }), 'Ravi Agencies asked to review'); },
    settle: function (d) { result(run('settle', { id: d.id })); },
    dispute: function (d) { result(run('dispute', { id: d.id })); },
    returnCustody: function (d) { if (result(run('returnCustody', { id: d.id })).ok) { V.sheet = null; render(); } },
    pauseNow: function () { if (result(run('checkIn', { operating: false }), 'Recorded as not operating').ok) { V.sheet = null; V.screen = null; V.tab = 'today'; render(); } },
    helpCall: function () { toast('Call requested from Ravi Agencies. Calls are simulated in this demo.'); },
    readAloud: function (d) {
      var text = window.Operator.readAloudText(S(), d.id, !!d.handoff);
      if (window.speechSynthesis && window.SpeechSynthesisUtterance) { window.speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = 'en-IN'; window.speechSynthesis.speak(u); toast('Reading aloud'); }
      else toast('Read-aloud is not available in this browser.', true);
    },
    sosKey: function (d, el, ev) { if (ev && ev.detail === 0) { V.sheet = { k: 'sos', id: V.p.id }; render(); } else if (!sosJustSent) toast('Press and hold SOS for 2 seconds to send it.'); },
    sosSend: function () { result(run('sos', { task: V.p.id }), 'SOS sent to Pune district relief cell and task neighbours (simulated).'); V.sheet = null; render(); },
    conPage: function (d) { V.con.page = d.v; V.con.sel = null; render(); },
    mapSel: function (d) { V.con.sel = d.kind ? { kind: d.kind, id: d.id } : null; render(); },
    chainSeg: function (d) { V.chainSeg = d.v; render(); },
    smsPhone: function (d) { V.smsPhone = d.v; render(); },
    smsKey: function (d) { store.sms(V.smsPhone, d.v); },
    simOpen: function () { V.simOpen = !V.simOpen; render(); },
    simLeg: function (d) { result(run('simCarrierStep', { id: d.id, leg: Number(d.leg) })); },
    simAttest: function (d) { result(run('attest', { id: d.id, node: d.node, answer: d.answer, reason: d.reason }), R.nameOf(S(), d.node) + ' answered'); },
    simHandoffAttest: function (d) { result(run('attestHandoff', { id: d.id, yes: d.yes === '1' })); },
    simProposal: function (d) { V.view = 'operator'; V.simOpen = false; lastFocus = null; V.sheet = { k: 'linkRequest', id: d.id }; render(); },
    simAdvance: function () { result(run('advance', { mins: 60 })); },
    simKaveri: function () { V.view = 'sms'; V.smsPhone = 'kaveri'; V.simOpen = false; render(); },
    reset: function () {
      if (!window.confirm('Reset the demo to Day 1, 14:20? All changes are cleared.')) return;
      var lang = V.lang; V = Object.assign(freshView(), { lang: lang }); lastScreenKey = ''; store.replace(window.RelayData.seed()); toast('Demo reset to Day 1, 14:20');
    }
  };
  var sosJustSent = false, holdTimer = null;

  function selectorFor(el) {
    if (!el || !el.getAttribute) return null;
    var a = el.getAttribute('data-a'); if (!a) return null;
    var sel = '[data-a="' + a + '"]';
    ['data-edge', 'data-id', 'data-k', 'data-to'].forEach(function (k) { var v = el.getAttribute(k); if (v) sel += '[' + k + '="' + v.replace(/"/g, '') + '"]'; });
    return sel;
  }
  function captureOrphanForm() {
    var f = document.querySelector('form[data-form="reportOrphan"]'); if (!f || !V.orphanDraft) return;
    var fd = new FormData(f); ['place', 'type', 'goods', 'qty', 'unit', 'kgPer', 'owner', 'condition'].forEach(function (k) { if (fd.get(k) != null) V.orphanDraft[k] = fd.get(k); });
  }

  /* ---------- forms ---------- */
  var forms = {
    verifyPhone: function (fd) { V.draft.phone = fd.get('phone'); V.draft.code = fd.get('code'); var r = result(run('verifyPhone', { phone: fd.get('phone'), code: fd.get('code') }), 'Phone verified'); if (r.ok) { V.draft = {}; render(); } },
    editNode: function (fd) { if (result(run('claimNode', { name: fd.get('name'), area: fd.get('area'), vehicles: fd.get('vehicles') }), 'Details saved').ok) { V.sheet = null; V.ci = { step: 1, stock: [] }; render(); } },
    selfCreate: function (fd) { if (result(run('selfCreate', { name: fd.get('name'), role: fd.get('role'), area: fd.get('area'), product: fd.get('product') }), 'Node created').ok) { V.sheet = null; V.ci = { step: 1, stock: [] }; render(); } },
    reportOrphan: function (fd) {
      captureOrphanForm();
      var r = result(run('reportOrphan', { type: fd.get('type'), goods: String(fd.get('goods') || ''), qty: fd.get('qty'), unit: fd.get('unit'), owner: fd.get('owner') || null, ownerText: fd.get('owner') ? '' : 'Owner not known',
        place: fd.get('place'), condition: fd.get('condition'), photo: V.orphanDraft.photo, kgPer: fd.get('kgPer') }), 'Orphan reported');
      if (r.ok) { V.screen = 'custody'; V.p = { id: r.id }; render(); }
    },
    requestCustody: function (fd) {
      V.custodyDraft = { use: fd.get('use'), hours: Number(fd.get('hours')) };
      result(run('requestCustody', { orphan: V.p.id, use: fd.get('use'), hours: fd.get('hours') }), 'Custody requested');
    },
    handoffCode: function (fd, f) { result(run('confirmHandoff', { id: f.getAttribute('data-id'), method: 'code', code: String(fd.get('code') || '').trim() }), 'Handoff confirmed'); },
    handoffFallback: function (fd, f) {
      var id = f.getAttribute('data-id');
      var r = result(run('confirmHandoff', { id: id, method: 'fallback', photo: V.handoffPhoto, attestor: fd.get('attestor') }));
      if (r.ok) { V.handoffFallback = false; go({ tab: 'tasks', screen: 'task', id: id }); }
    },
    postNeed: function (fd) {
      if (result(run('postNeed', { what: fd.get('what'), qty: fd.get('qty'), unit: fd.get('unit'), by: Number(fd.get('by')), tier: fd.get('tier'), kind: 'goods' }), 'Need posted').ok) { V.sheet = null; V.screen = null; V.tab = 'chain'; V.chainSeg = 'needs'; render(); }
    },
    release: function (fd, f) { if (result(run('recordRelease', { id: f.getAttribute('data-id'), qty: fd.get('qty'), to: fd.get('to') }), 'Release recorded').ok) { V.sheet = null; render(); } },
    smsSend: function (fd) { var t = String(fd.get('text') || ''); if (!t.trim()) return; store.sms(V.smsPhone, t); var i = document.getElementById('sms-in'); if (i) i.focus(); }
  };

  /* ---------- simulation panel ---------- */
  function simPanel(s) {
    var me = s.me, out = [];
    function block(title, body) { out.push('<div class="sim-b"><h3 class="h3">' + title + '</h3>' + body + '</div>'); }
    function b(label, a, data, kind) { return '<button type="button" class="btn btn-' + (kind || 'secondary') + ' btn-sm" data-a="' + a + '"' + Object.keys(data || {}).map(function (k) { return ' data-' + k + '="' + h(data[k]) + '"'; }).join('') + '>' + h(label) + '</button>'; }
    var t214 = R.task(s, 'T214');
    var steps = [
      ['Claim the node', !!s.nodes.joshi.claimed],
      ['Check in: operating, half capacity', !!s.nodes.joshi.checkin],
      ['Propose a substitute for Kaveri', s.proposals.length > 0],
      ['Substitute accepts; corridor re-links', s.edges.some(function (e) { return e.replaces; })],
      ['Accept Tier 0 insulin task T214', t214 && t214.status !== 'offered'],
      ['Confirm both handoffs (one by photo fallback)', t214 && t214.status === 'delivered'],
      ['Report the rice orphan, request custody', s.custody.length > 0],
      ['Attestations answered; custody issued', s.custody.some(function (c) { return c.status === 'active' || c.status === 'returned'; })],
      ['IOUs visible in the ledger', s.obligations.some(function (i) { return i.from === 'joshi' || i.to === 'joshi'; })],
      ['Open the console', !!V.seenConsole],
      ['Accept a task by SMS', s.tasks.some(function (x) { return x.acceptedVia === 'SMS'; })]
    ];
    block('Demo steps', '<ol class="demo-steps">' + steps.map(function (st) { return '<li class="' + (st[1] ? 'done' : '') + '">' + (st[1] ? icon('checkc', 'Done', 16) : '<span class="dot" aria-hidden="true"></span>') + h(st[0]) + '</li>'; }).join('') + '</ol>');
    block('Clock', '<p class="sim-p"><strong>' + R.dayTime(s.now) + '</strong>. Actions move the clock by realistic amounts.</p>' + b('Move clock 1 hour', 'simAdvance'));
    if (s.session.stage === 'invite') block('SMS to ' + h(s.nodes.joshi.phone), '<p class="sim-p">Your Relay code is <strong>482913</strong>. Simulated OTP.</p>');
    s.proposals.filter(function (p) { return p.status === 'pending'; }).forEach(function (p) {
      block(h(R.nameOf(s, p.to)), '<p class="sim-p">Received your link request ' + R.ago(s, p.at) + '.</p>' + b('Open their screen', 'simProposal', { id: p.id }, 'primary') + b('Decline for them', 'respond', { id: p.id, accept: 0 }));
    });
    s.tasks.filter(function (t) { return t.status === 'accepted' || t.status === 'in_progress'; }).forEach(function (t) {
      t.legs.forEach(function (l) {
        if (!l.carrier || l.carrier === me || l.status === 'handed_over') return;
        var body = '<p class="sim-p">Status: ' + h(l.status.replace(/_/g, ' ')) + '.</p>';
        if (l.status === 'assigned') body += b('Report pickup at ' + R.nameOf(s, l.from), 'simLeg', { id: t.id, leg: l.n });
        else if (l.status === 'picked_up') body += b('Report arrival at ' + R.nameOf(s, l.to), 'simLeg', { id: t.id, leg: l.n });
        else if (l.status === 'at_handoff') body += '<p class="sim-p">Driver shows code <strong>' + l.code + '</strong>. Enter it on the handoff screen.</p>';
        block(h(R.nameOf(s, l.carrier) + ' driver, task ' + t.id + ' leg ' + l.n), body);
      });
      var ns = R.nextStep(s, t);
      if (ns && ns.step === 'handoff' && s.nodes[ns.leg.to]) block(h(R.nameOf(s, ns.leg.to)), '<p class="sim-p">Receiver shows code <strong>' + ns.leg.code + '</strong>. Or use "Other person unavailable" for the photo fallback.</p>');
    });
    s.handoffs.filter(function (x) { return x.status === 'awaiting_attestation'; }).forEach(function (x) {
      block(h(R.nameOf(s, x.attestor)), '<p class="sim-p">Asked to confirm the handoff for task ' + h(x.task) + ' at ' + h(x.place) + '.</p>' + b('Confirm handoff', 'simHandoffAttest', { id: x.id, yes: 1 }, 'primary') + b('Cannot confirm', 'simHandoffAttest', { id: x.id, yes: 0 }));
    });
    s.custody.filter(function (c) { return c.status === 'awaiting'; }).forEach(function (c) {
      c.attestors.filter(function (a) { return !a.answer; }).forEach(function (a) {
        var reason = a.node === 'meena' ? 'Shutter locked since Day 1 morning, phone switched off' : a.node === 'mandi' ? 'Shop 14 closed, no trader has seen the owner' : a.node === 'ravi' ? 'No reply to anchor calls since the Snap' : 'Shop closed, no one answers';
        block(h(R.nameOf(s, a.node)) + (a.anchor ? ' (anchor)' : ''), '<p class="sim-p">Asked: has ' + h(R.ownerName(s, c)) + ' been unreachable since Day 1?</p>' +
          b('Yes, I confirm', 'simAttest', { id: c.id, node: a.node, answer: 'yes', reason: reason }, 'primary') + b('No, they are reachable', 'simAttest', { id: c.id, node: a.node, answer: 'no', reason: 'Saw the owner this morning' }) + b('I am not sure', 'simAttest', { id: c.id, node: a.node, answer: 'unsure', reason: '' }));
      });
    });
    if (!R.isOperating(R.nodeState(s, 'kaveri'))) block('Kaveri Cold Chain Transport', '<p class="sim-p">Has not replied since ' + R.stamp(s, s.nodes.kaveri.pingedAt) + '. To test self-reactivation, reply from their phone.</p>' + b('Reply as Kaveri by SMS', 'simKaveri'));
    block('Device', '<label class="chk"><input type="checkbox" data-setting="offline"' + (s.settings.offline ? ' checked' : '') + '>No data connection</label>');
    return '<div class="sim-head"><h2 class="h2">Simulation</h2><button type="button" class="icon-btn sim-close" data-a="simOpen" aria-label="Close simulation panel">' + icon('cross', null, 18) + '</button></div><p class="sim-intro">Counterparts and devices that are not you. These controls are not part of the product.</p>' + out.join('');
  }

  /* ---------- wiring ---------- */
  function data(el) { var d = {}; Array.prototype.forEach.call(el.attributes, function (a) { if (a.name.indexOf('data-') === 0) d[a.name.slice(5)] = a.value; }); return d; }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-a]'); if (!el || el.disabled) return;
    var a = el.getAttribute('data-a'); if (!on[a]) return;
    ev.preventDefault();
    on[a](data(el), el, ev);
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target.closest('form[data-form]'); if (!f) return;
    ev.preventDefault();
    forms[f.getAttribute('data-form')](new FormData(f), f);
  });
  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.matches('[data-setting]')) { result(run('setting', { key: el.getAttribute('data-setting'), value: el.checked }), false); return; }
    if (el.matches('[data-layer]')) { V.con.layers[el.getAttribute('data-layer')] = el.checked; render(); return; }
    if (el.matches('[data-con]')) { V.con[el.getAttribute('data-con')] = el.value; V.con.sel = null; render(); return; }
    if (el.matches('[data-photo]') && el.files && el.files[0]) {
      var key = el.getAttribute('data-photo'), reader = new FileReader();
      if (key === 'orphan') captureOrphanForm();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = 160; c.height = 160;
          var k = Math.max(160 / img.width, 160 / img.height), w = img.width * k, hh = img.height * k;
          c.getContext('2d').drawImage(img, (160 - w) / 2, (160 - hh) / 2, w, hh);
          var src = c.toDataURL('image/jpeg', 0.7);
          if (key === 'orphan') V.orphanDraft.photo = src; else V.handoffPhoto = src;
          render();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(el.files[0]);
    }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && V.sheet) { V.sheet = null; render(); return; }
    if (ev.key === 'Escape' && V.simOpen) { V.simOpen = false; render(); return; }
    var el = ev.target;
    if ((ev.key === 'Enter' || ev.key === ' ') && el.getAttribute && el.getAttribute('role') === 'button' && el.tagName !== 'BUTTON') { ev.preventDefault(); var a = el.getAttribute('data-a'); if (on[a]) on[a](data(el), el, ev); }
    if (ev.key === 'Tab' && V.sheet) {
      var sheet = document.querySelector('.sheet'); if (!sheet) return;
      var f = sheet.querySelectorAll('button, input, select, textarea, [tabindex="-1"]'); var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('pointerdown', function (ev) {
    var el = ev.target.closest('[data-hold="sos"]'); if (!el) return;
    el.classList.add('holding');
    holdTimer = setTimeout(function () { el.classList.remove('holding'); sosJustSent = true; setTimeout(function () { sosJustSent = false; }, 800); on.sosSend(); }, 2000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) {
    document.addEventListener(t, function () { clearTimeout(holdTimer); var el = document.querySelector('.holding'); if (el) el.classList.remove('holding'); }, true);
  });

  render();
})();
