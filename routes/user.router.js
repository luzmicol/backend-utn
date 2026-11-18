import express from 'express'
import { getUserById, getUsers } from '../controllers/user.controller.js'

const user_router = express.Router()

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Trae la lista de todos los usuarios
 *     description: >
 *       Devuelve todos los usuarios de la DB.
 *       El contrato documentado es el usuario en formato publico (SIN password);
 *       se anoto como bug pendiente que hoy el controller tambien expone el hash de password.
 *     tags: [Users]
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
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
user_router.get(
    '/',
    getUsers
)

/**
 * @openapi
 * /api/users/{user_id}:
 *   get:
 *     summary: Trae los datos de un usuario por id
 *     description: >
 *       Devuelve el detalle de un usuario segun su ObjectId de MongoDB.
 *       El contrato documentado es el usuario en formato publico (SIN password);
 *       se anoto como bug pendiente que hoy el controller tambien expone el hash de password.
 *     tags: [Users]
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
 *         description: Error inesperado o id con formato invalido (el CastError de Mongo no se captura hoy y cae como 500)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               error_generico:
 *                 summary: Error interno (tambien ocurre si el id no es un ObjectId valido)
 *                 value:
 *                   ok: false
 *                   status: 500
 *                   message: Internal server error
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
user_router.get(
    '/:user_id',
    getUserById
)

export default user_router
