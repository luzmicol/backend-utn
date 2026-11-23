import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"
import { POST_COLLECTION_NAME } from "./post.model.js"

const repostSchema = new mongoose.Schema(
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

repostSchema.index(
    { fk_id_usuario: 1, fk_id_publicacion: 1 },
    { unique: true }
)
repostSchema.index({ fk_id_publicacion: 1, fecha_creacion: -1 })
repostSchema.index({ fk_id_usuario: 1, fecha_creacion: -1 })

export const REPOST_COLLECTION_NAME = 'Repost'
const Repost = mongoose.model(REPOST_COLLECTION_NAME, repostSchema)

export default Repost
