import conversation_service from "../services/conversation.services.js"

export async function createOrGet(request, response) {
    const target_user_id = request.body?.participant_id ?? request.body?.user_id

    const { conversation, created } = await conversation_service.createOrGetConversation(
        request.user.id,
        target_user_id
    )

    const status = created ? 201 : 200

    return response.status(status).send({
        ok: true,
        status,
        message: created ? "Conversacion creada correctamente" : "Conversacion obtenida correctamente",
        data: {
            conversation
        }
    })
}

export async function getAll(request, response) {
    const conversations = await conversation_service.getUserConversations(request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Conversaciones obtenidas correctamente",
        data: {
            conversations
        }
    })
}

export async function getMessages(request, response) {
    const { conversation_id } = request.params
    const { page, limit } = request.query

    const result = await conversation_service.getConversationMessages(
        conversation_id,
        request.user.id,
        { page, limit }
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Mensajes obtenidos correctamente",
        data: result
    })
}

export async function sendMessage(request, response) {
    const { conversation_id } = request.params
    const contenido = request.body?.contenido

    const message = await conversation_service.sendMessage(
        conversation_id,
        request.user.id,
        contenido
    )

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "Mensaje enviado correctamente",
        data: {
            message
        }
    })
}

export async function getUnreadCount(request, response) {
    const unread_count = await conversation_service.getUnreadCount(request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Contador de mensajes no leidos obtenido correctamente",
        data: {
            unread_count
        }
    })
}

export async function markAsRead(request, response) {
    const { conversation_id } = request.params

    const { unread_count } = await conversation_service.markConversationAsRead(
        conversation_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Conversacion marcada como leida",
        data: {
            unread_count
        }
    })
}

export async function deleteMessage(request, response) {
    const { message_id } = request.params

    const message_deleted = await conversation_service.deleteMessage(
        message_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Mensaje eliminado correctamente",
        data: {
            message_deleted
        }
    })
}
