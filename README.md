# Alaia Camp

Sitio del campamento Alaia + plataforma **Camper Control** y tienda, con backend real.

## Dos formas de correrlo

### 1) Sitio demo (sin backend) — GitHub Pages
Versión estática publicada: **https://sasquash93.github.io/alaia-camp/**
Sin servidor: login, inscripciones, pagos y productos funcionan en **modo demostración**
(los datos quedan solo en el navegador). Ideal para enseñar el recorrido y el diseño.

### 2) App completa (con backend) — local
Para que sea **real**: cuentas con contraseña, base de datos, subir productos con foto,
panel de administrador, inscripciones y fichas médicas guardadas.

Requisitos: **Node 18+**.

```bash
cd server
npm install        # solo la primera vez
npm start
```

Luego abre en el navegador:

| | URL | |
|---|---|---|
| Sitio | http://localhost:4000 | |
| **Panel admin** | http://localhost:4000/admin.html | usuario `admin@alaiacamp.mx` · contraseña `alaia2026` |

**Desde el panel de admin** puedes: subir / editar / eliminar productos con foto,
ver inscripciones y sus fichas médicas, ver pedidos de la tienda, editar campamentos
y mandar avisos a todos los papás.

**Desde el sitio** (como papá): crear cuenta, inscribir hijos con su ficha médica,
elegir campamento, pagar (demo), recibir su pulsera NFC y comprar merch.

Los datos se guardan en `server/data/` (base embebida, estilo Mongo) y las fotos en
`server/uploads/`. Ambas carpetas están en `.gitignore` (no se suben al repo).

## Arquitectura
- **Front-end:** sitio web (HTML/CSS/JS) servido por el backend; mismo diseño en todas las páginas.
- **Backend:** Node + Express (`server/`). API REST, auth con JWT + contraseñas encriptadas (bcrypt), subida de imágenes (multer).
- **Base de datos:** documentos estilo MongoDB. Hoy embebida y persistente (`@seald-io/nedb`) para correr sin instalar nada.

## Ponerlo en línea para enseñarlo (rápido, sin cuentas)
Doble clic en **`INICIAR-ONLINE.bat`**. Levanta el backend y abre un túnel público de
Cloudflare; copia la URL `https://XXXX.trycloudflare.com` que aparece y mándala (el panel
admin queda en `esa-URL/admin.html`). Esa URL funciona mientras tu compu y esa ventana
estén abiertas, y **cambia cada vez que lo reinicias** — ideal para demos en vivo.
Para un link permanente que viva solo, ver abajo.

## Pasar a producción (siguiente etapa)
- **Base de datos real:** define la variable `MONGO_URL` apuntando a **MongoDB Atlas**.
  `server/db.js` está aislado para migrar a Mongo sin tocar las rutas.
- **Hosting del backend:** Render / Railway / Fly.io (el sitio se sirve desde el mismo servidor).
- **Pagos reales:** conectar Stripe o SPEI en el paso de pago.
- **Seguridad:** cambiar `JWT_SECRET` y las credenciales de admin. Las fichas médicas de
  menores son datos sensibles: usar HTTPS, accesos restringidos y respaldos.

### Variables de entorno
`PORT` (default 4000) · `JWT_SECRET` · `ADMIN_EMAIL` · `ADMIN_PASSWORD` · (futuro) `MONGO_URL`
