from pathlib import Path

p = Path('invitacion_2.html')
s = p.read_text(encoding='utf-8')

old_src = 'https://raw.githubusercontent.com/avaldiviezoch/Wedding/main/invitacion_confirmacion_2.png?v=20260721-1'
new_src = 'https://raw.githubusercontent.com/avaldiviezoch/Wedding/main/confirmar%20invitacion_2.gif?v=20260812-1'

if old_src not in s:
    raise SystemExit('No se encontro la imagen RSVP anterior')
s = s.replace(old_src, new_src, 1)

s = s.replace('alt="Confirma tu asistencia"', 'alt="Pelícano mensajero para confirmar asistencia"', 1)
s = s.replace('Toca la imagen para confirmar', 'Toca a nuestro mensajero para confirmar tu asistencia', 1)

marker = 'PELICANO MENSAJERO RSVP — INVITACION 2'
css = r'''

    /* ===== PELICANO MENSAJERO RSVP — INVITACION 2 ===== */
    .rsvp-image-stage{
      width:min(76%,420px) !important;
      margin:2px auto 0 !important;
      background:transparent !important;
      box-shadow:none !important;
      border:0 !important;
      overflow:visible !important;
    }

    .rsvp-image-stage::before,
    .rsvp-image-stage::after{
      content:none !important;
      display:none !important;
    }

    .rsvp-main-image{
      width:100% !important;
      height:auto !important;
      object-fit:contain !important;
      background:transparent !important;
      filter:drop-shadow(0 9px 10px rgba(88,72,54,.12)) !important;
      transform-origin:center center !important;
      animation:pelicanoMessengerFloat 4.3s ease-in-out infinite !important;
    }

    .rsvp-image-stage.is-tapped .rsvp-main-image{
      animation:pelicanoMessengerTap .48s cubic-bezier(.2,.82,.28,1), pelicanoMessengerFloat 4.3s ease-in-out .48s infinite !important;
    }

    .rsvp-tap-hint{
      margin:5px auto 0 !important;
      max-width:290px !important;
      padding:0 12px !important;
      font-size:10px !important;
      line-height:1.35 !important;
      letter-spacing:.035em !important;
      color:#777d68 !important;
      opacity:.78 !important;
      text-align:center !important;
    }

    @keyframes pelicanoMessengerFloat{
      0%,100%{ transform:translateY(0) rotate(-.35deg) scale(1); }
      48%{ transform:translateY(-8px) rotate(.45deg) scale(1.012); }
      70%{ transform:translateY(-4px) rotate(0deg) scale(1.006); }
    }

    @keyframes pelicanoMessengerTap{
      0%{ transform:scale(1) rotate(0deg); }
      38%{ transform:scale(.965) rotate(-1.2deg); }
      70%{ transform:scale(1.025) rotate(.8deg); }
      100%{ transform:scale(1) rotate(0deg); }
    }

    @media(max-width:520px){
      .rsvp-image-stage{ width:min(80%,340px) !important; }
      .rsvp-tap-hint{ font-size:9.5px !important; max-width:260px !important; }
    }
'''

if marker not in s:
    if '</style>' not in s:
        raise SystemExit('No se encontro cierre de style')
    s = s.replace('</style>', css + '\n  </style>', 1)

p.write_text(s, encoding='utf-8')
