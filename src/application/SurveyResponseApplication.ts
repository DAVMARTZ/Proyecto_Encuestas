import { SentimentCount, StatisticsFilters, SurveyResponsePort, SurveyStatistics } from "../domain/SurveyResponsePort";
import { ResponseDetail, SurveyResponse } from "../domain/SurveyResponse";
import { SurveyPort } from "../domain/SurveyPort";
import { Survey, SURVEY_STATUS } from "../domain/Survey";

export class SurveyResponseApplication {
  constructor(
    private readonly responsePort: SurveyResponsePort,
    private readonly surveyPort: SurveyPort
  ) {}

  /**
   * Procesa y guarda el envío completo de una encuesta con validaciones de negocio.
   */
  async submitResponse(data: Omit<SurveyResponse, "surveyResponseId" | "submittedAt">): Promise<number> {
    if (!data.surveyId || Number(data.surveyId) <= 0) {
      throw new Error("El ID de la encuesta es obligatorio para guardar el envío.");
    }

    if (!data.userId) {
      throw new Error("Debe iniciar sesión para responder la encuesta.");
    }

    if (!data.details || data.details.length === 0) {
      throw new Error("Debe enviar al menos una respuesta para completar la encuesta.");
    }

    // Validación de negocio: la encuesta debe existir, estar publicada y no vencida
    const survey = await this.surveyPort.findById(Number(data.surveyId));
    if (!survey || Number(survey.status) === SURVEY_STATUS.DRAFT) {
      throw new Error("La encuesta a la que intenta responder no existe.");
    }

    if (Number(survey.status) === SURVEY_STATUS.INACTIVE) {
      throw new Error("La encuesta se encuentra inactiva o cerrada y no acepta respuestas.");
    }

    if (survey.closeDate && new Date(survey.closeDate) < new Date()) {
      throw new Error("El período para responder esta encuesta ha expirado.");
    }

    // Cada usuario responde una sola vez cada encuesta
    if (await this.responsePort.hasUserResponded(Number(data.surveyId), data.userId)) {
      throw new Error("Ya respondiste esta encuesta.");
    }

    this.validateDetails(survey, data.details);

    return await this.responsePort.saveResponse(data);
  }

  /**
   * Revisa que cada respuesta corresponda a una pregunta activa de la encuesta
   * y que se hayan contestado todas las preguntas obligatorias.
   */
  private validateDetails(survey: Survey, details: ResponseDetail[]): void {
    const questions = (survey.questions ?? []).filter((q) => Number(q.status) === 1);
    const answeredQuestions = new Set<number>();
    const selectedOptions = new Set<number>();

    for (const detail of details) {
      const question = questions.find((q) => q.questionId === detail.questionId);
      if (!question) {
        throw new Error(`La pregunta ${detail.questionId} no pertenece a esta encuesta o no está activa.`);
      }

      if (answeredQuestions.has(detail.questionId) && question.questionType !== "Seleccion Multiple") {
        throw new Error(`La pregunta "${question.questionText}" solo admite una respuesta.`);
      }

      if (question.questionType === "Abierta") {
        if (!detail.responseText || detail.responseText.trim() === "") {
          throw new Error(`La pregunta "${question.questionText}" requiere una respuesta escrita.`);
        }
        if (detail.optionId) {
          throw new Error(`La pregunta "${question.questionText}" no admite opciones.`);
        }
      } else {
        const option = (question.options ?? []).find(
          (opt) => opt.optionId === detail.optionId && Number(opt.status) === 1
        );
        if (!option || selectedOptions.has(option.optionId as number)) {
          throw new Error(`La opción enviada para la pregunta "${question.questionText}" no es válida.`);
        }
        if (detail.responseText && detail.responseText.trim() !== "") {
          throw new Error(`La pregunta "${question.questionText}" no admite respuesta escrita.`);
        }
        selectedOptions.add(option.optionId as number);
      }

      answeredQuestions.add(detail.questionId);
    }

    for (const question of questions) {
      if (question.isRequired && !answeredQuestions.has(question.questionId as number)) {
        throw new Error(`La pregunta "${question.questionText}" es obligatoria.`);
      }
    }
  }

  /**
   * Recupera todos los envíos realizados para una encuesta específica.
   */
  async getResults(surveyId: number): Promise<SurveyResponse[]> {
    if (!surveyId || surveyId <= 0) {
      throw new Error("El ID de la encuesta es requerido para buscar los resultados.");
    }
    await this.ensureSurveyExists(surveyId);

    return await this.responsePort.getResponsesBySurvey(surveyId);
  }

  /**
   * Recupera estadísticas consolidadas y agregadas de la encuesta.
   */
  async getStatistics(surveyId: number, filters: StatisticsFilters = {}): Promise<SurveyStatistics> {
    if (!surveyId || surveyId <= 0) {
      throw new Error("El ID de la encuesta es requerido para obtener estadísticas.");
    }
    await this.ensureSurveyExists(surveyId);

    const statistics = await this.responsePort.getSurveyStatistics(surveyId, filters);
    return this.addScaleMetrics(statistics);
  }

  /**
   * Recupera las encuestas que respondió un usuario, con lo que contestó en cada una.
   */
  async getMyResponses(userId: number): Promise<SurveyResponse[]> {
    return await this.responsePort.getResponsesByUser(userId);
  }

  /**
   * En las preguntas de escala, 4 y 5 son positivas, 3 es neutra, y 1 y 2 son negativas.
   */
  private addScaleMetrics(statistics: SurveyStatistics): SurveyStatistics {
    const total: SentimentCount = { positive: 0, neutral: 0, negative: 0 };
    let totalPoints = 0;
    let totalVotes = 0;

    const questionsSummary = statistics.questionsSummary.map((question) => {
      if (question.questionType !== "Escala" || !question.optionsCount) {
        return question;
      }

      const sentiment: SentimentCount = { positive: 0, neutral: 0, negative: 0 };
      let points = 0;
      let votes = 0;

      for (const [option, count] of Object.entries(question.optionsCount)) {
        const value = Number(option);
        if (Number.isNaN(value)) continue;

        points += value * count;
        votes += count;
        if (value >= 4) sentiment.positive += count;
        else if (value === 3) sentiment.neutral += count;
        else sentiment.negative += count;
      }

      total.positive += sentiment.positive;
      total.neutral += sentiment.neutral;
      total.negative += sentiment.negative;
      totalPoints += points;
      totalVotes += votes;

      return { ...question, sentiment, average: votes ? this.oneDecimal(points / votes) : 0 };
    });

    const participation = statistics.totalStudents
      ? Math.round((statistics.studentsAnswered * 100) / statistics.totalStudents)
      : 0;

    return {
      ...statistics,
      questionsSummary,
      sentiment: total,
      averageScore: totalVotes ? this.oneDecimal(totalPoints / totalVotes) : 0,
      participation: Math.min(participation, 100),
    };
  }

  private oneDecimal(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private async ensureSurveyExists(surveyId: number): Promise<void> {
    const survey = await this.surveyPort.findById(surveyId);
    if (!survey) {
      throw new Error("La encuesta solicitada no existe.");
    }
  }
}
