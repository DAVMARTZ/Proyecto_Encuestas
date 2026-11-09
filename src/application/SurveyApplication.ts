import { SurveyPort } from "../domain/SurveyPort";
import { SurveyResponsePort } from "../domain/SurveyResponsePort";
import { Survey, SURVEY_STATUS } from "../domain/Survey";

export class SurveyApplication {
  constructor(
    private readonly surveyPort: SurveyPort,
    private readonly responsePort: SurveyResponsePort
  ) {}

  /**
   * Crea una nueva encuesta en estado borrador.
   */
  async createSurvey(data: Omit<Survey, "surveyId" | "status" | "createdAt">): Promise<number> {
    if (!data.title || data.title.trim() === "") {
      throw new Error("El título de la encuesta es obligatorio.");
    }
    if (!data.userId) {
      throw new Error("El ID del usuario creador es obligatorio.");
    }

    const newSurvey: Survey = {
      ...data,
      status: SURVEY_STATUS.DRAFT,
    };

    return await this.surveyPort.save(newSurvey);
  }

  /**
   * Recupera las encuestas generales del sistema, indicando cuántas preguntas
   * activas tiene cada una y si el usuario de la sesión ya la respondió.
   */
  async getAllSurveys(includeInactive: boolean, userId: number, isAdmin: boolean = false): Promise<Survey[]> {
    const surveys = await this.surveyPort.findAll(includeInactive);
    const responded = await this.responsePort.getRespondedSurveyIds(userId);
    const counts = await this.responsePort.countResponsesBySurvey();

    return surveys.map((survey) => {
      const { questions, ...data } = survey;
      const summary = {
        ...data,
        questionCount: this.activeQuestions(survey).length,
        answered: responded.includes(survey.surveyId as number),
        responseCount: counts[survey.surveyId as number] ?? 0,
      };
      return isAdmin ? summary : this.forRespondent(summary);
    });
  }

  /**
   * Busca una encuesta por su ID numérico (incluyendo sus preguntas y opciones).
   * Quien no es administrador solo ve encuestas publicadas, con preguntas y opciones activas.
   */
  async getSurveyById(id: number, userId: number, isAdmin: boolean = false): Promise<Survey> {
    const survey = await this.surveyPort.findById(id);
    if (!survey) {
      throw new Error("La encuesta solicitada no existe.");
    }
    if (isAdmin) {
      const counts = await this.responsePort.countResponsesBySurvey();
      return { ...survey, responseCount: counts[id] ?? 0 };
    }
    if (Number(survey.status) !== SURVEY_STATUS.PUBLISHED) {
      throw new Error("La encuesta solicitada no existe.");
    }

    return {
      ...this.forRespondent(survey),
      answered: await this.responsePort.hasUserResponded(id, userId),
      questions: this.activeQuestions(survey).map((q) => ({
        ...q,
        options: (q.options ?? []).filter((opt) => Number(opt.status) === 1),
      })),
    };
  }

  /**
   * Recupera las encuestas creadas por un usuario específico.
   */
  async getSurveysByUserId(userId: number, includeInactive: boolean = false): Promise<Survey[]> {
    if (!userId || userId <= 0) {
      throw new Error("ID de usuario creador inválido.");
    }
    return await this.surveyPort.findByUserId(userId, includeInactive);
  }

  /**
   * Actualiza la información de una encuesta solo si está en borrador.
   */
  async updateSurvey(id: number, data: Partial<Survey>): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);

    if (!survey) {
      throw new Error("La encuesta que intenta editar no existe.");
    }
    if (Number(survey.status) !== SURVEY_STATUS.DRAFT) {
      throw new Error("Solo se pueden modificar encuestas en borrador.");
    }
    if (Object.keys(data).length === 0) {
      throw new Error("Debe enviar al menos un campo para actualizar.");
    }

    return await this.surveyPort.update(id, data);
  }

  /**
   * Publica un borrador para que pueda recibir respuestas.
   */
  async publishSurvey(id: number): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);

    if (!survey) {
      throw new Error("La encuesta no existe.");
    }
    if (Number(survey.status) !== SURVEY_STATUS.DRAFT) {
      throw new Error("Solo se pueden publicar encuestas en borrador.");
    }
    if (survey.closeDate && new Date(survey.closeDate) < new Date()) {
      throw new Error("La fecha de cierre de la encuesta ya pasó.");
    }
    this.validateQuestionsToPublish(survey);

    return await this.surveyPort.updateStatus(id, SURVEY_STATUS.PUBLISHED);
  }

  /**
   * Devuelve a borrador una encuesta publicada que todavía no tiene respuestas.
   */
  async returnToDraft(id: number): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);

    if (!survey) {
      throw new Error("La encuesta no existe.");
    }
    if (Number(survey.status) !== SURVEY_STATUS.PUBLISHED) {
      throw new Error("Solo las encuestas publicadas pueden volver a borrador.");
    }

    const counts = await this.responsePort.countResponsesBySurvey();
    if ((counts[id] ?? 0) > 0) {
      throw new Error("No se puede volver a borrador una encuesta que ya tiene respuestas.");
    }

    return await this.surveyPort.updateStatus(id, SURVEY_STATUS.DRAFT);
  }

  /**
   * Inactiva lógicamente la encuesta (baja lógica, sin borrado físico).
   */
  async deactivateSurvey(id: number): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);

    if (!survey) {
      throw new Error("La encuesta no existe.");
    }
    if (Number(survey.status) === SURVEY_STATUS.INACTIVE) {
      throw new Error("La encuesta ya está inactiva.");
    }

    return await this.surveyPort.deactivate(id);
  }

  /**
   * Reactiva una encuesta inactiva y la deja publicada.
   */
  async activateSurvey(id: number): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);

    if (!survey) {
      throw new Error("La encuesta no existe.");
    }
    if (Number(survey.status) !== SURVEY_STATUS.INACTIVE) {
      throw new Error("Solo se pueden reactivar encuestas inactivas.");
    }
    this.validateQuestionsToPublish(survey);

    return await this.surveyPort.activate(id);
  }

  /**
   * Quien responde no necesita saber quién creó la encuesta ni cuántas respuestas tiene.
   */
  private forRespondent(survey: Survey): Survey {
    const { userId: _creator, responseCount: _responses, ...data } = survey;
    return data as Survey;
  }

  private activeQuestions(survey: Survey) {
    return (survey.questions ?? []).filter((q) => Number(q.status) === 1);
  }

  /**
   * Una encuesta solo puede recibir respuestas si tiene preguntas que se puedan contestar.
   */
  private validateQuestionsToPublish(survey: Survey): void {
    const questions = this.activeQuestions(survey);
    if (questions.length === 0) {
      throw new Error("La encuesta debe tener al menos una pregunta activa.");
    }

    for (const question of questions) {
      const activeOptions = (question.options ?? []).filter((opt) => Number(opt.status) === 1);
      if (question.questionType !== "Abierta" && activeOptions.length === 0) {
        throw new Error(`La pregunta "${question.questionText}" necesita al menos una opción activa.`);
      }
    }
  }
}
