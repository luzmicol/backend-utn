import mongoose from "mongoose"
import repost_repository from "../repositories/repost.repository.js"
import bookmark_repository from "../repositories/bookmark.repository.js"
import post_repository from "../repositories/post.repository.js"
import notification_service from "./notification.services.js"
import ServerError from "../utils/error.util.js"

async function validateActivePost(post_id) {
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
        throw new ServerError("Post id invalido", 400)
    }

    const post = await post_repository.getActiveById(post_id)

    if (!post) {
        throw new ServerError("Publicacion no encontrada o inactiva", 404)
    }

    return post
}

async function repostPost(post_id, user_id) {
    const post = await validateActivePost(post_id)

    const existing_repost = await repost_repository.getByUserAndPost(user_id, post_id)

    if (existing_repost) {
        throw new ServerError("Ya reposteaste esta publicacion", 400)
    }

    let repost_created
    try {
        repost_created = await repost_repository.create(user_id, post_id)
    } catch (error) {
        if (error?.code === 11000) {
            throw new ServerError("Ya reposteaste esta publicacion", 409)
        }
        throw error
    }
    await notification_service.notify({
        recipient_id: post.fk_id_usuario?._id || post.fk_id_usuario,
        actor_id: user_id,
        tipo: 'repost',
        post_id: post._id
    })
    const [reposts_count, latest_repost] = await Promise.all([
        repost_repository.countByPostId(post_id),
        repost_repository.getLatestByPostId(post_id)
    ])

    return {
        repost: repost_created,
        reposts_count: reposts_count,
        reposted_by_me: true,
        latest_repost_by: latest_repost?.fk_id_usuario ?? null
    }
}

async function unrepostPost(post_id, user_id) {
    await validateActivePost(post_id)

    const repost_deleted = await repost_repository.deleteByUserAndPost(user_id, post_id)

    if (!repost_deleted) {
        throw new ServerError("No habias reposteado esta publicacion", 404)
    }

    await notification_service.deleteByActorAndPostAndType(user_id, post_id, 'repost')

    const [reposts_count, latest_repost] = await Promise.all([
        repost_repository.countByPostId(post_id),
        repost_repository.getLatestByPostId(post_id)
    ])

    return {
        reposts_count: reposts_count,
        reposted_by_me: false,
        latest_repost_by: latest_repost?.fk_id_usuario ?? null
    }
}

async function getPostRepostsInfo(post_id, user_id) {
    await validateActivePost(post_id)

    const [reposts_count, existing_repost, latest_repost] = await Promise.all([
        repost_repository.countByPostId(post_id),
        repost_repository.getByUserAndPost(user_id, post_id),
        repost_repository.getLatestByPostId(post_id)
    ])

    return {
        reposts_count: reposts_count,
        reposted_by_me: Boolean(existing_repost),
        latest_repost_by: latest_repost?.fk_id_usuario ?? null
    }
}

async function getUserReposts(target_user_id, requester_id = null) {
    if (!mongoose.Types.ObjectId.isValid(target_user_id)) {
        throw new ServerError("User id invalido", 400)
    }

    const reposts = await repost_repository.getByUserId(target_user_id)
    const validReposts = reposts.filter(item => item.fk_id_publicacion)

    const postIds = validReposts.map(item => item.fk_id_publicacion._id)
    const bookmarkedPostIds = requester_id && postIds.length > 0
        ? await bookmark_repository.getBookmarkedPostIdsByUser(requester_id, postIds)
        : new Set()

    return validReposts.map(item => {
        const plainPost = typeof item.fk_id_publicacion.toObject === 'function'
            ? item.fk_id_publicacion.toObject()
            : { ...item.fk_id_publicacion }

        return {
            _id: item._id,
            fecha_repost: item.fecha_creacion,
            reposted_by: item.fk_id_usuario,
            post: {
                ...plainPost,
                is_bookmarked: bookmarkedPostIds.has(String(plainPost._id))
            }
        }
    })
}

const repost_service = {
    repostPost,
    unrepostPost,
    getPostRepostsInfo,
    getUserReposts
}

export default repost_service
