import ServerError from './error.util.js'

export const USERNAME_REGEX = /^[a-z0-9._]{3,30}$/
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const USERNAME_COOLDOWN_DAYS = 7
export const USERNAME_COOLDOWN_MS = USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000

export function normalizeUsername(raw) {
    if (typeof raw !== 'string') return ''
    return raw.trim().toLowerCase()
}

export function validateUsernameFormat(raw) {
    if (typeof raw !== 'string') {
        throw new ServerError('username debe ser un texto', 400)
    }

    const normalized = normalizeUsername(raw)

    if (normalized.length < USERNAME_MIN_LENGTH || normalized.length > USERNAME_MAX_LENGTH) {
        throw new ServerError(
            `El username debe tener entre ${USERNAME_MIN_LENGTH} y ${USERNAME_MAX_LENGTH} caracteres`,
            400
        )
    }

    if (!USERNAME_REGEX.test(normalized)) {
        throw new ServerError(
            'El username solo puede contener letras, numeros, puntos y guion bajo, sin espacios',
            400
        )
    }

    return normalized
}

export function slugifyNameToUsernameBase(nombre = '') {
    let base = String(nombre)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9._]/g, '')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.+|\.+$/g, '')

    if (base.length < USERNAME_MIN_LENGTH) {
        base = (base + 'user').slice(0, Math.max(USERNAME_MIN_LENGTH, base.length + 4))
    }

    return base.slice(0, 24)
}
