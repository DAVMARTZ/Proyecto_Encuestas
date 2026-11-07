import { Repository } from "typeorm";
import { SurveyResponsePort, SurveyStatistics } from "../../domain/SurveyResponsePort";
import { SurveyResponse } from "../../domain/SurveyResponse";
import { SurveyResponseEntity } from "../entities/SurveyResponseEntity";
import { QuestionEntity } from "../entities/QuestionEntity";
import { AppDataSource } from "../config/data-base";

export class SurveyResponseAdapter implements SurveyResponsePort {
  private readonly repository: Repository<SurveyResponseEntity>;
  private readonly questionRepo: Repository<QuestionEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SurveyResponseEntity);
    this.questionRepo = AppDataSource.getRepository(QuestionEntity);
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

  async getResponsesBySurvey(surveyId: number): Promise<SurveyResponse[]> {
    const entities = await this.repository.find({
      where: { surveyId },
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

  async getSurveyStatistics(surveyId: number): Promise<SurveyStatistics> {
    // 1. Obtener todas las preguntas de la encuesta con sus opciones
    const questions = await this.questionRepo.find({
      where: { surveyId, status: 1 },
      relations: { options: true },
      order: { displayOrder: "ASC" },
    });

    // 2. Obtener todas las respuestas y detalles asociados a la encuesta
    const responses = await this.repository.find({
      where: { surveyId, status: 1 },
      relations: {
        details: {
          option: true,
        },
      },
    });

    const totalSubmissions = responses.length;

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
        const optionsCount: { [optionText: string]: number } = {};
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
      questionsSummary,
    };
  }
}
