import joi from "joi";

export type ReturnDetailData = {
  questionId: number;
  optionId?: number;
  responseText?: string;
};

export type ReturnSurveyResponseData = {
  surveyId: number;
  userId: number;
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
    responseText: joi.string().max(2000).allow(null, "").optional().messages({
      "string.max": "La respuesta no puede superar los 2000 caracteres.",
    }),
  })
  .or("optionId", "responseText");

const surveyResponsePayloadSchema = joi
  .object({
    surveyId: joi.number().integer().positive().required().messages({
      "number.base": "El ID de la encuesta debe ser un número entero.",
      "any.required": "El ID de la encuesta es obligatorio.",
    }),
    userId: joi.number().integer().positive().required(),
    details: joi.array().items(responseDetailSchema).min(1).max(500).required().messages({
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

export type StatisticsFiltersData = {
  from?: Date;
  to?: Date;
};

export const loadStatisticsFilters = (query: any): StatisticsFiltersData => {
  const schema = joi.object({
    from: joi.date().iso().optional().messages({ "date.format": "La fecha inicial debe tener un formato ISO válido." }),
    to: joi.date().iso().optional().messages({ "date.format": "La fecha final debe tener un formato ISO válido." }),
  });

  const { error, value } = schema.validate(query, { abortEarly: false, stripUnknown: true });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join(", "));
  }
  return value;
};
