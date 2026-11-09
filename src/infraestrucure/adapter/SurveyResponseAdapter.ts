import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { StatisticsFilters, SurveyResponsePort, SurveyStatistics } from "../../domain/SurveyResponsePort";
import { ROLES } from "../../domain/Role";
import { SurveyResponse } from "../../domain/SurveyResponse";
import { SurveyResponseEntity } from "../entities/SurveyResponseEntity";
import { QuestionEntity } from "../entities/QuestionEntity";
import { User } from "../entities/User";
import { AppDataSource } from "../config/data-base";

export class SurveyResponseAdapter implements SurveyResponsePort {
  private readonly repository: Repository<SurveyResponseEntity>;
  private readonly questionRepo: Repository<QuestionEntity>;
  private readonly userRepo: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(SurveyResponseEntity);
    this.questionRepo = AppDataSource.getRepository(QuestionEntity);
    this.userRepo = AppDataSource.getRepository(User);
  }

  async saveResponse(response: SurveyResponse): Promise<number> {
    const entity = this.repository.create({
      surveyId: response.surveyId,
      userId: response.userId,
      status: 1,
      details: response.details.map((d) => ({
        questionId: d.questionId,
        optionId: d.optionId,
        responseText: d.responseText,
        status: 1,
      })),
    });

    const saved = await this.repository.save(entity);
    return saved.surveyResponseId;
  }

  async hasUserResponded(surveyId: number, userId: number): Promise<boolean> {
    const total = await this.repository.count({ where: { surveyId, userId, status: 1 } });
    return total > 0;
  }

  async getRespondedSurveyIds(userId: number): Promise<number[]> {
    const responses = await this.repository.find({
      where: { userId, status: 1 },
      select: { surveyId: true },
    });
    return responses.map((response) => response.surveyId);
  }

  async countResponsesBySurvey(): Promise<Record<number, number>> {
    const rows = await this.repository
      .createQueryBuilder("response")
      .select("response.surveyId", "surveyId")
      .addSelect("COUNT(*)", "total")
      .where("response.status = 1")
      .groupBy("response.surveyId")
      .getRawMany();

    return Object.fromEntries(rows.map((row) => [Number(row.surveyId), Number(row.total)]));
  }

  async getResponsesByUser(userId: number): Promise<SurveyResponse[]> {
    const entities = await this.repository.find({
      where: { userId, status: 1 },
      relations: { survey: true, details: { question: true, option: true } },
      order: { submittedAt: "DESC" },
    });

    return entities.map((entity) => ({
      surveyResponseId: entity.surveyResponseId,
      submittedAt: entity.submittedAt,
      surveyId: entity.surveyId,
      surveyTitle: entity.survey.title,
      details: [...entity.details]
        .sort((a, b) => a.question.displayOrder - b.question.displayOrder)
        .map((detail) => ({
          questionId: detail.questionId,
          questionText: detail.question.questionText,
          optionText: detail.option ? detail.option.optionText : undefined,
          responseText: detail.responseText,
        })),
    }));
  }

  async getResponsesBySurvey(surveyId: number): Promise<SurveyResponse[]> {
    const entities = await this.repository.find({
      where: { surveyId, status: 1 },
      relations: {
        user: true,
        details: {
          question: true,
          option: true,
        },
      },
      order: { surveyResponseId: "ASC" },
    });

    return entities.map((entity) => ({
      surveyResponseId: entity.surveyResponseId,
      submittedAt: entity.submittedAt,
      surveyId: entity.surveyId,
      userId: entity.userId,
      userName: entity.user ? entity.user.name : "Anónimo",
      userEmail: entity.user ? entity.user.email : undefined,
      status: entity.status,
      details: entity.details.map((detail) => ({
        detailId: detail.detailId,
        questionId: detail.questionId,
        questionText: detail.question ? detail.question.questionText : undefined,
        optionId: detail.optionId,
        optionText: detail.option ? detail.option.optionText : undefined,
        responseText: detail.responseText,
        status: detail.status,
      })),
    }));
  }

  private submittedAtFilter(filters: StatisticsFilters) {
    if (filters.from && filters.to) return { submittedAt: Between(filters.from, filters.to) };
    if (filters.from) return { submittedAt: MoreThanOrEqual(filters.from) };
    if (filters.to) return { submittedAt: LessThanOrEqual(filters.to) };
    return {};
  }

  async getSurveyStatistics(surveyId: number, filters: StatisticsFilters = {}): Promise<SurveyStatistics> {
    // 1. Obtener todas las preguntas de la encuesta con sus opciones
    const questions = await this.questionRepo.find({
      where: { surveyId, status: 1 },
      relations: { options: true },
      order: { displayOrder: "ASC" },
    });

    // 2. Obtener todas las respuestas y detalles asociados a la encuesta
    const responses = await this.repository.find({
      where: { surveyId, status: 1, ...this.submittedAtFilter(filters) },
      relations: {
        details: {
          option: true,
        },
      },
    });

    const totalSubmissions = responses.length;

    // Participación: estudiantes activos que respondieron
    const students = await this.userRepo.find({
      where: { roleId: ROLES.STUDENT, status: 1 },
      select: { userId: true },
    });
    const studentIds = new Set(students.map((student) => student.userId));
    const studentsAnswered = responses.filter((response) => response.userId && studentIds.has(response.userId)).length;

    // 3. Procesar las estadísticas por cada pregunta
    const questionsSummary = questions.map((q) => {
      const allDetailsForQuestion = responses.flatMap((r) =>
        r.details.filter((d) => d.questionId === q.questionId)
      );

      const totalAnswers = allDetailsForQuestion.length;

      if (q.questionType === "Abierta") {
        const openAnswers = allDetailsForQuestion
          .map((d) => d.responseText?.trim())
          .filter((text): text is string => Boolean(text && text.length > 0));

        return {
          questionId: q.questionId,
          questionText: q.questionText,
          questionType: q.questionType,
          totalAnswers,
          openAnswers,
        };
      } else {
        // Escala o Selección Múltiple: inicializamos conteo para cada opción configurada
        // Sin prototipo: el texto de una opción puede ser cualquier palabra
        const optionsCount: { [optionText: string]: number } = Object.create(null);
        if (q.options) {
          q.options.forEach((opt) => {
            optionsCount[opt.optionText] = 0;
          });
        }

        allDetailsForQuestion.forEach((d) => {
          if (d.option && d.option.optionText) {
            optionsCount[d.option.optionText] = (optionsCount[d.option.optionText] || 0) + 1;
          }
        });

        return {
          questionId: q.questionId,
          questionText: q.questionText,
          questionType: q.questionType,
          totalAnswers,
          optionsCount,
        };
      }
    });

    return {
      surveyId,
      totalSubmissions,
      totalStudents: students.length,
      studentsAnswered,
      questionsSummary,
    };
  }
}
