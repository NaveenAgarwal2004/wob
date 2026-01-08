import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Navigation } from './navigation.entity';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  navigationId: string;

  @Column({ nullable: true })
  parentId: string;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ default: 0 })
  productCount: number;

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  lastScrapedAt: Date;

  @ManyToOne(() => Navigation, navigation => navigation.categories)
  @JoinColumn({ name: 'navigationId' })
  navigation: Navigation;

  @ManyToOne(() => Category, category => category.children)
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  @OneToMany(() => Product, product => product.category)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
