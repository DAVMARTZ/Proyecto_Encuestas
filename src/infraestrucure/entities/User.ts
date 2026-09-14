import {Entity, Column, PrimaryGeneratedColumn} from "typeorm"
import { UserRole } from "../../domain/User";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id_user!: number;

    @Column({ type: "character varying", length: 255})
    name_user!: string;
    
    @Column({ type: "character varying", length: 255, unique: true})
    email_user!: string;
    
    @Column({ type: "character varying", length: 255})
    password_user!: string;
    
    @Column({ type: "integer", default: 1})
    status_user!: number;

    @Column({ type: "enum", enum: UserRole, default: UserRole.ESTUDIANTE })
    role_user!: UserRole;
}