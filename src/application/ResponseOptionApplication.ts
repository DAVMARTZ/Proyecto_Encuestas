import { ResponseOption } from "../domain/ResponseOption";
import { ResponseOptionPort } from "../domain/ResponseOptionPort";
import { QuestionPort } from "../domain/QuestionPort";
import { SurveyPort } from "../domain/SurveyPort";
import { SURVEY_STATUS } from "../domain/Survey";

/**
 * Capa de Aplicación - Casos de Uso para Opciones de Respuesta
 */
export class ResponseOptionApplication {
  private port: ResponseOptionPort;
  private questionPort: QuestionPort;
  private surveyPort: SurveyPort;

  constructor(port: ResponseOptionPort, questionPort: QuestionPort, surveyPort: SurveyPort) {
    this.port = port;
    this.questionPort = questionPort;
    this.surveyPort = surveyPort;
  }

  /**
   * Las opciones solo se pueden cambiar mientras la encuesta está en borrador.
   */
  private async ensureSurveyIsDraft(questionId: number): Promise<void> {
    const question = await this.questionPort.getQuestionById(questionId);
    if (!question) {
      throw new Error("Pregunta no encontrada");
    }

    const survey = await this.surveyPort.findById(question.surveyId);
    if (!survey || Number(survey.status) !== SURVEY_STATUS.DRAFT) {
      throw new Error("Solo se pueden modificar las opciones de encuestas en borrador.");
    }
  }

  /**
   * Crea una opción de respuesta vinculada a una pregunta.
   */
  async createOption(data: Omit<ResponseOption, "displayOrder"> & { displayOrder?: number }): Promise<number> {
    if (!data.questionId || Number(data.questionId) <= 0) {
      throw new Error("El ID de la pregunta es obligatorio");
    }

    if (!data.optionText || data.optionText.trim() === "") {
      throw new Error("El texto de la opción no puede estar vacío");
    }

    const questionId = Number(data.questionId);
    await this.ensureSurveyIsDraft(questionId);

    // Si no se indica orden, la opción queda de última
    const existing = await this.port.getOptionsByQuestion(questionId, true);
    const nextOrder = Math.max(0, ...existing.map((opt) => opt.displayOrder)) + 1;
    const displayOrder = data.displayOrder ? Number(data.displayOrder) : nextOrder;

    if (existing.some((opt) => opt.displayOrder === displayOrder)) {
      throw new Error("Ya existe una opción con ese orden en la pregunta");
    }

    const optionToSave: ResponseOption = {
      ...data,
      questionId,
      displayOrder,
      status: data.status !== undefined ? Number(data.status) : 1,
    };

    return await this.port.createOption(optionToSave);
  }

  /**
   * Obtiene todas las opciones de una pregunta.
   */
  async getOptionsByQuestion(questionId: number, includeInactive: boolean = false): Promise<ResponseOption[]> {
    if (!questionId || questionId <= 0) {
      throw new Error("ID de pregunta inválido");
    }
    if (!(await this.questionPort.getQuestionById(questionId))) {
      throw new Error("Pregunta no encontrada");
    }
    return await this.port.getOptionsByQuestion(questionId, includeInactive);
  }

  /**
   * Obtiene una opción por su identificador numérico.
   */
  async getOptionById(id: number): Promise<ResponseOption> {
    const option = await this.port.getOptionById(id);
    if (!option) {
      throw new Error("Opción de respuesta no encontrada");
    }
    return option;
  }

  /**
   * Actualiza una opción de respuesta.
   */
  async updateOption(id: number, data: Partial<ResponseOption>): Promise<boolean> {
    const existing = await this.port.getOptionById(id);
    if (!existing) {
      throw new Error("Opción de respuesta no encontrada");
    }
    await this.ensureSurveyIsDraft(existing.questionId);

    if (data.displayOrder !== undefined) {
      const siblings = await this.port.getOptionsByQuestion(existing.questionId, true);
      if (siblings.some((opt) => opt.optionId !== id && opt.displayOrder === Number(data.displayOrder))) {
        throw new Error("Ya existe una opción con ese orden en la pregunta");
      }
    }

    return await this.port.updateOption(id, data);
  }

  /**
   * Inactivación lógica (status = 0).
   */
  async deactivateOption(id: number): Promise<boolean> {
    const existing = await this.port.getOptionById(id);
    if (!existing) {
      throw new Error("Opción de respuesta no encontrada");
    }
    await this.ensureSurveyIsDraft(existing.questionId);
    return await this.port.deactivateOption(id);
  }

  /**
   * Reactivación lógica (status = 1).
   */
  async activateOption(id: number): Promise<boolean> {
    const existing = await this.port.getOptionById(id);
    if (!existing) {
      throw new Error("Opción de respuesta no encontrada");
    }
    await this.ensureSurveyIsDraft(existing.questionId);
    return await this.port.activateOption(id);
  }
}
