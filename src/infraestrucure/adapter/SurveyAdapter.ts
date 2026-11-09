import { Repository } from "typeorm";
import { SurveyPort } from "../../domain/SurveyPort";
import { Survey, SurveyStatus } from "../../domain/Survey";
import { SurveyEntity } from "../entities/Survey";
import { QuestionEntity } from "../entities/QuestionEntity";
import { ResponseOptionEntity } from "../entities/ResponseOptionEntity";
import { AppDataSource } from "../config/data-base";

export class SurveyAdapter implements SurveyPort {
  private readonly repository: Repository<SurveyEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SurveyEntity);
  }

  private toDomain(entity: SurveyEntity): Survey {
    return {
      surveyId: entity.surveyId,
      title: entity.title,
      description: entity.description,
      status: entity.status as SurveyStatus,
      createdAt: entity.createdAt,
      closeDate: entity.closeDate,
      userId: entity.userId,
      questions: entity.questions
        ? entity.questions.map((q) => ({
            questionId: q.questionId,
            questionText: q.questionText,
            questionType: q.questionType,
            isRequired: q.isRequired,
            displayOrder: q.displayOrder,
            status: q.status,
            surveyId: q.surveyId,
            options: q.options
              ? q.options.map((opt) => ({
                  optionId: opt.optionId,
                  optionText: opt.optionText,
                  displayOrder: opt.displayOrder,
                  status: opt.status,
                  questionId: opt.questionId,
                }))
              : [],
          }))
        : undefined, // Los listados no cargan preguntas; el detalle está en GET /surveys/:id
    };
  }

  async save(survey: Survey): Promise<number> {
    const entity = this.repository.create({
      title: survey.title,
      description: survey.description,
      status: survey.status !== undefined ? Number(survey.status) : 1,
      closeDate: survey.closeDate,
      userId: survey.userId,
    });

    if (survey.questions && survey.questions.length > 0) {
      entity.questions = survey.questions.map((q) => {
        const questionEntity = new QuestionEntity();
        questionEntity.questionText = q.questionText;
        questionEntity.questionType = q.questionType;
        questionEntity.isRequired = q.isRequired;
        questionEntity.displayOrder = q.displayOrder;
        questionEntity.status = q.status !== undefined ? Number(q.status) : 1;

        if (q.options && q.options.length > 0) {
          questionEntity.options = q.options.map((opt) => {
            const optEntity = new ResponseOptionEntity();
            optEntity.optionText = opt.optionText;
            optEntity.displayOrder = opt.displayOrder;
            optEntity.status = opt.status !== undefined ? Number(opt.status) : 1;
            return optEntity;
          });
        }
        return questionEntity;
      });
    }

    const saved = await this.repository.save(entity);
    return saved.surveyId;
  }

  async findAll(includeInactive: boolean = false): Promise<Survey[]> {
    const whereClause = includeInactive ? {} : { status: 1 };
    const entities = await this.repository.find({
      where: whereClause,
      relations: { questions: true },
      order: { surveyId: "ASC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: number): Promise<Survey | null> {
    const entity = await this.repository.findOne({
      where: { surveyId: id },
      relations: {
        questions: {
          options: true,
        },
      },
      order: {
        questions: {
          displayOrder: "ASC",
          options: {
            displayOrder: "ASC",
          },
        },
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: number, includeInactive: boolean = false): Promise<Survey[]> {
    const whereClause: any = { userId };
    if (!includeInactive) {
      whereClause.status = 1;
    }
    const entities = await this.repository.find({
      where: whereClause,
      order: { surveyId: "DESC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(id: number, survey: Partial<Survey>): Promise<boolean> {
    const updateData: Partial<SurveyEntity> = {};
    if (survey.title !== undefined) updateData.title = survey.title;
    if (survey.description !== undefined) updateData.description = survey.description;
    if (survey.closeDate !== undefined) updateData.closeDate = survey.closeDate;
    if (survey.status !== undefined) updateData.status = Number(survey.status);

    const result = await this.repository.update(id, updateData);
    return (result.affected ?? 0) > 0;
  }

  async updateStatus(id: number, status: SurveyStatus): Promise<boolean> {
    const result = await this.repository.update(id, { status: Number(status) });
    return (result.affected ?? 0) > 0;
  }

  async deactivate(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 0 });
    return (result.affected ?? 0) > 0;
  }

  async activate(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 1 });
    return (result.affected ?? 0) > 0;
  }
}
