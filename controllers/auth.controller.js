/* 
El controller maneja la parte HTTP de cada endpoint:
lee los datos que llegan en el request (body, params, query), los delega a los services
y arma la response con el status code correspondiente

Aqui NO va la logica de negocio: esa vive en ../services/auth.services.js
*/

import auth_service from "../services/auth.services.js"

/* 
Para enviar en una request HTTP info a una API usamos el body

Las consultas (request) tipo GET NO TIENEN body
El body puede ser de distintos tipos de dato:
    Hoy vamos a usar JSON, para poder usar JSON nuestra API debe estar preparada para recibir ese tipo de informacion
*/

export async function register(request, response) {

    console.log("[REGISTER]", request.body)
    const { username, email, password } = request.body

    await auth_service.register(username, email, password)

    return response.status(201).send({
        ok: true,
        status: 201,
        message: "User registered successfully"
    })
}

export async function login(request, response) {
    const { email, password } = request.body

    const { authentication_token } = await auth_service.login(email, password)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "You have logged in successfully",
        data: {
            authentication_token: authentication_token
        }
    })
}

/* 
El usuario llega a esta pantalla desde el link del mail
En el body recibimos el verification_token que se firma en el register
*/
export async function verify(request, response) {
    const { verification_token } = request.body

    await auth_service.verify(verification_token)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: "Email verified successfully"
    })
}

/* 
El usuario llega desde la pantalla /resend-email-verification del FRONTEND
El email viaja en los params porque es un tipo GET
*/
export async function resend(request, response) {
    const { email } = request.params

    const { message } = await auth_service.resend(email)

    return response.status(200).send({
        ok: true,
        status: 200,
        message: message
    })
}
