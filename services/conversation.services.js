import mongoose from "mongoose"
import conversation_repository from "../repositories/conversation.repository.js"
import message_repository from "../repositories/message.repository.js"
import post_repository from "../repositories/post.repository.js"
import user_repository from "../repositories/user.repository.js"
import follow_repository from "../repositories/follow.repository.js"
import notification_service from "./notification.services.js"
import storage_service from "./storage.services.js"
import ServerError from "../utils/error.util.js"

const MAX_MESSAGE_LENGTH = 2000
const MAX_GROUP_NAME_LENGTH = 60
const ACTIVE_CONVERSATION_TTL_MS = 20000

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

async function areMutualFollowers(user_a, user_b) {
    const [aFollowsB, bFollowsA] = await Promise.all([
        follow_repository.getByFollowerAndFollowed(user_a, user_b),
        follow_repository.getByFollowerAndFollowed(user_b, user_a)
    ])
    return Boolean(aFollowsB && bFollowsA)
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

    const isMutual = await areMutualFollowers(requester_id, target_user_id)
    const estado = isMutual ? 'accepted' : 'pending'
    const solicitada_por = isMutual ? null : requester_id

    try {
        const created = await conversation_repository.create(requester_id, target_user_id, {
            estado,
            solicitada_por
        })
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
    await Promise.all([
        message_repository.markDeliveredForUser([conversation._id], requester_id),
        user_repository.setActiveConversation(requester_id, conversation._id)
    ])

    return await message_repository.getByConversationPaginated(conversation_id, { page, limit })
}

async function sendMessage(
    conversation_id,
    requester_id,
    contenido,
    { shared_post_id = null, reply_to_message_id = null, forwarded = false } = {}
) {
    const conversation = await getValidatedConversationForUser(conversation_id, requester_id)

    if (conversation.estado === 'pending') {
        const isSender = String(conversation.solicitada_por) === String(requester_id)
        if (!isSender) {
            throw new ServerError("Debes aceptar la solicitud antes de enviar mensajes", 403)
        }
        const activeCount = await message_repository.countActiveByConversationId(conversation_id)
        if (activeCount >= 1) {
            throw new ServerError("Ya enviaste una solicitud pendiente. Espera a que la acepten para enviar mas mensajes", 403)
        }
    }

    let resolved_reply_id = null
    if (reply_to_message_id !== null && reply_to_message_id !== undefined && reply_to_message_id !== '') {
        if (!mongoose.Types.ObjectId.isValid(reply_to_message_id)) {
            throw new ServerError("ID de mensaje respondido invalido", 400)
        }
        const repliedMsg = await message_repository.getActiveById(reply_to_message_id)
        if (!repliedMsg || String(repliedMsg.fk_id_conversacion) !== String(conversation_id)) {
            throw new ServerError("El mensaje que intentas responder no existe en esta conversacion", 404)
        }
        if (repliedMsg.tipo === 'system') {
            throw new ServerError("No se puede responder a un evento del sistema", 400)
        }
        resolved_reply_id = repliedMsg._id
    }

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
        {
            tipo,
            shared_post_id: resolved_shared_post_id,
            reply_to_message_id: resolved_reply_id,
            forwarded: Boolean(forwarded)
        }
    )

    const preview = valid_contenido || (tipo === 'shared_post' ? 'Publicacion compartida' : '')
    await conversation_repository.touchLastActivity(conversation_id, preview)

    const otherParticipants = conversation.participantes.filter(
        (p) => String(p._id || p) !== String(requester_id)
    )
    if (otherParticipants.length > 0) {
        const otherIds = otherParticipants.map((p) => p._id || p)
        const cutoff = new Date(Date.now() - ACTIVE_CONVERSATION_TTL_MS)
        const activeViewerIds = await user_repository.getActiveViewerIds(
            otherIds,
            conversation._id,
            cutoff
        )
        const recipientsToNotify = otherParticipants.filter(
            (recipient) => !activeViewerIds.has(String(recipient._id || recipient))
        )
        if (recipientsToNotify.length > 0) {
            await Promise.allSettled(
                recipientsToNotify.map((recipient) =>
                    notification_service.notify({
                        recipient_id: recipient._id || recipient,
                        actor_id: requester_id,
                        tipo: 'message',
                        conversation_id: conversation._id,
                        message_id: message_created._id
                    })
                )
            )
        }
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

    if (message.tipo === 'system') {
        throw new ServerError("Los eventos del sistema no pueden eliminarse", 403)
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
    await Promise.all([
        message_repository.markConversationAsRead(conversation_id, requester_id),
        user_repository.setActiveConversation(requester_id, conversation_id)
    ])
    const unread_count = await getUnreadCount(requester_id)
    return { unread_count }
}

async function clearActiveConversation(user_id) {
    await user_repository.clearActiveConversation(user_id)
}

async function acceptRequest(conversation_id, requester_id) {
    const conversation = await getValidatedConversationForUser(conversation_id, requester_id)

    if (conversation.estado !== 'pending') {
        return conversation
    }

    if (String(conversation.solicitada_por) === String(requester_id)) {
        throw new ServerError("Solo el destinatario puede aceptar una solicitud de mensaje", 403)
    }

    return await conversation_repository.acceptRequest(conversation_id)
}

async function deleteRequest(conversation_id, requester_id) {
    const conversation = await getValidatedConversationForUser(conversation_id, requester_id)

    if (conversation.estado !== 'pending') {
        throw new ServerError("Esta conversacion no es una solicitud pendiente", 400)
    }

    if (String(conversation.solicitada_por) === String(requester_id)) {
        throw new ServerError("Solo el destinatario puede eliminar una solicitud de mensaje", 403)
    }

    await message_repository.deleteByConversationId(conversation_id)
    await conversation_repository.deleteById(conversation_id)

    return { deleted: true, conversation_id }
}

function validateGroupName(nombre) {
    if (nombre === undefined || nombre === null || typeof nombre !== "string") {
        throw new ServerError("El nombre del grupo es obligatorio", 400)
    }
    const trimmed = nombre.trim()
    if (trimmed.length === 0) {
        throw new ServerError("El nombre del grupo no puede estar vacio", 400)
    }
    if (trimmed.length > MAX_GROUP_NAME_LENGTH) {
        throw new ServerError(`El nombre del grupo no puede superar los ${MAX_GROUP_NAME_LENGTH} caracteres`, 400)
    }
    return trimmed
}

function normalizeParticipantIds(rawIds) {
    let parsed = rawIds
    if (typeof rawIds === 'string') {
        try {
            parsed = JSON.parse(rawIds)
        } catch {
            parsed = rawIds.split(',').map((s) => s.trim()).filter(Boolean)
        }
    }
    if (!Array.isArray(parsed)) {
        return []
    }
    const seen = new Set()
    const unique = []
    for (const id of parsed) {
        const str = String(id || '').trim()
        if (str && !seen.has(str)) {
            seen.add(str)
            unique.push(str)
        }
    }
    return unique
}

function getGroupMemberEntry(conversation, user_id) {
    return (conversation.miembros_grupo || []).find(
        (m) => String(m.usuario?._id || m.usuario) === String(user_id)
    )
}

async function getValidatedGroupForUser(conversation_id, user_id) {
    const conversation = await getValidatedConversationForUser(conversation_id, user_id)
    if (conversation.tipo !== 'group') {
        throw new ServerError("Esta conversacion no es un grupo", 400)
    }
    const member = getGroupMemberEntry(conversation, user_id)
    if (!member) {
        throw new ServerError("No perteneces a este grupo", 403)
    }
    return { conversation, member }
}

async function createGroup(creator_id, { nombre, participant_ids, file = null } = {}) {
    const valid_nombre = validateGroupName(nombre)
    const uniqueOtherIds = normalizeParticipantIds(participant_ids).filter(
        (id) => id !== String(creator_id)
    )

    if (uniqueOtherIds.length < 2) {
        throw new ServerError("Un grupo debe tener al menos 2 participantes ademas del creador", 400)
    }

    for (const pid of uniqueOtherIds) {
        if (!mongoose.Types.ObjectId.isValid(pid)) {
            throw new ServerError("ID de participante invalido", 400)
        }
    }

    const users = await Promise.all(
        uniqueOtherIds.map((pid) => user_repository.getPublicById(pid))
    )
    if (users.some((u) => !u || !u.activo)) {
        throw new ServerError("Uno o mas participantes no existen o estan inactivos", 404)
    }

    let uploaded_image_url = ''
    if (file && file.buffer) {
        const uploaded = await storage_service.uploadImage(file.buffer, {
            folder: 'groups',
            filenamePrefix: String(creator_id)
        })
        uploaded_image_url = uploaded.url
    }

    const baseTime = Date.now()
    const miembros_grupo = [
        { usuario: creator_id, rol: 'owner', fecha_ingreso: new Date(baseTime) },
        ...uniqueOtherIds.map((pid, idx) => ({
            usuario: pid,
            rol: 'member',
            fecha_ingreso: new Date(baseTime + idx + 1)
        }))
    ]
    const participantes = [creator_id, ...uniqueOtherIds]

    try {
        const createdGroup = await conversation_repository.createGroup({
            nombre: valid_nombre,
            imagen_url: uploaded_image_url,
            participantes,
            miembros_grupo
        })
        await message_repository.createSystemEvent(createdGroup._id, creator_id, 'group_created')
        return createdGroup
    } catch (error) {
        if (uploaded_image_url) {
            await storage_service.deleteImageByUrl(uploaded_image_url)
        }
        throw error
    }
}

async function updateGroupInfo(conversation_id, requester_id, { nombre, file = null, removeImage = false } = {}) {
    const { conversation } = await getValidatedGroupForUser(conversation_id, requester_id)

    const update_data = { ultima_actualizacion: new Date() }
    if (nombre !== undefined) {
        const valid_nombre = validateGroupName(nombre)
        if (valid_nombre !== (conversation.nombre || '').trim()) {
            update_data.nombre = valid_nombre
        }
    }

    let new_image_url = null
    const previous_image_url = conversation.imagen_url || ''

    if (file && file.buffer) {
        const uploaded = await storage_service.uploadImage(file.buffer, {
            folder: 'groups',
            filenamePrefix: String(conversation_id)
        })
        new_image_url = uploaded.url
        update_data.imagen_url = new_image_url
    } else if (removeImage) {
        update_data.imagen_url = ''
    }

    if (Object.keys(update_data).length === 1) {
        throw new ServerError("No hay cambios para guardar en el grupo", 400)
    }

    try {
        const updated = await conversation_repository.updateById(conversation_id, update_data)
        if ((new_image_url || removeImage) && previous_image_url && previous_image_url !== new_image_url) {
            await storage_service.deleteImageByUrl(previous_image_url)
        }
        if (update_data.nombre !== undefined) {
            await message_repository.createSystemEvent(conversation_id, requester_id, 'group_renamed')
        }
        if (new_image_url || removeImage) {
            await message_repository.createSystemEvent(conversation_id, requester_id, 'group_image_updated')
        }
        return updated
    } catch (error) {
        if (new_image_url) {
            await storage_service.deleteImageByUrl(new_image_url)
        }
        throw error
    }
}

async function addGroupParticipants(conversation_id, requester_id, participant_ids) {
    const { conversation, member } = await getValidatedGroupForUser(conversation_id, requester_id)

    if (member.rol !== 'owner' && member.rol !== 'admin') {
        throw new ServerError("Solo el owner o los administradores pueden agregar participantes", 403)
    }

    const existingIds = new Set(conversation.participantes.map((p) => String(p._id || p)))
    const toAdd = normalizeParticipantIds(participant_ids).filter((id) => !existingIds.has(id))

    if (toAdd.length === 0) {
        throw new ServerError("No hay nuevos participantes validos para agregar", 400)
    }

    for (const pid of toAdd) {
        if (!mongoose.Types.ObjectId.isValid(pid)) {
            throw new ServerError("ID de participante invalido", 400)
        }
    }

    const users = await Promise.all(toAdd.map((pid) => user_repository.getPublicById(pid)))
    if (users.some((u) => !u || !u.activo)) {
        throw new ServerError("Uno o mas usuarios no existen o estan inactivos", 404)
    }

    const now = Date.now()
    const nextParticipantes = [...conversation.participantes.map((p) => p._id || p), ...toAdd]
    const nextMembers = [
        ...conversation.miembros_grupo.map((m) => ({
            usuario: m.usuario?._id || m.usuario,
            rol: m.rol,
            fecha_ingreso: m.fecha_ingreso
        })),
        ...toAdd.map((pid, idx) => ({
            usuario: pid,
            rol: 'member',
            fecha_ingreso: new Date(now + idx)
        }))
    ]

    const updated = await conversation_repository.updateById(conversation_id, {
        participantes: nextParticipantes,
        miembros_grupo: nextMembers,
        ultima_actualizacion: new Date()
    })

    for (const pid of toAdd) {
        await message_repository.createSystemEvent(conversation_id, requester_id, 'member_added', pid)
    }

    return updated
}

async function removeGroupParticipant(conversation_id, requester_id, target_user_id) {
    const { conversation, member } = await getValidatedGroupForUser(conversation_id, requester_id)

    if (member.rol !== 'owner' && member.rol !== 'admin') {
        throw new ServerError("Solo el owner o los administradores pueden quitar participantes", 403)
    }

    if (!mongoose.Types.ObjectId.isValid(target_user_id)) {
        throw new ServerError("ID de usuario invalido", 400)
    }

    if (String(target_user_id) === String(requester_id)) {
        throw new ServerError("Usa la opcion de abandonar grupo para salir", 400)
    }

    const targetMember = getGroupMemberEntry(conversation, target_user_id)
    if (!targetMember) {
        throw new ServerError("El usuario no pertenece a este grupo", 404)
    }

    if (targetMember.rol === 'owner') {
        throw new ServerError("No se puede expulsar al owner del grupo", 403)
    }

    if (member.rol === 'admin' && targetMember.rol === 'admin') {
        throw new ServerError("Un administrador no puede quitar a otro administrador", 403)
    }

    const nextParticipantes = conversation.participantes
        .map((p) => p._id || p)
        .filter((id) => String(id) !== String(target_user_id))
    const nextMembers = conversation.miembros_grupo
        .filter((m) => String(m.usuario?._id || m.usuario) !== String(target_user_id))
        .map((m) => ({
            usuario: m.usuario?._id || m.usuario,
            rol: m.rol,
            fecha_ingreso: m.fecha_ingreso
        }))

    const updated = await conversation_repository.updateById(conversation_id, {
        participantes: nextParticipantes,
        miembros_grupo: nextMembers,
        ultima_actualizacion: new Date()
    })

    await message_repository.createSystemEvent(conversation_id, requester_id, 'member_removed', target_user_id)

    return updated
}

async function updateGroupMemberRole(conversation_id, requester_id, target_user_id, rol) {
    const { conversation, member } = await getValidatedGroupForUser(conversation_id, requester_id)

    if (member.rol !== 'owner') {
        throw new ServerError("Solo el owner puede designar o quitar administradores", 403)
    }

    if (rol !== 'admin' && rol !== 'member') {
        throw new ServerError("El rol debe ser admin o member", 400)
    }

    if (!mongoose.Types.ObjectId.isValid(target_user_id)) {
        throw new ServerError("ID de usuario invalido", 400)
    }

    if (String(target_user_id) === String(requester_id)) {
        throw new ServerError("No puedes cambiar tu propio rol de owner", 400)
    }

    const targetMember = getGroupMemberEntry(conversation, target_user_id)
    if (!targetMember) {
        throw new ServerError("El usuario no pertenece a este grupo", 404)
    }

    if (targetMember.rol === rol) {
        return conversation
    }

    const nextMembers = conversation.miembros_grupo.map((m) => {
        const uid = m.usuario?._id || m.usuario
        return {
            usuario: uid,
            rol: String(uid) === String(target_user_id) ? rol : m.rol,
            fecha_ingreso: m.fecha_ingreso
        }
    })

    const updated = await conversation_repository.updateById(conversation_id, {
        miembros_grupo: nextMembers,
        ultima_actualizacion: new Date()
    })

    await message_repository.createSystemEvent(
        conversation_id,
        requester_id,
        rol === 'admin' ? 'admin_assigned' : 'admin_removed',
        target_user_id
    )

    return updated
}

async function leaveGroup(conversation_id, requester_id) {
    const { conversation, member } = await getValidatedGroupForUser(conversation_id, requester_id)

    const remainingMembers = conversation.miembros_grupo
        .filter((m) => String(m.usuario?._id || m.usuario) !== String(requester_id))
        .map((m) => ({
            usuario: m.usuario?._id || m.usuario,
            rol: m.rol,
            fecha_ingreso: m.fecha_ingreso
        }))

    if (remainingMembers.length === 0) {
        await message_repository.deleteByConversationId(conversation_id)
        if (conversation.imagen_url) {
            await storage_service.deleteImageByUrl(conversation.imagen_url)
        }
        await conversation_repository.deleteById(conversation_id)
        return { left: true, group_deleted: true, conversation_id }
    }

    // Sucesion determinista del owner: el miembro activo mas antiguo pasa a ser owner
    let newOwnerId = null
    if (member.rol === 'owner') {
        remainingMembers.sort(
            (a, b) => new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime()
        )
        remainingMembers[0].rol = 'owner'
        newOwnerId = remainingMembers[0].usuario
    }

    const nextParticipantes = remainingMembers.map((m) => m.usuario)
    const updated = await conversation_repository.updateById(conversation_id, {
        participantes: nextParticipantes,
        miembros_grupo: remainingMembers,
        ultima_actualizacion: new Date()
    })

    await message_repository.createSystemEvent(conversation_id, requester_id, 'member_left')
    if (newOwnerId) {
        await message_repository.createSystemEvent(conversation_id, newOwnerId, 'owner_changed')
    }

    return { left: true, group_deleted: false, conversation: updated }
}

const conversation_service = {
    createOrGetConversation,
    getUserConversations,
    getConversationMessages,
    sendMessage,
    deleteMessage,
    getUnreadCount,
    markConversationAsRead,
    acceptRequest,
    deleteRequest,
    createGroup,
    updateGroupInfo,
    addGroupParticipants,
    removeGroupParticipant,
    updateGroupMemberRole,
    leaveGroup,
    clearActiveConversation
}

export default conversation_service
