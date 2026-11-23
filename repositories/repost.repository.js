import Repost from "../models/repost.model.js"

class RepostRepository {
    async create(user_id, post_id) {
        return await Repost.create({
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id
        })
    }

    async getByUserAndPost(user_id, post_id) {
        return await Repost.findOne({
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id
        })
    }

    async deleteByUserAndPost(user_id, post_id) {
        return await Repost.findOneAndDelete({
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id
        })
    }

    async countByPostId(post_id) {
        return await Repost.countDocuments({
            fk_id_publicacion: post_id
        })
    }

    async getLatestByPostId(post_id) {
        return await Repost.findOne({
            fk_id_publicacion: post_id
        })
            .sort({ fecha_creacion: -1 })
            .populate('fk_id_usuario', 'nombre avatar_url')
    }

    async getByUserId(user_id) {
        return await Repost.find({
            fk_id_usuario: user_id
        })
            .sort({ fecha_creacion: -1 })
            .populate('fk_id_usuario', 'nombre avatar_url')
            .populate({
                path: 'fk_id_publicacion',
                match: { activo: true },
                populate: [
                    { path: 'fk_id_usuario', select: 'nombre avatar_url' },
                    { path: 'fk_id_comunidad', select: 'nombre' }
                ]
            })
    }

    async deleteByPostId(post_id) {
        return await Repost.deleteMany({
            fk_id_publicacion: post_id
        })
    }
}

const repost_repository = new RepostRepository()

export default repost_repository
