import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SurveyResponseEntity } from './SurveyResponseEntity';
import { QuestionEntity } from './QuestionEntity';
import { ResponseOptionEntity } from './ResponseOptionEntity';

@Entity('response_details')
export class ResponseDetailEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'detail_id' })
  detailId: string;

  @Column({ name: 'response_text', type: 'text', nullable: true })
  responseText: string;

  @Column({ name: 'survey_response_id', type: 'uuid' })
  surveyResponseId: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'option_id', type: 'uuid', nullable: true })
  optionId: string;

  // Relación N:1 con SurveyResponses
  @ManyToOne(() => SurveyResponseEntity, response => response.details)
  @JoinColumn({ name: 'survey_response_id' })
  surveyResponse: SurveyResponseEntity;

  // Relación N:1 con Questions
  @ManyToOne(() => QuestionEntity)
  @JoinColumn({ name: 'question_id' })
  question: QuestionEntity;

  // Relación N:1 con ResponseOptions
  @ManyToOne(() => ResponseOptionEntity)
  @JoinColumn({ name: 'option_id' })
  option: ResponseOptionEntity;
}