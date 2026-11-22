import express from 'express'
import connectMongoDB from "./config/mongo.config.js";
import errorHandlerMiddleware from "./middlewares/error.middleware.js";
import loggerMiddleware from "./middlewares/logger.middleware.js";
import auth_router from "./routes/auth.router.js";
import user_router from "./routes/user.router.js";
import workspace_router from "./routes/workspace.router.js";
import post_router from "./routes/post.router.js";
import community_router from "./routes/community.router.js";
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

app.set('trust proxy', true)

app.use(loggerMiddleware)
app.use(express.json())

// Ruta raíz para evitar el "Cannot GET /"
app.get('/', (req, res) => {
    res.json({ message: 'API Backend UTN funcionando correctamente 🚀' })
})

/* Documentacion Swagger UI */
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi_spec))
app.get('/api/docs.json', (request, response) => {
    response.json(openapi_spec)
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
app.use('/api/workspaces', ensureDatabaseConnection, workspace_router)
app.use('/api/posts', ensureDatabaseConnection, post_router)
app.use('/api/communities', ensureDatabaseConnection, community_router)

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