import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"
import { POST_COLLECTION_NAME } from "./post.model.js"
import { COMMENT_COLLECTION_NAME } from "./comment.model.js"
import { CONVERSATION_COLLECTION_NAME } from "./conversation.model.js"
import { MESSAGE_COLLECTION_NAME } from "./message.model.js"

export const NOTIFICATION_TYPES = ['follow', 'like', 'comment', 'repost', 'mention', 'message']

const notificationSchema = new mongoose.Schema(
    {
        fk_id_destinatario: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        fk_id_emisor: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        tipo: {
            type: String,
            enum: NOTIFICATION_TYPES,
            required: true
        },
        fk_id_publicacion: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: POST_COLLECTION_NAME
        },
        fk_id_comentario: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: COMMENT_COLLECTION_NAME
        },
        fk_id_conversacion: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: CONVERSATION_COLLECTION_NAME
        },
        fk_id_mensaje: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: MESSAGE_COLLECTION_NAME
        },
        leida: {
            type: Boolean,
            default: false
        },
        fecha_creacion: {
            type: Date,
            default: Date.now
        }
    }
)

notificationSchema.index({ fk_id_destinatario: 1, fecha_creacion: -1 })
notificationSchema.index({ fk_id_destinatario: 1, leida: 1 })

export const NOTIFICATION_COLLECTION_NAME = 'Notificacion'
const Notification = mongoose.model(NOTIFICATION_COLLECTION_NAME, notificationSchema)

export default Notification
