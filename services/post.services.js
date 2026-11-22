import mongoose from "mongoose"
import post_repository from "../repositories/post.repository.js"
import community_repository from "../repositories/community.repository.js"
import community_member_repository from "../repositories/communityMember.repository.js"
import ServerError from "../utils/error.util.js"

const MAX_POST_LENGTH = 2000

function validateContenido(contenido) {
    if (contenido === undefined || contenido === null || typeof contenido !== 'string') {
        throw new ServerError("contenido es un campo requerido y debe ser un texto", 400)
    }

    const trimmed = contenido.trim()

    if (trimmed.length === 0) {
        throw new ServerError("contenido no puede estar vacio", 400)
    }

    if (trimmed.length > MAX_POST_LENGTH) {
        throw new ServerError(`contenido no puede superar los ${MAX_POST_LENGTH} caracteres`, 400)
    }

    return trimmed
}

async function create(user_id, contenido, community_id) {
    const valid_contenido = validateContenido(contenido)

    let resolved_community_id = null

    if (community_id !== undefined && community_id !== null && community_id !== '') {
        if (typeof community_id !== 'string' || !mongoose.Types.ObjectId.isValid(community_id)) {
            throw new ServerError("Community id invalido", 400)
        }

        const community = await community_repository.getActiveById(community_id)

        if (!community) {
            throw new ServerError("Comunidad no encontrada o inactiva", 404)
        }

        const membership = await community_member_repository.getByUserAndCommunity(
            user_id,
            community._id
        )

        if (!membership) {
            throw new ServerError("Debes ser miembro de la comunidad para publicar en ella", 403)
        }

        resolved_community_id = community._id
    }

    return await post_repository.create(user_id, valid_contenido, resolved_community_id)
}

async function getAll() {
    return await post_repository.getAllActive()
}

async function getById(post_id) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("Post id invalido", 400)
    }

    const post = await post_repository.getActiveById(post_id)

    if (!post) {
        throw new ServerError("Publicacion no encontrada", 404)
    }

    return post
}

async function update(post_id, user_id, contenido) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("Post id invalido", 400)
    }

    const valid_contenido = validateContenido(contenido)

    const post = await post_repository.getActiveById(post_id)

    if (!post) {
        throw new ServerError("Publicacion no encontrada", 404)
    }

    if (!post.fk_id_usuario._id.equals(user_id)) {
        throw new ServerError("No tienes permisos para editar esta publicacion", 403)
    }

    return await post_repository.updateContentById(post_id, valid_contenido)
}

async function remove(post_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("Post id invalido", 400)
    }

    const post = await post_repository.getActiveById(post_id)

    if (!post) {
        throw new ServerError("Publicacion no encontrada", 404)
    }

    if (!post.fk_id_usuario._id.equals(user_id)) {
        throw new ServerError("No tienes permisos para eliminar esta publicacion", 403)
    }

    return await post_repository.softDeleteById(post_id)
}

const post_service = {
    create,
    getAll,
    getById,
    update,
    remove
}

export default post_service
