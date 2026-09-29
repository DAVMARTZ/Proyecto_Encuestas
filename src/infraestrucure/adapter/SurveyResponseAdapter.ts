import { Repository } from 'typeorm';
import { SurveyResponsePort, SurveyResponse } from '../../domain/SurveyResponse';
import { SurveyResponseEntity } from '../entities/SurveyResponseEntity';
import { AppDataSource } from '../config/data-base';

export class SurveyResponseAdapter implements SurveyResponsePort {
  private readonly repository: Repository<SurveyResponseEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SurveyResponseEntity);
  }

  async saveResponse(response: SurveyResponse): Promise<number> {
    const entity = this.repository.create({
      surveyId: response.surveyId,
      userId: response.userId,
      status: 1,
      details: response.details.map(d => ({
        questionId: d.questionId,
        optionId: d.optionId,
        responseText: d.responseText,
        status: 1
      })),
    });

    const saved = await this.repository.save(entity);
    return saved.surveyResponseId;
  }


  /**
   * Obtiene la lista de estudiantes que respondieron una encuesta específica.
   */
  async getStudentsBySurvey(surveyId: number): Promise<any[]> {
    const query = this.repository.createQueryBuilder('sr')
      .innerJoin('users', 'u', 'u.user_id = sr.user_id')
      .select([
        'sr.submittedAt AS "submittedAt"',
        'u.user_id AS "estudianteId"',
        'u.name AS "nombre"',
        'u.email AS "correo"'
      ])
      .where('sr.survey_id = :surveyId', { surveyId })
      .andWhere('sr.status = 1')
      .orderBy('sr.submittedAt', 'DESC');

    const results = await query.getRawMany();
    return results.map(r => ({
      estudianteId: r.estudianteId,
      nombre: r.nombre,
      correo: r.correo,
      fechaRespuesta: r.submittedAt
    }));
  }

  /**
   * Obtiene el detalle de las respuestas dadas por un estudiante en una encuesta.
   */
  async getStudentAnswers(surveyId: number, studentId: number): Promise<any[]> {
    const queryBuilder = AppDataSource.getRepository(SurveyResponseEntity)
      .createQueryBuilder('sr')
      .innerJoin('response_details', 'rd', 'rd.survey_response_id = sr.survey_response_id')
      .innerJoin('questions', 'q', 'q.question_id = rd.question_id')
      .leftJoin('response_options', 'ro', 'ro.option_id = rd.option_id')
      .select([
        'q.question_id AS "preguntaId"',
        'q.question_text AS "preguntaTexto"',
        'q.question_type AS "tipoPregunta"',
        'rd.response_text AS "responseText"',
        'ro.option_text AS "optionText"',
        'sr.submittedAt AS "fechaRespuesta"'
      ])
      .where('sr.survey_id = :surveyId', { surveyId })
      .andWhere('sr.user_id = :studentId', { studentId })
      .andWhere('sr.status = 1')
      .andWhere('rd.status = 1');

    const results = await queryBuilder.getRawMany();
    return results.map(r => ({
      preguntaId: r.preguntaId,
      preguntaTexto: r.preguntaTexto,
      tipoPregunta: r.tipoPregunta,
      respuesta: r.optionText || r.responseText || '',
      fechaRespuesta: r.fechaRespuesta
    }));
  }

  async getResponsesBySurvey(surveyId: number): Promise<SurveyResponse[]> {
    const entities = await this.repository.find({
      where: { surveyId },
      relations: {
        details: true
      },
      order: { surveyResponseId: 'ASC' }
    });

    return entities.map(entity => ({
      surveyResponseId: entity.surveyResponseId,
      submittedAt: entity.submittedAt,
      surveyId: entity.surveyId,
      userId: entity.userId,
      status: entity.status,
      details: entity.details.map(detail => ({
        detailId: detail.detailId,
        questionId: detail.questionId,
        optionId: detail.optionId,
        responseText: detail.responseText,
        status: detail.status
      }))
    }));
  }
}