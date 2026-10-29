// =====================================================================
// Exportar para o Scratch 3 (.sb3)
// =====================================================================
// MD5 (o Scratch nomeia cada arquivo de imagem e som pelo MD5 do conteúdo)
function md5(bytes) {
  const K = new Int32Array(64), S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
  const len = bytes.length, nBlk = ((len + 8) >> 6) + 1, W = new Int32Array(nBlk * 16);
  for (let i = 0; i < len; i++) W[i >> 2] |= bytes[i] << ((i % 4) * 8);
  W[len >> 2] |= 0x80 << ((len % 4) * 8);
  W[nBlk * 16 - 2] = (len * 8) | 0; W[nBlk * 16 - 1] = Math.floor(len / 536870912);
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  for (let blk = 0; blk < nBlk * 16; blk += 16) {
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) { f = (b & c) | (~b & d); g = i; } else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; } else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; } else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const s = S[(i >> 4) * 4 + (i % 4)], t = d; d = c; c = b;
      const x = (a + f + K[i] + W[blk + g]) | 0;
      b = (b + ((x << s) | (x >>> (32 - s)))) | 0; a = t;
    }
    a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
  }
  return [a0, b0, c0, d0].map(n => { let h = ""; for (let i = 0; i < 4; i++) h += ((n >>> (i * 8)) & 255).toString(16).padStart(2, "0"); return h; }).join("");
}
const dataUrlBytes = url => { const [head, b64] = url.split(","); const bin = /;base64/.test(head) ? atob(b64) : decodeURIComponent(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i) & 255; return u; };
const utf8 = s => new TextEncoder().encode(s);
function loadImg(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
function canvasPng(c) { return dataUrlBytes(c.toDataURL("image/png")); }
// WAV mono 16 bits
function encodeWav(buf) {
  const ch = buf.getChannelData(0), rate = buf.sampleRate, n = ch.length, out = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); out.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, "data"); out.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ch[i])) * 32767, true);
  return new Uint8Array(out.buffer);
}
// Grava um efeito sintetizado num arquivo de áudio (renderização sem tocar)
async function renderSynth(key) {
  const dur = (SOUNDS[key]?.dur || .3) + .15, rate = 22050;
  const off = new OfflineAudioContext(1, Math.ceil(dur * rate), rate);
  const prev = audioCtx; audioCtx = off;
  try { const g = off.createGain(); g.gain.value = .9; g.connect(off.destination); synthSound(key, g, 1); }
  finally { audioCtx = prev; }
  return off.startRendering();
}
async function decodeBytes(bytes) {
  const c = new OfflineAudioContext(1, 1, 22050);
  return c.decodeAudioData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

// Nosso tipo -> opcode do Scratch, construído a partir da tabela de importação (SB3)
const MENU_OPCODE = {
  "motion_goto.TO": "motion_goto_menu", "motion_glideto.TO": "motion_glideto_menu", "motion_pointtowards.TOWARDS": "motion_pointtowards_menu",
  "looks_switchcostumeto.COSTUME": "looks_costume", "looks_switchbackdropto.BACKDROP": "looks_backdrops", "looks_switchbackdroptoandwait.BACKDROP": "looks_backdrops",
  "sound_playuntildone.SOUND_MENU": "sound_sounds_menu", "sound_play.SOUND_MENU": "sound_sounds_menu", "control_create_clone_of.CLONE_OPTION": "control_create_clone_of_menu",
  "sensing_touchingobject.TOUCHINGOBJECTMENU": "sensing_touchingobjectmenu", "sensing_distanceto.DISTANCETOMENU": "sensing_distancetomenu", "sensing_keypressed.KEY_OPTION": "sensing_keyoptions",
  "sensing_of.OBJECT": "sensing_of_object_menu", "pen_changePenColorParamBy.COLOR_PARAM": "pen_menu_colorParam", "pen_setPenColorParamTo.COLOR_PARAM": "pen_menu_colorParam",
  "music_playDrumForBeats.DRUM": "music_menu_DRUM", "music_setInstrument.INSTRUMENT": "music_menu_INSTRUMENT", "text2speech_setVoice.VOICE": "text2speech_menu_voices", "text2speech_setLanguage.LANGUAGE": "text2speech_menu_languages",
};
const INV = {
  rot: { all: "all around", lr: "left-right", none: "don't rotate" },
  keys: { space: "space", up: "up arrow", down: "down arrow", left: "left arrow", right: "right arrow", any: "any" },
  stop: { all: "all", this: "this script", other: "other scripts in sprite" },
  drag: { yes: "draggable", no: "not draggable" },
  of: { x: "x position", y: "y position", dir: "direction", "costume#": "costume #", costume: "costume name", size: "size", volume: "volume", "backdrop#": "backdrop #", backdrop: "backdrop name" },
  backdrop: { _next_: "next backdrop", _prev_: "previous backdrop", _random_: "random backdrop" },
};
const REV = {};
for (const [opcode, [type, inMap = {}, fMap = {}, menuMap = {}]] of Object.entries(SB3)) {
  if (REV[type]) continue; // primeiro opcode de cada tipo vence
  REV[type] = { opcode, inputs: Object.fromEntries(Object.entries(inMap).map(([s, o]) => [o, s])), fields: {}, menus: {} };
  for (const [sF, [oF]] of Object.entries(fMap)) REV[type].fields[oF] = sF;
  for (const [sIn, [oF, menuField]] of Object.entries(menuMap)) REV[type].menus[oF] = [sIn, menuField];
}
// Como cada bloco vai para o Scratch: "ok" (existe lá), "adaptado" (vira outro bloco) ou "fora" (não existe lá)
const ADAPTED_TXT = { op_pow: "vira uma conta parecida feita com outros blocos", ev_keyup: "vira “quando a tecla for pressionada”", jg_log: "vira “dizer”" };
function scratchFate(type) {
  if (REV[type] || /^(pd_|pc_|proc_arg|b_)/.test(type)) return "ok";
  return ADAPTED_TXT[type] ? "adaptado" : "fora";
}
function invField(type, field, v) {
  if (field === "STYLE") return INV.rot[v] || "all around";
  if (field === "KEY") return INV.keys[v] || v;
  if (type === "ct_stop") return INV.stop[v] || "all";
  if (type === "sn_drag") return INV.drag[v] || "draggable";
  if (type === "sn_of" && field === "PROP") return INV.of[v] || v;
  if (field === "EFFECT" || field === "WHAT" && ["ev_gt", "sn_current"].includes(type)) return String(v).toUpperCase();
  if (field === "BACKDROP") return INV.backdrop[v] || v;
  if (field === "OBJ" || field === "TO" || field === "OF" || field === "SOLID") return v;
  return v;
}

async function exportSb3() {
  diffWorkspace();
  const report = new Map(); const skip = what => report.set(what, (report.get(what) || 0) + 1);
  const zip = new JSZip(), stored = new Set();
  const put = (bytes, ext) => { const id = md5(bytes); const name = id + "." + ext; if (!stored.has(name)) { zip.file(name, bytes); stored.add(name); } return { assetId: id, md5ext: name }; };
  const ids = { n: 0 }; const nid = () => "bab" + (++ids.n).toString(36) + uid().slice(0, 4);
  const extensions = new Set();
  // Variáveis e listas: nome -> id do Scratch
  const varIds = { [STAGE]: {} }, listIds = { [STAGE]: {} }, msgIds = {};
  const stageVars = {}, stageLists = {}, broadcasts = {};
  for (const [, v] of live(project.meta.vars)) { const id = nid(); varIds[STAGE][v.name] = id; stageVars[id] = [v.name, rt.vars.get(v.name) ?? v.value ?? 0]; }
  for (const [, l] of live(project.meta.lists)) { const id = nid(); listIds[STAGE][l.name] = id; stageLists[id] = [l.name, [...(rt.lists.get(l.name) || l.items || [])]]; }
  for (const [, m] of live(project.meta.msgs)) { const id = nid(); msgIds[m.name] = id; broadcasts[id] = m.name; }
  const varRef = (sid, name) => { const id = varIds[sid]?.[name] || varIds[STAGE][name]; if (id) return id; const nidv = nid(); varIds[STAGE][name] = nidv; stageVars[nidv] = [name, 0]; return nidv; };
  const listRef = (sid, name) => { const id = listIds[sid]?.[name] || listIds[STAGE][name]; if (id) return id; const nidl = nid(); listIds[STAGE][name] = nidl; stageLists[nidl] = [name, []]; return nidl; };
  const msgRef = name => { if (!msgIds[name]) { const id = nid(); msgIds[name] = id; broadcasts[id] = name; } return msgIds[name]; };

  // Converte um script (nosso JSON) para o dicionário de blocos do Scratch
  function convertScript(json, sid, blocks, procs) {
    function prim(sh, kind) {
      const f = sh?.fields || {};
      if (sh?.type === "b_color" || kind === "C") return [9, f.COLOR || "#e53935"];
      if (sh?.type === "b_num") return [4, str(f.NUM ?? 0)];
      return [kind === "N" ? 4 : 10, str(f.TEXT ?? f.NUM ?? "")];
    }
    function input(b, ourIn, kind, parentId) {
      const i = b.inputs?.[ourIn]; if (!i) return kind === "B" ? null : [1, kind === "N" ? [4, "0"] : [10, ""]];
      const shadow = kind === "B" ? null : prim(i.shadow, kind);
      if (i.block) {
        if (i.block.type === "var_get") return [3, [12, i.block.fields?.VAR ?? "", varRef(sid, i.block.fields?.VAR)], shadow || [10, ""]];
        if (i.block.type === "list_get") return [3, [13, i.block.fields?.LIST ?? "", listRef(sid, i.block.fields?.LIST)], shadow || [10, ""]];
        const id = conv(i.block, parentId, false); if (!id) return shadow ? [1, shadow] : null;
        return kind === "B" ? [2, id] : [3, id, shadow];
      }
      return shadow ? [1, shadow] : null;
    }
    function menu(opcode, sIn, menuField, value, parentId) {
      const mop = MENU_OPCODE[opcode + "." + sIn]; if (!mop) return null;
      const id = nid(); blocks[id] = { opcode: mop, next: null, parent: parentId, inputs: {}, fields: { [menuField]: [String(value), null] }, shadow: true, topLevel: false };
      return [1, id];
    }
    function conv(b, parentId, top, x, y) {
      if (!b) return null;
      const id = nid();
      const base = { next: null, parent: parentId, inputs: {}, fields: {}, shadow: false, topLevel: !!top };
      if (top) { base.x = Math.round(x || 0); base.y = Math.round(y || 0); }
      let node = null;
      const specs = Object.fromEntries(argSpecs(b.type).map(([k, n]) => [n, k]));
      if (b.type.startsWith("pd_") || b.type.startsWith("pc_")) {
        const p = procs[b.type.slice(3)]; if (!p) { skip("bloco personalizado"); return null; }
        if (b.type.startsWith("pd_")) {
          const protoId = nid(); node = { ...base, opcode: "procedures_definition", inputs: { custom_block: [1, protoId] } };
          const protoInputs = {};
          p.argIds.forEach((aid, i) => { const rid = nid(); blocks[rid] = { opcode: p.kinds[i] === "bool" ? "argument_reporter_boolean" : "argument_reporter_string_number", next: null, parent: protoId, inputs: {}, fields: { VALUE: [p.names[i], null] }, shadow: true, topLevel: false }; protoInputs[aid] = [1, rid]; });
          blocks[protoId] = { opcode: "procedures_prototype", next: null, parent: id, inputs: protoInputs, fields: {}, shadow: true, topLevel: false, mutation: { tagName: "mutation", children: [], proccode: p.code, argumentids: JSON.stringify(p.argIds), argumentnames: JSON.stringify(p.names), argumentdefaults: JSON.stringify(p.kinds.map(k => k === "bool" ? "false" : "")), warp: String(!!p.warp) } };
        } else {
          node = { ...base, opcode: "procedures_call", mutation: { tagName: "mutation", children: [], proccode: p.code, argumentids: JSON.stringify(p.argIds), warp: String(!!p.warp) } };
          p.argIds.forEach((aid, i) => { const r = input(b, "A" + i, p.kinds[i] === "bool" ? "B" : "T", id); if (r) node.inputs[aid] = r; });
        }
      } else if (b.type === "proc_arg" || b.type === "proc_argb") {
        node = { ...base, opcode: b.type === "proc_argb" ? "argument_reporter_boolean" : "argument_reporter_string_number", fields: { VALUE: [b.fields?.VALUE ?? "", null] } };
      } else if (b.type === "op_pow" && !b.inputs?.B?.block && Number.isInteger(num(b.inputs?.B?.shadow?.fields?.NUM ?? b.inputs?.B?.shadow?.fields?.TEXT)) && num(b.inputs?.B?.shadow?.fields?.NUM ?? b.inputs?.B?.shadow?.fields?.TEXT) >= 0 && num(b.inputs?.B?.shadow?.fields?.NUM ?? b.inputs?.B?.shadow?.fields?.TEXT) <= 12) {
        // a ^ n com n inteiro pequeno = a × a × … (exato)
        const n = num(b.inputs.B.shadow.fields.NUM ?? b.inputs.B.shadow.fields.TEXT);
        if (n === 0) node = { ...base, opcode: "operator_add", inputs: { NUM1: [1, [4, "1"]], NUM2: [1, [4, "0"]] } };
        else if (n === 1) node = { ...base, opcode: "operator_add", inputs: { NUM1: input(b, "A", "N", id), NUM2: [1, [4, "0"]] } };
        else {
          node = { ...base, opcode: "operator_multiply", inputs: { NUM1: input(b, "A", "N", id) } };
          let parent = id, holder = node;
          for (let k = 2; k < n; k++) { const m = nid(); blocks[m] = { opcode: "operator_multiply", next: null, parent, inputs: { NUM1: input(b, "A", "N", m) }, fields: {}, shadow: false, topLevel: false }; holder.inputs.NUM2 = [3, m, [4, ""]]; holder = blocks[m]; parent = m; }
          holder.inputs.NUM2 = input(b, "A", "N", parent);
        }
      } else if (b.type === "op_pow") {
        // a ^ b  =  e ^ (b × ln a)
        node = { ...base, opcode: "operator_mathop", fields: { OPERATOR: ["e ^", null] } };
        const mul = nid(), ln = nid();
        blocks[ln] = { opcode: "operator_mathop", next: null, parent: mul, inputs: { NUM: input(b, "A", "N", ln) }, fields: { OPERATOR: ["ln", null] }, shadow: false, topLevel: false };
        blocks[mul] = { opcode: "operator_multiply", next: null, parent: id, inputs: { NUM1: input(b, "B", "N", mul), NUM2: [3, ln, [4, ""]] }, fields: {}, shadow: false, topLevel: false };
        node.inputs.NUM = [3, mul, [4, ""]];
      } else if (b.type === "ev_keyup") {
        skip("quando a tecla for solta (virou “quando a tecla for pressionada”)");
        node = { ...base, opcode: "event_whenkeypressed", fields: { KEY_OPTION: [INV.keys[b.fields?.KEY] || b.fields?.KEY || "space", null] } };
      } else if (b.type === "jg_log") {
        skip("mostrar no console (virou “dizer”)");
        node = { ...base, opcode: "looks_say", inputs: { MESSAGE: input(b, "TEXT", "T", id) } };
      } else {
        const r = REV[b.type];
        if (!r) { skip(`“${blockText({ type: b.type, fields: {}, inputs: {} })}”`); if (top) return null; return b.next ? conv(b.next.block, parentId, false) : null; }
        node = { ...base, opcode: r.opcode };
        if (r.opcode === "control_stop") node.mutation = { tagName: "mutation", children: [], hasnext: String(b.fields?.WHAT === "other") };
        if (r.opcode.startsWith("pen_")) extensions.add("pen");
        if (r.opcode.startsWith("music_")) extensions.add("music");
        if (r.opcode.startsWith("text2speech_")) extensions.add("text2speech");
        for (const [ourIn, sIn] of Object.entries(r.inputs)) {
          if (ourIn.startsWith("SUBSTACK")) { const inner = b.inputs?.[ourIn]?.block; const cid = inner ? conv(inner, id, false) : null; if (cid) node.inputs[sIn] = [2, cid]; continue; }
          const v = input(b, ourIn, specs[ourIn] || "T", id); if (v) node.inputs[sIn] = v;
        }
        for (const [ourF, sF] of Object.entries(r.fields)) {
          const v = b.fields?.[ourF]; if (v === undefined) continue;
          if (sF === "VARIABLE") node.fields[sF] = [v, varRef(sid, v)];
          else if (sF === "LIST") node.fields[sF] = [v, listRef(sid, v)];
          else if (sF === "BROADCAST_OPTION") node.fields[sF] = [v, msgRef(v)];
          else node.fields[sF] = [invField(b.type, ourF, v), null];
        }
        for (const [ourF, [sIn, menuField]] of Object.entries(r.menus)) {
          const v = b.fields?.[ourF]; if (v === undefined) continue;
          if (sIn === "BROADCAST_INPUT") { node.inputs[sIn] = [1, [11, v, msgRef(v)]]; continue; }
          const m = menu(r.opcode, sIn, menuField, invField(b.type, ourF, v), id); if (m) node.inputs[sIn] = m;
        }
      }
      blocks[id] = node;
      if (b.next?.block) { const nx = conv(b.next.block, id, false); if (nx) node.next = nx; }
      return id;
    }
    return conv(json, null, true, json.x, json.y);
  }

  async function costumeAsset(c) {
    if (c.kind === "lib" && LIB[c.ref]) {
      const svgTxt = LIB[c.ref].svg, bytes = utf8(svgTxt), m = /width="(\d+)" height="(\d+)"/.exec(svgTxt);
      return { name: c.name, bitmapResolution: 1, dataFormat: "svg", ...put(bytes, "svg"), rotationCenterX: (m ? +m[1] : 100) / 2, rotationCenterY: (m ? +m[2] : 100) / 2 };
    }
    if (c.kind === "gen") { const cnv = backdropCanvas(c); return { name: c.name, bitmapResolution: 1, dataFormat: "png", ...put(canvasPng(cnv), "png"), rotationCenterX: 240, rotationCenterY: 180 }; }
    const url = project.images.get(c.ref); if (!url) return null;
    const res = c.res || 1;
    if (/^data:image\/svg/.test(url) && res === 1) { const im = await loadImg(url); return { name: c.name, bitmapResolution: 1, dataFormat: "svg", ...put(dataUrlBytes(url), "svg"), rotationCenterX: c.cx ?? im.naturalWidth / 2, rotationCenterY: c.cy ?? im.naturalHeight / 2 }; }
    // Imagens: redesenha em PNG com resolução 2 (o padrão do Scratch para bitmaps)
    const im = await loadImg(url), k = 2 / res, w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
    const cnv = document.createElement("canvas"); cnv.width = w; cnv.height = h; cnv.getContext("2d").drawImage(im, 0, 0, w, h);
    return { name: c.name, bitmapResolution: 2, dataFormat: "png", ...put(canvasPng(cnv), "png"), rotationCenterX: (c.cx ?? im.naturalWidth / 2) * k, rotationCenterY: (c.cy ?? im.naturalHeight / 2) * k };
  }
  async function soundAsset(s) {
    let bytes, buf, fmt = "wav";
    if (s.kind === "audio") {
      const url = media.get(s.ref); if (!url) return null;
      bytes = dataUrlBytes(url);
      try { buf = await decodeBytes(bytes); } catch (_) { skip("som que não pôde ser lido"); return null; }
      if (/audio\/mpeg|audio\/mp3/.test(url)) fmt = "mp3"; else if (!/audio\/(wav|x-wav|wave)/.test(url)) { bytes = encodeWav(buf); }
    } else { buf = await renderSynth(s.ref); bytes = encodeWav(buf); }
    return { name: s.name, ...put(bytes, fmt), dataFormat: fmt, format: "", rate: buf.sampleRate, sampleCount: buf.length };
  }
  async function target(sid) {
    const isStage = sid === STAGE, d = docOf(sid);
    const procs = {};
    for (const [pid, p] of live(d?.procs)) {
      const spec = p.spec || [], names = [], kinds = [], argIds = [];
      const code = spec.map(s => { if (s.k === "label") return s.text; names.push(s.name); kinds.push(s.k); argIds.push(nid()); return s.k === "bool" ? "%b" : "%s"; }).join(" ");
      procs[pid] = { code, names, kinds, argIds, warp: p.warp };
    }
    if (!isStage) { varIds[sid] = {}; listIds[sid] = {}; }
    const variables = isStage ? stageVars : {}, lists = isStage ? stageLists : {};
    const t = isStage ? rt.stage : rt.targets.find(x => x.sid === sid && !x.clone);
    if (!isStage) {
      for (const [, v] of live(d.vars)) { const id = nid(); varIds[sid][v.name] = id; variables[id] = [v.name, t?.vars.get(v.name) ?? v.value ?? 0]; }
      for (const [, l] of live(d.lists)) { const id = nid(); listIds[sid][l.name] = id; lists[id] = [l.name, [...(t?.lists.get(l.name) || l.items || [])]]; }
    }
    const blocks = {};
    for (const [, s] of project.scripts) if (s.sprite === sid && s.block) convertScript(s.block, sid, blocks, procs);
    const costumes = []; for (const [, c] of costumesOf(sid)) { const a = await costumeAsset(c); if (a) costumes.push(a); }
    const sounds = []; for (const [, s] of soundsOf(sid)) { const a = await soundAsset(s); if (a) sounds.push(a); }
    if (!costumes.length) { const blank = utf8('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>'); costumes.push({ name: isStage ? "cenário" : "fantasia", bitmapResolution: 1, dataFormat: "svg", ...put(blank, "svg"), rotationCenterX: 1, rotationCenterY: 1 }); }
    const common = { isStage, name: isStage ? "Stage" : d.name, variables, lists, broadcasts: isStage ? broadcasts : {}, blocks, comments: {}, currentCostume: Math.min(costumes.length - 1, isStage ? rt.backdrop : (t?.costume ?? d.costume ?? 0)), costumes, sounds, volume: t?.volume ?? 100 };
    if (isStage) return { ...common, layerOrder: 0, tempo: rt.tempo || 60, videoTransparency: 50, videoState: "on", textToSpeechLanguage: null };
    return { ...common, layerOrder: 0, visible: t ? t.visible : d.visible !== false, x: Math.round(t ? t.x : d.x || 0), y: Math.round(t ? t.y : d.y || 0), size: Math.round(t ? t.size : d.size ?? 100), direction: Math.round(t ? t.dir : d.dir ?? 90), draggable: !!d.draggable, rotationStyle: INV.rot[d.rot || "all"] };
  }
  const stageT = await target(STAGE);
  const sprites = [];
  // camadas: a ordem de desenho atual
  const order = rt.targets.filter(t => !t.clone).map(t => t.sid);
  for (const [sid] of spriteList().sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))) sprites.push(await target(sid));
  sprites.forEach((s, i) => { s.layerOrder = i + 1; });
  // Mostradores
  const monitors = [];
  const addMon = (kind, sid, v, id) => monitors.push({ id, mode: kind === "lists" ? "list" : (v.mode === "large" ? "large" : "default"), opcode: kind === "lists" ? "data_listcontents" : "data_variable", params: kind === "lists" ? { LIST: v.name } : { VARIABLE: v.name }, spriteName: sid === STAGE ? null : project.sprites.get(sid)?.name, value: kind === "lists" ? [] : 0, width: 0, height: 0, x: v.mx ?? 5, y: v.my ?? 5, visible: true, sliderMin: 0, sliderMax: 100, isDiscrete: true });
  for (const [, v] of live(project.meta.vars)) if (v.shown) addMon("vars", STAGE, v, varIds[STAGE][v.name]);
  for (const [, l] of live(project.meta.lists)) if (l.shown) addMon("lists", STAGE, l, listIds[STAGE][l.name]);
  for (const [sid, s] of spriteList()) { for (const [, v] of live(s.vars)) if (v.shown) addMon("vars", sid, v, varIds[sid]?.[v.name]); for (const [, l] of live(s.lists)) if (l.shown) addMon("lists", sid, l, listIds[sid]?.[l.name]); }
  const pj = { targets: [stageT, ...sprites], monitors: monitors.filter(m => m.id), extensions: [...extensions], meta: { semver: "3.0.0", vm: "15.2.0", agent: "Bloco a Bloco" } };
  zip.file("project.json", JSON.stringify(pj));
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  return { blob, report, pj };
}
async function exportToScratch() {
  narrate("Preparando o arquivo para o Scratch…");
  let r;
  try { r = await exportSb3(); } catch (e) { console.error(e); narrate("Não consegui exportar: " + (e.message || e)); return; }
  const base = (project.meta.title || "projeto").replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "projeto";
  const skipped = [...r.report.entries()].map(([k, n]) => `${k} (${n})`);
  const msg = skipped.length ? ` Alguns blocos do Bloco a Bloco não existem no Scratch e ficaram de fora ou foram adaptados: ${skipped.slice(0, 6).join(", ")}${skipped.length > 6 ? "…" : ""}.` : " Todos os blocos foram convertidos.";
  if (downloads) {
    try { await downloads.save({ filename: base + ".sb3", data: r.blob }); narrate("Arquivo .sb3 pronto. No Scratch: Arquivo → Carregar do seu computador." + msg); return; }
    catch (e) {
      if (e?.code === "rejected_extension" || e?.code === "extension_not_enabled") {
        try { await downloads.save({ filename: base + ".sb3.zip", data: r.blob }); narrate("Aqui só dá para baixar como .zip: renomeie o arquivo para terminar em .sb3 e abra no Scratch (Arquivo → Carregar do seu computador)." + msg); } catch (_) {}
      } else if (e?.code !== "declined") narrate("Não consegui salvar o arquivo aqui.");
      return;
    }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(r.blob); a.download = base + ".sb3";
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  narrate("Arquivo .sb3 baixado. No Scratch: Arquivo → Carregar do seu computador." + msg);
}
$("#mExport").onclick = exportToScratch;

refreshToolbox();
