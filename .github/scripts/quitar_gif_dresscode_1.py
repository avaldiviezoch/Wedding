from pathlib import Path
import re

p = Path('invitacion_1.html')
s = p.read_text(encoding='utf-8')

# Quitar exclusivamente el GIF adicional del Dress Code.
s, n = re.subn(
    r'\s*<img\s+class="dresscode-motion-gif"\s+src="assets/invitacion_1/dres_code_movible_1\.gif"\s+alt="[^"]*"\s*>\s*',
    '\n',
    s,
    count=1
)
if n != 1:
    raise SystemExit(f'No se encontró exactamente un GIF adicional de Dress Code: {n}')

# Asegurar que la base original/local siga siendo la utilizada.
if 'src="assets/invitacion_1/dresscode_bg_1.jpg"' not in s:
    raise SystemExit('No se encontró dresscode_bg_1.jpg como base local')

# Limpiar CSS específico del GIF adicional si existe.
s = re.sub(r'\n?\s*\.dresscode-motion-gif\s*\{.*?\}\s*', '\n', s, flags=re.S)
s = re.sub(r'\n?\s*@media\s*\(max-width:\s*520px\)\s*\{\s*\.dresscode-motion-gif\s*\{.*?\}\s*\}\s*', '\n', s, flags=re.S)

p.write_text(s, encoding='utf-8')
