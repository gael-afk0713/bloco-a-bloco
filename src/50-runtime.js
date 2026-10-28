// =====================================================================
// Motor de execução: threads cooperativas, 30 quadros por segundo (como o Scratch)
// =====================================================================
const rt = {
  targets: [], stage: null, threads: [], redraw: false, vars: new Map(), lists: new Map(),
  keys: new Set(), mouse: { x: 0, y: 0, down: false }, timer0: now(), answer: "", asking: null,
  clones: 0, backdrop: 0, running: false, tempo: 60, gravity: 1, turbo: false, edge: new Map(), username: "",
};
const pen = document.createElement("canvas"); pen.width = 480; pen.height = 360;
const penCtx = pen.getContext("2d");
const freshEffects = () => ({ color: 0, fisheye: 0, whirl: 0, pixelate: 0, mosaic: 0, brightness: 0, ghost: 0 });
function newTarget(sid, d) {
  return { id: uid(), sid, clone: false, x: d.x || 0, y: d.y || 0, dir: d.dir ?? 90, size: d.size ?? 100, visible: d.visible !== false, rot: d.rot || "all",
    costume: d.costume || 0, effects: freshEffects(), say: null, vars: new Map(), lists: new Map(),
    pen: { down: false, h: 66, s: 100, v: 100, a: 0, size: 1 }, draggable: !!d.draggable, volume: 100, sfx: { pitch: 0, pan: 0 },
    instrument: "1", voice: "ALTO", lang: "pt-br", vx: 0, vy: 0, onGround: false };
}
function rtEnsure(sid) {
  const d = project.sprites.get(sid); if (!d || d.deleted) return null;
  let t = rt.targets.find(x => x.sid === sid && !x.clone);
  if (!t) { t = newTarget(sid, d); rt.targets.push(t); }
  else if (!rt.running) Object.assign(t, { x: d.x || 0, y: d.y || 0, dir: d.dir ?? 90, size: d.size ?? 100, visible: d.visible !== false, rot: d.rot || "all", costume: d.costume || 0, draggable: !!d.draggable });
  const n = costumesOf(sid).length; if (t.costume >= n) t.costume = 0;
  for (const [, v] of live(d.vars)) if (!t.vars.has(v.name)) t.vars.set(v.name, v.value ?? 0);
  for (const [, l] of live(d.lists)) if (!t.lists.has(l.name)) t.lists.set(l.name, [...(l.items || [])]);
  return t;
}
function syncRuntime() {
  for (const [id] of spriteList()) rtEnsure(id);
  rt.targets = rt.targets.filter(t => { const d = project.sprites.get(t.sid); return d && !d.deleted; });
  // ordem das camadas segue a ordem dos atores (quem foi adicionado depois fica na frente), sem desfazer mudanças feitas durante a execução
  if (!rt.running) rt.targets.sort((a, b) => (project.sprites.get(a.sid)?.layer ?? project.sprites.get(a.sid)?.order ?? 0) - (project.sprites.get(b.sid)?.layer ?? project.sprites.get(b.sid)?.order ?? 0));
  for (const [, v] of live(project.meta.vars)) if (!rt.vars.has(v.name)) rt.vars.set(v.name, v.value ?? 0);
  for (const [, l] of live(project.meta.lists)) if (!rt.lists.has(l.name)) rt.lists.set(l.name, [...(l.items || [])]);
  const bds = live(project.meta.backdrops);
  if (!rt.running && project.meta.curBackdrop) { const i = bds.findIndex(([id]) => id === project.meta.curBackdrop); if (i >= 0) rt.backdrop = i; }
  if (rt.backdrop >= bds.length) rt.backdrop = 0;
  if (!rt.stage) rt.stage = { id: STAGE, sid: STAGE, isStage: true, vars: rt.vars, lists: rt.lists, effects: freshEffects(), volume: 100, sfx: { pitch: 0, pan: 0 }, instrument: "1", voice: "ALTO", lang: "pt-br", x: 0, y: 0, dir: 90, size: 100 };
}
const spriteName = t => t.isStage ? "Palco" : (project.sprites.get(t.sid)?.name || "Ator");
function findVar(t, name) { if (t.vars && t.vars !== rt.vars && t.vars.has(name)) return t.vars; return rt.vars; }
function findList(t, name) { if (t.lists && t.lists !== rt.lists && t.lists.has(name)) return t.lists.get(name); if (!rt.lists.has(name)) rt.lists.set(name, []); return rt.lists.get(name); }

// ---------- Scripts e gatilhos ----------
function scriptsFor(sid) { return [...project.scripts.entries()].filter(([, s]) => s.sprite === sid && s.block); }
const allTargets = () => rt.stage ? [rt.stage, ...rt.targets] : [...rt.targets];
function hatsMatching(type, test = () => true, includeClones = true) {
  const out = [];
  for (const t of allTargets()) { if (t.clone && !includeClones) continue; for (const [id, s] of scriptsFor(t.sid)) if (s.block.type === type && test(s.block, t)) out.push([t, s.block, id]); }
  return out;
}
function startThread(t, top, topId, restart = true) {
  const ex = rt.threads.find(th => th.target === t && th.topId === topId && !th.done);
  if (ex) { if (!restart) return ex; ex.done = true; }
  const th = { target: t, topId, done: false, waitUntil: 0, waitFn: null, gen: null, frames: [], warp: 0, warpStart: 0 };
  th.gen = runStack(DEF[top.type]?.kind === "hat" ? top.next?.block : top, th);
  rt.threads.push(th); rt.running = true;
  return th;
}
const lessonRan = { flag: false, key: false, click: false };
function fire(type, test, restart = true) {
  const ths = hatsMatching(type, test).map(([t, b, id]) => startThread(t, b, id, restart));
  if (ths.length) { if (type === "ev_flag") lessonRan.flag = true; if (type === "ev_key") lessonRan.key = true; }
  return ths;
}
function fireFor(t, type) { return scriptsFor(t.sid).filter(([, s]) => s.block.type === type).map(([id, s]) => startThread(t, s.block, id)); }
function greenFlag(fromRoom = false) {
  stopAll(true);
  rt.timer0 = now(); rt.edge.clear();
  const n = fire("ev_flag").length;
  narrate(n ? `▶ clicado: ${n} script${n > 1 ? "s começaram" : " começou"} ao mesmo tempo.` : "Nenhum script começa com “quando ▶ for clicado”. Arraste esse bloco amarelo (Eventos) para a área de código.");
  if (!fromRoom && room && $("#syncChk").checked) room.emit("run", { at: Date.now() }).catch(() => {});
}
function stopAll(silent = false, fromRoom = false) {
  rt.threads.forEach(th => th.done = true); rt.threads = [];
  rt.targets = rt.targets.filter(t => !t.clone); rt.clones = 0;
  rt.targets.forEach(t => { t.say = null; });
  rt.asking = null; $("#askBox").hidden = true; stopSounds();
  ws.highlightBlock(null); $("#stepBtn").hidden = true; rt.running = false; updateGlow();
  if (!silent) narrate("Parado. Tudo foi interrompido onde estava.");
  if (!silent && !fromRoom && room && $("#syncChk").checked) room.emit("stop", {}).catch(() => {});
}
function* waitSecs(th, s) { th.waitUntil = now() + Math.max(0, num(s)) * 1000; yield; }
function* waitFor(th, fn) { if (fn()) return; th.waitFn = fn; yield; }
// Laços cedem a vez a cada volta; em “rodar sem atualizar a tela” só cedem a cada 500 ms
function* loopYield(th) {
  if (th.warp > 0) { if (!th.warpStart) th.warpStart = now(); if (now() - th.warpStart < 500) return; th.warpStart = now(); }
  yield;
}

// Modo devagar / passo a passo
let stepToken = 0;
function* gate(b, th) {
  const mode = $("#speedSel").value;
  if (mode === "normal" || th.warp > 0) return;
  if (th.target.sid === curSid) ws.highlightBlock(b.id);
  narrate(explain(b, th));
  if (mode === "slow") yield* waitSecs(th, .55);
  else { const tk = stepToken; $("#stepBtn").hidden = false; yield* waitFor(th, () => stepToken !== tk || $("#speedSel").value !== "step"); }
}

// ---------- Avaliação de entradas ----------
function inp(b, name, th) {
  const i = b.inputs?.[name]; if (!i) return "";
  if (i.block) return evalR(i.block, th);
  if (i.shadow) { const f = i.shadow.fields || {}; return f.NUM ?? f.TEXT ?? f.COLOR ?? ""; }
  return "";
}
const F = (b, n) => b.fields?.[n] ?? "";
function cmp(a, b) {
  let x = Number(a), y = Number(b);
  if (typeof a === "string" && a.trim() === "") x = NaN;
  if (typeof b === "string" && b.trim() === "") y = NaN;
  if (Number.isNaN(x) || Number.isNaN(y)) { const s1 = str(a).toLowerCase(), s2 = str(b).toLowerCase(); return s1 < s2 ? -1 : s1 > s2 ? 1 : 0; }
  if (x === y) return 0;
  return x - y;
}
function targetByName(n) { if (n === "_stage_") return rt.stage; const e = spriteByName(n); return e ? rt.targets.find(t => t.sid === e[0] && !t.clone) : null; }
function evalR(b, th) {
  const t = th.target;
  switch (b.type) {
    case "b_num": return num(F(b, "NUM"));
    case "b_text": return F(b, "TEXT");
    case "b_color": return F(b, "COLOR");
    case "mv_x": return t.isStage ? 0 : Math.round(t.x * 1e6) / 1e6;
    case "mv_y": return t.isStage ? 0 : Math.round(t.y * 1e6) / 1e6;
    case "mv_dir": return t.isStage ? 90 : t.dir;
    case "lk_costumenum": { const cs = costumesOf(t.sid); return F(b, "WHAT") === "name" ? (cs[t.costume]?.[1].name || "") : t.costume + 1; }
    case "lk_backdropnum": { const bs = live(project.meta.backdrops); return F(b, "WHAT") === "name" ? (bs[rt.backdrop]?.[1].name || "") : rt.backdrop + 1; }
    case "lk_size": return Math.round(t.size);
    case "snd_vol": return t.volume;
    case "sn_touching": return touching(t, F(b, "OBJ"));
    case "sn_touchcolor": return touchingColor(t, hexToRgb(inp(b, "COLOR", th)));
    case "sn_colortouch": return touchingColor(t, hexToRgb(inp(b, "COLOR2", th)), hexToRgb(inp(b, "COLOR", th)));
    case "sn_distance": { const o = F(b, "OBJ"); const p = o === "_mouse_" ? rt.mouse : targetByName(o); return p && !t.isStage ? Math.round(Math.hypot(p.x - t.x, p.y - t.y) * 100) / 100 : 10000; }
    case "sn_answer": return rt.answer;
    case "sn_keypressed": { const k = F(b, "KEY"); return k === "any" ? rt.keys.size > 0 : rt.keys.has(k); }
    case "sn_mousedown": return rt.mouse.down;
    case "sn_mousex": return Math.round(rt.mouse.x);
    case "sn_mousey": return Math.round(rt.mouse.y);
    case "sn_loudness": return loudness();
    case "sn_timer": return Math.round((now() - rt.timer0) / 10) / 100;
    case "sn_of": {
      const o = targetByName(F(b, "OBJ")), p = F(b, "PROP"); if (!o) return 0;
      if (p === "backdrop") return live(project.meta.backdrops)[rt.backdrop]?.[1].name || "";
      if (p === "backdrop#") return rt.backdrop + 1;
      if (p === "volume") return o.volume;
      if (o.isStage) { return OF_PROPS.some(x => x[1] === p) ? 0 : (rt.vars.get(p) ?? 0); }
      const cs = costumesOf(o.sid);
      const builtin = { x: o.x, y: o.y, dir: o.dir, "costume#": o.costume + 1, costume: cs[o.costume]?.[1].name || "", size: o.size };
      return p in builtin ? builtin[p] : (o.vars.get(p) ?? 0);
    }
    case "sn_current": { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() + 1, date: d.getDate(), dayofweek: d.getDay() + 1, hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() }[F(b, "WHAT")]; }
    case "sn_days": return (Date.now() - Date.UTC(2000, 0, 1)) / 86400000;
    case "sn_username": return rt.username;
    case "op_add": return num(inp(b, "A", th)) + num(inp(b, "B", th));
    case "op_sub": return num(inp(b, "A", th)) - num(inp(b, "B", th));
    case "op_mul": return num(inp(b, "A", th)) * num(inp(b, "B", th));
    case "op_div": return num(inp(b, "A", th)) / num(inp(b, "B", th));
    case "op_pow": return Math.pow(num(inp(b, "A", th)), num(inp(b, "B", th)));
    case "op_max": return Math.max(num(inp(b, "A", th)), num(inp(b, "B", th)));
    case "op_min": return Math.min(num(inp(b, "A", th)), num(inp(b, "B", th)));
    case "op_random": {
      const ra = inp(b, "FROM", th), rb = inp(b, "TO", th), a = num(ra), c = num(rb), lo = Math.min(a, c), hi = Math.max(a, c);
      const isInt = v => Number.isInteger(num(v)) && !String(v).includes(".");
      return isInt(ra) && isInt(rb) ? lo + Math.floor(Math.random() * (hi - lo + 1)) : lo + Math.random() * (hi - lo);
    }
    case "op_gt": return cmp(inp(b, "A", th), inp(b, "B", th)) > 0;
    case "op_lt": return cmp(inp(b, "A", th), inp(b, "B", th)) < 0;
    case "op_eq": return cmp(inp(b, "A", th), inp(b, "B", th)) === 0;
    case "op_and": return bool(inp(b, "A", th)) && bool(inp(b, "B", th));
    case "op_or": return bool(inp(b, "A", th)) || bool(inp(b, "B", th));
    case "op_not": return !bool(inp(b, "A", th));
    case "op_join": return str(inp(b, "A", th)) + str(inp(b, "B", th));
    case "op_letter": { const s = [...str(inp(b, "S", th))]; const i = Math.floor(num(inp(b, "N", th))); return s[i - 1] ?? ""; }
    case "op_length": return [...str(inp(b, "S", th))].length;
    case "op_contains": return str(inp(b, "A", th)).toLowerCase().includes(str(inp(b, "B", th)).toLowerCase());
    case "op_mod": { const a = num(inp(b, "A", th)), m = num(inp(b, "B", th)); const r = a % m; return r !== 0 && Math.sign(r) !== Math.sign(m) ? r + m : r; }
    case "op_round": return Math.round(num(inp(b, "A", th)));
    case "op_math": {
      const a = num(inp(b, "A", th)), rad = a * Math.PI / 180, deg = 180 / Math.PI, r10 = v => Math.round(v * 1e10) / 1e10;
      switch (F(b, "OP")) {
        case "abs": return Math.abs(a); case "floor": return Math.floor(a); case "ceiling": return Math.ceil(a); case "sqrt": return Math.sqrt(a);
        case "sin": return r10(Math.sin(rad)); case "cos": return r10(Math.cos(rad)); case "tan": { const m = ((a % 360) + 360) % 360; return m === 90 ? Infinity : m === 270 ? -Infinity : r10(Math.tan(rad)); }
        case "asin": return Math.asin(a) * deg; case "acos": return Math.acos(a) * deg; case "atan": return Math.atan(a) * deg;
        case "ln": return Math.log(a); case "log": return Math.log10(a); case "e ^": case "e^": return Math.exp(a); case "10 ^": case "10^": return Math.pow(10, a);
      }
      return 0;
    }
    case "var_get": { const n = F(b, "VAR"); const m = findVar(t, n); return m.has(n) ? m.get(n) : 0; }
    case "list_get": { const l = findList(t, F(b, "LIST")); return l.every(x => str(x).length === 1) ? l.join("") : l.join(" "); }
    case "list_item": { const l = findList(t, F(b, "LIST")); const v = inp(b, "INDEX", th); const i = v === "last" ? l.length : Math.floor(num(v)); return l[i - 1] ?? ""; }
    case "list_indexof": { const l = findList(t, F(b, "LIST")); const v = inp(b, "ITEM", th); return l.findIndex(x => cmp(x, v) === 0) + 1; }
    case "list_length": return findList(t, F(b, "LIST")).length;
    case "list_contains": { const l = findList(t, F(b, "LIST")); const v = inp(b, "ITEM", th); return l.some(x => cmp(x, v) === 0); }
    case "proc_arg": { const f = th.frames?.[th.frames.length - 1]; const n = F(b, "VALUE"); return f && n in f ? f[n] : 0; }
    case "proc_argb": { const f = th.frames?.[th.frames.length - 1]; const n = F(b, "VALUE"); return f && n in f ? bool(f[n]) : false; }
    case "mu_tempo": return rt.tempo;
    case "jg_onground": return !!t.onGround;
    case "jg_vx": return t.vx || 0;
    case "jg_vy": return t.vy || 0;
    case "jg_load": { try { const v = localStorage.getItem("bab-salvo:" + str(inp(b, "KEY", th))); return v === null ? "" : v; } catch (_) { return ""; } }
    case "jg_distxy": return t.isStage ? 0 : Math.round(Math.hypot(num(inp(b, "X", th)) - t.x, num(inp(b, "Y", th)) - t.y) * 100) / 100;
  }
  return "";
}
