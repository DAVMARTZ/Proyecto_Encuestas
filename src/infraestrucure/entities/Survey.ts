import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionEntity } from './QuestionEntity';
import { User } from './User';

@Entity('surveys') 
export class SurveyEntity {
  @PrimaryGeneratedColumn('increment', { name: 'survey_id' }) 
  surveyId!: number;

  @Column({ name: 'user_id', type: 'int' }) 
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'title', type: 'varchar', length: 200 }) 
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string; 

  @Column({ name: 'status', type: 'smallint', default: 1 })
  status!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) 
  createdAt!: Date;

  @Column({ name: 'close_date', type: 'timestamptz', nullable: true })
  closeDate?: Date; 

  @OneToMany(() => QuestionEntity, (question: QuestionEntity) => question.survey)
  questions!: QuestionEntity[];
}