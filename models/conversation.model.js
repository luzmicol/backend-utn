import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"

const groupMemberSubSchema = new mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        rol: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            default: 'member'
        },
        fecha_ingreso: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
)

const conversationSchema = new mongoose.Schema(
    {
        tipo: {
            type: String,
            enum: ['direct', 'group'],
            default: 'direct'
        },
        nombre: {
            type: String,
            default: "",
            maxlength: 60,
            trim: true
        },
        imagen_url: {
            type: String,
            default: ""
        },
        participantes: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: USER_COLLECTION_NAME
                }
            ],
            validate: {
                validator: function (arr) {
                    if (!Array.isArray(arr)) return false
                    return this.tipo === 'group' ? arr.length >= 1 : arr.length === 2
                },
                message: "Cantidad invalida de participantes para el tipo de conversacion"
            }
        },
        miembros_grupo: {
            type: [groupMemberSubSchema],
            default: []
        },
        participantes_key: {
            type: String,
            unique: true,
            sparse: true
        },
        ultimo_mensaje: {
            type: String,
            default: ""
        },
        estado: {
            type: String,
            enum: ['accepted', 'pending'],
            default: 'accepted'
        },
        solicitada_por: {
            type: mongoose.Schema.Types.ObjectId,
            ref: USER_COLLECTION_NAME,
            default: null
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
