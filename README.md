# LOOP — Backend API

API REST de **LOOP**, red social Full Stack desarrollada como Trabajo Integrador Final de la diplomatura Full Stack UTN. Permite gestionar cuentas con verificación por correo electrónico, perfiles públicos, publicaciones de texto e imagen, comunidades con roles y membresías, interacciones sociales (likes, comentarios, reposts, menciones y seguidores), mensajería privada con estados de entrega/lectura y notificaciones.

---

## 1. Tecnologías utilizadas

- **Runtime y Framework:** Node.js (ESM), Express `^5.2.1`
- **Base de datos y ODM:** MongoDB, Mongoose `^9.10.1`
- **Seguridad y autenticación:** `jsonwebtoken` (JWT Bearer), `bcrypt` (hash de contraseñas), `cors`, `express-rate-limit`
- **Correos electrónicos:** `nodemailer` (Gmail SMTP)
- **Carga y optimización de imágenes:** `multer`, `sharp`, `@vercel/blob`
- **Variables de entorno y utilidades:** `dotenv`, `uuid`
- **Documentación OpenAPI:** `swagger-jsdoc`, `swagger-ui-express`

---

## 2. Arquitectura por capas

El proyecto respeta una arquitectura estricta en capas:

```
Request → routes/ → middlewares/ → controllers/ → services/ → repositories/ → models/ (MongoDB)
```

- **`routes/`:** define las rutas HTTP, aplica middlewares (`authMiddleware`, `uploadSingleImage`, `express-rate-limit`) y delega al controlador.
- **`controllers/`:** extrae datos de `request` (`params`, `query`, `body`, `file`, `user`), invoca al servicio y formatea la respuesta HTTP (`ok`, `status`, `message`, `data`).
- **`services/`:** concentra la lógica de negocio, validaciones de dominio, reglas de permisos/autoría, orquestación de notificaciones, almacenamiento en Blob y limpiezas en cascada.
- **`repositories/`:** encapsula todas las consultas y agregaciones sobre los modelos de Mongoose.
- **`models/`:** define los esquemas, relaciones (`ObjectId` + `ref`), índices y transformaciones (`toJSON`).
- **`middlewares/`:** autenticación JWT (`auth.middleware.js`), manejo centralizado de errores (`error.middleware.js`), registro de consultas (`logger.middleware.js`) y carga de imágenes (`upload.middleware.js`).

---

## 3. Estructura de carpetas

```text
Backend/
├── config/               # Conexión MongoDB, CORS, variables de entorno y Nodemailer
├── controllers/          # Controladores HTTP por módulo
├── docs/                 # Configuración OpenAPI / Swagger
├── middlewares/          # Auth JWT, errores, logger, Multer
├── models/               # Esquemas Mongoose e índices
├── repositories/         # Acceso a datos y agregaciones MongoDB
├── routes/               # Routers Express por recurso
├── services/             # Lógica de negocio y reglas de permisos
├── utils/                # bcrypt, ServerError, menciones y plantillas de email
├── .env.example          # Plantilla de variables de entorno
├── main.js               # Punto de entrada Express (local y Vercel serverless)
├── package.json
└── vercel.json           # Configuración de despliegue en Vercel
```

---

## 4. Instalación y ejecución local

### Requisitos previos
- Node.js `>= 18`
- Acceso a una base de datos MongoDB (local o MongoDB Atlas)

### Pasos
```bash
# 1. Clonar el repositorio
git clone https://github.com/luzmicol/backend-utn.git
cd backend-utn

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Completar .env con tus valores reales

# 4. Iniciar en modo desarrollo (con recarga automática)
npm run dev

# O iniciar en modo normal
npm start
```

El servidor queda disponible en `http://localhost:8080` (o el puerto definido en `PORT`).

---

## 5. Variables de entorno

Tomar como referencia [`.env.example`](./.env.example). **Nunca subir `.env` al repositorio.**

| Variable | Obligatoria | Descripción | Ejemplo ficticio |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Puerto local de Express (por defecto `8080`). | `8080` |
| `NODE_ENV` | No | Entorno (`development` \| `production`). | `development` |
| `MONGO_DB_URI` | Sí | URI de conexión a MongoDB. | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGO_DB_NAME` | Sí | Nombre de la base de datos en MongoDB. | `loop_db` |
| `JWT_SECRET_KEY` | Sí | Clave secreta para firmar y verificar JWT. | `secreto_largo_y_aleatorio` |
| `GMAIL_USER` | Sí | Cuenta Gmail remitente para Nodemailer. | `tu_correo@gmail.com` |
| `GMAIL_PASSWORD` | Sí | App Password de Gmail. | `xxxx_xxxx_xxxx_xxxx` |
| `URL_FRONTEND` | Sí | Única URL base del frontend (sin comas ni barra final) para enlaces de email y CORS. | `http://localhost:5173` |
| `CORS_ORIGINS` | No | Orígenes adicionales permitidos por CORS separados por coma. | `https://preview.vercel.app` |
| `URL_BACKEND` | No | URL pública del backend para documentación Swagger. | `http://localhost:8080` |
| `BLOB_READ_WRITE_TOKEN` | Sí* | Token de Vercel Blob (*obligatoria para subir avatares e imágenes). | `vercel_blob_rw_placeholder` |
| `IP_BLACKLIST` | No | Lista de IPs bloqueadas globalmente separadas por coma. Si queda vacía, no bloquea accesos. | `203.0.113.10,198.51.100.5` |
| `IP_WHITELIST` | No | Lista de IPs permitidas separadas por coma para rutas protegidas con whitelist (ej. `/api/docs`). Si queda vacía, no restringe. | `127.0.0.1,::1` |
| `API_KEY` | No | Clave secreta para integraciones técnicas vía header `x-api-key` (ej. `GET /api/system/status`). No reemplaza JWT. | `clave_api_larga_y_aleatoria` |

---

## 6. Base de datos y modelos principales

La conexión se gestiona en `config/mongo.config.js` con caché compatible con Vercel Serverless y middleware `ensureDatabaseConnection` por request.

- **`Usuario` (`user.model.js`):** `nombre`, `username` *(único, sparse)*, `email` *(único)*, `password` *(hash bcrypt, excluido en `toJSON`)*, `avatar_url`, `email_verificado`, `activo`, `password_reset_jti`.
- **`Publicacion` (`post.model.js`):** entidad principal. `contenido`, `imagen_url`, `fk_id_usuario` *(ref `Usuario`)*, `fk_id_comunidad` *(ref `Comunidad`, opcional)*, `menciones`, `activo`, `fecha_creacion`.
- **`Comunidad` (`community.model.js`):** entidad relacionada. `nombre`, `descripcion`, `imagen_url`, `fk_id_creador` *(ref `Usuario`)*, `activa`, `fecha_creacion`.
- **`MiembroComunidad` (`communityMember.model.js`):** relación usuario-comunidad con `rol` (`user`, `admin`, `owner`) e índice único `{ fk_id_usuario, fk_id_comunidad }`.
- **Modelos sociales adicionales:** `Like`, `Comentario`, `Repost`, `Follow`, `Conversacion`, `Mensaje` (con `entregado_a` y `leido_por`), `Notificacion` y `QueryLog` (con índice TTL de 30 días).

---

## 7. Autenticación y seguridad

- **Hash de contraseñas:** `bcrypt` con 12 rounds (`utils/bcrypt.util.js`).
- **Verificación de email:** al registrarse se firma un JWT con `purpose: "email-verification"` (expiración 24h) y se envía por Nodemailer con plantilla HTML de LOOP + logo inline CID. `POST /api/auth/verify` valida el propósito y activa `email_verificado: true`.
- **Login y JWT Bearer:** `POST /api/auth/login` exige cuenta verificada y devuelve un JWT con vencimiento. Las rutas protegidas requieren el header `Authorization: Bearer <token>`.
- **Recuperación de contraseña:** token de uso único (`purpose: "password-reset"`, expiración 15m, `jti` almacenado en DB) protegido con rate limiting.
- **Rate limiting:** aplicado en `/api/auth/forgot-password` y `/api/auth/verify-email/:email/resend` con `trust proxy = 1`.
- **Subida segura de imágenes:** `multer` en memoria + validación real de magic bytes con `sharp` (solo JPG, PNG y WebP), redimensionamiento y compresión WebP en Vercel Blob.

---

## 8. Documentación de endpoints

### Salud y documentación
| Método | Ruta | Auth | Descripción |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | Pública | Verifica que la API esté activa. |
| `GET` | `/api/docs` | Pública | Interfaz interactiva Swagger UI. |
| `GET` | `/api/docs.json` | Pública | Especificación OpenAPI en JSON. |

### Autenticación (`/api/auth`)
| Método | Ruta | Auth | Descripción | Parámetros / Body |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/register` | Pública | Registra usuario y envía email de verificación | Body: `{ username, email, password }` |
| `POST` | `/api/auth/login` | Pública | Inicia sesión y devuelve JWT | Body: `{ email, password }` |
| `POST` | `/api/auth/verify` | Pública | Verifica la cuenta con el token recibido | Body: `{ verification_token }` |
| `GET` | `/api/auth/verify-email/:email/resend` | Pública | Reenvía email de verificación (rate limited) | Param: `email` |
| `POST` | `/api/auth/forgot-password` | Pública | Solicita correo de recuperación (rate limited) | Body: `{ email }` |
| `POST` | `/api/auth/reset-password` | Pública | Restablece contraseña con token único | Body: `{ reset_token, password }` |

### Publicaciones (`/api/posts`) — Entidad principal
| Método | Ruta | Auth | Descripción | Parámetros / Body / Query |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/posts` | JWT | Crea publicación (texto y/o imagen) | JSON o `multipart/form-data`: `contenido`, `fk_id_comunidad`, `imagen` |
| `GET` | `/api/posts` | JWT | Lista publicaciones paginadas con likes/reposts | Query: `page`, `limit` (máx. 50), `user_id`, `community_id` |
| `GET` | `/api/posts/:post_id` | JWT | Obtiene el detalle de una publicación | Param: `post_id` |
| `PUT` | `/api/posts/:post_id` | JWT (autor) | Edita contenido/imagen de publicación | JSON o `multipart/form-data`: `contenido`, `imagen`, `remove_image` |
| `DELETE` | `/api/posts/:post_id` | JWT (autor) | Soft-delete de publicación y limpieza en cascada | Param: `post_id` |
| `POST` | `/api/posts/:post_id/likes` | JWT | Da like a una publicación | Param: `post_id` |
| `DELETE` | `/api/posts/:post_id/likes` | JWT | Quita el like | Param: `post_id` |
| `GET` | `/api/posts/:post_id/likes` | JWT | Obtiene conteo y estado de like | Param: `post_id` |
| `POST` | `/api/posts/:post_id/comments` | JWT | Crea comentario (con menciones) | Body: `{ contenido }` |
| `GET` | `/api/posts/:post_id/comments` | JWT | Lista comentarios activos de la publicación | Param: `post_id` |
| `DELETE` | `/api/posts/:post_id/comments/:comment_id` | JWT (autor) | Soft-delete de comentario | Params: `post_id`, `comment_id` |
| `POST` | `/api/posts/:post_id/reposts` | JWT | Repostea publicación | Param: `post_id` |
| `DELETE` | `/api/posts/:post_id/reposts` | JWT | Deshace repost | Param: `post_id` |
| `GET` | `/api/posts/:post_id/reposts` | JWT | Obtiene conteo y último repost | Param: `post_id` |

### Comunidades (`/api/communities`) — Segunda entidad relacionada
| Método | Ruta | Auth | Descripción | Parámetros / Body |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/communities` | JWT | Crea comunidad y asigna `owner` al creador | Body: `{ nombre, descripcion }` |
| `GET` | `/api/communities` | JWT | Lista comunidades activas con `members_count` | — |
| `GET` | `/api/communities/me` | JWT | Lista comunidades del usuario autenticado | — |
| `GET` | `/api/communities/:community_id` | JWT | Obtiene detalle de una comunidad | Param: `community_id` |
| `PUT` | `/api/communities/:community_id` | JWT (`owner`) | Edita nombre y descripción | Body: `{ nombre, descripcion }` |
| `DELETE` | `/api/communities/:community_id` | JWT (`owner`) | Elimina comunidad y limpia datos en cascada | Param: `community_id` |
| `PATCH` | `/api/communities/:community_id/image` | JWT (`owner`) | Sube o reemplaza imagen de comunidad | `multipart/form-data`: `imagen` |
| `DELETE` | `/api/communities/:community_id/image` | JWT (`owner`) | Elimina imagen de comunidad | Param: `community_id` |
| `POST` | `/api/communities/:community_id/members` | JWT | Une al usuario a la comunidad | Param: `community_id` |
| `GET` | `/api/communities/:community_id/members` | JWT (miembro) | Lista miembros de la comunidad | Param: `community_id` |
| `DELETE` | `/api/communities/:community_id/members/me` | JWT | Abandona la comunidad | Param: `community_id` |

### Usuarios y seguidores (`/api/users`)
| Método | Ruta | Auth | Descripción | Parámetros / Body / Query |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/users` | JWT | Lista usuarios públicos activos | — |
| `GET` | `/api/users/username-availability` | Pública | Verifica disponibilidad de un `@username` | Query: `username` |
| `GET` | `/api/users/search` | JWT | Busca usuarios por nombre o username | Query: `q`, `limit` |
| `GET` | `/api/users/me` | JWT | Obtiene perfil del usuario autenticado | — |
| `PUT` | `/api/users/me` | JWT | Actualiza nombre del perfil | Body: `{ nombre }` |
| `PUT` | `/api/users/me/username` | JWT | Cambia `@username` (cada 7 días) | Body: `{ username }` |
| `POST` | `/api/users/me/avatar` | JWT | Sube o reemplaza avatar | `multipart/form-data`: `avatar` |
| `DELETE` | `/api/users/me/avatar` | JWT | Elimina avatar actual | — |
| `GET` | `/api/users/:user_id` | JWT | Obtiene perfil público de un usuario | Param: `user_id` |
| `POST` | `/api/users/:user_id/follow` | JWT | Sigue a un usuario | Param: `user_id` |
| `DELETE` | `/api/users/:user_id/follow` | JWT | Deja de seguir | Param: `user_id` |
| `GET` | `/api/users/:user_id/follow` | JWT | Consulta si el usuario autenticado lo sigue | Param: `user_id` |
| `GET` | `/api/users/:user_id/followers` | JWT | Lista seguidores | Param: `user_id` |
| `GET` | `/api/users/:user_id/following` | JWT | Lista seguidos | Param: `user_id` |
| `GET` | `/api/users/:user_id/reposts` | JWT | Lista publicaciones reposteadas por el usuario | Param: `user_id` |

### Mensajes privados (`/api/conversations` y `/api/messages`)
| Método | Ruta | Auth | Descripción | Parámetros / Body / Query |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/conversations` | JWT | Crea o recupera conversación 1-a-1 | Body: `{ participant_id }` |
| `GET` | `/api/conversations` | JWT | Lista conversaciones con `unread_count` y registra entrega | — |
| `GET` | `/api/conversations/unread-count` | JWT | Total de mensajes no leídos | — |
| `PATCH` | `/api/conversations/:conversation_id/read` | JWT | Marca mensajes recibidos de esa conversación como vistos | Param: `conversation_id` |
| `GET` | `/api/conversations/:conversation_id/messages` | JWT | Obtiene mensajes paginados | Query: `page`, `limit` |
| `POST` | `/api/conversations/:conversation_id/messages` | JWT | Envía mensaje de texto | Body: `{ contenido }` |
| `DELETE` | `/api/messages/:message_id` | JWT (autor) | Soft-delete de mensaje propio y recalcula `ultimo_mensaje` | Param: `message_id` |

### Notificaciones (`/api/notifications`)
| Método | Ruta | Auth | Descripción | Parámetros / Query |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/notifications` | JWT | Lista notificaciones paginadas | Query: `page`, `limit` |
| `GET` | `/api/notifications/unread-count` | JWT | Cantidad de notificaciones sin leer | — |
| `PATCH` | `/api/notifications/read-all` | JWT | Marca todas como leídas | — |
| `PATCH` | `/api/notifications/:notification_id/read` | JWT | Marca una notificación como leída | Param: `notification_id` |
| `DELETE` | `/api/notifications` | JWT | Borra todas las notificaciones del usuario autenticado | — |
| `DELETE` | `/api/notifications/:notification_id` | JWT | Elimina una notificación propia | Param: `notification_id` |

---

## 9. Ejemplos de uso

### Login (`POST /api/auth/login`)
**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "miPassword123"
}
```
**Response (`200 OK`):**
```json
{
  "ok": true,
  "status": 200,
  "message": "You have logged in successfully",
  "data": {
    "authentication_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Crear publicación (`POST /api/posts`)
**Header:** `Authorization: Bearer <token>`
**Request:**
```json
{
  "contenido": "Hola LOOP!",
  "fk_id_comunidad": null
}
```
**Response (`201 Created`):**
```json
{
  "ok": true,
  "status": 201,
  "message": "Publicacion creada correctamente",
  "data": {
    "post": {
      "_id": "665f...",
      "contenido": "Hola LOOP!",
      "imagen_url": "",
      "fk_id_usuario": { "_id": "665e...", "nombre": "Ana", "username": "ana" }
    }
  }
}
```

---

## 10. Manejo de errores

Todos los errores controlados utilizan `ServerError` y son respondidos de forma centralizada por `errorHandlerMiddleware` con el formato:

```json
{
  "ok": false,
  "status": 400,
  "message": "Descripcion del error"
}
```

Códigos HTTP utilizados:
- `400 Bad Request`: datos faltantes, formato inválido o archivo no permitido.
- `401 Unauthorized`: token ausente, inválido o expirado.
- `403 Forbidden`: usuario autenticado sin permisos sobre el recurso (no es autor u `owner`).
- `404 Not Found`: recurso inexistente o inactivo.
- `409 Conflict`: violación de índice único (`E11000`, ej. email/like/repost/follow/membresía duplicados).
- `429 Too Many Requests`: límite de solicitudes superado (`code: "TOO_MANY_REQUESTS"`).
- `500` / `503`: error interno o servicio externo/DB no disponible.

---

## 11. Documentación interactiva (Swagger), Postman y despliegues

- **Swagger UI (local):** `http://localhost:8080/api/docs`
- **Swagger UI (producción):** `https://backend-utn-seven.vercel.app/api/docs/`
- **OpenAPI JSON (producción):** `https://backend-utn-seven.vercel.app/api/docs.json`
- **Colección Postman (v2.1):** [`docs/LOOP.postman_collection.json`](./docs/LOOP.postman_collection.json)
- **Backend desplegado (Vercel):** `https://backend-utn-seven.vercel.app`
- **Repositorio Backend (GitHub):** `https://github.com/luzmicol/backend-utn.git`
- **Repositorio Frontend (GitHub):** `https://github.com/luzmicol/frontend-utn-back.git`
