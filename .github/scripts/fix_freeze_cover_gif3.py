from pathlib import Path

p = Path('invitacion_3.html')
s = p.read_text(encoding='utf-8')

old_start = "  </script>\n\n\n    /* Portada GIF: reproducir una sola vez y congelar el último frame. */"
new_start = "  </script>\n\n  <script>\n    /* Portada GIF: reproducir una sola vez y congelar el último frame. */"
if old_start not in s:
    raise SystemExit('No se encontró el inicio del bloque fuera de script')
s = s.replace(old_start, new_start, 1)

old_end = "    })();\n\n</body>"
new_end = "    })();\n  </script>\n\n</body>"
if old_end not in s:
    raise SystemExit('No se encontró el final del bloque')
s = s.replace(old_end, new_end, 1)

p.write_text(s, encoding='utf-8')
