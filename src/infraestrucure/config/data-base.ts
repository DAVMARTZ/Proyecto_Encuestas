import { DataSource } from 'typeorm'
import dotenv from "dotenv";
import { User } from "../entities/User";
import { SurveyEntity } from "../entities/Survey";
import envs from './environment-vars';
import { QuestionEntity } from '../entities/QuestionEntity';
import { ResponseOptionEntity } from '../entities/ResponseOptionEntity';
import { SurveyResponseEntity } from '../entities/SurveyResponseEntity';
import { ResponseDetailEntity } from '../entities/ResponseDetailEntity';

dotenv.config();
	export const AppDataSource = new DataSource({
        type: "postgres",
        port: Number(envs.DB_PORT),
        username: envs.DB_USER,
        password: envs.DB_PASSWORD,
        database: envs.DB_NAME,
        //schema: "users",
        synchronize:true,
        logging:true,
        entities: [User, SurveyEntity,QuestionEntity,ResponseOptionEntity,SurveyResponseEntity, ResponseDetailEntity,],
    })

//Conectar a la BD
export const connectDB = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Conectado a la base de datos Postgres");
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        process.exit(1);
    }
}