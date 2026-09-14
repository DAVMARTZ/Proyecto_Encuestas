import express, {type Request, type Response} from "express";
import userRoutes from "../routes/UserRoutes";

class App{
    private app: express.Application = express();

    constructor(){
        this.app = express();
        this.middlewares();
        this.routes();
    }

    private middlewares():void{
        this.app.use(express.json());
    }

    private routes():void{
        this.app.use("/api", userRoutes);
    }

    getApp(){
        return this.app;
    }
}

export default new App().getApp()