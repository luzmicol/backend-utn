import user_service from "../services/user.services.js"

export async function getUsers(request, response) {
    const user_list = await user_service.getAllPublic()
    return response.status(200).send({
        message: "Get users list",
        ok: true,
        status: 200,
        data: {
            users: user_list
        }
    })
}

export async function getMe(request, response) {
    const user = await user_service.getOwnProfile(request.user.id)
    return response.status(200).send({
        message: "Get authenticated user profile successfully",
        status: 200,
        ok: true,
        data: {
            user: user
        }
    })
}

export async function getUserById(request, response) {
    const user_id = request.params.user_id
    const user = await user_service.getPublicById(user_id)

    return response.status(200).send({
        message: "Get user details successfully",
        status: 200,
        ok: true,
        data: {
            user: user
        }
    })
}
