// users/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users' }) // explicitly match table name
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone_number: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'int', nullable: true })
  status: number;

  @Column({ type: 'int', nullable: true })
  verify_status: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referrer_code: string;

  @Column({ type: 'int', nullable: true })
  type: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  created_by: number;

  @Column({ type: 'timestamp', nullable: true })
  modified_at: Date;

  @Column({ type: 'int', nullable: true })
  modified_by: number;
}