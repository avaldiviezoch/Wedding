from pathlib import Path
import base64, json

path = Path('app_integral/js/legacy/applu-script-01.js')
text = path.read_text(encoding='utf-8', errors='ignore')
start = text.find('const MODULES = ') + len('const MODULES = ')
end = text.find(';\n', start)
modules = json.loads(text[start:end])
decoded = base64.b64decode(modules['invitados']['html']).decode('utf-8', errors='ignore')

terms = [
  'data-view="list"', 'data-view="tables"', 'data-view="map"',
  'id="listView"', 'id="tablesView"', 'id="mapView"',
  'const STORAGE_KEY', 'const SHARED_KEY',
  'function normalizeGuest', 'function serializableData', 'function syncSharedData',
  'function renderSummary', 'function renderAll', 'function setView',
  'guestForm.addEventListener', "$('#guestForm')", 'guestForm',
  'function createBaseGuests'
]
for term in terms:
    i = decoded.find(term)
    print(f'\n===== {term} @ {i} =====')
    if i >= 0:
      print(decoded[max(0,i-1200):min(len(decoded),i+4500)].replace('\r',''))
