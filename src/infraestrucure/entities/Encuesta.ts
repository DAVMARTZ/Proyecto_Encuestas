import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn 
} from 'typeorm';
import { EstadoEncuesta } from '../../domain/Survey'; // Importamos el enum que creamos en el Dominio

@Entity('encuestas') // Nombre exacto de la tabla en tu base de datos SQL
export class Encuesta {
    
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'usuario_creador_id' })
    usuario_creador_id!: string;

    @Column({ type: 'uuid', name: 'item_id' })
    item_id!: string;

    @Column({ type: 'uuid', name: 'tipo_encuesta_id' })
    tipo_encuesta_id!: string;

    @Column({ type: 'varchar', length: 200 })
    titulo!: string;

    @Column({ type: 'text', nullable: true })
    descripcion!: string;

    // Manejo del estado usando el enum nativo
    @Column({ 
        type: 'enum', 
        enum: EstadoEncuesta, 
        default: EstadoEncuesta.Borrador 
    })
    estado!: EstadoEncuesta;

    // Fechas automáticas manejadas por TypeORM para coincidir con tu CURRENT_TIMESTAMP
    @CreateDateColumn({ type: 'timestamp with time zone', name: 'fecha_creacion' })
    fecha_creacion!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'fecha_actualizacion' })
    fecha_actualizacion!: Date;
}