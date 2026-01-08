import { Product } from './product.entity';
export declare class Review {
    id: string;
    productId: string;
    author: string;
    rating: number;
    text: string;
    createdAt: Date;
    product: Product;
}
