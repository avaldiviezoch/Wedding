from pathlib import Path

files = [
    Path('app_integral/js/legacy/applu-script-01.js'),
    Path('app_integral/appludesktop.html'),
    Path('app_integral/applumovil.html'),
]
terms = ['invitados', 'invitado', 'guest', 'guests', 'mesa', 'table', 'unifiedWorkspace', 'MODULE', 'iframe']
for path in files:
    print(f'\n===== {path} =====')
    text = path.read_text(encoding='utf-8', errors='ignore')
    low = text.lower()
    hits=[]
    for term in terms:
        start=0
        t=term.lower()
        while True:
            i=low.find(t,start)
            if i<0: break
            hits.append((i,term))
            start=i+len(t)
    hits=sorted(hits)[:120]
    seen=[]
    for i,term in hits:
        a=max(0,i-500); b=min(len(text),i+1200)
        snippet=text[a:b].replace('\r','')
        key=snippet[:100]
        if key in seen: continue
        seen.append(key)
        print(f'\n--- HIT {term} @ {i} ---')
        print(snippet)
        if len(seen)>=35: break
