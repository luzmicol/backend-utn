import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"
import { POST_COLLECTION_NAME } from "./post.model.js"

const commentSchema = new mongoose.Schema(
    {
        contenido: {
            type: String,
            required: true,
            maxlength: 1000,
            trim: true
        },
        fk_id_usuario: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        fk_id_publicacion: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: POST_COLLECTION_NAME
        },
        menciones: {
            type: [
                {
                    fk_id_usuario: {
                        type: mongoose.Schema.Types.ObjectId,
                        required: true,
                        ref: USER_COLLECTION_NAME
                    },
                    username_al_mencionar: {
                        type: String,
                        required: true,
                        lowercase: true,
                        trim: true
                    }
                }
            ],
            default: []
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

commentSchema.index({ fk_id_publicacion: 1, fecha_creacion: 1 })

export const COMMENT_COLLECTION_NAME = 'Comentario'
const Comment = mongoose.model(COMMENT_COLLECTION_NAME, commentSchema)

export default Comment
