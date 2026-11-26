# LOOP — Backend API

API REST de **LOOP**, plataforma social Full Stack desarrollada como Trabajo Integrador Final de la Diplomatura Full Stack UTN.

Incluye autenticación con JWT, hash de contraseñas con bcrypt y verificación de correo electrónico, feed filtrado por cuentas y comunidades seguidas, perfiles públicos con `@username` y biografía, descubrimiento y tendencias (`Explorar`), comunidades con publicaciones fijadas, likes, comentarios, reposts, publicaciones guardadas (bookmarks), mensajería directa y grupal con solicitudes de conversación, respuestas/reenvío y presencia activa, y notificaciones.

---

## 1. Funcionalidades principales

- **Autenticación y seguridad:** registro, verificación de email con Nodemailer, reenvío de verificación, inicio de sesión con JWT Bearer, recuperación y restablecimiento de contraseña de uso único (`jti`), rate limiting, IP blacklist/whitelist opcionales y endpoint técnico con `x-api-key`.
- **Feed y publicaciones:** creación de texto e imagen (optimizada con `sharp` y almacenada en Vercel Blob), feed personalizado en backend (publicaciones propias, de cuentas seguidas y de comunidades a las que pertenece el usuario), edición, eliminación lógica y menciones `@username`.
- **Interacciones sociales:** likes, comentarios, reposts, publicaciones guardadas (bookmarks) y seguimiento entre usuarios.
- **Explorar:** tendencias reales de los últimos 7 días (likes, comentarios y reposts con decaimiento temporal), recomendaciones *Para vos* (autores y comunidades aún no seguidos) y listado paginado/buscable de personas con `is_following`.
- **Comunidades:** creación, edición, imagen, unión/abandono, publicaciones de miembros, fijar/desfijar publicación destacada (`owner`) y eliminación con limpieza en cascada.
- **Mensajes y grupos:** conversaciones 1-a-1, solicitudes pendientes (`pending`) para usuarios sin seguimiento mutuo, grupos con roles (`owner`, `admin`, `member`), sucesión automática del propietario al salir, eventos de sistema, responder/reenviar mensajes, compartir publicaciones, estados `entregado_a`/`leido_por` y supresión de notificaciones cuando el destinatario está viendo el chat activo.
- **Notificaciones:** eventos de seguimiento, like, comentario, repost, mención y mensaje con paginación, contador de no leídas, marcado y borrado.

---

## 2. Tecnologías y dependencias principales

- **Runtime y Framework:** Node.js (ESM), Express `^5.2.1`
- **Base de datos y ODM:** MongoDB, Mongoose `^9.10.1`
- **Autenticación y seguridad:** `jsonwebtoken` `^9.0.3`, `bcrypt` `^6.0.0`, `cors` `^2.8.6`, `express-rate-limit` `^8.7.5`
- **Correos electrónicos:** `nodemailer` `^10.1.1` (SMTP Gmail)
- **Imágenes y almacenamiento:** `multer` `^2.5.0`, `sharp` `^0.35.5`, `@vercel/blob` `^2.9.0`
- **Utilidades:** `dotenv` `^18.0.9`, `uuid` `^14.0.2`
- **Documentación OpenAPI:** `swagger-jsdoc` `^6.3.0`, `swagger-ui-express` `^5.0.1`

---

## 3. Requisitos previos

- Node.js `>= 18`
- Acceso a MongoDB (instancia local o MongoDB Atlas)
- Cuenta SMTP (Gmail App Password) para envío de correos de verificación y recuperación
- Token de `@vercel/blob` si se desea probar la subida de imágenes/avatares

---

## 4. Instalación y ejecución local

```bash
# 1. Clonar el repositorio
git clone https://github.com/luzmicol/backend-utn.git
cd backend-utn

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores locales (nunca subir .env al repositorio)

# 4. Ejecutar en desarrollo (recarga automática con node --watch)
npm run dev

# O ejecutar en modo normal
npm start
```

El servidor quedará escuchando en `http://localhost:8080` (o el puerto definido en `PORT`).

---

## 5. Variables de entorno

Referencia: [`.env.example`](./.env.example).

| Variable | Obligatoria | Descripción | Ejemplo |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Puerto local de Express (por defecto `8080`). | `8080` |
| `NODE_ENV` | No | Entorno (`development` \| `production`). | `development` |
| `MONGO_DB_URI` | Sí | URI de conexión a MongoDB. | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGO_DB_NAME` | Sí | Nombre de la base de datos en MongoDB. | `loop_db` |
| `JWT_SECRET_KEY` | Sí | Secreto para firmar y verificar tokens JWT. | `secreto_largo_y_aleatorio` |
| `GMAIL_USER` | Sí | Cuenta Gmail remitente para Nodemailer. | `tu_correo@gmail.com` |
| `GMAIL_PASSWORD` | Sí | App Password de Gmail. | `xxxx_xxxx_xxxx_xxxx` |
| `URL_FRONTEND` | Sí | URL base del frontend (sin barra final) para enlaces de email y CORS. | `http://localhost:5173` |
| `CORS_ORIGINS` | No | Orígenes adicionales permitidos por CORS (separados por coma). | `https://preview.vercel.app` |
| `URL_BACKEND` | No | URL pública del backend para documentación Swagger. | `http://localhost:8080` |
| `BLOB_READ_WRITE_TOKEN` | Sí* | Token de Vercel Blob (*requerido para subir imágenes/avatares). | `vercel_blob_rw_placeholder` |
| `IP_BLACKLIST` | No | IPs bloqueadas globalmente (separadas por coma). | `203.0.113.10` |
| `IP_WHITELIST` | No | IPs permitidas para rutas restringidas como `/api/docs`. | `127.0.0.1,::1` |
| `API_KEY` | No | Clave para integraciones técnicas vía header `x-api-key` (`GET /api/system/status`). | `clave_api_placeholder` |

---

## 6. Arquitectura y estructura de carpetas

El proyecto sigue una arquitectura estricta en capas:

```text
Request → routes/ → middlewares/ → controllers/ → services/ → repositories/ → models/ (MongoDB)
```

```text
Backend/
├── config/               # Conexión MongoDB, CORS, variables de entorno y Nodemailer
├── controllers/          # Controladores HTTP por módulo
├── docs/                 # Configuración OpenAPI/Swagger y colección Postman v2.1
├── middlewares/          # Auth JWT, API Key, errores, logger, IP access y Multer
├── models/               # Esquemas Mongoose, relaciones e índices
├── repositories/         # Consultas y agregaciones sobre MongoDB
├── routes/               # Routers Express por módulo
├── services/             # Lógica de negocio, permisos y orquestación
├── utils/                # bcrypt, ServerError, menciones, username y plantillas de email
├── .env.example          # Plantilla de variables de entorno
├── main.js               # Punto de entrada Express (local y Vercel serverless)
├── package.json
└── vercel.json           # Configuración de despliegue en Vercel
```

---

## 7. Autenticación, JWT, bcrypt y verificación por email

- **Hash de contraseñas:** `bcrypt` al registrar y restablecer contraseña; el campo `password` se excluye en `toJSON`.
- **Verificación de email:** al registrarse se genera un token JWT de verificación y se envía por correo mediante Nodemailer; el login rechaza cuentas con `email_verificado: false` (`403`).
- **Recuperación de contraseña:** utiliza un identificador único `password_reset_jti` guardado en el usuario para garantizar tokens de un solo uso.
- **Sesión API:** las rutas protegidas validan `Authorization: Bearer <token>` mediante `authMiddleware`, inyectando `request.user.id`.

---

## 8. Base de datos y relaciones entre modelos

Conexión gestionada en `config/mongo.config.js` (compatible con Vercel Serverless) y middleware `ensureDatabaseConnection`.

- **`Usuario` (`user.model.js`):** `nombre`, `username` (único/sparse), `bio`, `email` (único), `password` (hash), `avatar_url`, `email_verificado`, `activo`, `password_reset_jti`, `active_conversation_id`, `active_conversation_at`.
- **`Publicacion` (`post.model.js`):** `contenido`, `imagen_url`, `fk_id_usuario` → `Usuario`, `fk_id_comunidad` → `Comunidad` (opcional), `menciones`, `activo`, `fecha_creacion`.
- **`Comunidad` (`community.model.js`):** `nombre`, `descripcion`, `imagen_url`, `fk_id_creador` → `Usuario`, `fk_id_publicacion_fijada` → `Publicacion`, `activa`.
- **`MiembroComunidad` (`communityMember.model.js`):** relación única `{ fk_id_usuario, fk_id_comunidad }` con `rol` (`owner`, `user`).
- **Interacciones:** `Like`, `Comentario`, `Repost`, `Bookmark` y `Follow` (con índices únicos para evitar duplicados).
- **Mensajería:** `Conversacion` (`tipo`: `direct` | `group`, `estado`: `accepted` | `pending`, `participantes`, `miembros_grupo`) y `Mensaje` (`tipo`: `text` | `shared_post` | `system`, `fk_id_mensaje_respondido`, `reenviado`, `entregado_a`, `leido_por`).
- **Sistema:** `Notificacion` y `QueryLog` (con índice TTL de 30 días).

---

## 9. Endpoints principales por módulo

### Sistema y documentación
- `GET /` — Health check (público)
- `GET /api/docs` y `GET /api/docs.json` — Swagger UI y OpenAPI JSON
- `GET /api/system/status` — Estado técnico (header `x-api-key`)

### Autenticación (`/api/auth`)
- `POST /api/auth/register` — Registro de usuario
- `POST /api/auth/login` — Inicio de sesión (devuelve JWT)
- `POST /api/auth/verify` — Verificar email con token
- `GET /api/auth/verify-email/:email/resend` — Reenviar correo de verificación
- `POST /api/auth/forgot-password` — Solicitar recuperación de contraseña
- `POST /api/auth/reset-password` — Restablecer contraseña

### Publicaciones, likes, comentarios, reposts y guardados (`/api/posts`)
- `POST /api/posts` — Crear publicación (JSON o `multipart/form-data` con imagen)
- `GET /api/posts` — Feed paginado (filtrado por cuentas seguidas, comunidades y propios) o filtrado por `user_id` / `community_id`
- `GET /api/posts/:post_id` — Detalle de publicación
- `PUT /api/posts/:post_id` — Editar publicación propia
- `DELETE /api/posts/:post_id` — Eliminar publicación propia
- `POST / DELETE / GET /api/posts/:post_id/likes` — Dar, quitar y listar likes
- `POST / GET /api/posts/:post_id/comments` y `DELETE /api/posts/:post_id/comments/:comment_id` — Comentarios
- `POST / DELETE / GET /api/posts/:post_id/reposts` — Reposts
- `POST / DELETE /api/posts/:post_id/bookmarks` — Guardar / quitar de guardados

### Explorar (`/api/explore`)
- `GET /api/explore/trending?page=1&limit=15` — Publicaciones en tendencia de los últimos 7 días
- `GET /api/explore/for-you?limit=5` — Publicaciones recomendadas de descubrimiento

### Usuarios, perfiles y seguimiento (`/api/users`)
- `GET /api/users?page=1&limit=15&q=` — Listado paginado de usuarios públicos (excluye al usuario actual, incluye `is_following`)
- `GET /api/users/username-availability?username=` — Verificar disponibilidad de username (público)
- `GET /api/users/search?q=&limit=` — Búsqueda rápida de usuarios
- `GET / PUT /api/users/me` — Obtener y actualizar perfil propio (`nombre`, `bio`)
- `GET /api/users/me/bookmarks` — Listar publicaciones guardadas propias
- `PUT /api/users/me/username` — Cambiar username propio (cooldown 7 días)
- `POST / DELETE /api/users/me/avatar` — Subir o eliminar avatar propio
- `GET /api/users/:user_id` y `GET /api/users/:user_id/reposts` — Perfil público y reposts
- `POST / DELETE / GET /api/users/:user_id/follow`, `GET /api/users/:user_id/followers`, `GET /api/users/:user_id/following` — Seguimiento

### Comunidades (`/api/communities`)
- `POST / GET /api/communities` — Crear y listar comunidades (con `members_count`)
- `GET /api/communities/me` — Mis comunidades
- `GET / PUT / DELETE /api/communities/:community_id` — Detalle, edición y eliminación (`owner`)
- `PATCH / DELETE /api/communities/:community_id/image` — Imagen de comunidad (`owner`)
- `PUT /api/communities/:community_id/pin/:post_id` y `DELETE /api/communities/:community_id/pin` — Fijar/desfijar publicación (`owner`)
- `POST / GET /api/communities/:community_id/members` y `DELETE /api/communities/:community_id/members/me` — Membresía

### Conversaciones y mensajes (`/api/conversations` y `/api/messages`)
- `POST / GET /api/conversations` — Crear/recuperar chat 1-a-1 y listar conversaciones
- `GET /api/conversations/unread-count` — Contador global de mensajes no leídos
- `DELETE /api/conversations/active` — Limpiar estado de conversación activa
- `PATCH /api/conversations/:conversation_id/read` — Marcar conversación como leída
- `GET / POST /api/conversations/:conversation_id/messages` — Listar (paginado) y enviar mensajes (`contenido`, `reply_to_message_id`, `shared_post_id`, `forwarded`)
- `PATCH /api/conversations/:conversation_id/accept` y `DELETE /api/conversations/:conversation_id/request` — Solicitudes de mensaje
- `POST /api/conversations/groups`, `PATCH /api/conversations/:conversation_id/group`, `POST /api/conversations/:conversation_id/participants`, `DELETE /api/conversations/:conversation_id/participants/:user_id`, `PATCH /api/conversations/:conversation_id/participants/:user_id/role`, `DELETE /api/conversations/:conversation_id/members/me` — Grupos
- `DELETE /api/messages/:message_id` — Eliminar mensaje propio

### Notificaciones (`/api/notifications`)
- `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:notification_id/read`, `DELETE /api/notifications/:notification_id`, `DELETE /api/notifications`

---

## 10. Swagger UI y colección Postman

- **Swagger UI (local):** `http://localhost:8080/api/docs`
- **Swagger UI (producción):** `https://backend-utn-seven.vercel.app/api/docs/`
- **OpenAPI JSON (producción):** `https://backend-utn-seven.vercel.app/api/docs.json`
- **Colección Postman v2.1 (80 requests):** [`docs/LOOP.postman_collection.json`](./docs/LOOP.postman_collection.json)

### Cómo importar y usar la colección Postman
1. Abrir Postman → **Import** → seleccionar `docs/LOOP.postman_collection.json`.
2. Verificar la variable de colección `base_url` (`http://localhost:8080` para local o `https://backend-utn-seven.vercel.app` para producción).
3. Ejecutar **Iniciar sesión (Login)**: el script de test guarda automáticamente `token` en las variables de colección.
4. Los requests de creación (`Crear publicación`, `Crear comunidad`, `Crear conversación`, `Crear grupo`, etc.) guardan sus IDs automáticamente para encadenar pruebas.

---

## 11. Despliegue y consideraciones locales

- **Backend desplegado (Vercel):** `https://backend-utn-seven.vercel.app`
- **Repositorio Backend (GitHub):** `https://github.com/luzmicol/backend-utn.git`
- **Repositorio Frontend (GitHub):** `https://github.com/luzmicol/frontend-utn-back.git`
- **Desarrollo local:** en `NODE_ENV=development` el correo de verificación utiliza el logo adjunto local (`cid:`) y en `production` utiliza la URL pública HTTPS del logo. Asegurarse de definir `URL_FRONTEND=http://localhost:5173` para evitar bloqueos de CORS en local.
