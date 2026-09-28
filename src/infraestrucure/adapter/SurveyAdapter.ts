import { EntityManager, In, Repository } from 'typeorm';
import { SurveyPort } from '../../domain/SurveyPort';
import { Survey, SurveyQuestion, SurveyStatus } from '../../domain/Survey';
import { SurveyEntity } from '../entities/Survey'; 
import { AppDataSource } from '../config/data-base';
import { QuestionEntity } from '../entities/QuestionEntity';
import { ResponseOptionEntity } from '../entities/ResponseOptionEntity';

export class SurveyAdapter implements SurveyPort {
  private readonly repository: Repository<SurveyEntity>;
  private readonly questionRepository: Repository<QuestionEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SurveyEntity);
    this.questionRepository = AppDataSource.getRepository(QuestionEntity);
  }

  private toDomain(entity: SurveyEntity): Survey {
    return {
      surveyId: entity.surveyId,
      title: entity.title,
      description: entity.description,
      status: entity.status as SurveyStatus,
      statusSurvey: entity.status as SurveyStatus,
      createdAt: entity.createdAt,
      closeDate: entity.closeDate,
      userId: entity.userId,
    };
  }

  /** Inserta preguntas y sus opciones dentro de la transacción recibida. */
  private async guardarPreguntas(
    manager: EntityManager,
    surveyId: number,
    questions: SurveyQuestion[]
  ): Promise<void> {
    const questionRepo = manager.getRepository(QuestionEntity);
    const optionRepo = manager.getRepository(ResponseOptionEntity);

    for (const q of questions) {
      const savedQuestion = await questionRepo.save(
        questionRepo.create({
          questionText: q.questionText,
          questionType: q.questionType,
          isRequired: q.isRequired,
          displayOrder: q.displayOrder,
          status: 1,
          surveyId,
        })
      );

      for (const o of q.options ?? []) {
        await optionRepo.save(
          optionRepo.create({
            optionText: o.optionText,
            displayOrder: o.displayOrder,
            status: 1,
            questionId: savedQuestion.questionId,
          })
        );
      }
    }
  }

  async save(survey: Survey): Promise<number> {
    return await this.repository.manager.transaction(async (manager) => {
      const surveyRepo = manager.getRepository(SurveyEntity);

      const saved = await surveyRepo.save(
        surveyRepo.create({
          title: survey.title,
          description: survey.description,
          status: survey.status !== undefined ? Number(survey.status) : 1,
          closeDate: survey.closeDate,
          userId: survey.userId,
        })
      );

      await this.guardarPreguntas(manager, saved.surveyId, survey.questions ?? []);

      return saved.surveyId;
    });
  }

  async findAll(includeInactive: boolean = false, userId?: number): Promise<Survey[]> {
    const entities = await this.repository.find({
      order: { surveyId: 'ASC' }
    });
    const visibles = includeInactive ? entities : entities.filter(e => e.status === 1);
    const surveys = visibles.map((e) => this.toDomain(e));

    // Total de preguntas activas por encuesta
    const counts: { survey_id: number; total: string }[] = await this.repository.query(
      `SELECT survey_id, COUNT(*) AS total FROM questions WHERE status::text = '1' GROUP BY survey_id`
    );
    const totals = new Map<number, number>(
      counts.map(r => [Number(r.survey_id), Number(r.total)] as [number, number])
    );

    // Encuestas que este usuario ya respondió
    let done = new Set<number>();
    if (userId) {
      const rows: { survey_id: number }[] = await this.repository.query(
        'SELECT DISTINCT survey_id FROM survey_responses WHERE user_id = $1',
        [userId]
      );
      done = new Set(rows.map(r => Number(r.survey_id)));
    }

    surveys.forEach(s => {
      s.totalQuestions = totals.get(Number(s.surveyId)) ?? 0;
      s.completed = done.has(Number(s.surveyId));
    });

    return surveys;
  }

  async findById(id: number): Promise<Survey | null> {
    const entity = await this.repository.findOneBy({ surveyId: id });
    if (!entity) return null;

    const questions = await this.questionRepository.find({
      where: { surveyId: id },
      relations: { options: true },
      order: { displayOrder: 'ASC', options: { displayOrder: 'ASC' } },
    });

    return {
      ...this.toDomain(entity),
      questions: questions
        .filter((q) => Number(q.status) === 1)
        .map((q) => ({
          questionId: q.questionId,
          questionText: q.questionText,
          questionType: q.questionType,
          isRequired: q.isRequired,
          displayOrder: q.displayOrder,
          options: (q.options ?? [])
            .filter((o) => Number(o.status) === 1)
            .map((o) => ({
              optionId: o.optionId,
              optionText: o.optionText,
              displayOrder: o.displayOrder,
            })),
        })),
    };
  }

  async update(id: number, survey: Partial<Survey>): Promise<boolean> {
    return await this.repository.manager.transaction(async (manager) => {
      const surveyRepo = manager.getRepository(SurveyEntity);

      const updateData: Partial<SurveyEntity> = {};
      if (survey.title !== undefined) updateData.title = survey.title;
      if (survey.description !== undefined) updateData.description = survey.description;
      if (survey.closeDate !== undefined) updateData.closeDate = survey.closeDate;
      if (survey.status !== undefined) updateData.status = Number(survey.status);

      if (Object.keys(updateData).length > 0) {
        const result = await surveyRepo.update(id, updateData);
        if ((result.affected ?? 0) === 0) return false;
      } else if ((await surveyRepo.count({ where: { surveyId: id } })) === 0) {
        return false;
      }

      // Si vienen preguntas se reemplazan las actuales: las anteriores pasan a inactivas
      // (no se borran, para conservar el historial de respuestas) y se crean las nuevas.
      if (survey.questions) {
        const questionRepo = manager.getRepository(QuestionEntity);
        const optionRepo = manager.getRepository(ResponseOptionEntity);

        const actuales = await questionRepo.find({ where: { surveyId: id } });
        const ids = actuales.map((q) => q.questionId);
        if (ids.length > 0) {
          await optionRepo.update({ questionId: In(ids) }, { status: 0 });
          await questionRepo.update({ questionId: In(ids) }, { status: 0 });
        }

        await this.guardarPreguntas(manager, id, survey.questions);
      }

      return true;
    });
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