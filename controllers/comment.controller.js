import comment_service from "../services/comment.services.js"

export async function createComment(request, response) {
    const { post_id } = request.params
    const contenido = request.body?.contenido

    const comment_created = await comment_service.createComment(
        post_id,
        request.user.id,
        contenido
    )

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "Comentario creado correctamente",
        data: {
            comment: comment_created
        }
    })
}

export async function getComments(request, response) {
    const { post_id } = request.params

    const comments = await comment_service.getCommentsByPost(post_id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Comentarios obtenidos correctamente",
        data: {
            comments: comments
        }
    })
}

export async function deleteComment(request, response) {
    const { post_id, comment_id } = request.params

    const comment_deleted = await comment_service.deleteComment(
        post_id,
        comment_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Comentario eliminado correctamente",
        data: {
            comment_deleted: comment_deleted
        }
    })
}
