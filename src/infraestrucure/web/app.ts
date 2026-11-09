import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import envs from "../config/environment-vars";
import { rateLimit, rejectNullBytes, securityHeaders } from "./securityMiddleware";
import userRoutes from "../routes/UserRoutes";
import { SurveyRoutes } from "../routes/SurveyRoutes";
import { SurveyResponseRoutes } from "../routes/surveyResponseRoutes";
import roleRoutes from "../routes/RoleRoutes";
import { QuestionRoutes } from "../routes/QuestionRoutes";
import { ResponseOptionRoutes } from "../routes/ResponseOptionRoutes";

class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.middlewares();
        this.routes();
        this.errorHandlers();
    }

    private middlewares(): void {
        this.app.disable("x-powered-by");
        this.app.use(securityHeaders);
        this.app.use(cors({ origin: envs.FRONTEND_URL.split(",").map((url) => url.trim()) }));
        this.app.use(rateLimit(envs.RATE_LIMIT_MAX));
        this.app.use(express.json({ limit: "5mb", verify: rejectNullBytes }));
    }

    private routes(): void {
        this.app.use("/api", roleRoutes);
        this.app.use("/api", userRoutes);
        this.app.use("/api", SurveyRoutes);
        this.app.use("/api", QuestionRoutes);
        this.app.use("/api", ResponseOptionRoutes);
        this.app.use("/api", SurveyResponseRoutes);

        // Ruta de salud
        this.app.get("/api/health", (_req, res) => {
            res.json({ status: "UP" });
        });
    }

    private errorHandlers(): void {
        // Ruta inexistente
        this.app.use((_req: Request, res: Response) => {
            res.status(404).json({ error: "Ruta no encontrada" });
        });

        // Express reconoce este manejador de errores porque recibe 4 parámetros
        this.app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
            if (error.type === "entity.parse.failed") {
                res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
                return;
            }
            if (error.type === "entity.verify.failed") {
                res.status(400).json({ error: "Los datos enviados no son válidos" });
                return;
            }
            if (error.type === "entity.too.large") {
                res.status(413).json({ error: "El cuerpo de la petición es demasiado grande" });
                return;
            }

            console.error("Error interno:", error?.message);
            res.status(500).json({ error: "Error interno del servidor" });
        });
    }

    getApp() {
        return this.app;
    }
}

export default new App().getApp();
