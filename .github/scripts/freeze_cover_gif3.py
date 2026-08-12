from PIL import Image
from pathlib import Path
import re

html_path = Path('invitacion_3.html')
gif_path = Path('video_de_entrada_3.gif')
last_path = Path('video_de_entrada_3_final.png')

im = Image.open(gif_path)
total_ms = 0
last = None
for i in range(im.n_frames):
    im.seek(i)
    total_ms += int(im.info.get('duration', 100))
    last = im.convert('RGBA')

if last is None:
    raise SystemExit('GIF sin frames')
last.save(last_path, 'PNG', optimize=True)

html = html_path.read_text(encoding='utf-8')

old_img = '''      <img
        class="animated-cover-video animated-cover-gif"
        id="animatedCoverGif"
        src="https://avaldiviezoch.github.io/Wedding/video_de_entrada_3.gif?v=20260812-1"
        alt="Portada animada de Antonio y Lucero"
        loading="eager"
        decoding="async"
        aria-hidden="true">'''
new_img = '''      <div class="animated-cover-freeze-wrap" id="animatedCoverFreezeWrap" aria-hidden="true">
        <img
          class="animated-cover-video animated-cover-gif"
          id="animatedCoverGif"
          src="https://avaldiviezoch.github.io/Wedding/video_de_entrada_3.gif?v=20260812-2"
          alt="Portada animada de Antonio y Lucero"
          loading="eager"
          decoding="async">
        <img
          class="animated-cover-video animated-cover-final"
          id="animatedCoverFinal"
          src="https://avaldiviezoch.github.io/Wedding/video_de_entrada_3_final.png?v=20260812-2"
          alt=""
          loading="eager"
          decoding="async">
      </div>'''
if old_img not in html:
    raise SystemExit('No se encontró el bloque GIF esperado')
html = html.replace(old_img, new_img, 1)

css_marker = '''    .animated-cover-video {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 941 / 1672;
      object-fit: contain;
      object-position: center;
      background: #fbeed8;
      border: 0;
      box-shadow: none;
      pointer-events: none;
      user-select: none;
    }
'''
css_extra = css_marker + f'''
    .animated-cover-freeze-wrap {{
      position: relative;
      width: 100%;
      line-height: 0;
    }}

    .animated-cover-final {{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      visibility: hidden;
    }}

    .animated-cover-freeze-wrap.is-frozen .animated-cover-gif {{
      opacity: 0;
      visibility: hidden;
    }}

    .animated-cover-freeze-wrap.is-frozen .animated-cover-final {{
      opacity: 1;
      visibility: visible;
    }}
'''
if css_marker not in html:
    raise SystemExit('No se encontró CSS de animated-cover-video')
html = html.replace(css_marker, css_extra, 1)

js = f'''

    /* Portada GIF: reproducir una sola vez y congelar el último frame. */
    (() => {{
      const wrap = document.getElementById('animatedCoverFreezeWrap');
      const gif = document.getElementById('animatedCoverGif');
      const finalFrame = document.getElementById('animatedCoverFinal');
      if (!wrap || !gif || !finalFrame) return;

      const GIF_DURATION_MS = {total_ms};
      let freezeTimer = null;
      let started = false;

      function freezeCoverGif() {{
        if (freezeTimer) clearTimeout(freezeTimer);
        wrap.classList.add('is-frozen');
      }}

      function startCoverGifOnce() {{
        if (started) return;
        started = true;
        wrap.classList.remove('is-frozen');
        const cleanSrc = 'https://avaldiviezoch.github.io/Wedding/video_de_entrada_3.gif';
        gif.src = cleanSrc + '?once=' + Date.now();
        freezeTimer = setTimeout(freezeCoverGif, Math.max(0, GIF_DURATION_MS - 40));
      }}

      const intro = document.getElementById('introScreen');
      if (intro) {{
        const observer = new MutationObserver(() => {{
          if (intro.classList.contains('is-hidden')) startCoverGifOnce();
        }});
        observer.observe(intro, {{ attributes: true, attributeFilter: ['class'] }});
        if (intro.classList.contains('is-hidden')) startCoverGifOnce();
      }} else {{
        startCoverGifOnce();
      }}
    }})();
'''

if 'Portada GIF: reproducir una sola vez y congelar el último frame.' in html:
    raise SystemExit('La lógica de congelado ya existe')
html = html.replace('</body>', js + '\n</body>', 1)
html_path.write_text(html, encoding='utf-8')
print(f'Duración GIF: {total_ms} ms; frames: {im.n_frames}')
