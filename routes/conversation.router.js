import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import { uploadOptionalSingleImage } from '../middlewares/upload.middleware.js'
import {
    createOrGet,
    getAll,
    getMessages,
    sendMessage,
    getUnreadCount,
    markAsRead,
    acceptRequest,
    deleteRequest,
    createGroup,
    updateGroupInfo,
    addGroupParticipants,
    removeGroupParticipant,
    updateGroupMemberRole,
    leaveGroup,
    clearActiveConversation
} from '../controllers/conversation.controller.js'

const conversation_router = express.Router()

conversation_router.use(authMiddleware)

/**
 * @openapi
 * /api/conversations:
 *   post:
 *     summary: Crea o recupera una conversacion privada 1-a-1 con otro usuario
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participant_id]
 *             properties:
 *               participant_id:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Conversacion existente recuperada
 *       '201':
 *         description: Conversacion creada correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         description: Usuario destino no encontrado
 *   get:
 *     summary: Lista las conversaciones del usuario autenticado con unread_count
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Conversaciones obtenidas correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
conversation_router.post('/', createOrGet)
conversation_router.get('/', getAll)

/**
 * @openapi
 * /api/conversations/unread-count:
 *   get:
 *     summary: Obtiene el total global de mensajes no leidos del usuario autenticado
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Contador obtenido correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
conversation_router.get('/unread-count', getUnreadCount)

/**
 * @openapi
 * /api/conversations/active:
 *   delete:
 *     summary: Limpia la conversacion activa del usuario autenticado para reanudar notificaciones de mensajes
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Estado de conversacion activa limpiado
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */
conversation_router.delete('/active', clearActiveConversation)

/**
 * @openapi
 * /api/conversations/{conversation_id}/read:
 *   patch:
 *     summary: Marca como leidos los mensajes recibidos de una conversacion
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversation_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Conversacion marcada como leida
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: No perteneces a esta conversacion
 *       '404':
 *         description: Conversacion no encontrada
 */
conversation_router.patch('/:conversation_id/read', markAsRead)

/**
 * @openapi
 * /api/conversations/{conversation_id}/messages:
 *   get:
 *     summary: Obtiene los mensajes paginados de una conversacion
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversation_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       '200':
 *         description: Mensajes obtenidos correctamente
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: No perteneces a esta conversacion
 *   post:
 *     summary: Envia un mensaje de texto en una conversacion
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversation_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contenido]
 *             properties:
 *               contenido:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       '201':
 *         description: Mensaje enviado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: No perteneces a esta conversacion
 */
conversation_router.get('/:conversation_id/messages', getMessages)
conversation_router.post('/:conversation_id/messages', sendMessage)

/**
 * @openapi
 * /api/conversations/{conversation_id}/accept:
 *   patch:
 *     summary: Acepta una solicitud de mensaje recibida y la mueve a la bandeja principal
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: conversation_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Solicitud de mensaje aceptada
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
conversation_router.patch('/:conversation_id/accept', acceptRequest)

/**
 * @openapi
 * /api/conversations/{conversation_id}/request:
 *   delete:
 *     summary: Elimina una solicitud de mensaje recibida sin notificar al remitente
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: conversation_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Solicitud de mensaje eliminada
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
conversation_router.delete('/:conversation_id/request', deleteRequest)

// Rutas de chats grupales
/**
 * @openapi
 * /api/conversations/groups:
 *   post:
 *     summary: Crea un nuevo grupo de chat con al menos 2 participantes adicionales al creador
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, participant_ids]
 *             properties:
 *               nombre:
 *                 type: string
 *               participant_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '201':
 *         description: Grupo creado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
conversation_router.post('/groups', uploadOptionalSingleImage('imagen', { maxBytes: 5 * 1024 * 1024 }), createGroup)

/**
 * @openapi
 * /api/conversations/{conversation_id}/group:
 *   patch:
 *     summary: Actualiza el nombre o la imagen de un grupo de chat
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: conversation_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               remove_image:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Grupo actualizado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
conversation_router.patch('/:conversation_id/group', uploadOptionalSingleImage('imagen', { maxBytes: 5 * 1024 * 1024 }), updateGroupInfo)

/**
 * @openapi
 * /api/conversations/{conversation_id}/participants:
 *   post:
 *     summary: Agrega uno o mas participantes a un grupo (solo owner o admin)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: conversation_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participant_ids]
 *             properties:
 *               participant_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '200':
 *         description: Participantes agregados correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
conversation_router.post('/:conversation_id/participants', addGroupParticipants)

/**
 * @openapi
 * /api/conversations/{conversation_id}/participants/{user_id}:
 *   delete:
 *     summary: Elimina a un participante de un grupo (solo owner o admin)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: conversation_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Participante eliminado del grupo
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
conversation_router.delete('/:conversation_id/participants/:user_id', removeGroupParticipant)

/**
 * @openapi
 * /api/conversations/{conversation_id}/participants/{user_id}/role:
 *   patch:
 *     summary: Asigna o quita el rol de administrador a un integrante del grupo (solo owner)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: conversation_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rol]
 *             properties:
 *               rol:
 *                 type: string
 *                 enum: [admin, member]
 *     responses:
 *       '200':
 *         description: Rol actualizado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
conversation_router.patch('/:conversation_id/participants/:user_id/role', updateGroupMemberRole)

/**
 * @openapi
 * /api/conversations/{conversation_id}/members/me:
 *   delete:
 *     summary: Permite abandonar un grupo (transfiere propiedad si sale el owner o elimina el grupo si queda vacio)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: conversation_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Salida del grupo completada
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
conversation_router.delete('/:conversation_id/members/me', leaveGroup)

export default conversation_router
