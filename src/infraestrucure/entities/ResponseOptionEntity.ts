import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionEntity } from './QuestionEntity';

@Entity('response_options')
export class ResponseOptionEntity {
  @PrimaryGeneratedColumn('increment', { name: 'option_id' })
  optionId!: number;

  @Column({ name: 'option_text', type: 'varchar', length: 300 })
  optionText!: string;

  @Column({ name: 'display_order', type: 'int' })
  displayOrder!: number;

  @Column({ name: 'status', type: 'smallint', default: 1 })
  status!: number;

  @Column({ name: 'question_id', type: 'int' })
  questionId!: number;

  // Relación N:1 con Questions
  @ManyToOne(() => QuestionEntity, question => question.options)
  @JoinColumn({ name: 'question_id' })
  question!: QuestionEntity;
}