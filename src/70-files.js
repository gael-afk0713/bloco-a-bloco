// =====================================================================
// Janelas, arquivos, pintura
// =====================================================================
let modalKeys = null; // Esc fecha a janela aberta
function modal(html, onMount) {
  const root = $("#modalRoot");
  root.innerHTML = `<div class="overlay" role="dialog" aria-modal="true"><div class="modal">${html}</div></div>`;
  const close = () => { root.innerHTML = ""; document.removeEventListener("keydown", modalKeys); modalKeys = null; };
  document.removeEventListener("keydown", modalKeys);
  modalKeys = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", modalKeys);
  root.querySelector(".overlay").addEventListener("click", e => { if (e.target.classList.contains("overlay")) close(); });
  root.querySelectorAll("[data-close]").forEach(b => b.onclick = close);
  onMount?.(root.querySelector(".modal"), close);
}
function askName(title, label, placeholder, allowLocal, cb) {
  modal(`<h2>${esc(title)}</h2><label class="label" for="nmIn">${esc(label)}</label><input type="text" id="nmIn" placeholder="Escreva um nome (ex.: ${esc(placeholder)})" maxlength="40">
    ${allowLocal && curSid !== STAGE ? `<label class="row"><input type="checkbox" id="nmLocal"> Só para este ator (cada clone tem a sua)</label>` : ""}
    <div class="row"><button class="btn primary" id="nmOk">Criar</button><button class="btn" data-close>Cancelar</button></div>`, (m, close) => {
    const go = () => { const v = $("#nmIn").value || placeholder; const local = $("#nmLocal")?.checked; close(); cb(v, local); };
    $("#nmOk").onclick = go; $("#nmIn").addEventListener("keydown", e => { if (e.key === "Enter") go(); }); setTimeout(() => $("#nmIn")?.focus(), 30);
  });
}
function confirmBox(text, okText, cb) {
  modal(`<h2>Tem certeza?</h2><p style="margin:0">${esc(text)}</p><div class="row"><button class="btn primary" id="cfOk">${esc(okText)}</button><button class="btn" data-close>Cancelar</button></div>`, (m, close) => { $("#cfOk").onclick = () => { close(); cb(); }; });
}
function pickFile(accept, cb) {
  const f = $("#fileIn"); f.value = ""; f.accept = accept;
  f.onchange = () => { const file = f.files[0]; if (file) cb(file); };
  f.click();
}
function readImage(file, cb) { const r = new FileReader(); r.onload = () => shrink(r.result, 480, (url) => cb(url)); r.readAsDataURL(file); }
// Reduz imagens grandes para caberem no projeto. Chama cb(url, fator de escala).
function shrink(src, max, cb, onFail) {
  const im = new Image();
  im.onload = () => {
    let w = im.naturalWidth || 100, h = im.naturalHeight || 100;
    let k = Math.min(1, max / Math.max(w, h));
    for (let attempt = 0; attempt < 5; attempt++) {
      const W = Math.max(1, Math.round(w * k)), H = Math.max(1, Math.round(h * k));
      const c = document.createElement("canvas"); c.width = W; c.height = H; c.getContext("2d").drawImage(im, 0, 0, W, H);
      let url = c.toDataURL("image/png");
      if (url.length > 170000) url = c.toDataURL("image/webp", .85);
      if (url.length <= 170000) { cb(url, W / w); return; }
      k *= .7;
    }
    narrate("Essa imagem é complexa demais para o projeto. Tente uma mais simples."); onFail?.();
  };
  im.onerror = () => { narrate("Não consegui abrir essa imagem."); onFail?.(); };
  im.src = src;
}
$("#addSpriteBtn").onclick = () => modal(`<h2>Escolha um ator</h2><div class="lib">${SPRITE_LIB.map(([n, ks], i) => `<button data-i="${i}"><img alt="" src="${esc(libSrc(ks[0]))}"><span>${esc(n)}</span></button>`).join("")}</div><button class="btn" data-close>Fechar</button>`, (m, close) => {
  m.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const [n, ks] = SPRITE_LIB[+b.dataset.i]; close(); addSpriteFromLib(n, ks); narrate(`Ator “${n}” adicionado. Os blocos que você montar agora são dele.`); });
});
$("#paintSpriteBtn").onclick = () => openPaint(null, url => addSpriteFromImage("Desenho", url));
$("#uploadSpriteBtn").onclick = () => pickFile("image/*", f => readImage(f, url => addSpriteFromImage(f.name.replace(/\.[^.]+$/, "").slice(0, 24) || "Imagem", url)));
function openPaint(costume, cb) {
  const COLS = ["#17202b", "#ffffff", "#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa", "#d81b60", "#8d6e63", "#90a4ae", "#00acc1"];
  modal(`<h2>${costume ? "Editar desenho" : "Pintar"}</h2>
    <div class="paint"><canvas id="pc" width="360" height="360"></canvas>
      <div class="row tools"><button class="btn small sel" data-tool="pen">✎ Pincel</button><button class="btn small" data-tool="line">╱ Linha</button><button class="btn small" data-tool="rect">▭ Retângulo</button><button class="btn small" data-tool="circle">◯ Círculo</button><button class="btn small" data-tool="fill">Balde</button><button class="btn small" data-tool="erase">Borracha</button><button class="btn small" data-tool="text">T Texto</button></div>
      <div class="row"><label class="label" for="pcSize">Grossura</label><input type="range" id="pcSize" min="2" max="40" value="8"><label class="row"><input type="checkbox" id="pcOutline"> só contorno</label><button class="btn small" id="pcUndo">↶ Desfazer</button><button class="btn small" id="pcClear">Limpar</button></div>
      <div class="swatches">${COLS.map((c, i) => `<button style="background:${c}" data-col="${c}" class="${i === 0 ? "sel" : ""}" aria-label="Cor ${c}"></button>`).join("")}<input type="color" id="pcColor" value="#17202b" aria-label="Outra cor"></div></div>
    <div class="row"><button class="btn primary" id="pcOk">Salvar</button><button class="btn" data-close>Cancelar</button></div>`, (m, close) => {
    const c = $("#pc"), g = c.getContext("2d", { willReadFrequently: true }), S = 360;
    let tool = "pen", col = COLS[0], drawing = null, snap = null; const undo = [];
    if (costume) { const im = imageFor(costume); if (im && im.complete) { const k = Math.min(320 / im.naturalWidth, 320 / im.naturalHeight, 3); g.drawImage(im, S / 2 - im.naturalWidth * k / 2, S / 2 - im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k); } }
    const pos = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * S / r.width, (e.clientY - r.top) * S / r.height]; };
    const setCol = v => { col = v; m.querySelectorAll("[data-col]").forEach(x => x.classList.toggle("sel", x.dataset.col === v)); };
    m.querySelectorAll("[data-tool]").forEach(b => b.onclick = () => { tool = b.dataset.tool; m.querySelectorAll("[data-tool]").forEach(x => x.classList.toggle("sel", x === b)); });
    m.querySelectorAll("[data-col]").forEach(b => b.onclick = () => setCol(b.dataset.col));
    $("#pcColor").oninput = e => setCol(e.target.value);
    $("#pcClear").onclick = () => { undo.push(g.getImageData(0, 0, S, S)); g.clearRect(0, 0, S, S); };
    $("#pcUndo").onclick = () => { const u = undo.pop(); if (u) g.putImageData(u, 0, 0); };
    c.addEventListener("pointerdown", e => {
      c.setPointerCapture(e.pointerId); const [x, y] = pos(e), size = +$("#pcSize").value;
      undo.push(g.getImageData(0, 0, S, S)); if (undo.length > 30) undo.shift();
      if (tool === "fill") { floodFill(g, Math.floor(x), Math.floor(y), col, S); return; }
      if (tool === "text") { modal(`<h2>Texto</h2><input type="text" id="ptx" maxlength="60" placeholder="Escreva aqui"><div class="row"><button class="btn primary" id="ptOk">Colocar</button></div>`, (mm, cl) => { $("#ptOk").onclick = () => { const v = $("#ptx").value; cl(); openPaintResume(v, x, y, size); }; }); return; }
      drawing = { x, y }; snap = g.getImageData(0, 0, S, S);
      if (tool === "pen" || tool === "erase") { g.globalCompositeOperation = tool === "erase" ? "destination-out" : "source-over"; g.fillStyle = col; g.beginPath(); g.arc(x, y, size / 2, 0, 7); g.fill(); g.globalCompositeOperation = "source-over"; }
    });
    // O texto abre outra janela; guardamos o desenho para voltar a ele
    const saved = { g, c };
    function openPaintResume(text, x, y, size) {
      const data = saved.g.getImageData(0, 0, S, S);
      openPaint(null, cb);
      setTimeout(() => { const g2 = $("#pc").getContext("2d"); g2.putImageData(data, 0, 0); g2.fillStyle = col; g2.font = `bold ${size * 3}px Arial`; g2.fillText(text, x, y); }, 0);
    }
    c.addEventListener("pointermove", e => {
      if (!drawing) return; const [x, y] = pos(e), size = +$("#pcSize").value, outline = $("#pcOutline").checked;
      if (tool === "pen" || tool === "erase") { g.globalCompositeOperation = tool === "erase" ? "destination-out" : "source-over"; g.strokeStyle = col; g.lineWidth = size; g.lineCap = "round"; g.beginPath(); g.moveTo(drawing.x, drawing.y); g.lineTo(x, y); g.stroke(); g.globalCompositeOperation = "source-over"; drawing = { x, y }; return; }
      g.putImageData(snap, 0, 0); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = size; g.lineCap = "round"; g.beginPath();
      if (tool === "line") { g.moveTo(drawing.x, drawing.y); g.lineTo(x, y); g.stroke(); return; }
      if (tool === "rect") g.rect(Math.min(drawing.x, x), Math.min(drawing.y, y), Math.abs(x - drawing.x), Math.abs(y - drawing.y));
      else g.ellipse((drawing.x + x) / 2, (drawing.y + y) / 2, Math.abs(x - drawing.x) / 2, Math.abs(y - drawing.y) / 2, 0, 0, 7);
      outline ? g.stroke() : g.fill();
    });
    c.addEventListener("pointerup", () => { drawing = null; });
    $("#pcOk").onclick = () => {
      const d = g.getImageData(0, 0, S, S).data; let l = S, r = -1, t = S, b = -1;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (d[(y * S + x) * 4 + 3] > 10) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
      if (r < 0) { close(); return; }
      const out = document.createElement("canvas"); out.width = r - l + 1; out.height = b - t + 1; out.getContext("2d").drawImage(c, l, t, out.width, out.height, 0, 0, out.width, out.height);
      close(); shrink(out.toDataURL("image/png"), 360, url => cb(url));
    };
  });
}
function floodFill(g, x, y, hex, S) {
  const im = g.getImageData(0, 0, S, S), d = im.data, i0 = (y * S + x) * 4, tgt = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
  const fill = [...hexToRgb(hex), 255];
  if (tgt.every((v, k) => v === fill[k])) return;
  const same = i => Math.abs(d[i] - tgt[0]) + Math.abs(d[i + 1] - tgt[1]) + Math.abs(d[i + 2] - tgt[2]) + Math.abs(d[i + 3] - tgt[3]) < 40;
  const st = [[x, y]];
  while (st.length) { const [px, py] = st.pop(); if (px < 0 || py < 0 || px >= S || py >= S) continue; const i = (py * S + px) * 4; if (!same(i)) continue; d[i] = fill[0]; d[i + 1] = fill[1]; d[i + 2] = fill[2]; d[i + 3] = 255; st.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]); }
  g.putImageData(im, 0, 0);
}

// =====================================================================
// Novo, salvar e abrir projetos (.json do Bloco a Bloco ou .sb3 do Scratch)
// =====================================================================
function projectData() {
  const sprites = {}; for (const [id, s] of project.sprites) if (!s.deleted) sprites[id] = s;
  const scripts = {}; for (const [id, s] of project.scripts) if (s.block) scripts[id] = s;
  const used = new Set(), usedMedia = new Set();
  const scan = obj => { for (const [, c] of live(obj)) if (c.kind === "img") used.add(c.ref); else if (c.kind === "audio") usedMedia.add(c.ref); };
  scan(project.meta.backdrops); scan(project.meta.sounds); Object.values(sprites).forEach(s => { scan(s.costumes); scan(s.sounds); });
  const images = {}; used.forEach(id => { if (project.images.has(id)) images[id] = project.images.get(id); });
  const med = {}; usedMedia.forEach(id => { if (media.has(id)) med[id] = media.get(id); });
  return { format: "bloco-a-bloco", version: 3, meta: project.meta, sprites, scripts, images, media: med };
}
async function saveToComputer() {
  diffWorkspace();
  const name = (project.meta.title || "projeto").replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "projeto";
  const data = JSON.stringify(projectData());
  if (downloads) {
    try { await downloads.save({ filename: name + ".json", data }); narrate("Projeto salvo no seu computador. Use “Abrir” para carregá-lo de novo."); }
    catch (e) { if (e?.code !== "declined") narrate("Não consegui salvar o arquivo aqui."); }
    return;
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/json" })); a.download = name + ".json";
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  narrate("Projeto salvo no seu computador. Use “Abrir” para carregá-lo de novo.");
}
// Substitui o projeto inteiro (também para a equipe, no modo compartilhado)
function loadProjectData(data, silent = false) {
  stopAll(true);
  const ids = { scripts: [...project.scripts.keys()], sprites: [...project.sprites.keys()] };
  for (const id of ids.scripts) if (!(data.scripts && id in data.scripts)) write("scripts/" + docId(id), "delete");
  for (const id of ids.sprites) if (!(data.sprites && id in data.sprites)) write("sprites/" + id, "delete");
  project.meta = { ...emptyMeta(), ...(data.meta || {}) };
  project.sprites = new Map(Object.entries(data.sprites || {}));
  project.scripts = new Map(Object.entries(data.scripts || {}));
  for (const [id, url] of Object.entries(data.images || {})) { project.images.set(id, url); write("images/" + id, "set", { data: url }); }
  for (const [id, url] of Object.entries(data.media || {})) { media.set(id, url); write("media/" + id, "set", { data: url }); }
  write("proj/meta", "set", project.meta);
  for (const [id, s] of project.sprites) write("sprites/" + id, "set", s);
  for (const [id, s] of project.scripts) write("scripts/" + docId(id), "set", { sprite: s.sprite, block: s.block, t: Date.now() });
  Object.values(data.scripts || {}).forEach(s => collectExtras(s.block));
  registerAllProcs();
  rt.targets = []; rt.vars = new Map(); rt.lists = new Map(); rt.stage = null; rt.backdrop = 0; penCtx.clearRect(0, 0, 480, 360);
  imgCache.clear(); bdCache.clear(); fxCache.clear();
  syncRuntime();
  $("#projTitle").value = project.meta.title || "Meu projeto";
  curSid = null; selectSprite(spriteList()[0]?.[0] || STAGE);
  renderTiles(); renderMonitors(); renderVarList(); updateLessons();
  if (!silent) narrate("Projeto carregado. Clique em ▶ para jogar.");
}
$("#mSave").onclick = saveToComputer;
$("#mNew").onclick = () => confirmBox("Começar um projeto novo? O projeto atual será substituído (também para quem está editando junto). Salve antes se quiser guardar.", "Começar do zero", () => loadProjectData(starterData()));
$("#mOpen").onclick = () => pickFile(".json,.sb3,application/json", async f => {
  try {
    narrate("Abrindo " + f.name + "…");
    const data = /\.sb3$/i.test(f.name) ? await importSb3(await f.arrayBuffer()) : JSON.parse(await f.text());
    if (!data || !data.sprites) throw new Error("formato");
    confirmBox(`Abrir “${f.name}”? O projeto atual será substituído (também para quem está editando junto).`, "Abrir", () => { loadProjectData(data); if (data.report) narrate(data.report); });
  } catch (e) { console.error(e); narrate("Não consegui abrir esse arquivo. Use um projeto salvo pelo Bloco a Bloco (.json) ou um projeto do Scratch 3 (.sb3)."); }
});

// =====================================================================
// Importar projetos do Scratch 3 (.sb3)
// =====================================================================
const lower = v => String(v).toLowerCase();
const SB3_KEYS = v => ({ "space": "space", "up arrow": "up", "down arrow": "down", "left arrow": "left", "right arrow": "right", "any": "any" })[v] || String(v).toLowerCase();
const SB3_OF = v => ({ "x position": "x", "y position": "y", "direction": "dir", "costume #": "costume#", "costume name": "costume", "size": "size", "volume": "volume", "backdrop #": "backdrop#", "backdrop name": "backdrop" })[v] ?? v;
const SB3_MATH = v => ({ "e ^": "e ^", "10 ^": "10 ^" })[v] || v;
// opcode do Scratch -> [nosso tipo, {entrada: nossa entrada}, {campo: [nosso campo, conversão]}, {entrada-menu: [nosso campo, campo do menu, conversão]}]
const SB3 = {
  motion_movesteps: ["mv_move", { STEPS: "STEPS" }], motion_turnright: ["mv_turnr", { DEGREES: "DEG" }], motion_turnleft: ["mv_turnl", { DEGREES: "DEG" }],
  motion_goto: ["mv_goto", {}, {}, { TO: ["TO", "TO"] }], motion_gotoxy: ["mv_gotoxy", { X: "X", Y: "Y" }],
  motion_glideto: ["mv_glideto", { SECS: "SECS" }, {}, { TO: ["TO", "TO"] }], motion_glidesecstoxy: ["mv_glide", { SECS: "SECS", X: "X", Y: "Y" }],
  motion_pointindirection: ["mv_pointdir", { DIRECTION: "DIR" }], motion_pointtowards: ["mv_pointto", {}, {}, { TOWARDS: ["TO", "TOWARDS"] }],
  motion_changexby: ["mv_changex", { DX: "DX" }], motion_setx: ["mv_setx", { X: "X" }], motion_changeyby: ["mv_changey", { DY: "DY" }], motion_sety: ["mv_sety", { Y: "Y" }],
  motion_ifonedgebounce: ["mv_bounce"], motion_setrotationstyle: ["mv_rotstyle", {}, { STYLE: ["STYLE", v => ({ "all around": "all", "left-right": "lr", "don't rotate": "none" })[v] || "all"] }],
  motion_xposition: ["mv_x"], motion_yposition: ["mv_y"], motion_direction: ["mv_dir"],
  looks_sayforsecs: ["lk_sayfor", { MESSAGE: "MSG", SECS: "SECS" }], looks_say: ["lk_say", { MESSAGE: "MSG" }], looks_thinkforsecs: ["lk_thinkfor", { MESSAGE: "MSG", SECS: "SECS" }], looks_think: ["lk_think", { MESSAGE: "MSG" }],
  looks_switchcostumeto: ["lk_costume", {}, {}, { COSTUME: ["COSTUME", "COSTUME"] }], looks_nextcostume: ["lk_nextcostume"],
  looks_switchbackdropto: ["lk_backdrop", {}, {}, { BACKDROP: ["BACKDROP", "BACKDROP", v => ({ "next backdrop": "_next_", "previous backdrop": "_prev_", "random backdrop": "_random_" })[v] || v] }],
  looks_switchbackdroptoandwait: ["lk_backdropwait", {}, {}, { BACKDROP: ["BACKDROP", "BACKDROP", v => ({ "next backdrop": "_next_", "previous backdrop": "_prev_", "random backdrop": "_random_" })[v] || v] }],
  looks_nextbackdrop: ["lk_nextbackdrop"], looks_changesizeby: ["lk_changesize", { CHANGE: "CHANGE" }], looks_setsizeto: ["lk_setsize", { SIZE: "SIZE" }],
  looks_changeeffectby: ["lk_changeeffect", { CHANGE: "CHANGE" }, { EFFECT: ["EFFECT", lower] }], looks_seteffectto: ["lk_seteffect", { VALUE: "VALUE" }, { EFFECT: ["EFFECT", lower] }], looks_cleargraphiceffects: ["lk_cleareffects"],
  looks_show: ["lk_show"], looks_hide: ["lk_hide"], looks_gotofrontback: ["lk_layer", {}, { FRONT_BACK: ["LAYER"] }], looks_goforwardbackwardlayers: ["lk_layers", { NUM: "NUM" }, { FORWARD_BACKWARD: ["DIR"] }],
  looks_costumenumbername: ["lk_costumenum", {}, { NUMBER_NAME: ["WHAT"] }], looks_backdropnumbername: ["lk_backdropnum", {}, { NUMBER_NAME: ["WHAT"] }], looks_size: ["lk_size"],
  sound_playuntildone: ["snd_playwait", {}, {}, { SOUND_MENU: ["SOUND", "SOUND_MENU"] }], sound_play: ["snd_play", {}, {}, { SOUND_MENU: ["SOUND", "SOUND_MENU"] }], sound_stopallsounds: ["snd_stop"],
  sound_changeeffectby: ["snd_changeeffect", { VALUE: "VALUE" }, { EFFECT: ["EFFECT", lower] }], sound_seteffectto: ["snd_seteffect", { VALUE: "VALUE" }, { EFFECT: ["EFFECT", lower] }], sound_cleareffects: ["snd_cleareffects"],
  sound_changevolumeby: ["snd_changevol", { VOLUME: "V" }], sound_setvolumeto: ["snd_setvol", { VOLUME: "V" }], sound_volume: ["snd_vol"],
  event_whenflagclicked: ["ev_flag"], event_whenkeypressed: ["ev_key", {}, { KEY_OPTION: ["KEY", SB3_KEYS] }], event_whenthisspriteclicked: ["ev_click"], event_whenstageclicked: ["ev_stageclick"],
  event_whenbackdropswitchesto: ["ev_backdrop", {}, { BACKDROP: ["BACKDROP"] }], event_whengreaterthan: ["ev_gt", { VALUE: "VALUE" }, { WHENGREATERTHANMENU: ["WHAT", lower] }],
  event_whenbroadcastreceived: ["ev_receive", {}, { BROADCAST_OPTION: ["MSG"] }], event_broadcast: ["ev_broadcast", {}, {}, { BROADCAST_INPUT: ["MSG", "BROADCAST_OPTION"] }], event_broadcastandwait: ["ev_broadcastwait", {}, {}, { BROADCAST_INPUT: ["MSG", "BROADCAST_OPTION"] }],
  control_wait: ["ct_wait", { DURATION: "SECS" }], control_repeat: ["ct_repeat", { TIMES: "TIMES", SUBSTACK: "SUBSTACK" }], control_forever: ["ct_forever", { SUBSTACK: "SUBSTACK" }],
  control_if: ["ct_if", { CONDITION: "COND", SUBSTACK: "SUBSTACK" }], control_if_else: ["ct_ifelse", { CONDITION: "COND", SUBSTACK: "SUBSTACK", SUBSTACK2: "SUBSTACK2" }],
  control_wait_until: ["ct_waituntil", { CONDITION: "COND" }], control_repeat_until: ["ct_repeatuntil", { CONDITION: "COND", SUBSTACK: "SUBSTACK" }], control_while: ["ct_while", { CONDITION: "COND", SUBSTACK: "SUBSTACK" }],
  control_for_each: ["ct_foreach", { VALUE: "N", SUBSTACK: "SUBSTACK" }, { VARIABLE: ["VAR"] }],
  control_stop: ["ct_stop", {}, { STOP_OPTION: ["WHAT", v => ({ "all": "all", "this script": "this" })[v] || "other"] }],
  control_start_as_clone: ["ct_startclone"], control_create_clone_of: ["ct_clone", {}, {}, { CLONE_OPTION: ["OF", "CLONE_OPTION"] }], control_delete_this_clone: ["ct_deleteclone"],
  sensing_touchingobject: ["sn_touching", {}, {}, { TOUCHINGOBJECTMENU: ["OBJ", "TOUCHINGOBJECTMENU"] }], sensing_touchingcolor: ["sn_touchcolor", { COLOR: "COLOR" }], sensing_coloristouchingcolor: ["sn_colortouch", { COLOR: "COLOR", COLOR2: "COLOR2" }],
  sensing_distanceto: ["sn_distance", {}, {}, { DISTANCETOMENU: ["OBJ", "DISTANCETOMENU"] }], sensing_askandwait: ["sn_ask", { QUESTION: "Q" }], sensing_answer: ["sn_answer"],
  sensing_keypressed: ["sn_keypressed", {}, {}, { KEY_OPTION: ["KEY", "KEY_OPTION", SB3_KEYS] }], sensing_mousedown: ["sn_mousedown"], sensing_mousex: ["sn_mousex"], sensing_mousey: ["sn_mousey"],
  sensing_setdragmode: ["sn_drag", {}, { DRAG_MODE: ["MODE", v => v === "draggable" ? "yes" : "no"] }], sensing_loudness: ["sn_loudness"], sensing_timer: ["sn_timer"], sensing_resettimer: ["sn_resettimer"],
  sensing_of: ["sn_of", {}, { PROPERTY: ["PROP", SB3_OF] }, { OBJECT: ["OBJ", "OBJECT"] }], sensing_current: ["sn_current", {}, { CURRENTMENU: ["WHAT", lower] }], sensing_dayssince2000: ["sn_days"], sensing_username: ["sn_username"],
  operator_add: ["op_add", { NUM1: "A", NUM2: "B" }], operator_subtract: ["op_sub", { NUM1: "A", NUM2: "B" }], operator_multiply: ["op_mul", { NUM1: "A", NUM2: "B" }], operator_divide: ["op_div", { NUM1: "A", NUM2: "B" }],
  operator_random: ["op_random", { FROM: "FROM", TO: "TO" }], operator_gt: ["op_gt", { OPERAND1: "A", OPERAND2: "B" }], operator_lt: ["op_lt", { OPERAND1: "A", OPERAND2: "B" }], operator_equals: ["op_eq", { OPERAND1: "A", OPERAND2: "B" }],
  operator_and: ["op_and", { OPERAND1: "A", OPERAND2: "B" }], operator_or: ["op_or", { OPERAND1: "A", OPERAND2: "B" }], operator_not: ["op_not", { OPERAND: "A" }],
  operator_join: ["op_join", { STRING1: "A", STRING2: "B" }], operator_letter_of: ["op_letter", { LETTER: "N", STRING: "S" }], operator_length: ["op_length", { STRING: "S" }], operator_contains: ["op_contains", { STRING1: "A", STRING2: "B" }],
  operator_mod: ["op_mod", { NUM1: "A", NUM2: "B" }], operator_round: ["op_round", { NUM: "A" }], operator_mathop: ["op_math", { NUM: "A" }, { OPERATOR: ["OP", SB3_MATH] }],
  data_variable: ["var_get", {}, { VARIABLE: ["VAR"] }], data_setvariableto: ["var_set", { VALUE: "VALUE" }, { VARIABLE: ["VAR"] }], data_changevariableby: ["var_change", { VALUE: "VALUE" }, { VARIABLE: ["VAR"] }],
  data_showvariable: ["var_show", {}, { VARIABLE: ["VAR"] }], data_hidevariable: ["var_hide", {}, { VARIABLE: ["VAR"] }],
  data_listcontents: ["list_get", {}, { LIST: ["LIST"] }], data_addtolist: ["list_add", { ITEM: "ITEM" }, { LIST: ["LIST"] }], data_deleteoflist: ["list_delete", { INDEX: "INDEX" }, { LIST: ["LIST"] }],
  data_deletealloflist: ["list_clear", {}, { LIST: ["LIST"] }], data_insertatlist: ["list_insert", { ITEM: "ITEM", INDEX: "INDEX" }, { LIST: ["LIST"] }], data_replaceitemoflist: ["list_replace", { INDEX: "INDEX", ITEM: "ITEM" }, { LIST: ["LIST"] }],
  data_itemoflist: ["list_item", { INDEX: "INDEX" }, { LIST: ["LIST"] }], data_itemnumoflist: ["list_indexof", { ITEM: "ITEM" }, { LIST: ["LIST"] }], data_lengthoflist: ["list_length", {}, { LIST: ["LIST"] }],
  data_listcontainsitem: ["list_contains", { ITEM: "ITEM" }, { LIST: ["LIST"] }], data_showlist: ["list_show", {}, { LIST: ["LIST"] }], data_hidelist: ["list_hide", {}, { LIST: ["LIST"] }],
  pen_clear: ["pen_clear"], pen_stamp: ["pen_stamp"], pen_penDown: ["pen_down"], pen_penUp: ["pen_up"], pen_setPenColorToColor: ["pen_color", { COLOR: "COLOR" }],
  pen_changePenColorParamBy: ["pen_changeparam", { VALUE: "V" }, {}, { COLOR_PARAM: ["PARAM", "colorParam"] }], pen_setPenColorParamTo: ["pen_setparam", { VALUE: "V" }, {}, { COLOR_PARAM: ["PARAM", "colorParam"] }],
  pen_changePenSizeBy: ["pen_changesize", { SIZE: "V" }], pen_setPenSizeTo: ["pen_size", { SIZE: "V" }],
  music_playDrumForBeats: ["mu_drum", { BEATS: "BEATS" }, {}, { DRUM: ["DRUM", "DRUM"] }], music_restForBeats: ["mu_rest", { BEATS: "BEATS" }], music_playNoteForBeats: ["mu_note", { NOTE: "NOTE", BEATS: "BEATS" }],
  music_setInstrument: ["mu_instr", {}, {}, { INSTRUMENT: ["INSTR", "INSTRUMENT"] }], music_setTempo: ["mu_settempo", { TEMPO: "T" }], music_changeTempo: ["mu_changetempo", { TEMPO: "T" }], music_getTempo: ["mu_tempo"],
  text2speech_speakAndWait: ["tts_speak", { WORDS: "W" }], text2speech_setVoice: ["tts_voice", {}, {}, { VOICE: ["VOICE", "voices"] }], text2speech_setLanguage: ["tts_lang", {}, {}, { LANGUAGE: ["LANG", "languages"] }],
};
async function importSb3(buf) {
  const zip = await JSZip.loadAsync(buf);
  const pj = JSON.parse(await zip.file("project.json").async("string"));
  const out = { format: "bloco-a-bloco", version: 3, meta: emptyMeta(), sprites: {}, scripts: {}, images: {}, media: {} };
  const missing = new Map(); let skippedSounds = 0;
  const fileUrl = async (name, mime) => { const f = zip.file(name); if (!f) return null; return `data:${mime};base64,` + await f.async("base64"); };
  const shrinkP = (src, max) => new Promise(res => shrink(src, max, (url, k) => res({ url, k }), () => res(null)));
  for (const target of pj.targets) {
    const sid = target.isStage ? STAGE : "s" + uid();
    const doc = target.isStage ? out.meta : { name: target.name, order: target.layerOrder || 0, layer: target.layerOrder || 0, x: target.x || 0, y: target.y || 0, dir: target.direction ?? 90, size: target.size ?? 100, visible: target.visible !== false,
      rot: ({ "all around": "all", "left-right": "lr", "don't rotate": "none" })[target.rotationStyle] || "all", draggable: !!target.draggable, costume: target.currentCostume || 0, costumes: {}, sounds: {}, vars: {}, lists: {}, procs: {} };
    // Fantasias / cenários
    const cKey = target.isStage ? "backdrops" : "costumes";
    for (const [i, c] of (target.costumes || []).entries()) {
      const fmt = (c.dataFormat || "png").toLowerCase(), name = c.md5ext || (c.assetId + "." + fmt);
      let url = await fileUrl(name, fmt === "svg" ? "image/svg+xml" : fmt === "jpg" ? "image/jpeg" : "image/" + fmt);
      let k = 1;
      if (!url) continue;
      if (url.length > 170000) { const r = await shrinkP(url, fmt === "svg" ? 720 : 480); if (!r) continue; url = r.url; k = r.k; }
      const imgId = uid(); out.images[imgId] = url;
      const res = (c.bitmapResolution || 1) * k;
      doc[cKey] = doc[cKey] || {};
      doc[cKey]["c" + uid()] = { name: c.name, kind: "img", ref: imgId, order: i, cx: (c.rotationCenterX ?? null) === null ? null : c.rotationCenterX * k, cy: (c.rotationCenterY ?? null) === null ? null : c.rotationCenterY * k, res };
    }
    if (target.isStage) { const first = Object.keys(out.meta.backdrops)[target.currentCostume || 0]; out.meta.curBackdrop = first || null; }
    // Sons
    for (const [i, s] of (target.sounds || []).entries()) {
      const fmt = (s.dataFormat || "wav").toLowerCase(), url = await fileUrl(s.md5ext || (s.assetId + "." + fmt), fmt === "mp3" ? "audio/mpeg" : "audio/wav");
      if (!url || url.length > 240000) { skippedSounds++; (doc.sounds = doc.sounds || {})["s" + uid()] = { name: s.name, kind: "synth", ref: "pop", order: i }; continue; }
      const mid = uid(); out.media[mid] = url;
      (doc.sounds = doc.sounds || {})["s" + uid()] = { name: s.name, kind: "audio", ref: mid, order: i };
    }
    // Variáveis, listas, mensagens
    for (const [, [n, v]] of Object.entries(target.variables || {})) (doc.vars = doc.vars || {})["v" + uid()] = { name: n, value: v, order: 0, shown: false };
    for (const [, [n, items]] of Object.entries(target.lists || {})) (doc.lists = doc.lists || {})["l" + uid()] = { name: n, items: items || [], order: 0, shown: false };
    for (const [, n] of Object.entries(target.broadcasts || {})) out.meta.msgs["m" + uid()] = { name: n, order: 0 };
    for (const m of pj.monitors || []) if (m.visible && m.spriteName === (target.isStage ? null : target.name)) {
      const name = m.params?.VARIABLE || m.params?.LIST, kind = m.opcode === "data_listcontents" ? "lists" : "vars";
      for (const v of Object.values(doc[kind] || {})) if (v.name === name) Object.assign(v, { shown: true, mx: m.x, my: m.y, mode: m.mode === "large" ? "large" : "normal" });
    }
    // Meus Blocos: lê os protótipos primeiro
    const blocks = target.blocks || {}, procByCode = {};
    for (const b of Object.values(blocks)) if (b && b.opcode === "procedures_prototype") {
      const mu = b.mutation || {}, code = mu.proccode || "bloco", names = JSON.parse(mu.argumentnames || "[]");
      const spec = []; let ai = 0;
      code.split(/(%[snb])/).forEach(part => { if (/^%[sn]$/.test(part)) spec.push({ k: "num", name: names[ai++] || "n" }); else if (part === "%b") spec.push({ k: "bool", name: names[ai++] || "b" }); else if (part.trim()) spec.push({ k: "label", text: part.trim() }); });
      const pid = "p" + uid(); procByCode[code] = { pid, ids: JSON.parse(mu.argumentids || "[]") };
      doc.procs = doc.procs || {}; doc.procs[pid] = { spec, warp: mu.warp === "true" || mu.warp === true, order: 0 };
      registerProc(pid, doc.procs[pid]);
    }
    const conv = (id, top) => convertSb3Block(blocks, id, procByCode, missing, top);
    for (const [id, b] of Object.entries(blocks)) {
      let json = null;
      if (Array.isArray(b)) { if (b[0] === 12) json = { type: "var_get", fields: { VAR: b[1] }, x: b[3] || 0, y: b[4] || 0 }; else if (b[0] === 13) json = { type: "list_get", fields: { LIST: b[1] }, x: b[3] || 0, y: b[4] || 0 }; }
      else if (b.topLevel && !b.shadow) { json = conv(id, true); if (json) { json.x = Math.round(b.x || 0); json.y = Math.round(b.y || 0); } }
      if (json) { json.id = json.id || uid() + uid(); out.scripts[json.id] = { sprite: sid, block: json }; }
    }
    if (!target.isStage) out.sprites[sid] = doc;
  }
  out.meta.title = "Projeto importado";
  const miss = [...missing.entries()].map(([k, n]) => `${k} (${n})`);
  out.report = `Projeto do Scratch importado.${miss.length ? " Alguns blocos não têm equivalente e ficaram de fora: " + miss.slice(0, 6).join(", ") + (miss.length > 6 ? "…" : "") + "." : " Todos os blocos foram convertidos."}${skippedSounds ? ` ${skippedSounds} som(ns) grande(s) demais foram trocados por “Pop”.` : ""}`;
  return out;
}
function convertSb3Block(blocks, id, procByCode, missing, top) {
  const b = blocks[id]; if (!b || Array.isArray(b)) return null;
  const nid = () => uid() + uid();
  let json;
  if (b.opcode === "procedures_definition") {
    const proto = blocks[b.inputs?.custom_block?.[1]]; const p = procByCode[proto?.mutation?.proccode];
    if (!p) return null;
    json = { type: "pd_" + p.pid, id: nid() };
  } else if (b.opcode === "procedures_call") {
    const p = procByCode[b.mutation?.proccode];
    if (!p) { missing.set("bloco personalizado", (missing.get("bloco personalizado") || 0) + 1); return nextOf(b); }
    json = { type: "pc_" + p.pid, id: nid(), inputs: {} };
    p.ids.forEach((argId, i) => { const inpArr = b.inputs?.[argId]; const kind = argSpecs("pc_" + p.pid)?.[i]?.[0] || "T"; const v = convInput(blocks, inpArr, kind, procByCode, missing); if (v) json.inputs["A" + i] = v; });
  } else if (b.opcode === "argument_reporter_string_number" || b.opcode === "argument_reporter_boolean") {
    json = { type: b.opcode === "argument_reporter_boolean" ? "proc_argb" : "proc_arg", id: nid(), fields: { VALUE: b.fields?.VALUE?.[0] ?? "" } };
  } else {
    const m = SB3[b.opcode];
    if (!m) { missing.set(b.opcode, (missing.get(b.opcode) || 0) + 1); return nextOf(b); }
    const [type, inMap = {}, fMap = {}, menuMap = {}] = m;
    json = { type, id: nid(), fields: {}, inputs: {} };
    const specs = Object.fromEntries(argSpecs(type).map(([k, n, d]) => [n, [k, d]]));
    for (const [sIn, ourIn] of Object.entries(inMap)) {
      const arr = b.inputs?.[sIn]; if (!arr) continue;
      if (ourIn.startsWith("SUBSTACK")) { const inner = typeof arr[1] === "string" ? convertSb3Block(blocks, arr[1], procByCode, missing) : null; if (inner) json.inputs[ourIn] = { block: inner }; continue; }
      const v = convInput(blocks, arr, specs[ourIn]?.[0] || "T", procByCode, missing, specs[ourIn]?.[1]); if (v) json.inputs[ourIn] = v;
    }
    for (const [sF, [ourF, fn]] of Object.entries(fMap)) { const raw = b.fields?.[sF]?.[0]; if (raw !== undefined) json.fields[ourF] = fn ? fn(raw) : raw; }
    for (const [sIn, [ourF, menuField, fn]] of Object.entries(menuMap)) {
      const arr = b.inputs?.[sIn]; if (!arr) continue;
      let raw;
      if (Array.isArray(arr[1])) raw = arr[1][1];                  // primitivo, ex.: [11, "mensagem", id]
      else {
        let mbId = arr[1];
        if (typeof mbId === "string" && blocks[mbId] && !blocks[mbId].shadow && typeof arr[2] === "string") mbId = arr[2]; // um bloco de valor cobre o menu: usa o menu de baixo
        const mb = blocks[mbId]; raw = mb?.fields?.[menuField]?.[0] ?? (mb && Object.values(mb.fields || {})[0]?.[0]);
      }
      if (raw !== undefined) json.fields[ourF] = fn ? fn(raw) : raw;
    }
    if (!Object.keys(json.fields).length) delete json.fields;
  }
  if (json.inputs && !Object.keys(json.inputs).length) delete json.inputs;
  if (b.next) { const n = convertSb3Block(blocks, b.next, procByCode, missing); if (n) json.next = { block: n }; }
  return json;
  function nextOf(bb) { return bb.next ? convertSb3Block(blocks, bb.next, procByCode, missing) : null; }
}
function convInput(blocks, arr, kind, procByCode, missing, def) {
  if (!arr) return null;
  const shadowType = kind === "N" ? "b_num" : kind === "C" ? "b_color" : kind === "B" ? null : "b_text";
  const prim = p => {
    if (!Array.isArray(p)) return null;
    const v = p[1];
    if (p[0] === 12) return { block: { type: "var_get", id: uid() + uid(), fields: { VAR: v } } };
    if (p[0] === 13) return { block: { type: "list_get", id: uid() + uid(), fields: { LIST: v } } };
    if (p[0] === 9 || shadowType === "b_color") return { shadow: { type: "b_color", fields: { COLOR: /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : "#e53935" } } };
    if (shadowType === "b_num" && v !== "" && Number.isFinite(Number(v))) return { shadow: { type: "b_num", fields: { NUM: Number(v) } } };
    return { shadow: { type: "b_text", fields: { TEXT: String(v ?? "") } } };
  };
  const out = {};
  const shadowSrc = arr[0] === 3 ? arr[2] : arr[1];
  if (Array.isArray(shadowSrc)) Object.assign(out, prim(shadowSrc));
  else if (typeof shadowSrc === "string" && blocks[shadowSrc]?.shadow) { const sb = blocks[shadowSrc]; const val = Object.values(sb.fields || {})[0]?.[0]; if (val !== undefined) Object.assign(out, prim([shadowType === "b_num" ? 4 : 10, val])); }
  if (!out.shadow && shadowType) out.shadow = { type: shadowType, fields: shadowType === "b_num" ? { NUM: Number(def) || 0 } : shadowType === "b_color" ? { COLOR: "#e53935" } : { TEXT: "" } };
  const real = arr[1];
  if (Array.isArray(real) && (real[0] === 12 || real[0] === 13)) Object.assign(out, prim(real));
  else if (typeof real === "string" && blocks[real] && !blocks[real].shadow) { const blk = convertSb3Block(blocks, real, procByCode, missing); if (blk) { delete blk.next; out.block = blk; } }
  return out.shadow || out.block ? out : null;
}
