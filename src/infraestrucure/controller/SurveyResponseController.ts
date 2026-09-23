import { Request, Response } from 'express';
import { SurveyResponseApplication } from '../../application/SurveyResponseApplication';

export class SurveyResponseController {
  constructor(private readonly responseApp: SurveyResponseApplication) {}

  /**
   * Recibe y procesa el envío de una encuesta completa.
   */
  submit = async (req: Request, res: Response): Promise<void> => {
    try {
      const surveyId = parseInt(req.params.surveyId, 10);
      if (isNaN(surveyId) || surveyId <= 0) {
        res.status(400).json({ error: 'ID de encuesta inválido. Debe ser un entero positivo.' });
        return;
      }

      const rawUserId = req.body.user?.id || req.body.userId;
      const userId = rawUserId ? Number(rawUserId) : undefined;

      const responseId = await this.responseApp.submitResponse({
        ...req.body,
        surveyId,
        userId,
        details: (req.body.details || []).map((d: any) => ({
          questionId: Number(d.questionId),
          optionId: d.optionId ? Number(d.optionId) : undefined,
          responseText: d.responseText
        }))
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
      const surveyId = parseInt(req.params.surveyId, 10);
      if (isNaN(surveyId) || surveyId <= 0) {
        res.status(400).json({ error: 'ID de encuesta inválido. Debe ser un entero positivo.' });
        return;
      }

      const results = await this.responseApp.getResults(surveyId);
      res.status(200).json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}