import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('view_histories')
export class ViewHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  @Index()
  sessionId: string;

  @Column({ type: 'jsonb' })
  pathJson: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
