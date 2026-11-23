import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"

const followSchema = new mongoose.Schema(
    {
        fk_id_seguidor: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        fk_id_seguido: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        fecha_creacion: {
            type: Date,
            default: Date.now
        }
    }
)

followSchema.index(
    { fk_id_seguidor: 1, fk_id_seguido: 1 },
    { unique: true }
)
followSchema.index({ fk_id_seguido: 1, fecha_creacion: -1 })

export const FOLLOW_COLLECTION_NAME = 'Follow'
const Follow = mongoose.model(FOLLOW_COLLECTION_NAME, followSchema)

export default Follow
