/* Q-FINEX Quantum Readiness Index preview: shared content and scoring.
   Used by the website/embed version (index.html) and the iPad version (ipad.html).
   Model: Mosca's inequality. Data is at risk if  X + Y > Z, where
   X = years data must stay secret, Y = years to migrate, Z = years until Q-Day. */
window.QF = (function () {
  'use strict';
  var NOW = Math.max(2026, new Date().getFullYear());

  var Q = [
    {
      key: 'x', icon: 'i-data', short: 'Your data',
      title: 'How long must your most sensitive data stay secret?',
      help: 'Think of the records that would do the most harm if someone else read them.',
      why: 'Encrypted data can be copied today and stored until a quantum computer can read it. This is known as ‘harvest now, decrypt later’.',
      opts: [
        { v: 2, b: 'Up to 2 years', k: '2 yrs', s: 'Payments and session data' },
        { v: 5, b: 'About 5 years', k: '5 yrs', s: 'Customer and transaction records' },
        { v: 10, b: 'About 10 years', k: '10 yrs', s: 'Loans, mortgages and contracts' },
        { v: 15, b: '15 years or more', k: '15+ yrs', s: 'Identity, pensions and long-dated assets' }
      ]
    },
    {
      key: 'y', icon: 'i-move', short: 'Your upgrade',
      title: 'How long would it take to move your critical systems to quantum-safe encryption?',
      help: 'Include core systems, payment links, keys and certificates, and your critical suppliers.',
      why: 'Encryption sits deep inside systems and supply chains, so replacing it is a programme, not a patch.',
      opts: [
        { v: 2, b: 'Under 3 years', k: '< 3 yrs', s: 'We have a plan and funding' },
        { v: 4, b: '3 to 5 years', k: '3–5 yrs', s: 'We know broadly where our encryption is' },
        { v: 7, b: '5 to 10 years', k: '5–10 yrs', s: 'Large estate, many dependencies' },
        { v: 8, b: 'Not sure yet', k: '?', s: 'We haven’t mapped our encryption', unknown: true }
      ]
    },
    {
      key: 'z', icon: 'i-flag', short: 'Your call',
      title: 'When do you think a quantum computer will break today’s encryption?',
      help: 'Nobody knows for certain, so make your best call. This moment is often called Q‑Day.',
      why: 'Standards bodies are not waiting: NIST will deprecate quantum-vulnerable public-key algorithms after 2030 and disallow them after 2035.',
      opts: [
        { v: 2030, b: 'By 2030', k: '2030', s: 'Sooner than most expect' },
        { v: 2033, b: 'Around 2033', k: '2033', s: 'Within a typical planning cycle' },
        { v: 2036, b: 'Around 2036', k: '2036', s: 'About ten years out' },
        { v: 2040, b: '2040 or later', k: '2040+', s: 'Still some way off' }
      ]
    }
  ];

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* a = { x: opt, y: opt, z: opt } */
  function compute(a) {
    var X = a.x.v, Y = a.y.v, Z = a.z.v;
    var fin = NOW + Y;            // upgrade complete
    var safe = fin + X;           // records encrypted just before then stay sensitive until here
    var gap = safe - Z;           // > 0: years in which harvested data could be read while it still matters
    var tier = gap > 0 ? 'act' : (gap >= -2 ? 'tight' : 'ahead');
    var n = Math.abs(gap);
    var r = { X: X, Y: Y, Z: Z, NOW: NOW, fin: fin, safe: safe, gap: gap, n: n, tier: tier,
              unknown: !!a.y.unknown, lateUpgrade: fin > Z };

    if (tier === 'act') {
      r.tag = 'First step taken';
      r.head = 'You’ve found the gap. Now let’s close it.';
      r.unit = n === 1 ? 'year at risk' : 'years at risk';
      r.body = 'On your answers, there is a window of ' + plural(n, 'year', 'years') +
        ' when data copied today could be read while it still matters. Seeing the gap clearly is where every strong programme starts.';
      r.steps = [
        'Map where public-key encryption protects your long-lived data',
        'Put the systems that hold that data first in line',
        'Set an upgrade target ahead of NIST’s 2030 and 2035 dates'
      ];
    } else if (tier === 'tight') {
      r.tag = 'Good instincts';
      r.head = n === 0 ? 'You’re on track, just in time.' : 'You’re on track, with little room to spare.';
      r.unit = n === 1 ? 'year to spare' : 'years to spare';
      r.body = (n === 0 ? 'On your answers, you finish exactly as Q‑Day arrives.' :
        'On your answers, you finish with ' + plural(n, 'year', 'years') + ' to spare.') +
        ' A slip in your upgrade, or an earlier Q‑Day, would close that margin.';
      r.steps = [
        'Confirm exactly where your encryption sits',
        'Start with the data that must stay secret longest',
        'Build buffer into your upgrade plan'
      ];
    } else {
      r.tag = 'Great start';
      r.head = 'You’re ahead of the curve.';
      r.unit = 'years to spare';
      r.body = 'On your answers, your most sensitive records are protected ' + plural(n, 'year', 'years') +
        ' before your Q‑Day. The full Index tests whether your suppliers, people and quantum opportunities are just as ready.';
      r.steps = [
        'Check your encryption inventory is complete',
        'Hold critical suppliers to quantum-safe roadmaps',
        'Explore where quantum computing could give you an edge'
      ];
    }

    if (r.lateUpgrade) {
      r.body += ' Your upgrade would finish after your Q‑Day, so anything encrypted in between is exposed from day one.';
    }
    if (r.unknown) {
      r.body += ' You weren’t sure how long the upgrade would take, so we assumed eight years. Mapping your encryption is the quickest way to firm that up.';
    }

    if (fin > 2035) r.nist = 'Your upgrade would finish around ' + fin + ', after NIST’s 2035 cut-off for quantum-vulnerable algorithms.';
    else if (fin > 2030) r.nist = 'Your upgrade would finish around ' + fin + ', between NIST’s 2030 deprecation and 2035 cut-off.';
    else r.nist = 'Your upgrade would finish around ' + fin + ', ahead of NIST’s 2030 deprecation date.';

    r.chips = [
      { icon: 'i-move', year: fin, label: 'Upgrade complete' },
      { icon: 'i-data', year: safe, label: 'Your last unprotected data stays sensitive until' },
      { icon: 'i-flag', year: Z, label: 'Your Q‑Day' }
    ];
    return r;
  }

  return { NOW: NOW, Q: Q, compute: compute };
})();
