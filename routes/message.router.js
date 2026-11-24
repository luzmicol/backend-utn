import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import { deleteMessage } from '../controllers/conversation.controller.js'

const message_router = express.Router()

message_router.use(authMiddleware)

/**
 * @openapi
 * /api/messages/{message_id}:
 *   delete:
 *     summary: Elimina (soft-delete) un mensaje propio y recalcula ultimo_mensaje
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: message_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Mensaje eliminado correctamente
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: No tienes permisos para eliminar este mensaje
 *       '404':
 *         description: Mensaje no encontrado
 */
message_router.delete('/:message_id', deleteMessage)

export default message_router
