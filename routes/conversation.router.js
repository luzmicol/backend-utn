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
conversation_router.post('/groups', uploadOptionalSingleImage('imagen', { maxBytes: 5 * 1024 * 1024 }), createGroup)
conversation_router.patch('/:conversation_id/group', uploadOptionalSingleImage('imagen', { maxBytes: 5 * 1024 * 1024 }), updateGroupInfo)
conversation_router.post('/:conversation_id/participants', addGroupParticipants)
conversation_router.delete('/:conversation_id/participants/:user_id', removeGroupParticipant)
conversation_router.patch('/:conversation_id/participants/:user_id/role', updateGroupMemberRole)
conversation_router.delete('/:conversation_id/members/me', leaveGroup)

export default conversation_router
