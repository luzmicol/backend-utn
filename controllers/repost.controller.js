import repost_service from "../services/repost.services.js"

export async function repostPost(request, response) {
    const { post_id } = request.params

    const result = await repost_service.repostPost(post_id, request.user.id)

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "Publicacion reposteada correctamente",
        data: result
    })
}

export async function unrepostPost(request, response) {
    const { post_id } = request.params

    const result = await repost_service.unrepostPost(post_id, request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Repost eliminado correctamente",
        data: result
    })
}

export async function getRepostsInfo(request, response) {
    const { post_id } = request.params

    const result = await repost_service.getPostRepostsInfo(post_id, request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Informacion de reposts obtenida correctamente",
        data: result
    })
}

export async function getUserReposts(request, response) {
    const { user_id } = request.params

    const reposts = await repost_service.getUserReposts(user_id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Reposts del usuario obtenidos correctamente",
        data: {
            reposts: reposts
        }
    })
}
