import joi from "joi"; //validación
import "dotenv/config"; //maneh¿jar las variables de entorno desde el process

export type ReturnEnvironmentVars = {
    PORT: number;
    DB_HOST:string;
    DB_PORT:number;
    DB_USER:string;
    DB_PASSWORD:string;
    DB_NAME:string;
}
export type ValidationEnvironmentVars = {
    error: joi.ValidationError | undefined; //si joi no me da ninguno doy undefined
    value: ReturnEnvironmentVars
}

function validateEnVars(vars: NodeJS.ProcessEnv): ValidationEnvironmentVars {
    const envSchema = joi.object({
        PORT: joi.number().required(),
        DB_HOST: joi.string().required(),
        DB_PORT: joi.number().default(5432),
        DB_USER: joi.string().required(),
        DB_PASSWORD: joi.string().allow("").optional(),
        DB_NAME: joi.string().required(),
    }).unknown(true);

    const {error, value} = envSchema.validate(vars);
    return {error, value}
}

const loadEnvVars = () : ReturnEnvironmentVars => {
    //Validar los datos
    const result = validateEnVars(process.env);
    if(result.error){
        throw new Error (result.error.message);
    }
    const value = result.value;
    
    return {
        PORT: value.PORT,
        DB_HOST: value.DB_HOST,
        DB_PORT: value.DB_PORT,
        DB_USER: value.DB_USER,
        DB_PASSWORD: value.DB_PASSWORD,
        DB_NAME: value.DB_NAME
    }

}

const envs = loadEnvVars();
export default envs;