"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAlerts = evaluateAlerts;
const connection_1 = require("../db/connection");
const notification_1 = require("./notification");
/**
 * Check if a newly scraped price triggers an alert for a given product
 */
async function evaluateAlerts(productId, newPriceEur) {
    // 1. Check if there is already an active alert for this product
    const activeAlert = connection_1.db.prepare(`
    SELECT id FROM alerts 
    WHERE product_id = ? AND status = 'active'
  `).get(productId);
    if (activeAlert) {
        console.log(`Alert check: Product ID ${productId} already has an active alert. Skipping evaluation to avoid spam.`);
        return { triggered: false, reason: 'Already has active alert' };
    }
    // 2. Fetch the product thresholds
    const product = connection_1.db.prepare(`
    SELECT name, url, alert_pct, alert_abs FROM products WHERE id = ?
  `).get(productId);
    if (!product) {
        return { triggered: false, reason: 'Product not found' };
    }
    // 3. Fetch the previous price from history (the most recent one before inserting the new one)
    const lastPriceRecord = connection_1.db.prepare(`
    SELECT price_eur FROM price_history 
    WHERE product_id = ? 
    ORDER BY scraped_at DESC LIMIT 1
  `).get(productId);
    if (!lastPriceRecord) {
        // This is the first scrape, no previous history to compare against
        console.log(`Alert check: First price record for product ${product.name}. Saving initial price as baseline.`);
        return { triggered: false, reason: 'No price history' };
    }
    const prevPriceEur = lastPriceRecord.price_eur;
    // If price increased or remained the same, no alert
    if (newPriceEur >= prevPriceEur) {
        return { triggered: false, reason: 'Price did not decrease' };
    }
    const dropAmount = prevPriceEur - newPriceEur;
    const dropPercent = dropAmount / prevPriceEur;
    let triggerAlert = false;
    let triggerReason = '';
    // Check absolute drop threshold in Euros
    if (product.alert_abs !== null && dropAmount >= product.alert_abs) {
        triggerAlert = true;
        triggerReason = `Price dropped by €${dropAmount.toFixed(2)} (Threshold: €${product.alert_abs.toFixed(2)})`;
    }
    // Check percentage drop threshold
    if (product.alert_pct !== null && dropPercent >= product.alert_pct) {
        triggerAlert = true;
        triggerReason = `Price dropped by ${(dropPercent * 100).toFixed(0)}% (Threshold: ${(product.alert_pct * 100).toFixed(0)}%)`;
    }
    if (triggerAlert) {
        console.log(`🚨 ALERT TRIGGERED for "${product.name}": ${triggerReason}`);
        // Save the triggered alert to the database (status = 'active')
        connection_1.db.prepare(`
      INSERT INTO alerts (product_id, price_triggered_eur, status)
      VALUES (?, ?, 'active')
    `).run(productId, newPriceEur);
        // Dispatch the WhatsApp / simulated notification
        await notification_1.NotificationService.sendWhatsAppAlert({
            productName: product.name,
            url: product.url,
            oldPriceEur: prevPriceEur,
            newPriceEur,
            dropPercent,
            dropAmount
        });
        return { triggered: true, reason: triggerReason };
    }
    return { triggered: false, reason: 'Price drop did not meet threshold' };
}
