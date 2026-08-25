(() => {
  const STORAGE = "bellwork.v1";
  const EX = window.BELLWORK_EXERCISES;

  const FORMATS = [
    { id: "sets", label: "Sets & reps" },
    { id: "circuit", label: "Circuit" },
    { id: "emom", label: "EMOM" },
    { id: "amrap", label: "AMRAP" }
  ];

  const state = {
    view: "build",
    routine: blankRoutine(),
    saved: loadSaved(),
    genOpen: false,
    player: null,
    tick: null,
    dragFrom: null
  };

  function blankRoutine() {
    return {
      id: uid(),
      name: "Untitled session",
      format: "sets",
      notes: "",
      rounds: 3,
      workSeconds: 40,
      restSeconds: 20,
      emomMinutes: 12,
      amrapMinutes: 15,
      items: []
    };
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function seedRoutines() {
    const item = (exerciseId, sets, reps, rest) => ({ id: uid(), exerciseId, sets, reps, rest });
    return [
      {
        id: "seed-swing-tgu",
        name: "Hinge & Get-Up",
        format: "sets",
        notes: "Classic pairing. Leave a few reps in the tank on swings.",
        rounds: 3, workSeconds: 40, restSeconds: 20, emomMinutes: 12, amrapMinutes: 15,
        items: [
          item("kb-halo", 2, 6, 15),
          item("bw-world-greatest", 2, 5, 15),
          item("kb-2h-swing", 5, 15, 45),
          item("kb-tgu", 3, 3, 60),
          item("bw-plank", 3, 30, 30)
        ]
      },
      {
        id: "seed-floor-engine",
        name: "Floor Engine",
        format: "circuit",
        notes: "No bell required. Four rounds if you have the time.",
        rounds: 4, workSeconds: 40, restSeconds: 20, emomMinutes: 12, amrapMinutes: 15,
        items: [
          item("bw-inchworm", 1, 6, 15),
          item("bw-pushup", 1, 10, 15),
          item("bw-reverse-lunge", 1, 12, 15),
          item("bw-hollow", 1, 25, 15),
          item("bw-burpee", 1, 6, 30)
        ]
      },
      {
        id: "seed-one-bell",
        name: "One Bell Full Body",
        format: "sets",
        notes: "Clean to start each pressing and squatting set if you want a complex.",
        rounds: 3, workSeconds: 40, restSeconds: 20, emomMinutes: 12, amrapMinutes: 15,
        items: [
          item("kb-goblet-squat", 4, 8, 60),
          item("kb-press", 4, 6, 75),
          item("kb-row", 3, 10, 45),
          item("kb-1h-swing", 4, 10, 40),
          item("kb-suitcase-carry", 3, 30, 40)
        ]
      }
    ];
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return seedRoutines();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : seedRoutines();
    } catch {
      return seedRoutines();
    }
  }

  function persist() {
    localStorage.setItem(STORAGE, JSON.stringify(state.saved));
  }

  function byId(id) {
    return EX.find((e) => e.id === id);
  }

  function art(id) {
    if (!id) return "";
    return `<img class="ex-svg" alt="" src="art/${id}.gif">`;
  }

  function estimateMinutes(r) {
    if (!r.items.length) return 0;
    const workOf = (it) => {
      const ex = byId(it.exerciseId);
      if (!ex) return 0;
      if (ex.timed) return Number(it.reps) || 0;
      return (Number(it.reps) || 0) * 3;
    };
    if (r.format === "emom") return Number(r.emomMinutes) || r.items.length;
    if (r.format === "amrap") return Number(r.amrapMinutes) || 15;
    if (r.format === "circuit") {
      const round = r.items.reduce((s, it) => s + workOf(it) + (Number(it.rest) || 0), 0);
      return Math.max(1, Math.round(((round * (Number(r.rounds) || 1)) + 90) / 60));
    }
    const total = r.items.reduce((s, it) => {
      const sets = Number(it.sets) || 1;
      return s + sets * (workOf(it) + (Number(it.rest) || 0));
    }, 90);
    return Math.max(1, Math.round(total / 60));
  }

  function schemeLabel(r, it) {
    const ex = byId(it.exerciseId);
    const unit = ex && ex.timed ? "s" : "reps";
    if (r.format === "circuit") return `${it.reps} ${unit}`;
    if (r.format === "emom") return `${it.reps} ${unit} / min`;
    if (r.format === "amrap") return `${it.reps} ${unit}`;
    return `${it.sets} × ${it.reps}${ex && ex.timed ? "s" : ""}`;
  }

  function generate(opts) {
    const levelRank = { beginner: 1, intermediate: 2, advanced: 3 };
    const cap = levelRank[opts.level];
    let pool = EX.filter((e) => levelRank[e.level] <= cap);

    if (opts.equipment === "kb") pool = pool.filter((e) => e.equipment.includes("kettlebell") && e.bells <= (opts.bells || 1));
    if (opts.equipment === "bw") pool = pool.filter((e) => e.equipment.includes("bodyweight"));
    if (opts.equipment === "mixed") {
      pool = pool.filter((e) => {
        if (e.equipment.includes("bodyweight")) return true;
        return e.equipment.includes("kettlebell") && e.bells <= (opts.bells || 1);
      });
    }

    const pick = (pred, fallbackPred) => {
      const a = pool.filter(pred);
      const src = a.length ? a : pool.filter(fallbackPred || pred);
      if (!src.length) return null;
      return src[Math.floor(Math.random() * src.length)];
    };

    const used = new Set();
    const take = (pred) => {
      const e = pick((x) => pred(x) && !used.has(x.id), pred);
      if (!e) return null;
      used.add(e.id);
      return e;
    };

    const warmup = [
      take((e) => e.id === "bw-cat-cow" || e.id === "bw-world-greatest" || e.id === "bw-hip-opener" || e.id === "kb-halo" || e.id === "bw-inchworm"),
      take((e) => e.patterns.includes("mobility") || e.id === "kb-around-the-world")
    ].filter(Boolean);

    let main = [];
    if (opts.goal === "strength") {
      main = [
        take((e) => e.patterns.includes("hinge") && !e.patterns.includes("mobility")),
        take((e) => e.patterns.includes("squat") || e.patterns.includes("lunge")),
        take((e) => e.patterns.includes("push")),
        take((e) => e.patterns.includes("pull") || e.patterns.includes("carry")),
        take((e) => e.patterns.includes("core"))
      ].filter(Boolean);
    } else if (opts.goal === "conditioning") {
      main = [
        take((e) => e.id.includes("swing") || e.patterns.includes("conditioning") || e.id.includes("snatch")),
        take((e) => e.patterns.includes("squat") || e.patterns.includes("lunge") || e.id.includes("thruster")),
        take((e) => e.patterns.includes("push") || e.patterns.includes("conditioning")),
        take((e) => e.patterns.includes("core") || e.patterns.includes("carry")),
        take((e) => e.patterns.includes("conditioning") || e.patterns.includes("locomotion"))
      ].filter(Boolean);
    } else if (opts.goal === "mobility") {
      main = EX.filter((e) => e.patterns.includes("mobility") || e.id === "kb-tgu" || e.id === "kb-windmill" || e.id === "bw-cossack")
        .filter((e) => levelRank[e.level] <= cap)
        .slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
      main.forEach((e) => used.add(e.id));
    } else {
      main = [
        take((e) => e.patterns.includes("hinge")),
        take((e) => e.patterns.includes("squat") || e.patterns.includes("lunge")),
        take((e) => e.patterns.includes("push")),
        take((e) => e.patterns.includes("pull") || e.patterns.includes("carry")),
        take((e) => e.patterns.includes("core")),
        take((e) => e.patterns.includes("conditioning") || e.id.includes("swing"))
      ].filter(Boolean);
    }

    if (Number(opts.minutes) <= 20) main = main.slice(0, 4);
    if (Number(opts.minutes) >= 45 && main.length < 6) {
      const extra = take((e) => e.patterns.includes("carry") || e.patterns.includes("skill") || e.patterns.includes("core"));
      if (extra) main.push(extra);
    }

    const format = opts.goal === "conditioning" ? (Number(opts.minutes) <= 20 ? "amrap" : "circuit")
      : opts.goal === "mobility" ? "sets"
      : Number(opts.minutes) <= 20 ? "circuit" : "sets";

    const toItem = (e, role) => ({
      id: uid(),
      exerciseId: e.id,
      sets: role === "warmup" ? 2 : format === "sets" ? e.defaultSets : 1,
      reps: role === "warmup" ? Math.min(e.defaultReps, 8) : e.defaultReps,
      rest: role === "warmup" ? 15 : format === "circuit" ? 15 : e.rest
    });

    const nameBits = { strength: "Strength", conditioning: "Conditioning", mixed: "Mixed", mobility: "Mobility" };
    const eqBits = { kb: "Kettlebell", bw: "Bodyweight", mixed: "Bell + Body" };

    return {
      id: uid(),
      name: `${opts.minutes}m ${eqBits[opts.equipment]} ${nameBits[opts.goal]}`,
      format,
      notes: `Generated for ${opts.level} · ${opts.bells || 1} bell${opts.bells === 2 ? "s" : ""} available.`,
      rounds: Number(opts.minutes) >= 30 ? 4 : 3,
      workSeconds: 40,
      restSeconds: 20,
      emomMinutes: Math.min(16, Number(opts.minutes)),
      amrapMinutes: Math.min(20, Number(opts.minutes) - 4),
      items: [...warmup.map((e) => toItem(e, "warmup")), ...main.map((e) => toItem(e, "main"))]
    };
  }

  function buildQueue(r) {
    const queue = [];
    queue.push({ phase: "prep", title: "Get ready", seconds: 10, detail: r.name, exerciseId: r.items[0] && r.items[0].exerciseId });

    if (r.format === "amrap") {
      queue.push({
        phase: "work",
        title: "AMRAP",
        seconds: (Number(r.amrapMinutes) || 15) * 60,
        exerciseId: r.items[0] && r.items[0].exerciseId,
        detail: r.items.map((it) => {
          const ex = byId(it.exerciseId);
          return `${ex ? ex.name : "?"} × ${it.reps}`;
        }).join("  ·  ")
      });
    } else if (r.format === "emom") {
      const mins = Number(r.emomMinutes) || r.items.length;
      for (let m = 0; m < mins; m++) {
        const it = r.items[m % r.items.length];
        const ex = byId(it.exerciseId);
        queue.push({
          phase: "work",
          title: ex ? ex.name : "Work",
          seconds: 60,
          exerciseId: it.exerciseId,
          detail: `Minute ${m + 1}/${mins} · ${it.reps}${ex && ex.timed ? "s" : " reps"} then rest the remainder`
        });
      }
    } else if (r.format === "circuit") {
      const rounds = Number(r.rounds) || 3;
      for (let rd = 1; rd <= rounds; rd++) {
        r.items.forEach((it, idx) => {
          const ex = byId(it.exerciseId);
          const secs = ex && ex.timed ? Number(it.reps) : Math.max(20, (Number(it.reps) || 8) * 3);
          queue.push({
            phase: "work",
            title: ex ? ex.name : "Work",
            seconds: secs,
            exerciseId: it.exerciseId,
            detail: `Round ${rd}/${rounds} · ${it.reps}${ex && ex.timed ? "s" : " reps"}`
          });
          const rest = Number(it.rest) || Number(r.restSeconds) || 20;
          const last = rd === rounds && idx === r.items.length - 1;
          if (!last && rest > 0) {
            queue.push({ phase: "rest", title: "Rest", seconds: rest, detail: nextName(r, idx, rd, rounds), exerciseId: it.exerciseId });
          }
        });
      }
    } else {
      r.items.forEach((it, idx) => {
        const ex = byId(it.exerciseId);
        const sets = Number(it.sets) || 1;
        for (let s = 1; s <= sets; s++) {
          const secs = ex && ex.timed ? Number(it.reps) : Math.max(20, (Number(it.reps) || 8) * 3);
          queue.push({
            phase: "work",
            title: ex ? ex.name : "Work",
            seconds: secs,
            exerciseId: it.exerciseId,
            detail: `Set ${s}/${sets} · ${it.reps}${ex && ex.timed ? "s" : " reps"}`
          });
          const last = idx === r.items.length - 1 && s === sets;
          const rest = Number(it.rest) || 30;
          if (!last && rest > 0) {
            const next = s < sets ? (ex ? ex.name : "Same") : nextItemName(r, idx);
            queue.push({ phase: "rest", title: "Rest", seconds: rest, detail: next ? `Next: ${next}` : "", exerciseId: it.exerciseId });
          }
        }
      });
    }

    queue.push({ phase: "done", title: "Session complete", seconds: 0, detail: "Nice work. Shake out and get some water." });
    return queue;
  }

  function nextItemName(r, idx) {
    const n = r.items[idx + 1];
    if (!n) return "";
    const ex = byId(n.exerciseId);
    return ex ? ex.name : "";
  }

  function nextName(r, idx, rd, rounds) {
    if (idx < r.items.length - 1) return "Next: " + (byId(r.items[idx + 1].exerciseId) || { name: "" }).name;
    if (rd < rounds) return "Next: round " + (rd + 1);
    return "";
  }

  function beep(freq, dur) {
    freq = freq || 660;
    dur = dur || 0.08;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch (err) { /* ignore */ }
  }

  function startPlayer() {
    if (!state.routine.items.length) return;
    state.player = {
      queue: buildQueue(state.routine),
      index: 0,
      remaining: 0,
      running: true
    };
    state.player.remaining = state.player.queue[0].seconds;
    state.view = "play";
    runTick();
    render();
  }

  function runTick() {
    clearInterval(state.tick);
    state.tick = setInterval(() => {
      if (!state.player || !state.player.running) return;
      const step = state.player.queue[state.player.index];
      if (!step || step.phase === "done") return;
      state.player.remaining -= 1;
      if (state.player.remaining <= 3 && state.player.remaining >= 0) beep(step.phase === "rest" ? 440 : 720, 0.07);
      if (state.player.remaining <= 0) {
        beep(880, 0.16);
        state.player.index += 1;
        const next = state.player.queue[state.player.index];
        state.player.remaining = next ? next.seconds : 0;
        if (!next || next.phase === "done") state.player.running = false;
      }
      renderPlayerOnly();
    }, 1000);
  }

  const $ = (sel) => document.querySelector(sel);

  function render() {
    document.querySelectorAll(".nav button").forEach((b) => {
      b.classList.toggle("active", b.dataset.view === state.view);
    });
    ["build", "library", "saved", "play"].forEach((v) => {
      const el = document.getElementById("view-" + v);
      if (el) el.classList.toggle("hidden", state.view !== v);
    });
    if (state.view === "build") renderBuilder();
    if (state.view === "library") renderLibrary();
    if (state.view === "saved") renderSaved();
    if (state.view === "play") renderPlayerOnly();
    renderModal();
  }

  function renderBuilder() {
    const r = state.routine;
    $("#r-name").value = r.name;
    $("#r-notes").value = r.notes;
    $("#r-rounds").value = r.rounds;
    $("#r-emom").value = r.emomMinutes;
    $("#r-amrap").value = r.amrapMinutes;
    document.querySelectorAll("[data-format]").forEach((p) => {
      p.classList.toggle("on", p.dataset.format === r.format);
    });
    $("#format-sets").classList.toggle("hidden", r.format !== "sets");
    $("#format-circuit").classList.toggle("hidden", r.format !== "circuit");
    $("#format-emom").classList.toggle("hidden", r.format !== "emom");
    $("#format-amrap").classList.toggle("hidden", r.format !== "amrap");

    const list = $("#item-list");
    if (!r.items.length) {
      list.innerHTML = `<div class="empty-hint">No movements yet. Add from the library, or generate a session.</div>`;
    } else {
      list.innerHTML = r.items.map((it, i) => {
        const ex = byId(it.exerciseId);
        const eq = ex && ex.equipment.includes("kettlebell")
          ? `<span class="eq kb">KB${ex.bells === 2 ? "×2" : ""}</span>`
          : `<span class="eq bw">BW</span>`;
        return `<div class="ex-row" draggable="true" data-idx="${i}">
          <div class="drag" title="Drag to reorder">⋮⋮</div>
          <div class="ex-thumb">${art(it.exerciseId)}</div>
          <div class="name">${ex ? ex.name : "Unknown"} ${eq}
            <small>${ex ? ex.cues : ""}</small>
          </div>
          <input class="qty" type="number" min="1" value="${it.sets}" data-field="sets" data-idx="${i}" title="Sets">
          <input class="qty" type="number" min="1" value="${it.reps}" data-field="reps" data-idx="${i}" title="Reps or seconds">
          <input class="qty" type="number" min="0" value="${it.rest}" data-field="rest" data-idx="${i}" title="Rest seconds">
          <button class="icon-btn" data-remove="${i}" title="Remove">✕</button>
        </div>`;
      }).join("");
    }

    $("#stat-moves").textContent = r.items.length;
    $("#stat-time").textContent = estimateMinutes(r) + "m";
    $("#stat-format").textContent = FORMATS.find((f) => f.id === r.format).label;
    $("#preview").innerHTML = r.items.map((it) => {
      const ex = byId(it.exerciseId);
      return `<li><b>${ex ? ex.name : "?"}</b><span>${schemeLabel(r, it)}</span></li>`;
    }).join("") || `<li><span>Empty routine</span></li>`;
  }

  function renderLibrary() {
    const q = ($("#lib-search").value || "").toLowerCase();
    const eq = $("#lib-eq").value;
    const pattern = $("#lib-pattern").value;
    const level = $("#lib-level").value;
    const filtered = EX.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.cues.toLowerCase().includes(q)) return false;
      if (eq === "kb" && !e.equipment.includes("kettlebell")) return false;
      if (eq === "bw" && !e.equipment.includes("bodyweight")) return false;
      if (pattern && !e.patterns.includes(pattern)) return false;
      if (level && e.level !== level) return false;
      return true;
    });
    $("#lib-count").textContent = `${filtered.length} movements`;
    $("#lib-grid").innerHTML = filtered.map((e) => {
      const badge = e.equipment.includes("kettlebell")
        ? `<span class="eq kb">Kettlebell${e.bells === 2 ? " · pair" : ""}</span>`
        : `<span class="eq bw">Bodyweight</span>`;
      return `<article class="ex-card">
        <div class="ex-art">${art(e.id)}</div>
        <div>${badge}</div>
        <h4>${e.name}</h4>
        <p>${e.cues}</p>
        <div class="tags">${e.patterns.map((p) => `<span class="tag">${p}</span>`).join("")}<span class="tag">${e.level}</span></div>
        <button class="btn" data-add="${e.id}">Add to routine</button>
      </article>`;
    }).join("");
  }

  function renderSaved() {
    const box = $("#saved-list");
    if (!state.saved.length) {
      box.innerHTML = `<div class="empty-hint">Nothing saved yet. Build or generate a session, then hit Save.</div>`;
      return;
    }
    box.innerHTML = state.saved.slice().reverse().map((r) => `<div class="saved-item">
      <div>
        <h4>${escapeHtml(r.name)}</h4>
        <p>${r.items.length} moves · ${FORMATS.find((f) => f.id === r.format).label} · ~${estimateMinutes(r)} min</p>
      </div>
      <div class="actions">
        <button class="btn" data-load="${r.id}">Open</button>
        <button class="btn" data-play-saved="${r.id}">Start</button>
        <button class="btn danger" data-delete="${r.id}">Delete</button>
      </div>
    </div>`).join("");
  }

  function renderPlayerOnly() {
    const p = state.player;
    if (!p) {
      $("#play-phase").textContent = "Idle";
      $("#play-clock").textContent = "00:00";
      $("#play-title").textContent = "No session running";
      $("#play-detail").textContent = "Build or open a routine, then hit Start session.";
      $("#play-bar").style.width = "0%";
      $("#play-toggle").disabled = true;
      const idleArt = $("#play-art");
      if (idleArt) { idleArt.innerHTML = ""; idleArt.dataset.id = ""; }
      return;
    }
    const step = p.queue[p.index] || p.queue[p.queue.length - 1];
    const total = p.queue.filter((s) => s.phase !== "done").length;
    const done = Math.min(p.index, total);
    $("#play-phase").textContent = step.phase === "done" ? "Done" : step.phase;
    $("#play-clock").textContent = step.phase === "done" ? "00:00" : fmt(p.remaining);
    $("#play-title").textContent = step.title;
    $("#play-detail").textContent = step.detail || "";
    const artBox = $("#play-art");
    if (artBox) {
      const aid = step.exerciseId || "";
      if (artBox.dataset.id !== aid) {
        artBox.dataset.id = aid;
        artBox.innerHTML = aid ? art(aid) : "";
      }
    }
    $("#play-bar").style.width = total ? (done / total) * 100 + "%" : "0%";
    $("#play-toggle").textContent = p.running ? "Pause" : "Resume";
    $("#play-toggle").disabled = step.phase === "done";
    document.getElementById("view-play").style.background =
      step.phase === "rest" ? "rgba(138,143,122,0.06)" : "transparent";
  }

  function renderModal() {
    $("#modal-back").classList.toggle("hidden", !state.genOpen);
  }

  function fmt(s) {
    s = Math.max(0, s | 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function bind() {
    document.querySelectorAll(".nav button").forEach((b) => {
      b.addEventListener("click", () => {
        if (state.view === "play" && state.tick) clearInterval(state.tick);
        state.view = b.dataset.view;
        render();
      });
    });

    $("#r-name").addEventListener("input", (e) => { state.routine.name = e.target.value; });
    $("#r-notes").addEventListener("input", (e) => { state.routine.notes = e.target.value; });
    $("#r-rounds").addEventListener("input", (e) => { state.routine.rounds = Number(e.target.value) || 1; renderBuilder(); });
    $("#r-emom").addEventListener("input", (e) => { state.routine.emomMinutes = Number(e.target.value) || 1; renderBuilder(); });
    $("#r-amrap").addEventListener("input", (e) => { state.routine.amrapMinutes = Number(e.target.value) || 1; renderBuilder(); });

    document.querySelectorAll("[data-format]").forEach((p) => {
      p.addEventListener("click", () => {
        state.routine.format = p.dataset.format;
        renderBuilder();
      });
    });

    $("#item-list").addEventListener("input", (e) => {
      const idx = e.target.dataset.idx;
      const field = e.target.dataset.field;
      if (idx == null || !field) return;
      state.routine.items[idx][field] = Number(e.target.value) || 0;
      const focused = document.activeElement;
      const keep = focused && focused.dataset ? { idx: focused.dataset.idx, field: focused.dataset.field } : null;
      renderBuilder();
      if (keep) {
        const again = document.querySelector('[data-field="' + keep.field + '"][data-idx="' + keep.idx + '"]');
        if (again) again.focus();
      }
    });

    $("#item-list").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      state.routine.items.splice(Number(btn.dataset.remove), 1);
      renderBuilder();
    });

    $("#item-list").addEventListener("dragstart", (e) => {
      const row = e.target.closest(".ex-row");
      if (!row) return;
      state.dragFrom = Number(row.dataset.idx);
    });
    $("#item-list").addEventListener("dragover", (e) => { e.preventDefault(); });
    $("#item-list").addEventListener("drop", (e) => {
      const row = e.target.closest(".ex-row");
      if (!row || state.dragFrom == null) return;
      const to = Number(row.dataset.idx);
      const arr = state.routine.items;
      const moved = arr.splice(state.dragFrom, 1)[0];
      arr.splice(to, 0, moved);
      state.dragFrom = null;
      renderBuilder();
    });

    $("#btn-generate").addEventListener("click", () => { state.genOpen = true; renderModal(); });
    $("#btn-cancel-gen").addEventListener("click", () => { state.genOpen = false; renderModal(); });
    $("#btn-run-gen").addEventListener("click", () => {
      state.routine = generate({
        minutes: Number($("#g-min").value),
        goal: $("#g-goal").value,
        equipment: $("#g-eq").value,
        level: $("#g-level").value,
        bells: Number($("#g-bells").value)
      });
      state.genOpen = false;
      state.view = "build";
      render();
    });

    $("#btn-new").addEventListener("click", () => {
      if (state.routine.items.length && !confirm("Start a blank routine?")) return;
      state.routine = blankRoutine();
      renderBuilder();
    });

    $("#btn-save").addEventListener("click", () => {
      const copy = JSON.parse(JSON.stringify(state.routine));
      const idx = state.saved.findIndex((s) => s.id === copy.id);
      if (idx >= 0) state.saved[idx] = copy;
      else state.saved.push(copy);
      persist();
      $("#save-flash").textContent = "Saved to this browser.";
      setTimeout(() => { $("#save-flash").textContent = ""; }, 1800);
    });

    $("#btn-print").addEventListener("click", () => window.print());
    $("#btn-start").addEventListener("click", startPlayer);

    ["lib-search", "lib-eq", "lib-pattern", "lib-level"].forEach((id) => {
      $("#" + id).addEventListener("input", renderLibrary);
    });

    $("#lib-grid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      const ex = byId(btn.dataset.add);
      state.routine.items.push({
        id: uid(),
        exerciseId: ex.id,
        sets: ex.defaultSets,
        reps: ex.defaultReps,
        rest: ex.rest
      });
      state.view = "build";
      render();
    });

    $("#saved-list").addEventListener("click", (e) => {
      const load = e.target.closest("[data-load]");
      const del = e.target.closest("[data-delete]");
      const play = e.target.closest("[data-play-saved]");
      if (load) {
        const r = state.saved.find((s) => s.id === load.dataset.load);
        state.routine = JSON.parse(JSON.stringify(r));
        state.view = "build";
        render();
      }
      if (play) {
        const r = state.saved.find((s) => s.id === play.dataset.playSaved);
        state.routine = JSON.parse(JSON.stringify(r));
        startPlayer();
      }
      if (del) {
        state.saved = state.saved.filter((s) => s.id !== del.dataset.delete);
        persist();
        renderSaved();
      }
    });

    $("#play-toggle").addEventListener("click", () => {
      if (!state.player || state.player.queue[state.player.index].phase === "done") return;
      state.player.running = !state.player.running;
      renderPlayerOnly();
    });
    $("#play-skip").addEventListener("click", () => {
      if (!state.player) return;
      state.player.index += 1;
      const next = state.player.queue[state.player.index];
      state.player.remaining = next ? next.seconds : 0;
      if (!next || next.phase === "done") state.player.running = false;
      renderPlayerOnly();
    });
    $("#play-exit").addEventListener("click", () => {
      clearInterval(state.tick);
      state.player = null;
      state.view = "build";
      render();
    });
  }

  window.Bellwork = { state, render, generate };
  document.addEventListener("DOMContentLoaded", () => {
    bind();
    render();
  });
})();
