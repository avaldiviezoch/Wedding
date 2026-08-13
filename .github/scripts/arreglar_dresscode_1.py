from pathlib import Path
import re

p = Path('invitacion_1.html')
s = p.read_text(encoding='utf-8')

# 1. Restaurar la imagen base original del Dress Code si fue sustituida por el GIF.
s = s.replace('assets/invitacion_1/dres_code_movible_1.gif', 'assets/invitacion_1/dresscode_bg_1.jpg')

# 2. Evitar duplicados de una ejecución anterior.
s = re.sub(r'\s*<img[^>]+class=["\']dresscode-motion-gif["\'][^>]*>\s*', '\n', s, flags=re.I)

# 3. Insertar el GIF justo después del elemento que contiene el texto Formal dentro del bloque Dress Code.
block = re.search(r'(<div class=["\']dresscode-bg-content["\'][^>]*>)(.*?)(</div>\s*</div>\s*</section>)', s, flags=re.S|re.I)
if not block:
    raise SystemExit('No se encontro dresscode-bg-content')

inner = block.group(2)
formal = re.search(r'(<(?:h1|h2|h3|p|div|span)[^>]*>[^<]*Formal[^<]*</(?:h1|h2|h3|p|div|span)>)', inner, flags=re.I)
if not formal:
    raise SystemExit('No se encontro el texto Formal dentro de Dress Code')

gif = '\n      <img class="dresscode-motion-gif" src="assets/invitacion_1/dres_code_movible_1.gif" alt="Ilustración animada del código de vestimenta">\n'
inner = inner[:formal.end()] + gif + inner[formal.end():]
s = s[:block.start(2)] + inner + s[block.end(2):]

# 4. CSS específico, sin alterar la composición base.
marker = 'AJUSTE_GIF_DRESSCODE_1'
css = '''\n/* AJUSTE_GIF_DRESSCODE_1 */\n.dresscode-motion-gif{\n  display:block;\n  width:min(54%, 250px);\n  height:auto;\n  margin:14px auto 18px;\n  object-fit:contain;\n  background:transparent;\n}\n@media(max-width:520px){\n  .dresscode-motion-gif{\n    width:min(58%, 220px);\n    margin:12px auto 16px;\n  }\n}\n'''
if marker not in s:
    s = s.replace('</style>', css + '\n</style>', 1)

p.write_text(s, encoding='utf-8')
