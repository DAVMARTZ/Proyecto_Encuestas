import { Request, Response } from "express";
import { QuestionApplication } from "../../application/QuestionApplication";
import { loadQuestionData, loadUpdateQuestionData } from "../util/questionValidator";
import { parseId, sendError } from "../util/http-utils";

/**
 * Controlador HTTP para Preguntas de Encuesta
 */
export class QuestionController {
  private questionApp: QuestionApplication;

  constructor(questionApp: QuestionApplication) {
    this.questionApp = questionApp;
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const surveyId = req.params.surveyId ? Number(req.params.surveyId) : Number(req.body.surveyId);
      const data = loadQuestionData({
        ...req.body,
        surveyId,
      });

      const questionId = await this.questionApp.createQuestion({
        ...data,
        status: data.status !== undefined ? Number(data.status) : 1,
        options: data.options?.map((opt, index) => ({
          optionText: opt.optionText,
          displayOrder: opt.displayOrder ?? index + 1,
          questionId: opt.questionId ?? 0,
          status: opt.status !== undefined ? Number(opt.status) : 1,
        })),
      });

      return res.status(201).json({
        message: "Pregunta creada con éxito",
        questionId,
      });
    } catch (error) {
      return sendError(res, error);
    }
  };

  getBySurveyId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const surveyId = parseId(req.params.surveyId);
      if (surveyId === null) {
        return res.status(400).json({ error: "ID de encuesta inválido. Debe ser un entero positivo." });
      }

      const includeInactive = req.query.includeInactive === "true";
      const questions = await this.questionApp.getQuestionsBySurvey(surveyId, includeInactive);
      return res.status(200).json(questions);
    } catch (error) {
      return sendError(res, error);
    }
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      const question = await this.questionApp.getQuestionById(id);
      return res.status(200).json(question);
    } catch (error) {
      return sendError(res, error);
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      const dataLoad = loadUpdateQuestionData(req.body);
      await this.questionApp.updateQuestion(id, dataLoad);
      return res.status(200).json({ message: "Pregunta actualizada correctamente" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  deactivate = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      await this.questionApp.deactivateQuestion(id);
      return res.status(200).json({ message: "Pregunta inactivada correctamente (status: 0 - INACTIVO)" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  activate = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      await this.questionApp.activateQuestion(id);
      return res.status(200).json({ message: "Pregunta reactivada correctamente (status: 1 - ACTIVO)" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    return this.deactivate(req, res);
  };
}
