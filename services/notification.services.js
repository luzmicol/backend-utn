import mongoose from "mongoose"
import notification_repository from "../repositories/notification.repository.js"
import ServerError from "../utils/error.util.js"

async function notify({
    recipient_id,
    actor_id,
    tipo,
    post_id = null,
    comment_id = null,
    conversation_id = null,
    message_id = null
}) {
    if (!recipient_id || !actor_id) return null
    if (String(recipient_id) === String(actor_id)) return null

    try {
        return await notification_repository.create({
            recipient_id,
            actor_id,
            tipo,
            post_id,
            comment_id,
            conversation_id,
            message_id
        })
    } catch (error) {
        console.error('[Notification] Error creando notificacion:', error?.message || error)
        return null
    }
}

async function notifyMentions({
    actor_id,
    menciones = [],
    post_id = null,
    comment_id = null
}) {
    if (!Array.isArray(menciones) || menciones.length === 0) return

    const notifiedIds = new Set()

    for (const item of menciones) {
        const targetId = item?.fk_id_usuario?._id || item?.fk_id_usuario
        if (!targetId) continue
        const targetStr = String(targetId)
        if (targetStr === String(actor_id) || notifiedIds.has(targetStr)) continue

        notifiedIds.add(targetStr)
        await notify({
            recipient_id: targetId,
            actor_id,
            tipo: 'mention',
            post_id,
            comment_id
        })
    }
}

async function getMyNotifications(user_id, { page, limit } = {}) {
    return await notification_repository.getPaginatedByRecipient(user_id, { page, limit })
}

async function getUnreadCount(user_id) {
    const unread_count = await notification_repository.countUnreadByRecipient(user_id)
    return { unread_count }
}

async function markAsRead(notification_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(notification_id)) {
        throw new ServerError("Notification id invalido", 400)
    }

    const updated = await notification_repository.markAsReadByIdAndRecipient(
        notification_id,
        user_id
    )

    if (!updated) {
        throw new ServerError("Notificacion no encontrada", 404)
    }

    return updated
}

async function markAllAsRead(user_id) {
    await notification_repository.markAllAsReadByRecipient(user_id)
    return { unread_count: 0 }
}

async function deleteNotification(notification_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(notification_id)) {
        throw new ServerError("Notification id invalido", 400)
    }

    const deleted = await notification_repository.deleteByIdAndRecipient(
        notification_id,
        user_id
    )

    if (!deleted) {
        throw new ServerError("Notificacion no encontrada", 404)
    }

    return deleted
}

const notification_service = {
    notify,
    notifyMentions,
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteByPostId: (post_id) => notification_repository.deleteByPostId(post_id),
    deleteByPostIds: (post_ids) => notification_repository.deleteByPostIds(post_ids),
    deleteByCommentId: (comment_id) => notification_repository.deleteByCommentId(comment_id),
    deleteByMessageId: (message_id) => notification_repository.deleteByMessageId(message_id),
    deleteByActorAndPostAndType: (actor_id, post_id, tipo) =>
        notification_repository.deleteByActorAndPostAndType(actor_id, post_id, tipo),
    deleteByActorAndRecipientAndType: (actor_id, recipient_id, tipo) =>
        notification_repository.deleteByActorAndRecipientAndType(actor_id, recipient_id, tipo)
}

export default notification_service
