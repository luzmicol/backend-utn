import mysql from "mysql2";
import ENVIRONMENT from "./environment.config.js"

const  connection = mysql.createConnection(
    {
        host: ENVIRONMENT.MYSQL_DB_HOST,
        user: ENVIRONMENT.MYSQL_DB_USER,
        password: ENVIRONMENT.MYSQL_DB_PASSWORD,
        database: ENVIRONMENT.MYSQL_DB_NAME,
        port: ENVIRONMENT.MYSQL_DB_PORT,
        connectionLimit: 3,
        WaitForConnections: true,
        queueLimmit: 0
    }
)

export async function testConection() {
    try{
        await pool.query('SELECT 1')
        console.log ('MYSQL conectado correctamente')
        return
    }
    catch (error){
        console.error('Error en la conexion con MYSQL', error)
        return
    }
}


connection.connect(
    (error)=> {
       if (error){
        console.error( 'Error de conexion', error)
        return
       } 
    console.log ("Conexionn a MySQL exitosa")
    }
)
export default connection