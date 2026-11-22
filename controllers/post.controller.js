import post_service from "../services/post.services.js"

export async function create(request, response) {
    const contenido = request.body?.contenido
    const community_id = request.body?.fk_id_comunidad ?? request.body?.community_id

    const post_created = await post_service.create(
        request.user.id,
        contenido,
        community_id
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
    const posts = await post_service.getAll()

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Feed de publicaciones obtenido correctamente",
        data: {
            posts: posts
        }
    })
}

export async function getById(request, response) {
    const { post_id } = request.params

    const post = await post_service.getById(post_id)

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

    const post_updated = await post_service.update(
        post_id,
        request.user.id,
        contenido
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
