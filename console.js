/* Authority and anchor console (desktop): region map with coverage meter, orphans and custody, audit log. Same records as the app and SMS. */
(function (root) {
  'use strict';
  var R = root.Relay, U = root.UI, h = U.h, icon = U.icon;
  var REGIONS = {
    all: { label: 'Pune district, all areas', box: '0 0 1000 800', areas: null },
    haveli: { label: 'Haveli: Hadapsar, Swargate, Market Yard', box: '220 300 560 380', areas: ['Hadapsar', 'Hadapsar Yard', 'Gadital, Hadapsar', 'Mundhwa', 'Kharadi', 'Yerawada', 'Swargate', 'Market Yard', 'Wagholi'] },
    pcmc: { label: 'Pimpri-Chinchwad', box: '60 120 420 300', areas: ['Pimpri', 'Bhosari'] },
    khed: { label: 'Khed: Chakan', box: '260 0 300 200', areas: ['Chakan', 'Chakan MIDC'] }
  };
  var CATS = { all: 'All goods', medicine: 'Medicine', food: 'Food', transport: 'Transport capacity' };
  function inRegion(V, n) { var r = REGIONS[V.con.region]; return !r.areas || r.areas.indexOf(n.area) >= 0; }
  function inCat(V, n) {
    var c = V.con.cat;
    if (c === 'all') return true;
    if (c === 'medicine') return n.products.indexOf('medicine') >= 0;
    if (c === 'food') return n.products.some(function (p) { return ['grain', 'packaged food', 'dairy', 'chilled', 'vegetables'].indexOf(p) >= 0; });
    return n.vehicles.length > 0;
  }
  function visibleNodes(s, V) { return Object.keys(s.nodes).filter(function (id) { var n = s.nodes[id]; return inRegion(V, n) && inCat(V, n); }); }
  function itm(tone, title, sub, right, attrs) {
    return '<' + (attrs ? 'button type="button"' : 'div') + ' class="item"' + (attrs || '') + '><span class="item-dot d-' + tone + '" aria-hidden="true"></span><span class="item-main"><span class="item-title">' + title + '</span>' + (sub ? '<span class="item-sub">' + sub + '</span>' : '') + '</span>' + (right ? '<span class="item-right">' + right + '</span>' : '') + '</' + (attrs ? 'button' : 'div') + '>';
  }
  function top(s, V) {
    var cov = R.coverage(s);
    return '<div class="con-top"><label class="con-f"><span>Region</span><select data-con="region">' + Object.keys(REGIONS).map(function (k) { return '<option value="' + k + '"' + (V.con.region === k ? ' selected' : '') + '>' + h(REGIONS[k].label) + '</option>'; }).join('') + '</select></label>' +
      '<label class="con-f"><span>Category</span><select data-con="cat">' + Object.keys(CATS).map(function (k) { return '<option value="' + k + '"' + (V.con.cat === k ? ' selected' : '') + '>' + h(CATS[k]) + '</option>'; }).join('') + '</select></label>' +
      '<span class="con-asof">' + icon('clock', null, 16) + 'Data as of ' + R.dayTime(s.now) + '</span>' +
      '<div class="cov" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + cov.pct + '" aria-label="Coverage of pre-Snap links"><span class="cov-l">Coverage <strong>' + cov.pct + '%</strong> of pre-Snap links</span><span class="cov-bar"><i style="width:' + cov.pct + '%"></i></span><span class="cov-n">' + cov.known + ' of ' + cov.total + ' links with known status</span></div></div>';
  }
  function rail(V) {
    var items = [['map', 'Region map', 'map'], ['orphans', 'Orphans and custody', 'box'], ['audit', 'Audit log', 'ledger']];
    return '<aside class="rail"><div class="rail-brand"><span class="brand">Relay console</span><span class="rail-org">Pune district relief cell</span></div><nav aria-label="Console">' + items.map(function (i) {
      return '<button type="button" class="rail-i' + (V.con.page === i[0] ? ' on' : '') + '" data-a="conPage" data-v="' + i[0] + '"' + (V.con.page === i[0] ? ' aria-current="page"' : '') + '>' + icon(i[2], null, 20) + h(i[1]) + '</button>';
    }).join('') + '</nav><p class="rail-note">Same records as the operator app and SMS. Authority approvals are fictional in this prototype.</p></aside>';
  }
  var LAYERS = [['nodes', 'Node status'], ['edges', 'Links'], ['orphans', 'Orphans'], ['shortages', 'Shortages'], ['hp', 'Handoff points']];
  var TONE = { active: 'green', reduced: 'yellow', unknown: 'grey', not_operating: 'grey', probably_gone: 'red', gone: 'red' };

  function mapPage(s, V) {
    var ids = visibleNodes(s, V), L = V.con.layers;
    var edges = L.edges ? s.edges.filter(function (e) { return !e.replacedBy && (ids.indexOf(e.from) >= 0 || ids.indexOf(e.to) >= 0); }) : [];
    var openNeeds = s.needs.filter(function (n) { return n.status === 'open' && R.effectiveTier(s, n) <= 1; });
    var shortages = L.shortages ? openNeeds.map(function (n) { return s.nodes[n.node]; }).filter(function (n, i, a) { return a.indexOf(n) === i && ids.indexOf(n.id) >= 0; }) : [];
    var orphans = L.orphans ? s.orphans.filter(function (o) { return o.status !== 'returned'; }) : [];
    var svg = U.mapSvg(s, { nodes: L.nodes ? ids : [], edges: edges, orphans: orphans, shortages: shortages, handoffPoints: L.hp ? s.handoffPoints : [], labels: true, interactive: true, selected: V.con.sel && V.con.sel.id, viewBox: REGIONS[V.con.region].box, label: 'Region map. ' + ids.length + ' nodes shown.' });
    var toggles = '<div class="layers" role="group" aria-label="Map layers">' + LAYERS.map(function (l) { return '<label class="chk"><input type="checkbox" data-layer="' + l[0] + '"' + (L[l[0]] ? ' checked' : '') + '>' + h(l[1]) + '</label>'; }).join('') + '</div>';
    var legend = '<div class="map-legend">' + U.legend() + U.nodeLegend() + '<span class="lg"><svg width="18" height="18" aria-hidden="true"><rect x="2" y="2" width="14" height="14" rx="3" fill="#0B0E14" stroke="#F59E0B" stroke-width="3"/></svg>Orphan</span><span class="lg"><svg width="18" height="18" aria-hidden="true"><rect x="2" y="2" width="14" height="14" rx="3" fill="#0B0E14" stroke="#38BDF8" stroke-width="3"/></svg>Handoff point</span><span class="lg"><svg width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="7" fill="rgba(239,68,68,.15)" stroke="#EF4444" stroke-dasharray="3 2"/></svg>Shortage</span></div>';
    var broken = s.edges.filter(function (e) { return e.pre && !e.replacedBy; }).map(function (e) { return { e: e, st: R.edgeStatus(s, e) }; })
      .filter(function (x) { return ['unknown', 'probably_gone', 'gone', 'not_operating'].indexOf(x.st) >= 0 && (ids.indexOf(x.e.from) >= 0 || ids.indexOf(x.e.to) >= 0); });
    var repaired = s.edges.filter(function (e) { return e.replaces; });
    var tierRows = s.needs.filter(function (n) { return n.tierClaimed <= 1 && n.status !== 'fulfilled'; });
    var brokenCard = '<div class="card"><div class="card-top"><p class="eyebrow">Broken links</p><span class="chip chip-red">' + broken.length + ' broken</span>' + (repaired.length ? '<span class="chip chip-emerald">' + repaired.length + ' repaired</span>' : '') + '</div>' +
      broken.map(function (x) { return itm(TONE[x.st], h(R.nameOf(s, x.e.from)) + ' ➔ ' + h(R.nameOf(s, x.e.to)), h(x.e.product), U.tag(x.st)); }).join('') +
      repaired.map(function (e) { return itm('green', h(R.nameOf(s, e.from)) + ' ➔ ' + h(R.nameOf(s, e.to)), h(e.product) + '. Substitute link.', U.tag('active', 'Repaired ' + R.clock(e.at))); }).join('') + '</div>';
    var needsCard = '<div class="card"><div class="card-top"><p class="eyebrow">Unresolved Tier 0 and Tier 1 requests</p><span class="chip chip-amber">' + tierRows.length + ' open, ' + tierRows.filter(function (n) { return !R.tierVerified(s, n); }).length + ' unverified</span></div>' +
      tierRows.map(function (n) { return itm(R.effectiveTier(s, n) === 0 ? 'red' : 'yellow', h(R.nameOf(s, n.node)) + ': ' + h(R.amount(n)), 'By ' + R.stamp(s, n.by) + '.' + (R.tierVerified(s, n) ? '' : ' Claimed Tier ' + n.tierClaimed + ', unverified, treated as Tier 2.'), U.tierTag(R.effectiveTier(s, n)) + U.tag(n.status, n.status === 'matched' ? 'Matched' : 'Open')); }).join('') + '</div>';
    return '<div class="con-grid"><div class="con-mapcol">' + toggles + '<div class="map-box">' + svg + '</div>' + legend + '<div class="con-cards">' + brokenCard + needsCard + '</div></div><aside class="con-panel" aria-label="Details">' + panel(s, V, ids) + '</aside></div>';
  }
  function dd(k, v) { return '<div><dt>' + h(k) + '</dt><dd>' + v + '</dd></div>'; }
  function panel(s, V, ids) {
    var sel = V.con.sel, close = '<button type="button" class="btn-text" data-a="mapSel" data-kind="">Close</button>';
    if (sel && sel.kind === 'node' && s.nodes[sel.id]) {
      var n = s.nodes[sel.id], st = R.nodeState(s, n.id), links = R.myLinks(s, n.id), stock = s.stock.filter(function (x) { return x.node === n.id; });
      return '<div class="pn-head"><h2 class="h2">' + h(n.name) + '</h2>' + close + '</div><div class="sheet-tags">' + U.tag(st) + U.verif(n) + '</div>' +
        '<dl class="kv">' + dd('Role', h(n.role) + ', ' + (n.type === 'pooled' ? 'site with a team' : 'single person')) + dd('Area', h(n.area)) + dd('Last update', h(R.stateDetail(s, n.id))) +
        dd('Vehicles', n.vehicles.length ? n.vehicles.map(function (v) { return v.count + ' ' + h(v.label.toLowerCase()) + (v.refrigerated ? ', spare ' + R.num(v.spareKg || 0) + ' kg' : ''); }).join('; ') : 'None') +
        dd('Stock', stock.length ? stock.map(function (x) { return h(R.amount(x)); }).join('; ') : 'None reported') +
        dd('Cannot reach', n.cantReach.length ? n.cantReach.map(function (id) { return h(R.nameOf(s, id)); }).join(', ') : 'None') + '</dl>' +
        '<p class="eyebrow">Links (' + links.length + ')</p><div style="margin-top:8px">' + links.map(function (l) { return itm(TONE[l.status] || 'blue', h(R.nameOf(s, l.other)), l.edge.replacedBy ? 'Replaced' : h(l.edge.product), U.tag(l.status)); }).join('') + '</div>';
    }
    if (sel && sel.kind === 'orphan') { var o = R.orphanById(s, sel.id); if (o) return '<div class="pn-head"><h2 class="h2">Orphan ' + h(o.id) + '</h2>' + close + '</div>' + orphanDetail(s, o); }
    if (sel && sel.kind === 'hp') {
      var p = s.handoffPoints.filter(function (x) { return x.id === sel.id; })[0];
      return '<div class="pn-head"><h2 class="h2">' + h(p.name) + '</h2>' + close + '</div><dl class="kv">' + dd('Type', h(p.type)) + (p.contact ? dd('Contact', h(p.contact)) : '') + dd('Hours', h(p.hours)) + dd('Safety', h(p.safety)) + dd('Fuel', h(p.fuel)) + dd('Power', h(p.power)) + '</dl>';
    }
    var counts = {}; ids.forEach(function (id) { var st = R.nodeState(s, id); counts[st] = (counts[st] || 0) + 1; });
    return '<h2 class="h2">Nodes in view (' + ids.length + ')</h2><ul class="counts">' + ['active', 'reduced', 'unknown', 'not_operating', 'probably_gone', 'gone'].filter(function (k) { return counts[k]; }).map(function (k) { return '<li>' + U.tag(k) + '<span class="big">' + counts[k] + '</span></li>'; }).join('') + '</ul>' +
      '<p class="fine">Select a node, orphan or handoff point on the map for details.</p><p class="eyebrow" style="margin-top:16px">Latest activity</p><ul class="timeline">' +
      s.log.slice(-8).reverse().map(function (l) { return '<li><span class="num">' + R.stamp(s, l.at) + '</span><span>' + (l.channel === 'sms' ? '<span class="chip chip-sky chip-sm">SMS</span> ' : '') + h(l.text) + '</span></li>'; }).join('') + '</ul>';
  }
  function orphanDetail(s, o) {
    var cs = s.custody.filter(function (c) { return c.orphan === o.id; });
    var ious = s.obligations.filter(function (i) { return i.source.kind === 'custody' && cs.some(function (c) { return c.id === i.source.id; }); });
    return '<div class="sheet-tags">' + U.tag(o.status, o.status.replace(/_/g, ' ')) + '</div>' + (o.photo ? '<img class="thumb-lg" src="' + h(o.photo) + '" alt="Reported photo of ' + h(o.goods) + '" width="96" height="96">' : '') +
      '<dl class="kv">' + dd('Goods', h(R.amount(o))) + dd('Kind', h(o.type)) + dd('Where', h(o.place)) + dd('Condition', h(o.condition)) +
      dd('Owner', o.owner ? h(R.nameOf(s, o.owner)) + ', ' + h(R.STATE_WORD[R.nodeState(s, o.owner)].toLowerCase()) : h(o.ownerText || 'Not known')) + dd('Reported', 'By ' + h(R.nameOf(s, o.reportedBy)) + ', ' + R.stamp(s, o.at)) + '</dl>' +
      cs.map(function (c) {
        return '<p class="eyebrow" style="margin-top:12px">Custody ' + h(c.id) + ': ' + h(c.status) + '</p><p class="fine">Holder ' + h(R.nameOf(s, c.holder)) + '. Requested ' + R.stamp(s, c.at) + ' for ' + c.hours + ' hours. ' + (c.expiry ? 'Ends ' + R.dayTime(c.expiry) + '. ' : '') + 'Owner claim kept for ' + h(R.ownerName(s, c)) + '.</p>' +
          c.attestors.map(function (a) { return itm(a.answer === 'yes' ? 'green' : a.answer === 'no' ? 'red' : 'grey', h(R.nameOf(s, a.node)), a.answer ? h({ yes: 'Yes, I confirm', no: 'No, they are reachable', unsure: 'I am not sure' }[a.answer]) + (a.reason ? ' ("' + h(a.reason) + '")' : '') : 'No answer yet', a.answer === 'yes' ? '<span class="chip chip-emerald chip-sm">Vouched</span>' : ''); }).join('') +
          (c.releases.length ? '<p class="fine">Releases: ' + c.releases.map(function (r) { return R.num(r.qty) + ' ' + h(c.unit) + ' to ' + h(R.nameOf(s, r.to)) + ' at ' + R.clock(r.at); }).join('; ') + '.</p>' : '');
      }).join('') + (ious.length ? '<p class="fine">Open IOUs to owner: ' + R.rupees(ious.reduce(function (a, i) { return a + i.amount; }, 0)) + '.</p>' : '');
  }
  function orphansPage(s, V) {
    var sel = V.con.sel && V.con.sel.kind === 'orphan' ? R.orphanById(s, V.con.sel.id) : null;
    var rows = s.orphans.map(function (o) {
      var c = s.custody.filter(function (x) { return x.orphan === o.id; }).slice(-1)[0];
      return itm(o.status === 'in_custody' ? 'green' : o.status === 'unclaimed' ? 'yellow' : 'blue', h(o.id) + ': ' + h(R.amount(o)), h(o.place) + '. ' + h(o.condition) + '. ' + (c ? 'Custody: ' + h(R.nameOf(s, c.holder)) + ', ' + c.attestors.filter(function (a) { return a.answer === 'yes'; }).length + ' of ' + c.attestors.length + ' attested.' : 'No custody request.') + ' Reported ' + R.stamp(s, o.at) + '.',
        U.tag(o.status, o.status.replace(/_/g, ' ')), ' data-a="mapSel" data-kind="orphan" data-id="' + o.id + '" aria-label="Orphan ' + h(o.id) + '"');
    }).join('');
    return '<div class="con-grid"><div class="con-mapcol"><h1 class="h1">Orphans and custody</h1>' + rows +
      '<p class="fine">Designating custodians, escalation and resolution by authorities are planned for V2 and are not part of this prototype.</p></div><aside class="con-panel">' + (sel ? '<h2 class="h2">Orphan ' + h(sel.id) + '</h2>' + orphanDetail(s, sel) : '<p class="fine">Select an orphan to see photos, attestations and custody history.</p>') + '</aside></div>';
  }
  function auditPage(s, V) {
    var f = V.con.auditNode || '';
    var rows = s.log.slice().reverse().filter(function (l) { return !f || l.actor === f || l.text.indexOf(R.nameOf(s, f)) >= 0; });
    var actors = Object.keys(s.nodes).filter(function (id) { return s.log.some(function (l) { return l.actor === id; }); });
    return '<div class="con-solo"><h1 class="h1">Audit log</h1><label class="con-f" style="margin-bottom:14px"><span>Node</span><select data-con="auditNode"><option value="">All nodes</option>' + actors.map(function (id) { return '<option value="' + id + '"' + (f === id ? ' selected' : '') + '>' + h(R.nameOf(s, id)) + '</option>'; }).join('') + '</select></label>' +
      rows.map(function (l) { return itm(l.channel === 'sms' ? 'blue' : 'grey', h(l.text), R.dayTime(l.at) + ' · ' + h(l.actor === 'system' ? 'Demo control' : R.nameOf(s, l.actor)), l.channel === 'sms' ? '<span class="chip chip-sky chip-sm">SMS</span>' : '<span class="chip chip-grey chip-sm">App</span>'); }).join('') + '</div>';
  }
  function render(s, V) {
    var page = V.con.page === 'orphans' ? orphansPage(s, V) : V.con.page === 'audit' ? auditPage(s, V) : mapPage(s, V);
    return '<div class="con">' + rail(V) + '<div class="con-main">' + top(s, V) + page + '</div></div>';
  }
  root.Console = { render: render };
})(window);
