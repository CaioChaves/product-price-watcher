"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeSingleProduct = scrapeSingleProduct;
exports.scrapeAllProducts = scrapeAllProducts;
exports.startScheduler = startScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const connection_1 = require("../db/connection");
const scraper_1 = require("./scraper");
const alerts_1 = require("./alerts");
/**
 * Perform price scraping and alert checking for a single product
 */
async function scrapeSingleProduct(productId) {
    try {
        const product = connection_1.db.prepare('SELECT url, custom_selector FROM products WHERE id = ?').get(productId);
        if (!product) {
            return { success: false, error: 'Product not found' };
        }
        // 1. Scrape the product price
        const scraped = await (0, scraper_1.scrapeProductPrice)(product.url, product.custom_selector);
        // 2. Evaluate alert thresholds BEFORE inserting the new price into history
        // (since evaluateAlerts compares the new price with the most recent record currently in the DB)
        await (0, alerts_1.evaluateAlerts)(productId, scraped.priceEur);
        // 3. Save the new price into history
        connection_1.db.prepare(`
      INSERT INTO price_history (product_id, price_eur, original_price, original_currency)
      VALUES (?, ?, ?, ?)
    `).run(productId, scraped.priceEur, scraped.originalPrice, scraped.originalCurrency);
        // 4. Update the last_scraped_at and name on the product
        connection_1.db.prepare(`
      UPDATE products 
      SET name = ?, last_scraped_at = ? 
      WHERE id = ?
    `).run(scraped.name, new Date().toISOString(), productId);
        return { success: true, priceEur: scraped.priceEur };
    }
    catch (error) {
        console.error(`Error scraping product ${productId}:`, error.message);
        return { success: false, error: error.message };
    }
}
/**
 * Perform price scraping and alert checking for all active products
 */
async function scrapeAllProducts() {
    console.log('--- Starting Scheduled Price Scraper Run ---');
    const products = connection_1.db.prepare('SELECT id, name FROM products').all();
    let succeeded = 0;
    let failed = 0;
    for (const product of products) {
        console.log(`Processing product: ${product.name} (ID: ${product.id})...`);
        const result = await scrapeSingleProduct(product.id);
        if (result.success) {
            succeeded++;
        }
        else {
            failed++;
        }
    }
    console.log(`--- Scraper Run Complete: ${succeeded} Succeeded, ${failed} Failed out of ${products.length} total. ---`);
    return { total: products.length, succeeded, failed };
}
/**
 * Initialize background scheduler (cron jobs)
 */
function startScheduler() {
    console.log('Initializing background price scraper scheduler...');
    // Run every 6 hours (4 times a day)
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        try {
            await scrapeAllProducts();
        }
        catch (e) {
            console.error('Fatal error during scheduled scraper run:', e.message);
        }
    });
    console.log('✔ Background scheduler started (runs every 6 hours).');
}
