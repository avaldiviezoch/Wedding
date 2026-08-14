from pathlib import Path

files = [
    Path('app_integral/js/legacy/applu-script-01.js'),
    Path('app_integral/appludesktop.html'),
    Path('app_integral/applumovil.html'),
]
terms = [
    'tab-rsvp', 'data-tab="rsvp"', "data-tab='rsvp'", 'rsvp',
    'google sheets', 'sheets', 'asistencia', 'cantidad', 'acompañante',
    'guest', 'guests', 'guestRows', 'invitados:', 'invitados =',
    'localStorage', 'mesa', 'tableId', 'tableName'
]
for path in files:
    print(f'\n===== {path} =====')
    text = path.read_text(encoding='utf-8', errors='ignore')
    low = text.lower()
    printed = 0
    for term in terms:
        pos = 0
        found = 0
        while True:
            i = low.find(term.lower(), pos)
            if i < 0:
                break
            found += 1
            a = max(0, i - 900)
            b = min(len(text), i + 2200)
            print(f'\n--- TERM {term!r} HIT {found} @ {i} ---')
            print(text[a:b].replace('\r',''))
            pos = i + len(term)
            printed += 1
            if found >= 5 or printed >= 70:
                break
        if printed >= 70:
            break
