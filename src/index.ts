import app from "./infraestrucure/web/app";
import { ServerBootstrap } from "./infraestrucure/bootstrap/server.bootstrap";
import { connectDB } from "./infraestrucure/config/data-base";

const serverBootstrap = new ServerBootstrap(app);

(async ()=>{
  try {
    const instances = [
      connectDB(), //Conexion a la DB
      serverBootstrap.initialize() // Inicializacion del servidor
    ];
    await Promise.all(instances);
  } catch (error) {
    console.log("Error al iniciar la aplicacion", error);
    process.exit(1);
  }
})();
