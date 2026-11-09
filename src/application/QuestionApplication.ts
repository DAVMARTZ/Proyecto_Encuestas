import { Question, QuestionType } from "../domain/Question";
import { QuestionPort } from "../domain/QuestionPort";
import { SurveyPort } from "../domain/SurveyPort";
import { SURVEY_STATUS } from "../domain/Survey";

const VALID_QUESTION_TYPES: QuestionType[] = ["Escala", "Abierta", "Seleccion Multiple"];

/**
 * Capa de Aplicación - Casos de Uso para Preguntas de Encuesta
 */
export class QuestionApplication {
  private port: QuestionPort;
  private surveyPort: SurveyPort;

  constructor(port: QuestionPort, surveyPort: SurveyPort) {
    this.port = port;
    this.surveyPort = surveyPort;
  }

  /**
   * Las preguntas solo se pueden cambiar mientras la encuesta está en borrador.
   */
  private async ensureSurveyIsDraft(surveyId: number): Promise<void> {
    const survey = await this.surveyPort.findById(surveyId);
    if (!survey) {
      throw new Error("La encuesta no existe.");
    }
    if (Number(survey.status) !== SURVEY_STATUS.DRAFT) {
      throw new Error("Solo se pueden modificar las preguntas de encuestas en borrador.");
    }
  }

  /**
   * Crea una nueva pregunta asociada a una encuesta.
   */
  async createQuestion(data: Omit<Question, "displayOrder"> & { displayOrder?: number }): Promise<number> {
    if (!data.surveyId || Number(data.surveyId) <= 0) {
      throw new Error("El ID de la encuesta es obligatorio");
    }

    if (!data.questionText || data.questionText.trim() === "") {
      throw new Error("El enunciado de la pregunta es obligatorio");
    }

    if (!VALID_QUESTION_TYPES.includes(data.questionType as QuestionType)) {
      throw new Error(
        `Tipo de pregunta inválido. Tipos permitidos: ${VALID_QUESTION_TYPES.join(", ")}`
      );
    }

    await this.ensureSurveyIsDraft(Number(data.surveyId));

    // Si no se indica orden, la pregunta queda de última
    const existing = await this.port.getQuestionsBySurvey(Number(data.surveyId), true);
    const nextOrder = Math.max(0, ...existing.map((q) => q.displayOrder)) + 1;

    const questionToSave: Question = {
      ...data,
      surveyId: Number(data.surveyId),
      displayOrder: data.displayOrder ? Number(data.displayOrder) : nextOrder,
      isRequired: data.isRequired !== undefined ? Boolean(data.isRequired) : true,
      status: data.status !== undefined ? Number(data.status) : 1,
    };

    return await this.port.createQuestion(questionToSave);
  }

  /**
   * Obtiene todas las preguntas pertenecientes a una encuesta.
   */
  async getQuestionsBySurvey(surveyId: number, includeInactive: boolean = false): Promise<Question[]> {
    if (!surveyId || surveyId <= 0) {
      throw new Error("ID de encuesta inválido");
    }
    if (!(await this.surveyPort.findById(surveyId))) {
      throw new Error("La encuesta no existe.");
    }
    return await this.port.getQuestionsBySurvey(surveyId, includeInactive);
  }

  /**
   * Obtiene una pregunta por su ID.
   */
  async getQuestionById(id: number): Promise<Question> {
    const question = await this.port.getQuestionById(id);
    if (!question) {
      throw new Error("Pregunta no encontrada");
    }
    return question;
  }

  /**
   * Actualiza el contenido o configuración de una pregunta.
   */
  async updateQuestion(id: number, data: Partial<Question>): Promise<boolean> {
    const existing = await this.port.getQuestionById(id);
    if (!existing) {
      throw new Error("Pregunta no encontrada");
    }
    await this.ensureSurveyIsDraft(existing.surveyId);

    if (data.questionType &&!VALID_QUESTION_TYPES.includes(data.questionType as QuestionType)) {
      throw new Error(
        `Tipo de pregunta inválido. Tipos permitidos: ${VALID_QUESTION_TYPES.join(", ")}`
      );
    }

    return await this.port.updateQuestion(id, data);
  }

  /**
   * Inactivación lógica de la pregunta (status = 0).
   */
  async deactivateQuestion(id: number): Promise<boolean> {
    const existing = await this.port.getQuestionById(id);
    if (!existing) {
      throw new Error("Pregunta no encontrada");
    }
    await this.ensureSurveyIsDraft(existing.surveyId);
    return await this.port.deactivateQuestion(id);
  }

  /**
   * Reactivación lógica de la pregunta (status = 1).
   */
  async activateQuestion(id: number): Promise<boolean> {
    const existing = await this.port.getQuestionById(id);
    if (!existing) {
      throw new Error("Pregunta no encontrada");
    }
    await this.ensureSurveyIsDraft(existing.surveyId);
    return await this.port.activateQuestion(id);
  }
}

