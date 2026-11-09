import app from "./infraestrucure/web/app";
import { ServerBootstrap } from "./infraestrucure/bootstrap/server.bootstrap";
import { connectDB } from "./infraestrucure/config/data-base";

const serverBootstrap = new ServerBootstrap(app);

(async () => {
  try {
    // El servidor solo recibe peticiones cuando la base de datos ya está disponible
    await connectDB();
    await serverBootstrap.initialize();
  } catch (error) {
    console.error("Error al iniciar la aplicacion", error);
    process.exit(1);
  }
})();
