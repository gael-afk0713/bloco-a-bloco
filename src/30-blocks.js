// =====================================================================
// Catálogo de blocos (todos os do Scratch 3 + extras para jogos)
// =====================================================================
const CAT = {
  mv: ["Movimento", "#4a7fe0"], lk: ["Aparência", "#8a55d6"], snd: ["Som", "#c157c4"], ev: ["Eventos", "#e3a400"],
  ct: ["Controle", "#ec8a24"], sn: ["Sensores", "#35a3d4"], op: ["Operadores", "#3aae5a"], var: ["Variáveis", "#ef6a2c"],
  list: ["Listas", "#d4513e"], proc: ["Meus Blocos", "#e8507a"], pen: ["Caneta", "#0e9f7e"], mu: ["Música", "#0f9fb0"],
  tts: ["Fala", "#6a7fb8"], jg: ["Jogo+", "#3d4fa8"],
};
const shade = (hex, k) => { const [r, g, b] = hexToRgb(hex); const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return "#" + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, "0")).join(""); };
const KEYS = [["espaço", "space"], ["seta para cima", "up"], ["seta para baixo", "down"], ["seta para a esquerda", "left"], ["seta para a direita", "right"], ["qualquer tecla", "any"], ...("abcdefghijklmnopqrstuvwxyz0123456789".split("").map(c => [c, c]))];
const keyName = e => ({ " ": "space", ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[e.key] || (e.key && e.key.length === 1 ? e.key.toLowerCase() : null));

// Opções dinâmicas. EXTRA guarda valores vindos de scripts (de outras pessoas ou importados) antes de o projeto conhecê-los.
const EXTRA = {};
const withExtra = (src, opts) => { const vals = new Set(opts.map(o => o[1])); [...(EXTRA[src] || [])].forEach(v => { if (!vals.has(v) && v !== "" && v != null) { opts.push([String(v), v]); vals.add(v); } }); return opts.length ? opts : [["(nenhum)", ""]]; };
const others = () => spriteList().filter(([id]) => id !== curSid).map(([, s]) => [s.name, s.name]);
const OF_PROPS = [["posição x", "x"], ["posição y", "y"], ["direção", "dir"], ["nº da fantasia", "costume#"], ["nome da fantasia", "costume"], ["tamanho", "size"], ["volume", "volume"], ["nº do cenário", "backdrop#"], ["nome do cenário", "backdrop"]];
const DYN = {
  touch: () => [["ponteiro do mouse", "_mouse_"], ["borda", "_edge_"], ...others()],
  goto: () => [["posição aleatória", "_random_"], ["ponteiro do mouse", "_mouse_"], ...others()],
  point: () => [["ponteiro do mouse", "_mouse_"], ...others()],
  dist: () => [["ponteiro do mouse", "_mouse_"], ...others()],
  clone: () => [["eu mesmo", "_myself_"], ...spriteList().map(([, s]) => [s.name, s.name])],
  of_obj: () => [["Palco", "_stage_"], ...spriteList().map(([, s]) => [s.name, s.name])],
  ofprop: () => [...OF_PROPS, ...[...new Set([...live(project.meta.vars), ...spriteList().flatMap(([, s]) => live(s.vars))].map(([, v]) => v.name))].map(n => ["variável: " + n, n])],
  solids: () => [["só a borda", "_edge_"], ...others()],
  costumes: () => costumesOf(curSid).map(([, c]) => [c.name, c.name]),
  backdrops: () => [...live(project.meta.backdrops).map(([, c]) => [c.name, c.name]), ["próximo cenário", "_next_"], ["cenário anterior", "_prev_"], ["cenário aleatório", "_random_"]],
  backdrops_hat: () => live(project.meta.backdrops).map(([, c]) => [c.name, c.name]),
  sounds: () => soundsOf(curSid).map(([, s]) => [s.name, s.name]),
  vars: () => [...live(project.meta.vars).map(([, v]) => [v.name, v.name]), ...(curDoc() ? live(curDoc().vars).map(([, v]) => [v.name + " (deste ator)", v.name]) : [])],
  lists: () => [...live(project.meta.lists).map(([, v]) => [v.name, v.name]), ...(curDoc() ? live(curDoc().lists).map(([, v]) => [v.name + " (deste ator)", v.name]) : [])],
  msgs: () => live(project.meta.msgs).map(([, m]) => [m.name, m.name]),
  params: () => [...new Set(procsOf(curSid).flatMap(([, p]) => (p.spec || []).filter(s => s.k === "num").map(s => s.name)))].map(n => [n, n]),
  bparams: () => [...new Set(procsOf(curSid).flatMap(([, p]) => (p.spec || []).filter(s => s.k === "bool").map(s => s.name)))].map(n => [n, n]),
};
const STATIC = {
  keys: KEYS,
  stop: [["tudo", "all"], ["este script", "this"], ["outros scripts no ator", "other"]],
  effect: [["cor", "color"], ["olho de peixe", "fisheye"], ["redemoinho", "whirl"], ["pixelar", "pixelate"], ["mosaico", "mosaic"], ["brilho", "brightness"], ["fantasma", "ghost"]],
  sndeffect: [["tom", "pitch"], ["esquerda/direita", "pan"]],
  rot: [["girar em volta", "all"], ["esquerda-direita", "lr"], ["não girar", "none"]],
  layer: [["da frente", "front"], ["de trás", "back"]],
  fwdback: [["para a frente", "forward"], ["para trás", "backward"]],
  numname: [["número", "number"], ["nome", "name"]],
  mathop: [["abs", "abs"], ["arredondar para baixo", "floor"], ["arredondar para cima", "ceiling"], ["raiz quadrada", "sqrt"], ["sen", "sin"], ["cos", "cos"], ["tan", "tan"], ["asen", "asin"], ["acos", "acos"], ["atan", "atan"], ["ln", "ln"], ["log", "log"], ["e ^", "e ^"], ["10 ^", "10 ^"]],
  current: [["ano", "year"], ["mês", "month"], ["dia", "date"], ["dia da semana", "dayofweek"], ["hora", "hour"], ["minuto", "minute"], ["segundo", "second"]],
  gtmenu: [["cronômetro", "timer"], ["volume do som", "loudness"]],
  drag: [["arrastável", "yes"], ["não arrastável", "no"]],
  penparam: [["cor", "color"], ["saturação", "saturation"], ["brilho", "brightness"], ["transparência", "transparency"]],
  drums: DRUMS,
  instruments: INSTRUMENTS.map(i => [i[1], i[0]]),
  voices: VOICES.map(([k, n]) => [n, k]),
  languages: LANGS.map(([k, n]) => [n, k]),
};
const SRCMAP = {}; // "tipo.campo" -> fonte dinâmica
const DEF = {};    // tipo -> metadados (categoria, tipo, dica, argumentos, texto)
// Argumentos: N:NOME:padrão (número)  T:NOME:padrão (texto)  C:NOME:#cor  B:NOME (condição)  D:NOME:fonte (menu)  S:NOME (encaixe)
function def(type, cat, lines, args, kind, tip, opts = {}) {
  DEF[type] = { cat, kind, tip, args, lines, adv: !!opts.adv, stageOk: opts.stageOk ?? cat !== "mv", spriteOk: opts.spriteOk ?? true, hidden: !!opts.hidden };
  const json = { type, style: cat + "_blocks", tooltip: tip, inputsInline: true };
  let ai = 0;
  (Array.isArray(lines) ? lines : [lines]).forEach((line, li) => {
    const count = (line.match(/%\d/g) || []).length;
    const a = args.slice(ai, ai + count); ai += count;
    json["message" + li] = line;
    json["args" + li] = a.map(spec => {
      const [k, name, extra] = spec.split(":");
      if (k === "N" || k === "T" || k === "C") return { type: "input_value", name };
      if (k === "B") return { type: "input_value", name, check: "Boolean" };
      if (k === "S") return { type: "input_statement", name };
      if (DYN[extra]) { SRCMAP[type + "." + name] = extra; return { type: "field_dropdown", name, options: () => withExtra(extra, DYN[extra]()) }; }
      return { type: "field_dropdown", name, options: STATIC[extra] };
    });
  });
  if (kind === "stmt" || kind === "c") { json.previousStatement = null; json.nextStatement = null; }
  if (kind === "cap") json.previousStatement = null;
  if (kind === "hat") json.nextStatement = null;
  if (kind === "rep") json.output = null;
  if (kind === "bool") json.output = "Boolean";
  Blockly.Blocks[type] = { init() { this.jsonInit(json); } };
}
// Campos editáveis dentro das entradas
Blockly.Blocks.b_num = { init() { this.jsonInit({ message0: "%1", args0: [{ type: "field_number", name: "NUM", value: 0 }], output: null, style: "shadow_blocks" }); } };
Blockly.Blocks.b_text = { init() { this.jsonInit({ message0: "%1", args0: [{ type: "field_input", name: "TEXT", text: "" }], output: null, style: "shadow_blocks" }); } };
Blockly.Blocks.b_color = {
  init() {
    this.jsonInit({ message0: "%1", args0: [{ type: "field_input", name: "COLOR", text: "#e53935" }], output: null, style: "shadow_blocks", tooltip: "Cor em #RRGGBB. Clique para escrever outra (ex.: #00ff00)." });
    this.getField("COLOR").setValidator(v => { v = String(v).trim(); if (/^[0-9a-f]{6}$/i.test(v)) v = "#" + v; return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null; });
    this.setOnChange(() => { const v = this.getFieldValue("COLOR"); if (v && this.getColour() !== v) this.setColour(v); });
  },
};

// Movimento
def("mv_move", "mv", "mover %1 passos", ["N:STEPS:10"], "stmt", "Anda para a frente, na direção em que o ator está olhando.");
def("mv_turnr", "mv", "girar ↻ %1 graus", ["N:DEG:15"], "stmt", "Gira no sentido do relógio.");
def("mv_turnl", "mv", "girar ↺ %1 graus", ["N:DEG:15"], "stmt", "Gira no sentido contrário ao relógio.");
def("mv_goto", "mv", "ir para %1", ["D:TO:goto"], "stmt", "Pula para um lugar: aleatório, o mouse ou outro ator.");
def("mv_gotoxy", "mv", "ir para x: %1 y: %2", ["N:X:0", "N:Y:0"], "stmt", "Pula para um ponto. O centro do palco é x: 0, y: 0.");
def("mv_glideto", "mv", "deslizar por %1 seg. até %2", ["N:SECS:1", "D:TO:goto"], "stmt", "Desliza até um lugar aleatório, o mouse ou outro ator.");
def("mv_glide", "mv", "deslizar por %1 seg. até x: %2 y: %3", ["N:SECS:1", "N:X:0", "N:Y:0"], "stmt", "Vai até o ponto devagar, levando o tempo que você escolher.");
def("mv_pointdir", "mv", "apontar para a direção %1", ["N:DIR:90"], "stmt", "90 = direita, 0 = cima, -90 = esquerda, 180 = baixo.");
def("mv_pointto", "mv", "apontar para %1", ["D:TO:point"], "stmt", "Vira o ator para olhar para o mouse ou outro ator.");
def("mv_changex", "mv", "mudar x por %1", ["N:DX:10"], "stmt", "Soma ao x (direita é positivo).");
def("mv_setx", "mv", "definir x como %1", ["N:X:0"], "stmt", "Coloca o ator nessa posição horizontal.");
def("mv_changey", "mv", "mudar y por %1", ["N:DY:10"], "stmt", "Soma ao y (cima é positivo).");
def("mv_sety", "mv", "definir y como %1", ["N:Y:0"], "stmt", "Coloca o ator nessa posição vertical.");
def("mv_bounce", "mv", "se tocar na borda, volte", [], "stmt", "Se encostar na beirada do palco, vira para o outro lado.");
def("mv_rotstyle", "mv", "definir estilo de rotação %1", ["D:STYLE:rot"], "stmt", "Escolhe como o ator gira: livre, só esquerda-direita ou sem girar.");
def("mv_x", "mv", "posição x", [], "rep", "Diz o x atual do ator.");
def("mv_y", "mv", "posição y", [], "rep", "Diz o y atual do ator.");
def("mv_dir", "mv", "direção", [], "rep", "Diz para onde o ator está apontando.");
// Aparência
def("lk_sayfor", "lk", "dizer %1 por %2 segundos", ["T:MSG:Olá!", "N:SECS:2"], "stmt", "Mostra um balão de fala e espera.");
def("lk_say", "lk", "dizer %1", ["T:MSG:Olá!"], "stmt", "Mostra um balão de fala até mudar.");
def("lk_thinkfor", "lk", "pensar %1 por %2 segundos", ["T:MSG:Hmm…", "N:SECS:2"], "stmt", "Mostra um balão de pensamento e espera.");
def("lk_think", "lk", "pensar %1", ["T:MSG:Hmm…"], "stmt", "Mostra um balão de pensamento.");
def("lk_costume", "lk", "mudar para a fantasia %1", ["D:COSTUME:costumes"], "stmt", "Troca a aparência do ator.", { stageOk: false });
def("lk_nextcostume", "lk", "próxima fantasia", [], "stmt", "Passa para a próxima fantasia. Em um laço, vira animação.", { stageOk: false });
def("lk_backdrop", "lk", "mudar para o cenário %1", ["D:BACKDROP:backdrops"], "stmt", "Troca o fundo do palco.");
def("lk_backdropwait", "lk", "mudar para o cenário %1 e esperar", ["D:BACKDROP:backdrops"], "stmt", "Troca o fundo e espera os scripts “quando o cenário mudar” terminarem.", { adv: true, spriteOk: false });
def("lk_nextbackdrop", "lk", "próximo cenário", [], "stmt", "Passa para o próximo fundo.");
def("lk_changesize", "lk", "mudar tamanho por %1", ["N:CHANGE:10"], "stmt", "Aumenta (ou diminui, com número negativo) o tamanho.", { stageOk: false });
def("lk_setsize", "lk", "definir tamanho como %1 %", ["N:SIZE:100"], "stmt", "100% é o tamanho normal.", { stageOk: false });
def("lk_changeeffect", "lk", "mudar efeito %1 por %2", ["D:EFFECT:effect", "N:CHANGE:25"], "stmt", "Efeitos visuais: cor, olho de peixe, redemoinho, pixelar, mosaico, brilho e fantasma.");
def("lk_seteffect", "lk", "definir efeito %1 como %2", ["D:EFFECT:effect", "N:VALUE:0"], "stmt", "Define o valor de um efeito visual.");
def("lk_cleareffects", "lk", "limpar efeitos gráficos", [], "stmt", "Remove todos os efeitos.");
def("lk_show", "lk", "mostrar", [], "stmt", "Deixa o ator visível.", { stageOk: false });
def("lk_hide", "lk", "esconder", [], "stmt", "Deixa o ator invisível.", { stageOk: false });
def("lk_layer", "lk", "ir para a camada %1", ["D:LAYER:layer"], "stmt", "Coloca o ator na frente ou atrás dos outros.", { stageOk: false });
def("lk_layers", "lk", "ir %1 %2 camadas", ["D:DIR:fwdback", "N:NUM:1"], "stmt", "Move o ator algumas camadas para a frente ou para trás.", { adv: true, stageOk: false });
def("lk_costumenum", "lk", "fantasia %1", ["D:WHAT:numname"], "rep", "Diz o número ou o nome da fantasia atual.", { stageOk: false });
def("lk_backdropnum", "lk", "cenário %1", ["D:WHAT:numname"], "rep", "Diz o número ou o nome do cenário.");
def("lk_size", "lk", "tamanho", [], "rep", "Diz o tamanho atual em %.", { stageOk: false });
// Som
def("snd_playwait", "snd", "tocar som %1 até o fim", ["D:SOUND:sounds"], "stmt", "Toca um som e espera ele acabar.");
def("snd_play", "snd", "tocar som %1", ["D:SOUND:sounds"], "stmt", "Começa um som e segue em frente.");
def("snd_stop", "snd", "parar todos os sons", [], "stmt", "Silencia tudo.");
def("snd_changeeffect", "snd", "mudar efeito %1 por %2", ["D:EFFECT:sndeffect", "N:VALUE:10"], "stmt", "Tom: mais agudo/grave (10 = meio tom). Esquerda/direita: de qual lado o som sai.", { adv: true });
def("snd_seteffect", "snd", "definir efeito %1 como %2", ["D:EFFECT:sndeffect", "N:VALUE:100"], "stmt", "Define um efeito de som.", { adv: true });
def("snd_cleareffects", "snd", "limpar efeitos sonoros", [], "stmt", "Volta o som ao normal.", { adv: true });
def("snd_changevol", "snd", "mudar volume por %1", ["N:V:-10"], "stmt", "Aumenta ou diminui o volume.");
def("snd_setvol", "snd", "definir volume como %1 %", ["N:V:100"], "stmt", "0% é mudo, 100% é o máximo.");
def("snd_vol", "snd", "volume", [], "rep", "Diz o volume atual.");
// Eventos
def("ev_flag", "ev", "quando ▶ for clicado", [], "hat", "Começa quando alguém clica na bandeira ▶.");
def("ev_key", "ev", "quando a tecla %1 for pressionada", ["D:KEY:keys"], "hat", "Começa quando você aperta essa tecla.");
def("ev_keyup", "ev", "quando a tecla %1 for solta", ["D:KEY:keys"], "hat", "Começa quando você solta essa tecla. (Extra do Bloco a Bloco)", { adv: true });
def("ev_click", "ev", "quando este ator for clicado", [], "hat", "Começa quando alguém clica no ator.", { stageOk: false });
def("ev_stageclick", "ev", "quando o palco for clicado", [], "hat", "Começa quando alguém clica no palco.", { spriteOk: false });
def("ev_backdrop", "ev", "quando o cenário mudar para %1", ["D:BACKDROP:backdrops_hat"], "hat", "Começa quando o fundo muda.");
def("ev_gt", "ev", "quando %1 > %2", ["D:WHAT:gtmenu", "N:VALUE:10"], "hat", "Começa quando o cronômetro (ou o volume do microfone) passa do valor.", { adv: true });
def("ev_receive", "ev", "quando eu receber %1", ["D:MSG:msgs"], "hat", "Começa quando alguém transmite essa mensagem.");
def("ev_broadcast", "ev", "transmitir %1", ["D:MSG:msgs"], "stmt", "Avisa todos os atores. Quem tem “quando eu receber” começa.");
def("ev_broadcastwait", "ev", "transmitir %1 e esperar", ["D:MSG:msgs"], "stmt", "Avisa todos e espera eles terminarem.");
// Controle
def("ct_wait", "ct", "esperar %1 segundos", ["N:SECS:1"], "stmt", "Faz uma pausa.");
def("ct_repeat", "ct", ["repetir %1 vezes", "%1"], ["N:TIMES:10", "S:SUBSTACK"], "c", "Roda os blocos de dentro várias vezes.");
def("ct_forever", "ct", ["sempre", "%1"], ["S:SUBSTACK"], "cap", "Roda os blocos de dentro sem parar.");
def("ct_if", "ct", ["se %1 então", "%1"], ["B:COND", "S:SUBSTACK"], "c", "Só roda os blocos de dentro se a condição for verdadeira.");
def("ct_ifelse", "ct", ["se %1 então", "%1", "senão", "%1"], ["B:COND", "S:SUBSTACK", "S:SUBSTACK2"], "c", "Se for verdade roda a primeira parte; se não, a segunda.");
def("ct_waituntil", "ct", "esperar até que %1", ["B:COND"], "stmt", "Fica parado até a condição ficar verdadeira.");
def("ct_repeatuntil", "ct", ["repetir até que %1", "%1"], ["B:COND", "S:SUBSTACK"], "c", "Repete até a condição ficar verdadeira.");
def("ct_while", "ct", ["enquanto %1", "%1"], ["B:COND", "S:SUBSTACK"], "c", "Repete enquanto a condição for verdadeira. (Extra)", { adv: true });
def("ct_foreach", "ct", ["para cada %1 de 1 até %2", "%1"], ["D:VAR:vars", "N:N:10", "S:SUBSTACK"], "c", "Conta de 1 até o número, guardando cada valor na variável. (Extra)", { adv: true });
def("ct_stop", "ct", "parar %1", ["D:WHAT:stop"], "cap", "Para tudo, só este script ou os outros scripts do ator.");
def("ct_startclone", "ct", "quando eu começar como clone", [], "hat", "Começa em cada cópia (clone) assim que ela nasce.", { stageOk: false });
def("ct_clone", "ct", "criar clone de %1", ["D:OF:clone"], "stmt", "Cria uma cópia de um ator.");
def("ct_deleteclone", "ct", "apagar este clone", [], "cap", "Apaga a cópia que está rodando este script.", { stageOk: false });
// Sensores
def("sn_touching", "sn", "tocando em %1 ?", ["D:OBJ:touch"], "bool", "Verdadeiro se o ator estiver encostando no mouse, na borda ou em outro ator.", { stageOk: false });
def("sn_touchcolor", "sn", "tocando na cor %1 ?", ["C:COLOR:#e53935"], "bool", "Verdadeiro se o ator encostar em algo dessa cor (no cenário, no desenho da caneta ou em outro ator).", { stageOk: false });
def("sn_colortouch", "sn", "a cor %1 está tocando a cor %2 ?", ["C:COLOR:#e53935", "C:COLOR2:#1e88e5"], "bool", "Verdadeiro se uma parte do ator com a primeira cor encostar na segunda cor.", { adv: true, stageOk: false });
def("sn_distance", "sn", "distância até %1", ["D:OBJ:dist"], "rep", "Quantos passos até o mouse ou outro ator.", { stageOk: false });
def("sn_ask", "sn", "perguntar %1 e esperar", ["T:Q:Qual é o seu nome?"], "stmt", "Mostra uma pergunta e espera a pessoa responder.");
def("sn_answer", "sn", "resposta", [], "rep", "O que a pessoa escreveu na última pergunta.");
def("sn_keypressed", "sn", "tecla %1 pressionada?", ["D:KEY:keys"], "bool", "Verdadeiro enquanto a tecla está apertada.");
def("sn_mousedown", "sn", "mouse pressionado?", [], "bool", "Verdadeiro enquanto o botão do mouse está apertado.");
def("sn_mousex", "sn", "mouse x", [], "rep", "Posição horizontal do mouse.");
def("sn_mousey", "sn", "mouse y", [], "rep", "Posição vertical do mouse.");
def("sn_drag", "sn", "definir modo de arrasto %1", ["D:MODE:drag"], "stmt", "Deixa quem joga arrastar o ator com o mouse.", { stageOk: false });
def("sn_loudness", "sn", "volume do som", [], "rep", "Volume do microfone, de 0 a 100 (-1 se o microfone não estiver disponível).", { adv: true });
def("sn_timer", "sn", "cronômetro", [], "rep", "Segundos desde o início (ou desde que foi zerado).");
def("sn_resettimer", "sn", "zerar cronômetro", [], "stmt", "Volta o cronômetro para 0.");
def("sn_of", "sn", "%1 de %2", ["D:PROP:ofprop", "D:OBJ:of_obj"], "rep", "Lê uma informação de outro ator ou do palco (ex.: posição x da Bola).");
def("sn_current", "sn", "%1 atual", ["D:WHAT:current"], "rep", "Data e hora de agora.");
def("sn_days", "sn", "dias desde 2000", [], "rep", "Quantos dias se passaram desde 1º de janeiro de 2000.", { adv: true });
def("sn_username", "sn", "nome de usuário", [], "rep", "O nome de quem está usando (quando disponível).", { adv: true });
// Operadores
def("op_add", "op", "%1 + %2", ["N:A:", "N:B:"], "rep", "Soma.");
def("op_sub", "op", "%1 - %2", ["N:A:", "N:B:"], "rep", "Subtração.");
def("op_mul", "op", "%1 * %2", ["N:A:", "N:B:"], "rep", "Multiplicação.");
def("op_div", "op", "%1 / %2", ["N:A:", "N:B:"], "rep", "Divisão.");
def("op_pow", "op", "%1 ^ %2", ["N:A:2", "N:B:3"], "rep", "Potência: 2 ^ 3 = 8. (Extra)", { adv: true });
def("op_random", "op", "número aleatório entre %1 e %2", ["N:FROM:1", "N:TO:10"], "rep", "Sorteia um número. Se os dois forem inteiros, sorteia inteiros.");
def("op_gt", "op", "%1 > %2", ["T:A:", "T:B:50"], "bool", "Verdadeiro se o primeiro for maior.");
def("op_lt", "op", "%1 < %2", ["T:A:", "T:B:50"], "bool", "Verdadeiro se o primeiro for menor.");
def("op_eq", "op", "%1 = %2", ["T:A:", "T:B:50"], "bool", "Verdadeiro se forem iguais (maiúsculas não importam).");
def("op_and", "op", "%1 e %2", ["B:A", "B:B"], "bool", "Verdadeiro se as duas forem verdadeiras.");
def("op_or", "op", "%1 ou %2", ["B:A", "B:B"], "bool", "Verdadeiro se pelo menos uma for verdadeira.");
def("op_not", "op", "não %1", ["B:A"], "bool", "Inverte: verdadeiro vira falso e vice-versa.");
def("op_join", "op", "juntar %1 com %2", ["T:A:maçã ", "T:B:banana"], "rep", "Cola dois textos.");
def("op_letter", "op", "letra %1 de %2", ["N:N:1", "T:S:maçã"], "rep", "Pega uma letra de um texto.");
def("op_length", "op", "tamanho de %1", ["T:S:maçã"], "rep", "Quantas letras tem o texto.");
def("op_contains", "op", "%1 contém %2 ?", ["T:A:maçã", "T:B:a"], "bool", "Verdadeiro se o texto tiver o pedaço.");
def("op_mod", "op", "resto de %1 por %2", ["N:A:", "N:B:"], "rep", "O que sobra da divisão. Ótimo para saber se é par.");
def("op_round", "op", "arredondar %1", ["N:A:"], "rep", "Arredonda para o inteiro mais próximo.");
def("op_math", "op", "%1 de %2", ["D:OP:mathop", "N:A:"], "rep", "Funções matemáticas.");
def("op_max", "op", "maior entre %1 e %2", ["N:A:", "N:B:"], "rep", "O maior dos dois números. (Extra)", { adv: true });
def("op_min", "op", "menor entre %1 e %2", ["N:A:", "N:B:"], "rep", "O menor dos dois números. (Extra)", { adv: true });
// Variáveis e listas
def("var_get", "var", "%1", ["D:VAR:vars"], "rep", "O valor guardado na variável.");
def("var_set", "var", "definir %1 como %2", ["D:VAR:vars", "T:VALUE:0"], "stmt", "Guarda um valor na variável.");
def("var_change", "var", "adicionar %2 a %1", ["D:VAR:vars", "N:VALUE:1"], "stmt", "Soma um número ao valor da variável.");
def("var_show", "var", "mostrar variável %1", ["D:VAR:vars"], "stmt", "Mostra a variável no palco.");
def("var_hide", "var", "esconder variável %1", ["D:VAR:vars"], "stmt", "Esconde a variável do palco.");
def("list_get", "list", "%1", ["D:LIST:lists"], "rep", "Todos os itens da lista juntos.");
def("list_add", "list", "inserir %1 em %2", ["T:ITEM:coisa", "D:LIST:lists"], "stmt", "Coloca um item no fim da lista.");
def("list_delete", "list", "apagar %1 de %2", ["N:INDEX:1", "D:LIST:lists"], "stmt", "Apaga o item dessa posição.");
def("list_clear", "list", "apagar todos os itens de %1", ["D:LIST:lists"], "stmt", "Esvazia a lista.");
def("list_insert", "list", "inserir %1 na posição %2 de %3", ["T:ITEM:coisa", "N:INDEX:1", "D:LIST:lists"], "stmt", "Coloca um item numa posição.");
def("list_replace", "list", "substituir item %1 de %2 por %3", ["N:INDEX:1", "D:LIST:lists", "T:ITEM:coisa"], "stmt", "Troca um item.");
def("list_item", "list", "item %1 de %2", ["N:INDEX:1", "D:LIST:lists"], "rep", "Lê o item dessa posição.");
def("list_indexof", "list", "posição de %1 em %2", ["T:ITEM:coisa", "D:LIST:lists"], "rep", "Em que posição o item está (0 se não estiver).");
def("list_length", "list", "tamanho de %1", ["D:LIST:lists"], "rep", "Quantos itens a lista tem.");
def("list_contains", "list", "%1 contém %2 ?", ["D:LIST:lists", "T:ITEM:coisa"], "bool", "Verdadeiro se o item estiver na lista.");
def("list_show", "list", "mostrar lista %1", ["D:LIST:lists"], "stmt", "Mostra a lista no palco.");
def("list_hide", "list", "esconder lista %1", ["D:LIST:lists"], "stmt", "Esconde a lista.");
// Meus Blocos: os blocos de definir/usar são criados dinamicamente; estes leem os parâmetros
def("proc_arg", "proc", "%1", ["D:VALUE:params"], "rep", "O valor que chegou nesta entrada do seu bloco.");
def("proc_argb", "proc", "%1", ["D:VALUE:bparams"], "bool", "A condição que chegou nesta entrada do seu bloco.");
// Caneta
def("pen_clear", "pen", "apagar tudo", [], "stmt", "Apaga todos os desenhos da caneta.");
def("pen_stamp", "pen", "carimbar", [], "stmt", "Deixa uma cópia da imagem do ator desenhada no palco.", { stageOk: false });
def("pen_down", "pen", "abaixar a caneta", [], "stmt", "A partir de agora, o ator risca por onde passa.", { stageOk: false });
def("pen_up", "pen", "levantar a caneta", [], "stmt", "O ator para de riscar.", { stageOk: false });
def("pen_color", "pen", "definir cor da caneta como %1", ["C:COLOR:#1e88e5"], "stmt", "Escolhe a cor do risco.", { stageOk: false });
def("pen_changeparam", "pen", "mudar %1 da caneta por %2", ["D:PARAM:penparam", "N:V:10"], "stmt", "Vai mudando cor, saturação, brilho ou transparência aos poucos.", { stageOk: false });
def("pen_setparam", "pen", "definir %1 da caneta como %2", ["D:PARAM:penparam", "N:V:50"], "stmt", "Define cor, saturação, brilho ou transparência (0 a 100).", { stageOk: false });
def("pen_changesize", "pen", "mudar tamanho da caneta por %1", ["N:V:1"], "stmt", "Engrossa ou afina o risco.", { stageOk: false });
def("pen_size", "pen", "definir tamanho da caneta como %1", ["N:V:3"], "stmt", "Grossura do risco.", { stageOk: false });
def("pen_text", "pen", "escrever %1 com tamanho %2", ["T:TEXT:Olá", "N:SIZE:20"], "stmt", "Escreve um texto no palco, na posição do ator, com a cor da caneta. (Extra)", { stageOk: false });
// Música
def("mu_drum", "mu", "tocar tambor %1 por %2 batidas", ["D:DRUM:drums", "N:BEATS:0.25"], "stmt", "Toca um instrumento de percussão.");
def("mu_rest", "mu", "pausa de %1 batidas", ["N:BEATS:0.25"], "stmt", "Espera um pouco no ritmo da música.");
def("mu_note", "mu", "tocar nota %1 por %2 batidas", ["N:NOTE:60", "N:BEATS:0.25"], "stmt", "60 é o Dó do meio. 62 é Ré, 64 é Mi, 65 é Fá, 67 é Sol…");
def("mu_instr", "mu", "mudar instrumento para %1", ["D:INSTR:instruments"], "stmt", "Escolhe o som das notas.");
def("mu_settempo", "mu", "definir andamento como %1", ["N:T:60"], "stmt", "Batidas por minuto. Mais alto = música mais rápida.");
def("mu_changetempo", "mu", "mudar andamento por %1", ["N:T:20"], "stmt", "Acelera ou desacelera a música.");
def("mu_tempo", "mu", "andamento", [], "rep", "Batidas por minuto agora.");
// Fala
def("tts_speak", "tts", "falar %1", ["T:W:olá"], "stmt", "O computador lê o texto em voz alta.");
def("tts_voice", "tts", "definir voz como %1", ["D:VOICE:voices"], "stmt", "Escolhe o tipo de voz.");
def("tts_lang", "tts", "definir idioma como %1", ["D:LANG:languages"], "stmt", "Escolhe o idioma da fala.");
// Jogo+ (extras do Bloco a Bloco)
def("jg_gravity", "jg", "definir gravidade como %1", ["N:G:1"], "stmt", "Quanto a velocidade y diminui a cada passo de física. 0 = sem gravidade.");
def("jg_setvx", "jg", "definir velocidade x como %1", ["N:V:5"], "stmt", "Velocidade para os lados, usada por “mover com física”.", { stageOk: false });
def("jg_setvy", "jg", "definir velocidade y como %1", ["N:V:12"], "stmt", "Velocidade para cima (positivo) ou para baixo. Use para pular.", { stageOk: false });
def("jg_changevx", "jg", "mudar velocidade x por %1", ["N:V:1"], "stmt", "Acelera para os lados.", { stageOk: false });
def("jg_changevy", "jg", "mudar velocidade y por %1", ["N:V:1"], "stmt", "Acelera para cima ou para baixo.", { stageOk: false });
def("jg_step", "jg", "mover com física, parando em %1", ["D:SOLID:solids"], "stmt", "Aplica gravidade e velocidade e não atravessa o ator escolhido (ex.: Chão). Coloque dentro de um “sempre”.", { stageOk: false });
def("jg_onground", "jg", "no chão?", [], "bool", "Verdadeiro se o último “mover com física” encostou em algo embaixo.", { stageOk: false });
def("jg_vx", "jg", "velocidade x", [], "rep", "A velocidade x atual.", { stageOk: false });
def("jg_vy", "jg", "velocidade y", [], "rep", "A velocidade y atual.", { stageOk: false });
def("jg_save", "jg", "salvar %1 com o nome %2", ["T:VALUE:0", "T:KEY:recorde"], "stmt", "Guarda um valor neste navegador, mesmo depois de fechar (ex.: recorde).");
def("jg_load", "jg", "valor salvo %1", ["T:KEY:recorde"], "rep", "Lê um valor guardado com “salvar” (vazio se não existir).");
def("jg_log", "jg", "mostrar no console %1", ["T:TEXT:chegou aqui"], "stmt", "Escreve no painel Console. Ótimo para descobrir erros.");
def("jg_distxy", "jg", "distância até x: %1 y: %2", ["N:X:0", "N:Y:0"], "rep", "Quantos passos até um ponto.", { stageOk: false, adv: true });

// ---------- Meus Blocos (procedimentos) ----------
// spec: [{k:"label", text}, {k:"num", name}, {k:"bool", name}]
const procSig = new Map();
function procText(spec, forDef) {
  let n = 0;
  const msg = spec.map(p => p.k === "label" ? String(p.text).replace(/%/g, "%%") : forDef ? (p.k === "bool" ? `<${p.name}>` : `(${p.name})`).replace(/%/g, "%%") : "%" + (++n)).join(" ");
  return msg.trim() || "bloco";
}
function registerProc(pid, p) {
  const sig = JSON.stringify(p.spec || []) + "|" + !!p.warp;
  if (procSig.get(pid) === sig) return false;
  procSig.set(pid, sig);
  const spec = p.spec || [];
  const args = []; let i = 0;
  spec.forEach(s => { if (s.k === "num") args.push(`T:A${i++}:`); else if (s.k === "bool") args.push(`B:A${i++}`); });
  def("pd_" + pid, "proc", "definir " + procText(spec, true), [], "hat", "Aqui você monta o que o seu bloco faz." + (p.warp ? " Roda sem atualizar a tela (bem rápido)." : ""), { hidden: true });
  def("pc_" + pid, "proc", procText(spec, false), args, "stmt", "Um bloco criado por você.", { hidden: true });
  return true;
}
function registerAllProcs() {
  let changed = false;
  for (const [pid, p] of [...live(project.meta.procs), ...spriteList().flatMap(([, s]) => live(s.procs))]) changed = registerProc(pid, p) || changed;
  return changed;
}

// ---------- Caixa de ferramentas e tema ----------
function argSpecs(type) { return (DEF[type]?.args || []).map(s => s.split(":")); }
function toolboxBlock(type, fields) {
  const inputs = {};
  argSpecs(type).forEach(([k, name, d]) => {
    if (k === "N") inputs[name] = { shadow: { type: "b_num", fields: { NUM: d === "" || d === undefined ? 0 : Number(d) } } };
    if (k === "T") inputs[name] = { shadow: { type: "b_text", fields: { TEXT: d ?? "" } } };
    if (k === "C") inputs[name] = { shadow: { type: "b_color", fields: { COLOR: d || "#e53935" } } };
  });
  return { kind: "block", type, ...(Object.keys(inputs).length ? { inputs } : {}), ...(fields ? { fields } : {}) };
}
// Níveis: cada um mostra só os blocos que dá para entender naquele momento. "0" desliga os níveis (todos os blocos).
const LEVEL1 = ["ev_flag", "ev_key", "ev_click", "mv_move", "mv_turnr", "mv_turnl", "mv_changex", "mv_changey", "mv_gotoxy", "mv_goto", "mv_bounce", "lk_sayfor", "lk_say", "lk_nextcostume", "lk_show", "lk_hide", "snd_play", "ct_wait", "ct_repeat", "ct_forever"];
const LEVEL2 = [...LEVEL1, "ev_receive", "ev_broadcast", "ev_stageclick", "mv_setx", "mv_sety", "mv_pointdir", "mv_pointto", "mv_glideto", "mv_glide", "mv_rotstyle", "mv_x", "mv_y", "lk_thinkfor", "lk_costume", "lk_backdrop", "lk_nextbackdrop", "lk_changesize", "lk_setsize", "snd_playwait", "snd_stop", "ct_if", "ct_ifelse", "ct_stop", "sn_touching", "sn_keypressed", "sn_mousedown", "op_random", "var_get", "var_set", "var_change", "var_show", "var_hide"];
const LEVELS = [
  { n: 1, name: "Nível 1 · Primeiros passos", about: "Só os blocos para fazer o ator andar, falar e repetir.", ok: t => LEVEL1.includes(t) },
  { n: 2, name: "Nível 2 · Jogos", about: "Chegam o “se”, “tocando em”, as teclas e a pontuação.", ok: t => LEVEL2.includes(t) },
  { n: 3, name: "Nível 3 · Mais ideias", about: "Quase tudo: operadores, clones, perguntas, caneta e Meus Blocos.", ok: t => !DEF[t].adv && !["list", "tts", "jg", "mu"].includes(DEF[t].cat) },
  { n: 0, name: "Sem níveis (todos os blocos)", about: "Todos os blocos, como no Scratch, mais os extras.", ok: () => true },
];
const curLevel = () => LEVELS.find(l => String(l.n) === $("#levelSel")?.value) || LEVELS[3];
function buildToolbox() {
  const lv = curLevel(), stage = curSid === STAGE;
  const contents = [];
  for (const [cat, [name]] of Object.entries(CAT)) {
    if (cat === "proc" && (lv.n === 1 || lv.n === 2)) continue;
    const ok = t => DEF[t].cat === cat && !DEF[t].hidden && lv.ok(t) && !(stage && !DEF[t].stageOk) && !(!stage && !DEF[t].spriteOk);
    const items = [];
    if (cat === "var" && lv.ok("var_set")) items.push({ kind: "button", text: "Criar uma variável", callbackKey: "NEW_VAR" });
    if (cat === "list" && lv.ok("list_add")) items.push({ kind: "button", text: "Criar uma lista", callbackKey: "NEW_LIST" });
    if (cat === "ev" && lv.ok("ev_broadcast")) items.push({ kind: "button", text: "Criar uma mensagem", callbackKey: "NEW_MSG" });
    if (cat === "proc") {
      items.push({ kind: "button", text: "Criar um bloco", callbackKey: "NEW_PROC" });
      for (const [pid] of procsOf(curSid)) if (DEF["pc_" + pid]) items.push(toolboxBlock("pc_" + pid));
      const ps = DYN.params(), bs = DYN.bparams();
      ps.forEach(([n]) => items.push({ kind: "block", type: "proc_arg", fields: { VALUE: n } }));
      bs.forEach(([n]) => items.push({ kind: "block", type: "proc_argb", fields: { VALUE: n } }));
      contents.push({ kind: "category", name, categorystyle: cat + "_category", contents: items });
      continue;
    }
    const blocks = Object.keys(DEF).filter(ok);
    if (!blocks.length && !items.length) continue;
    const tips = $("#tipsChk")?.checked !== false;
    const withTips = blocks.flatMap(t => tips ? [toolboxBlock(t), { kind: "label", text: shortTip(DEF[t].tip), "web-class": "bab-tip" }] : [toolboxBlock(t)]);
    contents.push({ kind: "category", name, categorystyle: cat + "_category", contents: [...items, ...withTips] });
  }
  return { kind: "categoryToolbox", contents };
}
function makeTheme(dark) {
  const blockStyles = { shadow_blocks: { colourPrimary: "#ffffff", colourSecondary: "#ffffff", colourTertiary: "#c8d1db" } };
  const categoryStyles = {};
  for (const [cat, [, col]] of Object.entries(CAT)) {
    blockStyles[cat + "_blocks"] = { colourPrimary: col, colourSecondary: shade(col, .35), colourTertiary: shade(col, -.25) };
    categoryStyles[cat + "_category"] = { colour: col };
  }
  return Blockly.Theme.defineTheme(dark ? "bab-escuro" : "bab-claro", {
    base: Blockly.Themes.Classic, blockStyles, categoryStyles, startHats: true,
    componentStyles: dark
      ? { workspaceBackgroundColour: "#141b23", toolboxBackgroundColour: "#202a36", toolboxForegroundColour: "#e4eaf1", flyoutBackgroundColour: "#1b232e", flyoutForegroundColour: "#e4eaf1", flyoutOpacity: 1, scrollbarColour: "#3a4756", insertionMarkerColour: "#ffffff", insertionMarkerOpacity: .3, cursorColour: "#f5c842" }
      : { workspaceBackgroundColour: "#f7f9fb", toolboxBackgroundColour: "#f3f6f9", toolboxForegroundColour: "#17202b", flyoutBackgroundColour: "#eef2f6", flyoutForegroundColour: "#17202b", flyoutOpacity: 1, scrollbarColour: "#c3ccd6", insertionMarkerColour: "#000000", insertionMarkerOpacity: .2, cursorColour: "#0f7c8a" },
    fontStyle: { family: "Atkinson Hyperlegible, Segoe UI, sans-serif", weight: "bold", size: 11 },
  });
}
const isDark = () => { const t = document.documentElement.getAttribute("data-theme"); return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; };
$("#levelSel").innerHTML = LEVELS.map(l => `<option value="${l.n}">${esc(l.name)}</option>`).join("");
try {
  // Quem já usava o Bloco a Bloco continua vendo tudo; quem chega agora começa no Nível 1
  let lv = localStorage.getItem("bab-nivel");
  if (lv === null) lv = localStorage.getItem("bab-simples") === "1" ? "3" : localStorage.getItem("bab-projeto-v3") ? "0" : "1";
  $("#levelSel").value = lv;
  $("#tipsChk").checked = localStorage.getItem("bab-dicas") !== "0";
} catch (_) { $("#levelSel").value = "1"; }
document.body.dataset.level = curLevel().n;
const ws = Blockly.inject("blocklyDiv", {
  toolbox: buildToolbox(), renderer: "zelos", theme: makeTheme(isDark()), trashcan: false, sounds: false,
  zoom: { controls: false, wheel: true, startScale: [1, 2].includes(curLevel().n) ? .85 : .7, maxScale: 2, minScale: .3 },
  move: { scrollbars: true, drag: true, wheel: true }, grid: { spacing: 40, length: 2, colour: "#cfd8e2", snap: false },
});
const refreshTheme = () => ws.setTheme(makeTheme(isDark()));
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", refreshTheme);
new MutationObserver(refreshTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
new ResizeObserver(() => Blockly.svgResize(ws)).observe($("#blocklyDiv"));
let toolboxTimer = null;
// Atualiza a caixa de ferramentas e a categoria aberta (para uma variável nova aparecer na hora)
const refreshToolbox = () => { clearTimeout(toolboxTimer); toolboxTimer = setTimeout(() => { ws.updateToolbox(buildToolbox()); try { ws.getToolbox()?.refreshSelection?.(); } catch (_) {} }, 60); };
