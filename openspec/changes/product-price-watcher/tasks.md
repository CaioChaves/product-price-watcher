## 1. Project Setup & Structure

- [x] 1.1 Create the unified project layout with `backend/` and `frontend/` folders
- [x] 1.2 Initialize backend `package.json` and configure `tsconfig.json` for TypeScript
- [x] 1.3 Install backend dependencies (`express`, `better-sqlite3`, `axios`, `cheerio`, `node-cron`, `dotenv`, `cors`, `@types/express`, `@types/better-sqlite3`, `@types/node-cron`, `@types/cors`)
- [x] 1.4 Initialize frontend with React, Vite, and TypeScript inside the `frontend/` directory
- [x] 1.5 Install frontend dependencies (`recharts`, `lucide-react`) and configure baseline development script

## 2. Database Schema & Core Models

- [x] 2.1 Write database initialization script in the backend to create SQLite database and tables (`products`, `price_history` storing converted EUR prices, and `alerts` tracking active/inactive states)
- [x] 2.2 Create database connection helper module using `better-sqlite3`
- [x] 2.3 Write database seed script to insert standard dummy products and initial price/alert history for easy development

## 3. Scraper & Price Extractor

- [x] 3.1 Implement the HTML crawler using `axios` with standard browser user-agents
- [x] 3.2 Implement JSON-LD product schema price extractor (extracting `offers.price` and currency)
- [x] 3.3 Implement standard OpenGraph and Meta tags fallback price parser
- [x] 3.4 Implement user-specified CSS selector fallback parser
- [x] 3.5 Create a unified extractor function that applies all scrapers in sequence with error logging
- [x] 3.6 Implement the currency converter utility (incorporating conversion rates to convert USD, GBP, etc., into Euros upon database entry)

## 4. Alerting & WhatsApp Service

- [x] 4.1 Write pricing alert evaluation utility that calculates percentage and absolute Euro price drops, ensuring an alert event is ONLY triggered if the alert is currently inactive
- [x] 4.2 Create the notification manager that abstractly formats WhatsApp alert messages
- [x] 4.3 Implement `TwilioProvider` to send real WhatsApp notifications via Twilio API
- [x] 4.4 Implement `ConsoleSimulatedProvider` to log WhatsApp notifications to console when Twilio is unconfigured

## 5. Backend API Endpoints

- [x] 5.1 Create Express server and setup standard middleware (CORS, JSON parsing)
- [x] 5.2 Implement API endpoint to register a new product URL (validates URL, crawls it to fetch initial details/price, and persists in DB)
- [x] 5.3 Implement API endpoint to retrieve all tracked products with their last scraped prices
- [x] 5.4 Implement API endpoint to delete a tracked product and its history
- [x] 5.5 Implement API endpoint to update discount alerting thresholds for a product
- [x] 5.6 Implement API endpoint to trigger a manual scrape on all products or a single product
- [x] 5.7 Implement API endpoint to retrieve price history for a given product to populate frontend charts
- [x] 5.8 Implement API endpoint to retrieve past triggered alerts from the database
- [x] 5.9 Implement API endpoint to toggle a recent alert's status between active and inactive

## 6. Background Scheduler

- [x] 6.1 Setup periodic scraping runner using `node-cron` scheduled to run a few times per day
- [x] 6.2 Connect background worker to the extractor, alert evaluator, and notification dispatch pipelines

## 7. Frontend Application

- [x] 7.1 Setup clean, modern global CSS theme (dark mode, HSL gradients, custom scrollbars, premium design aesthetics)
- [x] 7.2 Implement Dashboard layout with sidebar navigation and main grid
- [x] 7.3 Create "Add Product" input widget supporting URL input and optional custom CSS selector input
- [x] 7.4 Create "Tracked Products" grid displaying product cards, current prices, price changes, and delete actions
- [x] 7.5 Create interactive "Product Details" Modal showing price history line charts using Recharts
- [x] 7.6 Create "Alert Settings" widget inside the details modal to configure percentage % and absolute € thresholds
- [x] 7.7 Create "Alerts Dashboard" view showing a list of past alerts sent with dates and triggering details
- [x] 7.8 Add interactive toggle switch inside the Alerts Dashboard to toggle recent alerts from active to inactive
- [x] 7.9 Add subtle micro-animations for hover, click, and loading states for a premium dynamic feel

## 8. Verification & Walkthrough

- [x] 8.1 Write backend unit tests to verify price parsers against mockup HTML payloads
- [x] 8.2 Verify end-to-end flow: add a product, trigger a manual scrape, set an alert threshold, simulate price drops, and check WhatsApp/Console outputs
- [x] 8.3 Document instructions in README.md on how to run both frontend and backend dev servers
