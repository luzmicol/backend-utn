import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import { deleteMessage } from '../controllers/conversation.controller.js'

const message_router = express.Router()

message_router.use(authMiddleware)

message_router.delete('/:message_id', deleteMessage)

export default message_router
