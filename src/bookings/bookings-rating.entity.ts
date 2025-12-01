import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ratings')
export class BookingRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  booking_id: number;

  @Column('int')
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;
}
