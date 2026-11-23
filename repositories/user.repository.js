/* 
Un repository es donde manejamos la comunicacion con nuestros datos (Generalmente la DB)
*/

import User from "../models/user.model.js"

class UserRepository {

    async create(nombre, email, password, username) {
        const user_created = await User.create({
            nombre: nombre,
            email: email,
            password: password,
            ...(username ? { username } : {})
        })
        return user_created
    }

    async get(){
        const result = await User.find({ activo: true }).select('_id nombre username avatar_url fecha_creacion')
        return result
    }

    async getPublicProfileById(user_id){
        const result = await User.findOne({ _id: user_id, activo: true }).select('_id nombre username avatar_url fecha_creacion')
        return result
    }

    async getOwnProfileById(user_id){
        const result = await User.findOne({ _id: user_id, activo: true }).select('_id nombre username username_last_changed_at email avatar_url fecha_creacion activo email_verificado')
        return result
    }

    async getAuthStatusById(user_id){
        const result = await User.findById(user_id)
            .select('_id nombre username email avatar_url activo')
            .lean()
        return result
    }

    async getByUsername(username){
        return await User.findOne({ username: username }).select('_id username').lean()
    }

    async getActiveByUsernames(usernames) {
        if (!Array.isArray(usernames) || usernames.length === 0) return []
        return await User.find({
            username: { $in: usernames },
            activo: true
        })
            .select('_id nombre username avatar_url')
            .lean()
    }

    async searchPublicUsers(term = '', limit = 6) {
        const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 10)
        const trimmed = typeof term === 'string' ? term.trim() : ''

        const query = { activo: true }

        if (trimmed) {
            const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(escaped, 'i')
            query.$or = [
                { username: regex },
                { nombre: regex }
            ]
        }

        return await User.find(query)
            .select('_id nombre username avatar_url')
            .limit(safeLimit)
            .lean()
    }

    async updateUsernameAtomically(user_id, new_username, cooldown_cutoff_date) {
        return await User.findOneAndUpdate(
            {
                _id: user_id,
                activo: true,
                $or: [
                    { username_last_changed_at: null },
                    { username_last_changed_at: { $lte: cooldown_cutoff_date } }
                ]
            },
            {
                username: new_username,
                username_last_changed_at: new Date()
            },
            { returnDocument: 'after' }
        ).select('_id nombre username username_last_changed_at email avatar_url fecha_creacion activo email_verificado')
    }

    async getByCreationDate(min_date, max_date){
        const result = await User.find({
            fecha_creacion: {
                $gte: new Date(min_date), //Establece una fecha minima
                $lt: new Date(max_date) //Establece una fecha maxima
            }
        })
        return result
    }

    async getByName(name){
        await User.find({
            nombre: name, 
            activo: true
        })
    }

    async getBySearchTerm(term){
        await User.find({
            nombre: {
                $regex: term,
                $options: 'i' //Permite buscar de forma 'no case sensitive' (Sin diferenciar entre mayus y minus)
            }, 
            activo: true
        })
        .limit(5)
    }

    async getById (user_id){
        const result = await User.findById(user_id)
    
        return result
    }

    async getPublicById (user_id){
        const result = await User.findById(user_id).select('-password -password_reset_jti')

        return result
    }

    async softDeleteById(user_id){
        await User.findByIdAndUpdate(user_id, {activo: false})
    }

    async deleteById (user_id){
        await User.findByIdAndDelete(user_id)
    }
    
    async  getByEmail (email){
    
        //Te devuelve null (si no encuentra) o un objeto con el resultado
        const result = await User.findOne({email: email})
        return result
    } 

    async updateById(user_id, data) {
        const result = await User.findByIdAndUpdate(
            user_id,
            data,
            { returnDocument: 'after' }
        ).select('_id nombre username username_last_changed_at email avatar_url fecha_creacion activo email_verificado')

        return result
    }

    /*
    Guarda el jti del mail de recuperacion mas reciente.
    Al sobrescribirlo deja invalidados todos los tokens anteriores.
    */
    async setPasswordResetJti(user_id, reset_jti) {
        const result = await User.findByIdAndUpdate(
            user_id,
            { password_reset_jti: reset_jti },
            { returnDocument: 'after' }
        )

        return result
    }

    /*
    Consumo ATOMICO del token: solo actualiza si el jti guardado en DB todavia
    coincide con el que trae el request.
    Si otro request ya lo uso (o llego una solicitud mas nueva) devuelve null,
    y el service responde 400 en lugar de aplicar el cambio igual.
    */
    async consumePasswordReset(user_id, reset_jti, password_hash) {
        const result = await User.findOneAndUpdate(
            { _id: user_id, password_reset_jti: reset_jti },
            { password: password_hash, password_reset_jti: null },
            { returnDocument: 'after' }
        )

        return result
    }
    async verifyEmailById(user_id){
        const result = await User.findByIdAndUpdate(user_id, {email_verificado: true})
        return result
    }
    
    
}

//El UserRepostory es un sigleton, solo tiene una instancia
const user_repository = new UserRepository()

export default user_repository