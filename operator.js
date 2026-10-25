/* Operator app, Obsidian Kinetic skin. Same screens and rules as before; layout follows design/DESIGN.md and the Stitch mockup. */
(function (root) {
  'use strict';
  var R = root.Relay, U = root.UI, h = U.h, icon = U.icon;

  var T = {
    hi: { Today: 'आज', Chain: 'चेन', Tasks: 'काम', Handoff: 'सौंपना', Ledger: 'खाता', 'Are you operating today?': 'क्या आप आज काम कर रहे हैं?',
      'How much of your normal capacity do you have?': 'आपके पास सामान्य क्षमता का कितना हिस्सा है?', 'What do you hold and what do you need?': 'आपके पास क्या है और आपको क्या चाहिए?',
      Yes: 'हाँ', No: 'नहीं', None: 'कुछ नहीं', 'A quarter': 'एक चौथाई', Half: 'आधी', Full: 'पूरी', 'Confirm status': 'स्थिति की पुष्टि करें', Next: 'आगे' },
    mr: { Today: 'आज', Chain: 'साखळी', Tasks: 'कामे', Handoff: 'हस्तांतर', Ledger: 'खातेवही', 'Are you operating today?': 'आज तुमचे काम सुरू आहे का?',
      'How much of your normal capacity do you have?': 'तुमच्याकडे नेहमीच्या क्षमतेपैकी किती आहे?', 'What do you hold and what do you need?': 'तुमच्याकडे काय आहे आणि काय हवे आहे?',
      Yes: 'हो', No: 'नाही', None: 'काहीच नाही', 'A quarter': 'पाव', Half: 'अर्धी', Full: 'पूर्ण', 'Confirm status': 'स्थिती निश्चित करा', Next: 'पुढे' }
  };
  var LANGS = [['en', 'English'], ['hi', 'हिन्दी'], ['mr', 'मराठी']];
  var V;
  function t(k) { return (T[V.lang] && T[V.lang][k]) || k; }

  /* ---------- builders ---------- */
  function da(o) { return Object.keys(o || {}).map(function (k) { return ' data-' + k + '="' + h(o[k]) + '"'; }).join(''); }
  function btn(label, a, data, kind, extra, ic) {
    return '<button type="button" class="btn btn-' + (kind || 'secondary') + '" data-a="' + a + '"' + da(data) + (extra || '') + '>' + (ic ? icon(ic, null, 18) : '') + h(label) + '</button>';
  }
  function textBtn(label, a, data) { return '<button type="button" class="btn-text" data-a="' + a + '"' + da(data) + '>' + h(label) + '</button>'; }
  var DOT = { green: 'd-green', yellow: 'd-yellow', red: 'd-red', blue: 'd-blue', grey: 'd-grey', none: 'd-none' };
  function item(o) {
    var tagName = o.a ? 'button type="button"' : 'div';
    return '<' + tagName + ' class="item"' + (o.a ? ' data-a="' + o.a + '"' + da(o.data) : '') + (o.label ? ' aria-label="' + h(o.label) + '"' : '') + '>' +
      '<span class="item-dot ' + (DOT[o.tone || 'none']) + '" aria-hidden="true"></span><span class="item-main"><span class="item-title">' + o.title + '</span>' + (o.sub ? '<span class="item-sub">' + o.sub + '</span>' : '') + (o.extra || '') + '</span>' +
      (o.right ? '<span class="item-right">' + o.right + '</span>' : '') + '</' + (o.a ? 'button' : 'div') + '>';
  }
  var TONE = { active: 'green', reduced: 'yellow', unknown: 'grey', not_operating: 'grey', probably_gone: 'red', gone: 'red', proposed: 'blue' };
  function secH(title, right) { return '<div class="sec-h"><p class="eyebrow">' + title + '</p>' + (right || '') + '</div>'; }
  function empty(text, action) { return '<div class="empty"><p>' + h(text) + '</p>' + (action || '') + '</div>'; }
  function hm(mins) { mins = Math.max(0, Math.round(mins)); return Math.floor(mins / 60) + 'h ' + (mins % 60 < 10 ? '0' : '') + (mins % 60) + 'm'; }
  function left(s, m) { var d = m - s.now; return d > 0 ? R.dur(d) + ' left' : 'window passed'; }
  function nodeLine(s, id) { var n = s.nodes[id]; return n ? h(n.name) + ', ' + h(n.area) : h(R.nameOf(s, id)); }
  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1); }
  function kv(k, v) { return '<div><dt>' + h(k) + '</dt><dd>' + v + '</dd></div>'; }
  function short(o) { var g = (o.goods || o.what).replace(' (cold chain)', ''); return o.kgPer && o.qty * o.kgPer >= 1000 ? R.num(o.qty * o.kgPer / 1000) + ' tonnes ' + g : R.num(o.qty) + ' ' + o.unit + ' ' + g; }

  /* ---------- status bar, header, nav ---------- */
  function sbar(s) {
    var t0 = R.rankedTasks(s, ['offered', 'accepted', 'in_progress']).filter(function (x) { return R.taskTier(s, x) === 0 && x.by > s.now; })[0];
    var island = t0 ? '<span class="island" aria-label="Tier 0 run, ' + h(R.dur(t0.by - s.now)) + ' left"><span class="pdot" style="color:#EF4444" aria-hidden="true"></span><span class="rd">Tier 0 run</span><span class="sep"></span>' + hm(t0.by - s.now) + '</span>' : '<span></span>';
    return '<div class="sbar"><span class="num">' + R.clock(s.now) + '</span>' + island + '<span class="sbar-r">' + (s.settings.offline ? 'SMS ONLY' : '2G EDGE') + icon('signal', null, 16) + icon('battery', null, 16) + '</span></div>';
  }
  function header(s) {
    var me = s.nodes[s.me], st = R.nodeState(s, s.me);
    if (V.screen) {
      var title = { checkin: 'Status check-in', subs: 'Substitute finder', task: 'Task ' + (V.p.id || ''), handoff: 'Handoff', orphanReport: 'Report an orphan', custody: 'Custody request', custodyDetail: 'Custody record', settings: 'Settings and help' }[V.screen] || '';
      return '<div class="subhead"><button type="button" class="icon-btn" data-a="back" aria-label="Back">' + icon('back') + '</button><span class="subhead-t">' + h(title) + '</span>' +
        '<button type="button" class="icon-btn" data-a="sheet" data-k="lang" aria-label="Language: change">' + icon('language', null, 18) + '</button></div>';
    }
    var capChip = !me.checkin ? '<button type="button" class="chip chip-grey chip-btn" data-a="go" data-screen="checkin">Not checked in</button>'
      : R.isOperating(st) ? '<button type="button" class="chip chip-emerald chip-sm chip-btn" data-a="go" data-screen="checkin" aria-label="Operating at ' + Math.round(me.checkin.capacity * 100) + '% capacity. Update status"><span class="pdot" aria-hidden="true"></span>' + Math.round(me.checkin.capacity * 100) + '% active</button>'
        : '<button type="button" class="chip chip-grey chip-btn" data-a="go" data-screen="checkin">Not operating</button>';
    return '<div class="nodehead"><span class="avatar">' + icon('truck', null, 22) + '</span><div class="nh-text"><div class="nh-name">' + h(me.name) + (me.verification === 'anchor' ? icon('verified', 'Anchor-verified', 16) : '') + '</div>' +
      '<div class="nh-sub">' + h(me.area) + (me.code ? ' · ' + h(me.code) : '') + '</div></div>' + capChip + '</div>';
  }
  function bnav(s) {
    var t0 = R.rankedTasks(s, ['offered']).some(function (x) { return R.taskTier(s, x) === 0; });
    var due = s.tasks.some(function (x) { var ns = R.nextStep(s, x); return ns && (ns.step === 'receive' || ns.step === 'handoff'); });
    function b(tab, label, ic, center) {
      var on = V.tab === tab && !V.screen || (V.screen === 'task' && tab === 'tasks') || (V.screen === 'handoff' && tab === 'handoff');
      return '<button type="button" class="bn' + (center ? ' bn-center' + (t0 ? ' alert' : '') : '') + (on ? ' on' : '') + '" data-a="tab" data-tab="' + tab + '"' + (on ? ' aria-current="page"' : '') + ' aria-label="' + h(t(label)) + (center && t0 ? ', Tier 0 task waiting' : '') + (tab === 'handoff' && due ? ', handoff due' : '') + '">' +
        (center ? '<span class="bn-c">' + icon(ic, null, 22) + '</span>' : icon(ic, null, 22) + '<span>' + h(t(label)) + '</span>') + (tab === 'handoff' && due ? '<span class="bn-badge" aria-hidden="true"></span>' : '') + '</button>';
    }
    return '<nav class="bnav" aria-label="Main">' + b('today', 'Today', 'dashboard') + b('chain', 'Chain', 'hub') + b('tasks', 'Tasks', 'truck', true) + b('handoff', 'Handoff', 'qr') + b('ledger', 'Ledger', 'receipt') + '</nav>';
  }
  function banners(s) {
    var out = '', me = s.nodes[s.me];
    if (s.settings.offline) out += '<div class="banner banner-grey" role="status">' + icon('sms', null, 18) + 'No data connection. Actions will be sent by SMS.</div>';
    if (me.checkin && s.now - me.checkin.at >= 180) out += '<div class="banner banner-yellow">' + icon('clock', null, 18) + '<span>Your status is ' + R.dur(s.now - me.checkin.at) + ' old.</span>' + textBtn('Update', 'go', { screen: 'checkin' }) + '</div>';
    return out;
  }

  /* ---------- onboarding A1 to A3 ---------- */
  function invite() {
    return '<div class="onb"><div class="card card-emerald"><p class="kicker"><span class="chip chip-emerald">' + icon('sms', null, 14) + 'Invite</span></p><h1 class="h1">Ravi Agencies invited you</h1>' +
      '<p class="lead">Find out who in your supply chain is still operating, and keep goods moving.</p>' +
      '<fieldset class="field"><legend>Language</legend><div class="opts opts-3">' + LANGS.map(function (l) {
        return '<button type="button" class="opt' + (V.lang === l[0] ? ' sel' : '') + '" data-a="lang" data-lang="' + l[0] + '" aria-pressed="' + (V.lang === l[0]) + '">' + h(l[1]) + '</button>';
      }).join('') + '</div></fieldset><p class="fine">Relay works by app and by SMS. Messages in this prototype are simulated.</p></div>' +
      '<div class="foot">' + btn('Continue', 'onbPhone', null, 'primary') + '</div></div>';
  }
  function phone() {
    return '<form class="onb" data-form="verifyPhone"><div class="card"><p class="eyebrow">Step 1 · Identity</p><h1 class="h1">Verify your phone</h1><p class="lead">We send a six-digit code by SMS. No password.</p>' +
      '<label class="field"><span class="flabel">Mobile number</span><input name="phone" inputmode="tel" autocomplete="tel" value="' + h(V.draft.phone || '+91 98220 47613') + '" required></label>' +
      '<label class="field"><span class="flabel">Six-digit code</span><input name="code" inputmode="numeric" maxlength="6" pattern="\\d{6}" autocomplete="one-time-code" value="' + h(V.draft.code || '') + '" required></label>' +
      '<p class="fine">' + icon('sms', null, 14) + 'Simulated SMS: the code is in the Simulation panel.</p></div>' +
      '<div class="foot"><button class="btn btn-primary" type="submit">Verify phone</button></div></form>';
  }
  function claim(s) {
    var me = s.nodes[s.me], links = R.myLinks(s);
    return '<div class="onb"><div class="card card-sky"><p class="eyebrow">Pre-built from partner records</p><h1 class="h1">Is this you?</h1><p class="lead">We think you are <strong>' + h(me.name) + '</strong>, a ' + h(me.role) + ' at ' + h(me.area) + ' serving ' + links.length + ' partners. Is this correct?</p>' +
      U.verif(me) + '<details class="disclose"><summary>Show the ' + links.length + ' partners</summary><ul class="plain">' + links.map(function (l) {
        return '<li>' + h(s.nodes[l.other].name) + '<span class="muted">, ' + h(l.edge.product.toLowerCase()) + '</span></li>';
      }).join('') + '</ul></details></div>' +
      '<div class="foot">' + btn('Yes, this is me', 'claim', null, 'primary') + btn('No, change details', 'sheet', { k: 'editNode' }) + textBtn('I am not in this list', 'sheet', { k: 'selfCreate' }) + '</div></div>';
  }

  /* ---------- A5 check-in ---------- */
  var CAPS = [[0, 'None'], [0.25, 'A quarter'], [0.5, 'Half'], [1, 'Full']];
  var QUICK = [['Cold boxes, insulated', 'boxes'], ['Diesel', 'litre'], ['Rice', 'sacks'], ['Free dry storage', 'tonne']];
  function capGlyph(c) { return '<span class="capg" aria-hidden="true"><i style="width:' + c * 100 + '%"></i></span>'; }
  function checkin(s) {
    var me = s.nodes[s.me], ci = V.ci;
    if (ci.step === 0 && me.checkin) {
      return '<div class="onb"><div class="card"><p class="eyebrow">Daily check-in</p><h1 class="h1">Same as your last check-in?</h1>' +
        item({ tone: me.checkin.operating ? (me.checkin.capacity >= 1 ? 'green' : 'yellow') : 'grey', title: me.checkin.operating ? 'Operating, ' + R.capWord(me.checkin.capacity).toLowerCase() + ' capacity' : 'Not operating', sub: 'Last confirmed ' + R.ago(s, me.checkin.at) + ' (' + R.stamp(s, me.checkin.at) + ')' }) + '</div>' +
        '<div class="foot">' + btn(Math.floor(me.checkin.at / 1440) === Math.floor(s.now / 1440) ? 'Same as last check-in' : 'Same as yesterday', 'sameAsYesterday', null, 'primary') + btn('Change', 'ciStep', { step: 1 }) + '</div></div>';
    }
    var step = Math.max(ci.step, 1), body = '';
    if (step === 1) {
      body = '<h1 class="h1">' + t('Are you operating today?') + '</h1><div class="opts opts-big">' +
        '<button type="button" class="opt' + (ci.operating === true ? ' sel' : '') + '" data-a="ciOperating" data-v="1">' + icon('check', null, 28) + t('Yes') + '</button>' +
        '<button type="button" class="opt' + (ci.operating === false ? ' sel' : '') + '" data-a="ciOperating" data-v="0">' + icon('cross', null, 28) + t('No') + '</button></div>';
    } else if (step === 2) {
      body = '<h1 class="h1">' + t('How much of your normal capacity do you have?') + '</h1><p class="lead">You run ' + R.fleet(s).total + ' ' + R.fleet(s).label.toLowerCase() + 's in normal times.</p><div class="opts opts-cap">' + CAPS.map(function (c) {
        return '<button type="button" class="opt' + (ci.capacity === c[0] ? ' sel' : '') + '" data-a="ciCap" data-v="' + c[0] + '" aria-pressed="' + (ci.capacity === c[0]) + '">' + capGlyph(c[0]) + '<span>' + t(c[1]) + '</span>' + (ci.capacity === c[0] ? icon('check', null, 20) : '') + '</button>';
      }).join('') + '</div>';
    } else {
      body = '<h1 class="h1">' + t('What do you hold and what do you need?') + '</h1><p class="lead">Add what you hold now. You can skip this.</p>' +
        QUICK.map(function (q, i) {
          var v = ci.stock[i] || 0;
          return '<div class="qrow"><span class="qlabel">' + h(q[0]) + '</span><span class="stepper"><button type="button" class="icon-btn" data-a="ciQty" data-i="' + i + '" data-d="-1" aria-label="Less ' + h(q[0]) + '">' + icon('minus', null, 18) + '</button>' +
            '<output class="num" aria-live="polite">' + R.num(v) + '</output><button type="button" class="icon-btn" data-a="ciQty" data-i="' + i + '" data-d="1" aria-label="More ' + h(q[0]) + '">' + icon('plus', null, 18) + '</button></span><span class="qunit">' + h(q[1]) + '</span></div>';
        }).join('');
    }
    var nextOk = (step === 1 && ci.operating != null) || (step === 2 && ci.capacity != null);
    var foot = step === 3 || (step === 1 && ci.operating === false)
      ? btn(t('Confirm status'), 'ciConfirm', null, 'primary') + (step === 3 ? textBtn('Skip', 'ciConfirm', { skip: 1 }) : '')
      : '<button type="button" class="btn btn-primary" data-a="ciStep" data-step="' + (step + 1) + '"' + (nextOk ? '' : ' disabled') + '>' + t('Next') + '</button>';
    return '<div class="onb"><p class="progress">Step ' + step + ' of 3</p>' + body + '<div class="foot">' + foot + (step > 1 ? textBtn('Back', 'ciStep', { step: step - 1 }) : '') + '</div></div>';
  }
  function afterCheckin(s) {
    var me = s.nodes[s.me], st = R.nodeState(s, s.me);
    var broken = R.brokenLinks(s).filter(function (b) { return b.side === 'up'; })[0];
    if (R.isOperating(st) && broken) {
      var sub = R.substitutes(s, broken.edgeId), n = sub.candidates.length;
      return '<div class="onb"><p class="ok-line">' + icon('checkc') + 'Status confirmed</p><h1 class="h1">You are operating at ' + R.capWord(me.checkin.capacity).toLowerCase() + ' capacity</h1>' +
        secH('First result for you') + '<div class="card card-amber"><div class="card-top"><span class="chip chip-amber">Corridor severed</span><span class="num muted">No reply: ' + hm(R.silenceMins(s, s.nodes[broken.id])) + '</span></div>' +
        '<h2 class="h2">' + h(s.nodes[broken.id].name) + ' has not replied in ' + R.dur(R.silenceMins(s, s.nodes[broken.id])) + '.</h2><p class="card-desc">' + (n ? n + ' nodes can supply this. Closest is ' + Math.min.apply(null, sub.candidates.map(function (c) { return c.dist; })) + ' km away.' : 'No substitute within reach yet.') + '</p></div>' +
        '<div class="foot">' + btn('Find a substitute', 'go', { tab: 'chain', screen: 'subs', edge: broken.edgeId }, 'primary', '', 'split') + btn('Go to Today', 'tab', { tab: 'today' }) + '</div></div>';
    }
    return '<div class="onb"><p class="ok-line">' + icon('checkc') + 'Status confirmed</p><h1 class="h1">' + (R.isOperating(st) ? 'Status confirmed' : 'Recorded as not operating today') + '</h1>' +
      (R.isOperating(st) ? '' : '<p class="lead">Partners will see this. Tasks will not be offered to you.</p>') + '<div class="foot">' + btn('Go to Today', 'tab', { tab: 'today' }, 'primary') + '</div></div>';
  }

  /* ---------- A6 Today ---------- */
  function ring(linked, broken, total) {
    var r = 46, c = 2 * Math.PI * r, g = total ? linked / total : 0, b = total ? broken / total : 0;
    return '<div class="ring" role="img" aria-label="' + linked + ' of ' + total + ' links live, ' + broken + ' broken"><svg width="120" height="120" viewBox="0 0 120 120">' +
      '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"/>' +
      '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#10B981" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (c * g - 4) + ' ' + c + '" class="glow-g"/>' +
      (b ? '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="#EF4444" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + Math.max(c * b - 6, 2) + ' ' + c + '" stroke-dashoffset="' + -(c * g + 2) + '" class="glow-r"/>' : '') +
      '</svg><span class="ring-c"><span class="ring-v">' + linked + '/' + total + '</span><span class="ring-l">Linked</span></span></div>';
  }
  function attention(s) {
    var cards = [];
    R.rankedTasks(s, ['accepted', 'in_progress']).forEach(function (tk) {
      var ns = R.nextStep(s, tk); if (!ns) return;
      cards.push({ kind: 'active', tk: tk, ns: ns });
    });
    R.rankedTasks(s, ['offered']).filter(function (tk) { return R.taskTier(s, tk) === 0; }).forEach(function (tk) { cards.push({ kind: 't0', tk: tk }); });
    R.brokenLinks(s).forEach(function (b) {
      var e = s.edges.filter(function (x) { return x.id === b.edgeId; })[0];
      if (!e.cold && b.side === 'down') return;
      cards.push({ kind: 'broken', b: b, e: e });
    });
    s.proposals.filter(function (p) { return p.status === 'pending' && p.from === s.me; }).forEach(function (p) { cards.push({ kind: 'proposal', p: p }); });
    s.custody.filter(function (c) { return c.holder === s.me && c.status !== 'returned'; }).forEach(function (c) { cards.push({ kind: 'custody', c: c }); });
    return cards;
  }
  function attCard(s, c, primary) {
    var kind = primary ? 'primary' : 'secondary';
    if (c.kind === 't0') {
      var tk = c.tk, l1 = tk.legs[0];
      var canAccept = R.isOperating(R.nodeState(s, s.me)) && R.fleet(s).free >= tk.vehiclesNeeded && (!tk.legs.some(function (l) { return l.needs === 'refrigerated' && !l.carrier; }) || R.coldCarrier(s));
      return '<div class="card card-red"><div class="card-top"><span class="card-top-l"><span class="chip chip-solid-red">Tier 0 // urgent</span><span class="num v-red">' + hm(tk.by - s.now) + ' spoil window</span></span><span class="num muted">' + h(tk.id) + '</span></div>' +
        '<h2 class="h2">' + h(s.nodes[tk.to].name) + ' · ' + h(short(tk)) + '</h2><p class="card-desc">Needs continuous chill below ' + (tk.limitC || 8) + ' °C. ' + h(tk.note || tk.why) + '</p>' +
        '<div class="card-foot"><span class="route">' + icon('route', null, 18) + 'Pickup ' + h(where(s, l1.from)) + ' ➔ ' + h(R.nameOf(s, l1.to)) + '</span>' +
        (canAccept ? btn('Accept ➔', 'acceptTask', { id: tk.id }, kind) : btn('Review ➔', 'go', { tab: 'tasks', screen: 'task', id: tk.id }, kind)) + '</div></div>';
    }
    if (c.kind === 'active') {
      return '<div class="card card-sky"><div class="card-top"><span class="chip chip-sky"><span class="pdot" aria-hidden="true"></span>Active · leg ' + c.ns.leg.n + ' of ' + c.tk.legs.length + '</span><span class="num muted">' + h(c.tk.id) + ' · ' + hm(c.tk.by - s.now) + ' left</span></div>' +
        '<h2 class="h2">' + h(cap(short(c.tk))) + ' for ' + h(s.nodes[c.tk.to].name) + '</h2><p class="card-desc">Next: ' + h(c.ns.label) + '.</p>' +
        '<div class="card-foot"><span class="route">' + icon('route', null, 18) + h(R.nameOf(s, c.ns.leg.from)) + ' ➔ ' + h(R.nameOf(s, c.ns.leg.to)) + '</span>' + btn('Open ➔', 'go', { tab: 'tasks', screen: 'task', id: c.tk.id }, kind) + '</div></div>';
    }
    if (c.kind === 'broken') {
      var n = s.nodes[c.b.id], sub = R.substitutes(s, c.b.edgeId), k = sub.candidates.length;
      return '<div class="card card-amber"><div class="card-top"><span class="chip chip-amber">' + (c.b.status === 'probably_gone' ? 'Probably gone' : 'Corridor severed') + '</span><span class="num muted">No reply: ' + hm(R.silenceMins(s, n) || 0) + '</span></div>' +
        '<h2 class="h2">' + h(n.name) + ' disconnected</h2><p class="card-desc">' + h(c.e.product) + ' stalled. No reply is not the same as gone. ' + (k ? k + ' substitutes available nearby.' : 'No substitute within reach yet.') + '</p>' +
        '<div class="card-foot"><span class="route">' + icon('cold', null, 18) + (k ? k + ' chilled substitutes ready nearby' : 'Post a transport need') + '</span>' + btn('Select substitute', 'go', { tab: 'chain', screen: 'subs', edge: c.b.edgeId }, primary ? 'primary' : 'amber', '', 'split') + '</div></div>';
    }
    if (c.kind === 'proposal') {
      return '<div class="card card-sky"><div class="card-top"><span class="chip chip-sky">Link proposed</span><span class="num muted">' + R.ago(s, c.p.at) + '</span></div><h2 class="h2">Waiting for ' + h(s.nodes[c.p.to].name) + '</h2>' +
        '<p class="card-desc">The link stays provisional until they confirm.</p><div class="card-foot"><span class="route">' + icon('hub', null, 18) + h(c.p.product) + '</span>' + btn('View ➔', 'go', { tab: 'chain', screen: 'subs', edge: c.p.replaces }, kind) + '</div></div>';
    }
    var cu = c.c, o = R.orphanById(s, cu.orphan), vv = vouch(s, cu);
    return '<div class="card ' + (cu.status === 'active' ? 'card-emerald' : cu.status === 'refused' ? 'card-red' : 'card-amber') + '"><div class="card-top"><span class="chip ' + (cu.status === 'active' ? 'chip-emerald' : 'chip-amber') + '">Orphan asset custody</span><span class="num ' + (vv.done ? 'v-emerald' : 'muted') + '">' + vv.label + '</span></div>' +
      '<h2 class="h2">' + h(R.ownerName(s, cu)) + ' · ' + h(short(o)) + '</h2><p class="card-desc">' + (cu.status === 'active' ? 'Custody permit ' + h(cu.id) + ' valid until ' + R.dayTime(cu.expiry) + '. ' + R.num(cu.remaining) + ' ' + h(cu.unit) + ' remain.' : cu.status === 'refused' ? 'Refused: an attestor says the owner is reachable.' : 'Owner unreachable. Waiting for neighbour attestations.') + '</p>' +
      '<div class="card-foot"><span class="route">' + icon('hand', null, 18) + 'Emergency IOU principle: 0 cash required</span>' + btn('Review permit ➔', cu.status === 'active' ? 'tab' : 'go', cu.status === 'active' ? { tab: 'ledger' } : { tab: 'chain', screen: 'custody', id: cu.orphan }, kind) + '</div></div>';
  }
  function today(s) {
    var me = s.nodes[s.me], st = R.chainStrip(s), slots = st.up.concat(st.down);
    var linked = slots.filter(function (x) { return x.status === 'active' || x.status === 'reduced'; }).length;
    var broken = slots.filter(function (x) { return ['unknown', 'probably_gone', 'gone', 'not_operating'].indexOf(x.status) >= 0; }).length;
    var f = R.fleet(s), diesel = s.stock.filter(function (x) { return x.node === s.me && x.what === 'Diesel credit'; })[0];
    var tele = '<div class="card"><div class="card-top"><div><p class="eyebrow">Pulse telemetry</p><h2 class="h2">' + h(me.corridor || 'Your corridor') + '</h2></div>' +
      (broken ? '<span class="chip chip-amber">' + broken + ' broken link' + (broken === 1 ? '' : 's') + '</span>' : '<span class="chip chip-emerald"><span class="pdot" aria-hidden="true"></span>All links live</span>') + '</div>' +
      '<div class="telemetry">' + ring(linked, broken, slots.length) + '<div class="stack"><div class="tile"><div class="kv2"><span class="tile-l">Operational capacity</span><span class="tile-v">' + (me.checkin ? f.declared + ' / ' + f.total : '0 / ' + f.total) + ' <small class="muted">' + h(f.label) + 's</small></span></div><div class="bar"><i style="width:' + (f.total ? Math.round(100 * f.declared / f.total) : 0) + '%"></i></div>' +
      (me.checkin ? '<p class="fine">Updated ' + R.stamp(s, me.checkin.at) + ' · ' + textBtn('Update', 'go', { screen: 'checkin' }) + '</p>' : '<p class="fine">' + textBtn('Check in', 'go', { screen: 'checkin' }) + '</p>') + '</div>' +
      (diesel ? '<div class="tile credit"><span><span class="tile-l">Diesel credit</span><span class="tile-v" style="display:block">' + R.num(diesel.qty) + ' litres</span></span><span class="chip chip-emerald chip-sm">' + h((diesel.note || '').replace('Valid at ', '').replace(' fuel depot', '')) + ' valid</span></div>' : '') + '</div></div>' +
      '<div class="cont"><div class="cont-h"><p class="eyebrow">Physical route continuity</p>' + textBtn('Open constellation ➔', 'tab', { tab: 'chain' }) + '</div>' + U.continuity(s) + '</div></div>';
    var cards = attention(s), t0n = cards.filter(function (c) { return c.kind === 't0'; }).length;
    var pri = secH('Priority deployments', t0n ? '<span class="chip chip-red">' + t0n + ' critical Tier 0</span>' : '') + (cards.length ? cards.map(function (c, i) { return attCard(s, c, i === 0); }).join('') : empty('Nothing needs you right now. You will be notified when a task matches your vehicle.'));
    var loads = R.rankedTasks(s, ['offered']).filter(function (tk) { return R.taskTier(s, tk) > 0; }).map(function (tk) {
      return item({ tone: 'blue', a: 'go', data: { tab: 'tasks', screen: 'task', id: tk.id }, title: 'Load: ' + h(short(tk)) + ', ' + h(s.nodes[tk.from].area) + ' ➔ ' + h(s.nodes[tk.to].area), sub: 'By ' + R.clock(tk.by) + '. You receive an IOU of ' + R.rupees(tk.reward.amount) + '.', right: U.tierTag(R.taskTier(s, tk)) });
    }).join('');
    var notes = s.notifications.filter(function (n) { return n.to === s.me; }).slice(-4).reverse();
    var upd = notes.length ? secH('Pulse log') + '<div class="card"><ul class="timeline">' + notes.map(function (n) { return '<li><span class="num">' + R.clock(n.at) + '</span><span>' + h(n.text) + '</span></li>'; }).join('') + '</ul></div>' : '';
    return tele + pri + (loads ? secH('Proposed matches') + loads : '') + upd + '<div class="inline-actions" style="justify-content:center">' + btn('Settings, language and help', 'go', { screen: 'settings' }, 'secondary', ' style="min-height:44px"', 'settings') + '</div>';
  }

  /* ---------- A7 Chain (constellation) ---------- */
  function seg(cur, items, a) {
    return '<div class="segctl" role="tablist">' + items.map(function (i) { return '<button type="button" role="tab" class="' + (cur === i[0] ? 'on' : '') + '" aria-selected="' + (cur === i[0]) + '" data-a="' + a + '" data-v="' + i[0] + '">' + h(i[1]) + '</button>'; }).join('') + '</div>';
  }
  function inspector(s, edgeId) {
    var e = s.edges.filter(function (x) { return x.id === edgeId; })[0]; if (!e) return '';
    var oid = e.from === s.me ? e.to : e.from, n = s.nodes[oid], st = R.nodeState(s, oid), pend = R.pendingProposalFor(s, e.id);
    var rep = e.replacedBy ? s.edges.filter(function (x) { return x.id === e.replacedBy; })[0] : null;
    var broken = !R.isOperating(st) && !rep && !e.replaces;
    var pill = broken ? (st === 'probably_gone' ? '<span class="chip chip-red">Critical cut</span>' : '<span class="chip chip-amber">No reply</span>') : rep ? '<span class="chip chip-emerald">Replaced</span>' : U.tag(st);
    var out = '<div class="inspector" aria-live="polite"><div class="inspector-h"><span class="inspector-t">' + h(n.name) + (broken ? ' · stranded' : '') + '</span>' + pill + '</div>' +
      '<p>' + h(R.stateDetail(s, oid)) + (n.note ? ' ' + h(n.note) : '') + ' ' + h(e.product) + (e.loadKg ? ', ' + R.num(e.loadKg) + ' kg a day' : '') + '.</p>';
    if (rep) { var rn = s.nodes[rep.from === s.me ? rep.to : rep.from]; out += '<div class="sub-row"><span><span class="sub-n">' + h(rn.name) + '</span><br><span class="sub-d">Confirmed ' + R.stamp(s, rep.at) + '. ' + h(rep.terms || '') + '</span></span></div>'; }
    else if (pend) out += '<div class="sub-row"><span><span class="sub-n" style="color:var(--sky)">' + h(s.nodes[pend.to].name) + '</span><br><span class="sub-d">Proposed ' + R.ago(s, pend.at) + '. Provisional until they confirm.</span></span>' + btn('View', 'go', { tab: 'chain', screen: 'subs', edge: e.id }, 'secondary', ' style="min-width:0"') + '</div>';
    else if (broken) {
      var top = R.substitutes(s, e.id).candidates[0];
      if (top) {
        var tn = s.nodes[top.id], v = tn.vehicles.filter(function (x) { return x.refrigerated; })[0];
        out += '<div class="sub-row"><span><span class="sub-n">' + h(tn.name) + '</span><br><span class="sub-d">' + (v ? v.count + ' ' + h(v.label.toLowerCase().replace('refrigerated ', '')) + 's · ' : '') + top.dist + ' km away' + (tn.note ? ' · ' + h(tn.note.replace('Vans pre-cooled to ', '').replace('.', '')) + ' ready' : '') + '</span></span>' +
          btn('Propose substitute', 'sheet', { k: 'propose', edge: e.id, to: top.id }, 'primary') + '</div><div class="inline-actions">' + textBtn('See all substitutes and why', 'go', { tab: 'chain', screen: 'subs', edge: e.id }) + '</div>';
      } else out += '<p>No substitute within reach. ' + textBtn('Post a need', 'sheet', { k: 'postNeed', preset: 'transport' }) + '</p>';
      if (n.cantReach.indexOf(s.me) < 0) out += '<div class="inline-actions">' + btn('Report cannot reach', 'cantReach', { node: oid }, 'secondary', ' style="min-height:44px"') + '</div>';
      else out += '<p>You reported you cannot reach them (' + n.cantReach.length + ' report' + (n.cantReach.length === 1 ? '' : 's') + '). Two reports and 6 hours of silence mark a node probably gone.</p>';
    }
    return out + '</div>';
  }
  function chain(s) {
    var head = '<p class="eyebrow" style="color:var(--emerald-hi)">Mesh topology</p><h1 class="h1">Chain constellation</h1>' + seg(V.chainSeg, [['links', 'Links'], ['needs', 'Needs and offers'], ['orphans', 'Orphans nearby']], 'chainSeg');
    if (V.chainSeg === 'needs') return head + needs(s);
    if (V.chainSeg === 'orphans') return head + orphans(s);
    var slots = R.chainStrip(s).up.concat(R.chainStrip(s).down);
    var brokenSlots = slots.filter(function (x) { return ['unknown', 'probably_gone', 'gone', 'not_operating', 'proposed'].indexOf(x.status) >= 0; });
    var sel = V.cnSel || (brokenSlots[0] && brokenSlots[0].origEdge) || (s.ui.animateEdge && slots.filter(function (x) { return x.edgeId === s.ui.animateEdge; }).map(function (x) { return x.origEdge; })[0]);
    var nb = brokenSlots.filter(function (x) { return x.status !== 'proposed'; }).length;
    var card = '<div class="card const-card"><div class="const-top"><p class="eyebrow">Tactical corridor // tap to inspect</p>' + (nb ? '<span class="chip chip-red">' + nb + ' disconnected</span>' : '<span class="chip chip-emerald">All links live</span>') + '</div>' +
      '<div class="const-box">' + U.constellation(s, sel) + '</div>' + U.legend() + (sel ? inspector(s, sel) : '') + '</div>';
    var links = R.myLinks(s);
    function rows(side) {
      return links.filter(function (l) { return l.side === side; }).map(function (l) {
        var n = s.nodes[l.other], e = l.edge, sub = h(cap(n.role)) + '. ' + h(e.product) + '.';
        var pend = R.pendingProposalFor(s, e.id), rep = e.replacedBy ? s.edges.filter(function (x) { return x.id === e.replacedBy; })[0] : null;
        if (rep) sub += ' Replaced by ' + h(s.nodes[rep.from === s.me ? rep.to : rep.from].name) + '.';
        if (pend) sub += ' Proposal to ' + h(s.nodes[pend.to].name) + ' waiting.';
        if (e.replaces) sub += ' New link.';
        return item({ tone: TONE[l.status], a: 'openLink', data: { edge: e.id }, title: h(n.name), sub: sub, extra: '<span class="item-meta">' + U.verif(n) + '<span class="item-sub">' + h(R.stateDetail(s, n.id).split('.')[0]) + '</span></span>', right: U.tag(l.status) });
      }).join('');
    }
    return head + card + secH('Upstream: who supplies you') + rows('up') + secH('Downstream: who you serve') + rows('down') +
      '<div class="doctrine">' + icon('shield', null, 18) + '<span>Re-linking needs both sides. A proposal stays provisional until the other node accepts, and no reply is never treated as gone without two reports.</span></div>';
  }

  /* ---------- A10 needs and offers ---------- */
  function needs(s) {
    var mine = s.needs.filter(function (n) { return n.node === s.me; }), f = R.fleet(s);
    var needRows = mine.length ? mine.map(function (n) {
      var unver = !R.tierVerified(s, n);
      return item({ tone: n.status === 'open' ? 'blue' : 'green', a: 'sheet', data: { k: 'need', id: n.id }, title: h(R.amount(n)), sub: 'By ' + R.stamp(s, n.by) + '.' + (unver ? ' Tier ' + n.tierClaimed + ' claimed, not verified.' : ''), extra: '<span class="item-meta">' + U.tierTag(R.effectiveTier(s, n)) + '</span>', right: U.tag(n.status, cap(n.status)) });
    }).join('') : empty('You have no open needs.');
    var offer = f.declared > 0 ? item({ tone: f.free > 0 ? 'green' : 'grey', title: f.free + ' of ' + f.total + ' ' + h(f.label) + 's free', sub: 'From your check-in: ' + f.declared + ' declared, ' + f.used + ' on tasks. Offered to Tier 0 and Tier 1 tasks first.' }) : empty('Check in as operating to offer vehicles.');
    return secH('My needs', btn('Post a need', 'sheet', { k: 'postNeed' }, 'secondary', ' style="min-height:44px"')) + needRows + secH('My offers') + offer;
  }

  /* ---------- A14 orphans ---------- */
  function orphans(s) {
    var me = s.nodes[s.me];
    var list = s.orphans.slice().sort(function (a, b) { return R.km(me, a) - R.km(me, b); });
    var map = '<div class="mini-map">' + U.mapSvg(s, { orphans: list, nodes: [s.me], viewBox: '200 0 600 640', label: 'Orphans near you' }) + '</div>';
    var rows = list.map(function (o) {
      return item({ tone: o.status === 'in_custody' ? 'green' : o.status === 'unclaimed' ? 'yellow' : 'blue', a: 'go', data: { screen: 'custody', id: o.id },
        title: h(o.id) + ': ' + h(R.amount(o)), sub: h(o.type) + '. ' + h(o.place) + ', ' + R.km(me, o) + ' km. ' + h(o.condition) + '.', right: U.tag(o.status, o.status.replace(/_/g, ' ')) });
    }).join('');
    return '<div class="foot" style="margin-top:0">' + btn('Report an orphan', 'go', { screen: 'orphanReport' }, 'primary', '', 'camera') + '</div>' + map + secH('Reported near you') + (rows || empty('No orphans reported near you.'));
  }
  function radio(name, v, on, label) { return '<label class="radio"><input type="radio" name="' + name + '" value="' + h(v) + '"' + (on ? ' checked' : '') + '><span>' + h(label != null ? label : v) + '</span></label>'; }
  function photoField(src, key) {
    return '<div class="photo">' + (src ? '<img src="' + h(src) + '" alt="Evidence photo, ' + h(key) + '" width="96" height="96">' : '<span class="photo-empty">' + icon('camera') + 'No photo</span>') +
      '<span class="photo-btns"><label class="btn btn-secondary btn-sm file-btn">' + icon('camera', null, 18) + 'Take photo<input type="file" accept="image/*" capture="environment" data-photo="' + key + '"></label>' +
      textBtn('Use demo photo', 'demoPhoto', { key: key }) + '</span></div>';
  }
  function orphanReport(s) {
    var d = V.orphanDraft;
    var types = ['Stranded vehicle or cargo', 'Stock in a closed premises', 'Parcels without recipient', 'Unattended hazardous asset'];
    var conds = ['Sacks sealed, dry, shutter locked', 'Damaged packaging', 'Spoiling within 1 day', 'Hazard: needs an authority'];
    var owners = [['raju', 'Raju Provisions (probably gone)'], ['', 'Owner not known']];
    return '<form data-form="reportOrphan"><div class="card"><p class="eyebrow">Orphan asset report</p><h1 class="h1">Report an orphan</h1>' +
      '<div class="field"><span class="flabel">1. Photo</span>' + photoField(d.photo, 'orphan') + '</div>' +
      '<label class="field"><span class="flabel">2. Location</span><input name="place" value="' + h(d.place) + '" required><span class="fine">' + icon('pin', null, 14) + 'GPS 18.4996 N, 73.9412 E, filled automatically.</span></label>' +
      '<fieldset class="field"><legend>3. What kind</legend>' + types.map(function (tp) { return radio('type', tp, d.type === tp); }).join('') + '</fieldset>' +
      '<label class="field"><span class="flabel">Goods</span><input name="goods" value="' + h(d.goods) + '" required></label>' +
      '<div class="field-row"><label class="field"><span class="flabel">Quantity</span><input name="qty" inputmode="numeric" value="' + h(d.qty) + '" required></label><label class="field"><span class="flabel">Unit</span><input name="unit" value="' + h(d.unit) + '"></label></div>' +
      '<label class="field"><span class="flabel">Kg per unit (optional)</span><input name="kgPer" inputmode="numeric" value="' + h(d.kgPer || '') + '"></label>' +
      '<label class="field"><span class="flabel">Owner</span><select name="owner">' + owners.map(function (o) { return '<option value="' + o[0] + '"' + (d.owner === o[0] ? ' selected' : '') + '>' + h(o[1]) + '</option>'; }).join('') + '</select></label>' +
      '<fieldset class="field"><legend>4. Condition</legend>' + conds.map(function (c) { return radio('condition', c, d.condition === c); }).join('') + '</fieldset></div>' +
      '<div class="foot"><button type="submit" class="btn btn-primary">Report orphan</button></div></form>';
  }

  /* ---------- A15 custody request and status ---------- */
  var ANS = { yes: 'Yes, I confirm', no: 'No, they are reachable', unsure: 'I am not sure' };
  function custody(s) {
    var o = R.orphanById(s, V.p.id); if (!o) return empty('Orphan not found.');
    var c = s.custody.filter(function (x) { return x.orphan === o.id && x.holder === s.me; }).slice(-1)[0];
    var head = '<div class="card card-sky"><div class="card-top"><p class="eyebrow" style="color:var(--sky)">Orphan asset sheet</p><span class="chip chip-sky">' + h(o.id) + '</span></div><h1 class="h1">' + h(cap(short(o))) + '</h1>' +
      (o.photo ? '<img class="thumb-lg" src="' + h(o.photo) + '" alt="Photo of ' + h(o.goods) + '" width="96" height="96">' : '') + '<dl class="kv">' +
      kv('Kind', h(o.type)) + kv('Where', h(o.place)) + kv('Condition', h(o.condition)) + kv('Owner', o.owner ? h(s.nodes[o.owner].name) + ', ' + h(R.STATE_WORD[R.nodeState(s, o.owner)].toLowerCase()) : h(o.ownerText || 'Not known')) +
      kv('Reported', 'By ' + h(R.nameOf(s, o.reportedBy)) + ', ' + R.stamp(s, o.at)) + '</dl></div>';
    if (c && c.status !== 'returned') return head + custodyStatus(s, c, o);
    if (o.status !== 'unclaimed') return head + item({ tone: 'blue', title: 'Status: ' + h(o.status.replace(/_/g, ' ')), sub: o.holder ? 'Held by ' + h(R.nameOf(s, o.holder)) + '.' : '' });
    var d = V.custodyDraft;
    var uses = ['Supply Hadapsar Community Kitchen', 'Supply households through Meena Stores', 'Move to dry storage to prevent spoilage'];
    return '<form data-form="requestCustody">' + head + '<div class="card"><div class="doctrine" style="margin-top:0">' + icon('hand', null, 18) + '<span><em>Relay custody doctrine:</em> custody is a temporary loan, never ownership. Every release is recorded and returned to the owner if they come back.</span></div>' +
      '<fieldset class="field" style="margin-top:14px"><legend>Intended use</legend>' + uses.map(function (u) { return radio('use', u, d.use === u); }).join('') + '</fieldset>' +
      '<fieldset class="field"><legend>Proposed duration</legend><div class="opts opts-3">' + [24, 48, 72].map(function (hh) { return '<label class="opt opt-radio"><input type="radio" name="hours" value="' + hh + '"' + (d.hours === hh ? ' checked' : '') + '><span>' + hh + ' h</span></label>'; }).join('') + '</div></fieldset>' +
      '<p class="fine">Two independent neighbours within 5 km, or one anchor, must confirm the owner is unreachable. Whoever receives the goods cannot attest.</p></div>' +
      '<div class="foot"><button type="submit" class="btn btn-primary">Request custody</button></div></form>';
  }
  function vouch(s, c) {
    var yes = c.attestors.filter(function (a) { return a.answer === 'yes'; });
    var anchor = yes.some(function (a) { return s.nodes[a.node].anchor; });
    return anchor ? { label: 'Anchor verified', done: true, text: 'anchor verified' } : { label: Math.min(yes.length, 2) + '/2 vouched', done: yes.length >= 2, text: Math.min(yes.length, 2) + ' / 2 verified' };
  }
  function attestList(s, c) {
    return c.attestors.map(function (a) {
      var n = s.nodes[a.node];
      var chip = a.answer === 'yes' ? '<span class="chip chip-emerald chip-sm">Vouched</span>' : a.answer === 'no' ? '<span class="chip chip-red chip-sm">Disputed</span>' : a.answer === 'unsure' ? '<span class="chip chip-amber chip-sm">Unsure</span>' : '<span class="chip chip-grey chip-sm">Waiting</span>';
      return item({ tone: a.answer === 'yes' ? 'green' : a.answer === 'no' ? 'red' : a.answer === 'unsure' ? 'yellow' : 'grey', title: h(n.name) + (n.anchor ? ' (anchor)' : ' (' + h(n.role) + ')'), sub: a.answer ? h(ANS[a.answer]) + ', ' + R.clock(a.at) + '.' + (a.reason ? ' "' + h(a.reason) + '"' : '') : 'Asked at ' + R.clock(c.at) + '.', right: chip });
    }).join('');
  }
  function custodyStatus(s, c, o) {
    var vv = vouch(s, c), yes = c.attestors.filter(function (a) { return a.answer === 'yes'; }).length, n = 2;
    var list = secH('Attestations (' + vv.text + ')') + attestList(s, c);
    if (c.status === 'active') {
      return '<p class="ok-line">' + icon('checkc') + 'Custody issued</p><div class="callout">' + icon('hand') + '<span>You hold ' + h(R.amount(o)) + ' for ' + h(R.ownerName(s, c)) + ' until ' + R.stamp(s, c.expiry) + '. Every release is recorded.</span></div>' +
        list + '<div class="foot">' + btn('Open custody record', 'go', { tab: 'ledger', screen: 'custodyDetail', id: c.id }, 'primary') + '</div>';
    }
    if (c.status === 'refused') {
      return '<div class="banner banner-red">' + icon('cross', null, 18) + 'Custody not issued. An attestor says the owner is reachable. Contact the owner, or ask an anchor to review.</div>' + list +
        '<div class="foot">' + (c.attestors.some(function (a) { return a.node === 'ravi'; }) ? '' : btn('Ask an anchor to review', 'askAnchor', { id: c.id }, 'primary')) + '</div>';
    }
    var unsure = c.attestors.some(function (a) { return a.answer === 'unsure'; });
    return '<div class="callout">' + icon('clock') + '<span><strong>Waiting for ' + yes + ' of ' + n + ' confirmations.</strong> Requested ' + R.stamp(s, c.at) + ' for ' + c.hours + ' hours: ' + h(c.use.toLowerCase()) + '.</span></div>' + list +
      (unsure && !c.attestors.some(function (a) { return a.node === 'ravi'; }) ? '<div class="foot">' + btn('Ask an anchor instead', 'askAnchor', { id: c.id }) + '</div>' : '') +
      '<p class="fine">' + icon('sms', null, 14) + 'Attestors answer in their own Relay app. In this demo, answer for them in the Simulation panel.</p>';
  }

  /* ---------- A8 substitute finder ---------- */
  function subs(s) {
    var e = s.edges.filter(function (x) { return x.id === V.p.edge; })[0]; if (!e) return empty('Link not found.');
    var old = s.nodes[e.from === s.me ? e.to : e.from], sub = R.substitutes(s, e.id), pend = R.pendingProposalFor(s, e.id);
    var head = '<div class="card card-amber"><p class="eyebrow">Replacing</p><h1 class="h1">' + h(old.name) + '</h1><p class="card-desc">' + h(e.product) + (e.loadKg ? ', ' + R.num(e.loadKg) + ' kg a day' : '') + (e.cold ? '. Must stay below 8 °C.' : '.') + '</p></div>';
    if (e.replacedBy) {
      var ne = s.edges.filter(function (x) { return x.id === e.replacedBy; })[0];
      return head + '<p class="ok-line">' + icon('checkc') + 'Link confirmed</p>' + item({ tone: 'green', title: h(s.nodes[ne.from].name) + ' now carries this link', sub: 'Accepted ' + R.stamp(s, ne.at) + '. ' + h(ne.terms || '') + '.' }) +
        '<div class="foot">' + btn('See constellation', 'tab', { tab: 'chain' }, 'primary') + '</div>';
    }
    var c = sub.candidates;
    var rows = c.map(function (x, i) {
      var n = s.nodes[x.id], isPend = pend && pend.to === x.id;
      return '<div class="card' + (i === 0 && !pend ? ' card-emerald' : isPend ? ' card-sky' : '') + '"><div class="card-top"><span class="card-top-l"><span class="rank">' + (i + 1) + '</span><span class="h3" style="margin:0">' + h(n.name) + '</span></span><span class="num v-emerald">' + x.score + '/100</span></div>' +
        '<p class="card-desc">' + h(cap(n.role)) + ', ' + h(n.area) + '. ' + x.dist + ' km. ' + (sub.buyer ? R.STATE_WORD[x.state] + '.' : 'Spare ' + R.num(x.spare) + ' kg' + (sub.cold ? ' refrigerated' : '') + '.') + (n.note ? ' ' + h(n.note) : '') + '</p>' +
        '<div class="item-meta" style="margin-top:8px">' + U.verif(n) + U.trustBar(n.trust) + '</div><p class="fine">' + h(x.reason) + '.</p>' +
        (isPend ? '<p class="fine"><strong style="color:var(--sky)">Proposed ' + R.ago(s, pend.at) + '. Provisional until they confirm.</strong></p>' : '') +
        (pend ? '' : '<div class="card-foot" style="justify-content:flex-end">' + btn('Propose link', 'sheet', { k: 'propose', edge: e.id, to: x.id }, i === 0 ? 'primary' : 'secondary') + '</div>') + '</div>';
    }).join('');
    var excl = sub.excluded.length ? '<details class="disclose"><summary>Not suitable (' + sub.excluded.length + ')</summary>' + sub.excluded.map(function (x) {
      return item({ tone: 'grey', title: h(s.nodes[x.id].name), sub: h(x.reason) + '.' });
    }).join('') + '</details>' : '';
    if (!c.length) return head + empty('No node within ' + s.nodes[s.me].radiusKm + ' km can replace this link now. Post a transport need so others can offer.', btn('Post a need', 'sheet', { k: 'postNeed', preset: 'transport' }, 'primary')) + excl;
    return head + (pend ? '<div class="banner banner-blue">' + icon('clock', null, 18) + 'Waiting for ' + h(s.nodes[pend.to].name) + ' to confirm. The link stays provisional until they do.</div>' : '') +
      secH(c.length + ' nodes can supply this. Closest ' + Math.min.apply(null, c.map(function (x) { return x.dist; })) + ' km', textBtn('Why this order', 'sheet', { k: 'why', edge: e.id })) + rows + excl;
  }

  /* ---------- A11 tasks ---------- */
  function tasks(s) {
    var f = R.fleet(s);
    var head = '<p class="eyebrow" style="color:var(--emerald-hi)">Dispatch</p><h1 class="h1">Tasks</h1><div class="tile" style="margin-bottom:6px"><div class="kv2"><span class="tile-l">Vans free</span><span class="tile-v">' + f.free + ' of ' + f.declared + ' declared</span></div><div class="bar"><i style="width:' + (f.declared ? Math.round(100 * f.free / f.declared) : 0) + '%"></i></div></div>';
    function trow(tk) {
      var tier = R.taskTier(s, tk);
      var sub = h(s.nodes[tk.from].area) + ' ➔ ' + h(s.nodes[tk.to].area) + '. By ' + R.clock(tk.by) + (tk.status === 'offered' ? ', ' + left(s, tk.by) : '') + '.';
      var st = tk.status === 'in_progress' ? 'In progress' : cap(tk.status);
      var extra = '<span class="item-meta">' + U.tierTag(tier) + '<span class="item-sub">IOU ' + R.rupees(tk.reward.amount) + '</span>' + (tk.acceptedVia === 'SMS' ? '<span class="chip chip-sky chip-sm">' + icon('sms', null, 12) + 'Accepted by SMS</span>' : '') + '</span>' +
        (tk.status === 'offered' ? '<span class="item-sub reason">' + h(R.taskReason(s, tk)) + '</span>' : '');
      if (tk.status === 'accepted' || tk.status === 'in_progress') { var ns = R.nextStep(s, tk); if (ns) extra += '<span class="item-sub"><strong>Next: ' + h(ns.label) + '</strong></span>'; }
      if (tk.status === 'declined') extra += '<span class="item-sub">Declined: ' + h(tk.declineReason) + '. The request stays open for other carriers.</span>';
      return item({ tone: tier === 0 && tk.status !== 'delivered' ? 'red' : tk.status === 'delivered' ? 'green' : 'blue', a: 'go', data: { screen: 'task', id: tk.id }, title: h(tk.id) + ' · ' + h(cap(short(tk))), sub: sub, extra: extra, right: U.tag(tk.status, st) });
    }
    var off = R.rankedTasks(s, ['offered']), act = R.rankedTasks(s, ['accepted', 'in_progress']), done = s.tasks.filter(function (x) { return x.status === 'delivered' || x.status === 'declined'; });
    return head + secH('Offered') + (off.length ? off.map(trow).join('') : empty('No tasks right now. You will be notified when one matches your vehicle.')) +
      secH('Active') + (act.length ? act.map(trow).join('') : empty('No active tasks. Accept an offered task to start.')) +
      secH('Done') + (done.length ? done.map(trow).join('') : empty('Completed tasks appear here.'));
  }

  /* ---------- A12 task detail ---------- */
  function taskDetail(s) {
    var tk = R.task(s, V.p.id); if (!tk) return empty('Task not found.');
    var tier = R.taskTier(s, tk), need = R.needById(s, tk.needId), t0 = tier === 0;
    var ns = R.nextStep(s, tk);
    var legs = '<ul class="legs">' + tk.legs.map(function (l) {
      var st = { unassigned: 'Needs carrier', assigned: 'Assigned', at_pickup: 'At pickup', picked_up: 'Picked up', at_handoff: 'At handoff', awaiting_attestation: 'Attesting', handed_over: 'Handed over' }[l.status];
      var on = ns && ns.leg === l || ns && ns.from === l, done = l.status === 'handed_over';
      var carrier = l.carrier ? R.nameOf(s, l.carrier) + (l.carrier === s.me ? ' (you)' : '') : 'Refrigerated carrier needed';
      var hp = s.handoffPoints.filter(function (p) { return p.id === l.to; })[0];
      return '<li class="leg ' + (done ? 'done' : on ? 'on' : 'off') + '"><span class="leg-dot" aria-hidden="true"></span><div class="leg-h"><span class="leg-t">Leg ' + l.n + ': ' + h(where(s, l.from)) + ' ➔ ' + h(where(s, l.to)) + '</span><span class="leg-s ' + (done ? 'v-emerald' : on ? 'v-emerald' : 'muted') + '">' + h(st) + '</span></div>' +
        '<div class="leg-c">Carrier: ' + h(carrier) + '. ' + l.km + ' km, about ' + l.mins + ' min.' + (l.needs ? ' Needs ' + h(l.needs) + '.' : '') + (hp ? '<br>Handoff contact: ' + h(hp.contact || hp.name) + ' (' + h(hp.name) + ')' : '') + '</div></li>';
    }).join('') + '</ul>';
    var reason = R.taskReason(s, tk);
    var owes = tk.legs.filter(function (l) { return l.ratePerHour; });
    var tiles = tk.tempC != null
      ? '<div class="tiles"><div class="tile"><div class="tile-l">Current temp</div><div class="tile-v v-emerald">' + tk.tempC.toFixed(1) + '°C</div></div><div class="tile"><div class="tile-l">Spoil threshold</div><div class="tile-v v-amber">' + (tk.limitC || 8).toFixed(1) + '°C</div></div><div class="tile"><div class="tile-l">Credit value</div><div class="tile-v">' + R.rupees(tk.reward.amount) + '</div></div></div>'
      : '<div class="tiles"><div class="tile"><div class="tile-l">Load</div><div class="tile-v" style="font-size:14px">' + h(tk.load) + '</div></div><div class="tile"><div class="tile-l">Window</div><div class="tile-v v-amber">' + R.clock(tk.by) + '</div></div><div class="tile"><div class="tile-l">Credit value</div><div class="tile-v">' + R.rupees(tk.reward.amount) + '</div></div></div>';
    var body = '<div class="card ' + (t0 ? 'card-red' : 'card-sky') + '"><div class="card-top"><span class="chip ' + (t0 ? 'chip-solid-red' : 'chip-sky') + '">Tier ' + tier + (t0 ? ' // critical life safety' : '') + '</span><span class="chip ' + (t0 ? 'chip-red' : 'chip-grey') + '">' + (tk.by > s.now ? hm(tk.by - s.now) + ' limit' : 'Window passed') + '</span></div>' +
      '<h1 class="h1">' + h(cap(short(tk))) + ' consignment</h1><p class="card-desc">' + h(tk.note || ('For ' + s.nodes[tk.to].name + ', ' + tk.why + '.')) + '</p>' + tiles +
      '<div class="why"><p class="eyebrow">Why this task</p><p>' + h(reason) + '</p>' + (need && !R.tierVerified(s, need) ? '<p class="fine">' + icon('shield', null, 14) + h(R.verifierText(s, need)) + '</p>' : '') + '</div></div>' +
      '<div class="card"><p class="eyebrow">Relay legs orchestration</p><div style="margin-top:12px">' + legs + '</div></div>' + taskFoot(s, tk) +
      '<dl class="kv">' + kv('From', nodeLine(s, tk.from)) + kv('To', nodeLine(s, tk.to)) + kv('Window', 'By ' + R.dayTime(tk.by) + ' (' + left(s, tk.by) + ')') +
      kv('You receive', 'IOU of ' + R.rupees(tk.reward.amount) + ' from ' + h(s.nodes[tk.reward.from].name) + ', on delivery') +
      owes.map(function (l) { return kv('You owe', 'IOU of ' + R.rupees(l.ratePerHour * l.hours) + ' to ' + h(l.carrier ? R.nameOf(s, l.carrier) : 'the leg ' + l.n + ' carrier') + ' for ' + l.hours + ' van hours, on delivery'); }).join('') + '</dl>' +
      '<details class="disclose"><summary>Route map</summary><div class="mini-map">' + routeMap(s, tk) + '</div></details>' +
      '<div class="inline-actions">' + btn('Read aloud', 'readAloud', { id: tk.id }, 'secondary', ' aria-label="Read task aloud"', 'speaker') + '</div>' + doneRecords(s, tk);
    return body + (tk.status === 'accepted' || tk.status === 'in_progress' ? '<button type="button" class="sos" data-a="sosKey" data-hold="sos" aria-label="SOS. Press and hold to send.">' + icon('sos', null, 16) + 'SOS</button>' : '');
  }
  function where(s, id) { var p = R.place(s, id); return p.area ? p.area : p.name.replace(' safe point', ''); }
  function routeMap(s, tk) {
    var pts = tk.legs.map(function (l) { return R.place(s, l.from); }).concat([R.place(s, tk.to)]);
    var xs = pts.map(function (p) { return p.x * 20; }), ys = pts.map(function (p) { return p.y * 20; });
    var minX = Math.min.apply(null, xs) - 90, minY = Math.min.apply(null, ys) - 60, w = Math.max.apply(null, xs) - minX + 90, hh = Math.max.apply(null, ys) - minY + 60, size = Math.max(w, hh * 1.4);
    return U.mapSvg(s, { route: tk.legs.map(function (l) { return { from: l.from, to: l.to, done: l.status === 'handed_over' }; }), nodes: [tk.from, tk.to], handoffPoints: s.handoffPoints.filter(function (p) { return tk.legs.some(function (l) { return l.to === p.id; }); }), labels: true, viewBox: minX + ' ' + minY + ' ' + size + ' ' + size / 1.4, label: 'Route for task ' + tk.id });
  }
  function doneRecords(s, tk) {
    var hs = s.handoffs.filter(function (x) { return x.task === tk.id; });
    if (!hs.length) return '';
    return secH('Handoff records') + hs.map(function (x) {
      return item({ tone: x.status === 'confirmed' ? 'green' : x.status === 'not_confirmed' ? 'red' : 'yellow', title: 'Leg ' + x.leg + ' at ' + h(x.place), sub: h(x.method) + '. ' + R.stamp(s, x.at) + (x.attestor ? '. Attestor: ' + h(s.nodes[x.attestor].name) : '') + (x.geo ? '. ' + h(x.geo) : '') + '.', right: x.photo ? '<img class="thumb" src="' + h(x.photo) + '" alt="Handoff photo" width="44" height="44">' : U.tag(x.status === 'confirmed' ? 'accepted' : 'awaiting', x.status === 'confirmed' ? 'Confirmed' : x.status === 'not_confirmed' ? 'Not confirmed' : 'Waiting') });
    }).join('') + (tk.status === 'delivered' ? '<p class="fine">' + icon('ledger', null, 14) + 'Delivered. IOUs recorded in your ledger. ' + textBtn('Open ledger', 'tab', { tab: 'ledger' }) + '</p>' : '');
  }
  function taskFoot(s, tk) {
    if (tk.status === 'offered') {
      var coldLeg = tk.legs.filter(function (l) { return l.needs === 'refrigerated' && !l.carrier; })[0];
      var f = R.fleet(s), st = R.nodeState(s, s.me);
      var block = tk.by <= s.now ? 'The window for this task has closed.' : !R.isOperating(st) ? 'You are not checked in as operating. Update your status to accept tasks.'
        : f.free < tk.vehiclesNeeded ? 'Not enough vehicles. You declared ' + f.declared + ' of ' + f.total + ' ' + f.label + 's; ' + f.used + ' are on active tasks. This task needs ' + tk.vehiclesNeeded + '.'
          : coldLeg && !R.coldCarrier(s) ? 'Leg 1 needs a refrigerated carrier. ' + s.nodes.kaveri.name + ' has not replied. Find a substitute first.' : '';
      if (block) {
        var fix = coldLeg && !R.coldCarrier(s) && R.isOperating(st) ? btn('Find a substitute', 'go', { tab: 'chain', screen: 'subs', edge: 'E2' }, 'primary', '', 'split') : !R.isOperating(st) ? btn('Update status', 'go', { screen: 'checkin' }, 'primary') : '';
        return '<div class="dock"><p class="dock-msg">' + icon('alert', null, 18) + h(block) + '</p>' + fix + btn('Decline', 'sheet', { k: 'decline', id: tk.id }) + '</div>';
      }
      return '<div class="dock">' + btn('Accept task', 'acceptTask', { id: tk.id }, 'primary step-btn', '', 'inventory') + btn('Decline', 'sheet', { k: 'decline', id: tk.id }) + '</div>';
    }
    if (tk.status !== 'accepted' && tk.status !== 'in_progress') return '';
    var ns = R.nextStep(s, tk); if (!ns) return '';
    var ind = '<p class="leg-ind">Leg ' + ns.leg.n + ' of ' + tk.legs.length + (ns.from ? ' · leg ' + ns.from.n + ' with ' + h(R.nameOf(s, ns.from.carrier)) + ': ' + h({ assigned: 'not picked up yet', picked_up: 'on the way', at_handoff: 'at the handoff point' }[ns.from.status] || ns.from.status) : '') + '</p>';
    if (ns.step === 'wait') return '<div class="dock">' + ind + '<p class="dock-msg">' + icon('clock', null, 18) + 'You are at ' + h(R.nameOf(s, ns.leg.from)) + '. Waiting for the leg ' + ns.from.n + ' van.</p></div>';
    if (ns.step === 'wait_attest') return '<div class="dock">' + ind + '<p class="dock-msg">' + icon('clock', null, 18) + 'Handoff recorded with a photo. Waiting for the attestor to confirm.</p></div>';
    if (ns.step === 'receive' || ns.step === 'handoff') return '<div class="dock">' + ind + btn(ns.label, 'go', { tab: 'handoff', screen: 'handoff', id: tk.id }, 'primary step-btn', '', 'qr') + '</div>';
    return '<div class="dock">' + ind + btn(ns.label, 'legStep', { id: tk.id, step: ns.step }, 'primary step-btn', '', 'inventory') + '</div>';
  }

  /* ---------- A13 handoff ---------- */
  function myCode(tk, n) { return String((parseInt(tk.id.slice(1), 10) * 37 + n * 911) % 9000 + 1000); }
  function handoffDue(s) { return s.tasks.filter(function (x) { var ns = R.nextStep(s, x); return ns && (ns.step === 'receive' || ns.step === 'handoff'); })[0]; }
  function handoffTab(s) {
    var tk = handoffDue(s);
    if (tk) { V.p = { id: tk.id }; return handoff(s); }
    var recs = s.handoffs.slice().reverse();
    return '<p class="eyebrow" style="color:var(--emerald-hi)">Custody transfer</p><h1 class="h1">Handoffs</h1>' + empty('No handoff is due now. When you reach a handoff point, the two-party code appears here.') +
      (recs.length ? secH('Recorded handoffs') + recs.map(function (x) { return item({ tone: x.status === 'confirmed' ? 'green' : 'yellow', a: 'go', data: { tab: 'tasks', screen: 'task', id: x.task }, title: 'Task ' + h(x.task) + ', leg ' + x.leg, sub: h(x.method) + ' at ' + h(x.place) + ', ' + R.stamp(s, x.at) + '.', right: U.tag(x.status === 'confirmed' ? 'accepted' : 'awaiting', x.status === 'confirmed' ? 'Confirmed' : 'Waiting') }); }).join('') : '');
  }
  function handoff(s) {
    var tk = R.task(s, V.p.id); if (!tk) return empty('Task not found.');
    var ns = R.nextStep(s, tk);
    if (!ns || (ns.step !== 'receive' && ns.step !== 'handoff')) return tk.status === 'delivered' ? '<div class="card card-emerald">' + '<p class="ok-line">' + icon('checkc') + 'Handoff completed · IOU recorded</p><p class="card-desc">Task ' + h(tk.id) + ' delivered at ' + R.stamp(s, tk.deliveredAt) + '.</p></div>' + doneRecords(s, tk) : empty('No handoff is due on this task now.');
    var giving = ns.step === 'handoff', leg = giving ? ns.leg : ns.from, cp = giving ? R.nameOf(s, leg.to) : R.nameOf(s, leg.carrier) + ' driver';
    var code = myCode(tk, leg.n), place = R.nameOf(s, leg.to);
    var tokenCard = '<div class="card card-sky token-card"><span class="chip chip-sky">Two-party handoff protocol</span><h1 class="h1" style="margin-top:12px">' + h(cap(place.split(',')[0])) + ' handoff</h1>' +
      '<p class="card-desc">' + (giving ? 'Hand over ' : 'Receive ') + h(short(tk)) + (giving ? ' to ' : ' from ') + h(cp) + '. Show them your token.</p>' +
      '<div class="token" role="img" aria-label="Your token ' + code.split('').join(' ') + '">' + code.split('').map(function (d) { return '<i>' + d + '</i>'; }).join('') + '</div>' +
      '<p class="fine" style="justify-content:center">' + icon('checkc', null, 14) + 'Binding transit token for task ' + h(tk.id) + '</p></div>';
    if (V.handoffFallback && giving) {
      var attestors = R.handoffAttestors(s, tk, leg);
      return '<form data-form="handoffFallback" data-id="' + tk.id + '"><div class="card card-amber"><span class="chip chip-amber">Fallback: receiver offline</span><h1 class="h1" style="margin-top:10px">Photo and attestation</h1><p class="card-desc">Take a geotagged photo of the cargo and ask a nearby neighbour to attest.</p>' +
        '<div class="field" style="margin-top:12px"><span class="flabel">Photo of the goods</span>' + photoField(V.handoffPhoto, 'handoff') + (V.handoffPhoto ? '<span class="fine">' + icon('pin', null, 14) + 'Geotag 18.5089 N, 73.9259 E · ' + R.stamp(s, s.now) + '</span>' : '') + '</div>' +
        '<fieldset class="field"><legend>Who will attest</legend><p class="fine">Operating neighbours within 3 km with no part in this task.</p>' + (attestors.length ? '' : '<p class="lead">No independent neighbour is operating nearby. Use the code, or try again later.</p>') +
        attestors.map(function (id, i) { return radio('attestor', id, i === 0, s.nodes[id].name + ', ' + R.km(s.nodes[id], R.place(s, leg.to)) + ' km'); }).join('') + '</fieldset></div>' +
        '<div class="foot"><button type="submit" class="btn btn-primary">Confirm handoff</button>' + textBtn('Use the code instead', 'fallback', { on: 0 }) + '</div></form>';
    }
    return tokenCard + '<form class="card" data-form="handoffCode" data-id="' + tk.id + '"><p class="eyebrow">Counterparty verification</p><label class="field" style="margin-top:10px"><span class="flabel">Enter ' + (giving ? 'the receiver\'s' : 'the driver\'s') + ' 4-digit code</span>' +
      '<span class="verify-row"><input name="code" inputmode="numeric" maxlength="4" pattern="\\d{4}" autocomplete="off" required placeholder="····" aria-label="Their 4-digit code"><button type="submit" class="btn btn-sky">Confirm handoff</button></span></label>' +
      (giving ? '<div class="or">Or fallback</div><button type="button" class="fallback" data-a="fallback" data-on="1"><span class="fallback-k">NO_CELL</span><span><span class="fallback-t">Other person unavailable</span><p>Receiver phone dead or offline? Take a geotagged photo of the cargo with a neighbour as witness.</p></span></button>'
        : '<p class="fine">Both carriers must confirm a relay handoff with the code.</p>') +
      '<div class="inline-actions">' + btn('Read aloud', 'readAloud', { id: tk.id, handoff: 1 }, 'secondary', '', 'speaker') + '</div></form>';
  }

  /* ---------- A17 ledger + A16 custody ---------- */
  function custodySheet(s, c) {
    var o = R.orphanById(s, c.orphan), vv = vouch(s, c);
    return '<div class="card card-sky"><div class="card-top"><p class="eyebrow" style="color:var(--sky)">Orphan asset sheet</p><span class="chip chip-sky">' + h(o.id) + '</span></div><h2 class="h2">' + h(cap(short(o))) + '</h2>' +
      '<div class="callout" style="flex-direction:column;gap:4px"><span><strong>Location:</strong> ' + h(o.place) + '</span><span><em>Relay custody doctrine:</em> custody is a temporary loan, never ownership. Every kg distributed is recorded for reconciliation when the rightful owner returns.</span></div>' +
      '<p class="eyebrow">Attestations (' + vv.text + ')</p><div style="margin-top:8px">' + attestList(s, c) + '</div>' +
      '<div class="card-foot"><span><span class="tile-l" style="display:block">Custody permit</span><span class="tile-v">' + h(c.id) + '</span></span><span class="num ' + (c.status === 'active' ? 'v-emerald' : 'muted') + '">' + (c.status === 'active' ? 'Valid until ' + R.dayTime(c.expiry) : cap(c.status)) + '</span></div>' +
      (c.status === 'active' ? '<div class="inline-actions">' + btn('Record a release', 'sheet', { k: 'release', id: c.id }, 'primary', ' style="flex:1"') + btn('Usage log', 'go', { screen: 'custodyDetail', id: c.id }, 'secondary') + '</div>'
        : c.status === 'returned' ? '' : '<div class="inline-actions">' + btn('Open request', 'go', { tab: 'chain', screen: 'custody', id: c.orphan }, 'secondary') + '</div>') + '</div>';
  }
  function ledger(s) {
    var L = R.ledger(s), mine = s.obligations.filter(function (i) { return i.from === s.me || i.to === s.me; }).slice().reverse();
    var cs = s.custody.filter(function (c) { return c.holder === s.me; }).slice().reverse();
    var led = '<div class="card"><div class="card-top"><div><p class="eyebrow">Bilateral obligations</p><h2 class="h2">Zero-cash emergency ledger</h2></div><span class="chip chip-emerald chip-sm">Settle post-crisis</span></div>' +
      '<div class="totals"><div class="total total-owed"><span class="tile-l">You are owed</span><span class="tv">' + R.rupees(L.owed) + '</span><small>' + mine.filter(function (i) { return i.to === s.me && i.status === 'open'; }).length + ' verified claim(s)</small></div>' +
      '<div class="total total-owe"><span class="tile-l">You owe</span><span class="tv">' + R.rupees(L.owe) + '</span><small>' + mine.filter(function (i) { return i.from === s.me && i.status === 'open'; }).length + ' open entr' + (mine.filter(function (i) { return i.from === s.me && i.status === 'open'; }).length === 1 ? 'y' : 'ies') + '</small></div></div>' +
      '<p class="fine">IOUs are records. Relay moves no money; settle later by UPI, cash or offset.</p>' +
      '<p class="eyebrow" style="margin-top:14px">Audit log</p><div style="margin-top:8px">' + (mine.length ? mine.map(function (i) {
        var cp = i.from === s.me ? i.to : i.from, plus = i.to === s.me;
        return '<button type="button" class="audit" data-a="sheet" data-k="iou" data-cp="' + h(cp) + '"><span><span class="audit-t">' + h(R.nameOf(s, cp)) + '</span><br><span class="audit-s">' + h(i.what) + '</span></span><span class="audit-r"><span class="audit-v ' + (plus ? 'plus' : 'minus') + '">' + (plus ? '+' : '-') + R.rupees(i.amount) + '</span><br><span class="audit-s">' + R.clock(i.at) + ' · ' + h(i.status) + '</span></span></button>';
      }).join('') : empty('No entries yet. IOUs appear when you complete a task or use custodial goods.')) + '</div></div>';
    return '<p class="eyebrow" style="color:var(--emerald-hi)">Custody and ledger</p><h1 class="h1">Ledger</h1>' + cs.map(function (c) { return custodySheet(s, c); }).join('') + led;
  }
  function custodyDetail(s) {
    var c = R.custodyById(s, V.p.id); if (!c) return empty('Custody not found.');
    var o = R.orphanById(s, c.orphan);
    var log = [{ at: c.at, text: 'Custody requested for ' + c.hours + ' hours: ' + c.use.toLowerCase() + '.' }]
      .concat(c.attestors.filter(function (a) { return a.answer; }).map(function (a) { return { at: a.at, text: s.nodes[a.node].name + ': ' + ANS[a.answer].toLowerCase() + '.' }; }))
      .concat(c.start ? [{ at: c.start, text: 'Custody issued until ' + R.dayTime(c.expiry) + '.' }] : [])
      .concat(c.releases.map(function (r) { return { at: r.at, text: 'Released ' + R.num(r.qty) + ' ' + c.unit + ' to ' + s.nodes[r.to].name + '. IOU ' + r.iou + ' to ' + R.ownerName(s, c) + '.' }; }))
      .concat(c.endedAt ? [{ at: c.endedAt, text: 'Custody ended. Asset returned.' }] : []);
    var ious = s.obligations.filter(function (i) { return i.source.kind === 'custody' && i.source.id === c.id; });
    return '<div class="card card-emerald"><div class="card-top"><p class="eyebrow">Custody permit</p><span class="chip chip-emerald">' + h(c.id) + '</span></div><dl class="kv">' + kv('Asset', h(R.amount(o)) + ', ' + h(o.place)) + kv('Holder', h(s.nodes[c.holder].name)) +
      kv('Owner claim', h(R.ownerName(s, c)) + '. Kept on the record; ownership does not change.') + kv('Expiry', c.status === 'active' ? R.dayTime(c.expiry) + ' (' + R.dur(c.expiry - s.now) + ' left)' : cap(c.status)) +
      kv('Inventory', R.num(c.remaining) + ' of ' + R.num(o.qty) + ' ' + h(o.unit) + ' remain') + '</dl>' + (o.photo ? '<img src="' + h(o.photo) + '" alt="Condition photo" width="96" height="96" class="thumb-lg">' : '') + '</div>' +
      '<div class="card"><p class="eyebrow">Usage log</p><ul class="timeline" style="margin-top:8px">' + log.map(function (l) { return '<li><span class="num">' + R.stamp(s, l.at) + '</span><span>' + h(l.text) + '</span></li>'; }).join('') + '</ul></div>' +
      (ious.length ? secH('IOUs to the owner') + ious.map(function (i) { return item({ tone: 'yellow', title: h(R.nameOf(s, i.from)) + ' owes ' + h(R.nameOf(s, i.to)), sub: h(i.what) + '. Recorded by you as custodian.', right: '<span class="money">' + R.rupees(i.amount) + '</span>' }); }).join('') : '') +
      (c.status === 'active' ? '<div class="foot">' + btn('Record a release', 'sheet', { k: 'release', id: c.id }, 'primary') + btn('Return asset', 'sheet', { k: 'returnAsset', id: c.id }) + '</div>' : '');
  }

  /* ---------- A19 settings ---------- */
  function settings(s) {
    function toggle(key, label, sub) { return '<label class="toggle"><span><span class="item-title">' + label + '</span><span class="item-sub">' + sub + '</span></span><input type="checkbox" data-setting="' + key + '"' + (s.settings[key] ? ' checked' : '') + '></label>'; }
    return '<h1 class="h1">Settings and help</h1>' + secH('Language') + '<div class="opts opts-3">' + LANGS.map(function (l) { return '<button type="button" class="opt' + (V.lang === l[0] ? ' sel' : '') + '" data-a="lang" data-lang="' + l[0] + '" aria-pressed="' + (V.lang === l[0]) + '">' + h(l[1]) + '</button>'; }).join('') + '</div><p class="fine">Hindi and Marathi cover navigation and check-in in this prototype.</p>' +
      secH('Connection') + toggle('offline', 'Simulate no data connection', 'Actions are sent by SMS and marked "Sent by SMS".') +
      secH('Operating') + item({ title: 'Pause or stop operating', sub: 'Records you as not operating. Partners see it at once.', right: btn('Pause', 'sheet', { k: 'pause' }, 'secondary', ' style="min-height:44px"') }) +
      secH('Help') + item({ title: 'Contact my anchor', sub: 'Ravi Agencies will call you back. Calls are simulated.', right: btn('Request call', 'helpCall', null, 'secondary', ' style="min-height:44px"') });
  }

  /* ---------- sheets ---------- */
  function sheet(s) {
    var k = V.sheet && V.sheet.k; if (!k) return '';
    var p = V.sheet, title = '', body = '';
    if (k === 'lang') {
      title = 'Language'; body = '<div class="opts">' + LANGS.map(function (l) { return '<button type="button" class="opt' + (V.lang === l[0] ? ' sel' : '') + '" data-a="lang" data-lang="' + l[0] + '">' + h(l[1]) + '</button>'; }).join('') + '</div>';
    } else if (k === 'openLink') {
      var e = s.edges.filter(function (x) { return x.id === p.edge; })[0];
      var oid = e.from === s.me ? e.to : e.from, n = s.nodes[oid], st = R.nodeState(s, oid), pend = R.pendingProposalFor(s, e.id);
      var cv = n.checkin && s.now - n.checkin.at <= 1440 ? (n.checkin.operating ? R.capWord(n.checkin.capacity) + ' capacity' : 'Not operating') : 'Not reported';
      title = n.name;
      body = '<div class="sheet-tags">' + U.tag(st) + U.verif(n) + '</div><dl class="kv">' + kv('Last update', h(R.stateDetail(s, oid))) + kv('Capacity', h(cv)) + kv('Role', h(cap(n.role)) + ', ' + h(n.area)) +
        kv('Trade history', h(e.freq) + ': ' + h(e.product) + (e.loadKg ? ', ' + R.num(e.loadKg) + ' kg a day' : '') + (e.pre ? '. Before the Snap.' : '. New link from ' + R.stamp(s, e.at) + '.')) + '</dl>';
      var broken = !R.isOperating(st) && !e.replacedBy && !e.replaces;
      if (e.replacedBy) { var ne = s.edges.filter(function (x) { return x.id === e.replacedBy; })[0]; body += item({ tone: 'green', title: 'Replaced by ' + h(s.nodes[ne.from].name), sub: 'Confirmed ' + R.stamp(s, ne.at) + '.' }); }
      if (pend) body += item({ tone: 'blue', title: 'Proposal to ' + h(s.nodes[pend.to].name) + ' waiting', sub: 'Sent ' + R.ago(s, pend.at) + '. Provisional until they confirm.' });
      var acts = '';
      if (broken && !pend) acts += btn('Find a substitute', 'go', { tab: 'chain', screen: 'subs', edge: e.id }, 'primary', '', 'split');
      if (pend) acts += btn('View proposal', 'go', { tab: 'chain', screen: 'subs', edge: e.id }, 'primary');
      if (!R.isOperating(st) && n.cantReach.indexOf(s.me) < 0) acts += btn('Report cannot reach', 'cantReach', { node: oid });
      else if (n.cantReach.indexOf(s.me) >= 0) body += '<p class="fine">You reported you cannot reach them. ' + n.cantReach.length + ' report' + (n.cantReach.length === 1 ? '' : 's') + ' so far; 2 reports and 6 hours of silence mark a node probably gone.</p>';
      if (acts) body += '<div class="foot">' + acts + '</div>';
    } else if (k === 'propose') {
      var cand = s.nodes[p.to], ed = s.edges.filter(function (x) { return x.id === p.edge; })[0];
      title = 'Propose link';
      body = '<p class="lead">' + h(cand.name) + ' will be asked to confirm. The link stays provisional until they do.</p><dl class="kv">' + kv('What', h(ed.product)) + kv('Volume', R.num(ed.loadKg) + ' kg a day, ' + h(ed.freq.toLowerCase())) + kv('They receive', ed.cold ? 'Van hours recorded as an IOU at ₹1,200 an hour' : 'IOU per trip') + '</dl>' +
        '<div class="foot">' + btn('Propose link', 'proposeLink', { edge: p.edge, to: p.to }, 'primary') + btn('Cancel', 'closeSheet') + '</div>';
    } else if (k === 'why') {
      var sb = R.substitutes(s, p.edge);
      title = 'Why this order';
      body = '<p class="fine">Score out of 100: role match 25, distance 25, spare capacity 20, trade with the same partners 15, trust 15. Nodes that are not operating, lack refrigeration or have no free vehicle are left out.</p>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Node</th><th scope="col">Score</th><th scope="col">Role</th><th scope="col">Dist.</th><th scope="col">Spare</th><th scope="col">History</th><th scope="col">Trust</th></tr></thead><tbody>' +
        sb.candidates.map(function (c) { return '<tr><th scope="row">' + h(s.nodes[c.id].name) + '</th><td class="num v-emerald"><strong>' + c.score + '</strong></td><td class="num">' + Math.round(25 * c.parts.role) + '</td><td class="num">' + Math.round(25 * c.parts.distance) + '</td><td class="num">' + Math.round(20 * c.parts.capacity) + '</td><td class="num">' + Math.round(15 * c.parts.history) + '</td><td class="num">' + Math.round(15 * c.parts.trust) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    } else if (k === 'decline') {
      title = 'Decline task ' + p.id;
      body = '<p class="lead">Why? The request stays open in the queue for other carriers.</p><div class="opts">' + ['No vehicle', 'Too far', 'No driver today', 'Other'].map(function (r) { return btn(r, 'declineTask', { id: p.id, reason: r }); }).join('') + '</div>';
    } else if (k === 'need') {
      var nd = R.needById(s, p.id), qi = R.queueInfo(s, nd);
      title = R.amount(nd);
      body = '<div class="sheet-tags">' + U.tierTag(R.effectiveTier(s, nd)) + U.tag(nd.status, cap(nd.status)) + '</div>' + (R.tierVerified(s, nd) ? '' : '<div class="callout">' + icon('shield') + '<span>' + h(R.verifierText(s, nd)) + '</span></div>') +
        (nd.status === 'open' ? '<p class="lead">' + h(qi.reason) + '</p><p class="lead"><strong>Expected between ' + qi.range[0] + ' and ' + qi.range[1] + ' hours.</strong> This is a range, not a promise.</p>' : '<p class="lead">' + cap(nd.status) + '.</p>');
    } else if (k === 'postNeed') {
      var tr = p.preset === 'transport';
      title = 'Post a need';
      body = '<form data-form="postNeed"><label class="field"><span class="flabel">What</span><input name="what" required value="' + (tr ? 'Refrigerated transport, Chakan to Swargate' : '') + '"></label>' +
        '<div class="field-row"><label class="field"><span class="flabel">How much</span><input name="qty" inputmode="numeric" required value="' + (tr ? '350' : '') + '"></label><label class="field"><span class="flabel">Unit</span><input name="unit" value="' + (tr ? 'kg' : 'litre') + '"></label></div>' +
        '<label class="field"><span class="flabel">By when</span><select name="by"><option value="1200">Today, 20:00</option><option value="1920">Day 2, 08:00</option><option value="' + (s.now + 4320) + '">Within 3 days</option></select></label>' +
        '<fieldset class="field"><legend>Tier</legend>' + [[0, 'Tier 0: life-critical. Needs verification by an anchor, an authority or two neighbours'], [1, 'Tier 1: survival. Needs the same verification'], [2, 'Tier 2: stability, inputs for Tier 0 and 1'], [3, 'Tier 3: everything else']].map(function (x) { return radio('tier', x[0], x[0] === 2, x[1]); }).join('') + '</fieldset>' +
        '<p class="fine">Unverified Tier 0 and Tier 1 claims are treated as Tier 2 until verified.</p><div class="foot"><button type="submit" class="btn btn-primary">Post need</button></div></form>';
    } else if (k === 'iou') {
      var ents = s.obligations.filter(function (i) { return (i.from === s.me && i.to === p.cp) || (i.to === s.me && i.from === p.cp); });
      title = R.nameOf(s, p.cp);
      body = ents.map(function (i) {
        var src = i.source.kind === 'task' ? 'Task ' + i.source.id : i.source.kind === 'custody' ? 'Custody ' + i.source.id : 'Transfer';
        return '<div class="card" style="padding:14px"><div class="card-top"><span class="item-title">' + (i.from === s.me ? 'You owe' : 'Owes you') + ' <span class="num">' + R.rupees(i.amount) + '</span></span>' + U.tag(i.status, cap(i.status)) + '</div>' +
          '<p class="item-sub">' + h(i.what) + '. From ' + h(src) + ', ' + R.stamp(s, i.at) + '. Entry ' + h(i.id) + '.</p><div class="inline-actions">' +
          (i.status === 'open' && i.to === s.me ? btn('Mark settled', 'settle', { id: i.id }) : '') + (i.status === 'open' ? btn('Raise dispute', 'dispute', { id: i.id }) : '') + '</div></div>';
      }).join('');
    } else if (k === 'release') {
      var c = R.custodyById(s, p.id), o = R.orphanById(s, c.orphan);
      title = 'Record a release';
      body = '<form data-form="release" data-id="' + c.id + '"><p class="lead">' + R.num(c.remaining) + ' ' + h(o.unit) + ' remain. Each release creates an IOU to ' + h(R.ownerName(s, c)) + '.</p>' +
        '<label class="field"><span class="flabel">How many ' + h(o.unit) + '</span><input name="qty" inputmode="numeric" value="10" required></label>' +
        '<label class="field"><span class="flabel">Released to</span><select name="to"><option value="hck">Hadapsar Community Kitchen</option><option value="meena">Meena Stores</option><option value="' + s.me + '">' + h(s.nodes[s.me].name) + ' (own use)</option></select></label>' +
        '<div class="foot"><button type="submit" class="btn btn-primary">Record release</button></div></form>';
    } else if (k === 'returnAsset') {
      title = 'Return asset';
      body = '<p class="lead">Custody ends now. The remaining stock stays at the owner\'s premises and release IOUs stay open for the owner. This cannot be undone.</p><div class="foot">' + btn('Return asset', 'returnCustody', { id: p.id }, 'danger') + btn('Cancel', 'closeSheet') + '</div>';
    } else if (k === 'pause') {
      title = 'Pause operating';
      body = '<p class="lead">You will be recorded as not operating. Tasks will stop being offered to you until you check in again.</p><div class="foot">' + btn('Pause operating', 'pauseNow', null, 'danger') + btn('Cancel', 'closeSheet') + '</div>';
    } else if (k === 'sos') {
      title = 'Send SOS';
      body = '<p class="lead">This alerts the Pune district relief cell and the nodes on this task. Use it only for danger to people.</p><div class="foot">' + btn('Send SOS', 'sosSend', { id: p.id }, 'danger') + btn('Cancel', 'closeSheet') + '</div>';
    } else if (k === 'editNode') {
      var me = s.nodes[s.me];
      title = 'Change details';
      body = '<form data-form="editNode"><label class="field"><span class="flabel">Name</span><input name="name" value="' + h(me.name) + '" required></label><label class="field"><span class="flabel">Area</span><input name="area" value="' + h(me.area) + '"></label>' +
        '<label class="field"><span class="flabel">' + h(me.vehicles[0].label) + 's in normal times</span><input name="vehicles" inputmode="numeric" value="' + me.vehicles[0].count + '"></label><div class="foot"><button class="btn btn-primary" type="submit">Save and check in</button></div></form>';
    } else if (k === 'selfCreate') {
      title = 'Create your node';
      body = '<form data-form="selfCreate"><p class="fine">Your node will be marked Self-declared until a neighbour or anchor vouches for you. This demo then continues with an empty chain.</p><label class="field"><span class="flabel">Business name</span><input name="name" required></label>' +
        '<label class="field"><span class="flabel">Role</span><select name="role"><option>transporter</option><option>distributor</option><option>wholesaler</option><option>kirana</option><option>pharmacy</option><option>delivery rider</option></select></label>' +
        '<label class="field"><span class="flabel">Area</span><input name="area" required></label><label class="field"><span class="flabel">Main product</span><input name="product"></label><div class="foot"><button class="btn btn-primary" type="submit">Create node</button></div></form>';
    } else if (k === 'linkRequest') {
      var pr = s.proposals.filter(function (x) { return x.id === p.id; })[0];
      title = 'Link request received';
      body = '<span class="chip chip-amber sim-badge">Viewing as ' + h(s.nodes[pr.to].name) + ', simulated</span><p class="lead">' + h(s.nodes[pr.from].name) + ' proposes a link.</p><dl class="kv">' + kv('They need', h(pr.product)) + kv('Volume', R.num(pr.loadKg) + ' kg a day') + kv('How often', 'Daily') + kv('You receive', h(pr.terms)) + kv('Their status', h(R.stateDetail(s, pr.from))) + '</dl>' +
        (pr.status === 'pending' ? '<div class="foot">' + btn('Accept link', 'respond', { id: pr.id, accept: 1 }, 'primary') + btn('Decline', 'respond', { id: pr.id, accept: 0 }) + '</div>' : '<p class="lead">' + cap(pr.status) + '.</p>');
    }
    return '<div class="scrim" data-a="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-handle" aria-hidden="true"></div>' +
      '<div class="sheet-head"><h2 id="sheet-title" class="h2" tabindex="-1">' + h(title) + '</h2><button type="button" class="icon-btn" data-a="closeSheet" aria-label="Close">' + icon('cross', null, 18) + '</button></div><div class="sheet-body">' + body + '</div></div>';
  }

  /* ---------- router ---------- */
  function render(s, view) {
    V = view;
    var stage = s.session.stage, main;
    if (stage === 'invite' && V.onb !== 'phone') main = invite(s);
    else if (stage === 'invite') main = phone(s);
    else if (stage === 'claim') main = claim(s);
    else if (stage === 'checkin') main = checkin(s);
    if (main) return '<div class="screen">' + sbar(s) + banners(s) + '<main class="app-main" id="app-main">' + main + '</main><span class="homebar" aria-hidden="true"></span>' + sheet(s) + '</div>';
    if (V.afterCheckin) main = afterCheckin(s);
    else if (V.screen === 'checkin') main = checkin(s);
    else if (V.screen === 'subs') main = subs(s);
    else if (V.screen === 'task') main = taskDetail(s);
    else if (V.screen === 'handoff') main = handoff(s);
    else if (V.screen === 'orphanReport') main = orphanReport(s);
    else if (V.screen === 'custody') main = custody(s);
    else if (V.screen === 'custodyDetail') main = custodyDetail(s);
    else if (V.screen === 'settings') main = settings(s);
    else main = ({ today: today, chain: chain, tasks: tasks, handoff: handoffTab, ledger: ledger }[V.tab] || today)(s);
    return '<div class="screen">' + sbar(s) + header(s) + banners(s) + '<main class="app-main" id="app-main">' + main + '</main>' + bnav(s) + '<span class="homebar" aria-hidden="true"></span>' + sheet(s) + '</div>';
  }
  function readAloudText(s, id, isHandoff) {
    var tk = R.task(s, id), ns = R.nextStep(s, tk);
    return (isHandoff ? 'Handoff for task ' : 'Task ') + tk.id + '. ' + R.amount(tk) + '. From ' + R.nameOf(s, tk.from) + ' to ' + R.nameOf(s, tk.to) + '. By ' + R.clock(tk.by) + '. ' + R.taskReason(s, tk) + (ns ? ' Next step: ' + ns.label + '.' : '');
  }

  root.Operator = { render: render, sbar: sbar, readAloudText: readAloudText, myCode: myCode, QUICK: QUICK, handoffDue: handoffDue };
})(window);
