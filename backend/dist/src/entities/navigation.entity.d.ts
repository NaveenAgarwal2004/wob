import { Category } from './category.entity';
export declare class Navigation {
    id: string;
    title: string;
    slug: string;
    sourceUrl: string;
    lastScrapedAt: Date;
    categories: Category[];
    createdAt: Date;
    updatedAt: Date;
}
