import ENVIRONMENT from '../config/environment.config.js'
import ServerError from '../utils/error.util.js'

function normalizeIp(ip) {
    if (!ip || typeof ip !== 'string') return ''
    const trimmed = ip.trim()
    return trimmed.startsWith('::ffff:') ? trimmed.slice(7) : trimmed
}

function parseIpList(raw) {
    if (!raw || typeof raw !== 'string') return []
    return raw
        .split(',')
        .map(normalizeIp)
        .filter(Boolean)
}

function getClientIp(request) {
    return normalizeIp(request.ip || request.socket?.remoteAddress || '')
}

/*
Blacklist global de IPs:
Si IP_BLACKLIST esta vacia, no restringe ningun acceso.
Si contiene IPs separadas por coma, rechaza con 403 IP_BLOCKED a las IPs listadas.
*/
export function ipBlacklistMiddleware(request, _response, next) {
    const raw = process.env.IP_BLACKLIST ?? ENVIRONMENT.IP_BLACKLIST ?? ''
    const blockedIps = parseIpList(raw)

    if (blockedIps.length === 0) {
        return next()
    }

    const clientIp = getClientIp(request)
    if (clientIp && blockedIps.includes(clientIp)) {
        return next(new ServerError('Acceso denegado para esta direccion IP', 403, 'IP_BLOCKED'))
    }

    return next()
}

/*
Whitelist de IPs para rutas restringidas (por ejemplo, /api/docs):
Si IP_WHITELIST esta vacia, no restringe el acceso.
Si contiene IPs separadas por coma, solo permite esas IPs y rechaza el resto con 403 IP_NOT_ALLOWED.
*/
export function ipWhitelistMiddleware(request, _response, next) {
    const raw = process.env.IP_WHITELIST ?? ENVIRONMENT.IP_WHITELIST ?? ''
    const allowedIps = parseIpList(raw)

    if (allowedIps.length === 0) {
        return next()
    }

    const clientIp = getClientIp(request)
    if (!clientIp || !allowedIps.includes(clientIp)) {
        return next(
            new ServerError('Direccion IP no autorizada para este recurso', 403, 'IP_NOT_ALLOWED')
        )
    }

    return next()
}
