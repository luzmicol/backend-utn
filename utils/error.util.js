


class ServerError extends Error{
    constructor(message, status, code){
        super(message)
        this.status = status
        /*
        code es OPCIONAL: permite al frontend reaccionar ante un caso concreto
        (token vencido, token usado, rate limit, etc) sin tener que parsear
        el mensaje. Si no se pasa, la respuesta no incluye la clave.
        */
        if (code) {
            this.code = code
        }
    }
}

export default ServerError