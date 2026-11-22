import mongoose from "mongoose"

/* 
mongoose trabaja con schemas, basicamente nos permite definir que tipo de dato/estructura guardara un documento en una coleccion
*/
const userSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        fecha_creacion: {
            type: Date,
            default: Date.now
        },
        activo: {
            type: Boolean,
            default: true
        },
        email_verificado: {
            type: Boolean,
            default: false
        },
        /*
        jti del ultimo mail de recuperacion enviado.
        Es la base del uso unico del token: al pedir uno nuevo se sobrescribe
        (queda invalidado el anterior) y al usarse se pone en null.
        */
        password_reset_jti: {
            type: String,
            default: null
        }
    },
    {
        toJSON: {
            transform: (_doc, ret) => {
                delete ret.password
                delete ret.password_reset_jti
                return ret
            }
        }
    }
)
export const USER_COLLECTION_NAME = 'Usuario'
const User = mongoose.model(USER_COLLECTION_NAME, userSchema)

export default User 