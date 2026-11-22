/* 
La capa de servicios se encarga de la LOGICA DE NEGOCIO de cada endpoint:
validar datos, crear espacios de trabajo, crear membresias, eliminar, etc

Los controllers no saben nada de negocio: le pasan los datos que llegaron del request
y esta capa devuelve el resultado que el controller pone en la response
Aqui no existe request ni response, solo entra un dato, se trabaja y sale un dato
*/

import mongoose from "mongoose"
import workspace_repository from "../repositories/workspace.repository.js"
import member_repository from "../repositories/member.repository.js"
import ServerError from "../utils/error.util.js"

const VALID_MEMBER_ROLES = ['user', 'admin', 'owner']

/* 
GET /api/workspace
Trae la lista de espacios de trabajo del usuario y, para cada uno, la lista de sus miembros (nombre y rol)
1. Busca las membresias del usuario: cada una indica a que espacio de trabajo pertenece
2. Busca todas las membresias de esos espacios de trabajo (cada una con el nombre del miembro)
3. Agrupa las membresias por espacio de trabajo para armar la lista de miembros de cada uno
*/
async function getAllWithMembersByUserId(user_id) {

    //1. Las membresias del usuario nos dicen en que espacios de trabajo esta (cada una trae su workspace)
    const user_memberships = await member_repository.getAllWorkspaceByUserId(user_id)

    //Si el workspace ya no existe en la DB, populate devuelve null y descartamos esa membresia
    const workspaces_existentes = user_memberships.filter(
        user_membership => user_membership.fk_id_espacio_trabajo
    )

    //2. Buscamos TODAS las membresias de esos espacios de trabajo en una sola consulta
    const workspace_ids = workspaces_existentes.map(
        user_membership => user_membership.fk_id_espacio_trabajo._id
    )
    const workspace_memberships = await member_repository.getAllMembershipsByWorkspaceIds(workspace_ids)

    //3. Por cada espacio de trabajo armamos su objeto con la lista de miembros
    return workspaces_existentes.map(user_membership => {
        const workspace = user_membership.fk_id_espacio_trabajo

        const members = workspace_memberships
            .filter(membership => membership.fk_id_espacio_trabajo.equals(workspace._id))
            .map(membership => {
                return {
                    nombre: membership.fk_id_usuario.nombre,
                    rol: membership.rol
                }
            })

        return {
            _id: workspace._id,
            nombre: workspace.nombre,
            fecha_creacion: workspace.fecha_creacion,
            members: members
        }
    })
}

/* 
POST /api/workspace
1. Valida name y description ANTES de tocar la DB: si llegan mal el cliente
   recibe 400, nunca un error de Mongoose escapado como 500
2. Crea el espacio de trabajo
3. Crea la membresia del usuario que lo creo con el rol 'owner'
*/
async function create(user_id, name, description) {

    if (name === undefined || name === null || (typeof name === 'string' && name.trim() === '')) {
        throw new ServerError(
            "name es un campo requerido",
            400
        )
    }

    if (typeof name !== 'string') {
        throw new ServerError(
            "name debe ser un texto",
            400
        )
    }

    if (name.trim().length > 30) {
        throw new ServerError(
            "name no puede superar los 30 caracteres",
            400
        )
    }

    if (description !== undefined && description !== null) {
        if (typeof description !== 'string') {
            throw new ServerError(
                "description debe ser un texto",
                400
            )
        }

        if (description.length > 1000) {
            throw new ServerError(
                "description no puede superar los 1000 caracteres",
                400
            )
        }
    }

    const workspace_created = await workspace_repository.createWorkspace(name.trim(), description)
    const owner_membership = await member_repository.create(
        user_id,
        workspace_created._id,
        'owner'
    )

    return {
        workspace_created: workspace_created,
        owner_membership: owner_membership
    }
}

/* 
GET /api/workspace/:workspace_id/members
Trae la lista de membresias del espacio de trabajo (cada una con los datos del usuario)
*/
async function getAllMembers(workspace_id) {
    return await member_repository.getAllMembershipsByWorkspaceId(workspace_id)
}

/* 
DELETE /api/workspace/:workspace_id
1. Elimina el espacio de trabajo
2. Elimina todas las membresias asociadas a ese espacio de trabajo
*/
async function deleteById(workspace_id) {

    await workspace_repository.deleteById(workspace_id)
    await member_repository.deleteAllMembershipsByWorkspaceId(workspace_id)

    return true
}

/* 
PUT /api/workspace/:workspace_id
1. name y description son OPCIONALES: se valida y actualiza solo lo que llegue
   (permite cambiar un campo sin enviar el otro y vaciar la description)
2. Si no llega ningun campo -> 400
3. Actualiza el espacio de trabajo
*/
async function update(workspace_id, name, description) {

    const update_data = {}

    if (name !== undefined) {
        if (name === null || typeof name !== 'string' || name.trim() === '') {
            throw new ServerError(
                "name debe ser un texto no vacio",
                400
            )
        }

        if (name.trim().length > 30) {
            throw new ServerError(
                "name no puede superar los 30 caracteres",
                400
            )
        }

        update_data.nombre = name.trim()
    }

    if (description !== undefined) {
        if (description === null || typeof description !== 'string') {
            throw new ServerError(
                "description debe ser un texto",
                400
            )
        }

        if (description.length > 1000) {
            throw new ServerError(
                "description no puede superar los 1000 caracteres",
                400
            )
        }

        update_data.description = description
    }

    if (Object.keys(update_data).length === 0) {
        throw new ServerError(
            "Se requiere al menos un campo: name o description",
            400
        )
    }

    return await workspace_repository.updateById(
        workspace_id,
        update_data
    )
}

/* 
PUT /api/workspaces/:workspace_id/members/:member_id
Solo el owner puede cambiar el rol de un miembro del workspace.
No permite degradar al unico owner del espacio de trabajo.
*/
async function updateMemberRole(workspace_id, member_id, new_role) {

    if (!mongoose.Types.ObjectId.isValid(member_id)) {
        throw new ServerError("Member id invalido", 400)
    }

    if (!new_role || typeof new_role !== 'string' || !VALID_MEMBER_ROLES.includes(new_role)) {
        throw new ServerError(
            "rol invalido. Los valores permitidos son: user, admin, owner",
            400
        )
    }

    const target_member = await member_repository.getByIdAndWorkspace(member_id, workspace_id)

    if (!target_member) {
        throw new ServerError("Miembro no encontrado en este espacio de trabajo", 404)
    }

    if (target_member.rol === 'owner' && new_role !== 'owner') {
        const owners_count = await member_repository.countOwnersByWorkspaceId(workspace_id)
        if (owners_count <= 1) {
            throw new ServerError(
                "No puedes cambiar el rol del unico propietario del espacio de trabajo",
                400
            )
        }
    }

    return await member_repository.updateRoleById(member_id, new_role)
}

/* 
DELETE /api/workspaces/:workspace_id/members/:member_id
Solo el owner puede eliminar a otros miembros del workspace.
*/
async function removeMember(workspace_id, member_id, requester_user_id) {

    if (!mongoose.Types.ObjectId.isValid(member_id)) {
        throw new ServerError("Member id invalido", 400)
    }

    const target_member = await member_repository.getByIdAndWorkspace(member_id, workspace_id)

    if (!target_member) {
        throw new ServerError("Miembro no encontrado en este espacio de trabajo", 404)
    }

    if (target_member.fk_id_usuario.equals(requester_user_id)) {
        throw new ServerError(
            "No puedes eliminarte a ti mismo, utiliza la opcion para abandonar el espacio de trabajo",
            400
        )
    }

    return await member_repository.deleteById(member_id)
}

/* 
DELETE /api/workspaces/:workspace_id/members/me
Cualquier miembro puede abandonar un workspace por su cuenta,
excepto el owner si es el unico propietario.
*/
async function leaveWorkspace(workspace_id, membership) {

    if (membership.rol === 'owner') {
        const owners_count = await member_repository.countOwnersByWorkspaceId(workspace_id)
        if (owners_count <= 1) {
            throw new ServerError(
                "No puedes abandonar el espacio de trabajo siendo el unico propietario",
                400
            )
        }
    }

    return await member_repository.deleteById(membership._id)
}

/* 
Al igual que en los repositories, el service es un singleton con un solo metodo por endpoint
*/
const workspace_service = {
    getAllWithMembersByUserId,
    create,
    getAllMembers,
    updateMemberRole,
    removeMember,
    leaveWorkspace,
    deleteById,
    update
}


export default workspace_service
