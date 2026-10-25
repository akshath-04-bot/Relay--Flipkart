/* Shared view helpers for the Obsidian Kinetic skin: icons, chips, constellation, continuity strip, dark vector map. */
(function (root) {
  'use strict';
  var R = root.Relay;

  function h(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  var P = {
    single: '<circle cx="12" cy="12" r="7"/>',
    pooled: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
    truck: '<path d="M2 6h12v10H2zM14 10h4l4 4v2h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    hub: '<circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/>',
    dashboard: '<rect x="3" y="3" width="8" height="10" rx="2"/><rect x="13" y="3" width="8" height="6" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    verified: '<path d="M12 2l2.5 2 3.2-.3.8 3.1 2.6 1.9-1.3 3 1.3 3-2.6 1.9-.8 3.1-3.2-.3L12 22l-2.5-2-3.2.3-.8-3.1-2.6-1.9 1.3-3-1.3-3 2.6-1.9.8-3.1 3.2.3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    signal: '<path d="M4 20v-3M9 20v-7M14 20v-11M19 20V4"/>',
    battery: '<rect x="7" y="4" width="10" height="17" rx="2"/><path d="M10 2h4"/><rect x="9" y="9" width="6" height="10" fill="currentColor" stroke="none"/>',
    cold: '<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/>',
    medicine: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 4h6v3M12 10v7M8.5 13.5h7"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    hand: '<path d="M2 14h4l5 3h5a2 2 0 000-4h-4M6 14l5-4h4l6 3v5l-6 2-9-2"/>',
    ledger: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    task: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 3v3h8V3M8 12l3 3 5-6"/>',
    camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
    pin: '<path d="M12 22s7-7 7-12a7 7 0 00-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    sms: '<path d="M3 4h18v13H9l-5 4v-4H3z"/><path d="M7 9h10M7 12h6"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    cross: '<path d="M5 5l14 14M19 5L5 19"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 17v2"/>',
    sos: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 15v2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    language: '<path d="M3 5h10M8 3v2M5 5c1 4 4 7 7 8M11 5c-1 4-4 7-7 8"/><path d="M13 21l4-9 4 9M14.5 18h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    back: '<path d="M15 4l-8 8 8 8"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    speaker: '<path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M16 8c2 2 2 6 0 8M19 5c4 4 4 10 0 14"/>',
    route: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h8a3 3 0 010 6H9a3 3 0 000 6h8"/>',
    split: '<path d="M6 3v6a6 6 0 006 6h0a6 6 0 016 6v0M18 3v4M6 21v-2"/><path d="M15 6l3-3 3 3"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    minus: '<path d="M4 12h16"/>',
    inventory: '<path d="M3 4h18v5H3zM5 9v11h14V9M10 13h4"/>'
  };
  function icon(name, label, size) {
    var s = size || 22;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"' +
      (label ? ' role="img" aria-label="' + h(label) + '"' : ' aria-hidden="true" focusable="false"') + '>' + (P[name] || '') + '</svg>';
  }

  var TONE = { active: 'green', reduced: 'yellow', unknown: 'grey', not_operating: 'grey', probably_gone: 'red', gone: 'red', proposed: 'blue',
    open: 'blue', matched: 'green', fulfilled: 'green', awaiting: 'yellow', refused: 'red', returned: 'grey', settled: 'grey', disputed: 'red',
    offered: 'blue', accepted: 'green', in_progress: 'green', delivered: 'grey', declined: 'grey', unclaimed: 'yellow', custody_requested: 'blue', in_custody: 'green' };
  var CHIP = { green: 'emerald', yellow: 'amber', grey: 'grey', red: 'red', blue: 'sky' };
  function tag(status, word) {
    var tone = TONE[status] || 'grey';
    return '<span class="chip chip-' + CHIP[tone] + '">' + (tone === 'green' ? '<span class="pdot" aria-hidden="true"></span>' : tone === 'red' ? icon('cross', null, 13) : tone === 'grey' ? icon('clock', null, 13) : '') + h(word || R.STATE_WORD[status] || status) + '</span>';
  }
  function tierTag(tier, claimedOnly) { return '<span class="tier tier-' + tier + '">Tier ' + tier + (claimedOnly ? ' claimed' : '') + '</span>'; }
  var VERIF = { anchor: 'Anchor-verified', neighbour: 'Neighbour-verified', self: 'Self-declared' };
  function verif(n) { return '<span class="verif">' + icon('shield', null, 14) + h(VERIF[n.verification] || 'Self-declared') + '</span>'; }
  function trustBar(t) {
    var w = R.trustWord(t), k = w === 'High' ? 3 : w === 'Medium' ? 2 : 1;
    return '<span class="trust" aria-label="Trust ' + w.toLowerCase() + '"><span class="bars">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= k ? 'on' : '') + '"></i>'; }).join('') + '</span>' + w + '</span>';
  }
  function shortName(n) {
    var w = n.name.split(' ');
    if (n.id === 'hck') return 'Kitchen';
    if (n.id === 'mandi') return 'Mandi Assn.';
    return w[0] === 'Ravi' ? 'Ravi Ag.' : w[0];
  }

  /* ---------- constellation (Chain) ---------- */
  var COL = { active: '#10B981', reduced: '#F59E0B', unknown: '#64748B', not_operating: '#64748B', probably_gone: '#EF4444', gone: '#EF4444', proposed: '#38BDF8' };
  var GLOW = { active: 'glow-g', reduced: 'glow-a', probably_gone: 'glow-r', gone: 'glow-r', proposed: 'glow-s' };
  var LBL = { active: 'green', reduced: 'amber', probably_gone: 'red', gone: 'red', proposed: 'sky' };
  function link(x1, y1, x2, y2, st, cls) {
    var l = function (a, b, c, d, attrs) { return '<line x1="' + a + '" y1="' + b + '" x2="' + c + '" y2="' + d + '" ' + attrs + '/>'; };
    if (st === 'active') return l(x1, y1, x2, y2, 'stroke="#10B981" stroke-width="2.5" class="' + (cls || 'cl-flow') + ' glow-g"' + (cls ? ' pathLength="1"' : ''));
    if (st === 'reduced') return l(x1, y1, x2, y2, 'stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="7 5" class="glow-a"');
    if (st === 'proposed') return l(x1, y1, x2, y2, 'stroke="#38BDF8" stroke-width="2" stroke-dasharray="4 5" class="cl-flow glow-s"');
    if (st === 'probably_gone' || st === 'gone') {
      var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = (x2 - x1), dy = (y2 - y1), L = Math.hypot(dx, dy) || 1, gx = dx / L * 9, gy = dy / L * 9;
      return '<g class="cl-severed glow-r">' + l(x1, y1, mx - gx, my - gy, 'stroke="#EF4444" stroke-width="2.5" stroke-dasharray="6 4"') + l(mx + gx, my + gy, x2, y2, 'stroke="#EF4444" stroke-width="2.5" stroke-dasharray="6 4"') +
        '<path d="M' + (mx - 5) + ' ' + (my - 5) + 'l10 10M' + (mx + 5) + ' ' + (my - 5) + 'l-10 10" stroke="#F87171" stroke-width="2.5"/></g>';
    }
    return l(x1, y1, x2, y2, 'stroke="#64748B" stroke-width="2" stroke-dasharray="2 5"');
  }
  function cnode(x, y, n, st, r, attrs, sel, label, small) {
    var c = COL[st] || '#64748B', shape;
    var dash = st === 'unknown' || st === 'not_operating' ? ' stroke-dasharray="3 3"' : st === 'proposed' ? ' stroke-dasharray="4 3"' : '';
    if (n.type === 'pooled') shape = '<rect class="cn-ring" x="' + (x - r) + '" y="' + (y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" rx="' + (r * 0.4) + '" fill="#0B0E14" stroke="' + c + '" stroke-width="2"' + dash + '/>';
    else shape = '<circle class="cn-ring" cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#0B0E14" stroke="' + c + '" stroke-width="2"' + dash + '/>';
    var inner = st === 'probably_gone' || st === 'gone' ? '<path d="M' + (x - 5) + ' ' + (y - 5) + 'l10 10M' + (x + 5) + ' ' + (y - 5) + 'l-10 10" stroke="#F87171" stroke-width="2.4"/>'
      : st === 'unknown' || st === 'not_operating' ? '<circle cx="' + x + '" cy="' + y + '" r="2.5" fill="#64748B"/>'
        : '<circle cx="' + x + '" cy="' + y + '" r="' + (small ? 3 : 4.5) + '" fill="' + c + '"/>';
    var selRing = sel ? '<circle cx="' + x + '" cy="' + y + '" r="' + (r + 7) + '" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="3 3"/>' : '';
    return '<g class="cn ' + (GLOW[st] || '') + '"' + (attrs || '') + '><circle cx="' + x + '" cy="' + y + '" r="28" fill="transparent"/>' + selRing + shape + inner +
      '<text x="' + x + '" y="' + (y + r + 15) + '" text-anchor="middle" class="cn-label ' + (LBL[st] || '') + '">' + h(label) + '</text></g>';
  }
  function constellation(s, selEdge) {
    var st = R.chainStrip(s), me = s.nodes[s.me], W = 340, H = 372, cx = 170, cy = 178, RAD = 132;
    if (!st.up.length && !st.down.length) return '<p class="empty">No links yet. Invite a supplier, buyer or driver you trade with.</p>';
    function arc(list, from, to) {
      return list.map(function (it, i) {
        var a = list.length === 1 ? (from + to) / 2 : from + (to - from) * i / (list.length - 1);
        var rad = a * Math.PI / 180;
        return Object.assign({ x: Math.round(cx + RAD * Math.cos(rad)), y: Math.round(cy + RAD * Math.sin(rad)) }, it);
      });
    }
    var up = arc(st.up, 212, 328), down = arc(st.down, 14, 166);
    var lines = '', nodes = '';
    up.concat(down).forEach(function (it) {
      var anim = s.ui && s.ui.animateEdge === it.edgeId && it.replaces;
      lines += link(it.x, it.y, cx, cy, it.status === 'proposed' ? 'probably_gone' : it.status, anim ? 'cl-redraw' : null);
      if (it.status === 'proposed') {
        // Old partner stays on its slot with a severed link; the proposed substitute sits beside it with a dashed provisional link.
        var ax = it.x + (it.x < cx ? 62 : -62) * 0.0 + (it.side === 'up' ? 0 : 0), ay = it.y;
        ax = Math.min(W - 26, Math.max(26, it.x + (it.x <= cx ? -52 : 52))); ay = it.y + 30;
        lines += link(ax, ay, cx, cy, 'proposed');
        nodes += cnode(ax, ay, s.nodes[it.id], 'proposed', 10, ' role="button" tabindex="0" data-a="cnSel" data-edge="' + it.origEdge + '" aria-label="' + h(s.nodes[it.id].name + ': proposed substitute, waiting for confirmation') + '"', selEdge === it.origEdge, shortName(s.nodes[it.id]) + ' (alt)', true);
      }
    });
    up.concat(down).forEach(function (it) {
      var nid = it.status === 'proposed' ? it.replaces : it.id, n = s.nodes[nid];
      var stt = it.status === 'proposed' ? R.nodeState(s, nid) : it.status;
      var word = R.STATE_WORD[stt];
      var lab = shortName(n) + (stt === 'probably_gone' || stt === 'gone' ? ' (severed)' : '');
      var aria = 'Link to ' + n.name + ': ' + word.toLowerCase() + (it.replaces && it.status !== 'proposed' ? ', replaces ' + s.nodes[it.replaces].name : '') + '. ' + R.stateDetail(s, nid);
      nodes += cnode(it.x, it.y, n, stt, 13, ' role="button" tabindex="0" data-a="cnSel" data-edge="' + it.origEdge + '" aria-label="' + h(aria) + '"', selEdge === it.origEdge, lab);
    });
    var you = '<g class="glow-s"><circle cx="' + cx + '" cy="' + cy + '" r="26" fill="rgba(56,189,248,.12)" stroke="#38BDF8" stroke-width="2.5"/><circle cx="' + cx + '" cy="' + cy + '" r="9" fill="#38BDF8"/></g>' +
      '<text x="' + cx + '" y="' + (cy - 36) + '" text-anchor="middle" class="cn-label sky">YOU</text>';
    return '<svg class="const-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Your chain: ' + st.up.length + ' upstream and ' + st.down.length + ' downstream links. Upstream above, downstream below.">' +
      '<text x="12" y="18" class="cn-label">UPSTREAM</text><text x="12" y="' + (H - 8) + '" class="cn-label">DOWNSTREAM</text>' + lines + you + nodes + '</svg>';
  }
  function continuity(s) {
    var st = R.chainStrip(s), all = st.up.concat(st.down);
    var tk = R.rankedTasks(s, ['offered', 'accepted', 'in_progress']).filter(function (x) { return R.taskTier(s, x) === 0; })[0];
    if (tk) {
      var pick = function (fn) { return all.filter(fn)[0]; };
      var sup = pick(function (x) { return x.id === tk.from || x.replaces === tk.from; });
      var car = pick(function (x) { var e = s.edges.filter(function (y) { return y.id === x.origEdge; })[0]; return e && e.cold; });
      var rec = pick(function (x) { return x.id === tk.to; });
      st = { up: [sup, car].filter(Boolean), down: [rec].filter(Boolean) };
    }
    else {
      var live = all.filter(function (x) { return x.status === 'active' || x.status === 'reduced'; }).length;
      var bad = function (x) { return x.status !== 'active' && x.status !== 'reduced'; };
      st = { up: st.up.filter(bad), down: st.down.filter(bad), live: live };
    }
    function c(it) { var n = s.nodes[it.status === 'proposed' ? it.replaces : it.id]; return '<span class="cs cs-' + it.status + '" title="' + h(n.name + ': ' + R.STATE_WORD[it.status]) + '"><i></i><span>' + h(shortName(n)) + (it.status === 'probably_gone' || it.status === 'gone' ? ' ✕' : '') + '</span></span>'; }
    return '<div class="cont-strip" aria-hidden="true">' + st.up.map(c).join('') + '<span class="cs cs-you"><i></i><span>YOU</span></span>' + st.down.map(c).join('') + (st.live != null ? '<span class="cs cs-active"><i></i><span>+' + st.live + ' live</span></span>' : '') + '</div>';
  }
  function legend() {
    function sw(st, word) { return '<span class="lg"><svg width="30" height="10" aria-hidden="true">' + link(2, 5, 28, 5, st === 'active' ? 'active' : st) + '</svg>' + word + '</span>'; }
    return '<div class="legend">' + sw('active', 'Active') + sw('reduced', 'Reduced') + sw('unknown', 'No reply') + sw('probably_gone', 'Severed') + sw('proposed', 'Proposed') + '</div>';
  }

  /* ---------- dark vector map (km grid x20) ---------- */
  var K = 20;
  var BASE = (function () {
    function pl(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] * K + ' ' + p[1] * K; }).join(''); }
    var river = pl([[3, 15], [9, 17], [13, 19], [16, 21], [20, 20.5], [24, 21.5], [30, 22.5], [38, 24], [50, 25]]);
    var roads = [[[0, 14], [9, 13], [16, 18], [17, 25], [15, 40]], [[18, 0], [19, 4], [17, 11], [16, 18]], [[17, 25], [27, 27], [40, 30], [50, 31]], [[20, 20], [29, 19], [33, 16], [45, 9]], [[22, 18], [25, 22], [27, 26]]];
    var areas = [['Chakan', 23.6, 1.6], ['Bhosari', 11, 8.2], ['Pimpri', 5.5, 11.5], ['Shivajinagar', 9, 20.5], ['Yerawada', 20.6, 17], ['Kharadi', 30, 17.4], ['Wagholi', 34.5, 14.5], ['Mundhwa', 21.4, 23.9], ['Hadapsar', 33, 30.6], ['Swargate', 10.6, 26.4], ['Market Yard', 12.4, 30.4]];
    var out = '<rect width="1000" height="800" fill="#0a0f17"/>';
    for (var gx = 0; gx <= 1000; gx += 50) out += '<path d="M' + gx + ' 0V800" stroke="rgba(255,255,255,.035)"/>';
    for (var gy = 0; gy <= 800; gy += 50) out += '<path d="M0 ' + gy + 'H1000" stroke="rgba(255,255,255,.035)"/>';
    out += '<path d="' + river + '" fill="none" stroke="#0e2a40" stroke-width="16" stroke-linecap="round"/>';
    roads.forEach(function (r) { out += '<path d="' + pl(r) + '" fill="none" stroke="#1d2737" stroke-width="8"/><path d="' + pl(r) + '" fill="none" stroke="#2b3850" stroke-width="2.5"/>'; });
    areas.forEach(function (a) { out += '<text x="' + a[1] * K + '" y="' + a[2] * K + '" class="map-area">' + a[0] + '</text>'; });
    return out;
  })();
  var FILL = { active: '#10B981', reduced: '#F59E0B', unknown: '#0B0E14', not_operating: '#0B0E14', probably_gone: '#EF4444', gone: '#EF4444' };
  function mapNode(s, id, opts) {
    var n = s.nodes[id], st = opts.st || R.nodeState(s, id), x = n.x * K, y = n.y * K, r = opts.r || 11, sel = opts.selected === id;
    var stroke = st === 'unknown' || st === 'not_operating' ? '#94A3B8' : '#0B0E14';
    var dash = st === 'unknown' || st === 'not_operating' ? ' stroke-dasharray="4 3"' : '';
    var shape = n.type === 'pooled'
      ? '<rect x="' + (x - r) + '" y="' + (y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" rx="4" fill="' + FILL[st] + '" stroke="' + stroke + '" stroke-width="2.5"' + dash + '/>'
      : '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + FILL[st] + '" stroke="' + stroke + '" stroke-width="2.5"' + dash + '/>';
    if (st === 'reduced') shape += n.type === 'pooled' ? '<rect x="' + (x - r + 2) + '" y="' + (y - r + 2) + '" width="' + (2 * r - 4) + '" height="' + (r - 2) + '" fill="#0B0E14"/>' : '<path d="M' + (x - r + 2) + ' ' + y + 'A' + (r - 2) + ' ' + (r - 2) + ' 0 0 1 ' + (x + r - 2) + ' ' + y + 'Z" fill="#0B0E14"/>';
    var cross = (st === 'probably_gone' || st === 'gone') ? '<path d="M' + (x - 5) + ' ' + (y - 5) + 'l10 10M' + (x + 5) + ' ' + (y - 5) + 'l-10 10" stroke="#fff" stroke-width="2.5"/>' : '';
    var ring = id === s.me ? '<circle cx="' + x + '" cy="' + y + '" r="' + (r + 8) + '" fill="none" stroke="#38BDF8" stroke-width="2.5"/>' : '';
    if (sel) ring += '<circle cx="' + x + '" cy="' + y + '" r="' + (r + 12) + '" fill="none" stroke="#38BDF8" stroke-width="2" stroke-dasharray="4 4"/>';
    var lb = n.lab || [r + 6, 5, 'start'];
    var lbl = opts.labels ? '<text x="' + (x + lb[0]) + '" y="' + (y + lb[1]) + '" text-anchor="' + (lb[2] || 'start') + '" class="map-label">' + h(n.name) + '</text>' : '';
    var a = opts.interactive ? ' role="button" tabindex="0" data-a="mapSel" data-kind="node" data-id="' + id + '" aria-label="' + h(n.name + ': ' + R.STATE_WORD[st]) + '"' : '';
    return '<g class="mn ' + (GLOW[st] || '') + '"' + a + '>' + ring + shape + cross + lbl + (opts.interactive ? '<circle cx="' + x + '" cy="' + y + '" r="24" fill="transparent"/>' : '') + '</g>';
  }
  function mapSvg(s, o) {
    o = o || {};
    var out = BASE;
    (o.shortages || []).forEach(function (n) { out += '<circle cx="' + n.x * K + '" cy="' + n.y * K + '" r="50" fill="rgba(239,68,68,.10)" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="5 5"/>'; });
    (o.edges || []).forEach(function (e) {
      var a = R.place(s, e.from), b = R.place(s, e.to), st = e.status || R.edgeStatus(s, e);
      out += link(a.x * K, a.y * K, b.x * K, b.y * K, st).replace(/stroke-width="2(\.5)?"/g, 'stroke-width="4"');
    });
    (o.route || []).forEach(function (seg) {
      var a = R.place(s, seg.from), b = R.place(s, seg.to);
      out += '<line x1="' + a.x * K + '" y1="' + a.y * K + '" x2="' + b.x * K + '" y2="' + b.y * K + '" stroke="' + (seg.done ? '#10B981' : '#38BDF8') + '" stroke-width="7"' + (seg.done ? '' : ' stroke-dasharray="14 8" class="cl-flow"') + '/>';
    });
    (o.handoffPoints || []).forEach(function (p) {
      var x = p.x * K, y = p.y * K, a = o.interactive ? ' role="button" tabindex="0" data-a="mapSel" data-kind="hp" data-id="' + p.id + '" aria-label="Handoff point: ' + h(p.name) + '"' : '';
      out += '<g class="mn glow-s"' + a + '><rect x="' + (x - 9) + '" y="' + (y - 9) + '" width="18" height="18" rx="4" fill="#0B0E14" stroke="#38BDF8" stroke-width="3"/><rect x="' + (x - 3) + '" y="' + (y - 3) + '" width="6" height="6" fill="#38BDF8"/>' +
        (o.labels !== false ? '<text x="' + (x + (p.lab ? p.lab[0] : 14)) + '" y="' + (y + (p.lab ? p.lab[1] : 20)) + '" text-anchor="' + (p.lab && p.lab[2] || 'start') + '" class="map-label map-hp">' + h(p.name) + '</text>' : '') + '</g>';
    });
    (o.orphans || []).forEach(function (r) {
      var x = r.x * K, y = r.y * K, a = o.interactive ? ' role="button" tabindex="0" data-a="mapSel" data-kind="orphan" data-id="' + r.id + '" aria-label="Orphan ' + h(r.id + ': ' + r.goods) + '"' : '';
      out += '<g class="mn glow-a"' + a + '><rect x="' + (x - 11) + '" y="' + (y - 11) + '" width="22" height="22" rx="5" fill="#0B0E14" stroke="#F59E0B" stroke-width="3.5"/>' +
        '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" class="map-o">' + h(r.id.replace(/\D/g, '').slice(-2)) + '</text>' + (o.interactive ? '<circle cx="' + x + '" cy="' + y + '" r="24" fill="transparent"/>' : '') + '</g>';
    });
    (o.nodes || []).forEach(function (id) { out += mapNode(s, id, o); });
    return '<svg class="map-svg" viewBox="' + (o.viewBox || '0 0 1000 800') + '" preserveAspectRatio="xMidYMid meet" role="' + (o.interactive ? 'group' : 'img') + '" aria-label="' + h(o.label || 'Map of Pune district') + '">' + out + '</svg>';
  }
  function nodeLegend() {
    function g(st, word) { return '<span class="lg"><svg width="22" height="22" viewBox="-11 -11 22 22" aria-hidden="true">' + mapNode({ me: '', nodes: { q: { id: 'q', x: 0, y: 0, type: 'single', name: '' } } }, 'q', { r: 8, st: st }) + '</svg>' + word + '</span>'; }
    return g('active', 'Node active') + g('reduced', 'Node reduced (half filled)') + g('unknown', 'Node no reply (dashed)') + g('probably_gone', 'Node probably gone (cross)');
  }

  function demoPhoto(caption) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="#2a3446"/><rect x="0" y="108" width="160" height="52" fill="#1c2431"/>' +
      '<rect x="22" y="62" width="52" height="52" fill="#c9a66b" stroke="#6b5a3a" stroke-width="2"/><rect x="78" y="70" width="58" height="44" fill="#c9a66b" stroke="#6b5a3a" stroke-width="2"/>' +
      '<rect x="0" y="136" width="160" height="24" fill="#0b0e14"/><text x="8" y="153" font-family="Arial" font-size="13" fill="#34d399">' + h(caption) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  root.UI = { h: h, icon: icon, tag: tag, tierTag: tierTag, verif: verif, trustBar: trustBar, constellation: constellation, continuity: continuity, legend: legend, nodeLegend: nodeLegend, mapSvg: mapSvg, demoPhoto: demoPhoto, shortName: shortName, VERIF: VERIF, TONE: TONE };
})(window);
