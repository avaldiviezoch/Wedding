from pathlib import Path
import base64, json, re

path = Path('app_integral/js/legacy/applu-script-01.js')
text = path.read_text(encoding='utf-8', errors='ignore')

start = text.find('const MODULES = ')
if start < 0:
    raise SystemExit('MODULES no encontrado')
start += len('const MODULES = ')
end = text.find(';\n', start)
if end < 0:
    end = text.find(';\r\n', start)
raw = text[start:end]
modules = json.loads(raw)
print('MODULE KEYS:', ', '.join(modules.keys()))
inv = modules.get('invitados') or {}
print('INVITADOS FIELDS:', ', '.join(inv.keys()))
for field in ['html','previewHtml']:
    encoded = inv.get(field) or ''
    if not encoded:
        continue
    decoded = base64.b64decode(encoded).decode('utf-8', errors='ignore')
    print(f'\n===== INVITADOS {field} decoded chars={len(decoded)} =====')
    # IDs y clases clave para entender la estructura
    ids = sorted(set(re.findall(r'id=["\']([^"\']+)', decoded)))
    print('IDS:', ', '.join(ids[:250]))
    # claves de almacenamiento
    storage = sorted(set(re.findall(r"(?:localStorage\.(?:getItem|setItem|removeItem)\(\s*|STORAGE_KEY\s*=\s*)['\"]([^'\"]+)", decoded)))
    print('STORAGE:', ', '.join(storage))
    terms = ['data-tab="rsvp"','tab-rsvp','RSVP','Google','Sheets','sheet','Asistencia','Cantidad','acompañ','guest','invitad','PLANIFICADOR_BODAS_UPDATE','localStorage','Fecha','Nombre']
    low = decoded.lower()
    for term in terms:
        pos=0
        count=0
        while True:
            i=low.find(term.lower(),pos)
            if i<0: break
            count+=1
            print(f'\n--- {field} TERM {term!r} #{count} @ {i} ---')
            print(decoded[max(0,i-650):min(len(decoded),i+1600)].replace('\r',''))
            pos=i+len(term)
            if count>=5: break
