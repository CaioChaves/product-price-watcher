# Product Price Watcher

A full-stack web application for monitoring product prices over time, with automatic WhatsApp alerts when prices drop.

## Features

- **Automatic Price Scraping** — Crawls product pages multiple times a day using a multi-tiered extraction pipeline (JSON-LD → OpenGraph meta tags → Custom CSS selector).
- **Currency Normalization** — All prices stored in Euros (EUR); automatic conversion from USD, GBP, etc.
- **Beautiful Price History Dashboard** — Interactive line charts showing price evolution over time.
- **Smart Discount Alerts** — Set thresholds in % drop or € drop. Each alert fires **once** (no spam) and can be acknowledged via the Alerts Dashboard.
- **WhatsApp Notifications** — Sends rich-formatted WhatsApp messages via Twilio API. Falls back to console logging if Twilio isn't configured.

---

## Project Structure

```
product-price-watcher/
├── backend/               # Node.js/TypeScript Express API + scheduler
│   ├── src/
│   │   ├── db/            # SQLite connection, init, and seed scripts
│   │   └── services/      # Scraper, alerts, notification, and scheduler
│   ├── data/              # SQLite database file (auto-created)
│   └── package.json
├── frontend/              # React + Vite + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx        # Main application UI
│   │   ├── App.css        # Layout helpers
│   │   └── index.css      # Global premium design system
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18 (or via Homebrew/nvm)
- **npm** >= 9

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Seed the database with dummy products (optional, for development)
npm run seed-db

# Start the backend dev server (auto-reloads on changes)
npm run dev
```

The backend will run at **http://localhost:3001**.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

The frontend will run at **http://localhost:5173**.

---

## Configuration (WhatsApp Alerts)

Create a `.env` file in the `backend/` directory:

```env
PORT=3001

# Optional: Twilio WhatsApp Config
# If not set, alerts are printed to the console (simulated mode)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_WHATSAPP=whatsapp:+14155238886
TWILIO_TO_WHATSAPP=whatsapp:+33XXXXXXXXX
```

> If Twilio env vars are not set, a beautifully formatted notification will be printed to the terminal console instead.

### Setting up Twilio WhatsApp Sandbox (Free)

1. Create a free account at [twilio.com](https://twilio.com)
2. Go to **Messaging → Try it out → Send a WhatsApp message**
3. Follow the sandbox activation instructions (send a join code via WhatsApp)
4. Copy your `Account SID`, `Auth Token`, and sandbox number into `.env`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List all tracked products with current prices |
| `POST` | `/api/products` | Register a new product URL |
| `DELETE` | `/api/products/:id` | Remove a product and all its history |
| `PUT` | `/api/products/:id/alert` | Update alert thresholds |
| `POST` | `/api/products/scrape` | Trigger manual scrape of all products |
| `POST` | `/api/products/:id/scrape` | Trigger manual scrape of one product |
| `GET` | `/api/products/:id/history` | Get price history for chart |
| `GET` | `/api/alerts` | List all triggered alerts |
| `POST` | `/api/alerts/:id/toggle` | Toggle alert status (active ↔ inactive) |

---

## Running Backend Tests

```bash
cd backend
npm run test
```

9 unit tests covering the price parsing and currency conversion utilities.
