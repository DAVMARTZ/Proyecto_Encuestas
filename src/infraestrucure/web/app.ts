import express, {type Request, type Response} from "express";
import userRoutes from "../routes/UserRoutes";
import profileRoutes from "../routes/ProfileRoutes";
import surveyRoutes from "../routes/SurveyRoutes";
import cors from "cors"

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

        //DEV2
        this.app.use("/api/profile", profileRoutes);
        //DEV3
        this.app.use("/api/surveys", surveyRoutes);
    }

    getApp(){
        return this.app;
    }
}

export default new App().getApp()