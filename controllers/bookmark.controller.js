import bookmark_service from "../services/bookmark.services.js"

export async function bookmarkPost(request, response, next) {
    try {
        const user_id = request.user.id
        const { post_id } = request.params

        const result = await bookmark_service.bookmarkPost(user_id, post_id)

        return response.status(result.already_bookmarked ? 200 : 201).send({
            ok: true,
            status: result.already_bookmarked ? 200 : 201,
            message: result.already_bookmarked
                ? "La publicacion ya estaba guardada"
                : "Publicacion guardada correctamente",
            data: result
        })
    } catch (error) {
        next(error)
    }
}

export async function unbookmarkPost(request, response, next) {
    try {
        const user_id = request.user.id
        const { post_id } = request.params

        const result = await bookmark_service.unbookmarkPost(user_id, post_id)

        return response.status(200).send({
            ok: true,
            status: 200,
            message: result.removed
                ? "Publicacion quitada de guardados"
                : "La publicacion no estaba en guardados",
            data: result
        })
    } catch (error) {
        next(error)
    }
}

export async function getMyBookmarks(request, response, next) {
    try {
        const user_id = request.user.id
        const result = await bookmark_service.getMyBookmarks(user_id, request.query)

        return response.status(200).send({
            ok: true,
            status: 200,
            message: "Publicaciones guardadas obtenidas correctamente",
            data: result
        })
    } catch (error) {
        next(error)
    }
}
