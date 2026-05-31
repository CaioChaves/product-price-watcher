import cron from 'node-cron';
import { db } from '../db/connection';
import { scrapeProductPrice } from './scraper';
import { evaluateAlerts } from './alerts';

/**
 * Perform price scraping and alert checking for a single product
 */
export async function scrapeSingleProduct(productId: number): Promise<{ success: boolean; priceEur?: number; error?: string }> {
  try {
    const product = db.prepare('SELECT url, custom_selector FROM products WHERE id = ?').get(productId) as { url: string; custom_selector: string | null } | undefined;
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // 1. Scrape the product price
    const scraped = await scrapeProductPrice(product.url, product.custom_selector);

    // 2. Evaluate alert thresholds BEFORE inserting the new price into history
    // (since evaluateAlerts compares the new price with the most recent record currently in the DB)
    await evaluateAlerts(productId, scraped.priceEur);

    // 3. Save the new price into history
    db.prepare(`
      INSERT INTO price_history (product_id, price_eur, original_price, original_currency)
      VALUES (?, ?, ?, ?)
    `).run(productId, scraped.priceEur, scraped.originalPrice, scraped.originalCurrency);

    // 4. Update the last_scraped_at and name on the product
    db.prepare(`
      UPDATE products 
      SET name = ?, last_scraped_at = ? 
      WHERE id = ?
    `).run(scraped.name, new Date().toISOString(), productId);

    return { success: true, priceEur: scraped.priceEur };
  } catch (error: any) {
    console.error(`Error scraping product ${productId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Perform price scraping and alert checking for all active products
 */
export async function scrapeAllProducts(): Promise<{ total: number; succeeded: number; failed: number }> {
  console.log('--- Starting Scheduled Price Scraper Run ---');
  
  const products = db.prepare('SELECT id, name FROM products').all() as { id: number; name: string }[];
  let succeeded = 0;
  let failed = 0;

  for (const product of products) {
    console.log(`Processing product: ${product.name} (ID: ${product.id})...`);
    const result = await scrapeSingleProduct(product.id);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  console.log(`--- Scraper Run Complete: ${succeeded} Succeeded, ${failed} Failed out of ${products.length} total. ---`);
  return { total: products.length, succeeded, failed };
}

/**
 * Initialize background scheduler (cron jobs)
 */
export function startScheduler() {
  console.log('Initializing background price scraper scheduler...');

  // Run every 6 hours (4 times a day)
  cron.schedule('0 */6 * * *', async () => {
    try {
      await scrapeAllProducts();
    } catch (e: any) {
      console.error('Fatal error during scheduled scraper run:', e.message);
    }
  });

  console.log('✔ Background scheduler started (runs every 6 hours).');
}
