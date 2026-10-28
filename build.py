"""Monta o Bloco a Bloco a partir de src/.

Gera:
  index.html    versão para qualquer site (GitHub Pages)
  claude.html   versão para publicar como artefato no Claude (sem <!doctype>, o Claude adiciona)
Uso: python -I build.py
"""
import os

here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, "src")
files = sorted(os.listdir(src))
head = open(os.path.join(src, "00-head.html"), encoding="utf-8").read()
js = "\n".join(open(os.path.join(src, f), encoding="utf-8").read() for f in files if f.endswith(".js"))
page = head + "\n<script>\n(() => {\n" + js + "\n})();\n</script>\n"
open(os.path.join(here, "claude.html"), "w", encoding="utf-8").write(page)

site = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="description" content="Bloco a Bloco: crie jogos e animações com blocos, em português.">\n'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
        '</head>\n<body>\n' + page + '</body>\n</html>\n')
open(os.path.join(here, "index.html"), "w", encoding="utf-8").write(site)
open(os.path.join(here, "_check.js"), "w", encoding="utf-8").write(js)
print("ok", len(page) // 1024, "KB")
