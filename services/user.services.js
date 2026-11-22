import mongoose from "mongoose"
import user_repository from "../repositories/user.repository.js"
import ServerError from "../utils/error.util.js"

async function getAllPublic() {
    return await user_repository.get()
}

async function getPublicById(user_id) {
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        throw new ServerError("Invalid user id", 400)
    }

    const user = await user_repository.getPublicProfileById(user_id)

    if (!user) {
        throw new ServerError("User not found", 404)
    }

    return user
}

async function getOwnProfile(user_id) {
    const user = await user_repository.getOwnProfileById(user_id)

    if (!user) {
        throw new ServerError("User not found", 404)
    }

    return user
}

const user_service = {
    getAllPublic,
    getPublicById,
    getOwnProfile
}

export default user_service
