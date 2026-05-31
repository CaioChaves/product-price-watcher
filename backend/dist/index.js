"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const connection_1 = require("./db/connection");
const init_1 = require("./db/init");
const scraper_1 = require("./services/scraper");
const scheduler_1 = require("./services/scheduler");
dotenv_1.default.config();
// Ensure DB is initialized
(0, init_1.initializeDatabase)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// --- API Endpoints ---
/**
 * GET /api/products
 * Returns all products along with their current price, previous price, and alert state.
 */
app.get('/api/products', (req, res) => {
    try {
        const products = connection_1.db.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.url, 
        p.custom_selector, 
        p.alert_pct, 
        p.alert_abs, 
        p.last_scraped_at, 
        p.created_at,
        (SELECT price_eur FROM price_history WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1) as current_price_eur,
        (SELECT price_eur FROM price_history WHERE product_id = p.id ORDER BY scraped_at DESC LIMIT 1 OFFSET 1) as previous_price_eur,
        (SELECT status FROM alerts WHERE product_id = p.id AND status = 'active' LIMIT 1) as active_alert_status
      FROM products p
      ORDER BY p.created_at DESC
    `).all();
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/products
 * Registers a new product URL, performs initial scrape, and saves to DB.
 */
app.post('/api/products', async (req, res) => {
    const { url, custom_selector, alert_pct, alert_abs } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        // Check if product is already tracked
        const existing = connection_1.db.prepare('SELECT id FROM products WHERE url = ?').get(url);
        if (existing) {
            return res.status(400).json({ error: 'This product URL is already being tracked' });
        }
        // Perform initial scrape to fetch details
        const scraped = await (0, scraper_1.scrapeProductPrice)(url, custom_selector);
        // Save product to database
        const insertProduct = connection_1.db.prepare(`
      INSERT INTO products (name, url, custom_selector, alert_pct, alert_abs, last_scraped_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        const lastScrapedStr = new Date().toISOString();
        const result = insertProduct.run(scraped.name, url, custom_selector || null, alert_pct !== undefined ? alert_pct : 0.10, // Default to 10%
        alert_abs !== undefined ? alert_abs : null, lastScrapedStr);
        const productId = result.lastInsertRowid;
        // Save initial price into history
        connection_1.db.prepare(`
      INSERT INTO price_history (product_id, price_eur, original_price, original_currency)
      VALUES (?, ?, ?, ?)
    `).run(productId, scraped.priceEur, scraped.originalPrice, scraped.originalCurrency);
        // Return the newly created product details
        res.status(201).json({
            id: productId,
            name: scraped.name,
            url,
            custom_selector: custom_selector || null,
            alert_pct: alert_pct !== undefined ? alert_pct : 0.10,
            alert_abs: alert_abs !== undefined ? alert_abs : null,
            current_price_eur: scraped.priceEur,
            previous_price_eur: null,
            active_alert_status: null,
            last_scraped_at: lastScrapedStr
        });
    }
    catch (error) {
        res.status(500).json({ error: `Initial scraping failed: ${error.message}` });
    }
});
/**
 * DELETE /api/products/:id
 * Deletes a tracked product and cascades delete to history and alerts.
 */
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    try {
        const result = connection_1.db.prepare('DELETE FROM products WHERE id = ?').run(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * PUT /api/products/:id/alert
 * Configures the discount alerting thresholds for a product.
 */
app.put('/api/products/:id/alert', (req, res) => {
    const { id } = req.params;
    const { alert_pct, alert_abs } = req.body;
    try {
        const result = connection_1.db.prepare(`
      UPDATE products 
      SET alert_pct = ?, alert_abs = ? 
      WHERE id = ?
    `).run(alert_pct !== undefined ? alert_pct : null, alert_abs !== undefined ? alert_abs : null, id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, alert_pct, alert_abs });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/products/scrape
 * Manually triggers a scrape on all tracked products.
 */
app.post('/api/products/scrape', async (req, res) => {
    try {
        const stats = await (0, scheduler_1.scrapeAllProducts)();
        res.json({ success: true, ...stats });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/products/:id/scrape
 * Manually triggers a scrape on a single product.
 */
app.post('/api/products/:id/scrape', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await (0, scheduler_1.scrapeSingleProduct)(Number(id));
        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }
        res.json({ success: true, priceEur: result.priceEur });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/products/:id/history
 * Returns the historical pricing points for charting.
 */
app.get('/api/products/:id/history', (req, res) => {
    const { id } = req.params;
    try {
        const history = connection_1.db.prepare(`
      SELECT price_eur, original_price, original_currency, scraped_at 
      FROM price_history 
      WHERE product_id = ? 
      ORDER BY scraped_at ASC
    `).all(id);
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/alerts
 * Retrieves all past and present triggered alerts.
 */
app.get('/api/alerts', (req, res) => {
    try {
        const alerts = connection_1.db.prepare(`
      SELECT 
        a.id,
        a.product_id,
        a.price_triggered_eur,
        a.status,
        a.triggered_at,
        p.name as product_name,
        p.url as product_url
      FROM alerts a
      JOIN products p ON a.product_id = p.id
      ORDER BY a.triggered_at DESC
    `).all();
        res.json(alerts);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/alerts/:id/toggle
 * Toggles a recent alert's status between 'active' and 'inactive'.
 */
app.post('/api/alerts/:id/toggle', (req, res) => {
    const { id } = req.params;
    try {
        const alert = connection_1.db.prepare('SELECT status FROM alerts WHERE id = ?').get(id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        const newStatus = alert.status === 'active' ? 'inactive' : 'active';
        connection_1.db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run(newStatus, id);
        res.json({ id: Number(id), status: newStatus });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Boot express app and background scheduler ---
app.listen(PORT, () => {
    console.log(`🚀 Backend server successfully booted and listening on port ${PORT}`);
    // Start the background scraping jobs
    (0, scheduler_1.startScheduler)();
});
