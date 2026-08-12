from pathlib import Path
import re

p = Path("invitacion_4.html")
s = p.read_text(encoding="utf-8")

s, n_icon = re.subn(
    r'\s*<div class="icono-calendario"[^>]*>.*?</div>\s*',
    '\n',
    s,
    count=1,
    flags=re.S
)
if n_icon != 1:
    raise SystemExit(f"No se pudo quitar icono calendario: {n_icon}")

m = re.search(
    r'(?P<article><article class="bloque-invitacion cierre-invitacion" id="cierre">.*?)(?P<close>\s*</article>)'
    r'(?P<middle>.*?</main>\s*)'
    r'(?P<footer><footer class="creditos-finales"[^>]*>.*?</footer>)',
    s,
    flags=re.S
)
if not m:
    raise SystemExit("No se encontró la estructura cierre + footer")

footer = m.group("footer")
footer_inner = re.sub(r'^<footer class="creditos-finales"[^>]*>|</footer>$', '', footer.strip(), flags=re.S)
integrated = '\n          <div class="creditos-finales creditos-integrados" aria-label="Créditos">\n' + footer_inner.strip() + '\n          </div>\n'
replacement = m.group("article") + integrated + m.group("close") + m.group("middle")
s = s[:m.start()] + replacement + s[m.end():]

css = '''
    /* ===== CREDITOS INTEGRADOS Y FECHA SIN ICONO — INVITACION 4 ===== */
    .textos-fecha{
      bottom:1.15% !important;
      width:min(82%,520px) !important;
    }
    .icono-calendario{display:none !important;}
    .fecha-etiqueta{
      margin:0 0 4px !important;
      font-size:clamp(.58rem,2.25vw,.78rem) !important;
      letter-spacing:.14em !important;
      line-height:1.2 !important;
    }
    .fecha{
      margin-top:3px !important;
      font-size:clamp(1.52rem,6.1vw,2.65rem) !important;
      line-height:1 !important;
      white-space:nowrap !important;
    }
    .cierre-invitacion{
      padding-bottom:24px !important;
    }
    .creditos-integrados{
      margin:30px auto 0 !important;
      padding:12px 12px 2px !important;
      background:transparent !important;
      min-height:0 !important;
      width:100% !important;
    }
    .creditos-integrados .creditos-texto{
      margin:0 !important;
      font-size:6px !important;
      line-height:1.25 !important;
      letter-spacing:.045em !important;
      opacity:.48 !important;
      color:var(--verde-suave) !important;
      text-transform:uppercase !important;
    }
    @media(max-width:520px){
      .textos-fecha{bottom:.9% !important;width:84% !important;}
      .fecha-etiqueta{font-size:.56rem !important;}
      .fecha{font-size:clamp(1.42rem,5.9vw,1.9rem) !important;}
      .cierre-invitacion{padding-bottom:18px !important;}
      .creditos-integrados{margin-top:22px !important;padding:8px 10px 0 !important;}
      .creditos-integrados .creditos-texto{font-size:5.5px !important;}
    }
'''
marker = "CREDITOS INTEGRADOS Y FECHA SIN ICONO — INVITACION 4"
if marker not in s:
    s = s.replace("</style>", css + "\n  </style>", 1)

p.write_text(s, encoding="utf-8")
