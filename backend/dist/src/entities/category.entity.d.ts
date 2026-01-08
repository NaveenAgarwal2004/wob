import { Navigation } from './navigation.entity';
import { Product } from './product.entity';
export declare class Category {
    id: string;
    navigationId: string;
    parentId: string;
    title: string;
    slug: string;
    productCount: number;
    sourceUrl: string;
    lastScrapedAt: Date;
    navigation: Navigation;
    parent: Category;
    children: Category[];
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
