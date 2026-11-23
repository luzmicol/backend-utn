import mongoose from "mongoose"
import comment_repository from "../repositories/comment.repository.js"
import post_repository from "../repositories/post.repository.js"
import notification_service from "./notification.services.js"
import ServerError from "../utils/error.util.js"
import { resolveMentionsFromContent } from "../utils/mentions.util.js"

const MAX_COMMENT_LENGTH = 1000

function validateContenido(contenido) {
    if (contenido === undefined || contenido === null || typeof contenido !== 'string') {
        throw new ServerError("contenido es un campo requerido y debe ser un texto", 400)
    }

    const trimmed = contenido.trim()

    if (trimmed.length === 0) {
        throw new ServerError("contenido no puede estar vacio", 400)
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
        throw new ServerError(`contenido no puede superar los ${MAX_COMMENT_LENGTH} caracteres`, 400)
    }

    return trimmed
}

async function validateActivePost(post_id) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("Post id invalido", 400)
    }

    const post = await post_repository.getActiveById(post_id)

    if (!post) {
        throw new ServerError("Publicacion no encontrada o inactiva", 404)
    }

    return post
}

async function createComment(post_id, user_id, contenido) {
    const post = await validateActivePost(post_id)
    const valid_contenido = validateContenido(contenido)
    const menciones = await resolveMentionsFromContent(valid_contenido)

    const comment_created = await comment_repository.create(user_id, post_id, valid_contenido, menciones)

    await notification_service.notify({
        recipient_id: post.fk_id_usuario?._id || post.fk_id_usuario,
        actor_id: user_id,
        tipo: 'comment',
        post_id: post._id,
        comment_id: comment_created._id
    })

    await notification_service.notifyMentions({
        actor_id: user_id,
        menciones,
        post_id: post._id,
        comment_id: comment_created._id
    })

    return comment_created
}

async function getCommentsByPost(post_id) {
    await validateActivePost(post_id)

    return await comment_repository.getActiveByPostId(post_id)
}

async function deleteComment(post_id, comment_id, user_id) {
    await validateActivePost(post_id)

    if (!mongoose.Types.ObjectId.isValid(comment_id)) {
        throw new ServerError("Comment id invalido", 400)
    }

    const comment = await comment_repository.getActiveByIdAndPost(comment_id, post_id)

    if (!comment) {
        throw new ServerError("Comentario no encontrado", 404)
    }

    if (!comment.fk_id_usuario.equals(user_id)) {
        throw new ServerError("No tienes permisos para eliminar este comentario", 403)
    }

    const deleted = await comment_repository.softDeleteById(comment_id)
    await notification_service.deleteByCommentId(comment_id)

    return deleted
}

const comment_service = {
    createComment,
    getCommentsByPost,
    deleteComment
}

export default comment_service
