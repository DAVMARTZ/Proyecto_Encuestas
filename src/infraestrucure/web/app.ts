import express, {type Request, type Response} from "express";
import userRoutes from "../routes/UserRoutes";
import { SurveyRoutes } from '../routes/SurveyRoutes';
import { SurveyResponseRoutes } from '../routes/surveyResponseRoutes';

class App{
    private app: express.Application = express();

    constructor(){
        this.app = express();
        this.middlewares();
        this.routes();
    }

    private middlewares():void{
        this.app.use(cors());
        this.app.use(express.json());
    }

    private routes():void{
        this.app.use("/api", userRoutes);
        this.app.use('/api', SurveyRoutes);
        this.app.use('/api', SurveyResponseRoutes);
    }

    getApp(){
        return this.app;
    }
}

export default new App().getApp()