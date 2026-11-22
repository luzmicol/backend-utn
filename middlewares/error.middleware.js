
//Middleware de errores (Oficina de errores)
//Si bien llamamos a next en este caso NO nos interesa usarlo PORQUE no hay oficina sig a la de errores

//Conclusion simple: Con este middleware de errores centralizas cualquier error de tu API, todos los errores terminaran aqui y se manejaran desde aqui
function errorHandlerMiddleware(error, request, response, next) {

    //Error esperable del sistema
    if (error.status) {
        //code solo se incluye si el error lo definio: respuesta aditiva, no rompe a los consumidores actuales
        const body = {
            ok: false,
            status: error.status,
            message: error.message
        }

        if (error.code) {
            body.code = error.code
        }

        return response.status(error.status).send(body)
    }
    //Es un error inesperado
    else {
        console.error('[Middleware de Error]:', error.stack || error.message || error)
        //Error generico
        return response.status(500).send(
            {
                ok: false,
                status: 500,
                message: 'Internal server error'
            }
        )
    }
}

export default errorHandlerMiddleware