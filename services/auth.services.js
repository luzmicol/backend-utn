
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
import jwt from "jsonwebtoken"

// Expresion regular para validar emails
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email) {
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
        throw new ServerError("Email is incorrect", 400)
    }
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
*/
async function sendPasswordResetEmail(user) {

    const reset_token = jwt.sign(
        {
            id: user._id,
            purpose: "password-reset"
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

    if (!username || !email || !password) {
        throw new ServerError(
            "Email, password and username is required",
            400
        )
    }

    validateEmail(email)

    const user_already_exist = await user_repository.getByEmail(email)

    if (user_already_exist) {
        throw new ServerError(
            "Email is already used",
            400
        )
    }

    const password_hash = await generateHash(password)

    const user_created = await user_repository.create(
        username,
        email,
        password_hash
    )

    await sendVerificationEmail(user_created)

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

    validateEmail(email)

    const user = await user_repository.getByEmail(email)

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

    validateEmail(email)

    const user = await user_repository.getByEmail(email)

    if (user && user.activo && !user.email_verificado) {
        await sendVerificationEmail(user)
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

    validateEmail(email)

    const user = await user_repository.getByEmail(email)

    if (user && user.activo) {
        await sendPasswordResetEmail(user)
    }

    return {
        message: "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."
    }
}

/*
RESET PASSWORD

1. Verifica que lleguen el token y la nueva contraseña.
2. Verifica la firma y vencimiento del JWT.
3. Comprueba que el token sea específico para recuperación.
4. Busca al usuario y comprueba que esté activo.
5. Encripta la nueva contraseña y la guarda en DB.
*/
async function resetPassword(reset_token, password) {

    if (!reset_token || typeof reset_token !== "string") {
        throw new ServerError(
            "Reset token is required",
            400
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
        throw new ServerError(
            "Reset token is invalid or expired",
            400
        )
    }

    if (token_payload.purpose !== "password-reset") {
        throw new ServerError(
            "Invalid reset token",
            400
        )
    }

    const user = await user_repository.getById(token_payload.id)

    if (!user) {
        throw new ServerError(
            "User not found",
            404
        )
    }

    if (!user.activo) {
        throw new ServerError(
            "User account is disabled",
            403
        )
    }

    const password_hash = await generateHash(password)

    await user_repository.updateById(
        user._id,
        {
            password: password_hash
        }
    )

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
