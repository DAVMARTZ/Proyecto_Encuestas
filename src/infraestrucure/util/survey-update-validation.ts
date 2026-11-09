import joi from "joi";

// El estado solo cambia con publish, activate y deactivate
export type ReturnUpdateSurveyData = Partial<{
  title: string;
  description: string;
  closeDate: Date;
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
      description: joi.string().max(1000).allow("", null).optional(),
      closeDate: joi.date().iso().greater("now").allow(null).optional().messages({
        "date.format": "La fecha de cierre debe tener un formato ISO válido.",
        "date.greater": "La fecha de cierre debe ser posterior a la fecha actual.",
      }),
    });

  // stripUnknown descarta cualquier otro campo, incluido status
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
