import Member from "../models/member.model.js"

class MemberRepository {
    async create(userId, workspaceId, role) {
        const membership_created = await Member.create({
            fk_id_usuario: userId,
            fk_id_espacio_trabajo: workspaceId,
            rol: role
        })
        return membership_created
    }

    async deleteById(memberId) {
        const result = await Member.findByIdAndDelete(memberId)
        return result
    }

    async updateRoleById(memberId, role) {
        const result = await Member
            .findByIdAndUpdate(memberId, { rol: role }, { returnDocument: 'after' })
            .populate('fk_id_usuario', 'nombre')
        return result
    }

    async getByIdAndWorkspace(member_id, workspace_id) {
        return await Member.findOne({
            _id: member_id,
            fk_id_espacio_trabajo: workspace_id
        })
    }

    async countOwnersByWorkspaceId(workspace_id) {
        return await Member.countDocuments({
            fk_id_espacio_trabajo: workspace_id,
            rol: 'owner'
        })
    }

    //Traer todas las membresias de un usuario
    async getAllWorkspaceByUserId (user_id){
        const result = await Member
        .find({fk_id_usuario: user_id})
        .populate(
            'fk_id_espacio_trabajo',
            'nombre fecha_creacion'
        )

        /* 
        populate permite expandir referencias,
        OSEA SOLO ES VALIDO EN PROPIEDADES CON ref en el modelo
        */
        return result
    }

    //Traer todos miembros de un espacio de trabajo
    //Solo nombre: el email no se expone, el frontend unicamente muestra nombre y rol
    async getAllMembershipsByWorkspaceId(workspace_id){
        const result = await Member
        .find({fk_id_espacio_trabajo: workspace_id})
        .populate('fk_id_usuario', 'nombre')
        return result
    }

    //Traer todas las membresias de VARIOS espacios de trabajo en una sola consulta (cada una con el nombre del miembro)
    async getAllMembershipsByWorkspaceIds(workspace_ids){
        return await Member
        .find({fk_id_espacio_trabajo: { $in: workspace_ids }})
        .populate('fk_id_usuario', 'nombre')
    }

    //Traer la membresia de un usuario en un espacio de trabajo (null si no es miembro)
    async getMembershipByUserAndWorkspace(user_id, workspace_id){
        return await Member
        .findOne({
            fk_id_usuario: user_id,
            fk_id_espacio_trabajo: workspace_id
        })
    }

    //Eliminar todas las membresias de un espacio de trabajo (se usa al eliminar el workspace)
    async deleteAllMembershipsByWorkspaceId(workspace_id){
        return await Member.deleteMany({fk_id_espacio_trabajo: workspace_id})
    }
}
const member_repository = new MemberRepository()
export default member_repository