import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionEntity } from './QuestionEntity';

@Entity('response_options')
export class ResponseOptionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'option_id' })
  optionId: string;

  @Column({ name: 'option_text', type: 'varchar', length: 300 })
  optionText: string;

  @Column({ name: 'display_order', type: 'int' })
  displayOrder: number;

  @Column({ name: 'status_response_option', type: 'varchar', length: 30 })
  statusResponseOption: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  // Relación N:1 con Questions
  @ManyToOne(() => QuestionEntity, question => question.options)
  @JoinColumn({ name: 'question_id' })
  question: QuestionEntity;
}