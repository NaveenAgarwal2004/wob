// backend/src/entities/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, OneToMany, Index, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';
import { ProductDetail } from './product-detail.entity';
import { Review } from './review.entity';

@Entity('products')
// REMOVE the class-level @Index(['sourceId'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true }) // This automatically creates a unique index
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

  @Column({ unique: true }) // This automatically creates a unique index
  sourceUrl: string;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index() // Keeping this for performance on date filtering
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