import mongoose from "mongoose"
import community_repository from "../repositories/community.repository.js"
import community_member_repository from "../repositories/communityMember.repository.js"
import post_repository from "../repositories/post.repository.js"
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

    const community_deleted = await community_repository.softDeleteById(community_id)
    await post_repository.softDeleteByCommunityId(community_id)

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

    return await community_member_repository.create(user_id, community_id, 'user')
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

const community_service = {
    create,
    getAll,
    getById,
    update,
    remove,
    getMyCommunities,
    joinCommunity,
    getMembers,
    leaveCommunity
}

export default community_service
