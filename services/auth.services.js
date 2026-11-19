/* 
La capa de servicios se encarga de la LOGICA DE NEGOCIO de cada endpoint:
validar datos, buscar usuarios en DB, comparar contrasenias, crear los tokens de acceso, etc

Los controllers no saben nada de negocio: le pasan los datos que llegaron del request
y esta capa devuelve el resultado que el controller pone en la response
Aqui no existe request ni response, solo entra un dato, se trabaja y sale un dato
*/

import ENVIRONMENT from "../config/environment.config.js"
import user_repository from "../repositories/user.repository.js"
import mailer_transporter from "../config/mailer.config.js"
import verificationEmail from "../utils/email-templates/verification-email.js"
import { compareHash, generateHash } from "../utils/bcrypt.util.js"
import ServerError from "../utils/error.util.js"

import jwt from "jsonwebtoken"

/* 
Crear el verification_token del usuario y enviarle el mail con el link que apunta a la pantalla /verify-email del FRONTEND
La reutilizamos en register y en resend
*/
async function sendVerificationEmail (user){
    /* 
    Firmamos el id del usuario para crear el verification_token
    Cuando el usuario haga click en el link, verificamos la firma para saber a quien marcar como verificado
    */
    const verification_token = jwt.sign(
        {
            id: user._id
        },
        ENVIRONMENT.JWT_SECRET_KEY
    )

    const frontend_url = ENVIRONMENT.URL_FRONTEND || 'http://localhost:5173'
    const verification_link = `${frontend_url}/verify-email?verification_token=${verification_token}`

    /*
    El link contiene el verification_token, por eso solo se imprime en desarrollo.
    En produccion (Vercel setea NODE_ENV=production) nunca debe quedar en los logs.
    */
    if(ENVIRONMENT.NODE_ENV !== 'production'){
        console.log('[VERIFY EMAIL LINK] (solo desarrollo)', verification_link)
    }

    await mailer_transporter.sendMail(
        {
            from: ENVIRONMENT.GMAIL_USER,
            to: user.email,
            subject: 'Verifica tu cuenta',
            html: verificationEmail(verification_link),
            //Texto sin formato como alternativa si el cliente no muestra HTML
            text: `Para verificar tu cuenta, abre el siguiente link: ${verification_link}`
        }
    )
}

/* 
REGISTER
1. Verifica que lleguen username, email y password -> 400
2. Verifica que el email tenga formato de email -> 400
3. Verifica que el email no este registrado -> 400
4. Encripta la password
5. Crea al usuario en DB
6. Le envia el mail de verificacion
*/
async function register (username, email, password) {

    if (!username || !email || !password) {
        throw new ServerError(
            "Email, password and username is required",
            400
        )
    }

    if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        throw new ServerError(
            "Email is incorrect",
            400
        )
    }

    //Validar si el mail ya esta registrado
    const user_already_exist = await user_repository.getByEmail(email)
    if (user_already_exist) {
        throw new ServerError(
            'Email is already used',
            400
        )
    }

    /* 
    Encriptamos la password para que en DB se guarde un dato irreversible 
    Viendo el dato irreversible es IMPROBABLE que se sepa el dato original
    */
    const password_hash = await generateHash(password)

    const user_created = await user_repository.create(username, email, password_hash)

    await sendVerificationEmail(user_created)

    return user_created
}

/* 
LOGIN
1. Verifica que lleguen email y password -> 400
2. Verifica que el email tenga formato de email -> 400
3. Busca al usuario por email y lo compara contra la contrasenia del body -> 401 si falla
4. Crea el token de acceso que el cliente guarda para las consultas privadas
*/
async function login (email, password) {

    if (
        !email || !password || typeof email !== "string" || typeof password !== "string"
    ) {
        throw new ServerError(
            "Email and password are required",
            400
        );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { 
        throw new ServerError(
            "Email is incorrect",
            400
        );
    }

    const user = await user_repository.getByEmail(email)

    /* 
    No decimos "User not found" sino "Invalid email or password"
    Si dijeramos cual de los dos error es, alguien podria descubrir que emails tienen cuenta
    */
    if (!user) {
        throw new ServerError(
            "Invalid email or password",
            401
        );
    }

    //Compara el hash guardado en DB contra la contrasenia que nos envio por body el cliente
    const isPasswordValid = await compareHash(password, user.password);
    if (!isPasswordValid) {
        throw new ServerError(
            "Invalid email or password",
            401
        );
    }

    /* 
    Firmamos el token de acceso con los datos que las rutas privadas piden (auth middleware lee id, name y email)
    */
    const authentication_token = jwt.sign(
        {
            id: user._id,
            name: user.nombre,
            email: user.email
        },
        ENVIRONMENT.JWT_SECRET_KEY
    )

    return {
        authentication_token: authentication_token
    }
}

/* 
VERIFY
El usuario llega a esta pantalla desde el link del mail
En el body se envia el verification_token que se firmo en el register
1. Verifica que llegue el verification_token -> 400
2. Verifica su firma (si no es valida jwt.verify lanza error) -> 400
3. Busca al usuario del token -> 404
4. Marcamos el email como verificado (si ya estaba verificado no hace falta repetirlo)
*/
async function verify (verification_token) {

    if (!verification_token) {
        throw new ServerError(
            "Verification token is required",
            400
        )
    }

    //Verificamos la firma del token, si no es valido jwt.verify lanza error
    let jwt_payload
    try {
        jwt_payload = jwt.verify(verification_token, ENVIRONMENT.JWT_SECRET_KEY)
    } catch (error) {
        throw new ServerError(
            "Verification token is invalid",
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

    //Marcamos el email como verificado (si ya estaba verificado no hace falta repetirlo)
    if (!user.email_verificado) {
        await user_repository.verifyEmailById(user._id)
    }

    return user
}

/* 
RESEND
Reenvia el mail de verificacion con un token nuevo cuando el usuario no lo recibio o expiro
No revelamos si el mail esta registrado o ya verificado: en cualquier caso respondemos igual
para que nadie pueda averiguar que cuentas son reales
1. Verifica que el email tenga formato de email -> 400
2. Busca al usuario y solo si existe y no verifico le reenvia el mail (afuera se ve igual en cualquier caso)
3. Devuelve siempre el mismo mensaje ambiguo
*/
async function resend (email) {

    if (!email || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        throw new ServerError(
            "Email is incorrect",
            400
        )
    }

    const user = await user_repository.getByEmail(email)

    //Solo enviamos el mail si el usuario existe y todavia no verifico (afuera se ve igual en cualquier caso)
    if (user && !user.email_verificado) {
        await sendVerificationEmail(user)
    }

    return {
        message: "Se enviara un mail con los pasos para verificar en caso de que esta cuenta sea real"
    }
}

/* 
Al igual que en los repositories, el service es un singleton con un solo metodo por endpoint
*/
const auth_service = {
    register,
    login,
    verify,
    resend
}

export default auth_service
