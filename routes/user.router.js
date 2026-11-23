import express from 'express'
import {
    deleteMyAvatar,
    getMe,
    getUserById,
    getUsers,
    updateMe,
    uploadMyAvatar
} from '../controllers/user.controller.js'
import {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStatus
} from '../controllers/follow.controller.js'
import { getUserReposts } from '../controllers/repost.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'
import { uploadSingleImage } from '../middlewares/upload.middleware.js'

const user_router = express.Router()

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Trae la lista de todos los usuarios
 *     description: >
 *       Devuelve todos los usuarios de la DB en formato publico (sin password ni campos sensibles).
 *       Requiere estar autenticado con JWT.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de usuarios obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Get users list
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserPublic'
 *             examples:
 *               lista_usuarios:
 *                 summary: Lista de usuarios
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Get users list
 *                   data:
 *                     users:
 *                       - _id: 691f2a1b8c9d3e4f5a6b7c8d
 *                         nombre: Juan Perez
 *                         email: juan.perez@mail.com
 *                         fecha_creacion: 2026-11-17T12:00:00.000Z
 *                         activo: true
 *                         email_verificado: true
 *       '400':
 *         description: Header Authorization ausente o malformado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
user_router.get(
    '/',
    authMiddleware,
    getUsers
)

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Obtiene el perfil propio del usuario autenticado (incluye email)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Perfil del usuario autenticado obtenido
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
user_router.get(
    '/me',
    authMiddleware,
    getMe
)

/**
 * @openapi
 * /api/users/me:
 *   put:
 *     summary: Actualiza el nombre del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *     responses:
 *       '200':
 *         description: Perfil actualizado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
user_router.put(
    '/me',
    authMiddleware,
    updateMe
)

/**
 * @openapi
 * /api/users/me/avatar:
 *   post:
 *     summary: Sube o reemplaza la foto de perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Avatar actualizado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
user_router.post(
    '/me/avatar',
    authMiddleware,
    uploadSingleImage('avatar'),
    uploadMyAvatar
)

/**
 * @openapi
 * /api/users/me/avatar:
 *   delete:
 *     summary: Elimina la foto de perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Avatar eliminado correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
user_router.delete(
    '/me/avatar',
    authMiddleware,
    deleteMyAvatar
)

/**
 * @openapi
 * /api/users/{user_id}:
 *   get:
 *     summary: Trae los datos de un usuario por id
 *     description: >
 *       Devuelve el detalle de un usuario segun su ObjectId de MongoDB en formato publico
 *       (sin password ni campos sensibles). Requiere estar autenticado con JWT.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/user_id'
 *     responses:
 *       '200':
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Get user details successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserPublic'
 *             examples:
 *               usuario_encontrado:
 *                 summary: Detalle del usuario
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Get user details successfully
 *                   data:
 *                     user:
 *                       _id: 691f2a1b8c9d3e4f5a6b7c8d
 *                       nombre: Juan Perez
 *                       email: juan.perez@mail.com
 *                       fecha_creacion: 2026-11-17T12:00:00.000Z
 *                       activo: true
 *                       email_verificado: true
 *       '400':
 *         description: ID de usuario invalido o header Authorization ausente/malformado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_encontrado:
 *                 summary: No existe un usuario con ese id
 *                 value:
 *                   ok: false
 *                   status: 404
 *                   message: User not found
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
user_router.get(
    '/:user_id',
    authMiddleware,
    getUserById
)

/**
 * @openapi
 * /api/users/{user_id}/follow:
 *   post:
 *     summary: Sigue a otro usuario
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/user_id'
 *     responses:
 *       '201':
 *         description: Ahora sigues a este usuario
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
user_router.post(
    '/:user_id/follow',
    authMiddleware,
    followUser
)

/**
 * @openapi
 * /api/users/{user_id}/follow:
 *   delete:
 *     summary: Deja de seguir a un usuario
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/user_id'
 *     responses:
 *       '200':
 *         description: Has dejado de seguir a este usuario
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
user_router.delete(
    '/:user_id/follow',
    authMiddleware,
    unfollowUser
)

/**
 * @openapi
 * /api/users/{user_id}/follow:
 *   get:
 *     summary: Consulta si el usuario autenticado sigue a otro usuario
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/user_id'
 *     responses:
 *       '200':
 *         description: Estado de seguimiento obtenido correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
user_router.get(
    '/:user_id/follow',
    authMiddleware,
    getFollowStatus
)

/**
 * @openapi
 * /api/users/{user_id}/followers:
 *   get:
 *     summary: Lista los seguidores de un usuario
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/user_id'
 *     responses:
 *       '200':
 *         description: Seguidores obtenidos correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
user_router.get(
    '/:user_id/followers',
    authMiddleware,
    getFollowers
)

/**
 * @openapi
 * /api/users/{user_id}/following:
 *   get:
 *     summary: Lista los usuarios que sigue un usuario
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/user_id'
 *     responses:
 *       '200':
 *         description: Usuarios seguidos obtenidos correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
user_router.get(
    '/:user_id/following',
    authMiddleware,
    getFollowing
)

user_router.get(
    '/:user_id/reposts',
    authMiddleware,
    getUserReposts
)

export default user_router
