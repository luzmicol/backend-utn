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
                select: 'nombre descripcion fecha_creacion fk_id_creador',
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
}

const community_member_repository = new CommunityMemberRepository()

export default community_member_repository
