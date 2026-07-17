/* ═══════════════════════════════════════════════════════════
   THE OLDCARTS EXAM — an educational diagnosis in 90 seconds.
   Eight questions score five hidden dimensions; the top one
   becomes the visitor's (playful) condition, mapped to a real
   treatment protocol. Answers never leave the browser.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c) => (c || document).querySelector(s);

  /* ── scoring dimensions ── */
  // bottleneck · process · measurement · toolsprawl · focus
  const QUESTIONS = [
    {
      letter: 'O', term: 'ONSET', ref: 'REF 01 / 08',
      q: 'When did the pain start?',
      opts: [
        ['When we grew past what one brain can hold', { bottleneck: 2 }],
        ['When we added people but never added process', { process: 2 }],
        ['Honestly? It has been there since day one', { process: 1, focus: 1 }],
        ['Right after we bought more software to fix it', { toolsprawl: 2 }],
      ],
    },
    {
      letter: 'L', term: 'LOCATION', ref: 'REF 02 / 08',
      q: 'Where does it hurt the most?',
      opts: [
        ['Everything routes through me (or one person)', { bottleneck: 2 }],
        ['The handoffs — things fall between people', { process: 2 }],
        ['The numbers — we can’t see how we’re doing', { measurement: 2 }],
        ['The tools — five apps, none of them talking', { toolsprawl: 2 }],
      ],
    },
    {
      letter: 'D', term: 'DURATION', ref: 'REF 03 / 08',
      q: 'How long has this been going on?',
      opts: [
        ['A few weeks — it’s new', { chronic: 0 }],
        ['A quarter or two', { chronic: 1 }],
        ['More than a year', { chronic: 2 }],
        ['It has literally always been like this', { chronic: 3 }],
      ],
    },
    {
      letter: 'C', term: 'CHARACTER', ref: 'REF 04 / 08',
      q: 'What does it feel like, day to day?',
      opts: [
        ['Dropped balls, do-overs, and “I thought YOU had it”', { process: 2 }],
        ['Decisions queueing at one desk', { bottleneck: 2 }],
        ['Flying blind between bank-balance checks', { measurement: 2 }],
        ['Copy-pasting the same data into five places', { toolsprawl: 2 }],
      ],
    },
    {
      letter: 'A', term: 'AGGRAVATING', ref: 'REF 05 / 08',
      q: 'What makes it worse?',
      opts: [
        ['Busy season — volume breaks everything', { process: 1, focus: 1 }],
        ['Me taking a single day off', { bottleneck: 2 }],
        ['Month-end, reporting, or tax time', { measurement: 2 }],
        ['Every new hire’s first month', { process: 2 }],
      ],
    },
    {
      letter: 'R', term: 'RELIEVING', ref: 'REF 06 / 08',
      q: 'What makes it better — even briefly?',
      opts: [
        ['Heroics. Somebody stays late and saves it', { bottleneck: 1, process: 1 }],
        ['The one checklist we actually wrote down', { process: 2 }],
        ['That one spreadsheet Dana keeps updated', { measurement: 2 }],
        ['Nothing reliably, if we’re being honest', { focus: 2 }],
      ],
    },
    {
      letter: 'T', term: 'TIMING', ref: 'REF 07 / 08',
      q: 'When does it flare up?',
      opts: [
        ['Month-end and quarter-end, like clockwork', { measurement: 2 }],
        ['Whenever I’m out, double-booked, or asleep', { bottleneck: 2 }],
        ['During growth pushes and new launches', { focus: 2 }],
        ['Randomly — there’s no pattern we can see', { measurement: 1, process: 1 }],
      ],
    },
  ];

  const CONDITIONS = {
    bottleneck: {
      name: 'Chronic Owner-Bottleneck Syndrome',
      presentation:
        'Every decision, approval, and password routes through one person — and the single point of failure is the patient reading this report. Capacity is capped at one brain’s bandwidth. Vacations are theoretical. The business doesn’t scale because it can’t: it’s wearing you as its operating system.',
      rx: 'Process Documentation & Mapping',
      rxDetail:
        'Extract the workflows from the owner’s head, document them where the team already works, and assign ownership at every step — so the business runs on systems, not heroics. Typical course: 4–8 weeks, with a 30-day follow-up to confirm the transplant took.',
    },
    process: {
      name: 'Acute Process Amnesia',
      presentation:
        'The business runs on institutional memory and goodwill. Every task is reinvented by whoever catches it, quality depends on who’s on shift, and onboarding is an oral tradition. Nothing is written down because everyone is too busy doing the things nobody wrote down.',
      rx: 'Process Documentation & Mapping',
      rxDetail:
        'Surface the critical workflows, map them step-by-step with clear ownership, and train the team on a platform they’ll actually use. Typical course: 4–8 weeks — the do-overs stop paying rent almost immediately.',
    },
    measurement: {
      name: 'Vital-Sign Blindness',
      presentation:
        'Decisions are being made on vibes and bank-balance checks. The data exists — it’s just scattered across systems, stale by the time it’s found, or living in one heroic spreadsheet. You can’t manage what you can’t measure, and right now the patient has no pulse chart.',
      rx: 'Business Scorecard Design & Setup',
      rxDetail:
        'Identify the 5–15 numbers that actually predict your health, build a scorecard your team reads weekly, and install the review rhythm that keeps it alive. The fog lifts in the first month.',
    },
    toolsprawl: {
      name: 'Acute Tool Sprawl',
      presentation:
        'Software was purchased to solve problems; the software is now the problem. Data is copy-pasted between systems that don’t talk, subscriptions multiply quietly, and nobody is entirely sure which number is the true one. The stack has become a symptom.',
      rx: 'Tools & Systems Implementation',
      rxDetail:
        'Audit what you have, keep what earns its seat, integrate the survivors, and train the team so adoption actually happens. Right-sized for real budgets — no enterprise theater.',
    },
    focus: {
      name: 'Strategic Drift Disorder',
      presentation:
        'Everything is a priority, so nothing is. The vision is real but unconverted — no 90-day priorities, no named owners, no rhythm that keeps score. The team is busy; the business is stationary. Motion is being mistaken for progress.',
      rx: 'Strategic Planning & Priorities',
      rxDetail:
        'Translate the vision into 3–7 focused goals per quarter, each with a name attached and a meeting rhythm that keeps them alive. Quarterly resets keep the drift from returning.',
    },
  };

  const CHRONICITY = ['acute', 'subacute', 'chronic', 'congenital'];

  /* ── state ── */
  const scores = { bottleneck: 0, process: 0, measurement: 0, toolsprawl: 0, focus: 0 };
  let chronic = 0;
  let severity = 5;
  let step = -1; // -1 intro, 0..6 questions, 7 severity, 8 report
  const picks = [];

  /* ── heartbeat / ECG (severity-reactive) ── */
  let bpm = 58;
  let targetBpm = 58;
  const bpmEl = $('#ex-bpm');
  const ecg = $('#ex-ecg');
  const ectx = ecg ? ecg.getContext('2d') : null;
  let phase = 0, last = performance.now();
  const pts = ecg ? new Array(ecg.width).fill(13) : [];
  let px = 0;
  function gauss(x, mu, sig) { const d = x - mu; return Math.exp(-(d * d) / (2 * sig * sig)); }
  function ecgSample(ph) {
    let y = 0;
    y += gauss(ph, 0.05, 0.008) * 3;
    y += gauss(ph, 0.07, 0.012) * -11;
    y += gauss(ph, 0.09, 0.01) * 4;
    y += gauss(ph, 0.26, 0.04) * -3.5;
    return y;
  }
  function tick(now) {
    const dt = (now - last) / 1000; last = now;
    bpm += (targetBpm - bpm) * 0.04;
    if (bpmEl) bpmEl.textContent = Math.round(bpm);
    if (ectx) {
      phase = (phase + dt * (bpm / 60)) % 1;
      px = (px + 2) % ecg.width;
      pts[px] = 13 + ecgSample(phase) * (0.7 + (bpm - 58) / 60);
      pts[(px + 1) % ecg.width] = null;
      ectx.clearRect(0, 0, ecg.width, ecg.height);
      ectx.strokeStyle = '#FF5C42'; ectx.lineWidth = 1.3;
      ectx.beginPath();
      let started = false;
      for (let i = 0; i < ecg.width; i++) {
        const v = pts[i];
        if (v == null) { started = false; continue; }
        if (!started) { ectx.moveTo(i, v); started = true; } else ectx.lineTo(i, v);
      }
      ectx.stroke();
    }
    if (!reducedMotion) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ── views ── */
  const view = $('#ex-view');
  const progress = $('#ex-progress');

  function setProgress() {
    [...progress.children].forEach((el, i) => {
      el.classList.toggle('is-done', i < Math.min(step, 8));
      el.classList.toggle('is-current', i === step && step < 8);
    });
  }

  function swap(html, focusSel) {
    const render = () => {
      view.innerHTML = html;
      bindView();
      setProgress();
      const f = focusSel && $(focusSel, view);
      if (f) f.focus({ preventScroll: true });
      if (!reducedMotion && window.gsap) {
        gsap.fromTo(view, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' });
      }
    };
    if (!reducedMotion && window.gsap && view.innerHTML.trim()) {
      gsap.to(view, { opacity: 0, y: -18, duration: 0.28, ease: 'power2.in', onComplete: render });
    } else render();
  }

  function introHTML() {
    return `
      <span class="ex-kicker">✚ SELF-EXAMINATION — EDUCATIONAL · PAINLESS · 90 SECONDS</span>
      <h1 class="ex-title">The OLDCARTS <em>Exam.</em></h1>
      <p class="ex-lede">Physicians use eight questions to characterize a symptom before treating it.
      We use the same eight on businesses. Answer honestly — <em>the instrument can tell when you flinch</em> —
      and leave with a findings report, a diagnosis you may have been avoiding, and its treatment.</p>
      <p class="ex-fine"><i>◉</i> YOUR ANSWERS NEVER LEAVE THIS PAGE — NOTHING IS STORED OR SENT</p>
      <button class="btn btn--solid btn--lg" data-begin>Begin the examination</button>`;
  }

  function questionHTML(i) {
    const Q = QUESTIONS[i];
    return `
      <div class="ex-q">
        <div class="ex-q__letterrow">
          <span class="ex-q__letter">${Q.letter}</span>
          <span class="ex-q__term">${Q.term}</span>
          <span class="ex-q__ref">${Q.ref}</span>
        </div>
        <h2 class="ex-q__question">${Q.q}</h2>
        <div class="ex-opts" role="group" aria-label="Answers">
          ${Q.opts.map((o, k) => `<button class="ex-opt" data-key="${'ABCD'[k]}" data-opt="${k}">${o[0]}</button>`).join('')}
        </div>
      </div>`;
  }

  function severityHTML() {
    return `
      <div class="ex-q">
        <div class="ex-q__letterrow">
          <span class="ex-q__letter">S</span>
          <span class="ex-q__term">SEVERITY</span>
          <span class="ex-q__ref">REF 08 / 08</span>
        </div>
        <h2 class="ex-q__question">How bad is it — one to ten?</h2>
        <div class="ex-sev">
          <div class="ex-sev__readout"><span id="ex-sevnum">5</span><small>/ 10 — COST IN HOURS, DOLLARS &amp; SLEEP</small></div>
          <input class="ex-sev__slider" id="ex-sev" type="range" min="1" max="10" step="1" value="5"
                 aria-label="Severity from one to ten" />
          <div class="ex-sev__scale"><span>1 — A DULL ACHE</span><span>10 — CALL SOMEONE. TODAY.</span></div>
        </div>
        <button class="btn btn--solid btn--lg" data-finish>File the findings</button>
      </div>`;
  }

  function diagnose() {
    const order = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    const primary = CONDITIONS[order[0]];
    const secondary = scores[order[1]] > 0 ? CONDITIONS[order[1]] : null;
    const sevTotal = severity;
    const sevWord = sevTotal <= 3 ? 'MILD' : sevTotal <= 6 ? 'MODERATE' : sevTotal <= 8 ? 'ADVANCED' : 'SEVERE';
    const chronWord = CHRONICITY[chronic].toUpperCase();
    return { primary, secondary, sevWord, chronWord, sevTotal };
  }

  function reportHTML() {
    const d = diagnose();
    const caseNo = String(1000 + Math.floor(Math.random() * 9000));
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return `
      <div class="ex-report" id="ex-report">
        <div class="ex-report__head">
          <span>OLDCARTS CONSULTING — FINDINGS REPORT</span>
          <span>CASE №${caseNo} · ${date.toUpperCase()}</span>
        </div>
        <span class="ex-report__dx-label">PRIMARY DIAGNOSIS</span>
        <h2 class="ex-report__dx">${d.primary.name}</h2>
        <span class="ex-report__sev">${d.chronWord} PRESENTATION — SEVERITY <i>${d.sevTotal}/10 (${d.sevWord})</i></span>
        <h3>PRESENTATION</h3>
        <p>${d.primary.presentation}</p>
        ${d.secondary ? `<h3>DIFFERENTIAL — ALSO OBSERVED</h3><p>Early signs of <strong>${d.secondary.name}</strong>. Worth monitoring; often resolves once the primary condition is treated.</p>` : ''}
        <h3>RECOMMENDED COURSE OF CARE</h3>
        <p class="ex-report__rx"><strong>${d.primary.rx}.</strong> ${d.primary.rxDetail}</p>
        <div class="ex-report__foot">
          THIS EXAMINATION IS EDUCATIONAL, NOT A SUBSTITUTE FOR PROFESSIONAL CONSULTATION.<br/>
          FORTUNATELY, WE KNOW A PRACTITIONER — LAURA SMITH, PMP · WATKINSVILLE, GA
        </div>
      </div>
      <div class="ex-actions">
        <a class="btn btn--solid" href="mailto:laura.smith@oldcarts.com?subject=Consultation%20request%20—%20the%20exam%20found%20something" data-consult>Begin the real consultation</a>
        <button class="btn btn--ghost" data-copy>Copy my findings</button>
        <button class="btn btn--ghost" data-retake>Retake the exam</button>
        <span class="ex-copied" id="ex-copied">COPIED ✚</span>
      </div>`;
  }

  /* ── flow ── */
  function next() {
    step += 1;
    if (step < 7) {
      swap(questionHTML(step), '.ex-opt');
    } else if (step === 7) {
      swap(severityHTML(), '#ex-sev');
    } else {
      swap(reportHTML());
      targetBpm = 58; // report filed: the patient relaxes
      if (typeof gtag === 'function') gtag('event', 'exam_complete');
    }
  }

  function bindView() {
    const begin = $('[data-begin]', view);
    if (begin) begin.addEventListener('click', () => { step = -1; next(); });

    [...view.querySelectorAll('.ex-opt')].forEach((btn) => {
      btn.addEventListener('click', () => {
        const Q = QUESTIONS[step];
        const opt = Q.opts[+btn.dataset.opt];
        btn.classList.add('is-picked');
        picks[step] = btn.textContent;
        Object.entries(opt[1]).forEach(([k, v]) => {
          if (k === 'chronic') chronic = Math.max(chronic, v);
          else scores[k] += v;
        });
        targetBpm = Math.min(96, targetBpm + 3); // each finding raises the pulse a touch
        setTimeout(next, reducedMotion ? 60 : 380);
      });
    });

    const sev = $('#ex-sev', view);
    if (sev) {
      const num = $('#ex-sevnum', view);
      sev.addEventListener('input', () => {
        severity = +sev.value;
        num.textContent = severity;
        targetBpm = 58 + severity * 4.6; // the monitor reacts as you admit it
      });
    }
    const finish = $('[data-finish]', view);
    if (finish) finish.addEventListener('click', next);

    const retake = $('[data-retake]', view);
    if (retake) retake.addEventListener('click', () => {
      Object.keys(scores).forEach((k) => (scores[k] = 0));
      chronic = 0; severity = 5; step = -1; picks.length = 0; targetBpm = 58;
      swap(introHTML(), '[data-begin]');
    });

    const copy = $('[data-copy]', view);
    if (copy) copy.addEventListener('click', () => {
      const d = diagnose();
      const txt = `MY OLDCARTS EXAM FINDINGS — oldcarts.com/exam
Primary diagnosis: ${d.primary.name}
${d.chronWord.toLowerCase()} presentation — severity ${d.sevTotal}/10 (${d.sevWord.toLowerCase()})
Recommended course of care: ${d.primary.rx}
Run your own exam: https://oldcarts.com/exam/`;
      navigator.clipboard.writeText(txt).then(() => {
        const c = $('#ex-copied');
        c.classList.add('is-on');
        setTimeout(() => c.classList.remove('is-on'), 2200);
      });
    });
  }

  /* keyboard shortcuts: A–D pick options */
  addEventListener('keydown', (e) => {
    if (step < 0 || step >= 7) return;
    const k = 'abcd'.indexOf(e.key.toLowerCase());
    if (k > -1) {
      const btn = view.querySelector(`.ex-opt[data-opt="${k}"]`);
      if (btn) btn.click();
    }
  });

  /* boot */
  function boot() { swap(introHTML()); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
