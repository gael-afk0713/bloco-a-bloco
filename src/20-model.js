// =====================================================================
// Banco de dados: compartilhado (dentro do Claude) ou local (neste navegador)
// =====================================================================
// hooks.onWrite (sala por código) recebe cada mudança feita aqui para mandar aos colegas
function makeLocalDB(KEY = "bab-projeto-v3", hooks = {}) {
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) {}
  const listeners = [];
  let timer = null;
  const persist = () => { clearTimeout(timer); timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { showBanner("O navegador não tem mais espaço para guardar este projeto. Use “Salvar no computador”."); } }, 300); };
  addEventListener("pagehide", () => { if (timer) { clearTimeout(timer); timer = null; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {} } });
  const snap = (id, d) => ({ id, exists: d !== undefined, data: () => d, metadata: { fromCache: false, hasPendingWrites: false } });
  const emit = (path, type, old) => {
    const [col, id] = path.split("/");
    listeners.forEach(l => {
      if (l.doc === path) l.fn(snap(id, data[path]));
      if (l.col === col) l.fn({ docChanges: () => [{ type, doc: snap(id, type === "removed" ? old : data[path]) }] });
    });
  };
  const doc = path => ({
    set: async d => { const had = path in data; data[path] = JSON.parse(JSON.stringify(d)); persist(); emit(path, had ? "modified" : "added"); hooks.onWrite?.(path, data[path]); },
    update: async d => { const had = path in data; data[path] = deepMerge(data[path], JSON.parse(JSON.stringify(d))); persist(); emit(path, had ? "modified" : "added"); hooks.onWrite?.(path, data[path]); },
    delete: async () => { if (!(path in data)) return; const old = data[path]; delete data[path]; persist(); emit(path, "removed", old); hooks.onWrite?.(path, undefined); },
    onSnapshot: fn => { const l = { doc: path, fn }; listeners.push(l); setTimeout(() => fn(snap(path.split("/")[1], data[path]))); return () => listeners.splice(listeners.indexOf(l), 1); },
  });
  return {
    local: !hooks.onWrite, doc,
    // Aplica uma mudança que veio de um colega (sem mandar de volta)
    _apply(path, d) {
      const had = path in data;
      if (d === undefined) { if (!had) return; const old = data[path]; delete data[path]; persist(); emit(path, "removed", old); return; }
      data[path] = d; persist(); emit(path, had ? "modified" : "added");
    },
    _all: () => data,
    collection: col => ({
      onSnapshot: fn => {
        const l = { col, fn }; listeners.push(l);
        setTimeout(() => fn({ docChanges: () => Object.keys(data).filter(p => p.split("/")[0] === col).map(p => ({ type: "added", doc: snap(p.split("/")[1], data[p]) })) }));
        return () => listeners.splice(listeners.indexOf(l), 1);
      },
    }),
  };
}
let db = null, room = null, user = null, sample = null, downloads = null;
let readOnly = false;
// Fila de escrita: no máximo uma escrita por documento por vez; atualizações seguidas se juntam
const pendingW = new Map(), runningW = new Set();
function write(path, op, data) {
  if (readOnly || !db) return;
  const prev = pendingW.get(path);
  if (prev && op === "update" && (prev.op === "update" || prev.op === "set")) { data = deepMerge(prev.data, data); op = prev.op; }
  pendingW.set(path, { op, data });
  if (!runningW.has(path)) drain(path);
}
async function drain(path) {
  runningW.add(path);
  while (pendingW.has(path)) {
    const { op, data } = pendingW.get(path); pendingW.delete(path);
    try { const d = db.doc(path); if (op === "delete") await d.delete(); else if (op === "update") await d.update(data); else await d.set(data); }
    catch (err) { onWriteError(err, path, op); }
  }
  runningW.delete(path);
}
const isPending = path => pendingW.has(path) || runningW.has(path);
function onWriteError(err, path, op) {
  const code = err && err.code;
  if (code === "invalid_argument" && op === "update") { write(path, "set", fullDoc(path)); return; }
  if (code === "invalid_argument") { readOnly = true; showBanner("Você pode ver este projeto, mas não editar. Peça a quem compartilhou para te dar acesso de Colaborador."); }
  else if (code === "quota_exceeded") showBanner("O projeto atingiu o limite de armazenamento. Apague imagens ou sons que não usa.");
  else showBanner("Não consegui salvar a última mudança. Ela continua na sua tela; tente de novo em instantes.");
}
function fullDoc(path) {
  const [col, id] = path.split("/");
  if (col === "sprites") return project.sprites.get(id) || {};
  if (path === "proj/meta") return project.meta;
  return {};
}

// =====================================================================
// Modelo do projeto
// =====================================================================
const emptyMeta = () => ({ title: "Meu projeto", vars: {}, lists: {}, msgs: {}, backdrops: {}, sounds: {}, procs: {}, curBackdrop: null });
const project = {
  meta: emptyMeta(),
  sprites: new Map(),   // id -> documento do ator
  scripts: new Map(),   // id do bloco do topo -> {sprite, block}
  images: new Map(),    // id -> data URL
};
const live = obj => Object.entries(obj || {}).filter(([, v]) => v && !v.deleted).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
const spriteList = () => [...project.sprites.entries()].filter(([, s]) => s && !s.deleted).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
const spriteByName = n => spriteList().find(([, s]) => s.name === n);
let curSid = null; // ator em edição (ou STAGE)
const curDoc = () => curSid === STAGE ? null : project.sprites.get(curSid);
const docOf = sid => sid === STAGE ? project.meta : project.sprites.get(sid);
function costumesOf(sid) { return sid === STAGE ? live(project.meta.backdrops) : live(project.sprites.get(sid)?.costumes); }
function soundsOf(sid) { return live(docOf(sid)?.sounds).map(([id, s]) => [id, { kind: "synth", ...s }]); }
function procsOf(sid) { return live(docOf(sid)?.procs); }

function updateSprite(sid, patch) {
  if (sid === STAGE) return updateMeta(patch);
  const cur = project.sprites.get(sid); if (!cur) return;
  project.sprites.set(sid, deepMerge(cur, patch));
  write("sprites/" + sid, "update", patch);
}
function updateMeta(patch) { project.meta = deepMerge(project.meta, patch); write("proj/meta", "update", patch); }
function saveImage(url) { const id = uid(); project.images.set(id, url); write("images/" + id, "set", { data: url }); return id; }
function saveMedia(url) { const id = uid(); media.set(id, url); write("media/" + id, "set", { data: url }); return id; }

function newSpriteDoc(name, costumes, extra = {}) {
  const taken = spriteList().map(([, s]) => s.name);
  return { name: uniqueName(name, taken), order: Date.now(), x: 0, y: 0, dir: 90, size: 100, visible: true, rot: "lr", draggable: false, costume: 0, costumes, sounds: { [uid()]: { name: "Pop", kind: "synth", ref: "pop", order: 0 } }, vars: {}, lists: {}, procs: {}, ...extra };
}
function addSpriteDoc(doc) {
  const id = uid();
  project.sprites.set(id, doc); write("sprites/" + id, "set", doc);
  rtEnsure(id); selectSprite(id); renderTiles();
  return id;
}
function addSpriteFromLib(name, keys) {
  const costumes = {};
  keys.forEach((k, i) => { costumes[uid()] = { name: LIB[k].name, kind: "lib", ref: k, order: i }; });
  return addSpriteDoc(newSpriteDoc(name, costumes, { x: Math.round(Math.random() * 200 - 100), y: Math.round(Math.random() * 140 - 70) }));
}
function addSpriteFromImage(name, url) {
  const imgId = saveImage(url);
  return addSpriteDoc(newSpriteDoc(name, { [uid()]: { name: "fantasia1", kind: "img", ref: imgId, order: 0 } }));
}
function starterData() {
  const costumes = {}; ["robo-a", "robo-b", "robo-c"].forEach((k, i) => { costumes["c" + i + uid()] = { name: LIB[k].name, kind: "lib", ref: k, order: i }; });
  const sid = "faisca" + uid().slice(0, 4);
  return {
    meta: { ...emptyMeta(), backdrops: { ["bd1" + uid()]: { name: "Plano x-y", kind: "gen", ref: "xy", order: 0 }, ["bd2" + uid()]: { name: "Céu", kind: "gen", ref: "ceu", order: 1 } }, sounds: { ["s" + uid()]: { name: "Sino", kind: "synth", ref: "sino", order: 0 } } },
    sprites: { [sid]: { ...newSpriteDoc("Faísca", costumes), name: "Faísca", order: 1 } },
    scripts: {}, images: {}, media: {},
  };
}
