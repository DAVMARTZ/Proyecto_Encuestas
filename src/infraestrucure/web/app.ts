import express from "express";
import cors from "cors";
import userRoutes from "../routes/UserRoutes";
import { SurveyRoutes } from '../routes/SurveyRoutes';
import { SurveyResponseRoutes } from '../routes/surveyResponseRoutes';
import roleRoutes from '../routes/RoleRoutes';

class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.middlewares();
        this.routes();
    }

    private middlewares(): void {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    }

    private routes(): void {
        this.app.use("/api", roleRoutes);
        this.app.use("/api", userRoutes);
        this.app.use('/api', SurveyRoutes);
        this.app.use('/api', SurveyResponseRoutes);

        // Ruta de salud
        this.app.get('/api/health', (_req, res) => {
            res.json({ status: 'UP', message: 'Backend Encuestas funcionando con TypeORM y PostgreSQL' });
        });
    }

    getApp() {
        return this.app;
    }
}

export default new App().getApp();