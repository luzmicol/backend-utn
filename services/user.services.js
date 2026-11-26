import mongoose from "mongoose"
import user_repository from "../repositories/user.repository.js"
import follow_repository from "../repositories/follow.repository.js"
import storage_service from "./storage.services.js"
import ServerError from "../utils/error.util.js"
import { USERNAME_COOLDOWN_MS, validateUsernameFormat } from "../utils/username.util.js"

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 50
const MAX_BIO_LENGTH = 160
const MAX_USERS_PAGE_LIMIT = 15

async function getAllPublic(requester_id, { page = 1, limit = 15, q = '' } = {}) {
    const parsedPage = Number.parseInt(page, 10)
    const safePage = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1

    const parsedLimit = Number.parseInt(limit, 10)
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit >= 1
        ? Math.min(parsedLimit, MAX_USERS_PAGE_LIMIT)
        : MAX_USERS_PAGE_LIMIT

    const safeQuery = typeof q === 'string' ? q.trim().slice(0, 80) : ''

    const { users, pagination } = await user_repository.get({
        exclude_user_id: requester_id || null,
        q: safeQuery,
        page: safePage,
        limit: safeLimit
    })

    const candidateIds = users.map((u) => u._id)
    const followedSet = requester_id
        ? await follow_repository.getFollowedIdsInList(requester_id, candidateIds)
        : new Set()

    const enrichedUsers = users.map((u) => ({
        _id: u._id,
        nombre: u.nombre,
        username: u.username || null,
        avatar_url: u.avatar_url || '',
        bio: u.bio || '',
        fecha_creacion: u.fecha_creacion,
        is_following: followedSet.has(String(u._id))
    }))

    return {
        users: enrichedUsers,
        pagination
    }
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
    if (!body || typeof body !== "object") {
        throw new ServerError("Se requiere al menos nombre o bio para actualizar el perfil", 400)
    }

    const has_name = body.nombre !== undefined
    const has_bio = body.bio !== undefined

    if (!has_name && !has_bio) {
        throw new ServerError("Se requiere al menos nombre o bio para actualizar el perfil", 400)
    }

    const updates = {}

    if (has_name) {
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

        updates.nombre = normalized_name
    }

    if (has_bio) {
        if (typeof body.bio !== "string") {
            throw new ServerError("bio debe ser un texto", 400)
        }

        const normalized_bio = body.bio.trim()

        if (normalized_bio.length > MAX_BIO_LENGTH) {
            throw new ServerError(
                `bio no puede superar los ${MAX_BIO_LENGTH} caracteres`,
                400
            )
        }

        updates.bio = normalized_bio
    }

    const updated_user = await user_repository.updateById(user_id, updates)

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
