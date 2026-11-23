import Notification from "../models/notification.model.js"

class NotificationRepository {
    async create({
        recipient_id,
        actor_id,
        tipo,
        post_id = null,
        comment_id = null,
        conversation_id = null,
        message_id = null
    }) {
        return await Notification.create({
            fk_id_destinatario: recipient_id,
            fk_id_emisor: actor_id,
            tipo,
            fk_id_publicacion: post_id,
            fk_id_comentario: comment_id,
            fk_id_conversacion: conversation_id,
            fk_id_mensaje: message_id
        })
    }

    async getPaginatedByRecipient(user_id, { page = 1, limit = 20 } = {}) {
        const safePage = Math.max(Number(page) || 1, 1)
        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50)
        const skip = (safePage - 1) * safeLimit

        const filter = { fk_id_destinatario: user_id }

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .sort({ fecha_creacion: -1 })
                .skip(skip)
                .limit(safeLimit)
                .populate({
                    path: 'fk_id_emisor',
                    match: { activo: true },
                    select: 'nombre username avatar_url'
                }),
            Notification.countDocuments(filter)
        ])

        return {
            notifications: notifications.filter((n) => n.fk_id_emisor),
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                has_more: skip + notifications.length < total
            }
        }
    }

    async countUnreadByRecipient(user_id) {
        return await Notification.countDocuments({
            fk_id_destinatario: user_id,
            leida: false
        })
    }

    async markAsReadByIdAndRecipient(notification_id, user_id) {
        return await Notification.findOneAndUpdate(
            { _id: notification_id, fk_id_destinatario: user_id },
            { leida: true },
            { returnDocument: 'after' }
        ).populate('fk_id_emisor', 'nombre username avatar_url')
    }

    async markAllAsReadByRecipient(user_id) {
        return await Notification.updateMany(
            { fk_id_destinatario: user_id, leida: false },
            { leida: true }
        )
    }

    async deleteByIdAndRecipient(notification_id, user_id) {
        return await Notification.findOneAndDelete({
            _id: notification_id,
            fk_id_destinatario: user_id
        })
    }

    async deleteAllByRecipient(user_id) {
        return await Notification.deleteMany({
            fk_id_destinatario: user_id
        })
    }

    async deleteByPostId(post_id) {
        return await Notification.deleteMany({ fk_id_publicacion: post_id })
    }

    async deleteByPostIds(post_ids) {
        if (!Array.isArray(post_ids) || post_ids.length === 0) return
        return await Notification.deleteMany({ fk_id_publicacion: { $in: post_ids } })
    }

    async deleteByCommentId(comment_id) {
        return await Notification.deleteMany({ fk_id_comentario: comment_id })
    }

    async deleteByMessageId(message_id) {
        return await Notification.deleteMany({ fk_id_mensaje: message_id })
    }

    async deleteByActorAndPostAndType(actor_id, post_id, tipo) {
        return await Notification.deleteMany({
            fk_id_emisor: actor_id,
            fk_id_publicacion: post_id,
            tipo
        })
    }

    async deleteByActorAndRecipientAndType(actor_id, recipient_id, tipo) {
        return await Notification.deleteMany({
            fk_id_emisor: actor_id,
            fk_id_destinatario: recipient_id,
            tipo
        })
    }
}

const notification_repository = new NotificationRepository()

export default notification_repository
