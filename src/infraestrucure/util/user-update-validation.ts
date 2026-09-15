import joi from "joi";

export type ReturnUpdateUserData = Partial<{
    nombre: string;
    correo: string;
    password: string;
    status: number;
}>;

type validationUpdateUserData = {
    error: joi.ValidationError | undefined;
    value: ReturnUpdateUserData;
}

function validateUpdateUserData(data: any): validationUpdateUserData {
    const schema = joi
        .object({
            nombre: joi
                .string()
                .trim()
                .min(3)
                .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$/)
                .messages({
                    "string.min": "El nombre debe tener al menos 3 caracteres",
                    "string.pattern.base": "El nombre solo puede contener letras y espacios",
                }),

            correo: joi
                .string()
                .trim()
                .email({ tlds: { allow: false } })
                .messages({
                    "string.email": "Correo electrónico no válido",
                }),

            password: joi
                .string()
                .min(6)
                .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
                .messages({
                    "string.min": "La contraseña debe tener al menos 6 caracteres",
                    "string.pattern.base": "La contraseña debe tener letras y números",
                }),

            status: joi.number().valid(0, 1).messages({
                "any.only": "El estado debe ser 0 (inactivo) o 1 (activo)",
                "number.base": "El estado debe ser numérico",
            }),
        })
        .unknown(false) // No permitir campos extra
        .or("nombre", "correo", "password", "status"); // Requiere al menos 1 campo

        const {error, value} = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
        return {error, value};
}

export const loadUpdateUserData = (data: any): ReturnUpdateUserData => {
    const result = validateUpdateUserData(data);
    if(result.error) {
        const message = result.error.details.map((d) => d.message).join(", ");
        throw new Error(message);
    }
    return result.value;
};