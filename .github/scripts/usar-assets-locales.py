from pathlib import Path
import re

# Invitación 1
p1 = Path('invitacion_1.html')
s1 = p1.read_text(encoding='utf-8')

# Dress code: usar el GIF nuevo local en lugar del JPG estático.
s1 = s1.replace('assets/invitacion_1/dresscode_bg_1.jpg', 'assets/invitacion_1/dres_code_movible_1.gif')

# Regalos: reemplazar icono existente por GIF nuevo si existe el bloque gift-icon.
pat = re.compile(r'<div\s+class="gift-icon"[^>]*>.*?</div>', re.S)
replacement = '<img class="gift-mobile-gif" src="assets/invitacion_1/regalo_movible_1%20gif.gif" alt="Detalle de regalo" loading="lazy">'
s1, n_gift = pat.subn(replacement, s1, count=1)

# CSS del GIF de regalos, una sola vez.
marker = 'ASSETS_LOCALES_INVITACION_1_V2'
css = '''\n/* ASSETS_LOCALES_INVITACION_1_V2 */\n.gift-mobile-gif{\n  display:block;\n  width:min(54vw,220px);\n  height:auto;\n  margin:0 auto 18px;\n  object-fit:contain;\n  background:transparent;\n  filter:drop-shadow(0 8px 16px rgba(0,0,0,.08));\n}\n@media(max-width:540px){\n  .gift-mobile-gif{width:min(52vw,190px);}\n}\n'''
if marker not in s1:
    s1 = s1.replace('</style>', css + '\n</style>', 1)

# Ya no hacen falta conexiones a Google/Drive en la invitación 1.
s1 = re.sub(r'\n<link rel="preconnect" href="https://lh3\.googleusercontent\.com"[^>]*>', '', s1)
s1 = re.sub(r'\n<link rel="preconnect" href="https://drive\.google\.com"[^>]*>', '', s1)
s1 = re.sub(r'\n<link rel="dns-prefetch" href="//lh3\.googleusercontent\.com">', '', s1)
s1 = re.sub(r'\n<link rel="dns-prefetch" href="//drive\.google\.com">', '', s1)

p1.write_text(s1, encoding='utf-8')

# Invitación 2: reutilizar las mismas 3 fotos locales ya migradas.
p2 = Path('invitacion_2.html')
s2 = p2.read_text(encoding='utf-8')
ids = [
    ('1ev6oiga4uoc6JmluJrTEATrIHC82LVv7', 'historia_1.jpg'),
    ('1r2i5LNx2A5yd2xFl-_dfEuBhpYgQSPhX', 'historia_2.jpg'),
    ('1eoMeudALM1oexDh-pVRAduFCdcmVZNHX', 'historia_3.jpg'),
]
for gid, fname in ids:
    s2 = s2.replace(f'https://lh3.googleusercontent.com/d/{gid}=w1600', f'assets/invitacion_1/{fname}')
    s2 = re.sub(rf'\s+onerror="[^"]*{re.escape(gid)}[^"]*"', '', s2)

p2.write_text(s2, encoding='utf-8')

# Validaciones estrictas
if 'assets/invitacion_1/dres_code_movible_1.gif' not in s1:
    raise SystemExit('No quedó aplicado el GIF de dress code')
if 'assets/invitacion_1/regalo_movible_1%20gif.gif' not in s1:
    raise SystemExit('No quedó aplicado el GIF de regalos')
if n_gift != 1:
    raise SystemExit(f'No se encontró exactamente un gift-icon para reemplazar: {n_gift}')
for _, fname in ids:
    if f'assets/invitacion_1/{fname}' not in s2:
        raise SystemExit(f'No quedó aplicada {fname} en invitacion_2')
if 'lh3.googleusercontent.com/d/1ev6oiga4uoc6JmluJrTEATrIHC82LVv7' in s2:
    raise SystemExit('Invitación 2 aún conserva foto Google 1')
if 'lh3.googleusercontent.com/d/1r2i5LNx2A5yd2xFl-_dfEuBhpYgQSPhX' in s2:
    raise SystemExit('Invitación 2 aún conserva foto Google 2')
if 'lh3.googleusercontent.com/d/1eoMeudALM1oexDh-pVRAduFCdcmVZNHX' in s2:
    raise SystemExit('Invitación 2 aún conserva foto Google 3')
