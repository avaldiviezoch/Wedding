from pathlib import Path

p = Path('invitacion_1.html')
s = p.read_text(encoding='utf-8')

replacements = {
    'https://lh3.googleusercontent.com/d/19WfVkebSIW750jTpHIqOYME_E5_ekZ4p=w1600': 'assets/invitacion_1/invite_base_1.jpg',
    "https://drive.google.com/thumbnail?id=19WfVkebSIW750jTpHIqOYME_E5_ekZ4p&sz=w1600": 'assets/invitacion_1/invite_base_1.jpg',
    'https://lh3.googleusercontent.com/d/1ev6oiga4uoc6JmluJrTEATrIHC82LVv7=w1600': 'assets/invitacion_1/historia_1.jpg',
    "https://drive.google.com/thumbnail?id=1ev6oiga4uoc6JmluJrTEATrIHC82LVv7&sz=w1600": 'assets/invitacion_1/historia_1.jpg',
    'https://lh3.googleusercontent.com/d/1r2i5LNx2A5yd2xFl-_dfEuBhpYgQSPhX=w1600': 'assets/invitacion_1/historia_2.jpg',
    "https://drive.google.com/thumbnail?id=1r2i5LNx2A5yd2xFl-_dfEuBhpYgQSPhX&sz=w1600": 'assets/invitacion_1/historia_2.jpg',
    'https://lh3.googleusercontent.com/d/1eoMeudALM1oexDh-pVRAduFCdcmVZNHX=w1600': 'assets/invitacion_1/historia_3.jpg',
    "https://drive.google.com/thumbnail?id=1eoMeudALM1oexDh-pVRAduFCdcmVZNHX&sz=w1600": 'assets/invitacion_1/historia_3.jpg',
    'https://lh3.googleusercontent.com/d/1jWa43KStwxeLKzAZ9Q9QhONHX6s1HLoL=w1600': 'assets/invitacion_1/dresscode_bg_1.jpg',
    "https://drive.google.com/thumbnail?id=1jWa43KStwxeLKzAZ9Q9QhONHX6s1HLoL&sz=w1600": 'assets/invitacion_1/dresscode_bg_1.jpg',
}

for old, new in replacements.items():
    s = s.replace(old, new)

# Quitar los onerror que vuelven a Drive para estos recursos ahora locales.
import re
s = re.sub(r"\s+onerror=\"this\.onerror=null;this\.src='assets/invitacion_1/[^']+';\"", '', s)
s = re.sub(r"\s+onerror=\"this\.onerror=null;this\.src=\\'assets/invitacion_1/[^']+\\';\"", '', s)

p.write_text(s, encoding='utf-8')
