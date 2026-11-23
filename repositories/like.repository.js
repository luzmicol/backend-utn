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

    async deleteByPostId(post_id) {
        return await Like.deleteMany({
            fk_id_publicacion: post_id
        })
    }

    async deleteByPostIds(post_ids) {
        if (!Array.isArray(post_ids) || post_ids.length === 0) return
        return await Like.deleteMany({
            fk_id_publicacion: { $in: post_ids }
        })
    }

    async getSummaryByPostIds(post_ids, user_id = null) {
        const summaryMap = new Map()
        if (!Array.isArray(post_ids) || post_ids.length === 0) {
            return summaryMap
        }

        const [counts, userLikes] = await Promise.all([
            Like.aggregate([
                { $match: { fk_id_publicacion: { $in: post_ids } } },
                { $group: { _id: "$fk_id_publicacion", likes_count: { $sum: 1 } } }
            ]),
            user_id
                ? Like.find({
                    fk_id_publicacion: { $in: post_ids },
                    fk_id_usuario: user_id
                })
                    .select('fk_id_publicacion')
                    .lean()
                : Promise.resolve([])
        ])

        const likedSet = new Set(userLikes.map((item) => String(item.fk_id_publicacion)))

        for (const postId of post_ids) {
            const key = String(postId)
            summaryMap.set(key, {
                likes_count: 0,
                liked_by_me: likedSet.has(key)
            })
        }

        for (const row of counts) {
            const key = String(row._id)
            const current = summaryMap.get(key) || { likes_count: 0, liked_by_me: likedSet.has(key) }
            current.likes_count = row.likes_count
            summaryMap.set(key, current)
        }

        return summaryMap
    }
}

const like_repository = new LikeRepository()

export default like_repository
