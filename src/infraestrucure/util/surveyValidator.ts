import { Request, Response, NextFunction } from 'express';
import joi from 'joi';

/**
 * Valida el payload para la creación o actualización de encuestas.
 */
export const validateSurveyPayload = (req: Request, res: Response, next: NextFunction): void => {
  const schema = joi.object({
    title: joi.string().max(200).required().messages({
      'string.empty': 'El título no puede estar vacío.',
      'string.max': 'El título no puede superar los 200 caracteres.'
    }),
    description: joi.string().optional().allow(''),
    closeDate: joi.date().iso().optional().messages({
      'date.format': 'La fecha de cierre debe tener un formato válido.'
    }),
    userId: joi.string().uuid().required() 
  }).unknown(true); 

  const { error } = schema.validate(req.body);

  if (error) {
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  next();
};