import { SurveyResponsePort, SurveyResponse } from '../domain/SurveyResponse';

export class SurveyResponseApplication {
  constructor(private readonly responsePort: SurveyResponsePort) {}

  /**
   * Procesa y guarda el envío completo de una encuesta.
   * @param data Datos del envío incluyendo el arreglo de respuestas individuales.
   * @returns
   */
  async submitResponse(data: Omit<SurveyResponse, 'surveyResponseId' | 'submittedAt'>): Promise<string> {
    if (!data.surveyId) {
      throw new Error('El ID de la encuesta es obligatorio para guardar el envío.');
    }
    
    if (!data.details || data.details.length === 0) {
      throw new Error('Debe enviar al menos una respuesta para completar la encuesta.');
    }

    // Aquí a futuro se puede validar si la encuesta está en estado 'Publicada' antes de guardar.
    return await this.responsePort.saveResponse(data);
  }

  /**
   * Recupera todos los envíos realizados para una encuesta específica.
   * @param surveyId UUID de la encuesta.
   */
  async getResults(surveyId: string): Promise<SurveyResponse[]> {
    if (!surveyId) {
      throw new Error('El ID de la encuesta es requerido para buscar los resultados.');
    }
    
    return await this.responsePort.getResponsesBySurvey(surveyId);
  }
}