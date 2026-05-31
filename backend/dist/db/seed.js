"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const connection_1 = require("./connection");
const init_1 = require("./init");
function seedDatabase() {
    console.log('Seeding SQLite database with dummy data...');
    // Ensure tables are created first
    (0, init_1.initializeDatabase)();
    // Clear existing data
    connection_1.db.exec('DELETE FROM alerts');
    connection_1.db.exec('DELETE FROM price_history');
    connection_1.db.exec('DELETE FROM products');
    console.log('✔ Existing data cleared.');
    // Insert products
    const insertProduct = connection_1.db.prepare(`
    INSERT INTO products (name, url, custom_selector, alert_pct, alert_abs, last_scraped_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    const p1 = insertProduct.run('Sony WH-1000XM4 Headphones', 'https://example.com/sony-headphones', '.price-container', 0.15, 30.00, '2026-05-31T20:00:00Z');
    const p2 = insertProduct.run('Mechanical Keyboard GMMK Pro', 'https://example.com/gmmk-keyboard', '#product-price', 0.10, 20.00, '2026-05-31T20:00:00Z');
    const p3 = insertProduct.run('Nintendo Switch OLED', 'https://example.com/nintendo-switch', null, 0.08, null, '2026-05-31T20:00:00Z');
    console.log('✔ Seeded 3 dummy products.');
    // Insert price history (going back 5 days to simulate price drops)
    const insertPrice = connection_1.db.prepare(`
    INSERT INTO price_history (product_id, price_eur, original_price, original_currency, scraped_at)
    VALUES (?, ?, ?, ?, ?)
  `);
    const now = new Date();
    const getPastDateStr = (daysAgo, hour) => {
        const d = new Date(now);
        d.setDate(now.getDate() - daysAgo);
        d.setHours(hour, 0, 0, 0);
        return d.toISOString();
    };
    // Sony headphones: original €299, drops to €269 (10% drop), then €249 (16.7% drop -> triggers alert!)
    insertPrice.run(p1.lastInsertRowid, 299.00, 299.00, 'EUR', getPastDateStr(5, 10));
    insertPrice.run(p1.lastInsertRowid, 299.00, 299.00, 'EUR', getPastDateStr(4, 10));
    insertPrice.run(p1.lastInsertRowid, 269.00, 269.00, 'EUR', getPastDateStr(3, 10));
    insertPrice.run(p1.lastInsertRowid, 269.00, 269.00, 'EUR', getPastDateStr(2, 10));
    insertPrice.run(p1.lastInsertRowid, 249.00, 249.00, 'EUR', getPastDateStr(1, 10));
    // GMMK Keyboard: original $199 (~€183.08), drops to $189 (~€173.88), then $159 (~€146.28)
    insertPrice.run(p2.lastInsertRowid, 183.08, 199.00, 'USD', getPastDateStr(5, 10));
    insertPrice.run(p2.lastInsertRowid, 183.08, 199.00, 'USD', getPastDateStr(4, 10));
    insertPrice.run(p2.lastInsertRowid, 173.88, 189.00, 'USD', getPastDateStr(3, 10));
    insertPrice.run(p2.lastInsertRowid, 173.88, 189.00, 'USD', getPastDateStr(2, 10));
    insertPrice.run(p2.lastInsertRowid, 146.28, 159.00, 'USD', getPastDateStr(1, 10));
    // Nintendo Switch: original €349, remains stable
    insertPrice.run(p3.lastInsertRowid, 349.00, 349.00, 'EUR', getPastDateStr(5, 10));
    insertPrice.run(p3.lastInsertRowid, 349.00, 349.00, 'EUR', getPastDateStr(4, 10));
    insertPrice.run(p3.lastInsertRowid, 349.00, 349.00, 'EUR', getPastDateStr(3, 10));
    insertPrice.run(p3.lastInsertRowid, 349.00, 349.00, 'EUR', getPastDateStr(2, 10));
    insertPrice.run(p3.lastInsertRowid, 349.00, 349.00, 'EUR', getPastDateStr(1, 10));
    console.log('✔ Seeded historical price data.');
    // Seed alert trigger records
    const insertAlert = connection_1.db.prepare(`
    INSERT INTO alerts (product_id, price_triggered_eur, status, triggered_at)
    VALUES (?, ?, ?, ?)
  `);
    // Active alert for Sony headphones (from yesterday's drop to 249)
    insertAlert.run(p1.lastInsertRowid, 249.00, 'active', getPastDateStr(1, 10));
    // Resolved/inactive alert for Keyboard
    insertAlert.run(p2.lastInsertRowid, 146.28, 'inactive', getPastDateStr(1, 10));
    console.log('✔ Seeded triggered alerts database entries.');
    console.log('✔ Database seeding complete!');
}
if (require.main === module) {
    seedDatabase();
}
