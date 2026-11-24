import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import {
    deleteAllNotifications,
    deleteNotification,
    getNotifications,
    getUnreadCount,
    markAllAsRead,
    markAsRead
} from '../controllers/notification.controller.js'

const notification_router = express.Router()

notification_router.use(authMiddleware)

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Lista las notificaciones paginadas del usuario autenticado
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       '200':
 *         description: Notificaciones obtenidas correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     summary: Elimina todas las notificaciones del usuario autenticado
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Todas las notificaciones fueron eliminadas correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
notification_router.get('/', getNotifications)

/**
 * @openapi
 * /api/notifications/unread-count:
 *   get:
 *     summary: Obtiene la cantidad de notificaciones sin leer
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Contador obtenido correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
notification_router.get('/unread-count', getUnreadCount)

/**
 * @openapi
 * /api/notifications/read-all:
 *   patch:
 *     summary: Marca todas las notificaciones del usuario como leidas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Todas las notificaciones fueron marcadas como leidas
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
notification_router.patch('/read-all', markAllAsRead)

/**
 * @openapi
 * /api/notifications/{notification_id}/read:
 *   patch:
 *     summary: Marca una notificacion especifica como leida
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Notificacion marcada como leida
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         description: Notificacion no encontrada
 */
notification_router.patch('/:notification_id/read', markAsRead)
notification_router.delete('/', deleteAllNotifications)

/**
 * @openapi
 * /api/notifications/{notification_id}:
 *   delete:
 *     summary: Elimina una notificacion propia
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Notificacion eliminada correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         description: Notificacion no encontrada
 */
notification_router.delete('/:notification_id', deleteNotification)

export default notification_router
