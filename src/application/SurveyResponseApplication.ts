import { SurveyResponsePort, SurveyResponse } from '../domain/SurveyResponse';

export class SurveyResponseApplication {
  constructor(private readonly responsePort: SurveyResponsePort) {}

  /**
   * Procesa y guarda el envío completo de una encuesta.
   */
  async submitResponse(data: Omit<SurveyResponse, 'surveyResponseId' | 'submittedAt'>): Promise<number> {
    if (!data.surveyId) {
      throw new Error('El ID de la encuesta es obligatorio para guardar el envío.');
    }
    
    if (!data.details || data.details.length === 0) {
      throw new Error('Debe enviar al menos una respuesta para completar la encuesta.');
    }

    return await this.responsePort.saveResponse(data);
  }

  /**
   * Recupera todos los envíos realizados para una encuesta específica.
   */
  async getResults(surveyId: number): Promise<SurveyResponse[]> {
    if (!surveyId) {
      throw new Error('El ID de la encuesta es requerido para buscar los resultados.');
    }
    
    return await this.responsePort.getResponsesBySurvey(surveyId);
  }
}