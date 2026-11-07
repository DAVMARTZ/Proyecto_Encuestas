import joi from "joi";

export type ReturnDetailData = {
  questionId: number;
  optionId?: number;
  responseText?: string;
};

export type ReturnSurveyResponseData = {
  surveyId: number;
  userId?: number;
  details: ReturnDetailData[];
};

type ValidationSurveyResponseData = {
  error: joi.ValidationError | undefined;
  value: ReturnSurveyResponseData;
};

const responseDetailSchema = joi
  .object({
    questionId: joi.number().integer().positive().required().messages({
      "number.base": "El ID de la pregunta debe ser un número entero.",
      "any.required": "El ID de la pregunta es obligatorio.",
    }),
    optionId: joi.number().integer().positive().allow(null).optional(),
    responseText: joi.string().allow(null, "").optional(),
  })
  .or("optionId", "responseText");

const surveyResponsePayloadSchema = joi
  .object({
    surveyId: joi.number().integer().positive().required().messages({
      "number.base": "El ID de la encuesta debe ser un número entero.",
      "any.required": "El ID de la encuesta es obligatorio.",
    }),
    userId: joi.number().integer().positive().allow(null).optional(),
    details: joi.array().items(responseDetailSchema).min(1).required().messages({
      "array.min": "El envío debe contener al menos una respuesta.",
      "any.required": "Debe enviar las respuestas de la encuesta.",
    }),
  })
  .unknown(true);

function validateSurveyResponseData(data: any): ValidationSurveyResponseData {
  const { error, value } = surveyResponsePayloadSchema.validate(data, { abortEarly: false });
  return { error, value };
}

export const loadSurveyResponseData = (data: any): ReturnSurveyResponseData => {
  const result = validateSurveyResponseData(data);
  if (result.error) {
    const message = result.error.details.map((d) => d.message).join(", ");
    throw new Error(message);
  }
  return result.value;
};
