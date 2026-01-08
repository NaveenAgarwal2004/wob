"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const navigation_entity_1 = require("../entities/navigation.entity");
const category_entity_1 = require("../entities/category.entity");
const product_entity_1 = require("../entities/product.entity");
const product_detail_entity_1 = require("../entities/product-detail.entity");
const review_entity_1 = require("../entities/review.entity");
const scrape_job_entity_1 = require("../entities/scrape-job.entity");
const view_history_entity_1 = require("../entities/view-history.entity");
(0, dotenv_1.config)();
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [
        navigation_entity_1.Navigation,
        category_entity_1.Category,
        product_entity_1.Product,
        product_detail_entity_1.ProductDetail,
        review_entity_1.Review,
        scrape_job_entity_1.ScrapeJob,
        view_history_entity_1.ViewHistory,
    ],
    migrations: ['src/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: true,
    ssl: { rejectUnauthorized: false },
});
//# sourceMappingURL=typeorm.config.js.map