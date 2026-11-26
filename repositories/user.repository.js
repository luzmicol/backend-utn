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

    async get({ exclude_user_id = null, q = '', page = 1, limit = 15 } = {}) {
        const safePage = Math.max(Number.parseInt(page, 10) || 1, 1)
        const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 15, 1), 15)
        const skip = (safePage - 1) * safeLimit

        const filter = { activo: true }
        if (exclude_user_id) {
            filter._id = { $ne: exclude_user_id }
        }

        const trimmed = typeof q === 'string' ? q.trim() : ''
        if (trimmed) {
            const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(escaped, 'i')
            filter.$or = [
                { nombre: regex },
                { username: regex }
            ]
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('_id nombre username avatar_url bio fecha_creacion')
                .sort({ fecha_creacion: -1, _id: -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean(),
            User.countDocuments(filter)
        ])

        return {
            users,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                has_more: skip + users.length < total
            }
        }
    }

    async getPublicProfileById(user_id){
        const result = await User.findOne({ _id: user_id, activo: true }).select('_id nombre username avatar_url bio fecha_creacion')
        return result
    }

    async getOwnProfileById(user_id){
        const result = await User.findOne({ _id: user_id, activo: true }).select('_id nombre username username_last_changed_at email avatar_url bio fecha_creacion activo email_verificado')
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
        ).select('_id nombre username username_last_changed_at email avatar_url bio fecha_creacion activo email_verificado')
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
        ).select('_id nombre username username_last_changed_at email avatar_url bio fecha_creacion activo email_verificado')

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

    async setActiveConversation(user_id, conversation_id) {
        await User.findByIdAndUpdate(user_id, {
            active_conversation_id: conversation_id,
            active_conversation_at: new Date()
        })
    }

    async clearActiveConversation(user_id) {
        await User.findByIdAndUpdate(user_id, {
            active_conversation_id: null,
            active_conversation_at: null
        })
    }

    async getActiveViewerIds(user_ids, conversation_id, cutoff_date) {
        if (!Array.isArray(user_ids) || user_ids.length === 0) return new Set()
        const docs = await User.find({
            _id: { $in: user_ids },
            active_conversation_id: conversation_id,
            active_conversation_at: { $gte: cutoff_date }
        })
            .select('_id')
            .lean()
        return new Set(docs.map((d) => String(d._id)))
    }
}

//El UserRepostory es un sigleton, solo tiene una instancia
const user_repository = new UserRepository()

export default user_repository