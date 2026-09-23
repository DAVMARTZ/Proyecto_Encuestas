import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { RoleEntity } from "./RoleEntity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('increment', { name: 'user_id' })
    userId!: number;

    @Column({ name: 'name', type: 'varchar', length: 150 })
    name!: string;

    @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    passwordHash!: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @Column({ name: 'status_user', type: 'smallint', default: 1 })
    status!: number;

    @Column({ name: 'role_id', type: 'int' })
    roleId!: number;

    @Column({ name: 'photo_data', type: 'bytea', nullable: true })
    photoData?: Buffer;

    @Column({ name: 'photo_mime_type', type: 'varchar', length: 50, nullable: true })
    photoMimeType?: string;

    @ManyToOne(() => RoleEntity, (role: RoleEntity) => role.users)
    @JoinColumn({ name: 'role_id' })
    role!: RoleEntity;
}