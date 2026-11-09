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
      description: joi.string().max(1000).allow("", null).optional(),
      closeDate: joi.date().iso().greater("now").allow(null).optional().messages({
        "date.format": "La fecha de cierre debe tener un formato ISO válido.",
        "date.greater": "La fecha de cierre debe ser posterior a la fecha actual.",
      }),
      userId: joi.number().integer().positive().required().messages({
        "number.base": "El ID del usuario debe ser un número entero.",
        "any.required": "El ID del usuario es obligatorio.",
      }),
      questions: joi.array().items(
        joi.object({
          questionText: joi.string().trim().max(500).required(),
          questionType: joi.string().valid("Escala", "Abierta", "Seleccion Multiple").required().messages({
            "any.only": "El tipo de pregunta debe ser 'Escala', 'Abierta' o 'Seleccion Multiple'.",
          }),
          isRequired: joi.boolean().optional().default(true),
          displayOrder: joi.number().integer().min(1).optional(),
          status: joi.number().valid(0, 1).optional().default(1),
          options: joi.array().items(
            joi.object({
              optionText: joi.string().trim().max(300).required(),
              displayOrder: joi.number().integer().min(1).optional(),
              status: joi.number().valid(0, 1).optional().default(1),
            }).unknown(true)
          ).max(50).unique("displayOrder", { ignoreUndefined: true }).optional().messages({
            "array.unique": "No puede haber dos opciones con el mismo orden.",
          })
        }).unknown(true)
      ).max(100).optional()
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
