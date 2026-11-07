import joi from "joi";

export type ReturnUpdateSurveyData = Partial<{
  title: string;
  description: string;
  closeDate: Date;
  status: number;
  userId: number;
}>;

type ValidationUpdateSurveyData = {
  error: joi.ValidationError | undefined;
  value: ReturnUpdateSurveyData;
};

function validateUpdateSurveyData(data: any): ValidationUpdateSurveyData {
  const schema = joi
    .object({
      title: joi.string().trim().max(200).optional().messages({
        "string.empty": "El título no puede estar vacío.",
        "string.max": "El título no puede superar los 200 caracteres.",
      }),
      description: joi.string().allow("", null).optional(),
      closeDate: joi.date().iso().allow(null).optional().messages({
        "date.format": "La fecha de cierre debe tener un formato ISO válido.",
      }),
      status: joi.number().valid(0, 1).optional(),
      userId: joi.number().integer().positive().optional(),
    })
    .unknown(true);

  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  return { error, value };
}

export const loadUpdateSurveyData = (data: any): ReturnUpdateSurveyData => {
  const result = validateUpdateSurveyData(data);
  if (result.error) {
    const message = result.error.details.map((d) => d.message).join(", ");
    throw new Error(message);
  }
  return result.value;
};
