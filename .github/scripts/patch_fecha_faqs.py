from pathlib import Path
import re

# ---------- INVITACION 4: tipografia de fecha ----------
p4 = Path('invitacion_4.html')
s4 = p4.read_text(encoding='utf-8')

# Agregar override al final del style para no alterar otros bloques
css4 = r'''

    /* AJUSTE_PORTADA_FECHA_4 */
    .textos-fecha{
      bottom: 4.8%;
      width: min(84%, 560px);
    }

    .fecha-etiqueta{
      font-family: "Montserrat", sans-serif;
      font-size: clamp(.66rem, 2.35vw, .84rem);
      font-weight: 500;
      letter-spacing: .18em;
      line-height: 1.2;
      color: #46533c;
      text-shadow: 0 1px 4px rgba(244,238,223,.82);
    }

    .fecha{
      margin-top: 9px;
      font-family: "Cormorant Garamond", Georgia, serif;
      font-size: clamp(1.78rem, 7.35vw, 3.05rem);
      font-weight: 600;
      line-height: 1.02;
      letter-spacing: -.018em;
      white-space: nowrap;
      color: #46533c;
      text-shadow:
        0 1px 0 rgba(255,255,255,.42),
        0 2px 7px rgba(244,238,223,.72);
    }

    @media(max-width:420px){
      .textos-fecha{ bottom: 4.5%; width: 86%; }
      .fecha{ font-size: clamp(1.72rem, 7.2vw, 2.2rem); }
      .fecha-etiqueta{ letter-spacing: .16em; }
    }
'''
if 'AJUSTE_PORTADA_FECHA_4' not in s4:
    s4 = s4.replace('</style>', css4 + '\n  </style>', 1)
p4.write_text(s4, encoding='utf-8')

# ---------- INVITACION 1 ----------
p1 = Path('invitacion_1.html')
s1 = p1.read_text(encoding='utf-8')
faq1 = '''<div class="faq-one-list">
      <details class="faq-one-item">
        <summary>¿La ceremonia y la recepción son en el mismo lugar?</summary>
        <div class="faq-one-answer">Sí. Ambas se realizarán en Casa Acapulco, por lo que no será necesario trasladarse a otro lugar.</div>
      </details>
      <details class="faq-one-item">
        <summary>¿Hasta cuándo puedo confirmar mi asistencia?</summary>
        <div class="faq-one-answer">Por favor, confirma tu asistencia hasta el 15 de noviembre de 2026.</div>
      </details>
      <details class="faq-one-item">
        <summary>¿Hay estacionamiento?</summary>
        <div class="faq-one-answer">Cerca de la zona hay algunos estacionamientos. Como tendremos bebidas durante la celebración, recomendamos llegar en taxi o aplicativo.</div>
      </details>
      <details class="faq-one-item">
        <summary>¿Podemos llevar un regalo?</summary>
        <div class="faq-one-answer">Sí. Podremos recibir regalos físicos durante la recepción y también encontrarás opciones de Yape o transferencia en la sección de regalos.</div>
      </details>
      <details class="faq-one-item">
        <summary>¿Podemos solicitar canciones durante la fiesta?</summary>
        <div class="faq-one-answer">Las sugerencias se recibirán mediante el formulario antes de la boda. Durante la celebración, el DJ no recibirá pedidos en vivo.</div>
      </details>
    </div>'''
s1, c1 = re.subn(r'<div class="faq-one-list">.*?</div>\s*<div class="faq-one-contact">', faq1 + '\n    <div class="faq-one-contact">', s1, count=1, flags=re.S)
if c1 != 1:
    raise SystemExit('No se pudo actualizar FAQ invitacion 1')
p1.write_text(s1, encoding='utf-8')

# ---------- INVITACION 2 ----------
p2 = Path('invitacion_2.html')
s2 = p2.read_text(encoding='utf-8')
faq2 = '''<div class="faq-accordion">
            <details class="faq-item">
              <summary>¿La ceremonia y la recepción son en el mismo lugar?</summary>
              <div class="faq-answer">Sí. Ambas se realizarán en Casa Acapulco, por lo que no será necesario trasladarse a otro lugar.</div>
            </details>
            <details class="faq-item">
              <summary>¿Hasta cuándo puedo confirmar mi asistencia?</summary>
              <div class="faq-answer">Por favor, confirma tu asistencia hasta el 15 de noviembre de 2026.</div>
            </details>
            <details class="faq-item">
              <summary>¿Hay estacionamiento?</summary>
              <div class="faq-answer">Cerca de la zona hay algunos estacionamientos. Como tendremos bebidas durante la celebración, recomendamos llegar en taxi o aplicativo.</div>
            </details>
            <details class="faq-item">
              <summary>¿Podemos llevar un regalo?</summary>
              <div class="faq-answer">Sí. Podremos recibir regalos físicos durante la recepción y también encontrarás opciones de Yape o transferencia en la sección de regalos.</div>
            </details>
            <details class="faq-item">
              <summary>¿Podemos solicitar canciones durante la fiesta?</summary>
              <div class="faq-answer">Las sugerencias se recibirán mediante el formulario antes de la boda. Durante la celebración, el DJ no recibirá pedidos en vivo.</div>
            </details>
          </div>'''
s2, c2 = re.subn(r'<div class="faq-accordion">.*?</div>\s*<div class="question-contact">', faq2 + '\n\n          <div class="question-contact">', s2, count=1, flags=re.S)
if c2 != 1:
    raise SystemExit('No se pudo actualizar FAQ invitacion 2')
p2.write_text(s2, encoding='utf-8')

# ---------- INVITACION 3 ----------
p3 = Path('invitacion_3.html')
s3 = p3.read_text(encoding='utf-8')
faq3 = '''<div class="faq">
        <details>
          <summary>¿La ceremonia y la recepción son en el mismo lugar?</summary>
          <div class="faq-answer">Sí. Ambas se realizarán en Casa Acapulco.</div>
          <div class="faq-illustration">
            <img src="pic_preguntas_3_1.png" onerror="this.classList.add('media-error')" alt="Ilustración para la primera pregunta" loading="lazy" />
          </div>
        </details>
        <details>
          <summary>¿Hasta cuándo puedo confirmar mi asistencia?</summary>
          <div class="faq-answer">Por favor, confirma tu asistencia hasta el 15 de noviembre de 2026.</div>
          <div class="faq-illustration">
            <img src="pic_preguntas_3_2.png" onerror="this.classList.add('media-error')" alt="Ilustración para la segunda pregunta" loading="lazy" />
          </div>
        </details>
        <details>
          <summary>¿Hay estacionamiento?</summary>
          <div class="faq-answer">Cerca de la zona hay algunos estacionamientos. Como tendremos bebidas durante la celebración, recomendamos llegar en taxi o aplicativo.</div>
          <div class="faq-illustration">
            <img src="pic_preguntas_3_3.png" onerror="this.classList.add('media-error')" alt="Ilustración para la tercera pregunta" loading="lazy" />
          </div>
        </details>
        <details>
          <summary>¿Podemos llevar un regalo?</summary>
          <div class="faq-answer">Sí. Podremos recibir regalos físicos durante la recepción y también encontrarás opciones de Yape o transferencia en la sección de regalos.</div>
        </details>
        <details>
          <summary>¿Podemos solicitar canciones durante la fiesta?</summary>
          <div class="faq-answer">Las sugerencias se recibirán mediante el formulario antes de la boda. Durante la celebración, el DJ no recibirá pedidos en vivo.</div>
        </details>
      </div>'''
s3, c3 = re.subn(r'<div class="faq">.*?</div>\s*<a class="pill-btn green"', faq3 + '\n\n      <a class="pill-btn green"', s3, count=1, flags=re.S)
if c3 != 1:
    raise SystemExit('No se pudo actualizar FAQ invitacion 3')
p3.write_text(s3, encoding='utf-8')

# Validacion rapida
for path in [p1,p2,p3]:
    txt = path.read_text(encoding='utf-8')
    required = [
        '¿La ceremonia y la recepción son en el mismo lugar?',
        '¿Hasta cuándo puedo confirmar mi asistencia?',
        '¿Hay estacionamiento?',
        '¿Podemos llevar un regalo?',
        '¿Podemos solicitar canciones durante la fiesta?'
    ]
    missing = [q for q in required if q not in txt]
    if missing:
        raise SystemExit(f'{path}: faltan preguntas {missing}')

print('OK: fecha invitacion 4 y FAQ 1/2/3 actualizadas')
