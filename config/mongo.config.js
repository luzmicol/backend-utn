import mongoose from 'mongoose'
import ENVIRONMENT from './environment.config.js'

let connectionPromise = null

const connectMongoDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection
    }

    if (!connectionPromise) {
        connectionPromise = mongoose
            .connect(ENVIRONMENT.MONGO_DB_URI, {
                dbName: ENVIRONMENT.MONGO_DB_NAME
            })
            .then((db) => {
                console.log('MongoDB Conectado exitosamente')
                return db.connection
            })
            .catch((error) => {
                connectionPromise = null
                console.error('Error conectando MongoDB:', error.message || error)
                throw error
            })
    }

    return await connectionPromise
}

export default connectMongoDB
