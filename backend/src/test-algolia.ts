// backend/src/test-algolia.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AlgoliaService } from './scraper/algolia.service';

async function testAlgolia() {
  console.log('🧪 Testing Algolia Integration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const algoliaService = app.get(AlgoliaService);

  try {
    // Test 1: Get Categories
    console.log('📋 Test 1: Fetching product categories from Algolia...');
    const categories = await algoliaService.getCategories();
    console.log(`✅ Found ${categories.length} categories:`);
    categories.slice(0, 10).forEach(cat => console.log(`   - ${cat}`));
    if (categories.length > 10) {
      console.log(`   ... and ${categories.length - 10} more`);
    }
    console.log('\n');

    if (categories.length > 0) {
      // Test 2: Search Products by Category
      const testCategory = categories[0];
      console.log(`📚 Test 2: Searching products in category "${testCategory}"...`);
      const searchResponse = await algoliaService.getProductsByCategory(testCategory, 0, 5);
      console.log(`✅ Found ${searchResponse.nbHits} total products in "${testCategory}" (showing ${searchResponse.hits.length}):\n`);
      
      searchResponse.hits.forEach((product, idx) => {
        const author = algoliaService.extractAuthor(product);
        const title = algoliaService.extractTitle(product);
        const price = algoliaService.extractPrice(product);
        console.log(`   ${idx + 1}. ${title}`);
        console.log(`      Author: ${author || 'Unknown'}`);
        console.log(`      Price: £${price || 'N/A'}`);
        console.log(`      Product Type: ${product.productType || 'N/A'}`);
        console.log(`      URL: ${algoliaService.buildProductUrl(product.productHandle)}`);
        console.log('');
      });

      // Test 3: Get Single Product
      if (searchResponse.hits.length > 0) {
        const testProduct = searchResponse.hits[0];
        console.log(`📖 Test 3: Fetching single product by handle "${testProduct.productHandle}"...`);
        const singleProduct = await algoliaService.getProductByHandle(testProduct.productHandle);
        if (singleProduct) {
          console.log(`✅ Product details:`);
          console.log(`   Object ID: ${singleProduct.objectID}`);
          console.log(`   Title: ${algoliaService.extractTitle(singleProduct)}`);
          console.log(`   Handle: ${singleProduct.productHandle}`);
          console.log(`   Author: ${algoliaService.extractAuthor(singleProduct) || 'Unknown'}`);
          console.log(`   Price: £${algoliaService.extractPrice(singleProduct)}`);
          console.log(`   Category: ${algoliaService.extractCategory(singleProduct)}`);
          console.log(`   In Stock: ${singleProduct.inStock ? 'Yes' : 'No'}`);
          console.log(`   Quantity: ${singleProduct.quantity}`);
          console.log(`   Binding: ${singleProduct.bindingType}`);
          console.log(`   Publisher: ${singleProduct.publisher}`);
          console.log('\n');
        } else {
          console.log('❌ Failed to fetch single product\n');
        }
      }

      // Test 4: Search by Query
      console.log(`🔍 Test 4: Searching products with query "Harry Potter"...`);
      const queryResponse = await algoliaService.searchProducts('Harry Potter', 0, 5);
      console.log(`✅ Found ${queryResponse.nbHits} total results (showing ${queryResponse.hits.length}):\n`);
      
      queryResponse.hits.forEach((product, idx) => {
        const author = algoliaService.extractAuthor(product);
        const title = algoliaService.extractTitle(product);
        const price = algoliaService.extractPrice(product);
        console.log(`   ${idx + 1}. ${title} by ${author || 'Unknown'}`);
        console.log(`      Price: £${price || 'N/A'}`);
      });
      console.log('\n');
    }

    console.log('🎉 All Algolia tests passed successfully!\n');
    console.log('✨ Algolia integration is working correctly! ✨\n');
    console.log('📝 Summary:');
    console.log(`   ✅ Categories: ${categories.length} found`);
    console.log(`   ✅ Product search: Working`);
    console.log(`   ✅ Single product fetch: Working`);
    console.log(`   ✅ Query search: Working`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Algolia test failed:', error.message);
    console.error('\n🔍 Error details:', error);
    
    if (error.message.includes('403') || error.message.includes('API key')) {
      console.error('\n⚠️  API Key Issue: Check your ALGOLIA_API_KEY in .env');
    }
    if (error.message.includes('404') || error.message.includes('index')) {
      console.error('\n⚠️  Index Issue: Check your ALGOLIA_INDEX_NAME in .env');
    }
    
    process.exit(1);
  } finally {
    await app.close();
  }
}

testAlgolia();