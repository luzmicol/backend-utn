import Community from "../models/community.model.js"

class CommunityRepository {
    async create(user_id, nombre, descripcion = "") {
        const community_created = await Community.create({
            nombre: nombre,
            descripcion: descripcion,
            fk_id_creador: user_id
        })

        return await Community.findById(community_created._id)
            .populate('fk_id_creador', 'nombre username avatar_url')
    }

    async getAllActive() {
        return await Community.find({ activa: true })
            .sort({ fecha_creacion: -1 })
            .populate('fk_id_creador', 'nombre username avatar_url')
    }

    async getActiveById(community_id) {
        return await Community.findOne({
            _id: community_id,
            activa: true
        })
            .populate('fk_id_creador', 'nombre username avatar_url')
    }

    async updateById(community_id, update_data) {
        return await Community.findByIdAndUpdate(
            community_id,
            update_data,
            { returnDocument: 'after' }
        )
            .populate('fk_id_creador', 'nombre username avatar_url')
    }

    async softDeleteById(community_id) {
        return await Community.findByIdAndUpdate(
            community_id,
            { activa: false, fk_id_publicacion_fijada: null },
            { returnDocument: 'after' }
        )
    }

    async clearPinnedPostByPostId(post_id) {
        return await Community.updateMany(
            { fk_id_publicacion_fijada: post_id },
            { fk_id_publicacion_fijada: null }
        )
    }
}

const community_repository = new CommunityRepository()

export default community_repository
