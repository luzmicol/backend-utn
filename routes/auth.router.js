import express from 'express'
import { rateLimit } from 'express-rate-limit'
import {
    login,
    register,
    verify,
    resend,
    forgotPassword,
    resetPassword
} from '../controllers/auth.controller.js'

const auth_router = express.Router()

/*
Rate limit para /forgot-password: evita bombardear la bandeja de entrada de un
usuario con mails de recuperacion y los intentos de adivinar tokens.

Va SOLO en forgot-password: los otros endpoints de auth no lo necesitan y no
quieremos frenar el registro, el login ni la verificacion.

El conteo vive en memoria, por lo que en Vercel (serverless) es por instancia:
un limite de mejor esfuerzo. Para un limite global haria falta un store externo.
*/
const forgot_password_limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    /*
    Respuesta en el mismo formato que el resto de la API para que el frontend
    pueda leer el code y mostrar el mensaje en español.
    */
    handler: (request, response, next, optionsUsed) => {
        response.status(optionsUsed.statusCode).send({
            ok: false,
            status: optionsUsed.statusCode,
            message: 'Too many requests, please try again later',
            code: 'TOO_MANY_REQUESTS'
        })
    }
})

/*
Rate limit para /verify-email/:email/resend: evita envíos masivos de correos
de verificación sin bloquear a usuarios legítimos.
*/
const resend_verification_limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (request, response, next, optionsUsed) => {
        response.status(optionsUsed.statusCode).send({
            ok: false,
            status: optionsUsed.statusCode,
            message: 'Too many requests, please try again later',
            code: 'TOO_MANY_REQUESTS'
        })
    }
})


/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     description: >
 *       Crea un usuario con username, email y password.
 *       La password se guarda hasheada (bcrypt) y se envia un mail de verificacion
 *       con un link que apunta a la pantalla de verificacion del frontend.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             valido:
 *               summary: Registro valido
 *               value:
 *                 username: Juan Perez
 *                 email: juan.perez@mail.com
 *                 password: MiContraseNia123
 *     responses:
 *       '201':
 *         description: Usuario registrado y mail de verificacion enviado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *             examples:
 *               registrado:
 *                 summary: Registro exitoso
 *                 value:
 *                   ok: true
 *                   status: 201
 *                   message: User registered successfully
 *       '400':
 *         description: Datos invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               campos_faltantes:
 *                 summary: Falta username, email o password
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Email, password and username is required
 *               email_invalido:
 *                 summary: El email no tiene formato de email
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Email is incorrect
 *               email_ya_usado:
 *                 summary: El email ya esta registrado
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Email is already used
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
auth_router.post('/register', register)

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesion y devuelve el token de acceso
 *     description: >
 *       Valida email y password contra los usuarios de la DB.
 *       Si son correctos devuelve el JWT (authentication_token) que se usa para
 *       los endpoints privados via header Authorization: Bearer <token>.
 *       Por seguridad, si el email no existe o la password es incorrecta
 *       se responde el mismo mensaje generico.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             valido:
 *               summary: Credenciales validas
 *               value:
 *                 email: juan.perez@mail.com
 *                 password: MiContraseNia123
 *     responses:
 *       '200':
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: You have logged in successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     authentication_token:
 *                       type: string
 *                       description: JWT de acceso (actualmente sin expiracion configurada)
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             examples:
 *               login_exitoso:
 *                 summary: Credenciales correctas
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: You have logged in successfully
 *                   data:
 *                     authentication_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       '400':
 *         description: Datos invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               campos_faltantes:
 *                 summary: Falta email o password (o no son strings)
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Email and password are required
 *               email_invalido:
 *                 summary: El email no tiene formato de email
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Email is incorrect
 *       '401':
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               credenciales_invalidas:
 *                 summary: Email inexistente o password incorrecta (mismo mensaje por seguridad)
 *                 value:
 *                   ok: false
 *                   status: 401
 *                   message: Invalid email or password
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
auth_router.post('/login', login)

/**
 * @openapi
 * /api/auth/verify:
 *   post:
 *     summary: Verifica el email de un usuario
 *     description: >
 *       Recibe el verification_token que llego en el link del mail de verificacion
 *       (el link apunta a la pantalla del frontend y esta envia el token aca).
 *       Si la firma es valida marca el email del usuario como verificado.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyRequest'
 *           examples:
 *             valido:
 *               summary: Token de verificacion
 *               value:
 *                 verification_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       '200':
 *         description: Email verificado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *             examples:
 *               verificado:
 *                 summary: Verificacion exitosa
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Email verified successfully
 *       '400':
 *         description: Token invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               token_ausente:
 *                 summary: No se envio el verification_token
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Verification token is required
 *               token_invalido:
 *                 summary: La firma del token no es valida
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Verification token is invalid
 *       '404':
 *         description: El usuario del token no existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               usuario_no_encontrado:
 *                 summary: El usuario firmado en el token ya no existe
 *                 value:
 *                   ok: false
 *                   status: 404
 *                   message: User not found
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
auth_router.post('/verify', verify)

/**
 * @openapi
 * /api/auth/verify-email/{email}/resend:
 *   get:
 *     summary: Reenvia el mail de verificacion
 *     description: >
 *       Reenvia el mail de verificacion con un token nuevo cuando el usuario no lo recibio.
 *       Por seguridad la respuesta es identica sin importar si la cuenta existe
 *       o ya esta verificada (no se revela si el mail es real).
 *       El email viaja por path porque la consulta es GET (no tiene body).
 *     tags: [Auth]
 *     parameters:
 *       - name: email
 *         in: path
 *         required: true
 *         description: Email de la cuenta a la que reenviar el mail
 *         schema:
 *           type: string
 *           format: email
 *         example: juan.perez@mail.com
 *     responses:
 *       '200':
 *         description: Mail reenviado si corresponde (respuesta ambigua a proposito)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Se enviara un mail con los pasos para verificar en caso de que esta cuenta sea real
 *             examples:
 *               respuesta_ambigua:
 *                 summary: Respuesta igual exista o no la cuenta
 *                 value:
 *                   ok: true
 *                   status: 200
 *                   message: Se enviara un mail con los pasos para verificar en caso de que esta cuenta sea real
 *       '400':
 *         description: Email ausente o con formato invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               email_invalido:
 *                 summary: El email no tiene formato de email
 *                 value:
 *                   ok: false
 *                   status: 400
 *                   message: Email is incorrect
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
auth_router.get('/verify-email/:email/resend', resend_verification_limiter, resend)
// Solicitar recuperación de contraseña

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicita recuperar la contraseña
 *     description: >
 *       Recibe el email del usuario y, si la cuenta existe y está activa,
 *       envía un correo con un enlace para restablecer la contraseña.
 *       La respuesta no revela si el email está registrado.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan.perez@mail.com
 *     responses:
 *       '200':
 *         description: Solicitud procesada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *       '400':
 *         description: Email ausente o inválido
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
auth_router.post('/forgot-password', forgot_password_limiter, forgotPassword)

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablece la contraseña
 *     description: >
 *       Recibe el token enviado por correo y la nueva contraseña.
 *       El token es de USO UNICO: sirve una sola vez y pedir uno nuevo deja
 *       invalidos los anteriores. La contraseña debe tener al menos 8 caracteres
 *       y ser distinta de la actual.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reset_token
 *               - password
 *             properties:
 *               reset_token:
 *                 type: string
 *                 description: Token recibido en el correo de recuperación
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NuevaContraseNia123
 *     responses:
 *       '200':
 *         description: Contraseña actualizada correctamente
 *       '400':
 *         description: >
 *           Token inválido, expirado, ya utilizado, o contraseña nueva inválida
 *           (menos de 8 caracteres o igual a la actual). El campo `code`
 *           distingue el caso y no revela si la cuenta existe.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               token_ya_usado:
 *                 summary: El link ya fue utilizado o fue reemplazado
 *                 value: { ok: false, status: 400, message: 'Reset token has already been used', code: 'RESET_TOKEN_USED' }
 *               token_vencido:
 *                 summary: El link vencio
 *                 value: { ok: false, status: 400, message: 'Reset token has expired', code: 'RESET_TOKEN_EXPIRED' }
 *               token_invalido:
 *                 summary: Firma, proposito incorrecto o cuenta inexistente
 *                 value: { ok: false, status: 400, message: 'Reset token is invalid', code: 'RESET_TOKEN_INVALID' }
 *               password_corta:
 *                 summary: La contraseña nueva tiene menos de 8 caracteres
 *                 value: { ok: false, status: 400, message: 'Password must be at least 8 characters', code: 'PASSWORD_TOO_SHORT' }
 *               password_repetida:
 *                 summary: La contraseña nueva es igual a la actual
 *                 value: { ok: false, status: 400, message: 'New password must be different from the current one', code: 'PASSWORD_SAME_AS_CURRENT' }
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
// Cambiar contraseña usando el token recibido por email
auth_router.post('/reset-password', resetPassword)

export default auth_router
