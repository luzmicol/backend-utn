import Repost from "../models/repost.model.js"
import User from "../models/user.model.js"

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
            .populate('fk_id_usuario', 'nombre username avatar_url')
    }

    async getByUserId(user_id) {
        return await Repost.find({
            fk_id_usuario: user_id
        })
            .sort({ fecha_creacion: -1 })
            .populate('fk_id_usuario', 'nombre username avatar_url')
            .populate({
                path: 'fk_id_publicacion',
                match: { activo: true },
                populate: [
                    { path: 'fk_id_usuario', select: 'nombre username avatar_url' },
                    { path: 'fk_id_comunidad', select: 'nombre' },
                    { path: 'menciones.fk_id_usuario', select: 'nombre username avatar_url' }
                ]
            })
    }

    async deleteByPostId(post_id) {
        return await Repost.deleteMany({
            fk_id_publicacion: post_id
        })
    }

    async deleteByPostIds(post_ids) {
        if (!Array.isArray(post_ids) || post_ids.length === 0) return
        return await Repost.deleteMany({
            fk_id_publicacion: { $in: post_ids }
        })
    }

    async getSummaryByPostIds(post_ids, user_id = null) {
        const summaryMap = new Map()
        if (!Array.isArray(post_ids) || post_ids.length === 0) {
            return summaryMap
        }

        const [grouped, userReposts] = await Promise.all([
            Repost.aggregate([
                { $match: { fk_id_publicacion: { $in: post_ids } } },
                { $sort: { fecha_creacion: -1 } },
                {
                    $group: {
                        _id: "$fk_id_publicacion",
                        reposts_count: { $sum: 1 },
                        latest_user_id: { $first: "$fk_id_usuario" }
                    }
                }
            ]),
            user_id
                ? Repost.find({
                    fk_id_publicacion: { $in: post_ids },
                    fk_id_usuario: user_id
                })
                    .select('fk_id_publicacion')
                    .lean()
                : Promise.resolve([])
        ])

        const latestUserIds = [
            ...new Set(grouped.map((row) => row.latest_user_id).filter(Boolean).map(String))
        ]
        const latestUsers = latestUserIds.length > 0
            ? await User.find({ _id: { $in: latestUserIds } })
                .select('nombre username avatar_url')
                .lean()
            : []
        const usersById = new Map(latestUsers.map((u) => [String(u._id), u]))

        const repostedSet = new Set(userReposts.map((item) => String(item.fk_id_publicacion)))

        for (const postId of post_ids) {
            const key = String(postId)
            summaryMap.set(key, {
                reposts_count: 0,
                reposted_by_me: repostedSet.has(key),
                latest_repost_by: null
            })
        }

        for (const row of grouped) {
            const key = String(row._id)
            const current = summaryMap.get(key) || {
                reposts_count: 0,
                reposted_by_me: repostedSet.has(key),
                latest_repost_by: null
            }
            current.reposts_count = row.reposts_count
            current.latest_repost_by = row.latest_user_id
                ? usersById.get(String(row.latest_user_id)) ?? null
                : null
            summaryMap.set(key, current)
        }

        return summaryMap
    }
}

const repost_repository = new RepostRepository()

export default repost_repository
