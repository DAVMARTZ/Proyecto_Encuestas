import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './User';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('increment', { name: 'role_id' })
  roleId!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ name: 'status', type: 'smallint', default: 1 })
  status!: number;

  @OneToMany(() => User, (user: User) => user.role)
  users!: User[];
}
