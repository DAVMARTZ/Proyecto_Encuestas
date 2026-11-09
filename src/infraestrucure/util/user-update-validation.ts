import joi from "joi";

// El correo y la contraseña se administran en Firebase
export type ReturnUpdateUserData = Partial<{
    name: string;
    avatarBase64: string | null;
    status: number;
    roleId: number;
}>;

type validationUpdateUserData = {
    error: joi.ValidationError | undefined;
    value: ReturnUpdateUserData;
}

function validateUpdateUserData(data: any): validationUpdateUserData {
    const schema = joi
        .object({
            name: joi.string().trim().min(3).max(150).optional(),
            // Solo imágenes en Data URI, de hasta unos 3 MB
            avatarBase64: joi.string().max(4000000).pattern(/^data:image\/(png|jpeg|webp);base64,/).optional().allow(null, '').messages({
                'string.max': 'La foto de perfil es demasiado grande',
                'string.pattern.base': 'La foto debe ser una imagen PNG, JPEG o WEBP',
            }),
            status: joi.number().valid(0, 1).optional(),
            roleId: joi.number().integer().positive().optional(),
        });

    // stripUnknown descarta cualquier otro campo
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });
    return { error, value };
}

export const loadUpdateUserData = (data: any): ReturnUpdateUserData => {
    const result = validateUpdateUserData(data);
    if (result.error) {
        const message = result.error.details.map((d) => d.message).join(", ");
        throw new Error(message);
    }
    return result.value;
};
