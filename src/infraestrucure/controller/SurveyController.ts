import { Request, Response } from 'express';
import { SurveyApplication } from '../../application/SurveyApplication';

export class SurveyController {
  constructor(private readonly surveyApp: SurveyApplication) {}

  /**
   * Crea una nueva encuesta asociada al usuario autenticado.
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.body.user?.id || req.body.userId;
      
      const surveyId = await this.surveyApp.createSurvey({
        title: req.body.title,
        description: req.body.description,
        closeDate: req.body.closeDate,
        userId,
      });

      res.status(201).json({
        message: 'Encuesta creada con éxito en estado Borrador',
        surveyId,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Obtiene todas las encuestas registradas.
   */
  getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const surveys = await this.surveyApp.getAllSurveys();
      res.status(200).json(surveys);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Obtiene el detalle de una encuesta por su UUID.
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const survey = await this.surveyApp.getSurveyById(id);
      res.status(200).json(survey);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  /**
   * Actualiza la información general de una encuesta en Borrador.
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.surveyApp.updateSurvey(id, req.body);
      res.status(200).json({ message: 'Encuesta actualizada correctamente' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Publica la encuesta para que pueda recibir respuestas.
   */
  publish = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.surveyApp.publishSurvey(id);
      res.status(200).json({ message: 'Encuesta publicada exitosamente y disponible' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * Desactiva la encuesta (Cierre lógico).
   */
  deactivate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.surveyApp.deactivateSurvey(id);
      res.status(200).json({ message: 'Encuesta desactivada correctamente' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}