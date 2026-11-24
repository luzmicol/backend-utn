import crypto from 'crypto'
import ENVIRONMENT from '../config/environment.config.js'
import ServerError from '../utils/error.util.js'

function safeCompare(a, b) {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    if (bufA.length !== bufB.length) {
        return false
    }
    return crypto.timingSafeEqual(bufA, bufB)
}

/*
Middleware de autenticacion mediante API Key (header x-api-key).
Independiente de JWT y destinado exclusivamente a integraciones tecnicas.
Nunca registra ni expone la clave esperada ni la recibida.
*/
export function apiKeyMiddleware(request, _response, next) {
    const expectedKey = (process.env.API_KEY ?? ENVIRONMENT.API_KEY ?? '').trim()

    if (!expectedKey) {
        return next(
            new ServerError('Integracion por API Key no configurada', 503, 'API_KEY_NOT_CONFIGURED')
        )
    }

    const providedKey = request.headers['x-api-key']

    if (!providedKey || typeof providedKey !== 'string' || !providedKey.trim()) {
        return next(new ServerError('API Key requerida', 401, 'API_KEY_MISSING'))
    }

    if (!safeCompare(providedKey.trim(), expectedKey)) {
        return next(new ServerError('API Key invalida', 401, 'API_KEY_INVALID'))
    }

    return next()
}

export default apiKeyMiddleware
