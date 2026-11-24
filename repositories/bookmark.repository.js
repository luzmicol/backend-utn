import Bookmark from "../models/bookmark.model.js"

class BookmarkRepository {
    async create(user_id, post_id) {
        return await Bookmark.create({
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id
        })
    }

    async getByUserAndPost(user_id, post_id) {
        return await Bookmark.findOne({
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id
        })
    }

    async deleteByUserAndPost(user_id, post_id) {
        return await Bookmark.findOneAndDelete({
            fk_id_usuario: user_id,
            fk_id_publicacion: post_id
        })
    }

    async getByUserIdPaginated(user_id, page = 1, limit = 20) {
        const skip = (page - 1) * limit

        const [rows, total] = await Promise.all([
            Bookmark.find({ fk_id_usuario: user_id })
                .sort({ fecha_creacion: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'fk_id_publicacion',
                    match: { activo: true },
                    populate: [
                        { path: 'fk_id_usuario', select: 'nombre username avatar_url' },
                        { path: 'fk_id_comunidad', select: 'nombre' },
                        { path: 'menciones.fk_id_usuario', select: 'nombre username avatar_url' }
                    ]
                }),
            Bookmark.countDocuments({ fk_id_usuario: user_id })
        ])

        return {
            bookmarks: rows.filter((row) => Boolean(row.fk_id_publicacion)),
            total
        }
    }

    async getBookmarkedPostIdsByUser(user_id, post_ids) {
        const bookmarkedSet = new Set()
        if (!user_id || !Array.isArray(post_ids) || post_ids.length === 0) {
            return bookmarkedSet
        }

        const rows = await Bookmark.find({
            fk_id_usuario: user_id,
            fk_id_publicacion: { $in: post_ids }
        })
            .select('fk_id_publicacion')
            .lean()

        for (const row of rows) {
            bookmarkedSet.add(String(row.fk_id_publicacion))
        }

        return bookmarkedSet
    }

    async deleteByPostId(post_id) {
        return await Bookmark.deleteMany({
            fk_id_publicacion: post_id
        })
    }

    async deleteByPostIds(post_ids) {
        if (!Array.isArray(post_ids) || post_ids.length === 0) return
        return await Bookmark.deleteMany({
            fk_id_publicacion: { $in: post_ids }
        })
    }
}

const bookmark_repository = new BookmarkRepository()

export default bookmark_repository
