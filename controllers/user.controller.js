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

export async function updateMe(request, response) {
    const user = await user_service.updateOwnProfile(request.user.id, request.body)
    return response.status(200).send({
        message: "Profile updated successfully",
        status: 200,
        ok: true,
        data: {
            user: user
        }
    })
}

export async function uploadMyAvatar(request, response) {
    const user = await user_service.updateOwnAvatar(request.user.id, request.file)
    return response.status(200).send({
        message: "Avatar updated successfully",
        status: 200,
        ok: true,
        data: {
            user: user
        }
    })
}

export async function deleteMyAvatar(request, response) {
    const user = await user_service.deleteOwnAvatar(request.user.id)
    return response.status(200).send({
        message: "Avatar removed successfully",
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
