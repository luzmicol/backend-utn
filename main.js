import connectMongoDB from "./config/mongo.config.js";

//connectMongoDB()


import express from 'express'
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



//Se genera el spec OpenAPI juntando la base (docs/swagger.config.js) + los comentarios @openapi de las rutas
const openapi_spec = swaggerJsdoc(swagger_options)

const PORT = ENVIRONMENT.PORT || 8080;
const app = express()


app.use(cors())

/*
La API corre detras de un proxy (Vercel). Sin esto la ip resuelta por req.ip
seria la del proxy y no la del cliente
*/
app.set('trust proxy', true)

/*
Log de consultas. Va ANTES de express.json para que tambien queden registradas
las consultas que llegan con JSON malformado
*/
app.use(loggerMiddleware)

app.use(express.json())

/* 
Documentacion Swagger UI
Se monta ANTES del middleware de conexion a MongoDB para que la documentacion
este disponible aunque la base de datos este caida
*/
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi_spec))
app.get('/api/docs.json', (request, response) => {
    response.json(openapi_spec)
})

app.use(async (req, res, next) => {
    try {
        await connectMongoDB();
        next();
    } catch (error) {
        console.error("Error conectando MongoDB:", error);

        res.status(503).json({
            message: "No se pudo conectar a la base de datos"
        });
    }
});


app.use('/api/auth', auth_router)
app.use('/api/users', user_router)
app.use('/api/workspaces', workspace_router)

app.use(
    errorHandlerMiddleware
)


app.listen(
    PORT,
    () => {
        console.log(
            `El servidor se esta escuchando correctamente en http://localhost:${PORT}`
        )
    }
)


