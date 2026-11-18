import express from 'express'
import { getAll, create, getById, deleteById, updateById, getAllMembers } from '../controllers/workspace.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'
import channel_router from './channels.router.js'
import workspaceMiddleware from '../middlewares/workspace.middleware.js'

const workspace_router = express.Router()


/* 
(Authentified) GET /api/workspace
    Traer la lista de espacios de trabajo asocidadas a ese usuario (basicamente sus membresias), cada uno con su lista de miembros (nombre y rol)
*/

/**
 * @openapi
 * /api/workspaces:
 *   get:
 *     summary: Trae los espacios de trabajo del usuario autenticado
 *     description: >
 *       Devuelve la lista de espacios de trabajo donde el usuario autenticado es miembro
 *       (según sus membresias), y para cada uno la lista de sus miembros (nombre y rol).
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Espacios de trabajo del usuario con sus miembros
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
 *                   example: Obtenidos todos los datos
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspaces:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WorkspaceWithMembers'
 *             examples:
 *               con_workspaces:
 *                 summary: Usuario con espacios de trabajo
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Obtenidos todos los datos
 *                   data:
 *                     workspaces:
 *                       - _id: 691f2a1b8c9d3e4f5a6b7c8d
 *                         nombre: Proyecto UTN
 *                         fecha_creacion: 2026-11-17T12:00:00.000Z
 *                         members:
 *                           - nombre: Juan Perez
 *                             rol: owner
 *                           - nombre: Maria Gomez
 *                             rol: user
 *               sin_workspaces:
 *                 summary: Usuario sin membresias
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Obtenidos todos los datos
 *                   data:
 *                     workspaces: []
 *       '400':
 *         description: Header Authorization ausente o malformado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               header_ausente:
 *                 summary: Sin header Authorization
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is requered
 *               header_malformado:
 *                 summary: Header Authorization sin el token
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is malformed
 *       '401':
 *         description: Token invalido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               token_invalido:
 *                 summary: Token invalido, malformado o expirado
 *                 value:
 *                   ok: false
 *                   status: 401
 *                   message: Auth token is invalid!
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
workspace_router.get('/', authMiddleware, getAll)

/**
 * @openapi
 * /api/workspaces:
 *   post:
 *     summary: Crea un espacio de trabajo
 *     description: >
 *       Crea un espacio de trabajo para el usuario autenticado y automaticamente
 *       crea su membresia con el rol 'owner'.
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkspaceRequest'
 *           examples:
 *             valido:
 *               summary: Creacion valida
 *               value:
 *                 name: Proyecto UTN
 *                 description: Espacio de trabajo de la materia backend
 *     responses:
 *       '201':
 *         description: Espacio de trabajo y membresia owner creados
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
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Por ahora todo bien
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspace_created:
 *                       $ref: '#/components/schemas/Workspace'
 *                     owner_membership:
 *                       $ref: '#/components/schemas/MemberWithUser'
 *             examples:
 *               creado:
 *                 summary: Espacio de trabajo creado
 *                 value:
 *                   ok: true
 *                   status: 201
 *                   message: Por ahora todo bien
 *                   data:
 *                     workspace_created:
 *                       _id: 691f2a1b8c9d3e4f5a6b7c8d
 *                       nombre: Proyecto UTN
 *                       description: Espacio de trabajo de la materia backend
 *                       fecha_creacion: 2026-11-17T12:00:00.000Z
 *                     owner_membership:
 *                       _id: 692f2a1b8c9d3e4f5a6b7c8d
 *                       fk_id_usuario: 691f2a1b8c9d3e4f5a6b7c8d
 *                       fk_id_espacio_trabajo: 691f2a1b8c9d3e4f5a6b7c8d
 *                       rol: owner
 *                       fecha_creacion: 2026-11-17T12:00:00.000Z
 *       '400':
 *         description: Datos invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               name_requerido:
 *                 summary: Falta el name
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: name es un campo requerido
 *               header_ausente:
 *                 summary: Sin header Authorization
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is requered
 *               header_malformado:
 *                 summary: Header Authorization sin el token
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is malformed
 *       '401':
 *         description: Token invalido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               token_invalido:
 *                 summary: Token invalido, malformado o expirado
 *                 value:
 *                   ok: false
 *                   status: 401
 *                   message: Auth token is invalid!
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
workspace_router.post('/', authMiddleware, create)

/**
 * @openapi
 * /api/workspaces/{workspace_id}:
 *   get:
 *     summary: Trae un espacio de trabajo por id
 *     description: >
 *       Devuelve el detalle de un espacio de trabajo.
 *       Requiere estar autenticado Y ser miembro del espacio de trabajo (cualquier rol).
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workspace_id'
 *     responses:
 *       '200':
 *         description: Espacio de trabajo encontrado
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
 *                   example: Workspace obtenido correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspace_selected:
 *                       $ref: '#/components/schemas/Workspace'
 *             examples:
 *               obtenido:
 *                 summary: Espacio de trabajo
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Workspace obtenido correctamente
 *                   data:
 *                     workspace_selected:
 *                       _id: 691f2a1b8c9d3e4f5a6b7c8d
 *                       nombre: Proyecto UTN
 *                       description: Espacio de trabajo de la materia backend
 *                       fecha_creacion: 2026-11-17T12:00:00.000Z
 *       '400':
 *         description: Header Authorization ausente o malformado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               header_ausente:
 *                 summary: Sin header Authorization
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is requered
 *               header_malformado:
 *                 summary: Header Authorization sin el token
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is malformed
 *       '401':
 *         description: Token invalido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               token_invalido:
 *                 summary: Token invalido, malformado o expirado
 *                 value:
 *                   ok: false
 *                   status: 401
 *                   message: Auth token is invalid!
 *       '403':
 *         description: El usuario no es miembro del espacio de trabajo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_miembro:
 *                 summary: Sin membresia en ese workspace
 *                 value:
 *                   ok: false
 *                   status: 403
 *                   message: No eres miembro de este espacio de trabajo
 *       '404':
 *         description: Espacio de trabajo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_encontrado:
 *                 summary: No existe un workspace con ese id
 *                 value:
 *                   ok: false
 *                   status: 404
 *                   message: Workspace no encontrado
 *       '500':
 *         description: Error inesperado (tambien ocurre si el id no es un ObjectId valido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               error_generico:
 *                 summary: Error interno
 *                 value:
 *                   ok: false
 *                   status: 500
 *                   message: Internal server error
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
workspace_router.get(
    '/:workspace_id', 
    authMiddleware,
    workspaceMiddleware([]),
    getById
)

/**
 * @openapi
 * /api/workspaces/{workspace_id}/members:
 *   get:
 *     summary: Trae los miembros de un espacio de trabajo
 *     description: >
 *       Devuelve la lista de membresias del espacio de trabajo, cada una con los datos
 *       del usuario poblados (nombre y email).
 *       Requiere estar autenticado Y ser miembro del espacio de trabajo (cualquier rol).
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workspace_id'
 *     responses:
 *       '200':
 *         description: Miembros del espacio de trabajo
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
 *                   example: Obtenidos todos los miembros del espacio de trabajo
 *                 data:
 *                   type: object
 *                   properties:
 *                     members:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MemberWithUser'
 *             examples:
 *               con_miembros:
 *                 summary: Lista de membresias
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Obtenidos todos los miembros del espacio de trabajo
 *                   data:
 *                     members:
 *                       - _id: 692f2a1b8c9d3e4f5a6b7c8d
 *                         fk_id_usuario:
 *                           _id: 691f2a1b8c9d3e4f5a6b7c8d
 *                           nombre: Juan Perez
 *                           email: juan.perez@mail.com
 *                         fk_id_espacio_trabajo: 691f2a1b8c9d3e4f5a6b7c8d
 *                         rol: owner
 *                         fecha_creacion: 2026-11-17T12:00:00.000Z
 *       '400':
 *         description: Header Authorization ausente o malformado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               header_ausente:
 *                 summary: Sin header Authorization
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is requered
 *               header_malformado:
 *                 summary: Header Authorization sin el token
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is malformed
 *       '401':
 *         description: Token invalido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               token_invalido:
 *                 summary: Token invalido, malformado o expirado
 *                 value:
 *                   ok: false
 *                   status: 401
 *                   message: Auth token is invalid!
 *       '403':
 *         description: El usuario no es miembro del espacio de trabajo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_miembro:
 *                 summary: Sin membresia en ese workspace
 *                 value:
 *                   ok: false
 *                   status: 403
 *                   message: No eres miembro de este espacio de trabajo
 *       '404':
 *         description: Espacio de trabajo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_encontrado:
 *                 summary: No existe un workspace con ese id
 *                 value:
 *                   ok: false
 *                   status: 404
 *                   message: Workspace no encontrado
 *       '500':
 *         description: Error inesperado (tambien ocurre si el id no es un ObjectId valido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               error_generico:
 *                 summary: Error interno
 *                 value:
 *                   ok: false
 *                   status: 500
 *                   message: Internal server error
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
workspace_router.get(
    '/:workspace_id/members',
    authMiddleware,
    workspaceMiddleware([]),
    getAllMembers
)

/**
 * @openapi
 * /api/workspaces/{workspace_id}:
 *   delete:
 *     summary: Elimina un espacio de trabajo
 *     description: >
 *       Elimina el espacio de trabajo y todas sus membresias.
 *       Requiere estar autenticado Y tener el rol 'owner' en el espacio de trabajo.
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workspace_id'
 *     responses:
 *       '200':
 *         description: Espacio de trabajo eliminado (devuelve el documento eliminado)
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
 *                   example: Workspace eliminado correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspace_deleted:
 *                       $ref: '#/components/schemas/Workspace'
 *             examples:
 *               eliminado:
 *                 summary: Workspace eliminado
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Workspace eliminado correctamente
 *                   data:
 *                     workspace_deleted:
 *                       _id: 691f2a1b8c9d3e4f5a6b7c8d
 *                       nombre: Proyecto UTN
 *                       description: Espacio de trabajo de la materia backend
 *                       fecha_creacion: 2026-11-17T12:00:00.000Z
 *       '400':
 *         description: Header Authorization ausente o malformado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               header_ausente:
 *                 summary: Sin header Authorization
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is requered
 *               header_malformado:
 *                 summary: Header Authorization sin el token
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is malformed
 *       '401':
 *         description: Token invalido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               token_invalido:
 *                 summary: Token invalido, malformado o expirado
 *                 value:
 *                   ok: false
 *                   status: 401
 *                   message: Auth token is invalid!
 *       '403':
 *         description: Sin permisos (no es miembro, o es miembro pero no owner)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_miembro:
 *                 summary: Sin membresia en ese workspace
 *                 value:
 *                   ok: false
 *                   status: 403
 *                   message: No eres miembro de este espacio de trabajo
 *               sin_rol:
 *                 summary: Es miembro pero no tiene el rol 'owner'
 *                 value:
 *                   ok: false
 *                   status: 403
 *                   message: No tienes permisos suficientes para hacer esta operacion
 *       '404':
 *         description: Espacio de trabajo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_encontrado:
 *                 summary: No existe un workspace con ese id
 *                 value:
 *                   ok: false
 *                   status: 404
 *                   message: Workspace no encontrado
 *       '500':
 *         description: Error inesperado (tambien ocurre si el id no es un ObjectId valido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               error_generico:
 *                 summary: Error interno
 *                 value:
 *                   ok: false
 *                   status: 500
 *                   message: Internal server error
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
workspace_router.delete(
    '/:workspace_id',
    authMiddleware,
    workspaceMiddleware(['owner']),
    deleteById
)

/**
 * @openapi
 * /api/workspaces/{workspace_id}:
 *   put:
 *     summary: Actualiza un espacio de trabajo
 *     description: >
 *       Actualiza el nombre y la descripcion de un espacio de trabajo.
 *       Requiere estar autenticado Y tener el rol 'owner' o 'admin' en el espacio de trabajo.
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/workspace_id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkspaceRequest'
 *           examples:
 *             valido:
 *               summary: Actualizacion valida
 *               value:
 *                 name: Proyecto UTN 2.0
 *                 description: Descripcion actualizada del espacio
 *     responses:
 *       '200':
 *         description: Espacio de trabajo actualizado (devuelve el documento YA actualizado)
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
 *                   example: Workspace actualizado correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     workspace_updated:
 *                       $ref: '#/components/schemas/Workspace'
 *             examples:
 *               actualizado:
 *                 summary: Workspace actualizado
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Workspace actualizado correctamente
 *                   data:
 *                     workspace_updated:
 *                       _id: 691f2a1b8c9d3e4f5a6b7c8d
 *                       nombre: Proyecto UTN 2.0
 *                       description: Descripcion actualizada del espacio
 *                       fecha_creacion: 2026-11-17T12:00:00.000Z
 *       '400':
 *         description: Datos invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               campos_requeridos:
 *                 summary: Falta name o description
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: name y description son campos requeridos
 *               header_ausente:
 *                 summary: Sin header Authorization
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is requered
 *               header_malformado:
 *                 summary: Header Authorization sin el token
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Auth header is malformed
 *       '401':
 *         description: Token invalido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               token_invalido:
 *                 summary: Token invalido, malformado o expirado
 *                 value:
 *                   ok: false
 *                   status: 401
 *                   message: Auth token is invalid!
 *       '403':
 *         description: Sin permisos (no es miembro, o es miembro pero sin rol owner/admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_miembro:
 *                 summary: Sin membresia en ese workspace
 *                 value:
 *                   ok: false
 *                   status: 403
 *                   message: No eres miembro de este espacio de trabajo
 *               sin_rol:
 *                 summary: Es miembro pero su rol no es owner ni admin
 *                 value:
 *                   ok: false
 *                   status: 403
 *                   message: No tienes permisos suficientes para hacer esta operacion
 *       '404':
 *         description: Espacio de trabajo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_encontrado:
 *                 summary: No existe un workspace con ese id
 *                 value:
 *                   ok: false
 *                   status: 404
 *                   message: Workspace no encontrado
 *       '500':
 *         description: Error inesperado (tambien ocurre si el id no es un ObjectId valido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               error_generico:
 *                 summary: Error interno
 *                 value:
 *                   ok: false
 *                   status: 500
 *                   message: Internal server error
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
workspace_router.put(
    '/:workspace_id',
    authMiddleware,
    workspaceMiddleware(['owner', 'admin']),
    updateById
)


/* 
Crear los endpoints 

EJERCITACION PARA AHORA
- (owner) DELETE /api/workspace/:workspace_id => Elimina espacio de trabajo (HECHO)
- (owner, admin) PUT /api/workspace/:workspace_id => Actualizar nombre/descripcion del espacio de trabajo

Tarea:
- (todos) get /api/workspace/:workspace_id/members (HECHO)
- (owner, admin) DELETE /api/workspace/:workspace_id/members/:member_id
- (owner, admin) POST /api/workspace/:workspace_id/members/invite
    body: email (el email del usuario a invitar)
    - Revisar que el rol con el que se crea sea 'admin' o 'user'
    - Revisar que el usuario a invitar exista
    - Revisar que no este ya agregado al workspace (que tenga una membresia)
    - Crear la membresia con una propiedad 'invitacion_aceptada': false
    - Enviar un mail con un link para "aceptar invitacion" (debe tener una expiracion y debe enviar un token)
        - Ese link hara un GET hacia /api/workspace/:workspace_id/members/accept-invite/:invitation_token

- (todos) Unauthentified /api/workspace/:workspace_id/members/accept-invite/:invitation_token
    - Verifica que el invitation_token sea valido y edita la membersia para marcar que lo acepto
*/




/* workspace_router.use(
    '/:workspace_id/channels', 
    channel_router
) */

export default workspace_router


/* 
/api/workspace/:workspace_id/channels

*/
