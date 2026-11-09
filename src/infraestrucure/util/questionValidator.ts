import joi from "joi";

export type ReturnQuestionOptionData = {
  optionText: string;
  displayOrder?: number;
  status?: number;
  questionId?: number;
};

export type ReturnQuestionData = {
  surveyId: number;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  displayOrder?: number;
  status?: number;
  options?: ReturnQuestionOptionData[];
};

export type ReturnUpdateQuestionData = Partial<{
  questionText: string;
  questionType: string;
  isRequired: boolean;
  displayOrder: number;
  status: number;
}>;

export type ReturnOptionData = {
  questionId: number;
  optionText: string;
  displayOrder?: number;
  status?: number;
};

export type ReturnUpdateOptionData = Partial<{
  optionText: string;
  displayOrder: number;
  status: number;
}>;

// Esquemas Joi
const optionSchema = joi.object({
  optionText: joi.string().trim().max(300).required().messages({
    "string.empty": "El texto de la opción no puede estar vacío.",
    "string.max": "El texto de la opción supera los 300 caracteres permitidos.",
    "any.required": "El texto de la opción es obligatorio.",
  }),
  displayOrder: joi.number().integer().min(1).optional(),
  status: joi.number().valid(0, 1).optional().default(1),
  questionId: joi.number().integer().positive().optional(),
}).unknown(true);

const questionSchema = joi.object({
  surveyId: joi.number().integer().positive().required().messages({
    "number.base": "El ID de la encuesta debe ser un número entero.",
    "any.required": "El ID de la encuesta es obligatorio.",
  }),
  questionText: joi.string().trim().max(500).required().messages({
    "string.empty": "El enunciado de la pregunta es obligatorio.",
    "any.required": "El enunciado de la pregunta es obligatorio.",
  }),
  questionType: joi.string().valid("Escala", "Abierta", "Seleccion Multiple").required().messages({
    "any.only": "El tipo de pregunta debe ser 'Escala', 'Abierta' o 'Seleccion Multiple'.",
    "any.required": "El tipo de pregunta es obligatorio.",
  }),
  isRequired: joi.boolean().default(true),
  displayOrder: joi.number().integer().min(1).optional(),
  status: joi.number().valid(0, 1).optional().default(1),
  options: joi.array().items(optionSchema).max(50).unique("displayOrder", { ignoreUndefined: true }).optional().messages({
    "array.unique": "No puede haber dos opciones con el mismo orden.",
  }),
}).unknown(true);

const updateQuestionSchema = joi.object({
  questionText: joi.string().trim().max(500).optional(),
  questionType: joi.string().valid("Escala", "Abierta", "Seleccion Multiple").optional(),
  isRequired: joi.boolean().optional(),
  displayOrder: joi.number().integer().min(1).optional(),
  status: joi.number().valid(0, 1).optional(),
}).unknown(true);

const updateOptionSchema = joi.object({
  optionText: joi.string().trim().max(300).optional(),
  displayOrder: joi.number().integer().min(1).optional(),
  status: joi.number().valid(0, 1).optional(),
}).unknown(true);

export const loadQuestionData = (data: any): ReturnQuestionData => {
  const { error, value } = questionSchema.validate(data, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    throw new Error(message);
  }
  return value;
};

export const loadUpdateQuestionData = (data: any): ReturnUpdateQuestionData => {
  const { error, value } = updateQuestionSchema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    throw new Error(message);
  }
  return value;
};

export const loadOptionData = (data: any): ReturnOptionData => {
  const { error, value } = optionSchema.validate(data, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    throw new Error(message);
  }
  return value;
};

export const loadUpdateOptionData = (data: any): ReturnUpdateOptionData => {
  const { error, value } = updateOptionSchema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    throw new Error(message);
  }
  return value;
};
