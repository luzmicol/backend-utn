
/*
La capa de servicios se encarga de la LOGICA DE NEGOCIO de cada endpoint:
validar datos, buscar usuarios en DB, comparar contraseñas, crear los tokens de acceso, etc.

Los controllers no saben nada de negocio: le pasan los datos que llegaron del request
y esta capa devuelve el resultado que el controller pone en la response.
Aqui no existe request ni response, solo entra un dato, se trabaja y sale un dato.
*/

import ENVIRONMENT from "../config/environment.config.js"
import user_repository from "../repositories/user.repository.js"
import mailer_transporter from "../config/mailer.config.js"
import verificationEmail from "../utils/email-templates/verification-email.js"
import passwordResetEmail from "../utils/email-templates/password-reset-email.js"
import { compareHash, generateHash } from "../utils/bcrypt.util.js"
import ServerError from "../utils/error.util.js"
import { maskEmails } from "../utils/log.util.js"
import { generateAvailableUsername } from "../utils/migrate-usernames.util.js"
import { randomUUID } from "node:crypto"
import jwt from "jsonwebtoken"

// Expresion regular para validar emails
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email) {
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        throw new ServerError("Email is incorrect", 400)
    }

    return email.trim().toLowerCase()
}

/*
Un fallo de SMTP NUNCA se devuelve al cliente: responder distinto segun si la
cuenta existe revelaria informacion. Ademas cortaria el flujo (en register deja
el usuario creado y el siguiente intento diria "Email is already used").

Se registra el id del usuario y el error de SMTP, con los emails enmascarados,
que es lo suficiente para diagnosticar sin dejar datos sensibles en los logs.
*/
function logMailError(scope, user_id, error) {
    console.error(`[${scope}] fallo al enviar el mail:`, {
        user_id: String(user_id),
        code: error?.code ?? null,
        message: maskEmails(error?.message ?? String(error))
    })
}

/*
Crear el verification_token del usuario y enviarle el mail con el link
que apunta a la pantalla /verify-email del FRONTEND.
La reutilizamos en register y en resend.
*/
async function sendVerificationEmail(user) {

    const verification_token = jwt.sign(
        {
            id: user._id
        },
        ENVIRONMENT.JWT_SECRET_KEY,
        {
            expiresIn: "24h"
        }
    )

    const frontend_url = ENVIRONMENT.URL_FRONTEND || "http://localhost:5173"

    const verification_link =
        `${frontend_url}/verify-email?verification_token=${encodeURIComponent(verification_token)}`

    // El link contiene el token, por eso solo se imprime en desarrollo.
    if (ENVIRONMENT.NODE_ENV !== "production") {
        console.log("[VERIFY EMAIL LINK] (solo desarrollo)", verification_link)
    }

    await mailer_transporter.sendMail({
        from: ENVIRONMENT.GMAIL_USER,
        to: user.email,
        subject: "Verifica tu cuenta",
        html: verificationEmail(verification_link),
        text: `Para verificar tu cuenta, abre el siguiente link: ${verification_link}`
    })
}

/*
Crear el token de recuperación y enviar el mail con el link.
El token tiene un propósito específico para que no pueda utilizarse
un token de verificación de email para cambiar la contraseña.

USO UNICO: cada solicitud genera un jti nuevo, lo guarda en el usuario y lo
incluye en el payload. Guardarlo deja invalidados todos los anteriores, y al
usarse el token el service lo pone en null. De esa forma un link no puede
reutilizarse ni reemplazarse a medias.
*/
async function sendPasswordResetEmail(user) {

    const reset_jti = randomUUID()

    await user_repository.setPasswordResetJti(user._id, reset_jti)

    const reset_token = jwt.sign(
        {
            id: user._id,
            purpose: "password-reset",
            jti: reset_jti
        },
        ENVIRONMENT.JWT_SECRET_KEY,
        {
            expiresIn: "15m"
        }
    )

    const frontend_url = ENVIRONMENT.URL_FRONTEND || "http://localhost:5173"

    const reset_link =
        `${frontend_url}/reset-password?reset_token=${encodeURIComponent(reset_token)}`

    await mailer_transporter.sendMail({
        from: ENVIRONMENT.GMAIL_USER,
        to: user.email,
        subject: "Restablecer contraseña",
        html: passwordResetEmail(reset_link),
        text: `Para restablecer tu contraseña, abre el siguiente link: ${reset_link}`
    })
}

/*
REGISTER

1. Verifica que lleguen username, email y password.
2. Verifica que el email tenga formato correcto.
3. Verifica que el email no esté registrado.
4. Encripta la password.
5. Crea al usuario en DB.
6. Le envía el mail de verificación.
*/
async function register(username, email, password) {

    if (
        !username ||
        !email ||
        !password ||
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        throw new ServerError(
            "Email, password and username is required",
            400
        )
    }

    const normalized_username = username.trim()

    if (normalized_username.length < 2 || normalized_username.length > 50) {
        throw new ServerError(
            "Username must be between 2 and 50 characters",
            400
        )
    }

    const normalized_email = validateEmail(email)

    if (password.length < 8) {
        throw new ServerError(
            "Password must be at least 8 characters",
            400,
            "PASSWORD_TOO_SHORT"
        )
    }

    const user_already_exist = await user_repository.getByEmail(normalized_email)

    if (user_already_exist) {
        throw new ServerError(
            "Email is already used",
            400
        )
    }

    const password_hash = await generateHash(password)
    const generated_username = await generateAvailableUsername(normalized_username)

    const user_created = await user_repository.create(
        normalized_username,
        normalized_email,
        password_hash,
        generated_username
    )

    //Si falla el mail no se tira el registro: el usuario quedó creado y puede
    //reintentar desde la pantalla de reenvío de verificación
    try {
        await sendVerificationEmail(user_created)
    } catch (error) {
        logMailError("Register", user_created._id, error)
    }

    return user_created
}

/*
LOGIN

1. Verifica que lleguen email y password.
2. Verifica que el email tenga formato correcto.
3. Busca al usuario por email.
4. Compara la contraseña contra el hash guardado en DB.
5. Comprueba que el email esté verificado.
6. Crea el token de acceso.
*/
async function login(email, password) {

    if (
        !email ||
        !password ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        throw new ServerError(
            "Email and password are required",
            400
        )
    }

    const normalized_email = validateEmail(email)

    const user = await user_repository.getByEmail(normalized_email)

    if (!user) {
        throw new ServerError(
            "Invalid email or password",
            401
        )
    }

    const isPasswordValid = await compareHash(password, user.password)

    if (!isPasswordValid) {
        throw new ServerError(
            "Invalid email or password",
            401
        )
    }

    if (!user.email_verificado) {
        throw new ServerError(
            "Email no verificado",
            403
        )
    }

    if (!user.activo) {
        throw new ServerError(
            "User account is disabled",
            403
        )
    }

    const authentication_token = jwt.sign(
        {
            id: user._id,
            name: user.nombre,
            email: user.email
        },
        ENVIRONMENT.JWT_SECRET_KEY,
        {
            expiresIn: "1d"
        }
    )

    return {
        authentication_token: authentication_token
    }
}

/*
VERIFY

1. Verifica que llegue el verification_token.
2. Verifica su firma y vencimiento.
3. Busca al usuario correspondiente.
4. Marca el email como verificado.
*/
async function verify(verification_token) {

    if (!verification_token) {
        throw new ServerError(
            "Verification token is required",
            400
        )
    }

    let jwt_payload

    try {
        jwt_payload = jwt.verify(
            verification_token,
            ENVIRONMENT.JWT_SECRET_KEY
        )
    } catch (error) {
        throw new ServerError(
            "Verification token is invalid or expired",
            400
        )
    }

    const user = await user_repository.getById(jwt_payload.id)

    if (!user) {
        throw new ServerError(
            "User not found",
            404
        )
    }

    if (!user.email_verificado) {
        await user_repository.verifyEmailById(user._id)
    }

    return user
}

/*
RESEND

Reenvía el mail de verificación con un token nuevo.
No revelamos si el mail está registrado o ya verificado.
*/
async function resend(email) {

    const normalized_email = validateEmail(email)

    const user = await user_repository.getByEmail(normalized_email)

    if (user && user.activo && !user.email_verificado) {
        try {
            await sendVerificationEmail(user)
        } catch (error) {
            //Mismo mensaje de respuesta haga o no el envio: no revela si la cuenta existe
            logMailError("Resend", user._id, error)
        }
    }

    return {
        message: "Se enviara un mail con los pasos para verificar en caso de que esta cuenta sea real"
    }
}

/*
FORGOT PASSWORD

1. Valida el formato del email.
2. Busca al usuario.
3. Si existe y está activo, envía el mail de recuperación.
4. Devuelve siempre el mismo mensaje para no revelar cuentas registradas.
*/
async function forgotPassword(email) {

    const normalized_email = validateEmail(email)

    const user = await user_repository.getByEmail(normalized_email)

    if (user && user.activo) {
        try {
            await sendPasswordResetEmail(user)
        } catch (error) {
            /*
            El cliente recibe siempre el mismo 200, igual que si la cuenta no
            existiera. El error queda registrado para diagnosticar.
            */
            logMailError("ForgotPassword", user._id, error)
        }
    }

    return {
        message: "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."
    }
}

/*
RESET PASSWORD

1. Verifica que lleguen el token y la nueva contraseña.
2. Verifica la firma y vencimiento del JWT.
3. Comprueba que el token sea específico para recuperación y que traiga el jti.
4. Busca al usuario y comprueba que esté activo.
5. Comprueba que el jti sea el último emitido para ese usuario (uso único).
6. Valida la contraseña nueva: mínimo 8 caracteres y distinta de la actual.
   Un intento fallido no consume el link.
7. Encripta la nueva contraseña y la guarda junto con el jti en null en una
   sola operación condicional: si otro request ya usó el token, no se aplica.

Todos los problemas del token responden 400 sin revelar si la cuenta existe:
    - RESET_TOKEN_INVALID      firma, propósito o cuenta inexistente
    - RESET_TOKEN_EXPIRED      vencido
    - RESET_TOKEN_USED         ya usado o reemplazado por una solicitud más nueva
    - PASSWORD_TOO_SHORT       la nueva contraseña tiene menos de 8 caracteres
    - PASSWORD_SAME_AS_CURRENT es igual a la actual
*/
async function resetPassword(reset_token, password) {

    if (!reset_token || typeof reset_token !== "string") {
        throw new ServerError(
            "Reset token is required",
            400,
            "RESET_TOKEN_INVALID"
        )
    }

    if (!password || typeof password !== "string") {
        throw new ServerError(
            "New password is required",
            400
        )
    }

    let token_payload

    try {
        token_payload = jwt.verify(
            reset_token,
            ENVIRONMENT.JWT_SECRET_KEY
        )
    } catch (error) {
        //Vencido e invalido se responden distinto para dar una respuesta clara:
        //ninguno de los dos llega a consultar la base ni revela nada sobre la cuenta
        if (error && error.name === "TokenExpiredError") {
            throw new ServerError(
                "Reset token has expired",
                400,
                "RESET_TOKEN_EXPIRED"
            )
        }

        throw new ServerError(
            "Reset token is invalid",
            400,
            "RESET_TOKEN_INVALID"
        )
    }

    if (token_payload.purpose !== "password-reset" || !token_payload.jti) {
        throw new ServerError(
            "Reset token is invalid",
            400,
            "RESET_TOKEN_INVALID"
        )
    }

    const user = await user_repository.getById(token_payload.id)

    if (!user) {
        //Mismo error que un token inválido: un 404 confirmaría que la cuenta existe
        throw new ServerError(
            "Reset token is invalid",
            400,
            "RESET_TOKEN_INVALID"
        )
    }

    if (!user.activo) {
        throw new ServerError(
            "User account is disabled",
            403
        )
    }

    //Uso único: solo vale el último jti emitido para este usuario.
    //Cubre al token ya usado, al reemplazado por una solicitud más nueva y a
    //los tokens antiguos emitidos antes de existir este campo.
    if (token_payload.jti !== user.password_reset_jti) {
        throw new ServerError(
            "Reset token has already been used",
            400,
            "RESET_TOKEN_USED"
        )
    }

    /*
    Validaciones de la contraseña NUEVA.
    Van despues de validar el token: si el link no sirve, se responde error de
    token y no se llega a tocar la base. Un intento fallido NO consume el link.
    La comparacion con la anterior solo puede hacerse aca: el frontend no conoce
    la contraseña actual.
    */
    if (password.length < 8) {
        throw new ServerError(
            "Password must be at least 8 characters",
            400,
            "PASSWORD_TOO_SHORT"
        )
    }

    const is_same_password = await compareHash(password, user.password)

    if (is_same_password) {
        throw new ServerError(
            "New password must be different from the current one",
            400,
            "PASSWORD_SAME_AS_CURRENT"
        )
    }

    const password_hash = await generateHash(password)

    const user_updated = await user_repository.consumePasswordReset(
        user._id,
        token_payload.jti,
        password_hash
    )

    if (!user_updated) {
        //Otro request con el mismo token ganó la carrera entre la validación y el update
        throw new ServerError(
            "Reset token has already been used",
            400,
            "RESET_TOKEN_USED"
        )
    }

    return {
        message: "Password updated successfully"
    }
}

/*
El service es un singleton con un método por endpoint.
*/
const auth_service = {
    register,
    login,
    verify,
    resend,
    forgotPassword,
    resetPassword
}

export default auth_service
