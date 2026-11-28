import explore_service from "../services/explore.services.js"

export async function getTrending(request, response) {
    const { page, limit } = request.query || {}
    const { posts, pagination } = await explore_service.getTrendingPosts({ page, limit })

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Tendencias obtenidas correctamente",
        data: {
            posts,
            pagination
        }
    })
}

export async function getForYou(request, response) {
    const { page, limit } = request.query || {}
    const { posts, pagination } = await explore_service.getForYouPosts(request.user.id, { page, limit })

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Recomendaciones obtenidas correctamente",
        data: {
            posts,
            pagination
        }
    })
}
