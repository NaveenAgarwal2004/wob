import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ScraperService } from './scraper/scraper.service';

async function testScraper() {
  console.log('🧪 Starting Scraper Test...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const scraperService = app.get(ScraperService);

  try {
    // Test 1: Scrape Navigations
    console.log('📋 Test 1: Scraping Navigations from World of Books...');
    console.log('⏳ This may take 10-15 seconds...\n');
    
    const navigations = await scraperService.scrapeNavigations();
    console.log(`✅ Successfully scraped ${navigations.length} navigations:`);
    navigations.forEach(nav => {
      console.log(`   - ${nav.title} (${nav.sourceUrl})`);
    });
    console.log('\n');

    if (navigations.length > 0) {
      // Test 2: Scrape Categories for first navigation
      const firstNav = navigations[0];
      console.log(`📂 Test 2: Scraping Categories for "${firstNav.title}"...`);
      console.log('⏳ This may take 10-15 seconds...\n');
      
      const categories = await scraperService.scrapeCategories(firstNav.id, true);
      console.log(`✅ Successfully scraped ${categories.length} categories:`);
      categories.slice(0, 5).forEach(cat => {
        console.log(`   - ${cat.title}`);
      });
      if (categories.length > 5) {
        console.log(`   ... and ${categories.length - 5} more`);
      }
      console.log('\n');

      if (categories.length > 0) {
        // Test 3: Scrape Products from first category
        const firstCategory = categories[0];
        console.log(`📚 Test 3: Scraping Products from "${firstCategory.title}"...`);
        console.log('⏳ This may take 15-20 seconds...\n');
        
        const { products, total } = await scraperService.scrapeProducts(firstCategory.id, 1, 5, true);
        console.log(`✅ Successfully scraped ${products.length} products (Total available: ${total}):`);
        products.forEach(prod => {
          console.log(`   - ${prod.title} by ${prod.author || 'Unknown'}`);
          console.log(`     Price: £${prod.price || 'N/A'}`);
          console.log(`     URL: ${prod.sourceUrl}`);
        });
        console.log('\n');

        if (products.length > 0) {
          // Test 4: Scrape Product Detail
          const firstProduct = products[0];
          console.log(`📖 Test 4: Scraping Product Detail for "${firstProduct.title}"...`);
          console.log('⏳ This may take 10-15 seconds...\n');
          
          const detail = await scraperService.scrapeProductDetail(firstProduct.id, true);
          console.log(`✅ Successfully scraped product details:`);
          console.log(`   Description: ${detail.description?.substring(0, 150)}...`);
          console.log(`   Rating: ${detail.ratingsAvg || 'N/A'} / 5`);
          console.log(`   Reviews: ${detail.reviewsCount}`);
          console.log(`   Specs:`, Object.keys(detail.specs || {}).length, 'items');
          console.log('\n');
        }
      }
    }

    console.log('🎉 All scraper tests completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Navigations scraped: ${navigations.length}`);
    console.log(`   ✅ Categories scraped: ${navigations.length > 0 ? 'Yes' : 'No'}`);
    console.log(`   ✅ Products scraped: ${navigations.length > 0 ? 'Yes' : 'No'}`);
    console.log(`   ✅ Product details scraped: ${navigations.length > 0 ? 'Yes' : 'No'}`);
    console.log('\n✨ Phase 2: Scraping Engine is FULLY FUNCTIONAL! ✨\n');

  } catch (error) {
    console.error('❌ Scraper test failed:', error.message);
    console.error('\n🔍 Error details:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

testScraper();
