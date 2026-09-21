import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { QuestionEntity } from './QuestionEntity';

@Entity('surveys') 
export class SurveyEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'survey_id' }) 
  surveyId!: string;

  @Column({ name: 'user_id', type: 'uuid' }) 
  userId!: string;

  @Column({ name: 'title', type: 'varchar', length: 200 }) 
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string; 

  @Column({ name: 'status_survey', type: 'varchar', length: 30, default: 'Borrador' })
  statusSurvey!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) 
  createdAt!: Date;

  @Column({ name: 'close_date', type: 'timestamptz', nullable: true })
  closeDate?: Date; 

  @OneToMany(() => QuestionEntity, (question: QuestionEntity) => question.survey)
  questions!: QuestionEntity[];
}