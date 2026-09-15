import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('encuestas')
export class SurveyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_creador_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @Column({ name: 'tipo_encuesta_id', type: 'uuid' })
  surveyTypeId: string;

  @Column({ name: 'titulo', type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'estado', type: 'varchar', default: 'Borrador' })
  status: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  updatedAt: Date;
}