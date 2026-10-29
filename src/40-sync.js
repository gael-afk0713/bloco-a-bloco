// =====================================================================
// Sincronização dos scripts: um documento por script (pilha de blocos)
// =====================================================================
// IDs de bloco do Blockly têm símbolos que o banco não aceita: codifica com ~XX
const docId = id => id.replace(/[^A-Za-z0-9_\-.:@+]/g, c => "~" + c.charCodeAt(0).toString(16).padStart(2, "0"));
const fromDocId = d => d.replace(/~([0-9a-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const cache = new Map(); // id do topo -> JSON do que está no workspace
let applying = false, diffTimer = null;
const remoteQueue = [];
const saveBlock = b => Blockly.serialization.blocks.save(b, { addCoordinates: true });
function busyEditing() { return ws.isDragging() || Blockly.WidgetDiv.isVisible() || Blockly.DropDownDiv.isVisible(); }
function collectExtras(json) {
  const walk = b => {
    if (!b) return;
    for (const f in (b.fields || {})) { const src = SRCMAP[b.type + "." + f]; if (src) (EXTRA[src] || (EXTRA[src] = new Set())).add(b.fields[f]); }
    for (const i in (b.inputs || {})) { walk(b.inputs[i].block); walk(b.inputs[i].shadow); }
    walk(b.next?.block);
  };
  walk(json);
}
function blockIds(json, out = []) {
  if (!json) return out;
  out.push(json.id);
  for (const i in (json.inputs || {})) { blockIds(json.inputs[i].block, out); blockIds(json.inputs[i].shadow, out); }
  blockIds(json.next?.block, out);
  return out;
}
function knownTypes(json) {
  let ok = true;
  const walk = b => { if (!b || !ok) return; if (!Blockly.Blocks[b.type]) { ok = false; return; } for (const i in (b.inputs || {})) { walk(b.inputs[i].block); walk(b.inputs[i].shadow); } walk(b.next?.block); };
  walk(json); return ok;
}
function loadWorkspace() {
  applying = true;
  Blockly.Events.disable();
  try {
    ws.clear(); cache.clear(); ws.clearUndo();
    for (const [id, s] of project.scripts) {
      if (s.sprite !== curSid || !s.block || !knownTypes(s.block)) continue;
      collectExtras(s.block);
      try { Blockly.serialization.blocks.append(s.block, ws); cache.set(id, JSON.stringify(s.block)); } catch (e) { console.warn("script inválido", id, e); }
    }
  } finally { Blockly.Events.enable(); applying = false; }
  ws.updateToolbox(buildToolbox());
  refreshPeerHighlights();
}
// Clicar ou arrastar um bloco da paleta também mostra a explicação dele
function hookFlyoutHelp() {
  const fw = ws.getFlyout?.()?.getWorkspace?.() || ws.getToolbox?.()?.getFlyout?.()?.getWorkspace?.();
  if (!fw || fw.__babHelp) return;
  fw.__babHelp = true;
  fw.addChangeListener(e => { const id = e.blockId || e.newElementId; if (id && (e.type === Blockly.Events.CLICK || e.type === Blockly.Events.SELECTED)) { const b = fw.getBlockById(id); showBlockHelp((b?.getRootBlock?.() || b)?.type); } });
}
hookFlyoutHelp(); setTimeout(hookFlyoutHelp, 500);
// O Blockly cria uma cópia a cada clique na paleta; aqui o clique só explica o bloco e só arrastar cria
const blocklyBlockClick = Blockly.Gesture.prototype.doBlockClick;
Blockly.Gesture.prototype.doBlockClick = function () {
  if (this.flyout?.autoClose && this.targetBlock) { showBlockHelp((this.targetBlock.getRootBlock?.() || this.targetBlock).type); return; }
  return blocklyBlockClick.call(this);
};
// Na área de código, a ajuda mostra o bloco com os valores escolhidos (“quando a tecla seta para a direita…”)
function helpFor(b) {
  if (!b) return;
  let label = null; try { label = b.toString(90, "…").replace(/\s+/g, " ").trim(); } catch (_) {}
  showBlockHelp(b.type, null, label);
}
// Clicar fora da área de código fecha o número em edição (e a paleta aberta)
document.addEventListener("pointerdown", e => {
  if (!e.target.closest?.("#blocklyDiv, .blocklyWidgetDiv, .blocklyDropDownDiv, .blocklyTooltipDiv")) try { ws.hideChaff(false); } catch (_) {}
}, true);
// Paleta aberta em cima dos scripts: empurra a área de código para a direita, se couber
ws.addChangeListener(e => {
  if (e.type !== Blockly.Events.TOOLBOX_ITEM_SELECT || !e.newItem) return;
  setTimeout(() => {
    const fo = ws.getToolbox()?.getFlyout?.(); if (!fo?.isVisible?.()) return;
    const fr = fo.getWorkspace().getParentSvg().getBoundingClientRect(), area = $("#blocklyDiv").getBoundingClientRect();
    const tops = ws.getTopBlocks(false).map(b => b.getSvgRoot().getBoundingClientRect()).filter(r => r.bottom > area.top && r.top < area.bottom);
    if (!tops.length) return;
    const left = Math.min(...tops.map(r => r.left));
    if (left < fr.right + 12 && area.right - fr.right > 150) ws.scroll(ws.scrollX + (fr.right + 16 - left), ws.scrollY);
  }, 30);
});
let lastPointer = { x: 0, y: 0 };
$("#blocklyDiv").addEventListener("pointerdown", e => { lastPointer = { x: e.clientX, y: e.clientY }; }, true);
ws.addChangeListener(e => {
  if (applying) return;
  if (e.type === Blockly.Events.SELECTED) { room?.presence({ sel: e.newElementId || null }).catch(() => {}); if (e.newElementId) helpFor(ws.getBlockById(e.newElementId)); return; }
  if (e.type === Blockly.Events.CLICK && e.targetType === "block" && e.blockId) { helpFor(ws.getBlockById(e.blockId)); clickBlock(e.blockId); return; }
  if (e.type === Blockly.Events.BLOCK_CREATE && e.json?.type) { const nb = ws.getBlockById(e.blockId); nb ? helpFor(nb) : showBlockHelp(e.json.type); }
  if (e.type === Blockly.Events.BLOCK_CHANGE) { const sel = Blockly.common.getSelected?.(); if (sel?.getDescendants) setTimeout(() => helpFor(sel), 0); }
  if (e.isUiEvent) return;
  scheduleDiff();
});
const notScratch = new Map(); // id do bloco recém-criado -> tipos que não existem no Scratch
ws.addChangeListener(e => {
  if (applying) return;
  if (e.type === Blockly.Events.BLOCK_CREATE && e.json) {
    const bad = []; const walk = b => { if (!b) return; let f = "ok"; try { f = scratchFate(b.type); } catch (_) {} if (f !== "ok" && DEF[b.type]) bad.push([b.type, f]); for (const k in (b.inputs || {})) walk(b.inputs[k].block); walk(b.next?.block); };
    walk(e.json); if (bad.length) notScratch.set(e.blockId, bad);
  }
  if (e.type === Blockly.Events.BLOCK_DRAG && !e.isStart && notScratch.has(e.blockId)) {
    const bad = notScratch.get(e.blockId); notScratch.delete(e.blockId);
    const b = ws.getBlockById(e.blockId); if (b) setTimeout(() => scratchTip(b, bad), 60);
  }
});
function scratchTip(b, bad) {
  document.querySelector(".scratch-tip")?.remove();
  const [type, fate] = bad[0], box = b.getSvgRoot().getBoundingClientRect(), name = `“${blockLabel(type)}”`;
  const tip = document.createElement("div"); tip.className = "scratch-tip"; tip.setAttribute("role", "status");
  tip.innerHTML = `<strong>⚠ Atenção: ${esc(name)} ${fate === "fora" ? "não existe no Scratch" : "não existe igual no Scratch"}.</strong> ${fate === "fora" ? "Funciona aqui, mas se você exportar o projeto para o Scratch ele fica de fora." : `Ao exportar para o Scratch, ${esc(ADAPTED_TXT[type] || "vira um bloco parecido")}.`}`;
  tip.style.left = Math.max(8, Math.min(innerWidth - 300, box.left)) + "px"; tip.style.top = Math.min(innerHeight - 90, box.bottom + 8) + "px";
  document.body.append(tip); setTimeout(() => tip.remove(), 6000);
  addEventListener("scroll", () => tip.remove(), { once: true, capture: true });
  narrate(`${name} é um extra do Bloco a Bloco. ${fate === "fora" ? "No Scratch ele não existe: ao exportar, fica de fora." : "No Scratch ele vira outro bloco ao exportar."}`);
}
// Bloco solto pertinho de outro quase sempre é um encaixe que não pegou: avisa na hora
ws.addChangeListener(e => {
  if (applying || e.type !== Blockly.Events.BLOCK_DRAG || e.isStart) return;
  setTimeout(() => {
    const b = ws.getBlockById(e.blockId);
    if (!b || b.getParent() || !b.previousConnection || b.outputConnection) return;
    const r = b.getBoundingRectangle(), gap = 36;
    const near = ws.getTopBlocks(false).some(o => {
      if (o === b) return false;
      const q = o.getBoundingRectangle();
      return q.left - gap < r.right && r.left < q.right + gap && q.top - gap < r.bottom && r.top < q.bottom + gap;
    });
    if (near) looseTip(b);
  }, 30);
});
function looseTip(b) {
  document.querySelector(".loose-tip")?.remove();
  const root = b.getSvgRoot(), box = root.getBoundingClientRect();
  root.classList.add("bab-problem"); setTimeout(() => root.classList.remove("bab-problem"), 3000);
  const tip = document.createElement("div"); tip.className = "loose-tip"; tip.setAttribute("role", "status");
  tip.textContent = "Este bloco ficou solto! Arraste de novo e solte quando aparecer a sombra cinza: aí ele gruda.";
  tip.style.left = Math.max(8, Math.min(innerWidth - 268, box.left)) + "px"; tip.style.top = Math.min(innerHeight - 80, box.bottom + 8) + "px";
  document.body.append(tip); setTimeout(() => tip.remove(), 4500);
  addEventListener("scroll", () => tip.remove(), { once: true, capture: true });
  narrate("Um bloco ficou solto, sem encaixar. Blocos soltos não rodam: arraste até ele grudar no de cima.");
}
// Clicar num script roda (ou para) só ele; clicar num bloco de valor mostra o valor
function clickBlock(id) {
  const b = ws.getBlockById(id); if (!b) return;
  const root = b.getRootBlock();
  const t = curSid === STAGE ? rt.stage : rt.targets.find(x => x.sid === curSid && !x.clone);
  if (!t) return;
  if (root.outputConnection) {
    const json = saveBlock(root);
    let v; try { v = evalR(json, { target: t, frames: [], done: false }); } catch (err) { v = "erro"; }
    valueBubble(typeof v === "boolean" ? (v ? "verdadeiro" : "falso") : str(v));
    return;
  }
  const running = rt.threads.find(th => th.target === t && th.topId === root.id && !th.done);
  if (running) { running.done = true; narrate("Script parado."); return; }
  actx();
  startThread(t, saveBlock(root), root.id);
  narrate("Rodando só este script. Clique nele de novo para parar.");
}
function valueBubble(text) {
  document.querySelectorAll(".valbubble").forEach(e => e.remove());
  const d = document.createElement("div"); d.className = "valbubble"; d.textContent = text === "" ? "(vazio)" : text;
  d.style.left = Math.min(window.innerWidth - 120, lastPointer.x + 10) + "px"; d.style.top = Math.max(8, lastPointer.y - 44) + "px";
  document.body.append(d); setTimeout(() => d.remove(), 2600);
}
function scheduleDiff() { clearTimeout(diffTimer); diffTimer = setTimeout(diffWorkspace, 300); }
function diffWorkspace() {
  if (!curSid) return;
  if (busyEditing()) { scheduleDiff(); return; }
  if (readOnly) return;
  const seen = new Set();
  for (const top of ws.getTopBlocks(false)) {
    if (top.isShadow()) continue;
    const json = saveBlock(top), s = JSON.stringify(json);
    seen.add(top.id);
    if (cache.get(top.id) !== s) {
      cache.set(top.id, s);
      project.scripts.set(top.id, { sprite: curSid, block: json });
      write("scripts/" + docId(top.id), "set", { sprite: curSid, block: json, t: Date.now() });
    }
  }
  for (const id of [...cache.keys()]) if (!seen.has(id)) { cache.delete(id); project.scripts.delete(id); write("scripts/" + docId(id), "delete"); }
  updateLessons();
}
function onRemoteScripts(changes) {
  for (const ch of changes) {
    const id = fromDocId(ch.doc.id), d = ch.type === "removed" ? null : ch.doc.data();
    if (isPending("scripts/" + ch.doc.id)) continue; // uma escrita minha está a caminho
    const prev = project.scripts.get(id);
    if (!d || !d.block) project.scripts.delete(id); else project.scripts.set(id, { sprite: d.sprite, block: d.block });
    if ((d && d.sprite === curSid) || (prev && prev.sprite === curSid)) remoteQueue.push({ id, d: d && d.sprite === curSid ? d : null });
  }
  applyRemote();
  updateLessons();
}
function applyRemote() {
  if (!remoteQueue.length) return;
  if (busyEditing()) { setTimeout(applyRemote, 250); return; }
  // Salva antes o que eu mudei e ainda não foi salvo; senão o cache abaixo marcaria como salvo
  clearTimeout(diffTimer); diffWorkspace();
  applying = true;
  Blockly.Events.disable();
  try {
    for (const { id, d } of remoteQueue.splice(0)) {
      const sNew = d ? JSON.stringify(d.block) : null;
      if (sNew && cache.get(id) === sNew) continue;
      const ex = ws.getBlockById(id); if (ex) ex.dispose(false);
      if (d && d.block && knownTypes(d.block)) {
        for (const bid of blockIds(d.block)) { const b = ws.getBlockById(bid); if (b) b.dispose(true); }
        collectExtras(d.block);
        try { Blockly.serialization.blocks.append(d.block, ws); } catch (e) { console.warn(e); }
        cache.set(id, sNew);
      } else cache.delete(id);
    }
    for (const top of ws.getTopBlocks(false)) cache.set(top.id, JSON.stringify(saveBlock(top)));
  } finally { Blockly.Events.enable(); applying = false; }
  refreshPeerHighlights();
}

// Brilho nos scripts que estão rodando (como no Scratch)
let glowing = new Set();
function updateGlow() {
  const active = new Set();
  for (const th of rt.threads) if (!th.done && th.target.sid === curSid) active.add(th.topId);
  for (const id of glowing) if (!active.has(id)) ws.getBlockById(id)?.getSvgRoot?.()?.classList.remove("bab-running");
  for (const id of active) if (!glowing.has(id)) ws.getBlockById(id)?.getSvgRoot?.()?.classList.add("bab-running");
  glowing = active;
}

// ---------- Botões da caixa de ferramentas ----------
ws.registerButtonCallback("NEW_VAR", () => askName("Nova variável", "Nome da variável", "pontos", true, (name, local) => createVar(name, local)));
ws.registerButtonCallback("NEW_LIST", () => askName("Nova lista", "Nome da lista", "itens", true, (name, local) => createList(name, local)));
ws.registerButtonCallback("NEW_MSG", () => askName("Nova mensagem", "Nome da mensagem", "começar", false, name => createMsg(name)));
ws.registerButtonCallback("NEW_PROC", () => openProcMaker());
ws.registerButtonCallback("LEVEL_UP", () => { setLevel({ 1: 2, 2: 3, 3: 0 }[curLevel().n] ?? 0); });
function allVarNames() { return [...live(project.meta.vars).map(([, v]) => v.name), ...spriteList().flatMap(([, s]) => live(s.vars).map(([, v]) => v.name))]; }
function createVar(name, local) {
  name = name.trim(); if (!name) return;
  if (allVarNames().includes(name)) { narrate(`Já existe uma variável chamada “${name}”.`); return; }
  const id = uid(), v = { name, value: 0, order: Date.now(), shown: true };
  if (local && curDoc()) { updateSprite(curSid, { vars: { [id]: v } }); rt.targets.filter(t => t.sid === curSid).forEach(t => t.vars.set(name, 0)); }
  else { updateMeta({ vars: { [id]: v } }); rt.vars.set(name, 0); }
  refreshToolbox("Variáveis"); renderMonitors(); renderVarList();
  narrate(`Variável “${name}” criada. Use “definir … como” para guardar um valor e “adicionar … a” para somar.`);
}
function createList(name, local) {
  name = name.trim(); if (!name) return;
  const id = uid(), v = { name, items: [], order: Date.now(), shown: true };
  if (local && curDoc()) { updateSprite(curSid, { lists: { [id]: v } }); rt.targets.filter(t => t.sid === curSid).forEach(t => t.lists.set(name, [])); }
  else { updateMeta({ lists: { [id]: v } }); rt.lists.set(name, []); }
  refreshToolbox("Listas"); renderMonitors(); renderVarList();
}
function createMsg(name) {
  name = name.trim(); if (!name) return;
  if (!live(project.meta.msgs).some(([, m]) => m.name === name)) updateMeta({ msgs: { [uid()]: { name, order: Date.now() } } });
  refreshToolbox("Eventos");
}
// Criador de blocos (Meus Blocos), no mesmo espírito do Scratch
function openProcMaker() {
  const spec = [{ k: "label", text: "meu bloco" }];
  modal(`<h2>Criar um bloco</h2>
    <p class="muted" style="margin:0">Dê um nome e acrescente entradas. Depois, monte o que o bloco faz embaixo de “definir”.</p>
    <div class="proc-preview" id="ppv"></div>
    <div class="row"><button class="btn small" id="ppNum">+ entrada (número ou texto)</button><button class="btn small" id="ppBool">+ entrada (condição)</button><button class="btn small" id="ppLbl">+ texto</button></div>
    <label class="row"><input type="checkbox" id="ppWarp"> Rodar sem atualizar a tela (muito rápido, bom para desenhos e cálculos)</label>
    <div class="row"><button class="btn primary" id="ppOk">Criar bloco</button><button class="btn" data-close>Cancelar</button></div>`, (m, close) => {
    const render = () => {
      $("#ppv").innerHTML = spec.map((p, i) => p.k === "label" ? `<input class="lbl" data-i="${i}" value="${esc(p.text)}" aria-label="Texto">` : `<input class="${p.k === "bool" ? "bool" : ""}" data-i="${i}" value="${esc(p.name)}" aria-label="Nome da entrada">`).join("");
      $("#ppv").querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => { const p = spec[+inp.dataset.i]; if (p.k === "label") p.text = inp.value; else p.name = inp.value; }));
    };
    const names = () => spec.filter(p => p.k !== "label").map(p => p.name);
    $("#ppNum").onclick = () => { spec.push({ k: "num", name: uniqueName("número", names()) }); render(); };
    $("#ppBool").onclick = () => { spec.push({ k: "bool", name: uniqueName("condição", names()) }); render(); };
    $("#ppLbl").onclick = () => { spec.push({ k: "label", text: "texto" }); render(); };
    $("#ppOk").onclick = () => {
      const clean = spec.map(p => p.k === "label" ? { k: "label", text: p.text.trim() } : { k: p.k, name: p.name.trim() || "entrada" }).filter(p => p.k !== "label" || p.text);
      if (!clean.length) return;
      close(); createProc(clean, $("#ppWarp")?.checked);
    };
    render();
  });
}
function createProc(spec, warp) {
  const pid = uid(), p = { spec, warp: !!warp, order: Date.now() };
  updateSprite(curSid, { procs: { [pid]: p } });
  registerProc(pid, p);
  // Coloca o bloco “definir” na área de código, como no Scratch
  const m = ws.getMetrics();
  const json = { type: "pd_" + pid, x: Math.round((m.viewLeft + 60) / ws.scale), y: Math.round((m.viewTop + 60) / ws.scale) };
  Blockly.serialization.blocks.append(json, ws);
  refreshToolbox();
  narrate("Bloco criado! Monte embaixo de “definir” o que ele faz. Ele aparece em Meus Blocos para você usar.");
}

// ---------- Menu de contexto ----------
Blockly.ContextMenuRegistry.registry.register({
  id: "bab_explicar", scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK, weight: -2,
  displayText: () => "Explicar este script (tutor)",
  preconditionFn: scope => sample && !scope.block.isInFlyout ? "enabled" : "hidden",
  callback: scope => { const root = scope.block.getRootBlock(); openHelp("tutor"); askTutor(`Explique, passo a passo e em palavras simples, o que este script faz:\n\n${scriptText(saveBlock(root))}`); },
});
Blockly.ContextMenuRegistry.registry.register({
  id: "bab_copiar_ator", scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK, weight: -1,
  displayText: () => "Copiar este script para outro ator…",
  preconditionFn: scope => spriteList().length > 0 && !scope.block.isInFlyout ? "enabled" : "hidden",
  callback: scope => copyScriptTo(saveBlock(scope.block.getRootBlock())),
});
// “Duplicar” copia o bloco e tudo o que está embaixo dele (como no Scratch), não só o bloco
Blockly.ContextMenuRegistry.registry.unregister("blockDuplicate");
Blockly.ContextMenuRegistry.registry.register({
  id: "blockDuplicate", scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK, weight: 1,
  displayText: scope => scope.block.getNextBlock() ? "Duplicar (com os blocos de baixo)" : "Duplicar",
  preconditionFn: scope => scope.block.isDeletable() && scope.block.isMovable() && !scope.block.isInFlyout ? "enabled" : "hidden",
  callback: scope => {
    const json = Blockly.serialization.blocks.save(scope.block, { addNextBlocks: true, saveIds: false });
    const xy = scope.block.getRelativeToSurfaceXY(), h = scope.block.getHeightWidth().height; json.x = xy.x; json.y = xy.y + h + 28;
    let copy; Blockly.Events.setGroup(true); try { copy = Blockly.serialization.blocks.append(json, ws, { recordUndo: true }); } finally { Blockly.Events.setGroup(false); }
    if (copy) { Blockly.common.setSelected(copy); helpFor(copy); narrate("Duplicado: a cópia está logo embaixo. Se não queria, clique em ↶ Desfazer."); }
  },
});
function copyScriptTo(json) {
  const targets = [[STAGE, "Palco"], ...spriteList().filter(([id]) => id !== curSid).map(([id, s]) => [id, s.name])];
  modal(`<h2>Copiar script para…</h2><div class="lib">${targets.map(([id, n]) => `<button data-sid="${esc(id)}">${esc(n)}</button>`).join("")}</div><button class="btn" data-close>Cancelar</button>`, (m, close) => {
    m.querySelectorAll("[data-sid]").forEach(b => b.onclick = () => {
      const sid = b.dataset.sid, copy = remapIds(JSON.parse(JSON.stringify(json)));
      project.scripts.set(copy.id, { sprite: sid, block: copy }); write("scripts/" + docId(copy.id), "set", { sprite: sid, block: copy, t: Date.now() });
      close(); narrate("Script copiado.");
    });
  });
}
function remapIds(b) { if (!b) return b; b.id = uid() + uid(); for (const i in (b.inputs || {})) { remapIds(b.inputs[i].block); remapIds(b.inputs[i].shadow); } remapIds(b.next?.block); return b; }

// ---------- Texto legível de scripts (tutor e lições) ----------
function blockText(b) {
  if (!b) return "";
  if (b.type === "b_num") return String(b.fields?.NUM ?? "");
  if (b.type === "b_text") return String(b.fields?.TEXT ?? "");
  if (b.type === "b_color") return String(b.fields?.COLOR ?? "");
  const d = DEF[b.type]; if (!d) return b.type;
  const specs = d.args.map(s => s.split(":"));
  let i = 0;
  const lines = Array.isArray(d.lines) ? d.lines : [d.lines];
  return lines.map(line => line.replace(/%%/g, "\u0001").replace(/%\d/g, () => {
    const [k, name, src] = specs[i++] || [];
    if (k === "S") return "";
    if (k === "D") { const v = b.fields?.[name]; if (v === undefined || v === "") return "[…]"; const f = (STATIC[src] || []).find(o => o[1] === v); return `[${f ? f[0] : v}]`; }
    const inp = b.inputs?.[name], inner = inp?.block || inp?.shadow, t = blockText(inner);
    return k === "B" ? `<${t}>` : `(${t})`;
  }).replace(/\u0001/g, "%")).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
function scriptText(b, ind = "") {
  const out = [];
  for (let cur = b; cur; cur = cur.next?.block) {
    out.push(ind + blockText(cur));
    const d = DEF[cur.type];
    for (const sub of ["SUBSTACK", "SUBSTACK2"]) {
      if (!d?.args.some(a => a.startsWith("S:" + sub))) continue;
      if (sub === "SUBSTACK2") out.push(ind + "senão");
      out.push(cur.inputs?.[sub]?.block ? scriptText(cur.inputs[sub].block, ind + "    ") : ind + "    (vazio)");
    }
    if (d && (d.kind === "c" || cur.type === "ct_forever")) out.push(ind + "fim");
  }
  return out.join("\n");
}
function projectSummary() {
  const parts = [`Projeto: ${project.meta.title}`];
  const vars = allVarNames(); if (vars.length) parts.push("Variáveis: " + vars.join(", "));
  const msgs = live(project.meta.msgs).map(([, m]) => m.name); if (msgs.length) parts.push("Mensagens: " + msgs.join(", "));
  for (const [sid, name] of [[STAGE, "Palco"], ...spriteList().map(([id, s]) => [id, s.name])]) {
    const scripts = [...project.scripts.values()].filter(s => s.sprite === sid && s.block);
    parts.push(`\n== ${name} (${sid === STAGE ? "cenários" : "fantasias"}: ${costumesOf(sid).map(([, c]) => c.name).join(", ")}) ==`);
    scripts.forEach((s, i) => parts.push(`Script ${i + 1}:\n${scriptText(s.block)}`));
    if (!scripts.length) parts.push("(sem scripts)");
  }
  return parts.join("\n").slice(0, 14000);
}
