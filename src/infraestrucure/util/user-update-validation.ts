import joi from "joi";

export type ReturnUpdateUserData = Partial<{
    name: string;
    email: string;
    password: string;
    avatarBase64: string | null;
    status: number;
    statusUser: number;
    roleId: number;
}>;

type validationUpdateUserData = {
    error: joi.ValidationError | undefined;
    value: ReturnUpdateUserData;
}

function validateUpdateUserData(data: any): validationUpdateUserData {
    const schema = joi
        .object({
            name: joi.string().trim().min(3).optional(),
            email: joi.string().trim().email({ tlds: { allow: false } }).optional(),
            password: joi.string().min(6).optional(),
            avatarBase64: joi.string().optional().allow(null, ''),
            status: joi.number().valid(0, 1).optional(),
            statusUser: joi.number().valid(0, 1).optional(),
            roleId: joi.number().integer().positive().optional(),
        })
        .unknown(true);

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