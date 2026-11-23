import mongoose from "mongoose"
import like_repository from "../repositories/like.repository.js"
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

async function likePost(post_id, user_id) {
    const post = await validateActivePost(post_id)

    const existing_like = await like_repository.getByUserAndPost(user_id, post_id)

    if (existing_like) {
        throw new ServerError("Ya diste like a esta publicacion", 400)
    }

    const like_created = await like_repository.create(user_id, post_id)
    const likes_count = await like_repository.countByPostId(post_id)

    await notification_service.notify({
        recipient_id: post.fk_id_usuario?._id || post.fk_id_usuario,
        actor_id: user_id,
        tipo: 'like',
        post_id: post._id
    })

    return {
        like: like_created,
        likes_count: likes_count,
        liked_by_me: true
    }
}

async function unlikePost(post_id, user_id) {
    await validateActivePost(post_id)

    const like_deleted = await like_repository.deleteByUserAndPost(user_id, post_id)

    if (!like_deleted) {
        throw new ServerError("No habias dado like a esta publicacion", 404)
    }

    await notification_service.deleteByActorAndPostAndType(user_id, post_id, 'like')

    const likes_count = await like_repository.countByPostId(post_id)

    return {
        likes_count: likes_count,
        liked_by_me: false
    }
}

async function getPostLikesInfo(post_id, user_id) {
    await validateActivePost(post_id)

    const [likes_count, existing_like] = await Promise.all([
        like_repository.countByPostId(post_id),
        like_repository.getByUserAndPost(user_id, post_id)
    ])

    return {
        likes_count: likes_count,
        liked_by_me: Boolean(existing_like)
    }
}

const like_service = {
    likePost,
    unlikePost,
    getPostLikesInfo
}

export default like_service
