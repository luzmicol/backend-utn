import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import { uploadSingleImage } from '../middlewares/upload.middleware.js'
import {
    create,
    getAll,
    getById,
    updateById,
    deleteById,
    getMyCommunities,
    joinCommunity,
    getMembers,
    leaveCommunity,
    updateImage,
    deleteImage,
    pinPost,
    unpinPost
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

/**
 * @openapi
 * /api/communities/{community_id}/image:
 *   patch:
 *     summary: Sube o reemplaza la imagen de perfil de una comunidad (solo owner)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: community_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [imagen]
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Imagen JPG, PNG o WebP (max. 10 MB)
 *     responses:
 *       '200':
 *         description: Imagen de comunidad actualizada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: Solo el owner puede modificar la imagen
 *       '404':
 *         description: Comunidad no encontrada
 *   delete:
 *     summary: Elimina la imagen de perfil de una comunidad (solo owner)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: community_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Imagen de comunidad eliminada correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: Solo el owner puede eliminar la imagen
 *       '404':
 *         description: Comunidad no encontrada
 */
community_router.patch('/:community_id/image', uploadSingleImage('imagen'), updateImage)
community_router.delete('/:community_id/image', deleteImage)

/**
 * @openapi
 * /api/communities/{community_id}/pin/{post_id}:
 *   put:
 *     summary: Fija una publicacion existente en la comunidad (solo owner)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: community_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Publicacion fijada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
community_router.put('/:community_id/pin/:post_id', pinPost)

/**
 * @openapi
 * /api/communities/{community_id}/pin:
 *   delete:
 *     summary: Desfija la publicacion fijada de la comunidad (solo owner)
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
 *         description: Publicacion desfijada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
community_router.delete('/:community_id/pin', unpinPost)

export default community_router
