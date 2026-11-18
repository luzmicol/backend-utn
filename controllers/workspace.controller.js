/* 
El controller maneja la parte HTTP de cada endpoint:
lee los datos que llegan en el request (body, params, query), los delega a los services
y arma la response con el status code correspondiente

Aqui NO va la logica de negocio: esa vive en ../services/workspace.services.js
El request.user lo adjunta el auth.middleware y el request.workspace el workspace.middleware
*/

import workspace_service from "../services/workspace.services.js"

/* 
(Authentified) GET /api/workspace
Traer la lista de espacios de trabajo asociadas a ese usuario (basicamente sus membresias), y cada espacio de trabajo con su lista de miembros (nombre y rol)
*/
export async function getAll(request, response) {

    const workspaces_obtenidos = await workspace_service.getAllWithMembersByUserId(request.user.id)

    return response.status(200).send({
        ok: true,
        message: "Obtenidos todos los datos",
        status: 200,
        data: {
            workspaces: workspaces_obtenidos
        }
    })
}

export async function create(request, response) {
    //Quien carancho quiere hacer esta operacion ?????
    console.log('[CREATE WORKSPACE]', request.user)
    const { name, description } = request.body

    const { workspace_created, owner_membership } = await workspace_service.create(
        request.user.id,
        name,
        description
    )

    return response.status(201).send(
        {
            ok: true, 
            status: 201,
            message: "Por ahora todo bien",
            data: {
                workspace_created: workspace_created,
                owner_membership: owner_membership
            }
        }
    )
}

export async function getById(request, response) {

    return response.status(200).send({
        ok: true,
        message: "Workspace obtenido correctamente",
        status: 200,
        data: {
            workspace_selected: request.workspace
        }
    })
}

/* 
(Authentified) GET /api/workspace/:workspace_id/members
Traer la lista de membresias del espacio de trabajo, cada una con los datos del usuario (nombre y email)
*/
export async function getAllMembers(request, response) {

    const members_obtenidos = await workspace_service.getAllMembers(request.workspace._id)

    return response.status(200).send({
        ok: true,
        message: "Obtenidos todos los miembros del espacio de trabajo",
        status: 200,
        data: {
            members: members_obtenidos
        }
    })
}

export async function deleteById(request, response) {

    await workspace_service.deleteById(request.workspace._id)

    return response.status(200).send({
        ok: true,
        message: "Workspace eliminado correctamente",
        status: 200,
        data: {
            workspace_deleted: request.workspace
        }
    })
}

export async function updateById(request, response) {
    const { workspace_id } = request.params
    const { name, description } = request.body

    const workspace_updated = await workspace_service.update(workspace_id, name, description)

    return response.status(200).send({
        ok: true,
        message: "Workspace actualizado correctamente",
        status: 200,
        data: {
            workspace_updated: workspace_updated
        }
    })
}
