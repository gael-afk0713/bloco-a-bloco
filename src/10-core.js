"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 11);
const num = v => { if (typeof v === "number") return Number.isNaN(v) ? 0 : v; if (typeof v === "boolean") return v ? 1 : 0; const s = String(v ?? "").trim(); if (s === "") return 0; const n = Number(s); return Number.isNaN(n) ? 0 : n; };
const str = v => typeof v === "number" ? (Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6)) : typeof v === "boolean" ? (v ? "true" : "false") : String(v ?? "");
const bool = v => v === true || (v !== false && v !== 0 && v !== "" && v !== "0" && String(v).toLowerCase() !== "false");
const STAGE = "_stage_";
const IN_CLAUDE = !!(window.claude && window.claude.use);
const now = () => performance.now();
function deepMerge(a, b) { const o = { ...(a || {}) }; for (const k in b) o[k] = b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && o[k] && typeof o[k] === "object" && !Array.isArray(o[k]) ? deepMerge(o[k], b[k]) : b[k]; return o; }
function uniqueName(base, taken) { let n = base, i = 2; while (taken.includes(n)) n = base + i++; return n; }
function narrate(t) { $("#narr").textContent = t; }
function showBanner(t) { const b = $("#banner"); b.textContent = t; b.hidden = false; }
function hexToRgb(h) { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "")); if (!m) return [0, 0, 0]; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgbToHsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, mx ? d / mx : 0, mx]; }
function hsvToRgb(h, s, v) { const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]; }

if (!window.Blockly) {
  document.body.insertAdjacentHTML("afterbegin", '<div class="banner">Não consegui carregar o editor de blocos. Verifique a conexão e recarregue a página.</div>');
  throw new Error("Blockly ausente");
}

// ---------- Biblioteca original de atores ----------
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const LIB = {
  "robo-a": { name: "Faísca", svg: svg(96, 110, `<line x1="40" y1="22" x2="34" y2="6" stroke="#2d3a4a" stroke-width="4" stroke-linecap="round"/><circle cx="33" cy="6" r="5" fill="#f2b705"/><rect x="14" y="20" width="62" height="54" rx="16" fill="#3a72d6" stroke="#1d3d7a" stroke-width="3"/><circle cx="55" cy="44" r="12" fill="#fff"/><circle cx="59" cy="44" r="5" fill="#17202b"/><path d="M76 40 L90 47 L76 54 Z" fill="#3a72d6" stroke="#1d3d7a" stroke-width="3" stroke-linejoin="round"/><rect x="24" y="74" width="12" height="22" rx="5" fill="#2d3a4a"/><rect x="52" y="74" width="12" height="22" rx="5" fill="#2d3a4a"/><rect x="18" y="94" width="22" height="9" rx="4" fill="#17202b"/><rect x="46" y="94" width="22" height="9" rx="4" fill="#17202b"/>`) },
  "robo-b": { name: "Faísca andando", svg: svg(96, 110, `<line x1="40" y1="22" x2="30" y2="8" stroke="#2d3a4a" stroke-width="4" stroke-linecap="round"/><circle cx="29" cy="7" r="5" fill="#f2b705"/><rect x="14" y="20" width="62" height="54" rx="16" fill="#3a72d6" stroke="#1d3d7a" stroke-width="3"/><circle cx="55" cy="44" r="12" fill="#fff"/><circle cx="60" cy="42" r="5" fill="#17202b"/><path d="M76 40 L90 47 L76 54 Z" fill="#3a72d6" stroke="#1d3d7a" stroke-width="3" stroke-linejoin="round"/><rect x="16" y="72" width="12" height="22" rx="5" fill="#2d3a4a" transform="rotate(18 22 74)"/><rect x="58" y="72" width="12" height="22" rx="5" fill="#2d3a4a" transform="rotate(-18 64 74)"/><rect x="6" y="92" width="22" height="9" rx="4" fill="#17202b"/><rect x="62" y="92" width="22" height="9" rx="4" fill="#17202b"/>`) },
  "robo-c": { name: "Faísca pulando", svg: svg(96, 110, `<line x1="40" y1="22" x2="36" y2="4" stroke="#2d3a4a" stroke-width="4" stroke-linecap="round"/><circle cx="36" cy="4" r="5" fill="#f2b705"/><rect x="14" y="20" width="62" height="54" rx="16" fill="#3a72d6" stroke="#1d3d7a" stroke-width="3"/><circle cx="55" cy="42" r="12" fill="#fff"/><circle cx="58" cy="38" r="5" fill="#17202b"/><path d="M76 38 L90 45 L76 52 Z" fill="#3a72d6" stroke="#1d3d7a" stroke-width="3" stroke-linejoin="round"/><rect x="22" y="74" width="12" height="16" rx="5" fill="#2d3a4a" transform="rotate(-25 28 76)"/><rect x="54" y="74" width="12" height="16" rx="5" fill="#2d3a4a" transform="rotate(25 60 76)"/>`) },
  "bola": { name: "Bola", svg: svg(60, 60, `<circle cx="30" cy="30" r="27" fill="#e8573a" stroke="#8c2a17" stroke-width="3"/><path d="M8 22 Q30 34 52 22" fill="none" stroke="#fff" stroke-width="4"/><path d="M8 40 Q30 28 52 40" fill="none" stroke="#fff" stroke-width="4"/>`) },
  "estrela": { name: "Estrela", svg: svg(70, 68, `<path d="M35 3 L44 25 L68 26 L49 41 L56 65 L35 51 L14 65 L21 41 L2 26 L26 25 Z" fill="#f5c842" stroke="#a87b00" stroke-width="3" stroke-linejoin="round"/>`) },
  "coracao": { name: "Coração", svg: svg(64, 58, `<path d="M32 54 C10 38 2 26 6 15 C10 4 26 2 32 14 C38 2 54 4 58 15 C62 26 54 38 32 54 Z" fill="#e0457b" stroke="#8a1d45" stroke-width="3"/>`) },
  "nave": { name: "Nave", svg: svg(70, 90, `<path d="M35 4 C50 18 54 40 52 62 L18 62 C16 40 20 18 35 4 Z" fill="#dfe6ee" stroke="#4b5a6b" stroke-width="3"/><circle cx="35" cy="32" r="9" fill="#3bb3c2" stroke="#4b5a6b" stroke-width="3"/><path d="M18 46 L4 70 L20 64 Z M52 46 L66 70 L50 64 Z" fill="#e8573a" stroke="#4b5a6b" stroke-width="3" stroke-linejoin="round"/><path d="M26 64 L35 86 L44 64 Z" fill="#f2b705"/>`) },
  "asteroide": { name: "Asteroide", svg: svg(70, 64, `<path d="M14 10 L40 4 L62 16 L66 40 L50 60 L22 60 L4 40 Z" fill="#8a7a6a" stroke="#4a3f35" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="24" r="6" fill="#6e6155"/><circle cx="46" cy="42" r="8" fill="#6e6155"/>`) },
  "peixe": { name: "Peixe", svg: svg(96, 60, `<path d="M8 30 C24 6 62 6 78 30 C62 54 24 54 8 30 Z" fill="#2fb3a0" stroke="#145e54" stroke-width="3"/><path d="M76 30 L94 14 L94 46 Z" fill="#2fb3a0" stroke="#145e54" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="26" r="5" fill="#fff"/><circle cx="25" cy="26" r="2.5" fill="#17202b"/>`) },
  "arvore": { name: "Árvore", svg: svg(80, 110, `<rect x="33" y="62" width="14" height="44" rx="4" fill="#8a5a2b"/><circle cx="40" cy="40" r="32" fill="#2f9e4f" stroke="#1b5e2f" stroke-width="3"/><circle cx="26" cy="32" r="6" fill="#e8573a"/><circle cx="52" cy="48" r="6" fill="#e8573a"/>`) },
  "nuvem": { name: "Nuvem", svg: svg(110, 60, `<path d="M20 52 C4 52 4 30 20 30 C20 14 44 8 52 22 C60 8 86 12 84 30 C104 30 104 52 88 52 Z" fill="#ffffff" stroke="#9fb0c2" stroke-width="3"/>`) },
  "maca": { name: "Maçã", svg: svg(60, 66, `<path d="M30 16 C14 6 2 20 6 38 C10 56 22 64 30 58 C38 64 50 56 54 38 C58 20 46 6 30 16 Z" fill="#d93a3a" stroke="#7a1515" stroke-width="3"/><path d="M30 16 C30 10 32 6 36 3" stroke="#5a3a1a" stroke-width="3" fill="none"/><path d="M33 9 C40 2 48 6 48 6 C44 12 38 12 33 9 Z" fill="#2f9e4f"/>`) },
  "bloco": { name: "Bloco", svg: svg(60, 60, `<rect x="3" y="3" width="54" height="54" rx="6" fill="#8a4fc7" stroke="#4a2273" stroke-width="3"/><rect x="12" y="12" width="36" height="36" rx="4" fill="none" stroke="#c6a4ec" stroke-width="3"/>`) },
  "plataforma": { name: "Plataforma", svg: svg(200, 30, `<rect x="2" y="2" width="196" height="26" rx="5" fill="#7a5a3a" stroke="#3f2c1a" stroke-width="3"/><rect x="2" y="2" width="196" height="9" rx="4" fill="#58b85a"/>`) },
  "chao": { name: "Chão", svg: svg(480, 50, `<rect x="0" y="0" width="480" height="50" fill="#7a5a3a"/><rect x="0" y="0" width="480" height="14" fill="#58b85a"/>`) },
  "seta": { name: "Seta", svg: svg(80, 50, `<path d="M4 18 L50 18 L50 4 L76 25 L50 46 L50 32 L4 32 Z" fill="#17916b" stroke="#0b4a36" stroke-width="3" stroke-linejoin="round"/>`) },
  "moeda": { name: "Moeda", svg: svg(50, 50, `<circle cx="25" cy="25" r="22" fill="#f2b705" stroke="#9a6d00" stroke-width="3"/><circle cx="25" cy="25" r="14" fill="none" stroke="#ffd95a" stroke-width="3"/><text x="25" y="31" font-size="17" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#9a6d00">$</text>`) },
  "fantasma": { name: "Fantasminha", svg: svg(70, 80, `<path d="M8 76 L8 34 C8 14 22 4 35 4 C48 4 62 14 62 34 L62 76 L52 68 L44 76 L35 68 L26 76 L18 68 Z" fill="#f4f7fb" stroke="#7c8ea3" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="32" r="5" fill="#17202b"/><circle cx="44" cy="32" r="5" fill="#17202b"/><ellipse cx="35" cy="48" rx="6" ry="4" fill="#17202b"/>`) },
  "slime": { name: "Gosma", svg: svg(70, 50, `<path d="M4 46 C4 18 18 4 35 4 C52 4 66 18 66 46 Z" fill="#6cc26a" stroke="#2f6e2e" stroke-width="3"/><circle cx="25" cy="24" r="5" fill="#fff"/><circle cx="45" cy="24" r="5" fill="#fff"/><circle cx="26" cy="25" r="2.5" fill="#17202b"/><circle cx="46" cy="25" r="2.5" fill="#17202b"/>`) },
  "bandeira": { name: "Bandeira", svg: svg(60, 90, `<rect x="6" y="4" width="5" height="84" rx="2" fill="#4b5a6b"/><path d="M11 6 L56 18 L11 32 Z" fill="#e8573a" stroke="#8c2a17" stroke-width="2"/>`) },
  "botao": { name: "Botão", svg: svg(120, 50, `<rect x="3" y="3" width="114" height="44" rx="22" fill="#0f7c8a" stroke="#074a53" stroke-width="3"/><text x="60" y="31" font-size="18" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#fff">Jogar</text>`) },
  "raquete": { name: "Raquete", svg: svg(100, 20, `<rect x="2" y="2" width="96" height="16" rx="8" fill="#3a72d6" stroke="#1d3d7a" stroke-width="3"/>`) },
};
const SPRITE_LIB = [["Faísca", ["robo-a", "robo-b", "robo-c"]], ["Bola", ["bola"]], ["Estrela", ["estrela"]], ["Coração", ["coracao"]], ["Nave", ["nave"]], ["Asteroide", ["asteroide"]], ["Peixe", ["peixe"]], ["Árvore", ["arvore"]], ["Nuvem", ["nuvem"]], ["Maçã", ["maca"]], ["Bloco", ["bloco"]], ["Plataforma", ["plataforma"]], ["Chão", ["chao"]], ["Seta", ["seta"]], ["Moeda", ["moeda"]], ["Fantasminha", ["fantasma"]], ["Gosma", ["slime"]], ["Bandeira", ["bandeira"]], ["Botão", ["botao"]], ["Raquete", ["raquete"]]];
const libSrc = k => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(LIB[k].svg);

const BACKDROP_GEN = {
  branco: { name: "Branco", draw: c => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, 480, 360); } },
  xy: { name: "Plano x-y", draw: c => {
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, 480, 360); c.lineWidth = 1;
    for (let x = -200; x <= 200; x += 50) { c.strokeStyle = x ? "#e3e9ef" : "#9fb0c2"; c.beginPath(); c.moveTo(240 + x + .5, 0); c.lineTo(240 + x + .5, 360); c.stroke(); }
    for (let y = -150; y <= 150; y += 50) { c.strokeStyle = y ? "#e3e9ef" : "#9fb0c2"; c.beginPath(); c.moveTo(0, 180 - y + .5); c.lineTo(480, 180 - y + .5); c.stroke(); }
    c.fillStyle = "#7c8ea3"; c.font = "11px Arial"; for (let x = -200; x <= 200; x += 100) if (x) c.fillText(x, 240 + x + 3, 192); for (let y = -100; y <= 150; y += 100) if (y) c.fillText(y, 244, 180 - y - 3); } },
  ceu: { name: "Céu", draw: c => { const g = c.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, "#5fb2f0"); g.addColorStop(1, "#d6f0ff"); c.fillStyle = g; c.fillRect(0, 0, 480, 360); c.fillStyle = "#6cc26a"; c.fillRect(0, 300, 480, 60); } },
  noite: { name: "Espaço", draw: c => { c.fillStyle = "#0b1230"; c.fillRect(0, 0, 480, 360); let s = 7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; c.fillStyle = "#fff"; for (let i = 0; i < 90; i++) { c.globalAlpha = .4 + r() * .6; c.fillRect(r() * 480, r() * 360, 1.5, 1.5); } c.globalAlpha = 1; c.fillStyle = "#f5e7a1"; c.beginPath(); c.arc(400, 70, 26, 0, 7); c.fill(); } },
  grama: { name: "Campo", draw: c => { c.fillStyle = "#bfe6ff"; c.fillRect(0, 0, 480, 360); c.fillStyle = "#58b85a"; c.fillRect(0, 230, 480, 130); c.fillStyle = "#4aa24c"; for (let x = 0; x < 480; x += 24) c.fillRect(x, 230, 12, 130); c.fillStyle = "#ffd84a"; c.beginPath(); c.arc(70, 60, 30, 0, 7); c.fill(); } },
  mar: { name: "Fundo do mar", draw: c => { const g = c.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, "#2a8bc4"); g.addColorStop(1, "#0b3a5c"); c.fillStyle = g; c.fillRect(0, 0, 480, 360); c.fillStyle = "#e3c88f"; c.fillRect(0, 320, 480, 40); c.fillStyle = "rgba(255,255,255,.35)"; [[60, 260, 6], [80, 220, 4], [400, 240, 5], [420, 190, 3]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }); } },
  deserto: { name: "Deserto", draw: c => { const g = c.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, "#ffb36b"); g.addColorStop(1, "#ffe2b8"); c.fillStyle = g; c.fillRect(0, 0, 480, 360); c.fillStyle = "#e0a85a"; c.beginPath(); c.moveTo(0, 290); c.quadraticCurveTo(160, 230, 300, 290); c.quadraticCurveTo(400, 320, 480, 280); c.lineTo(480, 360); c.lineTo(0, 360); c.fill(); } },
  palco: { name: "Teatro", draw: c => { c.fillStyle = "#2b1a33"; c.fillRect(0, 0, 480, 360); c.fillStyle = "#8a2340"; c.fillRect(0, 0, 70, 360); c.fillRect(410, 0, 70, 360); c.fillStyle = "#7a4a2a"; c.fillRect(0, 300, 480, 60); } },
  cidade: { name: "Cidade", draw: c => { const g = c.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, "#ff9a6b"); g.addColorStop(1, "#ffd1a8"); c.fillStyle = g; c.fillRect(0, 0, 480, 360); [[0, 160, 70], [70, 120, 60], [130, 190, 80], [210, 90, 50], [260, 150, 90], [350, 110, 60], [410, 170, 70]].forEach(([x, h, w]) => { c.fillStyle = "#3a3550"; c.fillRect(x, 330 - h, w, h); c.fillStyle = "#ffd84a"; for (let yy = 340 - h; yy < 320; yy += 22) for (let xx = x + 8; xx < x + w - 10; xx += 16) c.fillRect(xx, yy, 7, 9); }); c.fillStyle = "#2a2638"; c.fillRect(0, 330, 480, 30); } },
  quadra: { name: "Quadra", draw: c => { c.fillStyle = "#1f7a4a"; c.fillRect(0, 0, 480, 360); c.strokeStyle = "#fff"; c.lineWidth = 4; c.strokeRect(10, 10, 460, 340); c.beginPath(); c.moveTo(240, 10); c.lineTo(240, 350); c.stroke(); c.beginPath(); c.arc(240, 180, 50, 0, 7); c.stroke(); } },
};

// ---------- Áudio: efeitos sintetizados, tambores, instrumentos e sons enviados ----------
let audioCtx = null;
const actx = () => { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended" && !(window.OfflineAudioContext && audioCtx instanceof OfflineAudioContext)) audioCtx.resume(); return audioCtx; };
const SOUNDS = {
  pop: { name: "Pop", dur: .12 }, bip: { name: "Bip", dur: .2 }, moeda: { name: "Moeda", dur: .35 }, pulo: { name: "Pulo", dur: .3 },
  laser: { name: "Laser", dur: .35 }, explosao: { name: "Explosão", dur: .7 }, tambor: { name: "Tambor", dur: .3 }, sino: { name: "Sino", dur: 1.2 },
  vitoria: { name: "Vitória", dur: .9 }, erro: { name: "Erro", dur: .5 }, dano: { name: "Dano", dur: .3 }, poder: { name: "Poder", dur: .6 },
  passo: { name: "Passo", dur: .08 }, agua: { name: "Água", dur: .4 }, alarme: { name: "Alarme", dur: .8 }, clique: { name: "Clique", dur: .05 },
};
const activeNodes = new Set();
function outNode(volume = 100, pan = 0) {
  const c = actx(), g = c.createGain(); g.gain.value = Math.max(0, Math.min(1, volume / 100));
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan / 100)); g.connect(p).connect(c.destination); } else g.connect(c.destination);
  return g;
}
function tone(type, f0, f1, t0, d, vol, out, k = 1, attack = .01) {
  const c = actx(), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(Math.max(1, f0 * k), t0); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1 * k), t0 + d);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(out); o.start(t0); o.stop(t0 + d + .03); activeNodes.add(o); o.onended = () => activeNodes.delete(o);
}
function noise(t0, d, vol, out, hp = 0, lp = 0) {
  const c = actx(), len = Math.max(1, Math.floor(c.sampleRate * d)), buf = c.createBuffer(1, len, c.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; g.gain.value = vol;
  let node = s;
  if (hp) { const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp; node.connect(f); node = f; }
  if (lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; node.connect(f); node = f; }
  node.connect(g).connect(out); s.start(t0); activeNodes.add(s); s.onended = () => activeNodes.delete(s);
}
function synthSound(key, out, k) {
  const t = actx().currentTime;
  switch (key) {
    case "pop": tone("sine", 600, 1200, t, .1, .5, out, k); break;
    case "bip": tone("square", 880, 0, t, .18, .2, out, k); break;
    case "moeda": tone("square", 988, 0, t, .08, .2, out, k); tone("square", 1319, 0, t + .08, .25, .2, out, k); break;
    case "pulo": tone("triangle", 300, 900, t, .28, .4, out, k); break;
    case "laser": tone("sawtooth", 1400, 200, t, .32, .25, out, k); break;
    case "explosao": noise(t, .7, .6, out, 0, 1200); tone("sine", 120, 40, t, .6, .5, out, k); break;
    case "tambor": tone("sine", 160, 50, t, .28, .8, out, k); noise(t, .08, .3, out); break;
    case "sino": tone("sine", 1046, 0, t, 1.2, .35, out, k); tone("sine", 2093, 0, t, .8, .12, out, k); break;
    case "vitoria": [523, 659, 784, 1046].forEach((f, i) => tone("triangle", f, 0, t + i * .13, i === 3 ? .5 : .14, .3, out, k)); break;
    case "erro": tone("sawtooth", 220, 110, t, .45, .25, out, k); break;
    case "dano": tone("square", 400, 80, t, .28, .3, out, k); noise(t, .1, .2, out); break;
    case "poder": [0, 1, 2, 3, 4, 5].forEach(i => tone("square", 400 + i * 120, 0, t + i * .08, .1, .15, out, k)); break;
    case "passo": noise(t, .07, .4, out, 0, 900); break;
    case "agua": tone("sine", 300, 1400, t, .12, .35, out, k); tone("sine", 500, 1600, t + .15, .12, .25, out, k); break;
    case "alarme": [0, 1, 2, 3].forEach(i => tone("square", i % 2 ? 660 : 880, 0, t + i * .2, .18, .15, out, k)); break;
    case "clique": noise(t, .03, .5, out, 2000); break;
  }
  return (SOUNDS[key] || { dur: .3 }).dur / k;
}
// Sons enviados ou gravados (guardados como data URL na coleção "media")
const media = new Map(), decoded = new Map();
function audioBuffer(id) {
  if (decoded.has(id)) return decoded.get(id);
  const url = media.get(id); if (!url) return null;
  decoded.set(id, "loading");
  fetch(url).then(r => r.arrayBuffer()).then(b => actx().decodeAudioData(b)).then(buf => decoded.set(id, buf)).catch(() => decoded.set(id, "error"));
  return "loading";
}
// Toca um som de um ator. Retorna a duração em segundos (ou null se ainda está carregando).
function playSoundEntry(entry, t) {
  const fx = t?.sfx || { pitch: 0, pan: 0 }, k = Math.pow(2, (fx.pitch || 0) / 120);
  const out = outNode(t ? t.volume : 100, fx.pan || 0);
  if (entry.kind === "audio") {
    const b = audioBuffer(entry.ref);
    if (b === "loading") return null;
    if (!b || b === "error") return 0;
    const s = actx().createBufferSource(); s.buffer = b; s.playbackRate.value = k; s.connect(out); s.start(); activeNodes.add(s); s.onended = () => activeNodes.delete(s);
    return b.duration / k;
  }
  return synthSound(entry.ref, out, k);
}
function stopSounds() { activeNodes.forEach(n => { try { n.stop(); } catch (_) {} }); activeNodes.clear(); try { speechSynthesis.cancel(); } catch (_) {} }

// Música
const DRUMS = [["1", "(1) Caixa"], ["2", "(2) Bumbo"], ["3", "(3) Aro"], ["4", "(4) Prato de ataque"], ["5", "(5) Chimbal aberto"], ["6", "(6) Chimbal fechado"], ["7", "(7) Pandeiro"], ["8", "(8) Palmas"], ["9", "(9) Claves"], ["10", "(10) Bloco de madeira"], ["11", "(11) Sino de vaca"], ["12", "(12) Triângulo"], ["13", "(13) Bongô"], ["14", "(14) Conga"], ["15", "(15) Cabaça"], ["16", "(16) Reco-reco"], ["17", "(17) Vibraslap"], ["18", "(18) Cuíca"]];
function playDrum(n, t) {
  const out = outNode(t ? t.volume : 100, t?.sfx?.pan || 0), c = actx(), z = c.currentTime;
  switch (String(n)) {
    case "1": noise(z, .2, .7, out, 1500); tone("triangle", 220, 120, z, .1, .4, out); break;
    case "2": tone("sine", 150, 45, z, .35, 1, out); break;
    case "3": tone("square", 1800, 0, z, .03, .3, out); noise(z, .03, .3, out, 3000); break;
    case "4": noise(z, 1.2, .5, out, 5000); break;
    case "5": noise(z, .45, .35, out, 7000); break;
    case "6": noise(z, .06, .4, out, 7000); break;
    case "7": noise(z, .25, .35, out, 6000); tone("triangle", 4000, 0, z, .08, .1, out); break;
    case "8": [0, .012, .024].forEach(d => noise(z + d, .05, .45, out, 1200, 3000)); break;
    case "9": tone("sine", 2500, 0, z, .06, .5, out); break;
    case "10": tone("sine", 900, 600, z, .08, .6, out); break;
    case "11": tone("square", 800, 0, z, .25, .2, out); tone("square", 540, 0, z, .25, .15, out); break;
    case "12": tone("sine", 3500, 0, z, 1, .25, out); tone("sine", 5200, 0, z, .7, .08, out); break;
    case "13": tone("sine", 400, 300, z, .15, .7, out); break;
    case "14": tone("sine", 300, 220, z, .2, .7, out); break;
    case "15": noise(z, .15, .4, out, 4000); break;
    case "16": [0, .03, .06, .09, .12].forEach(d => noise(z + d, .025, .4, out, 2500)); break;
    case "17": [0, .04, .08, .12, .16, .2].forEach((d, i) => tone("square", 600 - i * 30, 0, z + d, .03, .2, out)); break;
    case "18": tone("sine", 500, 900, z, .25, .5, out); tone("sine", 900, 400, z + .25, .2, .4, out); break;
  }
}
const INSTRUMENTS = [["1", "(1) Piano", "triangle", .01, .9], ["2", "(2) Piano elétrico", "sine", .01, .8], ["3", "(3) Órgão", "square", .03, 0], ["4", "(4) Violão", "triangle", .005, .5], ["5", "(5) Guitarra", "sawtooth", .005, .6], ["6", "(6) Baixo", "triangle", .01, .6, -12], ["7", "(7) Pizzicato", "triangle", .005, .25], ["8", "(8) Violoncelo", "sawtooth", .12, 0, -12], ["9", "(9) Trombone", "sawtooth", .06, 0], ["10", "(10) Clarinete", "square", .05, 0], ["11", "(11) Saxofone", "sawtooth", .04, 0], ["12", "(12) Flauta", "sine", .08, 0, 12], ["13", "(13) Flauta doce", "sine", .05, 0], ["14", "(14) Fagote", "square", .06, 0, -12], ["15", "(15) Coral", "sine", .2, 0], ["16", "(16) Vibrafone", "sine", .005, 1.2], ["17", "(17) Caixinha de música", "sine", .002, .6, 12], ["18", "(18) Tambor de aço", "triangle", .005, .7], ["19", "(19) Marimba", "sine", .003, .35], ["20", "(20) Sintetizador", "sawtooth", .01, 0], ["21", "(21) Sintetizador suave", "triangle", .25, 0]];
function playNote(midi, secs, t) {
  const ins = INSTRUMENTS.find(i => i[0] === String(t?.instrument || "1")) || INSTRUMENTS[0];
  const [, , wave, attack, decay, shift = 0] = ins;
  const c = actx(), out = outNode(t ? t.volume : 100, t?.sfx?.pan || 0), z = c.currentTime;
  const f = 440 * Math.pow(2, (midi + shift - 69) / 12) * Math.pow(2, (t?.sfx?.pitch || 0) / 120);
  const dur = Math.max(.05, decay ? Math.min(secs, decay * 2) : secs);
  const o = c.createOscillator(), g = c.createGain(); o.type = wave; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, z); g.gain.exponentialRampToValueAtTime(.3, z + attack);
  if (decay) g.gain.exponentialRampToValueAtTime(0.0001, z + dur); else { g.gain.setValueAtTime(.3, z + Math.max(attack, dur - .05)); g.gain.exponentialRampToValueAtTime(0.0001, z + dur); }
  o.connect(g).connect(out); o.start(z); o.stop(z + dur + .05); activeNodes.add(o); o.onended = () => activeNodes.delete(o);
}

// Fala
const VOICES = [["ALTO", "alto"], ["TENOR", "tenor"], ["SQUEAK", "esquilo"], ["GIANT", "gigante"], ["KITTEN", "gatinho"]];
const LANGS = [["pt-br", "Português (Brasil)"], ["pt-pt", "Português (Portugal)"], ["en", "Inglês"], ["es", "Espanhol"], ["fr", "Francês"], ["de", "Alemão"], ["it", "Italiano"], ["ja", "Japonês"], ["zh-cn", "Chinês"], ["ko", "Coreano"], ["ru", "Russo"]];
function speak(text, t) {
  return new Promise(res => {
    try {
      const v = t?.voice || "ALTO";
      const words = v === "KITTEN" ? String(text).split(/\s+/).filter(Boolean).map(() => "miau").join(" ") : String(text);
      const u = new SpeechSynthesisUtterance(words);
      u.lang = t?.lang || "pt-br";
      u.pitch = { ALTO: 1.1, TENOR: .7, SQUEAK: 2, GIANT: .1, KITTEN: 1.8 }[v] ?? 1;
      u.rate = { SQUEAK: 1.4, GIANT: .75 }[v] ?? 1;
      u.volume = Math.max(0, Math.min(1, (t?.volume ?? 100) / 100));
      const fallback = setTimeout(res, 1200 + words.length * 90);
      u.onend = u.onerror = () => { clearTimeout(fallback); res(); };
      speechSynthesis.speak(u);
    } catch (_) { res(); }
  });
}

// Microfone (volume do som). Só funciona onde o navegador permite.
let mic = null;
function loudness() {
  if (mic === null) {
    mic = "pending";
    navigator.mediaDevices?.getUserMedia({ audio: true }).then(stream => {
      const c = actx(), src = c.createMediaStreamSource(stream), an = c.createAnalyser(); an.fftSize = 1024; src.connect(an);
      mic = { an, data: new Float32Array(an.fftSize) };
    }).catch(() => { mic = "denied"; });
  }
  if (!mic || typeof mic === "string") return -1;
  mic.an.getFloatTimeDomainData(mic.data);
  let sum = 0; for (const v of mic.data) sum += v * v;
  return Math.min(100, Math.round(Math.sqrt(sum / mic.data.length) * 300));
}
