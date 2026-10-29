// =====================================================================
// “Ver exemplo”: explicação completa de um bloco e uma animação curta
// em que o bloco acende e o Faísca faz o que ele manda
// =====================================================================
// Para cada bloco: o que observar (cuidado) e uma ideia para experimentar.
const GUIDE = {
  ev_flag: { care: "Cada script precisa de um evento em cima. Sem ele, os blocos de baixo nunca rodam.", try: "Faça dois scripts com “quando ▶ for clicado”: os dois começam juntos." },
  ev_key: { care: "As teclas só chegam ao jogo depois de clicar uma vez no palco.", try: "Faça um script para cada seta: ← → ↑ ↓." },
  ev_click: { care: "Só funciona clicando em cima do desenho do ator, não no palco vazio.", try: "Faça o ator dizer “Ai!” e mudar de fantasia quando for clicado." },
  ev_receive: { care: "O nome da mensagem tem que ser igual ao do “transmitir”.", try: "Num ator, “transmitir começar”; em outro, “quando eu receber começar”." },
  ev_broadcast: { care: "Se ninguém tiver “quando eu receber”, nada acontece.", try: "Use para avisar todos os atores que o jogo acabou." },
  mv_move: { care: "Ele anda para onde está olhando. Se virar para a esquerda, “mover 10” vai para a esquerda.", try: "Coloque dentro de um “sempre” com “se tocar na borda, volte”." },
  mv_turnr: { care: "Girar muda para onde o ator olha, e o próximo “mover” vai nessa direção.", try: "Repita 24 vezes: girar 15 graus. Dá uma volta inteira (24 × 15 = 360)." },
  mv_turnl: { care: "É o mesmo que o outro girar, só que para o lado contrário.", try: "Combine girar e mover dentro de um “repetir” para andar em círculo." },
  mv_goto: { care: "É um pulo: o ator some de um lugar e aparece no outro, sem caminhar.", try: "Faça uma moeda “ir para posição aleatória” quando for pega." },
  mv_gotoxy: { care: "x é para os lados (de -240 a 240) e y é para cima e para baixo (de -180 a 180).", try: "Use “ir para x: 0 y: 0” no começo do jogo para o ator sempre começar no meio." },
  mv_glide: { care: "Enquanto desliza, o script espera. Os blocos de baixo só rodam quando ele chegar.", try: "Faça o ator deslizar de um canto ao outro em 3 segundos." },
  mv_glideto: { care: "Igual ao “ir para”, mas ele vai devagar, mostrando o caminho.", try: "Deslize até o ponteiro do mouse dentro de um “sempre”." },
  mv_pointdir: { care: "90 é direita, -90 é esquerda, 0 é para cima e 180 é para baixo.", try: "Antes de “mover”, escolha a direção para o ator andar para cima." },
  mv_pointto: { care: "O ator gira para olhar, mas não anda. Use “mover” depois.", try: "“sempre: apontar para o ponteiro do mouse, mover 3” faz ele seguir o mouse." },
  mv_changex: { care: "Número positivo vai para a direita; negativo vai para a esquerda.", try: "Seta direita → mudar x por 10. Seta esquerda → mudar x por -10." },
  mv_changey: { care: "Número positivo sobe; negativo desce.", try: "Para pular: mudar y por 50, esperar 0.3, mudar y por -50." },
  mv_setx: { care: "Ele não anda até lá: aparece direto naquela posição.", try: "Quando o ator passar da borda direita, defina x como -230 para ele voltar pela esquerda." },
  mv_sety: { care: "y negativo fica na parte de baixo do palco.", try: "Use “definir y como -150” para colocar o ator no chão." },
  mv_bounce: { care: "Só confere a borda na hora em que roda. Por isso fica dentro de um “sempre”.", try: "“sempre: mover 10, se tocar na borda, volte” faz uma bola quicar." },
  mv_rotstyle: { care: "Com “girar em volta”, o personagem fica de cabeça para baixo ao andar para a esquerda.", try: "Escolha “esquerda-direita” num jogo de plataforma." },
  lk_sayfor: { care: "O script espera a fala acabar antes de continuar.", try: "Faça uma conversa: um ator fala, espera, e o outro responde." },
  lk_say: { care: "A fala fica na tela até outro “dizer”. Para apagar, use “dizer” vazio.", try: "Mostre os pontos com “dizer (pontos)” dentro de um “sempre”." },
  lk_thinkfor: { care: "Igual ao “dizer”, mas com balão de nuvem.", try: "Faça o ator pensar antes de responder uma pergunta." },
  lk_think: { care: "A nuvem fica até mudar.", try: "Use para mostrar o que o personagem está planejando." },
  lk_costume: { care: "Cada ator tem as suas fantasias, na aba Fantasias.", try: "Mude para a fantasia “feliz” quando ganhar ponto." },
  lk_nextcostume: { care: "Sem “esperar” no meio, troca rápido demais e parece que está piscando.", try: "“sempre: próxima fantasia, esperar 0.2” faz o personagem andar." },
  lk_backdrop: { care: "O cenário é do palco: todos os atores veem a troca.", try: "Mude para outro cenário quando passar de fase." },
  lk_nextbackdrop: { care: "Depois do último cenário, volta para o primeiro.", try: "Faça uma história: cada clique no palco mostra a próxima cena." },
  lk_changesize: { care: "100% é o tamanho normal. Número negativo encolhe.", try: "Repita 10 vezes: mudar tamanho por 10. O ator cresce aos poucos." },
  lk_setsize: { care: "50 é metade do tamanho e 200 é o dobro.", try: "Comece o jogo com “definir tamanho como 100 %”, para desfazer o que mudou." },
  lk_changeeffect: { care: "Os efeitos se somam: cada vez muda um pouco mais.", try: "“sempre: mudar efeito cor por 10” vira um arco-íris." },
  lk_seteffect: { care: "Fantasma 100 deixa o ator invisível; 0 deixa normal.", try: "Repita 10 vezes: mudar efeito fantasma por 10, e ele vai sumindo." },
  lk_cleareffects: { care: "Tira cor, fantasma e os outros efeitos de uma vez.", try: "Coloque logo embaixo de “quando ▶ for clicado”." },
  lk_show: { care: "Se o ator começa escondido, ninguém o vê até rodar “mostrar”.", try: "Mostre o inimigo só depois de 3 segundos de jogo." },
  lk_hide: { care: "Escondido, ele continua rodando os scripts e não toca em ninguém.", try: "Esconda a moeda quando o personagem pegar." },
  snd_play: { care: "O script não espera o som acabar: os próximos blocos rodam na hora.", try: "Toque um som quando o ator for clicado." },
  snd_playwait: { care: "O script espera o som acabar antes de continuar.", try: "Use para música de fundo: “sempre: tocar som até o fim”." },
  snd_stop: { care: "Para todos os sons de todos os atores.", try: "Pare a música quando o jogo acabar." },
  ct_wait: { care: "Enquanto espera, este script fica parado, mas os outros continuam.", try: "Use 0.5 para meio segundo e 0.1 para quase nada." },
  ct_repeat: { care: "Depois de repetir, continua com os blocos de baixo.", try: "Repita 4 vezes: mover 100, girar 90. Desenha um quadrado (com a caneta)." },
  ct_forever: { care: "Nada embaixo do “sempre” roda, porque ele nunca termina. Para parar, clique em ■.", try: "Coloque um “se” dentro do “sempre” para o jogo ficar conferindo o tempo todo." },
  ct_if: { care: "Ele olha a condição uma vez só. Para olhar o tempo todo, ponha dentro de um “sempre”.", try: "se tocando em Moeda? então adicionar 1 a pontos." },
  ct_ifelse: { care: "Sempre roda uma das duas partes: a de cima se for verdade, a de baixo se não for.", try: "se pontos > 10 então dizer Ganhei! senão dizer Continue!" },
  ct_waituntil: { care: "Se a condição nunca ficar verdadeira, o script fica esperando para sempre.", try: "Esperar até que tecla espaço pressionada? e só então começar o jogo." },
  ct_stop: { care: "“tudo” para o jogo inteiro, como o botão ■.", try: "Pare tudo quando o fantasma pegar o personagem." },
  ct_clone: { care: "O clone começa no mesmo lugar do original.", try: "Crie clones de uma gota para fazer chuva." },
  sn_touching: { care: "É uma pergunta: precisa ficar dentro de um “se” ou “esperar até que”.", try: "se tocando em Estrela? então adicionar 1 a pontos." },
  sn_keypressed: { care: "Responde verdadeiro só enquanto a tecla está apertada.", try: "Dentro de um “sempre”, deixa o movimento mais suave que “quando a tecla for pressionada”." },
  sn_mousedown: { care: "Vale para qualquer clique, em qualquer lugar.", try: "se mouse pressionado? então carimbar (com a caneta): vira um pincel." },
  sn_ask: { care: "O script espera a pessoa digitar e apertar Enter.", try: "Pergunte o nome e depois diga “juntar Olá, com resposta”." },
  sn_timer: { care: "Conta os segundos desde o começo. Use “zerar cronômetro” no ▶.", try: "Mostre o tempo de jogo com “dizer (cronômetro)”." },
  op_random: { care: "Cada vez que roda, sorteia de novo.", try: "Use em “ir para x: (sorteie -200 a 200) y: 150” para a gota cair de um lugar diferente." },
  op_add: { care: "Encaixe dentro de outro bloco: sozinho ele não faz nada.", try: "dizer (pontos + 10)." },
  op_gt: { care: "Compara números: 10 > 5 é verdadeiro.", try: "se pontos > 9 então dizer Você ganhou!" },
  op_eq: { care: "Compara se os dois lados são iguais.", try: "se resposta = sim então…" },
  op_and: { care: "Só é verdadeiro se as duas partes forem verdadeiras.", try: "se tocando em Chave? e tocando em Porta? então…" },
  op_or: { care: "Basta uma das duas partes ser verdadeira.", try: "se tecla a pressionada? ou tecla ← pressionada? então ir para a esquerda." },
  op_not: { care: "Troca verdadeiro por falso e falso por verdadeiro.", try: "esperar até que não tocando em Fantasma?" },
  op_join: { care: "Não põe espaço sozinho: coloque o espaço dentro do texto.", try: "dizer (juntar “Pontos: ” com pontos)." },
  var_set: { care: "Troca o valor inteiro. Para somar, use “adicionar … a”.", try: "No começo do jogo: definir pontos como 0." },
  var_change: { care: "Use número negativo para tirar: adicionar -1 a vidas.", try: "Toda vez que pegar a estrela: adicionar 1 a pontos." },
  var_show: { care: "Mostra o mostrador da variável no palco.", try: "Esconda no menu e mostre só quando o jogo começar." },
  var_get: { care: "Este bloco redondo é o valor guardado. Encaixe-o em outro bloco.", try: "dizer (pontos) mostra quantos pontos você tem." },
  pen_down: { care: "Depois de abaixar, todo movimento risca o palco.", try: "Abaixar a caneta e repetir 4 vezes: mover 100, girar 90." },
  pen_up: { care: "Para de riscar, mas o desenho continua lá.", try: "Levante a caneta para ir a outro lugar sem riscar." },
  pen_clear: { care: "Apaga todos os riscos e carimbos do palco.", try: "Coloque no começo do ▶ para começar com o palco limpo." },
};
// Tecla, mensagem e ator usados nos exemplos
const DEMO_STOP = { stop: true };
let demoView = null;
function demoTarget(S) { return { id: "demo", sid: "demo", clone: false, x: S.f.x, y: S.f.y, dir: S.f.dir, size: S.f.size, visible: true, rot: "all", costume: 0, vars: new Map(), lists: new Map(), effects: freshEffects(), volume: 100, sfx: { pitch: 0, pan: 0 } }; }
// Monta, para cada bloco, os blocos mostrados e o que o Faísca faz
function demoFor(type, D) {
  const flag = () => tb("ev_flag");
  const go = async h => { D.flag(); D.hl(h); D.narr("Clicaram na bandeira ▶: o script começa."); await D.wait(700); };
  const simple = (vals, narr, act, opts = {}) => {
    const h = flag(), b = tb(type, vals); chain(h, b);
    return { tops: [h], ...opts, async run() { await go(h); D.hl(b); D.narr(narr); await act(b); await D.wait(700); D.hl(null); } };
  };
  const loopForever = (inner, narr, step, laps = 6) => {
    const h = flag(), f = tb("ct_forever", { SUBSTACK: chain(...inner) }); chain(h, f);
    return { tops: [h], async run() {
      await go(h);
      for (let i = 1; i <= laps; i++) { D.hl(f); D.narr(`Volta ${i} do “sempre”. ${narr}`); await D.wait(250); await step(i); }
      D.stop(); D.hl(null); D.narr("Clicaram em ■: o “sempre” só para assim.");
    } };
  };
  switch (type) {
    case "ev_flag": { const h = flag(), s = tb("lk_sayfor", { MSG: "Começou!", SECS: 1 }); chain(h, s); return { tops: [h], async run() { D.narr("O script está esperando…"); await D.wait(800); await go(h); D.hl(s); D.say("Começou!"); D.narr("Agora os blocos de baixo rodam, um depois do outro."); await D.wait(1200); D.say(null); D.hl(null); } }; }
    case "ev_key": case "ev_keyup": { const h = tb(type, { KEY: "right" }), m = tb("mv_changex", { DX: 40 }); chain(h, m); return { tops: [h], async run() { for (let i = 0; i < 3; i++) { D.key("→"); D.hl(h); D.narr(type === "ev_key" ? "Apertaram a seta →: o script começa." : "Soltaram a seta →: o script começa."); await D.wait(500); D.hl(m); D.narr("mudar x por 40: anda para a direita."); await D.tween({ x: D.f.x + 40 }, 350); await D.wait(300); } D.hl(null); } }; }
    case "ev_click": { const h = tb("ev_click"), s = tb("lk_sayfor", { MSG: "Ai!", SECS: 1 }); chain(h, s); return { tops: [h], async run() { await D.wait(500); D.click(); D.hl(h); D.narr("Clicaram no Faísca: este script começa."); await D.wait(600); D.hl(s); D.say("Ai!"); await D.wait(1200); D.say(null); D.hl(null); } }; }
    case "ev_broadcast": case "ev_broadcastwait": case "ev_receive": {
      const h = flag(), t = tb("ev_broadcast", { MSG: "começar" }); chain(h, t);
      const r = tb("ev_receive", { MSG: "começar" }), s = tb("lk_sayfor", { MSG: "Recebi!", SECS: 1 }); chain(r, s);
      return { tops: [h, r], star: { x: 100, y: 40 }, async run() { await go(h); D.hl(t); D.narr("transmitir começar: manda um recado para todos os atores."); D.letter(); await D.wait(900); D.hl(r); D.narr("Quem tem “quando eu receber começar” começa agora."); await D.wait(600); D.hl(s); D.say("Recebi!"); await D.wait(1200); D.say(null); D.hl(null); } };
    }
    case "mv_move": return { ...simple({ STEPS: 80 }, "mover 80 passos: anda para onde está olhando (para a direita).", () => D.tween({ x: D.f.x + 80 }, 700)), start: { x: -120 } };
    case "mv_turnr": case "mv_turnl": { const s = type === "mv_turnr" ? 1 : -1, h = flag(), r = tb("ct_repeat", { TIMES: 3, SUBSTACK: tb(type, { DEG: 30 }) }); chain(h, r); const g = r.inputs.SUBSTACK.block;
      return { tops: [h], async run() { await go(h); for (let i = 1; i <= 3; i++) { D.hl(g); D.narr(`Volta ${i} de 3: gira 30 graus ${s > 0 ? "no sentido do relógio ↻" : "no sentido contrário ↺"}.`); await D.tween({ dir: D.f.dir + 30 * s }, 450); await D.wait(250); } D.hl(null); } }; }
    case "mv_changex": return { ...simple({ DX: 60 }, "mudar x por 60: o x aumenta 60, então vai para a direita.", () => D.tween({ x: D.f.x + 60 }, 500)), start: { x: -60 }, axes: true };
    case "mv_changey": return { ...simple({ DY: 60 }, "mudar y por 60: o y aumenta 60, então sobe.", () => D.tween({ y: D.f.y + 60 }, 500)), start: { y: -50 }, axes: true };
    case "mv_setx": return { ...simple({ X: 150 }, "definir x como 150: aparece direto em x = 150.", () => D.set({ x: 150 })), start: { x: -100 }, axes: true };
    case "mv_sety": return { ...simple({ Y: -120 }, "definir y como -120: aparece lá embaixo, em y = -120.", () => D.set({ y: -120 })), start: { y: 60 }, axes: true };
    case "mv_gotoxy": return { ...simple({ X: 120, Y: 80 }, "ir para x: 120 y: 80: pula para esse ponto (direita e para cima).", () => D.set({ x: 120, y: 80 })), axes: true, mark: { x: 120, y: 80 } };
    case "mv_goto": { const h = flag(), r = tb("ct_repeat", { TIMES: 3, SUBSTACK: chain(tb("mv_goto", { TO: "_random_" }), tb("ct_wait", { SECS: 0.5 })) }); chain(h, r); const g = r.inputs.SUBSTACK.block;
      return { tops: [h], async run() { await go(h); for (let i = 1; i <= 3; i++) { D.hl(g); D.narr(`Volta ${i} de 3: pula para um lugar sorteado do palco.`); D.set({ x: Math.round(Math.random() * 360 - 180), y: Math.round(Math.random() * 240 - 120) }); await D.wait(800); } D.hl(null); } }; }
    case "mv_glide": return { ...simple({ SECS: 1.5, X: 150, Y: 60 }, "deslizar por 1.5 seg. até x: 150 y: 60: vai devagar até lá.", () => D.tween({ x: 150, y: 60 }, 1500)), start: { x: -150, y: -60 }, mark: { x: 150, y: 60 } };
    case "mv_glideto": return { ...simple({ SECS: 1.5, TO: "_random_" }, "deslizar até uma posição aleatória: escolhe um lugar e vai devagar.", () => D.tween({ x: 140, y: 70 }, 1500)), start: { x: -120, y: -60 } };
    case "mv_pointdir": return { ...simple({ DIR: 0 }, "apontar para a direção 0: passa a olhar para cima.", () => D.tween({ dir: 0 }, 400)) };
    case "mv_pointto": return { ...simple({ TO: "Estrela" }, "apontar para a Estrela: gira para olhar para ela (mas não anda).", () => D.tween({ dir: 45 }, 500)), star: { x: 120, y: 120 } };
    case "mv_bounce": return loopForever([tb("mv_move", { STEPS: 40 }), tb("mv_bounce")], "Anda 40 e confere a borda.", async () => {
      const nx = D.f.x + (D.f.dir > 0 ? 40 : -40); await D.tween({ x: Math.max(-200, Math.min(200, nx)) }, 280);
      if (Math.abs(D.f.x) >= 200) { D.narr("Encostou na borda: vira para o outro lado!"); D.set({ dir: -D.f.dir }); await D.wait(400); } }, 9);
    case "mv_rotstyle": return { ...simple({ STYLE: "lr" }, "estilo esquerda-direita: ao virar para a esquerda ele não fica de cabeça para baixo.", async () => { D.set({ rot: "lr" }); await D.tween({ dir: -90 }, 10); await D.wait(500); await D.tween({ x: -100 }, 700); }), start: { rot: "all" } };
    case "lk_sayfor": return simple({ MSG: "Olá!", SECS: 2 }, "dizer Olá! por 2 segundos: o balão aparece, o script espera 2 segundos e o balão some.", async () => { D.say("Olá!"); await D.timer(2000); D.say(null); });
    case "lk_say": return simple({ MSG: "Olá!" }, "dizer Olá!: o balão fica na tela até outro “dizer”.", async () => { D.say("Olá!"); await D.wait(1600); });
    case "lk_thinkfor": return simple({ MSG: "Hmm…", SECS: 2 }, "pensar Hmm… por 2 segundos: aparece uma nuvem de pensamento.", async () => { D.say("Hmm…", true); await D.timer(2000); D.say(null); });
    case "lk_think": return simple({ MSG: "Hmm…" }, "pensar Hmm…: a nuvem fica até mudar.", async () => { D.say("Hmm…", true); await D.wait(1600); });
    case "lk_nextcostume": return loopForever([tb("lk_nextcostume"), tb("ct_wait", { SECS: 0.3 })], "Troca de fantasia e espera 0.3.", async () => { D.set({ costume: 1 - D.f.costume }); await D.wait(300); }, 8);
    case "lk_costume": return simple({}, "mudar para a fantasia: o Faísca troca de desenho (aqui, a fantasia andando).", async () => { D.set({ costume: 1 }); await D.wait(600); });
    case "lk_show": return { ...simple({}, "mostrar: o ator aparece no palco.", () => D.set({ visible: true })), start: { visible: false } };
    case "lk_hide": return simple({}, "esconder: o ator some do palco (mas continua lá, invisível).", () => D.set({ visible: false }));
    case "lk_changesize": { const h = flag(), r = tb("ct_repeat", { TIMES: 5, SUBSTACK: tb("lk_changesize", { CHANGE: 20 }) }); chain(h, r); const g = r.inputs.SUBSTACK.block;
      return { tops: [h], async run() { await go(h); for (let i = 1; i <= 5; i++) { D.hl(g); D.narr(`Volta ${i} de 5: tamanho ${D.f.size}% → ${D.f.size + 20}%.`); await D.tween({ size: D.f.size + 20 }, 300); await D.wait(200); } D.hl(null); } }; }
    case "lk_setsize": return simple({ SIZE: 200 }, "definir tamanho como 200 %: fica com o dobro do tamanho de uma vez.", () => D.set({ size: 200 }));
    case "lk_changeeffect": return loopForever([tb("lk_changeeffect", { EFFECT: "color", CHANGE: 25 })], "Muda a cor um pouco mais.", async () => { await D.tween({ color: D.f.color + 25 }, 250); }, 7);
    case "lk_seteffect": return simple({ EFFECT: "ghost", VALUE: 70 }, "definir efeito fantasma como 70: o ator fica quase transparente.", () => D.tween({ ghost: 70 }, 400));
    case "lk_cleareffects": return { ...simple({}, "limpar efeitos gráficos: volta a cor e a transparência ao normal.", () => D.tween({ ghost: 0, color: 0 }, 400)), start: { ghost: 60, color: 90 } };
    case "snd_play": case "snd_playwait": return simple({}, type === "snd_play" ? "tocar som: o som começa e o script continua na hora." : "tocar som até o fim: o script espera o som acabar.", async () => { D.note(); D.beep(); await D.wait(type === "snd_play" ? 300 : 900); });
    case "ct_wait": { const h = flag(), a = tb("lk_say", { MSG: "1…" }), w = tb("ct_wait", { SECS: 1.5 }), b = tb("lk_say", { MSG: "2!" }); chain(h, a, w, b);
      return { tops: [h], async run() { await go(h); D.hl(a); D.say("1…"); await D.wait(600); D.hl(w); D.narr("esperar 1.5 segundos: o script fica parado contando o tempo."); await D.timer(1500); D.hl(b); D.say("2!"); D.narr("O tempo passou: continua com o bloco de baixo."); await D.wait(1000); D.say(null); D.hl(null); } }; }
    case "ct_repeat": { const h = flag(), r = tb("ct_repeat", { TIMES: 4, SUBSTACK: tb("mv_move", { STEPS: 50 }) }), s = tb("lk_sayfor", { MSG: "Pronto!", SECS: 1 }); chain(h, r, s); const g = r.inputs.SUBSTACK.block;
      return { tops: [h], start: { x: -120 }, async run() { await go(h); for (let i = 1; i <= 4; i++) { D.hl(g); D.narr(`Volta ${i} de 4: mover 50 passos.`); await D.tween({ x: D.f.x + 50 }, 350); await D.wait(200); } D.hl(s); D.say("Pronto!"); D.narr("Repetiu 4 vezes: agora segue para o bloco de baixo."); await D.wait(1200); D.say(null); D.hl(null); } }; }
    case "ct_forever": return loopForever([tb("mv_move", { STEPS: 30 }), tb("mv_bounce")], "Anda 30 e confere a borda.", async () => {
      await D.tween({ x: Math.max(-200, Math.min(200, D.f.x + (D.f.dir > 0 ? 30 : -30))) }, 220); if (Math.abs(D.f.x) >= 200) D.set({ dir: -D.f.dir }); }, 14);
    case "ct_if": case "ct_ifelse": case "sn_touching": case "ct_waituntil": {
      const cond = tb("sn_touching", { OBJ: "Estrela" }), h = flag();
      let body, check;
      if (type === "ct_waituntil") { const w = tb("ct_waituntil", { COND: cond }), s = tb("lk_sayfor", { MSG: "Peguei!", SECS: 1 }); chain(h, tb("mv_glide", { SECS: 2, X: 110, Y: 0 }), w, s); body = { w, s }; }
      else { const i = tb(type === "ct_ifelse" ? "ct_ifelse" : "ct_if", { COND: cond, SUBSTACK: tb("lk_say", { MSG: "Peguei!" }), ...(type === "ct_ifelse" ? { SUBSTACK2: tb("lk_say", { MSG: "Cadê?" }) } : {}) }); chain(h, tb("ct_forever", { SUBSTACK: chain(tb("mv_changex", { DX: 20 }), i) })); body = { i }; }
      return { tops: [h], star: { x: 110, y: 0 }, start: { x: -130 }, async run() {
        await go(h);
        if (body.w) { D.narr("Desliza na direção da Estrela…"); D.hl(h.next.block); const p = D.tween({ x: 110 }, 2000); await D.wait(300); D.hl(body.w); D.narr("esperar até que tocando em Estrela?: ainda não… continua esperando."); await p; D.narr("Agora encostou! A condição ficou verdadeira e o script continua."); await D.wait(700); D.hl(body.s); D.say("Peguei!"); await D.wait(1200); D.say(null); D.hl(null); return; }
        for (let lap = 1; lap <= 14; lap++) {
          await D.tween({ x: D.f.x + 20 }, 160); const touching = Math.abs(D.f.x - 110) < 40;
          D.hl(type === "sn_touching" ? cond : body.i);
          D.narr(`Volta ${lap}: “tocando em Estrela?” → ${touching ? "verdadeiro" : "falso"}. ${touching ? "Roda os blocos de dentro do “se”." : type === "ct_ifelse" ? "Roda a parte do “senão”." : "Pula os blocos de dentro."}`);
          D.say(touching ? "Peguei!" : type === "ct_ifelse" ? "Cadê?" : D.f.say); await D.wait(touching ? 900 : 350);
          if (touching) break;
        }
        D.stop(); D.hl(null);
      } };
    }
    case "sn_keypressed": { const c = tb("sn_keypressed", { KEY: "right" }), i = tb("ct_if", { COND: c, SUBSTACK: tb("mv_changex", { DX: 15 }) }), h = flag(); chain(h, tb("ct_forever", { SUBSTACK: i }));
      return { tops: [h], start: { x: -120 }, async run() { await go(h); for (let lap = 1; lap <= 14; lap++) { const down = lap >= 4 && lap <= 11; if (down) D.key("→", true); else D.key(null); D.hl(c); D.narr(`Volta ${lap}: “tecla → pressionada?” → ${down ? "verdadeiro: anda 15." : "falso: não anda."}`); if (down) await D.tween({ x: D.f.x + 15 }, 180); else await D.wait(260); } D.key(null); D.stop(); D.hl(null); } }; }
    case "var_set": case "var_change": case "var_get": case "var_show": {
      const h = flag(), set = tb("var_set", { VAR: "pontos", VALUE: "0" }), r = tb("ct_repeat", { TIMES: 3, SUBSTACK: chain(tb("var_change", { VAR: "pontos", VALUE: 1 }), tb("ct_wait", { SECS: 0.5 })) }); chain(h, set, r); const ch = r.inputs.SUBSTACK.block;
      return { tops: [h], vars: 7, async run() { await go(h); D.hl(set); D.narr("definir pontos como 0: a variável passa a guardar 0."); D.var(0); await D.wait(900); for (let i = 1; i <= 3; i++) { D.hl(ch); D.narr(`Volta ${i} de 3: pontos valia ${i - 1} e ganha 1, fica ${i}.`); D.var(i); D.note(); await D.wait(800); } D.hl(null); } };
    }
    case "pen_down": case "pen_up": case "pen_clear": {
      const h = flag(), d = tb("pen_down"), r = tb("ct_repeat", { TIMES: 4, SUBSTACK: chain(tb("mv_move", { STEPS: 100 }), tb("mv_turnr", { DEG: 90 })) }), u = tb("pen_up"), c = tb("pen_clear");
      chain(h, d, r, u, ...(type === "pen_clear" ? [tb("ct_wait", { SECS: 1 }), c] : [])); const mv = r.inputs.SUBSTACK.block, tr = mv.next.block;
      return { tops: [h], start: { x: -50, y: 50 }, async run() { await go(h); D.hl(d); D.narr("abaixar a caneta: a partir de agora, risca por onde passa."); D.pen(true); await D.wait(800);
        for (let i = 1; i <= 4; i++) { D.hl(mv); D.narr(`Volta ${i} de 4: anda 100 riscando…`); const r2 = (90 - D.f.dir) * Math.PI / 180; await D.tween({ x: D.f.x + 100 * Math.cos(r2), y: D.f.y + 100 * Math.sin(r2) }, 450); D.hl(tr); await D.tween({ dir: D.f.dir + 90 }, 250); }
        D.hl(u); D.pen(false); D.narr("levantar a caneta: para de riscar. Saiu um quadrado!"); await D.wait(1000);
        if (type === "pen_clear") { D.hl(c); D.narr("apagar tudo: os riscos somem do palco."); D.clearPen(); await D.wait(1000); } D.hl(null); } };
    }
    case "mu_note": case "mu_drum": case "mu_rest": { const h = flag(), r = tb("ct_repeat", { TIMES: 4, SUBSTACK: tb(type) }); chain(h, r); const g = r.inputs.SUBSTACK.block;
      return { tops: [h], async run() { await go(h); for (let i = 1; i <= 4; i++) { D.hl(g); D.narr(`Volta ${i} de 4: ${type === "mu_rest" ? "uma pausa, sem som." : "toca e espera a batida acabar."}`); if (type !== "mu_rest") { D.note(); D.beep(); } await D.wait(500); } D.hl(null); } }; }
    case "sn_ask": { const h = flag(), a = tb("sn_ask", { Q: "Qual é o seu nome?" }), s2 = tb("lk_sayfor", { SECS: 2 }), j = tb("op_join", { A: "Olá, ", B: "" }); j.inputs.B.block = tb("sn_answer"); s2.inputs.MSG.block = j; chain(h, a, s2);
      return { tops: [h], async run() { await go(h); D.hl(a); D.say("Qual é o seu nome?"); D.narr("perguntar: o Faísca pergunta e o script espera a resposta."); await D.wait(900); D.answer("Ana"); D.narr("Alguém digitou “Ana” e apertou Enter. Agora “resposta” vale Ana."); await D.wait(1400); D.answer(null); D.hl(s2); D.say("Olá, Ana"); D.narr("dizer (juntar Olá, com resposta): usa o que a pessoa escreveu."); await D.wait(1600); D.say(null); D.hl(null); } }; }
    case "ct_clone": case "ct_startclone": case "ct_deleteclone": { const h = flag(), r = tb("ct_repeat", { TIMES: 3, SUBSTACK: chain(tb("ct_clone", { OF: "_myself_" }), tb("mv_changex", { DX: 60 })) }); chain(h, r); const c = r.inputs.SUBSTACK.block, m2 = c.next.block;
      return { tops: [h], start: { x: -120 }, async run() { await go(h); for (let i = 1; i <= 3; i++) { D.hl(c); D.narr(`Volta ${i} de 3: cria um clone (uma cópia) bem onde o Faísca está.`); D.clone(); await D.wait(600); D.hl(m2); D.narr("O original anda 60; o clone fica para trás."); await D.tween({ x: D.f.x + 60 }, 400); } D.hl(null); } }; }
    case "lk_backdrop": case "lk_nextbackdrop": case "lk_backdropwait": { const h = flag(), b = tb(type); chain(h, b);
      return { tops: [h], async run() { await go(h); D.hl(b); D.narr("O cenário (o fundo do palco) troca. Todos os atores continuam lá."); D.bg("#d9f2d0"); await D.wait(1200); D.bg("#1f2a44"); D.narr("Mais uma troca: agora é noite."); await D.wait(1200); D.hl(null); } }; }
    case "ct_stop": { const h = flag(), st = tb("ct_stop", { WHAT: "all" }); chain(h, tb("ct_repeat", { TIMES: 10, SUBSTACK: tb("mv_move", { STEPS: 20 }) }), st); const rr = h.next.block;
      return { tops: [h], start: { x: -150 }, async run() { await go(h); D.hl(rr); D.narr("Anda 20 passos, 10 vezes…"); await D.tween({ x: 50 }, 1500); D.hl(st); D.stop(); D.narr("parar tudo: o jogo inteiro para, como o botão ■."); await D.wait(1200); D.hl(null); } }; }
  }
  // Blocos redondos e de seis lados: o Faísca fala o valor que eles dão
  const d = DEF[type];
  if (d && (d.kind === "rep" || d.kind === "bool") && !type.startsWith("proc_")) {
    if (["sn_loudness", "sn_answer", "sn_username"].includes(type)) return null; // precisam de microfone, pergunta ou conta
    const r = tb(type); const h = flag(), s = tb("lk_sayfor", { SECS: 2 }); s.inputs.MSG.block = r; chain(h, s);
    return { tops: [h], async run() {
      let v; try { v = evalR(JSON.parse(JSON.stringify(r)), { target: demoTarget(D.S), frames: [], done: false, warp: 0 }); } catch (_) { v = "?"; }
      const txt = typeof v === "boolean" ? (v ? "verdadeiro" : "falso") : str(v) || "(vazio)"; await go(h); D.hl(r); D.narr(`${d.kind === "bool" ? "Blocos de seis lados respondem verdadeiro ou falso." : "Blocos redondos guardam um valor."} Agora este vale: ${txt}.`); await D.wait(1400); D.hl(s); D.say(txt); D.narr(`O “dizer” mostra o valor: ${txt}.`); await D.wait(1600); D.say(null); D.hl(null); } };
  }
  // Outros blocos de comando: o bloco acende e o quadro explica o que ele faz
  if (d && d.kind === "stmt") {
    const h = flag(), b = tb(type); chain(h, b);
    return { tops: [h], async run() { await go(h); D.hl(b); D.narr(`${blockLabel(type)}: ${String(d.tip || "").replace(/\s*\(Extra[^)]*\)\s*/, " ").trim()}`); await D.tween({ size: 115 }, 250); await D.tween({ size: 100 }, 250); await D.wait(1800); D.hl(null); } };
  }
  return null;
}
const hasDemo = type => { try { return !!demoFor(type, demoStub()); } catch (_) { return false; } };
function demoStub() { const S = demoState(); return new Proxy({ S, f: S.f }, { get: (o, k) => k in o ? o[k] : () => {} }); }
function demoState() { return { bg: null, clones: [], answer: null, f: { x: 0, y: 0, dir: 90, size: 100, visible: true, ghost: 0, color: 0, costume: 0, say: null, think: false, rot: "all" }, star: null, mark: null, axes: false, varv: null, key: null, flag: 0, click: 0, letter: 0, notes: [], pen: false, strokes: [], timer: null, stopAt: 0 }; }

// ---------- Desenho do palco pequeno (metade do tamanho do palco de verdade) ----------
const demoImgs = {};
const demoImage = k => demoImgs[k] ||= Object.assign(new Image(), { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LIB[k].svg)}` });
function drawDemo(cv, S) {
  const g = cv.getContext("2d"), W = cv.width, H = cv.height, k = W / 480, P = (x, y) => [W / 2 + x * k, H / 2 - y * k], t = now();
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  g.fillStyle = S.bg || "#f7fbff"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#dfe8f1"; g.lineWidth = 1; for (let x = -200; x <= 200; x += 40) { const [px] = P(x, 0); g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke(); } for (let y = -160; y <= 160; y += 40) { const [, py] = P(0, y); g.beginPath(); g.moveTo(0, py); g.lineTo(W, py); g.stroke(); }
  if (S.axes || S.mark) { g.strokeStyle = "#9fb3c8"; g.lineWidth = 1.5; const [ox, oy] = P(0, 0); g.beginPath(); g.moveTo(0, oy); g.lineTo(W, oy); g.moveTo(ox, 0); g.lineTo(ox, H); g.stroke(); g.fillStyle = "#6b7f95"; g.font = "10px sans-serif"; g.fillText("x →", W - 24, oy - 4); g.fillText("y ↑", ox + 4, 12); g.fillText(`x: ${Math.round(S.f.x)}  y: ${Math.round(S.f.y)}`, 6, H - 6); }
  if (S.mark) { const [mx, my] = P(S.mark.x, S.mark.y); g.strokeStyle = "#e5483d"; g.lineWidth = 2; g.beginPath(); g.moveTo(mx - 6, my - 6); g.lineTo(mx + 6, my + 6); g.moveTo(mx + 6, my - 6); g.lineTo(mx - 6, my + 6); g.stroke(); }
  g.strokeStyle = "#1e88e5"; g.lineWidth = 3; g.lineCap = "round"; for (const s of S.strokes) { g.beginPath(); s.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); }
  if (S.star) { const im = demoImage("estrela"), [sx, sy] = P(S.star.x, S.star.y), w = im.width * k || 35; if (im.complete) g.drawImage(im, sx - w / 2, sy - (im.height * k) / 2, w, im.height * k); }
  const f = S.f, im = demoImage(f.costume ? "robo-b" : "robo-a"), [fx, fy] = P(f.x, f.y);
  if (im.complete) S.clones.forEach(c => { const [cx, cy] = P(c.x, c.y), w = im.width * k, h = im.height * k; g.globalAlpha = .75; g.drawImage(im, cx - w / 2, cy - h / 2, w, h); g.globalAlpha = 1; });
  if (f.visible && im.complete) {
    g.save(); g.translate(fx, fy);
    if (f.rot === "all") g.rotate((f.dir - 90) * Math.PI / 180); else if (f.rot === "lr" && f.dir < 0) g.scale(-1, 1);
    g.globalAlpha = 1 - Math.min(100, f.ghost) / 100; if (f.color) g.filter = `hue-rotate(${f.color * 1.8}deg)`;
    const w = im.width * k * f.size / 100, h = im.height * k * f.size / 100; g.drawImage(im, -w / 2, -h / 2, w, h); g.restore();
  }
  if (f.say && f.visible) {
    g.font = "bold 13px Atkinson Hyperlegible, sans-serif"; const tw = g.measureText(f.say).width, bw = tw + 18, bh = 26, bx = Math.min(W - bw - 4, fx + 10), by = Math.max(4, fy - 34 * f.size / 100 - bh);
    g.fillStyle = "#fff"; g.strokeStyle = "#8a96a3"; g.lineWidth = 1.5; g.beginPath(); g.roundRect ? g.roundRect(bx, by, bw, bh, 10) : g.rect(bx, by, bw, bh); g.fill(); g.stroke();
    if (f.think) { [[bx + 8, by + bh + 6, 4], [bx + 2, by + bh + 13, 2.5]].forEach(([cx, cy, r]) => { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.stroke(); }); }
    else { g.beginPath(); g.moveTo(bx + 10, by + bh); g.lineTo(bx + 6, by + bh + 9); g.lineTo(bx + 20, by + bh); g.fill(); g.stroke(); }
    g.fillStyle = "#17202b"; g.fillText(f.say, bx + 9, by + 17);
  }
  if (S.answer) { g.fillStyle = "#fff"; g.strokeStyle = "#0f7c8a"; g.lineWidth = 2; g.fillRect(10, H - 34, W - 20, 24); g.strokeRect(10, H - 34, W - 20, 24); g.fillStyle = "#17202b"; g.font = "13px sans-serif"; g.fillText(S.answer + " ⏎", 18, H - 17); }
  if (S.varv !== null) { g.font = "bold 11px sans-serif"; g.fillStyle = "#e9eef3"; g.fillRect(6, 6, 84, 20); g.fillStyle = "#17202b"; g.fillText("pontos", 11, 20); g.fillStyle = "#ef6a2c"; g.fillRect(56, 9, 30, 14); g.fillStyle = "#fff"; g.fillText(String(S.varv), 66, 20); }
  const ago = x => (t - x) / 1000;
  if (S.flag && ago(S.flag) < 1.2) { const a = 1 - ago(S.flag) / 1.2; g.fillStyle = `rgba(31,157,85,${a})`; g.beginPath(); g.arc(W - 22, 22, 15, 0, 7); g.fill(); g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.moveTo(W - 27, 14); g.lineTo(W - 14, 22); g.lineTo(W - 27, 30); g.fill(); }
  if (S.key) { const held = S.key.hold || ago(S.key.t) < .45; g.fillStyle = held ? "#f5c842" : "#e9eef3"; g.strokeStyle = "#5a6b7d"; g.lineWidth = 2; g.beginPath(); g.roundRect ? g.roundRect(8, H - 40, 36, 32, 6) : g.rect(8, H - 40, 36, 32); g.fill(); g.stroke(); g.fillStyle = "#17202b"; g.font = "bold 18px sans-serif"; g.fillText(S.key.k, 16, H - 17); }
  if (S.click && ago(S.click) < .9) { const a = ago(S.click) / .9; g.strokeStyle = `rgba(229,72,61,${1 - a})`; g.lineWidth = 3; g.beginPath(); g.arc(fx, fy, 10 + a * 28, 0, 7); g.stroke(); g.fillStyle = "#17202b"; g.font = "20px sans-serif"; g.fillText("👆", fx + 4, fy + 26); }
  if (S.letter && ago(S.letter) < 1) { const a = ago(S.letter); const [sx, sy] = S.star ? P(S.star.x, S.star.y) : [W - 30, 30]; g.font = "18px sans-serif"; g.fillText("✉️", fx + (sx - fx) * a - 9, fy + (sy - fy) * a); }
  S.notes = S.notes.filter(n => ago(n) < 1.2); S.notes.forEach(n => { const a = ago(n) / 1.2; g.globalAlpha = 1 - a; g.fillStyle = "#c157c4"; g.font = "bold 18px sans-serif"; g.fillText("♪", fx + 18 + a * 10, fy - 20 - a * 40); g.globalAlpha = 1; });
  if (S.timer) { const a = Math.min(1, (t - S.timer.t0) / S.timer.ms); g.fillStyle = "#e9eef3"; g.fillRect(W / 2 - 50, H - 14, 100, 8); g.fillStyle = "#ec8a24"; g.fillRect(W / 2 - 50, H - 14, 100 * a, 8); g.fillStyle = "#5a6b7d"; g.font = "10px sans-serif"; g.fillText(`⏳ ${(a * S.timer.ms / 1000).toFixed(1)} s`, W / 2 + 54, H - 7); }
  if (S.stopAt && ago(S.stopAt) < 1.2) { g.fillStyle = `rgba(229,72,61,${1 - ago(S.stopAt) / 1.2})`; g.fillRect(W - 37, 7, 30, 30); }
}

// ---------- Janela “Ver exemplo” ----------
function openBlockGuide(type) {
  const d = DEF[type]; if (!d) return;
  const label = blockLabel(type), cat = CAT[d.cat] || ["", "#888"], G = GUIDE[type] || {}, demo = hasDemo(type);
  const fate = typeof scratchFate === "function" ? safeFate(type) : "ok";
  const tip = String(d.tip || "").replace(/\s*\(Extra[^)]*\)\s*/, " ").trim();
  modal(`<h2 style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="guide-chip" style="background:${cat[1]}">${esc(cat[0])}</span>“${esc(label)}”</h2>
    ${demo ? `<div class="demo-box"><div class="demo-ws" id="demoWs" aria-label="Blocos do exemplo"></div><div class="demo-side"><canvas id="demoCv" width="240" height="180" aria-label="Palco do exemplo"></canvas><p class="demo-narr" id="demoNarr" aria-live="polite">…</p></div></div>
    <div class="row"><button class="btn primary small" id="demoAgain">▶ Ver de novo</button><span class="muted" style="font-size:.82rem">O bloco que está rodando acende em amarelo.</span></div>` : ""}
    <dl class="guide">
      <dt>O que faz</dt><dd>${esc(tip)}</dd>
      ${EXAMPLES[type] ? `<dt>Como usar</dt><dd>${esc(EXAMPLES[type])}</dd>` : ""}
      ${G.care ? `<dt>Fique de olho</dt><dd>${esc(G.care)}</dd>` : ""}
      ${G.try ? `<dt>Experimente</dt><dd>${esc(G.try)}</dd>` : ""}
      <dt>No Scratch</dt><dd>${fate === "ok" ? "✅ Este bloco também existe no Scratch." : fate === "adaptado" ? `⚠️ Não existe igual no Scratch: ao exportar, ${esc(ADAPTED_TXT[type] || "vira um bloco parecido")}.` : "⚠️ Este bloco é um extra do Bloco a Bloco. Ao exportar para o Scratch, ele fica de fora."}</dd>
    </dl>
    <div class="row"><button class="btn" data-close>Fechar</button></div>`, m => { if (demo) startDemo(type, m); });
}
function startDemo(type, m) {
  const div = m.querySelector("#demoWs"), cv = m.querySelector("#demoCv");
  const dws = Blockly.inject(div, { readOnly: true, renderer: "zelos", theme: makeTheme(isDark()), zoom: { controls: false, wheel: false, startScale: .72 }, move: { scrollbars: false, drag: false, wheel: false } });
  // O Blockly passa a tratar a última área criada como a principal; devolve para a área de código (Ctrl+Z, Delete…)
  const keepMain = () => { try { Blockly.common.setMainWorkspace(ws); } catch (_) {} };
  keepMain(); div.addEventListener("pointerdown", () => setTimeout(keepMain, 0));
  const view = demoView = { tok: 0, open: true, ws: dws, S: null, cv };
  const loop = () => {
    if (!cv.isConnected) { view.open = false; view.tok++; try { dws.dispose(); } catch (_) {} keepMain(); if (demoView === view) demoView = null; return; }
    if (view.S) drawDemo(cv, view.S); requestAnimationFrame(loop);
  };
  const play = async () => {
    const tok = ++view.tok, S = view.S = demoState();
    const alive = () => { if (view.tok !== tok || !view.open) throw DEMO_STOP; };
    const wait = ms => new Promise((res, rej) => setTimeout(() => { try { alive(); res(); } catch (e) { rej(e); } }, ms));
    const tween = async (to, ms) => {
      const from = {}; for (const p in to) from[p] = S.f[p]; const t0 = now();
      for (;;) {
        alive(); const k = Math.min(1, (now() - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        for (const p in to) S.f[p] = from[p] + (to[p] - from[p]) * e;
        if (S.pen) S.strokes.at(-1).push([S.f.x, S.f.y]);
        if (k >= 1) return; await new Promise(r => setTimeout(r, 16));
      }
    };
    const D = {
      S, f: S.f, wait, tween,
      set: o => { Object.assign(S.f, o); if (S.pen) S.strokes.at(-1).push([S.f.x, S.f.y]); },
      say: (txt, think) => { S.f.say = txt; S.f.think = !!think; },
      hl: b => { try { dws.highlightBlock(b?.id || null); } catch (_) {} },
      narr: txt => { const el = m.querySelector("#demoNarr"); if (el) { el.textContent = txt; el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); } },
      flag: () => { S.flag = now(); }, key: (kk, hold) => { S.key = kk ? { k: kk, t: now(), hold: !!hold } : null; }, click: () => { S.click = now(); }, letter: () => { S.letter = now(); },
      note: () => S.notes.push(now()), beep: () => { try { synthSound("pop", outNode(100, 0), 1); } catch (_) {} }, var: v => { S.varv = v; },
      timer: async ms => { S.timer = { t0: now(), ms }; await wait(ms); S.timer = null; },
      pen: on => { S.pen = on; if (on) S.strokes.push([[S.f.x, S.f.y]]); }, clearPen: () => { S.strokes = []; },
      stop: () => { S.stopAt = now(); S.f.say = null; },
      answer: a => { S.answer = a; }, clone: () => { S.clones.push({ x: S.f.x, y: S.f.y }); }, bg: c => { S.bg = c; },
    };
    const demo = demoFor(type, D); if (!demo) return;
    Object.assign(S.f, demo.start || {}); S.star = demo.star || null; S.mark = demo.mark || null; S.axes = !!demo.axes; if (demo.vars !== undefined) S.varv = demo.vars;
    dws.clear(); demo.tops.forEach((top, i) => { collectExtras(top); top.x = 10; top.y = 10 + i * 120; Blockly.serialization.blocks.append(JSON.parse(JSON.stringify(top)), dws); });
    // Script comprido: diminui o zoom para caber inteiro na caixa
    try { const bb = dws.getBlocksBoundingBox(), box = div.getBoundingClientRect(), k = Math.min(.72, (box.height - 12) / (bb.bottom + 6)); dws.setScale(Math.max(.56, k)); dws.scroll(0, 0); } catch (_) {}
    try { await demo.run(); D.narr("Fim do exemplo. Clique em “▶ Ver de novo” para assistir outra vez."); }
    catch (e) { if (e !== DEMO_STOP) console.warn(e); }
  };
  m.querySelector("#demoAgain").onclick = play;
  requestAnimationFrame(loop); setTimeout(play, 60);
}
const safeFate = type => { try { return scratchFate(type); } catch (_) { return "ok"; } };
// Botão na barra “Sobre o bloco” e no menu do botão direito
$("#blockMore").onclick = () => openBlockGuide($("#blockMore").dataset.type);

// =====================================================================
// Busca de blocos (lupa): procura em todos os blocos, mesmo os que o nível esconde.
// Sem texto, mostra os últimos blocos clicados (guardados neste navegador).
// =====================================================================
const searchNorm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
let blockHistory = []; try { blockHistory = JSON.parse(localStorage.getItem("bab-busca") || "[]").filter(t => typeof t === "string"); } catch (_) {}
function rememberBlock(type) {
  if (!type || !DEF[type] || type.startsWith("pd_")) return;
  blockHistory = [type, ...blockHistory.filter(t => t !== type)].slice(0, 8);
  try { localStorage.setItem("bab-busca", JSON.stringify(blockHistory)); } catch (_) {}
}
// Blocos que funcionam no ator (ou no palco) selecionado, mais os blocos criados em Meus Blocos
function searchableTypes() {
  const stage = curSid === STAGE, ok = t => DEF[t] && !(stage && !DEF[t].stageOk) && !(!stage && !DEF[t].spriteOk);
  return [...Object.keys(DEF).filter(t => !DEF[t].hidden && !t.startsWith("proc_") && ok(t)), ...procsOf(curSid).map(([pid]) => "pc_" + pid).filter(ok)];
}
// Todas as palavras precisam aparecer no bloco, na dica ou na categoria; quem bate no nome do bloco vem primeiro
function findBlocks(q) {
  const words = searchNorm(q).split(/\s+/).filter(Boolean), whole = words.join(" ");
  if (!words.length) return [];
  return searchableTypes().map(t => {
    const label = searchNorm(blockLabel(t)), all = label + " " + searchNorm(DEF[t].tip) + " " + searchNorm(CAT[DEF[t].cat]?.[0]);
    if (!words.every(w => all.includes(w))) return null;
    return [t, label.startsWith(whole) ? 0 : label.includes(whole) ? 1 : words.every(w => label.includes(w)) ? 2 : 3];
  }).filter(Boolean).sort((a, b) => a[1] - b[1]).slice(0, 40).map(([t]) => t);
}
const bsBox = $("#blockSearch"), bsIn = $("#blockSearchIn"), bsList = $("#blockSearchList");
let bsSel = 0;
function renderBlockSearch() {
  const q = bsIn.value.trim(), avail = new Set(searchableTypes());
  const types = q ? findBlocks(q) : blockHistory.filter(t => avail.has(t));
  $("#blockSearchTitle").textContent = q ? (types.length ? `${types.length} bloco${types.length > 1 ? "s" : ""} encontrado${types.length > 1 ? "s" : ""}` : "Nenhum bloco encontrado") : "Últimos blocos";
  $("#blockSearchClear").hidden = !!q || !types.length;
  bsSel = Math.min(bsSel, Math.max(0, types.length - 1));
  bsList.innerHTML = types.length ? types.map((t, i) => {
    const d = DEF[t], [cn, col] = CAT[d.cat] || ["", "#888"];
    return `<li><button type="button" data-type="${esc(t)}" class="${i === bsSel ? "on" : ""}"><span class="bs-block bs-${esc(d.kind)}" style="background:${col}">${esc(blockLabel(t))}</span><span class="bs-cat">${esc(cn)}</span></button></li>`;
  }).join("") : `<li><p class="bs-empty">${q ? "Tente outra palavra, como “mover”, “tecla” ou “som”." : "Os blocos que você clicar aparecem aqui."}</p></li>`;
}
function openBlockSearch() { bsBox.hidden = false; $("#blockSearchBtn").setAttribute("aria-expanded", "true"); bsIn.value = ""; bsSel = 0; renderBlockSearch(); bsIn.focus(); }
function closeBlockSearch() { bsBox.hidden = true; $("#blockSearchBtn").setAttribute("aria-expanded", "false"); }
// Abre a paleta só com o bloco escolhido, pronto para arrastar
function pickSearchedBlock(type) {
  rememberBlock(type); closeBlockSearch();
  try { const tb = ws.getToolbox(); tb.clearSelection(); tb.getFlyout().show([toolboxBlock(type), ...($("#tipsChk")?.checked !== false ? tipLines(DEF[type].tip) : [])]); } catch (_) {}
  showBlockHelp(type);
}
$("#blockSearchBtn").onclick = () => bsBox.hidden ? openBlockSearch() : closeBlockSearch();
bsIn.addEventListener("input", () => { bsSel = 0; renderBlockSearch(); });
bsIn.addEventListener("keydown", e => {
  const btns = [...bsList.querySelectorAll("[data-type]")];
  if (e.key === "Escape") { closeBlockSearch(); $("#blockSearchBtn").focus(); }
  else if (e.key === "Enter") { e.preventDefault(); if (btns[bsSel]) pickSearchedBlock(btns[bsSel].dataset.type); }
  else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && btns.length) {
    e.preventDefault(); bsSel = (bsSel + (e.key === "ArrowDown" ? 1 : -1) + btns.length) % btns.length;
    btns.forEach((b, i) => b.classList.toggle("on", i === bsSel)); btns[bsSel].scrollIntoView({ block: "nearest" });
  }
});
bsList.addEventListener("click", e => { const b = e.target.closest("[data-type]"); if (b) pickSearchedBlock(b.dataset.type); });
$("#blockSearchClear").onclick = () => { blockHistory = []; try { localStorage.removeItem("bab-busca"); } catch (_) {} renderBlockSearch(); bsIn.focus(); };
document.addEventListener("pointerdown", e => { if (!bsBox.hidden && !e.target.closest?.("#blockSearch, #blockSearchBtn")) closeBlockSearch(); });
Blockly.ContextMenuRegistry.registry.register({
  id: "bab_exemplo", scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK, weight: -3,
  displayText: () => "Ver explicação e exemplo",
  preconditionFn: scope => DEF[scope.block.type] && !scope.block.isShadow() ? "enabled" : "hidden",
  callback: scope => openBlockGuide(scope.block.type),
});
