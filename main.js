import express from 'express'
import connectMongoDB from "./config/mongo.config.js";
import errorHandlerMiddleware from "./middlewares/error.middleware.js";
import loggerMiddleware from "./middlewares/logger.middleware.js";
import auth_router from "./routes/auth.router.js";
import user_router from "./routes/user.router.js";
import workspace_router from "./routes/workspace.router.js";
import cors from 'cors'
import ENVIRONMENT from "./config/environment.config.js";
import swaggerUi from 'swagger-ui-express'
import swagger_options from "./docs/swagger.config.js";
import swaggerJsdoc from 'swagger-jsdoc'

// Conectamos a MongoDB al iniciar la app
connectMongoDB();

//Se genera el spec OpenAPI juntando la base + los comentarios @openapi
const openapi_spec = swaggerJsdoc(swagger_options)

const PORT = ENVIRONMENT.PORT || 8080;
const app = express()

app.use(cors())

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

// Rutas de la API (ya no necesitan el middleware pesado de conectar en cada request)
app.use('/api/auth', auth_router)
app.use('/api/users', user_router)
app.use('/api/workspaces', workspace_router)

app.use(errorHandlerMiddleware)

// Esto solo se ejecuta en local (en Vercel maneja las rutas de forma automática)
app.listen(
    PORT,
    () => {
        console.log(
            `El servidor se esta escuchando correctamente en http://localhost:${PORT}`
        )
    }
)

export default app; // Importante para que Vercel pueda exportar la app correctamente