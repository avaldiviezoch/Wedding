import base64, re
from pathlib import Path
from io import BytesIO
from PIL import Image

html = Path('invitaciones/invitacion_1/invitacion_1.html').read_text(encoding='utf-8')
pattern = re.compile(r'<img\s+src="data:image/webp;base64,([A-Za-z0-9+/=]+)"\s+class="church-green-img">', re.S)
m = pattern.search(html)
if not m:
    raise SystemExit('church-green-img embedded webp not found')
raw = base64.b64decode(m.group(1))
img = Image.open(BytesIO(raw)).convert('RGBA')
out = Path('invitaciones/invitacion_1/assets/invitacion_1/fondo_ubicacion_1.png')
out.parent.mkdir(parents=True, exist_ok=True)
img.save(out, 'PNG')
print(out, img.size)
