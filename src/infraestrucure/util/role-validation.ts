import joi from "joi";

export type ReturnRoleData = {
  name: string;
  description?: string;
  status?: number;
};

export type ReturnUpdateRoleData = Partial<{
  name: string;
  description: string;
  status: number;
}>;

type ValidationRoleData = {
  error: joi.ValidationError | undefined;
  value: ReturnRoleData;
};

type ValidationUpdateRoleData = {
  error: joi.ValidationError | undefined;
  value: ReturnUpdateRoleData;
};

function validateRoleData(data: any): ValidationRoleData {
  const roleSchema = joi
    .object({
      name: joi
        .string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .messages({
          "string.base": "El nombre del rol debe ser un texto",
          "string.empty": "El nombre del rol es requerido",
          "string.min": "El nombre debe tener al menos 2 caracteres",
          "string.max": "El nombre no puede superar los 50 caracteres",
          "any.required": "El nombre del rol es obligatorio",
        }),
      description: joi.string().trim().max(255).allow("", null).optional().messages({
        "string.max": "La descripción no puede superar los 255 caracteres",
      }),
      status: joi.number().valid(0, 1).optional().default(1),
    })
    .unknown(true);

  const { error, value } = roleSchema.validate(data, { abortEarly: false });
  return { error, value };
}

function validateUpdateRoleData(data: any): ValidationUpdateRoleData {
  const schema = joi
    .object({
      name: joi.string().trim().min(2).max(50).optional().messages({
        "string.min": "El nombre debe tener al menos 2 caracteres",
        "string.max": "El nombre no puede superar los 50 caracteres",
      }),
      description: joi.string().trim().max(255).allow("", null).optional(),
      status: joi.number().valid(0, 1).optional(),
    })
    .unknown(true);

  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  return { error, value };
}

export const loadRoleData = (data: any): ReturnRoleData => {
  const result = validateRoleData(data);
  if (result.error) {
    const message = result.error.details.map((d) => d.message).join(", ");
    throw new Error(message);
  }
  return result.value;
};

export const loadUpdateRoleData = (data: any): ReturnUpdateRoleData => {
  const result = validateUpdateRoleData(data);
  if (result.error) {
    const message = result.error.details.map((d) => d.message).join(", ");
    throw new Error(message);
  }
  return result.value;
};
