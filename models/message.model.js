import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"
import { CONVERSATION_COLLECTION_NAME } from "./conversation.model.js"
import { POST_COLLECTION_NAME } from "./post.model.js"

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
        tipo: {
            type: String,
            enum: ['text', 'shared_post'],
            default: 'text'
        },
        contenido: {
            type: String,
            default: '',
            maxlength: 2000,
            trim: true
        },
        fk_id_publicacion_compartida: {
            type: mongoose.Schema.Types.ObjectId,
            ref: POST_COLLECTION_NAME,
            default: null
        },
        activo: {
            type: Boolean,
            default: true
        },
        entregado_a: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: USER_COLLECTION_NAME
                }
            ],
            default: []
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
