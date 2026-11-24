import mongoose from "mongoose"
import post_repository from "../repositories/post.repository.js"
import like_repository from "../repositories/like.repository.js"
import comment_repository from "../repositories/comment.repository.js"
import repost_repository from "../repositories/repost.repository.js"
import bookmark_repository from "../repositories/bookmark.repository.js"
import community_repository from "../repositories/community.repository.js"
import community_member_repository from "../repositories/communityMember.repository.js"
import storage_service from "./storage.services.js"
import notification_service from "./notification.services.js"
import ServerError from "../utils/error.util.js"
import { resolveMentionsFromContent } from "../utils/mentions.util.js"

const MAX_POST_LENGTH = 2000
const POST_IMAGE_MAX_DIMENSION = 1200

function validateOptionalContenido(contenido) {
    if (contenido === undefined || contenido === null) {
        return ""
    }

    if (typeof contenido !== 'string') {
        throw new ServerError("contenido debe ser un texto", 400)
    }

    const trimmed = contenido.trim()

    if (trimmed.length > MAX_POST_LENGTH) {
        throw new ServerError(`contenido no puede superar los ${MAX_POST_LENGTH} caracteres`, 400)
    }

    return trimmed
}

async function create(user_id, contenido, community_id, file = null) {
    const valid_contenido = validateOptionalContenido(contenido)
    const hasFile = Boolean(file && file.buffer)

    if (!valid_contenido && !hasFile) {
        throw new ServerError("Debes escribir un texto o adjuntar una imagen para publicar", 400)
    }

    let resolved_community_id = null

    if (community_id !== undefined && community_id !== null && community_id !== '') {
        if (typeof community_id !== 'string' || !mongoose.Types.ObjectId.isValid(community_id)) {
            throw new ServerError("Community id invalido", 400)
        }

        const community = await community_repository.getActiveById(community_id)

        if (!community) {
            throw new ServerError("Comunidad no encontrada o inactiva", 404)
        }

        const membership = await community_member_repository.getByUserAndCommunity(
            user_id,
            community._id
        )

        if (!membership) {
            throw new ServerError("Debes ser miembro de la comunidad para publicar en ella", 403)
        }

        resolved_community_id = community._id
    }

    let uploaded_image_url = ""
    if (hasFile) {
        const uploaded = await storage_service.uploadImage(file.buffer, {
            folder: "posts",
            filenamePrefix: String(user_id),
            maxDimension: POST_IMAGE_MAX_DIMENSION
        })
        uploaded_image_url = uploaded.url
    }

    try {
        const menciones = await resolveMentionsFromContent(valid_contenido)
        const post_created = await post_repository.create(
            user_id,
            valid_contenido,
            resolved_community_id,
            menciones,
            uploaded_image_url
        )

        await notification_service.notifyMentions({
            actor_id: user_id,
            menciones,
            post_id: post_created._id
        })

        return post_created
    } catch (error) {
        if (uploaded_image_url) {
            await storage_service.deleteImageByUrl(uploaded_image_url)
        }
        throw error
    }
}

async function enrichPostsWithEngagement(posts, requester_id = null) {
    if (!Array.isArray(posts) || posts.length === 0) {
        return []
    }

    const postIds = posts.map((post) => post._id)
    const [likesSummary, repostsSummary, bookmarkedPostIds] = await Promise.all([
        like_repository.getSummaryByPostIds(postIds, requester_id),
        repost_repository.getSummaryByPostIds(postIds, requester_id),
        requester_id
            ? bookmark_repository.getBookmarkedPostIdsByUser(requester_id, postIds)
            : Promise.resolve(new Set())
    ])

    return posts.map((post) => {
        const plain = typeof post.toObject === 'function' ? post.toObject() : { ...post }
        const key = String(plain._id)
        const likeInfo = likesSummary.get(key) || { likes_count: 0, liked_by_me: false }
        const repostInfo = repostsSummary.get(key) || {
            reposts_count: 0,
            reposted_by_me: false,
            latest_repost_by: null
        }

        return {
            ...plain,
            likes_count: likeInfo.likes_count,
            liked_by_me: likeInfo.liked_by_me,
            reposts_count: repostInfo.reposts_count,
            reposted_by_me: repostInfo.reposted_by_me,
            latest_repost_by: repostInfo.latest_repost_by,
            is_bookmarked: bookmarkedPostIds.has(key)
        }
    })
}

async function getAll({
    user_id = null,
    community_id = null,
    requester_id = null,
    page = 1,
    limit = 20
} = {}) {
    if (user_id && !mongoose.Types.ObjectId.isValid(user_id)) {
        throw new ServerError("User id invalido", 400)
    }

    if (community_id && !mongoose.Types.ObjectId.isValid(community_id)) {
        throw new ServerError("Community id invalido", 400)
    }

    const { posts, pagination } = await post_repository.getAllActive({
        user_id,
        community_id,
        page,
        limit
    })
    const enriched_posts = await enrichPostsWithEngagement(posts, requester_id)

    return {
        posts: enriched_posts,
        pagination
    }
}

async function getById(post_id, requester_id = null) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("Post id invalido", 400)
    }

    const post = await post_repository.getActiveById(post_id)

    if (!post) {
        throw new ServerError("Publicacion no encontrada", 404)
    }

    const plain = typeof post.toObject === 'function' ? post.toObject() : { ...post }
    const bookmarkedPostIds = requester_id
        ? await bookmark_repository.getBookmarkedPostIdsByUser(requester_id, [plain._id])
        : new Set()

    return {
        ...plain,
        is_bookmarked: bookmarkedPostIds.has(String(plain._id))
    }
}

async function update(post_id, user_id, contenido, { file = null, removeImage = false } = {}) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("Post id invalido", 400)
    }

    const post = await post_repository.getActiveById(post_id)

    if (!post) {
        throw new ServerError("Publicacion no encontrada", 404)
    }

    if (!post.fk_id_usuario._id.equals(user_id)) {
        throw new ServerError("No tienes permisos para editar esta publicacion", 403)
    }

    const valid_contenido =
        contenido !== undefined
            ? validateOptionalContenido(contenido)
            : (post.contenido || "")

    const hasNewFile = Boolean(file && file.buffer)
    const previous_image_url = post.imagen_url || ""
    const willHaveImage = hasNewFile || (Boolean(previous_image_url) && !removeImage)

    if (!valid_contenido && !willHaveImage) {
        throw new ServerError("La publicacion debe tener texto o una imagen", 400)
    }

    let uploaded_image_url = ""
    let next_image_url = undefined

    if (hasNewFile) {
        const uploaded = await storage_service.uploadImage(file.buffer, {
            folder: "posts",
            filenamePrefix: String(user_id),
            maxDimension: POST_IMAGE_MAX_DIMENSION
        })
        uploaded_image_url = uploaded.url
        next_image_url = uploaded_image_url
    } else if (removeImage && previous_image_url) {
        next_image_url = ""
    }

    let updated_post
    try {
        const menciones = await resolveMentionsFromContent(valid_contenido)
        updated_post = await post_repository.updateContentById(
            post_id,
            valid_contenido,
            menciones,
            next_image_url
        )
    } catch (error) {
        if (uploaded_image_url) {
            await storage_service.deleteImageByUrl(uploaded_image_url)
        }
        throw error
    }

    if (previous_image_url && (uploaded_image_url || removeImage)) {
        await storage_service.deleteImageByUrl(previous_image_url)
    }

    return updated_post
}

async function remove(post_id, user_id) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("Post id invalido", 400)
    }

    const post = await post_repository.getActiveById(post_id)

    if (!post) {
        throw new ServerError("Publicacion no encontrada", 404)
    }

    if (!post.fk_id_usuario._id.equals(user_id)) {
        throw new ServerError("No tienes permisos para eliminar esta publicacion", 403)
    }

    const post_deleted = await post_repository.softDeleteById(post_id)

    const cleanupTasks = [
        like_repository.deleteByPostId(post_id),
        comment_repository.softDeleteByPostId(post_id),
        repost_repository.deleteByPostId(post_id),
        bookmark_repository.deleteByPostId(post_id),
        community_repository.clearPinnedPostByPostId(post_id),
        notification_service.deleteByPostId(post_id)
    ]

    if (post.imagen_url) {
        cleanupTasks.push(storage_service.deleteImageByUrl(post.imagen_url))
    }

    const cleanupResults = await Promise.allSettled(cleanupTasks)
    cleanupResults.forEach((result) => {
        if (result.status === 'rejected') {
            console.error('[PostService.remove] Error en limpieza en cascada:', result.reason?.message || result.reason)
        }
    })

    return post_deleted
}

const post_service = {
    create,
    getAll,
    getById,
    update,
    remove
}

export default post_service
