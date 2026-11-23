import community_service from "../services/community.services.js"

export async function create(request, response) {
    const nombre = request.body?.nombre
    const descripcion = request.body?.descripcion

    const community_created = await community_service.create(
        request.user.id,
        nombre,
        descripcion
    )

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "Comunidad creada correctamente",
        data: {
            community: community_created
        }
    })
}

export async function getAll(request, response) {
    const communities = await community_service.getAll()

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Comunidades obtenidas correctamente",
        data: {
            communities: communities
        }
    })
}

export async function getById(request, response) {
    const { community_id } = request.params

    const community = await community_service.getById(community_id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Comunidad obtenida correctamente",
        data: {
            community: community
        }
    })
}

export async function updateById(request, response) {
    const { community_id } = request.params
    const nombre = request.body?.nombre
    const descripcion = request.body?.descripcion

    const community_updated = await community_service.update(
        community_id,
        request.user.id,
        nombre,
        descripcion
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Comunidad actualizada correctamente",
        data: {
            community: community_updated
        }
    })
}

export async function deleteById(request, response) {
    const { community_id } = request.params

    const community_deleted = await community_service.remove(
        community_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Comunidad eliminada correctamente",
        data: {
            community_deleted: community_deleted
        }
    })
}

export async function getMyCommunities(request, response) {
    const communities = await community_service.getMyCommunities(request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Mis comunidades obtenidas correctamente",
        data: {
            communities: communities
        }
    })
}

export async function joinCommunity(request, response) {
    const { community_id } = request.params

    const membership = await community_service.joinCommunity(
        community_id,
        request.user.id
    )

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "Te has unido a la comunidad correctamente",
        data: {
            membership: membership
        }
    })
}

export async function getMembers(request, response) {
    const { community_id } = request.params

    const members = await community_service.getMembers(
        community_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Miembros de la comunidad obtenidos correctamente",
        data: {
            members: members
        }
    })
}

export async function updateImage(request, response) {
    const { community_id } = request.params

    const community_updated = await community_service.updateImage(
        community_id,
        request.user.id,
        request.file || null
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Imagen de comunidad actualizada correctamente",
        data: {
            community: community_updated
        }
    })
}

export async function deleteImage(request, response) {
    const { community_id } = request.params

    const community_updated = await community_service.deleteImage(
        community_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Imagen de comunidad eliminada correctamente",
        data: {
            community: community_updated
        }
    })
}

export async function leaveCommunity(request, response) {
    const { community_id } = request.params

    const membership_deleted = await community_service.leaveCommunity(
        community_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Has abandonado la comunidad correctamente",
        data: {
            membership_deleted: membership_deleted
        }
    })
}
