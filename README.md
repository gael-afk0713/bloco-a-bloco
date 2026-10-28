# Bloco a Bloco

Um estúdio de jogos e animações por blocos, em português, inspirado no Scratch. Feito para aprender a programar de um jeito ainda mais simples e para várias pessoas criarem juntas.

**Abrir:** a página publicada pelo GitHub Pages deste repositório (Settings → Pages).

## O que dá para fazer

- **Todos os blocos do Scratch 3:** Movimento, Aparência, Som, Eventos, Controle, Sensores, Operadores, Variáveis, Listas, Meus Blocos (com entradas e “rodar sem atualizar a tela”) e Caneta, mais Música e Fala.
- **Extras para jogos (Jogo+):** gravidade e velocidade, “mover com física, parando em…”, “no chão?”, salvar recorde, escrever texto no palco e console de depuração. Também tem “enquanto”, “para cada”, “quando a tecla for solta”, potência, maior/menor.
- **Atores e cenários:** biblioteca própria, editor de pintura (pincel, formas, balde, texto) e envio de imagens. Sons: efeitos sintetizados, gravar pelo microfone ou enviar mp3/wav.
- **Importar projetos do Scratch (.sb3):** blocos, fantasias, sons, variáveis, listas, mensagens e blocos personalizados.
- **Salvar e abrir** projetos no computador (.json).
- **Python e Portugol:** a aba “Python / Portugol” mostra os seus blocos escritos como código de verdade, com a opção de explicar cada linha e um guia que liga cada bloco ao código.
- **Descrições:** cada bloco da paleta mostra embaixo o que ele faz; ao clicar num bloco aparece uma explicação com exemplo.
- **Aprender:** modo iniciante, explicação em português de cada bloco enquanto roda (modos “Devagar” e “Passo a passo”), clicar num script para rodar só ele, clicar num bloco de valor para ver o resultado e 10 lições com conferência automática.
- **Jogar:** tela cheia, modo jogador e turbo.

## Edição em equipe e tutor

No site (GitHub Pages), cada pessoa trabalha no seu navegador, e o projeto fica salvo nele. Para mudar de computador, use “Salvar no computador” e “Abrir”.

A edição em tempo real com várias pessoas, a conversa da equipe e o tutor funcionam quando o Bloco a Bloco é aberto como artefato no Claude e compartilhado com a equipe (acesso de Colaborador). Como num documento compartilhado, cada pessoa aparece com nome e cor: o cursor dela anda pela área de código e uma etiqueta mostra o bloco que ela está editando.

## Como o código está organizado

O programa é uma página só, montada a partir de `src/`:

| Arquivo | Conteúdo |
|---|---|
| `src/00-head.html` | Estilos e estrutura da página |
| `src/10-core.js` | Utilidades, biblioteca de imagens, sons, música, fala |
| `src/20-model.js` | Banco de dados (local ou compartilhado) e modelo do projeto |
| `src/30-blocks.js` | Catálogo de blocos, Meus Blocos, caixa de ferramentas |
| `src/35-help-texts.js` | Explicações e exemplos de cada bloco |
| `src/40-sync.js` | Sincronização dos scripts, clicar para rodar, criador de blocos |
| `src/50-runtime.js`, `src/55-exec.js` | Motor de execução (30 quadros/s, threads cooperativas), colisão e efeitos |
| `src/60-stage.js` | Palco, mostradores, atores, fantasias e sons |
| `src/70-files.js` | Janelas, pintura, salvar/abrir e importação de .sb3 |
| `src/80-help.js` | Lições, tutor, conversa, console, cursores da equipe e inicialização |
| `src/85-code.js` | Conversão dos blocos para Python e Portugol |

Para gerar `index.html` (site) e `claude.html` (artefato do Claude):

```bash
python build.py
```

O editor de blocos usa o [Blockly](https://github.com/google/blockly) (licença Apache 2.0), carregado de um CDN. O motor, os desenhos e os sons foram feitos para este projeto. Scratch é um projeto do Scratch Foundation; o Bloco a Bloco não é afiliado a ele.
