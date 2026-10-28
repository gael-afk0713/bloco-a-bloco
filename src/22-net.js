// =====================================================================
// Sala por código: várias pessoas no mesmo projeto, sem conta (no site)
// =====================================================================
// As mensagens passam por um servidor MQTT público e gratuito. Tudo vai cifrado com uma chave
// tirada do código da sala, então o servidor só vê bytes embaralhados.
// Cada documento do projeto fica guardado no servidor como mensagem "retida": quem entra depois recebe o projeto.
const ROOM_WORDS = ["GATO", "PATO", "SAPO", "LOBO", "URSO", "TATU", "PUMA", "ZEBRA", "COBRA", "CORUJA", "FOCA", "LULA", "POLVO", "GALO", "ANTA", "MICO", "ARARA", "TUCANO", "LEAO", "PANDA"];
const newRoomCode = () => ROOM_WORDS[Math.floor(Math.random() * ROOM_WORDS.length)] + "-" + (1000 + Math.floor(Math.random() * 9000));
const normCode = c => String(c || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9]/g, "").replace(/^([A-Z]+)(\d+)$/, "$1-$2");
const validCode = c => /^[A-Z]{3,10}-\d{4}$/.test(c);
const BROKERS = ["wss://broker.emqx.io:8084/mqtt", "wss://broker.hivemq.com:8884/mqtt"];
const PEER_COLORS = ["#e5483d", "#2f7de1", "#1f9d55", "#c157c4", "#ef8a17", "#0f9fb0", "#8a55d6", "#d4513e"];
const te = new TextEncoder(), td = new TextDecoder();
const myRoom = () => { try { return normCode(localStorage.getItem("bab-sala")); } catch (_) { return ""; } };
const myName = () => { try { return localStorage.getItem("bab-nome") || ""; } catch (_) { return ""; } };

// Cliente MQTT 3.1.1 mínimo: conectar, assinar, publicar (QoS 0, com ou sem "reter") e ping
function mqttClient(urls, onMessage, onState) {
  let sock = null, alive = false, ping = null, tries = 0, urlIdx = 0, everOpen = false, stopped = false;
  const subs = [], cid = "bab" + uid() + uid();
  const cat = parts => { const n = parts.reduce((a, p) => a + p.length, 0), o = new Uint8Array(n); let i = 0; for (const p of parts) { o.set(p, i); i += p.length; } return o; };
  const s16 = b => Uint8Array.of(b.length >> 8, b.length & 255);
  const str = s => { const b = te.encode(s); return cat([s16(b), b]); };
  const vlen = n => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return Uint8Array.from(o); };
  const pkt = (h, ...body) => { const b = cat(body); return cat([Uint8Array.of(h), vlen(b.length), b]); };
  const send = p => { if (sock && sock.readyState === 1) { sock.send(p); return true; } return false; };
  let buf = new Uint8Array(0);
  function onData(chunk) {
    buf = cat([buf, chunk]);
    for (;;) {
      if (buf.length < 2) return;
      let mult = 1, len = 0, i = 1, d;
      do { if (i >= buf.length) return; d = buf[i++]; len += (d & 127) * mult; mult *= 128; } while (d & 128);
      if (buf.length < i + len) return;
      const h = buf[0], body = buf.subarray(i, i + len); buf = buf.slice(i + len);
      const type = h >> 4;
      if (type === 2) { // CONNACK
        if (body[1] !== 0) { sock.close(); continue; }
        alive = true; tries = 0; everOpen = true;
        subs.forEach((t, k) => send(pkt(0x82, Uint8Array.of(0, k + 1), str(t), Uint8Array.of(0))));
        onState(true);
      } else if (type === 3) { // PUBLISH
        const tl = (body[0] << 8) | body[1], topic = td.decode(body.subarray(2, 2 + tl));
        const qos = (h >> 1) & 3, start = 2 + tl + (qos ? 2 : 0);
        try { onMessage(topic, body.slice(start), !!(h & 1)); } catch (e) { console.warn(e); }
      }
    }
  }
  function open() {
    if (stopped) return;
    const url = urls[urlIdx % urls.length];
    try { sock = new WebSocket(url, ["mqtt"]); } catch (_) { return retry(); }
    sock.binaryType = "arraybuffer";
    sock.onopen = () => send(pkt(0x10, str("MQTT"), Uint8Array.of(4, 2, 0, 60), str(cid)));
    sock.onmessage = e => onData(new Uint8Array(e.data));
    sock.onclose = () => { const was = alive; alive = false; buf = new Uint8Array(0); if (was) onState(false); retry(); };
    sock.onerror = () => {};
  }
  function retry() {
    if (stopped) return;
    tries++;
    if (!everOpen && tries % 2 === 0) urlIdx++; // nunca conectou: tenta o outro servidor
    setTimeout(open, Math.min(15000, 600 * tries));
  }
  ping = setInterval(() => alive && send(Uint8Array.of(0xc0, 0)), 30000);
  open();
  return {
    subscribe(t) { subs.push(t); if (alive) send(pkt(0x82, Uint8Array.of(0, subs.length), str(t), Uint8Array.of(0))); },
    publish(t, payload, retain = false) { return alive && send(pkt(0x30 | (retain ? 1 : 0), str(t), payload)); },
    get online() { return alive; },
    close() { stopped = true; clearInterval(ping); try { send(Uint8Array.of(0xe0, 0)); sock?.close(); } catch (_) {} },
  };
}

async function roomCrypto(code) {
  const base = await crypto.subtle.importKey("raw", te.encode("bloco-a-bloco|" + code), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: te.encode("bab-sala-v1"), iterations: 120000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const hex = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", te.encode(s)))].slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join("");
  return {
    topic: "bab-sala-v1/" + await hex("topico|" + code),
    hex: s => hex(code + "|" + s),
    async seal(obj) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(JSON.stringify(obj)))); const o = new Uint8Array(12 + ct.length); o.set(iv); o.set(ct, 12); return o; },
    async open(bytes) { try { return JSON.parse(td.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.subarray(0, 12) }, key, bytes.subarray(12)))); } catch (_) { return null; } },
  };
}

// Devolve { db, room, ready }: db tem a mesma cara do banco local; room tem a mesma cara da sala do Claude
async function makeNetRoom(code, me) {
  const cr = await roomCrypto(code);
  const tsKey = "bab-sala-ts-" + code;
  let ts = {}; try { ts = JSON.parse(localStorage.getItem(tsKey) || "{}"); } catch (_) {}
  let tsTimer = null; const saveTs = () => { clearTimeout(tsTimer); tsTimer = setTimeout(() => { try { localStorage.setItem(tsKey, JSON.stringify(ts)); } catch (_) {} }, 500); };
  const seen = {}; // caminho -> carimbo de tempo que veio do servidor
  const topicOf = new Map(); const docTopic = async path => topicOf.get(path) || (topicOf.set(path, cr.topic + "/d/" + await cr.hex(path)), topicOf.get(path));
  let client = null, settled = false;
  async function pubDoc(path, d) {
    const t = ts[path] = Math.max(Date.now(), (ts[path] || 0) + 1); saveTs();
    const payload = await cr.seal({ path, d: d === undefined ? null : d, t });
    if (payload.length > 900000) { showBanner("Uma imagem ou som é grande demais para a sala e só ficou no seu computador. Use um arquivo menor."); return; }
    client?.publish(await docTopic(path), payload, true);
  }
  const ldb = makeLocalDB("bab-sala-" + code, { onWrite: (path, d) => pubDoc(path, d) });
  // Presença (quem está aqui, cursor, ator) e eventos (conversa, ▶ junto)
  const peersMap = new Map(), handlers = {};
  const myPres = { name: me.name, color: me.color };
  let peersFn = null, presTimer = null, lastPres = 0;
  const peersList = () => [{ peer: me.id, by: me.id, isMe: true, kind: "viewer", presence: { ...myPres } },
    ...[...peersMap.entries()].map(([id, p]) => ({ peer: id, by: id, isMe: false, kind: "viewer", presence: { ...p.pres, name: p.name, color: p.color } }))];
  const firePeers = () => peersFn?.({ peers: peersList() });
  const sendPres = async (bye = false) => { lastPres = Date.now(); client?.publish(cr.topic + "/p", await cr.seal({ k: "p", from: me.id, name: me.name, color: me.color, pres: myPres, bye })); };
  const schedulePres = () => { clearTimeout(presTimer); presTimer = setTimeout(sendPres, Math.max(0, 120 - (Date.now() - lastPres))); };
  setInterval(() => { sendPres(); const lim = Date.now() - 12000; let ch = false; for (const [id, p] of peersMap) if (p.last < lim) { peersMap.delete(id); ch = true; } if (ch) firePeers(); }, 4000);
  addEventListener("pagehide", () => sendPres(true));

  let readyRes, settledRes; const ready = new Promise(r => { readyRes = r; }), whenSettled = new Promise(r => { settledRes = r; });
  let settleTimer = null;
  const settle = () => { clearTimeout(settleTimer); settleTimer = setTimeout(async () => {
    // Manda para o servidor o que só existe aqui (projeto levado para a sala, ou mudanças feitas sem internet)
    const all = ldb._all();
    for (const path of Object.keys(all)) if (!(path in seen) || (ts[path] || 0) > seen[path]) await pubDoc(path, all[path]);
    settled = true; readyRes(); settledRes();
  }, 1800); };
  client = mqttClient(BROKERS, async (topic, bytes) => {
    const m = await cr.open(bytes); if (!m) return;
    if (topic.startsWith(cr.topic + "/d/")) {
      seen[m.path] = Math.max(seen[m.path] || 0, m.t);
      if (m.t > (ts[m.path] || 0)) { ts[m.path] = m.t; saveTs(); ldb._apply(m.path, m.d === null ? undefined : m.d); }
      if (!settled) settle();
    } else if (m.from === me.id) return;
    else if (m.k === "p") {
      if (m.bye) { peersMap.delete(m.from); firePeers(); return; }
      const isNew = !peersMap.has(m.from);
      peersMap.set(m.from, { name: String(m.name || "Colega").slice(0, 30), color: m.color, pres: m.pres || {}, last: Date.now() });
      firePeers(); if (isNew) schedulePres();
    } else if (m.k === "e") (handlers[m.topic] || []).forEach(f => f({ data: m.data, isMe: false, sameTab: false, by: m.from, name: m.name }));
  }, on => {
    netState(on);
    if (on) { sendPres(); settle(); }
  });
  ["/d/#", "/p", "/e"].forEach(s => client.subscribe(cr.topic + s));
  setTimeout(() => { if (!settled) { netState(false, true); readyRes(); } }, 9000);
  const room = {
    presence: async patch => { Object.assign(myPres, patch); schedulePres(); },
    onPeers: fn => { peersFn = fn; firePeers(); },
    on: (topic, fn) => { (handlers[topic] ||= []).push(fn); },
    emit: async (topic, data) => {
      if (!client?.online) throw Object.assign(new Error("sem conexão"), { code: "offline" });
      client.publish(cr.topic + "/e", await cr.seal({ k: "e", topic, data, from: me.id, name: me.name }));
      (handlers[topic] || []).forEach(f => f({ data, isMe: true, sameTab: true, by: me.id, name: me.name }));
    },
  };
  ldb.net = true; ldb.code = code; ldb.canStart = () => settled; ldb.whenSettled = whenSettled;
  return { db: ldb, room, ready };
}
let netWasOff = false;
function netState(on, gaveUp) {
  if (on && netWasOff) { $("#banner").hidden = true; narrate("Conectado de novo à sala. As mudanças foram enviadas."); }
  if (!on) { netWasOff = true; showBanner(gaveUp ? "Ainda não consegui conectar à sala. Confira a internet; vou continuar tentando, e o que você fizer fica guardado neste computador." : "A conexão com a sala caiu. Continue trabalhando: vou mandar as mudanças quando ela voltar."); }
}
// Link com ?sala=CÓDIGO: entra direto se a pessoa já disse o nome; senão, pergunta o nome primeiro
let pendingRoom = "";
(() => {
  if (IN_CLAUDE) return;
  const q = normCode(new URLSearchParams(location.search).get("sala"));
  if (!validCode(q) || q === myRoom()) return;
  if (myName()) { try { localStorage.setItem("bab-sala", q); } catch (_) {} }
  else pendingRoom = q;
})();
