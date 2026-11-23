import Comment from "../models/comment.model.js"

class CommentRepository {
    async create(user_id, post_id, contenido, menciones = []) {
        const comment_created = await Comment.create({
            contenido: contenido,
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id,
            menciones: menciones
        })

        return await Comment.findById(comment_created._id)
            .populate('fk_id_usuario', 'nombre username avatar_url')
            .populate('menciones.fk_id_usuario', 'nombre username avatar_url')
    }

    async getActiveByPostId(post_id) {
        return await Comment.find({
            fk_id_publicacion: post_id,
            activo: true
        })
            .sort({ fecha_creacion: 1 })
            .populate('fk_id_usuario', 'nombre username avatar_url')
            .populate('menciones.fk_id_usuario', 'nombre username avatar_url')
    }

    async getActiveByIdAndPost(comment_id, post_id) {
        return await Comment.findOne({
            _id: comment_id,
            fk_id_publicacion: post_id,
            activo: true
        })
    }

    async softDeleteById(comment_id) {
        return await Comment.findByIdAndUpdate(
            comment_id,
            { activo: false },
            { returnDocument: 'after' }
        )
    }

    async softDeleteByPostId(post_id) {
        return await Comment.updateMany(
            { fk_id_publicacion: post_id, activo: true },
            { activo: false }
        )
    }

    async softDeleteByPostIds(post_ids) {
        if (!Array.isArray(post_ids) || post_ids.length === 0) return
        return await Comment.updateMany(
            { fk_id_publicacion: { $in: post_ids }, activo: true },
            { activo: false }
        )
    }
}

const comment_repository = new CommentRepository()

export default comment_repository
