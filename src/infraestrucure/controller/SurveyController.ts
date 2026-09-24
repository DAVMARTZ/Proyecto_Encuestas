import { Request, Response } from 'express';
import { SurveyApplication } from '../../application/SurveyApplication';
import { SurveyQRData } from '../../domain/SurveyQR';

export class SurveyController {
  constructor(private readonly surveyApp: SurveyApplication) {}

  /**
   * Crea una nueva encuesta asociada al usuario.
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = Number(req.body.user?.id || req.body.userId);
      
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
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const surveys = await this.surveyApp.getAllSurveys(includeInactive);
      res.status(200).json(surveys);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Obtiene el detalle de una encuesta por su ID numérico.
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
        return;
      }

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
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
        return;
      }

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
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
        return;
      }

      await this.surveyApp.publishSurvey(id);
      res.status(200).json({ message: 'Encuesta publicada exitosamente y disponible (status: 1 - ACTIVO)' });
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
        res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
        return;
      }

      await this.surveyApp.deactivateSurvey(id);
      res.status(200).json({ message: 'Encuesta inactivada lógicamente (status: 0 - INACTIVO)' });
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
        res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
        return;
      }

      await this.surveyApp.activateSurvey(id);
      res.status(200).json({ message: 'Encuesta reactivada exitosamente (status: 1 - ACTIVO)' });
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
  /**
   * Generar QR de encuesta
   */
  // GET /api/surveys/:id/qr-payload
  async getSurveyQRPayload(req: Request, res: Response) {
    const { id } = req.params;
    
    // Generamos una estructura de datos única para validar
    const qrData: SurveyQRData = {
      appIdentifier: 'MY_SURVEY_APP_2026',
      surveyId: id
    };

    return res.status(200).json({
      qrString: JSON.stringify(qrData)
    });
  }
}