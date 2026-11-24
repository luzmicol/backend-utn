import mongoose from "mongoose"
import Message from "../models/message.model.js"

const SHARED_POST_POPULATE = {
    path: 'fk_id_publicacion_compartida',
    match: { activo: true },
    select: '_id contenido imagen_url fecha_creacion fk_id_usuario fk_id_comunidad',
    populate: [
        { path: 'fk_id_usuario', select: 'nombre username avatar_url' },
        { path: 'fk_id_comunidad', select: 'nombre' }
    ]
}

class MessageRepository {
    async create(conversation_id, sender_id, contenido, { tipo = 'text', shared_post_id = null } = {}) {
        const created = await Message.create({
            fk_id_conversacion: conversation_id,
            fk_id_remitente: sender_id,
            tipo,
            contenido: contenido || '',
            fk_id_publicacion_compartida: shared_post_id || null,
            leido_por: [sender_id]
        })

        return await Message.findById(created._id)
            .populate('fk_id_remitente', 'nombre username avatar_url')
            .populate(SHARED_POST_POPULATE)
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
                .populate('fk_id_remitente', 'nombre username avatar_url')
                .populate(SHARED_POST_POPULATE),
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

    async countActiveByConversationId(conversation_id) {
        return await Message.countDocuments({
            fk_id_conversacion: conversation_id,
            activo: true
        })
    }

    async deleteByConversationId(conversation_id) {
        return await Message.deleteMany({
            fk_id_conversacion: conversation_id
        })
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
                $addToSet: {
                    leido_por: user_id,
                    entregado_a: user_id
                }
            }
        )
    }

    async markDeliveredForUser(conversation_ids, user_id) {
        if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
            return
        }

        return await Message.updateMany(
            {
                fk_id_conversacion: { $in: conversation_ids },
                activo: true,
                fk_id_remitente: { $ne: user_id },
                entregado_a: { $ne: user_id }
            },
            {
                $addToSet: { entregado_a: user_id }
            }
        )
    }

    async getUnreadCountsByConversationIds(conversation_ids, user_id) {
        const countsMap = new Map()
        if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
            return countsMap
        }

        const userObjectId = new mongoose.Types.ObjectId(String(user_id))
        const rows = await Message.aggregate([
            {
                $match: {
                    fk_id_conversacion: { $in: conversation_ids },
                    activo: true,
                    fk_id_remitente: { $ne: userObjectId },
                    leido_por: { $ne: userObjectId }
                }
            },
            {
                $group: {
                    _id: "$fk_id_conversacion",
                    unread_count: { $sum: 1 }
                }
            }
        ])

        for (const row of rows) {
            countsMap.set(String(row._id), row.unread_count)
        }

        return countsMap
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
