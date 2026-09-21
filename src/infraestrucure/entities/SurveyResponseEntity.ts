import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SurveyEntity } from './Survey'; 
import { ResponseDetailEntity } from './ResponseDetailEntity';

@Entity('survey_responses')
export class SurveyResponseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'survey_response_id' })
  surveyResponseId!: string; 

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @Column({ name: 'survey_id', type: 'uuid' })
  surveyId!: string; 

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string; 

  // Relación N:1 con Surveys
  @ManyToOne(() => SurveyEntity)
  @JoinColumn({ name: 'survey_id' })
  survey!: SurveyEntity;

  // Relación 1:N con ResponseDetails
  @OneToMany(() => ResponseDetailEntity, detail => detail.surveyResponse, { cascade: true })
  details!: ResponseDetailEntity[]; 
}