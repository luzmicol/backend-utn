import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import ENVIRONMENT from '../config/environment.config.js'
import user_repository from '../repositories/user.repository.js'
import ServerError from '../utils/error.util.js'

async function authMiddleware (request, response, next){
    try{

        const auth_header = request.headers.authorization 
        if(!auth_header){
            throw new ServerError('Auth header is required', 401)
        }
    
        const auth_token = auth_header.split(' ')[1] 
        if(!auth_token){
            throw new ServerError('Auth header is malformed', 401)
        }

        const payload = jwt.verify(auth_token, ENVIRONMENT.JWT_SECRET_KEY)

        if (!payload || payload.purpose || !payload.id || !payload.name || !payload.email) {
            throw new ServerError('Auth token is invalid!', 401)
        }

        if (!mongoose.Types.ObjectId.isValid(payload.id)) {
            throw new ServerError('Auth token is invalid!', 401)
        }

        const user = await user_repository.getAuthStatusById(payload.id)

        if (!user || !user.activo) {
            throw new ServerError('Auth token is invalid!', 401)
        }

        request.user = {
            id: String(user._id),
            name: user.nombre,
            email: user.email
        }

        next()
    }
    catch(error){
        //Si hubo algun fallo al verificar el token
        if(
            error instanceof jwt.JsonWebTokenError //Falla verificacion o esta mal escrito
            || 
            error instanceof jwt.NotBeforeError //Es un token del futuro
            ||
            error instanceof jwt.TokenExpiredError //Es un token expirado
        ){
            return response.status(401).send({
                ok:false,
                status: 401,
                message: 'Auth token is invalid!'
            })
        }
        
        if(error.status){
            return response.status(error.status).send(
                {
                    ok: false,
                    status: error.status,
                    message: error.message
                }
            )
        }

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

export default authMiddleware