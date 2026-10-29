// ---------- Execução dos blocos de comando ----------
function* runStack(b, th) {
  for (let cur = b; cur && !th.done; cur = cur.next?.block) yield* exec(cur, th);
}
const sub = (b, name) => b.inputs?.[name]?.block || null;
function costumeIndex(sid, v) {
  const cs = costumesOf(sid);
  const i = cs.findIndex(([, c]) => c.name === v);
  if (i >= 0) return i;
  const n = Number(v); if (cs.length && Number.isFinite(n) && String(v).trim() !== "") return ((Math.round(n) - 1) % cs.length + cs.length) % cs.length;
  return -1;
}
function setBackdrop(i) {
  const bds = live(project.meta.backdrops); if (!bds.length) return [];
  rt.backdrop = ((i % bds.length) + bds.length) % bds.length;
  rt.redraw = true;
  const name = bds[rt.backdrop][1].name;
  return fire("ev_backdrop", hb => hb.fields?.BACKDROP === name);
}
function backdropTarget(v) {
  const bds = live(project.meta.backdrops);
  if (v === "_next_") return rt.backdrop + 1;
  if (v === "_prev_") return rt.backdrop - 1;
  if (v === "_random_") return Math.floor(Math.random() * bds.length);
  const i = bds.findIndex(([, c]) => c.name === v); return i >= 0 ? i : costumeIndexStage(v);
}
function costumeIndexStage(v) { const n = Number(v); const len = live(project.meta.backdrops).length; return len && Number.isFinite(n) && String(v).trim() !== "" ? Math.round(n) - 1 : -1; }
function* exec(b, th) {
  const t = th.target;
  if (DEF[b.type]?.kind === "hat") return;
  yield* gate(b, th);
  if (th.done) return;
  switch (b.type) {
    // Movimento
    case "mv_move": { const n = num(inp(b, "STEPS", th)), r = (90 - t.dir) * Math.PI / 180; moveTo(t, t.x + n * Math.cos(r), t.y + n * Math.sin(r)); break; }
    case "mv_turnr": turn(t, t.dir + num(inp(b, "DEG", th))); break;
    case "mv_turnl": turn(t, t.dir - num(inp(b, "DEG", th))); break;
    case "mv_goto": { const p = pointOf(F(b, "TO"), t); if (p) moveTo(t, p.x, p.y); break; }
    case "mv_gotoxy": moveTo(t, num(inp(b, "X", th)), num(inp(b, "Y", th))); break;
    case "mv_glide": case "mv_glideto": {
      if (t.isStage) break;
      const secs = num(inp(b, "SECS", th));
      const p = b.type === "mv_glide" ? { x: num(inp(b, "X", th)), y: num(inp(b, "Y", th)) } : pointOf(F(b, "TO"), t);
      if (!p) break;
      const x0 = t.x, y0 = t.y, t0 = now(), dur = Math.max(0, secs) * 1000;
      while (!th.done) { const k = dur ? Math.min(1, (now() - t0) / dur) : 1; moveTo(t, x0 + (p.x - x0) * k, y0 + (p.y - y0) * k); if (k >= 1) break; yield; }
      break;
    }
    case "mv_pointdir": turn(t, num(inp(b, "DIR", th))); break;
    case "mv_pointto": { const v = F(b, "TO"); const p = v === "_mouse_" ? rt.mouse : targetByName(v); if (p && !t.isStage && (p.x !== t.x || p.y !== t.y)) turn(t, Math.atan2(p.x - t.x, p.y - t.y) * 180 / Math.PI); break; }
    case "mv_changex": moveTo(t, t.x + num(inp(b, "DX", th)), t.y); break;
    case "mv_setx": moveTo(t, num(inp(b, "X", th)), t.y); break;
    case "mv_changey": moveTo(t, t.x, t.y + num(inp(b, "DY", th))); break;
    case "mv_sety": moveTo(t, t.x, num(inp(b, "Y", th))); break;
    case "mv_bounce": bounce(t); break;
    case "mv_rotstyle": if (!t.isStage) { t.rot = F(b, "STYLE"); rt.redraw = true; } break;
    // Aparência
    case "lk_sayfor": case "lk_thinkfor": {
      if (t.isStage) break;
      const s = { text: str(inp(b, "MSG", th)), think: b.type === "lk_thinkfor" }; t.say = s; rt.redraw = true;
      yield* waitSecs(th, num(inp(b, "SECS", th)));
      if (t.say === s) { t.say = null; rt.redraw = true; }
      break;
    }
    case "lk_say": case "lk_think": { if (t.isStage) break; const txt = str(inp(b, "MSG", th)); t.say = txt === "" ? null : { text: txt, think: b.type === "lk_think" }; rt.redraw = true; break; }
    case "lk_costume": { if (t.isStage) break; const i = costumeIndex(t.sid, F(b, "COSTUME")); if (i >= 0) { t.costume = i; rt.redraw = true; } break; }
    case "lk_nextcostume": { if (t.isStage) break; const n = costumesOf(t.sid).length; if (n) t.costume = (t.costume + 1) % n; rt.redraw = true; break; }
    case "lk_backdrop": { const i = backdropTarget(F(b, "BACKDROP")); if (i >= 0 || F(b, "BACKDROP").startsWith("_")) setBackdrop(i); break; }
    case "lk_backdropwait": { const i = backdropTarget(F(b, "BACKDROP")); const ths = setBackdrop(i); yield* waitFor(th, () => ths.every(x => x.done)); break; }
    case "lk_nextbackdrop": setBackdrop(rt.backdrop + 1); break;
    case "lk_changesize": if (!t.isStage) { t.size = clampSize(t, t.size + num(inp(b, "CHANGE", th))); rt.redraw = true; } break;
    case "lk_setsize": if (!t.isStage) { t.size = clampSize(t, num(inp(b, "SIZE", th))); rt.redraw = true; } break;
    case "lk_changeeffect": { const e = F(b, "EFFECT"); t.effects[e] = clampEffect(e, (t.effects[e] || 0) + num(inp(b, "CHANGE", th))); rt.redraw = true; break; }
    case "lk_seteffect": { const e = F(b, "EFFECT"); t.effects[e] = clampEffect(e, num(inp(b, "VALUE", th))); rt.redraw = true; break; }
    case "lk_cleareffects": t.effects = freshEffects(); rt.redraw = true; break;
    case "lk_show": if (!t.isStage) { t.visible = true; rt.redraw = true; } break;
    case "lk_hide": if (!t.isStage) { t.visible = false; rt.redraw = true; } break;
    case "lk_layer": { const i = rt.targets.indexOf(t); if (i >= 0) { rt.targets.splice(i, 1); F(b, "LAYER") === "front" ? rt.targets.push(t) : rt.targets.unshift(t); } rt.redraw = true; break; }
    case "lk_layers": { const i = rt.targets.indexOf(t); if (i < 0) break; const n = Math.round(num(inp(b, "NUM", th))) * (F(b, "DIR") === "forward" ? 1 : -1); rt.targets.splice(i, 1); rt.targets.splice(Math.max(0, Math.min(rt.targets.length, i + n)), 0, t); rt.redraw = true; break; }
    // Som
    case "snd_playwait": case "snd_play": {
      const s = soundsOf(t.sid).find(([, x]) => x.name === F(b, "SOUND")); if (!s) break;
      let d = playSoundEntry(s[1], t);
      if (d === null) { yield* waitFor(th, () => audioBuffer(s[1].ref) !== "loading"); d = playSoundEntry(s[1], t); }
      if (b.type === "snd_playwait" && d) yield* waitSecs(th, d);
      break;
    }
    case "snd_stop": stopSounds(); break;
    case "snd_changeeffect": { const e = F(b, "EFFECT"); t.sfx[e] = clampSfx(e, (t.sfx[e] || 0) + num(inp(b, "VALUE", th))); break; }
    case "snd_seteffect": { const e = F(b, "EFFECT"); t.sfx[e] = clampSfx(e, num(inp(b, "VALUE", th))); break; }
    case "snd_cleareffects": t.sfx = { pitch: 0, pan: 0 }; break;
    case "snd_changevol": t.volume = Math.max(0, Math.min(100, t.volume + num(inp(b, "V", th)))); break;
    case "snd_setvol": t.volume = Math.max(0, Math.min(100, num(inp(b, "V", th)))); break;
    // Eventos
    case "ev_broadcast": fire("ev_receive", hb => hb.fields?.MSG === F(b, "MSG")); break;
    case "ev_broadcastwait": { const ths = fire("ev_receive", hb => hb.fields?.MSG === F(b, "MSG")); yield* waitFor(th, () => ths.every(x => x.done)); break; }
    // Controle
    case "ct_wait": yield* waitSecs(th, num(inp(b, "SECS", th))); break;
    case "ct_repeat": { const n = Math.round(num(inp(b, "TIMES", th))), lap = { kind: "repetir", i: 0, n }; (th.laps ||= []).push(lap); try { for (let i = 0; i < n && !th.done; i++) { lap.i = i + 1; yield* runStack(sub(b, "SUBSTACK"), th); yield* loopYield(th); } } finally { th.laps.pop(); } break; }
    case "ct_forever": { const lap = { kind: "sempre", i: 0 }; (th.laps ||= []).push(lap); try { while (!th.done) { lap.i++; yield* runStack(sub(b, "SUBSTACK"), th); yield* loopYield(th); } } finally { th.laps.pop(); } break; }
    case "ct_if": if (bool(inp(b, "COND", th))) yield* runStack(sub(b, "SUBSTACK"), th); break;
    case "ct_ifelse": yield* runStack(sub(b, bool(inp(b, "COND", th)) ? "SUBSTACK" : "SUBSTACK2"), th); break;
    case "ct_waituntil": yield* waitFor(th, () => bool(inp(b, "COND", th))); break;
    case "ct_repeatuntil": while (!th.done && !bool(inp(b, "COND", th))) { yield* runStack(sub(b, "SUBSTACK"), th); yield* loopYield(th); } break;
    case "ct_while": while (!th.done && bool(inp(b, "COND", th))) { yield* runStack(sub(b, "SUBSTACK"), th); yield* loopYield(th); } break;
    case "ct_foreach": { const name = F(b, "VAR"), m = findVar(t, name), n = num(inp(b, "N", th)); for (let i = 1; i <= n && !th.done; i++) { m.set(name, i); yield* runStack(sub(b, "SUBSTACK"), th); yield* loopYield(th); } break; }
    case "ct_stop": {
      const w = F(b, "WHAT");
      if (w === "all") { stopAll(true); narrate("O bloco “parar tudo” encerrou o programa."); }
      else if (w === "this") th.done = true;
      else rt.threads.forEach(x => { if (x.target === t && x !== th) x.done = true; });
      break;
    }
    case "ct_clone": { const o = F(b, "OF"); const src = o === "_myself_" ? t : targetByName(o); if (src && !src.isStage) makeClone(src); break; }
    case "ct_deleteclone": if (t.clone) { rt.threads.forEach(x => { if (x.target === t) x.done = true; }); const i = rt.targets.indexOf(t); if (i >= 0) rt.targets.splice(i, 1); rt.clones--; rt.redraw = true; } break;
    // Sensores
    case "sn_ask": {
      const q = str(inp(b, "Q", th));
      yield* waitFor(th, () => !rt.asking);
      if (!t.isStage && t.visible) { t.say = { text: q, think: false }; rt.redraw = true; }
      const token = {}; rt.asking = token;
      $("#askQ").textContent = t.isStage || !t.visible ? q : ""; $("#askBox").hidden = false; $("#askInput").value = "";
      setTimeout(() => $("#askInput").focus(), 30);
      yield* waitFor(th, () => rt.asking !== token);
      if (!t.isStage) { t.say = null; rt.redraw = true; }
      break;
    }
    case "sn_drag": t.draggable = F(b, "MODE") === "yes"; break;
    case "sn_resettimer": rt.timer0 = now(); break;
    // Variáveis e listas
    case "var_set": { const n = F(b, "VAR"); findVar(t, n).set(n, inp(b, "VALUE", th)); break; }
    case "var_change": { const n = F(b, "VAR"); const m = findVar(t, n); m.set(n, num(m.get(n)) + num(inp(b, "VALUE", th))); break; }
    case "var_show": case "var_hide": setShown("vars", F(b, "VAR"), b.type === "var_show"); break;
    case "list_add": { const l = findList(t, F(b, "LIST")); if (l.length < 200000) l.push(inp(b, "ITEM", th)); break; }
    case "list_delete": { const l = findList(t, F(b, "LIST")); const v = inp(b, "INDEX", th); if (v === "all") { l.splice(0); break; } const i = v === "last" ? l.length : Math.floor(num(v)); if (i >= 1 && i <= l.length) l.splice(i - 1, 1); break; }
    case "list_clear": findList(t, F(b, "LIST")).splice(0); break;
    case "list_insert": { const l = findList(t, F(b, "LIST")); const v = inp(b, "INDEX", th); const i = v === "last" ? l.length + 1 : Math.floor(num(v)); if (i >= 1 && i <= l.length + 1) l.splice(i - 1, 0, inp(b, "ITEM", th)); break; }
    case "list_replace": { const l = findList(t, F(b, "LIST")); const v = inp(b, "INDEX", th); const i = v === "last" ? l.length : Math.floor(num(v)); if (i >= 1 && i <= l.length) l[i - 1] = inp(b, "ITEM", th); break; }
    case "list_show": case "list_hide": setShown("lists", F(b, "LIST"), b.type === "list_show"); break;
    // Caneta
    case "pen_clear": penCtx.clearRect(0, 0, 480, 360); rt.redraw = true; break;
    case "pen_stamp": drawTarget(penCtx, t); rt.redraw = true; break;
    case "pen_down": t.pen.down = true; dot(t); break;
    case "pen_up": t.pen.down = false; break;
    case "pen_color": { const [r, g, bb] = hexToRgb(inp(b, "COLOR", th)); const [h, s, v] = rgbToHsv(r, g, bb); Object.assign(t.pen, { h: h / 3.6, s: s * 100, v: v * 100, a: 0 }); break; }
    case "pen_changeparam": case "pen_setparam": {
      const p = F(b, "PARAM"), key = { color: "h", saturation: "s", brightness: "v", transparency: "a" }[p], val = num(inp(b, "V", th));
      let nv = b.type === "pen_changeparam" ? t.pen[key] + val : val;
      t.pen[key] = key === "h" ? ((nv % 100) + 100) % 100 : Math.max(0, Math.min(100, nv)); break;
    }
    case "pen_size": t.pen.size = Math.max(1, Math.min(1200, num(inp(b, "V", th)))); break;
    case "pen_changesize": t.pen.size = Math.max(1, Math.min(1200, t.pen.size + num(inp(b, "V", th)))); break;
    case "pen_text": { const size = Math.max(4, Math.min(200, num(inp(b, "SIZE", th)))); penCtx.fillStyle = penColor(t); penCtx.font = `bold ${size}px Atkinson Hyperlegible, Arial, sans-serif`; penCtx.textAlign = "center"; penCtx.textBaseline = "middle"; penCtx.fillText(str(inp(b, "TEXT", th)), 240 + t.x, 180 - t.y); penCtx.textAlign = "start"; penCtx.textBaseline = "alphabetic"; rt.redraw = true; break; }
    // Música
    case "mu_drum": { playDrum(F(b, "DRUM"), t); yield* waitSecs(th, num(inp(b, "BEATS", th)) * 60 / rt.tempo); break; }
    case "mu_rest": yield* waitSecs(th, num(inp(b, "BEATS", th)) * 60 / rt.tempo); break;
    case "mu_note": { const secs = num(inp(b, "BEATS", th)) * 60 / rt.tempo; playNote(Math.max(0, Math.min(130, num(inp(b, "NOTE", th)))), secs, t); yield* waitSecs(th, secs); break; }
    case "mu_instr": t.instrument = F(b, "INSTR"); break;
    case "mu_settempo": rt.tempo = Math.max(20, Math.min(500, num(inp(b, "T", th)))); break;
    case "mu_changetempo": rt.tempo = Math.max(20, Math.min(500, rt.tempo + num(inp(b, "T", th)))); break;
    // Fala
    case "tts_speak": { let done = false; speak(str(inp(b, "W", th)), t).then(() => { done = true; }); yield* waitFor(th, () => done); break; }
    case "tts_voice": t.voice = F(b, "VOICE"); break;
    case "tts_lang": t.lang = F(b, "LANG"); break;
    // Jogo+
    case "jg_gravity": rt.gravity = num(inp(b, "G", th)); break;
    case "jg_setvx": t.vx = num(inp(b, "V", th)); break;
    case "jg_setvy": t.vy = num(inp(b, "V", th)); break;
    case "jg_changevx": t.vx = (t.vx || 0) + num(inp(b, "V", th)); break;
    case "jg_changevy": t.vy = (t.vy || 0) + num(inp(b, "V", th)); break;
    case "jg_step": physicsStep(t, F(b, "SOLID")); break;
    case "jg_save": try { localStorage.setItem("bab-salvo:" + str(inp(b, "KEY", th)), str(inp(b, "VALUE", th))); } catch (_) {} break;
    case "jg_log": logConsole(spriteName(t), str(inp(b, "TEXT", th))); break;
    default:
      if (b.type.startsWith("pc_")) yield* callProc(b, th);
  }
}
// Meus Blocos: procura a definição no próprio ator e roda com as entradas
function* callProc(b, th) {
  const pid = b.type.slice(3), t = th.target;
  const p = live(docOf(t.sid)?.procs).find(([id]) => id === pid)?.[1] || live(project.meta.procs).find(([id]) => id === pid)?.[1];
  const defScript = scriptsFor(t.sid).find(([, s]) => s.block.type === "pd_" + pid);
  if (!p || !defScript) return;
  if (th.frames.length > 400) { narrate("Um bloco chamou ele mesmo vezes demais e o script parou."); th.done = true; return; }
  const frame = {}; let i = 0;
  for (const s of p.spec || []) if (s.k !== "label") { frame[s.name] = inp(b, "A" + i, th); i++; }
  th.frames.push(frame); if (p.warp) th.warp++;
  try {
    if (!p.warp && th.frames.length > 1 && th.frames.length % 8 === 0) yield; // recursão sem travar a tela
    yield* runStack(defScript[1].block.next?.block, th);
  } finally { th.frames.pop(); if (p.warp) { th.warp--; if (!th.warp) th.warpStart = 0; } }
}
function setShown(kind, name, on) {
  const g = live(project.meta[kind]).find(([, v]) => v.name === name);
  if (g) { if (!!g[1].shown !== on) updateMeta({ [kind]: { [g[0]]: { shown: on } } }); renderMonitors(); return; }
  for (const [sid, s] of spriteList()) { const l = live(s[kind]).find(([, v]) => v.name === name); if (l) { if (!!l[1].shown !== on) updateSprite(sid, { [kind]: { [l[0]]: { shown: on } } }); renderMonitors(); return; } }
}
function clampSize(t, s) {
  const g = geom({ ...t, size: 100 }); if (!g) return Math.max(5, Math.min(500, s));
  const minS = Math.min(1, 5 / Math.min(g.w, g.h)) * 100, maxS = Math.min(1.5 * 480 / g.w, 1.5 * 360 / g.h) * 100;
  return Math.max(minS, Math.min(Math.max(maxS, 100), s));
}
const clampEffect = (e, v) => e === "ghost" ? Math.max(0, Math.min(100, v)) : e === "brightness" ? Math.max(-100, Math.min(100, v)) : v;
const clampSfx = (e, v) => e === "pitch" ? Math.max(-360, Math.min(360, v)) : Math.max(-100, Math.min(100, v));
function pointOf(v, t) {
  if (v === "_random_") return { x: Math.round(Math.random() * 480 - 240), y: Math.round(Math.random() * 360 - 180) };
  if (v === "_mouse_") return { x: rt.mouse.x, y: rt.mouse.y };
  return targetByName(v);
}
function turn(t, d) { if (t.isStage) return; d = ((d + 180) % 360 + 360) % 360 - 180; if (d === -180) d = 180; t.dir = d; rt.redraw = true; }
function moveTo(t, x, y) {
  if (t.isStage) return;
  const b = bounds(t);
  if (b) {
    const ix = Math.min(15, (b.r - b.l) / 2), iy = Math.min(15, (b.t - b.b) / 2);
    x = Math.max(-240 - (b.r - t.x) + ix, Math.min(240 + (t.x - b.l) - ix, x));
    y = Math.max(-180 - (b.t - t.y) + iy, Math.min(180 + (t.y - b.b) - iy, y));
  }
  if (t.pen.down) { penCtx.strokeStyle = penColor(t); penCtx.lineWidth = t.pen.size; penCtx.lineCap = "round"; penCtx.beginPath(); penCtx.moveTo(240 + t.x, 180 - t.y); penCtx.lineTo(240 + x, 180 - y); penCtx.stroke(); }
  t.x = Math.round(x * 1e6) / 1e6; t.y = Math.round(y * 1e6) / 1e6; rt.redraw = true;
}
function dot(t) { penCtx.fillStyle = penColor(t); penCtx.beginPath(); penCtx.arc(240 + t.x, 180 - t.y, t.pen.size / 2, 0, 7); penCtx.fill(); rt.redraw = true; }
function penColor(t) { const [r, g, b] = hsvToRgb((t.pen.h % 100) * 3.6, t.pen.s / 100, t.pen.v / 100); return `rgba(${r},${g},${b},${1 - t.pen.a / 100})`; }
function makeClone(src) {
  if (rt.clones >= 300) return;
  const c = { ...src, id: uid(), clone: true, effects: { ...src.effects }, sfx: { ...src.sfx }, say: null, vars: new Map(src.vars), lists: new Map([...src.lists].map(([k, v]) => [k, [...v]])), pen: { ...src.pen } };
  rt.targets.splice(rt.targets.indexOf(src), 0, c); rt.clones++;
  for (const [id, s] of scriptsFor(src.sid)) if (s.block.type === "ct_startclone") startThread(c, s.block, id);
  rt.redraw = true;
}
function bounce(t) {
  const b = bounds(t); if (!b) return;
  const dl = b.l + 240, dr = 240 - b.r, dt = 180 - b.t, dbm = b.b + 180;
  const m = Math.min(dl, dr, dt, dbm); if (m > 0) return;
  const r = (90 - t.dir) * Math.PI / 180; let dx = Math.cos(r), dy = Math.sin(r);
  if (m === dl) dx = Math.max(.2, Math.abs(dx)); else if (m === dr) dx = -Math.max(.2, Math.abs(dx)); else if (m === dt) dy = -Math.max(.2, Math.abs(dy)); else dy = Math.max(.2, Math.abs(dy));
  turn(t, 90 - Math.atan2(dy, dx) * 180 / Math.PI);
  const nb = bounds(t);
  let fx = 0, fy = 0;
  if (nb.l < -240) fx = -240 - nb.l; if (nb.r > 240) fx = 240 - nb.r; if (nb.b < -180) fy = -180 - nb.b; if (nb.t > 180) fy = 180 - nb.t;
  t.x += fx; t.y += fy; rt.redraw = true;
}
// Física simples para jogos de plataforma
function physicsStep(t, solid) {
  if (t.isStage) return;
  const hit = () => solid === "_edge_" ? touching(t, "_edge_") : (touching(t, solid) || touching(t, "_edge_"));
  t.vy = (t.vy || 0) - rt.gravity;
  t.onGround = false;
  const pen0 = t.pen.down; t.pen.down = false;
  const vx = t.vx || 0;
  if (vx) { t.x += vx; if (hit()) { const s = Math.sign(vx); let i = 0; while (hit() && i++ < Math.abs(vx) + 2) t.x -= s; t.vx = 0; } }
  const vy = t.vy;
  if (vy) { t.y += vy; if (hit()) { const s = Math.sign(vy); let i = 0; while (hit() && i++ < Math.abs(vy) + 2) t.y -= s; if (vy < 0) t.onGround = true; t.vy = 0; } }
  if (!t.onGround && t.vy <= 0) { t.y -= 1; if (hit()) t.onGround = true; t.y += 1; }
  t.x = Math.max(-240, Math.min(240, t.x)); t.y = Math.max(-200, Math.min(200, t.y));
  t.pen.down = pen0; rt.redraw = true;
}

// ---------- Geometria, efeitos e colisão ----------
const imgCache = new Map();
function imageFor(costume) {
  if (!costume) return null;
  const key = costume.kind + ":" + costume.ref;
  if (imgCache.has(key)) return imgCache.get(key);
  let src = null;
  if (costume.kind === "lib" && LIB[costume.ref]) src = libSrc(costume.ref);
  if (costume.kind === "img") { const d = project.images.get(costume.ref); if (d) src = d; }
  if (!src) return null;
  const im = new Image(); im.src = src; im.onload = () => { rt.redraw = true; renderTiles(); };
  imgCache.set(key, im);
  return im;
}
function costumeOf(t) { const cs = costumesOf(t.sid); return cs[t.costume]?.[1] || cs[0]?.[1]; }
function geom(t) {
  const c = costumeOf(t), im = imageFor(c); if (!im || !im.complete || !im.naturalWidth) return null;
  const res = c.res || 1, s = t.size / 100, nw = im.naturalWidth, nh = im.naturalHeight;
  const w = nw / res * s, h = nh / res * s;
  const ox = (c.cx ?? nw / 2) / res * s, oy = (c.cy ?? nh / 2) / res * s;
  let rot = 0, flip = 1;
  if (t.rot === "all") rot = (t.dir - 90) * Math.PI / 180; else if (t.rot === "lr" && t.dir < 0) flip = -1;
  return { im, c, w, h, ox, oy, rot, flip };
}
function bounds(t) {
  const g = geom(t); if (!g) return null;
  const c = Math.cos(g.rot), s = Math.sin(g.rot), xs = [], ys = [];
  [[-g.ox, -g.oy], [g.w - g.ox, -g.oy], [g.w - g.ox, g.h - g.oy], [-g.ox, g.h - g.oy]].forEach(([px, py]) => { const x = px * g.flip; xs.push(t.x + x * c - py * s); ys.push(t.y - (x * s + py * c)); });
  return { l: Math.min(...xs), r: Math.max(...xs), b: Math.min(...ys), t: Math.max(...ys) };
}
// Efeitos que mudam os pixels (olho de peixe, redemoinho, pixelar, mosaico)
const fxCache = new Map();
function fxImage(g, e) {
  const key = g.im.src.length + ":" + g.im.src.slice(-40) + "|" + [e.fisheye, e.whirl, e.pixelate, e.mosaic].map(v => Math.round(v)).join(",");
  if (fxCache.has(key)) return fxCache.get(key);
  const W = g.im.naturalWidth, H = g.im.naturalHeight, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d", { willReadFrequently: true });
  x.drawImage(g.im, 0, 0);
  if (e.mosaic) { const n = Math.max(1, Math.min(32, Math.round((Math.abs(e.mosaic) + 10) / 10))); const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H; tmp.getContext("2d").drawImage(c, 0, 0); x.clearRect(0, 0, W, H); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) x.drawImage(tmp, i * W / n, j * H / n, W / n, H / n); }
  if (e.pixelate) { const k = Math.max(1, Math.abs(e.pixelate) / 10 * Math.max(W, H) / 60); const sw = Math.max(1, Math.round(W / k)), sh = Math.max(1, Math.round(H / k)); const tmp = document.createElement("canvas"); tmp.width = sw; tmp.height = sh; tmp.getContext("2d").drawImage(c, 0, 0, sw, sh); x.clearRect(0, 0, W, H); x.imageSmoothingEnabled = false; x.drawImage(tmp, 0, 0, W, H); }
  if (e.fisheye || e.whirl) {
    const src = x.getImageData(0, 0, W, H), out = x.createImageData(W, H), sd = src.data, od = out.data;
    const fe = Math.max(0, (e.fisheye + 100) / 100), wr = -e.whirl * Math.PI / 180, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      let dx = (xx - cx) / R, dy = (yy - cy) / R; let d = Math.hypot(dx, dy);
      if (e.fisheye && d < 1 && d > 0) { const nd = Math.pow(d, fe); dx *= nd / d; dy *= nd / d; d = nd; }
      if (e.whirl && d < 1) { const a = wr * (1 - d) * (1 - d), ca = Math.cos(a), sa = Math.sin(a); [dx, dy] = [dx * ca - dy * sa, dx * sa + dy * ca]; }
      const sx = Math.round(cx + dx * R), sy = Math.round(cy + dy * R), o = (yy * W + xx) * 4;
      if (sx >= 0 && sy >= 0 && sx < W && sy < H) { const i = (sy * W + sx) * 4; od[o] = sd[i]; od[o + 1] = sd[i + 1]; od[o + 2] = sd[i + 2]; od[o + 3] = sd[i + 3]; }
    }
    x.putImageData(out, 0, 0);
  }
  if (fxCache.size > 120) fxCache.delete(fxCache.keys().next().value);
  fxCache.set(key, c); return c;
}
function drawTarget(c, t, alphaOnly = false) {
  const g = geom(t); if (!g) return;
  const e = t.effects || {};
  let img = g.im;
  if (!alphaOnly && (e.fisheye || e.whirl || e.pixelate || e.mosaic)) img = fxImage(g, e);
  c.save();
  c.translate(240 + t.x, 180 - t.y); c.rotate(g.rot); c.scale(g.flip, 1);
  if (!alphaOnly) {
    c.globalAlpha = 1 - (e.ghost || 0) / 100;
    const f = []; if (e.color) f.push(`hue-rotate(${(e.color * 1.8) % 360}deg)`); if (e.brightness) f.push(`brightness(${Math.max(0, 1 + e.brightness / 100)})`);
    if (f.length) c.filter = f.join(" ");
  }
  c.drawImage(img, -g.ox, -g.oy, g.w, g.h);
  c.restore();
}
const hitA = document.createElement("canvas"); hitA.width = 480; hitA.height = 360; const hitCtx = hitA.getContext("2d", { willReadFrequently: true });
const hitB = document.createElement("canvas"); hitB.width = 480; hitB.height = 360; const hitCtxB = hitB.getContext("2d", { willReadFrequently: true });
function clipRect(A) {
  const x = Math.max(0, Math.floor(240 + A.l)), y = Math.max(0, Math.floor(180 - A.t)), x2 = Math.min(480, Math.ceil(240 + A.r)), y2 = Math.min(360, Math.ceil(180 - A.b));
  return x2 > x && y2 > y ? { x, y, w: x2 - x, h: y2 - y } : null;
}
function overlapPixels(a, b) {
  const A = bounds(a), B = bounds(b); if (!A || !B) return false;
  const I = { l: Math.max(A.l, B.l), r: Math.min(A.r, B.r), b: Math.max(A.b, B.b), t: Math.min(A.t, B.t) };
  if (I.l >= I.r || I.b >= I.t) return false;
  const R = clipRect(I); if (!R) return false;
  hitCtx.clearRect(R.x, R.y, R.w, R.h); drawTarget(hitCtx, a, true);
  hitCtx.globalCompositeOperation = "destination-in"; drawTarget(hitCtx, b, true); hitCtx.globalCompositeOperation = "source-over";
  const d = hitCtx.getImageData(R.x, R.y, R.w, R.h).data;
  hitCtx.clearRect(0, 0, 480, 360);
  for (let i = 3; i < d.length; i += 4) if (d[i] > 40) return true;
  return false;
}
function pointHits(t, px, py) {
  const B = bounds(t); if (!B || px < B.l || px > B.r || py < B.b || py > B.t) return false;
  const x = Math.round(240 + px), y = Math.round(180 - py);
  hitCtx.clearRect(0, 0, 480, 360); drawTarget(hitCtx, t, true);
  const a = hitCtx.getImageData(Math.max(0, Math.min(479, x)), Math.max(0, Math.min(359, y)), 1, 1).data[3];
  hitCtx.clearRect(0, 0, 480, 360); return a > 30;
}
function touching(t, what) {
  if (t.isStage || !t.visible) return false;
  if (what === "_mouse_") return pointHits(t, rt.mouse.x, rt.mouse.y);
  if (what === "_edge_") { const b = bounds(t); return !!b && (b.l <= -240 || b.r >= 240 || b.b <= -180 || b.t >= 180); }
  const e = spriteByName(what); if (!e) return false;
  return rt.targets.some(o => o.sid === e[0] && o !== t && o.visible && overlapPixels(t, o));
}
// Tocando na cor: desenha o mundo sem o ator e compara os pixels debaixo dele
function touchingColor(t, rgb, mask) {
  if (t.isStage || !t.visible) return false;
  const B = bounds(t); if (!B) return false; const R = clipRect(B); if (!R) return false;
  hitCtx.clearRect(0, 0, 480, 360);
  const bc = backdropCanvas(live(project.meta.backdrops)[rt.backdrop]?.[1]); if (bc) hitCtx.drawImage(bc, 0, 0); else { hitCtx.fillStyle = "#fff"; hitCtx.fillRect(0, 0, 480, 360); }
  hitCtx.drawImage(pen, 0, 0);
  for (const o of rt.targets) if (o !== t && o.visible) drawTarget(hitCtx, o);
  hitCtxB.clearRect(0, 0, 480, 360); drawTarget(hitCtxB, t, !mask);
  const W = hitCtx.getImageData(R.x, R.y, R.w, R.h).data, S = hitCtxB.getImageData(R.x, R.y, R.w, R.h).data;
  hitCtx.clearRect(0, 0, 480, 360); hitCtxB.clearRect(0, 0, 480, 360);
  const near = (d, i, c) => Math.abs(d[i] - c[0]) <= 10 && Math.abs(d[i + 1] - c[1]) <= 10 && Math.abs(d[i + 2] - c[2]) <= 18;
  for (let i = 0; i < S.length; i += 4) {
    if (S[i + 3] < 128) continue;
    if (mask && !near(S, i, mask)) continue;
    if (W[i + 3] > 0 && near(W, i, rgb)) return true;
  }
  return false;
}

// ---------- Sequenciador: 30 quadros/s; cada quadro roda as threads até alguém pedir redesenho ----------
function checkEdgeHats() {
  for (const [t, blk, id] of hatsMatching("ev_gt", () => true, false)) {
    const v = blk.fields?.WHAT === "loudness" ? loudness() : (now() - rt.timer0) / 1000;
    const lim = num(blk.inputs?.VALUE?.block ? evalR(blk.inputs.VALUE.block, { target: t, frames: [] }) : blk.inputs?.VALUE?.shadow?.fields?.NUM);
    const key = t.id + "|" + id, was = rt.edge.get(key) || false, isNow = v > lim;
    if (isNow && !was) startThread(t, blk, id);
    rt.edge.set(key, isNow);
  }
}
function tick() {
  const t0 = now();
  rt.redraw = false;
  if (rt.running || project.scripts.size) checkEdgeHats();
  let progressed = true;
  while (progressed && rt.threads.length && now() - t0 < 25 && (rt.turbo || !rt.redraw)) {
    progressed = false;
    for (const th of [...rt.threads]) {
      if (th.done) continue;
      if (th.waitUntil) { if (now() < th.waitUntil) continue; th.waitUntil = 0; }
      if (th.waitFn) { if (!th.waitFn()) continue; th.waitFn = null; }
      try { const r = th.gen.next(); if (r.done) th.done = true; } catch (err) { console.error(err); th.done = true; narrate("Um bloco deu erro e o script parou: " + (err.message || err)); }
      progressed = true;
    }
    rt.threads = rt.threads.filter(th => !th.done);
  }
  rt.threads = rt.threads.filter(th => !th.done);
  if (!rt.threads.length && rt.running) { rt.running = false; ws.highlightBlock(null); $("#stepBtn").hidden = true; onRunEnded(); }
  renderStage();
  updateGlow();
}
