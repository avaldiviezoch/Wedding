from pathlib import Path

p = Path('invitacion_4.html')
s = p.read_text(encoding='utf-8')

old = '''          <p class="texto-adicional">
            Aceptamos abrazos, buenos deseos y regalos en la recepción. Para quienes
            prefieran no llevar paquetes, también dejamos una opción por Yape.
          </p>'''
new = '''          <p class="texto-adicional">
            Lo más importante para nosotros es compartir este día contigo. Si deseas tener un detalle,
            lo recibiremos con muchísimo cariño. Puedes hacerlo mediante Yape o transferencia bancaria;
            y si prefieres un regalo físico, también podremos recibirlo en la recepción el día de la boda.
          </p>'''
if old not in s:
    raise SystemExit('No se encontró el texto descriptivo de regalos')
s = s.replace(old, new, 1)

if '.creditos-finales{' not in s:
    css = '''
    .creditos-finales{
      padding: 12px 20px 42px;
      text-align: center;
      color: var(--verde-suave);
      background: var(--crema);
    }

    .creditos-brook{
      width: 70px;
      height: auto;
      display: block;
      margin: 0 auto 14px;
      object-fit: contain;
      filter: drop-shadow(0 3px 8px rgba(70,83,60,.10));
    }

    .creditos-texto{
      margin: 0;
      font-size: .68rem;
      line-height: 1.7;
      letter-spacing: .08em;
      text-transform: uppercase;
      opacity: .82;
    }
'''
    marker = '  </style>'
    if marker not in s:
        raise SystemExit('No se encontró el cierre de style')
    s = s.replace(marker, css + '\n' + marker, 1)

if 'aria-label="Créditos"' not in s:
    footer = '''  <footer class="creditos-finales" aria-label="Créditos">
    <img
      class="creditos-brook"
      src="https://raw.githubusercontent.com/avaldiviezoch/Wedding/main/brook.gif"
      alt="Detalle inspirado en One Piece"
      loading="lazy"
    />
    <p class="creditos-texto">Créditos: Antonio Valdiviezo © Derechos reservados</p>
  </footer>

'''
    marker = '  <script>'
    if marker not in s:
        raise SystemExit('No se encontró el inicio del script')
    s = s.replace(marker, footer + marker, 1)

p.write_text(s, encoding='utf-8')
print('Invitación 4 finalizada')
