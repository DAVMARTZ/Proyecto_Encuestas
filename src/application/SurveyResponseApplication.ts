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

  async getStudentsBySurvey(surveyId: number): Promise<any[]> {
    if (!surveyId) throw new Error('El ID de la encuesta es requerido.');
    // Si tu puerto no tiene tipado estricto aún, asegúrate de llamarlo o castearlo (ej. (this.responsePort as any).getStudentsBySurvey)
    return await (this.responsePort as any).getStudentsBySurvey(surveyId);
  }

  async getStudentAnswers(surveyId: number, studentId: number): Promise<any[]> {
    if (!surveyId || !studentId) throw new Error('IDs requeridos.');
    return await (this.responsePort as any).getStudentAnswers(surveyId, studentId);
  }
}