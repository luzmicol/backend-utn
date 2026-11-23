import Conversation from "../models/conversation.model.js"

class ConversationRepository {
    buildParticipantsKey(user_id_a, user_id_b) {
        return [String(user_id_a), String(user_id_b)].sort().join('_')
    }

    async findByParticipantsKey(participantes_key) {
        return await Conversation.findOne({ participantes_key })
            .populate('participantes', 'nombre username avatar_url')
    }

    async create(user_id_a, user_id_b) {
        const participantes_key = this.buildParticipantsKey(user_id_a, user_id_b)
        const now = new Date()

        const created = await Conversation.create({
            participantes: [user_id_a, user_id_b],
            participantes_key,
            fecha_creacion: now,
            ultima_actualizacion: now
        })

        return await Conversation.findById(created._id)
            .populate('participantes', 'nombre username avatar_url')
    }

    async getById(conversation_id) {
        return await Conversation.findById(conversation_id)
            .populate('participantes', 'nombre username avatar_url')
    }

    async getAllByUserId(user_id) {
        return await Conversation.find({ participantes: user_id })
            .sort({ ultima_actualizacion: -1 })
            .populate('participantes', 'nombre username avatar_url')
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
}

const conversation_repository = new ConversationRepository()

export default conversation_repository
