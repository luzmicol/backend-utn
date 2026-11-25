import Conversation from "../models/conversation.model.js"

const PARTICIPANT_SELECT = 'nombre username avatar_url'

function applyConversationPopulates(query) {
    return query
        .populate('participantes', PARTICIPANT_SELECT)
        .populate('miembros_grupo.usuario', PARTICIPANT_SELECT)
}

class ConversationRepository {
    buildParticipantsKey(user_id_a, user_id_b) {
        return [String(user_id_a), String(user_id_b)].sort().join('_')
    }

    async findByParticipantsKey(participantes_key) {
        return await applyConversationPopulates(
            Conversation.findOne({ participantes_key })
        )
    }

    async create(user_id_a, user_id_b, { estado = 'accepted', solicitada_por = null } = {}) {
        const participantes_key = this.buildParticipantsKey(user_id_a, user_id_b)
        const now = new Date()

        const created = await Conversation.create({
            tipo: 'direct',
            participantes: [user_id_a, user_id_b],
            participantes_key,
            estado,
            solicitada_por,
            fecha_creacion: now,
            ultima_actualizacion: now
        })

        return await applyConversationPopulates(Conversation.findById(created._id))
    }

    async createGroup({ nombre, imagen_url = '', participantes, miembros_grupo }) {
        const now = new Date()
        const created = await Conversation.create({
            tipo: 'group',
            nombre,
            imagen_url,
            participantes,
            miembros_grupo,
            estado: 'accepted',
            solicitada_por: null,
            fecha_creacion: now,
            ultima_actualizacion: now
        })

        return await applyConversationPopulates(Conversation.findById(created._id))
    }

    async updateById(conversation_id, update_data) {
        return await applyConversationPopulates(
            Conversation.findByIdAndUpdate(
                conversation_id,
                update_data,
                { returnDocument: 'after' }
            )
        )
    }

    async acceptRequest(conversation_id) {
        return await applyConversationPopulates(
            Conversation.findByIdAndUpdate(
                conversation_id,
                {
                    estado: 'accepted',
                    solicitada_por: null,
                    ultima_actualizacion: new Date()
                },
                { returnDocument: 'after' }
            )
        )
    }

    async deleteById(conversation_id) {
        return await Conversation.findByIdAndDelete(conversation_id)
    }

    async getById(conversation_id) {
        return await applyConversationPopulates(Conversation.findById(conversation_id))
    }

    async getAllByUserId(user_id) {
        return await applyConversationPopulates(
            Conversation.find({ participantes: user_id })
                .sort({ ultima_actualizacion: -1 })
        )
    }

    async getIdsByUserId(user_id) {
        const docs = await Conversation.find({ participantes: user_id })
            .select('_id')
            .lean()
        return docs.map((doc) => doc._id)
    }

    async touchLastActivity(conversation_id, preview_text) {
        const update = { ultima_actualizacion: new Date() }
        if (preview_text !== undefined) {
            update.ultimo_mensaje = preview_text.slice(0, 120)
        }

        return await Conversation.findByIdAndUpdate(
            conversation_id,
            update,
            { returnDocument: 'after' }
        )
    }

    async updateLastMessagePreview(conversation_id, preview_text = '') {
        return await Conversation.findByIdAndUpdate(
            conversation_id,
            { ultimo_mensaje: (preview_text || '').slice(0, 120) },
            { returnDocument: 'after' }
        )
    }
}

const conversation_repository = new ConversationRepository()

export default conversation_repository
