// =====================================================================
// Aba “Python / Portugol”: os mesmos scripts escritos como código de texto
// =====================================================================
const codeView = { lang: "py", scope: "sprite", comments: true };
try { Object.assign(codeView, JSON.parse(localStorage.getItem("bab-codigo") || "{}")); } catch (_) {}
const ident = s => { let r = String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase(); if (!r) r = "x"; if (/^\d/.test(r)) r = "_" + r; return r; };
const quote = s => JSON.stringify(String(s ?? ""));
const BINOPS = new Set(["op_add", "op_sub", "op_mul", "op_div", "op_mod", "op_pow", "op_gt", "op_lt", "op_eq", "op_and", "op_or", "op_join"]);
function makeGen(L, comments) {
  const py = L === "py";
  const T = py ? "True" : "verdadeiro";
  const self = n => py ? "eu." + n : n;
  const obj = v => v === "_random_" ? "posicao_aleatoria()" : v === "_mouse_" ? "mouse()" : v === "_edge_" ? quote("borda") : v === "_myself_" ? (py ? "eu" : quote("eu mesmo")) : v === "_stage_" ? quote("Palco") : (py ? `ator(${quote(v)})` : quote(v));
  const lit = (sh) => {
    if (!sh) return "0";
    const f = sh.fields || {};
    if (sh.type === "b_num") return str(num(f.NUM));
    if (sh.type === "b_color") return quote(f.COLOR);
    const t = String(f.TEXT ?? "");
    return t.trim() !== "" && Number.isFinite(Number(t)) ? String(Number(t)) : quote(t);
  };
  const ctx = { counters: 0 };
  function x(b, name) { const i = b.inputs?.[name]; if (!i) return "0"; return i.block ? expr(i.block) : lit(i.shadow); }
  function xp(b, name) { const i = b.inputs?.[name]; const c = x(b, name); return i?.block && BINOPS.has(i.block.type) ? `(${c})` : c; }
  const f = (b, n) => b.fields?.[n] ?? "";
  const v = (b, n) => ident(f(b, n));
  function expr(b) {
    const X = n => x(b, n), P = n => xp(b, n);
    switch (b.type) {
      case "b_num": case "b_text": case "b_color": return lit(b);
      case "mv_x": return self("x"); case "mv_y": return self("y"); case "mv_dir": return self("direcao");
      case "lk_costumenum": return f(b, "WHAT") === "name" ? "fantasia_nome()" : "fantasia_numero()";
      case "lk_backdropnum": return f(b, "WHAT") === "name" ? "cenario_nome()" : "cenario_numero()";
      case "lk_size": return self("tamanho"); case "snd_vol": return self("volume");
      case "sn_touching": return `tocando_em(${obj(f(b, "OBJ"))})`;
      case "sn_touchcolor": return `tocando_na_cor(${X("COLOR")})`;
      case "sn_colortouch": return `cor_tocando_cor(${X("COLOR")}, ${X("COLOR2")})`;
      case "sn_distance": return `distancia_ate(${obj(f(b, "OBJ"))})`;
      case "sn_answer": return "resposta";
      case "sn_keypressed": return `tecla_pressionada(${quote(KEYS.find(k => k[1] === f(b, "KEY"))?.[0] || f(b, "KEY"))})`;
      case "sn_mousedown": return "mouse_pressionado()"; case "sn_mousex": return "mouse_x()"; case "sn_mousey": return "mouse_y()";
      case "sn_loudness": return "volume_do_som()"; case "sn_timer": return "cronometro()";
      case "sn_of": { const p = OF_PROPS.find(o => o[1] === f(b, "PROP"))?.[0] || f(b, "PROP"); return py ? `${obj(f(b, "OBJ"))}.${ident(p)}` : `propriedade(${quote(p)}, ${obj(f(b, "OBJ"))})`; }
      case "sn_current": return `agora(${quote(STATIC.current.find(o => o[1] === f(b, "WHAT"))?.[0] || f(b, "WHAT"))})`;
      case "sn_days": return "dias_desde_2000()"; case "sn_username": return "nome_de_usuario()";
      case "op_add": return `${P("A")} + ${P("B")}`; case "op_sub": return `${P("A")} - ${P("B")}`;
      case "op_mul": return `${P("A")} * ${P("B")}`; case "op_div": return `${P("A")} / ${P("B")}`;
      case "op_mod": return `${P("A")} % ${P("B")}`;
      case "op_pow": return py ? `${P("A")} ** ${P("B")}` : `Matematica.potencia(${X("A")}, ${X("B")})`;
      case "op_random": return py ? `random.randint(${X("FROM")}, ${X("TO")})` : `Util.sorteia(${X("FROM")}, ${X("TO")})`;
      case "op_gt": return `${P("A")} > ${P("B")}`; case "op_lt": return `${P("A")} < ${P("B")}`; case "op_eq": return `${P("A")} == ${P("B")}`;
      case "op_and": return `${P("A")} ${py ? "and" : "e"} ${P("B")}`; case "op_or": return `${P("A")} ${py ? "or" : "ou"} ${P("B")}`;
      case "op_not": return `${py ? "not" : "nao"} (${X("A")})`;
      case "op_join": return py ? `str(${X("A")}) + str(${X("B")})` : `${P("A")} + ${P("B")}`;
      case "op_letter": return py ? `str(${X("S")})[${P("N")} - 1]` : `Texto.obter_caracter(${X("S")}, ${P("N")} - 1)`;
      case "op_length": return py ? `len(str(${X("S")}))` : `Texto.numero_caracteres(${X("S")})`;
      case "op_contains": return py ? `${P("B")} in ${P("A")}` : `Texto.posicao_texto(${X("B")}, ${X("A")}, 0) >= 0`;
      case "op_round": return py ? `round(${X("A")})` : `Matematica.arredondar(${X("A")}, 0)`;
      case "op_max": return py ? `max(${X("A")}, ${X("B")})` : `Matematica.maior_numero(${X("A")}, ${X("B")})`;
      case "op_min": return py ? `min(${X("A")}, ${X("B")})` : `Matematica.menor_numero(${X("A")}, ${X("B")})`;
      case "op_math": {
        const a = X("A"), op = f(b, "OP");
        if (py) return ({ abs: `abs(${a})`, floor: `math.floor(${a})`, ceiling: `math.ceil(${a})`, sqrt: `math.sqrt(${a})`, sin: `math.sin(math.radians(${a}))`, cos: `math.cos(math.radians(${a}))`, tan: `math.tan(math.radians(${a}))`, asin: `math.degrees(math.asin(${a}))`, acos: `math.degrees(math.acos(${a}))`, atan: `math.degrees(math.atan(${a}))`, ln: `math.log(${a})`, log: `math.log10(${a})`, "e ^": `math.exp(${a})`, "10 ^": `10 ** ${a}` })[op] || a;
        return ({ abs: `Matematica.valor_absoluto(${a})`, floor: `Matematica.arredondar(${a} - 0.5, 0)`, ceiling: `Matematica.arredondar(${a} + 0.5, 0)`, sqrt: `Matematica.raiz(${a}, 2.0)`, sin: `Matematica.seno(${a} * Matematica.PI / 180)`, cos: `Matematica.cosseno(${a} * Matematica.PI / 180)`, tan: `Matematica.tangente(${a} * Matematica.PI / 180)`, ln: `Matematica.logaritmo(${a}, 2.718281828)`, log: `Matematica.logaritmo(${a}, 10.0)`, "e ^": `Matematica.potencia(2.718281828, ${a})`, "10 ^": `Matematica.potencia(10.0, ${a})` })[op] || `${op}(${a})`;
      }
      case "var_get": return v(b, "VAR");
      case "list_get": return py ? `" ".join(map(str, ${v(b, "LIST")}))` : `juntar_lista(${v(b, "LIST")})`;
      case "list_item": return `${v(b, "LIST")}[${xp(b, "INDEX")} - 1]`;
      case "list_indexof": return py ? `posicao_em(${v(b, "LIST")}, ${X("ITEM")})` : `posicao_em(${v(b, "LIST")}, ${X("ITEM")})`;
      case "list_length": return py ? `len(${v(b, "LIST")})` : `tamanho_da_lista(${v(b, "LIST")})`;
      case "list_contains": return py ? `${xp(b, "ITEM")} in ${v(b, "LIST")}` : `lista_contem(${v(b, "LIST")}, ${X("ITEM")})`;
      case "proc_arg": case "proc_argb": return ident(f(b, "VALUE"));
      case "mu_tempo": return "andamento()";
      case "jg_onground": return "no_chao()"; case "jg_vx": return self("velocidade_x"); case "jg_vy": return self("velocidade_y");
      case "jg_load": return `valor_salvo(${X("KEY")})`;
      case "jg_distxy": return `distancia_ate_ponto(${X("X")}, ${X("Y")})`;
    }
    return `${ident(b.type)}()`;
  }
  // Comandos: devolve uma lista de linhas já indentadas
  function stmts(b, ind) {
    const out = [];
    for (let cur = b; cur; cur = cur.next?.block) out.push(...stmt(cur, ind));
    return out;
  }
  function body(b, name, ind) { const inner = b.inputs?.[name]?.block; const s = inner ? stmts(inner, ind) : []; return s.length ? s : [ind + (py ? "pass" : "// (vazio)")]; }
  // O comentário vai na linha de cima (como se escreve de verdade), assim as linhas não ficam compridas demais
  const line = (ind, code, b) => (comments && DEF[b.type] ? ind + (py ? "# " : "// ") + shortTip(DEF[b.type].tip) + "\n" : "") + ind + code;
  function stmt(b, ind) {
    const X = n => x(b, n), P = n => xp(b, n), I2 = ind + (py ? "    " : "\t");
    const one = code => [line(ind, code, b)];
    const block = (head, parts) => py
      ? [line(ind, head + ":", b), ...parts[0]]
      : [line(ind, head, b), ind + "{", ...parts[0], ind + "}"];
    switch (b.type) {
      case "mv_move": return one(`mover(${X("STEPS")})`);
      case "mv_turnr": return one(`girar_direita(${X("DEG")})`);
      case "mv_turnl": return one(`girar_esquerda(${X("DEG")})`);
      case "mv_goto": return one(`ir_para(${obj(f(b, "TO"))})`);
      case "mv_gotoxy": return one(`ir_para_xy(${X("X")}, ${X("Y")})`);
      case "mv_glide": return one(`deslizar_ate(${X("X")}, ${X("Y")}, ${py ? "segundos=" : ""}${X("SECS")})`);
      case "mv_glideto": return one(`deslizar_para(${obj(f(b, "TO"))}, ${py ? "segundos=" : ""}${X("SECS")})`);
      case "mv_pointdir": return one(`${self("direcao")} = ${X("DIR")}`);
      case "mv_pointto": return one(`apontar_para(${obj(f(b, "TO"))})`);
      case "mv_changex": return one(py ? `eu.x += ${X("DX")}` : `x = x + ${P("DX")}`);
      case "mv_setx": return one(`${self("x")} = ${X("X")}`);
      case "mv_changey": return one(py ? `eu.y += ${X("DY")}` : `y = y + ${P("DY")}`);
      case "mv_sety": return one(`${self("y")} = ${X("Y")}`);
      case "mv_bounce": return one("se_tocar_na_borda_volte()");
      case "mv_rotstyle": return one(`definir_estilo_rotacao(${quote(STATIC.rot.find(o => o[1] === f(b, "STYLE"))?.[0])})`);
      case "lk_sayfor": return one(`dizer(${X("MSG")}, ${X("SECS")})`);
      case "lk_say": return one(`dizer(${X("MSG")})`);
      case "lk_thinkfor": return one(`pensar(${X("MSG")}, ${X("SECS")})`);
      case "lk_think": return one(`pensar(${X("MSG")})`);
      case "lk_costume": return one(`mudar_fantasia(${quote(f(b, "COSTUME"))})`);
      case "lk_nextcostume": return one("proxima_fantasia()");
      case "lk_backdrop": return one(`mudar_cenario(${quote(f(b, "BACKDROP"))})`);
      case "lk_backdropwait": return one(`mudar_cenario_e_esperar(${quote(f(b, "BACKDROP"))})`);
      case "lk_nextbackdrop": return one("proximo_cenario()");
      case "lk_changesize": return one(py ? `eu.tamanho += ${X("CHANGE")}` : `tamanho = tamanho + ${P("CHANGE")}`);
      case "lk_setsize": return one(`${self("tamanho")} = ${X("SIZE")}`);
      case "lk_changeeffect": return one(`mudar_efeito(${quote(f(b, "EFFECT"))}, ${X("CHANGE")})`);
      case "lk_seteffect": return one(`definir_efeito(${quote(f(b, "EFFECT"))}, ${X("VALUE")})`);
      case "lk_cleareffects": return one("limpar_efeitos()");
      case "lk_show": return one("mostrar()"); case "lk_hide": return one("esconder()");
      case "lk_layer": return one(`ir_para_camada(${quote(f(b, "LAYER") === "front" ? "frente" : "tras")})`);
      case "lk_layers": return one(`mover_camadas(${f(b, "DIR") === "forward" ? "" : "-"}${P("NUM")})`);
      case "snd_playwait": return one(`tocar_som_ate_o_fim(${quote(f(b, "SOUND"))})`);
      case "snd_play": return one(`tocar_som(${quote(f(b, "SOUND"))})`);
      case "snd_stop": return one("parar_todos_os_sons()");
      case "snd_changeeffect": return one(`mudar_efeito_som(${quote(f(b, "EFFECT"))}, ${X("VALUE")})`);
      case "snd_seteffect": return one(`definir_efeito_som(${quote(f(b, "EFFECT"))}, ${X("VALUE")})`);
      case "snd_cleareffects": return one("limpar_efeitos_som()");
      case "snd_changevol": return one(py ? `eu.volume += ${X("V")}` : `volume = volume + ${P("V")}`);
      case "snd_setvol": return one(`${self("volume")} = ${X("V")}`);
      case "ev_broadcast": return one(`transmitir(${quote(f(b, "MSG"))})`);
      case "ev_broadcastwait": return one(`transmitir_e_esperar(${quote(f(b, "MSG"))})`);
      case "ct_wait": return one(py ? `esperar(${X("SECS")})` : `Util.aguarde(${P("SECS")} * 1000)`);
      case "ct_repeat": { const c = "ijklmn"[ctx.counters++ % 6]; const r = block(py ? `for ${c === "i" ? "_" : c} in range(${X("TIMES")})` : `para (inteiro ${c} = 1; ${c} <= ${X("TIMES")}; ${c}++)`, [body(b, "SUBSTACK", I2)]); ctx.counters--; return r; }
      case "ct_forever": return block(py ? "while True" : "enquanto (verdadeiro)", [body(b, "SUBSTACK", I2)]);
      case "ct_if": return block(py ? `if ${X("COND")}` : `se (${X("COND")})`, [body(b, "SUBSTACK", I2)]);
      case "ct_ifelse": return py
        ? [line(ind, `if ${X("COND")}:`, b), ...body(b, "SUBSTACK", I2), ind + "else:", ...body(b, "SUBSTACK2", I2)]
        : [line(ind, `se (${X("COND")})`, b), ind + "{", ...body(b, "SUBSTACK", I2), ind + "}", ind + "senao", ind + "{", ...body(b, "SUBSTACK2", I2), ind + "}"];
      case "ct_waituntil": return py ? [line(ind, `while not (${X("COND")}):`, b), I2 + "esperar_quadro()"] : [line(ind, `enquanto (nao (${X("COND")}))`, b), ind + "{", I2 + "esperar_quadro()", ind + "}"];
      case "ct_repeatuntil": return block(py ? `while not (${X("COND")})` : `enquanto (nao (${X("COND")}))`, [body(b, "SUBSTACK", I2)]);
      case "ct_while": return block(py ? `while ${X("COND")}` : `enquanto (${X("COND")})`, [body(b, "SUBSTACK", I2)]);
      case "ct_foreach": { const n = v(b, "VAR"); return block(py ? `for ${n} in range(1, ${P("N")} + 1)` : `para (${n} = 1; ${n} <= ${X("N")}; ${n}++)`, [body(b, "SUBSTACK", I2)]); }
      case "ct_stop": { const w = f(b, "WHAT"); return one(w === "all" ? "parar_tudo()" : w === "this" ? (py ? "return" : "retorne") : "parar_outros_scripts()"); }
      case "ct_clone": return one(`criar_clone(${obj(f(b, "OF"))})`);
      case "ct_deleteclone": return one("apagar_este_clone()");
      case "sn_ask": return py ? one(`resposta = input(${X("Q")})`) : [line(ind, `escreva(${X("Q")}, "\\n")`, b), ind + "leia(resposta)"];
      case "sn_drag": return one(`definir_arrastavel(${f(b, "MODE") === "yes" ? T : (py ? "False" : "falso")})`);
      case "sn_resettimer": return one("zerar_cronometro()");
      case "var_set": return one(`${v(b, "VAR")} = ${X("VALUE")}`);
      case "var_change": return one(py ? `${v(b, "VAR")} += ${X("VALUE")}` : `${v(b, "VAR")} = ${v(b, "VAR")} + ${P("VALUE")}`);
      case "var_show": return one(`mostrar_variavel(${quote(f(b, "VAR"))})`);
      case "var_hide": return one(`esconder_variavel(${quote(f(b, "VAR"))})`);
      case "list_add": return one(py ? `${v(b, "LIST")}.append(${X("ITEM")})` : `adicionar(${v(b, "LIST")}, ${X("ITEM")})`);
      case "list_delete": return one(py ? `del ${v(b, "LIST")}[${P("INDEX")} - 1]` : `remover(${v(b, "LIST")}, ${X("INDEX")})`);
      case "list_clear": return one(py ? `${v(b, "LIST")}.clear()` : `limpar_lista(${v(b, "LIST")})`);
      case "list_insert": return one(py ? `${v(b, "LIST")}.insert(${P("INDEX")} - 1, ${X("ITEM")})` : `inserir(${v(b, "LIST")}, ${X("INDEX")}, ${X("ITEM")})`);
      case "list_replace": return one(`${v(b, "LIST")}[${P("INDEX")} - 1] = ${X("ITEM")}`);
      case "list_show": return one(`mostrar_lista(${quote(f(b, "LIST"))})`);
      case "list_hide": return one(`esconder_lista(${quote(f(b, "LIST"))})`);
      case "pen_clear": return one("apagar_tudo()"); case "pen_stamp": return one("carimbar()");
      case "pen_down": return one("abaixar_caneta()"); case "pen_up": return one("levantar_caneta()");
      case "pen_color": return one(`definir_cor_caneta(${X("COLOR")})`);
      case "pen_changeparam": return one(`mudar_caneta(${quote(STATIC.penparam.find(o => o[1] === f(b, "PARAM"))?.[0])}, ${X("V")})`);
      case "pen_setparam": return one(`definir_caneta(${quote(STATIC.penparam.find(o => o[1] === f(b, "PARAM"))?.[0])}, ${X("V")})`);
      case "pen_size": return one(`definir_tamanho_caneta(${X("V")})`);
      case "pen_changesize": return one(`mudar_tamanho_caneta(${X("V")})`);
      case "pen_text": return one(`escrever(${X("TEXT")}, ${X("SIZE")})`);
      case "mu_drum": return one(`tocar_tambor(${f(b, "DRUM")}, ${X("BEATS")})`);
      case "mu_rest": return one(`pausa(${X("BEATS")})`);
      case "mu_note": return one(`tocar_nota(${X("NOTE")}, ${X("BEATS")})`);
      case "mu_instr": return one(`mudar_instrumento(${f(b, "INSTR")})`);
      case "mu_settempo": return one(`definir_andamento(${X("T")})`);
      case "mu_changetempo": return one(`mudar_andamento(${X("T")})`);
      case "tts_speak": return one(`falar(${X("W")})`);
      case "tts_voice": return one(`definir_voz(${quote(VOICES.find(o => o[0] === f(b, "VOICE"))?.[1])})`);
      case "tts_lang": return one(`definir_idioma(${quote(f(b, "LANG"))})`);
      case "jg_gravity": return one(`definir_gravidade(${X("G")})`);
      case "jg_setvx": return one(`${self("velocidade_x")} = ${X("V")}`);
      case "jg_setvy": return one(`${self("velocidade_y")} = ${X("V")}`);
      case "jg_changevx": return one(py ? `eu.velocidade_x += ${X("V")}` : `velocidade_x = velocidade_x + ${P("V")}`);
      case "jg_changevy": return one(py ? `eu.velocidade_y += ${X("V")}` : `velocidade_y = velocidade_y + ${P("V")}`);
      case "jg_step": return one(`mover_com_fisica(${obj(f(b, "SOLID"))})`);
      case "jg_save": return one(`salvar(${X("VALUE")}, ${X("KEY")})`);
      case "jg_log": return one(py ? `print(${X("TEXT")})` : `escreva(${X("TEXT")}, "\\n")`);
    }
    if (b.type.startsWith("pc_")) {
      const p = findProcSpec(b.type.slice(3));
      const args = (p?.spec || []).filter(s => s.k !== "label").map((s, i) => x(b, "A" + i));
      return one(`${procName(p)}(${args.join(", ")})`);
    }
    if (DEF[b.type]?.kind === "rep" || DEF[b.type]?.kind === "bool") return one(expr(b));
    return [ind + (py ? "# " : "// ") + "(bloco sem tradução) " + blockText(b)];
  }
  // Variáveis usadas (para o “global” do Python e as declarações do Portugol)
  function assigned(b, set = new Set()) {
    if (!b) return set;
    if (["var_set", "var_change", "ct_foreach"].includes(b.type)) set.add(v(b, "VAR"));
    if (b.type === "sn_ask") set.add("resposta");
    for (const i in (b.inputs || {})) assigned(b.inputs[i].block, set);
    return assigned(b.next?.block, set);
  }
  return { stmts, expr, assigned, ctx };
}
function findProcSpec(pid) { for (const s of [project.meta, ...spriteList().map(([, d]) => d)]) { const p = s?.procs?.[pid]; if (p) return p; } return null; }
function procName(p) { return ident((p?.spec || []).filter(s => s.k === "label").map(s => s.text).join(" ") || "meu_bloco"); }
const KEYNAME = k => ident(KEYS.find(x => x[1] === k)?.[0] || k);

function generateCode(L, scope, comments) {
  const py = L === "py", G = makeGen(L, comments);
  const targets = scope === "project" ? [[STAGE, "Palco"], ...spriteList().map(([id, s]) => [id, s.name])] : [[curSid, curSid === STAGE ? "Palco" : curDoc()?.name || "Ator"]];
  const used = new Map(); const fname = base => { const n = (used.get(base) || 0) + 1; used.set(base, n); return n > 1 ? `${base}_${n}` : base; };
  const out = [], flags = [];
  // Valor de agora: o do jogo rodando, se houver (variável do ator fica no ator, a do projeto em rt.vars)
  const nowVal = (sid, v) => { const t = rt.targets.find(x => x.sid === sid && !x.clone); return t?.vars?.has(v.name) ? t.vars.get(v.name) : rt.vars.has(v.name) ? rt.vars.get(v.name) : v.value; };
  const globals = [...new Map([...live(project.meta.vars).map(([, v]) => [v.name, nowVal(null, v)]), ...targets.flatMap(([sid]) => live(docOf(sid)?.vars).map(([, v]) => [v.name, nowVal(sid, v)]))])];
  const lists = [...live(project.meta.lists).map(([, v]) => v.name), ...targets.flatMap(([sid]) => live(docOf(sid)?.lists).map(([, v]) => v.name))];
  const sections = [];
  for (const [sid, name] of targets) {
    const scripts = [...project.scripts.values()].filter(s => s.sprite === sid && s.block).sort((a, b) => (a.block.y || 0) - (b.block.y || 0) || (a.block.x || 0) - (b.block.x || 0));
    if (!scripts.length && scope === "project") continue;
    const prefix = scope === "project" ? ident(name) + "_" : "";
    const sec = [];
    if (scope === "project") sec.push(py ? `# ===== ${name} =====` : `\t// ===== ${name} =====`);
    let loose = 0;
    // Meus Blocos primeiro (precisam existir antes de serem usados)
    const ordered = [...scripts.filter(s => s.block.type.startsWith("pd_")), ...scripts.filter(s => !s.block.type.startsWith("pd_"))];
    for (const s of ordered) {
      const b = s.block, d = DEF[b.type], hatOnly = d?.kind === "hat";
      let head, deco = null, fn, params = "";
      const fl = b.fields || {};
      switch (b.type) {
        case "ev_flag": fn = fname(prefix + "ao_iniciar"); deco = "@quando_bandeira_clicada"; flags.push(fn); break;
        case "ev_key": fn = fname(prefix + "ao_apertar_" + KEYNAME(fl.KEY)); deco = `@quando_tecla(${quote(KEYS.find(k => k[1] === fl.KEY)?.[0] || fl.KEY)})`; break;
        case "ev_keyup": fn = fname(prefix + "ao_soltar_" + KEYNAME(fl.KEY)); deco = `@quando_soltar_tecla(${quote(KEYS.find(k => k[1] === fl.KEY)?.[0] || fl.KEY)})`; break;
        case "ev_click": fn = fname(prefix + "ao_clicar"); deco = "@quando_clicado"; break;
        case "ev_stageclick": fn = fname(prefix + "ao_clicar_no_palco"); deco = "@quando_palco_clicado"; break;
        case "ev_backdrop": fn = fname(prefix + "ao_mudar_para_" + ident(fl.BACKDROP)); deco = `@quando_cenario_mudar(${quote(fl.BACKDROP)})`; break;
        case "ev_gt": fn = fname(prefix + "quando_" + ident(fl.WHAT === "timer" ? "cronometro" : "volume") + "_passar"); deco = `@quando_maior(${quote(fl.WHAT === "timer" ? "cronômetro" : "volume do som")}, ${G.expr(b.inputs?.VALUE?.block || b.inputs?.VALUE?.shadow || { type: "b_num", fields: { NUM: 0 } })})`; break;
        case "ev_receive": fn = fname(prefix + "ao_receber_" + ident(fl.MSG)); deco = `@quando_receber(${quote(fl.MSG)})`; break;
        case "ct_startclone": fn = fname(prefix + "ao_nascer_clone"); deco = "@quando_comecar_como_clone"; break;
        default:
          if (b.type.startsWith("pd_")) { const p = findProcSpec(b.type.slice(3)); fn = procName(p); params = (p?.spec || []).filter(x => x.k !== "label").map(x => py ? ident(x.name) : `${x.k === "bool" ? "logico" : "real"} ${ident(x.name)}`).join(", "); break; }
          fn = fname(prefix + "blocos_soltos"); loose++;
      }
      const start = hatOnly || b.type.startsWith("pd_") ? b.next?.block : b;
      const ind = py ? "    " : "\t\t";
      const bodyLines = start ? G.stmts(start, ind) : [ind + (py ? "pass" : "// (vazio)")];
      const glob = [...G.assigned(start)].filter(n => n !== "resposta" || py);
      if (py) {
        if (!hatOnly && !b.type.startsWith("pd_")) sec.push("# Blocos soltos: só rodam se você clicar neles");
        if (deco) sec.push(deco);
        sec.push(`def ${fn}(${params}):`);
        if (glob.length) sec.push(`    global ${glob.join(", ")}`);
        sec.push(...bodyLines, "");
      } else {
        sec.push(`\t// ${b.type.startsWith("pd_") ? "Meu bloco" : (d ? blockText(b) : "Blocos soltos (só rodam se você clicar neles)")}`);
        sec.push(`\tfuncao ${fn}(${params})`, "\t{", ...bodyLines, "\t}", "");
      }
    }
    if (sec.length) sections.push(sec);
  }
  const title = scope === "project" ? project.meta.title : targets[0][1];
  if (py) {
    out.push(`# ${title}: os seus blocos escritos em Python.`);
    out.push("# mover(), dizer() e outros comandos de jogo têm o nome dos blocos.");
    out.push("# Laços, se, variáveis e contas são Python de verdade.");
    const body = sections.flat().join("\n"), mods = ["random", "math"].filter(m => body.includes(m + "."));
    out.push("from bloco_a_bloco import *", ...(mods.length ? [`import ${mods.join(", ")}`] : []), "");
    if (globals.length || lists.length) { out.push("# Variáveis e listas (com o valor que têm agora)", ...(comments ? ["# Dentro de uma função, “global” quer dizer: use a variável do jogo todo, esta aqui de cima."] : [])); globals.forEach(([n, v]) => out.push(`${ident(n)} = ${typeof v === "number" || (String(v).trim() !== "" && Number.isFinite(Number(v))) ? Number(v) : quote(v)}`)); lists.forEach(n => out.push(`${ident(n)} = []`)); out.push(""); }
    sections.forEach(s => out.push(...s));
    if (!sections.length) out.push("# Ainda não há scripts aqui. Monte blocos na aba Código e volte.");
  } else {
    const body = sections.flat().join("\n"), libs = ["Util", "Matematica", "Texto"].filter(l => body.includes(l + "."));
    out.push("programa", "{", ...libs.map(l => `\tinclua biblioteca ${l}`), "");
    out.push(`\t// ${title}: código gerado pelo Bloco a Bloco a partir dos seus blocos.`);
    out.push("\t// Funções como mover() e dizer() têm o mesmo nome dos blocos.", "");
    if (globals.length || lists.length) { out.push("\t// Variáveis e listas"); globals.forEach(([n, v]) => { const isNum = typeof v === "number" || (String(v).trim() !== "" && Number.isFinite(Number(v))); out.push(`\t${isNum ? "real" : "cadeia"} ${ident(n)} = ${isNum ? Number(v) : quote(v)}`); }); lists.forEach(n => out.push(`\tcadeia ${ident(n)}[100]  // lista`)); out.push(""); }
    if (sections.some(s => s.some(l => /\bresposta\b/.test(l)))) out.push("\tcadeia resposta = \"\"  // guarda o que a pessoa digitar", "");
    out.push("\tfuncao inicio()", "\t{");
    if (flags.length) { out.push("\t\t// Quando o ▶ é clicado, estes scripts começam (no Bloco a Bloco eles rodam ao mesmo tempo)"); flags.forEach(fn => out.push(`\t\t${fn}()`)); }
    else out.push("\t\t// Nenhum script começa com “quando ▶ for clicado”.");
    out.push("\t}", "");
    sections.forEach(s => out.push(...s));
    out.push("}");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}
function highlight(code, L) {
  const kw = L === "py" ? "def|global|for|in|range|while|if|else|not|and|or|return|pass|True|False|from|import|del" : "programa|inclua|biblioteca|funcao|para|enquanto|se|senao|e|ou|nao|retorne|verdadeiro|falso|real|inteiro|cadeia|logico|escreva|leia";
  const re = new RegExp(`(${L === "py" ? "#" : "\\/\\/"}[^\\n]*)|("(?:[^"\\\\\\n]|\\\\.)*")|(@[a-z_]+)|\\b(${kw})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|\\b([A-Za-z_][\\w.]*)(?=\\()`, "g");
  let html = "", last = 0;
  code.replace(re, (m, cm, st, dec, k, n, fn, i) => {
    html += esc(code.slice(last, i));
    html += cm ? `<span class="cm">${esc(cm)}</span>` : st ? `<span class="st">${esc(st)}</span>` : dec ? `<span class="fn">${esc(dec)}</span>` : k ? `<span class="kw">${esc(k)}</span>` : n ? `<span class="nu">${esc(n)}</span>` : `<span class="fn">${esc(fn)}</span>`;
    last = i + m.length; return m;
  });
  return html + esc(code.slice(last));
}
const CODE_GUIDE = {
  py: [["quando ▶ for clicado", "@quando_bandeira_clicada\ndef …():"], ["repetir 10 vezes", "for _ in range(10):"], ["sempre", "while True:"], ["se … então / senão", "if …:  /  else:"], ["definir pontos como 0", "pontos = 0"], ["adicionar 1 a pontos", "pontos += 1"], ["mudar x por 10", "eu.x += 10"], ["e / ou / não", "and / or / not"], ["perguntar e esperar", "resposta = input(…)"], ["Meus Blocos", "def pular(altura):"]],
  pt: [["quando ▶ for clicado", "funcao inicio()"], ["repetir 10 vezes", "para (inteiro i = 1; i <= 10; i++)"], ["sempre", "enquanto (verdadeiro)"], ["se … então / senão", "se (…) { } senao { }"], ["definir pontos como 0", "pontos = 0"], ["adicionar 1 a pontos", "pontos = pontos + 1"], ["esperar 1 segundo", "Util.aguarde(1000)"], ["e / ou / não", "e / ou / nao"], ["perguntar e esperar", "escreva(…)  leia(resposta)"], ["Meus Blocos", "funcao pular(real altura)"]],
};
function renderTextCode() {
  const pane = $("#paneText"), L = codeView.lang;
  if (curLevel().n === 1 && !codeView.peek) {
    pane.innerHTML = `<div class="code-gate"><h3>Python e Portugol chegam no Nível 2</h3>
      <p class="muted" style="margin:0">Aqui os seus blocos viram código escrito, igual ao que programadores usam. No Nível 1 a gente aprende primeiro com os blocos.</p>
      <div class="row"><button class="btn primary" id="gateUp">Subir para o Nível 2</button><button class="btn" id="gatePeek">Só espiar o código</button></div></div>`;
    $("#gateUp").onclick = () => { setLevel(2); renderTextCode(); };
    $("#gatePeek").onclick = () => { codeView.peek = true; renderTextCode(); };
    return;
  }
  const code = generateCode(L, codeView.scope, codeView.comments);
  pane.innerHTML = `<div class="code-bar">
      <div class="seg" role="group" aria-label="Linguagem"><button data-lang="py" aria-pressed="${L === "py"}">Python</button><button data-lang="pt" aria-pressed="${L === "pt"}">Portugol</button></div>
      <div class="seg" role="group" aria-label="Mostrar"><button data-scope="sprite" aria-pressed="${codeView.scope === "sprite"}">${esc(curSid === STAGE ? "Palco" : curDoc()?.name || "Ator")}</button><button data-scope="project" aria-pressed="${codeView.scope === "project"}">Projeto inteiro</button></div>
      <label class="check"><input type="checkbox" id="cmtChk" ${codeView.comments ? "checked" : ""}> Explicar cada linha</label>
      <span style="flex:1"></span>
      <span class="muted" style="font-size:.8rem">Só para ler: para mudar o código, mude os blocos.</span>
      <button class="btn small" id="copyCode">Copiar código</button><button class="btn small" id="saveCode">Baixar</button>
    </div>
    <div class="code-wrap"><pre class="code" id="codeOut" tabindex="0">${highlight(code, L)}</pre>
      <aside class="code-guide"><h3>Bloco ↔ ${L === "py" ? "Python" : "Portugol"}</h3>
        <p class="muted" style="margin:0">${L === "py" ? "Python é uma das linguagens mais usadas no mundo. Note os dois-pontos (:) e o recuo de 4 espaços: é assim que o Python sabe o que fica “dentro” de um laço ou de um se." : "Portugol é usado em escolas para aprender lógica de programação em português. As chaves { } mostram o que fica “dentro” de um laço ou de um se."}</p>
        <dl>${CODE_GUIDE[L].map(([a, b2]) => `<dd>Bloco “${esc(a)}”</dd><dt>${esc(b2)}</dt>`).join("")}</dl>
        <p class="muted" style="margin:0">Os comandos de jogo (mover, dizer, tocar_som…) vêm da “biblioteca” do Bloco a Bloco. A lógica (laços, se, variáveis, contas) é ${L === "py" ? "Python" : "Portugol"} de verdade.</p>
      </aside></div>`;
  pane.querySelectorAll("[data-lang]").forEach(b => b.onclick = () => { codeView.lang = b.dataset.lang; saveCodeView(); renderTextCode(); });
  pane.querySelectorAll("[data-scope]").forEach(b => b.onclick = () => { codeView.scope = b.dataset.scope; saveCodeView(); renderTextCode(); });
  $("#cmtChk").onchange = e => { codeView.comments = e.target.checked; saveCodeView(); renderTextCode(); };
  $("#copyCode").onclick = async () => { try { await navigator.clipboard.writeText(code); narrate("Código copiado."); } catch (_) { const r = document.createRange(); r.selectNodeContents($("#codeOut")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); narrate("Código selecionado: aperte Ctrl+C para copiar."); } };
  $("#saveCode").onclick = async () => {
    const name = ident(project.meta.title || "projeto") + (L === "py" ? "_python.txt" : "_portugol.txt");
    if (downloads) { try { await downloads.save({ filename: name, data: code }); } catch (_) {} return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" })); a.download = name.replace(/_python\.txt$/, ".py").replace(/_portugol\.txt$/, ".por"); document.body.append(a); a.click(); a.remove();
  };
}
function saveCodeView() { try { localStorage.setItem("bab-codigo", JSON.stringify(codeView)); } catch (_) {} }
