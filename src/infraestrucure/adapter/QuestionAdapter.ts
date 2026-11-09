import { Repository } from "typeorm";
import { QuestionPort } from "../../domain/QuestionPort";
import { Question as QuestionDomain } from "../../domain/Question";
import { QuestionEntity } from "../entities/QuestionEntity";
import { ResponseOptionEntity } from "../entities/ResponseOptionEntity";
import { AppDataSource } from "../config/data-base";

/**
 * Adaptador de Infraestructura para Preguntas con TypeORM
 */
export class QuestionAdapter implements QuestionPort {
  private repository: Repository<QuestionEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(QuestionEntity);
  }

  /**
   * Mapea una entidad TypeORM al modelo puro de Dominio
   */
  private toDomain(entity: QuestionEntity): QuestionDomain {
    return {
      questionId: entity.questionId,
      questionText: entity.questionText,
      questionType: entity.questionType,
      isRequired: entity.isRequired,
      displayOrder: entity.displayOrder,
      status: entity.status,
      surveyId: entity.surveyId,
      options: entity.options
        ? entity.options.map((opt) => ({
            optionId: opt.optionId,
            optionText: opt.optionText,
            displayOrder: opt.displayOrder,
            status: opt.status,
            questionId: opt.questionId,
          }))
        : [],
    };
  }

  async createQuestion(question: QuestionDomain): Promise<number> {
    const entity = this.repository.create({
      questionText: question.questionText,
      questionType: question.questionType,
      isRequired: question.isRequired,
      displayOrder: question.displayOrder,
      status: question.status !== undefined ? Number(question.status) : 1,
      surveyId: question.surveyId,
    });

    if (question.options && question.options.length > 0) {
      entity.options = question.options.map((opt) => {
        const optionEntity = new ResponseOptionEntity();
        optionEntity.optionText = opt.optionText;
        optionEntity.displayOrder = opt.displayOrder;
        optionEntity.status = opt.status !== undefined ? Number(opt.status) : 1;
        return optionEntity;
      });
    }

    const saved = await this.repository.save(entity);
    return saved.questionId;
  }

  async getQuestionsBySurvey(surveyId: number, includeInactive: boolean = false): Promise<QuestionDomain[]> {
    const whereClause: any = { surveyId };
    if (!includeInactive) {
      whereClause.status = 1;
    }

    const entities = await this.repository.find({
      where: whereClause,
      relations: {
        options: true,
      },
      order: {
        displayOrder: "ASC",
      },
    });

    return entities.map((e) => this.toDomain(e));
  }

  async getQuestionById(id: number): Promise<QuestionDomain | null> {
    const entity = await this.repository.findOne({
      where: { questionId: id },
      relations: {
        options: true,
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async updateQuestion(id: number, question: Partial<QuestionDomain>): Promise<boolean> {
    const existing = await this.repository.findOne({ where: { questionId: id } });
    if (!existing) return false;

    if (question.questionText !== undefined) existing.questionText = question.questionText;
    if (question.questionType !== undefined) existing.questionType = question.questionType;
    if (question.isRequired !== undefined) existing.isRequired = question.isRequired;
    if (question.displayOrder !== undefined) existing.displayOrder = question.displayOrder;
    if (question.status !== undefined) existing.status = Number(question.status);

    await this.repository.save(existing);
    return true;
  }

  async deactivateQuestion(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 0 });
    return (result.affected ?? 0) > 0;
  }

  async activateQuestion(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 1 });
    return (result.affected ?? 0) > 0;
  }
}

