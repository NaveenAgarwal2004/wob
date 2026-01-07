import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ScrapeJobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ScrapeTargetType {
  NAVIGATION = 'navigation',
  CATEGORY = 'category',
  PRODUCT = 'product',
  PRODUCT_DETAIL = 'product_detail',
}

@Entity('scrape_jobs')
export class ScrapeJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  targetUrl: string;

  @Column({ type: 'enum', enum: ScrapeTargetType })
  targetType: ScrapeTargetType;

  @Column({ type: 'enum', enum: ScrapeJobStatus, default: ScrapeJobStatus.PENDING })
  @Index()
  status: ScrapeJobStatus;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorLog: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
