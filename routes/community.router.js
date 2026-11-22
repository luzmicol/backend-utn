import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import {
    create,
    getAll,
    getById,
    updateById,
    deleteById,
    getMyCommunities,
    joinCommunity,
    getMembers,
    leaveCommunity
} from '../controllers/community.controller.js'

const community_router = express.Router()

community_router.use(authMiddleware)

/**
 * @openapi
 * /api/communities:
 *   post:
 *     summary: Crea una comunidad publica y registra al creador como owner
 *     tags: [Communities]
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
 *                 maxLength: 50
 *               descripcion:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       '201':
 *         description: Comunidad creada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
community_router.post('/', create)

/**
 * @openapi
 * /api/communities:
 *   get:
 *     summary: Lista todas las comunidades activas
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Comunidades obtenidas correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
community_router.get('/', getAll)

/**
 * @openapi
 * /api/communities/me:
 *   get:
 *     summary: Lista las comunidades activas a las que pertenece el usuario autenticado
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Mis comunidades obtenidas correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
community_router.get('/me', getMyCommunities)

/**
 * @openapi
 * /api/communities/{community_id}:
 *   get:
 *     summary: Obtiene el detalle de una comunidad activa por ID
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: community_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Comunidad obtenida correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
community_router.get('/:community_id', getById)

/**
 * @openapi
 * /api/communities/{community_id}:
 *   put:
 *     summary: Edita una comunidad (solo creador)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: community_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 50
 *               descripcion:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       '200':
 *         description: Comunidad actualizada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
community_router.put('/:community_id', updateById)

/**
 * @openapi
 * /api/communities/{community_id}:
 *   delete:
 *     summary: Elimina logicamente una comunidad y oculta sus publicaciones (solo creador)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: community_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Comunidad eliminada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
community_router.delete('/:community_id', deleteById)

/**
 * @openapi
 * /api/communities/{community_id}/members:
 *   post:
 *     summary: Une al usuario autenticado a una comunidad activa
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: community_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '201':
 *         description: Te has unido a la comunidad correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
community_router.post('/:community_id/members', joinCommunity)

/**
 * @openapi
 * /api/communities/{community_id}/members:
 *   get:
 *     summary: Lista los miembros de una comunidad (requiere ser miembro)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: community_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Miembros de la comunidad obtenidos correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
community_router.get('/:community_id/members', getMembers)

/**
 * @openapi
 * /api/communities/{community_id}/members/me:
 *   delete:
 *     summary: Permite al usuario autenticado abandonar una comunidad
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: community_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Has abandonado la comunidad correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
community_router.delete('/:community_id/members/me', leaveCommunity)

export default community_router
