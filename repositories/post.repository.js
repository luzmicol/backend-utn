import Post from "../models/post.model.js"

class PostRepository {
    async create(user_id, contenido, community_id = null, menciones = [], imagen_url = '') {
        const post_created = await Post.create({
            contenido: contenido,
            imagen_url: imagen_url,
            fk_id_usuario: user_id,
            fk_id_comunidad: community_id,
            menciones: menciones
        })

        return await Post.findById(post_created._id)
            .populate('fk_id_usuario', 'nombre username avatar_url')
            .populate('fk_id_comunidad', 'nombre')
            .populate('menciones.fk_id_usuario', 'nombre username avatar_url')
    }

    async getAllActive({ user_id = null, community_id = null, page = 1, limit = 20 } = {}) {
        const safePage = Math.max(Number(page) || 1, 1)
        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50)
        const skip = (safePage - 1) * safeLimit

        const filter = { activo: true }
        if (user_id) {
            filter.fk_id_usuario = user_id
        }
        if (community_id) {
            filter.fk_id_comunidad = community_id
        }

        const [posts, total] = await Promise.all([
            Post.find(filter)
                .sort({ fecha_creacion: -1, _id: -1 })
                .skip(skip)
                .limit(safeLimit)
                .populate('fk_id_usuario', 'nombre username avatar_url')
                .populate('fk_id_comunidad', 'nombre')
                .populate('menciones.fk_id_usuario', 'nombre username avatar_url'),
            Post.countDocuments(filter)
        ])

        return {
            posts,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                has_more: skip + posts.length < total
            }
        }
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

    async updateContentById(post_id, contenido, menciones = [], imagen_url) {
        const update_fields = {
            contenido: contenido,
            menciones: menciones
        }
        if (imagen_url !== undefined) {
            update_fields.imagen_url = imagen_url
        }

        return await Post.findByIdAndUpdate(
            post_id,
            update_fields,
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

    async getActiveIdsAndImagesByCommunityId(community_id) {
        return await Post.find({
            fk_id_comunidad: community_id,
            activo: true
        }).select('_id imagen_url')
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
