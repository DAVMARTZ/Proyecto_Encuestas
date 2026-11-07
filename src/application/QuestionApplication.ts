import { Question, QuestionType } from "../domain/Question";
import { QuestionPort } from "../domain/QuestionPort";

const VALID_QUESTION_TYPES: QuestionType[] = ["Escala", "Abierta", "Seleccion Multiple"];

/**
 * Capa de Aplicación - Casos de Uso para Preguntas de Encuesta
 */
export class QuestionApplication {
  private port: QuestionPort;

  constructor(port: QuestionPort) {
    this.port = port;
  }

  /**
   * Crea una nueva pregunta asociada a una encuesta.
   */
  async createQuestion(data: Question): Promise<number> {
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

    const questionToSave: Question = {
      ...data,
      surveyId: Number(data.surveyId),
      displayOrder: data.displayOrder ? Number(data.displayOrder) : 1,
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

    if (data.questionType && !VALID_QUESTION_TYPES.includes(data.questionType as QuestionType)) {
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
    return await this.port.activateQuestion(id);
  }

  /**
   * Baja lógica vía DELETE sin borrado físico.
   */
  async deleteQuestion(id: number): Promise<boolean> {
    return await this.deactivateQuestion(id);
  }
}

