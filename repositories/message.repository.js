import Message from "../models/message.model.js"

class MessageRepository {
    async create(conversation_id, sender_id, contenido) {
        const created = await Message.create({
            fk_id_conversacion: conversation_id,
            fk_id_remitente: sender_id,
            contenido: contenido
        })

        return await Message.findById(created._id)
            .populate('fk_id_remitente', 'nombre username avatar_url')
    }

    async getByConversationPaginated(conversation_id, { page = 1, limit = 30 } = {}) {
        const safePage = Math.max(Number(page) || 1, 1)
        const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100)
        const skip = (safePage - 1) * safeLimit

        const filter = {
            fk_id_conversacion: conversation_id,
            activo: true
        }

        const [messages, total] = await Promise.all([
            Message.find(filter)
                .sort({ fecha_creacion: 1 })
                .skip(skip)
                .limit(safeLimit)
                .populate('fk_id_remitente', 'nombre username avatar_url'),
            Message.countDocuments(filter)
        ])

        return {
            messages,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                has_more: skip + messages.length < total
            }
        }
    }

    async getActiveById(message_id) {
        return await Message.findOne({
            _id: message_id,
            activo: true
        })
    }

    async softDeleteById(message_id) {
        return await Message.findByIdAndUpdate(
            message_id,
            { activo: false },
            { returnDocument: 'after' }
        )
    }
}

const message_repository = new MessageRepository()

export default message_repository
