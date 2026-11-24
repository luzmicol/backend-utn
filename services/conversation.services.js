import mongoose from "mongoose"
import conversation_repository from "../repositories/conversation.repository.js"
import message_repository from "../repositories/message.repository.js"
import post_repository from "../repositories/post.repository.js"
import user_repository from "../repositories/user.repository.js"
import notification_service from "./notification.services.js"
import ServerError from "../utils/error.util.js"

const MAX_MESSAGE_LENGTH = 2000

function validateMessageContent(contenido) {
    if (contenido === undefined || contenido === null || typeof contenido !== "string") {
        throw new ServerError("contenido es un campo requerido y debe ser un texto", 400)
    }

    const trimmed = contenido.trim()

    if (trimmed.length === 0) {
        throw new ServerError("El mensaje no puede estar vacio", 400)
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
        throw new ServerError(`El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres`, 400)
    }

    return trimmed
}

async function getValidatedConversationForUser(conversation_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(conversation_id)) {
        throw new ServerError("Conversation id invalido", 400)
    }

    const conversation = await conversation_repository.getById(conversation_id)

    if (!conversation) {
        throw new ServerError("Conversacion no encontrada", 404)
    }

    const isParticipant = conversation.participantes.some(
        (participant) => String(participant._id || participant) === String(user_id)
    )

    if (!isParticipant) {
        throw new ServerError("No tienes permisos para acceder a esta conversacion", 403)
    }

    return conversation
}

async function createOrGetConversation(requester_id, target_user_id) {
    if (!target_user_id || typeof target_user_id !== "string" || !mongoose.Types.ObjectId.isValid(target_user_id)) {
        throw new ServerError("Usuario destino invalido", 400)
    }

    if (String(requester_id) === String(target_user_id)) {
        throw new ServerError("No puedes iniciar una conversacion contigo mismo", 400)
    }

    const target_user = await user_repository.getPublicById(target_user_id)

    if (!target_user || !target_user.activo) {
        throw new ServerError("Usuario no encontrado o inactivo", 404)
    }

    const key = conversation_repository.buildParticipantsKey(requester_id, target_user_id)
    const existing = await conversation_repository.findByParticipantsKey(key)

    if (existing) {
        return { conversation: existing, created: false }
    }

    try {
        const created = await conversation_repository.create(requester_id, target_user_id)
        return { conversation: created, created: true }
    } catch (error) {
        if (error && error.code === 11000) {
            const concurrent = await conversation_repository.findByParticipantsKey(key)
            if (concurrent) {
                return { conversation: concurrent, created: false }
            }
        }
        throw error
    }
}

async function getUserConversations(user_id) {
    const conversations = await conversation_repository.getAllByUserId(user_id)
    if (conversations.length === 0) return []

    const conversationIds = conversations.map((c) => c._id)
    const [, unreadMap] = await Promise.all([
        message_repository.markDeliveredForUser(conversationIds, user_id),
        message_repository.getUnreadCountsByConversationIds(conversationIds, user_id)
    ])

    return conversations.map((conv) => {
        const plain = typeof conv.toObject === 'function' ? conv.toObject() : { ...conv }
        return {
            ...plain,
            unread_count: unreadMap.get(String(plain._id)) ?? 0
        }
    })
}

async function getConversationMessages(conversation_id, requester_id, { page, limit } = {}) {
    const conversation = await getValidatedConversationForUser(conversation_id, requester_id)
    await message_repository.markDeliveredForUser([conversation._id], requester_id)

    return await message_repository.getByConversationPaginated(conversation_id, { page, limit })
}

async function sendMessage(conversation_id, requester_id, contenido, { shared_post_id = null } = {}) {
    const conversation = await getValidatedConversationForUser(conversation_id, requester_id)

    let tipo = 'text'
    let valid_contenido = ''
    let resolved_shared_post_id = null

    if (shared_post_id !== null && shared_post_id !== undefined && shared_post_id !== '') {
        if (!mongoose.Types.ObjectId.isValid(shared_post_id)) {
            throw new ServerError("ID de publicacion invalido", 400)
        }

        const post = await post_repository.getActiveById(shared_post_id)
        if (!post) {
            throw new ServerError("La publicacion no existe o ya no esta disponible", 404)
        }

        tipo = 'shared_post'
        resolved_shared_post_id = post._id

        if (typeof contenido === 'string' && contenido.trim()) {
            const trimmed = contenido.trim()
            if (trimmed.length > 2000) {
                throw new ServerError("El mensaje no puede superar los 2000 caracteres", 400)
            }
            valid_contenido = trimmed
        }
    } else {
        valid_contenido = validateMessageContent(contenido)
    }

    const message_created = await message_repository.create(
        conversation_id,
        requester_id,
        valid_contenido,
        { tipo, shared_post_id: resolved_shared_post_id }
    )

    const preview = valid_contenido || (tipo === 'shared_post' ? 'Publicacion compartida' : '')
    await conversation_repository.touchLastActivity(conversation_id, preview)

    const otherParticipant = conversation.participantes.find(
        (p) => String(p._id || p) !== String(requester_id)
    )
    if (otherParticipant) {
        await notification_service.notify({
            recipient_id: otherParticipant._id || otherParticipant,
            actor_id: requester_id,
            tipo: 'message',
            conversation_id: conversation._id,
            message_id: message_created._id
        })
    }

    return message_created
}

async function deleteMessage(message_id, requester_id) {
    if (!mongoose.Types.ObjectId.isValid(message_id)) {
        throw new ServerError("Message id invalido", 400)
    }

    const message = await message_repository.getActiveById(message_id)

    if (!message) {
        throw new ServerError("Mensaje no encontrado", 404)
    }

    if (!message.fk_id_remitente.equals(requester_id)) {
        throw new ServerError("No tienes permisos para eliminar este mensaje", 403)
    }

    const deleted = await message_repository.softDeleteById(message_id)

    const cleanupResults = await Promise.allSettled([
        notification_service.deleteByMessageId(message_id),
        (async () => {
            const latest_active = await message_repository.getLatestActiveByConversationId(
                message.fk_id_conversacion
            )
            await conversation_repository.updateLastMessagePreview(
                message.fk_id_conversacion,
                latest_active
                    ? (latest_active.contenido || (latest_active.tipo === 'shared_post' ? 'Publicacion compartida' : ''))
                    : ""
            )
        })()
    ])

    cleanupResults.forEach((result) => {
        if (result.status === 'rejected') {
            console.error('[ConversationService.deleteMessage] Error en limpieza posterior:', result.reason?.message || result.reason)
        }
    })

    return deleted
}

async function getUnreadCount(user_id) {
    const conversation_ids = await conversation_repository.getIdsByUserId(user_id)
    if (conversation_ids.length === 0) return 0

    await message_repository.markDeliveredForUser(conversation_ids, user_id)
    return await message_repository.countUnreadByConversationIds(conversation_ids, user_id)
}

async function markConversationAsRead(conversation_id, requester_id) {
    await getValidatedConversationForUser(conversation_id, requester_id)
    await message_repository.markConversationAsRead(conversation_id, requester_id)
    const unread_count = await getUnreadCount(requester_id)
    return { unread_count }
}

const conversation_service = {
    createOrGetConversation,
    getUserConversations,
    getConversationMessages,
    sendMessage,
    deleteMessage,
    getUnreadCount,
    markConversationAsRead
}

export default conversation_service
