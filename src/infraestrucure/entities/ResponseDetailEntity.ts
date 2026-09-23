import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SurveyResponseEntity } from './SurveyResponseEntity';
import { QuestionEntity } from './QuestionEntity';
import { ResponseOptionEntity } from './ResponseOptionEntity';

@Entity('response_details')
export class ResponseDetailEntity {
  @PrimaryGeneratedColumn('increment', { name: 'detail_id' })
  detailId!: number;

  @Column({ name: 'response_text', type: 'text', nullable: true })
  responseText?: string;

  @Column({ name: 'status', type: 'smallint', default: 1 })
  status!: number;

  @Column({ name: 'survey_response_id', type: 'int' })
  surveyResponseId!: number;

  @Column({ name: 'question_id', type: 'int' })
  questionId!: number;

  @Column({ name: 'option_id', type: 'int', nullable: true })
  optionId?: number;

  // Relación N:1 con SurveyResponses
  @ManyToOne(() => SurveyResponseEntity, response => response.details)
  @JoinColumn({ name: 'survey_response_id' })
  surveyResponse!: SurveyResponseEntity;

  // Relación N:1 con Questions
  @ManyToOne(() => QuestionEntity)
  @JoinColumn({ name: 'question_id' })
  question!: QuestionEntity;

  // Relación N:1 con ResponseOptions
  @ManyToOne(() => ResponseOptionEntity)
  @JoinColumn({ name: 'option_id' })
  option!: ResponseOptionEntity;
}