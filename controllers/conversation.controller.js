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
    const shared_post_id = request.body?.shared_post_id || null

    const message = await conversation_service.sendMessage(
        conversation_id,
        request.user.id,
        contenido,
        { shared_post_id }
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

export async function acceptRequest(request, response) {
    const { conversation_id } = request.params

    const conversation = await conversation_service.acceptRequest(
        conversation_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Solicitud de mensaje aceptada",
        data: {
            conversation
        }
    })
}

export async function deleteRequest(request, response) {
    const { conversation_id } = request.params

    const result = await conversation_service.deleteRequest(
        conversation_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Solicitud de mensaje eliminada",
        data: result
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

export async function createGroup(request, response) {
    const { nombre, participant_ids } = request.body || {}
    const conversation = await conversation_service.createGroup(request.user.id, {
        nombre,
        participant_ids,
        file: request.file || null
    })

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "Grupo creado correctamente",
        data: { conversation }
    })
}

export async function updateGroupInfo(request, response) {
    const { conversation_id } = request.params
    const nombre = request.body?.nombre
    const removeImage =
        request.body?.remove_image === true || request.body?.remove_image === 'true'

    const conversation = await conversation_service.updateGroupInfo(
        conversation_id,
        request.user.id,
        {
            nombre,
            file: request.file || null,
            removeImage
        }
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Grupo actualizado correctamente",
        data: { conversation }
    })
}

export async function addGroupParticipants(request, response) {
    const { conversation_id } = request.params
    const { participant_ids } = request.body || {}

    const conversation = await conversation_service.addGroupParticipants(
        conversation_id,
        request.user.id,
        participant_ids
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Participantes agregados correctamente",
        data: { conversation }
    })
}

export async function removeGroupParticipant(request, response) {
    const { conversation_id, user_id } = request.params

    const conversation = await conversation_service.removeGroupParticipant(
        conversation_id,
        request.user.id,
        user_id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Participante eliminado del grupo",
        data: { conversation }
    })
}

export async function updateGroupMemberRole(request, response) {
    const { conversation_id, user_id } = request.params
    const { rol } = request.body || {}

    const conversation = await conversation_service.updateGroupMemberRole(
        conversation_id,
        request.user.id,
        user_id,
        rol
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Rol actualizado correctamente",
        data: { conversation }
    })
}

export async function leaveGroup(request, response) {
    const { conversation_id } = request.params

    const result = await conversation_service.leaveGroup(
        conversation_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: result.group_deleted
            ? "Abandonaste el grupo y fue eliminado por quedar sin participantes"
            : "Abandonaste el grupo correctamente",
        data: result
    })
}
