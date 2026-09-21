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
  statusResponseOption: joi.string().valid('Activa', 'Inactiva').default('Activa')
});

/**
 * Esquema de validación para la pregunta, permitiendo enviar un arreglo de opciones de una vez.
 */
export const questionPayloadSchema = joi.object({
  surveyId: joi.string().uuid().required().messages({
    'string.guid': 'El ID de la encuesta debe ser un UUID válido.'
  }),
  questionText: joi.string().required().messages({
    'string.empty': 'El enunciado de la pregunta es obligatorio.'
  }),
  questionType: joi.string().max(30).required(),
  isRequired: joi.boolean().required(),
  displayOrder: joi.number().integer().min(1).required(),
  statusQuestion: joi.string().valid('Activa', 'Inactiva').default('Activa'),
  
  // Arreglo opcional de opciones para validar todo el bloque en una sola petición
  options: joi.array().items(responseOptionSchema).optional()
}).unknown(true);