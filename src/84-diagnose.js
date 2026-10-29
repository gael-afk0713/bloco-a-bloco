// =====================================================================
// “Por que não funciona?”: procura os erros mais comuns de quem está começando
// =====================================================================
const LOOPS = ["ct_forever", "ct_repeat", "ct_repeatuntil", "ct_while", "ct_foreach"];
const WAITS = ["ct_wait", "lk_sayfor", "lk_thinkfor", "snd_playwait", "ct_waituntil", "mv_glide", "mv_glideto", "mu_rest", "mu_drum", "mu_note", "sn_ask", "lk_backdropwait", "ev_broadcastwait"];
const bq = type => `“${blockLabel(type)}”`;
const ownerName = sid => sid === STAGE ? "Palco" : (project.sprites.get(sid)?.name || "ator");
// Percorre um script lembrando em quais laços cada bloco está
function walkScript(top, fn) {
  const go = (b, loops) => {
    for (; b; b = b.next?.block) {
      fn(b, loops);
      for (const k in (b.inputs || {})) {
        const child = b.inputs[k].block; if (!child) continue;
        go(child, (k === "SUBSTACK" || k === "SUBSTACK2") && LOOPS.includes(b.type) ? [...loops, b] : loops);
      }
    }
  };
  go(top, []);
}
const chainTypes = b => { const out = []; for (; b; b = b.next?.block) out.push(b.type); return out; };
function diagnose() {
  const out = [], add = (kind, sid, blockId, title, text) => out.push({ kind, sid, blockId, title, text });
  const scripts = [...project.scripts.values()].filter(s => s.block && (s.sprite === STAGE || project.sprites.get(s.sprite) && !project.sprites.get(s.sprite).deleted));
  if (!scripts.length) { add("problem", null, null, "Ainda não há nenhum bloco", "Comece em Eventos: arraste “quando ▶ for clicado” e encaixe blocos embaixo. Se quiser ajuda, faça a primeira missão na aba Lições."); return out; }
  const sent = new Set(), received = new Map(), varsChanged = new Set(), varsRead = new Map(), touchNames = [], varsAdded = new Map(), varsReset = new Set();
  let hats = 0, keyHats = false;
  for (const s of scripts) {
    const top = s.block, d = DEF[top.type];
    if (!d) continue;
    if (d.kind === "hat") {
      hats++;
      if (top.type === "ev_key" || top.type === "ev_keyup") keyHats = true;
      if (!top.next?.block && !top.type.startsWith("pd_")) add("problem", s.sprite, top.id, `${bq(top.type)} está sem nada embaixo`, "Um evento sozinho não faz nada. Encaixe embaixo dele os blocos que devem acontecer.");
    } else if (d.kind === "rep" || d.kind === "bool") add("problem", s.sprite, top.id, `${bq(top.type)} está solto`, `Blocos ${d.kind === "bool" ? "de seis lados" : "redondos"} guardam um valor e não fazem nada sozinhos. Arraste este para dentro de um buraco do mesmo formato em outro bloco.`);
    else add("problem", s.sprite, top.id, `Blocos sem evento em cima (começando por ${bq(top.type)})`, "Estes blocos nunca rodam porque não têm um bloco amarelo de Eventos em cima, como “quando ▶ for clicado”. Encaixe um evento no topo da pilha.");
    walkScript(top, (b, loops) => {
      const tp = b.type;
      if (["ct_if", "ct_ifelse", "ct_waituntil", "ct_repeatuntil", "ct_while"].includes(tp) && !b.inputs?.COND?.block)
        add("problem", s.sprite, b.id, `${bq(tp)} está sem condição`, `O espaço de seis lados está vazio, então a condição é sempre falsa${tp === "ct_repeatuntil" ? " e o laço nunca termina" : ""}. Arraste para ele um bloco de seis lados, como “tocando em …?” ou “tecla … pressionada?”${curLevel().n === 1 ? " (eles ficam em Sensores, que aparece a partir do Nível 2: troque o nível em cima dos blocos)" : ""}.`);
      if ((tp === "ct_if" || tp === "ct_ifelse") && !loops.length && top.type === "ev_flag" && b.inputs?.COND?.block && [...blocksIn(b.inputs.COND.block)].some(x => ["sn_keypressed", "sn_touching", "sn_mousedown", "sn_touchcolor", "sn_colortouch"].includes(x.type)))
        add("problem", s.sprite, b.id, "Este “se” só confere uma vez", "Ele olha a condição só no instante em que você clica em ▶ e depois não olha mais. Coloque o “se” dentro de um “sempre” para ele ficar conferindo o tempo todo.");
      if (tp === "lk_nextcostume" && loops.length) {
        const loop = loops[loops.length - 1], body = [...blocksIn(loop.inputs?.SUBSTACK?.block)].map(x => x.type);
        if (!body.some(t => WAITS.includes(t))) add("tip", s.sprite, b.id, "A animação vai ficar rápida demais", "Dentro do laço não tem nenhuma espera, então a fantasia troca 30 vezes por segundo. Coloque “esperar 0.2 segundos” dentro do laço.");
      }
      if (tp === "ct_wait" && numIn(b, "SECS") >= 10) add("tip", s.sprite, b.id, `Uma espera de ${numIn(b, "SECS")} segundos`, "É bastante tempo: pode parecer que o programa travou. Era isso mesmo?");
      if (tp === "ct_repeat" && numIn(b, "TIMES") <= 0) add("problem", s.sprite, b.id, "“repetir 0 vezes” não roda nada", "Troque o número por quantas vezes os blocos de dentro devem acontecer.");
      if (tp === "ev_broadcast" || tp === "ev_broadcastwait") sent.add(b.fields?.MSG);
      if (tp === "ev_receive") received.set(b.fields?.MSG, { sid: s.sprite, id: b.id });
      if (["var_set", "var_change", "ct_foreach"].includes(tp)) varsChanged.add(b.fields?.VAR);
      if (tp === "var_change" && !varsAdded.has(b.fields?.VAR)) varsAdded.set(b.fields?.VAR, { sid: s.sprite, id: b.id });
      if (tp === "var_set" && top.type === "ev_flag") varsReset.add(b.fields?.VAR);
      if (tp === "var_get" && !varsRead.has(b.fields?.VAR)) varsRead.set(b.fields?.VAR, { sid: s.sprite, id: b.id });
      if (tp === "sn_touching") touchNames.push({ name: b.fields?.OBJ, sid: s.sprite, id: b.id });
      if (tp === "mv_move" && !loops.length && numIn(b, "STEPS") > 0 && numIn(b, "STEPS") <= 15 && chainTypes(top).filter(t => t === "mv_move").length === 1 && top.type === "ev_flag")
        add("tip", s.sprite, b.id, "Andou só um pouquinho?", "“mover 10 passos” anda uma vez só, bem pouco. Para andar sem parar, coloque-o dentro de um “sempre” ou de um “repetir”.");
    });
  }
  if (!hats) add("problem", null, null, "Nenhum evento no projeto", "Sem um bloco amarelo de Eventos (como “quando ▶ for clicado”) nada começa. Arraste um para o topo dos seus blocos.");
  for (const m of sent) if (m && !received.has(m)) add("problem", null, null, `Ninguém recebe a mensagem “${m}”`, `Algum bloco transmite “${m}”, mas nenhum ator tem “quando eu receber ${m}”. Coloque esse evento no ator que deve reagir.`);
  for (const [m, at] of received) if (m && !sent.has(m)) add("problem", at.sid, at.id, `Ninguém transmite “${m}”`, `Este script espera a mensagem “${m}”, mas nenhum bloco “transmitir ${m}” existe. Ele nunca vai começar.`);
  for (const [v, at] of varsRead) if (v && !varsChanged.has(v)) add("tip", at.sid, at.id, `A variável “${v}” nunca muda`, `Nenhum bloco “definir ${v} como” ou “adicionar … a ${v}” existe, então ela fica sempre com o mesmo valor.`);
  for (const [v, at] of varsAdded) if (v && !varsReset.has(v)) add("tip", at.sid, at.id, `“${v}” não volta a 0 quando o jogo começa`, `Nenhum “quando ▶ for clicado” tem “definir ${v} como 0”, então a contagem continua de onde parou na última vez. Coloque esse bloco (Variáveis) logo embaixo do “quando ▶ for clicado”.`);
  const names = new Set(spriteList().map(([, s]) => s.name));
  for (const t of touchNames) if (t.name && !t.name.startsWith("_") && !names.has(t.name)) add("problem", t.sid, t.id, `Não existe ator chamado “${t.name}”`, "Este “tocando em” procura um ator que foi apagado ou mudou de nome. Clique na setinha ▾ e escolha de novo.");
  for (const [sid, sp] of spriteList()) {
    const mine = scripts.filter(s => s.sprite === sid);
    const shows = mine.some(s => [...blocksIn(s.block)].some(b => b.type === "lk_show"));
    if (sp.visible === false && !shows) add("problem", sid, "#pVis", `${sp.name} está escondido`, "Ele não aparece no palco e nenhum bloco “mostrar” deixa ele visível. Marque a caixinha “Aparece no palco” embaixo do palco, ou coloque “mostrar” no começo do script.");
    if (Math.abs(sp.x || 0) > 250 || Math.abs(sp.y || 0) > 190) add("problem", sid, "#pX", `${sp.name} está fora do palco`, "A posição dele fica além da borda (o palco vai de x -240 a 240 e de y -180 a 180). Use “ir para x: 0 y: 0” no começo do script.");
    if ((sp.size ?? 100) < 5) add("problem", sid, "#pSize", `${sp.name} está minúsculo`, `O tamanho é ${sp.size}%: quase invisível. Use “definir tamanho como 100 %”.`);
  }
  if (keyHats || scripts.some(s => [...blocksIn(s.block)].some(b => b.type === "sn_keypressed"))) add("tip", null, null, "Usa o teclado? Clique no palco antes", "As teclas só chegam ao jogo depois que você clica uma vez no palco.");
  return out.sort((a, b) => (a.kind === "tip") - (b.kind === "tip"));
}
function showProblem(sid, blockId) {
  if (sid && sid !== curSid) selectSprite(sid);
  if (blockId?.startsWith("#")) {
    // Problema numa configuração do ator: rola até o campo e faz ele piscar
    setTimeout(() => { const el = $(blockId); if (!el) return; const box = el.closest(".prop, label") || el; box.scrollIntoView({ block: "center", behavior: "smooth" }); box.classList.add("bab-flash"); setTimeout(() => box.classList.remove("bab-flash"), 2600); el.focus({ preventScroll: true }); }, 120);
    return;
  }
  document.querySelector('#editorCard [data-tab="code"]')?.click();
  if (!blockId) return;
  setTimeout(() => {
    const b = ws.getBlockById(blockId); if (!b) return;
    ws.centerOnBlock(blockId); try { Blockly.common.setSelected(b); } catch (_) { b.select(); }
    const root = b.getSvgRoot(); root.classList.add("bab-problem"); setTimeout(() => root.classList.remove("bab-problem"), 3500);
  }, 120);
}
$("#whyBtn").onclick = () => {
  if (curSid) diffWorkspace();
  const list = diagnose(), probs = list.filter(x => x.kind === "problem").length;
  modal(`<h2>🤔 Por que não funciona?</h2>
    <p class="muted" style="margin:0">${probs ? `Encontrei ${probs} coisa${probs > 1 ? "s" : ""} que pode${probs > 1 ? "m" : ""} estar atrapalhando.` : "Não encontrei os erros mais comuns."} ${list.length - probs ? "Também tenho dicas." : ""}</p>
    ${list.length ? `<ul class="issues">${list.map((x, i) => `<li class="${x.kind === "tip" ? "tip" : ""}"><span class="who">${x.kind === "tip" ? "Dica" : "Problema"}${x.sid ? " · " + esc(ownerName(x.sid)) : ""}</span><strong>${esc(x.title)}</strong><span>${esc(x.text)}</span>${x.sid ? `<div><button class="btn small" data-show="${i}">Mostrar onde</button></div>` : ""}</li>`).join("")}</ul>` : ""}
    <p class="muted" style="margin:0">Ainda não entendeu? Escolha “Devagar” ao lado do ■ e clique em ▶: cada bloco acende e o quadro “O que está acontecendo” explica o que ele fez.</p>
    <div class="row"><button class="btn primary" data-close>Fechar</button></div>`, (m, close) => {
    m.querySelectorAll("[data-show]").forEach(b => b.onclick = () => { const x = list[+b.dataset.show]; close(); showProblem(x.sid, x.blockId); });
  });
};
