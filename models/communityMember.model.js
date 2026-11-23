import mongoose from "mongoose"
import { USER_COLLECTION_NAME } from "./user.model.js"
import { COMMUNITY_COLLECTION_NAME } from "./community.model.js"

const communityMemberSchema = new mongoose.Schema(
    {
        fk_id_usuario: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: USER_COLLECTION_NAME
        },
        fk_id_comunidad: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: COMMUNITY_COLLECTION_NAME
        },
        rol: {
            type: String,
            enum: ['user', 'admin', 'owner'],
            default: 'user'
        },
        fecha_creacion: {
            type: Date,
            default: Date.now
        }
    }
)

communityMemberSchema.index(
    { fk_id_usuario: 1, fk_id_comunidad: 1 },
    { unique: true }
)
communityMemberSchema.index({ fk_id_comunidad: 1, rol: 1 })

export const COMMUNITY_MEMBER_COLLECTION_NAME = 'MiembroComunidad'
const CommunityMember = mongoose.model(COMMUNITY_MEMBER_COLLECTION_NAME, communityMemberSchema)

export default CommunityMember
