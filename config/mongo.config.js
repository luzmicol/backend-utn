import mongoose from 'mongoose';
import ENVIRONMENT from './environment.config.js';

let isConnected = false; // Caché de conexión para Serverless

const connectMongoDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(ENVIRONMENT.MONGO_DB_URI, {
      dbName: ENVIRONMENT.MONGO_DB_NAME,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Conectado exitosamente');
  } catch (error) {
    console.error('Error conectando MongoDB:', error);
    throw error;
  }
};

export default connectMongoDB;