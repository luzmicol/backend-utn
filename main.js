import express from 'express'
import connectMongoDB from "./config/mongo.config.js";
import errorHandlerMiddleware from "./middlewares/error.middleware.js";
import loggerMiddleware from "./middlewares/logger.middleware.js";
import { ipBlacklistMiddleware, ipWhitelistMiddleware } from "./middlewares/ipAccess.middleware.js";
import apiKeyMiddleware from "./middlewares/apiKey.middleware.js";
import auth_router from "./routes/auth.router.js";
import user_router from "./routes/user.router.js";
import post_router from "./routes/post.router.js";
import community_router from "./routes/community.router.js";
import conversation_router from "./routes/conversation.router.js";
import message_router from "./routes/message.router.js";
import notification_router from "./routes/notification.router.js";
import cors from 'cors'
import corsOptions from "./config/cors.config.js";
import ENVIRONMENT from "./config/environment.config.js";
import swaggerUi from 'swagger-ui-express'
import swagger_options from "./docs/swagger.config.js";
import swaggerJsdoc from 'swagger-jsdoc'

//Se genera el spec OpenAPI juntando la base + los comentarios @openapi
const openapi_spec = swaggerJsdoc(swagger_options)

const PORT = ENVIRONMENT.PORT || 8080;
const app = express()

app.use(cors(corsOptions))

app.set('trust proxy', 1)

app.use(loggerMiddleware)
app.use(ipBlacklistMiddleware)
app.use(express.json())

// Ruta raíz para evitar el "Cannot GET /"
app.get('/', (req, res) => {
    res.json({ message: 'API Backend UTN funcionando correctamente 🚀' })
})

/* Documentacion Swagger UI (protegible opcionalmente mediante IP_WHITELIST) */
app.use('/api/docs', ipWhitelistMiddleware, swaggerUi.serve, swaggerUi.setup(openapi_spec))
app.get('/api/docs.json', ipWhitelistMiddleware, (request, response) => {
    response.json(openapi_spec)
})

/**
 * @openapi
 * /api/system/status:
 *   get:
 *     summary: Estado tecnico del servicio LOOP
 *     description: Endpoint tecnico de integracion protegido mediante API Key en el header x-api-key.
 *     tags: [System]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       '200':
 *         description: Estado del servicio obtenido correctamente
 *       '401':
 *         description: API Key ausente o invalida
 *       '503':
 *         description: API Key no configurada en el servidor
 */
/* Endpoint tecnico de integracion protegido exclusivamente con API Key (header x-api-key) */
app.get('/api/system/status', apiKeyMiddleware, (_request, response) => {
    return response.status(200).send({
        ok: true,
        status: 200,
        message: 'Estado del servicio obtenido correctamente',
        data: {
            service: 'LOOP API',
            status: 'operational',
            timestamp: new Date().toISOString()
        }
    })
})

// Garantiza conexion a MongoDB antes de procesar cualquier request de negocio (local y serverless)
const ensureDatabaseConnection = async (request, response, next) => {
    try {
        await connectMongoDB()
        next()
    } catch (error) {
        return response.status(503).send({
            ok: false,
            status: 503,
            message: 'No se pudo conectar a la base de datos'
        })
    }
}

// Rutas de la API
app.use('/api/auth', ensureDatabaseConnection, auth_router)
app.use('/api/users', ensureDatabaseConnection, user_router)
app.use('/api/posts', ensureDatabaseConnection, post_router)
app.use('/api/communities', ensureDatabaseConnection, community_router)
app.use('/api/conversations', ensureDatabaseConnection, conversation_router)
app.use('/api/messages', ensureDatabaseConnection, message_router)
app.use('/api/notifications', ensureDatabaseConnection, notification_router)

app.use(errorHandlerMiddleware)

// En local se inicia el servidor HTTP; en Vercel (serverless) solo se exporta app
if (!process.env.VERCEL) {
    connectMongoDB()
        .then(() => {
            app.listen(
                PORT,
                () => {
                    console.log(
                        `El servidor se esta escuchando correctamente en http://localhost:${PORT}`
                    )
                }
            )
        })
        .catch(() => {
            console.error('No se pudo iniciar el servidor porque fallo la conexion a MongoDB')
            process.exit(1)
        })
}

export default app; // Importante para que Vercel pueda exportar la app correctamente