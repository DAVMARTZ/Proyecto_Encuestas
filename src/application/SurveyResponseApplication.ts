import { SurveyResponsePort, SurveyStatistics } from "../domain/SurveyResponsePort";
import { SurveyResponse } from "../domain/SurveyResponse";
import { SurveyPort } from "../domain/SurveyPort";

export class SurveyResponseApplication {
  constructor(
    private readonly responsePort: SurveyResponsePort,
    private readonly surveyPort?: SurveyPort
  ) {}

  /**
   * Procesa y guarda el envío completo de una encuesta con validaciones de negocio.
   */
  async submitResponse(data: Omit<SurveyResponse, "surveyResponseId" | "submittedAt">): Promise<number> {
    if (!data.surveyId || Number(data.surveyId) <= 0) {
      throw new Error("El ID de la encuesta es obligatorio para guardar el envío.");
    }

    if (!data.details || data.details.length === 0) {
      throw new Error("Debe enviar al menos una respuesta para completar la encuesta.");
    }

    // Validación de negocio: la encuesta debe existir, estar activa y no vencida
    if (this.surveyPort) {
      const survey = await this.surveyPort.findById(Number(data.surveyId));
      if (!survey) {
        throw new Error("La encuesta a la que intenta responder no existe.");
      }

      if (Number(survey.status) === 0) {
        throw new Error("La encuesta se encuentra inactiva o cerrada y no acepta respuestas.");
      }

      if (survey.closeDate && new Date(survey.closeDate) < new Date()) {
        throw new Error("El período para responder esta encuesta ha expirado.");
      }
    }

    return await this.responsePort.saveResponse(data);
  }

  /**
   * Recupera todos los envíos realizados para una encuesta específica.
   */
  async getResults(surveyId: number): Promise<SurveyResponse[]> {
    if (!surveyId || surveyId <= 0) {
      throw new Error("El ID de la encuesta es requerido para buscar los resultados.");
    }

    return await this.responsePort.getResponsesBySurvey(surveyId);
  }

  /**
   * Recupera estadísticas consolidadas y agregadas de la encuesta.
   */
  async getStatistics(surveyId: number): Promise<SurveyStatistics> {
    if (!surveyId || surveyId <= 0) {
      throw new Error("El ID de la encuesta es requerido para obtener estadísticas.");
    }

    return await this.responsePort.getSurveyStatistics(surveyId);
  }
}
