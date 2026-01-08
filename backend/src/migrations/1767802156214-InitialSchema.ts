import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1767802156214 implements MigrationInterface {
    name = 'InitialSchema1767802156214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "description" text, "specs" jsonb, "ratingsAvg" numeric(3,2), "reviewsCount" integer NOT NULL DEFAULT '0', "recommendations" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_64b6c3e629c8bc63c9c02e16b8" UNIQUE ("productId"), CONSTRAINT "PK_a3fa8e2e94f3c37a8d731451de4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "author" character varying, "rating" integer NOT NULL, "text" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sourceId" character varying NOT NULL, "title" character varying NOT NULL, "author" character varying, "price" numeric(10,2), "currency" character varying NOT NULL DEFAULT 'GBP', "imageUrl" character varying, "sourceUrl" character varying NOT NULL, "categoryId" uuid, "lastScrapedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b345dd7320bfe1cafa360493155" UNIQUE ("sourceId"), CONSTRAINT "UQ_509bd4956758a6155b56e965107" UNIQUE ("sourceUrl"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_222b45eba8829276355c61a55d" ON "products" ("lastScrapedAt") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "navigationId" uuid NOT NULL, "parentId" uuid, "title" character varying NOT NULL, "slug" character varying NOT NULL, "productCount" integer NOT NULL DEFAULT '0', "sourceUrl" character varying, "lastScrapedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "navigations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "slug" character varying NOT NULL, "sourceUrl" character varying, "lastScrapedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e7c8f4bb046d2156ed68739aed5" UNIQUE ("title"), CONSTRAINT "UQ_a3df7bbbb20beed2f02e9a33a0b" UNIQUE ("slug"), CONSTRAINT "PK_3f38689f82ca58a9ed44bc560ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."scrape_jobs_targettype_enum" AS ENUM('navigation', 'category', 'product', 'product_detail')`);
        await queryRunner.query(`CREATE TYPE "public"."scrape_jobs_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "scrape_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "targetUrl" character varying NOT NULL, "targetType" "public"."scrape_jobs_targettype_enum" NOT NULL, "status" "public"."scrape_jobs_status_enum" NOT NULL DEFAULT 'pending', "startedAt" TIMESTAMP, "finishedAt" TIMESTAMP, "errorLog" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_715dc4010fbafb63b7b8893a98d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7858b1ede0579e38a552c9687b" ON "scrape_jobs" ("targetUrl") `);
        await queryRunner.query(`CREATE INDEX "IDX_277e1a580468b2453b8af1c467" ON "scrape_jobs" ("status") `);
        await queryRunner.query(`CREATE TABLE "view_histories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying, "sessionId" character varying NOT NULL, "pathJson" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f9f2dee201ab665c4bf7e31b7fa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f3d2ef93a6cdfe46854350f781" ON "view_histories" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_679a3664b4d3d56884a6c3b641" ON "view_histories" ("createdAt") `);
        await queryRunner.query(`ALTER TABLE "product_details" ADD CONSTRAINT "FK_64b6c3e629c8bc63c9c02e16b8c" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_a6b3c434392f5d10ec171043666" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_92314f76af6f8a0c165af1731c3" FOREIGN KEY ("navigationId") REFERENCES "navigations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_92314f76af6f8a0c165af1731c3"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_a6b3c434392f5d10ec171043666"`);
        await queryRunner.query(`ALTER TABLE "product_details" DROP CONSTRAINT "FK_64b6c3e629c8bc63c9c02e16b8c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_679a3664b4d3d56884a6c3b641"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3d2ef93a6cdfe46854350f781"`);
        await queryRunner.query(`DROP TABLE "view_histories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_277e1a580468b2453b8af1c467"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7858b1ede0579e38a552c9687b"`);
        await queryRunner.query(`DROP TABLE "scrape_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."scrape_jobs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."scrape_jobs_targettype_enum"`);
        await queryRunner.query(`DROP TABLE "navigations"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_222b45eba8829276355c61a55d"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "product_details"`);
    }

}
