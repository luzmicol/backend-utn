import Post from "../models/post.model.js"

class PostRepository {
    async create(user_id, contenido, community_id = null, menciones = []) {
        const post_created = await Post.create({
            contenido: contenido,
            fk_id_usuario: user_id,
            fk_id_comunidad: community_id,
            menciones: menciones
        })

        return await Post.findById(post_created._id)
            .populate('fk_id_usuario', 'nombre username avatar_url')
            .populate('fk_id_comunidad', 'nombre')
            .populate('menciones.fk_id_usuario', 'nombre username avatar_url')
    }

    async getAllActive() {
        return await Post.find({ activo: true })
            .sort({ fecha_creacion: -1 })
            .populate('fk_id_usuario', 'nombre username avatar_url')
            .populate('fk_id_comunidad', 'nombre')
            .populate('menciones.fk_id_usuario', 'nombre username avatar_url')
    }

    async getActiveById(post_id) {
        return await Post.findOne({
            _id: post_id,
            activo: true
        })
            .populate('fk_id_usuario', 'nombre username avatar_url')
            .populate('fk_id_comunidad', 'nombre')
            .populate('menciones.fk_id_usuario', 'nombre username avatar_url')
    }

    async updateContentById(post_id, contenido, menciones = []) {
        return await Post.findByIdAndUpdate(
            post_id,
            { contenido: contenido, menciones: menciones },
            { returnDocument: 'after' }
        )
            .populate('fk_id_usuario', 'nombre username avatar_url')
            .populate('fk_id_comunidad', 'nombre')
            .populate('menciones.fk_id_usuario', 'nombre username avatar_url')
    }

    async softDeleteById(post_id) {
        return await Post.findByIdAndUpdate(
            post_id,
            { activo: false },
            { returnDocument: 'after' }
        )
    }

    async softDeleteByCommunityId(community_id) {
        return await Post.updateMany(
            { fk_id_comunidad: community_id, activo: true },
            { activo: false }
        )
    }
}

const post_repository = new PostRepository()

export default post_repository
