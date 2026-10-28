// =====================================================================
// Palco: desenho, balões, mostradores e interação
// =====================================================================
const cv = $("#stage"), cx = cv.getContext("2d");
const bdCache = new Map();
function backdropCanvas(bd) {
  if (!bd) return null;
  const key = bd.kind + ":" + bd.ref;
  if (bdCache.has(key)) return bdCache.get(key);
  const c = document.createElement("canvas"); c.width = 480; c.height = 360; const g = c.getContext("2d");
  if (bd.kind === "gen") (BACKDROP_GEN[bd.ref] || BACKDROP_GEN.branco).draw(g);
  else {
    const im = imageFor(bd); g.fillStyle = "#fff"; g.fillRect(0, 0, 480, 360);
    if (im && im.complete && im.naturalWidth) { const res = bd.res || 1, w = im.naturalWidth / res, h = im.naturalHeight / res; const ox = (bd.cx ?? im.naturalWidth / 2) / res, oy = (bd.cy ?? im.naturalHeight / 2) / res; g.drawImage(im, 240 - ox, 180 - oy, w, h); }
    else { if (im) im.addEventListener("load", () => { bdCache.delete(key); }, { once: true }); return c; }
  }
  bdCache.set(key, c); return c;
}
function renderStage() {
  cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.filter = "none";
  const bd = live(project.meta.backdrops)[rt.backdrop]?.[1];
  const bc = backdropCanvas(bd);
  if (bc) cx.drawImage(bc, 0, 0); else { cx.fillStyle = "#fff"; cx.fillRect(0, 0, 480, 360); }
  cx.drawImage(pen, 0, 0);
  for (const t of rt.targets) if (t.visible) drawTarget(cx, t);
  for (const t of rt.targets) if (t.visible && t.say) drawBubble(t);
  if (!rt.running && curSid && curSid !== STAGE && !document.body.classList.contains("player")) {
    const t = rt.targets.find(x => x.sid === curSid && !x.clone); const b = t && t.visible && bounds(t);
    if (b) { cx.strokeStyle = "rgba(15,124,138,.55)"; cx.setLineDash([5, 4]); cx.lineWidth = 1.5; cx.strokeRect(240 + b.l - 3, 180 - b.t - 3, b.r - b.l + 6, b.t - b.b + 6); cx.setLineDash([]); }
  }
  const t = rt.targets.find(x => x.sid === curSid && !x.clone);
  const ro = t ? `${spriteName(t)}: x ${Math.round(t.x)} · y ${Math.round(t.y)} · direção ${Math.round(t.dir)}°` : "";
  if ($("#roSprite").textContent !== ro) $("#roSprite").textContent = ro;
}
function drawBubble(t) {
  const b = bounds(t); if (!b) return;
  cx.font = "bold 13px Atkinson Hyperlegible, Arial, sans-serif";
  const words = String(t.say.text).slice(0, 330).split(/\s+/), lines = []; let line = "";
  for (const w of words) { const test = line ? line + " " + w : w; if (cx.measureText(test).width > 170 && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  if (!lines.length) return;
  const w = Math.max(40, Math.min(190, Math.max(...lines.map(l => cx.measureText(l).width)) + 18)), h = lines.length * 16 + 12;
  let x = 240 + b.r - 4, y = 180 - b.t - h - 14;
  if (x + w > 476) x = 240 + b.l - w + 4; x = Math.max(4, Math.min(476 - w, x)); y = Math.max(4, y);
  cx.fillStyle = "#fff"; cx.strokeStyle = "#9aa8b8"; cx.lineWidth = 2;
  cx.beginPath(); cx.roundRect(x, y, w, h, 12); cx.fill(); cx.stroke();
  if (t.say.think) { [[x + 18, y + h + 6, 4], [x + 10, y + h + 13, 2.5]].forEach(([a, c, r]) => { cx.beginPath(); cx.arc(a, c, r, 0, 7); cx.fill(); cx.stroke(); }); }
  else { cx.beginPath(); cx.moveTo(x + 14, y + h); cx.lineTo(x + 10, y + h + 10); cx.lineTo(x + 26, y + h); cx.closePath(); cx.fill(); cx.beginPath(); cx.moveTo(x + 14, y + h); cx.lineTo(x + 10, y + h + 10); cx.lineTo(x + 26, y + h); cx.stroke(); }
  cx.fillStyle = "#17202b"; lines.forEach((l, i) => cx.fillText(l, x + 9, y + 20 + i * 16));
}

// Mostradores de variáveis e listas (arraste para mover; clique duplo para trocar o tamanho)
function monitorEntries() {
  const out = [];
  for (const [id, v] of live(project.meta.vars)) if (v.shown) out.push({ kind: "vars", where: STAGE, id, v, label: v.name, val: rt.vars.get(v.name) });
  for (const [id, l] of live(project.meta.lists)) if (l.shown) out.push({ kind: "lists", where: STAGE, id, v: l, label: l.name, val: rt.lists.get(l.name) });
  for (const [sid, s] of spriteList()) {
    const t = rt.targets.find(x => x.sid === sid && !x.clone); if (!t) continue;
    for (const [id, v] of live(s.vars)) if (v.shown) out.push({ kind: "vars", where: sid, id, v, label: s.name + ": " + v.name, val: t.vars.get(v.name) });
    for (const [id, l] of live(s.lists)) if (l.shown) out.push({ kind: "lists", where: sid, id, v: l, label: s.name + ": " + l.name, val: t.lists.get(l.name) });
  }
  return out;
}
let monDrag = null, lastMonHTML = "";
function renderMonitors() {
  if (monDrag) return;
  const box = $("#monitors"), W = box.clientWidth || 480, k = W / 480;
  const html = monitorEntries().map((m, i) => {
    const x = (m.v.mx ?? 5) * k, y = (m.v.my ?? 5 + i * 26) * k;
    const pos = `style="left:${x}px;top:${y}px"`, data = `data-kind="${m.kind}" data-where="${esc(m.where)}" data-id="${esc(m.id)}"`;
    if (m.kind === "lists") return `<div class="monitor list" ${pos} ${data}><span>${esc(m.label)}</span><ol>${(m.val || []).slice(0, 200).map(v => `<li>${esc(str(v))}</li>`).join("")}</ol><small>tamanho ${(m.val || []).length}</small></div>`;
    return `<div class="monitor ${m.v.mode === "large" ? "large" : ""}" ${pos} ${data}><span>${esc(m.label)}</span><b>${esc(str(m.val ?? 0))}</b></div>`;
  }).join("");
  if (html !== lastMonHTML) { box.innerHTML = html; lastMonHTML = html; }
}
$("#monitors").addEventListener("pointerdown", e => {
  const el = e.target.closest(".monitor"); if (!el) return;
  const r = $("#monitors").getBoundingClientRect(), er = el.getBoundingClientRect();
  monDrag = { el, dx: e.clientX - er.left, dy: e.clientY - er.top, r, moved: false };
  el.setPointerCapture(e.pointerId);
});
$("#monitors").addEventListener("pointermove", e => {
  if (!monDrag) return; monDrag.moved = true;
  const { el, dx, dy, r } = monDrag;
  el.style.left = Math.max(0, Math.min(r.width - 30, e.clientX - r.left - dx)) + "px"; el.style.top = Math.max(0, Math.min(r.height - 16, e.clientY - r.top - dy)) + "px";
});
$("#monitors").addEventListener("pointerup", () => {
  if (!monDrag) return; const { el, r, moved } = monDrag; monDrag = null;
  if (!moved) return;
  const k = 480 / r.width, patch = { [el.dataset.kind]: { [el.dataset.id]: { mx: Math.round(parseFloat(el.style.left) * k), my: Math.round(parseFloat(el.style.top) * k) } } };
  el.dataset.where === STAGE ? updateMeta(patch) : updateSprite(el.dataset.where, patch);
  lastMonHTML = "";
});
$("#monitors").addEventListener("dblclick", e => {
  const el = e.target.closest(".monitor:not(.list)"); if (!el) return;
  const cur = el.classList.contains("large") ? "large" : "normal";
  const patch = { vars: { [el.dataset.id]: { mode: cur === "large" ? "normal" : "large" } } };
  el.dataset.where === STAGE ? updateMeta(patch) : updateSprite(el.dataset.where, patch);
  lastMonHTML = ""; renderMonitors();
});
setInterval(renderMonitors, 150);

// Mouse, cliques e arrastar atores no palco
let dragState = null;
function stageXY(e) { const r = cv.getBoundingClientRect(); return { x: Math.round(((e.clientX - r.left) / r.width) * 480 - 240), y: Math.round(180 - ((e.clientY - r.top) / r.height) * 360) }; }
cv.addEventListener("pointermove", e => {
  const p = stageXY(e); rt.mouse.x = Math.max(-240, Math.min(240, p.x)); rt.mouse.y = Math.max(-180, Math.min(180, p.y));
  $("#roMouse").textContent = `mouse x: ${rt.mouse.x} y: ${rt.mouse.y}`;
  if (dragState) { const t = dragState.t; t.x = p.x - dragState.dx; t.y = p.y - dragState.dy; dragState.moved = true; rt.redraw = true; }
});
cv.addEventListener("pointerdown", e => {
  cv.focus(); rt.mouse.down = true; actx();
  const p = stageXY(e);
  for (let i = rt.targets.length - 1; i >= 0; i--) {
    const t = rt.targets[i];
    if (!t.visible || !pointHits(t, p.x, p.y)) continue;
    const ths = fireFor(t, "ev_click"); if (ths.length) lessonRan.click = true;
    if ((!t.clone && !document.body.classList.contains("player")) || t.draggable) { dragState = { t, dx: p.x - t.x, dy: p.y - t.y, moved: false }; cv.setPointerCapture(e.pointerId); }
    if (!t.clone && !ths.length && t.sid !== curSid && !document.body.classList.contains("player")) selectSprite(t.sid);
    return;
  }
  if (rt.stage) fireFor(rt.stage, "ev_stageclick");
});
window.addEventListener("pointerup", () => {
  rt.mouse.down = false;
  if (dragState) { const { t, moved } = dragState; dragState = null; if (moved && !t.clone && !document.body.classList.contains("player")) { updateSprite(t.sid, { x: Math.round(t.x), y: Math.round(t.y) }); renderProps(); } }
});
cv.addEventListener("pointerleave", () => { rt.mouse.down = false; });
const typingTarget = e => e.target.closest && e.target.closest("input, textarea, select, .blocklyHtmlInput, #blocklyDiv, .modal");
window.addEventListener("keydown", e => {
  if (typingTarget(e)) return;
  const k = keyName(e); if (!k) return;
  if (document.activeElement === cv || e.target === document.body || e.target === cv) e.preventDefault();
  rt.keys.add(k);
  fire("ev_key", hb => hb.fields?.KEY === k || hb.fields?.KEY === "any", false);
});
window.addEventListener("keyup", e => { const k = keyName(e); if (!k) return; rt.keys.delete(k); if (!typingTarget(e)) fire("ev_keyup", hb => hb.fields?.KEY === k || hb.fields?.KEY === "any", false); });
window.addEventListener("blur", () => rt.keys.clear());
$("#askBox").addEventListener("submit", e => { e.preventDefault(); rt.answer = $("#askInput").value; rt.asking = null; $("#askBox").hidden = true; cv.focus(); });

// =====================================================================
// Explicações em linguagem simples (modo devagar e passo a passo)
// =====================================================================
function explain(b, th) {
  const t = th.target;
  const v = n => { try { return str(inp(b, n, th)); } catch (_) { return "?"; } };
  const who = spriteName(t);
  const dirTxt = d => { const n = Math.round(d); return n === 90 ? "a direita" : n === -90 ? "a esquerda" : n === 0 ? "cima" : Math.abs(n) === 180 ? "baixo" : `${n}°`; };
  switch (b.type) {
    case "mv_move": { const n = num(v("STEPS")), r = (90 - t.dir) * Math.PI / 180; return `${who} anda ${n} passos olhando para ${dirTxt(t.dir)}: vai de (${Math.round(t.x)}, ${Math.round(t.y)}) para (${Math.round(t.x + n * Math.cos(r))}, ${Math.round(t.y + n * Math.sin(r))}).`; }
    case "mv_turnr": return `${who} gira ${v("DEG")}° no sentido do relógio.`;
    case "mv_turnl": return `${who} gira ${v("DEG")}° no sentido contrário ao relógio.`;
    case "mv_gotoxy": return `${who} pula para x: ${v("X")}, y: ${v("Y")}. O x é a posição na horizontal e o y na vertical.`;
    case "mv_changex": return `x muda de ${Math.round(t.x)} para ${Math.round(t.x + num(v("DX")))}. ${num(v("DX")) >= 0 ? "Vai para a direita." : "Vai para a esquerda."}`;
    case "mv_changey": return `y muda de ${Math.round(t.y)} para ${Math.round(t.y + num(v("DY")))}. ${num(v("DY")) >= 0 ? "Sobe." : "Desce."}`;
    case "mv_bounce": return `Testando se ${who} encostou na borda. Se encostou, vira para o outro lado.`;
    case "mv_glide": return `${who} desliza até (${v("X")}, ${v("Y")}) em ${v("SECS")} segundos.`;
    case "lk_sayfor": return `${who} diz “${v("MSG")}” e espera ${v("SECS")} segundos.`;
    case "lk_say": return `${who} diz “${v("MSG")}”.`;
    case "lk_nextcostume": return `${who} troca para a próxima fantasia. Trocar fantasias rápido cria animação.`;
    case "ct_wait": return `Pausa de ${v("SECS")} segundos. Nada neste script acontece até o tempo passar.`;
    case "ct_repeat": return `Repetir ${v("TIMES")} vezes os blocos de dentro.`;
    case "ct_forever": return "Repetir para sempre os blocos de dentro, até alguém clicar em ■.";
    case "ct_if": case "ct_ifelse": {
      let r = "?"; try { r = bool(inp(b, "COND", th)) ? "verdadeira" : "falsa"; } catch (_) {}
      const cond = b.inputs?.COND?.block ? `“${blockText(b.inputs.COND.block)}”` : "a condição (vazia: encaixe um bloco hexagonal)";
      return `${who} testa ${cond}: agora é ${r}. ${r === "verdadeira" ? "Então os blocos de dentro vão rodar." : (b.type === "ct_ifelse" ? "Então roda a parte do “senão”." : "Então os blocos de dentro são pulados.")}`;
    }
    case "ct_waituntil": return `${who} espera até “${b.inputs?.COND?.block ? blockText(b.inputs.COND.block) : "…"}” ficar verdadeiro.`;
    case "var_set": return `A variável “${F(b, "VAR")}” passa a guardar ${v("VALUE")}.`;
    case "var_change": { const n = F(b, "VAR"); const m = findVar(t, n); return `A variável “${n}” valia ${str(m.get(n) ?? 0)} e ganha ${v("VALUE")}: fica ${num(m.get(n)) + num(v("VALUE"))}.`; }
    case "ev_broadcast": return `Mandando a mensagem “${F(b, "MSG")}” para todos. Quem tem “quando eu receber ${F(b, "MSG")}” começa agora.`;
    case "pen_down": return `${who} abaixa a caneta: a partir de agora, risca por onde passa.`;
    case "ct_clone": return "Criando uma cópia (clone). Ela roda o script “quando eu começar como clone”.";
    case "sn_ask": return `Fazendo a pergunta “${v("Q")}” e esperando a resposta.`;
    case "jg_step": return `Física: a velocidade y (${Math.round(t.vy || 0)}) diminui pela gravidade, ${who} anda e para se bater.`;
  }
  if (b.type.startsWith("pc_")) return `Usando o seu bloco “${blockText(b)}”: o script pula para o “definir” dele e depois volta.`;
  return `${who}: ${DEF[b.type]?.tip || ""}`;
}

// =====================================================================
// Atores, propriedades e lista de variáveis
// =====================================================================
function selectSprite(sid) {
  if (sid === curSid) return;
  if (curSid) diffWorkspace();
  curSid = sid;
  loadWorkspace();
  renderTiles(); renderProps(); renderAssets(); renderVarList();
  $("#tabCostumes").textContent = sid === STAGE ? "Cenários" : "Fantasias";
  room?.presence({ sprite: sid, sel: null }).catch(() => {});
}
function thumb(c) {
  if (!c) return "";
  if (c.kind === "gen") { const b = backdropCanvas(c); return b ? b.toDataURL("image/png", .5) : ""; }
  return imageFor(c)?.src || "";
}
let peers = [];
function renderTiles() {
  const box = $("#tiles");
  box.innerHTML = spriteList().map(([id, s]) => {
    const cs = live(s.costumes), c = cs[s.costume || 0]?.[1] || cs[0]?.[1];
    const dots = peers.filter(p => !p.isMe && p.presence?.sprite === id).map(p => `<i style="background:${esc(p.presence.color || "#888")}"></i>`).join("");
    return `<button class="tile ${id === curSid ? "sel" : ""}" data-sid="${esc(id)}" title="${esc(s.name)}"><span class="dots">${dots}</span><img alt="" src="${esc(thumb(c))}"><span>${esc(s.name)}</span></button>`;
  }).join("") || `<p class="muted" style="grid-column:1/-1;margin:0">Nenhum ator ainda. Adicione um da biblioteca, pinte o seu ou <button class="btn small primary" id="starterBtn">comece com o Faísca</button></p>`;
  $("#starterBtn")?.addEventListener("click", () => loadProjectData(starterData(), true));
  const bd = live(project.meta.backdrops)[rt.backdrop]?.[1];
  const dots = peers.filter(p => !p.isMe && p.presence?.sprite === STAGE).map(p => `<i style="background:${esc(p.presence.color || "#888")}"></i>`).join("");
  const n = live(project.meta.backdrops).length;
  $("#stageTile").innerHTML = `<button class="tile ${curSid === STAGE ? "sel" : ""}" data-sid="${STAGE}" title="Editar os scripts e cenários do palco"><span class="dots">${dots}</span><img alt="" src="${esc(thumb(bd))}"><span>${esc(bd?.name || "sem cenário")}</span></button>
    <span class="muted" style="font-size:.78rem">${n} cenário${n === 1 ? "" : "s"}</span>
    <button class="btn small" id="pickBackdrop">Trocar cenário</button>`;
  $("#pickBackdrop").onclick = () => { selectSprite(STAGE); document.querySelector('[data-tab="costumes"]').click(); };
}
document.addEventListener("click", e => { const t = e.target.closest(".tile[data-sid]"); if (t) selectSprite(t.dataset.sid); });
function renderProps() {
  const box = $("#spriteProps");
  if (curSid === STAGE || !curDoc()) {
    $("#selTitle").textContent = "Palco";
    box.innerHTML = `<p class="muted" style="margin:0;grid-column:1/-1">O palco é o fundo do jogo. Ele tem scripts (por exemplo, trocar de cenário ou tocar música), cenários e sons, mas não se move. Use as abas <b>Código</b>, <b>Cenários</b> e <b>Sons</b> à esquerda.</p>`;
    return;
  }
  const d = curDoc(), t = rt.targets.find(x => x.sid === curSid && !x.clone);
  const dir = Math.round(t ? t.dir : d.dir ?? 90), size = Math.round(t ? t.size : d.size ?? 100);
  $("#selTitle").textContent = d.name;
  box.innerHTML = `<label class="prop wide"><span>Nome</span><input id="pName" value="${esc(d.name)}" maxlength="30"></label>
    <label class="prop"><span>Posição x</span><input id="pX" type="number" value="${Math.round(t ? t.x : d.x)}"><small>← −240 · 240 →</small></label>
    <label class="prop"><span>Posição y</span><input id="pY" type="number" value="${Math.round(t ? t.y : d.y)}"><small>↓ −180 · 180 ↑</small></label>
    <label class="prop wide"><span>Tamanho (%)</span><span class="inline"><input type="range" id="pSizeR" min="5" max="300" value="${Math.min(300, size)}" aria-label="Tamanho"><input id="pSize" type="number" value="${size}" aria-label="Tamanho em porcentagem"></span></label>
    <label class="prop"><span>Direção</span><span class="inline"><span class="dir-dial" aria-hidden="true"><i style="transform:rotate(${dir + 180}deg)"></i></span><input id="pDir" type="number" value="${dir}" aria-label="Direção em graus"></span><small>90 = direita</small></label>
    <label class="prop"><span>Ao girar</span><select id="pRot">${STATIC.rot.map(([n, v]) => `<option value="${v}" ${(d.rot || "all") === v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <div class="toggles"><label><input type="checkbox" id="pVis" ${d.visible !== false ? "checked" : ""}> Aparece no palco</label><label><input type="checkbox" id="pDrag" ${d.draggable ? "checked" : ""}> Quem joga pode arrastar</label></div>
    <div class="prop-actions"><button class="btn small" id="pDup">Duplicar ator</button><button class="btn small danger" id="pDel">Apagar ator</button><span class="muted" style="font-size:.78rem">Dica: arraste o ator no palco para mudar a posição.</span></div>`;
  const upd = (k, f, ev = "change") => $("#" + k).addEventListener(ev, e => {
    const val = f(e.target); updateSprite(curSid, val);
    const tt = rt.targets.find(x => x.sid === curSid && !x.clone);
    if (tt) { if ("x" in val) tt.x = val.x; if ("y" in val) tt.y = val.y; if ("size" in val) tt.size = clampSize(tt, val.size); if ("dir" in val) turn(tt, val.dir); if ("visible" in val) tt.visible = val.visible; if ("rot" in val) tt.rot = val.rot; if ("draggable" in val) tt.draggable = val.draggable; }
    if ("size" in val) { $("#pSize").value = val.size; $("#pSizeR").value = Math.min(300, val.size); }
    if ("dir" in val) document.querySelector(".dir-dial i").style.transform = `rotate(${val.dir + 180}deg)`;
    renderTiles(); rt.redraw = true;
  });
  upd("pX", el => ({ x: num(el.value) })); upd("pY", el => ({ y: num(el.value) })); upd("pSize", el => ({ size: num(el.value) })); upd("pDir", el => ({ dir: num(el.value) }));
  upd("pSizeR", el => ({ size: num(el.value) }), "input");
  upd("pVis", el => ({ visible: el.checked })); upd("pRot", el => ({ rot: el.value })); upd("pDrag", el => ({ draggable: el.checked }));
  $("#pName").addEventListener("change", e => renameSprite(curSid, e.target.value));
  $("#pDel").onclick = () => confirmBox(`Apagar o ator “${d.name}” e todos os scripts dele? Isso também apaga para a sua equipe.`, "Apagar ator", () => deleteSprite(curSid));
  $("#pDup").onclick = () => duplicateSprite(curSid);
}
// Mantém os campos do ator iguais ao que está no palco (a não ser que a pessoa esteja digitando neles)
setInterval(() => {
  const t = rt.targets.find(x => x.sid === curSid && !x.clone); if (!t) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el && document.activeElement !== el && el.value !== String(v)) el.value = v; };
  set("pX", Math.round(t.x)); set("pY", Math.round(t.y)); set("pDir", Math.round(t.dir)); set("pSize", Math.round(t.size)); set("pSizeR", Math.min(300, Math.round(t.size)));
  const dial = document.querySelector(".dir-dial i"); if (dial) dial.style.transform = `rotate(${Math.round(t.dir) + 180}deg)`;
}, 250);
function renderVarList() {
  const box = $("#varList");
  const items = [...live(project.meta.vars).map(([id, v]) => [STAGE, "vars", id, v.name, v.shown]), ...live(project.meta.lists).map(([id, v]) => [STAGE, "lists", id, v.name + " (lista)", v.shown])];
  if (curDoc()) items.push(...live(curDoc().vars).map(([id, v]) => [curSid, "vars", id, v.name + " (deste ator)", v.shown]), ...live(curDoc().lists).map(([id, v]) => [curSid, "lists", id, v.name + " (lista deste ator)", v.shown]));
  $("#varSection").hidden = !items.length;
  box.innerHTML = items.length ? `<span class="muted" style="width:100%;font-size:.8rem">Marque para mostrar o valor no palco. Arraste o mostrador para mudar o lugar; clique duas vezes para aumentar.</span>` + items.map(([w, k, id, n, sh]) => `<label><input type="checkbox" data-w="${esc(w)}" data-k="${k}" data-id="${esc(id)}" ${sh ? "checked" : ""}> ${esc(n)}</label>`).join("") : "";
  box.querySelectorAll("input").forEach(i => i.onchange = () => { const patch = { [i.dataset.k]: { [i.dataset.id]: { shown: i.checked } } }; i.dataset.w === STAGE ? updateMeta(patch) : updateSprite(i.dataset.w, patch); lastMonHTML = ""; renderMonitors(); });
}
function renameSprite(sid, name) {
  name = name.trim(); const d = project.sprites.get(sid); if (!name || !d || name === d.name) return;
  if (spriteList().some(([id, s]) => id !== sid && s.name === name)) { narrate("Já existe um ator com esse nome."); renderProps(); return; }
  const old = d.name; updateSprite(sid, { name });
  renameInScripts(null, ["TO", "OBJ", "OF", "SOLID"], old, name);
  renderTiles();
}
// Troca um valor de menu em todos os scripts (ex.: quando um ator ou fantasia muda de nome)
function renameInScripts(sidFilter, fields, oldV, newV) {
  for (const [id, s] of project.scripts) {
    if (sidFilter && s.sprite !== sidFilter) continue;
    let changed = false;
    const walk = b => { if (!b) return; for (const f of fields) if (b.fields?.[f] === oldV) { b.fields[f] = newV; changed = true; } for (const i in (b.inputs || {})) walk(b.inputs[i].block); walk(b.next?.block); };
    walk(s.block);
    if (changed) write("scripts/" + docId(id), "set", { sprite: s.sprite, block: s.block, t: Date.now() });
  }
  loadWorkspace();
}
function deleteSprite(sid) {
  updateSprite(sid, { deleted: true });
  for (const [id, s] of [...project.scripts]) if (s.sprite === sid) { project.scripts.delete(id); write("scripts/" + docId(id), "delete"); }
  rt.targets = rt.targets.filter(t => t.sid !== sid);
  curSid = null; selectSprite(spriteList()[0]?.[0] || STAGE); renderTiles();
}
function duplicateSprite(sid) {
  const d = project.sprites.get(sid); if (!d) return;
  const id = uid(), copy = JSON.parse(JSON.stringify(d));
  copy.name = uniqueName(d.name, spriteList().map(([, s]) => s.name)); copy.order = Date.now(); copy.x = (d.x || 0) + 20; copy.y = (d.y || 0) - 20;
  project.sprites.set(id, copy); write("sprites/" + id, "set", copy);
  for (const [, s] of [...project.scripts]) if (s.sprite === sid) {
    const json = remapIds(JSON.parse(JSON.stringify(s.block)));
    project.scripts.set(json.id, { sprite: id, block: json }); write("scripts/" + docId(json.id), "set", { sprite: id, block: json, t: Date.now() });
  }
  rtEnsure(id); selectSprite(id); renderTiles();
}

// =====================================================================
// Abas Fantasias/Cenários e Sons
// =====================================================================
let curTab = "code";
document.querySelectorAll("#editorCard .tabs [data-tab]").forEach(b => b.addEventListener("click", () => {
  curTab = b.dataset.tab;
  document.querySelectorAll("#editorCard .tabs [data-tab]").forEach(x => x.setAttribute("aria-selected", x === b));
  $("#paneCode").hidden = curTab !== "code"; $("#paneCostumes").hidden = curTab !== "costumes"; $("#paneSounds").hidden = curTab !== "sounds"; $("#paneText").hidden = curTab !== "text";
  if (curTab === "code") setTimeout(() => Blockly.svgResize(ws), 0); else { if (curTab === "text") diffWorkspace(); renderAssets(); }
}));
function renderAssets() { if (curTab === "costumes") renderCostumes(); else if (curTab === "sounds") renderSounds(); else if (curTab === "text") renderTextCode(); }
function renderCostumes() {
  const pane = $("#paneCostumes"), stage = curSid === STAGE, list = costumesOf(curSid);
  const t = stage ? null : rt.targets.find(x => x.sid === curSid && !x.clone);
  const curIdx = Math.min(list.length - 1, stage ? rt.backdrop : (t?.costume || 0));
  pane.innerHTML = `<div class="asset-list">${list.map(([id, c], i) => `<button class="asset ${i === curIdx ? "sel" : ""}" data-cid="${esc(id)}"><img alt="" src="${esc(thumb(c))}"><span>${i + 1}. ${esc(c.name)}</span></button>`).join("") || `<p class="muted">Sem ${stage ? "cenários" : "fantasias"}.</p>`}</div>
    <div class="asset-main">
      ${list[curIdx] ? `<div class="row"><label class="label" for="cName">Nome</label><input type="text" id="cName" value="${esc(list[curIdx][1].name)}" maxlength="30"><button class="btn small danger" id="cDel" ${list.length < 2 ? "disabled" : ""}>Apagar</button>${list[curIdx][1].kind !== "gen" ? `<button class="btn small" id="cEdit">✎ Editar desenho</button>` : ""}</div>` : ""}
      <div><span class="label">Adicionar ${stage ? "cenário" : "fantasia"}</span>
        <div class="row" style="margin:6px 0"><button class="btn small" id="cPaint">✎ Pintar novo</button><button class="btn small" id="cUpload">⇪ Enviar imagem</button></div>
        <div class="lib">${stage
          ? Object.entries(BACKDROP_GEN).map(([k, g]) => `<button data-addgen="${k}"><img alt="" src="${esc(backdropCanvas({ kind: "gen", ref: k }).toDataURL())}"><span>${esc(g.name)}</span></button>`).join("")
          : Object.entries(LIB).map(([k, l]) => `<button data-addlib="${k}"><img alt="" src="${esc(libSrc(k))}"><span>${esc(l.name)}</span></button>`).join("")}</div>
      </div>
    </div>`;
  pane.querySelectorAll("[data-cid]").forEach(b => b.onclick = () => {
    const i = list.findIndex(([id]) => id === b.dataset.cid);
    if (stage) { setBackdrop(i); updateMeta({ curBackdrop: list[i][0] }); } else { if (t) t.costume = i; updateSprite(curSid, { costume: i }); }
    rt.redraw = true; renderCostumes(); renderTiles();
  });
  $("#cName")?.addEventListener("change", e => {
    const name = e.target.value.trim(); if (!name) return; const [id, c] = list[curIdx]; const old = c.name;
    updateSprite(curSid, { [stage ? "backdrops" : "costumes"]: { [id]: { name } } });
    renameInScripts(stage ? null : curSid, stage ? ["BACKDROP"] : ["COSTUME"], old, name);
    renderCostumes();
  });
  if ($("#cDel")) $("#cDel").onclick = () => { const [id] = list[curIdx]; if (stage) { updateMeta({ backdrops: { [id]: { deleted: true } } }); rt.backdrop = 0; } else { updateSprite(curSid, { costumes: { [id]: { deleted: true } }, costume: 0 }); if (t) t.costume = 0; } renderCostumes(); renderTiles(); rt.redraw = true; };
  if ($("#cEdit")) $("#cEdit").onclick = () => openPaint(list[curIdx][1], url => replaceCostumeImage(list[curIdx][0], url));
  $("#cPaint").onclick = () => openPaint(null, url => addCostumeImage(url));
  $("#cUpload").onclick = () => pickFile("image/*", f => readImage(f, url => addCostumeImage(url)));
  pane.querySelectorAll("[data-addlib]").forEach(b => b.onclick = () => { const k = b.dataset.addlib; updateSprite(curSid, { costumes: { [uid()]: { name: uniqueName(LIB[k].name, list.map(([, c]) => c.name)), kind: "lib", ref: k, order: Date.now() } } }); refreshToolbox(); renderCostumes(); });
  pane.querySelectorAll("[data-addgen]").forEach(b => b.onclick = () => { const k = b.dataset.addgen; updateMeta({ backdrops: { [uid()]: { name: uniqueName(BACKDROP_GEN[k].name, list.map(([, c]) => c.name)), kind: "gen", ref: k, order: Date.now() } } }); refreshToolbox(); renderCostumes(); renderTiles(); });
}
function addCostumeImage(url) {
  const imgId = saveImage(url), stage = curSid === STAGE, taken = costumesOf(curSid).map(([, c]) => c.name);
  const c = { name: uniqueName(stage ? "cenário" : "fantasia", taken), kind: "img", ref: imgId, order: Date.now() };
  updateSprite(curSid, { [stage ? "backdrops" : "costumes"]: { [uid()]: c } });
  refreshToolbox(); renderCostumes(); renderTiles();
}
function replaceCostumeImage(cid, url) {
  const imgId = saveImage(url);
  updateSprite(curSid, { [curSid === STAGE ? "backdrops" : "costumes"]: { [cid]: { kind: "img", ref: imgId, cx: null, cy: null, res: 1 } } });
  bdCache.clear(); renderCostumes(); renderTiles(); rt.redraw = true;
}
let recorder = null;
function renderSounds() {
  const pane = $("#paneSounds"), list = soundsOf(curSid);
  pane.innerHTML = `<div class="asset-list">${list.map(([id, s]) => `<div class="asset"><button class="btn small" data-play="${esc(id)}" aria-label="Ouvir ${esc(s.name)}">▶</button><input type="text" data-sname="${esc(id)}" value="${esc(s.name)}" style="flex:1;min-width:0;border:0;background:transparent" aria-label="Nome do som"><button class="btn small danger" data-sdel="${esc(id)}" aria-label="Apagar som">×</button></div>`).join("") || `<p class="muted">Sem sons.</p>`}</div>
    <div class="asset-main">
      <div class="row"><button class="btn small" id="sRec">● Gravar</button><button class="btn small" id="sUp">⇪ Enviar som (mp3/wav)</button><span class="muted" id="sState"></span></div>
      <span class="label">Biblioteca de efeitos</span>
      <div class="lib">${Object.entries(SOUNDS).map(([k, s]) => `<div style="display:flex;flex-direction:column;gap:4px"><button data-try="${k}">♪ ${esc(s.name)}</button><button class="btn small" data-sadd="${k}">+ Adicionar</button></div>`).join("")}</div>
    </div>`;
  const add = s => { updateSprite(curSid, { sounds: { [uid()]: { ...s, name: uniqueName(s.name, list.map(([, x]) => x.name)), order: Date.now() } } }); refreshToolbox(); renderSounds(); };
  pane.querySelectorAll("[data-play]").forEach(b => b.onclick = () => { const s = list.find(([id]) => id === b.dataset.play); if (s) { const r = playSoundEntry(s[1]); if (r === null) setTimeout(() => playSoundEntry(s[1]), 400); } });
  pane.querySelectorAll("[data-try]").forEach(b => b.onclick = () => synthSound(b.dataset.try, outNode(), 1));
  pane.querySelectorAll("[data-sadd]").forEach(b => b.onclick = () => add({ name: SOUNDS[b.dataset.sadd].name, kind: "synth", ref: b.dataset.sadd }));
  pane.querySelectorAll("[data-sdel]").forEach(b => b.onclick = () => { updateSprite(curSid, { sounds: { [b.dataset.sdel]: { deleted: true } } }); renderSounds(); });
  pane.querySelectorAll("[data-sname]").forEach(i => i.onchange = () => { const old = list.find(([id]) => id === i.dataset.sname)?.[1].name; const name = i.value.trim(); if (!name || !old) return; updateSprite(curSid, { sounds: { [i.dataset.sname]: { name } } }); renameInScripts(curSid, ["SOUND"], old, name); refreshToolbox(); });
  $("#sUp").onclick = () => pickFile("audio/*", f => {
    if (f.size > 180000) { $("#sState").textContent = "Esse arquivo é grande demais (máximo de cerca de 180 KB). Use um som mais curto."; return; }
    const r = new FileReader(); r.onload = () => add({ name: f.name.replace(/\.[^.]+$/, "").slice(0, 30) || "som", kind: "audio", ref: saveMedia(r.result) }); r.readAsDataURL(f);
  });
  $("#sRec").onclick = async () => {
    if (recorder) { recorder.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = []; recorder = new MediaRecorder(stream, { audioBitsPerSecond: 32000 });
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(tr => tr.stop()); recorder = null;
        const blob = new Blob(chunks, { type: chunks[0]?.type || "audio/webm" });
        if (blob.size > 180000) { $("#sState").textContent = "A gravação ficou longa demais. Grave até uns 30 segundos."; renderSounds(); return; }
        const r = new FileReader(); r.onload = () => add({ name: "gravação", kind: "audio", ref: saveMedia(r.result) }); r.readAsDataURL(blob);
      };
      recorder.start(); $("#sRec").textContent = "■ Parar gravação"; $("#sState").textContent = "Gravando…";
      setTimeout(() => recorder?.stop(), 30000);
    } catch (_) { $("#sState").textContent = "O microfone não está disponível aqui. Envie um arquivo de som ou use a versão do site."; }
  };
}
