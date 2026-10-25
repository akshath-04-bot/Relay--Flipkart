/* SMS simulator, shown inside the phone frame. Messages go through Relay.smsIn, the same actions the app uses. Nothing is sent. */
(function (root) {
  'use strict';
  var R = root.Relay, U = root.UI, h = U.h;
  var PHONES = [['joshi', 'Joshi Fleet'], ['kaveri', 'Kaveri Cold Chain']];
  var KEYS = [['ACCEPT', 1], ['DONE', 1], ['STATUS', 1], ['TASK'], ['1'], ['2'], ['3'], ['4'], ['PICKED'], ['ARRIVED'], ['ORPHAN'], ['NEED'], ['HELP']];
  function render(s, V) {
    var phone = V.smsPhone, msgs = s.sms[phone] || [];
    var pick = '<div class="segctl sms-pick" role="tablist" aria-label="Whose phone">' + PHONES.map(function (p) {
      return '<button type="button" role="tab" class="' + (phone === p[0] ? 'on' : '') + '" aria-selected="' + (phone === p[0]) + '" data-a="smsPhone" data-v="' + p[0] + '">' + h(p[1]) + '</button>';
    }).join('') + '</div>';
    var list = msgs.map(function (m) {
      return m.dir === 'in'
        ? '<li class="msg msg-in"><span class="msg-k">Relay core (' + R.clock(m.at) + '):</span><span>' + h(m.text.replace(/^Relay: /, '')) + '</span></li>'
        : '<li class="msg msg-out"><span>' + h(m.text) + '</span><span class="msg-time">' + R.clock(m.at) + '</span></li>';
    }).join('');
    return '<div class="sms">' + pick +
      '<div class="card card-sky"><div class="card-top"><span class="chip chip-sky"><span class="pdot" aria-hidden="true"></span>2G edge / SMS parity layer</span><span class="eyebrow">No internet needed</span></div>' +
      '<h2 class="h2">Full Relay protocol via 1-tap keywords</h2><p class="card-desc">When data towers fail, Relay continues over standard SMS to shortcode <strong class="num">54040</strong>. Simulated here: nothing leaves this device.</p></div>' +
      '<div class="card sms-thread"><div class="sms-head"><span class="eyebrow">Conversation: ' + h(s.nodes[phone].name) + '</span><span class="eyebrow">Signal: GSM</span></div>' +
      '<ol class="msgs" id="msgs" aria-live="polite" aria-label="Messages">' + list + '</ol>' +
      '<div class="keys" role="group" aria-label="Quick replies">' + KEYS.map(function (k) { return '<button type="button" class="key' + (k[1] ? ' key-hi' : '') + '" data-a="smsKey" data-v="' + k[0] + '">' + k[0] + '</button>'; }).join('') + '</div>' +
      '<form class="sms-form" data-form="smsSend"><label class="sr" for="sms-in">Reply</label><input id="sms-in" name="text" autocomplete="off" placeholder="Type SMS command, e.g. DONE 7306"><button type="submit" class="btn btn-primary btn-sm">Send</button></form></div></div>';
  }
  root.SmsView = { render: render };
})(window);
