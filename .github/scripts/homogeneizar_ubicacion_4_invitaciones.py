from pathlib import Path

files = [Path(f'invitacion_{i}.html') for i in range(1, 5)]
lat = '-12.081273940768412'
lon = '-76.90575010946263'
map_url = f'https://www.google.com/maps/search/?api=1&query={lat},{lon}'

for path in files:
    text = path.read_text(encoding='utf-8')
    original = text

    # Nombre y dirección visibles / accesibilidad.
    text = text.replace('Casa Acapulco', 'Propiedad privada')
    text = text.replace('Casa+Acapulco', 'Propiedad+privada')
    text = text.replace('C. Acapulco 480', 'Calle Acapulco 480')
    text = text.replace('C. Acapulco', 'Calle Acapulco')
    text = text.replace('residencia privada', 'propiedad privada')

    # Homogeneizar todos los enlaces conocidos del mapa al GPS exacto.
    known_map_urls = [
        'https://www.google.com/maps/search/?api=1&amp;query=-12.08127394,-76.90575011',
        'https://www.google.com/maps/search/?api=1&query=-12.08127394,-76.90575011',
        'https://www.google.com/maps/search/?api=1&query=-12.081273940768412,-76.90575010946263',
        'https://maps.google.com/?q=Propiedad+privada',
        'https://maps.google.com/?q=Casa+Acapulco',
        'https://maps.app.goo.gl/hN8MwmUXEs58cZrS8',
    ]
    for old in known_map_urls:
        text = text.replace(old, map_url)

    # En HTML escapado, conservar &amp; donde corresponda no es obligatorio,
    # pero dejamos una URL válida estándar en todos los href.

    if text == original:
        print(f'{path}: sin cambios')
    else:
        path.write_text(text, encoding='utf-8')
        print(f'{path}: actualizado')

# Validaciones mínimas en las cuatro invitaciones.
for path in files:
    text = path.read_text(encoding='utf-8')
    if 'Casa Acapulco' in text or 'Casa+Acapulco' in text:
        raise SystemExit(f'Quedó una referencia a Casa Acapulco en {path}')
    if 'maps.app.goo.gl/hN8MwmUXEs58cZrS8' in text:
        raise SystemExit(f'Quedó enlace corto antiguo en {path}')
    # Las invitaciones deben contener las coordenadas exactas en algún enlace.
    if lat not in text or lon not in text:
        raise SystemExit(f'No se encontraron coordenadas exactas en {path}')

print('Ubicación homogeneizada en las 4 invitaciones.')
