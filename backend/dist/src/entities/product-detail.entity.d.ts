import { Product } from './product.entity';
export declare class ProductDetail {
    id: string;
    productId: string;
    description: string;
    specs: Record<string, any>;
    ratingsAvg: number;
    reviewsCount: number;
    recommendations: string[];
    product: Product;
    createdAt: Date;
    updatedAt: Date;
}
