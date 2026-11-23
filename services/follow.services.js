import mongoose from "mongoose"
import follow_repository from "../repositories/follow.repository.js"
import user_repository from "../repositories/user.repository.js"
import notification_service from "./notification.services.js"
import ServerError from "../utils/error.util.js"

async function validateActiveUser(user_id) {
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        throw new ServerError("User id invalido", 400)
    }

    const user = await user_repository.getPublicById(user_id)

    if (!user || !user.activo) {
        throw new ServerError("Usuario no encontrado o inactivo", 404)
    }

    return user
}

async function followUser(follower_id, target_user_id) {
    await validateActiveUser(target_user_id)

    if (String(follower_id) === String(target_user_id)) {
        throw new ServerError("No puedes seguirte a ti mismo", 400)
    }

    const existing_follow = await follow_repository.getByFollowerAndFollowed(
        follower_id,
        target_user_id
    )

    if (existing_follow) {
        throw new ServerError("Ya sigues a este usuario", 400)
    }

    const follow_created = await follow_repository.create(follower_id, target_user_id)

    await notification_service.notify({
        recipient_id: target_user_id,
        actor_id: follower_id,
        tipo: 'follow'
    })

    return {
        follow: follow_created,
        is_following: true
    }
}

async function unfollowUser(follower_id, target_user_id) {
    await validateActiveUser(target_user_id)

    const follow_deleted = await follow_repository.deleteByFollowerAndFollowed(
        follower_id,
        target_user_id
    )

    if (!follow_deleted) {
        throw new ServerError("No sigues a este usuario", 404)
    }

    await notification_service.deleteByActorAndRecipientAndType(follower_id, target_user_id, 'follow')

    return {
        is_following: false
    }
}

async function getFollowers(target_user_id) {
    await validateActiveUser(target_user_id)

    const follows = await follow_repository.getFollowersByUserId(target_user_id)

    return follows
        .filter(item => item.fk_id_seguidor)
        .map(item => ({
            _id: item.fk_id_seguidor._id,
            nombre: item.fk_id_seguidor.nombre,
            username: item.fk_id_seguidor.username || '',
            avatar_url: item.fk_id_seguidor.avatar_url || '',
            fecha_follow: item.fecha_creacion
        }))
}

async function getFollowing(target_user_id) {
    await validateActiveUser(target_user_id)

    const follows = await follow_repository.getFollowingByUserId(target_user_id)

    return follows
        .filter(item => item.fk_id_seguido)
        .map(item => ({
            _id: item.fk_id_seguido._id,
            nombre: item.fk_id_seguido.nombre,
            username: item.fk_id_seguido.username || '',
            avatar_url: item.fk_id_seguido.avatar_url || '',
            fecha_follow: item.fecha_creacion
        }))
}

async function getFollowStatus(follower_id, target_user_id) {
    await validateActiveUser(target_user_id)

    const existing_follow = await follow_repository.getByFollowerAndFollowed(
        follower_id,
        target_user_id
    )

    return {
        is_following: Boolean(existing_follow)
    }
}

const follow_service = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStatus
}

export default follow_service
