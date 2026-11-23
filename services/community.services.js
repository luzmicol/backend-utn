import mongoose from "mongoose"
import community_repository from "../repositories/community.repository.js"
import community_member_repository from "../repositories/communityMember.repository.js"
import post_repository from "../repositories/post.repository.js"
import like_repository from "../repositories/like.repository.js"
import comment_repository from "../repositories/comment.repository.js"
import repost_repository from "../repositories/repost.repository.js"
import notification_service from "./notification.services.js"
import storage_service from "./storage.services.js"
import ServerError from "../utils/error.util.js"

const MAX_NAME_LENGTH = 50
const MAX_DESCRIPTION_LENGTH = 1000

function validateNombre(nombre) {
    if (nombre === undefined || nombre === null || typeof nombre !== 'string') {
        throw new ServerError("nombre es un campo requerido y debe ser un texto", 400)
    }

    const trimmed = nombre.trim()

    if (trimmed.length === 0) {
        throw new ServerError("nombre no puede estar vacio", 400)
    }

    if (trimmed.length > MAX_NAME_LENGTH) {
        throw new ServerError(`nombre no puede superar los ${MAX_NAME_LENGTH} caracteres`, 400)
    }

    return trimmed
}

function validateDescripcion(descripcion) {
    if (typeof descripcion !== 'string') {
        throw new ServerError("descripcion debe ser un texto", 400)
    }

    const trimmed = descripcion.trim()

    if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
        throw new ServerError(`descripcion no puede superar los ${MAX_DESCRIPTION_LENGTH} caracteres`, 400)
    }

    return trimmed
}

async function create(user_id, nombre, descripcion) {
    const valid_nombre = validateNombre(nombre)

    let valid_descripcion = ""
    if (descripcion !== undefined && descripcion !== null) {
        valid_descripcion = validateDescripcion(descripcion)
    }

    const community_created = await community_repository.create(user_id, valid_nombre, valid_descripcion)
    await community_member_repository.create(user_id, community_created._id, 'owner')

    return community_created
}

async function getAll() {
    return await community_repository.getAllActive()
}

async function getById(community_id) {
    if (!mongoose.Types.ObjectId.isValid(community_id)) {
        throw new ServerError("Community id invalido", 400)
    }

    const community = await community_repository.getActiveById(community_id)

    if (!community) {
        throw new ServerError("Comunidad no encontrada", 404)
    }

    return community
}

async function update(community_id, user_id, nombre, descripcion) {
    if (!mongoose.Types.ObjectId.isValid(community_id)) {
        throw new ServerError("Community id invalido", 400)
    }

    const update_data = {}

    if (nombre !== undefined) {
        update_data.nombre = validateNombre(nombre)
    }

    if (descripcion !== undefined) {
        if (descripcion === null) {
            throw new ServerError("descripcion debe ser un texto", 400)
        }
        update_data.descripcion = validateDescripcion(descripcion)
    }

    if (Object.keys(update_data).length === 0) {
        throw new ServerError("Se requiere al menos un campo: nombre o descripcion", 400)
    }

    const community = await community_repository.getActiveById(community_id)

    if (!community) {
        throw new ServerError("Comunidad no encontrada", 404)
    }

    if (!community.fk_id_creador._id.equals(user_id)) {
        throw new ServerError("No tienes permisos para editar esta comunidad", 403)
    }

    return await community_repository.updateById(community_id, update_data)
}

async function remove(community_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(community_id)) {
        throw new ServerError("Community id invalido", 400)
    }

    const community = await community_repository.getActiveById(community_id)

    if (!community) {
        throw new ServerError("Comunidad no encontrada", 404)
    }

    if (!community.fk_id_creador._id.equals(user_id)) {
        throw new ServerError("No tienes permisos para eliminar esta comunidad", 403)
    }

    const active_posts = await post_repository.getActiveIdsAndImagesByCommunityId(community_id)
    const post_ids = active_posts.map((post) => post._id)
    const image_urls = active_posts.map((post) => post.imagen_url).filter(Boolean)

    const community_deleted = await community_repository.softDeleteById(community_id)
    await post_repository.softDeleteByCommunityId(community_id)

    const cleanupTasks = [
        community_member_repository.deleteByCommunityId(community_id)
    ]

    if (post_ids.length > 0) {
        cleanupTasks.push(
            like_repository.deleteByPostIds(post_ids),
            comment_repository.softDeleteByPostIds(post_ids),
            repost_repository.deleteByPostIds(post_ids),
            notification_service.deleteByPostIds(post_ids)
        )
    }

    for (const url of image_urls) {
        cleanupTasks.push(storage_service.deleteImageByUrl(url))
    }

    if (community.imagen_url) {
        cleanupTasks.push(storage_service.deleteImageByUrl(community.imagen_url))
    }

    const cleanupResults = await Promise.allSettled(cleanupTasks)
    cleanupResults.forEach((result) => {
        if (result.status === 'rejected') {
            console.error('[CommunityService.remove] Error en limpieza en cascada:', result.reason?.message || result.reason)
        }
    })

    return community_deleted
}

async function getMyCommunities(user_id) {
    const memberships = await community_member_repository.getAllCommunitiesByUserId(user_id)

    return memberships
        .filter(membership => membership.fk_id_comunidad)
        .map(membership => ({
            _id: membership.fk_id_comunidad._id,
            nombre: membership.fk_id_comunidad.nombre,
            descripcion: membership.fk_id_comunidad.descripcion,
            imagen_url: membership.fk_id_comunidad.imagen_url || "",
            fecha_creacion: membership.fk_id_comunidad.fecha_creacion,
            fk_id_creador: membership.fk_id_comunidad.fk_id_creador,
            rol: membership.rol
        }))
}

async function joinCommunity(community_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(community_id)) {
        throw new ServerError("Community id invalido", 400)
    }

    const community = await community_repository.getActiveById(community_id)

    if (!community) {
        throw new ServerError("Comunidad no encontrada o inactiva", 404)
    }

    const existing_membership = await community_member_repository.getByUserAndCommunity(
        user_id,
        community_id
    )

    if (existing_membership) {
        throw new ServerError("Ya eres miembro de esta comunidad", 400)
    }

    try {
        return await community_member_repository.create(user_id, community_id, 'user')
    } catch (error) {
        if (error?.code === 11000) {
            throw new ServerError("Ya eres miembro de esta comunidad", 409)
        }
        throw error
    }
}

async function getMembers(community_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(community_id)) {
        throw new ServerError("Community id invalido", 400)
    }

    const community = await community_repository.getActiveById(community_id)

    if (!community) {
        throw new ServerError("Comunidad no encontrada o inactiva", 404)
    }

    const membership = await community_member_repository.getByUserAndCommunity(
        user_id,
        community_id
    )

    if (!membership) {
        throw new ServerError("No eres miembro de esta comunidad", 403)
    }

    return await community_member_repository.getAllMembersByCommunityId(community_id)
}

async function leaveCommunity(community_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(community_id)) {
        throw new ServerError("Community id invalido", 400)
    }

    const community = await community_repository.getActiveById(community_id)

    if (!community) {
        throw new ServerError("Comunidad no encontrada o inactiva", 404)
    }

    const membership = await community_member_repository.getByUserAndCommunity(
        user_id,
        community_id
    )

    if (!membership) {
        throw new ServerError("No eres miembro de esta comunidad", 403)
    }

    if (membership.rol === 'owner') {
        const owners_count = await community_member_repository.countOwnersByCommunityId(community_id)
        if (owners_count <= 1) {
            throw new ServerError(
                "No puedes abandonar la comunidad siendo el unico propietario",
                400
            )
        }
    }

    return await community_member_repository.deleteById(membership._id)
}

async function assertCommunityOwner(community_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(community_id)) {
        throw new ServerError("Community id invalido", 400)
    }

    const community = await community_repository.getActiveById(community_id)

    if (!community) {
        throw new ServerError("Comunidad no encontrada", 404)
    }

    const membership = await community_member_repository.getByUserAndCommunity(
        user_id,
        community_id
    )

    if (!membership || membership.rol !== 'owner') {
        throw new ServerError("Solo el owner puede modificar la imagen de la comunidad", 403)
    }

    return community
}

async function updateImage(community_id, user_id, file) {
    const community = await assertCommunityOwner(community_id, user_id)

    if (!file) {
        throw new ServerError("Debes seleccionar una imagen", 400)
    }

    const previous_image_url = community.imagen_url || ""
    const uploaded = await storage_service.uploadImage(file, {
        folder: "communities",
        filenamePrefix: String(community_id),
        maxDimension: 512
    })

    let updated_community
    try {
        updated_community = await community_repository.updateById(community_id, {
            imagen_url: uploaded.url
        })
    } catch (error) {
        await storage_service.deleteImageByUrl(uploaded.url)
        throw error
    }

    if (previous_image_url) {
        await storage_service.deleteImageByUrl(previous_image_url)
    }

    return updated_community
}

async function deleteImage(community_id, user_id) {
    const community = await assertCommunityOwner(community_id, user_id)

    if (!community.imagen_url) {
        return community
    }

    const previous_image_url = community.imagen_url
    const updated_community = await community_repository.updateById(community_id, {
        imagen_url: ""
    })

    await storage_service.deleteImageByUrl(previous_image_url)

    return updated_community
}

const community_service = {
    create,
    getAll,
    getById,
    update,
    remove,
    getMyCommunities,
    joinCommunity,
    getMembers,
    leaveCommunity,
    updateImage,
    deleteImage
}

export default community_service
