import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SurveyEntity } from './Survey'; 
import { ResponseDetailEntity } from './ResponseDetailEntity';
import { User } from './User';

@Entity('survey_responses')
export class SurveyResponseEntity {
  @PrimaryGeneratedColumn('increment', { name: 'survey_response_id' })
  surveyResponseId!: number; 

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @Column({ name: 'survey_id', type: 'int' })
  surveyId!: number; 

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId?: number; 

  @Column({ name: 'status', type: 'smallint', default: 1 })
  status!: number;

  // Relación N:1 con Users
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // Relación N:1 con Surveys
  @ManyToOne(() => SurveyEntity)
  @JoinColumn({ name: 'survey_id' })
  survey!: SurveyEntity;

  // Relación 1:N con ResponseDetails
  @OneToMany(() => ResponseDetailEntity, detail => detail.surveyResponse, { cascade: true })
  details!: ResponseDetailEntity[]; 
}