import follow_service from "../services/follow.services.js"

export async function followUser(request, response) {
    const { user_id } = request.params

    const result = await follow_service.followUser(request.user.id, user_id)

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "Ahora sigues a este usuario",
        data: result
    })
}

export async function unfollowUser(request, response) {
    const { user_id } = request.params

    const result = await follow_service.unfollowUser(request.user.id, user_id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Has dejado de seguir a este usuario",
        data: result
    })
}

export async function getFollowers(request, response) {
    const { user_id } = request.params

    const followers = await follow_service.getFollowers(user_id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Seguidores obtenidos correctamente",
        data: {
            followers: followers
        }
    })
}

export async function getFollowing(request, response) {
    const { user_id } = request.params

    const following = await follow_service.getFollowing(user_id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Usuarios seguidos obtenidos correctamente",
        data: {
            following: following
        }
    })
}

export async function getFollowStatus(request, response) {
    const { user_id } = request.params

    const result = await follow_service.getFollowStatus(request.user.id, user_id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Estado de seguimiento obtenido correctamente",
        data: result
    })
}
