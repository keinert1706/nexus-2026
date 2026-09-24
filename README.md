# Nexus 2026 — Landing + RSVP + Dashboard

Landing mobile-first para el evento **Nexus 2026**, con formulario de confirmación de asistencia (RSVP), botones para agendar en calendario, y un dashboard de registros en tiempo real. Costo: $0 (Neon + Netlify, tiers gratuitos).

## Cómo está armado (para que entiendas qué vas a configurar)

- **`index.html` + `css/` + `js/`** → la landing pública que ven los invitados.
- **`dashboard.html`** → el panel privado donde tú ves los registros.
- **`netlify/functions/`** → 3 funciones (mini-programas) que corren en Netlify y son las únicas que hablan con la base de datos. La landing y el dashboard **nunca** tocan la base de datos directamente — así ningún dato (emails, teléfonos) queda expuesto en el código que ve el navegador.
- **`db/schema.sql`** → el script que crea la tabla de asistentes en Neon.

Por eso necesitas configurar **3 cosas** antes de que funcione: Neon (la base de datos), GitHub (donde vive el código) y Netlify (donde se publica el sitio).

---

## Paso 1 — Base de datos en Neon

1. Ve a [neon.tech](https://neon.tech) y crea un proyecto gratuito.
2. En el **SQL Editor** de Neon, pega todo el contenido de [`db/schema.sql`](db/schema.sql) y haz clic en **Run**. Esto crea la tabla `asistentes` y la función de estadísticas.
3. En el panel del proyecto, clic en **Connect** y copia la **cadena de conexión** (empieza por `postgresql://`). Esa es tu `DATABASE_URL` para el Paso 3.

   ⚠️ La cadena de conexión incluye la contraseña de la base de datos — nunca la compartas ni la pegues en el código, solo va en las variables de entorno de Netlify (Paso 3).

---

## Paso 2 — Subir el código a GitHub

1. Ve a [github.com](https://github.com) y crea una cuenta gratuita.
2. Clic en el botón **"+"** (arriba a la derecha) → **"New repository"**. Nómbralo `nexus-2026`, déjalo en **Public** o **Private** (cualquiera funciona con Netlify gratis), y clic en **Create repository**.
3. En la página del repo recién creado, busca el link que dice **"uploading an existing file"**.
4. Abre la carpeta de este proyecto en tu computador y arrastra **todos los archivos y carpetas** (`index.html`, `dashboard.html`, `css/`, `js/`, `netlify/`, `db/`, `netlify.toml`, `package.json`, `.gitignore`, `.env.example`, `README.md`) a la zona de carga de GitHub. **No subas ningún archivo `.env` real** si llegas a crear uno (solo `.env.example` debe subirse, y ya está listo para eso).
5. Escribe un mensaje de commit como "Primera versión de Nexus 2026" y clic en **Commit changes**.

---

## Paso 3 — Desplegar en Netlify

1. Ve a [netlify.com](https://netlify.com) y crea una cuenta gratuita (puedes registrarte directamente con tu cuenta de GitHub, es lo más simple).
2. En el dashboard de Netlify, clic en **"Add new site" → "Import an existing project"**.
3. Elige **GitHub**, autoriza el acceso, y selecciona el repositorio `nexus-2026`.
4. Netlify va a detectar automáticamente la configuración (viene incluida en `netlify.toml`). No necesitas cambiar nada en "Build settings". Antes de darle a "Deploy", busca la sección **"Environment variables"** (o entra después en **Site configuration → Environment variables**) y agrega estas 2:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | la cadena de conexión de Neon que copiaste en el Paso 1 |
   | `DASHBOARD_PASSWORD` | la contraseña que quieras usar para el dashboard — te sugiero empezar con `Nexus-Diamante-2026` y cambiarla luego si quieres |

5. Clic en **Deploy site**. En 1-2 minutos tu sitio estará publicado en una URL tipo `random-name-123.netlify.app`.
6. (Opcional) Para un link más bonito: **Site configuration → General → Site details → Change site name**, y elige algo como `nexus-2026` (si está disponible, tu link quedaría `nexus-2026.netlify.app`).

**Ese link (`https://tu-sitio.netlify.app`) es el que compartes con los asistentes.**

---

## Cómo editar después (sin tocar código)

Todo lo editable vive en **un solo archivo**: [`js/config.js`](js/config.js). Para editarlo:

1. En GitHub, abre el archivo `js/config.js`, clic en el ícono de lápiz (Edit).
2. Cambia lo que necesites:
   - `dateLabel` → la fecha que ven los invitados ("15 de octubre · 6:00 PM").
   - `meet` → los datos de la videollamada de Google Meet que se incluyen al agendar el evento.
   - `eventStartISO` → la fecha/hora real de inicio que se usa para los botones de calendario (formato `AAAA-MM-DDTHH:MM:SS-05:00`). **Actualiza esto junto con `dateLabel`** para que el calendario coincida con lo que dice la landing.
   - `cargoOptions` → las opciones de cargo (si agregas una, agrégala también en `ALLOWED_CARGOS` de `netlify/functions/submit-rsvp.js`).
   - `tagline` → el texto bajo el logo.
3. Baja hasta el final de la página y clic en **Commit changes**. Netlify vuelve a publicar el sitio solo, en 1-2 minutos.

Para cambiar la contraseña del dashboard: en Netlify, **Site configuration → Environment variables → `DASHBOARD_PASSWORD`**, edita el valor, y luego ve a **Deploys → Trigger deploy → Clear cache and deploy site** (los cambios de variables de entorno necesitan un redeploy para aplicarse).

---

## Cómo ver el dashboard de registros

Ve a `https://tu-sitio.netlify.app/dashboard.html`, ingresa la contraseña que configuraste (`DASHBOARD_PASSWORD`), y vas a ver:

- Total de registros, confirmados, no asistirán, y % de confirmación.
- Conteo de confirmados por cargo (gerente, asesor, administrador).
- Listado completo paginado (25 por página), con botón para exportar todo a CSV.

Funciona igual de bien desde el celular. La sesión dura 4 horas; después te pedirá la contraseña de nuevo.

---

## Decisiones de diseño que quizás quieras conocer

- **Sin duplicados incluso con picos de tráfico**: el email tiene una restricción `UNIQUE` a nivel de base de datos. Si dos personas intentan registrarse con el mismo email al mismo tiempo (ej. link compartido en un grupo de WhatsApp), Postgres garantiza que solo uno se guarda y el segundo recibe el mensaje amigable "ya estás registrado" — sin condición de carrera posible.
- **Nada se pierde si falla la red**: si el formulario no logra conectarse al servidor, se muestra un aviso y el usuario puede reintentar sin haber perdido lo que ya escribió (el formulario no se limpia).
- **Seguridad de los datos**: la base de datos en Neon es inaccesible directamente desde el navegador. Todo el acceso (guardar RSVP, ver el dashboard) pasa por las Netlify Functions, que usan la `DATABASE_URL` solo del lado del servidor.
- **Rendimiento con 300+ registros**: el dashboard nunca descarga toda la tabla para mostrar contadores — usa una función SQL (`asistentes_stats`) que calcula los totales dentro de Postgres. El listado usa paginación real (25 filas por consulta). La exportación a CSV sí trae todas las filas de una vez (hasta 5000 como límite de seguridad), pero es una acción manual bajo demanda, no algo que carga en cada visita.

## Pendientes de tu parte

- **Logo/diamante e identidad visual**: por ahora está recreado en SVG a partir de tu descripción (colores, diamante de 4 nodos, chevrones). Cuando me pases el KV real lo ajusto para que sea pixel-perfect.
- **Fecha/hora/lugar reales** del evento.
