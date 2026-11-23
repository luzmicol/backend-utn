import mongoose from "mongoose"
import user_repository from "../repositories/user.repository.js"
import storage_service from "./storage.services.js"
import ServerError from "../utils/error.util.js"
import { USERNAME_COOLDOWN_MS, validateUsernameFormat } from "../utils/username.util.js"

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 50

async function getAllPublic() {
    return await user_repository.get()
}

async function searchPublicUsers(query, limit) {
    return await user_repository.searchPublicUsers(query, limit)
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

async function checkUsernameAvailability(raw_username) {
    const normalized = validateUsernameFormat(raw_username)
    const existing = await user_repository.getByUsername(normalized)

    return {
        username: normalized,
        available: !existing
    }
}

async function updateOwnUsername(user_id, raw_username) {
    const normalized = validateUsernameFormat(raw_username)
    const current_user = await user_repository.getOwnProfileById(user_id)

    if (!current_user) {
        throw new ServerError("User not found", 404)
    }

    if (current_user.username === normalized) {
        throw new ServerError("El nuevo username debe ser distinto al actual", 400)
    }

    const now = Date.now()
    if (current_user.username_last_changed_at) {
        const elapsed = now - new Date(current_user.username_last_changed_at).getTime()
        if (elapsed < USERNAME_COOLDOWN_MS) {
            const nextDate = new Date(
                new Date(current_user.username_last_changed_at).getTime() + USERNAME_COOLDOWN_MS
            )
            throw new ServerError(
                `Solo podes cambiar tu username una vez cada 7 dias. Proximo cambio disponible: ${nextDate.toISOString()}`,
                400,
                "USERNAME_COOLDOWN"
            )
        }
    }

    const existing = await user_repository.getByUsername(normalized)
    if (existing && String(existing._id) !== String(user_id)) {
        throw new ServerError("Este username ya esta en uso", 409, "USERNAME_TAKEN")
    }

    const cooldown_cutoff = new Date(now - USERNAME_COOLDOWN_MS)

    try {
        const updated_user = await user_repository.updateUsernameAtomically(
            user_id,
            normalized,
            cooldown_cutoff
        )

        if (!updated_user) {
            throw new ServerError(
                "Solo podes cambiar tu username una vez cada 7 dias",
                400,
                "USERNAME_COOLDOWN"
            )
        }

        return updated_user
    } catch (error) {
        if (error && error.code === 11000) {
            throw new ServerError("Este username ya esta en uso", 409, "USERNAME_TAKEN")
        }
        throw error
    }
}

const user_service = {
    getAllPublic,
    searchPublicUsers,
    getPublicById,
    getOwnProfile,
    updateOwnProfile,
    updateOwnAvatar,
    deleteOwnAvatar,
    checkUsernameAvailability,
    updateOwnUsername
}

export default user_service
