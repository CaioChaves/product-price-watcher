## Why

Users need an automated, unified way to track product prices across multiple websites, visualize price history over time, and receive instant notifications when prices drop below specified thresholds (either as a percentage or fixed amount), allowing them to make optimized purchasing decisions without manual polling.

## What Changes

This change introduces a complete web application and automated service:
- A local database (SQLite) to store products, price history, and alerting thresholds.
- A periodic background worker that scrapes product pages to extract prices multiple times a day.
- A beautiful frontend dashboard to add URLs, view tracked products, display historical price charts, and configure alerting thresholds.
- An alerting system that triggers WhatsApp notifications when price drop thresholds are met.

## Capabilities

### New Capabilities
- `product-manager`: Capability to register, list, and manage product URLs that the user wants to monitor.
- `price-extractor`: Capability to periodically crawl product URLs and extract their current price in a robust, structured way.
- `price-dashboard`: Frontend interface to visualize price history charts and general system status.
- `alerts-dashboard`: Frontend interface allowing the user to view past alerts sent and toggle a recent alert from active to inactive.
- `alerting-service`: Service to define threshold alerts (either in % drop or € drop) and send WhatsApp notifications when a price drop occurs.

### Modified Capabilities

## Impact

This is a greenfield project, so there are no legacy systems or existing code to impact. The project will introduce:
- A new Node.js/TypeScript backend with Express.
- A lightweight SQLite database.
- A React/Vite-based modern frontend.
- An integration with a WhatsApp API service (e.g., Twilio API or similar).
- A background scheduler (e.g., node-cron) to run the price extraction.
