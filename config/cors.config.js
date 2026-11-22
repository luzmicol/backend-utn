import ENVIRONMENT from './environment.config.js'
import ServerError from '../utils/error.util.js'

const LOCALHOST_ORIGIN_REGEX = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

function normalizeOrigin(origin) {
    return origin.trim().replace(/\/+$/, '')
}

function getAllowedOrigins() {
    const raw_frontend_url = process.env.URL_FRONTEND || ENVIRONMENT.URL_FRONTEND || ''

    return raw_frontend_url
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean)
}

function isOriginAllowed(origin) {
    const normalized = normalizeOrigin(origin)
    const allowed_origins = getAllowedOrigins()

    if (allowed_origins.includes(normalized)) {
        return true
    }

    const node_env = process.env.NODE_ENV || ENVIRONMENT.NODE_ENV
    if (node_env !== 'production' && LOCALHOST_ORIGIN_REGEX.test(normalized)) {
        return true
    }

    return false
}

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true)
        }

        if (isOriginAllowed(origin)) {
            return callback(null, true)
        }

        return callback(new ServerError('CORS origin not allowed', 403))
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}

export default corsOptions
