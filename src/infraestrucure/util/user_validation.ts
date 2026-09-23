import joi from "joi";

export type ReturnUserData = {
    name: string;
    email: string;
    password: string;
    avatarBase64?: string;
    status?: number;
    statusUser?: number;
    roleId?: number;
}

type ValidationUserData = {
    error: joi.ValidationError | undefined;
    value: ReturnUserData;
}

function validateUserData(data: any): ValidationUserData {
    const userSchema = joi.object({
        name: joi
            .string()
            .trim()
            .min(3)
            .required()
            .messages({
                'string.base': 'El nombre debe ser un texto',
                'string.empty': 'El nombre es requerido',
                'string.min': 'El nombre debe tener al menos 3 caracteres',
            }),
        email: joi
            .string()
            .email({ tlds: { allow: false } })
            .required()
            .messages({
                'string.email': 'Correo electrónico no válido',
                'string.empty': 'El correo es requerido',
            }),
        password: joi
            .string()
            .min(6)
            .required()
            .messages({
                'string.min': 'La contraseña debe tener al menos 6 caracteres',
                'string.empty': 'La contraseña es requerida',
            }),
        avatarBase64: joi.string().optional().allow(null, ''),
        roleId: joi.number().integer().positive().optional().allow(null),
        status: joi.number().valid(0, 1).optional().default(1),
        statusUser: joi.number().valid(0, 1).optional(),
    }).unknown(true);

    const { error, value } = userSchema.validate(data, { abortEarly: false });
    return { error, value };
}

export const loadUserData = (data: any): ReturnUserData => {
    const result = validateUserData(data);
    if (result.error) {
        const message = result.error.details.map(d => d.message).join(', ');
        throw new Error(message);
    }
    return result.value;
}