import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  author: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Product, product => product.reviews)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
