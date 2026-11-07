import joi from "joi";

export type ReturnSurveyData = {
  title: string;
  description?: string;
  closeDate?: Date;
  userId: number;
  questions?: Array<{
    questionText: string;
    questionType: string;
    isRequired?: boolean;
    displayOrder?: number;
    status?: number;
    options?: Array<{
      optionText: string;
      displayOrder?: number;
      status?: number;
    }>;
  }>;
};

type ValidationSurveyData = {
  error: joi.ValidationError | undefined;
  value: ReturnSurveyData;
};

function validateSurveyData(data: any): ValidationSurveyData {
  const schema = joi
    .object({
      title: joi.string().trim().max(200).required().messages({
        "string.base": "El título debe ser un texto",
        "string.empty": "El título no puede estar vacío.",
        "string.max": "El título no puede superar los 200 caracteres.",
        "any.required": "El título es obligatorio.",
      }),
      description: joi.string().allow("", null).optional(),
      closeDate: joi.date().iso().allow(null).optional().messages({
        "date.format": "La fecha de cierre debe tener un formato ISO válido.",
      }),
      userId: joi.number().integer().positive().required().messages({
        "number.base": "El ID del usuario debe ser un número entero.",
        "any.required": "El ID del usuario es obligatorio.",
      }),
      questions: joi.array().items(
        joi.object({
          questionText: joi.string().trim().required(),
          questionType: joi.string().trim().required(),
          isRequired: joi.boolean().optional().default(true),
          displayOrder: joi.number().integer().optional().default(1),
          status: joi.number().optional().default(1),
          options: joi.array().items(
            joi.object({
              optionText: joi.string().trim().required(),
              displayOrder: joi.number().integer().optional().default(1),
              status: joi.number().optional().default(1),
            }).unknown(true)
          ).optional()
        }).unknown(true)
      ).optional()
    })
    .unknown(true);

  const { error, value } = schema.validate(data, { abortEarly: false });
  return { error, value };
}

export const loadSurveyData = (data: any): ReturnSurveyData => {
  const result = validateSurveyData(data);
  if (result.error) {
    const message = result.error.details.map((d) => d.message).join(", ");
    throw new Error(message);
  }
  return result.value;
};
