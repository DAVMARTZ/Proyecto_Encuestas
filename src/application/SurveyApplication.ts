import { SurveyPort } from '../domain/SurveyPort';
import { Survey, EstadoEncuesta } from '../domain/Survey';

export class SurveyApplication {
    constructor(private readonly surveyPort: SurveyPort) {}

    // Método para crear una encuesta
    async createSurvey(data: Omit<Survey, 'estado'>) {
        if (!data.tipo_encuesta_id) {
            throw new Error('El tipo de encuesta es obligatorio');
        }

        const newSurvey: Survey = {
            ...data,
            estado: EstadoEncuesta.Borrador // siempre nace en Borrador
        };

        return await this.surveyPort.create(newSurvey);
    }

    // Método para listar encuestas
    async getSurveys(filtros?: any) {
        return await this.surveyPort.findAll(filtros);
    }

    // Método para consultar todo de una encuesta
    async getSurveyDetail(id: string) {
        const survey = await this.surveyPort.findById(id);
        if (!survey) throw new Error('Encuesta no encontrada');
        return survey;
    }

    // Método para editar una encuesta
    async updateSurvey(id: string, data: Partial<Survey>) {
        const survey = await this.getSurveyDetail(id);
        
        // Rechazar modificaciones si no está en Borrador
        if (survey.estado !== EstadoEncuesta.Borrador) {
            throw new Error('Solo se pueden editar encuestas en estado Borrador');
        }

        return await this.surveyPort.update(id, data);
    }

    // Método para publicar una encuesta (cambiade estado)
    async publishSurvey(id: string) {
        const survey = await this.getSurveyDetail(id);

        if (survey.estado === EstadoEncuesta.Publicada) {
            throw new Error('La encuesta ya se encuentra publicada');
        }

        // NOTA PARA INTEGRACIÓN CON DEV 4: 
        // Aquí en el futuro se debe validar que la encuesta tenga al menos 1 pregunta válida 
        // antes de permitir el paso a 'Publicada'.

        return await this.surveyPort.changeStatus(id, EstadoEncuesta.Publicada);
    }

    // Método para desactivar una encuesta (cambia de estado)
    async deactivateSurvey(id: string) {
        const survey = await this.getSurveyDetail(id);

        if (survey.estado === EstadoEncuesta.Inactiva) {
            throw new Error('La encuesta ya está inactiva');
        }

        return await this.surveyPort.changeStatus(id, EstadoEncuesta.Inactiva);
    }
}