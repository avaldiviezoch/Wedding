from pathlib import Path

p = Path('invitacion_3.html')
s = p.read_text(encoding='utf-8')

old_title = '<h2 class="section-title">Presentes</h2>'
new_title = '<h2 class="section-title">¿Quieres dejarnos un detalle?</h2>'
if old_title not in s:
    raise SystemExit('No se encontró el título actual de Presentes.')
s = s.replace(old_title, new_title, 1)

old_text = '''<p class="gift-envelope-text">
            Aceptamos abrazos, buenos deseos y regalos en la recepción.
            Y para quienes no quieran cargar paquetes, nuestro número de cuenta
            y Yape estará feliz de recibirlos.
          </p>'''
new_text = '''<p class="gift-envelope-text">
            Lo más importante para nosotros es compartir este día contigo.
            Si deseas tener un detalle con nosotros, lo recibiremos con muchísimo cariño.
            Puedes hacerlo mediante Yape o transferencia bancaria; y si prefieres un regalo físico,
            también podremos recibirlo en la recepción el día de la boda.
          </p>'''
if old_text not in s:
    raise SystemExit('No se encontró el texto actual de Presentes.')
s = s.replace(old_text, new_text, 1)

p.write_text(s, encoding='utf-8')
