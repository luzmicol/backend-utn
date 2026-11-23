import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"
import { CONVERSATION_COLLECTION_NAME } from "./conversation.model.js"

const messageSchema = new mongoose.Schema(
    {
        fk_id_conversacion: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: CONVERSATION_COLLECTION_NAME
        },
        fk_id_remitente: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        contenido: {
            type: String,
            required: true,
            maxlength: 2000,
            trim: true
        },
        activo: {
            type: Boolean,
            default: true
        },
        leido_por: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: USER_COLLECTION_NAME
                }
            ],
            default: []
        },
        fecha_creacion: {
            type: Date,
            default: Date.now
        }
    }
)

messageSchema.index({ fk_id_conversacion: 1, fecha_creacion: 1 })
messageSchema.index({ fk_id_conversacion: 1, activo: 1, fk_id_remitente: 1 })

export const MESSAGE_COLLECTION_NAME = 'Mensaje'
const Message = mongoose.model(MESSAGE_COLLECTION_NAME, messageSchema)

export default Message
