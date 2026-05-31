## Context

The user wants a localized, lightweight web application capable of monitoring product prices over time from a provided list of URLs. The system must scrape prices periodically, store price changes, provide a frontend dashboard with historical charts, allow setting % or € discount alerts, and send those alerts via WhatsApp when triggered.

## Goals / Non-Goals

**Goals:**
- Provide a clean, modern single-page frontend (React + Vite + Vanilla CSS) to manage product URLs, view interactive price charts (e.g. using Chart.js or Recharts), and set alerts.
- Build a lightweight Node.js/TypeScript backend with an SQLite database to store products, prices, and alerts.
- Implement a periodic background scraper that runs a few times a day to crawl product pages and extract pricing data.
- Devise a highly robust and generic price extraction strategy (JSON-LD parser + OpenGraph fallback + custom CSS selectors).
- Send WhatsApp notifications using the Twilio WhatsApp API when a price drop meets a user-configured threshold (% drop or € drop).
- Support a simulator mode for WhatsApp alerting so the application is fully functional and testable without active Twilio API credentials.

**Non-Goals:**
- Supporting high-scale production scraping with proxy rotation or bypasses for advanced anti-bot protections (like Cloudflare Turnstile) in the initial release.
- Storing full scraped HTML payloads or screenshots to prevent excessive local storage growth.
- Multiple user accounts or authentication/authorization in this initial local-focused setup.

## Decisions

### 1. Extensible & Robust Extraction Architecture
- **Decision**: We will implement a multi-tiered fallback parser rather than domain-specific scraping rules:
  1. **JSON-LD**: Crawl the HTML and extract `application/ld+json` blocks looking for a `Product` schema with `offers.price` and `offers.priceCurrency`.
  2. **OpenGraph / Meta tags**: Parse `<meta property="og:price:amount">`, `<meta property="product:price:amount">`, or similar standard meta tags.
  3. **Custom Selector (CSS)**: Allow the user to specify an optional CSS selector on the UI to extract text from a specific element if standard metadata is missing.
  4. **Currency Converter**: Convert all scraped prices to Euros (EUR) using a simple exchange rate converter (supporting USD, GBP, etc.) so that all records in the history and triggers are normalized to EUR.
- **Rationale**: Most modern e-commerce sites include schema metadata for SEO, which is much more stable than page layouts. Converting all currencies to EUR provides a consistent baseline for tracking price changes and evaluating alerts across different global domains.

### 2. Database Choice & Schema
- **Decision**: Use **SQLite** via `better-sqlite3` as the database.
- **Schema**:
  - `products` Table:
    - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    - `name`: TEXT (fallback to domain/title if scraper fails to extract name)
    - `url`: TEXT UNIQUE
    - `custom_selector`: TEXT (optional selector provided by the user)
    - `alert_pct`: REAL (percentage drop threshold, e.g., 0.10 for 10%)
    - `alert_abs`: REAL (absolute Euro drop threshold, e.g., 5.00 for €5)
    - `last_scraped_at`: TEXT
    - `created_at`: TEXT DEFAULT CURRENT_TIMESTAMP
  - `price_history` Table:
    - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    - `product_id`: INTEGER (FOREIGN KEY)
    - `price_eur`: REAL (scraped price converted to Euros)
    - `original_price`: REAL (scraped price in original currency)
    - `original_currency`: TEXT (scraped currency code, e.g., USD, GBP, EUR)
    - `scraped_at`: TEXT DEFAULT CURRENT_TIMESTAMP
  - `alerts` Table:
    - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
    - `product_id`: INTEGER (FOREIGN KEY)
    - `price_triggered_eur`: REAL (price in Euros that triggered the alert)
    - `status`: TEXT (either 'active' or 'inactive')
    - `triggered_at`: TEXT DEFAULT CURRENT_TIMESTAMP
- **Rationale**: SQLite is zero-configuration, stores all data in a single local file, and provides powerful relational querying for price history and alerting state, making it perfect for a local application. Storing original currency details alongside the converted EUR value ensures auditability.

### 3. Frontend Technology
- **Decision**: React + Vite + Vanilla CSS.
- **Rationale**: Vite provides extremely fast feedback loops. Vanilla CSS allows us to easily craft a custom, premium dashboard (dark mode, HSL tailored gradients, smooth animations) without the bloat and setup complexity of TailwindCSS. We will use a charting library like Recharts or Chart.js for smooth and beautiful line charts.

### 4. Alerting Implementation & WhatsApp Gateway
- **Decision**: Twilio WhatsApp API integration with a simulated console-fallback mode, coupled with strict "once-only" alert state tracking.
- **Rationale**: Since WhatsApp does not allow direct free API access without verified business accounts, Twilio's WhatsApp Sandbox is the standard way to test and send free WhatsApp messages. We will define an abstract `NotificationService` with a `TwilioProvider` and a `ConsoleSimulatedProvider`.
  To avoid spamming the user, when a price drop occurs, the system writes an active record to the `alerts` table and sends **exactly one** WhatsApp message. The alert remains `active` until the user acknowledges it on the frontend `alerts-dashboard` by toggling it to `inactive` (which resets the trigger). While an alert for a product is active, no further WhatsApp notifications will be sent for that product.

## Risks / Trade-offs

- **[Risk] E-commerce Anti-Bot Protections**: Major platforms (like Amazon or major retailers) use Cloudflare, Akamai, or CAPTCHAs to block automated scraping.
  - *Mitigation*: Our crawler will send realistic browser `User-Agent` headers. If a page blocks standard requests, we will log the failure clearly in the dashboard.
- **[Risk] Brittle CSS Layouts**: Sites change their layouts often, which breaks custom CSS selectors.
  - *Mitigation*: Prioritizing standard JSON-LD and OpenGraph metadata parsing heavily reduces dependency on unstable CSS selectors.
