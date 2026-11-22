import like_service from "../services/like.services.js"

export async function likePost(request, response) {
    const { post_id } = request.params

    const result = await like_service.likePost(post_id, request.user.id)

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "Like registrado correctamente",
        data: result
    })
}

export async function unlikePost(request, response) {
    const { post_id } = request.params

    const result = await like_service.unlikePost(post_id, request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Like eliminado correctamente",
        data: result
    })
}

export async function getLikesInfo(request, response) {
    const { post_id } = request.params

    const result = await like_service.getPostLikesInfo(post_id, request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Informacion de likes obtenida correctamente",
        data: result
    })
}
