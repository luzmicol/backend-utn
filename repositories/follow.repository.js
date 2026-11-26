import Follow from "../models/follow.model.js"

class FollowRepository {
    async create(follower_id, followed_id) {
        return await Follow.create({
            fk_id_seguidor: follower_id,
            fk_id_seguido: followed_id
        })
    }

    async getByFollowerAndFollowed(follower_id, followed_id) {
        return await Follow.findOne({
            fk_id_seguidor: follower_id,
            fk_id_seguido: followed_id
        })
    }

    async deleteByFollowerAndFollowed(follower_id, followed_id) {
        return await Follow.findOneAndDelete({
            fk_id_seguidor: follower_id,
            fk_id_seguido: followed_id
        })
    }

    async getFollowersByUserId(user_id) {
        return await Follow.find({
            fk_id_seguido: user_id
        })
            .sort({ fecha_creacion: -1 })
            .populate({
                path: 'fk_id_seguidor',
                match: { activo: true },
                select: 'nombre username avatar_url'
            })
    }

    async getFollowingByUserId(user_id) {
        return await Follow.find({
            fk_id_seguidor: user_id
        })
            .sort({ fecha_creacion: -1 })
            .populate({
                path: 'fk_id_seguido',
                match: { activo: true },
                select: 'nombre username avatar_url'
            })
    }

    async getFollowedIdsInList(follower_id, candidate_ids) {
        if (!Array.isArray(candidate_ids) || candidate_ids.length === 0) {
            return new Set()
        }
        const docs = await Follow.find({
            fk_id_seguidor: follower_id,
            fk_id_seguido: { $in: candidate_ids }
        })
            .select('fk_id_seguido')
            .lean()
        return new Set(docs.map((doc) => String(doc.fk_id_seguido)))
    }
}

const follow_repository = new FollowRepository()

export default follow_repository
