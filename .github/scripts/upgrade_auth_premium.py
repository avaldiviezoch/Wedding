from pathlib import Path

VERSION = '20260814-1144-auth1'
FILES = [Path('app_integral/applu.html'), Path('applu.html')]

old_button = '<button class="auth-google" id="googleLoginButton" type="button">Continuar con Google</button>'
new_button = '''<button class="auth-google" id="googleLoginButton" type="button">
        <span class="auth-google-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" role="img">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.61l6.85-6.85C35.91 2.38 30.4 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.46 13.59 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.09-.39-4.55H24v9.02h12.94c-.56 3.01-2.25 5.56-4.8 7.27l7.73 6c4.51-4.16 7.11-10.3 7.11-17.74z"/>
            <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.6.28-3.15.79-4.59l-7.98-6.19A23.96 23.96 0 0 0 0 24c0 3.86.92 7.51 2.56 10.78l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.81l-7.73-6c-2.15 1.44-4.9 2.31-8.16 2.31-6.26 0-11.54-4.09-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        </span>
        <span class="auth-google-copy">
          <span class="auth-google-title">Continuar con Google</span>
          <span class="auth-google-subtitle">Acceso rápido y seguro</span>
        </span>
      </button>'''

for path in FILES:
    text = path.read_text(encoding='utf-8')
    if 'css/modules/auth-premium.css' not in text:
        marker = '  <link rel="stylesheet" href="css/core/auth-guard.css?v=20260814-1136-collab1">'
        if marker not in text:
            raise RuntimeError(f'No se encontró auth-guard en {path}')
        text = text.replace(marker, marker + f'\n  <link rel="stylesheet" href="css/modules/auth-premium.css?v={VERSION}">', 1)
    if old_button in text:
        text = text.replace(old_button, new_button, 1)
    elif 'auth-google-icon' not in text:
        raise RuntimeError(f'No se encontró botón Google en {path}')
    path.write_text(text, encoding='utf-8')

print('AUTH_PREMIUM_PATCH_OK')
