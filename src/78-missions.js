// =====================================================================
// Missões guiadas: uma mãozinha mostra onde clicar e o que arrastar
// =====================================================================
// Cada passo diz o que fazer (say), onde apontar (point) e como saber que terminou (done).
// O passo atual é sempre o primeiro que ainda não terminou; se a pessoa desfaz algo, a missão volta.
function* blocksIn(b) { if (!b) return; yield b; for (const i in (b.inputs || {})) yield* blocksIn(b.inputs[i].block); yield* blocksIn(b.next?.block); }
const hasWith = (type, pred) => scriptsAll().some(s => [...blocksIn(s.block)].some(b => b.type === type && pred(b)));
const countOf = type => scriptsAll().reduce((n, s) => n + [...blocksIn(s.block)].filter(b => b.type === type).length, 0);
const numIn = (b, name) => Number(b?.inputs?.[name]?.shadow?.fields?.NUM ?? b?.inputs?.[name]?.block?.fields?.NUM);
const inSprite = (name, f) => { const sid = spriteByName(name)?.[0]; if (!sid) return false; checkScope = sid; try { return !!f(); } finally { checkScope = null; } };
const openCat = () => { try { const it = ws.getToolbox()?.getSelectedItem(); const nm = it?.getName?.(); return Object.keys(CAT).find(k => CAT[k][0] === nm) || null; } catch (_) { return null; } };
const pickSprite = { say: "Clique no Faísca (ou em outro personagem) na lista de Atores.", point: { sprite: "" }, done: () => curSid && curSid !== STAGE };
const flagStep = text => ({ say: text, point: { el: "#flagBtn" }, fresh: "flag", done: () => lessonRan.flag });

// Jogos meio prontos: blocos montados por código (cada um com id próprio)
function tb(type, vals = {}) {
  const b = { type, id: uid() }, inputs = {}, fields = {};
  argSpecs(type).forEach(([k, name, d]) => {
    const v = name in vals ? vals[name] : d;
    if (k === "N") inputs[name] = { shadow: { type: "b_num", id: uid(), fields: { NUM: Number(v) || 0 } } };
    else if (k === "T") inputs[name] = { shadow: { type: "b_text", id: uid(), fields: { TEXT: String(v ?? "") } } };
    else if (k === "D") { if (name in vals) fields[name] = vals[name]; }
    else if ((k === "S" || k === "B") && vals[name]) inputs[name] = { block: vals[name] };
  });
  if (Object.keys(inputs).length) b.inputs = inputs;
  if (Object.keys(fields).length) b.fields = fields;
  return b;
}
const chain = (...bs) => { bs.forEach((b, i) => { if (bs[i + 1]) b.next = { block: bs[i + 1] }; }); return bs[0]; };
function templateProject(title, backdrop, sprites) {
  const data = { meta: { ...emptyMeta(), title, backdrops: { ["bd" + uid()]: { name: BACKDROP_GEN[backdrop].name, kind: "gen", ref: backdrop, order: 0 } }, sounds: { ["s" + uid()]: { name: "Sino", kind: "synth", ref: "sino", order: 0 } } }, sprites: {}, scripts: {}, images: {}, media: {} };
  sprites.forEach(([name, keys, extra, scripts], i) => {
    const sid = "sp" + uid(), costumes = {};
    keys.forEach((k, j) => { costumes["c" + j + uid()] = { name: LIB[k].name, kind: "lib", ref: k, order: j }; });
    data.sprites[sid] = { ...newSpriteDoc(name, costumes), name, order: i + 1, ...extra };
    scripts.forEach((top, j) => { top.x = 30; top.y = 30 + j * 230; data.scripts[top.id] = { sprite: sid, block: top }; });
  });
  return data;
}
const TEMPLATES = {
  estrela: () => {
    const d = templateProject("Pegue a estrela", "grama", [
      ["Faísca", ["robo-a", "robo-b"], { x: 0, y: -90, size: 70 }, [
        chain(tb("ev_flag"), tb("mv_gotoxy", { X: 0, Y: -90 }), tb("ct_forever", { SUBSTACK: chain(
          tb("ct_if", { COND: tb("sn_keypressed", { KEY: "right" }), SUBSTACK: tb("mv_changex", { DX: 10 }) }),
          tb("ct_if", { COND: tb("sn_keypressed", { KEY: "left" }), SUBSTACK: tb("mv_changex", { DX: -10 }) }),
          tb("ct_if", { COND: tb("sn_keypressed", { KEY: "up" }), SUBSTACK: tb("mv_changey", { DY: 10 }) }),
          tb("ct_if", { COND: tb("sn_keypressed", { KEY: "down" }), SUBSTACK: tb("mv_changey", { DY: -10 }) })) }))]],
      ["Estrela", ["estrela"], { x: 120, y: 60, size: 70 }, [
        chain(tb("ev_flag"), tb("var_set", { VAR: "pontos", VALUE: "0" }), tb("mv_goto", { TO: "_random_" }), tb("ct_forever", { SUBSTACK:
          tb("ct_if", { COND: tb("sn_touching", { OBJ: "Faísca" }) }) }))]],
    ]);
    d.meta.vars = { ["v" + uid()]: { name: "pontos", value: 0, order: 0, shown: true } };
    return d;
  },
  fantasma: () => templateProject("Fuja do fantasma", "noite", [
    ["Faísca", ["robo-a"], { x: 0, y: 0, size: 60 }, [
      chain(tb("ev_flag"), tb("mv_gotoxy", { X: 0, Y: 0 }), tb("ct_forever", { SUBSTACK: tb("mv_goto", { TO: "_mouse_" }) }))]],
    ["Fantasminha", ["fantasma"], { x: 190, y: 130, size: 70 }, [
      chain(tb("ev_flag"), tb("mv_gotoxy", { X: 190, Y: 130 }), tb("ct_forever", { SUBSTACK: chain(tb("mv_pointto", { TO: "Faísca" }), tb("mv_move", { STEPS: 3 })) }))]],
  ]),
};

const MISSIONS = [
  { id: "falar", level: 1, title: "Faça o Faísca falar", intro: "Seu primeiro programa: quando clicar na bandeira, o personagem diz Olá.", steps: [
    pickSprite,
    { say: "Clique em Eventos, a categoria amarela.", point: { cat: "ev" }, done: () => openCat() === "ev" || has("ev_flag") },
    { say: "Arraste o bloco “quando ▶ for clicado” para a área de código, à direita.", point: { drag: "ev_flag" }, done: () => has("ev_flag") },
    { say: "Agora clique em Aparência, a categoria roxa.", point: { cat: "lk" }, done: () => openCat() === "lk" || underHat("ev_flag", "lk_sayfor") },
    { say: "Arraste “dizer Olá! por 2 segundos” e solte embaixo do bloco amarelo. Ele gruda sozinho!", point: { drag: "lk_sayfor", to: "ev_flag" }, done: () => underHat("ev_flag", "lk_sayfor") },
    flagStep("Clique na bandeira verde ▶ e veja o personagem falar!")] },
  { id: "andar", level: 1, title: "Ande sem parar", intro: "O bloco “sempre” repete o que está dentro dele até você clicar em ■.", steps: [
    pickSprite,
    { say: "Coloque “quando ▶ for clicado” (Eventos, amarelo) na área de código.", point: { drag: "ev_flag" }, done: () => has("ev_flag") },
    { say: "Em Controle (laranja), arraste “sempre” e encaixe embaixo do bloco amarelo.", point: { drag: "ct_forever", to: "ev_flag" }, done: () => underHat("ev_flag", "ct_forever") },
    { say: "Em Movimento (azul), arraste “mover 10 passos” para DENTRO da boca do “sempre”.", point: { drag: "mv_move", into: "ct_forever" }, done: () => inside("ct_forever", "mv_move") },
    { say: "Coloque também “se tocar na borda, volte” dentro do “sempre”. Assim ele não some da tela.", point: { drag: "mv_bounce", into: "ct_forever" }, done: () => inside("ct_forever", "mv_bounce") },
    flagStep("Clique em ▶. Para parar, clique no ■.")] },
  { id: "animar", level: 1, title: "Dê vida ao personagem", intro: "Trocar de fantasia bem rápido parece que o personagem está se mexendo, como num desenho animado.", steps: [
    pickSprite,
    { say: "Coloque “quando ▶ for clicado” (Eventos) na área de código.", point: { drag: "ev_flag" }, done: () => has("ev_flag") },
    { say: "Em Controle, encaixe “sempre” embaixo dele.", point: { drag: "ct_forever", to: "ev_flag" }, done: () => underHat("ev_flag", "ct_forever") },
    { say: "Em Aparência, arraste “próxima fantasia” para dentro do “sempre”.", point: { drag: "lk_nextcostume", into: "ct_forever" }, done: () => inside("ct_forever", "lk_nextcostume") },
    { say: "Em Controle, coloque “esperar 1 segundos” dentro do “sempre” também.", point: { drag: "ct_wait", into: "ct_forever" }, done: () => inside("ct_forever", "ct_wait") },
    { say: "Clique no número 1 do “esperar”, apague e escreva 0.3 (mais rápido).", point: { num: ["ct_wait", "SECS"] }, done: () => hasWith("ct_wait", b => numIn(b, "SECS") < 1) },
    flagStep("Clique em ▶ e veja a animação!")] },
  { id: "setas", level: 1, title: "Ande com as setas", intro: "Jogos respondem ao teclado. Cada tecla pode ter o seu script.", steps: [
    pickSprite,
    { say: "Em Eventos, arraste “quando a tecla espaço for pressionada”.", point: { drag: "ev_key" }, done: () => has("ev_key") },
    { say: "Clique na setinha ▾ do bloco e escolha “seta para a direita”.", point: { field: ["ev_key", "KEY"] }, done: () => hasWith("ev_key", b => b.fields?.KEY === "right") },
    { say: "Em Movimento, encaixe “mudar x por 10” embaixo dele.", point: { drag: "mv_changex", to: b => b.type === "ev_key" && b.getFieldValue("KEY") === "right" }, done: () => hasWith("ev_key", b => b.fields?.KEY === "right" && b.next?.block?.type === "mv_changex") },
    { say: "Agora faça um para a esquerda: arraste outro “quando a tecla … for pressionada”.", point: { drag: "ev_key" }, done: () => countOf("ev_key") >= 2 || hasWith("ev_key", b => b.fields?.KEY === "left") },
    { say: "No bloco novo, escolha “seta para a esquerda” na setinha ▾.", point: { field: [b => b.type === "ev_key" && b.getFieldValue("KEY") !== "right", "KEY"] }, done: () => hasWith("ev_key", b => b.fields?.KEY === "left") },
    { say: "Encaixe “mudar x por 10” embaixo dele.", point: { drag: "mv_changex", to: b => b.type === "ev_key" && b.getFieldValue("KEY") === "left" }, done: () => hasWith("ev_key", b => b.fields?.KEY === "left" && b.next?.block?.type === "mv_changex") },
    { say: "Para ir para a esquerda o número é negativo: troque 10 por -10.", point: { num: [b => b.type === "mv_changex" && b.getPreviousBlock()?.getFieldValue?.("KEY") === "left", "DX"] }, done: () => hasWith("ev_key", b => b.fields?.KEY === "left" && numIn(b.next?.block, "DX") < 0) },
    { say: "Clique no palco e aperte as setas → e ←.", point: { stage: true }, fresh: "key", done: () => lessonRan.key }] },
  { id: "estrela", level: 2, template: "estrela", title: "Complete o jogo: Pegue a estrela", intro: "Este jogo está quase pronto. O Faísca já anda com as setas ← → ↑ ↓; falta a estrela reagir quando é pega.", steps: [
    { say: "Clique na Estrela na lista de Atores para ver os blocos dela.", point: { sprite: "Estrela" }, done: () => curDoc()?.name === "Estrela" || inSprite("Estrela", () => inside("ct_if", "mv_goto")) },
    { say: "O “se tocando em Faísca? então” está vazio. Em Movimento, arraste “ir para posição aleatória” para dentro dele.", point: { drag: "mv_goto", into: "ct_if" }, done: () => inSprite("Estrela", () => inside("ct_if", "mv_goto")) },
    { say: "Em Variáveis, arraste “adicionar 1 a pontos” para dentro do “se” também.", point: { drag: "var_change", into: "ct_if" }, done: () => inSprite("Estrela", () => inside("ct_if", "var_change")) },
    flagStep("Clique em ▶ para começar o jogo."),
    { say: "Agora pegue a estrela! Clique no palco e use as setas ← → ↑ ↓ até o Faísca encostar nela.", point: { stage: true }, done: () => lessonRan.flag && Number(rt.vars.get("pontos")) >= 1 }] },
  { id: "fantasma", level: 2, template: "fantasma", title: "Complete o jogo: Fuja do fantasma", intro: "O Faísca segue o mouse e o fantasma persegue o Faísca. Falta o jogo acabar quando o fantasma pega ele.", steps: [
    { say: "Clique no Faísca na lista de Atores.", point: { sprite: "Faísca" }, done: () => curDoc()?.name === "Faísca" || inSprite("Faísca", () => inside("ct_forever", "ct_if")) },
    { say: "Em Controle, arraste “se … então” para dentro do “sempre”, embaixo do “ir para ponteiro do mouse”.", point: { drag: "ct_if", into: "ct_forever" }, done: () => inSprite("Faísca", () => inside("ct_forever", "ct_if")) },
    { say: "Em Sensores, arraste “tocando em … ?” para o espaço de seis lados do “se”.", point: { drag: "sn_touching", slot: ["ct_if", "COND"] }, done: () => inSprite("Faísca", () => hasWith("ct_if", b => b.inputs?.COND?.block?.type === "sn_touching")) },
    { say: "Clique na setinha ▾ de “tocando em” e escolha Fantasminha.", point: { field: ["sn_touching", "OBJ"] }, done: () => inSprite("Faísca", () => hasWith("sn_touching", b => b.fields?.OBJ === "Fantasminha")) },
    { say: "Em Aparência, arraste “dizer Olá! por 2 segundos” para dentro do “se”. Depois troque Olá! por “Peguei você!”.", point: { drag: "lk_sayfor", into: "ct_if" }, done: () => inSprite("Faísca", () => inside("ct_if", "lk_sayfor")) },
    { say: "Em Controle, arraste “parar tudo” para dentro do “se”, embaixo do “dizer”.", point: { drag: "ct_stop", into: "ct_if" }, done: () => inSprite("Faísca", () => inside("ct_if", "ct_stop")) },
    flagStep("Clique em ▶ e fuja do fantasma com o mouse!")] },
];

let missionDone = {}; try { missionDone = JSON.parse(localStorage.getItem("bab-missoes") || "{}"); } catch (_) {}
let mission = null; // { m, idx, card, hand, ring, ghost, timer, raf }
function missionListHTML() {
  return `<span class="label">Missões com a mãozinha</span><ul class="mission-list">${MISSIONS.map((m, i) => `<li class="${missionDone[m.id] ? "ok" : ""}"><span><span class="tag">Nível ${m.level}${m.template ? " · jogo para completar" : ""}</span><br>${missionDone[m.id] ? "✓ " : ""}${esc(m.title)}</span><button class="btn small ${!missionDone[m.id] && MISSIONS.findIndex(x => !missionDone[x.id]) === i ? "primary" : ""}" data-mission="${m.id}">${missionDone[m.id] ? "De novo" : "Começar"}</button></li>`).join("")}</ul>`;
}
function bindMissionList(box) { box.querySelectorAll("[data-mission]").forEach(b => b.onclick = () => askMission(b.dataset.mission)); }
function askMission(id) {
  const m = MISSIONS.find(x => x.id === id); if (!m) return;
  if (m.template) confirmBox(`“${m.title}” abre um jogo meio pronto no lugar do projeto aberto${room ? " (também para quem está na sala)" : ""}. Se quiser guardar o atual, use “Salvar no computador” antes.`, "Abrir o jogo", () => { loadProjectData(TEMPLATES[m.template](), true); startMission(m); });
  else startMission(m);
}
function startMission(m) {
  stopMission(true);
  const lv = curLevel().n;
  if (lv !== 0 && lv < m.level) setLevel(m.level, true);
  document.querySelector('#editorCard [data-tab="code"]')?.click();
  if (scrollY > 0) scrollTo({ top: 0, behavior: "smooth" }); // a lista de missões fica lá embaixo; a missão acontece em cima
  const card = document.createElement("div"); card.className = "mission"; card.setAttribute("role", "status");
  $("#paneCode").append(card);
  const hand = document.createElement("div"); hand.className = "hand"; hand.innerHTML = `<svg viewBox="0 0 46 52" width="46" height="52" aria-hidden="true"><path d="M14 3c2.6 0 4.5 2 4.5 4.6V22l2-.4c2.2-.4 4 1 4.4 3l.1.6 1.6-.3c2.2-.3 4 1.1 4.4 3.1l1.3-.2c2.3-.3 4.3 1.3 4.6 3.6.8 6.4-.1 11.3-2.6 14.6-2.2 2.9-5.5 4.5-9.7 4.5h-4.4c-3.6 0-6.6-1.6-8.8-4.6L3.7 34.6c-1.4-2-.9-4.6 1.1-6 1.8-1.2 4.2-.9 5.6.7l-.1-21.7C10.3 5 11.6 3 14 3z" fill="#ffd9b0" stroke="#5a3b1c" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
  const ring = document.createElement("div"); ring.className = "hand-ring";
  const ghost = document.createElement("div"); ghost.className = "hand-ghost";
  document.body.append(ring, ghost, hand);
  mission = { m, idx: -1, card, hand, ring, ghost, t0: now() };
  lessonRan.flag = false; lessonRan.key = false;
  mission.timer = setInterval(checkMission, 350);
  checkMission(); handLoop();
}
function stopMission(silent) {
  if (!mission) return;
  clearInterval(mission.timer); cancelAnimationFrame(mission.raf);
  mission.card.remove(); mission.hand.remove(); mission.ring.remove(); mission.ghost.remove();
  mission = null;
  if (!silent) narrate("Missão fechada. Você pode voltar a ela na aba Lições.");
}
function stepState(m) { return m.steps.map(s => { try { return !!s.done(); } catch (_) { return false; } }); }
function checkMission() {
  if (!mission) return;
  if (curSid && !busyEditing()) diffWorkspace(); // confere já o que está na tela, sem esperar o salvamento
  const { m } = mission, st = stepState(m), idx = st.indexOf(false);
  if (idx === -1) return finishMission();
  if (idx !== mission.idx) {
    const s = m.steps[idx];
    if (s.fresh === "flag" && mission.idx !== idx) lessonRan.flag = false;
    if (s.fresh === "key" && mission.idx !== idx) lessonRan.key = false;
    if (mission.base === undefined || idx < mission.base) mission.base = idx;
    mission.idx = idx; mission.t0 = now();
    renderMissionCard(st);
  }
}
function renderMissionCard(st) {
  const { m, idx, card, base } = mission, s = m.steps[idx];
  const face = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LIB["robo-a"].svg)}`;
  card.classList.remove("done");
  card.innerHTML = `<div class="m-top"><img alt="" src="${face}"><div><span class="label">Missão · passo ${idx - base + 1} de ${m.steps.length - base}</span><div style="font-weight:700">${esc(m.title)}</div></div></div>
    ${mission.firstShown !== true ? `<p class="muted" style="margin:0">${esc(m.intro)}</p>` : ""}
    <p class="m-step">${esc(s.say)}</p>
    <div class="m-dots">${m.steps.slice(base).map((_, j) => `<i class="${st[j + base] ? "ok" : j + base === idx ? "now" : ""}"></i>`).join("")}</div>
    <div class="m-row"><button class="btn small" data-m="ouvir">🔊 Ouvir</button><button class="btn small" data-m="mini">Esconder</button><button class="btn small" data-m="sair">Sair da missão</button></div>`;
  mission.firstShown = true;
  card.querySelector('[data-m="ouvir"]').onclick = e => sayAloud(s.say, e.currentTarget);
  card.querySelector('[data-m="mini"]').onclick = () => { card.classList.toggle("min"); card.querySelector('[data-m="mini"]').textContent = card.classList.contains("min") ? "Mostrar" : "Esconder"; };
  card.querySelector('[data-m="sair"]').onclick = () => stopMission();
}
function sayAloud(text, btn) {
  const label = t => { if (btn) btn.textContent = t; };
  if (!window.speechSynthesis) { label("🔇 Sem voz aqui"); return; }
  try {
    const u = new SpeechSynthesisUtterance(text.replace(/[“”]/g, "")); u.lang = "pt-BR";
    u.onstart = () => label("🔊 Falando…"); u.onend = u.onerror = () => label("🔊 Ouvir");
    speechSynthesis.cancel(); speechSynthesis.speak(u); label("🔊 Falando…");
  } catch (_) { label("🔇 Sem voz aqui"); }
}
function finishMission() {
  const { m, card } = mission;
  clearInterval(mission.timer); cancelAnimationFrame(mission.raf);
  mission.hand.remove(); mission.ring.remove(); mission.ghost.remove();
  missionDone[m.id] = true; try { localStorage.setItem("bab-missoes", JSON.stringify(missionDone)); } catch (_) {}
  const next = MISSIONS.find(x => !missionDone[x.id]);
  const lv = curLevel().n, nextLv = next && lv !== 0 && next.level > lv;
  card.classList.add("done"); card.classList.remove("min");
  card.innerHTML = `<div class="m-top"><img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(LIB["robo-c"].svg)}"><div><span class="label">Missão completa!</span><div style="font-weight:700">⭐ ${esc(m.title)}</div></div></div>
    <p class="m-step">Muito bem! Você programou isso sozinho.${next ? ` Próxima: “${esc(next.title)}”.` : " Você fez todas as missões. Agora invente o seu jogo!"}${nextLv ? ` Ela é do Nível ${next.level}: vou liberar blocos novos.` : ""}</p>
    <div class="m-row">${next ? `<button class="btn small primary" data-m="next">Próxima missão ▸</button>` : ""}<button class="btn small" data-m="fim">Fechar</button></div>`;
  card.querySelector('[data-m="next"]')?.addEventListener("click", () => { card.remove(); mission = null; askMission(next.id); });
  card.querySelector('[data-m="fim"]').onclick = () => { card.remove(); mission = null; };
  confetti(card);
  sayAloud("Missão completa! Muito bem!");
  renderLesson();
}
function confetti(from) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = from.getBoundingClientRect(), cols = ["#f2b705", "#e5483d", "#2f7de1", "#1f9d55", "#c157c4", "#0f9fb0"];
  for (let i = 0; i < 46; i++) {
    const c = document.createElement("i"); c.className = "confetti"; c.style.background = cols[i % cols.length];
    c.style.left = (r.left + r.width / 2) + "px"; c.style.top = (r.top + 20) + "px"; document.body.append(c);
    const dx = (Math.random() - .5) * 520, dy = -160 - Math.random() * 260;
    c.animate([{ transform: "translate(0,0) rotate(0)" }, { transform: `translate(${dx * .6}px, ${dy}px) rotate(${Math.random() * 540}deg)`, offset: .45 }, { transform: `translate(${dx}px, ${dy + 520}px) rotate(${Math.random() * 900}deg)`, opacity: 0 }], { duration: 1600 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => c.remove();
  }
}

// ---------- Onde apontar ----------
const wsBlocks = () => ws.getAllBlocks(false).filter(b => !b.isShadow());
const findWs = sel => wsBlocks().find(b => typeof sel === "function" ? sel(b) : b.type === sel);
function toScreen(x, y) {
  try { const c = Blockly.utils.svgMath.wsToScreenCoordinates(ws, new Blockly.utils.Coordinate(x, y)); return { x: c.x, y: c.y }; }
  catch (_) { const r = $("#blocklyDiv").getBoundingClientRect(), o = ws.getOriginOffsetInPixels(); return { x: r.left + o.x + x * ws.scale, y: r.top + o.y + y * ws.scale }; }
}
const lastInChain = b => { while (b && b.getNextBlock()) b = b.getNextBlock(); return b; };
function dropPoint(p) {
  if (p.to) { const b = findWs(p.to); const last = lastInChain(b); if (last?.nextConnection) return toScreen(last.nextConnection.x + 12, last.nextConnection.y + 10); }
  if (p.into) {
    const b = findWs(p.into), inp = b?.getInput("SUBSTACK");
    if (inp?.connection) { const inner = inp.connection.targetBlock(); const last = lastInChain(inner); const c = last?.nextConnection || inp.connection; return toScreen(c.x + 12, c.y + 10); }
  }
  if (p.slot) { const b = findWs(p.slot[0]), c = b?.getInput(p.slot[1])?.connection; if (c) return toScreen(c.x + 14, c.y + 8); }
  const r = $("#blocklyDiv").getBoundingClientRect(), fr = ws.getToolbox()?.getFlyout?.()?.isVisible?.() ? ws.getToolbox().getFlyout().getWorkspace().getParentSvg().getBoundingClientRect() : null;
  return { x: Math.max(fr ? fr.right + 80 : 0, r.left + r.width * .55), y: r.top + r.height * .3 };
}
const catItem = c => ws.getToolbox()?.getToolboxItems?.().find(i => i.getName?.() === CAT[c][0]);
function catRect(c) { const el = catItem(c)?.getDiv?.(); return el ? el.getBoundingClientRect() : null; }
function flyoutBlockRect(type) {
  const fo = ws.getToolbox()?.getFlyout?.();
  if (!fo?.isVisible?.()) return null;
  const b = fo.getWorkspace().getTopBlocks(false).find(x => x.type === type);
  if (!b) return null;
  const r = b.getSvgRoot().getBoundingClientRect(), box = fo.getWorkspace().getParentSvg().getBoundingClientRect();
  if (r.top > box.bottom - 10 || r.bottom < box.top + 10) { // fora da parte visível: rola a paleta até ele
    try { fo.getWorkspace().scrollbar?.set(0, Math.max(0, b.getRelativeToSurfaceXY().y * fo.getWorkspace().scale - 40)); } catch (_) {}
    return null;
  }
  return r;
}
// Devolve o que desenhar agora: anel (ring), mãozinha parada (tap) ou arrastando (from → to)
function aim() {
  const p = mission.m.steps[mission.idx].point || {};
  if (p.drag) {
    const r = flyoutBlockRect(p.drag);
    if (!r) { const c = catRect(DEF[p.drag].cat); return c ? { ring: c, tap: { x: c.left + c.width / 2, y: c.top + c.height / 2 }, hint: `Primeiro abra ${CAT[DEF[p.drag].cat][0]}.` } : null; }
    const to = dropPoint(p);
    if (p.to || p.into || p.slot) { // o lugar de soltar ficou atrás da paleta aberta: rola a área de código
      const fr = ws.getToolbox().getFlyout().getWorkspace().getParentSvg().getBoundingClientRect(), area = $("#blocklyDiv").getBoundingClientRect();
      if (area.right - fr.right < 170) {} // tela estreita: não dá para mostrar os dois lado a lado
      else if (to.x < fr.right + 30) ws.scroll(ws.scrollX + (fr.right + 80 - to.x), ws.scrollY);
      else if (to.x > area.right - 40) ws.scroll(ws.scrollX - (to.x - area.right + 120), ws.scrollY);
      if (to.y > area.bottom - 30 || to.y < area.top + 30) ws.scroll(ws.scrollX, ws.scrollY - (to.y - (area.top + area.height * .4)));
    }
    return { ring: r, from: { x: r.left + 18, y: r.top + r.height / 2 }, to, label: blockLabel(p.drag), color: CAT[DEF[p.drag].cat][1] };
  }
  if (p.cat) { const c = catRect(p.cat); return c && { ring: c, tap: { x: c.left + c.width / 2, y: c.top + c.height / 2 } }; }
  if (p.el) { const r = $(p.el).getBoundingClientRect(); return { ring: r, tap: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }; }
  if (p.stage) { const r = $("#stage").getBoundingClientRect(); return { ring: r, tap: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }; }
  if (p.sprite !== undefined) {
    const sid = p.sprite ? spriteByName(p.sprite)?.[0] : spriteList()[0]?.[0];
    const el = sid && document.querySelector(`#tiles [data-sid="${CSS.escape(sid)}"]`); if (!el) return null;
    const r = el.getBoundingClientRect(); return { ring: r, tap: { x: r.left + r.width / 2, y: r.top + r.height / 2 } };
  }
  if (p.field) { const b = findWs(p.field[0]), el = b?.getField(p.field[1])?.getSvgRoot?.(); if (!el) return null; const r = el.getBoundingClientRect(); return { ring: r, tap: { x: r.right - 10, y: r.top + r.height / 2 } }; }
  if (p.num) { const b = findWs(p.num[0]), sh = b?.getInput(p.num[1])?.connection?.targetBlock(); if (!sh) return null; const r = sh.getSvgRoot().getBoundingClientRect(); return { ring: r, tap: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }; }
  return null;
}
function blockLabel(type) { const l = DEF[type].lines; return (Array.isArray(l) ? l[0] : l).replace(/%\d/g, "…"); }
function handLoop() {
  if (!mission) return;
  mission.raf = requestAnimationFrame(handLoop);
  const { hand, ring, ghost, card } = mission;
  const hide = () => { hand.style.display = ring.style.display = ghost.style.display = "none"; };
  if (card.classList.contains("min") || $("#paneCode").hidden || ws.isDragging() || $("#modalRoot").children.length || Blockly.DropDownDiv.isVisible() || Blockly.WidgetDiv.isVisible()) return hide();
  let a = null; try { a = aim(); } catch (_) {}
  if (!a) return hide();
  const pad = 5;
  Object.assign(ring.style, { display: "block", left: (a.ring.left - pad) + "px", top: (a.ring.top - pad) + "px", width: (a.ring.width + pad * 2) + "px", height: (a.ring.height + pad * 2) + "px" });
  hand.style.display = "block";
  const t = (now() - mission.t0) / 1000;
  let x, y, sc = 1, op = 1;
  if (a.from && a.to) {
    const k = (t % 2.8) / 2.8;
    const e = k < .18 ? 0 : k > .78 ? 1 : (k - .18) / .6, ee = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
    x = a.from.x + (a.to.x - a.from.x) * ee; y = a.from.y + (a.to.y - a.from.y) * ee;
    sc = k > .1 && k < .82 ? .88 : 1; op = k > .9 ? (1 - k) * 10 : 1;
    Object.assign(ghost.style, { display: k > .1 && k < .86 ? "block" : "none", transform: `translate(${x - 12}px, ${y - 14}px)`, background: a.color, opacity: op * .9 });
    ghost.textContent = a.label;
  } else {
    ghost.style.display = "none";
    x = a.tap.x; y = a.tap.y + Math.abs(Math.sin(t * 3.2)) * -10;
  }
  hand.style.opacity = op;
  hand.style.transform = `translate(${x - 14}px, ${y - 4}px) scale(${sc})`;
  const hint = mission.card.querySelector(".m-hint");
  if (a.hint && !hint) mission.card.querySelector(".m-step")?.insertAdjacentHTML("afterend", `<p class="m-hint muted" style="margin:0">👉 ${esc(a.hint)}</p>`);
  if (!a.hint && hint) hint.remove();
}

// Primeira visita: oferece a primeira missão
setTimeout(() => {
  let seen = true; try { seen = localStorage.getItem("bab-boasvindas") === "1"; localStorage.setItem("bab-boasvindas", "1"); } catch (_) {}
  if (seen || mission || ![1, 2].includes(curLevel().n) || $("#modalRoot").children.length) return;
  modal(`<div class="m-top" style="display:flex;gap:12px;align-items:center"><img alt="" style="width:56px" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(LIB["robo-a"].svg)}"><h2>Oi! Vamos criar o seu primeiro programa?</h2></div>
    <p style="margin:0">Uma mãozinha vai mostrar onde clicar e o que arrastar. Leva uns 2 minutos.</p>
    <div class="row"><button class="btn primary" id="wGo">Começar a primeira missão</button><button class="btn" data-close>Agora não</button></div>`, (mm, close) => { $("#wGo").onclick = () => { close(); askMission(MISSIONS[0].id); }; });
}, 1800);
