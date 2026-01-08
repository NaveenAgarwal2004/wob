import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_details')
export class ProductDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  specs: Record<string, any>;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  ratingsAvg: number;

  @Column({ default: 0 })
  reviewsCount: number;

  @Column({ type: 'jsonb', nullable: true })
  recommendations: string[];

  @OneToOne(() => Product, product => product.detail)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
