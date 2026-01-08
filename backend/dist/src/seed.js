"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const navigation_entity_1 = require("./entities/navigation.entity");
const category_entity_1 = require("./entities/category.entity");
const product_entity_1 = require("./entities/product.entity");
const product_detail_entity_1 = require("./entities/product-detail.entity");
const review_entity_1 = require("./entities/review.entity");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    synchronize: false,
});
async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');
        const navigationRepo = AppDataSource.getRepository(navigation_entity_1.Navigation);
        const categoryRepo = AppDataSource.getRepository(category_entity_1.Category);
        const productRepo = AppDataSource.getRepository(product_entity_1.Product);
        const productDetailRepo = AppDataSource.getRepository(product_detail_entity_1.ProductDetail);
        const reviewRepo = AppDataSource.getRepository(review_entity_1.Review);
        const navigation1 = navigationRepo.create({
            title: 'Books',
            slug: 'books',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/books',
            lastScrapedAt: new Date(),
        });
        await navigationRepo.save(navigation1);
        console.log('✅ Created navigation: Books');
        const navigation2 = navigationRepo.create({
            title: "Children's Books",
            slug: 'childrens-books',
            sourceUrl: 'https://www.worldofbooks.com/en-gb/childrens-books',
            lastScrapedAt: new Date(),
        });
        await navigationRepo.save(navigation2);
        console.log("✅ Created navigation: Children's Books");
        const category1 = categoryRepo.create({
            navigationId: navigation1.id,
            title: 'Fiction',
            slug: 'fiction',
            productCount: 10,
            sourceUrl: 'https://www.worldofbooks.com/en-gb/books/fiction',
            lastScrapedAt: new Date(),
        });
        await categoryRepo.save(category1);
        console.log('✅ Created category: Fiction');
        const category2 = categoryRepo.create({
            navigationId: navigation1.id,
            title: 'Non-Fiction',
            slug: 'non-fiction',
            productCount: 8,
            sourceUrl: 'https://www.worldofbooks.com/en-gb/books/non-fiction',
            lastScrapedAt: new Date(),
        });
        await categoryRepo.save(category2);
        console.log('✅ Created category: Non-Fiction');
        const category3 = categoryRepo.create({
            navigationId: navigation2.id,
            title: 'Picture Books',
            slug: 'picture-books',
            productCount: 5,
            sourceUrl: 'https://www.worldofbooks.com/en-gb/childrens-books/picture-books',
            lastScrapedAt: new Date(),
        });
        await categoryRepo.save(category3);
        console.log('✅ Created category: Picture Books');
        const sampleProducts = [
            {
                sourceId: 'sample-book-1',
                title: 'The Great Gatsby',
                author: 'F. Scott Fitzgerald',
                price: 8.99,
                currency: 'GBP',
                imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
                sourceUrl: 'https://www.worldofbooks.com/sample-1',
                categoryId: category1.id,
                description: 'A classic novel set in the Jazz Age on Long Island, near New York City. The story primarily concerns the young and mysterious millionaire Jay Gatsby and his quixotic passion and obsession with the beautiful former debutante Daisy Buchanan.',
            },
            {
                sourceId: 'sample-book-2',
                title: 'To Kill a Mockingbird',
                author: 'Harper Lee',
                price: 10.99,
                currency: 'GBP',
                imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300',
                sourceUrl: 'https://www.worldofbooks.com/sample-2',
                categoryId: category1.id,
                description: 'A gripping tale of racial injustice and childhood innocence set in the American South during the 1930s. The story is narrated by Scout Finch, who lives with her brother and father in the fictional town of Maycomb, Alabama.',
            },
            {
                sourceId: 'sample-book-3',
                title: '1984',
                author: 'George Orwell',
                price: 9.99,
                currency: 'GBP',
                imageUrl: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=300',
                sourceUrl: 'https://www.worldofbooks.com/sample-3',
                categoryId: category1.id,
                description: 'A dystopian social science fiction novel that follows the life of Winston Smith, a low ranking member of "the Party", who is frustrated by the omnipresent eyes of the party and its ominous ruler Big Brother.',
            },
            {
                sourceId: 'sample-book-4',
                title: 'Sapiens: A Brief History of Humankind',
                author: 'Yuval Noah Harari',
                price: 12.99,
                currency: 'GBP',
                imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300',
                sourceUrl: 'https://www.worldofbooks.com/sample-4',
                categoryId: category2.id,
                description: 'An exploration of how Homo sapiens came to dominate the world. From examining the role evolving humans have played in the global ecosystem to charting the rise of empires, Sapiens integrates history and science to reconsider accepted narratives.',
            },
            {
                sourceId: 'sample-book-5',
                title: 'Educated',
                author: 'Tara Westover',
                price: 11.99,
                currency: 'GBP',
                imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
                sourceUrl: 'https://www.worldofbooks.com/sample-5',
                categoryId: category2.id,
                description: "A memoir about a young woman who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge University. It's a story about the struggle for self-invention and fierce family loyalty.",
            },
            {
                sourceId: 'sample-book-6',
                title: 'The Very Hungry Caterpillar',
                author: 'Eric Carle',
                price: 6.99,
                currency: 'GBP',
                imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300',
                sourceUrl: 'https://www.worldofbooks.com/sample-6',
                categoryId: category3.id,
                description: "A classic children's picture book that tells the story of a caterpillar who eats his way through various foods before forming a cocoon and emerging as a butterfly. With its distinctive collage artwork and die-cut pages.",
            },
            {
                sourceId: 'sample-book-7',
                title: 'Where the Wild Things Are',
                author: 'Maurice Sendak',
                price: 7.99,
                currency: 'GBP',
                imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
                sourceUrl: 'https://www.worldofbooks.com/sample-7',
                categoryId: category3.id,
                description: 'The story of Max, a young boy who creates his own world of wild things when he is sent to his room. A beloved classic that celebrates imagination and the power of stories.',
            },
        ];
        for (const productData of sampleProducts) {
            const { description, ...productFields } = productData;
            const product = productRepo.create({
                ...productFields,
                lastScrapedAt: new Date(),
            });
            await productRepo.save(product);
            console.log(`✅ Created product: ${product.title}`);
            const detail = productDetailRepo.create({
                productId: product.id,
                description: description,
                ratingsAvg: 4.0 + Math.random(),
                reviewsCount: Math.floor(Math.random() * 50) + 10,
                specs: {
                    Publisher: 'Sample Publisher',
                    'Publication Date': '2020-01-01',
                    Pages: Math.floor(Math.random() * 300) + 200,
                    ISBN: '978-' + Math.floor(Math.random() * 10000000000),
                    Format: 'Paperback',
                    Language: 'English',
                },
                recommendations: [],
            });
            await productDetailRepo.save(detail);
            const reviewTexts = [
                'Absolutely loved this book! A must-read.',
                'Great storytelling and engaging characters.',
                'One of the best books I have ever read.',
                'Highly recommend to anyone who enjoys this genre.',
                'A masterpiece of literature.',
            ];
            for (let i = 0; i < 3; i++) {
                const review = reviewRepo.create({
                    productId: product.id,
                    author: `Reader ${Math.floor(Math.random() * 1000)}`,
                    rating: Math.floor(Math.random() * 2) + 4,
                    text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
                });
                await reviewRepo.save(review);
            }
        }
        console.log('\n✅ Seed data created successfully');
        console.log(`📊 Summary:`);
        console.log(`   - Navigations: 2`);
        console.log(`   - Categories: 3`);
        console.log(`   - Products: ${sampleProducts.length}`);
        console.log(`   - Reviews: ${sampleProducts.length * 3}`);
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
    finally {
        await AppDataSource.destroy();
    }
}
seed();
//# sourceMappingURL=seed.js.map