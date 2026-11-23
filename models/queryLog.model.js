import mongoose from "mongoose"

/*
Modelo de logs de consultas: cada documento registra una consulta recibida por el servidor.
Nunca se guarda el body ni headers sensibles, solo el contexto de la consulta
(ip, url, endpoint, metodo, timestamp, user_id, status y duracion)
*/
const queryLogSchema = new mongoose.Schema(
    {
        ip: {
            type: String,
            default: null
        },
        url: {
            type: String,
            required: true
        },
        endpoint: {
            type: String,
            required: true
        },
        metodo: {
            type: String,
            required: true
        },
        fecha_consulta: {
            type: Date,
            required: true
        },
        //Id del usuario solo si la consulta es autenticada, si no queda en null
        user_id: {
            type: String,
            default: null
        },
        status_respuesta: {
            type: Number,
            required: true
        },
        duracion_ms: {
            type: Number,
            required: true
        }
    }
)

/* 
Indices para las consultas tipicas sobre los logs:
- TTL de 30 dias sobre fecha_consulta para evitar crecimiento indefinido en MongoDB
- Busqueda cronologica por usuario
*/
queryLogSchema.index({ fecha_consulta: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })
queryLogSchema.index({ user_id: 1, fecha_consulta: -1 })

/*
Mongoose pluraliza el nombre del modelo para nombrar la coleccion ('QueryLog' -> 'querylogs'),
asi que se fija explicitamente para que la constante y la coleccion real coincidan
*/
export const QUERY_LOG_COLLECTION_NAME = 'querylogs'
const QueryLog = mongoose.model(QUERY_LOG_COLLECTION_NAME, queryLogSchema, QUERY_LOG_COLLECTION_NAME)
export default QueryLog
