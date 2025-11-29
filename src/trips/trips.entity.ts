import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity('trips')
export class Trips {
@PrimaryGeneratedColumn()
id: number;


@Column()
user_id: number;


@Column()
vehicle_id: number;


@Column({ length: 255 })
departure_location: string;


@Column({ length: 255 })
arrival_location: string;


@Column({ type: 'timestamp' })
departure_time: Date;


@Column({ type: 'timestamp' })
arrival_time: Date;


@Column({ default: 0 })
availability: number;


@Column('decimal', { precision: 10, scale: 2 })
price: number;


@Column({ default: 0 })
status: number;


@Column({ type: 'timestamp', default: () => 'NOW()' })
created_at: Date;


@Column({ default: 0 })
created_by: number;


@Column({ type: 'timestamp', nullable: true })
modified_at: Date;


@Column({ default: 0 })
modified_by: number;
}