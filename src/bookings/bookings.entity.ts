import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Trips } from '../trips/trips.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  trip_id: number;

  @Column()
  user_id: number;

  @Column()
  seat: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  status: number; // 0 = pending 1 = cancelled, 2 = confirmed

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @Column({ default: 0 })
  created_by: number;

  @Column({ type: 'timestamp', nullable: true })
  modified_at: Date | null;

  @Column({ default: 0 })
  modified_by: number;

  @Column({ type: 'json', nullable: true })
  pickup_point: any;

  @Column({ type: 'varchar', nullable: true })
  pickup_lat_lng: string;

  trip?: Trips;
}
