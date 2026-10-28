// =====================================================================
// Janela “Trabalhar junto”: criar sala, entrar com código, sair
// =====================================================================
const SITE_URL = "https://gael-afk0713.github.io/bloco-a-bloco/";
const roomLink = code => location.origin + location.pathname + "?sala=" + encodeURIComponent(code);
function goRoom(code) { location.href = code ? roomLink(code) : location.origin + location.pathname; }
function openRoomBox(prefill) {
  if (IN_CLAUDE) {
    modal(`<h2>👥 Trabalhar junto</h2>
      <p style="margin:0">Aqui dentro do Claude, compartilhe este artefato e dê acesso de <strong>Colaborador</strong>: cada pessoa aparece com nome e cursor.</p>
      <p style="margin:0">Para colegas <strong>sem conta</strong>, abra o site do Bloco a Bloco e use “Trabalhar junto” lá: é só combinar um código de sala.</p>
      <p style="margin:0"><a href="${SITE_URL}" target="_blank" rel="noopener">${SITE_URL}</a></p>
      <div class="row"><button class="btn primary" data-close>Entendi</button></div>`);
    return;
  }
  const code = db?.net ? db.code : "";
  if (code) {
    const names = peers.filter(p => p.kind === "viewer").map(p => p.isMe ? "Você" : (p.presence?.name || "Colega"));
    modal(`<h2>👥 Você está na sala</h2>
      <div class="room-code" aria-label="Código da sala">${esc(code)}</div>
      <p style="margin:0">Diga este código para os colegas. Eles abrem o Bloco a Bloco, clicam em “Trabalhar junto” e digitam o código. Ou mande o link:</p>
      <div class="row"><input type="text" readonly value="${esc(roomLink(code))}" id="rmLink" style="flex:1;min-width:0"><button class="btn small" id="rmCopy">Copiar link</button></div>
      <p class="muted" style="margin:0">Agora na sala: ${esc(names.join(", ") || "só você")}.</p>
      <p class="muted" style="margin:0">Sair da sala volta para o seu projeto pessoal. A sala continua guardada: dá para voltar depois com o mesmo código.</p>
      <div class="row"><button class="btn primary" data-close>Continuar na sala</button><button class="btn" id="rmLeave">Sair da sala</button></div>`, m => {
      $("#rmCopy").onclick = async () => { try { await navigator.clipboard.writeText($("#rmLink").value); $("#rmCopy").textContent = "Copiado!"; } catch (_) { $("#rmLink").select(); } };
      $("#rmLeave").onclick = () => { try { localStorage.removeItem("bab-sala"); } catch (_) {} goRoom(""); };
    });
    return;
  }
  modal(`<h2>👥 Trabalhar junto</h2>
    <p style="margin:0">Todo mundo que usar o mesmo código entra no mesmo projeto e vê as mudanças na hora, com o nome de cada um. Não precisa de conta.</p>
    <label class="label" for="rmName">Seu nome (aparece para os colegas)</label>
    <input type="text" id="rmName" maxlength="24" placeholder="Escreva seu nome" value="${esc(myName())}">
    <div class="room-grid">
      <div><strong>Entrar numa sala</strong><span class="muted" style="font-size:.85rem">Um colega já criou e te passou o código.</span>
        <input type="text" id="rmCode" maxlength="16" placeholder="Ex.: GATO-4821" value="${esc(prefill || "")}" autocomplete="off" style="text-transform:uppercase">
        <button class="btn primary" id="rmJoin">Entrar</button></div>
      <div><strong>Criar uma sala nova</strong><span class="muted" style="font-size:.85rem">Você recebe um código para passar aos colegas.</span>
        <label class="row" style="font-size:.88rem"><input type="checkbox" id="rmBring" checked> Levar o projeto que está aberto</label>
        <button class="btn" id="rmCreate">Criar sala</button></div>
    </div>
    <p class="muted" style="margin:0;font-size:.8rem">O projeto da sala passa por um servidor público gratuito, cifrado com o código. Não escreva dados pessoais nos projetos. Precisa de internet.</p>
    <p class="muted" id="rmErr" style="margin:0;color:var(--danger)"></p>
    <div class="row"><button class="btn" data-close>Cancelar</button></div>`, () => {
    const err = t => { $("#rmErr").textContent = t; };
    const name = () => { const n = $("#rmName").value.trim(); if (!n) { err("Escreva o seu nome primeiro."); $("#rmName").focus(); return null; } try { localStorage.setItem("bab-nome", n); } catch (_) {} return n; };
    $("#rmJoin").onclick = () => {
      if (!name()) return;
      const c = normCode($("#rmCode").value);
      if (!validCode(c)) { err("O código tem uma palavra, um tracinho e 4 números. Ex.: GATO-4821"); $("#rmCode").focus(); return; }
      try { localStorage.setItem("bab-sala", c); } catch (_) {}
      goRoom(c);
    };
    $("#rmCode").addEventListener("keydown", e => { if (e.key === "Enter") $("#rmJoin").click(); });
    $("#rmCreate").onclick = () => {
      if (!name()) return;
      const c = newRoomCode();
      try {
        if ($("#rmBring").checked) { if (curSid) diffWorkspace(); localStorage.setItem("bab-sala-" + c, JSON.stringify(db?._all?.() || {})); }
        localStorage.setItem("bab-sala", c);
      } catch (_) { err("O navegador não tem espaço para copiar este projeto. Desmarque “Levar o projeto” ou apague imagens grandes."); return; }
      goRoom(c);
    };
    setTimeout(() => (myName() ? $("#rmCode") : $("#rmName")).focus(), 30);
  });
}
$("#roomBtn").onclick = () => openRoomBox();
if (pendingRoom) setTimeout(() => openRoomBox(pendingRoom), 400);
