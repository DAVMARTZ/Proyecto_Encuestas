import { Request, Response } from "express";
import { SurveyApplication } from "../../application/SurveyApplication";
import { loadSurveyData } from "../util/surveyValidator";
import { loadUpdateSurveyData } from "../util/survey-update-validation";

export class SurveyController {
  constructor(private readonly surveyApp: SurveyApplication) {}

  /**
   * Crea una nueva encuesta asociada al usuario (incluye preguntas y opciones si se envían).
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const authUser = (req as any).user;
      const bodyWithUser = {
        ...req.body,
        userId: req.body.userId || authUser?.userId || authUser?.id,
      };

      const data = loadSurveyData(bodyWithUser);

      const surveyId = await this.surveyApp.createSurvey({
        title: data.title,
        description: data.description,
        closeDate: data.closeDate,
        userId: data.userId,
        questions: data.questions?.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          isRequired: q.isRequired ?? true,
          displayOrder: q.displayOrder ?? 1,
          status: q.status ?? 1,
          surveyId: 0,
          options: q.options?.map((opt) => ({
            optionText: opt.optionText,
            displayOrder: opt.displayOrder ?? 1,
            status: opt.status ?? 1,
            questionId: 0,
          })),
        })),
      });

      res.status(201).json({
        message: "Encuesta creada con éxito",
        surveyId,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Obtiene todas las encuestas registradas.
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const surveys = await this.surveyApp.getAllSurveys(includeInactive);
      res.status(200).json(surveys);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Obtiene el detalle de una encuesta por su ID numérico (con preguntas y opciones).
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
        return;
      }

      const survey = await this.surveyApp.getSurveyById(id);
      res.status(200).json(survey);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  /**
   * Obtiene todas las encuestas creadas por un usuario determinado.
   */
  getByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId) || userId <= 0) {
        res.status(400).json({ error: "ID de usuario inválido. Debe ser un entero positivo." });
        return;
      }

      const includeInactive = req.query.includeInactive === "true";
      const surveys = await this.surveyApp.getSurveysByUserId(userId, includeInactive);
      res.status(200).json(surveys);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Actualiza la información general de una encuesta.
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
        return;
      }

      const dataLoad = loadUpdateSurveyData(req.body);
      await this.surveyApp.updateSurvey(id, dataLoad);
      res.status(200).json({ message: "Encuesta actualizada correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Publica/Activa la encuesta para que pueda recibir respuestas.
   */
  publish = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
        return;
      }

      await this.surveyApp.publishSurvey(id);
      res.status(200).json({ message: "Encuesta publicada exitosamente y disponible (status: 1 - ACTIVO)" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Inactiva lógicamente la encuesta (cierre lógico / baja lógica sin borrado físico).
   */
  deactivate = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
        return;
      }

      await this.surveyApp.deactivateSurvey(id);
      res.status(200).json({ message: "Encuesta inactivada lógicamente (status: 0 - INACTIVO)" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Reactiva la encuesta.
   */
  activate = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
        return;
      }

      await this.surveyApp.activateSurvey(id);
      res.status(200).json({ message: "Encuesta reactivada exitosamente (status: 1 - ACTIVO)" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Eliminación lógica vía DELETE (cero borrado físico).
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    return this.deactivate(req, res);
  };
}
