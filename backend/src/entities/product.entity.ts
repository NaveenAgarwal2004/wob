import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, OneToMany, Index, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';
import { ProductDetail } from './product-detail.entity';
import { Review } from './review.entity';

@Entity('products')
@Index(['sourceId'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  sourceId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  author: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ default: 'GBP' })
  currency: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ unique: true })
  @Index()
  sourceUrl: string;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  lastScrapedAt: Date;

  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToOne(() => ProductDetail, detail => detail.product, { cascade: true })
  detail: ProductDetail;

  @OneToMany(() => Review, review => review.product, { cascade: true })
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
