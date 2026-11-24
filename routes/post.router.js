import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import { uploadOptionalSingleImage } from '../middlewares/upload.middleware.js'
import {
    create,
    getAll,
    getById,
    updateById,
    deleteById
} from '../controllers/post.controller.js'
import {
    likePost,
    unlikePost,
    getLikesInfo
} from '../controllers/like.controller.js'
import {
    createComment,
    getComments,
    deleteComment
} from '../controllers/comment.controller.js'
import {
    repostPost,
    unrepostPost,
    getRepostsInfo
} from '../controllers/repost.controller.js'
import {
    bookmarkPost,
    unbookmarkPost
} from '../controllers/bookmark.controller.js'

const post_router = express.Router()

post_router.use(authMiddleware)

/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Crea una publicacion en LOOP
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 maxLength: 2000
 *               fk_id_comunidad:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '201':
 *         description: Publicacion creada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.post('/', uploadOptionalSingleImage('imagen', { maxBytes: 5 * 1024 * 1024 }), create)

/**
 * @openapi
 * /api/posts:
 *   get:
 *     summary: Lista publicaciones activas del feed general
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Feed de publicaciones obtenido correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
post_router.get('/', getAll)

/**
 * @openapi
 * /api/posts/{post_id}:
 *   get:
 *     summary: Obtiene una publicacion activa por ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Publicacion obtenida correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.get('/:post_id', getById)

/**
 * @openapi
 * /api/posts/{post_id}:
 *   put:
 *     summary: Edita una publicacion propia
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
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
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       '200':
 *         description: Publicacion actualizada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.put('/:post_id', uploadOptionalSingleImage('imagen', { maxBytes: 5 * 1024 * 1024 }), updateById)

/**
 * @openapi
 * /api/posts/{post_id}:
 *   delete:
 *     summary: Elimina logicamente una publicacion propia
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Publicacion eliminada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.delete('/:post_id', deleteById)

/**
 * @openapi
 * /api/posts/{post_id}/likes:
 *   post:
 *     summary: Registra un like en una publicacion
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '201':
 *         description: Like registrado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.post('/:post_id/likes', likePost)

/**
 * @openapi
 * /api/posts/{post_id}/likes:
 *   delete:
 *     summary: Quita el like propio de una publicacion
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Like eliminado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.delete('/:post_id/likes', unlikePost)

/**
 * @openapi
 * /api/posts/{post_id}/likes:
 *   get:
 *     summary: Obtiene cantidad de likes y si el usuario autenticado dio like
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Informacion de likes obtenida correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.get('/:post_id/likes', getLikesInfo)

/**
 * @openapi
 * /api/posts/{post_id}/comments:
 *   post:
 *     summary: Crea un comentario en una publicacion
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
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
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       '201':
 *         description: Comentario creado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.post('/:post_id/comments', createComment)

/**
 * @openapi
 * /api/posts/{post_id}/comments:
 *   get:
 *     summary: Lista comentarios activos de una publicacion
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Comentarios obtenidos correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.get('/:post_id/comments', getComments)

/**
 * @openapi
 * /api/posts/{post_id}/comments/{comment_id}:
 *   delete:
 *     summary: Elimina logicamente un comentario propio
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: comment_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Comentario eliminado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.delete('/:post_id/comments/:comment_id', deleteComment)

/**
 * @openapi
 * /api/posts/{post_id}/reposts:
 *   post:
 *     summary: Hace repost de una publicacion
 *     tags: [Reposts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '201':
 *         description: Repost creado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '409':
 *         description: El usuario ya hizo repost de esta publicacion
 *   delete:
 *     summary: Quita el repost de una publicacion
 *     tags: [Reposts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Repost eliminado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   get:
 *     summary: Obtiene el conteo de reposts y si el usuario autenticado hizo repost
 *     tags: [Reposts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Informacion de reposts obtenida correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
post_router.post('/:post_id/reposts', repostPost)
post_router.delete('/:post_id/reposts', unrepostPost)
post_router.get('/:post_id/reposts', getRepostsInfo)

/**
 * @openapi
 * /api/posts/{post_id}/bookmarks:
 *   post:
 *     summary: Guarda una publicacion en los guardados privados del usuario autenticado
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '201':
 *         description: Publicacion guardada correctamente
 *       '200':
 *         description: La publicacion ya estaba guardada (idempotente)
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Quita una publicacion de los guardados privados del usuario autenticado
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Publicacion quitada de guardados
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
post_router.post('/:post_id/bookmarks', bookmarkPost)
post_router.delete('/:post_id/bookmarks', unbookmarkPost)

export default post_router
