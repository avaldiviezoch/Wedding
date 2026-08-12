from pathlib import Path
import re

p = Path('invitacion_3.html')
s = p.read_text(encoding='utf-8')

# Reemplazar solamente la portada animada posterior al video de saludo.
pattern = re.compile(r'''\s*<video\s+class="animated-cover-video"\s+id="animatedCoverVideo".*?</video>''', re.S)
replacement = '''
      <img
        class="animated-cover-video animated-cover-gif"
        id="animatedCoverGif"
        src="https://avaldiviezoch.github.io/Wedding/video_de_entrada_3.gif?v=20260812-1"
        alt="Portada animada de Antonio y Lucero"
        loading="eager"
        decoding="async"
        aria-hidden="true">
'''
s, n = pattern.subn(replacement, s, count=1)
if n != 1:
    raise SystemExit(f'No se encontró exactamente una portada de video para reemplazar: {n}')

# Actualizar comentario para que el código documente el recurso real.
s = s.replace(
    'PORTADA ANIMADA: ant_y_lu_3.mp4\n       El video original dura 3 segundos. JavaScript lo reproduce\n       a 0.22x, por lo que cada vuelta dura aproximadamente 13.6 s.',
    'PORTADA ANIMADA: video_de_entrada_3.gif\n       GIF animado mostrado inmediatamente después del video de saludo.'
)

# La constante anterior deja de ser necesaria; la sustituimos por la URL real del GIF
# para que no quede una referencia activa a ant_y_lu_3.mp4 en esta portada.
s = s.replace(
    'const ANIMATED_COVER_VIDEO_URL = `${MEDIA_BASE_URL}ant_y_lu_3.mp4?v=20260809-1`;',
    'const ANIMATED_COVER_GIF_URL = `${MEDIA_BASE_URL}video_de_entrada_3.gif?v=20260812-1`;'
)

# La lógica de vídeo ya no debe ejecutarse. Como el id animatedCoverVideo desaparece,
# todos los bloques existentes quedan inactivos sin afectar el resto de la invitación.
# Añadimos una pequeña regla específica para asegurar que el GIF se comporte como portada.
css = '''

    /* ===== PORTADA GIF INVITACION 3 ===== */
    .animated-cover-gif{
      display:block;
      width:100%;
      height:100%;
      min-height:100svh;
      object-fit:cover;
      object-position:center;
      background:#fbeed8;
    }
'''
marker = 'PORTADA GIF INVITACION 3'
if marker not in s:
    s = s.replace('</style>', css + '\n  </style>', 1)

# Validaciones locales antes de escribir.
assert 'video_de_entrada_3.gif?v=20260812-1' in s
assert 'id="animatedCoverGif"' in s
assert '<video\n        class="animated-cover-video"\n        id="animatedCoverVideo"' not in s

p.write_text(s, encoding='utf-8')
