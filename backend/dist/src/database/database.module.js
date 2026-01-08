"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const navigation_entity_1 = require("../entities/navigation.entity");
const category_entity_1 = require("../entities/category.entity");
const product_entity_1 = require("../entities/product.entity");
const product_detail_entity_1 = require("../entities/product-detail.entity");
const review_entity_1 = require("../entities/review.entity");
const scrape_job_entity_1 = require("../entities/scrape-job.entity");
const view_history_entity_1 = require("../entities/view-history.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DATABASE_HOST'),
                    port: configService.get('DATABASE_PORT'),
                    username: configService.get('DATABASE_USERNAME'),
                    password: configService.get('DATABASE_PASSWORD'),
                    database: configService.get('DATABASE_NAME'),
                    entities: [
                        navigation_entity_1.Navigation,
                        category_entity_1.Category,
                        product_entity_1.Product,
                        product_detail_entity_1.ProductDetail,
                        review_entity_1.Review,
                        scrape_job_entity_1.ScrapeJob,
                        view_history_entity_1.ViewHistory,
                    ],
                    synchronize: false,
                    logging: configService.get('NODE_ENV') === 'development',
                    ssl: { rejectUnauthorized: false },
                    ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
                }),
            }),
        ],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map