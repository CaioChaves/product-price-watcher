import { db } from './connection';

export function initializeDatabase() {
  console.log('Initializing SQLite database schema...');

  // Create products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      custom_selector TEXT,
      alert_pct REAL,
      alert_abs REAL,
      last_scraped_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✔ Products table initialized.');

  // Create price_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      price_eur REAL NOT NULL,
      original_price REAL NOT NULL,
      original_currency TEXT NOT NULL,
      scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
  `);
  console.log('✔ Price history table initialized.');

  // Create alerts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      price_triggered_eur REAL NOT NULL,
      status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
      triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
  `);
  console.log('✔ Alerts table initialized.');

  console.log('✔ Database schema initialization complete!');
}

// Run the script directly if called from command line
if (require.main === module) {
  initializeDatabase();
}
