import Message from "../models/message.model.js"

class MessageRepository {
    async create(conversation_id, sender_id, contenido) {
        const created = await Message.create({
            fk_id_conversacion: conversation_id,
            fk_id_remitente: sender_id,
            contenido: contenido,
            leido_por: [sender_id]
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

    async getLatestActiveByConversationId(conversation_id) {
        return await Message.findOne({
            fk_id_conversacion: conversation_id,
            activo: true
        }).sort({ fecha_creacion: -1, _id: -1 })
    }

    async softDeleteById(message_id) {
        return await Message.findByIdAndUpdate(
            message_id,
            { activo: false },
            { returnDocument: 'after' }
        )
    }

    async markConversationAsRead(conversation_id, user_id) {
        return await Message.updateMany(
            {
                fk_id_conversacion: conversation_id,
                activo: true,
                fk_id_remitente: { $ne: user_id },
                leido_por: { $ne: user_id }
            },
            {
                $addToSet: { leido_por: user_id }
            }
        )
    }

    async countUnreadByConversationIds(conversation_ids, user_id) {
        if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
            return 0
        }

        return await Message.countDocuments({
            fk_id_conversacion: { $in: conversation_ids },
            activo: true,
            fk_id_remitente: { $ne: user_id },
            leido_por: { $ne: user_id }
        })
    }
}

const message_repository = new MessageRepository()

export default message_repository
