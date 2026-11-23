import CommunityMember from "../models/communityMember.model.js"

class CommunityMemberRepository {
    async create(user_id, community_id, role = 'user') {
        const membership_created = await CommunityMember.create({
            fk_id_usuario: user_id,
            fk_id_comunidad: community_id,
            rol: role
        })

        return await CommunityMember.findById(membership_created._id)
            .populate('fk_id_usuario', 'nombre username avatar_url')
    }

    async getByUserAndCommunity(user_id, community_id) {
        return await CommunityMember.findOne({
            fk_id_usuario: user_id,
            fk_id_comunidad: community_id
        })
    }

    async getAllMembersByCommunityId(community_id) {
        return await CommunityMember.find({
            fk_id_comunidad: community_id
        })
            .populate('fk_id_usuario', 'nombre username avatar_url')
    }

    async getAllCommunitiesByUserId(user_id) {
        return await CommunityMember.find({
            fk_id_usuario: user_id
        })
            .populate({
                path: 'fk_id_comunidad',
                match: { activa: true },
                select: 'nombre descripcion imagen_url fecha_creacion fk_id_creador',
                populate: {
                    path: 'fk_id_creador',
                    select: 'nombre avatar_url'
                }
            })
    }

    async countOwnersByCommunityId(community_id) {
        return await CommunityMember.countDocuments({
            fk_id_comunidad: community_id,
            rol: 'owner'
        })
    }

    async deleteById(membership_id) {
        return await CommunityMember.findByIdAndDelete(membership_id)
    }

    async deleteByCommunityId(community_id) {
        return await CommunityMember.deleteMany({
            fk_id_comunidad: community_id
        })
    }

    async getCountsByCommunityIds(community_ids) {
        const countsMap = new Map()
        if (!Array.isArray(community_ids) || community_ids.length === 0) {
            return countsMap
        }

        const rows = await CommunityMember.aggregate([
            { $match: { fk_id_comunidad: { $in: community_ids } } },
            { $group: { _id: "$fk_id_comunidad", members_count: { $sum: 1 } } }
        ])

        for (const row of rows) {
            countsMap.set(String(row._id), row.members_count)
        }

        return countsMap
    }
}

const community_member_repository = new CommunityMemberRepository()

export default community_member_repository
