import notification_service from "../services/notification.services.js"

export async function getNotifications(request, response) {
    const { page, limit } = request.query
    const result = await notification_service.getMyNotifications(request.user.id, { page, limit })

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Notificaciones obtenidas correctamente",
        data: result
    })
}

export async function getUnreadCount(request, response) {
    const result = await notification_service.getUnreadCount(request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Contador de notificaciones sin leer obtenido",
        data: result
    })
}

export async function markAsRead(request, response) {
    const { notification_id } = request.params
    const notification = await notification_service.markAsRead(notification_id, request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Notificacion marcada como leida",
        data: { notification }
    })
}

export async function markAllAsRead(request, response) {
    const result = await notification_service.markAllAsRead(request.user.id)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Todas las notificaciones fueron marcadas como leidas",
        data: result
    })
}

export async function deleteNotification(request, response) {
    const { notification_id } = request.params
    const notification_deleted = await notification_service.deleteNotification(
        notification_id,
        request.user.id
    )

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Notificacion eliminada correctamente",
        data: { notification_deleted }
    })
}
