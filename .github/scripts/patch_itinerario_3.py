from pathlib import Path
import re

p = Path("invitacion_3.html")
s = p.read_text(encoding="utf-8")
marker = "ITINERARIO_COMPLETO_INVITACION_3_V2"
if marker in s:
    raise SystemExit("El ajuste ya existe.")

new_content = '''<div class="program-table-content" aria-label="Horario del evento">
          <div class="program-table-row">
            <time class="program-table-time" datetime="2027-01-16T15:00:00-05:00">3:00 – 4:00 p. m.</time>
            <div class="program-table-marker" aria-hidden="true">•</div>
            <div class="program-table-event"><strong>Recepción de invitados</strong></div>
          </div>
          <div class="program-table-row">
            <time class="program-table-time" datetime="2027-01-16T16:00:00-05:00">4:00 – 5:00 p. m.</time>
            <div class="program-table-marker" aria-hidden="true">•</div>
            <div class="program-table-event"><strong>Ceremonia</strong></div>
          </div>
          <div class="program-table-row">
            <time class="program-table-time" datetime="2027-01-16T17:00:00-05:00">5:00 – 6:00 p. m.</time>
            <div class="program-table-marker" aria-hidden="true">•</div>
            <div class="program-table-event"><strong>Fotos</strong></div>
          </div>
          <div class="program-table-row">
            <time class="program-table-time" datetime="2027-01-16T18:00:00-05:00">6:00 – 6:30 p. m.</time>
            <div class="program-table-marker" aria-hidden="true">•</div>
            <div class="program-table-event"><strong>Brindis</strong></div>
          </div>
          <div class="program-table-row">
            <time class="program-table-time" datetime="2027-01-16T18:30:00-05:00">6:30 – 7:30 p. m.</time>
            <div class="program-table-marker" aria-hidden="true">•</div>
            <div class="program-table-event"><strong>Maridaje &amp; Banquete</strong></div>
          </div>
          <div class="program-table-row">
            <time class="program-table-time" datetime="2027-01-16T19:30:00-05:00">7:30 – 8:00 p. m.</time>
            <div class="program-table-marker" aria-hidden="true">•</div>
            <div class="program-table-event"><strong>Primer baile de novios</strong></div>
          </div>
          <div class="program-table-row">
            <time class="program-table-time" datetime="2027-01-16T20:00:00-05:00">8:00 p. m. en adelante</time>
            <div class="program-table-marker" aria-hidden="true">•</div>
            <div class="program-table-event"><strong>Fiesta</strong></div>
          </div>
        </div>'''

pattern = re.compile(r'<div class="program-table-content" aria-label="Horario del evento">.*?</div>\s*</div>\s*</section>', re.S)
m = pattern.search(s)
if not m:
    raise SystemExit("No se encontró el bloque de programación.")
replacement = new_content + "\n      </div>\n    </section>"
s = s[:m.start()] + replacement + s[m.end():]

css = '''
/* ITINERARIO_COMPLETO_INVITACION_3_V2 */
.program-table-content::before{top:20.2% !important;bottom:19.2% !important;}
.program-table-row{left:20.5% !important;width:59% !important;min-height:0 !important;transform:translateY(calc(-50% + 12px));}
.program-table-row:nth-child(1){top:24.0% !important;}
.program-table-row:nth-child(2){top:33.0% !important;}
.program-table-row:nth-child(3){top:42.0% !important;}
.program-table-row:nth-child(4){top:51.0% !important;}
.program-table-row:nth-child(5){top:60.0% !important;}
.program-table-row:nth-child(6){top:69.0% !important;}
.program-table-row:nth-child(7){top:78.0% !important;}
.program-table-marker{width:14px !important;height:14px !important;margin:0 auto 1px !important;border-width:1px !important;font-size:0 !important;box-shadow:0 0 0 2px rgba(251,238,216,.55) !important;}
.program-table-marker::after{content:"";width:4px;height:4px;border-radius:50%;background:#e95f64;}
.program-table-time{margin:0 0 1px !important;font-size:clamp(12px,3.15vw,17px) !important;line-height:1 !important;}
.program-table-event strong{margin:0 !important;padding:0 3px !important;font-size:clamp(13px,3.35vw,18px) !important;line-height:1.03 !important;}
.program-table-event span{display:none !important;}
.program-table-section.is-visible .program-table-row:nth-child(5){animation-delay:.82s;}
.program-table-section.is-visible .program-table-row:nth-child(6){animation-delay:.94s;}
.program-table-section.is-visible .program-table-row:nth-child(7){animation-delay:1.06s;}
@keyframes programRowIn{to{opacity:1;transform:translateY(-50%);}}
@media(max-width:520px){
  .program-table-row{left:19.5% !important;width:61% !important;}
  .program-table-time{font-size:clamp(11px,3.05vw,15px) !important;}
  .program-table-event strong{font-size:clamp(12px,3.3vw,16px) !important;}
  .program-table-marker{width:12px !important;height:12px !important;}
}
'''
idx = s.rfind("</style>")
if idx == -1:
    raise SystemExit("No se encontró </style>.")
s = s[:idx] + css + "\n" + s[idx:]
p.write_text(s, encoding="utf-8")
