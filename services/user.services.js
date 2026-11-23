import mongoose from "mongoose"
import user_repository from "../repositories/user.repository.js"
import storage_service from "./storage.services.js"
import ServerError from "../utils/error.util.js"

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 50

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

async function updateOwnProfile(user_id, body) {
    if (!body || typeof body !== "object" || body.nombre === undefined) {
        throw new ServerError("Se requiere el campo nombre para actualizar el perfil", 400)
    }

    if (typeof body.nombre !== "string") {
        throw new ServerError("nombre debe ser un texto", 400)
    }

    const normalized_name = body.nombre.trim()

    if (normalized_name.length < MIN_NAME_LENGTH || normalized_name.length > MAX_NAME_LENGTH) {
        throw new ServerError(
            `nombre debe tener entre ${MIN_NAME_LENGTH} y ${MAX_NAME_LENGTH} caracteres`,
            400
        )
    }

    const updated_user = await user_repository.updateById(user_id, {
        nombre: normalized_name
    })

    if (!updated_user) {
        throw new ServerError("User not found", 404)
    }

    return updated_user
}

async function updateOwnAvatar(user_id, file) {
    if (!file || !file.buffer) {
        throw new ServerError("La imagen de avatar es requerida", 400)
    }

    const current_user = await user_repository.getOwnProfileById(user_id)

    if (!current_user) {
        throw new ServerError("User not found", 404)
    }

    const previous_avatar_url = current_user.avatar_url || ""

    const uploaded = await storage_service.uploadImage(file.buffer, {
        folder: "avatars",
        filenamePrefix: String(user_id)
    })

    let updated_user
    try {
        updated_user = await user_repository.updateById(user_id, {
            avatar_url: uploaded.url
        })

        if (!updated_user) {
            throw new ServerError("User not found", 404)
        }
    } catch (error) {
        await storage_service.deleteImageByUrl(uploaded.url)
        throw error
    }

    if (previous_avatar_url && previous_avatar_url !== uploaded.url) {
        await storage_service.deleteImageByUrl(previous_avatar_url)
    }

    return updated_user
}

async function deleteOwnAvatar(user_id) {
    const current_user = await user_repository.getOwnProfileById(user_id)

    if (!current_user) {
        throw new ServerError("User not found", 404)
    }

    const previous_avatar_url = current_user.avatar_url || ""

    if (!previous_avatar_url) {
        return current_user
    }

    const updated_user = await user_repository.updateById(user_id, {
        avatar_url: ""
    })

    await storage_service.deleteImageByUrl(previous_avatar_url)

    return updated_user
}

const user_service = {
    getAllPublic,
    getPublicById,
    getOwnProfile,
    updateOwnProfile,
    updateOwnAvatar,
    deleteOwnAvatar
}

export default user_service
