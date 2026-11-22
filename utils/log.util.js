/*
Reglas de privacidad para los logs de la API.

Los endpoints de autenticacion reciben credenciales en el body (password, tokens de
verificacion o de reset), por lo que NUNCA se debe registrar el body de /api/auth/*.

Estas reglas viven en un solo lugar para que cualquier logger (consola o MongoDB)
las reutilice y no dependa de acordarse de excluir cada endpoint nuevo que se agregue.
*/

const SENSITIVE_ROUTE_PREFIXES = ['/api/auth']

const REDACTED = '[REDACTED]'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/*
Indica si una url pertenece a una ruta sensible.
Se compara por segmento para que una ruta como /api/authz no cuente como /api/auth.
*/
export function isSensitiveRoute(url){
    const path = (url || '').split('?')[0].toLowerCase()

    return SENSITIVE_ROUTE_PREFIXES.some(prefix =>
        path === prefix || path.startsWith(prefix + '/')
    )
}

/*
Devuelve la url lista para loguear.

En rutas sensibles se descarta el query string completo (puede traer tokens, emails
o passwords) y se enmascaran los emails que viajan en el path, como en
/api/auth/verify-email/:email/resend.
*/
export function sanitizeUrl(url){
    if(!url || !isSensitiveRoute(url)){
        return url
    }

    const [path, query] = url.split('?')

    const sanitized_path = path
        .split('/')
        .map(maskEmailSegment)
        .join('/')

    //Si habia query string se reemplaza entero para no filtrar ninguno de sus valores
    return query !== undefined ? `${sanitized_path}?${REDACTED}` : sanitized_path
}

/*
Un email puede venir codificado (%40 en lugar de @), por eso se evalua el segmento decodificado
*/
function maskEmailSegment(segment){
    let decoded = segment

    try{
        decoded = decodeURIComponent(segment)
    }
    catch(error){
        //Si el segmento no es un URI valido se evalua tal cual
    }

    return EMAIL_PATTERN.test(decoded) ? REDACTED : segment
}

/*
Enmascara cualquier email que aparezca dentro de un texto libre, por ejemplo el
mensaje de error que devuelve SMTP (a veces incluye la direccion del
remitente/destinataria). Permite loguear el error real sin que quede el email
en los registros.
*/
const EMAIL_IN_TEXT = /[^\s@<>()[\]{},"']+@[^\s@<>()[\]{},"']+\.[^\s@<>()[\]{},"']+/g

export function maskEmails(text){
    if(text === null || text === undefined){
        return text
    }

    return String(text).replace(EMAIL_IN_TEXT, REDACTED)
}
