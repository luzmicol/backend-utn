import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"

const conversationSchema = new mongoose.Schema(
    {
        participantes: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: USER_COLLECTION_NAME
                }
            ],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length === 2,
                message: "Una conversacion privada debe tener exactamente 2 participantes"
            }
        },
        participantes_key: {
            type: String,
            required: true,
            unique: true
        },
        ultimo_mensaje: {
            type: String,
            default: ""
        },
        fecha_creacion: {
            type: Date,
            default: Date.now
        },
        ultima_actualizacion: {
            type: Date,
            default: Date.now
        }
    }
)

conversationSchema.index({ participantes: 1, ultima_actualizacion: -1 })

export const CONVERSATION_COLLECTION_NAME = 'Conversacion'
const Conversation = mongoose.model(CONVERSATION_COLLECTION_NAME, conversationSchema)

export default Conversation
