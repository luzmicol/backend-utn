import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"
import { POST_COLLECTION_NAME } from "./post.model.js"

const likeSchema = new mongoose.Schema(
    {
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
        fecha_creacion: {
            type: Date,
            default: Date.now
        }
    }
)

likeSchema.index(
    { fk_id_usuario: 1, fk_id_publicacion: 1 },
    { unique: true }
)
likeSchema.index({ fk_id_publicacion: 1 })

export const LIKE_COLLECTION_NAME = 'Like'
const Like = mongoose.model(LIKE_COLLECTION_NAME, likeSchema)

export default Like
