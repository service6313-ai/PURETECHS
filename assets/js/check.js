/* PureTechs — check.js
   The IT check. It runs entirely in this browser: answers are held in memory only,
   nothing is stored, and nothing is sent anywhere. Scoring is printed on /verify/. */
(function () {
  'use strict';
  var PT = window.PT || {};
  var root = document.querySelector('[data-check]');
  var result = document.querySelector('[data-result]');
  if (!root || !result) return;

  /* ---------- the questions ---------- */
  var MODULES = ['IMPACT', 'MANAGED IT', 'EMAIL & CLOUD', 'LICENSING', 'ACCESS', 'BACKUP & RECOVERY', 'NETWORK', 'COST'];
  var QS = [
    { id: 'incidents', mod: 'IMPACT', short: 'What IT has stopped in the last year', ask: 'In the last year, what has IT actually stopped?',
      why: 'We start here, not with technical checkboxes — the real picture is what has actually broken, not what could theoretically go wrong.',
      multi: true, cols: 2, opts: [['server', 'Server or network down'], ['email', 'Internet or email outage'], ['malware', 'Virus or malware on PCs'], ['printer', 'Printer or scanner down'], ['dataloss', 'Data lost or a file corrupted'], ['none', 'Nothing has stopped']] },
    { id: 'dependency', mod: 'IMPACT', short: 'What stops when it happens', ask: 'If that keeps happening — what actually stops in the business?',
      why: 'This is the most direct way to see what your business actually stands on.',
      multi: true, cols: 2, opts: [['billing', 'Billing / dispatch'], ['accounts', 'Accounts / payments'], ['sales', 'Sales / customer support'], ['all', 'All work stops'], ['none', 'Nothing stops']] },
    { id: 'continuity', mod: 'IMPACT', short: 'Fallback when systems fail', ask: 'When it happens, is there any fallback?',
      why: 'This is what separates an inconvenience from a shutdown.',
      opts: [['manual', 'Yes — a manual process we switch to'], ['altmachine', 'Yes — we work on another machine'], ['callit', 'We call IT or a vendor and wait'], ['none', 'No plan — we just wait it out']] },
    { id: 'monitoring', mod: 'MANAGED IT', short: 'Proactive monitoring', ask: 'Is your IT proactively monitored, or do you find out only when something breaks?',
      why: 'This is the difference between catching a failing disk before it fails, and finding out when the server does not turn on.',
      opts: [['monitored', 'Yes — monitored, with alerts before failure'], ['reactive', 'No — we find out when it breaks'], ['unsure', 'Not sure']] },
    { id: 'maintenance', mod: 'MANAGED IT', short: 'Preventive maintenance', ask: 'Does anyone do scheduled preventive maintenance — updates, patching, health checks — on your systems?',
      why: 'Skipped patches and ignored warnings are how small issues turn into a Monday morning outage.',
      opts: [['scheduled', 'Yes, on a set schedule'], ['reactive', 'Only when there is a problem'], ['never', 'Never'], ['unsure', 'Not sure']] },
    { id: 'email', mod: 'EMAIL & CLOUD', short: 'Where business email lives', ask: 'Where does your business email actually live?',
      why: 'This single answer tells us more about your real risk than almost anything else we could ask.',
      opts: [['google', 'Google Workspace'], ['ms365', 'Microsoft 365'], ['cpanel', 'cPanel / hosted webmail (POP3 or IMAP)'], ['personal', 'Free personal Gmail or a mixed setup'], ['unsure', 'Not sure']] },
    { id: 'licensing', mod: 'LICENSING', short: 'Licence tiers by role', ask: 'Does every user have the same email or Office plan, regardless of role?',
      why: 'Paying one price for everyone usually means paying for capability most users never touch.',
      opts: [['same', 'Yes, everyone is on the same plan'], ['varies', 'No, it varies by role'], ['unsure', 'Not sure — never checked']] },
    { id: 'genericmail', mod: 'LICENSING', short: 'Role-based mailboxes', ask: 'How many role-based addresses — info@, sales@, support@, accounts@ — have their own separate paid mailbox?',
      why: 'These almost never need to be full paid seats. Most business email platforms let you create them as free aliases or a shared mailbox under a licence you already pay for.',
      opts: [['none', 'None — we do not use role addresses'], ['few', 'One or two'], ['several', 'Three or more'], ['unsure', 'Not sure']] },
    { id: 'unused', mod: 'LICENSING', short: 'Unused licences', ask: 'Are any paid email or Office licences sitting on accounts that have left, or are barely used?',
      why: 'A licence nobody reviews is a fixed cost that quietly renews every month, whether anyone is using it or not.',
      opts: [['yes', 'Yes, at least one'], ['no', 'No, we keep it clean'], ['unsure', 'Not sure']] },
    { id: 'mfa', mod: 'ACCESS', short: '2-step verification', ask: 'Is 2-step verification on for business email?',
      why: 'Email is the single most common way in. MFA closes that door for almost nothing.',
      opts: [['on', 'On for everyone'], ['some', 'On for some accounts'], ['off', 'Off'], ['unknown', 'Not sure']] },
    { id: 'exits', mod: 'ACCESS', short: 'Access removal when staff leave', ask: 'When someone leaves, is their access revoked the same week?',
      why: 'Email, Tally, CCTV, WhatsApp groups — any login still alive can still get in.',
      opts: [['yes', 'Yes, there is a checklist'], ['sometimes', 'Sometimes, informally'], ['no', 'No process for it'], ['unknown', 'Not sure']] },
    { id: 'backup', mod: 'BACKUP & RECOVERY', short: 'Last tested restore', ask: 'When was a restore from backup last tested?',
      why: '“Backup is running” and “restore works” are two different facts. Only one of them saves you.',
      opts: [['recent', 'In the last three months'], ['old', 'More than a year ago'], ['never', 'Never tested'], ['unknown', 'I do not know']] },
    { id: 'firewall', mod: 'NETWORK', short: 'What protects the office network', ask: 'What sits between your office and the internet?',
      why: 'A home router and a business firewall are not the same thing. The gap shows up on the day you get hit.',
      opts: [['firewall', 'A business hardware firewall'], ['router', 'The ISP router only'], ['unknown', 'Not sure what is installed']] },
    { id: 'costItems', mod: 'COST', short: 'IT costs you pay for', ask: 'Which IT costs do you currently pay for?',
      why: 'Most businesses can name two or three. Seeing the full list side by side is usually the first surprise.',
      multi: true, cols: 2, opts: [['ms', 'Microsoft licences'], ['gw', 'Google Workspace'], ['emailhost', 'Email hosting'], ['dns', 'Domain / DNS'], ['av', 'Antivirus / EDR'], ['fw', 'Firewall / security subscriptions'], ['backup', 'Backup'], ['cloud', 'Cloud storage'], ['servers', 'Servers'], ['internet', 'Internet'], ['amc', 'AMC'], ['callsupport', 'Call-basis support'], ['swlic', 'Software licences'], ['erp', 'Tally / ERP'], ['mssub', 'Microsoft / Google subscriptions'], ['saas', 'Other SaaS'], ['dontknow', 'Do not know']] },
    { id: 'spendKnown', mod: 'COST', short: 'Monthly IT spend known', ask: 'Do you know approximately how much you spend on IT subscriptions every month?',
      why: 'Not a trick question — most owners have never added it up across every vendor and card.',
      opts: [['yes', 'Yes'], ['roughly', 'Roughly'], ['no', 'No']] },
    { id: 'costReview', mod: 'COST', short: 'How often IT spend is reviewed', ask: 'How often is this reviewed against actual usage?',
      why: 'A subscription nobody re-checks keeps renewing at full price whether it is still needed or not.',
      opts: [['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['yearly', 'Yearly'], ['renewal', 'Only during renewal'], ['never', 'Never'], ['dontknow', 'Do not know']] }
  ];
  var UNSURE = { unsure: 1, unknown: 1, dontknow: 1 };

  /* ---------- the rules: every finding comes from one answer, and says so ---------- */
  var RULES = [
    { q: 'continuity', cat: 'continuity', sev: 'risk', when: function (a) { return a.continuity === 'none'; },
      title: 'There is no fallback when core systems fail',
      why: 'No manual process, no spare machine, nobody to call — when the system stops, the business stops with it, for as long as the fix takes.',
      fix: 'A written fallback for each critical system, even a manual paper process, buys time while the real fix happens.',
      verify: 'Which systems the business cannot run without — and whether each one has a written fallback.' },
    { q: 'email', cat: 'email', sev: 'risk', when: function (a) { return a.email === 'cpanel'; },
      title: 'Hosted POP3 / IMAP mail often ends up in one local file that can corrupt',
      why: 'On POP3 / IMAP hosted mail, years of business communication often sit in one local .pst file. Once that file corrupts or the drive fails, recovery is expensive and never guaranteed.',
      fix: 'Move to a hosted mailbox (Google Workspace or Microsoft 365) so mail lives in the cloud, not on one hard drive.',
      verify: 'Where each mailbox actually lives, how large the local files are, and when they were last backed up.' },
    { q: 'email', cat: 'email', sev: 'risk', when: function (a) { return a.email === 'personal'; },
      title: 'Business email runs on a personal account',
      why: 'A personal Gmail or shared free inbox has no admin control — nobody can revoke access, recover a deleted mail, or prove who sent what after someone leaves.',
      fix: 'Move to a business mailbox on your own domain, with one admin who can manage access centrally.',
      verify: 'Who owns each account, who can recover it, and what moving to your own domain involves.' },
    { q: 'backup', cat: 'backup', sev: 'risk', when: function (a) { return ['never', 'unknown', 'old'].indexOf(a.backup) > -1; },
      title: 'A restore from backup has never been tested',
      unkTitle: 'Nobody can say when a restore was last tested',
      why: 'A backup you have never restored from is a belief, not a control. The first time it is tested should not be the morning after a ransomware attack.',
      variants: { old: { title: 'The last tested restore is more than a year old',
        why: 'A restore that worked a year ago says little about today’s backup — the systems, the data and the backup jobs have all changed since. The next real test should not be the morning after a ransomware attack.' } },
      fix: 'A documented restore drill — and a monthly tested restore from then on.',
      verify: 'A restore of real files from your latest backup — timed, and written down.' },
    { q: 'firewall', cat: 'network', sev: 'risk', when: function (a) { return ['router', 'unknown'].indexOf(a.firewall) > -1; },
      title: 'The office runs behind an ISP router, not a firewall',
      unkTitle: 'Nobody is sure what protects the office network',
      why: 'An ISP router usually gives no segmentation, no inspection and no logging — guest devices, CCTV and office systems may all share one flat network.',
      unkWhy: 'If nobody can say what sits between the office and the internet, nobody is managing it. There may be no segmentation, no inspection and no logging at all.',
      fix: 'A business hardware firewall with VLAN segmentation and a documented rule set.',
      verify: 'What sits at the edge, what is exposed to the internet, and whether guest, CCTV and office traffic share one network.' },
    { q: 'mfa', cat: 'access', sev: 'risk', when: function (a) { return ['off', 'some', 'unknown'].indexOf(a.mfa) > -1; },
      title: '2-step verification is not on for every mailbox',
      unkTitle: 'Nobody is sure whether 2-step verification is on',
      why: 'Business email compromise starts with one reused password. MFA is the single highest-return control available to you.',
      unkWhy: 'Business email compromise starts with one reused password. If nobody knows whether 2-step verification is enforced, treat some mailboxes as exposed until it is checked.',
      fix: 'MFA enforced on every mailbox, with break-glass admin accounts documented.',
      verify: 'Which mailboxes enforce 2-step verification, and which admin accounts exist.' },
    { q: 'licensing', cat: 'cost', sev: 'attn', when: function (a) { return a.licensing === 'same'; },
      title: 'Every user is on the same licence tier, regardless of role',
      why: 'Frontline or field staff who only check mail rarely need the same paid tier as accounts or management. One price for everyone usually means paying for capability most users never touch — and it compounds every month, on every seat.',
      fix: 'Split licences by actual usage: a lighter, browser-only plan for staff who just check mail, and the full desktop tier only for the people who open Word, Excel or Outlook daily. It needs no new hardware or downtime to apply.',
      verify: 'Every user’s licence tier against what they actually open each day.' },
    { q: 'genericmail', cat: 'cost', sev: 'attn', when: function (a) { return ['few', 'several'].indexOf(a.genericmail) > -1; },
      title: 'Role-based inboxes may be paid seats that do not need to be',
      why: 'Addresses like info@, sales@ or accounts@ are usually read by two or three people, not logged into as their own account. If each one has its own full mailbox licence, you are paying seat-price for what is really a shared inbox.',
      fix: 'Convert each role address into a free alias or a shared mailbox under a licence you already hold, and keep a paid seat only where someone genuinely needs to send and reply from it independently.',
      verify: 'Which role addresses are paid seats, and which can become aliases or shared mailboxes.' },
    { q: 'unused', cat: 'cost', sev: 'attn', when: function (a) { return a.unused === 'yes'; },
      title: 'Paid licences are sitting on accounts nobody actively uses',
      why: 'A seat tied to someone who has left, or who rarely logs in, keeps renewing at full price every month with nobody reviewing it — and it is also an access risk, not just a cost one.',
      fix: 'A quarterly licence review — cancel or reassign every seat tied to someone who has left, downgrade anything barely used.',
      verify: 'Every paid seat against the current staff list and last sign-in date.' },
    { q: 'exits', cat: 'access', sev: 'attn', when: function (a) { return ['no', 'sometimes', 'unknown'].indexOf(a.exits) > -1; },
      title: 'Departed staff access is not revoked to a checklist',
      unkTitle: 'Nobody is sure access is removed when people leave',
      why: 'Every account left alive is a door. This one does not need a budget — it needs a written process.',
      fix: 'A joiner / mover / leaver checklist covering email, Tally, CCTV and WhatsApp groups.',
      verify: 'Accounts still active for people who have left — email, Tally, CCTV and WhatsApp groups.' },
    { q: 'dependency', cat: 'continuity', sev: 'attn', when: function (a) { return Array.isArray(a.dependency) && (a.dependency.indexOf('all') > -1 || a.dependency.length >= 2); },
      title: 'More than one core workflow stops when IT fails',
      why: 'You said more than one part of the business stops when IT fails. That usually means several workflows lean on the same server, connection or system — a single point of failure carrying the revenue line.',
      fix: 'Server redundancy or a warm standby, with the recovery time agreed in writing.',
      verify: 'Which single device or service those workflows share, and how long recovery would take.' },
    { q: 'monitoring', cat: 'managed', sev: 'attn', when: function (a) { return a.monitoring === 'reactive'; },
      title: 'IT problems are found only after they happen',
      why: 'Without monitoring, a failing disk, a filling mail queue or a dying UPS gives no warning — the first sign of trouble is the system going down.',
      fix: 'Proactive monitoring with alerts before failure, so issues are caught on a dashboard, not by a phone call from an angry team.',
      verify: 'What is monitored today, and which failures would give no warning.' },
    { q: 'maintenance', cat: 'managed', sev: 'attn', when: function (a) { return ['reactive', 'never'].indexOf(a.maintenance) > -1; },
      title: 'No scheduled preventive maintenance',
      why: 'Patches, updates and health checks that only happen after something breaks mean small, cheap fixes are routinely left to become outages.',
      fix: 'A maintenance calendar — patching, updates and health checks on a fixed schedule, not a reaction.',
      verify: 'Patch levels, firmware versions and pending warnings on servers, PCs and the firewall.' },
    { q: 'costReview', cat: 'cost', sev: 'attn', when: function (a) { return ['renewal', 'never', 'dontknow'].indexOf(a.costReview) > -1; },
      title: 'IT spend is not reviewed against actual usage',
      unkTitle: 'Nobody is sure how often IT spend is reviewed',
      why: 'Your answers indicate that IT spend is not reviewed against actual usage on a regular basis — so subscriptions renew at full price whether they are still needed or not.',
      unkWhy: 'If nobody knows how often IT spend is reviewed, it is almost certainly renewing on autopilot.',
      fix: 'A quarterly line-by-line review of every subscription against who is actually using it.',
      verify: 'Every IT subscription, line by line, against who actually uses it.' }
  ];
  var SEV = { risk: { pts: 16, label: 'Risk', tag: 'RISK' }, attn: { pts: 9, label: 'Needs attention', tag: 'ATTENTION' } };
  // the most each area can score (the two email rules are mutually exclusive)
  var CATS = [
    { k: 'continuity', l: 'Continuity', max: 25 }, { k: 'email', l: 'Email & cloud', max: 16 }, { k: 'backup', l: 'Backup', max: 16 },
    { k: 'network', l: 'Network edge', max: 16 }, { k: 'access', l: 'Access control', max: 25 }, { k: 'managed', l: 'Managed IT', max: 18 },
    { k: 'cost', l: 'Licensing & cost', max: 36 }
  ];
  var CANNOT = [
    'Whether your backups actually restore — only a test restore proves it',
    'Firewall rules, open ports and firmware versions',
    'Patch levels on your servers and PCs',
    'Your domain’s email records (SPF, DKIM, DMARC) — this check does not look anything up',
    'How the network is actually segmented and cabled',
    'Anything that has changed since you answered — this is a dated snapshot'
  ];

  /* ---------- helpers ---------- */
  var ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var BACKICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H4M7.5 4.5L4 8l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TICK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.2l2.6 2.6L10 3.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qById(id) { for (var i = 0; i < QS.length; i++) if (QS[i].id === id) return QS[i]; return null; }
  function optLabel(q, v) { for (var i = 0; i < q.opts.length; i++) if (q.opts[i][0] === v) return q.opts[i][1]; return v; }
  function answerLabel(q) {
    var a = answers[q.id];
    if (Array.isArray(a)) return a.map(function (v) { return optLabel(q, v); }).join(', ');
    return a == null ? '' : optLabel(q, a);
  }
  function isUnsure(a) { return Array.isArray(a) ? a.indexOf('dontknow') > -1 : !!UNSURE[a]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- state ---------- */
  var answers = {}, qi = 0, view = 'intro', pointerAt = 0, advanceT = 0, advancedAt = 0;
  var RUN = 'r' + Date.now(); // marks the history entries made by this page load
  var intro = root.querySelector('[data-intro]');
  var stage = root.querySelector('[data-stage]');
  var bar = root.querySelector('[data-bar]');
  var railBars = bar.querySelectorAll('.chk-rail b');
  var railMods = bar.querySelectorAll('.chk-mods span');
  var countEl = bar.querySelector('[data-count]');
  var baseTitle = document.title;

  function setView(v) {
    clearTimeout(advanceT);
    pointerAt = 0;
    view = v;
    intro.hidden = v !== 'intro';
    stage.hidden = v !== 'q';
    bar.hidden = v !== 'q';
    root.hidden = v === 'result';
    result.hidden = v !== 'result';
    document.body.classList.toggle('in-check', v === 'q');
    window.scrollTo(0, 0);
  }

  /* ---------- questions ---------- */
  function paintBar(i) {
    MODULES.forEach(function (m, k) {
      var inMod = QS.filter(function (q) { return q.mod === m; });
      var done = inMod.filter(function (q) { return QS.indexOf(q) < i; }).length;
      railBars[k].style.setProperty('--p', (done / inMod.length).toFixed(3));
      railMods[k].classList.toggle('is-on', m === QS[i].mod);
    });
    countEl.textContent = (i + 1) + ' / ' + QS.length;
  }

  function hasSel(q, v) { return q.multi ? (Array.isArray(v) && v.length > 0) : v != null; }

  function renderQ(i) {
    var q = QS[i], a = answers[q.id], multi = !!q.multi;
    var sel = multi ? (Array.isArray(a) ? a : []) : a;
    var h = '<div class="q">' +
      '<p class="q-mod">' + esc(q.mod) + ' · Question ' + (i + 1) + ' of ' + QS.length + '</p>' +
      '<h1 id="q-title" tabindex="-1">' + esc(q.ask) + '</h1>' +
      '<p class="why">' + esc(q.why) + '</p>' +
      '<fieldset class="opts' + (q.cols === 2 ? ' c2' : '') + '" aria-labelledby="q-title"' + (multi ? ' aria-describedby="q-hint"' : '') + '>';
    q.opts.forEach(function (o, k) {
      var on = multi ? sel.indexOf(o[0]) > -1 : sel === o[0];
      h += '<label class="opt' + (multi ? ' multi' : '') + (on ? ' is-sel' : '') + '">' +
        '<input type="' + (multi ? 'checkbox' : 'radio') + '" name="opt" value="' + esc(o[0]) + '"' + (on ? ' checked' : '') + '>' +
        '<span class="mk" aria-hidden="true">' + TICK + '</span><span>' + esc(o[1]) + '</span>' +
        (k < 9 ? '<span class="key" aria-hidden="true">' + (k + 1) + '</span>' : '') + '</label>';
    });
    h += '</fieldset>';
    if (multi) h += '<p class="note mt-16" id="q-hint">Choose all that apply.</p>';
    h += '<div class="q-nav"><button class="q-back" type="button" data-back>' + BACKICON + (i === 0 ? 'Intro' : 'Back') + '</button>' +
      '<button class="btn btn-primary" type="button" data-next' + (hasSel(q, sel) ? '' : ' disabled') + '>' +
      (i === QS.length - 1 ? 'See my result' : 'Continue') + ARROW + '</button></div></div>';
    stage.innerHTML = h;
  }

  function current() {
    var q = QS[qi], ins = stage.querySelectorAll('input[name="opt"]:checked');
    if (q.multi) return [].map.call(ins, function (x) { return x.value; });
    return ins[0] ? ins[0].value : undefined;
  }
  function syncSel() {
    stage.querySelectorAll('.opt').forEach(function (l) { l.classList.toggle('is-sel', l.querySelector('input').checked); });
    var nb = stage.querySelector('[data-next]');
    if (nb) nb.disabled = !hasSel(QS[qi], current());
  }
  function scheduleAdvance() { clearTimeout(advanceT); advanceT = setTimeout(next, PT.reduce ? 60 : 320); }
  function next() {
    clearTimeout(advanceT);
    var v = current();
    if (!hasSel(QS[qi], v)) return;
    answers[QS[qi].id] = v;
    advancedAt = Date.now();
    if (qi >= QS.length - 1) showResult(true); else showQ(qi + 1, true);
  }

  // single-choice answers picked with a pointer move on by themselves; keyboard users confirm with Enter or Continue
  stage.addEventListener('pointerdown', function (e) { if (e.target.closest('.opt')) pointerAt = Date.now(); });
  stage.addEventListener('change', function (e) {
    var inp = e.target;
    if (!inp.matches || !inp.matches('input[name="opt"]')) return;
    var q = QS[qi];
    if (q.multi && inp.checked) {
      var exclusive = inp.value === 'none' || inp.value === 'dontknow';
      stage.querySelectorAll('input[name="opt"]').forEach(function (o) {
        if (o !== inp && (exclusive || o.value === 'none' || o.value === 'dontknow')) o.checked = false;
      });
    }
    syncSel();
    var viaPointer = Date.now() - pointerAt < 800;
    pointerAt = 0;
    if (!q.multi && viaPointer) scheduleAdvance();
  });
  stage.addEventListener('click', function (e) {
    if (e.target.closest('[data-next]')) {
      // a click that lands on the next question's button right after an advance is the same intent, not a second answer
      if (Date.now() - advancedAt < 380) return;
      next();
    } else if (e.target.closest('[data-back]')) history.back();
  });
  document.addEventListener('keydown', function (e) {
    if (view !== 'q' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.repeat) return;
    var t = e.target;
    if (/^[1-9]$/.test(e.key)) {
      var inp = stage.querySelectorAll('input[name="opt"]')[+e.key - 1];
      if (!inp) return;
      e.preventDefault();
      inp.checked = QS[qi].multi ? !inp.checked : true;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      if (!QS[qi].multi) scheduleAdvance();
    } else if (e.key === 'Enter' && t && t.matches && t.matches('input[name="opt"]')) {
      e.preventDefault();
      next();
    }
  });

  /* ---------- scoring ---------- */
  function compute() {
    var found = [];
    RULES.forEach(function (r) {
      var hit = false;
      try { hit = r.when(answers); } catch (err) { hit = false; }
      if (!hit) return;
      var a = answers[r.q], unsure = !Array.isArray(a) && !!UNSURE[a];
      var variant = !Array.isArray(a) && r.variants && r.variants[a];
      var title = variant ? variant.title : unsure && r.unkTitle ? r.unkTitle : r.title;
      var why = variant && variant.why ? variant.why : unsure && r.unkWhy ? r.unkWhy : r.why;
      found.push({ r: r, unsure: unsure, title: title, why: why });
    });
    found.sort(function (x, y) { return SEV[y.r.sev].pts - SEV[x.r.sev].pts; });
    var raw = found.reduce(function (n, f) { return n + SEV[f.r.sev].pts; }, 0);
    var cats = CATS.map(function (c) {
      var pts = found.filter(function (f) { return f.r.cat === c.k; }).reduce(function (n, f) { return n + SEV[f.r.sev].pts; }, 0);
      return { l: c.l, v: Math.round(Math.min(1, pts / c.max) * 100) };
    });
    var flagged = {};
    found.forEach(function (f) { flagged[f.r.q] = 1; });
    var open = QS.filter(function (q) { return !flagged[q.id] && isUnsure(answers[q.id]); });
    return { found: found, score: Math.min(96, raw), raw: raw, cats: cats, open: open };
  }
  function band(s) {
    if (s <= 20) return { l: 'Low exposure', c: 'var(--dk-ok)', h: s === 0 ? 'Nothing in your answers raised a flag.' : 'A tidy setup, with a few things worth closing.' };
    if (s <= 45) return { l: 'Moderate exposure', c: 'var(--dk-warn)', h: 'A working setup with real gaps in it.' };
    return { l: 'High exposure', c: 'var(--dk-risk)', h: 'Several things here would hurt on the same bad day.' };
  }
  function reference() {
    var s = JSON.stringify(QS.map(function (q) { return answers[q.id]; })), h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    var d = new Date(), hex = (h & 0xffff).toString(16).toUpperCase();
    while (hex.length < 4) hex = '0' + hex;
    return 'PT-' + pad(d.getDate()) + pad(d.getMonth() + 1) + '-' + hex;
  }
  var CONTEXT_QS = ['incidents', 'costItems', 'spendKnown'];
  function contextQs() { return CONTEXT_QS.map(qById).filter(function (q) { return answers[q.id] != null; }); }
  function summary(res, ref, date, limit, noContext) {
    var L = ['Hello PureTechs — I ran the IT check on your website and would like a free 15-minute review of the findings.', '',
      'Ref: ' + ref + ' · ' + date, 'Exposure Index: ' + res.score + '/100 — ' + band(res.score).l, ''];
    if (res.found.length) {
      L.push('Findings (from my own answers):');
      var list = limit ? res.found.slice(0, limit) : res.found;
      list.forEach(function (f, i) { L.push((i + 1) + '. [' + SEV[f.r.sev].tag + '] ' + f.title); });
      if (limit && res.found.length > limit) L.push('…and ' + (res.found.length - limit) + ' more');
    } else {
      L.push('No findings came from my answers.');
    }
    if (res.open.length) { L.push(''); L.push('Not sure about: ' + res.open.map(function (q) { return q.short; }).join(', ')); }
    var ctx = noContext ? [] : contextQs();
    if (ctx.length) {
      L.push(''); L.push('Context (not scored):');
      ctx.forEach(function (q) { L.push('- ' + q.short + ': ' + answerLabel(q)); });
    }
    return L.join('\n');
  }

  /* ---------- result ---------- */
  function renderResult() {
    var res = compute(), b = band(res.score), ref = reference();
    var date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    var n = res.found.length;
    var line = n
      ? 'We found ' + n + ' point' + (n > 1 ? 's' : '') + ' worth attention — risks first, then points that need attention. Everything below came from your own answers; an engineer confirms or closes each one on your actual network.'
      : 'That is unusual, and worth verifying on the real network rather than taking on trust.';
    var meters = res.cats.map(function (c) {
      var on = Math.round(c.v / 10), col = c.v === 0 ? 'transparent' : c.v < 50 ? 'var(--dk-warn)' : 'var(--dk-risk)', segs = '';
      for (var k = 0; k < 10; k++) segs += '<i' + (k < on ? ' class="on"' : '') + '></i>';
      return '<div class="meter"><span class="meter-l">' + esc(c.l) + '</span><span class="meter-bar" style="--m-col:' + col + '" aria-hidden="true">' + segs + '</span><span class="meter-v">' + c.v + '</span></div>';
    }).join('');

    var h = '';
    h += '<section class="res-hd dark" aria-labelledby="res-h"><div class="wrap">';
    h += '<p class="flow" aria-label="Where you are: findings"><span class="is-on">Check ✓</span><i></i><span class="is-on">Findings</span><i></i><span>Understand</span><i></i><span>Engineer review</span></p>';
    h += '<div class="res-grid"><div>';
    h += '<div class="res-meta"><span>Your result · <b>' + esc(date) + '</b></span><span>Ref <b>' + esc(ref) + '</b></span></div>';
    h += '<h1 class="res-h" id="res-h" tabindex="-1">' + esc(b.h) + '</h1>';
    h += '<p class="lead res-line">' + esc(line) + '</p>';
    h += '<div class="btn-row no-print"><button class="btn btn-primary" type="button" data-goto="review">Get a free engineer review' + ARROW + '</button>' +
      (n ? '<button class="btn btn-ghost" type="button" data-goto="findings">See the findings</button>' : '') + '</div>';
    h += '</div><div class="inst res-inst" role="group" aria-labelledby="res-inst-t">';
    h += '<div class="inst-top"><span id="res-inst-t"><b>Exposure index</b></span><span>Derived from your answers</span></div>';
    h += '<div class="gauge" aria-hidden="true"><svg viewBox="0 0 200 200"><g class="g-ticks"></g>' +
      '<circle class="g-track" cx="100" cy="100" r="86" pathLength="100" stroke-dasharray="75 100" transform="rotate(135 100 100)"/>' +
      '<circle class="g-val" cx="100" cy="100" r="86" pathLength="100" stroke-dasharray="0 100" transform="rotate(135 100 100)"/></svg>' +
      '<div class="g-read"><span class="g-num">0</span><span class="g-of">/ 100</span></div></div>';
    h += '<p class="g-band" style="--g-col:' + b.c + '"><span class="sr-only">Exposure index ' + res.score + ' out of 100: </span>' + esc(b.l) + '</p>';
    h += '<div class="meters">' + meters + '</div>';
    h += '<span class="ev-tag">Derived · each bar = points found in that area ÷ the most it can score</span>';
    h += '</div></div></div></section>';

    h += '<section class="res-body sec" id="findings" aria-labelledby="fd-h"><div class="wrap">';
    if (n) {
      h += '<div class="res-sec-h"><div><p class="eyebrow">What we found</p><h2 class="h-d2" id="fd-h">' + n + (n === 1 ? ' thing deserves' : ' things deserve') + ' attention.</h2></div>' +
        '<p class="note">Risks first, then points that need attention. Risk = 16 points, needs attention = 9.</p></div>';
      res.found.forEach(function (f, i) {
        var q = qById(f.r.q);
        h += '<article class="fd" data-rv>' +
          '<div class="fd-top"><span class="num">' + pad(i + 1) + '</span><h3>' + esc(f.title) + '</h3>' +
          '<div class="fd-tags"><span class="sev ' + f.r.sev + '">' + SEV[f.r.sev].label + '</span><span class="evl sr">' + (f.unsure ? 'Self-reported · not sure' : 'Self-reported') + '</span></div></div>' +
          '<div class="fd-body">' +
          '<div class="fd-ans"><h4>Your answer</h4><p>“' + esc(answerLabel(q)) + '”</p><p class="note mt-8">to: ' + esc(q.ask) + '</p></div>' +
          '<div><h4>Why it matters</h4><p>' + esc(f.why) + '</p></div>' +
          '<div><h4>The fix</h4><p>' + esc(f.r.fix) + '</p></div>' +
          '<div class="fd-ver"><h4>What an engineer checks on site</h4><p>' + esc(f.r.verify) + '</p></div>' +
          '</div></article>';
      });
    } else {
      h += '<div class="res-sec-h"><div><p class="eyebrow">What we found</p><h2 class="h-d2" id="fd-h">No findings from your answers.</h2></div></div>' +
        '<p class="lead measure">Nothing you told us raised a flag. That is unusual — and exactly the kind of result worth confirming on the real network.</p>';
    }
    if (res.open.length) {
      h += '<div class="cant open-q"><p class="evl">Cannot verify · you were not sure</p><h3 class="mt-16">Open questions from your answers</h3>' +
        '<p class="note mt-8">Not counted in the index. An engineer can answer these in minutes on site.</p><ul>' +
        res.open.map(function (q) { return '<li>' + esc(q.short) + ' — you answered “' + esc(answerLabel(q)) + '”</li>'; }).join('') + '</ul></div>';
    }
    h += '<div class="cant"><p class="evl">Cannot verify from a browser</p><h3 class="mt-16">What this check cannot see</h3>' +
      '<p class="note mt-8">This check reads nothing from your network, devices or domain. These are left open rather than guessed.</p><ul>' +
      CANNOT.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    var ctx = contextQs();
    if (ctx.length) {
      h += '<div class="ctx"><h3>Context you shared <span class="note">— not scored, included when you send this result</span></h3><dl>' +
        ctx.map(function (q) { return '<dt>' + esc(q.short) + '</dt><dd>' + esc(answerLabel(q)) + '</dd>'; }).join('') + '</dl></div>';
    }
    h += '<div class="next dark" id="review"><div>' +
      '<p class="eyebrow">Next step · engineer review</p><h2>Get a free 15-minute engineer review.</h2>' +
      '<p class="lead">Send this result to an engineer. They go through each point with you, confirm or close it on your actual network, and tell you what matters first. No sales call, no obligation.</p>' +
      '</div><div class="next-acts">' +
      '<a class="btn btn-primary" data-wa target="_blank" rel="noopener" href="#">Send result on WhatsApp' + ARROW + '</a>' +
      '<a class="btn btn-ghost" data-mail href="#">Email this result</a>' +
      '<div class="next-sub"><button type="button" data-copy>Copy summary</button><button type="button" data-print>Print or save as PDF</button><button type="button" data-again>Run it again</button></div>' +
      '</div></div>';
    h += '<p class="note res-foot"><b>What this is, and is not.</b> A snapshot built from the answers you gave, in your browser, on ' + esc(date) +
      '. It is not a penetration test and it is not an audit. An engineer reviewing your actual network will confirm, correct or close each point — which is exactly what the 15-minute review is for. Your answers are not kept: leaving this page clears them. ' +
      '<a href="/verify/" target="_blank" rel="noopener">How we verify</a> · <a href="/privacy/" target="_blank" rel="noopener">Data &amp; privacy</a> (open in a new tab)</p>';
    h += '</div></section>';

    result.innerHTML = h;

    // links carry the real summary, so they also work with middle-click / long-press
    var full = summary(res, ref, date);
    result.querySelector('[data-wa]').href = PT.wa ? PT.wa(full) : '#';
    var mailBody = full;
    if (encodeURIComponent(mailBody).length > 1700) mailBody = summary(res, ref, date, 5);
    if (encodeURIComponent(mailBody).length > 1700) mailBody = summary(res, ref, date, 5, true);
    result.querySelector('[data-mail]').href = PT.mailto ? PT.mailto('IT check result — ' + ref, mailBody) : '#';
    result.querySelector('[data-copy]').addEventListener('click', function () {
      (PT.copy ? PT.copy(full) : Promise.resolve(false)).then(function (ok) {
        if (PT.toast) PT.toast(ok ? 'Summary copied' : 'Could not copy — use “Email this result” instead');
      });
    });
    result.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
    result.querySelector('[data-again]').addEventListener('click', function () {
      answers = {};
      // reuse the existing #q1 entry instead of stacking a second run on top of the first
      var st = history.state;
      if (st && st.run === RUN && st.v === 'result') history.go(-QS.length); else showQ(0, true);
    });
    result.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = document.getElementById(btn.getAttribute('data-goto'));
        if (el) el.scrollIntoView({ behavior: PT.reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });

    // reveal findings as they scroll in
    var fds = result.querySelectorAll('[data-rv]');
    if ('IntersectionObserver' in window && !PT.reduce) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px' });
      fds.forEach(function (el) { io.observe(el); });
    } else {
      fds.forEach(function (el) { el.classList.add('in'); });
    }
    return res;
  }

  /* ---------- views + browser history ---------- */
  function showIntro(push) {
    setView('intro');
    document.title = baseTitle;
    if (push) history.pushState({ v: 'intro', run: RUN }, '', location.pathname);
  }
  function showQ(i, push) {
    qi = i;
    setView('q');
    paintBar(i);
    renderQ(i);
    document.title = 'Question ' + (i + 1) + ' of ' + QS.length + ' — PureTechs IT check';
    if (push) history.pushState({ v: 'q', i: i, run: RUN }, '', '#q' + (i + 1));
    var t = stage.querySelector('#q-title');
    if (t) t.focus({ preventScroll: true });
  }
  function showResult(push) {
    var res = renderResult();
    setView('result');
    document.title = 'Your IT check result — PureTechs';
    if (push) history.pushState({ v: 'result', i: QS.length, run: RUN }, '', '#result');
    var g = PT.gauge ? PT.gauge(result.querySelector('.gauge')) : null;
    if (g) setTimeout(function () { g.set(res.score, band(res.score).c); }, 120);
    var t = result.querySelector('#res-h');
    if (t) t.focus({ preventScroll: true });
  }
  function answeredUpTo() { var n = 0; while (n < QS.length && answers[QS[n].id] !== undefined) n++; return n; }
  function reset() { history.replaceState({ v: 'intro', run: RUN }, '', location.pathname); showIntro(false); }
  function route(e) {
    clearTimeout(advanceT);
    var hash = location.hash, m = hash.match(/^#q(\d+)$/);
    if (!m && hash !== '#result') {
      if (!hash || hash === '#') showIntro(false);
      return; // any other fragment leaves the current view alone
    }
    var i = m ? +m[1] - 1 : QS.length; // #result sits one step after the last question
    var st = e && e.state, done = answeredUpTo();
    if (!st || typeof st.i !== 'number') return reset(); // typed or pasted by hand
    if (st.run !== RUN) {
      // left over from an earlier page load: those answers are gone, so step over the whole block in one jump
      return history.go(-(st.i + 1));
    }
    if (i > done) return history.go(done - i); // ahead of what is answered: land on the first open question
    if (m) showQ(i, false); else showResult(false);
  }
  window.addEventListener('popstate', route);
  root.querySelectorAll('[data-start]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); answers = {}; showQ(0, true); });
  });
  // a fresh page load has no answers in memory, so any deep link starts at the intro
  if (/^#(q\d+|result)$/.test(location.hash)) reset(); else showIntro(false);
})();
