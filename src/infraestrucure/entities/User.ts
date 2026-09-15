import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum RolUsuario {
    Administrador = 'Administrador',
    Docente = 'Docente',
    Cliente = 'Cliente'
}

@Entity('usuarios') 
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "varchar", length: 100 })
    nombre!: string;
    
    @Column({ type: "varchar", length: 150, unique: true })
    correo!: string; // Reemplaza a email_user
    
    @Column({ type: "varchar", length: 255 })
    password!: string;
    
    @Column({ type: "text", nullable: true })
    foto_perfil!: string; 

    @Column({ type: "enum", enum: RolUsuario, default: RolUsuario.Docente })
    rol!: RolUsuario;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    fecha_creacion!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    fecha_actualizacion!: Date;
}