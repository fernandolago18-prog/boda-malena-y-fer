# Web de Boda Interactiva (HTML / CSS / JS)

Web editorial interactiva lista para subir gratis a **GitHub Pages** (o **Cloudflare Pages**) y probar directamente en tu ordenador.

Incluye:
- Sobre real plegado con **lazo de seda y sello de lacre debajo** que se desata antes de extraer la invitación.
- Sección **Video-Scroll cinematográfica** con la historia de Malena & Fer en 4 capítulos, partículas doradas y soporte para vídeo real o secuencia de fotogramas.
- **Cuenta atrás interactiva** (toca los números para lanzar arroz de la suerte) + descarga directa a **Google Calendar** y archivo `.ics`.
- **Programa del día** con línea temporal animada.
- **Mapa interactivo 100% gratuito sobre Google Maps**: filtros por categoría (Finca, Hoteles, Autobús), selector **Mapa / Satélite**, tarjeta flotante con códigos promocionales copiables, ruta GPS directa y soporte opcional para **Google My Maps** con todos los pines juntos.
- **Cuestionario RSVP interactivo**:
  - Botón *"No podré asistir"* fugitivo durante **5 intentos** (con mensajes crecientes mientras el botón *"Sí"* crece).
  - Confirmación de asistencia, acompañante (+1), niños, alergias, autobús, medidor de barra libre (1–5) y **tocadiscos DJ** con *Easter eggs* según la canción.
  - Generación automática de **Pase VIP descargable en PNG**.

---

## 1. Cómo ver la web ahora mismo en tu ordenador

1. Abre la carpeta del proyecto y haz **doble clic en `index.html`** (no necesita instalar nada ni servidor).
2. Todos los datos actuales están personalizados para **Malena & Fer** (con ubicaciones de ejemplo en Murcia que puedes ajustar en `js/config.js`).
3. El RSVP está inicialmente en modo `demo`: puedes probar el botón fugitivo, enviar respuestas y descargar tu Pase VIP en PNG al instante.

---

## 2. Cómo personalizar vuestros datos (en un único archivo)

Abre [`js/config.js`](js/config.js) con cualquier editor de texto o VS Code y edita:
- `couple`: vuestros nombres, monograma, hashtag y correo.
- `wedding`: fecha (`dateISO`), lugar y textos para el calendario.
- `music.audioUrl`: ruta a un `.mp3` propio (por ejemplo `assets/audio/cancion.mp3`). Si se deja vacío (`''`), suena una melodía acústica suave generada automáticamente.
- `cinema.chapters`: textos e imágenes de los 4 capítulos del recorrido.
- `schedule`: horarios del evento.
- `locations`: coordenadas (`lat`, `lng`), enlaces de Google Maps y códigos promocionales de los hoteles. *(Opcional y gratis: si creáis un mapa personalizado en `mymaps.google.com` con todos vuestros pines juntos y pegáis la URL `/maps/d/embed?mid=...` en `locations.googleMyMapsEmbedUrl`, podréis ver todos los pines a la vez sobre Google Maps).*
- `infoUtil`: dress code, autobuses e IBAN.

---

## 3. Cómo activar el Video-Scroll con vuestro propio vídeo

Por defecto está activo el modo `storyboard` (las 4 escenas fotográficas en `assets/images/`). Cuando tengáis un vídeo corto vuestro (5–15 segundos), tenéis dos opciones en `js/config.js`:

### Opción recomendada (ultra fluida en iPhone/Android): `video-frames`
Convierte vuestro vídeo a una secuencia de 120 imágenes `.webp` usando `ffmpeg`:

```bash
mkdir -p assets/frames
ffmpeg -i mi-video-boda.mp4 -vf "fps=12,scale=1280:-1" -q:v 75 assets/frames/frame_%04d.webp
```

Después cambia en `js/config.js`:
```js
cinema: {
  mode: 'video-frames',
  videoFrames: {
    folder: 'assets/frames/',
    prefix: 'frame_',
    extension: 'webp',
    frameCount: 120,
    padLength: 4
  },
  ...
}
```

---

## 4. Conectar el cuestionario RSVP con Google (2 opciones gratuitas)

### Opción A: Google Forms oculto (lo más rápido)
1. Crea un **Google Form** con preguntas de texto corto correspondientes a: Nombre, Email/Teléfono, Asistencia, Acompañante, Nombre acompañante, Número de niños, Detalle niños, Alergias, Autobús, Nivel fiesta, Canción DJ, Mensaje e Intentos botón No.
2. En el menú `⋮` del formulario, pulsa **Obtener enlace prellenado**, rellena un ejemplo en cada campo y copia el enlace generado.
3. De ese enlace verás:
   - La URL base del formulario (cambia `/viewform` por `/formResponse`).
   - Cada identificador `entry.123456789`.
4. Pega la URL y los `entry.*` en `js/config.js` dentro de `rsvp.googleForms`, y cambia `rsvp.backendMode` a `'google-forms'`.

### Opción B: Google Apps Script + Google Sheets (Recomendada: confirmación real + emails automáticos)
1. Crea una nueva hoja en **Google Sheets**.
2. Ve a **Extensiones → Apps Script**, borra el contenido y pega el código de [`scripts/google-apps-script.gs`](scripts/google-apps-script.gs).
3. Opcional: escribe vuestro correo en `COUPLE_EMAIL` para recibir un aviso cada vez que alguien confirme.
4. Pulsa **Implementar → Nueva implementación → Aplicación web**:
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier usuario
5. Copia la URL `/exec` que te entrega Google, pégala en `js/config.js` dentro de `rsvp.appsScript.webAppUrl` y cambia `rsvp.backendMode` a `'apps-script'`.

---

## 5. Cómo publicar la web gratis en GitHub Pages

1. Crea un repositorio público (o privado con GitHub Pro) en GitHub, por ejemplo `boda-lucia-mateo`.
2. Sube toda la carpeta `BODA` (`index.html` debe quedar en la raíz del repositorio):
   ```bash
   git init
   git add .
   git commit -m "Invitación de boda interactiva"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/boda-lucia-mateo.git
   git push -u origin main
   ```
3. En GitHub, entra en **Settings → Pages**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / `/ (root)`
4. En 1 minuto tendrás tu enlace HTTPS listo para enviar por WhatsApp (`https://TU_USUARIO.github.io/boda-lucia-mateo/`).

*(Tip: si prefieres que el repositorio sea privado gratuitamente con dominio propio y SSL instantáneo, conecta el mismo repositorio de GitHub a **Cloudflare Pages** sin cambiar ni una línea de código).*
