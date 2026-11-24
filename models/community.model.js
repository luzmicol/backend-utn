import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"

const communitySchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            maxlength: 50,
            trim: true
        },
        descripcion: {
            type: String,
            maxlength: 1000,
            trim: true,
            default: ""
        },
        imagen_url: {
            type: String,
            default: ""
        },
        fk_id_creador: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        fk_id_publicacion_fijada: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Publicacion',
            default: null
        },
        activa: {
            type: Boolean,
            default: true
        },
        fecha_creacion: {
            type: Date,
            default: Date.now
        }
    }
)

communitySchema.index({ activa: 1, fecha_creacion: -1 })

export const COMMUNITY_COLLECTION_NAME = 'Comunidad'
const Community = mongoose.model(COMMUNITY_COLLECTION_NAME, communitySchema)

export default Community
