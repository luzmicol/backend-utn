import QueryLog from '../models/queryLog.model.js'
import { sanitizeUrl } from '../utils/log.util.js'

/*
Middleware global de log de consultas (access log).

Por cada consulta a una ruta de negocio (/api/*, excluyendo la documentacion de swagger)
registra: ip, url consultada, endpoint consultado, metodo, timestamp de la consulta,
user_id (solo si la consulta es autenticada), status de respuesta y duracion.
Nunca se registra el body, y en las rutas sensibles (/api/auth/*) ademas se sanitiza
la url para no filtrar emails ni tokens que viajen en el path o en el query string.

El log se emite en el evento 'finish' de la respuesta porque ahi recien se conocen el
status final, la duracion, el user_id (el auth middleware corre a nivel de ruta, despues
de este middleware) y la ruta resuelta. El insert a MongoDB es fire-and-forget: si falla,
la consulta nunca se ve afectada.
*/

//Indica si una url se debe loguear: solo rutas de negocio, sin la documentacion
function shouldLog (url){
    return url.startsWith('/api/') && !url.startsWith('/api/docs')
}

/*
Reconstruye el patron de la ruta consultada (ej: /api/users/:user_id).
Express restaura req.baseUrl a '' al desenrollar el router, antes de que dispare el
evento 'finish', pero req.route sigue seteado: se reconstruye el mount path sacando
del final de la url la cantidad de segmentos que matcheo la ruta.
Si la consulta no matcheo ninguna ruta (404) se usa la url sin query.
*/
function getEndpoint (url, route){
    const url_sin_query = url.split('?')[0]
    if(!route){
        return url_sin_query
    }

    const route_segments = route.path.split('/').filter(Boolean)
    const url_segments = url_sin_query.split('/').filter(Boolean)
    const mount_segments = url_segments.slice(0, url_segments.length - route_segments.length)

    return '/' + mount_segments.join('/') + route.path
}

/*
Obtiene la ip del cliente. Detras de un proxy (Vercel) la ip real viaja en el header
X-Forwarded-For, que puede traer varias separadas por coma: la del cliente es la primera
*/
function getClientIp (request){
    const forwarded = request.headers['x-forwarded-for']
    if(forwarded){
        return forwarded.split(',')[0].trim()
    }

    return request.ip || request.socket?.remoteAddress || null
}

function loggerMiddleware (request, response, next){
    if(!shouldLog(request.originalUrl)){
        next()
        return
    }

    const fecha_consulta = new Date()
    const inicio = Date.now()

    /*
    Los logs NUNCA incluyen el body del request: es la via por la que llegan credenciales
    (password, tokens) en /api/auth/*. Solo se guarda el contexto de la consulta.
    */
    const url = sanitizeUrl(request.originalUrl)

    response.on('finish', () => {
        try{
            const log = {
                ip: getClientIp(request),
                url: url,
                endpoint: getEndpoint(url, request.route),
                metodo: request.method,
                fecha_consulta: fecha_consulta,
                //El auth middleware setea request.user cuando la consulta es autenticada
                user_id: request.user?.id ?? null,
                status_respuesta: response.statusCode,
                duracion_ms: Date.now() - inicio
            }

            //Log en consola: una linea JSON por consulta
            console.log('[QueryLog]', JSON.stringify(log))

            //Persistencia en MongoDB sin bloquear ni frenar la respuesta
            QueryLog.create(log).catch(error => {
                console.error('[QueryLog] No se pudo guardar el log en MongoDB:', error.message)
            })
        }
        catch(error){
            console.error('[QueryLog] Error registrando la consulta:', error)
        }
    })

    next()
}

export default loggerMiddleware
