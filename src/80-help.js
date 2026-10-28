// =====================================================================
// Controles do palco
// =====================================================================
$("#flagBtn").onclick = () => { actx(); greenFlag(); };
$("#stopBtn").onclick = () => stopAll();
$("#stepBtn").onclick = () => { stepToken++; };
$("#speedSel").onchange = () => { if ($("#speedSel").value === "normal") { ws.highlightBlock(null); $("#stepBtn").hidden = true; } };
$("#turboChk").onchange = e => { rt.turbo = e.target.checked; };
$("#simpleChk").onchange = () => { ws.updateToolbox(buildToolbox()); try { localStorage.setItem("bab-simples", $("#simpleChk").checked ? "1" : "0"); } catch (_) {} };
$("#tipsChk").onchange = () => { ws.updateToolbox(buildToolbox()); try { localStorage.setItem("bab-dicas", $("#tipsChk").checked ? "1" : "0"); } catch (_) {} };
$("#projTitle").addEventListener("change", e => updateMeta({ title: e.target.value.trim() || "Meu projeto" }));
$("#playerBtn").onclick = () => { document.body.classList.toggle("player"); $("#playerBtn").classList.toggle("on", document.body.classList.contains("player")); lastMonHTML = ""; setTimeout(() => { Blockly.svgResize(ws); renderMonitors(); }, 50); };
$("#fullBtn").onclick = () => { const el = $("#stageBox"); (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => { document.body.classList.add("player"); $("#playerBtn").classList.add("on"); narrate("Tela cheia não está disponível aqui; abri o modo jogador."); }); };
document.addEventListener("fullscreenchange", () => { lastMonHTML = ""; setTimeout(renderMonitors, 50); });

// =====================================================================
// Lições guiadas (cada passo é conferido automaticamente)
// =====================================================================
const scriptsAll = () => [...project.scripts.values()].filter(s => s.block);
function findType(b, type) { if (!b) return false; if (b.type === type || (type.endsWith("*") && b.type.startsWith(type.slice(0, -1)))) return true; for (const i in (b.inputs || {})) if (findType(b.inputs[i].block, type)) return true; return findType(b.next?.block, type); }
const has = type => scriptsAll().some(s => findType(s.block, type));
const inside = (outer, inner) => scriptsAll().some(s => { const walk = b => { if (!b) return false; if (b.type === outer && (findType(b.inputs?.SUBSTACK?.block, inner) || findType(b.inputs?.SUBSTACK2?.block, inner))) return true; for (const i in (b.inputs || {})) if (walk(b.inputs[i].block)) return true; return walk(b.next?.block); }; return walk(s.block); });
const underHat = (hat, type) => scriptsAll().some(s => s.block.type === hat && findType(s.block.next?.block, type));
const spriteWith = ref => spriteList().some(([, s]) => live(s.costumes).some(([, c]) => c.ref === ref));
const LESSONS = [
  { title: "1. Primeiros passos", intro: "Todo programa começa com um evento. O mais comum é a bandeira ▶.", steps: [
    ["Arraste “quando ▶ for clicado” (Eventos) para a área de código.", () => has("ev_flag")],
    ["Encaixe “mover 10 passos” (Movimento) embaixo dele.", () => underHat("ev_flag", "mv_move")],
    ["Encaixe “dizer Olá! por 2 segundos” (Aparência) também.", () => underHat("ev_flag", "lk_sayfor")],
    ["Clique em ▶. Depois experimente o modo “Devagar”.", () => lessonRan.flag]] },
  { title: "2. Andar para sempre", intro: "Laços repetem blocos. “sempre” repete até você clicar em ■.", steps: [
    ["Coloque “sempre” (Controle) embaixo de “quando ▶ for clicado”.", () => underHat("ev_flag", "ct_forever")],
    ["Dentro do “sempre”, coloque “mover 10 passos”.", () => inside("ct_forever", "mv_move")],
    ["Ainda dentro, coloque “se tocar na borda, volte”.", () => inside("ct_forever", "mv_bounce")],
    ["Para não ficar de cabeça para baixo: “definir estilo de rotação esquerda-direita”.", () => has("mv_rotstyle")]] },
  { title: "3. Animação", intro: "Trocar de fantasia rapidinho dá a sensação de movimento.", steps: [
    ["Dentro de um “sempre”, use “próxima fantasia”.", () => inside("ct_forever", "lk_nextcostume")],
    ["Coloque “esperar 0.2 segundos” no mesmo laço para não ficar rápido demais.", () => inside("ct_forever", "ct_wait")]] },
  { title: "4. Controle pelo teclado", intro: "Jogos reagem às teclas. Há dois jeitos: um script por tecla, ou um “sempre” que pergunta qual tecla está apertada.", steps: [
    ["Use “quando a tecla seta para a direita for pressionada” com “mudar x por 10”.", () => underHat("ev_key", "mv_changex")],
    ["Jeito profissional: “sempre” com “se tecla seta para a esquerda pressionada? então”.", () => inside("ct_forever", "ct_if") && has("sn_keypressed")],
    ["Clique no palco e aperte as setas.", () => lessonRan.key || (lessonRan.flag && has("sn_keypressed"))]] },
  { title: "5. Placar com variável", intro: "Variáveis são caixas com nome que guardam números ou textos.", steps: [
    ["Em Variáveis, clique em “Criar uma variável” e chame de pontos.", () => allVarNames().length > 0],
    ["No ▶, use “definir pontos como 0”.", () => underHat("ev_flag", "var_set")],
    ["Use “adicionar 1 a pontos” em algum momento do jogo.", () => has("var_change")]] },
  { title: "6. Jogo: pegue a estrela", intro: "Vamos juntar tudo num jogo de verdade. Ótimo para fazer em dupla: cada um cuida de um ator!", steps: [
    ["Adicione o ator Estrela (+ Ator da biblioteca).", () => spriteWith("estrela")],
    ["Na Estrela: “sempre” com “se tocando em Faísca? então”.", () => inside("ct_forever", "ct_if") && has("sn_touching")],
    ["Dentro do “se”: “adicionar 1 a pontos” e “ir para posição aleatória”.", () => inside("ct_if", "var_change") && inside("ct_if", "mv_goto")],
    ["Faça o Faísca andar com as setas e jogue!", () => (lessonRan.key || has("sn_keypressed")) && has("sn_touching")]] },
  { title: "7. Meus Blocos", intro: "Crie seus próprios blocos para não repetir código. Ex.: um bloco “pular”.", steps: [
    ["Em Meus Blocos, clique em “Criar um bloco”.", () => scriptsAll().some(s => s.block.type.startsWith("pd_"))],
    ["Embaixo do “definir”, monte o que o bloco faz.", () => scriptsAll().some(s => s.block.type.startsWith("pd_") && s.block.next)],
    ["Use o seu bloco em outro script.", () => has("pc_*")]] },
  { title: "8. Jogo de plataforma", intro: "O Jogo+ tem física pronta: gravidade, pulo e chão. É um extra do Bloco a Bloco.", steps: [
    ["Adicione o ator Chão e coloque-o embaixo do palco (y perto de -160).", () => spriteWith("chao")],
    ["No Faísca: “sempre” com “mover com física, parando em Chão”.", () => inside("ct_forever", "jg_step")],
    ["Pulo: “se tecla espaço pressionada? e no chão? então definir velocidade y como 12”.", () => has("jg_onground") && has("jg_setvy")],
    ["Andar: setas mudam “velocidade x” (ou use “mudar x por”).", () => has("jg_setvx") || has("jg_changevx") || has("mv_changex")]] },
  { title: "9. Clones", intro: "Clones são cópias que nascem durante o jogo, como chuva de moedas.", steps: [
    ["Use “criar clone de eu mesmo” dentro de um “repetir” ou “sempre”.", () => inside("ct_repeat", "ct_clone") || inside("ct_forever", "ct_clone")],
    ["Use “quando eu começar como clone” para dar comportamento a cada cópia.", () => has("ct_startclone")],
    ["No fim da vida do clone, use “apagar este clone”.", () => has("ct_deleteclone")]] },
  { title: "10. Mensagens e fases", intro: "Atores conversam transmitindo mensagens. Assim você cria fases, menus e telas de fim de jogo.", steps: [
    ["Em Eventos, crie uma mensagem (ex.: “fim de jogo”) e use “transmitir”.", () => has("ev_broadcast") || has("ev_broadcastwait")],
    ["Em outro ator ou no palco, use “quando eu receber”.", () => has("ev_receive")],
    ["Troque de cenário quando a fase mudar.", () => has("lk_backdrop") || has("lk_nextbackdrop")]] },
];
let lessonIdx = 0; try { lessonIdx = Math.min(LESSONS.length - 1, +localStorage.getItem("bab-licao") || 0); } catch (_) {}
let lessonTimer = null;
function updateLessons() { clearTimeout(lessonTimer); lessonTimer = setTimeout(renderLesson, 120); }
function renderLesson() {
  const L = LESSONS[lessonIdx];
  const res = L.steps.map(([, f]) => { try { return !!f(); } catch (_) { return false; } });
  const done = res.every(Boolean);
  $("#helpLesson").innerHTML = `<div class="lesson"><span class="label">Lição ${lessonIdx + 1} de ${LESSONS.length}</span><h3>${esc(L.title.replace(/^\d+\.\s*/, ""))}</h3><p class="muted" style="margin:0">${esc(L.intro)}</p>
    <ol>${L.steps.map(([t], i) => `<li class="${res[i] ? "ok" : ""}"><span class="ck">${res[i] ? "✓" : i + 1}</span><span>${esc(t)}</span></li>`).join("")}</ol>
    ${done ? `<p style="margin:0 0 8px"><strong>Lição completa!</strong> ${lessonIdx < LESSONS.length - 1 ? "Siga para a próxima quando quiser." : "Agora é com você: crie o que quiser."}</p>` : ""}
    <div class="lesson-nav"><button class="btn small" id="lPrev" ${lessonIdx === 0 ? "disabled" : ""} aria-label="Lição anterior">◂</button>
      <select id="lSel" aria-label="Escolher lição">${LESSONS.map((l, i) => `<option value="${i}" ${i === lessonIdx ? "selected" : ""}>${esc(l.title)}</option>`).join("")}</select>
      <button class="btn small ${done ? "primary" : ""}" id="lNext" ${lessonIdx === LESSONS.length - 1 ? "disabled" : ""} aria-label="Próxima lição">▸</button></div></div>`;
  const go = i => { lessonIdx = Math.max(0, Math.min(LESSONS.length - 1, i)); try { localStorage.setItem("bab-licao", lessonIdx); } catch (_) {} renderLesson(); };
  $("#lPrev").onclick = () => go(lessonIdx - 1); $("#lNext").onclick = () => go(lessonIdx + 1); $("#lSel").onchange = e => go(+e.target.value);
}
function onRunEnded() { renderMonitors(); updateLessons(); }

// =====================================================================
// Ajuda: tutor (Claude), conversa da equipe e console
// =====================================================================
function openHelp(which) {
  document.querySelectorAll("[data-help]").forEach(b => b.setAttribute("aria-selected", b.dataset.help === which));
  ["lesson", "tutor", "chat", "console"].forEach(k => { $("#help" + k[0].toUpperCase() + k.slice(1)).hidden = which !== k; });
  if (which === "chat") { unread = 0; $("#chatTab").textContent = "Conversa"; }
  if (which === "console") { unreadLog = 0; $("#consoleTab").textContent = "Console"; }
}
document.querySelectorAll("[data-help]").forEach(b => b.addEventListener("click", () => openHelp(b.dataset.help)));
function addMsg(box, who, text, me) { const d = document.createElement("div"); d.className = "msg" + (me ? " me" : ""); const s = document.createElement("small"); s.textContent = who; d.append(s, document.createTextNode(text)); $(box).append(d); $(box).parentElement.scrollTop = 1e9; return d; }
let tutorBusy = false; const tutorHistory = [];
async function askTutor(q) {
  if (!sample) { addMsg("#tutorLog", "Tutor", "O tutor funciona quando o Bloco a Bloco está aberto dentro do Claude, com a sua conta. No site, use as Lições e o modo Devagar.", false); return; }
  if (tutorBusy || !q.trim()) return;
  tutorBusy = true; $("#tutorAsk").disabled = true; $("#tutorState").textContent = "Pensando…";
  addMsg("#tutorLog", "Você", q, true);
  const out = addMsg("#tutorLog", "Tutor", "…", false);
  const sys = "Você é um tutor de programação paciente para iniciantes (inclusive crianças) que usam o Bloco a Bloco, um ambiente de blocos muito parecido com o Scratch, em português do Brasil. Responda em português simples e curto (no máximo 8 frases ou uma lista curta), com os nomes dos blocos exatamente entre aspas (ex.: “mover 10 passos”, “quando ▶ for clicado”, “se … então”). Prefira guiar com dicas e perguntas a dar a resposta pronta, a não ser que a pessoa peça. Não escreva código em texto; use só blocos. Categorias: Movimento, Aparência, Som, Eventos, Controle, Sensores, Operadores, Variáveis, Listas, Meus Blocos, Caneta, Música, Fala e Jogo+ (física com gravidade, velocidade x/y, “mover com física”, “no chão?”, salvar recorde, console).";
  const ctx = `PROJETO ATUAL (para contexto):\n${projectSummary()}\n\nATOR EM EDIÇÃO: ${curSid === STAGE ? "Palco" : (curDoc()?.name || "")}`;
  try {
    const r = await sample([...tutorHistory.slice(-6), { role: "user", content: `${sys}\n\n${ctx}\n\nPERGUNTA: ${q}` }], { onText: ({ text }) => { out.lastChild.textContent = text; }, cache: false, modelTier: "quick" });
    out.lastChild.textContent = r.text;
    tutorHistory.push({ role: "user", content: q }, { role: "assistant", content: r.text });
  } catch (e) {
    out.lastChild.textContent = e?.code === "rate_limited" ? "Muitas perguntas seguidas. Espere um pouquinho e tente de novo." : e?.code === "not_granted" ? "O tutor não foi liberado nesta página." : "Não consegui responder agora. Tente de novo em instantes.";
  }
  tutorBusy = false; $("#tutorAsk").disabled = false; $("#tutorState").textContent = "";
}
$("#tutorAsk").onclick = () => { const q = $("#tutorQ").value; $("#tutorQ").value = ""; askTutor(q); };
$("#tutorQ").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#tutorAsk").click(); } });
let unread = 0, unreadLog = 0;
$("#chatForm").addEventListener("submit", e => {
  e.preventDefault(); const t = $("#chatInput").value.trim(); if (!t || !room) return;
  room.emit("chat", { text: t.slice(0, 300) }).catch(() => addMsg("#chatLog", "Aviso", "Sua mensagem não foi enviada. Talvez você só tenha acesso de visualização.", false));
  $("#chatInput").value = "";
});
function logConsole(who, text) {
  const box = $("#consoleLog"), d = document.createElement("div"), s = document.createElement("small");
  s.textContent = `${(Math.round((now() - rt.timer0) / 100) / 10).toFixed(1)}s · ${who}: `; d.append(s, document.createTextNode(text));
  box.append(d); while (box.children.length > 300) box.firstChild.remove();
  $("#helpConsole").scrollTop = 1e9;
  if ($("#helpConsole").hidden) { unreadLog++; $("#consoleTab").textContent = `Console (${unreadLog})`; }
}
$("#consoleClear").onclick = () => { $("#consoleLog").textContent = ""; };

// =====================================================================
// Pessoas no projeto (presença)
// =====================================================================
let profiles = {};
async function renderPeople() {
  const box = $("#people");
  const viewers = peers.filter(p => p.kind === "viewer");
  const ids = [...new Set(viewers.map(p => p.by || p.presence?.uid).filter(Boolean))];
  if (user && ids.length) { try { profiles = await user.profiles(ids); } catch (_) {} }
  const seen = new Set(), list = viewers.filter(p => { const k = (p.by || p.peer) + (p.isMe ? "me" : ""); if (seen.has(k)) return false; seen.add(k); return true; });
  box.textContent = "";
  const chip = document.createElement("span"); chip.className = "mode-chip";
  chip.textContent = db?.local ? (IN_CLAUDE ? "Modo individual" : "Salvo neste navegador") : list.length > 1 ? `${list.length} pessoas no projeto` : "Projeto compartilhado";
  box.append(chip);
  for (const p of list) {
    const pid = p.by || p.presence?.uid, prof = pid ? profiles[pid] : null;
    const el = document.createElement("span"); el.className = "person"; el.style.setProperty("--pc", p.presence?.color || prof?.color || "var(--line)");
    const img = document.createElement("img"); img.alt = ""; if (prof?.avatarUrl) img.src = prof.avatarUrl;
    const nm = document.createElement("span"); nm.textContent = p.isMe ? "Você" : (prof?.name || "Colega");
    el.append(img, nm);
    if (!p.isMe && p.presence?.sprite) { const s = document.createElement("small"); s.textContent = "· " + (p.presence.sprite === STAGE ? "Palco" : (project.sprites.get(p.presence.sprite)?.name || "")); el.append(s); }
    box.append(el);
  }
  $("#syncWrap").hidden = !(room && list.length > 1);
}
// Cursores com nome (como num documento compartilhado)
const cursorLayer = document.createElement("div"); cursorLayer.className = "cursor-layer"; $("#paneCode").append(cursorLayer);
const wsOrigin = () => { const o = ws.getOriginOffsetInPixels(); const r = $("#blocklyDiv").getBoundingClientRect(), p = $("#paneCode").getBoundingClientRect(); return { x: o.x + (r.left - p.left), y: o.y + (r.top - p.top) }; };
let lastCurSent = 0;
$("#blocklyDiv").addEventListener("pointermove", e => {
  if (!room || now() - lastCurSent < 50) return; lastCurSent = now();
  const o = wsOrigin(), p = $("#paneCode").getBoundingClientRect();
  room.presence({ cur: { x: Math.round((e.clientX - p.left - o.x) / ws.scale), y: Math.round((e.clientY - p.top - o.y) / ws.scale) } }).catch(() => {});
});
$("#blocklyDiv").addEventListener("pointerleave", () => room?.presence({ cur: null }).catch(() => {}));
const personName = p => p.isMe ? "Você" : (profiles[p.by || p.presence?.uid]?.name || "Colega");
function renderCursors() {
  if ($("#paneCode").hidden) return;
  const o = wsOrigin(), s = ws.scale, seen = new Set();
  for (const p of peers) {
    if (p.isMe || p.kind !== "viewer" || p.presence?.sprite !== curSid) continue;
    const col = p.presence?.color || "#0f7c8a";
    if (p.presence?.cur) {
      const id = "c-" + p.peer; seen.add(id);
      let el = cursorLayer.querySelector(`[data-id="${id}"]`);
      if (!el) { el = document.createElement("div"); el.className = "peer-cursor"; el.dataset.id = id; el.innerHTML = `<svg width="16" height="20" viewBox="0 0 16 20"><path d="M1 1 L1 16 L5 12 L8 19 L11 18 L8 11 L14 11 Z" fill="${esc(col)}" stroke="#fff" stroke-width="1.5"/></svg><span></span>`; cursorLayer.append(el); }
      el.style.setProperty("--pc", col); el.querySelector("span").textContent = personName(p);
      el.style.transform = `translate(${o.x + p.presence.cur.x * s}px, ${o.y + p.presence.cur.y * s}px)`;
    }
    const b = p.presence?.sel && ws.getBlockById(p.presence.sel);
    if (b) {
      const id = "t-" + p.peer; seen.add(id);
      let el = cursorLayer.querySelector(`[data-id="${id}"]`);
      if (!el) { el = document.createElement("div"); el.className = "peer-tag"; el.dataset.id = id; cursorLayer.append(el); }
      const xy = b.getRelativeToSurfaceXY();
      el.style.setProperty("--pc", col); el.textContent = personName(p) + " está editando";
      el.style.left = (o.x + xy.x * s) + "px"; el.style.top = (o.y + xy.y * s) + "px";
    }
  }
  cursorLayer.querySelectorAll("[data-id]").forEach(el => { if (!seen.has(el.dataset.id)) el.remove(); });
}
setInterval(renderCursors, 100);
let highlighted = [];
function refreshPeerHighlights() {
  highlighted.forEach(el => { el.classList.remove("peer-sel"); el.style.removeProperty("--pc"); }); highlighted = [];
  for (const p of peers) {
    if (p.isMe || p.presence?.sprite !== curSid || !p.presence?.sel) continue;
    const root = ws.getBlockById(p.presence.sel)?.getSvgRoot?.();
    if (root) { root.classList.add("peer-sel"); root.style.setProperty("--pc", p.presence.color || "#f2b705"); highlighted.push(root); }
  }
}

// =====================================================================
// Inicialização
// =====================================================================
function applySprites(changes) {
  let structural = false;
  for (const ch of changes) {
    const id = ch.doc.id;
    if (isPending("sprites/" + id)) continue;
    if (ch.type === "removed") { project.sprites.delete(id); structural = true; continue; }
    const d = ch.doc.data(); const prev = project.sprites.get(id);
    project.sprites.set(id, d);
    if (!prev || prev.deleted !== d.deleted || prev.name !== d.name || JSON.stringify(prev.procs) !== JSON.stringify(d.procs) || JSON.stringify(prev.costumes) !== JSON.stringify(d.costumes) || JSON.stringify(prev.sounds) !== JSON.stringify(d.sounds) || JSON.stringify(prev.vars) !== JSON.stringify(d.vars) || JSON.stringify(prev.lists) !== JSON.stringify(d.lists)) structural = true;
  }
  const procsChanged = registerAllProcs();
  syncRuntime();
  if (curSid && curSid !== STAGE && (!project.sprites.get(curSid) || project.sprites.get(curSid).deleted)) { curSid = null; }
  if (!curSid) selectSprite(spriteList()[0]?.[0] || STAGE);
  else if (procsChanged) loadWorkspace();
  renderTiles(); renderProps(); renderAssets(); renderVarList(); updateLessons();
  if (structural) refreshToolbox();
}
function applyMeta(snap) {
  if (isPending("proj/meta")) return;
  if (snap.exists) project.meta = { ...emptyMeta(), ...snap.data() };
  $("#projTitle").value = project.meta.title || "Meu projeto";
  const procsChanged = registerAllProcs();
  syncRuntime(); renderTiles(); renderAssets(); renderVarList();
  if (procsChanged && curSid) loadWorkspace(); else refreshToolbox();
  maybeStarter();
}
let starterDone = false, gotMeta = false, gotSprites = false;
function maybeStarter() {
  if (starterDone || !gotMeta || !gotSprites) return;
  starterDone = true;
  if (db.local && !spriteList().length && !live(project.meta.backdrops).length) loadProjectData(starterData(), true);
  if (!curSid) selectSprite(spriteList()[0]?.[0] || STAGE);
}
async function connect() {
  if (IN_CLAUDE) {
    [db, room, user, sample, downloads] = await Promise.all(["db", "room", "user", "sample", "downloads"].map(n => window.claude.use(n).catch(() => null)));
  }
  let me = null;
  if (user) {
    try { me = await user.me(); rt.username = me?.name || ""; } catch (_) {}
    try { if (await user.can("data.write") === false) { readOnly = true; showBanner("Você está vendo este projeto, mas não pode editar. Peça acesso de Colaborador para programar junto."); } } catch (_) {}
  }
  if (!db) db = makeLocalDB();
  db.doc("proj/meta").onSnapshot(s => { gotMeta = true; applyMeta(s); }, () => showBanner("Perdi a conexão com o projeto. Recarregue a página."));
  db.collection("sprites").onSnapshot(s => { gotSprites = true; applySprites(s.docChanges()); maybeStarter(); });
  db.collection("scripts").onSnapshot(s => onRemoteScripts(s.docChanges()));
  db.collection("images").onSnapshot(s => {
    for (const ch of s.docChanges()) if (ch.type !== "removed") { const d = ch.doc.data(); if (d?.data && !project.images.has(ch.doc.id)) { project.images.set(ch.doc.id, d.data); imgCache.delete("img:" + ch.doc.id); } }
    bdCache.clear(); rt.redraw = true; renderTiles(); renderAssets();
  });
  db.collection("media").onSnapshot(s => { for (const ch of s.docChanges()) if (ch.type !== "removed") { const d = ch.doc.data(); if (d?.data) media.set(ch.doc.id, d.data); } });
  if (room) {
    room.presence({ color: me?.color || "#0f7c8a", uid: me?.id || null, sprite: curSid }).catch(() => {});
    room.onPeers(ch => { peers = ch.peers; renderPeople(); renderTiles(); refreshPeerHighlights(); });
    room.on("run", m => { if (!m.sameTab && $("#syncChk").checked) { greenFlag(true); narrate("Um colega clicou em ▶. Rodando junto."); } });
    room.on("stop", m => { if (!m.sameTab && $("#syncChk").checked) stopAll(false, true); });
    room.on("chat", m => {
      const nm = m.isMe ? "Você" : (m.by && profiles[m.by]?.name) || "Colega";
      addMsg("#chatLog", nm, String(m.data?.text ?? "").slice(0, 300), m.isMe);
      if (!m.isMe && $("#helpChat").hidden) { unread++; $("#chatTab").textContent = `Conversa (${unread})`; }
    });
  } else $("#chatTab").hidden = true;
  if (!IN_CLAUDE) $("#tutorTab").hidden = true;
  renderPeople();
}
renderLesson(); openHelp("lesson");
setInterval(tick, 1000 / 30);
window.__bab = { project, rt, importSb3, loadProjectData, get curSid() { return curSid; } };
connect();
