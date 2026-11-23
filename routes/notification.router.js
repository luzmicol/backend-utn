import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import {
    deleteNotification,
    getNotifications,
    getUnreadCount,
    markAllAsRead,
    markAsRead
} from '../controllers/notification.controller.js'

const notification_router = express.Router()

notification_router.use(authMiddleware)

notification_router.get('/', getNotifications)
notification_router.get('/unread-count', getUnreadCount)
notification_router.patch('/read-all', markAllAsRead)
notification_router.patch('/:notification_id/read', markAsRead)
notification_router.delete('/:notification_id', deleteNotification)

export default notification_router
