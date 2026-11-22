import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"
import { COMMUNITY_COLLECTION_NAME } from "./community.model.js"

const postSchema = new mongoose.Schema(
    {
        contenido: {
            type: String,
            required: true,
            maxlength: 2000,
            trim: true
        },
        fk_id_usuario: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        fk_id_comunidad: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            default: null,
            ref: COMMUNITY_COLLECTION_NAME
        },
        activo: {
            type: Boolean,
            default: true
        },
        fecha_creacion: {
            type: Date,
            default: Date.now
        }
    }
)

postSchema.index({ fecha_creacion: -1 })
postSchema.index({ fk_id_comunidad: 1, fecha_creacion: -1 })
postSchema.index({ fk_id_usuario: 1, fecha_creacion: -1 })

export const POST_COLLECTION_NAME = 'Publicacion'
const Post = mongoose.model(POST_COLLECTION_NAME, postSchema)

export default Post
