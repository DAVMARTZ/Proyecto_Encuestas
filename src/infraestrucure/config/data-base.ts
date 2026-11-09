import { DataSource } from 'typeorm';
import { User } from "../entities/User";
import { RoleEntity } from "../entities/RoleEntity";
import { SurveyEntity } from "../entities/Survey";
import envs from './environment-vars';
import { QuestionEntity } from '../entities/QuestionEntity';
import { ResponseOptionEntity } from '../entities/ResponseOptionEntity';
import { SurveyResponseEntity } from '../entities/SurveyResponseEntity';
import { ResponseDetailEntity } from '../entities/ResponseDetailEntity';

export const AppDataSource = new DataSource({
    type: "postgres",
    host: envs.DB_HOST,
    port: Number(envs.DB_PORT),
    username: envs.DB_USER,
    password: envs.DB_PASSWORD,
    database: envs.DB_NAME,
    synchronize: false,
    logging: false, // Las consultas incluyen datos personales y no deben ir a los logs
    entities: [
        RoleEntity,
        User,
        SurveyEntity,
        QuestionEntity,
        ResponseOptionEntity,
        SurveyResponseEntity,
        ResponseDetailEntity,
    ],
});

// Conectar a la BD
export const connectDB = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Conectado a la base de datos Postgres con TypeORM exitosamente");
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        process.exit(1);
    }
};