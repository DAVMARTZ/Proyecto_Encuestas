import { Request, Response } from 'express';
import { SurveyApplication } from '../../application/SurveyApplication';

export class SurveyController {
    constructor(private readonly app: SurveyApplication) {}

    // post /api/surveys
    createSurvey = async (req: Request, res: Response) => {
        try {
            // Extraemos el id del token (gracias al middleware) para asociarlo al creador
            const usuario_creador_id = req.user.id; 
            const data = { ...req.body, usuario_creador_id };
            
            const newSurvey = await this.app.createSurvey(data);
            res.status(201).json({ message: 'Encuesta creada en Borrador', data: newSurvey });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    // get /api/surveys
    getSurveys = async (req: Request, res: Response) => {
        try {
            const filtros = req.query; // Para manejar las búsquedas 
            const surveys = await this.app.getSurveys(filtros);
            res.status(200).json(surveys);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    // get /api/surveys/:id
    getSurveyDetail = async (req: Request, res: Response) => {
        try {
            const survey = await this.app.getSurveyDetail(req.params.id);
            res.status(200).json(survey);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    };

    // put /api/surveys/:id (Editar información general)
    updateSurvey = async (req: Request, res: Response) => {
        try {
            const updated = await this.app.updateSurvey(req.params.id, req.body);
            res.status(200).json({ message: 'Encuesta actualizada', data: updated });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    // patch /api/surveys/:id/publish
    publishSurvey = async (req: Request, res: Response) => {
        try {
            const published = await this.app.publishSurvey(req.params.id);
            res.status(200).json({ message: 'Encuesta publicada exitosamente', data: published });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    // patch /api/surveys/:id/deactivate (Borrado Lógico)
    deactivateSurvey = async (req: Request, res: Response) => {
        try {
            const deactivated = await this.app.deactivateSurvey(req.params.id);
            res.status(200).json({ message: 'Encuesta desactivada', data: deactivated });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}