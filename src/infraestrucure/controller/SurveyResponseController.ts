import { Request, Response } from 'express';
import { SurveyResponseApplication } from '../../application/SurveyResponseApplication';

export class SurveyResponseController {
  constructor(private readonly responseApp: SurveyResponseApplication) {}

  /**
   * Recibe y procesa el envío de una encuesta completa.
   */
  submit = async (req: Request, res: Response): Promise<void> => {
    try {
      // Prioriza el ID de la URL 
      const surveyId = req.params.surveyId; 
      
      // Soporta usuarios autenticados mediante jwt o envíos anónimos
      const userId = req.body.user?.id || req.body.userId || null;

      const responseId = await this.responseApp.submitResponse({
        ...req.body,
        surveyId,
        userId,
      });

      res.status(201).json({
        message: 'Respuestas enviadas y guardadas con éxito',
        surveyResponseId: responseId,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Obtiene todos los resultados detallados de una encuesta.
   */
  getResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const { surveyId } = req.params;
      const results = await this.responseApp.getResults(surveyId);
      res.status(200).json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}