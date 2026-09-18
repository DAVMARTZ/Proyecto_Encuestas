import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

export enum RolUsuario {
    ADMINISTRADOR = 'administrador',
    USUARIO = 'usuario'
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    user_id!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    email!: string;

    @Column({ type: "varchar", length: 255 })
    password_hash!: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at!: Date;

    @Column({ type: "integer", default: 1 })
    status_user!: number;

    @Column({ type: "varchar", length: 50, default: RolUsuario.USUARIO })
    role!: RolUsuario;
}
