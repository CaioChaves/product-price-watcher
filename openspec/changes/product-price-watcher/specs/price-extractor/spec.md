## ADDED Requirements

### Requirement: Periodic Price Scraping
The system SHALL run a periodic job (e.g., multiple times a day) to scrape prices for all active tracked products.

#### Scenario: Periodic scraper execution
- **WHEN** the cron schedule triggers the background price scraping job
- **THEN** the system SHALL iterate through all active products, fetch their HTML pages, and parse the price.

### Requirement: Robust Price Extraction from HTML
The system SHALL parse the HTML of a product page and extract the price string and currency, converting them to a numerical value.

#### Scenario: Successful price parsing in Euros
- **WHEN** the parser scrapes a product page containing a standard Euro price format (e.g., "45,99 €" or "45.99€")
- **THEN** the system SHALL correctly parse the price as a floating-point number (e.g., 45.99) and store it in Euros.

#### Scenario: Price parsing with currency conversion
- **WHEN** the parser scrapes a product page containing a price in a non-Euro currency (e.g., "$45.99" or "£39.99")
- **THEN** the system SHALL parse the price, convert it to Euros using a currency conversion rate, and store the resulting value in Euros.

#### Scenario: Fails to parse price
- **WHEN** the parser scrapes a product page but cannot find a valid price pattern
- **THEN** the system SHALL log an error and mark the scraping attempt for that product as failed, without overwriting the last known good price with null.
