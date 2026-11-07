import { Request, Response } from "express";
import { SurveyResponseApplication } from "../../application/SurveyResponseApplication";
import { loadSurveyResponseData } from "../util/surveyResponseValidator";

export class SurveyResponseController {
  constructor(private readonly responseApp: SurveyResponseApplication) {}

  /**
   * Recibe y procesa el envío de una encuesta completa.
   */
  submit = async (req: Request, res: Response): Promise<void> => {
    try {
      const surveyId = parseInt(req.params.surveyId, 10);
      if (isNaN(surveyId) || surveyId <= 0) {
        res.status(400).json({ error: "ID de encuesta inválido. Debe ser un entero positivo." });
        return;
      }

      const authUser = (req as any).user;
      const rawUserId = authUser?.userId || authUser?.id || req.body.userId;
      const userId = rawUserId ? Number(rawUserId) : undefined;

      const data = loadSurveyResponseData({
        ...req.body,
        surveyId,
        userId,
      });

      const responseId = await this.responseApp.submitResponse({
        surveyId: data.surveyId,
        userId: data.userId,
        details: data.details.map((d) => ({
          questionId: Number(d.questionId),
          optionId: d.optionId ? Number(d.optionId) : undefined,
          responseText: d.responseText,
        })),
      });

      res.status(201).json({
        message: "Respuestas enviadas y guardadas con éxito",
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
        res.status(400).json({ error: "ID de encuesta inválido. Debe ser un entero positivo." });
        return;
      }

      const results = await this.responseApp.getResults(surveyId);
      res.status(200).json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Obtiene estadísticas agregadas de la encuesta (conteos de votos y respuestas abiertas).
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const surveyId = parseInt(req.params.surveyId, 10);
      if (isNaN(surveyId) || surveyId <= 0) {
        res.status(400).json({ error: "ID de encuesta inválido. Debe ser un entero positivo." });
        return;
      }

      const statistics = await this.responseApp.getStatistics(surveyId);
      res.status(200).json(statistics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
