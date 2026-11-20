/* 
La capa de servicios se encarga de la LOGICA DE NEGOCIO de cada endpoint:
validar datos, crear espacios de trabajo, crear membresias, eliminar, etc

Los controllers no saben nada de negocio: le pasan los datos que llegaron del request
y esta capa devuelve el resultado que el controller pone en la response
Aqui no existe request ni response, solo entra un dato, se trabaja y sale un dato
*/

import workspace_repository from "../repositories/workspace.repository.js"
import member_repository from "../repositories/member.repository.js"
import ServerError from "../utils/error.util.js"

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
1. Crea el espacio de trabajo
2. Crea la membresia del usuario que lo creo con el rol 'owner'
*/
async function create(user_id, name, description) {

    if (!name) {
        throw new ServerError(
            "name es un campo requerido",
            400
        )
    }

    const workspace_created = await workspace_repository.createWorkspace(name, description)
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
1. Verifica que lleguen name y description -> 400
2. Actualiza el espacio de trabajo
*/
async function update(workspace_id, name, description) {

    if (!name || !description) {
        throw new ServerError(
            "name y description son campos requeridos",
            400
        )
    }

    return await workspace_repository.updateById(
        workspace_id,
        { nombre: name, description }
    )
}

/* 
Al igual que en los repositories, el service es un singleton con un solo metodo por endpoint
*/
const workspace_service = {
    getAllWithMembersByUserId,
    create,
    getAllMembers,
    deleteById,
    update
}


export default workspace_service
