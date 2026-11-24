import post_service from "../services/post.services.js"

export async function create(request, response) {
    const contenido = request.body?.contenido
    const community_id = request.body?.fk_id_comunidad ?? request.body?.community_id

    const post_created = await post_service.create(
        request.user.id,
        contenido,
        community_id,
        request.file || null
    )

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "Publicacion creada correctamente",
        data: {
            post: post_created
        }
    })
}

export async function getAll(request, response) {
    const user_id = request.query?.user_id || null
    const community_id = request.query?.community_id || null
    const page = request.query?.page
    const limit = request.query?.limit
    const requester_id = request.user?.id || null

    const { posts, pagination } = await post_service.getAll({
        user_id,
        community_id,
        requester_id,
        page,
        limit
    })

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Feed de publicaciones obtenido correctamente",
        data: {
            posts: posts,
            pagination: pagination
        }
    })
}

export async function getById(request, response) {
    const { post_id } = request.params

    const post = await post_service.getById(post_id, request.user?.id || null)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Publicacion obtenida correctamente",
        data: {
            post: post
        }
    })
}

export async function updateById(request, response) {
    const { post_id } = request.params
    const contenido = request.body?.contenido
    const removeImage =
        request.body?.remove_image === true || request.body?.remove_image === 'true'

    const post_updated = await post_service.update(
        post_id,
        request.user.id,
        contenido,
        {
            file: request.file || null,
            removeImage
        }
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Publicacion actualizada correctamente",
        data: {
            post: post_updated
        }
    })
}

export async function deleteById(request, response) {
    const { post_id } = request.params

    const post_deleted = await post_service.remove(
        post_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Publicacion eliminada correctamente",
        data: {
            post_deleted: post_deleted
        }
    })
}
