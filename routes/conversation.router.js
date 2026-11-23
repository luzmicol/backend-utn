import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import {
    createOrGet,
    getAll,
    getMessages,
    sendMessage
} from '../controllers/conversation.controller.js'

const conversation_router = express.Router()

conversation_router.use(authMiddleware)

conversation_router.post('/', createOrGet)
conversation_router.get('/', getAll)
conversation_router.get('/:conversation_id/messages', getMessages)
conversation_router.post('/:conversation_id/messages', sendMessage)

export default conversation_router
