from pathlib import Path
import base64
import json

VERSION = '20260814-1205-rsvp1'

# 1) Cargar el controlador modular RSVP en app_integral y en el enlace oficial.
for path in [Path('app_integral/applu.html'), Path('applu.html')]:
    text = path.read_text(encoding='utf-8')
    script = f'  <script type="module" src="js/modules/invitados/index.js?v={VERSION}"></script>'
    if script not in text:
        marker = '  <script type="module" src="js/services/firebase.js?v=20260814-1136-collab1"></script>'
        if marker not in text:
            raise RuntimeError(f'No se encontró el script Firebase en {path}')
        text = text.replace(marker, marker + '\n' + script, 1)
    path.write_text(text, encoding='utf-8')

# 2) Agregar un receptor dentro del IIFE real de Invitados para aplicar
#    cambios RSVP al estado en memoria sin recargar el iframe.
legacy_path = Path('app_integral/js/legacy/applu-script-01.js')
legacy = legacy_path.read_text(encoding='utf-8', errors='strict')
prefix = 'const MODULES = '
start = legacy.find(prefix)
if start < 0:
    raise RuntimeError('No se encontró const MODULES')
json_start = start + len(prefix)
json_end = legacy.find(';\n', json_start)
if json_end < 0:
    json_end = legacy.find(';\r\n', json_start)
if json_end < 0:
    raise RuntimeError('No se encontró el final de MODULES')
modules = json.loads(legacy[json_start:json_end])

listener = """
      // RSVP nativo: el controlador modular superior actualiza la lista
      // directamente desde Firestore y este receptor refresca el estado interno.
      window.addEventListener('message',event => {
        const message = event.data;
        if (message?.type !== 'MIGRANDIA_RSVP_SYNC' || !Array.isArray(message.payload?.guests)) return;

        state.guests = message.payload.guests.map(normalizeGuest);
        if (Array.isArray(message.payload.tables)){
          state.tables = message.payload.tables.map(normalizeTable);
        }
        repairAssignments();
        persistImmediately();
        renderAll();
        publishSharedStateNow();
      });

"""
marker = """      window.addEventListener('beforeunload',() => {
        state.photoUrlCache.forEach(url => URL.revokeObjectURL(url));
      });

      loadState();"""

patched_real_html = False
for field in ['html', 'previewHtml']:
    encoded = modules.get('invitados', {}).get(field) or ''
    if not encoded:
        continue
    decoded = base64.b64decode(encoded).decode('utf-8')
    if 'MIGRANDIA_RSVP_SYNC' in decoded:
        if field == 'html':
            patched_real_html = True
        continue
    if marker not in decoded:
        # previewHtml es una versión reducida y no contiene todo el IIFE.
        if field == 'html':
            raise RuntimeError('No se encontró punto de inserción RSVP en invitados.html')
        continue
    decoded = decoded.replace(marker, listener + marker, 1)
    modules['invitados'][field] = base64.b64encode(decoded.encode('utf-8')).decode('ascii')
    if field == 'html':
        patched_real_html = True

if not patched_real_html:
    raise RuntimeError('No se pudo integrar el receptor RSVP en invitados.html')

new_json = json.dumps(modules, ensure_ascii=False, separators=(',', ':'))
legacy = legacy[:json_start] + new_json + legacy[json_end:]
legacy_path.write_text(legacy, encoding='utf-8')

print('RSVP_NATIVE_PATCH_OK')
