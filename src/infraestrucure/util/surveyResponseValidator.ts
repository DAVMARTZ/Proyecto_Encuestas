import { Request, Response, NextFunction } from 'express';
import joi from 'joi';

const responseDetailSchema = joi.object({
  questionId: joi.string().uuid().required().messages({
    'string.guid': 'El ID de la pregunta debe ser un UUID válido.'
  }),
  optionId: joi.string().uuid().allow(null).optional(),
  responseText: joi.string().allow(null, '').optional()
}).or('optionId', 'responseText');

export const surveyResponsePayloadSchema = joi.object({
  surveyId: joi.string().uuid().required(),
  userId: joi.string().uuid().allow(null).optional(),
  details: joi.array().items(responseDetailSchema).min(1).required().messages({
    'array.min': 'El envío debe contener al menos una respuesta.'
  })
}).unknown(true);

export const validateSurveyResponse = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = surveyResponsePayloadSchema.validate(req.body);

  if (error) {
    res.status(400).json({ error: error.details?.[0]?.message || 'Error de validación en la petición.' });
    return;
  }

  next(); // Si no hay error, permite avanzar al controlador
};