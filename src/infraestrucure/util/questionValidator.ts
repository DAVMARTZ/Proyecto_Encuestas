import joi from 'joi';

/**
 * Esquema de validación para las opciones de respuesta.
 */
const responseOptionSchema = joi.object({
  optionText: joi.string().max(300).required().messages({
    'string.empty': 'El texto de la opción no puede estar vacío.',
    'string.max': 'El texto de la opción supera los 300 caracteres permitidos.'
  }),
  displayOrder: joi.number().integer().min(1).required(),
  status: joi.number().valid(0, 1).default(1),
  statusResponseOption: joi.number().valid(0, 1).optional()
});

/**
 * Esquema de validación para la pregunta.
 */
export const questionPayloadSchema = joi.object({
  surveyId: joi.number().integer().positive().required().messages({
    'number.base': 'El ID de la encuesta debe ser un número entero.',
    'any.required': 'El ID de la encuesta es obligatorio.'
  }),
  questionText: joi.string().required().messages({
    'string.empty': 'El enunciado de la pregunta es obligatorio.'
  }),
  questionType: joi.string().max(30).required(),
  isRequired: joi.boolean().required(),
  displayOrder: joi.number().integer().min(1).required(),
  status: joi.number().valid(0, 1).default(1),
  statusQuestion: joi.number().valid(0, 1).optional(),
  options: joi.array().items(responseOptionSchema).optional()
}).unknown(true);