/* Relay business logic. One state object, one set of actions. The app, console and SMS simulator all call these.
   Every action validates first and only then mutates, so a refused action leaves the state untouched. */
(function (root) {
  'use strict';
  var DAY = 1440;
  var TIER_W = [1000, 100, 10, 1];
  var CAP_WORD = { 0: 'no', 0.25: 'quarter', 0.5: 'half', 1: 'full' };
  var STATE_WORD = { active: 'Active', reduced: 'Reduced', unknown: 'No reply', probably_gone: 'Probably gone', gone: 'Gone',
    not_operating: 'Not operating', proposed: 'Proposed', declined: 'Declined' };

  /* ---------- formatting ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clock(m) { var r = ((m % DAY) + DAY) % DAY; return pad(Math.floor(r / 60)) + ':' + pad(r % 60); }
  function dayTime(m) { return 'Day ' + (Math.floor(m / DAY) + 1) + ', ' + clock(m); }
  function stamp(s, m) { return Math.floor(m / DAY) === Math.floor(s.now / DAY) ? clock(m) : clock(m) + ' on Day ' + (Math.floor(m / DAY) + 1); }
  function dur(mins) {
    mins = Math.max(0, Math.round(mins));
    if (mins < 60) return mins + (mins === 1 ? ' minute' : ' minutes');
    var h = Math.floor(mins / 60);
    if (h < 48) return h + (h === 1 ? ' hour' : ' hours');
    return Math.floor(h / 24) + ' days';
  }
  function ago(s, m) { var d = s.now - m; return d < 2 ? 'just now' : dur(d) + ' ago'; }
  function num(n) { return Number(n).toLocaleString('en-IN'); }
  function rupees(n) { return '₹' + num(n); }
  function amount(o) {
    var g = o.goods || o.what || '';
    var lower = /^[A-Z][a-z]+ [A-Z]/.test(g) ? g : g.charAt(0).toLowerCase() + g.slice(1);
    return num(o.qty) + ' ' + o.unit + ' of ' + lower + (o.kgPer ? ' (' + num(o.qty * o.kgPer) + ' kg)' : '');
  }
  function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  /* ---------- lookups ---------- */
  function nameOf(s, id) {
    if (s.nodes[id]) return s.nodes[id].name;
    if (String(id).indexOf('owner:') === 0) { var oc = custodyById(s, String(id).slice(6)); return oc && oc.ownerText ? oc.ownerText : 'Owner not known'; }
    var hp = s.handoffPoints.filter(function (h) { return h.id === id; })[0];
    return hp ? hp.name : id;
  }
  function place(s, id) { return s.nodes[id] || s.handoffPoints.filter(function (h) { return h.id === id; })[0]; }
  function km(a, b) { return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 10) / 10; }
  function nextId(s, prefix) { s.seq += 1; return prefix + s.seq; }
  function task(s, id) { return s.tasks.filter(function (t) { return t.id === id; })[0]; }
  function custodyById(s, id) { return s.custody.filter(function (c) { return c.id === id; })[0]; }
  function orphanById(s, id) { return s.orphans.filter(function (o) { return o.id === id; })[0]; }

  function log(s, actor, text, ch) { s.log.push({ at: s.now, actor: actor, text: text, channel: ch || 'app' }); }
  function notify(s, to, text) { s.notifications.push({ id: nextId(s, 'M'), to: to, text: text, at: s.now }); }
  function smsOut(s, phone, text) { (s.sms[phone] = s.sms[phone] || []).push({ dir: 'in', at: s.now, text: text }); }
  function fail(msg) { return { ok: false, msg: msg }; }
  function ok(msg, extra) { return Object.assign({ ok: true, msg: msg }, extra || {}); }

  /* ---------- node state engine (F2.3.1) ---------- */
  function lastSeen(n) {
    var a = n.checkin ? n.checkin.at : null, b = n.lastActivity;
    if (a == null) return b; if (b == null) return a; return Math.max(a, b);
  }
  function silenceMins(s, n) {
    var seen = lastSeen(n);
    if (n.pingedAt != null && (seen == null || seen < n.pingedAt)) return s.now - n.pingedAt;
    return seen == null ? null : s.now - seen;
  }
  function nodeState(s, id) {
    var n = s.nodes[id];
    if (!n) return 'unknown';
    if (n.confirmedGone) return 'gone';
    var c = n.checkin;
    if (c && s.now - c.at <= DAY) {
      if (!c.operating) return 'not_operating';
      return c.capacity >= 1 ? 'active' : 'reduced';
    }
    if (n.lastActivity != null && s.now - n.lastActivity <= DAY && (n.pingedAt == null || n.lastActivity >= n.pingedAt)) return 'active';
    var sil = silenceMins(s, n);
    if (sil != null && sil >= 360 && n.cantReach.length >= 2) return 'probably_gone';
    return 'unknown';
  }
  function isOperating(st) { return st === 'active' || st === 'reduced'; }
  function stateDetail(s, id) {
    var n = s.nodes[id], st = nodeState(s, id), seen = lastSeen(n);
    if (st === 'active' || st === 'reduced' || st === 'not_operating') {
      var cap = n.checkin && s.now - n.checkin.at <= DAY ? n.checkin : null;
      var t = cap ? cap.at : seen;
      var capText = cap ? (cap.operating ? capWord(cap.capacity) + ' capacity' : 'not operating today') : 'completed a task';
      return capText.charAt(0).toUpperCase() + capText.slice(1) + '. Updated ' + ago(s, t) + ' (' + stamp(s, t) + ').';
    }
    var sil = silenceMins(s, n);
    var silence = sil == null ? 'Never replied' : 'No reply for ' + dur(sil) + (n.pingedAt != null ? ' (ping sent ' + stamp(s, n.pingedAt) + ')' : '');
    if (st === 'probably_gone') return silence + '. ' + n.cantReach.length + ' partners report they cannot reach them. Not confirmed gone.';
    if (st === 'gone') return 'Confirmed gone by attestation.';
    return silence + '. No reply is not the same as gone.';
  }
  function capWord(c) { var w = CAP_WORD[c]; return w ? (w === 'no' ? 'No' : w.charAt(0).toUpperCase() + w.slice(1)) : Math.round(c * 100) + '%'; }

  /* ---------- links and chain (F2.1) ---------- */
  var SEVERITY = { active: 0, proposed: 1, reduced: 2, not_operating: 3, unknown: 4, probably_gone: 5, gone: 6 };
  // A confirmed new link has capacity reserved for exactly its load, so it is active while both ends operate.
  function linkState(s, e, id) {
    var st = nodeState(s, id);
    return e.pre === false && st === 'reduced' ? 'active' : st;
  }
  function edgeStatus(s, e) {
    var a = linkState(s, e, e.from), b = linkState(s, e, e.to);
    return SEVERITY[a] >= SEVERITY[b] ? a : b;
  }
  function myLinks(s, me) {
    me = me || s.me;
    return s.edges.filter(function (e) { return e.from === me || e.to === me; }).map(function (e) {
      var other = e.from === me ? e.to : e.from;
      return { edge: e, other: other, side: e.to === me ? 'up' : 'down', status: linkState(s, e, other) };
    });
  }
  function pendingProposalFor(s, edgeId) {
    return s.proposals.filter(function (p) { return p.replaces === edgeId && p.status === 'pending'; })[0];
  }
  // Stations for the chain strip: one slot per original link, replacement or pending proposal drawn in that slot.
  function chainStrip(s, me) {
    me = me || s.me;
    var links = myLinks(s, me).filter(function (l) { return !l.edge.replaces; });
    function slot(l) {
      var e = l.edge;
      if (e.replacedBy) {
        var ne = s.edges.filter(function (x) { return x.id === e.replacedBy; })[0];
        var other = ne.from === me ? ne.to : ne.from;
        return { id: other, edgeId: ne.id, status: linkState(s, ne, other), side: l.side, replaces: l.other, origEdge: e.id };
      }
      var p = pendingProposalFor(s, e.id);
      if (p) return { id: p.to, edgeId: e.id, status: 'proposed', side: l.side, replaces: l.other, proposal: p.id, origEdge: e.id };
      return { id: l.other, edgeId: e.id, status: l.status, side: l.side, origEdge: e.id };
    }
    return {
      up: links.filter(function (l) { return l.side === 'up'; }).map(slot),
      down: links.filter(function (l) { return l.side === 'down'; }).map(slot)
    };
  }
  function chainCounts(s, me) {
    var c = { active: 0, reduced: 0, unknown: 0, probably_gone: 0, gone: 0, not_operating: 0, proposed: 0 };
    var st = chainStrip(s, me);
    st.up.concat(st.down).forEach(function (x) { c[x.status] += 1; });
    return c;
  }
  function brokenLinks(s, me) {
    var st = chainStrip(s, me);
    return st.up.concat(st.down).filter(function (x) { return x.status === 'unknown' || x.status === 'probably_gone' || x.status === 'gone' || x.status === 'not_operating'; });
  }

  /* ---------- substitute matching (F3.1.2) ---------- */
  var TRANSPORT_ROLES = ['transporter', 'distributor', 'warehouse'];
  // Spare refrigerated kg, limited by the vehicles the node declared free at its last check-in.
  function refrigeratedSpare(s, n) {
    var f = fleet(s, n.id);
    if (f.free < 1) return 0;
    var v = n.vehicles.filter(function (x) { return x.refrigerated; })[0];
    return v ? Math.min(v.spareKg || 0, f.free * v.capKg) : 0;
  }
  function substitutes(s, edgeId) {
    var e = s.edges.filter(function (x) { return x.id === edgeId; })[0];
    if (!e) return { candidates: [], excluded: [] };
    var me = s.nodes[s.me], oldId = e.from === s.me ? e.to : e.from, old = s.nodes[oldId];
    var needKg = e.loadKg || 0, needCold = !!e.cold, buyer = e.from === s.me;
    var partners = myLinks(s).map(function (l) { return l.other; });
    var declined = s.proposals.filter(function (p) { return p.replaces === edgeId && p.status === 'declined'; }).map(function (p) { return p.to; });
    var oldPartners = partnersOf(s, oldId).filter(function (id) { return id !== s.me; });
    var candidates = [], excluded = [];
    Object.keys(s.nodes).forEach(function (id) {
      var n = s.nodes[id];
      if (id === s.me || id === oldId) return;
      if (buyer ? n.role !== old.role : (TRANSPORT_ROLES.indexOf(n.role) < 0 || !n.vehicles.length)) return;
      var st = nodeState(s, id), dist = km(me, n), reason = null;
      var f = fleet(s, id);
      var spare = buyer ? 0 : needCold ? refrigeratedSpare(s, n) : f.free * ((n.vehicles[0] || {}).capKg || 0);
      if (buyer && partners.indexOf(id) >= 0) reason = 'Already your buyer';
      else if (!isOperating(st)) reason = st === 'probably_gone' ? 'Probably gone' : 'Has not replied in ' + dur(silenceMins(s, n) || 0);
      else if (buyer) reason = null;
      else if (needCold && !n.vehicles.some(function (v) { return v.refrigerated; }))
        reason = n.vehicles.some(function (v) { return v.insulated; }) ? 'Insulated van only. Cannot keep insulin below 8 °C for a 70-minute leg' : 'No refrigerated vehicle';
      else if (f.free < 1) reason = 'No vehicles free. Declared ' + f.declared + ' of ' + f.total + ' at check-in, ' + f.used + ' on tasks';
      else if (spare < needKg) reason = 'Spare ' + (needCold ? 'refrigerated ' : '') + 'capacity ' + num(spare) + ' kg. This link needs ' + num(needKg) + ' kg a day';
      else if (dist > me.radiusKm) reason = 'Outside your ' + me.radiusKm + ' km service radius';
      else if (declined.indexOf(id) >= 0) reason = 'Declined your proposal';
      if (reason) { excluded.push({ id: id, reason: reason, dist: dist }); return; }
      var parts = {
        role: n.role === old.role ? 1 : (n.role === 'distributor' ? 0.7 : 0.5),
        distance: Math.max(0, 1 - dist / me.radiusKm),
        capacity: buyer ? (n.checkin ? n.checkin.capacity : 0) : Math.min(spare / Math.max(needKg, 1), 2) / 2,
        history: partnersOf(s, id).some(function (p) { return oldPartners.indexOf(p) >= 0; }) ? 1 : 0,
        trust: n.trust
      };
      var score = 25 * parts.role + 25 * parts.distance + 20 * parts.capacity + 15 * parts.history + 15 * parts.trust;
      var shared = partnersOf(s, id).filter(function (p) { return oldPartners.indexOf(p) >= 0; });
      candidates.push({ id: id, score: Math.round(score), parts: parts, dist: dist, spare: spare, state: st, reason: buyer ? 'Same role as ' + old.name + (shared.length ? ', traded with ' + shared.map(function (x) { return nameOf(s, x); }).join(' and ') + ' before' : '') : matchReason(s, n, old, shared) });
    });
    candidates.sort(function (a, b) { return b.score - a.score; });
    return { candidates: candidates.slice(0, 5), excluded: excluded, needKg: needKg, cold: needCold, old: oldId, buyer: buyer };
  }
  function partnersOf(s, id) {
    var out = (s.nodes[id].tradedWith || []).slice();
    s.edges.forEach(function (e) { var o = e.from === id ? e.to : e.to === id ? e.from : null; if (o && out.indexOf(o) < 0) out.push(o); });
    return out;
  }
  function matchReason(s, n, old, shared) {
    var v = n.vehicles.filter(function (x) { return x.refrigerated; })[0];
    var bits = [v ? 'Has a ' + v.label.toLowerCase() : 'Same vehicle type'];
    if (shared.length) bits.push('traded with ' + shared.map(function (id) { return nameOf(s, id); }).join(' and ') + ' before');
    if (n.role === old.role) bits.push('same role as ' + old.name.split(' ')[0]);
    return bits.join(', ');
  }
  function trustWord(t) { return t >= 0.8 ? 'High' : t >= 0.6 ? 'Medium' : 'Low'; }

  /* ---------- priority (F3.3) ---------- */
  function needById(s, id) { return s.needs.filter(function (n) { return n.id === id; })[0]; }
  function tierVerified(s, need) {
    if (need.tierClaimed >= 2) return true;
    var v = need.verifiedBy || [];
    if (v.some(function (id) { return id !== need.node && s.nodes[id] && s.nodes[id].anchor; })) return true;
    return v.filter(function (id) { return id !== need.node; }).length >= 2;
  }
  function effectiveTier(s, need) { return tierVerified(s, need) ? need.tierClaimed : Math.max(need.tierClaimed, 2); }
  function verifierText(s, need) {
    var v = need.verifiedBy || [];
    if (need.tierClaimed >= 2) return '';
    if (!tierVerified(s, need)) return 'Tier ' + need.tierClaimed + ' claimed, not verified. Treated as Tier 2 until an anchor, an authority or two neighbours verify it.';
    var anchor = v.filter(function (id) { return s.nodes[id].anchor; })[0];
    return anchor ? 'verified by anchor ' + nameOf(s, anchor) : 'verified by ' + v.map(function (id) { return nameOf(s, id); }).join(' and ');
  }
  function taskPriority(s, t) {
    var need = needById(s, t.needId), tier = effectiveTier(s, need);
    var hours = Math.max((t.by - s.now) / 60, 0.5);
    return TIER_W[tier] * (1 + 4 / hours);
  }
  function rankedTasks(s, statuses) {
    return s.tasks.filter(function (t) { return !statuses || statuses.indexOf(t.status) >= 0; })
      .sort(function (a, b) { return taskPriority(s, b) - taskPriority(s, a); });
  }
  function taskTier(s, t) { return effectiveTier(s, needById(s, t.needId)); }
  function taskReason(s, t) {
    var need = needById(s, t.needId), tier = effectiveTier(s, need), recv = s.nodes[t.to];
    var offered = rankedTasks(s, ['offered', 'accepted', 'in_progress']);
    var rank = offered.indexOf(t) + 1;
    var who = recv.institution || recv.role;
    var vt = verifierText(s, need);
    var left = t.by - s.now;
    var lead = rank > 0 ? 'Ranked ' + ordinal(rank) + ': ' : '';
    return lead + 'Tier ' + tier + ' (' + who + (vt && tierVerified(s, need) ? ', ' + vt : '') + '), ' + t.why + ', ' + (left > 0 ? dur(left) + ' left' : 'window passed') + '.';
  }
  function queueInfo(s, need) {
    var open = s.needs.filter(function (n) { return n.status === 'open'; });
    function score(n) { return TIER_W[effectiveTier(s, n)] * (1 + 4 / Math.max((n.by - s.now) / 60, 0.5)); }
    open.sort(function (a, b) { return score(b) - score(a); });
    var pos = open.indexOf(need) + 1, tier = effectiveTier(s, need);
    var range = [[1, 4], [4, 10], [10, 24], [24, 72]][tier];
    return { pos: pos, of: open.length, range: range,
      reason: 'Position ' + pos + ' of ' + open.length + ' open requests in Pune district. Tier ' + tier + ' requests are served before lower tiers; within a tier, the shortest time left goes first.' };
  }

  /* ---------- capacity (vehicles) ---------- */
  function fleet(s, id) {
    var n = s.nodes[id || s.me];
    var total = n.vehicles.reduce(function (a, v) { return a + v.count; }, 0);
    var st = nodeState(s, n.id);
    var cap = n.checkin && n.checkin.operating && s.now - n.checkin.at <= DAY ? n.checkin.capacity : 0;
    var declared = isOperating(st) && cap > 0 && total > 0 ? Math.max(1, Math.round(total * cap)) : 0;
    var used = s.tasks.filter(function (t) { return (t.status === 'accepted' || t.status === 'in_progress') && t.legs.some(function (l) { return l.carrier === n.id; }); })
      .reduce(function (a, t) { return a + t.vehiclesNeeded; }, 0);
    return { total: total, declared: declared, used: used, free: declared - used, label: (n.vehicles[0] || { label: 'vehicle' }).label.toLowerCase() };
  }
  function coldCarrier(s) {
    // An operating refrigerated partner linked to me (accepted substitute, or the original if it is back).
    var links = myLinks(s).filter(function (l) { return l.side === 'up' && l.edge.cold && !l.edge.replacedBy; });
    for (var i = 0; i < links.length; i++) {
      var n = s.nodes[links[i].other];
      if (isOperating(nodeState(s, n.id)) && n.vehicles.some(function (v) { return v.refrigerated; }) && fleet(s, n.id).free >= 1) return n.id;
    }
    return null;
  }

  /* ---------- actions ---------- */
  var A = {};

  A.verifyPhone = function (s, p) {
    var digits = String(p.phone || '').replace(/\D/g, '');
    if (digits.length < 10) return fail('Enter a 10-digit mobile number.');
    if (String(p.code || '').trim() !== '482913') return fail('The code does not match. Check the latest SMS and try again.');
    s.session.phone = p.phone; s.session.stage = 'claim';
    log(s, s.me, 'Phone verified for ' + nameOf(s, s.me) + '.');
    return ok('Phone verified');
  };
  A.claimNode = function (s, p) {
    var n = s.nodes[s.me];
    if (p.name) { if (!String(p.name).trim()) return fail('Enter a name.'); n.name = String(p.name).trim(); }
    if (p.area) n.area = String(p.area).trim();
    if (p.vehicles != null) { var c = parseInt(p.vehicles, 10); if (!(c >= 0 && c <= 50)) return fail('Enter how many vehicles you have, between 0 and 50.'); n.vehicles[0].count = c; }
    n.claimed = true; s.session.stage = 'checkin'; s.session.checkinStep = 1;
    log(s, s.me, n.name + ' claimed its node.');
    return ok('Node claimed');
  };
  A.selfCreate = function (s, p) {
    var name = String(p.name || '').trim(), area = String(p.area || '').trim();
    if (!name || !area || !p.role) return fail('Enter name, role and area.');
    var id = nextId(s, 'n');
    s.nodes[id] = { id: id, name: name, role: p.role, area: area, type: 'single', x: 27, y: 25, vehicles: [], products: p.product ? [p.product] : [],
      tradedWith: [], cantReach: [], checkin: null, lastActivity: s.now, pingedAt: null, verification: 'self', trust: 0.3, radiusKm: 20, claimed: true };
    s.me = id; s.session.stage = 'checkin'; s.session.checkinStep = 1;
    log(s, id, name + ' created a self-declared node.');
    return ok('Node created');
  };

  // F2.2.1 / F2.2.2 / F2.2.5. A check-in from the node itself also clears "cannot reach" reports (self-reactivation).
  A.checkIn = function (s, p, ch) {
    var who = p.node || s.me, n = s.nodes[who];
    if (typeof p.operating !== 'boolean') return fail('Answer whether you are operating.');
    var cap = p.operating ? p.capacity : 0;
    if (p.operating && [0, 0.25, 0.5, 1].indexOf(cap) < 0) return fail('Choose how much of your normal capacity you have.');
    var total = n.vehicles.reduce(function (a, v) { return a + v.count; }, 0);
    var newDeclared = p.operating && cap > 0 && total > 0 ? Math.max(1, Math.round(total * cap)) : 0;
    var used = fleet(s, who).used;
    if (used > newDeclared) return fail('You have ' + used + ' vehicle' + (used === 1 ? '' : 's') + ' on active tasks. Finish or hand back those tasks before ' + (p.operating ? 'lowering capacity' : 'pausing') + '.');
    var before = nodeState(s, who);
    var items = (p.stock || []).filter(function (x) { return x && x.what && x.qty > 0; });
    n.checkin = { at: s.now, operating: p.operating, capacity: cap };
    n.cantReach = []; n.confirmedGone = false;
    var sc = s.smsCtx && s.smsCtx[who];
    if (sc && (sc.flow === 'ping' || sc.flow === 'daily' || sc.flow === 'capacity')) s.smsCtx[who] = {};
    items.forEach(function (x) { s.stock.push({ id: nextId(s, 'S'), node: who, what: x.what, qty: x.qty, unit: x.unit || 'units' }); });
    if (who === s.me && s.session.stage === 'checkin') { s.session.stage = 'done'; }
    var word = p.operating ? 'operating, ' + capWord(cap).toLowerCase() + ' capacity' : 'not operating today';
    log(s, who, n.name + ' checked in: ' + word + (items.length ? ', ' + items.length + ' stock entries' : '') + '.', ch);
    if (before === 'probably_gone' || before === 'unknown') {
      s.edges.forEach(function (e) {
        if (e.from === who || e.to === who) { var other = e.from === who ? e.to : e.from; if (other !== who) notify(s, other, n.name + ' is back: ' + word + '.'); }
      });
    }
    return ok('Status confirmed', { word: word });
  };
  A.sameAsYesterday = function (s, p, ch) {
    var n = s.nodes[p.node || s.me];
    if (!n.checkin) return fail('No earlier check-in. Answer the three questions first.');
    return A.checkIn(s, { node: n.id, operating: n.checkin.operating, capacity: n.checkin.capacity }, ch);
  };
  A.reportCantReach = function (s, p, ch) {
    var by = p.by || s.me, n = s.nodes[p.node];
    if (!n || p.node === by) return fail('Choose a partner.');
    if (isOperating(nodeState(s, p.node))) return fail(n.name + ' checked in ' + ago(s, lastSeen(n)) + '. Try calling them again.');
    if (n.cantReach.indexOf(by) >= 0) return fail('You already reported ' + n.name + '.');
    n.cantReach.push(by);
    log(s, by, nameOf(s, by) + ' reported it cannot reach ' + n.name + '.', ch);
    return ok('Report recorded', { state: nodeState(s, p.node) });
  };

  // F3.1.3. A proposal never creates a link by itself; the counterpart must accept.
  A.proposeLink = function (s, p, ch) {
    var e = s.edges.filter(function (x) { return x.id === p.edgeId; })[0];
    if (!e) return fail('Link not found.');
    if (e.replacedBy) return fail('This link has already been replaced.');
    if (pendingProposalFor(s, e.id)) return fail('A proposal for this link is already waiting for ' + nameOf(s, pendingProposalFor(s, e.id).to) + '.');
    var m = substitutes(s, e.id).candidates.filter(function (c) { return c.id === p.to; })[0];
    if (!m) return fail(nameOf(s, p.to) + ' can no longer take this link. Choose another node.');
    var pr = { id: nextId(s, 'P'), from: s.me, to: p.to, replaces: e.id, product: e.product, loadKg: e.loadKg, cold: !!e.cold, status: 'pending', at: s.now,
      terms: e.cold ? 'Van hours recorded as an IOU at ₹1,200 an hour' : 'Recorded as an IOU per trip' };
    s.proposals.push(pr);
    notify(s, p.to, nameOf(s, s.me) + ' proposes a link: ' + e.product + ', ' + num(e.loadKg || 0) + ' kg a day.');
    log(s, s.me, nameOf(s, s.me) + ' proposed a link to ' + nameOf(s, p.to) + ' to replace ' + nameOf(s, e.from === s.me ? e.to : e.from) + '.', ch);
    return ok('Link proposed', { proposal: pr.id });
  };
  A.respondProposal = function (s, p) {
    var pr = s.proposals.filter(function (x) { return x.id === p.id; })[0];
    if (!pr) return fail('Proposal not found.');
    if (pr.status !== 'pending') return fail('This proposal was already ' + pr.status + '.');
    s.now += 12;
    pr.respondedAt = s.now;
    if (!p.accept) {
      pr.status = 'declined'; pr.reason = p.reason || 'No spare driver this week';
      notify(s, pr.from, nameOf(s, pr.to) + ' declined the link: ' + pr.reason + '.');
      log(s, pr.to, nameOf(s, pr.to) + ' declined the link from ' + nameOf(s, pr.from) + '.');
      return ok('Link declined');
    }
    var n = s.nodes[pr.to];
    if (pr.cold) {
      var v = n.vehicles.filter(function (x) { return x.refrigerated; })[0];
      if (!v || refrigeratedSpare(s, n) < pr.loadKg) { pr.status = 'declined'; pr.reason = 'No spare refrigerated capacity left'; return fail(n.name + ' no longer has spare refrigerated capacity.'); }
      v.spareKg -= pr.loadKg;
    }
    pr.status = 'accepted';
    var old = s.edges.filter(function (x) { return x.id === pr.replaces; })[0];
    var ne = { id: nextId(s, 'E'), from: pr.to, to: pr.from, product: pr.product, freq: old.freq, loadKg: pr.loadKg, cold: pr.cold, pre: false, replaces: old.id, at: s.now, terms: pr.terms };
    s.edges.push(ne); old.replacedBy = ne.id;
    n.lastActivity = s.now;
    s.ui.animateEdge = ne.id;
    notify(s, pr.from, nameOf(s, pr.to) + ' accepted your link. ' + pr.product + ' now runs through them.');
    log(s, pr.to, nameOf(s, pr.to) + ' accepted the link from ' + nameOf(s, pr.from) + '. Replaces ' + nameOf(s, old.from === pr.from ? old.to : old.from) + '.');
    return ok('Link accepted', { edge: ne.id });
  };

  // F4.1.2
  A.acceptTask = function (s, p, ch) {
    var t = task(s, p.id);
    if (!t) return fail('Task ' + p.id + ' not found.');
    if (!t.legs.some(function (l) { return l.carrier === s.me; })) return fail('Task ' + t.id + ' is not offered to you.');
    if (t.status !== 'offered') return fail('Task ' + t.id + ' is already ' + (t.status === 'in_progress' ? 'in progress' : t.status) + '.');
    if (t.by <= s.now) return fail('The window for task ' + t.id + ' closed at ' + stamp(s, t.by) + '. It can no longer be accepted.');
    var st = nodeState(s, s.me);
    if (!isOperating(st)) return fail('You are not checked in as operating. Update your status to accept tasks.');
    var f = fleet(s);
    if (f.free < t.vehiclesNeeded) return fail('Not enough vehicles. You declared ' + f.declared + ' of ' + f.total + ' ' + f.label + 's; ' + f.used + ' are on active tasks. This task needs ' + t.vehiclesNeeded + '.');
    var coldLeg = t.legs.filter(function (l) { return l.needs === 'refrigerated' && !l.carrier; })[0];
    var carrier = coldLeg ? coldCarrier(s) : null;
    if (coldLeg && !carrier) return fail('Leg 1 needs a refrigerated carrier. ' + nameOf(s, 'kaveri') + ' has not replied. Find a substitute first.');
    s.now += 2;
    if (coldLeg) { coldLeg.carrier = carrier; coldLeg.status = 'assigned'; }
    t.status = 'accepted'; t.acceptedAt = s.now; t.acceptedVia = ch === 'sms' ? 'SMS' : 'app';
    s.nodes[s.me].lastActivity = s.now;
    var need = needById(s, t.needId); if (need) need.status = 'matched';
    if (coldLeg) notify(s, carrier, 'Task ' + t.id + ' leg 1: carry ' + t.load + ' from ' + nameOf(s, coldLeg.from) + ' to ' + nameOf(s, coldLeg.to) + '.');
    notify(s, t.to, nameOf(s, s.me) + ' accepted the delivery of ' + amount(t) + ' for you. Expected by ' + clock(t.by) + '.');
    log(s, s.me, nameOf(s, s.me) + ' accepted task ' + t.id + ' (' + t.goods + ')' + (ch === 'sms' ? ' by SMS' : '') + '.', ch);
    return ok('Task ' + t.id + ' accepted');
  };
  A.declineTask = function (s, p, ch) {
    var t = task(s, p.id);
    if (!t) return fail('Task not found.');
    if (!t.legs.some(function (l) { return l.carrier === s.me; })) return fail('Task ' + t.id + ' is not offered to you.');
    if (t.status !== 'offered') return fail('Task ' + t.id + ' is already ' + t.status + '.');
    t.status = 'declined'; t.declineReason = p.reason || 'Other';
    log(s, s.me, nameOf(s, s.me) + ' declined task ' + t.id + ': ' + t.declineReason + '. The request from ' + nameOf(s, t.to) + ' stays open in the queue for other carriers.', ch);
    return ok('Task ' + t.id + ' declined');
  };

  // Leg progress. Steps by the user (own leg) or simulated counterpart carriers.
  function myLeg(t, who) { return t.legs.filter(function (l) { return l.carrier === who && l.status !== 'handed_over'; })[0]; }
  function prevLeg(t, l) { return t.legs.filter(function (x) { return x.n === l.n - 1; })[0]; }
  function nextStep(s, t) {
    if (t.status !== 'accepted' && t.status !== 'in_progress') return null;
    var l = myLeg(t, s.me);
    if (!l) return null;
    var pl = prevLeg(t, l);
    if (l.status === 'assigned') return { step: 'at_pickup', label: 'I am at the pickup point', leg: l };
    if (l.status === 'at_pickup') {
      if (pl) {
        if (pl.status === 'at_handoff') return { step: 'receive', label: 'Receive goods from leg ' + pl.n, leg: l, from: pl };
        return { step: 'wait', label: 'Waiting for leg ' + pl.n, leg: l, from: pl };
      }
      return { step: 'picked_up', label: 'I have picked up the goods', leg: l };
    }
    if (l.status === 'picked_up') return { step: 'at_handoff', label: 'I am at the handoff point', leg: l };
    if (l.status === 'at_handoff') return { step: 'handoff', label: 'Confirm handoff', leg: l };
    if (l.status === 'awaiting_attestation') return { step: 'wait_attest', label: 'Waiting for attestation', leg: l };
    return null;
  }
  A.legStep = function (s, p, ch) {
    var t = task(s, p.id); if (!t) return fail('Task not found.');
    if (!isOperating(nodeState(s, s.me))) return fail('You are recorded as not operating. Check in again to continue this task.');
    var ns = nextStep(s, t);
    if (!ns || ns.step !== p.step) return fail('That step is not available now.');
    var l = ns.leg;
    if (p.step === 'at_pickup') { s.now += 20; l.status = 'at_pickup'; }
    else if (p.step === 'picked_up') { s.now += 10; l.status = 'picked_up'; }
    else if (p.step === 'at_handoff') { s.now += 30; l.status = 'at_handoff'; }
    else return fail('Use the handoff screen for this step.');
    t.status = 'in_progress';
    log(s, s.me, 'Task ' + t.id + ' leg ' + l.n + ': ' + ns.label.replace(/^I am /, '').replace(/^I have /, '') + '.', ch);
    return ok(ns.label);
  };
  A.simCarrierStep = function (s, p) {
    var t = task(s, p.id); if (!t) return fail('Task not found.');
    var l = t.legs.filter(function (x) { return x.n === p.leg; })[0];
    if (!l || !l.carrier || l.carrier === s.me) return fail('No counterpart leg.');
    var order = ['assigned', 'picked_up', 'at_handoff'];
    var i = order.indexOf(l.status);
    if (i < 0 || i === order.length - 1) return fail('Leg ' + l.n + ' cannot move further without a handoff.');
    if (t.status !== 'accepted' && t.status !== 'in_progress') return fail('Task is not active.');
    s.now += i === 0 ? 25 : 45;
    l.status = order[i + 1]; t.status = 'in_progress';
    s.nodes[l.carrier].lastActivity = s.now;
    log(s, l.carrier, nameOf(s, l.carrier) + ' reported task ' + t.id + ' leg ' + l.n + ': ' + (l.status === 'picked_up' ? 'picked up at ' + nameOf(s, l.from) : 'at ' + nameOf(s, l.to)) + '.');
    return ok('Leg ' + l.n + ' updated');
  };

  // F4.2. Two-party code, or fallback: photo plus neighbour or anchor attestation.
  A.confirmHandoff = function (s, p, ch) {
    var t = task(s, p.id); if (!t) return fail('Task not found.');
    var ns = nextStep(s, t);
    if (!ns || (ns.step !== 'receive' && ns.step !== 'handoff')) return fail('No handoff is due on this task now.');
    var giving = ns.step === 'handoff';
    var leg = giving ? ns.leg : ns.from;            // the leg whose goods change hands
    var counterpart = giving ? place(s, leg.to) : s.nodes[leg.carrier];
    var cpId = counterpart.id;
    var rec = { id: nextId(s, 'H'), task: t.id, leg: leg.n, from: leg.carrier, to: giving ? leg.to : s.me, at: s.now, place: nameOf(s, leg.to), channel: ch };
    if (p.method === 'code') {
      if (!/^\d{4}$/.test(String(p.code || ''))) return fail('Enter the 4-digit code.');
      if (String(p.code) !== leg.code) return fail('Code does not match. Ask ' + nameOf(s, cpId) + ' to read it again, or use "Other person unavailable".');
      rec.method = 'Two-party code'; rec.status = 'confirmed';
    } else if (p.method === 'fallback') {
      if (!giving) return fail('Fallback is for the final handoff. For a relay leg, both carriers must confirm with the code.');
      if (!p.photo) return fail('Take a photo of the goods at the drop point first.');
      if (!p.attestor || handoffAttestors(s, t, leg).indexOf(p.attestor) < 0) return fail('Choose a nearby neighbour with no part in this task to attest.');
      if (!isOperating(nodeState(s, p.attestor))) return fail(nameOf(s, p.attestor) + ' is not operating now. Choose another attestor.');
      rec.method = 'Photo and attestation'; rec.status = 'awaiting_attestation'; rec.photo = p.photo; rec.attestor = p.attestor;
      rec.geo = 'Synthetic GPS 18.5089 N, 73.9259 E'; rec.reason = p.reason || 'Receiver unavailable';
      s.handoffs.push(rec); leg.status = 'awaiting_attestation';
      notify(s, p.attestor, nameOf(s, s.me) + ' asks you to confirm a delivery of ' + amount(t) + ' at ' + nameOf(s, leg.to) + '.');
      log(s, s.me, 'Task ' + t.id + ' handoff by fallback: photo taken, ' + nameOf(s, p.attestor) + ' asked to attest.', ch);
      return ok('Handoff recorded. Waiting for ' + nameOf(s, p.attestor) + ' to confirm.');
    } else return fail('Choose how to confirm.');
    s.now += 3;
    s.handoffs.push(rec);
    completeLeg(s, t, leg, ch);
    return ok('Handoff confirmed');
  };
  // Independent of the task (not sender, receiver, payer or carrier) and within 3 km of the drop point.
  function handoffAttestors(s, t, leg) {
    var drop = place(s, leg.to), involved = [s.me, t.from, t.to, t.reward.from].concat(t.legs.map(function (l) { return l.carrier; }));
    return Object.keys(s.nodes).filter(function (id) { return involved.indexOf(id) < 0 && isOperating(nodeState(s, id)) && km(s.nodes[id], drop) <= 3; })
      .sort(function (a, b) { return km(s.nodes[a], drop) - km(s.nodes[b], drop); });
  }
  A.attestHandoff = function (s, p) {
    var h = s.handoffs.filter(function (x) { return x.id === p.id; })[0];
    if (!h || h.status !== 'awaiting_attestation') return fail('Nothing to attest.');
    var t = task(s, h.task), leg = t.legs.filter(function (l) { return l.n === h.leg; })[0];
    s.now += 8;
    if (!p.yes) {
      h.status = 'not_confirmed'; leg.status = 'at_handoff';
      log(s, h.attestor, nameOf(s, h.attestor) + ' could not confirm the handoff for task ' + t.id + '.');
      notify(s, s.me, nameOf(s, h.attestor) + ' could not confirm. Try the code again or choose another attestor.');
      return ok('Attestation refused');
    }
    h.status = 'confirmed'; h.attestedAt = s.now;
    log(s, h.attestor, nameOf(s, h.attestor) + ' attested the handoff for task ' + t.id + '.');
    completeLeg(s, t, leg, 'app');
    return ok('Attestation recorded');
  };
  function completeLeg(s, t, leg, ch) {
    leg.status = 'handed_over'; leg.doneAt = s.now;
    s.nodes[leg.carrier].lastActivity = s.now;
    var nxt = t.legs.filter(function (l) { return l.n === leg.n + 1; })[0];
    if (nxt) { nxt.status = 'picked_up'; log(s, s.me, 'Task ' + t.id + ': leg ' + leg.n + ' handed over at ' + nameOf(s, leg.to) + '. Leg ' + nxt.n + ' picked up.', ch); return; }
    // Delivered: task, need, stock, ledger and liveness all move together.
    t.status = 'delivered'; t.deliveredAt = s.now;
    var need = needById(s, t.needId); if (need) need.status = 'fulfilled';
    var src = s.stock.filter(function (x) { return x.node === t.from && x.what === t.goods; })[0];
    if (src) src.qty = Math.max(0, src.qty - t.qty);
    var dst = s.stock.filter(function (x) { return x.node === t.to && x.what === t.goods; })[0];
    if (dst) dst.qty += t.qty; else s.stock.push({ id: nextId(s, 'S'), node: t.to, what: t.goods, qty: t.qty, unit: t.unit });
    if (s.nodes[t.to]) s.nodes[t.to].lastActivity = s.now;
    s.obligations.push({ id: nextId(s, 'I-'), from: t.reward.from, to: s.me, what: t.reward.what + ', task ' + t.id, amount: t.reward.amount, source: { kind: 'task', id: t.id }, status: 'open', at: s.now });
    t.legs.forEach(function (l) {
      if (l.carrier && l.carrier !== s.me && l.ratePerHour) {
        s.obligations.push({ id: nextId(s, 'I-'), from: s.me, to: l.carrier, what: 'Refrigerated van, ' + l.hours + ' hours, task ' + t.id + ' leg ' + l.n, amount: l.ratePerHour * l.hours, source: { kind: 'task', id: t.id }, status: 'open', at: s.now });
      }
    });
    s.obligations.push({ id: nextId(s, 'I-'), from: t.to, to: t.from, what: amount(t) + ', task ' + t.id, amount: goodsValue(t), source: { kind: 'task', id: t.id }, status: 'open', at: s.now });
    notify(s, t.to, t.goods + ' delivered by ' + nameOf(s, s.me) + '.');
    log(s, s.me, 'Task ' + t.id + ' delivered to ' + nameOf(s, t.to) + '. IOUs recorded.', ch);
  }
  function goodsValue(t) { var per = { 'Insulin (cold chain)': 450, 'Rice': 1600, 'Sona Masoori rice': 1600, 'Cosmetics and toiletries': 900 }[t.goods] || 100; return per * t.qty; }

  // SOS (F5.4.2)
  A.sos = function (s, p, ch) {
    log(s, s.me, 'SOS from ' + nameOf(s, s.me) + (p.task ? ' on task ' + p.task : '') + '. Sent to Pune district relief cell and task neighbours.', ch);
    return ok('SOS sent');
  };

  // F2.4.2
  A.reportOrphan = function (s, p, ch) {
    var qty = Number(p.qty);
    if (!p.type) return fail('Choose what kind of orphan this is.');
    if (!String(p.goods || '').trim()) return fail('Say what the goods are.');
    if (!(qty > 0)) return fail('Enter a quantity above zero.');
    if (!String(p.place || '').trim()) return fail('Add a location or landmark.');
    var dup = s.orphans.filter(function (o) { return o.goods.toLowerCase() === String(p.goods).trim().toLowerCase() && o.place === p.place && o.status !== 'returned'; })[0];
    if (dup) return fail('Already reported as ' + dup.id + '. Open it instead of reporting again.');
    var o = { id: 'ORP-' + (991 + s.orphans.length), type: p.type, goods: String(p.goods).trim(), qty: qty, unit: p.unit || 'units',
      owner: p.owner || null, ownerText: p.ownerText || '', place: String(p.place).trim(), x: p.x || 28.9, y: p.y || 28.1, condition: p.condition || 'Not stated',
      status: 'unclaimed', reportedBy: p.by || s.me, at: s.now, photo: p.photo || null, kgPer: Number(p.kgPer) || null };
    s.orphans.push(o);
    log(s, o.reportedBy, 'Orphan ' + o.id + ' reported: ' + amount(o) + ', ' + o.place + '.', ch);
    return ok('Orphan reported', { id: o.id });
  };

  // F4.3. Custody is a time-limited loan. Owner's claim is kept on the record.
  var USE_BENEFICIARY = { 'Supply Hadapsar Community Kitchen': 'hck', 'Supply households through Meena Stores': 'meena' };
  // Two independent operating neighbours within 5 km: not the holder, the owner or whoever receives the goods. Otherwise the anchor.
  function attestorsFor(s, o, holder, beneficiary) {
    var exclude = [holder, o.owner, beneficiary];
    var near = Object.keys(s.nodes).filter(function (id) {
      var n = s.nodes[id];
      return exclude.indexOf(id) < 0 && !n.anchor && isOperating(nodeState(s, id)) && km(n, o) <= 5;
    }).sort(function (a, b) { return km(s.nodes[a], o) - km(s.nodes[b], o); }).slice(0, 2);
    return near.length >= 2 ? near.map(function (id) { return { node: id, answer: null }; }) : [{ node: 'ravi', answer: null, anchor: true }];
  }
  A.requestCustody = function (s, p, ch) {
    var o = orphanById(s, p.orphan); if (!o) return fail('Orphan not found.');
    if (o.status !== 'unclaimed') return fail(o.id + ' is already ' + o.status.replace('_', ' ') + '.');
    if (!p.use) return fail('Choose what you will use it for.');
    var hours = Number(p.hours); if ([24, 48, 72].indexOf(hours) < 0) return fail('Choose a duration of 24, 48 or 72 hours.');
    if (o.owner === s.me) return fail('You are the owner. Custody is for assets whose owner is unreachable.');
    if (o.owner && isOperating(nodeState(s, o.owner))) return fail(nameOf(s, o.owner) + ' checked in ' + ago(s, lastSeen(s.nodes[o.owner])) + '. Contact them; custody is only for unreachable owners.');
    var c = { id: 'CUST-' + (883 + s.custody.length), orphan: o.id, holder: s.me, owner: o.owner, ownerText: o.ownerText, use: p.use, hours: hours, status: 'awaiting', at: s.now,
      beneficiary: USE_BENEFICIARY[p.use] || null, attestors: null, releases: [] };
    c.attestors = attestorsFor(s, o, s.me, c.beneficiary);
    s.custody.push(c); o.status = 'custody_requested';
    c.attestors.forEach(function (a) {
      notify(s, a.node, nameOf(s, s.me) + ' asks if ' + (o.owner ? nameOf(s, o.owner) : 'the owner of ' + o.goods.toLowerCase()) + ' has been unreachable since Day 1. Do you know?');
    });
    log(s, s.me, nameOf(s, s.me) + ' requested custody of ' + o.id + ' for ' + hours + ' hours. Attestation asked from ' + c.attestors.map(function (a) { return nameOf(s, a.node); }).join(' and ') + '.', ch);
    return ok('Custody requested', { id: c.id });
  };
  A.askAnchor = function (s, p) {
    var c = custodyById(s, p.id); if (!c || (c.status !== 'awaiting' && c.status !== 'refused')) return fail('Nothing to add.');
    if (c.attestors.some(function (a) { return a.node === 'ravi'; })) return fail('Ravi Agencies has already been asked.');
    c.attestors.push({ node: 'ravi', answer: null, anchor: true });
    if (c.status === 'refused') { c.status = 'awaiting'; orphanById(s, c.orphan).status = 'custody_requested'; }
    log(s, s.me, 'Anchor Ravi Agencies asked to attest custody ' + c.id + '.');
    return ok('Anchor asked');
  };
  A.attest = function (s, p, ch) {
    var c = custodyById(s, p.id); if (!c) return fail('Request not found.');
    if (c.status !== 'awaiting') return fail('This request is ' + c.status + '.');
    var a = c.attestors.filter(function (x) { return x.node === p.node; })[0];
    if (!a) return fail(nameOf(s, p.node) + ' was not asked to attest.');
    if (a.answer) return fail(nameOf(s, p.node) + ' has already answered.');
    if (['yes', 'no', 'unsure'].indexOf(p.answer) < 0) return fail('Choose an answer.');
    s.now += 6;
    a.answer = p.answer; a.reason = p.reason || ''; a.at = s.now;
    s.attestations.push({ subject: c.id, attestor: p.node, answer: p.answer, reason: a.reason, at: s.now });
    log(s, p.node, nameOf(s, p.node) + ' answered "' + ({ yes: 'Yes, I confirm', no: 'No, they are reachable', unsure: 'I am not sure' })[p.answer] + '" on custody ' + c.id + '.', ch);
    var o = orphanById(s, c.orphan);
    if (p.answer === 'no') {
      c.status = 'refused'; o.status = 'unclaimed';
      notify(s, c.holder, nameOf(s, p.node) + ' says the owner is reachable. Custody not issued. Contact the owner, or ask an anchor to review.');
      return ok('Custody refused');
    }
    var yes = c.attestors.filter(function (x) { return x.answer === 'yes'; });
    if (yes.some(function (x) { return s.nodes[x.node].anchor; }) || yes.length >= 2) {
      c.status = 'active'; c.start = s.now; c.expiry = s.now + c.hours * 60; c.remaining = o.qty; c.unit = o.unit;
      o.status = 'in_custody'; o.holder = c.holder;
      notify(s, c.holder, 'You hold ' + amount(o) + ' for ' + ownerName(s, c) + ' until ' + stamp(s, c.expiry) + '. Every release is recorded.');
      var conflict = c.attestors.filter(function (x) { return x.answer === 'no'; });
      log(s, c.holder, 'Custody ' + c.id + ' issued to ' + nameOf(s, c.holder) + ' until ' + dayTime(c.expiry) + '. Owner claim kept for ' + ownerName(s, c) + '.' +
        (conflict.length ? ' Anchor review overrode the answer from ' + conflict.map(function (x) { return nameOf(s, x.node); }).join(' and ') + '.' : ''));
    }
    return ok('Answer recorded');
  };
  function ownerName(s, c) { return c.owner ? nameOf(s, c.owner) : (c.ownerText || 'the owner'); }
  A.recordRelease = function (s, p, ch) {
    var c = custodyById(s, p.id); if (!c || c.status !== 'active') return fail('Custody is not active.');
    var qty = Number(p.qty);
    if (!(qty > 0) || qty !== Math.floor(qty)) return fail('Enter a whole number above zero.');
    if (qty > c.remaining) return fail('Only ' + num(c.remaining) + ' ' + c.unit + ' remain in custody.');
    if (!p.to || !s.nodes[p.to]) return fail('Choose who receives it.');
    if (c.attestors.some(function (a) { return a.node === p.to && a.answer; })) return fail(nameOf(s, p.to) + ' attested this custody, so it cannot receive releases from it.');
    if (s.now > c.expiry) return fail('Custody expired at ' + stamp(s, c.expiry) + '. Renew or return it first.');
    var o = orphanById(s, c.orphan);
    s.now += 5;
    c.remaining -= qty;
        var value = o.kgPer ? qty * o.kgPer * 32 : qty * 100;
    var iou = { id: nextId(s, 'I-'), from: p.to, to: c.owner || 'owner:' + c.id, what: amount({ qty: qty, unit: c.unit, goods: o.goods, kgPer: o.kgPer }) + ', custody ' + c.id,
      amount: value, source: { kind: 'custody', id: c.id }, status: 'open', at: s.now, recordedBy: c.holder };
    s.obligations.push(iou);
    c.releases.push({ at: s.now, qty: qty, to: p.to, iou: iou.id, purpose: p.purpose || c.use });
    log(s, c.holder, 'Custody ' + c.id + ': released ' + num(qty) + ' ' + c.unit + ' to ' + nameOf(s, p.to) + '. IOU ' + iou.id + ' to ' + ownerName(s, c) + '.', ch);
    return ok('Release recorded');
  };
  A.returnCustody = function (s, p) {
    var c = custodyById(s, p.id); if (!c || c.status !== 'active') return fail('Custody is not active.');
    c.status = 'returned'; c.endedAt = s.now;
    var o = orphanById(s, c.orphan); o.status = 'returned'; o.holder = null;
    log(s, c.holder, 'Custody ' + c.id + ' ended. ' + num(c.remaining) + ' ' + c.unit + ' left at the owner\'s premises. Release IOUs stay open for ' + ownerName(s, c) + '.');
    return ok('Asset returned');
  };

  // F4.4 ledger
  A.settle = function (s, p) {
    var i = s.obligations.filter(function (x) { return x.id === p.id; })[0];
    if (!i) return fail('Entry not found.');
    if (i.status !== 'open') return fail('Entry is already ' + i.status + '.');
    if (i.to !== s.me) return fail('Only ' + nameOf(s, i.to) + ' can mark this as settled.');
    i.status = 'settled'; i.settledAt = s.now;
    log(s, s.me, 'IOU ' + i.id + ' marked settled. No money moved through Relay.');
    return ok('Marked settled');
  };
  A.dispute = function (s, p) {
    var i = s.obligations.filter(function (x) { return x.id === p.id; })[0];
    if (!i || i.status !== 'open') return fail('Only open entries can be disputed.');
    i.status = 'disputed';
    log(s, s.me, 'IOU ' + i.id + ' disputed. Sent to Ravi Agencies for review.');
    return ok('Dispute raised');
  };
  function ledger(s, me) {
    me = me || s.me;
    var mine = s.obligations.filter(function (i) { return i.from === me || i.to === me; });
    var owe = 0, owed = 0, by = {};
    mine.forEach(function (i) {
      var cp = i.from === me ? i.to : i.from;
      by[cp] = by[cp] || { id: cp, net: 0, entries: [] };
      by[cp].entries.push(i);
      if (i.status !== 'open' && i.status !== 'disputed') return;
      if (i.from === me) { owe += i.amount; by[cp].net -= i.amount; } else { owed += i.amount; by[cp].net += i.amount; }
    });
    return { owe: owe, owed: owed, rows: Object.keys(by).map(function (k) { return by[k]; }) };
  }

  // F3.6.1
  A.postNeed = function (s, p, ch) {
    var qty = Number(p.qty);
    if (!String(p.what || '').trim()) return fail('Say what you need.');
    if (!(qty > 0)) return fail('Enter how much you need.');
    if (!(p.by > s.now)) return fail('Choose a time in the future.');
    var tier = Number(p.tier); if ([0, 1, 2, 3].indexOf(tier) < 0) tier = 2;
    var dup = s.needs.filter(function (n) { return n.node === s.me && n.status === 'open' && n.what.toLowerCase() === String(p.what).trim().toLowerCase() && n.qty === qty; })[0];
    if (dup) return fail('You already posted this need (' + dup.id + ').');
    var n = { id: nextId(s, 'N'), node: s.me, what: String(p.what).trim(), qty: qty, unit: p.unit || 'units', by: p.by, tierClaimed: tier, verifiedBy: [], status: 'open', kind: p.kind || 'goods', at: s.now };
    s.needs.push(n);
    log(s, s.me, nameOf(s, s.me) + ' posted need ' + n.id + ': ' + amount(n) + ', Tier ' + tier + (tierVerified(s, n) ? '' : ' claimed, not verified') + '.', ch);
    return ok('Need posted', { id: n.id });
  };

  // Simulation controls, clearly separate from product actions.
  A.advance = function (s, p) { var m = Number(p.mins) || 60; s.now += m; log(s, 'system', 'Demo clock moved forward ' + dur(m) + '.'); return ok('Clock moved ' + dur(m)); };
  A.setting = function (s, p) { s.settings[p.key] = p.value; return ok(''); };

  /* ---------- console figures (F2.6) ---------- */
  function coverage(s) {
    var pre = s.edges.filter(function (e) { return e.pre; });
    var known = pre.filter(function (e) { var st = edgeStatus(s, e); return st !== 'unknown' || e.replacedBy; });
    return { known: known.length, total: pre.length, pct: Math.round(100 * known.length / pre.length) };
  }

  /* ---------- SMS channel (F6.1.1). Same actions, numbered replies. ---------- */
  var ALIAS = { HAAN: '1', HAN: '1', NAHI: '2', NAHIN: '2' };
  function smsIn(s, phone, raw) {
    var text = String(raw || '').trim();
    if (!text) return fail('Type a reply.');
    (s.sms[phone] = s.sms[phone] || []).push({ dir: 'out', at: s.now, text: text });
    var up = text.toUpperCase().replace(/\s+/g, ' ');
    if (ALIAS[up]) up = ALIAS[up];
    var ctx = s.smsCtx[phone] || {};
    var me = phone, said = [];
    function say(t) { said.push(t); smsOut(s, phone, t); }
    function asMe(fn) { var keep = s.me; s.me = me; try { return fn(); } finally { s.me = keep; } }
    function setCtx(c) { s.smsCtx[phone] = c; }
    var n = s.nodes[me];

    if (up === 'HELP') { say('Relay: ' + (me === 'joshi' ? 'Ravi Agencies' : 'Your anchor') + ' will call you back. Calls are simulated in this demo.'); return ok('', { replies: said }); }

    if (up === 'CHECKIN' || up === 'STATUS') {
      if (n.checkin) { setCtx({ flow: 'daily' }); say('Relay: Same as ' + (Math.floor(n.checkin.at / DAY) === Math.floor(s.now / DAY) ? 'your last check-in' : 'yesterday') + ' (' + capWord(n.checkin.capacity).toLowerCase() + ' capacity, ' + n.vehicles.reduce(function (a, v) { return a + v.count; }, 0) + ' vehicles)? Reply 1 Yes, 2 Change.'); }
      else { setCtx({ flow: 'ping' }); say('Relay: Are you still operating? Reply 1 Yes, 2 No.'); }
      return ok('', { replies: said });
    }
    if (up === 'TASK' || up === 'TASKS') {
      var offered = rankedTasks(s, ['offered']).filter(function (x) { return x.legs.some(function (l) { return l.carrier === me; }); });
      if (!offered.length) { say('Relay: No tasks right now. You will get an SMS when one matches your vehicle.'); return ok('', { replies: said }); }
      var t = offered[0];
      setCtx({ flow: 'task', id: t.id });
      say(taskOfferSms(s, t));
      return ok('', { replies: said });
    }
    if (up === 'ACCEPT') {
      var mineOff = rankedTasks(s, ['offered']).filter(function (x) { return x.legs.some(function (l) { return l.carrier === me; }); });
      if (!mineOff.length) { say('Relay: No tasks right now. You will get an SMS when one matches your vehicle.'); return ok('', { replies: said }); }
      for (var ai = 0; ai < mineOff.length; ai++) { var ar = asMe(function () { return A.acceptTask(s, { id: mineOff[ai].id }, 'sms'); }); if (ar.ok) { setCtx({}); say('Relay: Task ' + mineOff[ai].id + ' accepted. Reply PICKED when you have the goods.'); return ok('', { replies: said }); } }
      say('Relay: ' + asMe(function () { return A.acceptTask(s, { id: mineOff[0].id }, 'sms'); }).msg); return ok('', { replies: said });
    }
    var dc = up.match(/^DONE (\d{4})$/);
    if (dc) {
      var actv = s.tasks.filter(function (x) { return (x.status === 'accepted' || x.status === 'in_progress') && myLeg(x, me); });
      if (!actv.length) { say('Relay: You have no active task. Reply TASK to see offers.'); return ok('', { replies: said }); }
      var due = actv.filter(function (x) { var n0 = asMe(function () { return nextStep(s, x); }); if (!n0 || (n0.step !== 'handoff' && n0.step !== 'receive')) return false; var lg = n0.step === 'handoff' ? n0.leg : n0.from; return lg.code === dc[1]; })[0]
        || actv.filter(function (x) { var n0 = asMe(function () { return nextStep(s, x); }); return n0 && (n0.step === 'handoff' || n0.step === 'receive'); })[0] || actv[0];
      setCtx({ flow: 'code', id: due.id }); up = dc[1]; ctx = s.smsCtx[phone];
    }
    var m = up.match(/^(ACCEPT|DECLINE) (T\d+)$/);
    if (m) { setCtx({ flow: 'task', id: m[2] }); up = m[1] === 'ACCEPT' ? '1' : '2'; ctx = s.smsCtx[phone]; }
    if (up === 'ORPHAN') { setCtx({ flow: 'orphan', step: 'type' }); say('Relay: What is it? 1 Stranded vehicle or cargo, 2 Stock in a closed shop or godown, 3 Parcels without recipient, 4 Unattended hazard.'); return ok('', { replies: said }); }
    if (up === 'NEED') { setCtx({ flow: 'need', step: 'what' }); say('Relay: What do you need? Example: diesel'); return ok('', { replies: said }); }
    if (up === 'PICKED' || up === 'ARRIVED' || up === 'DONE') {
      var act = s.tasks.filter(function (x) { return (x.status === 'accepted' || x.status === 'in_progress') && myLeg(x, me); })[0];
      if (!act) { say('Relay: You have no active task. Reply TASK to see offers.'); return ok('', { replies: said }); }
      var ns = asMe(function () { return nextStep(s, act); });
      if (up === 'DONE') {
        if (ns.step !== 'handoff' && ns.step !== 'receive') { say('Relay: Task ' + act.id + ' is not at a handoff yet. Next step: ' + ns.label.toLowerCase() + '. Reply ARRIVED when you reach the drop point.'); return ok('', { replies: said }); }
        setCtx({ flow: 'code', id: act.id });
        say('Relay: Task ' + act.id + ': enter the ' + (ns.step === 'receive' ? 'driver\'s' : 'receiver\'s') + ' 4-digit code.');
        return ok('', { replies: said });
      }
      var want = up === 'PICKED' ? (ns.step === 'at_pickup' ? 'at_pickup' : 'picked_up') : 'at_handoff';
      if (up === 'PICKED' && ns.step === 'at_pickup') { asMe(function () { return A.legStep(s, { id: act.id, step: 'at_pickup' }, 'sms'); }); ns = asMe(function () { return nextStep(s, act); }); want = 'picked_up'; }
      if (ns.step !== want) { say('Relay: Task ' + act.id + ': next step is "' + ns.label + '".'); return ok('', { replies: said }); }
      var r0 = asMe(function () { return A.legStep(s, { id: act.id, step: want }, 'sms'); });
      say('Relay: Task ' + act.id + ': ' + (r0.ok ? (want === 'picked_up' ? 'picked up recorded. Reply ARRIVED at the drop point.' : 'arrival recorded. Ask the receiver for their 4-digit code. Reply DONE when handed over.') : r0.msg));
      return ok('', { replies: said });
    }
    var cr = up.match(/^CANT REACH (.+)$/) || up.match(/^CAN'T REACH (.+)$/);
    if (cr) {
      var q = cr[1].toLowerCase();
      var hit = myLinks(s, me).map(function (l) { return l.other; }).filter(function (id) { return s.nodes[id].name.toLowerCase().indexOf(q) >= 0; })[0];
      if (!hit) { say('Relay: No partner matches "' + cr[1] + '". Send the first word of their name.'); return ok('', { replies: said }); }
      setCtx({ flow: 'cantreach', node: hit });
      say('Relay: You cannot reach ' + s.nodes[hit].name + '. Is this correct? 1 Yes, 2 No.');
      return ok('', { replies: said });
    }

    // Numbered replies inside a flow.
    var r;
    if (ctx.flow === 'ping') {
      if (up === '1') { setCtx({ flow: 'capacity' }); say('Relay: How much capacity do you have? 1 None, 2 Quarter, 3 Half, 4 Full.'); }
      else if (up === '2') { r = A.checkIn(s, { node: me, operating: false }, 'sms'); setCtx({}); say('Relay: Status recorded: not operating today. Reply CHECKIN when you restart. Reply HELP for a person to call you.'); }
      else say('Relay: Reply 1 Yes, 2 No.');
      return ok('', { replies: said });
    }
    if (ctx.flow === 'daily') {
      if (up === '1') { r = A.sameAsYesterday(s, { node: me }, 'sms'); setCtx({}); say('Relay: ' + (r.ok ? 'Status confirmed: ' + r.word + '.' : r.msg)); }
      else if (up === '2') { setCtx({ flow: 'capacity' }); say('Relay: How much capacity do you have? 1 None, 2 Quarter, 3 Half, 4 Full.'); }
      else say('Relay: Reply 1 Yes, 2 Change.');
      return ok('', { replies: said });
    }
    if (ctx.flow === 'capacity') {
      var cap = { '1': 0, '2': 0.25, '3': 0.5, '4': 1 }[up];
      if (cap == null) { say('Relay: Reply 1 None, 2 Quarter, 3 Half, 4 Full.'); return ok('', { replies: said }); }
      r = A.checkIn(s, { node: me, operating: true, capacity: cap }, 'sms');
      setCtx({});
      var waiting = rankedTasks(s, ['offered']).filter(function (x) { return x.legs.some(function (l) { return l.carrier === me; }); });
      say('Relay: Status confirmed: ' + r.word + '.' + (waiting.length ? ' Task ' + waiting[0].id + ' is waiting. Reply TASK to see it.' : ' Your partners can see this now.'));
      return ok('', { replies: said });
    }
    if (ctx.flow === 'task') {
      if (up === '1') { r = asMe(function () { return A.acceptTask(s, { id: ctx.id }, 'sms'); }); setCtx({}); say('Relay: ' + (r.ok ? 'Task ' + ctx.id + ' accepted. Reply PICKED when you have the goods.' : r.msg)); }
      else if (up === '2') { setCtx({ flow: 'decline', id: ctx.id }); say('Relay: Why? 1 No vehicle, 2 Too far, 3 Other.'); }
      else say('Relay: Reply 1 Accept, 2 Decline.');
      return ok('', { replies: said });
    }
    if (ctx.flow === 'decline') {
      var why = { '1': 'No vehicle', '2': 'Too far', '3': 'Other' }[up];
      if (!why) { say('Relay: Reply 1 No vehicle, 2 Too far, 3 Other.'); return ok('', { replies: said }); }
      r = asMe(function () { return A.declineTask(s, { id: ctx.id, reason: why }, 'sms'); }); setCtx({});
      say('Relay: ' + (r.ok ? 'Task ' + ctx.id + ' declined. The request stays open for other carriers.' : r.msg));
      return ok('', { replies: said });
    }
    if (ctx.flow === 'code') {
      r = asMe(function () { return A.confirmHandoff(s, { id: ctx.id, method: 'code', code: up }, 'sms'); });
      if (r.ok) { setCtx({}); var tt = task(s, ctx.id); say('Relay: Task ' + ctx.id + ': handoff confirmed.' + (tt.status === 'delivered' ? ' Delivered. IOU recorded.' : ' Reply ARRIVED at the drop point.')); }
      else say('Relay: ' + r.msg + ' Reply HELP for a person to call you.');
      return ok('', { replies: said });
    }
    if (ctx.flow === 'cantreach') {
      if (up === '1') { r = asMe(function () { return A.reportCantReach(s, { node: ctx.node }, 'sms'); }); say('Relay: ' + (r.ok ? 'Recorded. ' + s.nodes[ctx.node].name + ' now shows as ' + STATE_WORD[r.state].toLowerCase() + '.' : r.msg)); }
      else say('Relay: Not recorded.');
      setCtx({});
      return ok('', { replies: said });
    }
    if (ctx.flow === 'orphan') {
      if (ctx.step === 'type') {
        var types = { '1': 'Stranded vehicle or cargo', '2': 'Stock in a closed premises', '3': 'Parcels without recipient', '4': 'Unattended hazardous asset' };
        if (!types[up]) { say('Relay: Reply 1, 2, 3 or 4.'); return ok('', { replies: said }); }
        setCtx({ flow: 'orphan', step: 'what', type: types[up] }); say('Relay: What goods and how much? Example: 40 sacks rice');
      } else if (ctx.step === 'what') {
        var mm = text.match(/^([\d,]+)\s+(\S+)\s+(.+)$/);
        if (!mm) { say('Relay: Send the quantity first. Example: 40 sacks rice'); return ok('', { replies: said }); }
        setCtx({ flow: 'orphan', step: 'where', type: ctx.type, qty: Number(mm[1].replace(/,/g, '')), unit: mm[2].toLowerCase(), goods: mm[3].charAt(0).toUpperCase() + mm[3].slice(1) });
        say('Relay: Where is it? Send a landmark or area.');
      } else if (ctx.step === 'where') {
        r = asMe(function () { return A.reportOrphan(s, { type: ctx.type, goods: ctx.goods, qty: ctx.qty, unit: ctx.unit, place: text, condition: 'Not inspected, reported by SMS' }, 'sms'); });
        setCtx({});
        say('Relay: ' + (r.ok ? 'Orphan ' + r.id + ' recorded: ' + amount(ctx) + ', ' + text + '. Thank you.' : r.msg));
      }
      return ok('', { replies: said });
    }
    if (ctx.flow === 'need') {
      if (ctx.step === 'what') { setCtx({ flow: 'need', step: 'qty', what: text }); say('Relay: How much? Example: 200 litre'); }
      else if (ctx.step === 'qty') {
        var qm = text.match(/^([\d,]+)\s*(.*)$/);
        if (!qm) { say('Relay: Send a number first. Example: 200 litre'); return ok('', { replies: said }); }
        setCtx({ flow: 'need', step: 'by', what: ctx.what, qty: Number(qm[1].replace(/,/g, '')), unit: (qm[2] || 'units').toLowerCase() });
        say('Relay: By when? 1 Today 20:00, 2 Tomorrow 08:00, 3 Within 3 days.');
      } else if (ctx.step === 'by') {
        var d0 = Math.floor(s.now / DAY) * DAY;
        var by = { '1': d0 + 1200, '2': d0 + DAY + 480, '3': s.now + 3 * DAY }[up];
        if (!by) { say('Relay: Reply 1, 2 or 3.'); return ok('', { replies: said }); }
        r = asMe(function () { return A.postNeed(s, { what: ctx.what, qty: ctx.qty, unit: ctx.unit, by: by, tier: 2, kind: 'goods' }, 'sms'); });
        setCtx({});
        if (r.ok) { var nd = needById(s, r.id), qi = queueInfo(s, nd); say('Relay: Need ' + r.id + ' posted: ' + amount(ctx) + ' by ' + stamp(s, by) + ', Tier 2. Position ' + qi.pos + ' of ' + qi.of + '.'); }
        else say('Relay: ' + r.msg);
      }
      return ok('', { replies: said });
    }
    say('Relay: Reply CHECKIN, TASK, DONE, ORPHAN, NEED, CANT REACH name, or HELP.');
    return ok('', { replies: said });
  }
  function taskOfferSms(s, t) {
    return 'Task ' + t.id + ': Pick up ' + amount(t).replace(/ \(cold chain\)/, '') + ', ' + s.nodes[t.from].area + ' to ' + s.nodes[t.to].area + ', by ' + clock(t.by) + ', Tier ' + taskTier(s, t) + '. Reply 1 Accept, 2 Decline.';
  }

  /* ---------- store ---------- */
  function createStore(initial, persist) {
    var s = initial, subs = [];
    function emit() { subs.forEach(function (f) { f(s); }); }
    return {
      get state() { return s; },
      run: function (name, payload, ch) {
        var r = A[name](s, payload || {}, ch || 'app');
        if (r.ok && s.settings.offline && ch !== 'sms' && name !== 'setting' && name !== 'advance' && name.indexOf('sim') !== 0 && ['respondProposal', 'attest', 'attestHandoff'].indexOf(name) < 0) {
          smsOut(s, s.me, 'Sent by SMS: ' + (r.msg || name) + '.');
          r.viaSms = true;
        }
        if (persist) persist(s);
        emit();
        return r;
      },
      sms: function (phone, text) { var r = smsIn(s, phone, text); if (persist) persist(s); emit(); return r; },
      replace: function (ns) { s = ns; if (persist) persist(s); emit(); },
      subscribe: function (f) { subs.push(f); }
    };
  }

  var api = {
    createStore: createStore, actions: A, smsIn: smsIn,
    nodeState: nodeState, stateDetail: stateDetail, STATE_WORD: STATE_WORD, isOperating: isOperating, lastSeen: lastSeen, silenceMins: silenceMins,
    myLinks: myLinks, chainStrip: chainStrip, chainCounts: chainCounts, brokenLinks: brokenLinks, edgeStatus: edgeStatus, pendingProposalFor: pendingProposalFor,
    substitutes: substitutes, trustWord: trustWord, rankedTasks: rankedTasks, taskReason: taskReason, taskTier: taskTier, taskPriority: taskPriority,
    tierVerified: tierVerified, effectiveTier: effectiveTier, verifierText: verifierText, queueInfo: queueInfo, needById: needById,
    handoffAttestors: handoffAttestors, fleet: fleet, coldCarrier: coldCarrier, nextStep: nextStep, ledger: ledger, coverage: coverage, taskOfferSms: taskOfferSms,
    nameOf: nameOf, place: place, km: km, task: task, custodyById: custodyById, orphanById: orphanById, ownerName: ownerName,
    clock: clock, dayTime: dayTime, stamp: stamp, dur: dur, ago: ago, num: num, rupees: rupees, amount: amount, ordinal: ordinal, capWord: capWord
  };
  root.Relay = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
