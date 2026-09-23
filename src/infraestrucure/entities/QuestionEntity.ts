import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SurveyEntity } from './Survey';
import { ResponseOptionEntity } from './ResponseOptionEntity';

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn('increment', { name: 'question_id' })
  questionId!: number;

  @Column({ name: 'question_text', type: 'text' })
  questionText!: string;

  @Column({ name: 'question_type', type: 'varchar', length: 30 })
  questionType!: string;

  @Column({ name: 'is_required', type: 'boolean' })
  isRequired!: boolean;

  @Column({ name: 'display_order', type: 'int' })
  displayOrder!: number;

  @Column({ name: 'status', type: 'smallint', default: 1 })
  status!: number;

  @Column({ name: 'survey_id', type: 'int' })
  surveyId!: number;

  // Relación N:1 con Surveys
  @ManyToOne(() => SurveyEntity, (survey: SurveyEntity) => survey.questions)
  @JoinColumn({ name: 'survey_id' })
  survey!: SurveyEntity;

  // Relación 1:N con ResponseOptions
  @OneToMany(() => ResponseOptionEntity, option => option.question, { cascade: true })
  options!: ResponseOptionEntity[];
}