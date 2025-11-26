import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ type: 'varchar', length: 20, unique: true })
  plate_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ type: 'text', nullable: true })
  s3_imagelink: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @Column({ type: 'int', default: 0 })
  created_by: number;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  modified_at: Date | null;

  @Column({ type: 'int', default: 0 })
  modified_by: number;
}
