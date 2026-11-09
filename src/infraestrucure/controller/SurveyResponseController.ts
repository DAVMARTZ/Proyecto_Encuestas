import { Request, Response } from "express";
import { SurveyResponseApplication } from "../../application/SurveyResponseApplication";
import { loadStatisticsFilters, loadSurveyResponseData } from "../util/surveyResponseValidator";
import { parseId, sendError } from "../util/http-utils";

export class SurveyResponseController {
  constructor(private readonly responseApp: SurveyResponseApplication) {}

  /**
   * Recibe y procesa el envío de una encuesta completa.
   */
  submit = async (req: Request, res: Response): Promise<void> => {
    try {
      const surveyId = parseId(req.params.surveyId);
      if (surveyId === null) {
        res.status(400).json({ error: "ID de encuesta inválido. Debe ser un entero positivo." });
        return;
      }

      // Quien responde siempre es el usuario autenticado
      const userId = (req as any).user?.userId;

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
    } catch (error) {
      if (error instanceof Error && error.message.includes("uq_survey_response_user")) {
        res.status(409).json({ error: "Ya respondiste esta encuesta." });
        return;
      }
      sendError(res, error);
    }
  };

  /**
   * Obtiene todos los resultados detallados de una encuesta.
   */
  getResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const surveyId = parseId(req.params.surveyId);
      if (surveyId === null) {
        res.status(400).json({ error: "ID de encuesta inválido. Debe ser un entero positivo." });
        return;
      }

      const results = await this.responseApp.getResults(surveyId);
      res.status(200).json(results);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Obtiene las encuestas respondidas por el usuario de la sesión.
   */
  getMine = async (req: Request, res: Response): Promise<void> => {
    try {
      const responses = await this.responseApp.getMyResponses((req as any).user.userId);
      res.status(200).json(responses);
    } catch (error) {
      sendError(res, error);
    }
  };

  /**
   * Obtiene estadísticas agregadas de la encuesta (conteos de votos y respuestas abiertas).
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const surveyId = parseId(req.params.surveyId);
      if (surveyId === null) {
        res.status(400).json({ error: "ID de encuesta inválido. Debe ser un entero positivo." });
        return;
      }

      const statistics = await this.responseApp.getStatistics(surveyId, loadStatisticsFilters(req.query));
      res.status(200).json(statistics);
    } catch (error) {
      sendError(res, error);
    }
  };
}
