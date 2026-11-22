import Like from "../models/like.model.js"

class LikeRepository {
    async create(user_id, post_id) {
        return await Like.create({
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id
        })
    }

    async getByUserAndPost(user_id, post_id) {
        return await Like.findOne({
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id
        })
    }

    async deleteByUserAndPost(user_id, post_id) {
        return await Like.findOneAndDelete({
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id
        })
    }

    async countByPostId(post_id) {
        return await Like.countDocuments({
            fk_id_publicacion: post_id
        })
    }
}

const like_repository = new LikeRepository()

export default like_repository
